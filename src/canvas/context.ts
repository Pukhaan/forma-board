import { createContext, useContext } from "react";
import type { Item } from "../model/types";

/** Canvas-wide state and actions the nodes and wires use. */
export type CanvasUi = {
  /** The stack or card the dragged thing would join if dropped now. */
  dropTargetId: string | null;
  /** Remember the board before an edit, so it can be undone. */
  commit: () => void;
  /** Open a live card big, growing out of `media` (its box on the board). */
  openLive: (id: string, item: Item, media: HTMLElement) => void;
  /** The card whose live view is open, hidden on the board meanwhile. */
  liveId: string | null;
  /** Change one item wherever it is (a loose card or in a stack), as one undoable edit. */
  updateItem: (itemId: string, patch: Partial<Item>) => void;
};

export const CanvasUiContext = createContext<CanvasUi>({
  dropTargetId: null,
  commit: () => {},
  openLive: () => {},
  liveId: null,
  updateItem: () => {},
});

export const useCanvasUi = () => useContext(CanvasUiContext);
