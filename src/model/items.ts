// What each kind of item is made of, and how it reads at a glance. Pure, so
// the board, the pile, the opened stack and the file format all agree.

import type { Item } from "./types";

export type Shape = { w: number; h: number };

/** A note sits as a small upright sheet of paper. */
export const NOTE_SHAPE: Shape = { w: 152, h: 176 };
/** A link sits as a landscape card. */
export const LINK_SHAPE: Shape = { w: 176, h: 124 };

/** A live card's proportions when its file doesn't say: 4:3. */
export const LIVE_SHAPE: Shape = { w: 640, h: 480 };
/** How wide a live card sits on the board, and the tallest it gets. */
export const LIVE_WIDTH = 320;
export const LIVE_MAX_HEIGHT = 400;

/**
 * The proportions an item is drawn at. Images keep their own; notes and links
 * have a fixed shape, so a pile and an opened stack lay them out the same way.
 */
export function itemShape(item: Item): Shape {
  if (item.kind === "note") return NOTE_SHAPE;
  if (item.kind === "link") return LINK_SHAPE;
  if (item.kind === "live" && !(item.w && item.w > 0 && item.h && item.h > 0)) return LIVE_SHAPE;
  return { w: item.w && item.w > 0 ? item.w : 1, h: item.h && item.h > 0 ? item.h : 1 };
}

/**
 * A live card's size on the board: LIVE_WIDTH wide, as tall as its shape
 * makes it, but never taller than LIVE_MAX_HEIGHT (a tall one gets narrower).
 */
export function liveSize(item: Item): Shape {
  const { w, h } = itemShape({ ...item, kind: "live" });
  const s = Math.min(LIVE_WIDTH / w, LIVE_MAX_HEIGHT / h);
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

/** An image that says why it was saved. On a pile and in an opened stack it shows a corner of paper behind it. */
export const hasNote = (item: Item) => item.kind === "image" && !!item.note?.trim();

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

/** A day as stored in `added`: the local date, YYYY-MM-DD. */
export function isoDay(at = new Date()) {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${at.getFullYear()}-${two(at.getMonth() + 1)}-${two(at.getDate())}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A stored date (YYYY-MM-DD, or a full ISO time) as people read it: "2 Nov 2026". Null when it isn't one. */
export function dayLabel(added: string | undefined) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(added ?? "");
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  const day = m ? Number(m[3]) : 0;
  return m && month && day >= 1 && day <= 31 ? `${day} ${month} ${m[1]}` : null;
}

/** Where an image came from, as shown: a web address reads as its site and opens; plain words stay as they are. */
export function sourceLabel(source: string) {
  const url = asUrl(source);
  return url ? { text: hostOf(url), url } : { text: source.trim(), url: null };
}
