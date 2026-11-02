import type { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { applyDrop, moveWires, reorderStack, takeOut } from "./operations";

const item = (id: string) => ({ id, kind: "image" as const });
const card = (id: string, x = 0): Node => ({ id, type: "card", position: { x, y: 0 }, data: { item: item(id) } });
const stack = (id: string, ids: string[]): Node => ({
  id,
  type: "stack",
  position: { x: 0, y: 0 },
  data: { title: id, items: ids.map(item) },
});
const wire = (id: string, source: string, target: string): Edge => ({ id, source, target });

describe("applyDrop", () => {
  it("moves a card into a stack and keeps its wires on the stack", () => {
    const g = {
      nodes: [card("c1"), stack("s1", ["a"]), card("p")],
      edges: [wire("w1", "p", "c1")],
    };
    const out = applyDrop(g, "c1", { type: "add-to-stack", stackId: "s1" });
    expect(out.nodes.map((n) => n.id)).toEqual(["s1", "p"]);
    expect((out.nodes[0].data as { items: unknown[] }).items).toHaveLength(2);
    expect(out.edges).toEqual([{ id: "w1", source: "p", target: "s1" }]);
  });

  it("turns two cards into a new stack where the target was", () => {
    const g = { nodes: [card("c1"), card("c2", 300)], edges: [] };
    const out = applyDrop(g, "c1", { type: "new-stack", withCardId: "c2" });
    expect(out.nodes).toHaveLength(1);
    expect(out.nodes[0].type).toBe("stack");
    expect(out.nodes[0].position).toEqual({ x: 300, y: 0 });
  });
});

describe("moveWires", () => {
  it("drops loops and duplicates", () => {
    const edges = [wire("a", "x", "c1"), wire("b", "x", "s1"), wire("c", "c1", "s1")];
    expect(moveWires(edges, ["c1"], "s1").map((e) => e.id)).toEqual(["a"]);
  });
});

describe("reorderStack", () => {
  const ids = (g: { nodes: Node[] }) => (g.nodes[0].data as { items: { id: string }[] }).items.map((i) => i.id);

  it("applies the new order", () => {
    const g = { nodes: [stack("s1", ["a", "b", "c"])], edges: [] };
    expect(ids(reorderStack(g, "s1", ["c", "a", "b"]))).toEqual(["c", "a", "b"]);
  });

  it("never loses an item left out of the list", () => {
    const g = { nodes: [stack("s1", ["a", "b", "c"])], edges: [] };
    expect(ids(reorderStack(g, "s1", ["c", "x", "a"]))).toEqual(["b", "c", "a"]);
  });
});

describe("takeOut", () => {
  it("puts the item beside the stack", () => {
    const g = { nodes: [stack("s1", ["a", "b"])], edges: [] };
    const out = takeOut(g, "s1", "a", { x: 10, y: 20 });
    expect(out.nodes).toHaveLength(2);
    expect(out.nodes[1].position).toEqual({ x: 10, y: 20 });
  });

  it("removes a stack that ends up empty, with its wires", () => {
    const g = { nodes: [stack("s1", ["a"]), card("p")], edges: [wire("w", "p", "s1")] };
    const out = takeOut(g, "s1", "a", { x: 0, y: 0 });
    expect(out.nodes.map((n) => n.type)).toEqual(["card", "card"]);
    expect(out.edges).toEqual([]);
  });
});
