/**
 * @module packages/nana-pack/lib/suite-records-config.mjs
 * @purpose Declare the suite-record store's contract values and tunables with their provenance.
 * @inputs Land-time environment names, note prefix, and main ref from land-config.mjs.
 * @outputs Record environment, schema, local and CI stores, retention, comparison, slow-file share, line, artifact, workflow, job, paging, command, and imported land constants.
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

// contract (design D4, R-2751): keep hosted records beside, never inside, the local baseline store.
export const CI_STORE_SUBPATH = "nana/ci-runs";

// chosen (R-2547, audit 2026-10-22): about nine days at roughly 270 full runs per eight days and about 5 MB.
export const SUITE_RECORDS_KEEP = 300;

// chosen (R-2752, measurements 2026-10-23): about 100 days at 40 records a day, past GitHub's 90-day retention.
export const CI_RECORDS_KEEP = 4_000;

// chosen (R-2754, measurements 2026-10-23): a file at half its limit survives the measured 1.73-times worst spike below the limit.
export const CI_SLOW_SHARE = 0.5;

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

// contract (R-2632, R-2634): CI suite-record artifacts share this name prefix.
export const CI_ARTIFACT_PREFIX = "suite-record-";

// contract (R-2634): GitHub's workflow-run path for the root CI workflow, measured 2026-10-22.
export const CI_WORKFLOW_RUN_PATH = ".github/workflows/ci.yml";

// contract (R-2634): the root workflow's suite job id; matrix legs are `suite (<os>)`.
export const CI_SUITE_JOB = "suite";

// contract (R-2634 to R-2638): distinguish CI record output from suite and verdict lines.
export const CI_RECORD_LINE_PREFIX = "ci record:";

// chosen (R-2635, 2026-10-22): match SLOWER_LIST_MAX and retain the five measured slowest Windows files.
export const SLOWEST_LIST_MAX = 5;

// measured (R-2634, 2026-10-22): GitHub returns at most 100 entries when per_page exceeds 100.
export const GH_PAGE_SIZE = 100;

// chosen (R-2638, 2026-10-22): 4 MiB exceeds the measured projection of about 1.2 MiB for 100 runs.
export const GH_OUTPUT_MAX_BYTES = 4 * 1024 * 1024;

// contract (R-2638): tests replace gh with a JSON command array on every platform.
export const GH_COMMAND_ENV = "NANA_CI_RECORDS_GH_COMMAND";
