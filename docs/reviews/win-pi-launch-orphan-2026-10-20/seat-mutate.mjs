#!/usr/bin/env node
// Seat wrong-code pairs for lane win-pi-launch-orphan (install, hook or gate lane: how nana-setup install, its dry run
// and doctor launch pi on Windows; new lib/pi-invocation.mjs), written by the seat 2026-10-20 on build 1 (tip c0856720),
// on the shared runner. Each pair reverts one product site the lane changed to today's main form or the obvious wrong
// implementation (must-meet.md, Design (a); build-brief-1.md wrong code 1-8). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-pi-launch-orphan-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-setup/tests/pi-launch-limits.test.mjs";
const PI = "packages/nana-setup/lib/pi-invocation.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const R2301 = "R-2301: on win32, install, its dry run and doctor start an npm pi.cmd's package entry with the running Node, its limit, install's agent folder and a checkout path holding % and ! unchanged, never through ComSpec";
const R2302 = "R-2302: on win32, a pi.cmd with no npm package beside it, another package there, or the package's entry missing still runs through ComSpec in install, its dry run and doctor";
const POSIX_LAUNCH = [
	"R-2020: a pi that hangs on --version makes install and install --dry-run stop at the limit, report pi packages ✗ naming pi --version and the limit, and exit 1",
	"R-2021: a pi that hangs on --version makes doctor stop at the limit and report pi executable ✗ naming pi --version and the limit",
	"R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1",
	"R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report",
	"R-2024: with no limit injected, install, the dry run and doctor give pi --version 30 s and each pi install 120 s",
	"R-2025: pi install started under the limit receives the agent folder install chose as PI_CODING_AGENT_DIR",
	"R-2026: SIGINT, SIGTERM and SIGHUP each sent to install's process group end the pi launch it waits on",
	"R-2027: SIGINT lets pi install remove its lock before install ends its launch processes",
	"R-2130: a SIGKILL of install's whole process group ends the pi launch it waits on within the parent check and the signal grace",
	"R-2131: a SIGKILL of install alone ends the pi launch it waits on within the parent check and the signal grace",
	"R-2132: a pi install that writes just under 1 MiB of control characters to each of stdout and stderr reads created on exit 0 and failed with its last error line on exit 1",
	"R-2133: SIGINT to install's process group, alone or with the relay signalled too, still lets a pi install that cleans up over two parent checks remove its lock before its processes end",
];
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const GATE = "if (!win32) return { command: pi, args, options: {} };";
const DIRECT = 'const direct = piLaunch(args, { platform: "win32", env, cwd, exists, isFile, readText });';
const RETURN_DIRECT = "if (!direct.refused) return { ...direct, options: {} };";
const STEPS_CALL = "const command = piInvocation(pi, args, { win32, env, cwd: process.cwd(), exists, isFile, readText });";
const DOCTOR_CALL = 'const invocation = piInvocation(executable, ["--version"], { win32: isWin, env: piEnv, cwd: process.cwd(), exists: piExists, isFile: piIsFile, readText: piReadText });';
const WIN_IMPORT = 'import { findOnPath, findPi } from "../../nana-pack/lib/win-command.mjs";';
const WIN_IMPORT_MAIN = 'import { findOnPath, findPi, winCommand } from "../../nana-pack/lib/win-command.mjs";';

const DECLARED = [
	"(a) R-2300 and R-2303 SKIP off Windows, so no pair here names them. The brief's two Windows-only wrong codes (the relay starts pi detached; install starts the relay detached) edit bounded-spawn, which this lane did not change; the seat runs them on the Windows leg, not in this macOS table",
	"(b) build-brief-1.md wrong code 3 and 4 (the direct route drops the time limit or install's PI_CODING_AGENT_DIR) have no pair: both are set by steps' spawn call after piInvocation's options, a line this lane did not change",
	"(c) M2's named titles are must-meet's regression guard (POSIX R-2130, R-2131, R-2133 and every existing check pass unchanged): with no off-win32 gate every POSIX launch is refused, so every POSIX launch check turns red; R-2027's constant check and the injected win32 checks stay green",
	"(d) M4 and M5 share one site (the refusal branch): M4 surfaces every piLaunch refusal (wrong code 2), M5 only the entry-file refusal that R-2302's third case pins (wrong code 8)",
];

const PAIRS = [
	{ n: "M1", name: "piInvocation always takes the ComSpec route on win32 (main's route, wrong code 1)", edits: [
		one(PI, `${DIRECT}\n\t${RETURN_DIRECT}\n`, ""),
	], tests: [T], expectRed: [R2301] },
	{ n: "M2", name: "piInvocation has no off-win32 gate: every platform takes the win32 route", edits: [
		one(PI, GATE, "/* mutated: no off-win32 gate */"),
	], tests: [T], expectRed: POSIX_LAUNCH },
	{ n: "M3", name: "piInvocation calls piLaunch without the injected isFile and readText", edits: [
		one(PI, DIRECT, 'const direct = piLaunch(args, { platform: "win32", env, cwd, exists });'),
	], tests: [T], expectRed: [R2301] },
	{ n: "M4", name: "a piLaunch refusal is returned as a refusal instead of falling back (wrong code 2)", edits: [
		one(PI, RETURN_DIRECT, "if (direct.refused) return { refused: direct.refused };\n\treturn { ...direct, options: {} };"),
	], tests: [T], expectRed: [R2302] },
	{ n: "M5", name: "piLaunch's entry-file refusal is returned instead of falling back (wrong code 8)", edits: [
		one(PI, RETURN_DIRECT, `${RETURN_DIRECT}\n\tif (direct.refused.startsWith("pi entry ")) return { refused: direct.refused };`),
	], tests: [T], expectRed: [R2302] },
	{ n: "M6", name: "the direct route keeps windowsVerbatimArguments (wrong code 6)", edits: [
		one(PI, RETURN_DIRECT, "if (!direct.refused) return { ...direct, options: { windowsVerbatimArguments: true } };"),
	], tests: [T], expectRed: [R2301] },
	{ n: "M7", name: "piInvocation applies winCommand's character refusal before piLaunch (wrong code 7)", edits: [
		one(PI, GATE, `${GATE}\n\tconst legacy = winCommand(pi, args, {});\n\tif (legacy.refused) return legacy;`),
	], tests: [T], expectRed: [R2301] },
	{ n: "M8", name: "the ComSpec fallback reads ComSpec under its exact key only", edits: [
		one(PI, 'const comspecKey = Object.keys(env).find((key) => key.toLowerCase() === "comspec");', 'const comspecKey = Object.keys(env).find((key) => key === "ComSpec");'),
	], tests: [T], expectRed: [R2302] },
	{ n: "M9", name: "install and its dry run launch through main's inline ComSpec block", edits: [
		one(ST, WIN_IMPORT, WIN_IMPORT_MAIN),
		one(ST, STEPS_CALL, 'const comspecKey = Object.keys(env).find((key) => key.toLowerCase() === "comspec");\n\t\tconst command = win32 ? winCommand(pi, args, { comspec: comspecKey ? env[comspecKey] : undefined }) : { command: pi, args, options: {} };'),
	], tests: [T], expectRed: [R2301] },
	{ n: "M10", name: "stepPiRegister does not pass isFile and readText to piInvocation", edits: [
		one(ST, STEPS_CALL, "const command = piInvocation(pi, args, { win32, env, cwd: process.cwd(), exists });"),
	], tests: [T], expectRed: [R2301] },
	{ n: "M11", name: "doctor keeps its own ComSpec block (main's form, wrong code 5)", edits: [
		one(DR, WIN_IMPORT, WIN_IMPORT_MAIN),
		one(DR, DOCTOR_CALL, 'const comspecKey = Object.keys(piEnv).find((key) => key.toLowerCase() === "comspec");\n\t\t\tconst invocation = isWin ? winCommand(executable, ["--version"], { comspec: comspecKey ? piEnv[comspecKey] : undefined }) : { command: executable, args: ["--version"], options: {} };'),
	], tests: [T], expectRed: [R2301] },
	{ n: "M12", name: "doctor does not pass isFile and readText to piInvocation", edits: [
		one(DR, DOCTOR_CALL, 'const invocation = piInvocation(executable, ["--version"], { win32: isWin, env: piEnv, cwd: process.cwd(), exists: piExists });'),
	], tests: [T], expectRed: [R2301] },
];

process.exitCode = await runMutations({ lane: "win-pi-launch-orphan", self: import.meta.url, tip: "c0856720", declared: DECLARED, pairs: PAIRS });
