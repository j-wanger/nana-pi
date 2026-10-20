#!/usr/bin/env node
// Seat wrong-code pairs for lane review-launch-win-paths (land and review tools: review-ledger run and its Windows
// launch resolver), written by the seat 2026-10-20 on build 1 (6136c925), on the shared runner. Each pair puts one
// site the lane changed into its wrong form: today's main behaviour or the obvious wrong implementation (must-meet.md,
// "Wrong code for the seat's pairs", numbers 1 to 7 in each name where one applies). M1-M8 break the resolver's new
// path check in bin/review-launch.mjs and run on any platform through the test's injected win32 file map. W1 and W2
// break sites only R-2432 reaches, and R-2432 runs only on the Windows leg, so the table adds them only on win32.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/review-launch-win-paths-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-pack/tests/review-launch.test.mjs";
const RL = "packages/nana-pack/bin/review-launch.mjs";
const LEDGER = "packages/nana-pack/bin/review-ledger.mjs";
const R2252 = "on win32 a .cmd found on PATH and .bat or pi.cmd paths start through ComSpec, while pip.exe and an extensionless path start directly";
const R2430 = "on win32 a missing .cmd path, a missing upper-case .BAT path and a relative .cmd path absent from the given folder are refused, each naming its resolved path";
const R2431 = "on win32 a relative .cmd path present only in the given folder starts through ComSpec as written";
const R2432 = "Windows: review-ledger run resolves a relative .cmd reviewer path against --tree, starting one present only there and refusing one present only in the launcher's folder, with the cannot-start line in --out and no round";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const WIN = process.platform === "win32";

// The lane's new refusal line in the resolver's path branch, whole.
const CHECK_LINE = "\t\tif (PI_EXTENSIONS.slice(-2).includes(extension) && !exists(resolved)) return { refused: `no file at ${resolved}` };\n";

const DECLARED = [
	"(a) M1-M8 run on macOS against the test's injected win32 file map; W1 and W2 run only on win32, where R-2432 runs. Off win32 neither site changes behaviour: the resolver reads cwd and its existence probe only on win32, so R-2432 prints SKIP here and no macOS check can turn red",
	"(b) no pair: win-command.mjs's new export of defaultExists (interface only; a reverted export fails the import, not a check); the two module header lines; the README sentence; R-2252's fixture .bat (test code)",
	"(c) M8 edits the launch line the lane left unchanged: design point 1 keeps the path as written, and launching the resolved path is the new check's obvious wrong form",
];

const PAIRS = [
	{ n: "M1", name: "main's form: a .cmd or .bat path is launched with no existence check", edits: [
		one(RL, CHECK_LINE, ""),
	], tests: [T], expectRed: [R2430] },
	{ n: "M2", name: "(1) the existence check reads the path unresolved", edits: [
		one(RL, "&& !exists(resolved))", "&& !exists(word))"),
	], tests: [T], expectRed: [R2431] },
	{ n: "M3", name: "(2) the path resolves against the process's own folder, not the given one", edits: [
		one(RL, "const resolved = path.win32.resolve(cwd, word);", "const resolved = path.win32.resolve(process.cwd(), word);"),
	], tests: [T], expectRed: [R2430, R2431] },
	{ n: "M4", name: "(3) every .cmd or .bat path is refused", edits: [
		one(RL, "&& !exists(resolved))", "&& true)"),
	], tests: [T], expectRed: [R2252, R2431] },
	{ n: "M5", name: "(4) the check compares the extension without folding case", edits: [
		one(RL, "if (PI_EXTENSIONS.slice(-2).includes(extension) && !exists(resolved))", "if (PI_EXTENSIONS.slice(-2).includes(path.win32.extname(word)) && !exists(resolved))"),
	], tests: [T], expectRed: [R2430] },
	{ n: "M6", name: "(5) the refusal leaves out the resolved path", edits: [
		one(RL, "return { refused: `no file at ${resolved}` };", "return { refused: \"no file\" };"),
	], tests: [T], expectRed: [R2430] },
	{ n: "M7", name: "(6) the check also refuses a missing .exe or extensionless path", edits: [
		one(RL, "if (PI_EXTENSIONS.slice(-2).includes(extension) && !exists(resolved))", "if (!exists(resolved))"),
	], tests: [T], expectRed: [R2252] },
	{ n: "M8", name: "a present .cmd path launches as resolved, not as written", edits: [
		one(RL, "? winCommand(word, args, { comspec })", "? winCommand(resolved, args, { comspec })"),
	], tests: [T], expectRed: [R2431] },
];

const WIN_PAIRS = [
	{ n: "W1", name: "(7) main's form: review-ledger resolves before admission with the launcher's folder", edits: [
		one(LEDGER, "const launch = reviewLaunch(child, { cwd: adm.res.cwd });\n", ""),
		one(LEDGER, "const adm = admit(own,", "const launch = reviewLaunch(child);\nconst adm = admit(own,"),
	], tests: [T], expectRed: [R2432] },
	{ n: "W2", name: "main's form: the resolver's existence probe has no default", edits: [
		one(RL, "\texists = defaultExists,\n", "\texists,\n"),
	], tests: [T], expectRed: [R2432] },
];

process.exitCode = await runMutations({ lane: "review-launch-win-paths", self: import.meta.url, tip: "6136c925", declared: DECLARED, pairs: WIN ? [...PAIRS, ...WIN_PAIRS] : PAIRS });
