import type { Node, NodeProps } from "@xyflow/react";
import { motion } from "motion/react";
import type { CardData } from "../../model/types";
import { useCanvasUi } from "../context";
import { LiveCard } from "../live/LiveCard";
import { openLink } from "../openLink";
import { useZoomVar } from "../zoom";
import { ItemFace } from "./Faces";
import { fitInBox } from "./fit";
import { Ports } from "./Ports";

type CardNodeType = Node<CardData, "card">;

/**
 * A single loose item: an image, a link (double-click opens it), or a live
 * card (a click opens it big, like a stack). Drop it on a stack to file it,
 * or on another card or note to start a stack.
 */
export function CardNode({ id, data, selected }: NodeProps<CardNodeType>) {
  const { dropTargetId, liveId } = useCanvasUi();
  useZoomVar();
  const { item } = data;
  const isLink = item.kind === "link";
  const isLive = item.kind === "live";
  const title = item.title?.trim();
  const titled = (item.kind === "image" || isLive) && !!title;

  return (
    <motion.div
      className="card"
      data-kind={item.kind}
      data-titled={titled || undefined}
      data-selected={selected || undefined}
      data-target={dropTargetId === id || undefined}
      data-lifted={liveId === id || undefined}
      animate={{ scale: dropTargetId === id ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      onDoubleClick={isLink ? () => openLink(item.url ?? "") : undefined}
      title={isLink ? item.url : undefined}
    >
      {isLive ? (
        <LiveCard id={id} item={item} />
      ) : (
        <div className="card-media" style={fitInBox(item, isLink ? 200 : 168)}>
          <ItemFace item={item} />
        </div>
      )}
      {titled && <div className="card-title">{title}</div>}
      <Ports />
    </motion.div>
  );
}
