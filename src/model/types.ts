// The canvas model. Plain data so the same shapes can be written to and read
// from a project folder later (by the app, or by an AI editing the files).

export type ItemKind = "image" | "link" | "note" | "live";

/**
 * One piece of material: an image, a saved link, a short text note, or a live
 * card (a small coded component, one HTML file, that runs on the board).
 */
export type Item = {
  id: string;
  kind: ItemKind;
  title?: string;
  /** Path inside the project folder, when the item is a file there. */
  file?: string;
  /** What an <img> (or a live card's frame) shows: the file as a displayable URL, a web URL, or a data URL. */
  src?: string;
  /** Natural size, used to keep the aspect ratio. */
  w?: number;
  h?: number;
  url?: string;
  text?: string;
  /** A live card: what its dials were last tuned to, by name (see FORMAT.md). */
  dials?: Record<string, unknown>;
  /** An image: why it was saved, in your words. */
  note?: string;
  /** An image: its main colours as hex, the strongest first. Worked out by the app once. */
  palette?: string[];
  /** An image: where it came from, a web address or plain words like an author's name. */
  source?: string;
  /** When it was put on the board, as an ISO date (YYYY-MM-DD). */
  added?: string;
};

/** The client or project everything connects back to. */
export type ProjectData = {
  title: string;
  brief: string;
};

/** A pile of items sorted under one name. */
export type StackData = {
  title: string;
  /** A short line under the title saying what the stack is for. */
  description?: string;
  items: Item[];
};

/** A single loose item sitting on the canvas. */
export type CardData = {
  item: Item;
};

/** A free text note on the canvas. */
export type NoteData = {
  text: string;
};

/**
 * A soft, named zone that groups what sits inside it ("Inspiration", "Plan").
 * Its size is the node's own width and height, in board units. A thing
 * belongs to an area when its centre is inside the area's rectangle.
 */
export type AreaData = {
  title: string;
};

/** A connection. The note is what sits on the wire between two things. */
export type LinkData = {
  note?: string;
};
