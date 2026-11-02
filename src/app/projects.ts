// Choosing and remembering project folders (Mac app only).

import { documentDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { sampleEdges, sampleNodes } from "../model/sample";
import { BOARD_FILE, join, seedSample } from "../store/folder";

const LAST = "weft.lastProject";

export const inApp = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function lastProject(): string | null {
  try {
    return localStorage.getItem(LAST);
  } catch {
    return null;
  }
}

export function rememberProject(root: string | null) {
  try {
    if (root) localStorage.setItem(LAST, root);
    else localStorage.removeItem(LAST);
  } catch {
    // Not remembered; the app just asks again next time.
  }
}

/** Asks for a folder. An empty one becomes a new project. */
export async function pickFolder(title: string): Promise<string | null> {
  const picked = await open({ directory: true, multiple: false, recursive: true, title });
  return typeof picked === "string" ? picked : null;
}

/** Where Weft keeps projects it makes for you: Documents/Weft. */
export async function projectsHome(): Promise<string> {
  return join(await documentDir(), "Weft");
}

/** Makes the sample project at Documents/Weft/Northwind (or reopens it) and returns its path. */
export async function makeSample(): Promise<string> {
  const root = join(await projectsHome(), "Northwind");
  if (await exists(join(root, BOARD_FILE))) return root;
  await mkdir(root, { recursive: true });
  await seedSample(root, { nodes: sampleNodes, edges: sampleEdges });
  return root;
}
