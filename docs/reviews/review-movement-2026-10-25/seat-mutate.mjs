#!/usr/bin/env node
// Seat wrong-code pairs for lane review-movement (hook class), written by the seat 2026-10-25 at build tip 53081c82.
// They follow the must-meet's "Seat wrong-code pairs" list (items 1 to 24; item 5 splits into 5a and 5b; item 13's R-2907 half is Windows-only and declared, not in PAIRS).
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/review-movement-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CR = "packages/nana-pack/bin/claude-review.mjs";
const PR = "packages/nana-pack/bin/pi-review.mjs";
const RM = "packages/nana-pack/lib/review-movement.mjs";
const CFG = "packages/nana-pack/lib/review-movement-config.mjs";
const MOVED = "scripts/requirements-moved.mjs";
const LEDGER = "REQUIREMENTS.md";
const CRT = "packages/nana-pack/tests/claude-review.test.mjs";
const IRT = "packages/nana-pack/tests/immutable-review.test.mjs";
const RMT = "packages/nana-pack/tests/review-movement.test.mjs";
const R_2900 = /^R-2900: /; // R-2900
const R_2901 = /^R-2901: /; // R-2901
const R_2902 = /^R-2902: /; // R-2902
const R_2903 = /^R-2903: /; // R-2903
const R_2904 = /^R-2904: /; // R-2904
const R_2905 = /^R-2905: /; // R-2905
const R_2906 = /^R-2906: /; // R-2906
const R_2907 = /^R-2907: /; // R-2907
const R_2908 = /^R-2908: /; // R-2908
const SEAL = /^seal: the tree movement section is headed ## Tree movement/; // the seal (R-2900 R-2901 R-2902 R-2906 R-2907 R-2908)
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// claude-review's movement slot in its prompt template literal (the source text, so `\n` is two characters).
const CR_SLOT = "${movement === null ? '' : `${movement}\\n\\n`}";
const CR_STANDARD = "${STANDARD_HEADING}\\n\\n${standard.text}\\n\\n";
// The helper's HEAD ledger check and its section template.
const HEAD_CHECK = "run('git', ['cat-file', '-e', 'HEAD:./REQUIREMENTS.md'], options).status !== 0";
const BODY_START = "  const body = result.status === 0";
// pi-review's movement append, after the review standard's.
const PR_STANDARD = "'--append-system-prompt', reviewStandardText";
const PR_APPEND = "...(movementPrompt === null ? [] : ['--append-system-prompt', movementPrompt])";
const MADE_BY = "Made by: R-1460 · review: packages/nana-pack/bin/claude-review.mjs, packages/nana-pack/bin/pi-review.mjs, packages/nana-pack/lib/review-movement.mjs, scripts/requirements-moved.mjs · built from: A-030";

const DECLARED = [
	"(seat) pairs 1 to 24 follow the must-meet's seat wrong-code list in order; item 5 (the helper's cwd and --root) splits into one-edit pairs 5a (cwd) and 5b (--root), each alone red on R-2900; every other item is one edit; each names the rows the must-meet says it turns red",
	"(Windows-only, not in this table) pair 13's R-2907 half: with the section passed as argv text, the large section (over 32,767 characters) fails the spawn only on Windows; on macOS R-2907 passes the text through argv, so pair 13 names R-2901 alone. The seat runs that half on a scratch Windows CI push, as the must-meet says",
	"(macOS-only) pairs 15 and 16 are macOS-only for the pipe, as the must-meet says; pair 15's red needs macOS's cut pipe at 65,536 bytes",
	"(product code) every pair edits product code or the ledger: the helper, its config, the two launchers, requirements-moved.mjs or REQUIREMENTS.md; no pair edits a test file. Pair 11 reads the working tree through process.getBuiltinModule('node:fs') so it stays one edit (Node 22.3 or later)",
	"(not expressible) R-2902's several-line stderr case and pi-review's failed section-file write have no one-place edit (must-meet known limits), so neither is a pair",
	"(seat) no alsoRed is declared: the table was written before any full run, and only pair 24 was run end to end; pairs that break the helper or a launcher are expected to turn further rows red as UNNAMED (inferred, not run)",
];

const PAIRS = [
	{ n: "1", name: "claude-review's helper call removed", edits: [one(CR, "const movement = reviewMovementSection(tree);", "const movement = null;")], tests: [CRT], expectRed: [R_2900, R_2906] },
	{ n: "2", name: "claude-review's section placed after the review standard", edits: [one(CR, `${CR_SLOT}${CR_STANDARD}`, `${CR_STANDARD}${CR_SLOT}`)], tests: [CRT], expectRed: [R_2900] },
	{ n: "3", name: "claude-review's section inserted twice", edits: [one(CR, CR_SLOT, `${CR_SLOT}${CR_SLOT}`)], tests: [CRT], expectRed: [R_2900] },
	{ n: "4", name: "the helper's --base set to HEAD", edits: [one(RM, "'--base', MOVEMENT_BASE]", "'--base', 'HEAD']")], tests: [CRT, IRT], expectRed: [R_2900, R_2901] },
	{ n: "5a", name: "the helper's cwd set to process.cwd()", edits: [one(RM, "{ cwd: tree, ", "{ cwd: process.cwd(), ")], tests: [CRT], expectRed: [R_2900] },
	{ n: "5b", name: "the helper's --root set to process.cwd()", edits: [one(RM, "'--root', tree,", "'--root', process.cwd(),")], tests: [CRT], expectRed: [R_2900] },
	{ n: "6", name: "the helper writes ## Tree moves in place of MOVEMENT_HEADING", edits: [one(RM, "${MOVEMENT_HEADING}\\n\\n", "## Tree moves\\n\\n")], tests: [CRT, IRT], expectRed: [R_2900, R_2901] },
	{ n: "7", name: "the helper leaves out MOVEMENT_LEAD", edits: [one(RM, "${MOVEMENT_LEAD}\\n\\n", "")], tests: [CRT, IRT], expectRed: [R_2900, R_2901] },
	{ n: "8", name: "the helper throws on a non-zero exit", edits: [one(RM, BODY_START, `  if (result.status !== 0) throw new Error(reason);\n${BODY_START}`)], tests: [CRT, IRT], expectRed: [R_2902, R_2908] },
	{ n: "9", name: "the helper returns null on a non-zero exit", edits: [one(RM, BODY_START, `  if (result.status !== 0) return null;\n${BODY_START}`)], tests: [CRT, IRT], expectRed: [R_2902, R_2908] },
	{ n: "10", name: "the helper writes the not-computed line with no reason", edits: [one(RM, "${MOVEMENT_NOT_COMPUTED} ${reason}", "${MOVEMENT_NOT_COMPUTED}")], tests: [CRT, IRT], expectRed: [R_2902, R_2908] },
	{ n: "11", name: "the helper checks the working tree with existsSync in place of git cat-file", edits: [one(RM, HEAD_CHECK, "!process.getBuiltinModule('node:fs').existsSync(`${tree}/REQUIREMENTS.md`)")], tests: [CRT], expectRed: [R_2903] },
	{ n: "12", name: "the helper's HEAD check removed", edits: [one(RM, `if (${HEAD_CHECK}) return null;`, "")], tests: [CRT, IRT], expectRed: [R_2903, R_2904] },
	{ n: "13", name: "pi-review passes the section as argv text in place of a file", edits: [one(PR, "      movementPrompt = join(movementFolder, MOVEMENT_FILE_NAME);\n      writeFileSync(movementPrompt, movement);\n", "      movementPrompt = movement;\n")], tests: [IRT], expectRed: [R_2901] },
	{ n: "14", name: "pi-review writes the section file inside the checkout", edits: [one(PR, "mkdtempSync(join(tmpdir(), MOVEMENT_FOLDER_PREFIX))", "mkdtempSync(join(tempRoot, MOVEMENT_FOLDER_PREFIX))")], tests: [IRT], expectRed: [R_2901] },
	{ n: "15", name: "requirements-moved back to process.exit(main())", edits: [one(MOVED, "process.exitCode = main();", "process.exit(main());")], tests: [CRT, IRT], expectRed: [R_2906, R_2907] },
	{ n: "16", name: "the helper's maxBuffer set to 65,536", edits: [one(RM, "maxBuffer: MOVEMENT_MAX_BYTES", "maxBuffer: 65_536")], tests: [CRT, IRT], expectRed: [R_2906, R_2907] },
	{ n: "17", name: "pi-review's movement append removed", edits: [one(PR, `, ${PR_APPEND}`, "")], tests: [IRT], expectRed: [R_2901, R_2907] },
	{ n: "18", name: "pi-review's movement appended before the review standard", edits: [one(PR, `${PR_STANDARD}, ${PR_APPEND}`, `${PR_APPEND}, ${PR_STANDARD}`)], tests: [IRT], expectRed: [R_2901] },
	{ n: "19", name: "pi-review appends an empty file when the helper returns null", edits: [one(PR, "const movement = reviewMovementSection(tempRoot);", "const movement = reviewMovementSection(tempRoot) ?? '';")], tests: [IRT], expectRed: [R_2904] },
	{ n: "20", name: "pi-review's finally no longer removes the movement folder", edits: [one(PR, "try { rmSync(movementFolder, { recursive: true, force: true }); }", "try { /* movement folder kept */ }")], tests: [IRT], expectRed: [R_2901] },
	{ n: "21", name: "R-1460's Made by: line back to its manual text", edits: [one(LEDGER, MADE_BY, "Made by: R-1460 · manual: the seat runs scripts/requirements-moved.mjs by hand before the final review and the land, as AGENTS.md says · built from: A-030")], tests: [RMT], expectRed: [R_2905] },
	{ n: "22", name: "R-1460's person Read by: line removed", edits: [one(LEDGER, "Read by: R-1460 · person: the seat's land report points the owner to it\n", "")], tests: [RMT], expectRed: [R_2905] },
	{ n: "23", name: "MOVEMENT_BASE retuned to master", edits: [one(CFG, "export const MOVEMENT_BASE = 'main';", "export const MOVEMENT_BASE = 'master';")], tests: [RMT, CRT, IRT], expectRed: [SEAL, R_2900, R_2901] },
	{ n: "24", name: "MOVEMENT_TIMEOUT_MS retuned to 10,000", edits: [one(CFG, "export const MOVEMENT_TIMEOUT_MS = 30_000;", "export const MOVEMENT_TIMEOUT_MS = 10_000;")], tests: [RMT], expectRed: [SEAL] },
];

process.exitCode = await runMutations({ lane: "review-movement", self: import.meta.url, tip: "53081c82", declared: DECLARED, pairs: PAIRS });
