#!/usr/bin/env node
// Seat wrong-code pairs for lane win-hook-rows (install, hook or gate lane), written by the seat 2026-10-19 after
// build 1 (5fa19acd), on the shared runner. Each pair puts one product site the lane changed back to today's main
// form or to the obvious wrong form (must-meet.md, Design 1-4). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-hook-rows-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const WD = "packages/nana-setup/tests/win32-degrade.test.mjs";
const SC = "packages/nana-setup/tests/stale-copies.test.mjs";
const IN = "packages/nana-setup/tests/install.test.mjs";
const IC = "packages/nana-setup/tests/install-check.test.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const HH = "packages/nana-setup/lib/hook-health.mjs";
const DOC = "packages/nana-setup/lib/doctor.mjs";
const STALE = "packages/nana-setup/bin/stale-copies.mjs";
const ICC = "packages/nana-setup/lib/install-check-config.mjs";

const R1860 = "win32 install prints no row labelled with a Claude Code hook script";
const R1861 = "win32 doctor prints no row labelled with a Claude Code hook script";
const DOC_EXIT = "win32 doctor exits 0";
const DOC_NO_X = "win32 doctor prints no ✗";
const R1760 = "R-1760: a missing hook link or hook settings entry puts one stale line in the adoption hook output";
const R1761 = "R-1761: the stale line names exactly the rule, skill and hook rows doctor marks failed";
const R1762 = "R-1762: the stale line names as paths to move exactly the skill paths install refuses";
const R1763 = "R-1763: moving the named paths and running the named install clears the stale line";
const R1764 = "R-1764: a current install adds no stale or unavailable line to the adoption hook output";
const R341_EXIT = "doctor exits 1 on a missing piece";
const R341_MARK = "doctor marks the missing piece with ✗";
const PIN1081 = "pin R-1081: the doctor note list";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const LINK_ROWS_WIN = 'if (platform() === "win32") return [];';
const LINK_SRC = 'const src = path.join(pkgRoot, "claude", "hooks", h);';
const MAIN_LINK_ROWS = [
	one(HH, LINK_ROWS_WIN, 'const win = platform() === "win32";'),
	one(HH, LINK_SRC, `${LINK_SRC}\n\t\tif (win) { rows.push({ label: \`hook \${h}\`, ok: false, skipped: true, detail: "skipped (win32)" }); continue; }`),
];
const DOC_LINK_LINE = "for (const row of hookLinkRows(layout)) add(row.ok ? OK : FAIL, row.label, row.detail);";
const STALE_LINK = "for (const row of hookLinkRows(layout)) {\n\t\tif (!row.ok) labels.push(row.label);";
const STALE_SETTINGS = "for (const row of hookSettingsRows(layout, settings, parseError)) {\n\t\tif (!row.ok) labels.push(row.label);";
const MAIN_NOTES = '"release status", "hook nana-objective.mjs", "hook nana-adoption.mjs", "hook nana-shared-memory.mjs", "hook nana-roster-notice.mjs", "hook verifier-pipe.mjs", "Claude Code hooks floor"';

const DECLARED = [
	"(a) every pair runs on macOS with win32 forced through NANA_SETUP_PLATFORM; the native proof is the Windows suite and install-check legs",
	"(b) the lane's removal of the skipped field from hookSettingsRows and from hookLinkRows' posix rows has no reader left, and doctor's or the producer's main-form reader alone (row.skipped ? NOTE, && !row.skipped) is equivalent on the lane; M3 reverts that chain together to today's main, and M4-M6 key each reader on the removed field instead",
	"(c) the README sentence and test-table cell, the REQUIREMENTS rows and hook-health's @outputs header carry no runtime behaviour and have no pair",
];

const PAIRS = [
	{ n: "M1", name: "stepHooks prints main's five hook skip rows on win32", edits: [
		one(STEPS, "if (win()) return [];", "if (win()) return HOOKS.map((h) => skip(`hook ${h}`));"),
	], tests: [WD], expectRed: [R1860] },
	{ n: "M2", name: "hookLinkRows returns main's five win32 skip rows (ok false) while doctor and the producer read ok only", edits: [
		...MAIN_LINK_ROWS,
	], tests: [WD, SC], expectRed: [R1861, DOC_EXIT, DOC_NO_X, R1764, R1763] },
	{ n: "M3", name: "hookLinkRows, doctor and the producer all back to today's main (skip rows, read as notes, filtered by skipped)", edits: [
		...MAIN_LINK_ROWS,
		one(DOC, DOC_LINK_LINE, "for (const row of hookLinkRows(layout)) add(row.skipped ? NOTE : row.ok ? OK : FAIL, row.label, row.detail);"),
		{ file: STALE, anchor: "if (!row.ok) labels.push(row.label);", replacement: "if (!row.ok && !row.skipped) labels.push(row.label);", times: 2 },
	], tests: [WD, SC], expectRed: [R1861] },
	{ n: "M4", name: "doctor still keys hook-link rows on the removed skipped field, so a missing link reads as a note", edits: [
		one(DOC, DOC_LINK_LINE, "for (const row of hookLinkRows(layout)) add(row.skipped === false ? (row.ok ? OK : FAIL) : NOTE, row.label, row.detail);"),
	], tests: [IN, SC], expectRed: [R341_EXIT, R341_MARK, R1761] },
	{ n: "M5", name: "the producer still keys hook-link rows on the removed skipped field, so it never names a missing hook link", edits: [
		one(STALE, STALE_LINK, "for (const row of hookLinkRows(layout)) {\n\t\tif (!row.ok && row.skipped === false) labels.push(row.label);"),
	], tests: [SC], expectRed: [R1760, R1761, R1762, R1763] },
	{ n: "M6", name: "the producer still keys hook settings rows on the removed skipped field, so it never names a missing settings entry", edits: [
		one(STALE, STALE_SETTINGS, "for (const row of hookSettingsRows(layout, settings, parseError)) {\n\t\tif (!row.ok && row.skipped === false) labels.push(row.label);"),
	], tests: [SC], expectRed: [R1760, R1761, R1762, R1763] },
	{ n: "M7", name: "the win32 doctor note list keeps main's five hook-file labels", edits: [
		one(ICC, '"release status", "Claude Code hooks floor"', MAIN_NOTES),
	], tests: [IC], expectRed: [PIN1081] },
];

process.exitCode = await runMutations({ lane: "win-hook-rows", self: import.meta.url, tip: "5fa19acd", declared: DECLARED, pairs: PAIRS });
