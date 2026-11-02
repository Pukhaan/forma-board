// The board kept in a project folder on disk (the Mac app).
//
//   <project>/board.json   the board (see FORMAT.md)
//   <project>/media/       images
//
// Writes go to a temporary file first and are then renamed into place, so
// nothing (an AI, an editor, a crash) ever sees half a board. Changes made
// outside the app are picked up and shown live.

import { convertFileSrc } from "@tauri-apps/api/core";
import { exists, mkdir, readTextFile, rename, watch, writeFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { parseBoard, serialize, type Board } from "../model/format";
import { newId } from "../model/operations";
import type { Item } from "../model/types";
import { imageSize, titleFromName, type BoardStore } from "./types";

export const BOARD_FILE = "board.json";
export const MEDIA_DIR = "media";

export const join = (...parts: string[]) => parts.join("/").replace(/\/+/g, "/");
export const folderName = (root: string) => root.replace(/\/+$/, "").split("/").pop() || "Project";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/svg+xml": "svg",
};

function extensionOf(file: File) {
  const fromName = file.name.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  return fromName ?? EXT[file.type] ?? "jpg";
}

/** A brand-new board: just the project, named after its folder. */
export function emptyBoard(root: string): Board {
  return {
    nodes: [
      {
        id: "project",
        type: "project",
        position: { x: -170, y: -80 },
        data: { title: folderName(root), brief: "What is this project? Double-click a note to start writing." },
      },
    ],
    edges: [],
  };
}

export function folderStore(root: string): BoardStore {
  const boardPath = join(root, BOARD_FILE);
  // Not a dotfile: the app's file permissions ($HOME/**) don't match hidden
  // names, so a ".board.json.tmp" write was refused and nothing ever saved.
  const tmpPath = join(root, `${BOARD_FILE}.saving`);
  const resolve = (file: string) => convertFileSrc(join(root, file));

  // The last text we wrote or read. Lets us skip writes that change nothing
  // and ignore our own writes when the folder watcher reports them.
  let known = "";
  let timer: number | undefined;
  let pending: Board | null = null;
  let writing: Promise<void> = Promise.resolve();

  const write = async (board: Board) => {
    const text = serialize(board);
    if (text === known) return;
    known = text;
    await writeTextFile(tmpPath, text);
    await rename(tmpPath, boardPath);
  };

  const flush = () => {
    if (!pending) return;
    const board = pending;
    pending = null;
    writing = writing.then(() => write(board)).catch((e) => {
      // Forget what we think is on disk, so the next change retries the write.
      known = "";
      console.error("Could not save the board", e);
    });
  };

  window.addEventListener("beforeunload", flush);

  return {
    name: folderName(root),
    root,
    async load() {
      if (await exists(boardPath)) {
        const text = await readTextFile(boardPath);
        const board = parseBoard(text, resolve);
        if (board) {
          known = text;
          return board;
        }
        throw new Error(`${BOARD_FILE} in ${folderName(root)} isn't a board this version of Forma can read.`);
      }
      const board = emptyBoard(root);
      await write(board);
      return board;
    },
    save(board) {
      pending = board;
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, 300);
    },
    async importImage(file): Promise<Item> {
      const id = newId("item");
      const name = `${id}.${extensionOf(file)}`;
      await mkdir(join(root, MEDIA_DIR), { recursive: true });
      const [bytes, size] = await Promise.all([file.arrayBuffer(), imageSize(file)]);
      await writeFile(join(root, MEDIA_DIR, name), new Uint8Array(bytes));
      const rel = join(MEDIA_DIR, name);
      return { id, kind: "image", file: rel, src: resolve(rel), ...size, title: titleFromName(file.name) };
    },
    watch(onChange) {
      let stop: (() => void) | null = null;
      let cancelled = false;
      watch(
        root,
        async (event) => {
          if (!event.paths.some((p) => p.endsWith(`/${BOARD_FILE}`))) return;
          try {
            const text = await readTextFile(boardPath);
            if (text === known) return;
            const board = parseBoard(text, resolve);
            // A half-written or broken file from someone else: wait for the next change.
            if (!board) return;
            known = text;
            onChange(board);
          } catch {
            // The file is mid-replace; the next event will catch it.
          }
        },
        { delayMs: 150 },
      )
        .then((unwatch) => {
          if (cancelled) unwatch();
          else stop = unwatch;
        })
        .catch((e) => console.error("Could not watch the project folder", e));
      return () => {
        cancelled = true;
        stop?.();
      };
    },
  };
}

/**
 * Makes the sample project in a folder: copies the sample images into media/
 * and writes a board that points at them. Used by "Try the sample".
 */
export async function seedSample(root: string, sample: Board) {
  await mkdir(join(root, MEDIA_DIR), { recursive: true });
  const copied = new Map<string, string>();
  const copy = async (src: string | undefined) => {
    if (!src?.startsWith("/sample/")) return undefined;
    const cached = copied.get(src);
    if (cached) return cached;
    const name = src.split("/").pop()!;
    const rel = join(MEDIA_DIR, name);
    const res = await fetch(src);
    if (!res.ok) return undefined;
    await writeFile(join(root, rel), new Uint8Array(await res.arrayBuffer()));
    copied.set(src, rel);
    return rel;
  };
  const withFile = async (item: Item) => {
    const file = await copy(item.src);
    return file ? { ...item, file } : item;
  };
  const nodes = await Promise.all(
    sample.nodes.map(async (n) => {
      const d = n.data as { items?: Item[]; item?: Item };
      if (d.items) return { ...n, data: { ...d, items: await Promise.all(d.items.map(withFile)) } };
      if (d.item) return { ...n, data: { ...d, item: await withFile(d.item) } };
      return n;
    }),
  );
  await writeTextFile(join(root, BOARD_FILE), serialize({ nodes, edges: sample.edges }));
}
