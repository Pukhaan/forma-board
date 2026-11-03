// How things that changed outside the app show it: the DOM side of
// useChanges.ts (the grid's ripple is gridFx.ripple.ts). It only sets an
// attribute, or starts an opacity and scale animation, on elements React
// Flow has already drawn, so nothing re-renders for it. styles/changes.css
// draws the "since you last looked" dot.

/** How long the "since you last looked" dot takes to fade once seen. changes.css matches it. */
const SEEN_OUT_MS = 1200;
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
 * Something new settles into place: in from a touch smaller and faint. On
 * its inner element, so React Flow's own position transform is left alone.
 */
export function settle(wrapper: HTMLElement) {
  const el = wrapper.firstElementChild;
  if (!el) return;
  if (reduced()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  else el.animate([{ opacity: 0, scale: "0.985" }, { opacity: 1, scale: "1" }], { duration: 420, easing: easeOut });
}

/** The corner the dot is pinned to: a stack's cover card, a wire's note, or the thing itself. */
function cornerOf(el: HTMLElement) {
  const target =
    el.querySelector<HTMLElement>(".stack-card:last-child") ??
    el.querySelector<HTMLElement>(".wire-note") ??
    el.querySelector<HTMLElement>(".card-media") ??
    el;
  const z = parseFloat(getComputedStyle(el).getPropertyValue("--z")) || 1;
  const box = el.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  return { x: (r.right - box.left) / z, y: (r.top - box.top) / z };
}

/**
 * Where a thing is, in board units, from where it is drawn: a stack by its
 * pile, so a ripple starts at the cards and not around the name.
 */
export function boardRectOf(el: HTMLElement, root: HTMLElement, [tx, ty, z]: readonly [number, number, number]) {
  const r = (el.querySelector<HTMLElement>(".stack-pile") ?? el).getBoundingClientRect();
  const o = root.getBoundingClientRect();
  return { x: (r.left - o.left - tx) / z, y: (r.top - o.top - ty) / z, w: r.width / z, h: r.height / z };
}

/** A small ink dot on its top-right corner, until it has been seen. */
export function pinSeen(el: HTMLElement) {
  window.clearTimeout(timers.get(el));
  const { x, y } = cornerOf(el);
  el.style.setProperty("--seen-x", `${x}px`);
  el.style.setProperty("--seen-y", `${y}px`);
  el.dataset.unseen = "pinned";
}

/** Seen: the dot fades away. */
export function unpinSeen(el: HTMLElement) {
  if (el.dataset.unseen !== "pinned") return;
  el.dataset.unseen = "fading";
  later(el, SEEN_OUT_MS + 100, () => {
    if (el.dataset.unseen === "fading") delete el.dataset.unseen;
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
  for (const name of ["data-id", "data-testid", "data-unseen", "tabindex", "role"]) ghost.removeAttribute(name);
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.pointerEvents = "none";
  el.parentElement.appendChild(ghost);
  const at = el.style.transform;
  const end = reduced() ? { opacity: 0, transform: at } : { opacity: 0, transform: `${at} scale(0.96)` };
  ghost.animate([{ opacity: 1, transform: at }, end], { duration: 380, easing: easeOut, fill: "forwards" }).onfinish = () =>
    ghost.remove();
}

/**
 * Watches the things marked "since you last looked" and calls `seen` for
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
