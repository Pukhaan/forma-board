import { useState, type SyntheticEvent } from "react";
import { faviconUrl, hostOf, linkLabel, noteParts } from "../../model/items";
import type { Item } from "../../model/types";

/**
 * The site's icon. Google sends a tiny grey globe when it has none, so anything
 * that small, or that fails to load, becomes the host's first letter.
 */
export function Favicon({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.naturalWidth <= 16) setFailed(true);
  };
  return (
    <span className="favicon">
      {failed ? (
        <span className="favicon-letter">{hostOf(url).charAt(0).toUpperCase() || "?"}</span>
      ) : (
        <img src={faviconUrl(url)} alt="" draggable={false} onLoad={onLoad} onError={() => setFailed(true)} />
      )}
    </span>
  );
}

/**
 * A link as a small card: icon, title, host. Sized in container units, so the
 * same card reads the same on the board, in a pile and in an opened stack.
 */
export function LinkFace({ item }: { item: Item }) {
  const { title, sub } = linkLabel(item);
  return (
    <span className="face face-link">
      <span className="face-in">
        <Favicon url={item.url ?? ""} />
        <span className="face-link-text">
          <span className="face-link-title">{title}</span>
          {sub && <span className="face-link-host">{sub}</span>}
        </span>
      </span>
    </span>
  );
}

/**
 * A note as a sheet of paper: its heading, then the first lines of the rest.
 * `read` lays it out at full size for reading, with nothing cut off.
 */
export function NoteFace({ item, read = false }: { item: Item; read?: boolean }) {
  const { head, body } = noteParts(item.text ?? "");
  return (
    <span className={read ? "face face-note face-read" : "face face-note"}>
      <span className="face-in">
        <span className="face-note-head">{head || "Note"}</span>
        {body.length > 0 && <span className="face-note-body">{body.join("\n\n")}</span>}
      </span>
    </span>
  );
}

/** Whatever an item is, drawn to fill its box. */
export function ItemFace({ item, read }: { item: Item; read?: boolean }) {
  if (item.kind === "note") return <NoteFace item={item} read={read} />;
  if (item.kind === "link") return <LinkFace item={item} />;
  return item.src ? <img src={item.src} alt={item.title ?? ""} draggable={false} /> : null;
}
