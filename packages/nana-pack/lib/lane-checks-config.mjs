/**
 * @module packages/nana-pack/lib/lane-checks-config.mjs
 * @purpose Declare builder-stop check execution and report bounds.
 * @inputs none
 * @outputs Named timeout and retained-output limits.
 * @effects none
 * @errors none
 */
// chosen 2026-11-09: five minutes covers the recorded roughly thirty-second rail on a busy machine.
export const LANE_CHECK_TIMEOUT_MS = 300_000;
// chosen 2026-11-09: retain the failing tail without unbounded build records or stderr reports.
export const LANE_CHECK_OUTPUT_CHARS = 16_000;
// chosen 2026-11-09: local worktree operations must not hang a completed build.
export const LANE_CHECK_GIT_TIMEOUT_MS = 30_000;
