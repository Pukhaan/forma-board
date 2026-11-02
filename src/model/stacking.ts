// Pure rules for sorting things into stacks. Kept free of React so they can be
// tested, and reused later when the AI sorts a project folder.

import type { Item } from "./types";

export type Rect = { x: number; y: number; w: number; h: number };

/** What a drop means, given what was dragged and what it landed on. */
export type DropAction =
  | { type: "none" }
  | { type: "add-to-stack"; stackId: string }
  | { type: "merge-stacks"; stackId: string }
  | { type: "new-stack"; withCardId: string };

export type Droppable = { id: string; type: string; rect: Rect };

export function center(r: Rect) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

export function contains(r: Rect, p: { x: number; y: number }) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

/**
 * Finds what a dragged card or stack should join. The dragged thing joins a
 * target when its centre is over the target, so a light overlap while
 * arranging things never stacks them by accident.
 */
export function resolveDrop(
  dragged: Droppable,
  others: Droppable[],
): DropAction {
  if (dragged.type !== "card" && dragged.type !== "stack") return { type: "none" };
  const c = center(dragged.rect);
  // Last in the list is drawn on top, so check from the top down.
  for (let i = others.length - 1; i >= 0; i--) {
    const o = others[i];
    if (o.id === dragged.id || !contains(o.rect, c)) continue;
    if (o.type === "stack") {
      return dragged.type === "card"
        ? { type: "add-to-stack", stackId: o.id }
        : { type: "merge-stacks", stackId: o.id };
    }
    if (o.type === "card" && dragged.type === "card") {
      return { type: "new-stack", withCardId: o.id };
    }
  }
  return { type: "none" };
}

/** New items go on top of the pile, so the latest addition is the cover. */
export function pushItems(stack: Item[], added: Item[]): Item[] {
  const ids = new Set(stack.map((i) => i.id));
  return [...stack, ...added.filter((i) => !ids.has(i.id))];
}

/** What a fresh stack is called until you (or the AI) name it. */
export const NEW_STACK = "New stack";
