/**
 * @module packages/nana-pack/bin/worker-config.mjs
 * @purpose Define sealed worker, watchdog, lane-watcher, roster, Claude Code builder, reviewer-child and pi-package launch values.
 * @inputs none
 * @outputs Lane/watchdog and lane-watcher limits and files, default builder and roster values, Claude Code builder flags, tools, carry allowlists and env,
 *  roster slot/runtime tokens, reviewer child env, Windows npm-layout values, and pi package identity.
 * @effects none
 * @errors none
 */
// chosen 28,800 seconds: eight hours covers the measured 20,495-second longest builder round (hardening program, 2026-10-07).
export const LANE_MAX_SECS = 28_800;
// chosen 2026-10-23: matches the detached install relay's poll; measured hard-kill cleanup ended within 305 ms.
export const LANE_WATCHER_POLL_MS = 200;
// chosen 2026-10-23: real builder stop time was not measured; two seconds is conservative over the fake builder's measured 30 ms.
export const LANE_WATCHER_STOP_WAIT_MS = 2_000;
// chosen 2026-10-23: copies R-2666's transient Windows temp-removal policy for handles closing after a tree stop.
export const LANE_WATCHER_REMOVE_RETRIES = 5;
// chosen 2026-10-23: copies R-2666's transient Windows temp-removal delay.
export const LANE_WATCHER_REMOVE_RETRY_MS = 100;
// chosen 2026-10-23: the builder identity record sits beside the lane preamble and capture folder.
export const LANE_BUILDER_PID_FILE = "builder.pid";
// chosen 2026-10-23: ps lstart reports whole seconds, so allow one second around the identity record mtime.
export const LANE_WATCHER_START_TOLERANCE_MS = 1_000;
// chosen 2026-10-23: a stuck repository lookup must not hold a lane lock; two seconds covers a local HEAD read.
export const LANE_WATCHER_GIT_TIMEOUT_MS = 2_000;
// contract: .NET TimeSpan.TicksPerSecond, 100-nanosecond ticks (R-1891)
export const WIN_CPU_TICKS_PER_SECOND = 10_000_000;
// the owner's roster ruling, 2026-10-06; since the roster lane (2026-10-13) a machine's roster lives in the user-scope nana-pack.json (R-1120-R-1122), and LANE_DEFAULTS is the default builder only.
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
// contract: R-1122, R-2563 — the slots that may hold a Claude Code entry ({runtime, model}) instead
// of a pi entry. The larger-lane builder was added by the roster lane on 2026-10-16; the reviewer
// was added for the Claude Code review launcher under the owner's fleet ruling on 2026-10-22.
export const CLAUDE_CODE_SLOTS = Object.freeze(['largerBuilder', 'reviewer']);
// contract: R-1122 — chosen name: it says which runtime starts the entry.
export const CLAUDE_CODE_RUNTIME = 'claude-code';
// contract: R-1122 — Claude Code 2.1.299's Agent tool input schema, its `model` field, read from
// the installed binary's strings on 2026-10-16 (`cc-strings.txt:337100`): model:U(["sonnet","opus","haiku","fable"]).
export const CLAUDE_CODE_SUBAGENT_MODELS = Object.freeze(['sonnet', 'opus', 'haiku', 'fable']);
// contract: R-1123, R-1192 — the print order every roster-reading surface agrees on.
export const SLOT_PRINT_ORDER = Object.freeze(['scout', 'builder', 'largerBuilder', 'reviewer', 'land']);
// contract: R-1123 — the roster command's printed token for a null scout, largerBuilder or land;
// builder and reviewer are mandatory entries and have none.
export const SLOT_NULL_TOKENS = Object.freeze({ scout: 'none', largerBuilder: 'none', land: 'seat' });
// contract: R-1123 — the roster command's printed token for a pi entry's null (pi-default) thinking.
export const DEFAULT_THINKING_TOKEN = 'default';
// contract: pi 1.0.2 dist/cli/args.js:6 VALID_THINKING_LEVELS, read 2026-10-13.
export const THINKING_LEVELS = Object.freeze(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);
// contract: R-1190 — pi-worker's --lane-size value to the roster slot it starts.
export const LANE_SIZE_SLOTS = Object.freeze({ small: 'builder', larger: 'largerBuilder' });
// contract: R-1124 — the builder line's label when a lane starts the larger-lane builder.
export const LARGER_BUILDER_LABEL = 'builder (larger lanes)';

// contract: Claude Code 2.1.299 `claude --help`, read 2026-10-22 (R-2646, R-2655).
export const CLAUDE_TOOLS_FLAG = '--tools';
export const CLAUDE_STRICT_MCP_FLAG = '--strict-mcp-config';
export const CLAUDE_PERMISSION_MODE_FLAG = '--permission-mode';
export const CLAUDE_SETTING_SOURCES_FLAG = '--setting-sources';
export const CLAUDE_SETTINGS_FLAG = '--settings';
// contract: Claude Code 2.1.310 --help, read 2026-10-31 (R-3210).
export const CLAUDE_EFFORT_FLAG = '--effort';
// contract, measured 2026-10-22: named by Claude Code's `--bare` text though absent from `--help` (R-2646).
export const CLAUDE_APPEND_PROMPT_FILE_FLAG = '--append-system-prompt-file';
// chosen 2026-10-22: pi's sealed builder tools mapped one-to-one, without Agent, web or notebook tools (R-2646).
export const CLAUDE_BUILDER_TOOLS = 'Read,Grep,Glob,Bash,Edit,Write';
// measured 2026-10-22: default mode permits builder commands without auto-mode classification (R-2646).
export const CLAUDE_BUILDER_PERMISSION_MODE = 'default';
// contract: Claude Code 2.1.310 embedded settings schema and memory walk, read 2026-10-31 (R-3219).
// Only ancestor paths receive these suffixes; the tree's own instructions remain eligible.
export const CLAUDE_ANCESTOR_MEMORY_PATHS = Object.freeze(['CLAUDE.md', 'CLAUDE.local.md', '.claude/CLAUDE.md', '.claude/rules/**']);
// measured 2026-10-31: project/local drop user settings and hooks, but ancestor rules are Project memory (R-2646, R-3219).
export const CLAUDE_BUILDER_SETTING_SOURCES = 'project,local';
// measured 2026-10-22: a native Claude process can stay flat during a healthy or hung request (R-2651).
export const CLAUDE_BUILDER_STALL_SECS = Infinity;
// measured 2026-10-22: isolates the builder from Claude Code auto-memory (R-2654).
export const CLAUDE_BUILDER_CHILD_ENV = Object.freeze({ CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' });
// chosen 2026-10-22: one hour covers a measured 455.9-second suite plus one queued suite; the lane ceiling remains authoritative (R-2654).
export const CLAUDE_BUILDER_BASH_LIMIT_MS = 3_600_000;
// chosen: both files sit beside the rendered preamble in the lane launcher's existing temporary folder.
export const CLAUDE_BUILDER_PROMPT_FILE = 'builder-prompt.md';
export const CLAUDE_BUILDER_SETTINGS_FILE = 'builder-settings.json';
// measured 2026-10-22/23: these helpers work only when carried into flag settings (R-2655).
export const CLAUDE_CARRY_KEYS = Object.freeze(['apiKeyHelper', 'awsCredentialExport', 'proxyAuthHelper']);
// contract: Claude Code 2.1.299's connection-and-identity set, read 2026-10-23; proxy, CA, base URL and key names measured (R-2655).
export const CLAUDE_CARRY_ENV_NAMES = Object.freeze([
  'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY', 'ALL_PROXY', 'CLAUDE_CODE_PROXY_RESOLVES_HOSTS',
  'CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS', 'CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER', 'NODE_EXTRA_CA_CERTS',
  'CLAUDE_CODE_CERT_STORE', 'CLAUDE_CODE_CLIENT_CERT', 'CLAUDE_CODE_CLIENT_KEY',
  'CLAUDE_CODE_CLIENT_KEY_PASSPHRASE', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_CUSTOM_HEADERS',
  // measured 2026-10-31 in Claude Code 2.1.310 binary; carry-provenance.log in the context-anatomy review corpus (R-3211).
  'CLAUDE_CODE_GIT_BASH_PATH', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX',
  'AWS_REGION', 'AWS_PROFILE', 'CLOUD_ML_REGION', 'ANTHROPIC_VERTEX_PROJECT_ID',
  'ANTHROPIC_MODEL', 'ANTHROPIC_DEFAULT_OPUS_MODEL', 'ANTHROPIC_DEFAULT_SONNET_MODEL', 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
]);

// provenance: R-1120 — roles: the owner, 2026-10-06; provider and model ids: the seat's. The builder
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
// contract: R-1720, R-974
export const REVIEWER_CHILD_ENV = Object.freeze({ NANA_ROLE: 'reviewer', NANA_HANDOFF: 'off' });
// contract: npm 10.9.7's bin-links 5.0.0 bin-target.js — a shim's package sits in the sibling
// node_modules (the global layout) or one level up through node_modules/.bin (the local layout).
export const NPM_DIRS = Object.freeze(['node_modules', '.bin']);

// contract: pi 1.0.2 dist/core/tools/bash.js:135-157 and docs/environment-variables.md "Shell
// Tool Session Environment", read 2026-10-19 — the variable pi sets for its own bash and
// powershell tool calls only; a model's `!` shell does not get it.
export const PI_MODEL_SHELL_ENV = 'PI_SESSION_ID';
