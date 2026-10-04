/**
 * @module packages/nana-pack/lib/writing-config.mjs
 * @purpose Every tunable the writing checker reads, each defined once with its provenance (G-001, G-002), so no inline literal appears at a point of use.
 * @inputs none — pure constants
 * @outputs SENTENCE_CAP, PASSIVE, PASSIVE_EXCEPTIONS, VERDICT_WORDS, BANNED_WORDS, IDENTIFIER_CODE_SPAN, IDENTIFIER_PATH, MIN_SENTENCE_WORDS, WRITING_INJECT_CAP
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
 *  are not participles ("is indeed" as a non-passive idiom; the five adjectives below). A
 *  candidate word is excepted only on a WHOLE-WORD match (astra r1 SHOULD 1, Amendment 1 §A4:
 *  the old prefix match wrongly excused real passives — "is needed" is genuine passive voice
 *  and must be caught, not excepted; keeping "need" here is now inert, since it is too short
 *  to match PASSIVE on its own, but it costs nothing to leave named). "green", "wooden",
 *  "open", "golden", "even": astra r1 labelled set, 2026-10-04 (its false positives "Jake is
 *  green with envy", "the rail are green", "The desk was wooden."). */
export const PASSIVE_EXCEPTIONS = ["need", "speed", "indeed", "green", "wooden", "open", "golden", "even"];

/** chosen: the words HANDOFF.md and the review ledger already use for a verdict, plus Jake's
 *  decision-point shape (`packages/nana-pack/rules/nana-writing.md`, "A decision point"). */
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

/** chosen (design-ruling.md Amendment 1, 2026-10-04, §A1): the cap, in chars, on the block the
 *  nana-writing extension injects into the system prompt. The rule file is 1,303 bytes today
 *  [V] — about a third of this cap — so a stray large file cannot flood the prompt. */
export const WRITING_INJECT_CAP = 4000;
