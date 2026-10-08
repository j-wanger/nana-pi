/**
 * @module packages/nana-pack/bin/worker-config.mjs
 * @purpose Define the sealed wall-clock ceiling for lane workers.
 * @inputs none
 * @outputs LANE_MAX_SECS
 * @effects none
 * @errors none
 */
// chosen 28,800 seconds: eight hours covers the measured 20,495-second longest builder round (hardening program, 2026-10-07).
export const LANE_MAX_SECS = 28_800;
