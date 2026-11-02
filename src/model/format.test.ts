import { describe, expect, it } from "vitest";
import { parseBoard, serialize, toBoardFile } from "./format";
import { sampleEdges, sampleNodes } from "./sample";

describe("board.json", () => {
  it("round-trips the sample board", () => {
    const text = serialize({ nodes: sampleNodes, edges: sampleEdges });
    const back = parseBoard(text)!;
    expect(back.nodes.map((n) => [n.id, n.type])).toEqual(sampleNodes.map((n) => [n.id, n.type]));
    expect(back.edges.map((e) => [e.source, e.target])).toEqual(sampleEdges.map((e) => [e.source, e.target]));
    expect(serialize(back)).toBe(text);
  });

  it("stores project files by path and shows them through the resolver", () => {
    const board = {
      nodes: [
        {
          id: "c",
          type: "card",
          position: { x: 1.234, y: 5 },
          data: { item: { id: "i", kind: "image" as const, file: "media/a.jpg", src: "asset://x/media/a.jpg" } },
        },
      ],
      edges: [],
    };
    const file = toBoardFile(board);
    expect(file.nodes[0]).toEqual({ id: "c", x: 1.2, y: 5, type: "card", item: { id: "i", kind: "image", file: "media/a.jpg" } });
    const back = parseBoard(JSON.stringify(file), (f) => `shown:${f}`)!;
    expect((back.nodes[0].data as { item: { src: string } }).item.src).toBe("shown:media/a.jpg");
  });

  it("writes wire notes only when there is one", () => {
    const file = toBoardFile({ nodes: sampleNodes, edges: sampleEdges });
    expect(file.wires.find((w) => w.id === "e1")).toEqual({ id: "e1", from: "project", to: "note-founders" });
    expect(file.wires.find((w) => w.id === "e3")?.note).toBe("They like blue and white");
  });

  it("opens a hand-edited file with a broken entry, minus that entry", () => {
    const text = JSON.stringify({
      forma: 1,
      nodes: [{ id: "n", type: "note", x: 0, y: 0, text: "hi" }, { type: "note" }, null],
      wires: [{ id: "w", from: "n", to: "missing" }],
    });
    const board = parseBoard(text)!;
    expect(board.nodes).toHaveLength(1);
    expect(board.edges).toHaveLength(0);
  });

  it("round-trips notes and links, in stacks and on cards", () => {
    const board = {
      nodes: [
        {
          id: "s",
          type: "stack",
          position: { x: 0, y: 0 },
          data: {
            title: "Mixed",
            items: [
              { id: "i", kind: "image" as const, file: "media/a.jpg", src: "shown:media/a.jpg", w: 300, h: 200 },
              { id: "n", kind: "note" as const, text: "Founders call\n\nCalm." },
              { id: "l", kind: "link" as const, url: "https://are.na/", title: "Are.na" },
            ],
          },
        },
        { id: "c", type: "card", position: { x: 10, y: 0 }, data: { item: { id: "l2", kind: "link" as const, url: "https://linear.app/" } } },
      ],
      edges: [],
    };
    const file = toBoardFile(board);
    expect(file.nodes[0]).toMatchObject({
      items: [
        { id: "i", kind: "image", file: "media/a.jpg", w: 300, h: 200 },
        { id: "n", kind: "note", text: "Founders call\n\nCalm." },
        { id: "l", kind: "link", url: "https://are.na/", title: "Are.na" },
      ],
    });
    expect(file.nodes[1]).toEqual({ id: "c", x: 10, y: 0, type: "card", item: { id: "l2", kind: "link", url: "https://linear.app/" } });
    const text = JSON.stringify(file);
    const back = parseBoard(text, (f) => `shown:${f}`)!;
    expect(back.nodes).toEqual(board.nodes);
    expect(JSON.stringify(toBoardFile(back))).toBe(text);
  });

  it("skips items that are broken for their kind, and reads a card holding a note as a note", () => {
    const text = JSON.stringify({
      forma: 1,
      nodes: [
        {
          id: "s",
          type: "stack",
          x: 0,
          y: 0,
          title: "S",
          items: [{ id: "a", kind: "link" }, { id: "b", kind: "video" }, { id: "c", kind: "note" }],
        },
        { id: "k", type: "card", x: 0, y: 0, item: { id: "n", kind: "note", text: "hi" } },
      ],
      wires: [],
    });
    const board = parseBoard(text)!;
    expect((board.nodes[0].data as { items: unknown[] }).items).toEqual([{ id: "c", kind: "note", text: "" }]);
    expect(board.nodes[1]).toMatchObject({ id: "k", type: "note", data: { text: "hi" } });
  });

  it("rejects text that isn't a board", () => {
    expect(parseBoard("not json")).toBeNull();
    expect(parseBoard('{"hello": 1}')).toBeNull();
  });
});
