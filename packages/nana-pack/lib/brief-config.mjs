/**
 * @module packages/nana-pack/lib/brief-config.mjs
 * @purpose Define the sealed vocabulary and bounded git-list output for lane brief precedent checks.
 * @inputs none
 * @outputs Precedent section, none-entry and feature-line tokens, accepted trailing punctuation, and git output cap.
 * @effects none
 * @errors none
 */
/** Contract: the owner's 2026-10-22 ruling; R-2578. */
export const PRECEDENT_SECTION = "Precedent";
/** Chosen: the 2026-10-22 precedent audit's explicit no-precedent form; R-2578. */
export const PRECEDENT_NONE = "none:";
/** Contract: AGENTS.md's lane-brief convention and the requirements skill; R-2581. */
export const FEATURE_LINE_PREFIX = "Feature: ";
/** Chosen: 77 of 378 recorded build briefs put one of these marks after a path (2026-10-22 adversary M1). */
export const PRECEDENT_TRAILING_PUNCTUATION = ",;.)";
/** Chosen: 65,536 bytes is about four times the largest real-brief path listing measured on 2026-10-22 and stays below Node's 1 MiB default. */
export const PRECEDENT_LIST_MAX_BYTES = 65_536;
