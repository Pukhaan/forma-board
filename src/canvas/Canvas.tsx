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
import { newId, reorderStack, takeOut } from "../model/operations";
import type { Board } from "../model/format";
import type { StackData } from "../model/types";
import type { BoardStore } from "../store/types";
import { Toolbar, type Tool } from "../chrome/Toolbar";
import { ZoomPill } from "../chrome/ZoomPill";
import { FocusView } from "../focus/FocusView";
import { CanvasUiContext } from "./context";
import { DotGrid } from "./DotGrid";
import { hoverNode, leaveNode, trackPointer } from "./gridFx";
import { ConnectionLine } from "./edges/ConnectionLine";
import { LinkEdge } from "./edges/LinkEdge";
import { CardNode } from "./nodes/CardNode";
import { NoteNode } from "./nodes/NoteNode";
import { ProjectNode } from "./nodes/ProjectNode";
import { StackNode } from "./nodes/StackNode";
import { useStacking } from "./useStacking";
import { useUndo } from "./useUndo";

const nodeTypes = { project: ProjectNode, stack: StackNode, card: CardNode, note: NoteNode };
const edgeTypes = { link: LinkEdge };

function linkEdge(source: string, target: string): Edge {
  return { id: newId("wire"), source, target, type: "link", data: {} };
}

/** True when a wire between these two already exists, either way round. */
function connected(edges: Edge[], a: string, b: string) {
  return edges.some((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a));
}

type Props = { store: BoardStore; initial: Board };

export function Canvas({ store, initial }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { dropTargetId, onNodeDrag, onNodeDragStop } = useStacking();
  const { commit } = useUndo();
  const [tool, setTool] = useState<Tool>("select");
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => store.save({ nodes, edges }), [store, nodes, edges]);

  // Someone else changed the board (an AI, an editor): show it, and let ⌘Z take it back.
  useEffect(
    () =>
      store.watch((board) => {
        commit();
        setNodes(board.nodes);
        setEdges(board.edges);
      }),
    [store, commit, setNodes, setEdges],
  );

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

  // Clicking a stack opens it. It doesn't select it, so nothing is left
  // highlighted when you close it again.
  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type !== "stack") return;
      setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)));
      setFocusId(node.id);
    },
    [setNodes],
  );

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
    async (files: File[]) => {
      const p = centre();
      const read = await Promise.allSettled(files.map((f) => store.importImage(f)));
      const items = read.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      if (!items.length) return;
      commit();
      setNodes((ns) => [
        ...ns,
        ...items.map((item, i) => ({
          id: newId("card"),
          type: "card",
          position: { x: p.x - 90 + i * 28, y: p.y - 90 + i * 22 },
          data: { item },
        })),
      ]);
    },
    [centre, commit, setNodes, store],
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

  const onReorder = useCallback(
    (itemIds: string[]) => {
      if (!focusId) return;
      commit();
      setNodes((ns) => reorderStack({ nodes: ns, edges: [] }, focusId, itemIds).nodes);
    },
    [commit, focusId, setNodes],
  );

  const ui = useMemo(() => ({ dropTargetId, commit }), [dropTargetId, commit]);

  return (
    <CanvasUiContext.Provider value={ui}>
      <div className="board" data-tool={tool} onPointerMove={trackPointer}>
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
          onNodeMouseEnter={hoverNode}
          onNodeMouseLeave={leaveNode}
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
          onReorder={onReorder}
        />
      </div>
    </CanvasUiContext.Provider>
  );
}
