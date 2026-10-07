/**
 * @module packages/nana-pack/bin/review-shape.mjs
 * @purpose Decide whether produced output is review-shaped.
 * @inputs the candidate review text
 * @outputs true when a physical line begins with optional non-word characters followed by case-sensitive VERDICT
 * @effects none
 * @errors none
 */
// review-shape.mjs — what a produced REVIEW looks like (T2b fix r3, sol r2 #13). Its own module so
// the watchdog carries no review predicate and never imports ledger code: pi-review passes this
// predicate in; pi-worker does not (a worker succeeds on exit 0 + non-empty output).

/** A review-shaped token in the output. */
export function reviewShaped(text) {
  return /^[^\w\r\n]*VERDICT\b/m.test(text);
}
