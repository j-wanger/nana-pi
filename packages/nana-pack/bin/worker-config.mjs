/**
 * @module packages/nana-pack/bin/worker-config.mjs
 * @purpose Define the sealed wall-clock ceiling for lane workers.
 * @inputs none
 * @outputs LANE_MAX_SECS and LANE_DEFAULTS
 * @effects none
 * @errors none
 */
// chosen 28,800 seconds: eight hours covers the measured 20,495-second longest builder round (hardening program, 2026-10-07).
export const LANE_MAX_SECS = 28_800;
// Jake's roster ruling, 2026-10-06; roster may change by session and is declared in the pack README.
export const LANE_DEFAULTS = Object.freeze({
  provider: 'openai-codex',
  model: 'gpt-6-luna',
  thinking: 'high',
  tools: 'read,grep,find,bash,edit,write',
});
