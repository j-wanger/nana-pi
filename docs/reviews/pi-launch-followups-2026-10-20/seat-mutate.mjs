#!/usr/bin/env node
// Seat wrong-code pairs for lane pi-launch-followups (install, hook or gate lane: the relay behind install's,
// the dry run's and doctor's pi launches), written by the seat 2026-10-20 on the shared runner against the tip
// 86240f7f (build 1, 8ec28199, plus the merge of main). Each pair reverts one product site the lane changed in
// lib/bounded-spawn.mjs or lib/bounded-spawn-child.mjs to main's form or to the obvious wrong implementation
// (build-brief-1.md W1 to W8; plan-attack.md finding 1). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> SEAT_MUTATE_SHARDS=1 node docs/reviews/pi-launch-followups-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const BS = "packages/nana-setup/lib/bounded-spawn.mjs";
const BC = "packages/nana-setup/lib/bounded-spawn-child.mjs";
const PL = "packages/nana-setup/tests/pi-launch-limits.test.mjs";
const R2020 = "R-2020: a pi that hangs on --version makes install and install --dry-run stop at the limit, report pi packages ✗ naming pi --version and the limit, and exit 1";
const R2021 = "R-2021: a pi that hangs on --version makes doctor stop at the limit and report pi executable ✗ naming pi --version and the limit";
const R2022 = "R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1";
const R2023 = "R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report";
const R2026 = "R-2026: SIGINT, SIGTERM and SIGHUP each sent to install's process group end the pi launch it waits on";
const R2027L = "R-2027: SIGINT lets pi install remove its lock before install ends its launch processes";
const R2130 = "R-2130: a SIGKILL of install's whole process group ends the pi launch it waits on within the parent check and the signal grace";
const R2131 = "R-2131: a SIGKILL of install alone ends the pi launch it waits on within the parent check and the signal grace";
const R2132 = "R-2132: a pi install that writes just under 1 MiB of control characters to each of stdout and stderr reads created on exit 0 and failed with its last error line on exit 1";
const R2133 = "R-2133: SIGINT to install's process group, alone or with the relay signalled too, still lets a pi install that cleans up over two parent checks remove its lock before its processes end";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const WATCH_CALL = 'if (!terminatingSignal) terminate("SIGINT");';

const DECLARED = [
	"(a) every pair runs on macOS; on win32 R-2026, the R-2027 lock check, R-2130, R-2131 and R-2133 skip, so only pairs 3 and 4 (R-2132) can turn red there",
	"(b) no pair for sites that exit or no-op on this platform: clearInterval(parentTimer) in relay() and finishTermination() (both exit next), the watch's own clearInterval (the terminatingSignal guard alone stops a second call), parentTimer.unref() (every path ends in process.exit), the watch's !finished guard (no caller sends a malformed spec) and its win32 guard",
	"(c) no pair retunes RELAY_PARENT_POLL_MS (chosen, unsealed; the checks read it by name); pair 4 sets RELAY_RESULT_MAX_BYTES below R-2132's 12 MiB floor",
	"(d) pair 6 (build-brief-1.md W5: the watch compares process.ppid with 1) is expected to survive on macOS, where an orphan's parent is pid 1",
	"(e) pair 1 names R-2130 only: R-2133's second phase reddens under W1 only when the relay's two back-to-back SIGINTs arrive as two deliveries; the seat saw them merge into one (first record of this table: R-2133 green; 2 of 10 direct sends merged)",
	"(f) pair 5 names only the four checks whose limit rows need pi to outlive one parent check; the others it reddens race pi's start against the first check",
];

const PAIRS = [
	{ n: "1", name: "W1: the outer relay launch is not detached on POSIX (main)", edits: [
		one(BS, '...(process.platform === "win32" ? {} : { detached: true }),', ""),
	], tests: [PL], expectRed: [R2130] },
	{ n: "2", name: "the launch spec carries no parentPid, so the watch never starts (main's spec)", edits: [
		one(BS, "parentPid: process.pid,", ""),
	], tests: [PL], expectRed: [R2026, R2027L, R2130, R2131, R2133] },
	{ n: "3", name: "W4: the outer spawnSync keeps its default 1 MiB maxBuffer (main)", edits: [
		one(BS, "maxBuffer: RELAY_RESULT_MAX_BYTES,", ""),
	], tests: [PL], expectRed: [R2132] },
	{ n: "4", name: "W4: RELAY_RESULT_MAX_BYTES is 8 MiB, below two escaped 1 MiB streams", edits: [
		one(BS, "export const RELAY_RESULT_MAX_BYTES = 16 * 1024 * 1024;", "export const RELAY_RESULT_MAX_BYTES = 8 * 1024 * 1024;"),
	], tests: [PL], expectRed: [R2132] },
	{ n: "5", name: "the watch fires while install lives (comparison inverted)", edits: [
		one(BC, "if (process.ppid === spec.parentPid) return;", "if (process.ppid !== spec.parentPid) return;"),
	], tests: [PL], expectRed: [R2020, R2021, R2022, R2023] },
	{ n: "6", name: "W5: the watch compares process.ppid with 1", edits: [
		one(BC, "if (process.ppid === spec.parentPid) return;", "if (process.ppid !== 1) return;"),
	], tests: [PL], expectRed: [R2130, R2131] },
	{ n: "7", name: "W3: the watch kills at once with no grace", edits: [
		one(BC, WATCH_CALL, 'if (!terminatingSignal) finishTermination("SIGINT");'),
	], tests: [PL], expectRed: [R2027L, R2133] },
	{ n: "8", name: "W6: the watch passes SIGINT and never kills", edits: [
		one(BC, WATCH_CALL, 'if (!terminatingSignal) passSignal("SIGINT");'),
	], tests: [PL], expectRed: [R2130, R2131] },
	{ n: "9", name: "W7: the watch calls terminate on every tick (the plan's watch as first worded)", edits: [
		one(BC, `clearInterval(parentTimer);\n\t\t${WATCH_CALL}`, 'terminate("SIGINT");'),
	], tests: [PL], expectRed: [R2133] },
	{ n: "10", name: "W8: the watch fires once but ignores a termination in progress", edits: [
		one(BC, WATCH_CALL, 'terminate("SIGINT");'),
	], tests: [PL], expectRed: [R2133] },
];

process.exitCode = await runMutations({ lane: "pi-launch-followups", self: import.meta.url, tip: "86240f7f", declared: DECLARED, pairs: PAIRS });
