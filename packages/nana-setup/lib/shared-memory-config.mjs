/**
 * @module packages/nana-setup/lib/shared-memory-config.mjs
 * @purpose Define the sealed output controls for the shared-memory hook.
 * @inputs none
 * @outputs The shared-memory output budget and trim mark.
 * @effects none
 * @errors none
 */
// Hooks doc: plain stdout is capped at 10,000 chars measured whole, read 2026-10-20;
// chosen: a 1,000-char margin. The unit is JS string length.
export const SHARED_MEMORY_OUTPUT_BUDGET = 9000;

// chosen: one character that reads as a cut
export const SHARED_MEMORY_TRIM_MARK = "…";
