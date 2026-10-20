#!/usr/bin/env node
// Seat wrong-code pairs for lane post-edit-timeout-name (hook lane), written by the seat 2026-10-20 on build 1
// (tip eba75dca), on the shared runner. Each pair reverts one product site the lane changed to its pre-lane form
// or an obvious wrong form: the default expression in extensions/nana-post-edit.ts (W1-W3, W5-W7, must-meet.md),
// the config module's sealed value (W4), and the import of the name (W8, a local shadow copy). Run from the
// worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/post-edit-timeout-name-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const EXT = "packages/nana-pack/extensions/nana-post-edit.ts";
const CFG = "packages/nana-pack/lib/post-edit-config.mjs";
const DT = "packages/nana-pack/tests/post-edit-default-timeout.test.mjs";
const PS = "packages/nana-pack/tests/post-edit-status.test.mjs";
const R2150 = "a post-edit command with no timeoutMs arms its deadline at the pack's named default, retuned in a copy";
const R2151 = "seal: POST_EDIT_DEFAULT_TIMEOUT_MS is 30000";
const R1702 = "timeoutMs 0 arms no deadline and a slow check passes";
const C_FED = "c: timed-out check is fed back and classified as not completed";
const C_CHIP = "c: timeout chip says timeout";
const C_NOTOK = "c: timeout is never shown as ✓";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const DEFAULT_EXPR = "const timeoutMs = c.timeoutMs ?? POST_EDIT_DEFAULT_TIMEOUT_MS;";

const DECLARED = [
	"(a) W5 and W7 are caught by the existing rows R-1702 and R-095 in post-edit-status, not by this lane's rows; they guard the expression's operand order and nullish form",
	"(b) each pair runs only the file holding its named titles; the plan records that the other post-edit files stay green under W3",
];

const PAIRS = [
	{ n: "W1", name: "the default is the inline literal again, import kept (main's form)", edits: [
		one(EXT, DEFAULT_EXPR, "const timeoutMs = c.timeoutMs ?? 30_000;"),
	], tests: [DT], expectRed: [R2150] },
	{ n: "W2", name: "no default: a command without timeoutMs takes undefined", edits: [
		one(EXT, DEFAULT_EXPR, "const timeoutMs = c.timeoutMs;"),
	], tests: [DT], expectRed: [R2150] },
	{ n: "W3", name: "the default is 0, so a command without timeoutMs arms no deadline", edits: [
		one(EXT, DEFAULT_EXPR, "const timeoutMs = c.timeoutMs ?? 0;"),
	], tests: [DT], expectRed: [R2150] },
	{ n: "W4", name: "the config module's sealed value is retuned to 20000", edits: [
		one(CFG, "export const POST_EDIT_DEFAULT_TIMEOUT_MS = 30_000;", "export const POST_EDIT_DEFAULT_TIMEOUT_MS = 20_000;"),
	], tests: [DT], expectRed: [R2151] },
	{ n: "W5", name: "the operands are swapped, so the default overrides a configured timeoutMs", edits: [
		one(EXT, DEFAULT_EXPR, "const timeoutMs = POST_EDIT_DEFAULT_TIMEOUT_MS ?? c.timeoutMs;"),
	], tests: [PS], expectRed: [R1702, C_FED, C_CHIP, C_NOTOK] },
	{ n: "W6", name: "the default is read in seconds, not milliseconds", edits: [
		one(EXT, DEFAULT_EXPR, "const timeoutMs = c.timeoutMs ?? POST_EDIT_DEFAULT_TIMEOUT_MS / 1000;"),
	], tests: [DT], expectRed: [R2150] },
	{ n: "W7", name: "|| replaces ??, so timeoutMs 0 takes the default", edits: [
		one(EXT, DEFAULT_EXPR, "const timeoutMs = c.timeoutMs || POST_EDIT_DEFAULT_TIMEOUT_MS;"),
	], tests: [PS], expectRed: [R1702] },
	{ n: "W8", name: "the extension declares its own copy of the name instead of importing it", edits: [
		one(EXT, 'import { POST_EDIT_DEFAULT_TIMEOUT_MS } from "../lib/post-edit-config.mjs";', "const POST_EDIT_DEFAULT_TIMEOUT_MS = 30_000;"),
	], tests: [DT], expectRed: [R2150] },
];

process.exitCode = await runMutations({ lane: "post-edit-timeout-name", self: import.meta.url, tip: "eba75dca", declared: DECLARED, pairs: PAIRS });
