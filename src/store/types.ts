import type { Board } from "../model/format";
import type { Item } from "../model/types";

/** Where a board lives. The canvas only talks to this, never to storage directly. */
export interface BoardStore {
  /** Shown in the corner: the project folder's name, or where the board is kept. */
  name: string;
  /** The project folder, when there is one. */
  root?: string;
  load(): Promise<Board>;
  /** Saves soon. Calls close together are merged into one write. */
  save(board: Board): void;
  /** Brings an image into the project and returns it as an item. */
  importImage(file: File): Promise<Item>;
  /** Called when the board changes outside the app (an AI, an editor). Returns a stop function. */
  watch(onChange: (board: Board) => void): () => void;
}

/** Natural size of an image file, for keeping its proportions on the board. */
export async function imageSize(file: Blob): Promise<{ w: number; h: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { w: bitmap.width, h: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { w: 1, h: 1 };
  }
}

export const titleFromName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
