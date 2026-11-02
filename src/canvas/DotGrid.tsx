import { useViewport } from "@xyflow/react";
import { dotSpacing } from "./dots";

/**
 * The dot grid. Dots stay the same size on screen at any zoom; only the
 * spacing follows the zoom, and it doubles when zoomed far out so the grid
 * never turns into noise.
 */
export function DotGrid() {
  const { x, y, zoom } = useViewport();
  const gap = dotSpacing(zoom);
  return (
    <div
      className="dots"
      style={{
        backgroundSize: `${gap}px ${gap}px`,
        backgroundPosition: `${x}px ${y}px`,
      }}
    />
  );
}
