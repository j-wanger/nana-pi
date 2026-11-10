/**
 * @module packages/nana-pack/lib/verdict-config.mjs
 * @purpose Defines verdict-label vocabulary, look-alike folds and diagnostic conditions for unread verdicts.
 * @inputs none
 * @outputs VERDICT_LOOKALIKE_FOLD, FIRST_LINE_LABEL_WORDS and UNREAD_VERDICT_CONDITIONS frozen tables
 * @effects none
 * @errors none
 */
/**
 * Chosen: 2026-10-11. Reason: detect selected visual look-alikes that resemble letters in
 * VERDICT, while keeping acceptance on the raw line.
 */
export const VERDICT_LOOKALIKE_FOLD = Object.freeze({
  'Ε': 'E', 'Е': 'E', 'Τ': 'T', 'Т': 'T', 'С': 'C', 'Ϲ': 'C', 'І': 'I', 'Ι': 'I', 'Ӏ': 'I', 'Ѵ': 'V', 'Ꭰ': 'D', 'Ꭱ': 'R',
  'ε': 'e', 'е': 'e', 'τ': 't', 'т': 't', 'с': 'c', 'і': 'i', 'ι': 'i', 'ѵ': 'v', 'ԁ': 'd', 'г': 'r',
});

// chosen: review labels already used by the reader's corpus, plus the selected final word at runtime.
export const FIRST_LINE_LABEL_WORDS = Object.freeze(['land', 'send-back', 'block', 'fix-first', 'land-with-fixes']);

/**
 * Chosen: 2026-10-19. Reason: stable user-facing wording names R-1010's four unread
 * conditions plus empty output without duplicating those condition texts in launchers.
 */
export const UNREAD_VERDICT_CONDITIONS = Object.freeze({
  EMPTY_OUTPUT: 'the output has no non-blank line',
  FINAL_LINE_GRAMMAR: 'the selected final line does not match the allowed verdict grammar',
  FIRST_LINE_CONFLICT: 'the first non-blank line carries a conflicting or malformed verdict label',
  FIRST_LINE_GRAMMAR: 'the selected first line does not match the allowed verdict grammar',
  LATER_MENTION: 'a later non-blank line mentions verdict',
});
