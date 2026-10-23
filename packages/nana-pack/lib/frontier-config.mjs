/**
 * @module packages/nana-pack/lib/frontier-config.mjs
 * @purpose Defines the sealed word budget, read window and shared section-name matching for HANDOFF frontier reports.
 * @inputs none
 * @outputs HANDOFF_WORD_BUDGET, READ_WINDOW_BYTES, READ_WINDOW_LINES, NEXT_SECTION_NAME, OPEN_SECTION_PREFIX, OPEN_SECTION_NAME, LIVE_SECTION_NAMES, ARCHIVE_SECTION_NAMES, isNamed
 * @effects none
 * @errors none
 */
/** Chosen: 1,200 words leaves headroom above the 947-word 2026-10-06 rewrite. */
export const HANDOFF_WORD_BUDGET = 1200;

/** Contract value (R-2471, R-2472): pi 1.0.2's read tool DEFAULT_MAX_BYTES = 50 * 1024 (dist/core/tools/truncate.js:11), checked 2026-10-21; pi 1.3.0 unchanged. Claude Code 2.1.299's Read limits (262,144 bytes, 25,000 tokens; seen in the binary 2026-10-21) are larger, so pi's window binds both seats. Sealed. */
export const READ_WINDOW_BYTES = 51200;
/** Contract value (R-2471, R-2472): pi 1.0.2 DEFAULT_MAX_LINES = 2000 (dist/core/tools/truncate.js:10), checked 2026-10-21. Sealed. */
export const READ_WINDOW_LINES = 2000;
/** Contract (R-2470): the live section name used for next actions. */
export const NEXT_SECTION_NAME = "Next";
/** Contract (R-2514, R-2515): an asks heading starts with this prefix, including its trailing space. */
export const OPEN_SECTION_PREFIX = "Open for ";
/** Chosen: findings use the role-neutral canonical name even when another name appears in a heading. */
export const OPEN_SECTION_NAME = "Open for the owner";
/** Contract value (R-2470, R-2471): this repo's frontier headings, and the names nana-soul.md uses. */
export const LIVE_SECTION_NAMES = ["Where things stand", NEXT_SECTION_NAME, OPEN_SECTION_PREFIX];
/** Contract value (R-2470): this repo's archive headings. */
export const ARCHIVE_SECTION_NAMES = ["Landed", "Carried residuals"];

/** Match an exact section name with its accepted suffixes, or a declared trailing-space prefix. */
export function isNamed(title, name) {
	const actual = title.trim().toLowerCase();
	const expected = name.toLowerCase();
	if (expected.endsWith(" ")) return actual.startsWith(expected);
	const escaped = expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return actual === expected || new RegExp(`^${escaped}(?:\\s|\\(|—)`).test(actual);
}
