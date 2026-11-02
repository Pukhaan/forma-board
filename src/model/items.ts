// What each kind of item is made of, and how it reads at a glance. Pure, so
// the board, the pile, the opened stack and the file format all agree.

import type { Item } from "./types";

export type Shape = { w: number; h: number };

/** A note sits as a small upright sheet of paper. */
export const NOTE_SHAPE: Shape = { w: 152, h: 176 };
/** A link sits as a landscape card. */
export const LINK_SHAPE: Shape = { w: 176, h: 124 };

/**
 * The proportions an item is drawn at. Images keep their own; notes and links
 * have a fixed shape, so a pile and an opened stack lay them out the same way.
 */
export function itemShape(item: Item): Shape {
  if (item.kind === "note") return NOTE_SHAPE;
  if (item.kind === "link") return LINK_SHAPE;
  return { w: item.w && item.w > 0 ? item.w : 1, h: item.h && item.h > 0 ? item.h : 1 };
}

/** A note's heading (its first paragraph) and the paragraphs after it. */
export function noteParts(text: string) {
  const [head = "", ...body] = text.trim().split(/\n\s*\n/);
  return { head: head.trim(), body: body.map((p) => p.trim()).filter(Boolean) };
}

/**
 * Text that is a web address, made whole: `https://` added to a `www.` start.
 * Anything with spaces in it, or that doesn't start like a link, isn't one.
 */
export function asUrl(text: string): string | null {
  const t = text.trim();
  if (!t || /\s/.test(t)) return null;
  const full = /^www\./i.test(t) ? `https://${t}` : t;
  if (!/^https?:\/\//i.test(full)) return null;
  try {
    const u = new URL(full);
    return u.hostname.includes(".") || u.hostname === "localhost" ? u.href : null;
  } catch {
    return null;
  }
}

/** The site's name as people say it: the host without `www.`. */
export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

/**
 * What a link card says. The title, with the host under it; with no title,
 * the host leads and the page's path sits under it instead, so nothing reads
 * twice.
 */
export function linkLabel(item: Item) {
  const url = item.url ?? "";
  const host = hostOf(url);
  const title = item.title?.trim();
  if (title) return { title, sub: host, host };
  let path = "";
  try {
    const u = new URL(url);
    path = decodeURI(`${u.pathname}${u.search}`).replace(/\/$/, "");
  } catch {
    path = "";
  }
  return { title: host, sub: path, host };
}

/** A small square icon for the site, from Google's favicon service. */
export function faviconUrl(url: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostOf(url))}&sz=64`;
}

/** What pasted text becomes on the board: a link card for an address, a note for anything else. */
export function fromPastedText(text: string): { kind: "link"; url: string } | { kind: "note"; text: string } | null {
  const url = asUrl(text);
  if (url) return { kind: "link", url };
  const t = text.trim();
  return t ? { kind: "note", text: t } : null;
}
