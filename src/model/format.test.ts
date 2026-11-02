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

  it("rejects text that isn't a board", () => {
    expect(parseBoard("not json")).toBeNull();
    expect(parseBoard('{"hello": 1}')).toBeNull();
  });
});
