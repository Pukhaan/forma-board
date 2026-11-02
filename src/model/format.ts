// board.json: the board as a plain file. Written for people and AI tools to
// read and edit by hand, so it stays flat and obvious. FORMAT.md documents it.

import type { Edge, Node } from "@xyflow/react";
import type { AreaData, CardData, Item, LinkData, NoteData, ProjectData, StackData } from "./types";
import { areaNode, areaSize, NEW_AREA } from "./operations";

export const FORMAT_VERSION = 1;

/** An item as stored: `file` is a path inside the project folder. */
export type FileItem = Item;

type At = { id: string; x: number; y: number };
export type FileNode =
  | (At & { type: "project"; title: string; brief: string })
  | (At & { type: "note"; text: string })
  | (At & { type: "stack"; title: string; description?: string; items: FileItem[] })
  | (At & { type: "card"; item: FileItem })
  | (At & { type: "area"; w: number; h: number; title: string });

export type FileWire = { id: string; from: string; to: string; note?: string };

export type BoardFile = { forma: number; nodes: FileNode[]; wires: FileWire[] };

export type Board = { nodes: Node[]; edges: Edge[] };

/** Turns a stored file path into something an <img> can show. */
export type Resolve = (file: string) => string;

const round = (v: number) => Math.round(v * 10) / 10;

function itemOut(item: Item): FileItem {
  const { src, ...rest } = item;
  // A file in the project is the truth; only keep `src` for things that aren't files yet.
  return rest.file || !src ? rest : { ...rest, src };
}

/**
 * One stored item, checked for what its kind needs: a note has text, a link
 * has a url, an image shows its file through the resolver. Anything else is
 * a broken entry and is skipped.
 */
function itemIn(item: FileItem, resolve: Resolve): Item | null {
  if (!item || typeof item !== "object" || typeof item.id !== "string") return null;
  const kind = item.kind ?? "image";
  if (kind === "note") return { ...item, kind, text: typeof item.text === "string" ? item.text : "" };
  if (kind === "link") return typeof item.url === "string" && item.url ? { ...item, kind } : null;
  if (kind !== "image") return null;
  const src = item.file ? resolve(item.file) : item.src;
  return { ...item, kind, src };
}

export function toBoardFile({ nodes, edges }: Board): BoardFile {
  const out: FileNode[] = [];
  for (const n of nodes) {
    const at = { id: n.id, x: round(n.position.x), y: round(n.position.y) };
    if (n.type === "project") {
      const d = n.data as ProjectData;
      out.push({ ...at, type: "project", title: d.title, brief: d.brief });
    } else if (n.type === "note") {
      out.push({ ...at, type: "note", text: (n.data as NoteData).text });
    } else if (n.type === "stack") {
      const d = n.data as StackData;
      const description = d.description?.trim() ? { description: d.description } : {};
      out.push({ ...at, type: "stack", title: d.title, ...description, items: d.items.map(itemOut) });
    } else if (n.type === "card") {
      out.push({ ...at, type: "card", item: itemOut((n.data as CardData).item) });
    } else if (n.type === "area") {
      const { w, h } = areaSize(n);
      out.push({ ...at, type: "area", w: round(w), h: round(h), title: (n.data as AreaData).title });
    }
  }
  const wires = edges.map((e) => {
    const note = (e.data as LinkData | undefined)?.note;
    return note ? { id: e.id, from: e.source, to: e.target, note } : { id: e.id, from: e.source, to: e.target };
  });
  return { forma: FORMAT_VERSION, nodes: out, wires };
}

export function serialize(board: Board): string {
  return `${JSON.stringify(toBoardFile(board), null, 2)}\n`;
}

/**
 * Reads board.json. Forgiving on purpose: a hand-edited file with one broken
 * entry still opens, minus that entry. Returns null only when the text isn't a
 * board at all.
 */
export function parseBoard(text: string, resolve: Resolve = (f) => f): Board | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as BoardFile).nodes)) return null;
  const file = raw as BoardFile;

  const nodes: Node[] = [];
  for (const n of file.nodes) {
    if (!n || typeof n.id !== "string") continue;
    const position = { x: Number(n.x) || 0, y: Number(n.y) || 0 };
    const base = { id: n.id, position };
    if (n.type === "project") {
      nodes.push({ ...base, type: "project", data: { title: n.title ?? "", brief: n.brief ?? "" } });
    } else if (n.type === "note") {
      nodes.push({ ...base, type: "note", data: { text: n.text ?? "" } });
    } else if (n.type === "stack") {
      const items = (Array.isArray(n.items) ? n.items : []).map((i) => itemIn(i, resolve)).filter((i): i is Item => !!i);
      const description = typeof n.description === "string" && n.description.trim() ? { description: n.description } : {};
      nodes.push({ ...base, type: "stack", data: { title: n.title ?? "Stack", ...description, items } });
    } else if (n.type === "card") {
      const item = itemIn(n.item, resolve);
      // A loose note is a note node; take a card that holds one as meaning that.
      if (item?.kind === "note") nodes.push({ ...base, type: "note", data: { text: item.text ?? "" } });
      else if (item) nodes.push({ ...base, type: "card", data: { item } });
    } else if (n.type === "area") {
      nodes.push(areaNode(n.id, { ...position, w: Number(n.w), h: Number(n.h) }, n.title ?? NEW_AREA));
    }
  }

  const ids = new Set(nodes.map((n) => n.id));
  const wires = Array.isArray(file.wires) ? file.wires : [];
  const edges: Edge[] = wires
    .filter((w) => w && ids.has(w.from) && ids.has(w.to) && w.from !== w.to)
    .map((w, i) => ({
      id: typeof w.id === "string" ? w.id : `wire-${i}`,
      source: w.from,
      target: w.to,
      type: "link",
      data: w.note ? { note: w.note } : {},
    }));

  return { nodes, edges };
}
