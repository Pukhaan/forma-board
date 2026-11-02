import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { motion } from "motion/react";
import { useState } from "react";
import type { StackData } from "../../model/types";
import { useCanvasUi } from "../context";
import { ItemFace } from "./Faces";
import { fitInBox } from "./fit";
import { Ports } from "./Ports";

type StackNodeType = Node<StackData, "stack">;

/** How the cards under the cover sit, from the one just below the top down. */
const REST = [
  { rotate: -5, x: -8, y: 4 },
  { rotate: 6, x: 9, y: 6 },
  { rotate: -2, x: 2, y: 10 },
];
/** Hover fans them out so you can see there's more inside. */
const FAN = [
  { rotate: -12, x: -34, y: 6 },
  { rotate: 12, x: 34, y: 8 },
  { rotate: -4, x: 0, y: 18 },
];

const BOX = 176;
const spring = { type: "spring", stiffness: 420, damping: 30 } as const;

export function StackNode({ id, data, selected }: NodeProps<StackNodeType>) {
  const { dropTargetId, commit } = useCanvasUi();
  const { updateNodeData } = useReactFlow();
  const [renaming, setRenaming] = useState(false);
  const isTarget = dropTargetId === id;
  // The last item is the cover; the three before it peek out underneath.
  const shown = data.items.slice(-4).reverse();

  return (
    <motion.div
      className="stack"
      data-selected={selected || undefined}
      data-target={isTarget || undefined}
      initial="rest"
      whileHover="fan"
      animate={isTarget ? "fan" : "rest"}
    >
      <div className="stack-pile" style={{ width: BOX + 24, height: BOX + 24 }}>
        {shown
          .map((item, i) => {
            const size = fitInBox(item, BOX);
            const under = i - 1;
            return (
              <motion.div
                key={item.id}
                className="stack-card"
                data-kind={item.kind}
                style={{ ...size, zIndex: 10 - i }}
                variants={
                  i === 0
                    ? { rest: { scale: 1 }, fan: { scale: isTarget ? 1.04 : 1.02 } }
                    : { rest: REST[under], fan: FAN[under] }
                }
                transition={spring}
              >
                <ItemFace item={item} />
              </motion.div>
            );
          })
          .reverse()}
      </div>
      <div className="stack-label">
        {renaming ? (
          <input
            className="stack-rename nodrag"
            autoFocus
            defaultValue={data.title}
            onFocus={(e) => e.currentTarget.select()}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const title = e.currentTarget.value.trim();
              if (title && title !== data.title) {
                commit();
                updateNodeData(id, { title });
              }
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
            }}
          />
        ) : (
          <span
            className="stack-title"
            title="Double-click to rename"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => setRenaming(true)}
          >
            {data.title}
          </span>
        )}
        <span className="stack-count">{data.items.length}</span>
      </div>
      <Ports />
    </motion.div>
  );
}
