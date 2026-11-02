import type { Node, NodeProps } from "@xyflow/react";
import type { ProjectData } from "../../model/types";
import { Ports } from "./Ports";

type ProjectNodeType = Node<ProjectData, "project">;

/** The centre of the board. Everything else connects back to it. */
export function ProjectNode({ data, selected }: NodeProps<ProjectNodeType>) {
  return (
    <div className="project" data-selected={selected || undefined}>
      <div className="project-kicker">Project</div>
      <div className="project-title">{data.title}</div>
      <p className="project-brief">{data.brief}</p>
      <Ports />
    </div>
  );
}
