/**
 * @module packages/nana-pack/bin/worker-config.mjs
 * @purpose Define the sealed launcher values: the lane ceiling, the default builder and roster, and pi's npm package identity.
 * @inputs none
 * @outputs LANE_MAX_SECS, LANE_DEFAULTS, ROSTER_DEFAULTS, ROSTER_SLOTS, NULLABLE_SLOTS, OPTIONAL_SLOTS,
 *  CLAUDE_CODE_SLOTS, CLAUDE_CODE_RUNTIME, CLAUDE_CODE_SUBAGENT_MODELS, SLOT_PRINT_ORDER, LANE_SIZE_SLOTS,
 *  LARGER_BUILDER_LABEL, THINKING_LEVELS, PI_PACKAGE, PI_BIN_NAME, NPM_DIRS
 * @effects none
 * @errors none
 */
// chosen 28,800 seconds: eight hours covers the measured 20,495-second longest builder round (hardening program, 2026-10-07).
export const LANE_MAX_SECS = 28_800;
// Jake's roster ruling, 2026-10-06; since the roster lane (2026-10-13) a machine's roster lives in the user-scope nana-pack.json (R-1120-R-1122), and LANE_DEFAULTS is the default builder only.
export const LANE_DEFAULTS = Object.freeze({
  provider: 'openai-codex',
  model: 'gpt-6-luna',
  thinking: 'high',
  tools: 'read,grep,find,bash,edit,write',
});

// contract: R-1122 — the roster object's four mandatory slots; scout and land may be null
// (NULLABLE_SLOTS); builder and reviewer are mandatory entries.
export const ROSTER_SLOTS = Object.freeze(['scout', 'builder', 'reviewer', 'land']);
export const NULLABLE_SLOTS = Object.freeze(['scout', 'land']);
// contract: R-1121, R-1122 — a slot that may be ABSENT from the file's roster object entirely; an
// absent one reads back as null (R-1121). Since the roster lane (2026-10-16) the only one is the
// larger-lane builder.
export const OPTIONAL_SLOTS = Object.freeze(['largerBuilder']);
// contract: R-1122 — the slots that may hold a Claude Code entry ({runtime, model}) instead of a
// pi entry. Since the roster lane (2026-10-16) the only one is the larger-lane builder: builder,
// reviewer, scout and land stay pi-only, so pi-worker can always start builder and pi-review's
// inputs never change (CHANGE.md 3.1).
export const CLAUDE_CODE_SLOTS = Object.freeze(['largerBuilder']);
// contract: R-1122 — chosen name: it says which runtime starts the entry.
export const CLAUDE_CODE_RUNTIME = 'claude-code';
// contract: R-1122 — Claude Code 2.1.299's Agent tool input schema, its `model` field, read from
// the installed binary's strings on 2026-10-16 (`cc-strings.txt:337100`): model:U(["sonnet","opus","haiku","fable"]).
export const CLAUDE_CODE_SUBAGENT_MODELS = Object.freeze(['sonnet', 'opus', 'haiku', 'fable']);
// contract: R-1123, R-1192 — the print order every roster-reading surface agrees on.
export const SLOT_PRINT_ORDER = Object.freeze(['scout', 'builder', 'largerBuilder', 'reviewer', 'land']);
// contract: pi 1.0.2 dist/cli/args.js:6 VALID_THINKING_LEVELS, read 2026-10-13.
export const THINKING_LEVELS = Object.freeze(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);
// contract: R-1190 — pi-worker's --lane-size value to the roster slot it starts.
export const LANE_SIZE_SLOTS = Object.freeze({ small: 'builder', larger: 'largerBuilder' });
// contract: R-1124 — the builder line's label when a lane starts the larger-lane builder.
export const LARGER_BUILDER_LABEL = 'builder (larger lanes)';

// provenance: R-1120 — roles: Jake, 2026-10-06; provider and model ids: the seat's. The builder
// slot reads LANE_DEFAULTS by name so the two definitions cannot drift; this Mac runs no pi scout
// (chosen); reviewer and land carry no thinking (INFERRED: the ledger records no thinking).
// chosen (D1, 2026-10-16): largerBuilder defaults to null — every machine's lineup stays as it is
// until its own file names a larger-lane builder.
export const ROSTER_DEFAULTS = Object.freeze({
  scout: null,
  builder: Object.freeze({ provider: LANE_DEFAULTS.provider, model: LANE_DEFAULTS.model, thinking: LANE_DEFAULTS.thinking }),
  largerBuilder: null,
  reviewer: Object.freeze({ provider: 'openai-codex', model: 'gpt-5.6-sol', thinking: null }),
  land: Object.freeze({ provider: 'openai-codex', model: 'gpt-6-astra', thinking: null }),
});

// contract: pi 1.0.2 package.json name and bin {"pi": "dist/bundle/cli.js"}, read 2026-10-13.
export const PI_PACKAGE = '@earendil-works/pi-coding-agent';
export const PI_BIN_NAME = 'pi';
// contract: npm 10.9.7's bin-links 5.0.0 bin-target.js — a shim's package sits in the sibling
// node_modules (the global layout) or one level up through node_modules/.bin (the local layout).
export const NPM_DIRS = Object.freeze(['node_modules', '.bin']);
