/**
 * @module scripts/code-search-config.mjs
 * @purpose Define the sealed planner-search settings and their trial provenance.
 * @inputs none
 * @outputs Named configuration constants for ranking and the fixed-history quality check.
 * @effects none
 * @errors none
 */
// 2026-10-28 trial/structure.mjs in docs/reviews/code-search-2026-10-28:
// chosen: print the trial's evalTop five (R-3005).
export const SHORTLIST_SIZE = 5;
// Chosen 2026-10-28 (R-3006): one output hop, matching the trial's direct callees.
export const CALLEE_DEPTH = 1;
// Chosen 2026-10-28 (R-3007): 0.75, a five-point margin under the trial's
// reported 0.80 (plan-attack M1 explicitly permits a margin). The facet-free
// command measured 0.778810 on the exact printed paths; do not tune on ten needs.
export const QUALITY_FLOOR = 0.75;
// Chosen before the trial: standard BM25 defaults; purpose/path count twice,
// errors half; artifacts half of lexical match; equal writer/reader shares;
// ten seeds pass half their score to neighbours; keep the trial tokenizer (R-3008).
// Facets intentionally omitted; these ten needs are not a tuning corpus.
export const RANKING = Object.freeze({
	k1: 1.2, b: 0.75,
	fields: Object.freeze({ purpose: 2, path: 2, inputs: 1, outputs: 1, effects: 1, errors: 0.5 }),
	artifactWeight: 0.5, writerWeight: 1, readerWeight: 1,
	seeds: 10, damping: 0.5,
	stopwords: "a an the and or of to in on for with from by at as is are be it its this that these those when each every one two its into than then so no not only any all who what which shall must can may packages lib bin mjs ts js scripts apps extensions claude",
});
