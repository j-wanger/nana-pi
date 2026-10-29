/**
 * @module scripts/first-look-config.mjs
 * @purpose Seals the product-page inputs used by first-look change detection.
 * @inputs None.
 * @outputs Frozen page-shaping paths and viewport widths.
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
export const PRODUCT_VIEWS = Object.freeze(["overview", "decisions", "product", "artifacts", "features", "issues", "requirements"]);
// chosen (2026-10-29, R-3133): bounds module loading and the first frame on a slow browser.
export const HIVE_READY_TIMEOUT_MS = 15000;
// chosen (2026-10-29, R-3133): sample the middle half, not a single pixel in a gap between cells.
export const HIVE_PROBE_FRACTION = 0.5;
export { HIVE_BACKGROUND } from '../apps/hive/config.mjs';
