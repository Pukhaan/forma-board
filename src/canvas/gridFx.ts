// Live state for the grid effects: which thing the pointer is over and which
// of its ports. The wire being pulled is read straight from React Flow's
// store. DotGrid subscribes and turns this into dots; nothing here renders.

import type { Node } from "@xyflow/react";
import type { Side } from "./gridFx.math";

export type GridFxState = {
  /** The thing under the pointer: its ports show as dot "+"s. */
  hover: string | null;
  /** The port under the pointer: its "+" grows a little. */
  port: { node: string; side: Side } | null;
};

let state: GridFxState = { hover: null, port: null };
const listeners = new Set<() => void>();

export const gridFx = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

function set(next: Partial<GridFxState>) {
  state = { ...state, ...next };
  for (const fn of listeners) fn();
}

/** For ReactFlow's `onNodeMouseEnter` and `onNodeMouseLeave`. */
export const hoverNode = (_: unknown, node: Node) => set({ hover: node.id });
export const leaveNode = (_: unknown, node: Node) => {
  if (state.hover === node.id) set({ hover: null });
};

/** For a port's own pointer events. */
export const hoverPort = (node: string, side: Side) => set({ port: { node, side } });
export const leavePort = (node: string, side: Side) => {
  if (state.port?.node === node && state.port.side === side) set({ port: null });
};
