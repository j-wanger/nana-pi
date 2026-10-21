#!/usr/bin/env node
// Seat wrong-code pairs for lane win-leg-flakes (ordinary lane), written by the seat 2026-10-21 after build 1, on the
// shared runner. Build 1 reported PARTIAL with no wrong-code tries run, so the seat runs the brief's five here. Run from
// the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-leg-flakes-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-setup/tests/install-check.test.mjs";
const LIB = "packages/nana-setup/lib/install-check.mjs";
const CFG = "packages/nana-setup/lib/install-check-config.mjs";
const SC = "packages/nana-setup/tests/stale-copies.test.mjs";
const SS = "packages/nana-setup/tests/stale-copies-slow.test.mjs";
const PL = "packages/nana-setup/tests/pi-launch-limits.test.mjs";
const PU = "packages/nana-pack/tests/pack-config-utf16.test.mjs";
const RELAY = "packages/nana-setup/lib/bounded-spawn-child.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = ["(build 1, 6c99f999) the brief's five wrong-code tries for R-2480, R-2481, R-2486 and the retry pin", "(builds 2-3, bc3e492d) the briefs' six tries for R-2482 to R-2485, re-run by the seat", "(adversary) a relay that loses its deadline must still fail R-2020 to R-2022 under the 7.5 s bound"];

const PAIRS = [
	{ n: "W1", name: "no retry loop: one attempt only", edits: [
		one(LIB, "attempt <= PI_SUBAGENTS_RETRY.attempts; attempt++", "attempt <= 1; attempt++"),
	], tests: [T], expectRed: [/^R-2480: a pi-subagents install that exits 1 and then 0/] },
	{ n: "W2", name: "the NOTE line is dropped", edits: [
		one(LIB, "    emitLine(`NOTE pi-subagents attempt ${attempt} of ${PI_SUBAGENTS_RETRY.attempts} failed — ${failureReason}`);\n", ""),
	], tests: [T], expectRed: [/^R-2481: /] },
	{ n: "W3", name: "every NOTE names attempt 1's code line", edits: [
		one(LIB, "const failureReason = codeLine ?? reason(sub);", "const failureReason = (globalThis.__seatFirstCode ??= codeLine) ?? reason(sub);"),
	], tests: [T], expectRed: [/^R-2481: /] },
	{ n: "W4", name: "a timeout is retried too", edits: [
		one(LIB, "if (okay(sub) || sub.error || typeof sub.status !== \"number\" || sub.status === 0) break;", "if (okay(sub) || sub.status === 0) break;"),
	], tests: [T], expectRed: [/^R-2486: /] },
	{ n: "W5", name: "the sealed attempt count drops to two", edits: [
		one(CFG, "attempts: 3, pauseMs: 5000", "attempts: 2, pauseMs: 5000"),
	], tests: [T], expectRed: [/^R-2480: the pi-subagents retry is sealed/] },
	{ n: "W6", name: "the install-child limit back to 5 seconds", edits: [
		one(SC, "export const INSTALL_CHILD_LIMIT_MS = 20_000;", "export const INSTALL_CHILD_LIMIT_MS = 5_000;"),
	], tests: [SC, SS], expectRed: [/^R-2482: the stale-copies install-child limit is sealed/, /^R-2482: off Windows, stale-copies passes every check/] },
	{ n: "W7", name: "the repair install still on the 5-second hook limit", edits: [
		one(SC, 'encoding: "utf8", env, timeout: INSTALL_CHILD_LIMIT_MS });', 'encoding: "utf8", env, timeout: CASE_LIMIT_MS });'),
	], tests: [SS], expectRed: [/^R-2482: off Windows, stale-copies passes every check/] },
	{ n: "W8", name: "the R-1761 detail drops the hook run's facts", edits: [
		one(SC, ", hookStatus: item.hook.status, hookSignal: item.hook.signal, hookMs: item.hookMs, unavailable: unavailableLines(item.hook)", ""),
	], tests: [SS], expectRed: [/^R-2483: /] },
	{ n: "W9", name: "the hang-stop margin at 5 seconds (bound above the relay backstop)", edits: [
		one(PL, "const HANG_STOP_MARGIN_MS = 3_500;", "const HANG_STOP_MARGIN_MS = 5_000;"),
	], tests: [PL], expectRed: [/^R-2484: /] },
	{ n: "W10", name: "the hang-stop margin back to 1 second", edits: [
		one(PL, "const HANG_STOP_MARGIN_MS = 3_500;", "const HANG_STOP_MARGIN_MS = 1_000;"),
	], tests: [PL], expectRed: [/^R-2484: /] },
	{ n: "W11", name: "the PowerShell helper passes the shared 15-second timeout", edits: [
		one(PU, "timeout: POWERSHELL_LIMIT_MS, env });", "timeout, env });"),
	], tests: [PU], expectRed: [/^R-2485: /] },
	{ n: "W12", name: "the relay loses its deadline (only the outer backstop stops a hung pi)", edits: [
		one(RELAY, "if (Number.isFinite(timeout) && timeout >= 0) {", "if (false) {"),
	], tests: [PL], expectRed: [/^R-2020: /, /^R-2021: /, /^R-2022: /] },
];

process.exitCode = await runMutations({ lane: "win-leg-flakes", self: import.meta.url, tip: "bc3e492d", declared: DECLARED, pairs: PAIRS });
