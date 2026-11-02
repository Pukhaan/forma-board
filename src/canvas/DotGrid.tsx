import { useStoreApi } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { dotStyle, GRID } from "./dots";
import { gridFx } from "./gridFx";
import { dotFromKey } from "./gridFx.math";
import { paintSwarm, readInk } from "./gridFx.paint";
import { sceneEnv, sceneWants } from "./gridFx.scene";
import { DotSwarm } from "./gridFx.swarm";

type Transform = readonly [number, number, number];

/** How far the grid layer reaches past the window on every side, in CSS px. More than the largest spacing. */
const MARGIN = 160;

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
  const gridRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    const fxCanvas = fxRef.current;
    const ctx = grid?.getContext("2d");
    const fxCtx = fxCanvas?.getContext("2d");
    if (!grid || !fxCanvas || !ctx || !fxCtx) return;
    const wrap = grid.parentElement as HTMLElement;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = "rgba(0, 0, 0, 0.2)";
    let canvasColor = "#f5f5f3";
    let base = 2;
    let drawn: Transform | null = null;
    let ink = readInk(fxCtx, color);
    const swarm = new DotSwarm();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // One dot drawn into a small tile, repeated with a single pattern fill.
    // The tile is about one spacing in device pixels, so dots stay crisp.
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

    // The grid layer is painted once per zoom level, a margin larger than the
    // window on every side. Panning never repaints it: the grid repeats every
    // spacing, so moving the canvas by the pan (wrapped to one spacing) is
    // exactly the same picture. That is a compositor move, almost free,
    // instead of re-uploading a full-screen Retina image every frame.
    let painted: { x: number; y: number; spacing: number; size: number; alpha: number } | null = null;

    const paintGrid = (t: Transform) => {
      const [x, y, zoom] = t;
      const { spacing, size, alpha } = dotStyle(zoom, base);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, grid.width, grid.height);
      painted = { x, y, spacing, size, alpha };
      grid.style.transform = "translate3d(0, 0, 0)";
      if (alpha < 0.005) return;
      const side = Math.max(4, Math.min(1024, Math.round(spacing * dpr)));
      const scale = (spacing * dpr) / side;
      dotTile(side, (size * dpr) / 2 / scale);
      const pattern = ctx.createPattern(tile, "repeat");
      if (!pattern) return;
      // Tile centres on the board grid: shift by half a tile, plus the margin.
      const ox = (x + MARGIN - spacing / 2) * dpr;
      const oy = (y + MARGIN - spacing / 2) * dpr;
      pattern.setTransform(new DOMMatrix([scale, 0, 0, scale, ox, oy]));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, grid.width, grid.height);
      ctx.globalAlpha = 1;
    };

    const placeGrid = (t: Transform) => {
      const [x, y, zoom] = t;
      const look = dotStyle(zoom, base);
      const p = painted;
      if (!p || look.spacing !== p.spacing || look.size !== p.size || look.alpha !== p.alpha) return paintGrid(t);
      const sp = p.spacing;
      const wrapTo = (d: number) => {
        let v = ((d % sp) + sp) % sp;
        if (v > sp / 2) v -= sp;
        return Math.round(v * dpr) / dpr;
      };
      grid.style.transform = `translate3d(${wrapTo(x - p.x)}px, ${wrapTo(y - p.y)}px, 0)`;
    };

    // The effects layer: only the dots out on loan. Empty (and untouched)
    // whenever nothing is happening.
    let fxShown = false;
    const paintFx = (t: Transform) => {
      if (!fxShown && swarm.size === 0 && swarm.borrowed.size === 0) return;
      fxCtx.setTransform(1, 0, 0, 1, 0, 0);
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      fxShown = swarm.size > 0 || swarm.borrowed.size > 0;
      if (!fxShown) return;
      const [x, y, zoom] = t;
      const { spacing, size, alpha } = dotStyle(zoom, base);
      fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // A dot out on loan leaves its spot empty: cover it with the board colour.
      if (swarm.borrowed.size > 0 && alpha >= 0.005) {
        fxCtx.fillStyle = canvasColor;
        fxCtx.beginPath();
        const r = size / 2 + 0.75;
        for (const key of swarm.borrowed) {
          const { i, j } = dotFromKey(key);
          const cx = x + i * spacing;
          const cy = y + j * spacing;
          fxCtx.moveTo(cx + r, cy);
          fxCtx.arc(cx, cy, r, 0, Math.PI * 2);
        }
        fxCtx.fill();
      }
      paintSwarm(fxCtx, swarm, ink, t, size, alpha);
    };

    const draw = (t: Transform) => {
      drawn = t;
      placeGrid(t);
      paintFx(t);
    };
    const redraw = () => {
      painted = null;
      fxShown = true;
      draw(drawn ?? store.getState().transform);
    };

    const readTokens = () => {
      const style = getComputedStyle(wrap);
      color = style.getPropertyValue("--dot").trim() || color;
      canvasColor = style.getPropertyValue("--canvas").trim() || canvasColor;
      ink = readInk(fxCtx, color);
      base = parseFloat(style.getPropertyValue("--dot-size")) || base;
      tileKey = "";
    };

    // Size both backing stores to whole device pixels so canvas pixels are screen pixels.
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = wrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      fxCanvas.width = Math.round(width * dpr);
      fxCanvas.height = Math.round(height * dpr);
      grid.width = Math.round((width + MARGIN * 2) * dpr);
      grid.height = Math.round((height + MARGIN * 2) * dpr);
      readTokens();
      redraw();
    };

    const resizer = new ResizeObserver(() => resize());
    resizer.observe(wrap);

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
      drawn = s.transform;
      placeGrid(s.transform);
      paintFx(s.transform);
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

  return (
    <div className="dots" aria-hidden="true">
      <canvas ref={gridRef} className="dots-grid" />
      <canvas ref={fxRef} className="dots-fx" />
    </div>
  );
}
