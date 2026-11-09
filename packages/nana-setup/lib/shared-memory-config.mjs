/**
 * @module packages/nana-setup/lib/shared-memory-config.mjs
 * @purpose Define the sealed output controls for the shared-memory hook.
 * @inputs none
 * @outputs The shared-memory output budget, trim mark, held link prefixes and lookup pointer.
 * @effects none
 * @errors none
 */
// Hooks doc: plain stdout is capped at 10,000 chars measured whole, read 2026-10-20;
// chosen: a 1,000-char margin. The unit is JS string length.
export const SHARED_MEMORY_OUTPUT_BUDGET = 9000;

// chosen: one character that reads as a cut
export const SHARED_MEMORY_TRIM_MARK = "…";

// chosen (T1 plan §4.4, R-3987): moment-bound guidance stays in lookup, not session start.
export const SHARED_MEMORY_HELD_PREFIXES = ["feedback_", "reference_", "project_"];
// chosen (T1 plan, R-3987): one count and one place to read the held entries.
export const SHARED_MEMORY_HELD_POINTER = "[nana:shared-memory] {count} entries held for lookup; full index: {index}";
