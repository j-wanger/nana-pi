#!/usr/bin/env node
// Seat wrong-code pairs for lane knowledge-unreadable-root (install, hook or gate lane: the knowledge build the Claude
// Code UserPromptSubmit hook and pi's before_agent_start start in the background), written by the seat 2026-10-19 on
// the shared runner after build 1 and the merge of main, re-anchored on build 2 (08ba23e3). Each pair reverts one
// product site the lane changed in
// lib/build.ts or bin/nana-knowledge.ts to today's main form or to a wrong form the plan names (must-meet.md,
// "Wrong code on the sketch", W1-W17). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/knowledge-unreadable-root-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const BT = "packages/nana-knowledge/lib/build.ts";
const CLI = "packages/nana-knowledge/bin/nana-knowledge.ts";
const UR = "packages/nana-knowledge/tests/unreadable-root.test.mjs";
const IB = "packages/nana-knowledge/tests/incremental-build.test.mjs";
const TESTS = [UR, IB];

const R1910 = "R-1910: a root that exists but cannot be listed keeps its rows searchable";
const R1911 = "R-1911: a folder that cannot be listed keeps its rows while a file deleted elsewhere under the root is purged";
const R1912 = "R-1912: build names an unlistable root and an unlistable folder UNREADABLE and exits 0";
const R1913 = "R-1913: status marks a root that cannot be listed UNREADABLE, not ok";
const R883 = "R-883: build names a missing root MISSING and status marks it MISS, both exiting 0";
const R1914 = "R-1914: status marks a readable single-file root ok";
const R1915 = "R-1915: rebuild reports that missing and unreadable roots lost their rows";
const IB_DELETED = "deleted file is removed from the index"; // R-207
const IB_DELETED_Q = "deleted body is no longer searchable";
const IB_MISS_NONE = "missing root: nothing is removed"; // R-207
const IB_MISS_KEPT = "missing root: its rows are preserved and still counted";
const IB_MISS_Q = "missing root: its rows are still searchable"; // R-883
const IB_RESTORED = "restored root: nothing re-indexed, nothing removed";
const IB_DROPPED = "root dropped from sources.json: its rows are purged"; // R-207
const IB_DROPPED_Q = "purged rows are no longer searchable";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const LIST_CATCH = "unreadable.push(dir);\n\t\t\tcontinue;";
const PURGE_IF = "if (configuredRoots.has(prev.root) &&";
const UNREADABLE_LINE = "for (const u of s.unreadable) console.log(`  ${u}  UNREADABLE ${skipped}`);";
const MISSING_LINE = "for (const m of s.missingRoots) console.log(`  ${m}  MISSING ${skipped}`);";
const REBUILD_WORDING = 'const skipped = rebuild ? "(skipped; the rebuild dropped its rows)" : "(skipped, rows kept)";';

const DECLARED = [
	"(a) every pair runs on macOS, where chmod 000 lets a folder be stat'd but not listed; the Windows deny-ACL path runs only on the CI Windows leg (must-meet.md, Known limits)",
	"(b) lib/sources.ts changed only by exporting contains; the purge loop's use of it is paired (M9, M10); the export and the module-header lines carry no behaviour and have no pair",
	"(c) M15 pairs the MISSING print, which build 2 changed (the rebuild wording); every pair is a site the lane changed",
	"(d) every pair runs both test files, so a red the pair does not name shows as UNNAMED",
	"(e) M3, M6, M7 and M8 are deleted: build 2 (08ba23e3) made walk return nothing and the caller read no result, so walk's root-level return false (M3), its file-root and listed-root return true (M6, M7) and the caller's if (!walk(...)) continue (M8) are gone",
	"(f) M4 and M5 stay survivors: not reachable in a test (the root stat in walk runs right after existsSync passed; a folder that lists in its parent but cannot be stat'd needs a race)",
];

const PAIRS = [
	// lib/build.ts — walk()
	{ n: "M1", name: "(W1) a root whose listing fails is counted scanned and not recorded (today's main)", edits: [
		one(BT, LIST_CATCH, "if (dir !== root) unreadable.push(dir);\n\t\t\tcontinue;"),
	], tests: TESTS, expectRed: [R1910, R1912, R1915] },
	{ n: "M2", name: "(W2) a folder whose listing fails is not recorded (today's main)", edits: [
		one(BT, LIST_CATCH, "if (dir === root) unreadable.push(dir);\n\t\t\tcontinue;"),
	], tests: TESTS, expectRed: [R1911, R1912] },
	{ n: "M4", name: "a root whose stat fails in walk is counted scanned and not recorded", edits: [
		one(BT, "try { st = fs.statSync(root); } catch { unreadable.push(root); return; }", "try { st = fs.statSync(root); } catch { return; }"),
	], tests: TESTS, expectRed: [R1910, R1912] },
	{ n: "M5", name: "a folder whose stat fails is skipped and not recorded", edits: [
		one(BT, "try { fs.statSync(dir); } catch { unreadable.push(dir); continue; }", "try { fs.statSync(dir); } catch { continue; }"),
	], tests: TESTS, expectRed: [R1911, R1912] },
	// lib/build.ts — the purge loop
	{ n: "M9", name: "the purge loop keeps only unscanned roots' rows, not rows under an unreadable folder (today's main)", edits: [
		one(BT, "(!scannedRoots.has(prev.root) || stats.unreadable.some((u) => contains(u, gone)))", "!scannedRoots.has(prev.root)"),
	], tests: TESTS, expectRed: [R1910, R1911] },
	{ n: "M10", name: "(W3) an unreadable folder keeps every row of its root", edits: [
		one(BT, "contains(u, gone)", "contains(prev.root, u)"),
	], tests: TESTS, expectRed: [R1911] },
	{ n: "M11", name: "(W15) the purge loop purges every unseen row", edits: [
		one(BT, PURGE_IF, "if (false && configuredRoots.has(prev.root) &&"),
	], tests: TESTS, expectRed: [R1910, R1911, IB_MISS_NONE, IB_MISS_Q], alsoRed: [IB_MISS_KEPT, IB_RESTORED] },
	{ n: "M12", name: "(W16) the purge loop never purges", edits: [
		one(BT, PURGE_IF, "if (true || configuredRoots.has(prev.root) &&"),
	], tests: TESTS, expectRed: [R1911, IB_DELETED, IB_DROPPED], alsoRed: [IB_DELETED_Q, IB_DROPPED_Q] },
	{ n: "M13", name: "(W17) the purge loop keeps the rows of a root no longer configured", edits: [
		one(BT, "configuredRoots.has(prev.root) &&", ""),
	], tests: TESTS, expectRed: [IB_DROPPED], alsoRed: [IB_DROPPED_Q] },
	// bin/nana-knowledge.ts — build output and status
	{ n: "M14", name: "(W5) build prints no UNREADABLE line", edits: [
		one(CLI, UNREADABLE_LINE, ""),
	], tests: TESTS, expectRed: [R1912, R1915] },
	{ n: "M15", name: "(W12) build prints no MISSING line", edits: [
		one(CLI, MISSING_LINE, ""),
	], tests: TESTS, expectRed: [R883, R1915] },
	{ n: "M20", name: "(bug B) build --rebuild says the rows it dropped were kept (fd0e7ab5's wording)", edits: [
		one(CLI, REBUILD_WORDING, 'const skipped = "(skipped, rows kept)";'),
	], tests: TESTS, expectRed: [R1915] },
	{ n: "M16", name: "(W6) status marks a root by existence only (today's main)", edits: [
		one(CLI, "${rootStatus(r.path)}", '${fs.existsSync(r.path) ? "ok  " : "MISS"}'),
	], tests: TESTS, expectRed: [R1913] },
	{ n: "M17", name: "status reads a root it cannot open as ok", edits: [
		one(CLI, 'catch { return "UNREADABLE"; }', 'catch { return "ok  "; }'),
	], tests: TESTS, expectRed: [R1913] },
	{ n: "M18", name: "(W13) status reads a root it cannot stat as ok", edits: [
		one(CLI, 'catch { return "MISS"; }', 'catch { return "ok  "; }'),
	], tests: TESTS, expectRed: [R883] },
	{ n: "M19", name: "status opens a file root as a folder", edits: [
		one(CLI, "if (st.isDirectory()) {", "{"),
	], tests: TESTS, expectRed: [R1914] },
];

process.exitCode = await runMutations({ lane: "knowledge-unreadable-root", self: import.meta.url, tip: "08ba23e", declared: DECLARED, pairs: PAIRS });
