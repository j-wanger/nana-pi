/**
 * @module packages/nana-pack/lib/suite-records-config.mjs
 * @purpose Declare the suite-record store's contract values and tunables with their provenance.
 * @inputs Land-time environment names, note prefix, and main ref from land-config.mjs.
 * @outputs Record environment, schema, store, retention, comparison, line, trigger, and imported land constants.
 * @effects none
 * @errors none
 */
import { HAND_MEASURE_ENV, LAND_NOTE_PREFIX, LAND_TIP_ENV, MAIN_REF, TIP_DIGITS } from "./land-config.mjs";

export { HAND_MEASURE_ENV, LAND_NOTE_PREFIX, LAND_TIP_ENV, MAIN_REF, TIP_DIGITS };

// contract (R-2546, R-2548): the runner writes only when this whole-run channel names a file.
export const RECORD_FILE_ENV = "NANA_SUITE_RECORD_FILE";

// contract (R-2546, R-2547): readers skip records from every other schema.
export const RECORD_SCHEMA = 1;

// contract (R-2547); chosen: sit beside the runtime map in the git common directory.
export const STORE_SUBPATH = "nana/suite-runs";

// chosen (R-2547, audit 2026-10-22): about nine days at roughly 270 full runs per eight days and about 5 MB.
export const SUITE_RECORDS_KEEP = 300;

// chosen (R-2551, runtime-map-live measurements 2026-10-22): above the measured 4.1-second largest per-file swing.
export const SLOWER_MIN_SECONDS = 10;

// chosen (R-2551, runtime-map-live measurements 2026-10-22): above the measured 1.27 coverage ratio on a CPU-heavy file.
export const SLOWER_MIN_RATIO = 1.5;

// chosen (R-2551, attack N1 2026-10-22): cap noisy slower output while retaining the largest changes.
export const SLOWER_LIST_MAX = 5;

// contract (R-2549 to R-2555): distinguish suite-record output from the runner's verdict lines.
export const RECORD_LINE_PREFIX = "suite record:";

// contract (R-2547): the complete vocabulary for why a full suite record was made.
export const RECORD_TRIGGERS = Object.freeze(["land", "measure", "run"]);
