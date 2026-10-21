#!/usr/bin/env node
// Seat wrong-code pairs for lane scrub-contracts (gate lane), written by the seat 2026-10-21 after build 3, on the
// shared runner, at tip 0f8de8a0. They are the plan's pairs M1 (one reader left on the old name, here once per reader),
// M4 (a camel split on mixed ids), M5 (a one-sided count check), M6 (a cwd-relative file list) and S2 (no space after
// "Open for"). Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/scrub-contracts-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SCAN = "scripts/identity-scan.mjs";
const SCAN_T = "packages/nana-pack/tests/identity-scan.test.mjs";
const FRONTIER = "packages/nana-pack/bin/nana-frontier.mjs";
const FRONTIER_T = "packages/nana-pack/tests/frontier.test.mjs";
const ASKS = "packages/nana-pack/lib/handoff-asks.mjs";
const REPORT_T = "packages/nana-pack/tests/product-report.test.mjs";
const CONFIG = "packages/nana-pack/lib/frontier-config.mjs";
const R_2511 = /^no tracked file outside the allowlist carries an identity word/; // R-2511
const R_2512 = /^the scan finds identity words in every written form/; // R-2512
const R_2513 = /^an allowlisted file with one more, one fewer or swapped identity words is reported/; // R-2513
const R_2514 = /^an Open for heading with any name is read as the asks section/; // R-2514
const R_2515 = /^an Open for heading with any name gets every live-section check/; // R-2515
const OLD = "Open for someone"; // a stand-in for the old heading; never an identity word
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) M1, M4, M5, M6 and S2 from the plan and its adversary, each expected to turn a named row red on macOS",
	"(seat) M1 runs once per reader of the asks heading: the frontier's misplaced-landed read, its overdue-date read, and the asks split",
	"(seat) S2 is applied in the shared matcher: a prefix compare that drops the trailing space; dropping the space from the prefix literal alone is equivalent, because the matcher's name branch still needs a space, a parenthesis or a dash after the name",
];

const PAIRS = [
	{ n: "m1a", name: "the frontier's misplaced-landed read left on the old heading", edits: [
		one(FRONTIER, '(inSection(i, "next") || inSection(i, OPEN_SECTION_PREFIX)) && /\\bLANDED\\b/i', `(inSection(i, "next") || inSection(i, "${OLD}")) && /\\bLANDED\\b/i`),
	], tests: [FRONTIER_T], expectRed: [R_2515] },
	{ n: "m1b", name: "the frontier's overdue-date read left on the old heading", edits: [
		one(FRONTIER, 'if (inSection(i, "next") || inSection(i, OPEN_SECTION_PREFIX)) {', `if (inSection(i, "next") || inSection(i, "${OLD}")) {`),
	], tests: [FRONTIER_T], expectRed: [R_2515] },
	{ n: "m1c", name: "the asks split left on the old heading", edits: [
		one(ASKS, "headings.filter((heading) => isNamed(heading.title, OPEN_SECTION_PREFIX))", `headings.filter((heading) => isNamed(heading.title, "${OLD}"))`),
	], tests: [REPORT_T, FRONTIER_T], expectRed: [R_2514, R_2515] },
	{ n: "m4", name: "a camel split inside mixed letter-and-digit ids", edits: [
		one(SCAN, "if (!/^[A-Za-z]+$/.test(token)) return [token];", "if (!/^[A-Za-z]+$/.test(token)) return token.split(/[0-9]+/).filter(Boolean).flatMap(camelParts);"),
	], tests: [SCAN_T], expectRed: [R_2512] },
	{ n: "m5", name: "an allowlisted count checked one way only (more, never fewer)", edits: [
		one(SCAN, "} else if (expected && counts[wordIndex] !== expected[wordIndex]) {", "} else if (expected && counts[wordIndex] > expected[wordIndex]) {"),
	], tests: [SCAN_T], expectRed: [R_2513] },
	{ n: "m6", name: "the file list taken from the given folder, not the repo root", edits: [
		one(SCAN, 'return execFileSync("git", ["-C", path.resolve(start), "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();', "return path.resolve(start);"),
	], tests: [SCAN_T], expectRed: [R_2511] },
	{ n: "s2", name: "the asks prefix compared without its trailing space", edits: [
		one(CONFIG, 'if (expected.endsWith(" ")) return actual.startsWith(expected);', 'if (expected.endsWith(" ")) return actual.startsWith(expected.trimEnd());'),
	], tests: [REPORT_T], expectRed: [R_2514] },
];

process.exitCode = await runMutations({ lane: "scrub-contracts", self: import.meta.url, tip: "0f8de8a0", declared: DECLARED, pairs: PAIRS });
