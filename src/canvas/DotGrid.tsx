import { useViewport } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { dotLevels } from "./dots";

/**
 * The dot grid. Dots keep one size and stay airy at every zoom: a coarse
 * layer always shows, and a finer layer fades in between its dots as you zoom
 * in. Dots near the cursor darken and grow a little, so the surface responds
 * to you.
 */
export function DotGrid() {
  const { x, y, zoom } = useViewport();
  const { fine, coarse, fineOpacity } = dotLevels(zoom);
  const root = useRef<HTMLDivElement>(null);

  // Follow the pointer without re-rendering: write it straight to CSS variables.
  useEffect(() => {
    const board = root.current?.closest(".react-flow") as HTMLElement | null;
    const el = root.current;
    if (!board || !el) return;
    const move = (e: PointerEvent) => {
      const r = board.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      el.dataset.near = "";
    };
    const leave = () => delete el.dataset.near;
    board.addEventListener("pointermove", move);
    board.addEventListener("pointerleave", leave);
    return () => {
      board.removeEventListener("pointermove", move);
      board.removeEventListener("pointerleave", leave);
    };
  }, []);

  // Each tile's dot sits in its centre, so shift by half a tile to put the
  // dots on the grid lines. That keeps both layers' dots lined up.
  const layer = (gap: number) => ({
    backgroundSize: `${gap}px ${gap}px`,
    backgroundPosition: `${x - gap / 2}px ${y - gap / 2}px`,
  });

  return (
    <div ref={root} className="dots">
      <div className="dots-layer" style={layer(coarse)} />
      <div className="dots-layer" style={{ ...layer(fine), opacity: fineOpacity }} />
      <div className="dots-layer dots-near" style={layer(coarse)} />
      <div className="dots-layer dots-near" style={{ ...layer(fine), opacity: fineOpacity }} />
    </div>
  );
}
