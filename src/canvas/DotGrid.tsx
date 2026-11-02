import { useStoreApi } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { axisDots, dotStyle } from "./dots";

type Transform = readonly [number, number, number];

/**
 * The dot grid. The dots belong to the board: they sit at fixed board
 * positions, so zooming spreads them apart or brings them together (and grows
 * or shrinks them) along with everything else, and no dot ever pops in, pops
 * out or jumps. Zoomed far out the whole grid fades together, see `dotStyle`.
 *
 * One canvas, drawn straight from React Flow's store in the same tick the
 * viewport moves, so it never trails the board. Dots are drawn at their exact
 * positions so they glide smoothly while you zoom.
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
    let color = "rgba(0, 0, 0, 0.2)";
    let base = 2;
    let drawn: Transform | null = null;

    const draw = (t: Transform) => {
      drawn = t;
      const [x, y, zoom] = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { spacing, size, alpha } = dotStyle(zoom, base);
      if (alpha < 0.005) return;
      const r = size / 2;
      const cols = axisDots(x, spacing, width, r);
      const rows = axisDots(y, spacing, height, r);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let j = 0; j < rows.count; j++) {
        const cy = y + (rows.first + j) * spacing;
        for (let i = 0; i < cols.count; i++) {
          const cx = x + (cols.first + i) * spacing;
          ctx.moveTo(cx + r, cy);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    const redraw = () => draw(drawn ?? store.getState().transform);

    const readTokens = () => {
      const style = getComputedStyle(canvas);
      color = style.getPropertyValue("--dot").trim() || color;
      base = parseFloat(style.getPropertyValue("--dot-size")) || base;
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
