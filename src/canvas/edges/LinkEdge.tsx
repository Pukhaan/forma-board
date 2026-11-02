import {
  EdgeLabelRenderer,
  useInternalNode,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type InternalNode,
} from "@xyflow/react";
import { useState } from "react";
import { wireEnds, wirePath } from "../../model/geometry";
import type { LinkData } from "../../model/types";
import { useCanvasUi } from "../context";

type LinkEdgeType = Edge<LinkData, "link">;

function rectOf(n: InternalNode) {
  const { x, y } = n.internals.positionAbsolute;
  return { x, y, w: n.measured.width ?? 0, h: n.measured.height ?? 0 };
}

/**
 * A wire between two things. It always runs between the sides that face each
 * other. A note can sit on it (double-click the wire or the note to edit).
 */
export function LinkEdge({ id, source, target, data, selected }: EdgeProps<LinkEdgeType>) {
  const a = useInternalNode(source);
  const b = useInternalNode(target);
  const { updateEdgeData } = useReactFlow();
  const { commit } = useCanvasUi();
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  if (!a || !b) return null;

  const [s, t] = wireEnds(rectOf(a), rectOf(b));
  const { path, mid } = wirePath(s, t);
  const note = data?.note;
  const hot = selected || hover;

  const save = (value: string) => {
    const next = value.trim() || undefined;
    if (next !== note) {
      commit();
      updateEdgeData(id, { note: next });
    }
    setEditing(false);
  };

  return (
    <>
      <path d={path} className="wire" data-hot={hot || undefined} />
      <circle cx={s.x} cy={s.y} r={2.5} className="wire-end" data-hot={hot || undefined} />
      <circle cx={t.x} cy={t.y} r={2.5} className="wire-end" data-hot={hot || undefined} />
      <path
        d={path}
        className="wire-hit"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDoubleClick={() => setEditing(true)}
      />
      <EdgeLabelRenderer>
        <div
          className="wire-label nodrag nopan"
          style={{ transform: `translate(-50%, -50%) translate(${mid.x}px, ${mid.y}px)` }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {editing ? (
            <input
              className="wire-input"
              autoFocus
              defaultValue={note ?? ""}
              placeholder="Why are these connected?"
              onBlur={(e) => save(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
              }}
            />
          ) : note ? (
            <button className="wire-note" data-hot={hot || undefined} onDoubleClick={() => setEditing(true)}>
              {note}
            </button>
          ) : (
            <button
              className="wire-add"
              data-show={hover || undefined}
              aria-label="Add a note to this connection"
              onClick={() => setEditing(true)}
            >
              +
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
