import { Handle, Position } from "@xyflow/react";

const SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left];

/**
 * Four ports, one per side, shown on hover. Pull from any of them to start a
 * wire. Where the wire ends up is worked out from the positions, so the port
 * you pulled from only starts the gesture.
 */
export function Ports() {
  return (
    <>
      {SIDES.map((side) => (
        <Handle key={side} id={side} type="source" position={side} className="port" />
      ))}
    </>
  );
}
