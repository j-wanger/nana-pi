#!/usr/bin/env node
// Seat wrong-code pairs for lane claude-review-launcher (install, hook or gate lane: a review tool), written by the
// seat 2026-10-22 after build 1, on the shared runner, at tip 158659d5. They are the must-meet's seat-step pairs: the
// planner's nine (p1 to p11; "the standard omitted, doubled or first" and "always exit 0 or drop review-ledger's
// stderr" are two pairs each) and the adversary's eight (p12 to p19). Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/claude-review-launcher-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LAUNCHER = "packages/nana-pack/bin/claude-review.mjs";
const CONFIG = "packages/nana-pack/lib/claude-review-config.mjs";
const WORKER = "packages/nana-pack/bin/worker-config.mjs";
const T = "packages/nana-pack/tests/claude-review.test.mjs";
const T_ROSTER = "packages/nana-pack/tests/nana-roster.test.mjs";
const R_2560 = /^R-2560: /; // R-2560
const R_2561 = /^R-2561: /; // R-2561
const R_2562 = /^R-2562: /; // R-2562
const R_2563 = /^R-2563: /; // R-2563
const R_2565 = /^R-2565: /; // R-2565
const R_2566 = /^R-2566: /; // R-2566
const R_2567 = /^R-2567: /; // R-2567
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const PROMPT = "const prompt = `${brief.text}\\n\\n${STANDARD_HEADING}\\n\\n${standard.text}\\n\\n${renderReviewerSentence(value('--item'), tree)}\\n`;";
const TOOL_TAIL = "CLAUDE_DENY_FLAG, REVIEWER_DENIED_TOOLS);";
const EXIT = "process.exit(status ?? 1);";

const DECLARED = [
	"(plan) p1 to p11 are the planner's nine: a hard-coded --model opus; claude spawned directly, skipping review-ledger; the standard doubled; the standard first; a fallback model for a pi entry; CLAUDE_CODE_SLOTS unchanged; the prompt as an argument; always exit 0; review-ledger's stderr dropped; --over-cap not forwarded; the brief read after admission",
	"(adversary) p12 to p19 are the adversary's eight: standard input never ended; no standard-input error handler; the model read from largerBuilder; --tree not forwarded; the roster's ok unchecked; the read-only clause dropped; an argument after the tool lists; --brief resolved against the working folder",
	"(seat) p7 is the Windows-leg pair; on macOS its red is R-2561, because the prompt leaves standard input; R-2564 runs on Windows only and this table does not judge it",
];

const PAIRS = [
	{ n: "p1", name: "a hard-coded --model opus", edits: [
		one(LAUNCHER, "CLAUDE_MODEL_FLAG, reviewer.model,", "CLAUDE_MODEL_FLAG, 'opus',"),
	], tests: [T], expectRed: [R_2560] },
	{ n: "p2", name: "claude spawned directly, skipping review-ledger", edits: [
		one(LAUNCHER, "const child = spawn(process.execPath, ledgerArgs, {", "const child = spawn(CLAUDE_BIN, ledgerArgs.slice(ledgerArgs.indexOf('--') + 2), { cwd: tree, "),
	], tests: [T], expectRed: [R_2560] },
	{ n: "p3", name: "the standard doubled", edits: [
		one(LAUNCHER, PROMPT, "const prompt = `${brief.text}\\n\\n${STANDARD_HEADING}\\n\\n${standard.text}\\n\\n${standard.text}\\n\\n${renderReviewerSentence(value('--item'), tree)}\\n`;"),
	], tests: [T], expectRed: [R_2561] },
	{ n: "p4", name: "the standard first", edits: [
		one(LAUNCHER, PROMPT, "const prompt = `${STANDARD_HEADING}\\n\\n${standard.text}\\n\\n${brief.text}\\n\\n${renderReviewerSentence(value('--item'), tree)}\\n`;"),
	], tests: [T], expectRed: [R_2561] },
	{ n: "p5", name: "a fallback model for a pi entry", edits: [
		one(LAUNCHER, "if (reviewer?.runtime !== CLAUDE_CODE_RUNTIME) {", "if (!reviewer) {"),
		one(LAUNCHER, "CLAUDE_MODEL_FLAG, reviewer.model,", "CLAUDE_MODEL_FLAG, reviewer.runtime === CLAUDE_CODE_RUNTIME ? reviewer.model : 'sonnet',"),
	], tests: [T], expectRed: [R_2562] },
	{ n: "p6", name: "CLAUDE_CODE_SLOTS unchanged", edits: [
		one(WORKER, "export const CLAUDE_CODE_SLOTS = Object.freeze(['largerBuilder', 'reviewer']);", "export const CLAUDE_CODE_SLOTS = Object.freeze(['largerBuilder']);"),
	], tests: [T, T_ROSTER], expectRed: [R_2560, R_2563] },
	{ n: "p7", name: "the prompt as an argument", edits: [
		one(LAUNCHER, "ledgerArgs.push('--', CLAUDE_BIN, CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG,", "ledgerArgs.push('--', CLAUDE_BIN, CLAUDE_PRINT_FLAG, prompt, CLAUDE_MODEL_FLAG,"),
		one(LAUNCHER, "child.stdin.end(prompt);", "child.stdin.end();"),
	], tests: [T], expectRed: [R_2561] },
	{ n: "p8", name: "always exit 0", edits: [
		one(LAUNCHER, EXIT, "process.exit(0);"),
	], tests: [T], expectRed: [R_2565] },
	{ n: "p9", name: "review-ledger's stderr dropped", edits: [
		one(LAUNCHER, "stdio: ['pipe', 'inherit', 'inherit']", "stdio: ['pipe', 'inherit', 'ignore']"),
	], tests: [T], expectRed: [R_2565] },
	{ n: "p10", name: "--over-cap not forwarded", edits: [
		one(LAUNCHER, "for (const name of OPTIONAL) if (parsed.values.has(name))", "for (const name of OPTIONAL) if (name !== '--over-cap' && parsed.values.has(name))"),
	], tests: [T], expectRed: [R_2566] },
	{ n: "p11", name: "the brief read after admission", edits: [
		one(LAUNCHER, "if (brief.problem) die(brief.problem);", "/* the brief is checked once review-ledger ends */"),
		one(LAUNCHER, EXIT, `if (brief.problem) die(brief.problem);\n${EXIT}`),
	], tests: [T], expectRed: [R_2567] },
	{ n: "p12", name: "standard input never ended", edits: [
		one(LAUNCHER, "child.stdin.end(prompt);", "child.stdin.write(prompt);"),
	], tests: [T], expectRed: [R_2560] },
	{ n: "p13", name: "no standard-input error handler", edits: [
		one(LAUNCHER, "child.stdin.on('error', () => { /* review-ledger may refuse or fail before reading the prompt */ });", ""),
	], tests: [T], expectRed: [R_2565] },
	{ n: "p14", name: "the model read from largerBuilder", edits: [
		one(LAUNCHER, "const reviewer = rosterResult.roster[REVIEW_SLOT];", "const reviewer = rosterResult.roster.largerBuilder;"),
	], tests: [T], expectRed: [R_2560] },
	{ n: "p15", name: "--tree not forwarded", edits: [
		one(LAUNCHER, "'--out', value('--out'), '--tree', tree];", "'--out', value('--out')];"),
	], tests: [T], expectRed: [R_2560] },
	{ n: "p16", name: "the roster's ok unchecked", edits: [
		one(LAUNCHER, "if (!rosterResult.ok) die(", "if (false) die("),
	], tests: [T], expectRed: [R_2562] },
	{ n: "p17", name: "the read-only clause dropped", edits: [
		one(CONFIG, " Work read-only: do not edit files.", ""),
	], tests: [T], expectRed: [R_2561] },
	{ n: "p18", name: "an argument after the tool lists", edits: [
		one(LAUNCHER, TOOL_TAIL, "CLAUDE_DENY_FLAG, REVIEWER_DENIED_TOOLS, '--verbose');"),
	], tests: [T], expectRed: [R_2560] },
	{ n: "p19", name: "--brief resolved against the working folder", edits: [
		one(LAUNCHER, "const briefPath = resolve(tree, value('--brief'));", "const briefPath = resolve(process.cwd(), value('--brief'));"),
	], tests: [T], expectRed: [R_2561] },
];

process.exitCode = await runMutations({ lane: "claude-review-launcher", self: import.meta.url, tip: "158659d5", declared: DECLARED, pairs: PAIRS });
