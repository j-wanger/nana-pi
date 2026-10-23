/**
 * @module packages/nana-pack/lib/build-records-config.mjs
 * @purpose Declare build-record schemas, paths, matching vocabulary, read limits, and display precision with provenance.
 * @inputs none
 * @outputs Build ledger, session matching, usage selection, and report constants.
 * @effects none
 * @errors none
 */

// chosen (D1, R-2596, 2026-10-22): beside nana/runtime-map.json and nana/suite-runs in the git common folder.
export const BUILD_RECORDS_SUBPATH = "nana/build-records.jsonl";
// contract (R-2596, R-2600): readers skip records of every other schema.
export const BUILD_RECORD_SCHEMA = 1;
// contract (R-2596, R-2597): the two append-only record kinds.
export const BUILD_RECORD_KINDS = Object.freeze(["start", "end"]);
// contract (R-2597, R-2601): four written outcomes and the report-only unpaired state.
export const BUILD_OUTCOMES = Object.freeze(["ok", "failed", "ceiling", "stopped", "no end"]);
// contract (R-2599, R-2602): every worker build-record diagnostic starts with this text.
export const BUILD_RECORD_LINE_PREFIX = "pi-worker: build record:";

// contract (R-2598): pi-worker passes this tag to runWatchdog and the session matcher uses it.
export const WORKER_TAG = "pi-worker";
// contract (R-2598; packages/nana-pack/bin/pi-watchdog.mjs, 2026-10-22): attempt names insert this text before the attempt number.
export const WORKER_ATTEMPT_INFIX = "-a";
// contract (R-2598; pi 1.0.2 session-manager.js): persisted session files use this suffix.
export const BUILD_SESSION_FILE_SUFFIX = ".jsonl";
// contract (R-2598; pi 1.0.2 session-manager.js): filename timestamps are ISO strings with colons and the decimal point replaced by hyphens.
export const BUILD_SESSION_STAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z_/;
// contract (R-2598; pi 1.0.2 agent-session.js getSessionStats): these message roles can carry Usage.
export const BUILD_USAGE_MESSAGE_ROLES = Object.freeze(["assistant", "toolResult"]);
// contract (R-2598; pi 1.0.2 agent-session.js getSessionStats): these top-level entries can carry Usage.
export const BUILD_USAGE_ENTRY_TYPES = Object.freeze(["usage", "compaction", "branch_summary"]);

// measured (R-2598, this Mac 2026-10-22): header plus first session_info ended within 356 bytes over 2,482 named sessions.
export const BUILD_SESSION_HEAD_BYTES = 4 * 1024;
// chosen (R-2598, 2026-10-22): about 22 times the measured 2,936,151-byte largest builder session of 605.
export const BUILD_SESSION_READ_MAX_BYTES = 64 * 1024 * 1024;
// chosen (R-2600, 2026-10-22): about 2.5 years at the inferred 33 KiB daily growth from 423 builds in 16 days.
export const BUILD_LEDGER_READ_MAX_BYTES = 32 * 1024 * 1024;
// chosen (R-2600, R-2602): cents are the cost grain used for lane decisions.
export const REPORT_COST_DIGITS = 2;
// chosen (D8, R-2600): reports use elapsed whole minutes rounded down.
export const REPORT_MILLISECONDS_PER_MINUTE = 60_000;
export const REPORT_MINUTE_ROUNDING = "floor";
