/**
 * @module apps/hive/config.mjs
 * @purpose Seals the hive's rendering vocabulary and visual scale.
 * @inputs None.
 * @outputs Named immutable rendering values.
 * @effects none
 * @errors None.
 */
// chosen (2026-10-29, R-3122): enough visible activity without a swarm hiding a chamber.
export const BEE_CAP = 12;
// chosen (2026-10-29, R-3123): six-sided extrusions and a small faceted bee, without subdivision.
export const CELL_TRIANGLE_BUDGET = 120;
export const BEE_TRIANGLE_BUDGET = 160;
// chosen (2026-10-29, R-3128): readable small raster, scaled with nearest-neighbour CSS.
export const PIXEL_WIDTH = 320;
export const PIXEL_HEIGHT = 240;
// chosen (2026-10-29, R-3133): product report's dark background, also the empty-canvas oracle.
export const HIVE_BACKGROUND = '#171b19';
// chosen (2026-10-29, R-3134): low-poly honey/wax, muted absent caps, and a green governance rim.
export const STATUS_COLORS = Object.freeze({ sound: '#e6a83c', partial: '#e6d6a7', gap: '#594438', absent: '#78827d' });
export const KIND_RIMS = Object.freeze({ workflow: '#926c36', governance: '#86c4a3' });
// chosen (2026-10-29, R-3134): units keep cells apart, camera padding frames tall bees,
// and gentle motion preserves reading. Port zero avoids a fixed-port collision locally.
export const STYLE = Object.freeze({
  cellWidth: 2, cellStep: 2.4, chamberGap: 4, cellHeight: 1.4,
  fov: 40, framePadding: 1.25, cameraElevation: 0.9,
  pixelPadding: 20, beeScale: 0.26, beeHeight: 2.4, beeSpeed: 0.65,
  cameraDrift: 0.012, focusEase: 0.09, dragScale: 0.008,
  minZoom: 0.6, maxZoom: 2.5, pixelRatioCap: 2, port: 0,
});
