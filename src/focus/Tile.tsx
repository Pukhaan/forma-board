import { motion, useMotionValue, type MotionValue } from "motion/react";
import { memo, useEffect, type PointerEvent } from "react";
import type { Item } from "../model/types";
import type { Pose, Size } from "./layout";

export type TileValues = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  rotate: MotionValue<number>;
  opacity: MotionValue<number>;
};

type Props = {
  item: Item;
  /** Drawn size at rest in the grid. */
  size: Size;
  /** Pose on the first frame; after that the motion values are driven from outside. */
  start: Pose;
  z: number;
  raised: boolean;
  lifted: boolean;
  register: (id: string, values: TileValues | null) => void;
  onPointerDown: (e: PointerEvent, id: string) => void;
  onLift: (id: string, media: HTMLElement) => void;
  onTakeOut: (id: string) => void;
};

/**
 * One image in an opened stack. It owns its motion values, so the first frame
 * is drawn exactly at `start` (on the pile) with no flash of the grid, and
 * hands them up so the stack can fly, reorder and close them together.
 */
export const Tile = memo(function Tile({ item, size, start, z, raised, lifted, register, onPointerDown, onLift, onTakeOut }: Props) {
  const x = useMotionValue(start.x);
  const y = useMotionValue(start.y);
  const scale = useMotionValue(start.scale);
  const rotate = useMotionValue(start.rotate);
  const opacity = useMotionValue(start.opacity);

  useEffect(() => {
    register(item.id, { x, y, scale, rotate, opacity });
    return () => register(item.id, null);
  }, [item.id, register, x, y, scale, rotate, opacity]);

  return (
    <motion.div
      className="ft"
      data-raised={raised || undefined}
      data-lifted={lifted || undefined}
      style={{ x, y, scale, rotate, opacity, width: size.w, height: size.h, zIndex: raised ? 100000 : z }}
      onPointerDown={(e) => onPointerDown(e, item.id)}
    >
      <button className="ft-media" onClick={(e) => onLift(item.id, e.currentTarget)} aria-label={item.title ?? "Open image"}>
        {item.src && <img src={item.src} alt={item.title ?? ""} draggable={false} />}
      </button>
      <div className="ft-caption">
        <span className="ft-title">{item.title ?? ""}</span>
        <button
          className="ft-takeout"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onTakeOut(item.id)}
        >
          Take out
        </button>
      </div>
    </motion.div>
  );
});
