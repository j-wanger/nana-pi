/**
 * @module apps/bench/lib/anatomy-runner-config.mjs
 * @purpose Preserve the isolated Claude adapter's existing process bounds and defaults for anatomy.
 * @inputs none
 * @outputs Model, effort, budget, timeout and capture bounds.
 * @effects none
 * @errors none
 */
// Preserved 2026-11-09 from the shared adapter; anatomy supplies its label model and effort.
export const CLAUDE_MODEL = "claude-sonnet-5";
export const CLAUDE_EFFORT = "low";
export const DOLLAR_CAP = 0.50;
export const TIMEOUT_MS = 300000;
export const MAX_BUFFER = 67108864;
