import { useStoreApi } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { axisDots, dotDiameter, dotLevels, isCoarse, snapSprite, spriteSide } from "./dots";

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
 * tick the viewport moves, so it never trails the board. Dots keep one size
 * and sit on whole device pixels, so they stay crisp and identical everywhere.
 * As you zoom in, dots fade in halfway between the others; see `dotLevels`.
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

    const draw = (t: Transform) => {
      drawn = t;
      const [x, y, zoom] = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { spacing, between } = dotLevels(zoom);
      const pad = dot.side / dpr;
      const cols = axisDots(x, spacing, width, pad);
      const rows = axisDots(y, spacing, height, pad);
      const lefts = new Array<number>(cols.count);
      for (let c = 0; c < cols.count; c++) {
        lefts[c] = snapSprite(x + (cols.first + c) * spacing, dpr, dot.side);
      }
      // Coarse dots at full strength, then the in-between ones at theirs.
      // Each dot is drawn once.
      const pass = (alpha: number, coarse: boolean) => {
        ctx.globalAlpha = alpha;
        for (let r = 0; r < rows.count; r++) {
          const j = rows.first + r;
          const top = snapSprite(y + j * spacing, dpr, dot.side);
          for (let c = 0; c < cols.count; c++) {
            if (isCoarse(cols.first + c, j) === coarse) ctx.drawImage(dot.sprite, lefts[c], top);
          }
        }
      };
      pass(1, true);
      if (between > 0.005) pass(between, false);
      ctx.globalAlpha = 1;
    };
    const redraw = () => draw(store.getState().transform);

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
