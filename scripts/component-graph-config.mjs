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
// chosen (2026-10-30, R-3172): a long oval fills a phone; equal-arc slots prevent bunching at its tips.
export const LOOP_ELLIPSE = Object.freeze([16, 48]);
// chosen (2026-10-30, R-3172): one degree arc samples make publication deterministic without a solver.
export const LOOP_SAMPLES = 360;
// chosen (2026-10-30, R-3172): stage 01 fronts the top street junction head-on, like a gateway into the loop.
export const LOOP_START = -Math.PI / 2;
// contract (2026-10-30, R-3172): maximum gap from a spine footprint to its loop centre line.
export const LOOP_FRONTAGE = 1;
// contract (2026-10-30, R-3172): short ground driveways for every support and every depot building.
export const MAX_SPUR_LENGTH = 9;
// chosen (2026-10-30, R-3172): short driveways, with clearance between paired supports.
export const ATTACH_DISTANCE = 18;
// chosen (2026-10-30, R-3172): a support belongs visibly to its stage.
export const ATTACH_RADIUS = 28;
// chosen (2026-10-30, R-3172): a compact triangular yard searches around its related stage, clear of foundations.
export const DEPOT = Object.freeze({ gap: 1, searchSteps: 32 });
// chosen (2026-10-30, R-3172): hard extent independent of the measured bounds.
export const WORLD_HALF_EXTENT = 160;
// chosen (2026-10-30, R-3172): millimetre rounding after every iteration prevents accumulated float drift.
export const POSITION_GRID = 0.001;
// chosen (2026-10-30, R-3172): road and foundation clearance in world units.
export const CLEARANCE = 3;
// contract (2026-10-30, R-3173): only loop streets and chapter spurs appear before selection.
export const OVERVIEW_CROSSING_CAP = 0;
// contract (2026-10-30, R-3173): no overview road crosses the loop street.
export const LOOP_CROSSING_CAP = 0;
// contract (2026-10-30, R-3171): the only hand source for chapter placement.
export const LOOP_PATH = 'docs/components/loop.json';
// chosen (2026-10-30, R-3173): circumscribed octagons and a crossing penalty favour roads around, not through, the loop.
export const ROUTING = Object.freeze({ sides: 8, margin: 1, crossingPenalty: 1000 });
