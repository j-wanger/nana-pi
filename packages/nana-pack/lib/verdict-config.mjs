/**
 * @module packages/nana-pack/lib/verdict-config.mjs
 * @purpose Defines the look-alike letters folded when detecting review verdict labels.
 * @inputs none
 * @outputs VERDICT_LOOKALIKE_FOLD
 * @effects none
 * @errors none
 */
/**
 * Chosen: 2026-10-11. Reason: detect the Greek and Cyrillic capitals and small letters
 * that visually resemble letters in VERDICT, while keeping acceptance on the raw line.
 */
export const VERDICT_LOOKALIKE_FOLD = Object.freeze({
  'Ε': 'E', 'Е': 'E', 'Τ': 'T', 'Т': 'T', 'С': 'C', 'Ϲ': 'C', 'І': 'I', 'Ι': 'I', 'Ӏ': 'I', 'Ѵ': 'V', 'Ꭰ': 'D', 'Ꭱ': 'R',
  'ε': 'e', 'е': 'e', 'τ': 't', 'т': 't', 'с': 'c', 'і': 'i', 'ι': 'i', 'ѵ': 'v', 'ԁ': 'd', 'г': 'r',
});
