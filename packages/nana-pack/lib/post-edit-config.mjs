/**
 * @module packages/nana-pack/lib/post-edit-config.mjs
 * @purpose Define each post-edit check tunable once, with its provenance.
 * @inputs none
 * @outputs POST_EDIT_DEFAULT_TIMEOUT_MS, POST_EDIT_KILL_GRACE_MS, POST_EDIT_OUTPUT_CAP,
 *  POST_EDIT_FAILURE_CAP, POST_EDIT_COMMAND_CAP, POST_EDIT_LOCK_MESSAGE_CAP
 * @effects none
 * @errors none
 */

/** chosen: the pack's first release (2026-09-01) gave each check 30 seconds; not measured.
 *  A command's own timeoutMs overrides it, and 0 arms no deadline (R-1702). Pinned by R-2151. */
export const POST_EDIT_DEFAULT_TIMEOUT_MS = 30_000;

/** chosen: the 2026-09-08 hang fix's grace between the deadline's SIGTERM and the unignorable
 *  SIGKILL + settlement; not measured. Pinned by R-2215. */
export const POST_EDIT_KILL_GRACE_MS = 2000;

/** chosen: Node's exec maxBuffer default, which the check used before spawn replaced exec. It
 *  counts UTF-16 units over stdout and stderr together. Pinned by R-2215. */
export const POST_EDIT_OUTPUT_CAP = 1024 * 1024;

/** contract value (R-087): the last 2000 chars of a failing check's output are kept. */
export const POST_EDIT_FAILURE_CAP = 2000;

/** chosen 2026-09-29: the repo-configured command, shown to the model; its truncation is stated.
 *  Pinned by R-2215. */
export const POST_EDIT_COMMAND_CAP = 400;

/** chosen 2026-09-29: the file-mutation queue's refusal message, shown to the model; its
 *  truncation is stated. Pinned by R-2215. */
export const POST_EDIT_LOCK_MESSAGE_CAP = 300;
