import { useStoreApi } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { axisDots, dotDiameter, followPan, snapSprite, SPACING, spriteSide, type Offset } from "./dots";

type Transform = readonly [number, number, number];

/** Draw one dot into a small sprite, centred, so every dot on screen is a pixel-exact copy. */
function makeSprite(color: string, diameter: number) {
  const side = spriteSide(diameter);
  const sprite = document.createElement("canvas");
  sprite.width = side;
  sprite.height = side;
  const ctx = sprite.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(side / 2, side / 2, diameter / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  return { sprite, side };
}

/**
 * The dot grid. One canvas, drawn straight from React Flow's store in the same
 * tick the viewport moves, so it never trails the board. Dots keep one size and
 * one spacing at every zoom and sit on whole device pixels, so they stay crisp.
 * Panning slides them with the board; zooming leaves them exactly where they
 * are (see `followPan`).
 *
 * Colour and size come from the `--dot` and `--dot-size` tokens.
 */
export function DotGrid() {
  const store = useStoreApi();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let dot = makeSprite("transparent", 1);
    let drawn: Transform | null = null;
    let offset: Offset = { x: 0, y: 0 };

    const draw = (t: Transform) => {
      offset = followPan(offset, drawn, t);
      drawn = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pad = dot.side / dpr;
      const cols = axisDots(offset.x, SPACING, width, pad);
      const rows = axisDots(offset.y, SPACING, height, pad);
      const lefts = new Array<number>(cols.count);
      for (let c = 0; c < cols.count; c++) {
        lefts[c] = snapSprite(offset.x + (cols.first + c) * SPACING, dpr, dot.side);
      }
      for (let r = 0; r < rows.count; r++) {
        const top = snapSprite(offset.y + (rows.first + r) * SPACING, dpr, dot.side);
        for (let c = 0; c < cols.count; c++) ctx.drawImage(dot.sprite, lefts[c], top);
      }
    };
    // Redraw in place (resize, theme): same transform, so the dots stay put.
    const redraw = () => draw(drawn ?? store.getState().transform);

    const readTokens = () => {
      const style = getComputedStyle(canvas);
      const color = style.getPropertyValue("--dot").trim() || "rgba(0, 0, 0, 0.2)";
      const size = parseFloat(style.getPropertyValue("--dot-size")) || 2;
      dot = makeSprite(color, dotDiameter(size, dpr));
    };

    // Size the backing store to whole device pixels so canvas pixels are screen pixels.
    const resize = (entry?: ResizeObserverEntry) => {
      dpr = window.devicePixelRatio || 1;
      const box = entry?.devicePixelContentBoxSize?.[0];
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = box ? box.inlineSize : Math.round(width * dpr);
      canvas.height = box ? box.blockSize : Math.round(height * dpr);
      readTokens();
      redraw();
    };

    const resizer = new ResizeObserver((entries) => resize(entries[0]));
    try {
      resizer.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
      resizer.observe(canvas);
    }

    // Moving the window to a display with another pixel ratio.
    let dprQuery: MediaQueryList | null = null;
    const watchDpr = () => {
      dprQuery?.removeEventListener("change", onDpr);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprQuery.addEventListener("change", onDpr);
    };
    const onDpr = () => {
      resize();
      watchDpr();
    };
    watchDpr();

    // Theme changes swap the tokens.
    const onTheme = () => {
      readTokens();
      redraw();
    };
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", onTheme);
    const themeWatch = new MutationObserver(onTheme);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });

    resize();
    // Same store, same tick as React Flow's own viewport write.
    const unsubscribe = store.subscribe((s) => {
      if (s.transform !== drawn) draw(s.transform);
    });

    return () => {
      unsubscribe();
      resizer.disconnect();
      themeWatch.disconnect();
      scheme.removeEventListener("change", onTheme);
      dprQuery?.removeEventListener("change", onDpr);
    };
  }, [store]);

  return <canvas ref={ref} className="dots" aria-hidden="true" />;
}
