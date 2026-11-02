import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { motion } from "motion/react";
import { useState } from "react";
import type { NoteData } from "../../model/types";
import { useCanvasUi } from "../context";
import { useZoomVar } from "../zoom";
import { Ports } from "./Ports";

type NoteNodeType = Node<NoteData, "note">;

/**
 * Research in words: a call, a finding, a decision. The first paragraph reads
 * as its heading. Drop it on a stack to file it, or on a card or another note
 * to start a stack.
 */
export function NoteNode({ id, data, selected }: NodeProps<NoteNodeType>) {
  const { updateNodeData } = useReactFlow();
  const { commit, dropTargetId } = useCanvasUi();
  const isTarget = dropTargetId === id;
  const [editing, setEditing] = useState(false);
  useZoomVar();
  const [head, ...body] = data.text.split("\n\n");
  const text = (
    <>
      <div className="note-head">{head || "Note"}</div>
      {body.map((p, i) => (
        <p key={i} className="note-body">
          {p}
        </p>
      ))}
    </>
  );

  return (
    <motion.div
      className="note"
      data-selected={selected || undefined}
      data-target={isTarget || undefined}
      animate={{ scale: isTarget ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <textarea
          className="note-edit nodrag nowheel"
          autoFocus
          defaultValue={data.text}
          onBlur={(e) => {
            const text = e.currentTarget.value;
            if (text !== data.text) {
              commit();
              updateNodeData(id, { text });
            }
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
          }}
        />
      ) : (
        <>
          {/* The hidden copy sizes the note. The one you see sits on top: when
              zoomed out its heading grows and pushes the fading body down,
              inside the same box, so the note never changes size. */}
          <div className="note-text note-size" aria-hidden>
            {text}
          </div>
          <div className="note-text note-show">{text}</div>
        </>
      )}
      <Ports />
    </motion.div>
  );
}
