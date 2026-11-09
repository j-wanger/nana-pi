/**
 * @module packages/nana-pack/lib/review-timeline-config.mjs
 * @purpose Bound finding titles and name the MUST classification used by review findings.
 * @inputs none
 * @outputs FINDING_MAX_CHARS, WORD_MUST
 * @effects none
 * @errors none
 */

/** chosen (2026-10-19): keep a reviewer's finding title readable without unbounded output. */
export const FINDING_MAX_CHARS = 200;

/** contract: prompts/review-standard.md (Classify each finding MUST, SHOULD or NOTE). */
export const WORD_MUST = "MUST";
