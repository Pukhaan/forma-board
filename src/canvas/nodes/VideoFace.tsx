import { useState, type SyntheticEvent } from "react";
import type { Item } from "../../model/types";

type Props = {
  item: Item;
  /** Play it, silent and looping, over its still. */
  playing?: boolean;
  /** Opened big: it plays with a button for its sound. */
  big?: boolean;
};

/** Shows the playing video once it has a frame, so it never flashes empty over the still. */
const showWhenPlaying = (e: SyntheticEvent<HTMLVideoElement>) => {
  e.currentTarget.dataset.on = "";
};

/**
 * A video. At rest it is its still, a picture like any other, so a board or
 * a pile of them costs nothing to pan over; a small play mark says it moves.
 * It plays only when asked: under the pointer on the board, and opened big.
 */
export function VideoFace({ item, playing = false, big = false }: Props) {
  const [sound, setSound] = useState(false);
  const live = playing || big;
  return (
    <span className="face-video" data-big={big || undefined}>
      {item.posterSrc ? (
        <img src={item.posterSrc} alt={item.title ?? ""} draggable={false} />
      ) : (
        // No still yet (an older or hand-added video): its first frame stands in.
        <video src={`${item.src}#t=0.5`} muted playsInline preload="metadata" aria-hidden />
      )}
      {live && item.src && (
        <video
          className="face-video-play"
          src={item.src}
          autoPlay
          loop
          playsInline
          muted={!sound}
          onPlaying={showWhenPlaying}
          aria-label={item.title ?? "Video"}
        />
      )}
      {!live && (
        <span className="video-mark" aria-hidden>
          <svg viewBox="0 0 20 20">
            <path d="M8 6.2v7.6l6-3.8z" />
          </svg>
        </span>
      )}
      {big && (
        <button
          className="video-sound"
          aria-label={sound ? "Turn the sound off" : "Turn the sound on"}
          aria-pressed={sound}
          onClick={(e) => {
            e.stopPropagation();
            setSound((s) => !s);
          }}
        >
          <svg viewBox="0 0 28 28" aria-hidden>
            <path className="video-sound-body" d="M8 11.5h3l4-3.5v12l-4-3.5H8z" />
            {sound ? <path d="M18 11a4 4 0 0 1 0 6M20.5 8.8a7 7 0 0 1 0 10.4" /> : <path d="M18.5 11.5l5 5M23.5 11.5l-5 5" />}
          </svg>
        </button>
      )}
    </span>
  );
}
