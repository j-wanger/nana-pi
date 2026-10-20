#!/usr/bin/env node
// Seat wrong-code pairs for lane pi-probe-timeout (install, hook or gate lane: nana-setup install, its dry run and doctor),
// written by the seat 2026-10-20 on the build tip 4c67ba2c, on the shared runner. Each pair reverts one product site the
// lane changed (steps.mjs, doctor.mjs, bounded-spawn.mjs, bounded-spawn-child.mjs) to main's form or to the obvious wrong
// implementation, and names the must-meet checks (pi-launch-limits.test.mjs) or the existing doctor-runtime checks it
// must turn red. Re-run 2026-10-20 on 4d04b56 (build 2's signal grace, merged with main 385c633f): C8 re-anchored on the
// new terminate(), C2 and C5 re-judged, S1 to S5 added for the grace. Run from the worktree root (SEAT_MUTATE_DRY=1 checks
// anchors only):
//   SEAT_MUTATE_OUT=<file> node docs/reviews/pi-probe-timeout-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LL = "packages/nana-setup/tests/pi-launch-limits.test.mjs";
const DR = "packages/nana-setup/tests/doctor-runtime.test.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const DO = "packages/nana-setup/lib/doctor.mjs";
const BS = "packages/nana-setup/lib/bounded-spawn.mjs";
const BC = "packages/nana-setup/lib/bounded-spawn-child.mjs";
const R2020 = "R-2020: a pi that hangs on --version makes install and install --dry-run stop at the limit, report pi packages ✗ naming pi --version and the limit, and exit 1";
const R2021 = "R-2021: a pi that hangs on --version makes doctor stop at the limit and report pi executable ✗ naming pi --version and the limit";
const R2022 = "R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1";
const R2023 = "R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report";
const R2024 = "R-2024: with no limit injected, install, the dry run and doctor give pi --version 30 s and each pi install 120 s";
const R2025 = "R-2025: pi install started under the limit receives the agent folder install chose as PI_CODING_AGENT_DIR";
const R2026 = "R-2026: SIGINT, SIGTERM and SIGHUP each sent to install's process group end the pi launch it waits on";
const R2027PIN = "R-2027: the relay gives a signalled pi launch 1000 ms to clean up before ending its process tree";
const R2027INT = "R-2027: SIGINT lets pi install remove its lock before install ends its launch processes";
const DOTTED = "pi executable reports a dotted version";
const STUB = "pi stub is limited to the doctor probe and restored before later child processes";
const MISSING = "install missing-pi detail imports the same hint and never reaches install";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const SIGNALS = 'for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"])';

const DECLARED = [
	"(a) every pair below runs on macOS; W1 (taskkill replaced by the child alone) and W2 (windowsVerbatimArguments dropped) join the table only when it runs on win32, where the relay's win32 branch runs, so this macOS record does not judge them; on win32, C1, C2 and C5 to C8 change nothing that runs (detached is already false there, and R-2026 prints SKIP), and S1, S2, S4 and S5 change nothing a check observes (passSignal returns at once there, and the R-2027 SIGINT check prints SKIP)",
	"(b) no pair for the relay's process.exit after it reports, its settle timer, the outer backstop or the POSIX fallback to the child alone: each acts only when pi's pipes outlive the group kill (a pi in uninterruptible sleep) or the group kill fails, and no check holds such a pi",
	"(c) R-2025 is green on main; its pair B2 drops the lane's own env pass-through into the relay",
	"(d) since build 2 the relay passes a signal to pi's group before any tree kill, and every fixture process dies on that signal, so C2 (the tree kill ends pi's direct child only) no longer names R-2026; it stays red on R-2023, the deadline kill. C8 is re-anchored on the new terminate(): it exits at once, neither passing the signal nor killing the tree",
	"(e) S4 (a second signal during the grace is ignored) survives: every check sends one signal, and pi's group, where the relay passes it, does not hold the relay",
	"(f) S5 (a child that closes during the grace is reported as an ordinary result) survives: the signal reaches install's whole group, so install has ended before the relay reports and no check reads that result or the relay's exit code, and every fixture process has died on the passed signal, so the tree kill finishTermination adds finds nothing left",
];

const PAIRS = [
	{ n: "T1", name: "install's default launch is plain spawnSync again (main), so its timeout ends the shell and leaves pi's node and its child", edits: [
		one(ST, "spawn = boundedSpawnSync, limits = PI_LAUNCH_LIMITS_MS", "spawn = spawnSync, limits = PI_LAUNCH_LIMITS_MS"),
	], tests: [LL], expectRed: [R2023] },
	{ n: "T2", name: "install and its dry run pass pi no timeout (main)", edits: [
		one(ST, 'encoding: "utf8", timeout: install ? limits.install : limits.version, ', 'encoding: "utf8", '),
	], tests: [LL], expectRed: [R2020, R2022, R2023, R2024] },
	{ n: "T3", name: "pi install gets the version limit", edits: [
		one(ST, "timeout: install ? limits.install : limits.version", "timeout: limits.version"),
	], tests: [LL], expectRed: [R2024] },
	{ n: "T4", name: "the version limit is retuned to 60 s", edits: [
		one(ST, "Object.freeze({ version: 30_000, install: 120_000 })", "Object.freeze({ version: 60_000, install: 120_000 })"),
	], tests: [LL], expectRed: [R2024] },
	{ n: "T5", name: "install has no stop row for a timed-out pi --version", edits: [
		one(ST, 'if (probe.error?.code === "ETIMEDOUT") return', "if (false) return"),
	], tests: [LL], expectRed: [R2020, R2023] },
	{ n: "T6", name: "install has no stop row for a timed-out pi install", edits: [
		one(ST, 'if (r.error?.code === "ETIMEDOUT") return', "if (false) return"),
	], tests: [LL], expectRed: [R2022, R2023] },
	{ n: "T7", name: "the dry run launches pi --version without a timeout", edits: [
		one(ST, "timeout: install ? limits.install : limits.version,", "timeout: o.dryRun ? undefined : install ? limits.install : limits.version,"),
	], tests: [LL], expectRed: [R2020, R2023, R2024] },
	{ n: "D1", name: "doctor's default probe is plain spawnSync again (main)", edits: [
		one(DO, "const piSpawn = piOpts.spawn ?? boundedSpawnSync;", "const piSpawn = piOpts.spawn ?? spawnSync;"),
	], tests: [LL], expectRed: [R2023] },
	{ n: "D2", name: "doctor passes pi --version no timeout (main)", edits: [
		one(DO, 'encoding: "utf8", timeout: piLimits.version });', 'encoding: "utf8" });'),
	], tests: [LL], expectRed: [R2021, R2023, R2024] },
	{ n: "D3", name: "doctor has no stop detail for a timed-out pi --version", edits: [
		one(DO, 'probe?.error?.code === "ETIMEDOUT" ?', "false ?"),
	], tests: [LL], expectRed: [R2021, R2023] },
	{ n: "B1", name: "boundedSpawnSync is spawnSync with a SIGKILL timeout and no relay", edits: [
		one(BS, "export function boundedSpawnSync(command, args, options = {}) {\n\ttry {", 'export function boundedSpawnSync(command, args, options = {}) {\n\treturn spawnSync(command, args, { ...options, killSignal: "SIGKILL" });\n\ttry {'),
	], tests: [LL], expectRed: [R2023] },
	{ n: "B2", name: "the relay starts with the caller's process env, not options.env", edits: [
		one(BS, "env: options.env ?? process.env,", ""),
	], tests: [LL], expectRed: [R2025] },
	{ n: "B3", name: "the relay is never told the limit, so only the outer backstop stops it", edits: [
		one(BS, "timeout: Number.isFinite(timeout) && timeout >= 0 ? timeout : undefined,", "timeout: undefined,"),
	], tests: [LL], expectRed: [R2020, R2021, R2022] },
	{ n: "B4", name: "boundedSpawnSync drops the relayed error code", edits: [
		one(BS, 'const code = typeof parsed.error.code === "string" && parsed.error.code ? parsed.error.code : "ERELAY";', 'const code = "ERELAY";'),
	], tests: [LL, DR], expectRed: [R2020, R2021, R2022, R2023, MISSING] },
	{ n: "C1", name: "the relay starts pi in its own process group no longer", edits: [
		one(BC, 'detached: process.platform !== "win32",', "detached: false,"),
	], tests: [LL], expectRed: [R2023] },
	{ n: "C2", name: "the tree kill (at the deadline and on a signal) ends pi's direct child instead of its group", edits: [
		one(BC, 'process.kill(-child.pid, "SIGKILL");', 'process.kill(child.pid, "SIGKILL");'),
	], tests: [LL], expectRed: [R2023] },
	{ n: "C3", name: "the relay reports the timeout without killing anything", edits: [
		one(BC, "timedOut = true;\n\t\t\t\tkillTree();", "timedOut = true;"),
	], tests: [LL], expectRed: [R2023] },
	{ n: "C4", name: "the relay reports a child it killed at the deadline as an ordinary exit", edits: [
		one(BC, "if (timedOut) relay(timeoutResult());", "if (false) relay(timeoutResult());"),
	], tests: [LL], expectRed: [R2020, R2021, R2022, R2023] },
	{ n: "C5", name: "the relay has no SIGINT handler (Ctrl-C)", edits: [
		one(BC, SIGNALS, 'for (const signal of ["SIGTERM", "SIGHUP"])'),
	], tests: [LL], expectRed: [R2026, R2027INT] },
	{ n: "C6", name: "the relay has no SIGTERM handler", edits: [
		one(BC, SIGNALS, 'for (const signal of ["SIGINT", "SIGHUP"])'),
	], tests: [LL], expectRed: [R2026] },
	{ n: "C7", name: "the relay has no SIGHUP handler", edits: [
		one(BC, SIGNALS, 'for (const signal of ["SIGINT", "SIGTERM"])'),
	], tests: [LL], expectRed: [R2026] },
	{ n: "C8", name: "the relay's signal handlers exit without ending pi's tree", edits: [
		one(BC, "\tpassSignal(signal);\n\tsignalGraceTimer = setTimeout(() => finishTermination(signal), RELAY_SIGNAL_GRACE_MS);", "\tprocess.exit({ SIGHUP: 129, SIGINT: 130, SIGTERM: 143 }[signal]);"),
	], tests: [LL], expectRed: [R2026, R2027INT] },
	{ n: "C9", name: "the relay drops pi's stdout", edits: [
		one(BC, 'child.stdout.on("data", (chunk) => { stdout += chunk; });', 'child.stdout.on("data", () => {});'),
	], tests: [DR], expectRed: [STUB, DOTTED] },
	{ n: "C10", name: "the relay drops pi's launch error", edits: [
		one(BC, ", ...(launchError ? { error: errorRecord(launchError) } : {})", ""),
	], tests: [DR], expectRed: [MISSING] },
	{ n: "S1", name: "the relay kills at once on a signal (build 1's form)", edits: [
		one(BC, "\tpassSignal(signal);\n\tsignalGraceTimer = setTimeout(() => finishTermination(signal), RELAY_SIGNAL_GRACE_MS);", "\tfinishTermination(signal);"),
	], tests: [LL], expectRed: [R2027INT] },
	{ n: "S2", name: "the relay never passes the signal to pi", edits: [
		one(BC, 'if (process.platform === "win32" || !child?.pid) return;', "return;"),
	], tests: [LL], expectRed: [R2027INT] },
	{ n: "S3", name: "the signal grace is retuned to 5 s", edits: [
		one(BS, "RELAY_SIGNAL_GRACE_MS = 1_000", "RELAY_SIGNAL_GRACE_MS = 5_000"),
	], tests: [LL], expectRed: [R2027PIN] },
	{ n: "S4", name: "a second signal during the grace is ignored", edits: [
		one(BC, "\tif (terminatingSignal) {\n\t\tfinishTermination(signal);\n\t\treturn;\n\t}", "\tif (terminatingSignal) {\n\t\treturn;\n\t}"),
	], tests: [LL], expectRed: [] },
	{ n: "S5", name: "a child that closes during the grace is reported as an ordinary result", edits: [
		one(BC, "if (terminatingSignal) finishTermination(terminatingSignal);", "if (false) finishTermination(terminatingSignal);"),
	], tests: [LL], expectRed: [] },
	...(process.platform === "win32" ? [
		{ n: "W1", name: "win32: the deadline kill ends cmd.exe alone instead of running taskkill on its tree", edits: [
			one(BC, 'const result = spawnSync("taskkill", [...TASKKILL_ARGS, String(child.pid)], { stdio: "ignore", windowsHide: true });', "const result = { status: 1 };"),
		], tests: [LL], expectRed: [R2023] },
		{ n: "W2", name: "win32: the relay drops windowsVerbatimArguments, so cmd.exe gets a re-quoted command line", edits: [
			one(BC, "windowsVerbatimArguments: spec.options?.windowsVerbatimArguments,", ""),
		], tests: [LL], expectRed: [R2020, R2021, R2022, R2023, R2025] },
	] : []),
];

process.exitCode = await runMutations({ lane: "pi-probe-timeout", self: import.meta.url, tip: "4d04b56", declared: DECLARED, pairs: PAIRS });
