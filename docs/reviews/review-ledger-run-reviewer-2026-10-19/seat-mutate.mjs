#!/usr/bin/env node
// Seat wrong-code pairs for lane review-ledger-run-reviewer (install, hook or gate lane: review-ledger run), written
// by the seat 2026-10-19 on build 1 (tip ac1fbdac), on the shared runner. Each pair reverts one product site the lane
// changed to today's main form or the obvious wrong implementation (must-meet.md, Design). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/review-ledger-run-reviewer-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RLT = "packages/nana-pack/tests/review-ledger.test.mjs";
const IRT = "packages/nana-pack/tests/immutable-review.test.mjs";
const RL = "packages/nana-pack/bin/review-ledger.mjs";
const WC = "packages/nana-pack/bin/worker-config.mjs";
const PR = "packages/nana-pack/bin/pi-review.mjs";
const R1720 = "review-ledger run starts its command with NANA_ROLE=reviewer and NANA_HANDOFF=off over a caller's worker role";
const R1721 = "review-ledger run -- pi starts pi and records its round";
const R974 = "dirty working state is reproduced exactly and reviewer runs in the immutable checkout";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const SPAWN_ENV = "stdio: ['inherit', 'pipe', 'inherit'], env: { ...process.env, ...REVIEWER_CHILD_ENV } }";

const DECLARED = [
	"(a) Windows-only wrong code stays out of this macOS table; the seat runs it on the Windows leg: pi spawned by name (main's launch form) -> R-1721, R-1722; winCommand through cmd.exe -> R-1722; the refusal after admit with no release -> R-1723. On macOS piLaunch returns pi by name and never refuses, so each would survive here",
	"(b) pi-review's childEnv in main's form ({ NANA_ROLE: 'reviewer', NANA_REVIEW_ROOT }) is behaviour-equivalent (pi-watchdog sets NANA_HANDOFF=off) and has no pair; M7 drops the shared value instead",
	"(c) piLaunch resolving against process.cwd() rather than --tree is a plan known limit with no test and no pair",
];

const PAIRS = [
	{ n: "M1", name: "review-ledger run spawns its command with the caller's environment unchanged (main's form)", edits: [
		one(RL, SPAWN_ENV, "stdio: ['inherit', 'pipe', 'inherit'] }"),
	], tests: [RLT], expectRed: [R1720] },
	{ n: "M2", name: "the caller's environment wins over the reviewer child env", edits: [
		one(RL, SPAWN_ENV, "stdio: ['inherit', 'pipe', 'inherit'], env: { ...REVIEWER_CHILD_ENV, ...process.env } }"),
	], tests: [RLT], expectRed: [R1720] },
	{ n: "M3", name: "the reviewer child env replaces the caller's environment, PATH included", edits: [
		one(RL, SPAWN_ENV, "stdio: ['inherit', 'pipe', 'inherit'], env: REVIEWER_CHILD_ENV }"),
	], tests: [RLT], expectRed: [R1721] },
	{ n: "M4", name: "a first-word pi resolves through the win32 launcher on every platform", edits: [
		one(RL, "piLaunch(child.slice(1), { cwd: process.cwd() })", "piLaunch(child.slice(1), { cwd: process.cwd(), platform: 'win32' })"),
	], tests: [RLT], expectRed: [R1721] },
	{ n: "M5", name: "every review command goes through the pi launcher, not only a first-word pi", edits: [
		one(RL, "child[0] === PI_BIN_NAME", "true"),
	], tests: [RLT], expectRed: [R1720] },
	{ n: "M6", name: "the sealed reviewer child env sets only NANA_ROLE", edits: [
		one(WC, "export const REVIEWER_CHILD_ENV = Object.freeze({ NANA_ROLE: 'reviewer', NANA_HANDOFF: 'off' });", "export const REVIEWER_CHILD_ENV = Object.freeze({ NANA_ROLE: 'reviewer' });"),
	], tests: [RLT], expectRed: [R1720] },
	{ n: "M7", name: "pi-review's child env drops the shared reviewer env", edits: [
		one(PR, "childEnv: { ...REVIEWER_CHILD_ENV, NANA_REVIEW_ROOT: tempRoot }", "childEnv: { NANA_REVIEW_ROOT: tempRoot }"),
	], tests: [IRT], expectRed: [R974] },
];

process.exitCode = await runMutations({ lane: "review-ledger-run-reviewer", self: import.meta.url, tip: "ac1fbdac", declared: DECLARED, pairs: PAIRS });
