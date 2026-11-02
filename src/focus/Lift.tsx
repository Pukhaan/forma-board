import { motion, type Transition } from "motion/react";
import { ItemFace } from "../canvas/nodes/Faces";
import { itemShape } from "../model/items";
import type { Item } from "../model/types";

export type Rect = { x: number; y: number; w: number; h: number };

export const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

type Props = {
  item: Item;
  /** Where the image was in the grid when it was lifted. */
  from: Rect;
  /** Set when it's being put back: where it lands. */
  to: Rect | null;
  reduced: boolean;
  spring: Transition;
  fade: Transition;
  onPutBack: () => void;
  onDone: () => void;
};

/**
 * One image or note lifted toward you, everything else pushed back. It grows out of
 * its tile and shrinks back into it, so the tile is hidden while it's up.
 */
export function Lift({ item, from, to, reduced, spring, fade, onPutBack, onDone }: Props) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const shape = itemShape(item);
  const aspect = shape.w / shape.h;
  // A note comes up the size of a page to read, not as big as the window.
  const w = Math.min(vw * 0.78, vh * 0.78 * aspect, item.kind === "note" ? 460 : Infinity);
  const h = w / aspect;
  const pose = (r: Rect) => ({ x: r.x + r.w / 2 - vw / 2, y: r.y + r.h / 2 - vh / 2, scale: r.w / w });
  const up = { x: 0, y: 0, scale: 1, opacity: 1 };

  return (
    <motion.div
      className="lift"
      initial={{ opacity: 0 }}
      animate={{ opacity: to ? 0 : 1 }}
      transition={fade}
      onClick={onPutBack}
    >
      <motion.div
        className="lift-media"
        style={{ width: w, height: h }}
        initial={reduced ? { ...up, opacity: 0 } : { ...pose(from), opacity: 1 }}
        animate={to ? (reduced ? { ...up, opacity: 0 } : { ...pose(to), opacity: 1 }) : up}
        transition={reduced ? fade : spring}
        onAnimationComplete={() => to && onDone()}
      >
        <ItemFace item={item} read />
      </motion.div>
    </motion.div>
  );
}
