import type { Node, NodeProps } from "@xyflow/react";
import { motion } from "motion/react";
import type { CardData } from "../../model/types";
import { useCanvasUi } from "../context";
import { openLink } from "../openLink";
import { useZoomVar } from "../zoom";
import { ItemFace } from "./Faces";
import { fitInBox } from "./fit";
import { Ports } from "./Ports";

type CardNodeType = Node<CardData, "card">;

/**
 * A single loose item: an image, or a link (double-click opens it). Drop it on
 * a stack to file it, or on another card or note to start a stack.
 */
export function CardNode({ id, data, selected }: NodeProps<CardNodeType>) {
  const { dropTargetId } = useCanvasUi();
  useZoomVar();
  const { item } = data;
  const isLink = item.kind === "link";
  const size = fitInBox(item, isLink ? 200 : 168);

  return (
    <motion.div
      className="card"
      data-kind={item.kind}
      data-titled={(item.title && !isLink) || undefined}
      data-selected={selected || undefined}
      data-target={dropTargetId === id || undefined}
      animate={{ scale: dropTargetId === id ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      onDoubleClick={isLink ? () => openLink(item.url ?? "") : undefined}
      title={isLink ? item.url : undefined}
    >
      <div className="card-media" style={size}>
        <ItemFace item={item} />
      </div>
      {item.title && !isLink && <div className="card-title">{item.title}</div>}
      <Ports />
    </motion.div>
  );
}
