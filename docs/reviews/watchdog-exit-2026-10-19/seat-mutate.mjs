#!/usr/bin/env node
// Seat wrong-code pairs for lane watchdog-exit (gate lane: pi-watchdog sits behind pi-review and pi-worker), written by
// the seat 2026-10-19 after build 1, on the shared runner. Every pair edits runOnce in packages/nana-pack/bin/pi-watchdog.mjs,
// the only product file the lane changed, never a test. P1 and W2 revert a site to main's form; W1 to W6 are
// must-meet.md's wrong-code table; W7 is the obvious misplacement of the lane's new clearTimeout (the harm "stall
// detection or the wall-clock ceiling no longer firing"). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/watchdog-exit-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const WD = "packages/nana-pack/bin/pi-watchdog.mjs";
const WE = "packages/nana-pack/tests/watchdog-exit.test.mjs";
const WE1 = "R-1390: pi-review ends under half the poll after pi exits before the first poll";
const WE2 = "R-1391: pi-worker runs every retry in under half the poll when pi fails at once";
const WE3 = "R-1392: an attempt ends under half the poll after pi exits between polls, with no extra cpu line";
const WE4 = "R-1393: pi-review retries a pi killed by a signal, then removes its checkout and releases its reservation";
const WE5 = "R-1394: a flat-CPU pi is stalled only after --stall-secs";
const WE6 = "R-1395: a pi-worker lane whose pi is killed by a signal exits 1 and frees its lane lock for the next run";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const RACE = "await Promise.race([timerDone, signalWait, ended]);";
const EXIT_LISTENER = "child.on('exit', () => notifyEnded());";
const EXIT_CHECK = "if (child.exitCode !== null || child.signalCode !== null) break; // exited";
const CPU_LINE = "cpu=${cpu}s flat=${flatPolls}/${maxFlat}\\n`);";
const AFTER_LOOP = "  await ended;";

const DECLARED = [
	"(a) timing: every named title is a timing-based check, but each pair's red does not depend on machine speed except W3's WE3 (an extra cpu line only when a ps read lands in the ~50 ms between the release file and pi's exit); W3's alsoRed WE1 and WE6 are the builder's collateral reds and also speed-dependent; W6 keeps WE1 and WE2 green only while pi exits inside its 200 ms first poll",
	"(b) no pair for the spawn-error wake (the error listener's notifyEnded) or for pi-review's exit after SIGINT: must-meet.md's Known limits lists both as not pinned, so a pair there would survive by design",
	"(c) W7 turns WE3 red through the test's own 30 s guard, which SIGKILLs pi-worker and leaves the release-mode fake pi running; the seat kills it after the run",
	"(d) the wall-clock ceiling has no must-meet check; W7 also stops it, and only WE5 (stall) and WE3 are named",
];

const PAIRS = [
	{ n: "P1", name: "main's poll-only wait: each poll races its timer and signals, not pi's exit", edits: [
		one(WD, RACE, "await Promise.race([timerDone, signalWait]);"),
	], tests: [WE], expectRed: [WE1, WE2, WE3] },
	{ n: "W1", name: "the poll timer is not cleared after a wake, so pi-review lives out the poll", edits: [
		one(WD, "clearTimeout(timer);", "/* timer left running */"),
	], tests: [WE], expectRed: [WE1] },
	{ n: "W2", name: "the after-loop wait is main's exitCode-or-close wait (exit 13 after a signal)", edits: [
		one(WD, AFTER_LOOP, "  await new Promise((r) => (child.exitCode !== null ? r() : child.on('close', r)));"),
	], tests: [WE], expectRed: [WE4, WE6] },
	{ n: "W3", name: "the ended promise resolves on spawn, so polls run back to back", edits: [
		one(WD, EXIT_LISTENER, "child.on('spawn', () => notifyEnded());"),
	], tests: [WE], expectRed: [WE2, WE3, WE5], alsoRed: [WE1, WE6] },
	{ n: "W4", name: "the exit listener is registered on attempt 1 only", edits: [
		one(WD, EXIT_LISTENER, `if (attempt === 1) ${EXIT_LISTENER}`),
	], tests: [WE], expectRed: [WE2, WE4] },
	{ n: "W5", name: "the cpu read and its line come before the exit check", edits: [
		one(WD, EXIT_CHECK, "/* exit check moved after the cpu line */"),
		one(WD, CPU_LINE, `${CPU_LINE}\n    ${EXIT_CHECK}`),
	], tests: [WE], expectRed: [WE2, WE3] },
	{ n: "W6", name: "a 200 ms first poll, later polls on the timer only, and a signalCode check in main's after-loop wait", edits: [
		one(WD, "let lastCpu = -1, flatPolls = 0;", "let lastCpu = -1, flatPolls = 0, firstPoll = true;"),
		one(WD, "timer = setTimeout(r, Math.min(pollSecs * 1000, remainingMs)); });", "timer = setTimeout(r, Math.min(firstPoll ? 200 : pollSecs * 1000, remainingMs)); }); firstPoll = false;"),
		one(WD, RACE, "await Promise.race([timerDone, signalWait]);"),
		one(WD, AFTER_LOOP, "  await new Promise((r) => (child.exitCode !== null || child.signalCode !== null ? r() : child.on('close', r)));"),
	], tests: [WE], expectRed: [WE3] },
	{ n: "W7", name: "the poll timer is cleared before the wait, so no poll wakes and the stall never fires", edits: [
		one(WD, `${RACE}\n    clearTimeout(timer);`, `clearTimeout(timer);\n    ${RACE}`),
	], tests: [WE], expectRed: [WE5, WE3] },
];

process.exitCode = await runMutations({ lane: "watchdog-exit", self: import.meta.url, tip: "c99e329", declared: DECLARED, pairs: PAIRS });
