/** Grid spacing in board units at 100% zoom. */
export const GRID = 22;

/** On-screen spacing for a zoom level, doubled until dots are at least 11px apart. */
export function dotSpacing(zoom: number, grid = GRID, min = 11) {
  let gap = grid * zoom;
  while (gap < min) gap *= 2;
  return gap;
}
