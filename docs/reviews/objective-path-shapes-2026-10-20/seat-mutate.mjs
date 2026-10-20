#!/usr/bin/env node
// Seat wrong-code pairs for lane objective-path-shapes (install, hook or gate lane: nana-setup install's objective seed
// and doctor's objective rows, plus lib/objective.ts behind the Claude Code SessionStart objective hook and the
// nana-objective pi extension; new shared lib/objective-path.mjs), written by the seat 2026-10-20 after build 1, on the
// shared runner. R1 to R10 put the new resolver in a wrong form; P1, O1, S1 and S2 break its three callers (O1 and S1
// restore main's hand copies); D1 to D7 break doctor's new objective.path row (build-brief-1.md, wrong code 1 to 11).
// Every edit is product code, never a test. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/objective-path-shapes-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const OP = "packages/nana-pack/lib/objective-path.mjs";
const OT = "packages/nana-pack/lib/objective.ts";
const ST = "packages/nana-setup/lib/steps.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const PA = "packages/nana-setup/lib/paths.mjs";
const T = "packages/nana-setup/tests/objective-path-shapes.test.mjs";
const IT = "packages/nana-setup/tests/install.test.mjs";
const OG = "packages/nana-pack/tests/objective-golden.test.mjs";
const R2280 = "R-2280: doctor prints every row and no stack trace when objective.path is 5, true or an object";
const R2281 = "R-2281: doctor marks objective.path ✗ naming the value and the default file only when it is neither a string nor null";
const R2282 = "R-2282: install runs every step and seeds the default objective file when objective.path is 5, true or an object";
const R2283 = "R-2283: an empty objective.path names the default objective file in the producer, doctor and install";
const R2284 = "R-2284: the objective path resolver expands a tilde-backslash prefix to the home folder only on win32";
const SEED_HERE = "objective seed: created when objective.path resolves to it";
const SEED_DOCTOR = "objective seed: doctor is still green";
const T15_DEFAULT = "T15 objectivePath default: <PI_CODING_AGENT_DIR>/nana-objective.md";
const T15_RELATIVE = "T15 objectivePath relative: resolves against the active agent dir";
const T15_BOTH = "T15 both runtimes read the active agent dir's nana-objective.md";
const T15_UNSET = "T15 unset override: default ~/.pi/agent";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const RESOLVE_CALL_OT = "return resolveObjectivePath(o.path, { home: os.homedir(), agentDir: piAgentDir(), platform: process.platform });";
const MAIN_BODY_OT = [
	'const p = o.path ?? path.join(piAgentDir(), "nana-objective.md");',
	'\tif (p === "~") return os.homedir();',
	'\tif (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));',
	"\treturn path.isAbsolute(p) ? p : path.join(piAgentDir(), p);",
].join("\n");
const RESOLVE_CALL_ST = "return resolveObjectivePath(cfg?.objective?.path, { home: layout.base, agentDir: layout.piHome, platform: process.platform });";
const MAIN_BODY_ST = [
	"const p = cfg?.objective?.path;",
	"\tif (!p) return layout.piObjective;",
	'\tif (p === "~") return layout.base;',
	'\tif (p.startsWith("~/")) return path.join(layout.base, p.slice(2));',
	"\treturn path.isAbsolute(p) ? p : path.join(layout.piHome, p);",
].join("\n");
const ROW_IF = 'if (rawObjectivePath !== undefined && rawObjectivePath !== null && typeof rawObjectivePath !== "string") {';

const DECLARED = [
	"(a) every pair runs on macOS; R-2285 prints SKIP off Windows, so no pair names it, and no pair swaps the platform argument objective.ts and steps.mjs pass: it changes the result only on win32 (a pair that moves objectiveTarget to the NANA_SETUP_PLATFORM seam survives on macOS, must-meet Known limits)",
	"(b) R1 and S1 make doctor throw the TypeError main printed; the test file then throws at R-2280's in-process doctor call, so their named titles read NOT REACHED and the CRASH line is their red",
	"(c) no pair turns objectivePath's o.path into o?.path: produce() reads o.projectFile through projectFileName(o) on the next lines, so R-2093's internal-error marker holds either way (an equivalent edit)",
	"(d) no pair puts main's literal back in paths.mjs: DEFAULT_OBJECTIVE_FILE is the same string (an equivalent edit); P1 spells a different name instead",
	"(e) no pair for the resolver's \"~\" branch, doctor's 120-character cap or its String() fallback: no check gives \"~\" alone or a value over 120 characters, and JSON.stringify returns a string for every JSON value, so the fallback is unreachable",
	"(f) no pair gives doctor's objective.path row an install label: no lane check reads the fix line for this row",
	"(g) R10 names objective-golden's three R-004 checks; its other reds are the golden worlds that write the default objective file by its literal name, so the record lists them as unnamed",
];

const PAIRS = [
	{ n: "R1", name: "the resolver tests !value, not the type, so a number, boolean or object reaches startsWith", edits: [
		one(OP, 'if (typeof value !== "string" || value === "") return', "if (!value) return"),
	], tests: [T], expectRed: [R2280, R2282] },
	{ n: "R2", name: "the resolver coerces a non-string value with String() and resolves it under the agent dir", edits: [
		one(OP, 'if (typeof value !== "string" || value === "") return', 'if ((value = value == null ? "" : String(value)) === "") return'),
	], tests: [T], expectRed: [R2282] },
	{ n: "R3", name: "an empty value resolves to the agent dir itself, as objective.ts did on main", edits: [
		one(OP, 'typeof value !== "string" || value === ""', 'typeof value !== "string"'),
	], tests: [T], expectRed: [R2283] },
	{ n: "R4", name: "a tilde-backslash prefix expands on every platform", edits: [
		one(OP, 'if (platform === "win32" && value.startsWith(', "if (value.startsWith("),
	], tests: [T], expectRed: [R2284] },
	{ n: "R5", name: "a tilde-backslash prefix never expands", edits: [
		one(OP, 'if (platform === "win32" && value.startsWith(', "if (false && value.startsWith("),
	], tests: [T], expectRed: [R2284] },
	{ n: "R6", name: "the resolver joins with the host's path flavour, not the platform's", edits: [
		one(OP, 'const p = platform === "win32" ? path.win32 : path.posix;', "const p = path;"),
	], tests: [T], expectRed: [R2284] },
	{ n: "R7", name: "a tilde-slash prefix never expands", edits: [
		one(OP, 'if (value.startsWith("~/")) return', 'if (false && value.startsWith("~/")) return'),
	], tests: [T], expectRed: [R2284] },
	{ n: "R8", name: "an absolute value resolves under the agent dir", edits: [
		one(OP, "return p.isAbsolute(value) ? value : p.join(agentDir, value);", "return p.join(agentDir, value);"),
	], tests: [IT], expectRed: [SEED_DOCTOR] },
	{ n: "R9", name: "a relative value resolves against the current folder, not the agent dir", edits: [
		one(OP, "return p.isAbsolute(value) ? value : p.join(agentDir, value);", "return p.isAbsolute(value) ? value : p.resolve(value);"),
	], tests: [OG], expectRed: [T15_RELATIVE] },
	{ n: "R10", name: "the shared default objective file names another file", edits: [
		one(OP, 'export const DEFAULT_OBJECTIVE_FILE = "nana-objective.md";', 'export const DEFAULT_OBJECTIVE_FILE = "objective.md";'),
	], tests: [OG], expectRed: [T15_DEFAULT, T15_BOTH, T15_UNSET] },
	{ n: "P1", name: "paths.mjs spells its own default objective file name instead of the shared one", edits: [
		one(PA, "piObjective: path.join(piHome, DEFAULT_OBJECTIVE_FILE),", 'piObjective: path.join(piHome, "objective.md"),'),
	], tests: [T], expectRed: [R2281, R2282, R2283] },
	{ n: "O1", name: "objectivePath keeps main's own body", edits: [
		one(OT, RESOLVE_CALL_OT, MAIN_BODY_OT),
	], tests: [T], expectRed: [R2283] },
	{ n: "S1", name: "objectiveTarget restores main's hand copy", edits: [
		one(ST, RESOLVE_CALL_ST, MAIN_BODY_ST),
	], tests: [T], expectRed: [R2280, R2282] },
	{ n: "S2", name: "objectiveTarget expands the tilde under the real home folder, not the layout's", edits: [
		one(ST, "{ home: layout.base, agentDir: layout.piHome,", "{ home: os.homedir(), agentDir: layout.piHome,"),
	], tests: [IT], expectRed: [SEED_HERE] },
	{ n: "D1", name: "doctor drops the objective.path row", edits: [
		one(DR, ROW_IF, "if (false) {"),
	], tests: [T], expectRed: [R2280, R2281] },
	{ n: "D2", name: "doctor also prints the row for null", edits: [
		one(DR, "rawObjectivePath !== undefined && rawObjectivePath !== null && typeof", "rawObjectivePath !== undefined && typeof"),
	], tests: [T], expectRed: [R2281] },
	{ n: "D3", name: "doctor also prints the row for a string, the empty string included", edits: [
		one(DR, 'rawObjectivePath !== null && typeof rawObjectivePath !== "string") {', "rawObjectivePath !== null) {"),
	], tests: [T], expectRed: [R2281] },
	{ n: "D4", name: "doctor's objective.path row warns instead of failing", edits: [
		one(DR, 'add(FAIL, "pi objective.path",', 'add(WARN, "pi objective.path",'),
	], tests: [T], expectRed: [R2281] },
	{ n: "D5", name: "doctor's objective.path row omits the default file", edits: [
		one(DR, "the producer ignores it and uses ${layout.piObjective};", "the producer ignores it and uses the default file;"),
	], tests: [T], expectRed: [R2281] },
	{ n: "D6", name: "doctor prints the row only for a truthy value", edits: [
		one(DR, "if (rawObjectivePath !== undefined && rawObjectivePath !== null && typeof", "if (rawObjectivePath && typeof"),
	], tests: [T], expectRed: [R2281] },
	{ n: "D7", name: "doctor's row shows String(value), not its JSON", edits: [
		one(DR, "const shown = JSON.stringify(rawObjectivePath)?.slice(0, 120) ?? String(rawObjectivePath);", "const shown = String(rawObjectivePath).slice(0, 120);"),
	], tests: [T], expectRed: [R2281] },
];

process.exitCode = await runMutations({ lane: "objective-path-shapes", self: import.meta.url, tip: "07dc79b3", declared: DECLARED, pairs: PAIRS });
