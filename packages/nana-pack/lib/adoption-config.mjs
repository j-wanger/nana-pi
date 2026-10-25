/**
 * @module packages/nana-pack/lib/adoption-config.mjs
 * @purpose Define the adoption reader's bounded window and cut-line contract.
 * @inputs none
 * @outputs Journal read cap, adoption window and cut-line prefix.
 * @effects none
 * @errors none
 */
/** chosen 2026-10-25: about 3.9 times the largest measured 7-day window; 4 MiB read cost was 15 to 17 ms warm. The 2,500 ms producer limit binds inside the shared 4,000 ms deadline. Sealed. */
export const JOURNAL_WINDOW_READ_MAX_BYTES = 4 * 1024 * 1024;
/** contract: R-151's last 7 days. Shared by report filtering and coverage. Sealed. */
export const ADOPTION_WINDOW_MS = 7 * 86_400_000;
/** contract: R-2851 uppercase cut marker, following ADOPTION UNAVAILABLE. Sealed. */
export const ADOPTION_WINDOW_CUT_PREFIX = "ADOPTION WINDOW CUT:";
