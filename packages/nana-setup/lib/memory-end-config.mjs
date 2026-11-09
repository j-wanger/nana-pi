/**
 * @module packages/nana-setup/lib/memory-end-config.mjs
 * @purpose Retain only released SessionEnd ownership fields for installed-hook retirement.
 * @inputs None.
 * @outputs Named immutable retired-hook identity and timeout.
 * @effects none
 * @errors None.
 */
// Contract R-3358: Claude Code 2.1.310 per-entry kill and shared 1500 ms floor,
// read in plan-attack 2026-11-01. Fractional seconds preserve the existing exit floor.
export const MEMORY_END_TIMEOUT_SECONDS = 1.5;
// Contract R-3360: all SessionEnd reasons, no matcher, short neutral UI status.
export const MEMORY_END_ENTRY = Object.freeze({event:'SessionEnd',file:'nana-memory-end.mjs',statusMessage:'nana: memory'});
