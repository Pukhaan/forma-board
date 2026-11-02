import { describe, expect, it } from "vitest";
import { dotLevels, MIN_SPACING } from "./dots";

describe("dotLevels", () => {
  it("never puts dots closer than the minimum, at any zoom", () => {
    for (const zoom of [0.1, 0.13, 0.25, 0.5, 0.77, 1, 1.5, 2, 3.3, 4]) {
      const { fine, coarse } = dotLevels(zoom);
      expect(fine).toBeGreaterThanOrEqual(MIN_SPACING);
      expect(fine).toBeLessThan(MIN_SPACING * 2);
      expect(coarse).toBe(fine * 2);
    }
  });

  it("hands over without a jump", () => {
    // Just before a level change the fine layer is fully in, so what shows is
    // dots every `fine` px. Just after, the fine layer is gone and the coarse
    // layer shows dots at the same spacing.
    const before = dotLevels(MIN_SPACING * 2 - 0.001, 1);
    const after = dotLevels(MIN_SPACING * 2, 1);
    expect(before.fineOpacity).toBeCloseTo(1, 2);
    expect(after.fineOpacity).toBe(0);
    expect(after.coarse).toBeCloseTo(before.fine, 2);
  });

  it("fades the fine layer in as you zoom in", () => {
    const a = dotLevels(MIN_SPACING * 1.2, 1).fineOpacity;
    const b = dotLevels(MIN_SPACING * 1.8, 1).fineOpacity;
    expect(b).toBeGreaterThan(a);
  });
});
