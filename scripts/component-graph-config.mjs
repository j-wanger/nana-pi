/**
 * @module scripts/component-graph-config.mjs
 * @purpose Seals publish-time spring geometry, routing and source paths.
 * @inputs None.
 * @outputs Immutable geometry parameters with provenance.
 * @effects none
 * @errors None.
 */
// chosen (2026-10-30, R-3172): cooled FR forces retain loop slots and resist import hubs; artifact maximum is nine IDs.
export const SPRING = Object.freeze({ iterations: 240, idealLength: 40, repulsion: 90, anchor: 0.9, attachment: 0.8, centring: 0.001, cooling: 0.96, temperature: 1, weightScale: 9 });
// chosen (2026-10-30, R-3172): ellipse leaves a legible centre and room for paired attachments.
export const LOOP_ELLIPSE = Object.freeze([45, 75]);
// chosen (2026-10-30, R-3172): Compass starts at the far end of the world.
export const LOOP_START = -Math.PI / 2;
// chosen (2026-10-30, R-3172): short driveways, with clearance between paired supports.
export const ATTACH_DISTANCE = 19;
// chosen (2026-10-30, R-3172): a support belongs visibly to its stage.
export const ATTACH_RADIUS = 28;
// chosen (2026-10-30, R-3172): fixed plot beside the Notice board slot; spacing includes absent footings.
export const OUTSIDE_PLOT = Object.freeze([-95, -90, 18]);
// chosen (2026-10-30, R-3172): hard extent independent of the measured bounds.
export const WORLD_HALF_EXTENT = 160;
// chosen (2026-10-30, R-3172): millimetre rounding after every iteration prevents accumulated float drift.
export const POSITION_GRID = 0.001;
// chosen (2026-10-30, R-3172): road and foundation clearance in world units.
export const CLEARANCE = 3;
// chosen (2026-10-30, R-3173): below the adversary's 21–22 crossings, leaving room for a real network.
export const OVERVIEW_CROSSING_CAP = 12;
// chosen (2026-10-30, R-3173): the widest loop must remain easy to trace.
export const LOOP_CROSSING_CAP = 2;
// contract (2026-10-30, R-3171): the only hand source for chapter placement.
export const LOOP_PATH = 'docs/components/loop.json';
// chosen (2026-10-30, R-3173): circumscribed octagons and a crossing penalty favour roads around, not through, the loop.
export const ROUTING = Object.freeze({ sides: 8, margin: 1, crossingPenalty: 1000 });
