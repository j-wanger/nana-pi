/**
 * @module packages/nana-setup/lib/working-config.mjs
 * @purpose Bound the character cost of shared working guidance and start files.
 * @inputs none — pure constants
 * @outputs WORKING_SECTION_CHAR_CAP, START_FILE_CHAR_BUDGETS
 * @effects none
 * @errors none
 */
/** chosen: 4500 characters keeps the common session guidance roughly builder-sized
 * (docs/plan/agents-trim.md, R-3965); seat procedure lives in seat-side rules. */
export const WORKING_SECTION_CHAR_CAP = 4500;

/** derived: ratchet
 * UTF-16 characters (String.length) after CRLF-to-LF conversion and leading BOM
 * removal, rounded up to the next 100, not UTF-8 bytes; R-4250 enforces equality.
 */
export const START_FILE_CHAR_BUDGETS = Object.freeze({
	"packages/nana-setup/claude/rules/nana-soul.md": 5400,
	"packages/nana-setup/claude/rules/nana-standards.md": 4200,
	// 2026-11-09 Defaults target: seat guide ≤1.5k characters.
	"packages/nana-setup/claude/rules/nana-seat.md": 6500, // measured 2026-11-13: 6490 normalized characters after the soul-asks lane
	// 2026-11-09 Defaults target: posture and safety lines without a tool.
	"packages/nana-pack/rules/nana-rulings.md": 2600, // measured 2026-11-12: 2537 normalized characters after the priority and ruling update
	"packages/nana-pack/rules/nana-writing.md": 1500,
	"AGENTS.md": 9800, // measured 2026-11-13: 9795 normalized characters after start-text trim 2 part B
	"packages/nana-pack/prompts/builder-preamble.md": 5200, // measured 2026-11-12: 5141 normalized characters after start-text trim 2 part A
	"packages/nana-pack/prompts/review-standard.md": 1400,
	"packages/nana-pack/prompts/planner.md": 7400,
});
