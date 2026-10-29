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
// chosen (2026-10-29, R-3133): neutral architectural background, also the empty-canvas oracle.
export const HIVE_BACKGROUND = '#d7d9d5';
// chosen (2026-10-29, R-3134): replication study; unfinished structures stay dark, without colour coding.
export const STATUS_COLORS = Object.freeze({ sound: '#eeefed', partial: '#b9bcb9', gap: '#454947', absent: '#888d89' });
export const KIND_RIMS = Object.freeze({ workflow: '#b7bcb8', governance: '#e2e5e1' });
// chosen (2026-10-29, R-3134): units keep cells apart, camera padding frames tall bees,
// and gentle motion preserves reading. Port zero avoids a fixed-port collision locally.
export const STYLE = Object.freeze({
  cellWidth: 2, cellStep: 2.4, chamberGap: 1.8, cellHeight: 1.4, structureHeight: 8,
  fov: 40, framePadding: 1.08, cameraElevation: 0.68,
  pixelPadding: 20, beeScale: 0.16, beeHeight: 8.8, beeSpeed: 0.65,
  cameraDrift: 0.012, focusEase: 0.025, dragScale: 0.008,
  minZoom: 0.6, maxZoom: 2.5, pixelRatioCap: 2, shadowMapSize: 2048, port: 0,
});
