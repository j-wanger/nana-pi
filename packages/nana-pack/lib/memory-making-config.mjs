/**
 * @module packages/nana-pack/lib/memory-making-config.mjs
 * @purpose Share the memory-making lane's record field list with the profile store.
 * @inputs none
 * @outputs Candidate field names in canonical order.
 * @effects none
 * @errors none
 */
// Contract: station 2 candidate shape, plan A2 (R-3210). Owner-profile imports this plain list.
export const CANDIDATE_FIELDS = ["id", "type", "kind", "claim", "quote", "context", "evidence", "date", "trust", "source", "roles", "validFrom", "invalidAt", "supersedes"];
