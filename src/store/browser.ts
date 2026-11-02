// The board kept in the browser. Used when the interface runs outside the Mac
// app (for design work in a normal browser tab).

import { parseBoard, serialize, type Board } from "../model/format";
import { newId } from "../model/operations";
import { sampleEdges, sampleNodes } from "../model/sample";
import { imageSize, newImageFields, titleFromName, type BoardStore } from "./types";
import { isVideoFile, videoStill } from "./videoStill";

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
    async importMedia(file, source) {
      if (isVideoFile(file)) {
        // Kept in the page, so it only lasts as long as the browser keeps it.
        const [src, { w, h, still }] = await Promise.all([readDataUrl(file), videoStill(file)]);
        // The still is kept as a data URL too, as its `poster`, so it survives a reload.
        const poster = still ? await readDataUrl(still) : undefined;
        const fields = await newImageFields(still, source);
        const shown = poster ? { poster, posterSrc: poster } : {};
        return { id: newId("item"), kind: "video", src, ...shown, w, h, title: titleFromName(file.name), ...fields };
      }
      const [src, size, fields] = await Promise.all([readDataUrl(file), imageSize(file), newImageFields(file, source)]);
      return { id: newId("item"), kind: "image", src, ...size, title: titleFromName(file.name), ...fields };
    },
    watch() {
      return () => {};
    },
  };
}
