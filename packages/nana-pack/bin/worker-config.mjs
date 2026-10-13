/**
 * @module packages/nana-pack/bin/worker-config.mjs
 * @purpose Define the sealed wall-clock ceiling for lane workers and pi's npm package identity.
 * @inputs none
 * @outputs LANE_MAX_SECS, LANE_DEFAULTS, PI_PACKAGE, PI_BIN_NAME, NPM_DIRS
 * @effects none
 * @errors none
 */
// chosen 28,800 seconds: eight hours covers the measured 20,495-second longest builder round (hardening program, 2026-10-07).
export const LANE_MAX_SECS = 28_800;
// Jake's roster ruling, 2026-10-06; roster changes are an edit to this one value and require a requirements diff.
export const LANE_DEFAULTS = Object.freeze({
  provider: 'openai-codex',
  model: 'gpt-6-luna',
  thinking: 'high',
  tools: 'read,grep,find,bash,edit,write',
});

// contract: pi 1.0.2 package.json name and bin {"pi": "dist/bundle/cli.js"}, read 2026-10-13.
export const PI_PACKAGE = '@earendil-works/pi-coding-agent';
export const PI_BIN_NAME = 'pi';
// contract: npm 10.9.7's bin-links 5.0.0 bin-target.js — a shim's package sits in the sibling
// node_modules (the global layout) or one level up through node_modules/.bin (the local layout).
export const NPM_DIRS = Object.freeze(['node_modules', '.bin']);
