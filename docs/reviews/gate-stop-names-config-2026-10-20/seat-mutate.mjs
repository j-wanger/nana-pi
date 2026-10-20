#!/usr/bin/env node
// Seat wrong-code pairs for lane gate-stop-names-config (gate lane), written by the seat 2026-10-20 after build 1, on the
// shared runner. Each pair puts one product site the lane changed in packages/nana-pack/lib/config.ts into its wrong form:
// the U pairs the user stop branch in loadConfig, the P pairs the project stop branch, the B pairs the new module-local
// gateParseStopReason builder. U1 and P1 are main's form; the rest are the obvious wrong implementations (the build brief's
// wrong-code list, plus B4 and B6). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/gate-stop-names-config-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CFG = "packages/nana-pack/lib/config.ts";
const FB = "packages/nana-pack/tests/config-gate-fallback.test.mjs";
const PROJ = "packages/nana-pack/tests/config-project-gate-fallback.test.mjs";
const NORM = "packages/nana-pack/tests/config-normalize.test.mjs";
const SURV = "packages/nana-pack/tests/gate-survives-mutation.test.mjs";
const DT = "packages/nana-pack/tests/config-display-text.test.mjs";

// must-meet checks (the test files' titles)
const R2360 = "f: user backslash parse stop carries safe place and forward-slash recovery";
const R2361 = "f: user trailing-comma parse stop carries manual recovery only";
const R2362 = "f: empty user config parse stop carries manual recovery without a place";
const R2363 = "f: user parse stop exposes neither parser message nor file text";
const R2364 = "project backslash parse stop carries project scope, safe place and forward-slash recovery";
// edited neighbour checks
const B_STOP = ["tf", "ls", "ps", "edit", "write"].map((k) => `b: stop after restart — ${k} blocked with the repair reason`);
const B_NAMES = "b: the reason names the problem (invalid JSON)";
const P_NAMES = "1: stop reason names the project file and the repair";
const P_CLASS = ["bash", "powershell", "edit", "write"].map((k) => `1: project stop blocks every gated class — ${k}`);
const P2 = "2: blocked by the project stop";
const P3 = "3: blocked by the project stop";
const BOTH = "control: both malformed → the user stop wins";
const N_USER = "Opus trailing-comma file: gate stops conservatively (no valid policy in this process)";
const N_PROJ = "trailing-comma PROJECT file: gate stops conservatively (no valid project policy in this process)";
const S4B = "4b: with the repair reason";
// neighbour guards that keep today's text
const C_LEAF = [
	"c: malformed leaf, fresh process — ls blocked",
	"c: malformed leaf, fresh process — edit blocked",
	"c: the reason names the malformed leaf",
	"c: interactive + fresh malformed — blocked without a dialog",
	"d: fresh process — stopped, so not even the last valid allow applies",
	"d: planted wider policy files after restart — gate still STOPPED (not widened)",
];
const P_LEAF = [
	"control: malformed gate leaf (string, not array) in a trusted project → stop",
	"U2-B: dangling project nana-pack.json symlink in a trusted project → stop (not defaults)",
];
const DT_STOP = ["gate stop reason: one line, no control", "gate stop reason: path shown escaped"];

const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const USER_SITE = "stopReason: user.jsonFailure ? gateParseStopReason(userFile, user.jsonFailure) : gateStopReason(userFile, problem) };";
const PROJECT_SITE = 'projectStop = pr.jsonFailure ? gateParseStopReason(projectFile, pr.jsonFailure, "project") : gateStopReason(projectFile, problem, "project");';
const BUILDER = '`${scope} nana-pack.json does not parse: ${configFailureDetail(displayPath(file), failure).slice(CONFIG_FAILURE_PREFIX.length).replace(/\\.$/, "")}`;';

const DECLARED = [
	"(build 1, 255846f0) every pair edits lib/config.ts only; titles are the test files' titles, which REQUIREMENTS.md's rows name (they differ from the must-meet table's planned titles)",
	"(a) no pair: the json-text import line (a dropped name fails at load, not at a check); the @outputs header line (map:check's job); the README Malformed config bullet (prose)",
	"(b) U2 and P5 are the brief's 'parse builder for every stop'; they name the in-lane leaf checks that keep today's text rather than gate-corpus R-049's templated titles",
	"(c) B4 is not on the builder's list: it keeps the config-failure prefix inside the stop; the five must-meet checks stay green under it, so it names only the edited neighbour regexes that pin where the path starts",
	"(d) B6 fabricates a place when the parser reports none; it is the one pair that reaches R-2362's no-place clause alone",
	"(e) U3 appends after the builder has dropped the advice's final period, so the advice no longer reads as the whole shared sentence and all four user parse checks go red, not only R-2363",
];

const PAIRS = [
	// loadConfig, user stop branch
	{ n: "U1", name: "main's form: a user parse failure keeps the gate-block-is-malformed stop with the parser text", edits: [
		one(CFG, USER_SITE, "stopReason: gateStopReason(userFile, problem) };"),
	], tests: [FB, NORM, SURV, PROJ], expectRed: [R2360, R2361, R2362, R2363, ...B_STOP, B_NAMES, N_USER, S4B, BOTH] },
	{ n: "U2", name: "the user branch uses the parse form for every stop, a valid-JSON bad leaf too", edits: [
		one(CFG, USER_SITE, 'stopReason: gateParseStopReason(userFile, user.jsonFailure ?? { repair: "manual" }) };'),
	], tests: [FB], expectRed: C_LEAF },
	{ n: "U3", name: "the user parse stop appends the parser problem text", edits: [
		one(CFG, USER_SITE, "stopReason: user.jsonFailure ? `${gateParseStopReason(userFile, user.jsonFailure)} (${displayText(problem)})` : gateStopReason(userFile, problem) };"),
	], tests: [FB], expectRed: [R2360, R2361, R2362, R2363] },

	// loadConfig, project stop branch
	{ n: "P1", name: "main's form: a project parse failure keeps the gate-block-is-malformed stop", edits: [
		one(CFG, PROJECT_SITE, 'projectStop = gateStopReason(projectFile, problem, "project");'),
	], tests: [PROJ, NORM], expectRed: [R2364, P_NAMES, ...P_CLASS, P2, P3, N_PROJ] },
	{ n: "P2", name: "the project stop builds from the user file's parse failure", edits: [
		one(CFG, PROJECT_SITE, 'projectStop = pr.jsonFailure ? gateParseStopReason(projectFile, user.jsonFailure!, "project") : gateStopReason(projectFile, problem, "project");'),
	], tests: [PROJ], expectRed: [R2364] },
	{ n: "P3", name: "the project parse stop labels itself user", edits: [
		one(CFG, PROJECT_SITE, 'projectStop = pr.jsonFailure ? gateParseStopReason(projectFile, pr.jsonFailure) : gateStopReason(projectFile, problem, "project");'),
	], tests: [PROJ, NORM], expectRed: [R2364, P_NAMES, ...P_CLASS, P2, P3, N_PROJ] },
	{ n: "P4", name: "the project parse stop names the user file", edits: [
		one(CFG, PROJECT_SITE, 'projectStop = pr.jsonFailure ? gateParseStopReason(userFile, pr.jsonFailure, "project") : gateStopReason(projectFile, problem, "project");'),
	], tests: [PROJ], expectRed: [R2364, P_NAMES, ...P_CLASS, P2, P3] },
	{ n: "P5", name: "the project branch uses the parse form for every stop, a bad leaf and a dangling link too", edits: [
		one(CFG, PROJECT_SITE, 'projectStop = gateParseStopReason(projectFile, pr.jsonFailure ?? { repair: "manual" }, "project");'),
	], tests: [PROJ], expectRed: P_LEAF },

	// gateParseStopReason
	{ n: "B1", name: "the builder flips the repair advice", edits: [
		one(CFG, BUILDER, '`${scope} nana-pack.json does not parse: ${configFailureDetail(displayPath(file), { ...failure, repair: failure.repair === "manual" ? "forward-slash" : "manual" }).slice(CONFIG_FAILURE_PREFIX.length).replace(/\\.$/, "")}`;'),
	], tests: [FB, PROJ], expectRed: [R2360, R2361, R2362, R2364] },
	{ n: "B2", name: "the builder drops the parser place", edits: [
		one(CFG, BUILDER, '`${scope} nana-pack.json does not parse: ${configFailureDetail(displayPath(file), { repair: failure.repair }).slice(CONFIG_FAILURE_PREFIX.length).replace(/\\.$/, "")}`;'),
	], tests: [FB, PROJ], expectRed: [R2360, R2364] },
	{ n: "B3", name: "the builder keeps the advice's final period, so the gate shows two before Recovery", edits: [
		one(CFG, BUILDER, "`${scope} nana-pack.json does not parse: ${configFailureDetail(displayPath(file), failure).slice(CONFIG_FAILURE_PREFIX.length)}`;"),
	], tests: [FB, PROJ, NORM], expectRed: [R2360, R2364, N_USER, N_PROJ] },
	{ n: "B4", name: "the builder keeps the config-failure prefix inside the stop", edits: [
		one(CFG, BUILDER, '`${scope} nana-pack.json does not parse: ${configFailureDetail(displayPath(file), failure).replace(/\\.$/, "")}`;'),
	], tests: [FB, PROJ], expectRed: [...B_STOP, B_NAMES, P_NAMES, ...P_CLASS, P2, P3] },
	{ n: "B5", name: "the builder shows the raw file path, not displayPath", edits: [
		one(CFG, BUILDER, '`${scope} nana-pack.json does not parse: ${configFailureDetail(file, failure).slice(CONFIG_FAILURE_PREFIX.length).replace(/\\.$/, "")}`;'),
	], tests: [DT], expectRed: DT_STOP },
	{ n: "B6", name: "the builder reports line 1, column 1 when the parser reports no place", edits: [
		one(CFG, BUILDER, '`${scope} nana-pack.json does not parse: ${configFailureDetail(displayPath(file), { line: 1, column: 1, ...failure }).slice(CONFIG_FAILURE_PREFIX.length).replace(/\\.$/, "")}`;'),
	], tests: [FB], expectRed: [R2362] },
];

process.exitCode = await runMutations({ lane: "gate-stop-names-config", self: import.meta.url, tip: "255846f0", declared: DECLARED, pairs: PAIRS });
