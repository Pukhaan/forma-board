import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./canvas/Canvas";

export default function App() {
  return (
    <ReactFlowProvider>
      {/* The window's title bar is hidden; this strip keeps it draggable. */}
      <div className="titlebar" data-tauri-drag-region />
      <Canvas />
    </ReactFlowProvider>
  );
}
