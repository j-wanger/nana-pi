/**
 * @module scripts/first-look-config.mjs
 * @purpose Seals the product-page inputs used by first-look change detection.
 * @inputs None.
 * @outputs Frozen page-shaping paths, viewport widths, screenshot dimensions and reference limits.
 * @effects none
 * @errors None.
 */
// chosen (FEAT-039): the report renderer, template and modules supplying its report model shape the product page.
export const PAGE_SHAPING_PATHS = Object.freeze([
  "scripts/product-report.mjs",
  "scripts/product-report/",
  "scripts/deliverables.mjs",
  "scripts/requirements-tree.mjs",
  "scripts/requirements-trace.mjs",
  "scripts/requirements-moved.mjs",
  "packages/nana-pack/lib/handoff-asks.mjs",
  "packages/nana-pack/lib/handoff-issues.mjs",
  "packages/nana-pack/lib/land-config.mjs",
  "packages/nana-pack/lib/runtime-map.mjs",
  "packages/nana-pack/lib/runtime-map-config.mjs",
  "packages/nana-pack/lib/land-ci.mjs",
  "packages/nana-pack/lib/suite-records.mjs",
  "packages/nana-pack/lib/build-records.mjs",
  "apps/bench/lib/checkers.mjs",
]);
// chosen (FEAT-039): 40 lines leaves room for one compact contextual hunk and view summary.
export const ACCESSIBILITY_DIFF_MAX_LINES = 40;
export const VIEWPORT_WIDTHS = Object.freeze([380, 1280]);
// contract (R-3066): shared 1000-pixel capture height; first-look and outside-reader import this value.
export const VIEWPORT_HEIGHT = 1_000;
// chosen (R-3142, 2026-10-29): five frames match the reference set supplied for the first acceptance run.
export const REFERENCE_FRAME_CAP = 5;
// contract (R-3142): browser image formats accepted by the reference-folder importer.
export const ACCEPTED_IMAGE_EXTENSIONS = Object.freeze([".png", ".jpg", ".jpeg"]);
// chosen (R-3143): twelve numbered lines allow a short visual checklist while bounding judge input.
export const MAX_SPEC_LINES = 12;
// chosen (R-3133): bounds module loading and the first frame on a slow browser.
export const HIVE_READY_TIMEOUT_MS = 15_000;
// chosen (R-3133): sample the middle half, not a single pixel in a gap between cells.
export const HIVE_PROBE_FRACTION = 0.5;
// mirrored from feat/hive-render's config (R-3133); that module is not on main yet.
export const HIVE_BACKGROUND = "#d7d9d5";
export const PRODUCT_VIEWS = Object.freeze(["overview", "decisions", "product", "artifacts", "features", "issues", "requirements"]);
