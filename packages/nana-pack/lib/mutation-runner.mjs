/**
 * @module packages/nana-pack/lib/mutation-runner.mjs
 * @purpose Run a lane's mutation pair table in scratch worktrees of its tip, split across shard processes, and write one judged record.
 * @inputs a lane table object (lane, self, tip, pairs, optional branch/declared/config), argv pair ids, SEAT_MUTATE_ env vars
 * @outputs a judged record (console and optionally SEAT_MUTATE_OUT), the process exit code
 * @effects disk (scratch git worktrees, the record and lock files, per-pair logs), process (spawns shard children and test-file children, applies signal handlers)
 * @errors refuses before any worktree on a bad id, config key, shard count, stagger or unresolved tip (R-1240, R-1244); reports ANCHOR-MISS/SYNTAX/RED per pair; never throws out of runMutations
 */
// STUB (build commit 2 of docs/reviews/mutate-runner-2026-10-17/CHANGE.md): every export below throws, so
// the new test file's 26 titles are seen red before any behaviour lands. The next build commit replaces
// this file's body; the exported names and signatures are the ones §3.1 fixes.

/** Run a lane's pair table end to end; resolves to the process exit code. Never throws. */
export async function runMutations(_table) {
	throw new Error("mutation-runner: runMutations is not implemented yet");
}

/** Pure: judge one pair from its test files' outputs. No effects, so judging is tested without git. */
export function judgePair(_pair, _runs) {
	throw new Error("mutation-runner: judgePair is not implemented yet");
}

/** Pure: the shard count for this run. No effects. */
export function shardCount(_env, _selected, _config) {
	throw new Error("mutation-runner: shardCount is not implemented yet");
}

/** Reset a scratch worktree to `tip`, refusing first unless `dir` is its own git root (M2). */
export function resetScratch(_dir, _tip, _config) {
	throw new Error("mutation-runner: resetScratch is not implemented yet");
}
