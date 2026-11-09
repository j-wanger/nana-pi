/**
 * @module packages/nana-pack/lib/land-config.mjs
 * @purpose Declare land-time process, CI, and runtime-map contract values with their provenance.
 * @inputs none
 * @outputs Process bounds, CI scope, clean-merge policy, verdict and records-budget values, environment names, note prefix, platform policy, main ref, failure policy, display digits, and coverage metadata.
 * @effects none
 * @errors none
 */

// Contract (R-3297, R-3342): shared land and memory lane validation.
export const LANE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

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

// chosen 2026-11-02 (R-3721, R-3725): two capacity recoveries before asking the seat.
export const CI_CANCEL_RERUNS = 2;
// chosen 2026-11-02 (R-3720, R-3725): allow GitHub two seconds to compute mergeability.
export const CI_READY_READS = 3;
export const CI_READY_DELAY_MS = 1_000;
// chosen 2026-11-02 (R-3723, R-3725): modest API cadence, with room for slow hosted Windows CI.
export const CI_POLL_INTERVAL_MS = 10_000;
export const CI_WAIT_TIMEOUT_MS = 7_200_000;
// contract (R-3720, R-3725): gh PR fields identify both the head ref and its repository.
export const CI_PR_FIELDS = "number,mergeable,headRefName,headRefOid,headRepository,headRepositoryOwner";
// contract (R-3722, R-3725): attempt-specific GitHub REST jobs endpoint; all pages are required.
export const CI_JOBS_PATH = "repos/<owner>/<repo>/actions/runs/<run>/attempts/<attempt>/jobs";
// measured 2026-11-02 (R-3722, R-3725): ci.yml:68-70, suite's matrix continue-on-error.
// Recognize only the current suite stanza, never another job's continue-on-error or a guessed OS name.
export const CI_ADVISORY_WORKFLOW = ".github/workflows/ci.yml";
export const CI_ADVISORY_JOB = "suite (ubuntu-latest)";
export const CI_ADVISORY_RULE = /^  suite:[ \t]*\r?\n(?:(?:    [^\r\n]*|[ \t]*|    #[^\r\n]*)\r?\n)*?    continue-on-error: \$\{\{ matrix\.os == 'ubuntu-latest' \}\}[ \t]*(?:\r?\n|$)/m;

// contract (R-3825, R-3826), chosen 2026-11-07: toolkit-only job policy; other repositories retain their workflow contract.
export const CI_TOOLKIT_NAME = "nana-pi";
// contract (R-3825): a Windows seat also uses the required non-Windows lane proof.
export const CI_LANE_PLATFORM = "darwin";
export const CI_LANE_JOBS = Object.freeze(["suite (macos-latest)", "install-check (macos-latest, ceiling)", "install-check (macos-latest, floor)"]);
export const CI_WINDOWS_JOBS = Object.freeze([
	"suite (windows-latest-shard-1-of-3)", "suite (windows-latest-shard-2-of-3)", "suite (windows-latest-shard-3-of-3)",
	"install-check (windows-latest, ceiling)", "install-check (windows-latest, floor)",
]);
// contract (R-3819): runs before sharding used one Windows suite job.
export const CI_LEGACY_WINDOWS_JOB = "suite (windows-latest)";

// chosen 2026-10-22 (R-2589): about 60 times the measured 0.47-second runs call.
export const CI_READ_TIMEOUT_MS = 30_000;

// chosen (R-2756, measurements 2026-10-23): about seven times the slowest measured two-run record read.
export const CI_RECORDS_BUDGET_MS = 60_000;

// contract (R-2586, R-2587): GitHub's passing workflow-run vocabulary.
export const CI_DONE_STATUS = "completed";
export const CI_PASS_CONCLUSION = "success";

// contract (R-3944), chosen 2026-11-08: distinguish intentionally skipped same-repository feature PR runs.
export const CI_DUPLICATE_TITLE = "ci (duplicate feature PR)";

// chosen 2026-11-01 (R-3434): retry one transient nonzero run-list exit; never retry a spawn failure or timeout.
export const CI_RUN_LIST_RETRIES = 1;

// contract (R-3432), chosen by the seat 2026-11-01: proof-defining workflow and collection changes require local coverage.
export const SUITE_FALLBACK_PATHS = Object.freeze([".github/workflows/", "scripts/test.mjs"]);
export const SUITE_CHANGED_REASON = "the lane changes the CI workflow or test runner";

// chosen 2026-11-02 (R-3697, clean-merge plan O1): identify only the merge this land creates.
export const CLEAN_MERGE_MESSAGE = "nana-land: merge current main into accepted tip";
export const CLEAN_MERGE_PREFIX = "merged main:";
// chosen 2026-11-02 (R-3697, O2): name ten paths before eliding a long conflict list.
export const CLEAN_MERGE_NAME_CAP = 10;
// contract (R-3690, R-3697, plan Q3), chosen 2026-11-02: generated outputs need regeneration, not textual merging.
export const CLEAN_MERGE_GENERATED_PATHS = Object.freeze(["docs/code-map.md", "docs/requirements-tree.md"]);
// contract (R-3689, R-3697, A2), chosen 2026-11-02: repository settings cannot select a default custom driver or disable rename detection.
export const CLEAN_MERGE_GIT_CONFIG = Object.freeze(["merge.renormalize=false", "merge.default=text", "merge.renames=true"]);
// chosen 2026-11-02 (R-3697, O1): every merge refusal points back to the reviewed lane flow.
export const CLEAN_MERGE_REMEDY = "merge main into the lane, then review and CI that tip";
export const CLEAN_MERGE_REASONS = Object.freeze({
	conflict: "merge conflict", unsupported: "unsupported merge semantics", git: "git merge-tree failed",
	noCi: "clean merge needs applicable CI", suite: "clean merge needs proven suite",
	proof: "clean merge proof path changed", ciChanged: "clean merge CI changed before lock",
});

// contract (R-3711, plan Revision 2), chosen 2026-11-02: only these generated outputs and direct Node argv qualify.
export const GENERATOR_CONTRACT = Object.freeze([
 Object.freeze({ path: "docs/code-map.md", write: Object.freeze(["scripts/code-map.mjs", "--write"]), check: Object.freeze(["scripts/code-map.mjs", "--check"]) }),
 Object.freeze({ path: "docs/requirements-tree.md", write: Object.freeze(["scripts/requirements-tree.mjs", "--write"]), check: Object.freeze(["scripts/requirements-tree.mjs", "--check"]) }),
]);
// chosen 2026-11-02 (R-3711): thirty seconds bounds each local generator command, without a shell or npm.
export const GENERATOR_TIMEOUT_MS = 30_000;
// contract (R-3711): independent vocabulary preserves the existing clean-merge seal.
export const GENERATOR_REASONS = Object.freeze({ generatorFailed: "generatorFailed", generatorCheck: "generatorCheck", generatorScope: "generatorScope" });

// contract (R-3430, R-3431): one source line on a successful land.
export const SUITE_LINE_PREFIX = "suite:";

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
