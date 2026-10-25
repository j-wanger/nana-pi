/**
 * @module packages/nana-pack/lib/runtime-map-config.mjs
 * @purpose Declare the runtime map and impact command's tunables with their provenance.
 * @inputs none
 * @outputs RUNTIME_SCHEMA, COVERAGE_ENV, RECORD_FILE, COMPLETION_FILE, KNOB_LINE, DATA_FILE_ENV,
 *  DATA_SUBPATH, STOP_SIGNALS, STALE_MARK, NOTE_PREFIX, NOT_COUNTED, ARTIFACT_HEADING,
 *  ARTIFACT_WRITES, ARTIFACT_READ_BY, ARTIFACT_NO_IMPORT_PATH, ARTIFACT_READS, ARTIFACT_STAR,
 *  ARTIFACT_NO_LIVE_ENTRY, ARTIFACT_NONE, ARTIFACT_CLOSING_NOTE, ARTIFACT_NOTE_PREFIX, COVERAGE_PREFIX,
 *  SECONDS_DIGITS, STOP_WAIT_MS, TREE_LIST
 * @effects none
 * @errors none
 */
// must-meet.md (docs/reviews/runtime-map-2026-10-17/) is the plan of record: nine rows, R-1270 to
// R-1278. Every tunable the runner (scripts/test.mjs), the measure command
// (scripts/runtime-measure.mjs) and the impact reader (packages/nana-pack/lib/runtime-map.mjs)
// use is named here once and imported by name — never an inline literal at a point of use.
// The artifact labels belong here too, so the impact shim can pin them without loading its parse chain.

// contract (R-1274, R-1276): the data file's shape version; a mismatch reads as absent data.
export const RUNTIME_SCHEMA = 1;

// contract (R-1270); chosen: outside NANA_TEST_, so R-618's existing scrub already keeps it from
// every spawned test file with no new code (the runner strips every ambient NANA_* but the
// NANA_TEST_* knobs before building a test file's env).
export const COVERAGE_ENV = "NANA_COVERAGE_DIR";

// contract (R-1271); chosen: Node names its own per-file coverage files
// coverage-<pid>-<n>-<n>.json, so no file Node writes can collide with this name.
export const RECORD_FILE = "runner-record.json";

// contract (R-1271, R-1275); chosen: it sits at the knob folder's top, beside the run-position
// folders, so its presence (and the count it names) tells a complete run from an interrupted one.
export const COMPLETION_FILE = "runner-done.json";

// contract (R-1270); chosen: the runner's own "[runner]" line prefix (scripts/test.mjs).
export const KNOB_LINE = "[runner] coverage on:";

// contract (R-1278); chosen: the override shape of NANA_SUITE_LOCK_DIR
// (scripts/test-locked.mjs) — a NANA_ name, so every check can point the real CLI at fixture
// data without touching this clone's own.
export const DATA_FILE_ENV = "NANA_RUNTIME_MAP_FILE";

// contract (R-1278): the owner's answer 1 — local, outside the repository, under the clone's
// shared git common directory, so every worktree of the clone reads and writes one file.
export const DATA_SUBPATH = "nana/runtime-map.json";

// contract (R-1277): every stop signal the measure command handles.
export const STOP_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"];

// contract (R-1274).
export const STALE_MARK = "[stale]";

// contract (R-1272, R-1273): every runtime-map note on stdout opens with this.
export const NOTE_PREFIX = "runtime map:";

// contract (FEAT-029, R-2820–R-2823): labels emitted by the impact artifact block.
export const ARTIFACT_HEADING = "artifacts for";
export const ARTIFACT_WRITES = "writes";
export const ARTIFACT_READ_BY = "read by";
export const ARTIFACT_NO_IMPORT_PATH = "(no import path)";
export const ARTIFACT_READS = "reads";
export const ARTIFACT_STAR = "*";
export const ARTIFACT_NO_LIVE_ENTRY = "(no live entry)";
export const ARTIFACT_NONE = "artifacts: no Artifact writer list or Reads line names";
export const ARTIFACT_CLOSING_NOTE = "artifact block shows only Artifact: writer lists and other features' Reads: lines; it leaves out readers in the maker's own feature, deliverable Read by: lines, hand-run makers and a file that is itself an artifact's location";
export const ARTIFACT_NOTE_PREFIX = "artifact note:";

// contract (R-1272): the impact command's closing-line clause naming what a zero line does not mean.
export const NOT_COUNTED = "copies run from a temporary folder and children stopped by a signal are not counted";

// chosen: a leftover temp folder names its owner, as the runner's own "nana-test-runner-" does.
export const COVERAGE_PREFIX = "nana-runtime-";

// chosen: the runner's own printed seconds precision (scripts/test.mjs).
export const SECONDS_DIGITS = 1;

// chosen: ten times test-locked's 500ms kill escalation, so a POSIX stop ends well inside it.
export const STOP_WAIT_MS = 5000;

// contract (R-1277); chosen: one listing gives every process's pid, parent pid and process
// group id in one call (Ran on macOS during planning).
export const TREE_LIST = ["ps", "-A", "-o", "pid=,ppid=,pgid="];
