/** Grid spacing in board units at 100% zoom. Every dot level is this times a power of two. */
export const GRID = 24;

/**
 * On-screen spacing (px) of the finest dot level at which its in-between dots
 * start to appear. The finest level always sits in [FADE_FROM, 2 * FADE_FROM).
 */
export const FADE_FROM = 36;

/** On-screen spacing (px) at which the in-between dots are fully in. */
export const FADE_TO = 46;

const smoothstep = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/**
 * The dots to show at a zoom level. Dots sit every `spacing` screen px. Those
 * on even rows and even columns (the coarse level) always show at full
 * strength; the rest sit halfway between them and show at `between`.
 *
 * Each dot is drawn once, at one strength, so there is never a darker dot
 * where two levels overlap. When `between` reaches 1 the levels hand over
 * (every dot is at full strength, and the new coarse level is the old fine
 * one), so nothing jumps.
 *
 * The fade runs over a short band of zoom (36 to 46 px, about a third of each
 * doubling) and is eased in log space, since zoom is multiplicative. The rest
 * of the time the grid is one even field of dots, 46 to 72 px apart.
 */
export function dotLevels(zoom: number, grid = GRID, from = FADE_FROM, to = FADE_TO) {
  let spacing = grid * zoom;
  if (!(spacing > 0) || !Number.isFinite(spacing)) spacing = grid;
  while (spacing < from) spacing *= 2;
  while (spacing >= from * 2) spacing /= 2;
  const between = smoothstep(Math.log(spacing / from) / Math.log(to / from));
  return { spacing, between };
}

/**
 * The dots along one screen axis. `origin` is where board 0 lands on screen.
 * Returns the global index of the first dot at or after `-pad` and how many
 * dots cover up to `length + pad`. Indices are global, so a dot keeps its
 * level (even or odd) while you pan.
 */
export function axisDots(origin: number, spacing: number, length: number, pad = 0) {
  const first = Math.ceil((-pad - origin) / spacing) + 0; // + 0 turns -0 into 0
  const last = Math.floor((length + pad - origin) / spacing);
  return { first, count: Math.max(0, last - first + 1) };
}

/** True when a dot at these global indices belongs to the coarse level. */
export const isCoarse = (i: number, j: number) => (i & 1) === 0 && (j & 1) === 0;

/**
 * Dot diameter in whole device pixels, so every dot rasterises to the same
 * pixels. At least one pixel.
 */
export const dotDiameter = (cssSize: number, dpr: number) => Math.max(1, Math.round(cssSize * dpr));

/**
 * Side of the square sprite a dot is drawn into, in device pixels: the dot
 * plus a pixel of room on each side. Its parity matches the diameter, so the
 * dot's centre falls on a pixel corner (even) or a pixel centre (odd) and the
 * dot comes out symmetric.
 */
export const spriteSide = (diameter: number) => diameter + 2;

/**
 * Where to put a sprite's top-left corner, in whole device pixels, so its dot
 * centres as close as it can to `css` (a screen position in CSS px). Whole
 * pixels mean the sprite is copied, never resampled: no blur, no shimmer.
 */
export const snapSprite = (css: number, dpr: number, side: number) => Math.round(css * dpr - side / 2);
