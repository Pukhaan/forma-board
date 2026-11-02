import { useStoreApi } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { dotStyle, GRID } from "./dots";
import { gridFx } from "./gridFx";
import { dotFromKey } from "./gridFx.math";
import { paintSwarm, readInk } from "./gridFx.paint";
import { sceneEnv, sceneWants } from "./gridFx.scene";
import { DotSwarm } from "./gridFx.swarm";

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
 *
 * The grid also lends its dots out (see gridFx.*): hover a thing and a few
 * dots near each side gather into a "+" for its port; pull a wire and dots
 * along it leave the grid to make the wire. While a dot is out its grid spot
 * stays empty, and it flies back into it after. A spring loop runs only while
 * something is moving, then the canvas goes idle again.
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
    let ink = readInk(ctx, color);
    const swarm = new DotSwarm();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // One dot drawn into a small tile, repeated across the screen in a single
    // fill. Far cheaper than drawing every dot, which matters because this
    // runs on every frame of a pan or zoom. The tile is about one spacing in
    // device pixels, so the pattern is barely resampled and dots stay crisp.
    const tile = document.createElement("canvas");
    const tileCtx = tile.getContext("2d");
    let tileKey = "";
    const dotTile = (side: number, radius: number) => {
      const key = `${side}|${radius.toFixed(2)}|${color}`;
      if (key === tileKey || !tileCtx) return;
      tileKey = key;
      tile.width = side;
      tile.height = side;
      tileCtx.clearRect(0, 0, side, side);
      tileCtx.fillStyle = color;
      tileCtx.beginPath();
      tileCtx.arc(side / 2, side / 2, radius, 0, Math.PI * 2);
      tileCtx.fill();
    };

    const draw = (t: Transform) => {
      drawn = t;
      const [x, y, zoom] = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { spacing, size, alpha } = dotStyle(zoom, base);
      if (alpha >= 0.005) {
        const side = Math.max(4, Math.min(1024, Math.round(spacing * dpr)));
        const scale = (spacing * dpr) / side;
        dotTile(side, (size * dpr) / 2 / scale);
        const pattern = ctx.createPattern(tile, "repeat");
        if (pattern) {
          // Tile centres land on the board grid: shift by half a tile.
          pattern.setTransform(new DOMMatrix([scale, 0, 0, scale, (x - spacing / 2) * dpr, (y - spacing / 2) * dpr]));
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
        }
        // Dots out on loan leave their spot empty until they fly back.
        const out = swarm.borrowed;
        if (out.size > 0) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.globalCompositeOperation = "destination-out";
          ctx.beginPath();
          const r = size / 2 + 0.75;
          for (const key of out) {
            const { i, j } = dotFromKey(key);
            const cx = x + i * spacing;
            const cy = y + j * spacing;
            ctx.moveTo(cx + r, cy);
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintSwarm(ctx, swarm, ink, t, size, alpha);
    };
    const redraw = () => draw(drawn ?? store.getState().transform);

    const readTokens = () => {
      const style = getComputedStyle(canvas);
      color = style.getPropertyValue("--dot").trim() || color;
      ink = readInk(ctx, color);
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

    // The effect loop: springs step once per frame while anything moves.
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = 0;
      const s = store.getState();
      const dt = last ? Math.min(1 / 30, Math.max(0, (now - last) / 1000)) : 1 / 60;
      last = now;
      const env = sceneEnv(s, GRID, dotStyle(s.transform[2], base).alpha, motion.matches);
      swarm.sync(sceneWants(s, gridFx.get()), env);
      const moving = swarm.step(dt, env);
      draw(s.transform);
      if (moving) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const kick = () => {
      if (raf) return;
      const s = store.getState();
      const fx = gridFx.get();
      if (swarm.size > 0 || fx.hover !== null || s.connection.inProgress) raf = requestAnimationFrame(tick);
    };

    resize();
    // Same store, same tick as React Flow's own viewport write.
    const unsubscribe = store.subscribe((s) => {
      if (s.transform !== drawn) draw(s.transform);
      kick();
    });
    const unsubscribeFx = gridFx.subscribe(kick);

    return () => {
      unsubscribe();
      unsubscribeFx();
      cancelAnimationFrame(raf);
      resizer.disconnect();
      themeWatch.disconnect();
      scheme.removeEventListener("change", onTheme);
      dprQuery?.removeEventListener("change", onDpr);
    };
  }, [store]);

  return <canvas ref={ref} className="dots" aria-hidden="true" />;
}
