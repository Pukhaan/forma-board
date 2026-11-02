import { describe, expect, it } from "vitest";
import { anchorOn, wireEnds, wireFade, wirePath } from "./geometry";

const r = { x: 0, y: 0, w: 200, h: 100 };

describe("anchorOn", () => {
  it("leaves from the side facing the other end", () => {
    expect(anchorOn(r, { x: 600, y: 50 }).side).toBe("right");
    expect(anchorOn(r, { x: -600, y: 50 }).side).toBe("left");
    expect(anchorOn(r, { x: 100, y: 600 }).side).toBe("bottom");
    expect(anchorOn(r, { x: 100, y: -600 }).side).toBe("top");
  });

  it("sits just outside the edge", () => {
    const a = anchorOn(r, { x: 600, y: 50 });
    expect(a.x).toBeGreaterThan(200);
    expect(a.y).toBe(50);
  });

  it("keeps the end off the rounded corners", () => {
    const a = anchorOn(r, { x: 600, y: 2000 });
    expect(a.x).toBeLessThanOrEqual(188);
    expect(a.x).toBeGreaterThanOrEqual(12);
  });
});

describe("wireEnds", () => {
  it("faces the two rects toward each other", () => {
    const [a, b] = wireEnds(r, { x: 500, y: 0, w: 200, h: 100 });
    expect(a.side).toBe("right");
    expect(b.side).toBe("left");
  });
});

describe("wirePath", () => {
  it("puts the midpoint between the ends of a straight wire", () => {
    const { mid, path } = wirePath(
      { x: 0, y: 0, side: "right" },
      { x: 400, y: 0, side: "left" },
    );
    expect(mid).toEqual({ x: 200, y: 0 });
    expect(path.startsWith("M 0 0 C")).toBe(true);
  });
});

describe("wireFade", () => {
  it("fades over a fixed distance on a long wire", () => {
    const f = wireFade({ x: 0, y: 0 }, { x: 400, y: 0 }, 40);
    expect(f.start).toBeCloseTo(0.1);
    expect(f.end).toBeCloseTo(0.9);
  });

  it("never fades away a short wire", () => {
    const f = wireFade({ x: 0, y: 0 }, { x: 60, y: 0 }, 40);
    expect(f.start).toBeCloseTo(1 / 3);
    expect(f.end).toBeCloseTo(2 / 3);
  });
});
