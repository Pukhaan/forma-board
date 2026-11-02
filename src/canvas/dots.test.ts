import { describe, expect, it } from "vitest";
import { axisDots, dotDiameter, followPan, snapSprite, SPACING, spriteSide } from "./dots";

describe("followPan", () => {
  it("starts the pattern from the board's position", () => {
    expect(followPan({ x: 0, y: 0 }, null, [70, -10, 1])).toEqual({ x: 70 - 2 * SPACING, y: SPACING - 10 });
  });

  it("slides the dots exactly as far as the board pans", () => {
    const o = followPan({ x: 5, y: 5 }, [100, 100, 0.8], [112, 95, 0.8]);
    expect(o).toEqual({ x: 17, y: 0 });
  });

  it("keeps the dots still while zooming, even when the view shifts to follow the fingers", () => {
    const start = { x: 7, y: 9 };
    let o = start;
    let prev: readonly [number, number, number] = [0, 0, 1];
    for (const next of [[-20, -14, 1.1], [-45, -30, 1.25], [-80, -52, 1.5]] as const) {
      o = followPan(o, prev, next);
      prev = next;
    }
    expect(o).toEqual(start);
  });

  it("stays within one spacing however far you pan", () => {
    const o = followPan({ x: 0, y: 0 }, [0, 0, 1], [10_000.5, -9_999.25, 1]);
    expect(o.x).toBeGreaterThanOrEqual(0);
    expect(o.x).toBeLessThan(SPACING);
    expect(o.y).toBeGreaterThanOrEqual(0);
    expect(o.y).toBeLessThan(SPACING);
  });
});

describe("axisDots", () => {
  it("covers the screen", () => {
    const { first, count } = axisDots(10, 50, 200);
    expect(first).toBe(0);
    expect(count).toBe(4);
  });

  it("includes dots just off screen when padded", () => {
    expect(axisDots(-130, 50, 200, 31).first).toBe(2);
  });
});

describe("pixel snapping", () => {
  it("rounds dots to whole device pixels", () => {
    expect(dotDiameter(2, 2)).toBe(4);
    expect(dotDiameter(1.5, 1)).toBe(2);
    expect(dotDiameter(0.2, 1)).toBe(1);
  });

  it("centres the dot on a pixel corner or centre to match its parity", () => {
    for (const d of [1, 2, 3, 4]) expect(spriteSide(d) % 2).toBe(d % 2);
  });

  it("places sprites on whole device pixels within half a pixel of the true spot", () => {
    for (const dpr of [1, 2, 3]) {
      for (const css of [0, 0.3, 10.25, 99.77, -12.6]) {
        const side = spriteSide(dotDiameter(2, dpr));
        const left = snapSprite(css, dpr, side);
        expect(Number.isInteger(left)).toBe(true);
        expect(Math.abs(left + side / 2 - css * dpr)).toBeLessThanOrEqual(0.5);
      }
    }
  });
});
