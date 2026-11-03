// What changed on a board, worked out from two boards. Pure: useChanges.ts
// turns the answers into light on the board.
//
// Two questions, one answer each:
// - diffBoards: the board on screen and the one that just arrived from the
//   folder (an AI, an editor). What was added, changed, moved, removed.
// - unseen: the board as it was when last looked at (its prints) and the one
//   being opened. What is new or different since then.
//
// "Changed" means content: a note's text, a stack's title or items, an
// image's note or palette, a wire's note. A position is never content, so a
// thing that only moved has the same print.

import { toBoardFile, type Board } from "../model/format";

type XY = { x: number; y: number };

/** One board's content, by id, as short hashes: what "last seen" remembers. */
export type Prints = { nodes: Record<string, string>; wires: Record<string, string> };

export type BoardDiff = {
  /** Node ids. */
  added: string[];
  /** Nodes whose own content, or anything in them, is different. */
  changed: string[];
  /** Nodes at a new position (whether or not they also changed). */
  moved: string[];
  removed: string[];
  /** Item ids, in stacks and on cards. Their node is in `added` or `changed` too. */
  items: { added: string[]; changed: string[] };
  wires: { added: string[]; changed: string[]; removed: string[] };
};

/** FNV-1a, 32 bits, as base 36: short, and plenty to tell two versions of one thing apart. */
export function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Nodes, items and wires by id, each with the hash of what it holds. */
function printsOf(board: Board) {
  const file = toBoardFile(board);
  const nodes: Record<string, string> = {};
  const items: Record<string, string> = {};
  for (const node of file.nodes) {
    const { x: _x, y: _y, ...content } = node;
    nodes[node.id] = hash(JSON.stringify(content));
    const held = node.type === "stack" ? node.items : node.type === "card" ? [node.item] : [];
    for (const item of held) items[item.id] = hash(JSON.stringify(item));
  }
  const wires: Record<string, string> = {};
  for (const w of file.wires) wires[w.id] = hash(JSON.stringify([w.from, w.to, w.note ?? ""]));
  return { nodes, items, wires };
}

/** The prints to remember a board by. */
export function prints(board: Board): Prints {
  const { nodes, wires } = printsOf(board);
  return { nodes, wires };
}

type Compared = { added: string[]; changed: string[]; removed: string[] };

function compare(before: Record<string, string>, after: Record<string, string>): Compared {
  const out: Compared = { added: [], changed: [], removed: [] };
  for (const id in after) {
    if (!(id in before)) out.added.push(id);
    else if (before[id] !== after[id]) out.changed.push(id);
  }
  for (const id in before) if (!(id in after)) out.removed.push(id);
  return out;
}

const far = (a: XY, b: XY) => Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5;

export function diffBoards(before: Board, after: Board): BoardDiff {
  const a = printsOf(before);
  const b = printsOf(after);
  const nodes = compare(a.nodes, b.nodes);
  const items = compare(a.items, b.items);
  const wires = compare(a.wires, b.wires);
  const was = new Map(before.nodes.map((n) => [n.id, n.position]));
  const moved = after.nodes.flatMap((n) => {
    const from = was.get(n.id);
    return from && far(from, n.position) ? [n.id] : [];
  });
  return {
    added: nodes.added,
    changed: nodes.changed,
    moved,
    removed: nodes.removed,
    items: { added: items.added, changed: items.changed },
    wires,
  };
}

/** What is new or different on `board` since it looked like `seen`: node ids and wire ids. */
export function unseen(seen: Prints, board: Board): { nodes: string[]; wires: string[] } {
  const now = prints(board);
  const n = compare(seen.nodes, now.nodes);
  const w = compare(seen.wires, now.wires);
  return { nodes: [...n.added, ...n.changed], wires: [...w.added, ...w.changed] };
}

/**
 * What to remember now: the board as it is, except the things still waiting
 * to be seen, which keep what they were last seen as (or stay unknown, if
 * they are new). So closing the board before looking keeps them new.
 */
export function remember(prev: Prints, now: Prints, waiting: { nodes: Set<string>; wires: Set<string> }): Prints {
  const keep = (was: Record<string, string>, is: Record<string, string>, ids: Set<string>) => {
    const out: Record<string, string> = {};
    for (const id in is) {
      if (!ids.has(id)) out[id] = is[id];
      else if (id in was) out[id] = was[id];
    }
    return out;
  };
  return { nodes: keep(prev.nodes, now.nodes, waiting.nodes), wires: keep(prev.wires, now.wires, waiting.wires) };
}

/** Reads stored prints back, or null for anything that isn't them. */
export function readPrints(text: string | null): Prints | null {
  if (!text) return null;
  try {
    const raw = JSON.parse(text) as Partial<Prints> | null;
    const isMap = (m: unknown): m is Record<string, string> =>
      !!m && typeof m === "object" && Object.values(m).every((v) => typeof v === "string");
    return raw && isMap(raw.nodes) && isMap(raw.wires) ? { nodes: raw.nodes, wires: raw.wires } : null;
  } catch {
    return null;
  }
}
