import { createContext, useContext } from "react";

/** Canvas-wide state and actions the nodes and wires use. */
export type CanvasUi = {
  /** The stack or card the dragged thing would join if dropped now. */
  dropTargetId: string | null;
  /** Remember the board before an edit, so it can be undone. */
  commit: () => void;
};

export const CanvasUiContext = createContext<CanvasUi>({ dropTargetId: null, commit: () => {} });

export const useCanvasUi = () => useContext(CanvasUiContext);
