/**
 * @module packages/nana-pack/bin/review-shape.mjs
 * @purpose Decide whether produced output is review-shaped.
 * @inputs the candidate review text
 * @outputs true when the text carries a VERDICT, LAND, FAIL, finding or BLOCKING token
 * @effects none
 * @errors none
 */
// review-shape.mjs — what a produced REVIEW looks like (T2b fix r3, sol r2 #13). Its own module so
// the watchdog carries no review predicate and never imports ledger code: pi-review passes this
// predicate in; pi-worker does not (a worker succeeds on exit 0 + non-empty output).

/** A review-shaped token in the output. */
export function reviewShaped(text) {
  return /\b(VERDICT|LAND|FAIL|finding|BLOCKING)\b/i.test(text);
}
