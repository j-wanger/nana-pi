/**
 * @module packages/nana-pack/lib/review-timeline-config.mjs
 * @purpose Tunables, contract words and fixed statements the review timeline prints, each with its
 *  provenance, so no inline literal carries review-timeline's behavior at its point of use.
 * @inputs none
 * @outputs SHORT_REVISION_CHARS, FINDING_MAX_CHARS, WORD_MUST, WORD_SHOULD, WORD_NOTE, WORD_SEND_BACK,
 *  REVIEW_TIMELINE_STATEMENTS, MARK_UNVERIFIED, MARK_NO_VERDICT, MISSING_FIELD
 * @effects none
 * @errors none
 */

/** contract: the R-970 report (`review-ledger report`) already prints a 12-character revision. */
export const SHORT_REVISION_CHARS = 12;

/** chosen (2026-10-19): long enough to keep a reviewer's own finding title readable end to end,
 *  short enough that one finding cannot grow into the rest of the timeline's budget. */
export const FINDING_MAX_CHARS = 200;

/** contract: prompts/review-standard.md ("Classify each finding MUST, SHOULD or NOTE", the
 *  `VERDICT: LAND` / `VERDICT: SEND-BACK` line). */
export const WORD_MUST = "MUST";
export const WORD_SHOULD = "SHOULD";
export const WORD_NOTE = "NOTE";
export const WORD_SEND_BACK = "SEND-BACK";

/** contract: R-1562 — the four cases a sent-back review's findings can fail to read, stated in
 *  place of findings instead of silently printing none. */
export const REVIEW_TIMELINE_STATEMENTS = Object.freeze({
	noFileRecorded: "no review file recorded",
	fileGone: "review file gone",
	verdictDisagrees: "the file's verdict disagrees with the ledger",
	noMustReadable: "no MUST readable",
});

/** contract: R-1563 — the marks a review's own line carries. */
export const MARK_UNVERIFIED = "unverified";
export const MARK_NO_VERDICT = "no verdict";
export const MISSING_FIELD = "-";
