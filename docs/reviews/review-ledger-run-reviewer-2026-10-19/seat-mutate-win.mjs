#!/usr/bin/env node
// Seat wrong-code pairs for lane review-ledger-run-reviewer that only the Windows leg can judge: the three
// launch mistakes build brief 1 lists as Windows-only (R-1721, R-1722, R-1723). Written by the seat
// 2026-10-19; run on a scratch CI branch whose Windows job runs this table instead of the suite. Never merged.
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RL = "packages/nana-pack/bin/review-ledger.mjs";
const LT = "packages/nana-pack/tests/review-ledger.test.mjs";
const WL = "packages/nana-pack/tests/win32-launch.test.mjs";
const R1721 = "review-ledger run -- pi starts pi and records its round";
const R1722 = "Windows: review-ledger run -- pi starts the npm-installed pi entry with node and the arguments unchanged";
const R1723 = "Windows: review-ledger run -- pi with a pi.cmd that has no npm package starts nothing and consumes no round";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) Windows leg only: R-1722 and R-1723 skip off Windows, and a by-name spawn of pi works on macOS and Linux",
];

const PAIRS = [
	{ n: "X1", name: "pi is spawned by name, as before the lane", edits: [
		one(RL, "const launch = child[0] === PI_BIN_NAME", "const launch = false"),
	], tests: [LT, WL], expectRed: [R1721, R1722] },
	{ n: "X2", name: "pi is started through cmd.exe instead of its npm entry", edits: [
		one(RL, "  ? piLaunch(child.slice(1), { cwd: process.cwd() })", "  ? { command: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', 'pi', ...child.slice(1)] }"),
	], tests: [WL], expectRed: [R1722] },
	{ n: "X3", name: "a refused pi launch is reported after admission, with no release", edits: [
		one(RL, "if (launch.refused) die(`pi launch refused: ${launch.refused}`);\n", ""),
		one(RL, "if (!adm.ok) die(adm.message);\n", "if (!adm.ok) die(adm.message);\nif (launch.refused) die(`pi launch refused: ${launch.refused}`);\n"),
	], tests: [WL], expectRed: [R1723] },
];

process.exitCode = await runMutations({ lane: "review-ledger-run-reviewer", self: import.meta.url, tip: "ac1fbdac", declared: DECLARED, pairs: PAIRS });
