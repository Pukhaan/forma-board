/** Grid spacing in board units at 100% zoom. */
export const GRID = 24;

/** Closest the dots ever get on screen, in pixels. They never get denser than this. */
export const MIN_SPACING = 36;

/**
 * Spacing for two dot layers at a zoom level. The coarse layer is always
 * shown; the fine layer sits halfway between its dots and fades in as you zoom
 * in. When the fine layer is fully in, the levels hand over (the fine layer
 * becomes the next coarse one), so the grid never jumps.
 *
 * `fine` stays within [MIN_SPACING, 2 * MIN_SPACING) on screen.
 */
export function dotLevels(zoom: number, grid = GRID, min = MIN_SPACING) {
  let fine = grid * zoom;
  while (fine < min) fine *= 2;
  while (fine >= min * 2) fine /= 2;
  const t = (fine - min) / min;
  // Ease, so dots arrive softly instead of at a constant rate.
  const fineOpacity = t * t * (3 - 2 * t);
  return { fine, coarse: fine * 2, fineOpacity };
}
