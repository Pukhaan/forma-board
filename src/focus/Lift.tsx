import { motion, type Transition } from "motion/react";
import { useState } from "react";
import { LiveStage } from "../canvas/live/LiveStage";
import { ItemFace } from "../canvas/nodes/Faces";
import { itemShape } from "../model/items";
import type { Item } from "../model/types";
import { detailLayout } from "./detail";
import { ImageDetail } from "./ImageDetail";

export type Rect = { x: number; y: number; w: number; h: number };

export const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

/** A live card's dials at its right: their width and the gap (see live.css). */
const DIALS_SIDE = 252;
/** What a live card and its dials keep clear of the window's edges. */
const LIVE_MARGIN = 56;

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
 * its tile and shrinks back into it, so the tile is hidden while it's up. A
 * live card comes up running and takes the pointer, so you can play with it;
 * only a click around it puts it back.
 */
export function Lift({ item, from, to, reduced, spring, fade, onPutBack, onDone }: Props) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const shape = itemShape(item);
  const aspect = shape.w / shape.h;
  // A note comes up the size of a page to read. A live card and its dials
  // are centred together, the card nudged left to make room for them.
  const live = item.kind === "live";
  const most = live ? Math.min(vw * 0.78, vw - DIALS_SIDE - 2 * LIVE_MARGIN) : vw * 0.78;
  // An image keeps room under it for its note, and at its sides for its
  // palette and where it came from.
  const detail = item.kind === "image" ? detailLayout({ w: vw, h: vh }, aspect) : null;
  const w = detail ? detail.image.w : Math.min(most, vh * 0.78 * aspect, item.kind === "note" ? 460 : Infinity);
  const h = w / aspect;
  const pose = (r: Rect) => ({ x: r.x + r.w / 2 - vw / 2, y: r.y + r.h / 2 - vh / 2, scale: r.w / w });
  const up = { x: live ? -DIALS_SIDE / 2 : 0, y: detail?.dy ?? 0, scale: 1, opacity: 1 };
  const [settled, setSettled] = useState(false);

  return (
    <div className="lift" onClick={onPutBack}>
      {/* The veil fades on its own: if the image sat inside it, putting it
          back would fade the image out before it reached its tile. */}
      <motion.div
        className="lift-veil"
        initial={{ opacity: 0 }}
        animate={{ opacity: to ? 0 : 1 }}
        transition={fade}
      />
      <motion.div
        className="lift-media"
        data-kind={item.kind}
        style={{ width: w, height: h }}
        onClick={live ? (e) => e.stopPropagation() : undefined}
        initial={reduced ? { ...up, opacity: 0 } : { ...pose(from), opacity: 1 }}
        animate={to ? (reduced ? { ...up, opacity: 0 } : { ...pose(to), opacity: 1 }) : up}
        transition={reduced ? fade : spring}
        onAnimationComplete={() => (to ? onDone() : setSettled(true))}
      >
        {live ? <LiveStage item={item} /> : <ItemFace item={item} read />}
      </motion.div>
      {detail && <ImageDetail item={item} layout={detail} shown={!to} settled={settled} fade={fade} />}
    </div>
  );
}
