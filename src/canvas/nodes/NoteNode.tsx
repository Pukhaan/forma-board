import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import type { NoteData } from "../../model/types";
import { useCanvasUi } from "../context";
import { Ports } from "./Ports";

type NoteNodeType = Node<NoteData, "note">;

/** Research in words: a call, a finding, a decision. The first paragraph reads as its heading. */
export function NoteNode({ id, data, selected }: NodeProps<NoteNodeType>) {
  const { updateNodeData } = useReactFlow();
  const { commit } = useCanvasUi();
  const [editing, setEditing] = useState(false);
  const [head, ...body] = data.text.split("\n\n");

  return (
    <div className="note" data-selected={selected || undefined} onDoubleClick={() => setEditing(true)}>
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
          <div className="note-head">{head || "Note"}</div>
          {body.map((p, i) => (
            <p key={i} className="note-body">
              {p}
            </p>
          ))}
        </>
      )}
      <Ports />
    </div>
  );
}
