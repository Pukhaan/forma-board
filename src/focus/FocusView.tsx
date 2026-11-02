import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Item } from "../model/types";

type Props = {
  stack: { id: string; title: string; items: Item[] } | null;
  onClose: () => void;
  onTakeOut: (itemId: string) => void;
};

const spring = { type: "spring", stiffness: 380, damping: 34 } as const;

/**
 * A stack, opened. The board stays behind it, blurred and quiet, and the
 * stack's contents lay out as a grid. Click an image to lift it; Esc steps back
 * out one level at a time.
 */
export function FocusView({ stack, onClose, onTakeOut }: Props) {
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const lifted = stack?.items.find((i) => i.id === liftedId) ?? null;

  useEffect(() => {
    if (!stack) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (liftedId) setLiftedId(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [stack, liftedId, onClose]);

  return (
    <AnimatePresence onExitComplete={() => setLiftedId(null)}>
      {stack && (
        <motion.div
          key={stack.id}
          className="focus"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          transition={{ duration: 0.22 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <header className="focus-head">
            <div>
              <h2 className="focus-title">{stack.title}</h2>
              <span className="focus-count">
                {stack.items.length} {stack.items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <button className="focus-close chrome" onClick={onClose}>
              Close <kbd>Esc</kbd>
            </button>
          </header>

          <div className="focus-grid" onClick={(e) => e.target === e.currentTarget && onClose()}>
            {[...stack.items].reverse().map((item, i) => (
              <motion.figure
                key={item.id}
                className="focus-tile"
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...spring, delay: 0.04 + i * 0.035 }}
              >
                <motion.button
                  layoutId={`tile-${item.id}`}
                  className="focus-media"
                  style={{ aspectRatio: `${item.w ?? 1} / ${item.h ?? 1}` }}
                  onClick={() => setLiftedId(item.id)}
                  transition={spring}
                >
                  {item.src && <img src={item.src} alt={item.title ?? ""} draggable={false} />}
                </motion.button>
                <figcaption className="focus-caption">
                  <span>{item.title ?? ""}</span>
                  <button className="focus-takeout" onClick={() => onTakeOut(item.id)}>
                    Take out
                  </button>
                </figcaption>
              </motion.figure>
            ))}
          </div>

          <AnimatePresence>
            {lifted && (
              <motion.div
                className="lift"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLiftedId(null)}
              >
                <motion.div
                  layoutId={`tile-${lifted.id}`}
                  className="lift-media"
                  style={{
                    aspectRatio: `${lifted.w ?? 1} / ${lifted.h ?? 1}`,
                    width: `min(78vw, calc(78vh * ${(lifted.w ?? 1) / (lifted.h ?? 1)}))`,
                  }}
                  transition={spring}
                >
                  {lifted.src && <img src={lifted.src} alt={lifted.title ?? ""} draggable={false} />}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
