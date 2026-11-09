/**
 * @module packages/nana-pack/lib/brief-config.mjs
 * @purpose Define sealed vocabulary and bounded git-list output for lane brief completeness checks.
 * @inputs none
 * @outputs Precedent, fix-card, Serves, Validation and feature-line tokens, accepted trailing punctuation, and git output cap.
 * @effects none
 * @errors none
 */
/** Contract: the owner's 2026-10-22 ruling; R-2578. */
export const PRECEDENT_SECTION = "Precedent";
/** Chosen: the 2026-10-22 precedent audit's explicit no-precedent form; R-2578. */
export const PRECEDENT_NONE = "none:";
/** Contract: AGENTS.md's lane-brief convention and the requirements skill; R-2581. */
export const FEATURE_LINE_PREFIX = "Feature: ";
/** Contract: owner's 2026-11-06 #338 decision; R-3735. */
export const FIX_CARD_LINE = "Card: fix";
/** Contract (memory-sort plan, R-3949): lane briefs declare their priority contribution. */
export const SERVES_LINE_PREFIX = "Serves:";
/** Contract (T1 plan, R-3986): follows the Serves completeness precedent. */
export const VALIDATION_LINE_PREFIX = "Validation:";
/** Measured: 263 list entries in 110 of 388 tracked build briefs end a path-like first token with `:`; 106 in 72 with `,` (2026-10-22 adversary M2). */
export const PRECEDENT_TRAILING_PUNCTUATION = ",;.):";
/** Chosen: 65,536 bytes is about four times the largest real-brief path listing measured on 2026-10-22 and stays below Node's 1 MiB default. */
export const PRECEDENT_LIST_MAX_BYTES = 65_536;
/** Contract (precedent-line-parse plan Revision 3, R-3719): chosen to bound each diagnostic bullet including its ellipsis. */
export const PRECEDENT_QUOTE_CAP = 160;
