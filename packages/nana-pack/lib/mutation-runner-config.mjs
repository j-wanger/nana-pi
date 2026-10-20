/**
 * @module packages/nana-pack/lib/mutation-runner-config.mjs
 * @purpose Hold the mutation runner's tunables and contract values, each with its provenance.
 * @inputs none
 * @outputs SHARDS_DEFAULT, STAGGER_SECS_DEFAULT, FILE_TIMEOUT_MS, BASELINE_RETRIES, WORKTREE_REMOVE_RETRIES,
 *  WORKTREE_REMOVE_RETRY_MS, WORKTREE_LOCK_WAIT_MS, WORKTREE_LOCK_UNREADABLE_STALE_MS,
 *  WORKTREE_LOCK_WAIT_LIMIT_MS, WORKTREE_LOCK_RELEASE_WAIT_LIMIT_MS, DRAIN_MS, SCRATCH_PREFIX, MAIN_BRANCH,
 *  ENV_NAMES, LOCK_SUFFIX, WORKTREE_LOCK_BREAKER_SUFFIX, TABLE_HASH_ALGO,
 *  OVERRIDABLE, EXIT_REFUSED, EXIT_TABLE_FAULT,
 *  SIGNAL_EXITS, CHILD_NODE_ARGS, TASKKILL_ARGS, TS_CHECK_ARGS, NPM_COMMAND, NPM_KEYS, GLOBAL_PREFIX_KEY, logName
 * @effects none
 * @errors none
 */
// CHANGE.md §3.5 (docs/reviews/mutate-runner-2026-10-17/CHANGE.md): every value below is named, never
// inlined at a point of use. A lane table's `config` may override only the keys in OVERRIDABLE (R-1244);
// every other value here is fixed.

// chosen (seat, 2026-10-16), the landed default (seat-mutate.mjs :56): three five-shard records on the
// 10-core seat machine ran the regroup hand split at five, 8.6 pairs a minute against 2.0 to 3.3 serially
// (CHANGE.md §1). The claim most likely wrong (CHANGE.md §5.4).
export const SHARDS_DEFAULT = 5;

// chosen (seat, 2026-10-16), the landed default (seat-mutate.mjs :59): N worktree adds and first test
// files do not all begin in the same second; not measured.
export const STAGGER_SECS_DEFAULT = 4;

// chosen: every copy uses 10 minutes (seat-mutate.mjs :50-51), twice the suite's 5 (scripts/test.mjs :57),
// because shards share the machine.
export const FILE_TIMEOUT_MS = 10 * 60 * 1000;

// chosen: the landed runner re-runs a red baseline file once, because other jobs share the machine
// (seat-mutate.mjs :416-421).
export const BASELINE_RETRIES = 1;

// chosen: not measured; a Windows hold on a scratch entry's files should clear within a second; retune if
// a record shows the still-listed line (R-1773).
export const WORKTREE_REMOVE_RETRIES = 3;

// chosen: not measured; a Windows hold on a scratch entry's files should clear within a second; retune if
// a record shows the still-listed line (R-1773).
export const WORKTREE_REMOVE_RETRY_MS = 250;

// chosen: 25 milliseconds keeps a held cross-shard worktree-operation lock responsive without hot polling;
// not measured (R-1775).
export const WORKTREE_LOCK_WAIT_MS = 25;

// chosen: 30 seconds is longer than this runner's normal add and bounded removal operation, while allowing
// recovery from an old lock whose owner record was damaged before this atomic protocol (R-1777).
export const WORKTREE_LOCK_UNREADABLE_STALE_MS = 30_000;

// chosen: 30 seconds is longer than a normal add and the bounded worktree removal operation; acquisition
// must still end if a live pid is reused or Windows keeps the lock path inaccessible (R-1778, R-1779).
export const WORKTREE_LOCK_WAIT_LIMIT_MS = 30_000;

// chosen: five minutes gives Windows' delete-pending state ten acquisition windows to clear while still
// bounding a seat whose owned lock path stays inaccessible (R-1960).
export const WORKTREE_LOCK_RELEASE_WAIT_LIMIT_MS = 300_000;

// contract R-1234: the suite runner's drain (scripts/test.mjs :58), so a file ends as under `npm test`.
// Defined twice until the parallel suite lane (CHANGE.md §3.5, residual 1): a declared violation.
export const DRAIN_MS = 2000;

// chosen: one prefix, so a leftover folder is easy to find.
export const SCRATCH_PREFIX = "seat-mutate-";

// contract R-1240: the working pattern's base branch, read for the merge base (seat-mutate.mjs :313).
export const MAIN_BRANCH = "main";

// contract R-1230, R-1231, R-1238, R-1239, R-1241, R-1775: the runner's environment names.
// SHARD, TALLY, SCRATCH, TIP_COMMIT, TABLE_HASH and WORKTREE_LOCK are parent-to-shard values; the shared
// WORKTREE_LOCK path serializes worktree administration in one run.
export const ENV_NAMES = Object.freeze({
	OUT: "SEAT_MUTATE_OUT",
	TIP: "SEAT_MUTATE_TIP",
	DRY: "SEAT_MUTATE_DRY",
	KEEP: "SEAT_MUTATE_KEEP",
	LOGDIR: "SEAT_MUTATE_LOGDIR",
	SHARDS: "SEAT_MUTATE_SHARDS",
	STAGGER_SECS: "SEAT_MUTATE_STAGGER_SECS",
	// shard-only: set by the parent on each shard child, never by a caller.
	SHARD: "SEAT_MUTATE_SHARD",
	TALLY: "SEAT_MUTATE_TALLY",
	SCRATCH: "SEAT_MUTATE_SCRATCH",
	TIP_COMMIT: "SEAT_MUTATE_TIP_COMMIT",
	TABLE_HASH: "SEAT_MUTATE_TABLE_HASH",
	WORKTREE_LOCK: "SEAT_MUTATE_WORKTREE_LOCK",
});

// chosen: the lock sits beside the record under the record's own name, so a refusal names a file the seat
// can find (R-1242).
export const LOCK_SUFFIX = ".lock";

// chosen: a short adjacent suffix gives every dead-lock takeover one atomic breaker without changing the
// operation lock's established path or ownership format (R-2170).
export const WORKTREE_LOCK_BREAKER_SUFFIX = ".break";

// chosen: Node's built-in hash, so the runner keeps no dependency; the header names the algorithm beside
// the value (R-1243).
export const TABLE_HASH_ALGO = "sha256";

// contract R-1244: the values a lane or a check may need to change — the four chosen run limits and
// NPM_COMMAND, which a check replaces with one that cannot start. Every other value in this module stays
// fixed; a table's `config` naming a key outside this list is refused (R-1244).
export const OVERRIDABLE = Object.freeze(["SHARDS_DEFAULT", "STAGGER_SECS_DEFAULT", "FILE_TIMEOUT_MS", "BASELINE_RETRIES", "NPM_COMMAND"]);

// contract R-1235, R-1236, R-1239, R-1240: the landed exits (seat-mutate.mjs :438, :496, :569-570, :577).
export const EXIT_REFUSED = 2;
export const EXIT_TABLE_FAULT = 3;

// contract R-1231: the suite runner's codes (scripts/test.mjs :109) and the landed runner's (seat-mutate.mjs :399).
export const SIGNAL_EXITS = Object.freeze({ SIGINT: 130, SIGTERM: 143 });

// contract R-1232, after R-603 (scripts/test.mjs): the flag every test file runs with.
export const CHILD_NODE_ARGS = Object.freeze(["--experimental-strip-types"]);

// contract R-1233: the suite runner's tree kill (scripts/test.mjs :81).
export const TASKKILL_ARGS = Object.freeze(["/T", "/F", "/PID"]);

// contract R-1235: the repository's own `.ts` post-edit command (.pi/nana-pack.json :5), whose checker
// R-993 and R-994 state. The last element is the checker script's path, resolved against the table's
// checkout (repo root); the mutated file is appended as the final argument.
export const TS_CHECK_ARGS = Object.freeze(["--no-warnings", "--experimental-vm-modules", "scripts/ts-syntax-check.mjs"]);

// contract R-1232: the command npm's values come from; a check replaces it with one that cannot start.
export const NPM_COMMAND = "npm";

// contract R-1232: the values `npm run` exports that the landed runner supplies (seat-mutate.mjs :289-295).
export const NPM_KEYS = Object.freeze(["prefix", "globalconfig", "userconfig"]);
export const GLOBAL_PREFIX_KEY = "global_prefix";

// contract R-1241: a pair's per-file log name — the pair id with each `/` turned into `-`, then `--`,
// then the test file's own base name. A pure function, so no literal is a point of use elsewhere.
export function logName(pairId, baseName) {
	return `${String(pairId).split("/").join("-")}--${baseName}`;
}
