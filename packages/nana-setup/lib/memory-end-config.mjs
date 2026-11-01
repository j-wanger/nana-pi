/**
 * @module packages/nana-setup/lib/memory-end-config.mjs
 * @purpose Seal SessionEnd dispatch, input deadline and making note vocabulary.
 * @inputs None.
 * @outputs Named immutable hook and doctor contracts.
 * @effects none
 * @errors None.
 */
// Contract R-3358: Claude Code 2.1.310 per-entry kill and shared 1500 ms floor,
// read in plan-attack 2026-11-01. Fractional seconds preserve the existing exit floor.
export const MEMORY_END_TIMEOUT_SECONDS = 1.5;
// Chosen R-3359, 2026-11-01: bound an open stdin while leaving time to spawn and exit.
export const MEMORY_STDIN_DEADLINE_MS = 300;
// Contract R-3360: all SessionEnd reasons, no matcher, short neutral UI status.
export const MEMORY_END_ENTRY = Object.freeze({event:'SessionEnd',file:'nana-memory-end.mjs',statusMessage:'nana: memory'});
// Contract R-3362: count-only informational doctor vocabulary, 2026-11-01.
export const MEMORY_MAKING_NOTE = Object.freeze({label:'memory making',disabled:'not enabled',never:'never',unreadable:'unreadable'});
