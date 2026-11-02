/**
 * @module packages/nana-pack/lib/memory-bundle-config.mjs
 * @purpose Seal seat memory ranking, record budget and fixed delivery words.
 * @inputs None.
 * @outputs Named immutable delivery configuration.
 * @effects none
 * @errors None.
 */
// Contract (seat-memory-push plan revision 2, R-3418), chosen 2026-11-01: leave room for the index.
export const PUSH_BUDGET = 4000;
// Contract (R-3419), chosen 2026-11-01: owner words before extracted project history.
export const PUSH_PART_ORDER = Object.freeze(['profile','project']);
export const PUSH_SOURCE_ORDER = Object.freeze(['saved','extracted']);
// Contract (R-3420), chosen 2026-11-01: corrections lead; fact/thinking are provisional ranks.
export const PUSH_KIND_ORDER = Object.freeze(['correction','decision','preference','lesson','fact','thinking']);
// Contract (R-3421), chosen 2026-11-01: bound each git stall within the shared hook deadline.
export const PUSH_GIT_TIMEOUT_MS = 1000;
// Contract (R-3412), chosen 2026-11-01: matches the profile command's minimum unique prefix.
export const PUSH_ID_CHARS = 12;
// Chosen 2026-11-01 (R-3415): allow process start and kill variance in the deadline test only.
export const PUSH_TEST_MARGIN_MS = 1500;
// Contract (R-3412, R-3414), chosen 2026-11-01: private-context guidance and a text-free failure note.
export const PUSH_WORDS = Object.freeze({
 privacy: 'private: never quote these in issues, commits, PRs or HANDOFF; low trust is unconfirmed; retract only when the owner says a record is wrong: nana-profile retract <id> --quote "<the owner\'s words>"',
 storeError: '[nana:memory] push unavailable: store error\n',
});
