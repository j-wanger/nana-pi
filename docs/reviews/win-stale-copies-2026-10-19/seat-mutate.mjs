#!/usr/bin/env node
// Seat wrong-code pairs for lane win-stale-copies (install and hook lane), written by the seat 2026-10-19 on the merged
// tip defdeda, on the shared runner. Each pair reverts one product site the lane changed to its main form or to the
// obvious wrong implementation (must-meet.md design; the builder's own wrong-code tries in build 1b). Run from the
// worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-stale-copies-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SC = "packages/nana-setup/tests/stale-copies.test.mjs";
const HOOK = "packages/nana-setup/claude/hooks/nana-adoption.mjs";
const HP = "packages/nana-setup/lib/hook-producer.mjs";
const CLI = "packages/nana-setup/bin/stale-copies.mjs";
const LIB = "packages/nana-setup/lib/stale-copies.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const EXT = "packages/nana-pack/extensions/nana-rulings.ts";
const R1600 = "R-1600: a missing, misdirected or changed rule or skill puts one stale line in the adoption hook output";
const R1601 = "R-1601: a current install adds no stale or unavailable line to the adoption hook output";
const R1602 = "R-1602: the stale line names exactly the rule and skill rows doctor marks failed";
const R1603 = "R-1603: a failed stale-copies checker writes only the unavailable line";
const R1604 = "R-1604: a rulings copy doctor marks failed sets one stale line in its own section";
const R1605 = "R-1605: a rulings copy doctor marks current sets no stale section";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const STALE_SET = "if (stale) (event as any).systemPromptOptions.sections[STALE_SECTION] = staleNotice([`pi ${RULINGS_FILE}`]);";

const DECLARED = [
	"(a) every pair runs on macOS: the POSIX fixtures natively, the win32 fixtures through NANA_SETUP_PLATFORM; the native Windows run is CI's non-blocking Windows leg",
	"(b) no pair reverts doctor.mjs to main's private verbatim linkOk: that revert is equivalent by design; M11 instead lets doctor's check drift from the shared one",
	"(c) no pair for the rulings-text guard in nana-rulings.ts (block.startsWith(RULINGS_HEADING)) or the handlers' catch paths: no must-meet fixture has an unavailable rulings file or a malformed event",
];

const PAIRS = [
	{ n: "M1", name: "the adoption hook keeps main: no stale-copies producer runs", edits: [
		one(HOOK, 'runHookProducer(hookProducerConfig("stale-copies", repo));', ""),
	], tests: [SC], expectRed: [R1600, R1602] },
	{ n: "M2", name: "the stale-copies launcher's marker copies the adoption marker", edits: [
		one(HP, "marker: (cli) => `${STALE_UNAVAILABLE_PREFIX} checker failed (${cli}).\\n`,", "marker: (cli) => `[nana:adoption]\\nADOPTION UNAVAILABLE: reader failed (${cli}).\\n`,"),
	], tests: [SC], expectRed: [R1603] },
	{ n: "M3", name: "the stale-copies launcher names the CLI under the pack's bin, beside the other producers", edits: [
		one(HP, 'cli: "packages/nana-setup/bin/stale-copies.mjs",', 'cli: "packages/nana-pack/bin/stale-copies.mjs",'),
	], tests: [SC], expectRed: [R1600, R1601, R1602] },
	{ n: "M4", name: "the CLI walks no rules", edits: [
		one(CLI, "for (const name of CLAUDE_RULES) {", "for (const name of []) {"),
	], tests: [SC], expectRed: [R1602] },
	{ n: "M5", name: "the CLI walks no skills", edits: [
		one(CLI, "for (const name of CLAUDE_SKILLS) {", "for (const name of []) {"),
	], tests: [SC], expectRed: [R1602] },
	{ n: "M6", name: "the CLI checks the pi-only skills on win32, where install and doctor skip them", edits: [
		one(CLI, 'if (platform() === "win32" && NEW_CLAUDE_SKILLS.includes(name)) continue;', ""),
	], tests: [SC], expectRed: [R1601, R1602] },
	{ n: "M7", name: "linkOk accepts a byte-equal regular file on POSIX too", edits: [
		one(LIB, 'return platform() === "win32" && st.isFile() && fs.readFileSync(target).equals(fs.readFileSync(source));', "return st.isFile() && fs.readFileSync(target).equals(fs.readFileSync(source));"),
	], tests: [SC], expectRed: [R1604] },
	{ n: "M8", name: "linkOk accepts only a link, so no win32 copy is ever current", edits: [
		one(LIB, 'return platform() === "win32" && st.isFile() && fs.readFileSync(target).equals(fs.readFileSync(source));', "return false;"),
	], tests: [SC], expectRed: [R1601, R1605] },
	{ n: "M9", name: "staleNotice renders a line for an empty label list", edits: [
		one(LIB, 'if (!labels.length) return "";', ""),
	], tests: [SC], expectRed: [R1601] },
	{ n: "M10", name: "staleNotice gives the bare PATH command instead of this checkout's install command", edits: [
		one(LIB, 'const command = `node "${path.join(pkgRoot, "bin", "nana-setup.mjs")}" install`;', 'const command = "nana-setup install";'),
	], tests: [SC], expectRed: [R1600, R1604] },
	{ n: "M11", name: "doctor keeps a private byte-only check that drifts from the shared linkOk", edits: [
		one(DR, 'import { linkOk } from "./stale-copies.mjs";', "const linkOk = (target, source) => { try { return fs.readFileSync(target).equals(fs.readFileSync(source)); } catch { return false; } };"),
	], tests: [SC], expectRed: [R1602, R1604] },
	{ n: "M12", name: "the rulings extension keeps main: it never sets the stale section", edits: [
		one(EXT, STALE_SET, ""),
	], tests: [SC], expectRed: [R1604] },
	{ n: "M13", name: "the rulings extension marks every injected rulings text stale", edits: [
		one(EXT, ' && !linkOk(path.join(agentDir, RULINGS_FILE), fileURLToPath(new URL("../rules/nana-rulings.md", import.meta.url)));', ";"),
	], tests: [SC], expectRed: [R1605] },
	{ n: "M14", name: "the rulings extension appends the stale line to the rulings section", edits: [
		one(EXT, STALE_SET, "if (stale) (event as any).systemPromptOptions.sections[RULINGS_SECTION] += `\\n\\n${staleNotice([`pi ${RULINGS_FILE}`])}`;"),
	], tests: [SC], expectRed: [R1604] },
	{ n: "M15", name: "the rulings extension's stale line names the file without doctor's pi label", edits: [
		one(EXT, "staleNotice([`pi ${RULINGS_FILE}`])", "staleNotice([RULINGS_FILE])"),
	], tests: [SC], expectRed: [R1604] },
];

process.exitCode = await runMutations({ lane: "win-stale-copies", self: import.meta.url, tip: "defdeda", declared: DECLARED, pairs: PAIRS });
