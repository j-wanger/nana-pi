#!/usr/bin/env node
// Seat wrong-code pairs for lane review-ledger-run-win-launch (install, hook or gate lane: review-ledger run and the
// new review-launch resolver), written by the seat 2026-10-20 on build 1 merged with main (tip 6ec2cf0e), on the
// shared runner. Each pair reverts one product site the lane changed to today's main form or the obvious wrong
// implementation (must-meet.md, Design; build-brief-1.md W1-W9). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/review-ledger-run-win-launch-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RLT = "packages/nana-pack/tests/review-launch.test.mjs";
const LGT = "packages/nana-pack/tests/review-ledger.test.mjs";
const LA = "packages/nana-pack/bin/review-launch.mjs";
const RL = "packages/nana-pack/bin/review-ledger.mjs";
const R2250 = "review-ledger run with an empty or a missing command exits 1 naming what it cannot start, with no stack trace, no reservation or round, and the reason in --out";
const R2251 = "on win32 PI, pi.cmd, Pi.Exe, pi.bat and pi.COM take pi's own npm launch with the arguments unchanged";
const R2252 = "on win32 a .cmd found on PATH and .bat or pi.cmd paths start through ComSpec, while pip.exe and an extensionless path start directly";
const R2253 = "on win32 a name not on PATH, a .py PATH finds and a .cmd argument with a line feed or % are refused, named";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const PATH_ROUTE = "return PI_EXTENSIONS.slice(-2).includes(extension) ? winCommand(word, args, { comspec }) : { command: word, args };";
const FOUND_ROUTE = 'return found ? winCommand(found, args, { comspec }) : { refused: "not on PATH" };';
const SPAWN_CATCH = "} catch (e) {\n  stopHeartbeat();\n  cannotStart(e.code ?? e.message);\n}";

const DECLARED = [
	"(a) Windows-only wrong code stays out of this macOS table; the seat runs it on the Windows leg: W10 spawn without launch.options -> R-2254; W11 review-ledger ignores reviewLaunch (main's piLaunch-or-name form) -> R-2254 and R-1722; the resolver's `pi launch refused:` prefix dropped -> the R-1723 R-2250 check in win32-launch.test.mjs; review-ledger's refusal as a die before admission (main's order) or without release -> the same check and R-2250 on Windows, where both of its runs refuse `not on PATH`. On macOS the resolver never refuses and launch.options is always absent, so each would survive here",
	"(b) M1 is an expected survivor and a test gap: no macOS or Linux check runs review-ledger with a bare non-pi command that PATH finds (every ledger run names process.execPath, an absolute path, or pi), so the win32 route on every platform would refuse a bare claude or codex there as `not on PATH` and no check sees it",
	"(c) M15 is an expected survivor: cannotStart ends in die(), which calls process.exit before the heartbeat interval can fire, so a running heartbeat in the spawn catch is behaviour-equivalent",
	"(d) findOnPath without searchCwd (no lookup in the launcher's folder, unlike libuv) and the lookup running from the launcher's folder rather than --tree are plan known limits with no test and no pair",
];

const PAIRS = [
	{ n: "M1", name: "the win32 route runs on every platform (no non-win32 gate)", edits: [
		one(LA, "if (platform !== \"win32\") return word === PI_BIN_NAME ? piLaunch(args, piOptions) : { command: word, args };", "/* mutated: no non-win32 gate */"),
	], tests: [RLT, LGT], expectRed: [] },
	{ n: "M2", name: "a win32 pi name matches in exact case only (W5)", edits: [
		one(LA, "const folded = word.toLowerCase();", "const folded = word;"),
	], tests: [RLT], expectRed: [R2251] },
	{ n: "M3", name: "a win32 pi name takes no extension", edits: [
		one(LA, "const piNames = [PI_BIN_NAME, ...PI_EXTENSIONS.map((extension) => PI_BIN_NAME + extension)];", "const piNames = [PI_BIN_NAME];"),
	], tests: [RLT], expectRed: [R2251] },
	{ n: "M4", name: "a win32 pi name is any word that starts with pi (W6)", edits: [
		one(LA, "if (piNames.includes(folded)) {", "if (folded.startsWith(PI_BIN_NAME)) {"),
	], tests: [RLT], expectRed: [R2252] },
	{ n: "M5", name: "the win32 pi branch calls piLaunch in main's form, without the injected platform, environment and probes", edits: [
		one(LA, "const launch = piLaunch(args, piOptions);", "const launch = piLaunch(args, { cwd });"),
	], tests: [RLT], expectRed: [R2251] },
	{ n: "M6", name: "ComSpec is read only under its exact key", edits: [
		one(LA, "const comspec = Object.entries(env).find(([key]) => /^comspec$/i.test(key))?.[1];", "const comspec = env.ComSpec;"),
	], tests: [RLT], expectRed: [R2252] },
	{ n: "M7", name: "a path is recognised only by a forward slash", edits: [
		one(LA, String.raw`if (/[\\/:]/.test(word)) {`, "if (/[/]/.test(word)) {"),
	], tests: [RLT], expectRed: [R2252] },
	{ n: "M8", name: "a path starts directly whatever its extension (main's form)", edits: [
		one(LA, PATH_ROUTE, "return { command: word, args };"),
	], tests: [RLT], expectRed: [R2252] },
	{ n: "M9", name: "a path always goes through winCommand", edits: [
		one(LA, PATH_ROUTE, "return winCommand(word, args, { comspec });"),
	], tests: [RLT], expectRed: [R2252] },
	{ n: "M10", name: "a bare word starts by name with no PATH lookup (main's form, W7)", edits: [
		one(LA, `const found = findOnPath(word, { env, cwd, exists });\n\t${FOUND_ROUTE}`, "return { command: word, args };"),
	], tests: [RLT], expectRed: [R2252, R2253] },
	{ n: "M11", name: "a file PATH finds starts directly, skipping winCommand (W8)", edits: [
		one(LA, FOUND_ROUTE, 'return found ? { command: found, args } : { refused: "not on PATH" };'),
	], tests: [RLT], expectRed: [R2252, R2253] },
	{ n: "M12", name: "a name PATH does not find falls back to starting by name (W9)", edits: [
		one(LA, FOUND_ROUTE, "return found ? winCommand(found, args, { comspec }) : { command: word, args };"),
	], tests: [RLT], expectRed: [R2253] },
	{ n: "M13", name: "no catch around the spawn: a throw leaves a stack, the reservation and no --out (main's form, W1)", edits: [
		one(RL, SPAWN_CATCH, "} finally { /* mutated: no catch */ }"),
	], tests: [RLT], expectRed: [R2250] },
	{ n: "M14", name: "the spawn catch dies with the line, without release or --out", edits: [
		one(RL, "  cannotStart(e.code ?? e.message);", "  die(`cannot start ${child[0] || '\"\"'}: ${e.code ?? e.message}`);"),
	], tests: [RLT], expectRed: [R2250] },
	{ n: "M15", name: "the spawn catch leaves the heartbeat running", edits: [
		one(RL, "  stopHeartbeat();\n  cannotStart(e.code ?? e.message);", "  cannotStart(e.code ?? e.message);"),
	], tests: [RLT], expectRed: [] },
	{ n: "M16", name: "cannotStart keeps the reservation", edits: [
		one(RL, "const cannotStart = (reason) => {\n  release(adm.id);\n", "const cannotStart = (reason) => {\n"),
	], tests: [RLT], expectRed: [R2250] },
	{ n: "M17", name: "cannotStart writes no --out (W3)", edits: [
		one(RL, "  try { writeFileSync(out, `${line}\\n`); } catch { /* best effort; stderr remains authoritative */ }\n", ""),
	], tests: [RLT], expectRed: [R2250] },
	{ n: "M18", name: "an empty command word prints as nothing in the cannot-start line", edits: [
		one(RL, "const line = `cannot start ${child[0] || '\"\"'}: ${reason}`;", "const line = `cannot start ${child[0]}: ${reason}`;"),
	], tests: [RLT], expectRed: [R2250] },
	{ n: "M19", name: "the spawn error event still ends as no verdict (main's form, W4)", edits: [
		one(RL, "if (r.error) cannotStart(r.error.code ?? r.error.message);\n", ""),
	], tests: [RLT], expectRed: [R2250] },
];

process.exitCode = await runMutations({ lane: "review-ledger-run-win-launch", self: import.meta.url, tip: "6ec2cf0e", declared: DECLARED, pairs: PAIRS });
