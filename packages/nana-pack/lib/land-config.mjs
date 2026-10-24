/**
 * @module packages/nana-pack/lib/land-config.mjs
 * @purpose Declare land-time process, CI, and runtime-map contract values with their provenance.
 * @inputs none
 * @outputs Process bounds, CI scope, verdict and records-budget values, environment names, note prefix, platform policy, main ref, failure policy, display digits, and coverage metadata.
 * @effects none
 * @errors none
 */

// contract (R-585, R-2590): origin is the land's remote of record.
export const CI_REMOTE = "origin";

// chosen 2026-10-22 (R-2591): the hosted CI every nana repository on this machine uses.
export const CI_HOST = "github.com";

// contract (R-2590): GitHub Actions reads top-level YAML workflow files from this directory.
export const CI_WORKFLOW_DIR = ".github/workflows";
export const CI_WORKFLOW_EXTENSIONS = Object.freeze([".yml", ".yaml"]);

// contract (R-2591): GitHub REST list-workflow-runs endpoint, with head_sha supplied by nana-land.
export const CI_RUNS_PATH = "repos/<owner>/<repo>/actions/runs";

// measured 2026-10-22 (R-2591): per_page=101 and 150 each returned 100; landed tips had one or two runs over 40 lands.
export const CI_RUNS_PAGE_SIZE = 100;

// chosen 2026-10-22 (R-2589): about 60 times the measured 0.47-second runs call.
export const CI_READ_TIMEOUT_MS = 30_000;

// chosen (R-2756, measurements 2026-10-23): about seven times the slowest measured two-run record read.
export const CI_RECORDS_BUDGET_MS = 60_000;

// contract (R-2586, R-2587): GitHub's passing workflow-run vocabulary.
export const CI_DONE_STATUS = "completed";
export const CI_PASS_CONCLUSION = "success";

// chosen 2026-10-22 (R-2589): nana-land's existing git and suite bound; a two-run answer measured 23,880 bytes.
export const CHILD_OUTPUT_MAX_BYTES = 16 * 1024 * 1024;

// contract (R-2522, R-2523): the land-to-locked-suite tip channel.
export const LAND_TIP_ENV = "NANA_LAND_TIP";

// contract (R-2526, R-2533): distinguish a cross-platform hand measure from a Windows land.
export const HAND_MEASURE_ENV = "NANA_RUNTIME_HAND_MEASURE";

// contract (R-2530); chosen: distinguish notes retained by nana-land from ordinary captured suite output.
export const LAND_NOTE_PREFIX = "[nana-land]";

// contract (R-2526): Windows runs plainly because FEAT-029 does not support its stop and coverage paths.
export const UNMEASURED_PLATFORMS = Object.freeze(["win32"]);

// contract (R-2529): lands target the repository's main branch.
export const MAIN_REF = "refs/heads/main";

// chosen (D5, R-2524): keep failed coverage data, then let one plain rerun of failed files decide.
export const COVERAGE_FAILURE_POLICY = "rerun-failed";

// chosen (D7): repository records and freshness output abbreviate commits to eight characters.
export const TIP_DIGITS = 8;

// contract (R-2533); chosen: a private hand-measure channel parallel to the land tip channel.
export const DIRTY_COUNT_ENV = "NANA_RUNTIME_DIRTY";

// chosen (R-2527): each temporary coverage folder records the process that owns its cleanup.
export const COVERAGE_OWNER_FILE = "owner.pid";
