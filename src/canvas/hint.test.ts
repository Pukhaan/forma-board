import type { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { HINT, onlyProject, withBoard } from "./hint";

const at = { x: 0, y: 0 };

describe("the empty board's hint", () => {
  it("shows only while the board is its project alone", () => {
    const project: Node = { id: "project", type: "project", position: at, data: {} };
    expect(onlyProject([project])).toBe(true);
    expect(onlyProject([project, { id: "n", type: "note", position: at, data: { text: "" } }])).toBe(false);
    expect(onlyProject([])).toBe(false);
  });

  it("remembers boards past it, the latest first, a few hundred at most", () => {
    expect(withBoard(["/a", "/b"], "/b")).toEqual(["/b", "/a"]);
    expect(withBoard(["/a", "/b"], "/c", 2)).toEqual(["/c", "/a"]);
  });

  it("says it in a short, plain line", () => {
    expect(HINT).not.toMatch(/—/);
    expect(HINT.split(" ").length).toBeLessThan(12);
  });
});
