import { useReactFlow, type Node } from "@xyflow/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { asUrl, fromPastedText } from "../model/items";
import { newId, nodeFromItem } from "../model/operations";
import { typing } from "./useUndo";
import { snapToDots } from "./dots";

type Options = {
  /** Off while a stack is open, so nothing lands on the board behind it. */
  enabled: boolean;
  /** The middle of the view, in board units. */
  centre: () => { x: number; y: number };
  commit: () => void;
  /** Images go through the store, which copies them into the project. `source` is the web address they came from, when the clipboard says. */
  onImages: (files: File[], source?: string) => void;
};

/** The text on the clipboard: plain text, or the first address of a link list. */
function clipboardText(data: DataTransfer) {
  const plain = data.getData("text/plain");
  if (plain.trim()) return plain;
  return data.getData("text/uri-list").split(/\r?\n/).find((l) => l && !l.startsWith("#")) ?? "";
}

/**
 * Where a pasted image came from, when it was copied off a web page: the
 * browser puts its address beside the picture, as a link or as the <img> in
 * the copied HTML.
 */
function imageSource(data: DataTransfer) {
  const listed = data.getData("text/uri-list").split(/\r?\n/).find((l) => l && !l.startsWith("#"));
  const fromHtml = /<img[^>]+src=["']([^"']+)["']/i.exec(data.getData("text/html"))?.[1];
  for (const candidate of [listed, fromHtml, data.getData("text/plain")]) {
    const url = candidate ? asUrl(candidate) : null;
    if (url) return url;
  }
  return undefined;
}

/**
 * ⌘V onto the board: an image becomes an image card, a web address a link
 * card, any other text a note. Each lands in the middle of the view, selected,
 * and ⌘Z takes it back. Text fields keep their own paste.
 */
export function usePaste(options: Options) {
  const { setNodes } = useReactFlow();
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const place = (node: Node) => {
      latest.current.commit();
      const placed = { ...node, position: snapToDots(node.position), selected: true };
      setNodes((ns) => [...ns.map((n) => (n.selected ? { ...n, selected: false } : n)), placed]);
    };

    // WebKit only offers Paste where something could take it; saying so here
    // lets ⌘V reach the board when no text field has focus.
    const onBeforePaste = (e: Event) => {
      if (latest.current.enabled && !typing(e)) e.preventDefault();
    };

    const onPaste = (e: ClipboardEvent) => {
      const { enabled, centre, onImages } = latest.current;
      const data = e.clipboardData;
      if (!enabled || !data || typing(e)) return;
      const images = Array.from(data.files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
      if (images.length) {
        e.preventDefault();
        onImages(images, imageSource(data));
        return;
      }
      const pasted = fromPastedText(clipboardText(data));
      if (!pasted) return;
      e.preventDefault();
      const p = centre();
      if (pasted.kind === "link") {
        // A link card is 200 by 141; centre it.
        place(nodeFromItem({ id: newId("item"), kind: "link", url: pasted.url }, { x: p.x - 100, y: p.y - 70 }));
      } else {
        place({ id: newId("note"), type: "note", position: { x: p.x - 130, y: p.y - 60 }, data: { text: pasted.text } });
      }
    };

    window.addEventListener("beforepaste", onBeforePaste);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("beforepaste", onBeforePaste);
      window.removeEventListener("paste", onPaste);
    };
  }, [setNodes]);
}
