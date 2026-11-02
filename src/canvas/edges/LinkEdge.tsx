import {
  EdgeLabelRenderer,
  useInternalNode,
  useReactFlow,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { useState } from "react";
import { wireEnds, wireFade, wirePath } from "../../model/geometry";
import type { LinkData } from "../../model/types";
import { bodyOf } from "../body";
import { useCanvasUi } from "../context";
import { useLabelZoom } from "../zoom";

type LinkEdgeType = Edge<LinkData, "link">;

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
  // The zoom titles are drawn for. It only changes when a zoom comes to rest,
  // so wires re-render once then, never on every frame of a zoom.
  const zoom = useLabelZoom();
  if (!a || !b) return null;

  // Ends on the things themselves (a stack's pile), and below any title.
  const [s, t] = wireEnds(bodyOf(a, zoom), bodyOf(b, zoom));
  const { path, mid } = wirePath(s, t);
  const fade = wireFade(s, t);
  const gradient = `wire-fade-${id}`;
  const note = data?.note;
  const hot = selected || hover;
  // The note shows as a white pill when the wire is hovered, selected or
  // being written on. At rest it is quiet grey text, and hidden zoomed out.
  const loud = hot || editing;

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
      {/* A thin line that fades in out of one thing and out into the other: no hard ends. */}
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1={s.x} y1={s.y} x2={t.x} y2={t.y}>
          <stop offset={0} className="wire-stop" data-hot={hot || undefined} stopOpacity={0} />
          <stop offset={fade.start} className="wire-stop" data-hot={hot || undefined} />
          <stop offset={fade.end} className="wire-stop" data-hot={hot || undefined} />
          <stop offset={1} className="wire-stop" data-hot={hot || undefined} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={path} className="wire" stroke={`url(#${gradient})`} data-hot={hot || undefined} />
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
          data-hot={loud || undefined}
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
            <button className="wire-note" onDoubleClick={() => setEditing(true)}>
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
