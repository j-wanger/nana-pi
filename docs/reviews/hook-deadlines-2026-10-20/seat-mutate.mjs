#!/usr/bin/env node
// Seat wrong-code pairs for lane hook-deadlines (hook lane), written by the seat 2026-10-20 after build 1, on the
// shared runner. M1-M3 revert or break the launcher's producer time limit (must-meet.md Design), M4 removes the
// verifier hook's stderr guard, and M5 pins the unchanged knowledge pull hook with the plan's wrong code
// (must-meet.md R-2015). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/hook-deadlines-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const HD = "packages/nana-setup/tests/hook-deadlines.test.mjs";
const HP = "packages/nana-setup/tests/hook-producers.test.mjs";
const HC = "packages/nana-setup/tests/hooks-closed-output.test.mjs";
const LAUNCHER = "packages/nana-setup/lib/hook-producer.mjs";
const VERIFIER = "packages/nana-setup/claude/hooks/verifier-pipe.mjs";
const KNOWLEDGE = "packages/nana-knowledge/bin/nana-knowledge.ts";
const R2010 = "adoption hook prints its marker and the stale-copy output when the adoption producer hangs";
const R2011 = "adoption hook prints both markers before its installed limit when both producers hang";
const R2012 = "objective hook prints its marker before its installed limit when its producer hangs";
const R2013 = "launcher starts the objective, adoption and stale-copy producers with a 1500 ms time limit";
const R2014 = "verifier hook ignores a closed stderr and exits 0";
const R2015 = "knowledge pull hook ignores a closed stdout and exits 0";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) every pair runs on macOS only; R-2014 and R-2015 have no wrong-code run on Windows (must-meet.md Known limits)",
	"(b) M5 edits a site the lane did not change: the knowledge pull hook is a pin (R-2015), so its pair is the plan's wrong code",
	"(c) no test checks that a producer stopped at the limit leaves no child process behind, so no pair covers it",
];

const PAIRS = [
	{ n: "M1", name: "launcher starts each producer with no time limit (main's form)", edits: [
		one(LAUNCHER, "env, timeout: HOOK_PRODUCER_TIMEOUT_MS });", "env });"),
	], tests: [HD, HP], expectRed: [R2010, R2011, R2012, R2013] },
	{ n: "M2", name: "producer time limit chosen at 3000 ms", edits: [
		one(LAUNCHER, "export const HOOK_PRODUCER_TIMEOUT_MS = 1500;", "export const HOOK_PRODUCER_TIMEOUT_MS = 3000;"),
	], tests: [HD, HP], expectRed: [R2011, R2013] },
	{ n: "M3", name: "launcher prints the partial stdout of a producer stopped at the limit", edits: [
		one(LAUNCHER, "if (result?.status === 0 && !result.signal && !result.error) {", "if ((result?.status === 0 && !result.signal && !result.error) || result?.error?.code === \"ETIMEDOUT\") {"),
	], tests: [HD, HP], expectRed: [R2010, R2011, R2012] },
	{ n: "M4", name: "verifier hook leaves stderr errors unhandled (main's form)", edits: [
		one(VERIFIER, "process.stderr.on(\"error\", () => {});", "// stderr errors are not handled"),
	], tests: [HC], expectRed: [R2014] },
	{ n: "M5", name: "knowledge CLI ends by setting the exit code instead of exiting", edits: [
		one(KNOWLEDGE, "process.exit(code);", "process.exitCode = code;"),
	], tests: [HC], expectRed: [R2015] },
];

process.exitCode = await runMutations({ lane: "hook-deadlines", self: import.meta.url, tip: "fe12b848", declared: DECLARED, pairs: PAIRS });
