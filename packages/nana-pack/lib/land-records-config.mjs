/**
 * @module packages/nana-pack/lib/land-records-config.mjs
 * @purpose Declare land-record schemas, paths, vocabulary, read limits, reason bounds, and display prefix with provenance.
 * @inputs LAND_NOTE_PREFIX from the land configuration surface.
 * @outputs Land ledger, record vocabulary, CI-time field, reason-bound, and report constants.
 * @effects none
 * @errors none
 */
import { LAND_NOTE_PREFIX } from "./land-config.mjs";

// chosen (R-2810, 2026-10-24): beside the clone-shared build ledger under the git common folder.
export const LAND_RECORDS_SUBPATH = "nana/land-records.jsonl";
// contract (R-2810, R-2815): readers skip records of every other schema.
export const LAND_RECORD_SCHEMA = 1;
// contract (R-2810, R-2811): the two append-only record kinds.
export const LAND_RECORD_KINDS = Object.freeze(["start", "end"]);
// contract (R-2811, R-2815): two written outcomes and the report-only unpaired state.
export const LAND_OUTCOMES = Object.freeze(["landed", "refused", "no end"]);
// contract (R-2811): refusal stages follow the land's four guarded phases.
export const LAND_STAGES = Object.freeze(["preflight", "ci", "suite", "merge"]);
// contract (R-2811, R-2812): end records use this CI-state vocabulary.
export const LAND_CI_STATES = Object.freeze(["passed", "skipped", "refused", "not reached"]);
// contract (R-2812; GitHub REST workflow-run fields): CI wait starts at creation and ends at last update.
export const LAND_CI_CREATED_FIELD = "created_at";
export const LAND_CI_UPDATED_FIELD = "updated_at";
// contract (R-2813, R-2814): every nana-land record diagnostic starts with the land note prefix and this text.
export const LAND_RECORD_LINE_PREFIX = `${LAND_NOTE_PREFIX} land record:`;
// chosen (R-2813, 2026-10-24): over four years near twenty sub-kilobyte attempts per day.
export const LAND_LEDGER_READ_MAX_BYTES = 32 * 1024 * 1024;
// chosen (R-2811, 2026-10-24): keeps a long uncovered-commits refusal while bounding one ledger line.
export const LAND_REASON_MAX_CHARS = 16 * 1024;
