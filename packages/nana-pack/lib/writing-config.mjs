/**
 * @module packages/nana-pack/lib/writing-config.mjs
 * @purpose Every tunable the writing checker reads, each defined once with its provenance (G-001, G-002), so no inline literal appears at a point of use.
 * @inputs none — pure constants
 * @outputs SENTENCE_CAP, PASSIVE, PASSIVE_EXCEPTIONS, VERDICT_WORDS, BANNED_WORDS, IDENTIFIER_CODE_SPAN, IDENTIFIER_PATH, MIN_SENTENCE_WORDS
 * @effects none
 * @errors none
 */
// Sealed tunables for the writing checker (design-ruling.md, 2026-10-04, §3). Defined once
// here, read by name everywhere else (lib/writing-check.mjs, bin/nana-writing.mjs). Retuning
// any of these must change no code — only this file (G-003).

/** Sentence-length cap, in words. Source: ASD-STE100 Issue 9's descriptive-text cap, via
 *  `research/karpathy-x-2026-10-04.md` §5.2, 2026-10-04 [S]. Pinned by
 *  writing-check.test.mjs::seal: SENTENCE_CAP is 25 (R-744). */
export const SENTENCE_CAP = 25;

/** chosen: the passive-voice shape from `research/karpathy-x-2026-10-04.md` §5.4 (an auxiliary
 *  followed by a word ending -ed or -en), widened to include -en past participles (e.g. "is
 *  written"). Report-only, so a false positive costs one line, not a block. Group 1 is the
 *  candidate participle, checked against PASSIVE_EXCEPTIONS below. */
export const PASSIVE = /\b(?:is|are|was|were|be|been|being)\s+(\w{3,}(?:ed|en))\b/gi;

/** chosen: base forms whose own spelling ends in a letter run matching PASSIVE's suffix but
 *  are not participles ("is indeed", "is needed" as a non-passive idiom) — grown from the
 *  baseline run over HANDOFF.md at landing (`docs/reviews/writing-trial-2026-10-04/baseline.md`);
 *  grow the list from the next baseline, never inline at a call site. A candidate word is
 *  excepted when it STARTS WITH one of these stems (case-insensitive), covering both the bare
 *  word ("indeed") and its own -ed/-en inflection ("needed" starts with "need"). */
export const PASSIVE_EXCEPTIONS = ["need", "speed", "indeed"];

/** chosen: the words HANDOFF.md and the review ledger already use for a verdict, plus Jake's
 *  decision-point shape (`packages/nana-setup/claude/rules/nana-writing.md`, "A decision point"). */
export const VERDICT_WORDS = ["LANDED", "DONE", "BLOCKED", "OPEN", "FAILED", "CARRIED", "YOUR CALL"];

/** Jake, 2026-07-03, feedback_plain_language.md. Case-insensitive; matches "dogfooding" too
 *  (substring, not whole-word). */
export const BANNED_WORDS = ["dogfood"];

/** chosen: the two identifier shapes Jake named — a backtick span, and a path-with-extension
 *  token. Row numbers (e.g. R-451) are [I] too noisy to add before the baseline shows a count. */
export const IDENTIFIER_CODE_SPAN = /`[^`]*`/g;
export const IDENTIFIER_PATH = /\S*\/\S+\.\w{1,5}/g;

/** chosen: a fragment under this many words is a heading or a bullet label, not a sentence —
 *  excluded from the sentence count and from the length/passive checks. */
export const MIN_SENTENCE_WORDS = 3;
