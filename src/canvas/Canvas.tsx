import {
  addEdge,
  ConnectionMode,
  ReactFlow,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type OnConnect,
  type OnConnectEnd,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { newId, takeOut } from "../model/operations";
import type { StackData } from "../model/types";
import { Toolbar, type Tool } from "../chrome/Toolbar";
import { ZoomPill } from "../chrome/ZoomPill";
import { FocusView } from "../focus/FocusView";
import { CanvasUiContext } from "./context";
import { DotGrid } from "./DotGrid";
import { ConnectionLine } from "./edges/ConnectionLine";
import { LinkEdge } from "./edges/LinkEdge";
import { CardNode } from "./nodes/CardNode";
import { NoteNode } from "./nodes/NoteNode";
import { ProjectNode } from "./nodes/ProjectNode";
import { StackNode } from "./nodes/StackNode";
import { loadBoard, saveBoard } from "./persist";
import { useStacking } from "./useStacking";
import { useUndo } from "./useUndo";

const nodeTypes = { project: ProjectNode, stack: StackNode, card: CardNode, note: NoteNode };
const edgeTypes = { link: LinkEdge };
const initial = loadBoard();

function linkEdge(source: string, target: string): Edge {
  return { id: newId("wire"), source, target, type: "link", data: {} };
}

/** True when a wire between these two already exists, either way round. */
function connected(edges: Edge[], a: string, b: string) {
  return edges.some((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a));
}

export function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { dropTargetId, onNodeDrag, onNodeDragStop } = useStacking();
  const { commit } = useUndo();
  const [tool, setTool] = useState<Tool>("select");
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => saveBoard(nodes, edges), [nodes, edges]);

  const onConnect: OnConnect = useCallback(
    (c) => {
      if (c.source === c.target) return;
      commit();
      setEdges((es) => (connected(es, c.source, c.target) ? es : addEdge(linkEdge(c.source, c.target), es)));
    },
    [commit, setEdges],
  );

  // Let a wire land anywhere on a thing, not only on one of its ports.
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, state) => {
      if (state.isValid || !state.fromNode) return;
      const point = "changedTouches" in event ? event.changedTouches[0] : event;
      const el = document.elementFromPoint(point.clientX, point.clientY)?.closest(".react-flow__node");
      const to = el?.getAttribute("data-id");
      const from = state.fromNode.id;
      if (!to || to === from) return;
      commit();
      setEdges((es) => (connected(es, from, to) ? es : [...es, linkEdge(from, to)]));
    },
    [commit, setEdges],
  );

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    if (node.type === "stack") setFocusId(node.id);
  }, []);

  const centre = useCallback(
    () => screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
    [screenToFlowPosition],
  );

  const addNote = useCallback(() => {
    const p = centre();
    commit();
    setNodes((ns) => [
      ...ns.map((n) => ({ ...n, selected: false })),
      { id: newId("note"), type: "note", position: { x: p.x - 130, y: p.y - 60 }, selected: true, data: { text: "New note\n\nDouble-click to write." } },
    ]);
  }, [centre, commit, setNodes]);

  const addImages = useCallback(
    (files: { src: string; w: number; h: number; title: string }[]) => {
      const p = centre();
      commit();
      setNodes((ns) => [
        ...ns,
        ...files.map((f, i) => ({
          id: newId("card"),
          type: "card",
          position: { x: p.x - 90 + i * 28, y: p.y - 90 + i * 22 },
          data: { item: { id: newId("item"), kind: "image" as const, src: f.src, w: f.w, h: f.h, title: f.title } },
        })),
      ]);
    },
    [centre, commit, setNodes],
  );

  const focused = nodes.find((n) => n.id === focusId && n.type === "stack");

  const onTakeOut = useCallback(
    (itemId: string) => {
      if (!focused) return;
      const at = { x: focused.position.x + 260, y: focused.position.y + 40 };
      commit();
      const next = takeOut({ nodes, edges }, focused.id, itemId, at);
      setNodes(next.nodes);
      setEdges(next.edges);
      if (!next.nodes.some((n) => n.id === focused.id)) setFocusId(null);
    },
    [commit, edges, focused, nodes, setEdges, setNodes],
  );

  const ui = useMemo(() => ({ dropTargetId, commit }), [dropTargetId, commit]);

  return (
    <CanvasUiContext.Provider value={ui}>
      <div className="board" data-tool={tool}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          onNodeDragStart={commit}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onBeforeDelete={async () => {
            commit();
            return true;
          }}
          connectionMode={ConnectionMode.Loose}
          connectionLineComponent={ConnectionLine}
          connectionRadius={40}
          defaultEdgeOptions={{ type: "link" }}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          panOnDrag={tool === "hand" ? true : [1]}
          selectionOnDrag={tool === "select"}
          selectionMode={SelectionMode.Partial}
          nodeDragThreshold={3}
          minZoom={0.1}
          maxZoom={4}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          proOptions={{ hideAttribution: true }}
        >
          <DotGrid />
        </ReactFlow>
        <Toolbar tool={tool} onTool={setTool} onNote={addNote} onImages={addImages} onFit={() => fitView({ padding: 0.18, duration: 500 })} />
        <ZoomPill />
        <FocusView
          stack={focused ? { id: focused.id, ...(focused.data as StackData) } : null}
          onClose={() => setFocusId(null)}
          onTakeOut={onTakeOut}
        />
      </div>
    </CanvasUiContext.Provider>
  );
}
