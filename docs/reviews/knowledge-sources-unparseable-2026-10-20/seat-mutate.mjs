#!/usr/bin/env node
// Seat wrong-code pairs for lane knowledge-sources-unparseable (install, hook or gate lane: the knowledge CLI that the
// Claude Code UserPromptSubmit hook runs and pi's extension spawns, and the build both start in the background),
// written by the seat 2026-10-20 after build 1 (51d65cf8), on the shared runner. Each pair puts one product site the
// lane changed in lib/sources.ts, lib/build.ts or bin/nana-knowledge.ts into main's form or into an obvious wrong
// implementation (build brief W1-W11 in each name where one applies). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/knowledge-sources-unparseable-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-knowledge/tests/sources-file.test.mjs";
const DISCOVERY = "packages/nana-knowledge/tests/discovery.test.mjs";
const SRC = "packages/nana-knowledge/lib/sources.ts";
const BT = "packages/nana-knowledge/lib/build.ts";
const CLI = "packages/nana-knowledge/bin/nana-knowledge.ts";

const R2370 = "R-2370: a sources.json with a UTF-8, UTF-16LE or UTF-16BE byte-order mark indexes its root like its plain UTF-8 twin";
const R2371 = "R-2371: a sources.json that does not parse, including an empty one, removes no row and a later query still hits";
const R2372 = "R-2372: build names an unparseable sources.json with its place and repair and exits 0";
const R2373 = "R-2373: status marks a sources.json that does not parse UNPARSEABLE and exits 0";
const R2374 = "R-2374: a rebuild with a sources.json that does not parse keeps the index searchable";
const R2375 = "R-2375: a sources.json that exists but cannot be read keeps every row and is named UNREADABLE";
const R2376 = "R-2376: a sources.json that parses with no roots and no discover block still purges every row";
const SEED_DISCOVER = "a freshly seeded sources.json carries the discover block";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const PARSE = "raw = parseJsonBytes(bytes);";
const READ_CATCH = 'return { roots: [], exclude: [], problem: { kind: "unreadable" } };';
const PARSE_CATCH = 'return { roots: [], exclude: [], problem: { kind: "unparseable", ...jsonParseFailure(err) } };';
const PLACE_GUARD = "const place = Number.isInteger(problem.line) && Number.isInteger(problem.column)";
const PLACE_TEXT = "? ` at line ${problem.line}, column ${problem.column}`";
const ADVICE = 'const advice = problem.repair === "forward-slash" ? FORWARD_SLASH_ADVICE : MANUAL_JSON_ADVICE;';
const KEEP_ROWS = "if (problem || (configuredRoots.has(prev.root) &&";
const BUILD_MARKER = "if (s.problem) console.log(`  ${paths.sources}  ${formatSourcesProblem(s.problem)}`);";

const DECLARED = [
	"(a) every pair runs on macOS; the unreadable stand-in is a folder at the sources.json path, which errors on read on every platform (must-meet.md)",
	"(b) no pair: the json-text import, the SourcesProblem type and the Sources.problem field (interface only; a reverted import fails the load, not a check); the three module headers; the meta-row refresh under a problem (no must-meet row pins it)",
	"(c) S4 (W8) runs discovery.test.mjs, where the seed checks live; under W8 no seed file is written, so that file throws reading it before its first seed check prints, and the named title reads NOT REACHED with a crash, which is the red",
	"(d) status UNREADABLE is unpinned by design (must-meet.md, Known limits), so no pair breaks status for an unreadable file alone",
];

const PAIRS = [
	// lib/sources.ts — reading and decoding
	{ n: "S1", name: "main's read: plain JSON.parse of the bytes as UTF-8, no mark or UTF-16 decoding", edits: [
		one(SRC, PARSE, 'raw = JSON.parse(bytes.toString("utf8"));'),
	], tests: [T], expectRed: [R2370] },
	{ n: "S2", name: "(W1) strip only a leading U+FEFF, with no UTF-16 decoding", edits: [
		one(SRC, PARSE, String.raw`raw = JSON.parse(bytes.toString("utf8").replace(/^﻿/, ""));`),
	], tests: [T], expectRed: [R2370] },
	{ n: "S3", name: "(W6) main's read error: any error but ENOENT returns no roots and no problem", edits: [
		one(SRC, READ_CATCH, "return { roots: [], exclude: [] };"),
	], tests: [T], expectRed: [R2375] },
	{ n: "S4", name: "(W8) a missing sources.json is treated as unreadable, so it is never seeded", edits: [
		one(SRC, 'if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") {', "if (true) {"),
	], tests: [DISCOVERY], expectRed: [SEED_DISCOVER] },
	{ n: "S5", name: "(W10) a zero-byte sources.json is treated as missing and re-seeded", edits: [
		one(SRC, "bytes = fs.readFileSync(file);", 'bytes = fs.readFileSync(file);\n\t\tif (bytes.length === 0) throw Object.assign(new Error("empty"), { code: "ENOENT" });'),
	], tests: [T], expectRed: [R2371] },
	{ n: "S6", name: "main's parse error: a file that does not parse returns no roots and no problem", edits: [
		one(SRC, PARSE_CATCH, "return { roots: [], exclude: [] };"),
	], tests: [T], expectRed: [R2371, R2372, R2373, R2374] },

	// lib/sources.ts — the marker formatter and its contract words
	{ n: "S7", name: "(W4) the parser's message is printed in place of the line and column", edits: [
		one(SRC, PARSE_CATCH, 'return { roots: [], exclude: [], problem: { kind: "unparseable", ...jsonParseFailure(err), message: String((err as Error)?.message) } };'),
		one(SRC, PLACE_TEXT, "? ` ${(problem as { message?: string }).message}`"),
	], tests: [T], expectRed: [R2372, R2373] },
	{ n: "S8", name: "(W5) the forward-slash repair is always given", edits: [
		one(SRC, ADVICE, "const advice = FORWARD_SLASH_ADVICE;"),
	], tests: [T], expectRed: [R2372] },
	{ n: "S9", name: "the manual JSON repair is always given", edits: [
		one(SRC, ADVICE, "const advice = MANUAL_JSON_ADVICE;"),
	], tests: [T], expectRed: [R2372, R2373] },
	{ n: "S10", name: "(W11) the place is dropped when the repair is manual", edits: [
		one(SRC, PLACE_GUARD, 'const place = problem.repair === "forward-slash" && Number.isInteger(problem.line) && Number.isInteger(problem.column)'),
	], tests: [T], expectRed: [R2372] },
	{ n: "S11", name: "the place is never printed", edits: [
		one(SRC, PLACE_TEXT, '? ""'),
	], tests: [T], expectRed: [R2372, R2373] },
	{ n: "S12", name: "the place is printed even when the parser reports none", edits: [
		one(SRC, PLACE_GUARD, "const place = true"),
	], tests: [T], expectRed: [R2372] },
	{ n: "S13", name: "the UNREADABLE marker drops its rows-kept words", edits: [
		one(SRC, "return `${UNREADABLE_MARKER} (no roots read, rows kept)`;", "return UNREADABLE_MARKER;"),
	], tests: [T], expectRed: [R2375] },
	{ n: "S14", name: "the UNPARSEABLE marker drops its rows-kept words", edits: [
		one(SRC, "return `${UNPARSEABLE_MARKER}${place} (no roots read, rows kept). ${advice}`;", "return `${UNPARSEABLE_MARKER}${place}. ${advice}`;"),
	], tests: [T], expectRed: [R2372, R2373] },
	{ n: "S15", name: "the UNPARSEABLE contract word is retuned", edits: [
		one(SRC, 'const UNPARSEABLE_MARKER = "UNPARSEABLE";', 'const UNPARSEABLE_MARKER = "UNPARSABLE";'),
	], tests: [T], expectRed: [R2372, R2373] },
	{ n: "S16", name: "the UNREADABLE contract word is retuned", edits: [
		one(SRC, 'const UNREADABLE_MARKER = "UNREADABLE";', 'const UNREADABLE_MARKER = "UNREAD";'),
	], tests: [T], expectRed: [R2375] },

	// lib/build.ts
	{ n: "B1", name: "main's build: the build ignores the sources problem", edits: [
		one(BT, "const { roots, exclude, problem } = loadSources();", "const { roots, exclude } = loadSources();\n\tconst problem = undefined;"),
	], tests: [T], expectRed: [R2371, R2372, R2374, R2375] },
	{ n: "B2", name: "(W3) a rebuild deletes the index even with a sources problem (main)", edits: [
		one(BT, "if (opts.rebuild && !problem) {", "if (opts.rebuild) {"),
	], tests: [T], expectRed: [R2374] },
	{ n: "B3", name: "the purge keeps no row for a sources problem (main)", edits: [
		one(BT, KEEP_ROWS, "if (false || (configuredRoots.has(prev.root) &&"),
	], tests: [T], expectRed: [R2371, R2374, R2375] },
	{ n: "B4", name: "(W2) the purge keeps every row when the root list is empty", edits: [
		one(BT, KEEP_ROWS, "if (roots.length === 0 || (configuredRoots.has(prev.root) &&"),
	], tests: [T], expectRed: [R2376] },
	{ n: "B5", name: "BuildStats does not carry the sources problem", edits: [
		one(BT, "skippedLarge: 0, missingRoots: [], unreadable: [], problem, ms: 0, dbBytes: 0,", "skippedLarge: 0, missingRoots: [], unreadable: [], ms: 0, dbBytes: 0,"),
	], tests: [T], expectRed: [R2372, R2375] },

	// bin/nana-knowledge.ts
	{ n: "C1", name: "build prints no sources marker line (main)", edits: [
		one(CLI, BUILD_MARKER, "void formatSourcesProblem;"),
	], tests: [T], expectRed: [R2372, R2375] },
	{ n: "C2", name: "(W9) build prints the sources marker on stderr", edits: [
		one(CLI, BUILD_MARKER, "if (s.problem) console.error(`  ${paths.sources}  ${formatSourcesProblem(s.problem)}`);"),
	], tests: [T], expectRed: [R2372, R2375] },
	{ n: "C3", name: "(W7) status reads only the roots and prints the bare sources line (main)", edits: [
		one(CLI, "const { roots, problem } = loadSources();", "const roots = loadSources().roots;"),
		one(CLI, 'console.log(`sources ${paths.sources}${problem ? `  ${formatSourcesProblem(problem)}` : ""}`);', "console.log(`sources ${paths.sources}`);"),
	], tests: [T], expectRed: [R2373] },
];

process.exitCode = await runMutations({ lane: "knowledge-sources-unparseable", self: import.meta.url, tip: "51d65cf8", declared: DECLARED, pairs: PAIRS });
