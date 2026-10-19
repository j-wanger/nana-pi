#!/usr/bin/env node
// Seat wrong-code pairs for lane doctor-quiet (install, hook or gate lane: nana-setup doctor output), written by the
// seat 2026-10-19 on the shared runner after build 1 and the merge of main. Each pair reverts one product site the
// lane changed in nana-setup.mjs to today's main form or to a wrong form the plan names (must-meet.md, "Each wrong
// code turns the named test red"). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/doctor-quiet-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const NS = "packages/nana-setup/bin/nana-setup.mjs";
const DQ = "packages/nana-setup/tests/doctor-quiet.test.mjs";
const R1750 = "doctor in a folder without project config writes no Node warning";
const R1751 = "doctor in a folder with project config writes no Node warning";
const R1752 = "doctor still prints a Node warning it does not mute";
// The test file's own closing line ("PASS|FAIL summary: <n> failures") goes red with any check; each pair declares it.
const SUMMARY = /^summary: \d+ failures$/;
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const SQLITE_PREDICATE = '(warning) => warning?.name === "ExperimentalWarning" && /SQLite/.test(warning.message),';
const TYPELESS_PREDICATE = '(warning) => warning?.code === "MODULE_TYPELESS_PACKAGE_JSON",';
const CALL = "function runDoctor(opts) {\n\tmuteDoctorWarnings();";

const DECLARED = [
	"(a) the two module-header lines the lane changed (@outputs, @effects) carry no behaviour and have no pair",
	"(b) every pair runs on macOS under this machine's Node; the rows are pinned on Node 22 (must-meet.md, Known limits)",
];

const PAIRS = [
	{ n: "M1", name: "runDoctor does not install the mute (today's main)", edits: [
		one(NS, CALL, "function runDoctor(opts) {"),
	], tests: [DQ], expectRed: [R1750, R1751], alsoRed: [SUMMARY] },
	{ n: "M2", name: "runDoctor sets NODE_NO_WARNINGS at runtime instead of installing the mute", edits: [
		one(NS, CALL, 'function runDoctor(opts) {\n\tprocess.env.NODE_NO_WARNINGS = "1";'),
	], tests: [DQ], expectRed: [R1750, R1751], alsoRed: [SUMMARY] },
	{ n: "M3", name: "the muted set drops the SQLite predicate", edits: [
		one(NS, `\t${SQLITE_PREDICATE}\n`, ""),
	], tests: [DQ], expectRed: [R1750, R1751], alsoRed: [SUMMARY] },
	{ n: "M4", name: "the SQLite predicate drops every ExperimentalWarning by name", edits: [
		one(NS, " && /SQLite/.test(warning.message)", ""),
	], tests: [DQ], expectRed: [R1752], alsoRed: [SUMMARY] },
	{ n: "M5", name: "the muted set drops the MODULE_TYPELESS_PACKAGE_JSON predicate (mutes only SQLite)", edits: [
		one(NS, `\t${TYPELESS_PREDICATE}\n`, ""),
	], tests: [DQ], expectRed: [R1751], alsoRed: [SUMMARY] },
	{ n: "M6", name: "the typeless predicate matches by name Warning instead of by code", edits: [
		one(NS, 'warning?.code === "MODULE_TYPELESS_PACKAGE_JSON"', 'warning?.name === "Warning"'),
	], tests: [DQ], expectRed: [R1752], alsoRed: [SUMMARY] },
	{ n: "M7", name: "the filter does not forward an unmuted warning to the saved listeners", edits: [
		one(NS, "\t\tfor (const listener of savedListeners) listener(warning);\n", ""),
	], tests: [DQ], expectRed: [R1752], alsoRed: [SUMMARY] },
	{ n: "M8", name: "the filter is added beside Node's printer instead of replacing it", edits: [
		one(NS, '\tprocess.removeAllListeners("warning");\n', ""),
	], tests: [DQ], expectRed: [R1750, R1751], alsoRed: [SUMMARY] },
	{ n: "M9", name: "runDoctor restores the warning listeners in a finally after diagnose()", edits: [
		one(NS, "\tmuteDoctorWarnings();\n\tconst layout = resolveLayout(opts);\n\tconst checks = diagnose(layout);\n",
			'\tconst nodeListeners = process.listeners("warning");\n\tmuteDoctorWarnings();\n\tconst layout = resolveLayout(opts);\n\tlet checks;\n\ttry { checks = diagnose(layout); } finally { process.removeAllListeners("warning"); for (const listener of nodeListeners) process.on("warning", listener); }\n'),
	], tests: [DQ], expectRed: [R1750, R1751], alsoRed: [SUMMARY] },
];

process.exitCode = await runMutations({ lane: "doctor-quiet", self: import.meta.url, tip: "f0aa8ad", declared: DECLARED, pairs: PAIRS });
