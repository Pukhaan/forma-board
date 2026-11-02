import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { useState, type KeyboardEvent } from "react";
import type { ProjectData } from "../../model/types";
import { addWorkingFile, workingFileName } from "../../model/workfiles";
import { useCanvasUi } from "../context";
import { openLink } from "../openLink";
import { useZoomVar } from "../zoom";
import { Favicon } from "./Faces";
import { Ports } from "./Ports";

type ProjectNodeType = Node<ProjectData, "project">;

/** The centre of the board. Everything else connects back to it. */
export function ProjectNode({ id, data, selected }: NodeProps<ProjectNodeType>) {
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
      <WorkingFiles id={id} links={data.links ?? []} />
      <Ports />
    </div>
  );
}

/**
 * The links you work in, on the project itself: the Figma file, the repo, the
 * site. Each opens with a click. Hover the project to add one (paste a link)
 * or take one off.
 */
function WorkingFiles({ id, links }: { id: string; links: string[] }) {
  const { updateNodeData } = useReactFlow();
  const { commit } = useCanvasUi();
  const [adding, setAdding] = useState(false);

  const save = (next: string[]) => {
    if (next === links) return;
    commit();
    updateNodeData(id, { links: next.length ? next : undefined });
  };
  const add = (text: string) => {
    save(addWorkingFile(links, text));
    setAdding(false);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") add(e.currentTarget.value);
    else if (e.key === "Escape") setAdding(false);
  };

  return (
    <div className="project-files nodrag" data-empty={links.length || adding ? undefined : true} onClick={(e) => e.stopPropagation()}>
      {links.map((url) => (
        <span key={url} className="project-file">
          <button className="project-file-open" title={url} onClick={() => openLink(url)}>
            <Favicon url={url} />
            <span className="project-file-name">{workingFileName(url)}</span>
          </button>
          <button
            className="project-file-remove"
            aria-label={`Take ${workingFileName(url)} off the project`}
            onClick={() => save(links.filter((l) => l !== url))}
          >
            <svg viewBox="0 0 10 10" aria-hidden>
              <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
            </svg>
          </button>
        </span>
      ))}
      {adding ? (
        <input
          className="project-file-input"
          autoFocus
          placeholder="Paste a Figma, GitHub or site link"
          onKeyDown={onKeyDown}
          onBlur={(e) => add(e.currentTarget.value)}
        />
      ) : (
        <button className="project-file-add" aria-label="Add a working file" onClick={() => setAdding(true)}>
          <svg viewBox="0 0 10 10" aria-hidden>
            <path d="M5 1.5v7M1.5 5h7" />
          </svg>
        </button>
      )}
    </div>
  );
}
