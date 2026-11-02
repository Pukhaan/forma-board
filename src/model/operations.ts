// Changes to the canvas as pure functions over nodes and edges. The canvas
// calls these; later the file layer and the AI can call the same ones.

import type { Edge, Node } from "@xyflow/react";
import { NEW_STACK, pushItems, type DropAction } from "./stacking";
import type { CardData, Item, StackData } from "./types";

type Graph = { nodes: Node[]; edges: Edge[] };

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Items a node carries into a stack. */
function itemsOf(node: Node): Item[] {
  if (node.type === "stack") return (node.data as StackData).items;
  if (node.type === "card") return [(node.data as CardData).item];
  return [];
}

/**
 * Points every wire that touched `from` at `to` instead, dropping wires that
 * would loop back on themselves or repeat an existing connection.
 */
export function moveWires(edges: Edge[], from: string[], to: string): Edge[] {
  const gone = new Set(from);
  const seen = new Set<string>();
  const out: Edge[] = [];
  for (const e of edges) {
    const source = gone.has(e.source) ? to : e.source;
    const target = gone.has(e.target) ? to : e.target;
    if (source === target) continue;
    const key = [source, target].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(source === e.source && target === e.target ? e : { ...e, source, target });
  }
  return out;
}

/** Applies what a drop means. Returns the graph unchanged for "none". */
export function applyDrop(g: Graph, draggedId: string, action: DropAction): Graph {
  const dragged = g.nodes.find((n) => n.id === draggedId);
  if (!dragged || action.type === "none") return g;

  if (action.type === "add-to-stack" || action.type === "merge-stacks") {
    const nodes = g.nodes
      .filter((n) => n.id !== draggedId)
      .map((n) =>
        n.id === action.stackId
          ? { ...n, data: { ...n.data, items: pushItems(itemsOf(n), itemsOf(dragged)) } }
          : n,
      );
    return { nodes, edges: moveWires(g.edges, [draggedId], action.stackId) };
  }

  const other = g.nodes.find((n) => n.id === action.withCardId);
  if (!other) return g;
  const items = [...itemsOf(other), ...itemsOf(dragged)];
  const stack: Node = {
    id: newId("stack"),
    type: "stack",
    position: other.position,
    data: { title: NEW_STACK, items } satisfies StackData,
  };
  const nodes = [...g.nodes.filter((n) => n.id !== draggedId && n.id !== other.id), stack];
  return { nodes, edges: moveWires(g.edges, [draggedId, other.id], stack.id) };
}

/**
 * Puts a stack's items in a new order (last = the cover). Ids that aren't in
 * the stack are ignored; items missing from the list keep their place at the
 * bottom, so nothing is ever lost.
 */
export function reorderStack(g: Graph, stackId: string, itemIds: string[]): Graph {
  const nodes = g.nodes.map((n) => {
    if (n.id !== stackId) return n;
    const items = (n.data as StackData).items;
    const byId = new Map(items.map((i) => [i.id, i]));
    const ordered = itemIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
    const listed = new Set(ordered.map((i) => i.id));
    const rest = items.filter((i) => !listed.has(i.id));
    return { ...n, data: { ...n.data, items: [...rest, ...ordered] } };
  });
  return { nodes, edges: g.edges };
}

/**
 * Takes one item out of a stack and puts it on the canvas beside the stack.
 * A stack left empty is removed.
 */
export function takeOut(g: Graph, stackId: string, itemId: string, at: { x: number; y: number }): Graph {
  const stack = g.nodes.find((n) => n.id === stackId);
  if (!stack) return g;
  const items = (stack.data as StackData).items;
  const item = items.find((i) => i.id === itemId);
  if (!item) return g;
  const rest = items.filter((i) => i.id !== itemId);
  const card: Node = { id: newId("card"), type: "card", position: at, data: { item } satisfies CardData };
  const nodes = g.nodes.flatMap((n) => {
    if (n.id !== stackId) return [n];
    return rest.length ? [{ ...n, data: { ...n.data, items: rest } }] : [];
  });
  const edges = rest.length ? g.edges : g.edges.filter((e) => e.source !== stackId && e.target !== stackId);
  return { nodes: [...nodes, card], edges };
}
