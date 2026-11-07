/**
 * @module packages/nana-pack/lib/leak-scan-config.mjs
 * @purpose Seal the maximum bytes read from one commit blob by the leak guard.
 * @inputs none
 * @outputs Per-file byte cap.
 * @effects none
 * @errors none
 */
// chosen (2026-11-06, R-3756): bound log and snapshot reads while admitting ordinary source files.
export const LEAK_FILE_MAX_BYTES = 1048576;
