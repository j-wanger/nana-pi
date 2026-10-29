/**
 * @module scripts/outside-reader-config.mjs
 * @purpose Seals the cold outside reader's prompt inputs and run budget.
 * @inputs First-look's product views and viewport widths.
 * @outputs Named reader limits, paths, views and roster order.
 * @effects none
 * @errors Invalid report view configuration throws at import.
 */
import { PRODUCT_VIEWS, VIEWPORT_WIDTHS } from "./first-look-config.mjs";
export { VIEWPORT_WIDTHS };
// chosen 2026-10-29 (R-3066): at most three avoids the one-off's fixed-four padding.
export const MAX_FINDINGS = 3;
// measured one-off render.mjs, 2026-10-29: landing plus these four views; widths follow first-look.
export const READER_VIEWS = Object.freeze(["", "overview", "product", "decisions", "issues"]);
if (!READER_VIEWS.slice(1).every((view) => PRODUCT_VIEWS.includes(view))) throw new Error("unknown reader view");
// measured one-off render.mjs, 2026-10-29: character caps preserve its richest phone landing.
export const VIEW_TEXT_CAP = 4_000;
export const PHONE_LANDING_TEXT_CAP = 6_000;
// chosen 2026-10-29: 4K diff + 6K newest bugs adds 10K to the measured 29,884-character page,
// keeping typical input near the one-off, rather than adding the whole 17,378-byte bug file.
export const DIFF_CAP = 4_000;
export const KNOWN_BUG_CAP = 6_000;
// chosen 2026-10-29: tracked beside the planner prompt; only the product-page feature is read.
export const PROMPT_PATH = "packages/nana-pack/prompts/outside-reader.md";
export const KNOWN_BUG_FEATURE = "FEAT-039";
// chosen 2026-10-29 (plan Q3 default): first pi entry, skipping Claude Code entries.
export const ROSTER_SLOT_ORDER = Object.freeze(["scout", "land", "builder"]);
// chosen 2026-10-29: same height as first-look; widths imported, not copied.
export const VIEWPORT_HEIGHT = 1_000;
// measured one-off working rerun, 2026-10-29: ceiling 600s, one attempt; server thinking may be flat.
// Infinity follows worker-config.mjs's CLAUDE_BUILDER_STALL_SECS precedent.
export const STALL_SECS = Infinity;
export const RETRIES = 0;
export const MAX_SECS = 600;
