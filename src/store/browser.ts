// The board kept in the browser. Used when the interface runs outside the Mac
// app (for design work in a normal browser tab).

import { parseBoard, serialize, type Board } from "../model/format";
import { newId } from "../model/operations";
import { sampleEdges, sampleNodes } from "../model/sample";
import { imageSize, titleFromName, type BoardStore } from "./types";

const KEY = "forma.board.v1";

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function browserStore(): BoardStore {
  let timer: number | undefined;
  return {
    name: "Sample board",
    async load() {
      try {
        const saved = localStorage.getItem(KEY);
        const board = saved ? parseBoard(saved) : null;
        if (board) return board;
      } catch {
        // Storage blocked: fall through to the sample.
      }
      return { nodes: sampleNodes, edges: sampleEdges };
    },
    save(board: Board) {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        try {
          localStorage.setItem(KEY, serialize(board));
        } catch {
          // Full or blocked. The board still works, it just won't survive a reload.
        }
      }, 300);
    },
    async importImage(file) {
      const [src, size] = await Promise.all([readDataUrl(file), imageSize(file)]);
      return { id: newId("item"), kind: "image", src, ...size, title: titleFromName(file.name) };
    },
    watch() {
      return () => {};
    },
  };
}
