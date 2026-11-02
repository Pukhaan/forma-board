// Where a wire leaves one thing and arrives at another. Wires are not pinned to
// fixed ports: they always take the side facing the other end, so things can be
// moved anywhere (by hand or by the AI) and the wires stay tidy.

import type { Rect } from "./stacking";

export type Side = "top" | "right" | "bottom" | "left";
export type Anchor = { x: number; y: number; side: Side };

/** Gap between a wire's end and the edge of the thing it touches. */
const GAP = 6;

/** The point on a rect's edge facing `toward`, with the side it sits on. */
export function anchorOn(r: Rect, toward: { x: number; y: number }): Anchor {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: r.y - GAP, side: "top" };

  // Compare the direction with the rect's own proportions, so a wide card
  // sends wires out of its long sides more often.
  const horizontal = Math.abs(dx) * r.h > Math.abs(dy) * r.w;
  if (horizontal) {
    const side: Side = dx > 0 ? "right" : "left";
    const x = dx > 0 ? r.x + r.w + GAP : r.x - GAP;
    const t = (r.w / 2) / Math.abs(dx);
    return { x, y: clamp(cy + dy * t, r.y + 12, r.y + r.h - 12), side };
  }
  const side: Side = dy > 0 ? "bottom" : "top";
  const y = dy > 0 ? r.y + r.h + GAP : r.y - GAP;
  const t = (r.h / 2) / Math.abs(dy);
  return { x: clamp(cx + dx * t, r.x + 12, r.x + r.w - 12), y, side };
}

/** Both ends of a wire between two rects. */
export function wireEnds(a: Rect, b: Rect): [Anchor, Anchor] {
  const ca = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const cb = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  return [anchorOn(a, cb), anchorOn(b, ca)];
}

const OUT: Record<Side, [number, number]> = {
  top: [0, -1],
  right: [1, 0],
  bottom: [0, 1],
  left: [-1, 0],
};

/**
 * A soft S-curve between two anchors. Each end leaves straight out of its
 * side, then bends, like a patch cable. Returns the SVG path and its midpoint
 * (where a note on the wire sits).
 */
export function wirePath(s: Anchor, t: Anchor) {
  const dist = Math.hypot(t.x - s.x, t.y - s.y);
  const pull = clamp(dist * 0.4, 24, 160);
  const [sx, sy] = OUT[s.side];
  const [tx, ty] = OUT[t.side];
  const c1 = { x: s.x + sx * pull, y: s.y + sy * pull };
  const c2 = { x: t.x + tx * pull, y: t.y + ty * pull };
  const path = `M ${s.x} ${s.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${t.x} ${t.y}`;
  // Midpoint of a cubic bezier at t = 0.5.
  const mid = {
    x: 0.125 * s.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * t.x,
    y: 0.125 * s.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * t.y,
  };
  return { path, mid };
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
