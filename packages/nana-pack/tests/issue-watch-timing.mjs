/**
 * @module packages/nana-pack/tests/issue-watch-timing.mjs
 * @purpose Define the sealed real-time issue-watch harness timings and their provenance.
 * @inputs none
 * @outputs Named millisecond limits and fixture delays, sealed by R-3705.
 * @effects none
 * @errors none
 */
export const CASE_LIMIT_MS = 8000; // chosen: preserve the existing check guard.
export const CLI_DEADLINE_MS = 20000; // chosen 2026-11-02: above 4000 + 2 * 6390 = 16780 ms; 6390 is the cold Windows node-child observation in frontier-summary-config. Not a gh-call allowance: its product deadline stays unchanged.
export const CLI_EXIT_GRACE_MS = 3000; // chosen 2026-11-02: restart is the final output and exit spawns nothing; three seconds generously allows stream flush and process teardown, not cold child startup.
export const CLI_CLEANUP_MS = 2000; // chosen: bounded allowance for tree kill and child close after the deadline.
export const CLI_CASE_MARGIN_MS = 3000; // chosen: cleanup allowance plus 1000 ms for case scheduling; the child owns the diagnostic first.
export const CLI_START_DELAY_MS = 4000; // chosen: synchronous startup delay plus main's 3000 ms window exceeds its 6000 ms deadline.
export const SIGNAL_POLL_MS = 25; // chosen: short portable file poll, following launch-wait's polling step (O1 default).
export const WATCH_POLL_MS = 50; // chosen: preserve the CLI fixture's accelerated watch interval.
export const DEFAULT_RUNNER_MS = 3000; // chosen: preserve R-2997's asynchronous delivery bound.
export const ROLE_EXIT_MS = 2000; // chosen: preserve R-2996's role-exit bound.
export const ABSENT_POINTER_EXIT_MS = 5000; // chosen: preserve R-2994's no-pointer exit bound.
