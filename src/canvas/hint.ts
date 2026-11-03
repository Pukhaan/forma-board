// The one line a brand-new board shows under its project, saying what to do.
// It shows only on a board that holds nothing but its project, until the
// first thing is added; after that it never shows on that board again, even
// if the board is emptied. Pure, apart from remembering which boards are past
// it (in this Mac's local storage).

import type { Node } from "@xyflow/react";

export const HINT = "Paste or drop anything here, or ask your AI.";

const KEY = "forma.hinted";
/** How many boards are remembered: plenty, and the list never grows without end. */
const KEEP = 200;

/** True when the board is only its project: nothing added yet. */
export const onlyProject = (nodes: Node[]) => nodes.length === 1 && nodes[0].type === "project";

/** Every remembered board, the latest first, with `board` added at the front. */
export function withBoard(list: string[], board: string, keep = KEEP) {
  return [board, ...list.filter((b) => b !== board)].slice(0, keep);
}

function read(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((b): b is string => typeof b === "string") : [];
  } catch {
    return [];
  }
}

/** Whether this board has had something added since it was new. */
export const pastHint = (board: string) => read().includes(board);

/** Remembers that this board is past its hint. */
export function rememberPastHint(board: string) {
  try {
    if (!pastHint(board)) localStorage.setItem(KEY, JSON.stringify(withBoard(read(), board)));
  } catch {
    // Not remembered: the hint may show again on an emptied board, nothing worse.
  }
}
