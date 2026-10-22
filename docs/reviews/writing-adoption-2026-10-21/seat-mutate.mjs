#!/usr/bin/env node
// Seat wrong-code pairs for lane writing-adoption (install, hook or gate lane), written by the seat 2026-10-21 after
// build 3, on the shared runner (first run at 0671f92e; re-run at 0d52deb0 after build 4 moved the key check to each turn). One or more pairs per row, from the must-meet's named wrong versions and the plan
// adversary's attack. R-2499 runs only on Windows, so it rests on the Windows CI leg and has no pair here. Run from
// the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/writing-adoption-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const WI = "packages/nana-pack/tests/writing-injection.test.mjs";
const WC = "packages/nana-pack/tests/writing-check.test.mjs";
const IN = "packages/nana-setup/tests/install.test.mjs";
const WR = "packages/nana-setup/tests/writing-rule.test.mjs";
const EXT = "packages/nana-pack/extensions/nana-writing.ts";
const CFG = "packages/nana-pack/lib/config.ts";
const FRONTIER = "packages/nana-pack/lib/frontier-config.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const DOCTOR = "packages/nana-setup/lib/doctor.mjs";
const RULE = "packages/nana-pack/rules/nana-writing.md";
const R_2498 = /^nana-writing is linked on PATH, runs by bare name/; // R-2498
const R_2500 = /^enabled: writing\.enabled false in the active agent dir/; // R-2500
const R_006 = /^enabled: a trusted project's writing\.enabled false/; // R-006
const R_2501 = /^cap: a rule cut between the two halves of a surrogate pair/; // R-2501
const R_2502 = /^the rule's Check section is the sealed check text/; // R-2502
const R_2503 = /^this repository's HANDOFF\.md live sections/; // R-2503
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) one or more pairs per row from the must-meet's named wrong versions and the adversary's attack",
	"(plan) R-2499 runs only on Windows; the Windows CI leg is its only evidence, so it has no pair here",
];

const PAIRS = [
	{ n: "P1", name: "the cap cuts UTF-16 units again (no pair-safe head)", edits: [
		one(EXT, "${head(full, keep)}${notice}", "${full.slice(0, keep)}${notice}"),
	], tests: [WI], expectRed: [R_2501] },
	{ n: "P2", name: "the extension ignores writing.enabled", edits: [
		one(EXT, "if (!loadConfig(ctx).writing.enabled) return undefined;", "if (false) return undefined;"),
	], tests: [WI], expectRed: [R_2500] },
	{ n: "P3", name: "a trusted project's writing block is merged in", edits: [
		one(CFG, 'writing: merge("writing", u.writing),', 'writing: merge("writing", u.writing, project.writing),'),
	], tests: [WI], expectRed: [R_006] },
	{ n: "P4", name: "a loose leaf reads \"false\", 0 and null as off", edits: [
		one(CFG, "writing: { enabled: bool },", 'writing: { enabled: (v, w, p) => (v === "false" || v === 0 || v === null ? { ok: true, value: false } : bool(v, w, p)) },'),
	], tests: [WI], expectRed: [R_2500] },
	{ n: "P5", name: "a 27-word sentence lands in Open for Owner", edits: [
		one("HANDOFF.md", "Judge them by use.", "Judge them by use, and say in a later session whether any one of them should change, stay as it is, or go away for good now."),
	], tests: [WC], expectRed: [R_2503] },
	{ n: "P6", name: "a live section is renamed without the name list", edits: [
		one(FRONTIER, 'export const LIVE_SECTION_NAMES = ["Where things stand", "Next", "Open for Owner"];', 'export const LIVE_SECTION_NAMES = ["Where things stand", "Next", "Open for the owner"];'),
	], tests: [WC], expectRed: [R_2503] },
	{ n: "P7", name: "nana-writing left out of the PATH list", edits: [
		one(STEPS, '\t["nana-writing", NANA_WRITING_BIN],\n', ""),
	], tests: [IN], expectRed: [R_2498] },
	{ n: "P8", name: "doctor checks only that the PATH link exists", edits: [
		one(DOCTOR, "add(linkOk(link, source) ? OK : FAIL, `PATH ${name}`", "add(fs.lstatSync(link, { throwIfNoEntry: false }) ? OK : FAIL, `PATH ${name}`"),
	], tests: [IN], expectRed: [R_2498] },
	{ n: "P9", name: "the rule says the run is not required", edits: [
		one(RULE, "You must run it every time.", "It is not required to run it every time."),
	], tests: [WR], expectRed: [R_2502] },
	{ n: "P10", name: "the rule names the old node path again", edits: [
		one(RULE, "run `nana-writing --report` on its text.", "run `node ~/nana-pi/packages/nana-pack/bin/nana-writing.mjs --report` on its text."),
	], tests: [WR], expectRed: [R_2502] },
];

process.exitCode = await runMutations({ lane: "writing-adoption", self: import.meta.url, tip: "0d52deb0", declared: DECLARED, pairs: PAIRS });
