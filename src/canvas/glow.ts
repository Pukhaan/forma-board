// The light on things that changed outside the app: the DOM side of
// useChanges.ts. It only sets an attribute, or starts an animation, on
// elements React Flow has already drawn, so nothing re-renders for it.
// styles/changes.css draws the light itself.

/** How long a live glow lasts, rise and fade. changes.css matches it. */
export const LIVE_MS = 2600;
/** How long a "since you last looked" glow takes to fade once seen. */
const SEEN_OUT_MS = 1600;
/** How long a new wire takes to draw itself in. */
const DRAW_MS = 900;
/** Something new is drawn a frame or two after it arrives; this is how long to look for it. */
const FRAMES = 40;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = "cubic-bezier(0.22, 1, 0.36, 1)";

export const nodeEl = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`.react-flow__node[data-id="${CSS.escape(id)}"]`);
export const edgeEl = (root: HTMLElement, id: string) =>
  root.querySelector<SVGGElement>(`.react-flow__edge[data-id="${CSS.escape(id)}"]`);
export const labelEl = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`.wire-label[data-wire="${CSS.escape(id)}"]`);

/** Calls `then` with the element once it is drawn, looking for it each frame for a little while. */
export function whenDrawn<E extends Element>(find: () => E | null, then: (el: E) => void, tries = FRAMES) {
  const el = find();
  if (el) then(el);
  else if (tries > 0) requestAnimationFrame(() => whenDrawn(find, then, tries - 1));
}

const timers = new WeakMap<Element, number>();

function later(el: Element, ms: number, fn: () => void) {
  window.clearTimeout(timers.get(el));
  timers.set(el, window.setTimeout(fn, ms));
}

/**
 * A soft light that rises and fades. The two names take turns so a thing that
 * changes again while it glows starts its glow over.
 */
export function glowLive(el: HTMLElement) {
  const name = el.dataset.glow === "live-a" ? "live-b" : "live-a";
  el.dataset.glow = name;
  later(el, LIVE_MS + 100, () => {
    if (el.dataset.glow === name) delete el.dataset.glow;
  });
}

/** The quieter light that stays until it has been seen. */
export function glowSeen(el: HTMLElement) {
  window.clearTimeout(timers.get(el));
  el.dataset.glow = "seen";
}

/** Seen: the quiet light fades away. */
export function fadeSeen(el: HTMLElement) {
  if (el.dataset.glow !== "seen") return;
  el.dataset.glow = "seen-out";
  later(el, SEEN_OUT_MS + 100, () => {
    if (el.dataset.glow === "seen-out") delete el.dataset.glow;
  });
}

/** A new wire draws itself along its path, out of one thing into the other. */
export function drawWire(edge: SVGGElement, delay = 0) {
  for (const path of edge.querySelectorAll<SVGPathElement>("path.wire")) {
    if (reduced()) {
      path.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay, fill: "backwards" });
      continue;
    }
    const len = Math.ceil(path.getTotalLength()) + 1;
    const dash = `${len} ${len}`;
    path.animate(
      [
        { strokeDasharray: dash, strokeDashoffset: len },
        { strokeDasharray: dash, strokeDashoffset: 0 },
      ],
      { duration: DRAW_MS, delay, easing: easeOut, fill: "backwards" },
    );
  }
}

/**
 * Something taken off the board fades where it was: a copy of it, left on
 * the board for a moment after React Flow takes the real one away. Live
 * cards just go (a copy would start their component again).
 */
export function fadeOut(el: HTMLElement | null) {
  if (!el?.parentElement || el.querySelector("iframe")) return;
  const ghost = el.cloneNode(true) as HTMLElement;
  for (const name of ["data-id", "data-testid", "data-glow", "tabindex", "role"]) ghost.removeAttribute(name);
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.pointerEvents = "none";
  el.parentElement.appendChild(ghost);
  const at = el.style.transform;
  const end = reduced() ? { opacity: 0, transform: at } : { opacity: 0, transform: `${at} scale(0.96)` };
  ghost.animate([{ opacity: 1, transform: at }, end], { duration: 380, easing: easeOut, fill: "forwards" }).onfinish = () =>
    ghost.remove();
}

/**
 * Watches the things glowing "since you last looked" and calls `seen` for
 * each once it has been on screen for a while with the board at rest.
 */
export function watchSeen(seen: (el: HTMLElement) => void, resting: () => boolean, dwellMs = 2600) {
  const armed = new Map<Element, number>();
  const disarm = (el: Element) => {
    window.clearTimeout(armed.get(el));
    armed.delete(el);
  };
  const arm = (el: HTMLElement, ms: number) => {
    armed.set(
      el,
      window.setTimeout(() => {
        // Not while the window is hidden, or the board is still moving.
        if (document.hidden || !resting()) return arm(el, 700);
        armed.delete(el);
        io.unobserve(el);
        seen(el);
      }, ms),
    );
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          if (!armed.has(e.target)) arm(e.target as HTMLElement, dwellMs);
        } else disarm(e.target);
      }
    },
    { threshold: 0.5 },
  );
  return {
    watch: (el: HTMLElement) => io.observe(el),
    forget: (el: Element) => {
      disarm(el);
      io.unobserve(el);
    },
    stop: () => {
      for (const t of armed.values()) window.clearTimeout(t);
      io.disconnect();
    },
  };
}
