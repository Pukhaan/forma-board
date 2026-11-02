import type { SyntheticEvent } from "react";
import type { Item } from "../../model/types";

/**
 * Only scripts: no same origin, so a component can't reach the app, the
 * project folder or this page, and no forms, popups or top navigation.
 */
export const LIVE_SANDBOX = "allow-scripts";

/** Shows the frame once its page has loaded, without a re-render. */
const markLoaded = (e: SyntheticEvent<HTMLIFrameElement>) => {
  e.currentTarget.dataset.loaded = "";
};

/** A live card's component, running in its own sandboxed frame. */
export function LiveFrame({ item, className }: { item: Item; className: string }) {
  return (
    <iframe
      className={className}
      src={item.src}
      sandbox={LIVE_SANDBOX}
      loading="lazy"
      title={item.title ?? "Live card"}
      onLoad={markLoaded}
    />
  );
}
