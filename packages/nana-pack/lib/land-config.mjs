/**
 * @module packages/nana-pack/lib/land-config.mjs
 * @purpose Declare the land-time runtime-map contract values with their provenance.
 * @inputs none
 * @outputs Environment names, hand-measure marker, note prefix, platform policy, main ref, failure policy, display digits, and coverage owner filename.
 * @effects none
 * @errors none
 */

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
