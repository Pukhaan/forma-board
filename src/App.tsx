import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import { inApp, lastProject, makeSample, pickFolder, rememberProject } from "./app/projects";
import { Welcome } from "./app/Welcome";
import { Canvas } from "./canvas/Canvas";
import { ProjectChip } from "./chrome/ProjectChip";
import type { Board } from "./model/format";
import { browserStore } from "./store/browser";
import { folderStore } from "./store/folder";
import type { BoardStore } from "./store/types";

type Opened = { store: BoardStore; board: Board };

export default function App() {
  const [opened, setOpened] = useState<Opened | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(inApp);

  const openStore = useCallback(async (store: BoardStore) => {
    setBusy(true);
    setError(null);
    try {
      const board = await store.load();
      setOpened({ store, board });
      if (store.root) rememberProject(store.root);
    } catch (e) {
      rememberProject(null);
      setError(e instanceof Error ? e.message : `Couldn't open ${store.name}.`);
    } finally {
      setBusy(false);
    }
  }, []);

  // Start where you left off: the last project in the app, the browser board otherwise.
  useEffect(() => {
    if (!inApp) {
      void openStore(browserStore());
      return;
    }
    const last = lastProject();
    if (last) void openStore(folderStore(last));
    else setBusy(false);
  }, [openStore]);

  const openFolder = useCallback(async () => {
    const root = await pickFolder("Choose a project folder");
    if (root) await openStore(folderStore(root));
  }, [openStore]);

  const openSample = useCallback(async () => {
    setBusy(true);
    try {
      await openStore(folderStore(await makeSample()));
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Couldn't make the sample project.");
    }
  }, [openStore]);

  const close = useCallback(() => {
    rememberProject(null);
    setOpened(null);
  }, []);

  return (
    <ReactFlowProvider>
      {/* The window's title bar is hidden; this strip keeps it draggable. */}
      <div className="titlebar" data-tauri-drag-region />
      {opened ? (
        <>
          {/* Keyed by folder, so switching projects starts a fresh board (and undo history). */}
          <Canvas key={opened.store.root ?? "browser"} store={opened.store} initial={opened.board} />
          <ProjectChip
            name={opened.store.name}
            root={opened.store.root}
            onSwitch={openFolder}
            onOpen={(root) => void openStore(folderStore(root))}
            onClose={close}
          />
        </>
      ) : (
        inApp && <Welcome error={error} busy={busy} onOpen={openFolder} onSample={openSample} />
      )}
    </ReactFlowProvider>
  );
}
