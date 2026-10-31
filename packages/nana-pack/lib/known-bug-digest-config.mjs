/**
 * @module packages/nana-pack/lib/known-bug-digest-config.mjs
 * @purpose Declare the role-context digest budget and reviewer section framing.
 * @inputs none
 * @outputs Digest limit, meaningful span floor, section heading and lead.
 * @effects none
 * @errors none
 */
// chosen 2026-10-31: anatomy builder budget, about a quarter of FEAT-039's 79%-of-addendum load (R-3218).
// Chars are UTF-16 units of UTF-8-decoded text, matching the shared-memory hook budget.
export const KNOWN_BUG_DIGEST_CHARS = 6000;
// chosen, not sealed: four excludes short flags such as -p from broad substring matches (plan O6).
export const KNOWN_BUG_MATCH_MIN_CHARS = 4;
// contract R-3214: one section after movement, before the Claude review standard.
export const KNOWN_BUG_SECTION_HEADING = '## Feature known bugs';
export const KNOWN_BUG_SECTION_LEAD = 'A recorded line is context and does not change a finding’s class under the review standard.';
