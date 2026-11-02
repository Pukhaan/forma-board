import { useRef, type CSSProperties } from "react";
import { liveSize } from "../../model/items";
import type { Item } from "../../model/types";
import { LiveFace } from "../nodes/Faces";
import { LiveFrame } from "./frame";
import { useLiveRun } from "./runner";

type Props = {
  /** The card node it sits on. */
  id: string;
  item: Item;
  onOpen: (media: HTMLElement) => void;
};

/**
 * A live card on the board. It runs its component only while you look at it
 * (see policy.ts), and the board keeps every pointer: the frame takes none,
 * so the card drags, snaps and stacks like any other. The Open pill, or a
 * double-click, opens it big to play with.
 */
export function LiveCard({ id, item, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const running = useLiveRun(id, ref);
  const { w, h } = liveSize(item);

  return (
    <div className="card-media live" ref={ref} style={{ width: w, height: h } as CSSProperties}>
      <LiveFace item={item} />
      {running && <LiveFrame item={item} className="live-frame" />}
      <button
        className="live-open nodrag"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onClick={() => ref.current && onOpen(ref.current)}
      >
        Open
      </button>
    </div>
  );
}
