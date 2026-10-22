/**
 * @module packages/nana-pack/lib/known-bugs-config.mjs
 * @purpose Define the pack-wide known-bug directory and unplaced-entry filename.
 * @inputs none
 * @outputs KNOWN_BUGS_DIR and UNPLACED_FILE.
 * @effects none
 * @errors none
 */
/** Chosen: docs/known-bugs sits beside docs/reviews and docs/sessions; contract for R-2505, R-2509 and R-2510. */
export const KNOWN_BUGS_DIR = "docs/known-bugs";
/** Chosen: a plain name for lines no feature owns; moved with the directory constant for cohesion. */
export const UNPLACED_FILE = "unplaced.md";
