import { describe, expect, it } from "vitest";
import { dotSpacing } from "./dots";

describe("dotSpacing", () => {
  it("follows the zoom", () => {
    expect(dotSpacing(1)).toBe(22);
    expect(dotSpacing(2)).toBe(44);
  });

  it("doubles when dots would crowd together", () => {
    expect(dotSpacing(0.25)).toBe(11);
    expect(dotSpacing(0.1)).toBe(17.6);
  });
});
