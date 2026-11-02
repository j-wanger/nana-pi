#!/usr/bin/env node
// Seat wrong-code pairs for lane builder-credential-strip (gate lane), written by the windows sub-seat 2026-11-02
// after build 1 (b4dbd82d), on the shared runner. Each pair is one of the plan's named wrong versions or one of the
// pi adversary's MUST findings (plan-attack.md). The builder's own pairs (build-1-pairs.mjs) are separate.
// Run from the worktree root:
//   SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=<file> node docs/reviews/builder-credential-strip-2026-11-02/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const STRIP_T = "packages/nana-pack/tests/credential-strip.test.mjs";
const GATE_T = "packages/nana-pack/tests/credential-gate.test.mjs";
const STRIP = "packages/nana-pack/lib/credential-strip.mjs";
const STRIP_CFG = "packages/nana-pack/lib/credential-strip-config.mjs";
const GATE_CFG = "packages/nana-pack/lib/credential-gate-config.mjs";
const WORKER = "packages/nana-pack/bin/pi-worker.mjs";
const LEDGER = "packages/nana-pack/bin/review-ledger.mjs";
const GATE = "packages/nana-pack/extensions/nana-gate.ts";
const PREAMBLE = "packages/nana-pack/prompts/builder-preamble.md";
const M1 = /^M1: builder children suppress fixture credential dispatch/; // R-3660
const M2 = /^M2: reviewer entry points suppress fixture credential dispatch/; // R-3661
const M4 = /^M4: credential commands form a role-scoped non-exemptible floor/; // R-3663
const M5 = /^M5: shipped builder guidance assigns pushes to the seat/; // R-3664
const M7_STRIP = /^M7: credential strip configuration seal/; // R-3666
const M7_GATE = /^M7: credential gate pattern seal/; // R-3667
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) one or more pairs per must-meet row, from the plan's wrong versions and the adversary's five MUST findings",
	"(attack MUST 5) R-3436/R-3437/R-3665 wording is pinned by literal checks; S8 covers the preamble, the rulings text rests on M6",
];

const PAIRS = [
	{ n: "S1", name: "the reset goes only into the counted form (attack MUST 1)", edits: [
		one(STRIP, "[parameters, ...CREDENTIAL_CONFIG_RESETS.map(([key, value]) => `'${key}=${value}'`)].filter(Boolean).join(' ')", "parameters"),
	], tests: [STRIP_T], expectRed: [M1, M2] },
	{ n: "S2", name: "askpass routes are left alone (attack MUST 2)", edits: [
		one(STRIP_CFG, "GIT_ASKPASS: '', SSH_ASKPASS: '', ", ""),
	], tests: [STRIP_T], expectRed: [M1, M7_STRIP] },
	{ n: "S3", name: "the Claude builder's settings env is not stripped (attack MUST 3)", edits: [
		one(WORKER, "\t\t...credentialStripEnv(process.env),", ""),
	], tests: [STRIP_T], expectRed: [M1] },
	{ n: "S4", name: "a direct review-ledger run is not stripped (attack MUST 4)", edits: [
		one(LEDGER, "...REVIEWER_CHILD_ENV, ...credentialStripEnv(process.env) } });", "...REVIEWER_CHILD_ENV } });"),
	], tests: [STRIP_T], expectRed: [M2] },
	{ n: "S5", name: "the gate floor skips reviewers", edits: [
		one(GATE, "process.env.NANA_ROLE === \"worker\" || process.env.NANA_ROLE === \"reviewer\"", "process.env.NANA_ROLE === \"worker\""),
	], tests: [GATE_T], expectRed: [M4] },
	{ n: "S6", name: "the gate floor also blocks the seat (no role)", edits: [
		one(GATE, "process.env.NANA_ROLE === \"worker\" || process.env.NANA_ROLE === \"reviewer\"", "true"),
	], tests: [GATE_T], expectRed: [M4] },
	{ n: "S7", name: "gh auth token slips past the gate", edits: [
		one(GATE_CFG, "String.raw`^gh\\s+auth\\s+token(?:\\s|$)`,", "String.raw`^gh\\s+auth\\s+tokens(?:\\s|$)`,"),
	], tests: [GATE_T], expectRed: [M4, M7_GATE] },
	{ n: "S8", name: "the preamble tells builders to push again", edits: [
		one(PREAMBLE, "- Do not push; the seat pushes after verifying; report the tip. Do not wait for or read CI.", "- Push your last commit with plain git push and report the tip. Do not wait for or read CI."),
	], tests: [STRIP_T], expectRed: [M5] },
];

process.exitCode = await runMutations({ lane: "builder-credential-strip", self: import.meta.url, tip: "HEAD", declared: DECLARED, pairs: PAIRS });
