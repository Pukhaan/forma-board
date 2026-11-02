import { describe, expect, it } from "vitest";
import { pushItems, resolveDrop } from "./stacking";

const box = (x: number, y: number, w = 100, h = 100) => ({ x, y, w, h });

describe("resolveDrop", () => {
  const stack = { id: "s1", type: "stack", rect: box(0, 0, 200, 200) };
  const card = { id: "c2", type: "card", rect: box(400, 0) };

  it("adds a card to the stack its centre lands on", () => {
    const dragged = { id: "c1", type: "card", rect: box(60, 60) };
    expect(resolveDrop(dragged, [stack, card])).toEqual({
      type: "add-to-stack",
      stackId: "s1",
    });
  });

  it("ignores a light overlap", () => {
    const dragged = { id: "c1", type: "card", rect: box(180, 180) };
    expect(resolveDrop(dragged, [stack])).toEqual({ type: "none" });
  });

  it("makes a new stack from two cards", () => {
    const dragged = { id: "c1", type: "card", rect: box(420, 20) };
    expect(resolveDrop(dragged, [stack, card])).toEqual({
      type: "new-stack",
      withCardId: "c2",
    });
  });

  it("merges a stack dropped on a stack", () => {
    const dragged = { id: "s2", type: "stack", rect: box(50, 50) };
    expect(resolveDrop(dragged, [stack])).toEqual({
      type: "merge-stacks",
      stackId: "s1",
    });
  });

  it("never stacks onto notes or the project", () => {
    const note = { id: "n1", type: "note", rect: box(0, 0, 300, 300) };
    const dragged = { id: "c1", type: "card", rect: box(50, 50) };
    expect(resolveDrop(dragged, [note])).toEqual({ type: "none" });
  });

  it("prefers the target drawn on top", () => {
    const under = { id: "s0", type: "stack", rect: box(0, 0, 300, 300) };
    const dragged = { id: "c1", type: "card", rect: box(60, 60) };
    expect(resolveDrop(dragged, [under, stack])).toEqual({
      type: "add-to-stack",
      stackId: "s1",
    });
  });
});

describe("pushItems", () => {
  it("appends without duplicates", () => {
    const a = { id: "a", kind: "image" as const };
    const b = { id: "b", kind: "image" as const };
    expect(pushItems([a], [a, b]).map((i) => i.id)).toEqual(["a", "b"]);
  });
});
