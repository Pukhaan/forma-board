import type { Node, NodeProps } from "@xyflow/react";
import { motion } from "motion/react";
import type { CardData } from "../../model/types";
import { useCanvasUi } from "../context";
import { fitInBox } from "./fit";
import { Ports } from "./Ports";

type CardNodeType = Node<CardData, "card">;

/** A single loose item. Drop it on a stack to file it, or on another card to start a stack. */
export function CardNode({ id, data, selected }: NodeProps<CardNodeType>) {
  const { dropTargetId } = useCanvasUi();
  const { item } = data;
  const size = fitInBox(item, 168);

  return (
    <motion.div
      className="card"
      data-selected={selected || undefined}
      data-target={dropTargetId === id || undefined}
      animate={{ scale: dropTargetId === id ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      <div className="card-media" style={size}>
        {item.src && <img src={item.src} alt="" draggable={false} />}
      </div>
      {item.title && <div className="card-title">{item.title}</div>}
      <Ports />
    </motion.div>
  );
}
