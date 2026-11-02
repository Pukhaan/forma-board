import { useReactFlow, type Node } from "@xyflow/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { fromPastedText } from "../model/items";
import { newId, nodeFromItem } from "../model/operations";
import { typing } from "./useUndo";

type Options = {
  /** Off while a stack is open, so nothing lands on the board behind it. */
  enabled: boolean;
  /** The middle of the view, in board units. */
  centre: () => { x: number; y: number };
  commit: () => void;
  /** Images go through the store, which copies them into the project. */
  onImages: (files: File[]) => void;
};

/** The text on the clipboard: plain text, or the first address of a link list. */
function clipboardText(data: DataTransfer) {
  const plain = data.getData("text/plain");
  if (plain.trim()) return plain;
  return data.getData("text/uri-list").split(/\r?\n/).find((l) => l && !l.startsWith("#")) ?? "";
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
      setNodes((ns) => [...ns.map((n) => (n.selected ? { ...n, selected: false } : n)), { ...node, selected: true }]);
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
      const images = Array.from(data.files).filter((f) => f.type.startsWith("image/"));
      if (images.length) {
        e.preventDefault();
        onImages(images);
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
