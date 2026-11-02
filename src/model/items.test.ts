import { describe, expect, it } from "vitest";
import { asUrl, faviconUrl, fromPastedText, hostOf, itemShape, linkLabel, noteParts, NOTE_SHAPE } from "./items";

describe("itemShape", () => {
  it("keeps an image's own proportions", () => {
    expect(itemShape({ id: "a", kind: "image", w: 400, h: 225 })).toEqual({ w: 400, h: 225 });
    expect(itemShape({ id: "a", kind: "image" })).toEqual({ w: 1, h: 1 });
  });

  it("gives notes and links a fixed shape", () => {
    expect(itemShape({ id: "n", kind: "note", text: "hi" })).toEqual(NOTE_SHAPE);
    const link = itemShape({ id: "l", kind: "link", url: "https://a.com" });
    expect(link.w).toBeGreaterThan(link.h);
  });
});

describe("noteParts", () => {
  it("splits the heading from the body", () => {
    expect(noteParts("Founders call\n\nCalm.\n\nBlue and white.")).toEqual({
      head: "Founders call",
      body: ["Calm.", "Blue and white."],
    });
  });

  it("copes with a single line and with empty text", () => {
    expect(noteParts("Just this")).toEqual({ head: "Just this", body: [] });
    expect(noteParts("")).toEqual({ head: "", body: [] });
  });
});

describe("asUrl", () => {
  it("accepts web addresses", () => {
    expect(asUrl("https://linear.app/method")).toBe("https://linear.app/method");
    expect(asUrl("  http://example.com  ")).toBe("http://example.com/");
    expect(asUrl("www.are.na")).toBe("https://www.are.na/");
  });

  it("refuses text that only looks a bit like one", () => {
    expect(asUrl("see https://a.com")).toBeNull();
    expect(asUrl("example.com")).toBeNull();
    expect(asUrl("ftp://a.com")).toBeNull();
    expect(asUrl("https://nodot")).toBeNull();
    expect(asUrl("")).toBeNull();
  });
});

describe("links", () => {
  it("names the host without www", () => {
    expect(hostOf("https://www.are.na/block/1")).toBe("are.na");
  });

  it("puts the title first and the host under it", () => {
    expect(linkLabel({ id: "l", kind: "link", url: "https://www.are.na/x", title: "Are.na" })).toEqual({
      title: "Are.na",
      sub: "are.na",
      host: "are.na",
    });
  });

  it("leads with the host when there is no title, and never says it twice", () => {
    expect(linkLabel({ id: "l", kind: "link", url: "https://linear.app/method/" }).title).toBe("linear.app");
    expect(linkLabel({ id: "l", kind: "link", url: "https://linear.app/method/" }).sub).toBe("/method");
    expect(linkLabel({ id: "l", kind: "link", url: "https://linear.app" }).sub).toBe("");
  });

  it("asks for the site's icon by host", () => {
    expect(faviconUrl("https://www.are.na/x")).toBe("https://www.google.com/s2/favicons?domain=are.na&sz=64");
  });
});

describe("fromPastedText", () => {
  it("makes a link of an address and a note of anything else", () => {
    expect(fromPastedText("https://a.com")).toEqual({ kind: "link", url: "https://a.com/" });
    expect(fromPastedText(" Calm and trustworthy \n")).toEqual({ kind: "note", text: "Calm and trustworthy" });
    expect(fromPastedText("   ")).toBeNull();
  });
});
