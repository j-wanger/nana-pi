#!/usr/bin/env node
// Seat wrong-code pairs for lane doctor-fix-line (install, hook or gate lane: doctor), written by the seat 2026-10-20 on
// build 1's tip, on the shared runner. Each pair reverts one product site the lane changed (runDoctor's closing line in
// bin/nana-setup.mjs, diagnose's add and its three installLabel rows in lib/doctor.mjs) to its main form or to the
// obvious wrong implementation (must-meet.md W1-W8 and W6b; W3 plants a wrong installLabel on an unchanged row).
// Re-anchored on build 2's tip (build-brief-2.md): D1 and D2 follow runDoctor's nested try, and D4 and D5 revert
// build 2's fallback branch for a dry-run error that is not a refusal.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/doctor-fix-line-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const FL = "packages/nana-setup/tests/doctor-fix-line.test.mjs";
const RA = "packages/nana-setup/tests/relative-agent-dir.test.mjs";
const NS = "packages/nana-setup/bin/nana-setup.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const M1 = "R-1990: when install repairs every ✗ row, the summary reads n missing — run: nana-setup install";
const M2 = "R-1991: when no ✗ row is install's, the summary lists each as a fix by hand and never names install";
const M3 = "R-1992: a refused skill and two missing rules: the summary lists only the skill by hand and gives install the other 2";
const M4 = "R-1993: on win32's real home with its bin folder off the Path, the summary lists PATH resolves pi-review as a fix by hand";
const M5 = "R-1994: when install refuses the home, the summary names the refusal instead of telling the user to run install";
const M6 = "R-1995: doctor on a home install would change leaves every file, folder and link unchanged";
const M7 = "R-1996: with a ! row, both by-hand summary forms still end with the ! count";
const M8 = "R-1997: a non-refusal dry-run error prints every row and bounded fallback advice without a stack";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const SUFFIX = "if (warn.length) missingSummary += ` (and see the ${warn.length} ! above)`;";
const BY_HAND = "const byHandLabels = [...new Set(bad.filter((row) => !installLabels.has(row.installLabel ?? row.label)).map((row) => row.label))];";

const DECLARED = [
	"(a) every pair runs on macOS; M4 forces win32 through NANA_SETUP_PLATFORM, and the native Windows run is CI's Windows leg",
	"(b) D1 and D3 name no title: no must-meet check covers the cwd-relative refusal before the dry run (must-meet.md Known limits) or two ✗ rows sharing one label; they run to show whether any check does. D2 names M8 since build 2 added R-1997",
	"(c) no pair for the bad.length gate on the dry run (with no ✗ row the summary is never printed, so the gate changes only cost) or for the header and README text",
	"(d) W5 names only M6; since build 2 the file sets process.exitCode and bounds M6's detail, so the checks after M6 print under W5, and any other red there shows as unnamed",
	"(e) the file's closing tally, FAIL summary: <n> failures, reads as an unnamed red on every red pair; it is not a check",
];

const PAIRS = [
	{ n: "W1", name: "a ✗ row joins the dry run by its doctor label only", edits: [
		{ file: NS, anchor: "installLabels.has(row.installLabel ?? row.label)", replacement: "installLabels.has(row.label)", times: 2 },
	], tests: [FL], expectRed: [M1] },
	{ n: "W2", name: "any dry-run status counts as install's repair", edits: [
		one(NS, "new Set(dryRunRows.filter((row) => row.status === \"created\" || row.status === \"updated\").map((row) => row.label))", "new Set(dryRunRows.map((row) => row.label))"),
	], tests: [FL], expectRed: [M3, M7] },
	{ n: "W3", name: "PATH resolves pi-review carries install's PATH pi-review label on win32", edits: [
		one(DR, "\"PATH resolves pi-review\", detail);\n\t} else {", "\"PATH resolves pi-review\", detail, \"PATH pi-review\");\n\t} else {"),
	], tests: [FL], expectRed: [M4] },
	{ n: "W4", name: "a refusal prints today's run-install line", edits: [
		one(NS, "missingSummary = `${bad.length} missing — nana-setup install will not run until this is fixed: ${refusal}`;", "missingSummary = `${bad.length} missing — run: nana-setup install`;"),
	], tests: [FL], expectRed: [M5] },
	{ n: "W4b", name: "the refusal form prints the whole multi-line refusal", edits: [
		one(NS, "refusal = err.message.split(/\\r?\\n/, 1)[0];", "refusal = err.message;"),
	], tests: [FL], expectRed: [M5] },
	{ n: "W4c", name: "install's refusal propagates out of doctor", edits: [
		one(NS, "if (!(err instanceof SetupError)) throw err;", "throw err;"),
	], tests: [FL], expectRed: [M5] },
	{ n: "W5", name: "doctor runs install for real instead of its dry run", edits: [
		one(NS, "dryRunRows = install(layout, { dryRun: true });", "dryRunRows = install(layout);"),
	], tests: [FL], expectRed: [M6] },
	{ n: "W6", name: "neither by-hand form carries the ! suffix", edits: [
		one(NS, SUFFIX, "if (warn.length && !missingSummary.includes(\"fix by hand\")) missingSummary += ` (and see the ${warn.length} ! above)`;"),
	], tests: [FL], expectRed: [M7] },
	{ n: "W6b", name: "the mixed form alone drops the ! suffix", edits: [
		one(NS, SUFFIX, "if (warn.length && !missingSummary.includes(\"; then run:\")) missingSummary += ` (and see the ${warn.length} ! above)`;"),
	], tests: [FL], expectRed: [M7] },
	{ n: "W7", name: "the all-by-hand form prints today's run-install line", edits: [
		one(NS, "else if (installCount === 0) missingSummary = `${bad.length} missing — fix by hand as each ✗ line says: ${byHandLabels.join(\", \")}`;", "else if (installCount === 0) missingSummary = `${bad.length} missing — run: nana-setup install`;"),
	], tests: [FL], expectRed: [M2, M7] },
	{ n: "W8", name: "the mixed form gives install the by-hand count", edits: [
		one(NS, "then run: nana-setup install for the other ${installCount}`;", "then run: nana-setup install for the other ${byHandLabels.length}`;"),
	], tests: [FL], expectRed: [M3, M7] },
	{ n: "A1", name: "diagnose's add drops every installLabel (main's add)", edits: [
		one(DR, "const add = (status, label, detail, installLabel) => checks.push({ status, label, detail, ...(installLabel === undefined ? {} : { installLabel }) });", "const add = (status, label, detail) => checks.push({ status, label, detail });"),
	], tests: [FL], expectRed: [M1] },
	{ n: "A2", name: "the private rule row carries no installLabel (main's row)", edits: [
		one(DR, "\t\t\"rule nana-personal.md (private)\",\n", ""),
	], tests: [FL], expectRed: [M1] },
	{ n: "A3", name: "the shared memory index row carries no installLabel (main's row)", edits: [
		one(DR, "\"shared memory index\", idx, \"shared memory MEMORY.md\");", "\"shared memory index\", idx);"),
	], tests: [FL], expectRed: [M1] },
	{ n: "A4", name: "the pi objective file row carries no installLabel (main's row)", edits: [
		one(DR, "\"pi objective file\", objective, \"pi nana-objective.md\");", "\"pi objective file\", objective);"),
	], tests: [FL], expectRed: [M1] },
	{ n: "D1", name: "the dry run skips the cwd-relative refusal", edits: [
		one(NS, "\t\t\t\trefuseCwdRelativePiHome(layout, \"this install\");\n\t\t\t\tdryRunRows", "\t\t\t\tdryRunRows"),
	], tests: [FL, RA], expectRed: [] },
	{ n: "D2", name: "every dry-run error reads as a refusal", edits: [
		one(NS, "\t\t\t\tif (!(err instanceof SetupError)) throw err;\n", ""),
	], tests: [FL], expectRed: [M8] },
	{ n: "D3", name: "the by-hand labels repeat a shared label", edits: [
		one(NS, BY_HAND, "const byHandLabels = bad.filter((row) => !installLabels.has(row.installLabel ?? row.label)).map((row) => row.label);"),
	], tests: [FL], expectRed: [] },
	{ n: "D4", name: "the fallback branch prints today's run-install line without the could-not-predict prefix", edits: [
		one(NS, "missingSummary = `could not predict nana-setup install repairs (${predictionErrorCode}) — ${bad.length} missing — run: nana-setup install`;", "missingSummary = `${bad.length} missing — run: nana-setup install`;"),
	], tests: [FL], expectRed: [M8] },
	{ n: "D5", name: "the fallback branch rethrows every non-SetupError (main's crash)", edits: [
		one(NS, "predictionErrorCode = typeof err?.code === \"string\" && /^[A-Za-z0-9_.-]+$/.test(err.code) ? err.code : \"UNKNOWN\";", "throw err;"),
	], tests: [FL], expectRed: [M8] },
];

process.exitCode = await runMutations({ lane: "doctor-fix-line", self: import.meta.url, tip: "f44248c", declared: DECLARED, pairs: PAIRS });
