/**
 * @module scripts/component-audit-config.mjs
 * @purpose Seals the component audit's paths and git age windows with provenance.
 * @inputs None.
 * @outputs Named audit limits and repo-relative source paths.
 * @effects none
 * @errors None.
 */
// chosen (R-3107): 14 days gives a two-week activity snapshot ending at HEAD's commit time.
export const ACTIVITY_WINDOW_DAYS = 14;
// chosen (R-3107): 20 commits is about three lanes at the usual three to eight commits per lane.
export const STALE_COMMIT_LIMIT = 20;
// contract (R-3107, shared component data contract §Where the data lives): the tracked hand source.
export const AUDIT_PATH = "docs/components/nana-pi.json";
// contract (R-3107, shared component data contract §Files): the frozen v1 data contract.
export const CONTRACT_PATH = "docs/components/contract.json";
