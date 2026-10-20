#!/usr/bin/env node
// Seat wrong-code pairs for lane gate-rm-bare-repo (gate lane), written by the seat 2026-10-20 on the
// merge tip cc81b85a, on the shared runner. Each pair reverts one site of lib/gate-rm-inside.ts that the
// lane changed to main's behaviour (M1) or to an obvious wrong form (build-brief-1.md W1-W17, plan-attack.md
// W13-W16, and the four contract names). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/gate-rm-bare-repo-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RI = "packages/nana-pack/lib/gate-rm-inside.ts";
const T = "packages/nana-pack/tests/gate-rm-inside.test.mjs";
const R1490 = "plain rm -r or -rf of literal paths inside the working directory runs unasked";
const R2240 = "rm of a bare repository or of a path inside one still asks";
const R2241 = "rm in a bare repository's folder or a folder inside it still asks";
const R2242 = "rm in a worktree that git added inside a bare repository's folder still runs unasked";
const R2243 = "rm of or in a folder holding only part of a bare repository's shape still runs unasked";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const GIT_STOP = "if (lstatOrNull(path.join(dir, GIT_ENTRY))) break;";
const WALK_SHAPE = "if (isBareShape(dir)) return false;";
const WALK_HEAD = "for (let dir = cwdReal; ; dir = path.dirname(dir)) {";
const WALK_ROOT = "if (isFsRoot(dir)) break;";
const STEP5 = "if (st.isDirectory() && isBareShape(cur)) return false;";
const SHAPE = "return !!head?.isFile() && !!objects?.isDirectory() && !!refs?.isDirectory();";
const MISSING = 'if (code === "ENOENT" || code === "ENOTDIR") return null;';
const WALK_BLOCK = `\t\tfor (let dir = cwdReal; ; dir = path.dirname(dir)) {\n\t\t\t${GIT_STOP}\n\t\t\t${WALK_SHAPE}\n\t\t\t${WALK_ROOT}\n\t\t}\n`;

const DECLARED = [
	"(a) every pair runs on macOS; the module uses the host path module, so no pair forces a win32 shape — the Windows CI leg is the evidence there",
	"(b) no pair for lstatOrNull returning null on EACCES or another unreadable-entry error (it would ask less on an unreadable level, where the rm itself fails); no must-meet test covers it",
	"(c) equivalent forms with no pair: lstatOrNull rethrowing ENOTDIR (no call site can meet it: every lstatOrNull path's parent is a folder), and step 5 without its isDirectory() guard (a file part's HEAD lstat is ENOTDIR, so isBareShape is false either way)",
	"(d) W12, objects/refs accepted as links, is the plan's declared survivor (it asks more) and has no pair",
];

const PAIRS = [
	{ n: "M1", name: "main's behaviour: no cwd walk and no shape test on target parts", edits: [
		one(RI, WALK_BLOCK, ""),
		one(RI, STEP5, ""),
	], tests: [T], expectRed: [R2240, R2241] },
	{ n: "M2", name: "step 5 drops the shape test on each existing part (W1)", edits: [
		one(RI, STEP5, ""),
	], tests: [T], expectRed: [R2240] },
	{ n: "M3", name: "step 5 tests the shape on the full target only (W7)", edits: [
		one(RI, STEP5, "if (cur === path.join(cwd, ...parts) && st.isDirectory() && isBareShape(cur)) return false;"),
	], tests: [T], expectRed: [R2240] },
	{ n: "M4", name: "step 5 tests the shape on the first part only (W15)", edits: [
		one(RI, STEP5, "if (cur === path.join(cwd, parts[0]) && st.isDirectory() && isBareShape(cur)) return false;"),
	], tests: [T], expectRed: [R2240] },
	{ n: "M5", name: "the cwd walk drops the shape test (W2)", edits: [
		one(RI, WALK_SHAPE, ""),
	], tests: [T], expectRed: [R2241] },
	{ n: "M6", name: "the cwd walk tests the cwd only, never a folder above it (W8)", edits: [
		one(RI, WALK_ROOT, "break;"),
	], tests: [T], expectRed: [R2241] },
	{ n: "M7", name: "the cwd walk is capped at two levels (W14)", edits: [
		one(RI, WALK_HEAD, "for (let dir = cwdReal, level = 0; level < 2; dir = path.dirname(dir), level++) {"),
	], tests: [T], expectRed: [R2241] },
	{ n: "M8", name: "the cwd walk ignores a .git entry (W3)", edits: [
		one(RI, GIT_STOP, ""),
	], tests: [T], expectRed: [R2242] },
	{ n: "M9", name: "the cwd walk stops at .git only when it is a folder (W17)", edits: [
		one(RI, GIT_STOP, "if (lstatOrNull(path.join(dir, GIT_ENTRY))?.isDirectory()) break;"),
	], tests: [T], expectRed: [R2242] },
	{ n: "M10", name: "the cwd walk looks for .git at the cwd only (W4)", edits: [
		one(RI, GIT_STOP, "if (dir === cwdReal && lstatOrNull(path.join(dir, GIT_ENTRY))) break;"),
	], tests: [T], expectRed: [R2242] },
	{ n: "M11", name: "the cwd walk tests the shape before .git at each level (W13)", edits: [
		one(RI, `${GIT_STOP}\n\t\t\t${WALK_SHAPE}`, `${WALK_SHAPE}\n\t\t\t${GIT_STOP}`),
	], tests: [T], expectRed: [R2242] },
	{ n: "M12", name: "the cwd walk tests a HEAD file alone (W16)", edits: [
		one(RI, WALK_SHAPE, "if (lstatOrNull(path.join(dir, BARE_HEAD))?.isFile()) return false;"),
	], tests: [T], expectRed: [R2243] },
	{ n: "M13", name: "isBareShape accepts a HEAD of any type (W9)", edits: [
		one(RI, SHAPE, "return !!head && !!objects?.isDirectory() && !!refs?.isDirectory();"),
	], tests: [T], expectRed: [R2243] },
	{ n: "M14", name: "isBareShape needs objects or refs, not both (W5)", edits: [
		one(RI, SHAPE, "return !!head?.isFile() && (!!objects?.isDirectory() || !!refs?.isDirectory());"),
	], tests: [T], expectRed: [R2243] },
	{ n: "M15", name: "isBareShape drops the HEAD test (W12a)", edits: [
		one(RI, SHAPE, "return !!objects?.isDirectory() && !!refs?.isDirectory();"),
	], tests: [T], expectRed: [R2243] },
	{ n: "M16", name: "isBareShape drops the objects test (W11)", edits: [
		one(RI, SHAPE, "return !!head?.isFile() && !!refs?.isDirectory();"),
	], tests: [T], expectRed: [R2243] },
	{ n: "M17", name: "isBareShape drops the refs test (W10)", edits: [
		one(RI, SHAPE, "return !!head?.isFile() && !!objects?.isDirectory();"),
	], tests: [T], expectRed: [R2243] },
	{ n: "M18", name: "lstatOrNull rethrows a missing entry, as a bare lstatSync does", edits: [
		one(RI, MISSING, ""),
	], tests: [T], expectRed: [R1490, R2242, R2243] },
	{ n: "M19", name: "the contract name for HEAD names another git file", edits: [
		one(RI, 'const BARE_HEAD = "HEAD";', 'const BARE_HEAD = "ORIG_HEAD";'),
	], tests: [T], expectRed: [R2240, R2241] },
	{ n: "M20", name: "the contract name for objects is singular", edits: [
		one(RI, 'const BARE_OBJECTS = "objects";', 'const BARE_OBJECTS = "object";'),
	], tests: [T], expectRed: [R2240, R2241] },
	{ n: "M21", name: "the contract name for refs is singular", edits: [
		one(RI, 'const BARE_REFS = "refs";', 'const BARE_REFS = "ref";'),
	], tests: [T], expectRed: [R2240, R2241] },
	{ n: "M22", name: "the contract name for the .git entry drops its dot", edits: [
		one(RI, 'const GIT_ENTRY = ".git";', 'const GIT_ENTRY = "git";'),
	], tests: [T], expectRed: [R2242] },
];

process.exitCode = await runMutations({ lane: "gate-rm-bare-repo", self: import.meta.url, tip: "cc81b85a", declared: DECLARED, pairs: PAIRS });
