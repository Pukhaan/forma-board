/**
 * Space between dots on screen, in CSS px. One fixed value: zooming never
 * changes it, and no dots ever appear or disappear.
 */
export const SPACING = 32;

type Transform = readonly [number, number, number];

/** Where the dot pattern starts on screen. Kept small (within one spacing). */
export type Offset = { x: number; y: number };

const wrap = (v: number, spacing: number) => ((v % spacing) + spacing) % spacing;

/**
 * Moves the dots with the board when you pan, and keeps them still when you
 * zoom. A zoom (even one that also shifts the view to keep the point under
 * your fingers) leaves the dots exactly where they were; a pan slides them by
 * exactly as much as the board moved.
 */
export function followPan(offset: Offset, prev: Transform | null, next: Transform, spacing = SPACING): Offset {
  if (!prev) return { x: wrap(next[0], spacing), y: wrap(next[1], spacing) };
  if (Math.abs(next[2] - prev[2]) > 1e-9) return offset;
  return { x: wrap(offset.x + next[0] - prev[0], spacing), y: wrap(offset.y + next[1] - prev[1], spacing) };
}

/**
 * The dots along one screen axis, starting from `origin`. Returns the index of
 * the first dot at or after `-pad` and how many dots cover up to `length + pad`.
 */
export function axisDots(origin: number, spacing: number, length: number, pad = 0) {
  const first = Math.ceil((-pad - origin) / spacing) + 0; // + 0 turns -0 into 0
  const last = Math.floor((length + pad - origin) / spacing);
  return { first, count: Math.max(0, last - first + 1) };
}

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
