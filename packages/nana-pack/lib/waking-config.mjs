/**
 * @module packages/nana-pack/lib/waking-config.mjs
 * @purpose Define the chosen waking policy for project-scope Claude seat hooks.
 * @inputs none
 * @outputs Lane age, wake interval, owner window, launch vocabulary, git budget and writing bounds.
 * @effects none
 * @errors none
 */
/** chosen: two days keeps recent queues visible without waking for parked lanes. */
export const OPEN_LANE_AGE_MS = 48 * 60 * 60 * 1000;
/** chosen: a half-hour wake bounds unattended queue delays. */
export const WAKE_INTERVAL_MINUTES = 30;
/** chosen: after a quarter-hour, questions must not freeze the queue. */
export const OWNER_WINDOW_MS = 15 * 60 * 1000;
/** chosen: only launches whose completion advances a nana lane need a task notification. */
export const LANE_TOOL_LAUNCHES = [
 { tool: "pi-worker", flag: "--brief" },
 { tool: "pi-worker.mjs", flag: "--brief" },
 { tool: "pi-review", flag: "--item" },
 { tool: "pi-review.mjs", flag: "--item" },
 { tool: "claude-review.mjs", flag: "--item" },
 { tool: "nana-ci-wait.mjs", flag: "--tip" },
];
/** contract (seat-tools brief, 2026-11-12, R-4212): red main waits post their own issue. */
export const MAIN_CI_TOOL = "nana-main-ci.mjs";
export const MAIN_CI_WAIT_FLAG = "--wait";
export const MAIN_CI_POST_FLAG = "--post";
/** contract (seat-tools brief, 2026-11-12, R-4213): truncating pipes hide launch exit codes. */
export const TRUNCATING_PIPE_TOOLS = ["tail", "head"];
/** chosen: local read-only git queries should finish well inside a hook invocation. */
export const WAKING_GIT_TIMEOUT_MS = 2000;
/** chosen: two counted sentences includes the approved two-sentence status-report failure. */
export const REPORT_SENTENCE_MIN = 2;
/** contract (seat-tools brief, 2026-11-12, R-4210): measures marker in verdict-led statuses. */
export const MEASURES_PHRASE = "median lane";
/** contract (owner 2026-11-13, R-4210): measures only on reports that land work or ask the owner to decide. */
export const MEASURES_VERDICTS = ["LANDED", "YOUR CALL"];
/** contract (seat-tools brief, 2026-11-12, R-4211): landing reports name deferrals and validation. */
export const LANDING_VERDICTS = ["LANDED"];
export const LANDING_LINES = ["Deferred:", "Validation:"];
/** chosen: a dozen findings keeps the correction actionable without flooding Stop output. */
export const WRITING_FINDING_CAP = 12;
/** chosen: bound finding details and issue titles while leaving room for the correction instruction. */
export const WRITING_REASON_CAP = 1500;
