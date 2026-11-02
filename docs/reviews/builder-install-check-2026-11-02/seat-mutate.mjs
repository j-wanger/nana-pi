#!/usr/bin/env node
// Seat wrong-code pairs for lane builder-install-check (install lane), written by the windows sub-seat
// 2026-11-02 after build 1, on the shared runner. Each pair is one of the plan's named wrong versions.
// Run from the worktree root:
//   SEAT_MUTATE_SHARDS=1 SEAT_MUTATE_OUT=<file> node docs/reviews/builder-install-check-2026-11-02/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CFG = "packages/nana-setup/lib/install-check-config.mjs";
const WORKER_CFG = "packages/nana-pack/bin/worker-config.mjs";
const T = "packages/nana-setup/tests/install-check-builder-env.test.mjs";
const M1 = /^builder boundary is removed in every key casing/; // R-3713
const M2 = /^sanitized builder fixture passes real gate post-edit and judge/; // R-3714
const M3 = /^every shared builder and credential addition has a sealed decision/; // R-3715
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = ["(plan) seat checks: drop the new override, drop a kept-list entry; plus an unclassified launcher variable"];

const PAIRS = [
	{ n: "B1", name: "the sandbox keeps the caller's lane boundary", edits: [
		one(CFG, ', "NANA_HANDOFF", "NANA_WORKTREE_ROOT"];', ', "NANA_HANDOFF"];'),
	], tests: [T], expectRed: [M1, M2] },
	{ n: "B2", name: "a kept credential control loses its decision", edits: [
		one(CFG, "'GIT_TERMINAL_PROMPT', 'GCM_INTERACTIVE',", "'GIT_TERMINAL_PROMPT',"),
	], tests: [T], expectRed: [M3] },
	{ n: "B3", name: "pi-worker gains a builder variable nobody classified", edits: [
		one(WORKER_CFG, "} : { NANA_WORKTREE_ROOT: cwd, NANA_ROLE: 'worker' });", "} : { NANA_WORKTREE_ROOT: cwd, NANA_ROLE: 'worker', NANA_SEAT_PROBE: '1' });"),
	], tests: [T], expectRed: [M3] },
];

process.exitCode = await runMutations({ lane: "builder-install-check", self: import.meta.url, tip: "HEAD", declared: DECLARED, pairs: PAIRS });
