import type { ConnectionLineComponentProps } from "@xyflow/react";
import { wirePath, type Side } from "../../model/geometry";

/** The wire you're pulling out, before it lands. Same curve as a finished wire. */
export function ConnectionLine({ fromX, fromY, fromPosition, toX, toY }: ConnectionLineComponentProps) {
  const back: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
  const fromSide = fromPosition as Side;
  const { path } = wirePath({ x: fromX, y: fromY, side: fromSide }, { x: toX, y: toY, side: back[fromSide] });
  return (
    <g>
      <path d={path} className="wire" data-hot />
      <circle cx={toX} cy={toY} r={5} className="wire-tip" />
    </g>
  );
}
