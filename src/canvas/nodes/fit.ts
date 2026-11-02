import type { Item } from "../../model/types";

/** Size of an item drawn inside a square box, keeping its proportions. */
export function fitInBox(item: Item, box: number) {
  const w = item.w ?? 1;
  const h = item.h ?? 1;
  const s = box / Math.max(w, h);
  return { width: Math.round(w * s), height: Math.round(h * s) };
}
