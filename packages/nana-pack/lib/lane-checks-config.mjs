/**
 * @module packages/nana-pack/lib/lane-checks-config.mjs
 * @purpose Declare builder-stop check execution and report bounds.
 * @inputs none
 * @outputs Named timeout and retained-output limits.
 * @effects none
 * @errors none
 */
// chosen 2026-11-11: fifteen minutes covers the seat Mac's 543.5 s check:lane run
// selecting 233 files, plus the roughly thirty-second base rail and margin for load.
export const LANE_CHECK_TIMEOUT_MS = 900_000;
// chosen 2026-11-09: retain the failing tail without unbounded build records or stderr reports.
export const LANE_CHECK_OUTPUT_CHARS = 16_000;
// chosen 2026-11-09: local worktree operations must not hang a completed build.
export const LANE_CHECK_GIT_TIMEOUT_MS = 30_000;
