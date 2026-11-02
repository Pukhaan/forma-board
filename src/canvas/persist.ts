// Saves the board in the browser while we design. This is the one piece the
// Tauri file layer replaces: the board will live in the project folder instead.

import type { Edge, Node } from "@xyflow/react";
import { sampleEdges, sampleNodes } from "../model/sample";

const KEY = "canvas.board.v1";

type Saved = { nodes: Node[]; edges: Edge[] };

export function loadBoard(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Saved;
      if (Array.isArray(saved.nodes) && Array.isArray(saved.edges)) {
        // Selection is a moment, not part of the board.
        return {
          nodes: saved.nodes.map((n) => ({ ...n, selected: false, dragging: false })),
          edges: saved.edges.map((e) => ({ ...e, selected: false })),
        };
      }
    }
  } catch {
    // Storage blocked or corrupt: start from the sample.
  }
  return { nodes: sampleNodes, edges: sampleEdges };
}

let timer: number | undefined;

export function saveBoard(nodes: Node[], edges: Edge[]) {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    try {
      const strip = nodes.map(({ id, type, position, data }) => ({ id, type, position, data }));
      const wires = edges.map(({ id, source, target, type, data }) => ({ id, source, target, type, data }));
      localStorage.setItem(KEY, JSON.stringify({ nodes: strip, edges: wires }));
    } catch {
      // Out of space or blocked. The board still works, it just won't survive a reload.
    }
  }, 300);
}

export function resetBoard() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
