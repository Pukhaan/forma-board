import type { Node, NodeProps } from "@xyflow/react";
import { motion } from "motion/react";
import type { MouseEvent } from "react";
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
 * card (double-click opens it big). Drop it on a stack to file it, or on
 * another card or note to start a stack.
 */
export function CardNode({ id, data, selected }: NodeProps<CardNodeType>) {
  const { dropTargetId, openLive, liveId } = useCanvasUi();
  useZoomVar();
  const { item } = data;
  const isLink = item.kind === "link";
  const isLive = item.kind === "live";
  const titled = item.kind === "image" && !!item.title;

  const onDoubleClick = isLink
    ? () => openLink(item.url ?? "")
    : isLive
      ? (e: MouseEvent<HTMLElement>) => {
          const media = e.currentTarget.querySelector<HTMLElement>(".card-media");
          if (media) openLive(id, item, media);
        }
      : undefined;

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
      onDoubleClick={onDoubleClick}
      title={isLink ? item.url : undefined}
    >
      {isLive ? (
        <LiveCard id={id} item={item} onOpen={(media) => openLive(id, item, media)} />
      ) : (
        <div className="card-media" style={fitInBox(item, isLink ? 200 : 168)}>
          <ItemFace item={item} />
        </div>
      )}
      {titled && <div className="card-title">{item.title}</div>}
      <Ports />
    </motion.div>
  );
}
