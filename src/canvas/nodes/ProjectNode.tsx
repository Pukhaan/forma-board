import type { Node, NodeProps } from "@xyflow/react";
import type { ProjectData } from "../../model/types";
import { useZoomVar } from "../zoom";
import { Ports } from "./Ports";

type ProjectNodeType = Node<ProjectData, "project">;

/** The centre of the board. Everything else connects back to it. */
export function ProjectNode({ data, selected }: NodeProps<ProjectNodeType>) {
  useZoomVar();
  return (
    <div className="project" data-selected={selected || undefined}>
      <div className="project-kicker">Project</div>
      {/* Grows when zoomed out; the hidden copy keeps the block's size. */}
      <div className="project-title">{data.title}</div>
      <div className="project-title-size" aria-hidden>
        {data.title}
      </div>
      <p className="project-brief">{data.brief}</p>
      <Ports />
    </div>
  );
}
