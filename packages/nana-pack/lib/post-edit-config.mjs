/**
 * @module packages/nana-pack/lib/post-edit-config.mjs
 * @purpose Define the post-edit check's default time limit once, with its provenance.
 * @inputs none
 * @outputs POST_EDIT_DEFAULT_TIMEOUT_MS
 * @effects none
 * @errors none
 */

/** chosen: the pack's first release (2026-09-01) gave each check 30 seconds; not measured.
 *  A command's own timeoutMs overrides it, and 0 arms no deadline (R-1702). Pinned by R-2151. */
export const POST_EDIT_DEFAULT_TIMEOUT_MS = 30_000;
