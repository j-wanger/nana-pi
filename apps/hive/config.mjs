/**
 * @module apps/hive/config.mjs
 * @purpose Seals the hive's rendering vocabulary and visual scale.
 * @inputs None.
 * @outputs Named immutable rendering values.
 * @effects none
 * @errors None.
 */
// chosen (2026-10-30, R-3172): a steeper overview preserves the loop's depth on a phone.
export const OVERVIEW_ELEVATION = 1.35;
// chosen (2026-10-30, R-3172): encloses the square foundation corners and the instruments drawn on them.
export const FOOTPRINT_SCALE = 1.3;
// chosen (2026-10-30, R-3175): phone drift tolerance and deliberate double taps; roads keep the lane loop dominant.
export const NAVIGATION = Object.freeze({ tapTolerance: 10, doubleTapMs: 350, sectionHeight: 100, roadWidths: Object.freeze({ loop: 3.6, spur: 0.8, artifact: 0.12, import: 0.08, feature: 0.06 }), overviewClasses: Object.freeze(['loop', 'spur']) });
// chosen (2026-10-30, R-3173): streets lie below foundations; depthOffset prevents far-overview z-fighting with ground.
export const STREETS = Object.freeze({ thickness: 0.04, elevation: -0.43, edgeWidth: 0.04, laneWidth: 0.06, dashLength: 0.8, dashGap: 0.8, widths: Object.freeze({ avenue: 1.2, local: 0.7, back: 0.3, air: 0.07 }), widthCaps: Object.freeze({ avenue: 0.12, local: 0.08 }), kerbHeight: 0.05, depthOffset: -4 });
// chosen (2026-10-30, R-3134): footprint-sized radial bands, narrow frontage and visible phone contrast.
// probeOffset samples ground three world units away, beyond the street's antialiasing fringe.
// bayCount is chosen for parallel capacity; litBays is contract (2026-10-16 ruling: two builders).
export const CITY = Object.freeze({ positionGrid: 0.001, clearance: 3, bandGap: 8, parkBands: 3, radialStep: 17, parkBase: 16, fenceGap: 10, ringGap: 10, townGap: 12, edgeGap: 20, outsideGap: 24, skyHeight: 28, bayCount: 4, litBays: 2, vacantBearing: 147, worldHalfExtent: 300, latticeTolerance: 0.08, latticeSpacing: 0.08, latticeFamilies: 1, radiusBandSize: 8, minimumRadiusBands: 3, northTolerance: 5, frontage: 1, doorAngle: 0.35, walkTolerance: 0.002, arcSamples: 72, routingSides: 12, routingMargin: 1, pixelMargin: 0.025, cardOverlap: 0.15, probeOffset: 3 });
// chosen (2026-10-30, R-3177): windows carry status, while every target form remains complete.
export const LIGHTS = Object.freeze({ minimumGap: 0.5, halfFraction: 0.5, windows: 8, colors: Object.freeze({ lit: '#ffffff', half: '#bfc8bf', dark: '#252c28' }) });
// chosen (2026-10-30, R-3122): a faceted person stays cheaper than the former bee.
export const RESIDENT_TRIANGLE_BUDGET = 100;
// contract (city plan revision 3, R-3171); vocabulary is shared by the checker and its sealed pin.
export const CITY_DISTRICTS = Object.freeze(['sky', 'park', 'town', 'edge', 'outside']);
export const CITY_FORMS = Object.freeze(['tower', 'drafting', 'yard', 'bay', 'eyes', 'stair', 'gate', 'tools', 'lab', 'hall', 'vault', 'theater', 'court', 'records', 'style', 'survey', 'utilities', 'control', 'stage', 'billboard', 'customs', 'freight', 'craft', 'customers', 'neighbour', 'feedback']);
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
  // chosen (2026-10-30, R-3172): full-size structures even for a component with one feature.
  foundationColumns: 3,
  fov: 40, framePadding: 1.08, cameraElevation: 0.68,
  pixelPadding: 20, beeScale: 0.16, beeHeight: 8.8, beeSpeed: 0.65,
  cameraDrift: 0.012, focusEase: 0.025, dragScale: 0.008,
  minZoom: 0.6, maxZoom: 2.5, pixelRatioCap: 2, shadowMapSize: 4096, port: 0,
  // chosen (2026-10-30, R-3134): low raking light and subdued ambient make cast shadows legible.
  lighting: Object.freeze({ ambient: 0.65, sun: 4.5, position: Object.freeze([-45, 65, 35]) }),
});
