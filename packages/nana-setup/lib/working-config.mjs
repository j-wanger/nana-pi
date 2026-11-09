/**
 * @module packages/nana-setup/lib/working-config.mjs
 * @purpose Bound the shared working section's starting-context cost.
 * @inputs none — pure constants
 * @outputs WORKING_SECTION_CHAR_CAP
 * @effects none
 * @errors none
 */
/** chosen: 4500 characters keeps the common session guidance roughly builder-sized
 * (docs/plan/agents-trim.md, R-3965); seat procedure lives in seat-side rules. */
export const WORKING_SECTION_CHAR_CAP = 4500;
