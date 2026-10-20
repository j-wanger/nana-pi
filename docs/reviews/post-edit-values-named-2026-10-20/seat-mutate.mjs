#!/usr/bin/env node
// Seat wrong-code pairs for lane post-edit-values-named (hook lane), written by the seat 2026-10-20 on the build
// (ce4ca2c7) merged with main c7f582ad, on the shared runner. Each pair reverts one product site the lane changed to
// today's main form (a literal at the sealed value) or to the obvious wrong implementation, or retunes one sealed
// value in the config module. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/post-edit-values-named-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const EXT = "packages/nana-pack/extensions/nana-post-edit.ts";
const CFG = "packages/nana-pack/lib/post-edit-config.mjs";
const MM = "packages/nana-pack/tests/post-edit-values-named.test.mjs";
const DS = "packages/nana-pack/tests/display-surfaces.test.mjs";
const GRACE = "a timed-out post-edit check arms its forced kill at the named kill grace, retuned in a copy";
const OUTPUT = "a post-edit check that prints past the named output cap could not run and keeps only that many first units, retuned in a copy";
const FAILURE = "a failing post-edit check shows the model the last units up to the named failure cap, retuned in a copy";
const COMMAND = "a failing post-edit check shows the model its command up to the named command cap, retuned in a copy";
const LOCK = "a refused post-edit file lock shows the model the refusal up to the named lock message cap, retuned in a copy";
const SEAL = "seal: the post-edit kill grace is 2000 ms, the output cap 1048576, the command cap 400 and the lock message cap 300";
const R087 = "post-edit: a truncated failure says so, and keeps the TAIL";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) G2 is an expected survivor: the forced-settle message is shown only when the kill fails, which no check reaches with a retuned grace; at the sealed 2000 the literal reads the same",
	"(b) F5 is an expected survivor: the ⏎ widening keeps the failure body at most three times the failure cap, so the literal 2000 * 3 ceiling equals the named one for any retune at or below 2000, the copy's 37 included",
	"(c) the hardening settle bound (SETTLE_BOUND_MS) is a test change and tables edit only product code, so no pair; the README sentence and the module header carry no behaviour, so no pair",
	"(d) every pair runs on macOS; R-2210's exact timer list on Windows, where taskkill does the kill, is proven only by the Windows CI leg",
];

const PAIRS = [
	{ n: "G1", name: "the forced-kill timer is armed at a literal 2000 ms", edits: [
		one(EXT, "}, POST_EDIT_KILL_GRACE_MS);", "}, 2000);"),
	], tests: [MM], expectRed: [GRACE] },
	{ n: "G2", name: "the forced-settle message states a literal 2000 ms", edits: [
		one(EXT, "within ${POST_EDIT_KILL_GRACE_MS}ms of the kill signal", "within 2000ms of the kill signal"),
	], tests: [MM], expectRed: [] },
	{ n: "O1", name: "the overflow test compares against a literal 1 MiB", edits: [
		one(EXT, "if (out.length > POST_EDIT_OUTPUT_CAP) {", "if (out.length > 1024 * 1024) {"),
	], tests: [MM], expectRed: [OUTPUT] },
	{ n: "O2", name: "the overflow cut keeps a literal 1 MiB", edits: [
		one(EXT, "out = out.slice(0, POST_EDIT_OUTPUT_CAP);", "out = out.slice(0, 1024 * 1024);"),
	], tests: [MM], expectRed: [OUTPUT] },
	{ n: "O3", name: "the overflow cut counts code points instead of UTF-16 units", edits: [
		one(EXT, "out = out.slice(0, POST_EDIT_OUTPUT_CAP);", "out = Array.from(out).slice(0, POST_EDIT_OUTPUT_CAP).join(\"\");"),
	], tests: [MM], expectRed: [OUTPUT] },
	{ n: "F1", name: "the failure-output cut test compares against a literal 2000", edits: [
		one(EXT, "const cut = o.length > POST_EDIT_FAILURE_CAP;", "const cut = o.length > 2000;"),
	], tests: [MM], expectRed: [FAILURE] },
	{ n: "F2", name: "the failure-output tail keeps a literal 2000", edits: [
		one(EXT, "(cut ? o.slice(-POST_EDIT_FAILURE_CAP) : o)", "(cut ? o.slice(-2000) : o)"),
	], tests: [MM], expectRed: [FAILURE] },
	{ n: "F3", name: "the stated output cut names a literal 2000", edits: [
		one(EXT, "(output truncated: last ${POST_EDIT_FAILURE_CAP} of", "(output truncated: last 2000 of"),
	], tests: [MM], expectRed: [FAILURE] },
	{ n: "F4", name: "the failure output cut is never stated or applied (whole output shown)", edits: [
		one(EXT, "const cut = o.length > POST_EDIT_FAILURE_CAP;", "const cut = false;"),
	], tests: [MM], expectRed: [FAILURE] },
	{ n: "F5", name: "the failure body ceiling is a literal 2000 * 3", edits: [
		one(EXT, "POST_EDIT_FAILURE_CAP * 3)", "2000 * 3)"),
	], tests: [MM], expectRed: [] },
	{ n: "C1", name: "the shown command is cut at a literal 400", edits: [
		one(EXT, "promptText(cmd, POST_EDIT_COMMAND_CAP)", "promptText(cmd, 400)"),
	], tests: [MM], expectRed: [COMMAND] },
	{ n: "C2", name: "the command cut test compares against a literal 400", edits: [
		one(EXT, "const cmdCut = String(cmd).length > POST_EDIT_COMMAND_CAP;", "const cmdCut = String(cmd).length > 400;"),
	], tests: [MM], expectRed: [COMMAND] },
	{ n: "C3", name: "the stated command cut names a literal 400", edits: [
		one(EXT, "(command truncated: first ${POST_EDIT_COMMAND_CAP} of", "(command truncated: first 400 of"),
	], tests: [MM], expectRed: [COMMAND] },
	{ n: "L1", name: "the lock refusal is cut at a literal 300", edits: [
		one(EXT, "promptText(lockError, POST_EDIT_LOCK_MESSAGE_CAP)", "promptText(lockError, 300)"),
	], tests: [MM], expectRed: [LOCK] },
	{ n: "L2", name: "the lock refusal is passed with no cap of its own (promptText's default)", edits: [
		one(EXT, "promptText(lockError, POST_EDIT_LOCK_MESSAGE_CAP)", "promptText(lockError)"),
	], tests: [MM], expectRed: [LOCK] },
	{ n: "S1", name: "the config's kill grace is retuned to 2500", edits: [
		one(CFG, "export const POST_EDIT_KILL_GRACE_MS = 2000;", "export const POST_EDIT_KILL_GRACE_MS = 2500;"),
	], tests: [MM], expectRed: [SEAL] },
	{ n: "S2", name: "the config's output cap is retuned to 1000 * 1000", edits: [
		one(CFG, "export const POST_EDIT_OUTPUT_CAP = 1024 * 1024;", "export const POST_EDIT_OUTPUT_CAP = 1000 * 1000;"),
	], tests: [MM], expectRed: [SEAL] },
	{ n: "S3", name: "the config's command cap is retuned to 401", edits: [
		one(CFG, "export const POST_EDIT_COMMAND_CAP = 400;", "export const POST_EDIT_COMMAND_CAP = 401;"),
	], tests: [MM], expectRed: [SEAL] },
	{ n: "S4", name: "the config's lock message cap is retuned to 299", edits: [
		one(CFG, "export const POST_EDIT_LOCK_MESSAGE_CAP = 300;", "export const POST_EDIT_LOCK_MESSAGE_CAP = 299;"),
	], tests: [MM], expectRed: [SEAL] },
	{ n: "S5", name: "the config's failure cap (contract R-087) is retuned to 1999", edits: [
		one(CFG, "export const POST_EDIT_FAILURE_CAP = 2000;", "export const POST_EDIT_FAILURE_CAP = 1999;"),
	], tests: [DS], expectRed: [R087] },
];

process.exitCode = await runMutations({ lane: "post-edit-values-named", self: import.meta.url, tip: "493717df", declared: DECLARED, pairs: PAIRS });
