#!/usr/bin/env node
// Seat wrong-code pairs for lane review-ledger-run-win-launch that only the Windows leg can judge: the
// launch mistakes the plan and the macOS table's declared item (a) name as Windows-only (W10, W11 and
// the refusal path). Written by the seat 2026-10-20; run on a scratch CI branch whose Windows job runs
// this table instead of the suite. Never merged.
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RL = "packages/nana-pack/bin/review-ledger.mjs";
const RLAUNCH = "packages/nana-pack/bin/review-launch.mjs";
const LT = "packages/nana-pack/tests/review-launch.test.mjs";
const WL = "packages/nana-pack/tests/win32-launch.test.mjs";
const R2254 = "Windows: review-ledger run starts an npm-style .cmd reviewer found on PATH with its arguments and stdin unchanged and records a round";
const R1722 = "Windows: review-ledger run -- pi starts the npm-installed pi entry with node and the arguments unchanged";
const R1723 = "Windows: review-ledger run -- pi with a pi.cmd that has no npm package starts nothing and consumes no round";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) Windows leg only: R-2254, R-1722 and R-1723 skip off Windows; the macOS table holds every other pair",
];

export const PAIRS = [
	{ n: "W10", name: "the spawn drops launch.options (no verbatim cmd.exe arguments)", edits: [
		one(RL, "{ ...launch.options, cwd: adm.res.cwd,", "{ cwd: adm.res.cwd,"),
	], tests: [LT], expectRed: [R2254] },
	{ n: "W11", name: "review-ledger ignores reviewLaunch and starts every command by name", edits: [
		one(RL, "const launch = reviewLaunch(child);", "const launch = { command: child[0], args: child.slice(1) };"),
	], tests: [LT, WL], expectRed: [R2254, R1722, R1723] },
	{ n: "W11b", name: "review-ledger keeps main's form: pi through piLaunch, every other command by name", edits: [
		one(RL, "import { reviewLaunch } from './review-launch.mjs';", "import { reviewLaunch } from './review-launch.mjs';\nimport { piLaunch } from './pi-watchdog.mjs';"),
		one(RL, "const launch = reviewLaunch(child);", "const launch = child[0] === 'pi' ? piLaunch(child.slice(1), { cwd: process.cwd() }) : { command: child[0], args: child.slice(1) };"),
	], tests: [LT], expectRed: [R2254] },
	{ n: "W12", name: "the resolver drops the `pi launch refused:` prefix", edits: [
		one(RLAUNCH, "{ refused: `pi launch refused: ${launch.refused}` }", "{ refused: launch.refused }"),
	], tests: [WL], expectRed: [R1723] },
	{ n: "W13", name: "a refused launch dies before admission (main's order), writing no --out", edits: [
		one(RL, "const launch = reviewLaunch(child);", "const launch = reviewLaunch(child);\nif (launch.refused) die(launch.refused);"),
	], tests: [WL], expectRed: [R1723] },
];

if (!process.env.SEAT_PAIRS_IMPORT) process.exitCode = await runMutations({ lane: "review-ledger-run-win-launch", self: import.meta.url, tip: "b696bfc8", declared: DECLARED, pairs: PAIRS });
