#!/usr/bin/env node
// Seat wrong-code pairs for lane win-hook-settings-repair (install lane), written by the seat 2026-10-19 on build 1's
// tip after the merge of main (805d225a), on the shared runner. Each pair reverts one product site the lane changed in
// settings.mjs to its main form or to the obvious wrong implementation (must-meet.md design 1-4; the builder's
// wrong-code tries). M10-M13 name no title and run over the related setup files to show whether any check pins them.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-hook-settings-repair-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const S = "packages/nana-setup/lib/settings.mjs";
const T = "packages/nana-setup/tests/win32-hook-repair.test.mjs";
const RELATED = [
	T,
	"packages/nana-setup/tests/win32-degrade.test.mjs",
	"packages/nana-setup/tests/settings-merge.test.mjs",
	"packages/nana-setup/tests/verifier-pipe.test.mjs",
	"packages/nana-setup/tests/stale-copies.test.mjs",
	"packages/nana-setup/tests/uninstall.test.mjs",
	"packages/nana-setup/tests/install.test.mjs",
];
const R1880 = "win32 install: carried shell-form SessionStart entries become exec form in place";
const R1881A = "win32 install: a shell-form verifier under Bash ends as one exec-form verifier under WIN_VERIFIER_MATCHER";
const R1881B = "win32 install: a Bash verifier beside a WIN_VERIFIER_MATCHER verifier ends as one";
const R1882 = "win32 install: the Bash group keeps its matcher and other entries when the verifier moves";
const R1883 = "win32 install: a second install over the repaired home reports all six settings rows unchanged";
const R1884 = "win32 doctor: all six settings rows read ✓ after one install over the carried home";
const R1885 = "win32 install: the first installer's unquoted knowledge entry becomes exec form in place";
const R653 = "win32 install: shell-form look-alikes (timeout, message, quoting, folder) stay byte-identical";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const SHELL_TEST = "if (path.win32.isAbsolute(target) && target.endsWith(`${POSIX_INSTALLER_HOOKS_SUFFIX}${wanted.spec.script}`) && hook.command === `node ${shq(target)}`) {";
const UNQUOTED_TEST = 'if (path.win32.isAbsolute(target) && target.endsWith("/packages/nana-knowledge/bin/nana-knowledge.ts") && hook.command === `NODE_NO_WARNINGS=1 node ${target} hook`) {';
const SCAN_GATE = "if (hook?.timeout !== 5 || !installerTarget(hook, w, platform)) continue;";
const APPEND = "targetGroup.hooks.push({ ...moved, command: w.entry.command, args: w.entry.args });";
const COUNT = "let replaced = movedVerifier;";
const DROP_EMPTY = "if (group.hooks.length === 0) groups.splice(gi, 1);";

const DECLARED = [
	"(a) every pair runs on macOS; the lane's file forces NANA_SETUP_PLATFORM=win32 on every leg, and the native Windows run is CI's Windows leg",
	"(b) M10-M13 name no title and run over the lane file plus win32-degrade, settings-merge, verifier-pipe, stale-copies, uninstall and install: M11 (an emptied Bash group is kept) is the plan's known-limit survivor; M10, M12 and M13 probe lane sites no must-meet check names",
	"(c) no pair for the absolute-path and knowledge-suffix tests of the two new forms: a look-alike that copies nana's status message, timeout, quoting and folder is forgery, outside the threat model",
	"(d) no pair for POSIX_VERIFIER_MATCHER replacing the inline \"Bash\" in desiredHooks, or for reusing an existing verifier-matcher group: neither changes behaviour a check or the review standard names",
];

const PAIRS = [
	{ n: "M1", name: "installerTarget keeps main: no posix-shell form for the five hooks", edits: [
		one(S, "if (win32 && !hasArgs && !isKnowledge) {", "if (false) {"),
	], tests: [T], expectRed: [R1880, R1881A, R1881B, R1882, R1884] },
	{ n: "M2", name: "installerTarget keeps main: no posix-unquoted knowledge form", edits: [
		one(S, "if (win32 && !hasArgs && isKnowledge) {", "if (false) {"),
	], tests: [T], expectRed: [R1885] },
	{ n: "M3", name: "the posix-shell form skips its byte-equal quoting check", edits: [
		one(S, SHELL_TEST, "if (path.win32.isAbsolute(target) && target.endsWith(`${POSIX_INSTALLER_HOOKS_SUFFIX}${wanted.spec.script}`)) {"),
	], tests: [T], expectRed: [R653] },
	{ n: "M4", name: "the posix-shell form accepts any folder that ends in the script", edits: [
		one(S, SHELL_TEST, "if (path.win32.isAbsolute(target) && target.endsWith(`/${wanted.spec.script}`) && hook.command === `node ${shq(target)}`) {"),
	], tests: [T], expectRed: [R653] },
	{ n: "M5", name: "the posix-unquoted form skips its byte-equal check", edits: [
		one(S, UNQUOTED_TEST, 'if (path.win32.isAbsolute(target) && target.endsWith("/packages/nana-knowledge/bin/nana-knowledge.ts")) {'),
	], tests: [T], expectRed: [R653] },
	{ n: "M6", name: "the Bash-group scan drops its timeout gate", edits: [
		one(S, SCAN_GATE, "if (!installerTarget(hook, w, platform)) continue;"),
	], tests: [T], expectRed: [R653] },
	{ n: "M7", name: "the move rewrites the surviving Bash group's matcher", edits: [
		one(S, `${APPEND}\n\t\t\t}\n`, `${APPEND}\n\t\t\t}\n\t\t\tif (movedVerifier) for (const group of groups) if (group?.matcher === POSIX_VERIFIER_MATCHER) group.matcher = WIN_VERIFIER_MATCHER;\n`),
	], tests: [T], expectRed: [R1882] },
	{ n: "M8", name: "the move appends a second verifier beside one already under the verifier matcher", edits: [
		one(S, "if (movedVerifier && !alreadyAtWinMatcher) {", "if (movedVerifier) {"),
	], tests: [T], expectRed: [R1881B] },
	{ n: "M9", name: "a scanned Bash group counts as a repair", edits: [
		one(S, COUNT, "let replaced = movedVerifier || (win32 && w.matcher === WIN_VERIFIER_MATCHER && Array.isArray(groups) && groups.some((group) => group?.matcher === POSIX_VERIFIER_MATCHER));"),
	], tests: [T], expectRed: [R1883] },
	{ n: "M10", name: "the move is not counted as a repair (main's replaced = false)", edits: [
		one(S, COUNT, "let replaced = false;"),
	], tests: RELATED, expectRed: [] },
	{ n: "M11", name: "a Bash group the move empties is kept", edits: [
		one(S, DROP_EMPTY, "if (false) groups.splice(gi, 1);"),
	], tests: RELATED, expectRed: [] },
	{ n: "M12", name: "the moved verifier keeps none of its own keys", edits: [
		one(S, APPEND, "targetGroup.hooks.push({ ...w.entry });"),
	], tests: RELATED, expectRed: [] },
	{ n: "M13", name: "the already-moved test drops its timeout gate", edits: [
		one(S, "group.hooks.some((hook) => hook?.timeout === 5 && installerTarget(hook, w, platform)));", "group.hooks.some((hook) => installerTarget(hook, w, platform)));"),
	], tests: RELATED, expectRed: [] },
];

process.exitCode = await runMutations({ lane: "win-hook-settings-repair", self: import.meta.url, tip: "805d225a", declared: DECLARED, pairs: PAIRS });
