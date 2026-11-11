/**
 * @module packages/nana-pack/lib/suite-records-config.mjs
 * @purpose Declare the suite-record store's contract values and tunables with their provenance.
 * @inputs Contract values and chosen local and CI record tunables.
 * @outputs Record environment, schema, local and CI stores, retention, line, artifact, workflow, job, paging, and command constants.
 * @effects none
 * @errors none
 */
// contract (R-2546, R-2548): the runner writes only when this whole-run channel names a file.
export const RECORD_FILE_ENV = "NANA_SUITE_RECORD_FILE";

// contract (R-2546, R-2547): readers skip records from every other schema.
export const RECORD_SCHEMA = 1;

// contract (R-2547); chosen: clone-shared records live in the git common directory.
export const STORE_SUBPATH = "nana/suite-runs";

// chosen: keep main's flake records beside, never inside, the local baseline store.
export const CI_STORE_SUBPATH = "nana/ci-runs";

// chosen (R-2547, audit 2026-10-22): about nine days at roughly 270 full runs per eight days and about 5 MB.
export const SUITE_RECORDS_KEEP = 300;

// chosen (measurements 2026-10-23): about 100 days at 40 records a day, past GitHub's 90-day retention.
export const CI_RECORDS_KEEP = 4_000;

// contract (R-2549, R-2550, R-2553, R-2554): distinguish suite-record output from verdict lines.
export const RECORD_LINE_PREFIX = "suite record:";

// contract (R-2632, R-2634): CI suite-record artifacts share this name prefix.
export const CI_ARTIFACT_PREFIX = "suite-record-";

// contract (R-2634): GitHub's workflow-run path for the root CI workflow, measured 2026-10-22.
export const CI_WORKFLOW_RUN_PATH = ".github/workflows/ci.yml";

// contract (R-2634): the root workflow's suite job id; matrix legs are `suite (<os>)`.
export const CI_SUITE_JOB = "suite";

// contract (R-2634 to R-2638): distinguish CI record output from suite and verdict lines.
export const CI_RECORD_LINE_PREFIX = "ci record:";

// chosen (R-2635, 2026-10-22): retain the five measured slowest Windows files.
export const SLOWEST_LIST_MAX = 5;

// measured (R-2634, 2026-10-22): GitHub returns at most 100 entries when per_page exceeds 100.
export const GH_PAGE_SIZE = 100;

// chosen (R-2638, 2026-10-22): 4 MiB exceeds the measured projection of about 1.2 MiB for 100 runs.
export const GH_OUTPUT_MAX_BYTES = 4 * 1024 * 1024;

// contract (R-2638): tests replace gh with a JSON command array on every platform.
export const GH_COMMAND_ENV = "NANA_CI_RECORDS_GH_COMMAND";
