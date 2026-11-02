import { useReactFlow, useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import { useState, type CSSProperties } from "react";
import { hasNote } from "../../model/items";
import type { StackData } from "../../model/types";
import { PILE, titleWidth } from "../body";
import { useCanvasUi } from "../context";
import { useZoomVar } from "../zoom";
import { ItemFace } from "./Faces";
import { fitInBox } from "./fit";
import { Ports } from "./Ports";
import { countLabel } from "./stackKind";

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

/**
 * Each card's rest and fan pose as CSS custom properties. The transform is
 * composed in nodes.css and the fan is a plain CSS transition on prepared
 * layers: no animation JS, so the first hover is as smooth as the tenth.
 */
function pose(i: number): CSSProperties {
  if (i === 0) return { "--rs": 1, "--fs": 1.02, "--ts": 1.04 } as CSSProperties;
  const r = REST[i - 1];
  const f = FAN[i - 1];
  return {
    "--rx": `${r.x}px`,
    "--ry": `${r.y}px`,
    "--rr": `${r.rotate}deg`,
    "--fx": `${f.x}px`,
    "--fy": `${f.y}px`,
    "--fr": `${f.rotate}deg`,
  } as CSSProperties;
}

export function StackNode({ id, data, selected }: NodeProps<StackNodeType>) {
  const { dropTargetId, commit } = useCanvasUi();
  const { updateNodeData } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [renaming, setRenaming] = useState(false);
  useZoomVar();
  const isTarget = dropTargetId === id;
  // The last item is the cover; the three before it peek out underneath.
  const shown = data.items.slice(-4).reverse();

  return (
    <div
      className="stack"
      data-selected={selected || undefined}
      data-target={isTarget || undefined}
      // The bottom port sits under the title, which grows as you zoom out (see
      // body.ts). nodes.css places it from these; React Flow re-reads where it
      // is on hover, so a wire pulled from it starts at its "+".
      style={{ "--tw": Math.round(titleWidth(data.title)), "--desc": data.description ? 1 : 0 } as CSSProperties}
      onMouseEnter={() => updateNodeInternals(id)}
    >
      <div className="stack-pile" style={{ width: PILE, height: PILE }}>
        {shown
          .map((item, i) => {
            const size = fitInBox(item, BOX);
            return (
              <div
                key={item.id}
                className="stack-card"
                data-kind={item.kind}
                // Only the cover shows its note's paper corner: one is a
                // sign, three peeking at once is clutter.
                data-note={(i === 0 && hasNote(item)) || undefined}
                style={{ ...size, ...pose(i), zIndex: 10 - i }}
              >
                <ItemFace item={item} />
              </div>
            );
          })
          .reverse()}
      </div>
      {/* The label keeps one fixed row in the layout, so the node never changes
          size; what you see sits on top of it and grows when zoomed out. */}
      <div className="stack-label" data-desc={data.description ? true : undefined}>
        <div className="stack-label-in">
          <div className="stack-label-row">
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
            <span className="stack-count">{countLabel(data.items)}</span>
          </div>
          {data.description && <div className="stack-desc">{data.description}</div>}
        </div>
      </div>
      <Ports />
    </div>
  );
}
