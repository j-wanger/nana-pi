#!/usr/bin/env node
// Seat wrong-code pairs for lane knowledge-index-recover (hook lane), written by the seat 2026-10-20 after build 1, on the
// shared runner. Each pair puts one product site the lane changed into its wrong form: the D pairs break the damage
// classifier and the quick check in lib/db.ts, the B pairs revert build()'s recovery and buildLocked's check in
// lib/build.ts toward main or the obvious wrong implementation, and the C pairs break the build and status lines in
// bin/nana-knowledge.ts. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/knowledge-index-recover-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-knowledge/tests/recover.test.mjs";
const SF = "packages/nana-knowledge/tests/sources-file.test.mjs";
const DB = "packages/nana-knowledge/lib/db.ts";
const BUILD = "packages/nana-knowledge/lib/build.ts";
const BIN = "packages/nana-knowledge/bin/nana-knowledge.ts";
const R2400 = "R-2400: a build over a random-bytes, a half-truncated or a page-overwritten index.db resolves and a query then hits";
const R2401 = "R-2401: a build over a SQLite file whose docs or files table lacks a used column resolves and a query then hits";
const R2402 = "R-2402: a pull over a page-overwritten index older than one hour starts a build that heals it, and a later pull hits";
const R2403 = "R-2403: a build over a write-locked index fails and a fresh handle still reads the committed sentinel";
const R2404 = "R-2404: a build that loses the build lock leaves a damaged index.db byte for byte";
const R2405 = "R-2405: status on a random-bytes, half-truncated or page-overwritten index exits 0 with one line naming the damage and build --rebuild, no stack";
const R2406 = "R-2406: build on a random-bytes, half-truncated or page-overwritten index exits 0 with one line naming the damage, no stack";
const R2407 = "R-2407: build and build --rebuild with an unparseable sources.json over a random-bytes, half-truncated or page-overwritten index exit 0, keep index.db byte for byte and print one line naming the damage as not rebuilt";
const R2371 = "R-2371: a sources.json that does not parse, including an empty one, removes no row and a later query still hits";
const R2372 = "R-2372: build names an unparseable sources.json with its place and repair and exits 0";
const R2374 = "R-2374: a rebuild with a sources.json that does not parse keeps the index searchable";
const R2375 = "R-2375: a sources.json that exists but cannot be read keeps every row and is named UNREADABLE";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const CODES = "export const DAMAGE_CODES = new Set([1, 11, 26]);";
const BUILD_CHECK = "\t\tcheckIndex(db);\n\t\treturn buildOpen(db, sources, t0);";
const LOCK = "\tif (!acquireBuildLock()) throw new BuildLockedError();\n\tconst started = Date.now();";
const PRE_LOCK = [
	"\tif (fs.existsSync(paths.db)) {",
	"\t\ttry { const pre = await openDb(paths.db, {}); try { checkIndex(pre); } finally { pre.close(); } }",
	"\t\tcatch (err) { if (indexDamage(err)) for (const suffix of [\"\", \"-wal\", \"-shm\"]) fs.rmSync(paths.db + suffix, { force: true }); }",
	"\t}",
	"",
].join("\n");
const KEPT_EXIT = "formatSourcesProblem(s.problem)}`);\n\t\t\treturn 0;";
const STATUS_EXIT = "— repair: nana-knowledge build --rebuild`);\n\t\treturn 0;";

const DECLARED = [
	"(a) every pair runs on macOS; the seat probed each one first on a scratch copy of de48bcdb. Pairs that touch the sources-problem path also run sources-file.test.mjs",
	"(b) no pair, Windows only: the close in openDb's catch and the close in buildLocked's finally. On a scratch copy each wrong form is GREEN on macOS across all seven knowledge test files (recover, sources-file, incremental-build, unreadable-root, discovery, hook, extension), because POSIX deletes a file that is still open; only the Windows CI leg can turn R-2400 red for them",
	"(c) no pair: indexDamage's `& 0xff` mask (node:sqlite reports extended codes, a UNIQUE violation reads 2067, but no fixture throws an extended damage code, so dropping the mask is GREEN); `if (opts.rebuild) throw err` in build()'s catch (only a failed delete reaches it; dropping it is GREEN); the recovered MISSING/UNREADABLE wording (the plan's known limit; GREEN); the kept branch's return before the totals lines; problemStats' keptDamage field (C1 reaches the line it feeds); header tags",
	"(d) no pair for the kept path's read-only open `{ create: !problem, readonly: !!problem }`: main's `{ create: true }` there is GREEN across all seven files, because on macOS the read-write open, the schema's IF NOT EXISTS statements and the zero-frame WAL close write no byte to index.db, so R-2407's hash cannot tell the two opens apart",
	"(e) B7 is expected to survive: no check builds with an unparseable sources.json and no index.db. R-2372's row covers that case, but its test always builds over an existing index. Without the branch the build exits 1 with node:sqlite's stack (probed on the scratch copy)",
];

const PAIRS = [
	// lib/db.ts: the damage classifier and the quick check
	{ n: "D1", name: "DAMAGE_CODES drops SQLite code 11 (CORRUPT)", edits: [
		one(DB, CODES, "export const DAMAGE_CODES = new Set([1, 26]);"),
	], tests: [T], expectRed: [R2400, R2405, R2406, R2407] },
	{ n: "D2", name: "DAMAGE_CODES drops SQLite code 1 (ERROR, a table of another shape)", edits: [
		one(DB, CODES, "export const DAMAGE_CODES = new Set([11, 26]);"),
	], tests: [T], expectRed: [R2401] },
	{ n: "D3", name: "DAMAGE_CODES drops SQLite code 26 (NOTADB)", edits: [
		one(DB, CODES, "export const DAMAGE_CODES = new Set([1, 11]);"),
	], tests: [T], expectRed: [R2400, R2405, R2406, R2407] },
	{ n: "D4", name: "DAMAGE_CODES adds SQLite code 5 (BUSY): a write-locked index counts as damage", edits: [
		one(DB, CODES, "export const DAMAGE_CODES = new Set([1, 5, 11, 26]);"),
	], tests: [T], expectRed: [R2403] },
	{ n: "D5", name: "indexDamage ignores IndexDamageError: only node:sqlite codes count", edits: [
		one(DB, "\tif (err instanceof IndexDamageError) return err.message;\n", ""),
	], tests: [T], expectRed: [R2400, R2402, R2405, R2406, R2407] },
	{ n: "D6", name: "checkIndex's reason drops the 'database disk image is malformed' prefix", edits: [
		one(DB, "throw new IndexDamageError(`database disk image is malformed: ${finding}`);", "throw new IndexDamageError(finding);"),
	], tests: [T], expectRed: [R2405, R2406, R2407] },
	{ n: "D7", name: "checkIndex accepts any quick_check finding", edits: [
		one(DB, "\tif (raw === \"ok\") return;", "\tif (raw !== undefined) return;"),
	], tests: [T], expectRed: [R2400, R2402, R2405, R2406, R2407] },

	// lib/build.ts: build()'s recovery and buildLocked's check
	{ n: "B1", name: "main's form: buildLocked runs no checkIndex", edits: [
		one(BUILD, BUILD_CHECK, "\t\treturn buildOpen(db, sources, t0);"),
	], tests: [T], expectRed: [R2400, R2402, R2406, R2407] },
	{ n: "B2", name: "buildLocked skips checkIndex when opts.rebuild is set (the adversary's pair)", edits: [
		one(BUILD, BUILD_CHECK, "\t\tif (!opts.rebuild) checkIndex(db);\n\t\treturn buildOpen(db, sources, t0);"),
	], tests: [T], expectRed: [R2407] },
	{ n: "B3", name: "build() checks and deletes a damaged index before acquireBuildLock", edits: [
		one(BUILD, LOCK, PRE_LOCK + LOCK),
	], tests: [T], expectRed: [R2404, R2406, R2407] },
	{ n: "B4", name: "the retry runs without rebuild: true", edits: [
		one(BUILD, "const stats = await buildLocked({ rebuild: true }, sources);", "const stats = await buildLocked(opts, sources);"),
	], tests: [T], expectRed: [R2400, R2401, R2402, R2406] },
	{ n: "B5", name: "the keptDamage branch is dropped: damage under a sources problem retries", edits: [
		one(BUILD, "\t\t\tif (sources.problem) return problemStats(sources.problem, started, reason);\n", ""),
	], tests: [T, SF], expectRed: [R2407] },
	{ n: "B6", name: "a recovered build does not set stats.recovered", edits: [
		one(BUILD, "\t\t\tstats.recovered = reason;\n", ""),
	], tests: [T], expectRed: [R2406] },
	{ n: "B7", name: "a sources problem with no index.db opens the missing file instead of returning problemStats", edits: [
		one(BUILD, "\t\tif (sources.problem && !fs.existsSync(paths.db)) return problemStats(sources.problem, started);\n", ""),
	], tests: [T, SF], expectRed: [R2372] },
	{ n: "B8", name: "buildOpen's sources-problem return is dropped: the read-only handle goes on to write", edits: [
		one(BUILD, "\tif (problem) {\n\t\tstats.files = existing.size;", "\tif (false) {\n\t\tstats.files = existing.size;"),
	], tests: [T, SF], expectRed: [R2371, R2372, R2374, R2375] },

	// bin/nana-knowledge.ts: the build and status lines
	{ n: "C1", name: "build prints no kept-damage line", edits: [
		one(BIN, "\t\t\tconsole.log(`  index was damaged (${s.keptDamage}) — not rebuilt while sources.json has a problem; repair it, then run nana-knowledge build`);\n", ""),
	], tests: [T, SF], expectRed: [R2407] },
	{ n: "C2", name: "build exits 1 on the kept-damage path", edits: [
		one(BIN, KEPT_EXIT, "formatSourcesProblem(s.problem)}`);\n\t\t\treturn 1;"),
	], tests: [T, SF], expectRed: [R2407] },
	{ n: "C3", name: "build prints no recovered line", edits: [
		one(BIN, "\t\tif (s.recovered) console.log(`  index was damaged (${s.recovered}) — rebuilt from the sources`);\n", ""),
	], tests: [T], expectRed: [R2406] },
	{ n: "C4", name: "main's form: status runs no checkIndex", edits: [
		one(BIN, "\t\tcheckIndex(db);\n\t\tbuilt = ", "\t\tbuilt = "),
	], tests: [T], expectRed: [R2405] },
	{ n: "C5", name: "status rethrows damage (main's stack)", edits: [
		one(BIN, "\t\tif (!reason) throw err;\n\t\tconsole.log(`index ${paths.db} is damaged", "\t\tthrow err;\n\t\tconsole.log(`index ${paths.db} is damaged"),
	], tests: [T], expectRed: [R2405] },
	{ n: "C6", name: "status exits 1 on damage", edits: [
		one(BIN, STATUS_EXIT, "— repair: nana-knowledge build --rebuild`);\n\t\treturn 1;"),
	], tests: [T], expectRed: [R2405] },
	{ n: "C7", name: "status's damage line names no repair", edits: [
		one(BIN, ") — repair: nana-knowledge build --rebuild`", ")`"),
	], tests: [T], expectRed: [R2405] },
];

process.exitCode = await runMutations({ lane: "knowledge-index-recover", self: import.meta.url, tip: "de48bcdb", declared: DECLARED, pairs: PAIRS });
