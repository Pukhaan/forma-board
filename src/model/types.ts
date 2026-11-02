// The canvas model. Plain data so the same shapes can be written to and read
// from a project folder later (by the app, or by an AI editing the files).

export type ItemKind = "image" | "link" | "note";

/** One piece of material: an image, a saved link, or a short text note. */
export type Item = {
  id: string;
  kind: ItemKind;
  title?: string;
  /** Image file, relative to the project (or a URL during design). */
  src?: string;
  /** Natural size, used to keep the aspect ratio. */
  w?: number;
  h?: number;
  url?: string;
  text?: string;
};

/** The client or project everything connects back to. */
export type ProjectData = {
  title: string;
  brief: string;
};

/** A pile of items sorted under one name. */
export type StackData = {
  title: string;
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

/** A connection. The note is what sits on the wire between two things. */
export type LinkData = {
  note?: string;
};
