#!/usr/bin/env node
// Seat wrong-code pairs for lane precedent-first (ordinary lane), written by the seat 2026-10-22 after build 2, on the
// shared runner, at tip 14d8c810. They are the must-meet's seat-step pairs: the planner's eleven (p1 to p11), the
// adversary's seven (p12 to p18) and amendment 1's pair (p19). Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/precedent-first-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LIB = "packages/nana-pack/lib/brief-precedent.mjs";
const SCAN = "packages/nana-pack/lib/markdown-list-sections.mjs";
const WORKER = "packages/nana-pack/bin/pi-worker.mjs";
const T = "packages/nana-pack/tests/worker-lane.test.mjs";
const R_2578 = /^R-2578: /; // R-2578
const R_2579 = /^R-2579: /; // R-2579
const R_2580 = /^R-2580: /; // R-2580
const R_2581 = /^R-2581: /; // R-2581
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const PROBLEMS = "const precedentProblems = checkPrecedent(precedent, trackedPaths);";
const KNOWN_FILE = "if (statSync(candidate).isFile()) knownBugPath = candidate;";

const DECLARED = [
	"(plan) p1 to p11 are the planner's eleven: a header-only check; the check after the lock; existsSync in the worktree instead of HEAD; stopping at the first bad entry; the pathspec without --literal-pathspecs; paths resolved from the brief's folder; no backslash, backtick or suffix normalising; an exact Precedent: match with no blank or BOM strip; any feature ID anywhere in the brief; the known-bug file without a regular-file check; the known-bug prompt before the brief",
	"(adversary) p12 to p18 are the adversary's seven: no trailing-punctuation strip; the section ending at the first non-bullet line (no continuation lines); a fenced example taken as the header; the index instead of HEAD; a folder match with no / boundary; a fallback to unplaced.md; a listing failure that passes",
	"(amendment 1) p19: the label section continues past a blank line",
	"(seat) p2 takes the lock before the check; laneFailure releases the lock, so only a check that sees the lock taken can catch it",
];

const PAIRS = [
	{ n: "p1", name: "a header-only check", edits: [
		one(LIB, "if (precedent === null || precedent.length === 0 || precedent.some(", "if (precedent === null || precedent.some("),
	], tests: [T], expectRed: [R_2578] },
	{ n: "p2", name: "the check after the lock", edits: [
		one(WORKER, "\tconst briefCheck = checkBriefForLaunch({", "\tacquireLaneLock(laneGitDir);\n\tconst briefCheck = checkBriefForLaunch({"),
		one(WORKER, "if (laneMode) acquireLaneLock(laneGitDir);", "if (laneMode && !laneLock) acquireLaneLock(laneGitDir);"),
	], tests: [T], expectRed: [R_2578] },
	{ n: "p3", name: "existsSync in the worktree instead of HEAD", edits: [
		one(LIB, PROBLEMS, "const precedentProblems = precedent.filter((entry) => entry.kind === \"invalid-path\" || (entry.kind === \"path\" && !(() => { try { statSync(path.join(worktreeRoot, entry.value)); return true; } catch { return false; } })())).map((entry) => entry.value);"),
	], tests: [T], expectRed: [R_2579] },
	{ n: "p4", name: "stopping at the first bad entry", edits: [
		one(LIB, "\t\t.map((entry) => entry.value);\n}", "\t\t.map((entry) => entry.value).slice(0, 1);\n}"),
	], tests: [T], expectRed: [R_2579] },
	{ n: "p5", name: "the pathspec without --literal-pathspecs", edits: [
		one(LIB, "gitRunner([\"--literal-pathspecs\", \"ls-tree\",", "gitRunner([\"ls-tree\","),
	], tests: [T], expectRed: [R_2579] },
	{ n: "p6", name: "paths resolved from the brief's folder", edits: [
		one(LIB, "const precedentPaths = precedent.filter((entry) => entry.kind === \"path\").map((entry) => entry.value);", "const precedentPaths = precedent.filter((entry) => entry.kind === \"path\").map((entry) => path.posix.join(path.relative(worktreeRoot, path.dirname(briefPath)).split(path.sep).join(\"/\"), entry.value));"),
	], tests: [T], expectRed: [R_2580] },
	{ n: "p7", name: "no backslash, backtick or suffix normalising", edits: [
		one(LIB, "let value = text.split(/\\s+/, 1)[0]?.replaceAll(\"`\", \"\") ?? \"\";", "let value = text.split(/\\s+/, 1)[0] ?? \"\";"),
		one(LIB, "value = value.replace(LINE_SUFFIX, \"\").replaceAll(\"\\\\\", \"/\");", "value = String(value);"),
	], tests: [T], expectRed: [R_2580] },
	{ n: "p8", name: "an exact Precedent: match with no blank or BOM strip", edits: [
		one(SCAN, "lines[index].trim() === label", "lines[index] === label"),
		one(LIB, "const source = text.startsWith(\"\\uFEFF\") ? text.slice(1) : text;", "const source = text;"),
	], tests: [T], expectRed: [R_2580] },
	{ n: "p9", name: "any feature ID anywhere in the brief", edits: [
		one(LIB, "const match = featurePattern.exec(", "const match = /(FEAT-\\d{3})\\b/.exec("),
	], tests: [T], expectRed: [R_2581] },
	{ n: "p10", name: "the known-bug file without a regular-file check", edits: [
		one(LIB, KNOWN_FILE, "if (statSync(candidate)) knownBugPath = candidate;"),
	], tests: [T], expectRed: [R_2581] },
	{ n: "p11", name: "the known-bug prompt before the brief", edits: [
		one(WORKER, "'--append-system-prompt', briefPath, ...(knownBugPath ? ['--append-system-prompt', knownBugPath] : []),", "...(knownBugPath ? ['--append-system-prompt', knownBugPath] : []), '--append-system-prompt', briefPath,"),
	], tests: [T], expectRed: [R_2581] },
	{ n: "p12", name: "no trailing-punctuation strip", edits: [
		one(LIB, "if (value && PRECEDENT_TRAILING_PUNCTUATION.includes(value.at(-1))) value = value.slice(0, -1);", ""),
	], tests: [T], expectRed: [R_2580] },
	{ n: "p13", name: "the section ending at the first non-bullet line", edits: [
		one(SCAN, "while (next < section.end && !/^\\s*$/.test(lines[next])", "while (false && next < section.end && !/^\\s*$/.test(lines[next])"),
	], tests: [T], expectRed: [R_2579] },
	{ n: "p14", name: "a fenced example taken as the header", edits: [
		one(SCAN, "if (outsideFence[index] && lines[index].trim() === label)", "if (lines[index].trim() === label)"),
	], tests: [T], expectRed: [R_2580] },
	{ n: "p15", name: "the index instead of HEAD", edits: [
		one(LIB, "gitRunner([\"--literal-pathspecs\", \"ls-tree\", \"-z\", \"--name-only\", \"HEAD\", \"--\",", "gitRunner([\"--literal-pathspecs\", \"ls-files\", \"-z\", \"--\","),
	], tests: [T], expectRed: [R_2579] },
	{ n: "p16", name: "a folder match with no / boundary", edits: [
		one(LIB, "candidate.startsWith(`${folder}/`)", "candidate.startsWith(folder)"),
	], tests: [T], expectRed: [R_2579] },
	{ n: "p17", name: "a fallback to unplaced.md", edits: [
		one(LIB, "} catch { knownBugRelative = \"none\"; }", "} catch { knownBugRelative = path.posix.join(KNOWN_BUGS_DIR, \"unplaced.md\"); knownBugPath = path.join(worktreeRoot, KNOWN_BUGS_DIR, \"unplaced.md\"); }"),
	], tests: [T], expectRed: [R_2581] },
	{ n: "p18", name: "a listing failure that passes", edits: [
		one(LIB, "} catch { return refusal(`cannot list paths tracked at HEAD ${head}`); }", "} catch { trackedPaths = precedentPaths; }"),
	], tests: [T], expectRed: [R_2579] },
	{ n: "p19", name: "the label section continues past a blank line", edits: [
		one(SCAN, "if (section.kind === \"label\" && entries.length > 0) break;", "if (false) break;"),
	], tests: [T], expectRed: [R_2580] },
];

process.exitCode = await runMutations({ lane: "precedent-first", self: import.meta.url, tip: "14d8c810", declared: DECLARED, pairs: PAIRS });
