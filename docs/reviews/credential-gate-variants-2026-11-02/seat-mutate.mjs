#!/usr/bin/env node
// Seat wrong-code pairs for lane credential-gate-variants (hook/gate lane), written by the windows sub-seat
// 2026-11-02 after build 1, on the shared runner. Each pair is one of the plan's named wrong versions or one of
// the pi adversary's MUST findings (plan-attack.md). The builder's own runs (wrong-code.mjs) are separate.
// Run from the worktree root:
//   SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=<file> node docs/reviews/credential-gate-variants-2026-11-02/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const GATE_T = "packages/nana-pack/tests/credential-gate.test.mjs";
const GATE_CFG = "packages/nana-pack/lib/credential-gate-config.mjs";
const GATE = "packages/nana-pack/extensions/nana-gate.ts";
const M1 = /^M1: helper read variants are a credential-rule floor/; // R-3685
const M2 = /^M2: helper near misses and unset-role forms stay allowed/; // R-3686
const M7 = /^M7: credential gate pattern seal/; // R-3667
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const PREFIX = String.raw`^git(?:\s+(?:-c|-C|--git-dir|--work-tree|--namespace)\s+\S+|\s+-\S+)*\s+credential-[\w.-]+`;
const DASHED = String.raw`^git-credential-[\w.-]+\s+(?:\S+\s+)*get(?:\s|$)`;

const DECLARED = [
	"(plan) one pair per named wrong version in plan Revision 2 and per adversary MUST",
	"(seal) pattern edits also turn M7 red; each pair must turn M1 or M2 red on its own",
];

const PAIRS = [
	{ n: "V1", name: "plain space join lets quoted values break words (attack MUST 1)", edits: [
		one(GATE, ".map((word) => word.replace(/\\s/g, CREDENTIAL_WORD_PLACEHOLDER)).join(\" \");", ".join(\" \");"),
	], tests: [GATE_T], expectRed: [M1, M2] },
	{ n: "V2", name: "spaced helper rule without the global-option prefix", edits: [
		one(GATE_CFG, PREFIX, String.raw`^git\s+credential-[\w.-]+`),
	], tests: [GATE_T], expectRed: [M1, M7] },
	{ n: "V3", name: "get without a trailing word boundary (attack MUST 2, getx)", edits: [
		one(GATE_CFG, DASHED, String.raw`^git-credential-[\w.-]+\s+(?:\S+\s+)*get`),
	], tests: [GATE_T], expectRed: [M2, M7] },
	{ n: "V4", name: "get as a substring anywhere after the helper (attack MUST 2, --get)", edits: [
		one(GATE_CFG, DASHED, String.raw`^git-credential-[\w.-]+\s+.*get(?:\s|$)`),
	], tests: [GATE_T], expectRed: [M2, M7] },
	{ n: "V5", name: "dashed helper list stays narrow (no cache)", edits: [
		one(GATE_CFG, DASHED, String.raw`^git-credential-(?:manager(?:-core)?|osxkeychain|store|wincred)\s+(?:\S+\s+)*get(?:\s|$)`),
	], tests: [GATE_T], expectRed: [M1, M7] },
	{ n: "V6", name: "helper options before get are not allowed (--timeout 5 get)", edits: [
		one(GATE_CFG, PREFIX + String.raw`\s+(?:\S+\s+)*get(?:\s|$)`, PREFIX + String.raw`\s+get(?:\s|$)`),
	], tests: [GATE_T], expectRed: [M1, M7] },
];

process.exitCode = await runMutations({ lane: "credential-gate-variants", self: import.meta.url, tip: "HEAD", declared: DECLARED, pairs: PAIRS });
