import { describe, expect, it } from "vitest";
import {
  axisDots,
  dotDiameter,
  dotLevels,
  FADE_FROM,
  FADE_TO,
  GRID,
  isCoarse,
  snapSprite,
  spriteSide,
} from "./dots";

/** What a dot at global indices (i, j) looks like at a zoom: board position and strength. */
const dot = (zoom: number, i: number, j: number) => {
  const { spacing, between } = dotLevels(zoom);
  const step = spacing / zoom;
  return { x: i * step, y: j * step, alpha: isCoarse(i, j) ? 1 : between };
};

describe("dotLevels", () => {
  it("keeps the finest level within one doubling on screen, at any zoom", () => {
    for (let zoom = 0.1; zoom <= 4; zoom *= 1.037) {
      const { spacing, between } = dotLevels(zoom);
      expect(spacing).toBeGreaterThanOrEqual(FADE_FROM);
      expect(spacing).toBeLessThan(FADE_FROM * 2);
      expect(between).toBeGreaterThanOrEqual(0);
      expect(between).toBeLessThanOrEqual(1);
    }
  });

  it("puts dots only on the board grid", () => {
    for (const zoom of [0.1, 0.33, 1, 1.7, 4]) {
      const step = dotLevels(zoom).spacing / zoom;
      const power = Math.log2(step / GRID);
      expect(power).toBeCloseTo(Math.round(power), 9);
    }
  });

  it("is one even field outside the fade band", () => {
    expect(dotLevels(FADE_FROM * 1.01, 1).between).toBeLessThan(0.01);
    expect(dotLevels(FADE_TO, 1).between).toBe(1);
    expect(dotLevels(FADE_FROM * 1.99, 1).between).toBe(1);
  });

  it("fades the in-between dots in steadily as you zoom in", () => {
    let prev = -1;
    for (let s = FADE_FROM; s <= FADE_TO; s += 0.5) {
      const { between } = dotLevels(s, 1);
      expect(between).toBeGreaterThanOrEqual(prev);
      prev = between;
    }
  });

  it("hands over between levels without any dot changing", () => {
    // Zoom where the finest level wraps from just under 2 * FADE_FROM to FADE_FROM.
    const edge = (FADE_FROM * 2) / GRID;
    const before = edge * (1 - 1e-7);
    const after = edge * (1 + 1e-7);
    // Zooming in, the finest level halves in board space. Every dot visible
    // just after the change must have been visible just before, in the same
    // place and at the same strength.
    const afterStep = dotLevels(after).spacing / after;
    const beforeStep = dotLevels(before).spacing / before;
    expect(afterStep).toBeCloseTo(beforeStep / 2, 6);
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        const a = dot(after, i, j);
        if (a.alpha < 1e-6) continue;
        const b = dot(before, i / 2, j / 2);
        expect(a.x).toBeCloseTo(b.x, 6);
        expect(a.y).toBeCloseTo(b.y, 6);
        expect(a.alpha).toBeCloseTo(b.alpha, 4);
      }
    }
    // Just before, the in-between dots are fully in; just after, the new
    // (finer) in-between dots have not started.
    expect(dotLevels(before).between).toBeCloseTo(1, 6);
    expect(dotLevels(after).between).toBeCloseTo(0, 6);
  });

  it("copes with a zoom of zero or nonsense", () => {
    expect(dotLevels(0).spacing).toBeGreaterThanOrEqual(FADE_FROM);
    expect(dotLevels(Number.NaN).spacing).toBeGreaterThanOrEqual(FADE_FROM);
  });
});

describe("axisDots", () => {
  it("covers the screen with global indices", () => {
    const { first, count } = axisDots(10, 50, 200);
    expect(first).toBe(0);
    expect(10 + first * 50).toBeGreaterThanOrEqual(0);
    expect(10 + (first + count - 1) * 50).toBeLessThanOrEqual(200);
    expect(count).toBe(4);
  });

  it("keeps indices stable when panned left of the origin", () => {
    const { first } = axisDots(-130, 50, 200);
    expect(first).toBe(3);
    expect(axisDots(-130, 50, 200, 10).first).toBe(3);
    expect(axisDots(-130, 50, 200, 31).first).toBe(2);
  });
});

describe("isCoarse", () => {
  it("is even rows and columns, also below zero", () => {
    expect(isCoarse(0, 0)).toBe(true);
    expect(isCoarse(-2, 4)).toBe(true);
    expect(isCoarse(-1, 0)).toBe(false);
    expect(isCoarse(2, -3)).toBe(false);
  });
});

describe("pixel snapping", () => {
  it("rounds dots to whole device pixels", () => {
    expect(dotDiameter(2, 2)).toBe(4);
    expect(dotDiameter(1.5, 2)).toBe(3);
    expect(dotDiameter(1.5, 1)).toBe(2);
    expect(dotDiameter(0.2, 1)).toBe(1);
  });

  it("centres the dot on a pixel corner or centre to match its parity", () => {
    for (const d of [1, 2, 3, 4]) {
      const side = spriteSide(d);
      expect(side % 2).toBe(d % 2);
    }
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
