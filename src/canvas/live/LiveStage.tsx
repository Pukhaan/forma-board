import type { PointerEvent } from "react";
import type { Item } from "../../model/types";
import { LiveFace } from "../nodes/Faces";
import { LiveFrame } from "./frame";

/**
 * A live card opened big: its title above, the component running below and
 * taking the pointer. The still face sits under the frame until the page has
 * loaded, so it never flashes white.
 *
 * A click inside hands the keyboard to the component. Once the pointer leaves
 * it, the keyboard comes back to the app, so Esc closes again.
 */
function giveBackKeys(e: PointerEvent<HTMLElement>) {
  const frame = e.currentTarget.querySelector("iframe");
  if (frame && document.activeElement === frame) {
    frame.blur();
    window.focus();
  }
}

export function LiveStage({ item }: { item: Item }) {
  return (
    <>
      <span className="live-stage-title">{item.title?.trim() || "Prototype"}</span>
      <span className="live-stage" onPointerLeave={giveBackKeys}>
        <LiveFace item={item} />
        <LiveFrame item={item} className="live-frame live-frame-open" />
      </span>
    </>
  );
}
