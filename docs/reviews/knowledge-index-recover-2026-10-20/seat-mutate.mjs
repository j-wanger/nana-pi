#!/usr/bin/env node
// Seat wrong-code pairs for lane knowledge-index-recover (hook lane), written by the seat 2026-10-20 after build 1 and
// moved after build 2, on the shared runner. Each pair puts one product site the lane changed into its wrong form: the D
// pairs break the damage classifier and the quick check in lib/db.ts, the B pairs revert build()'s recovery,
// buildLocked's checks and open, and buildOpen's finish under a sources problem in lib/build.ts toward main, build 1 or
// the obvious wrong implementation, and the C pairs break the build and status lines in bin/nana-knowledge.ts. Run from
// the worktree root:
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
const R2403 = "R-2403: builds over healthy or page-damaged write-locked indexes fail, keep index.db's inode and bytes, and a fresh handle reads the committed sentinel";
const R2403_LATE = "R-2403: a writer arriving after recovery takes its lock is blocked before delete, then the damaged index recovers";
const R2404 = "R-2404: a build that loses the build lock leaves a damaged index.db byte for byte";
const R2405 = "R-2405: status on a random-bytes, half-truncated or page-overwritten index exits 0 with one line naming the damage and build --rebuild, no stack";
const R2406 = "R-2406: build on a random-bytes, half-truncated or page-overwritten index exits 0 with one line naming the damage, no stack";
const R2407 = "R-2407: build and build --rebuild with an unparseable sources.json over a random-bytes, half-truncated or page-overwritten index exit 0, keep index.db byte for byte and print one line naming the damage as not rebuilt";
const R2408 = "R-2408: an unparseable sources.json over a stale healthy index keeps every row, refreshes its age and prunes an old shown file";
const R2409 = "R-2409: an unparseable sources.json with no index exits 0, prints UNPARSEABLE and creates an empty index";
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
const PROBE = [
	"\tif (problem && existing) {",
	"\t\tconst probe = await openDb(paths.db, { readonly: true });",
	"\t\ttry { checkIndex(probe); }",
	"\t\tfinally { try { probe.close(); } catch { /* preserve the check error */ } }",
	"\t}",
	"",
].join("\n");
const REOPEN = "const db = await openDb(paths.db, { create: !problem || !existing });";
const BUILD1_RETURN = [
	"\tif (problem) {",
	"\t\tstats.files = existing.size;",
	"\t\tstats.preserved = existing.size;",
	"\t\tfor (const prev of existing.values()) stats.rows += prev.rows;",
	"\t\tstats.ms = Date.now() - t0;",
	"\t\ttry { stats.dbBytes = fs.statSync(paths.db).size; } catch { /* ignore */ }",
	"\t\treturn stats;",
	"\t}",
	"",
	"",
].join("\n");
const DEL_DOCS = "\tconst delDocs = db.prepare(\"DELETE FROM docs WHERE path = ?\");";
const KEPT_EXIT = "formatSourcesProblem(s.problem)}`);\n\t\t\treturn 0;";
const STATUS_EXIT = "— repair: nana-knowledge build --rebuild`);\n\t\treturn 0;";

const DECLARED = [
	"(build 5, 5a6972bf) test seam only: onRecoveryLocked now runs immediately before the delete in both orders. B17 is now red on R-2403's late-writer check; 29 of 31 red, B4 and B9 survive as declared",
	"(build 4, 5f3567ef) pairs: 28 of 31 red. B17 survived: the onRecoveryLocked hook runs right after the lock is taken, before build 3's order would release it, so a writer in the hook is busy under both orders; build brief 5 moves the hook to run right before the delete. B15 now reds R-2400 to R-2402, not R-2403: build 4 moved the delete into the check, so dropping the check leaves no delete and the retry fails on the damaged file. (build 4) round 2's land reviewer MUST: a writer could take the lock in the gap between the check's close and the delete. Off Windows, build 4 deletes while its own BEGIN IMMEDIATE is held, then rolls back and closes; on Windows it keeps build 3's order, since an open handle blocks the delete there. A test-only onRecoveryLocked hook in build()'s options lets R-2403's new check try a write in that window. B17 puts the POSIX delete back after the close (build 3's order). The new check is skipped on Windows by design, so no pair can reach the Windows order on macOS. B4 (the retry without rebuild) is expected to survive: on every platform the recovery now deletes the three files itself before the retry opens (off Windows under its lock, on Windows after its close), so the retry builds a fresh index either way; the flag's own delete is redundant, and matters only where the recovery's delete failed, where it would fail too",
	"(build 3, bf003ea1) round 1's land reviewer MUST: recovery deleted a damaged index while another connection held its write lock. Build 3 adds assertRecoveryDeleteSafe before the rebuild and widens R-2403's check with a page-damaged, write-locked index. B15 drops the call, B16 lets a busy lock pass the check. No pair for the zero busy timeout: openDb sets none and node:sqlite's default is already 0, so the pragma is redundant and dropping it stays green (the final reviewer's round-2 note corrected the seat's first wording)",
	"(build 2, 20462e77) the table moved from de48bcdb. Build 2 drops build 1's early problemStats return in build() and buildOpen's sources-problem return; under a sources problem buildLocked now checks an existing index on a read-only handle, reopens it read-write (creating it when absent), and finishes as main does: built_at, checkpoint, shown/ prune, every row kept (rows R-2408, R-2409)",
	"(build 2, 20462e77) B7 now pins the removed early return through R-2409; it survived on de48bcdb. B8 is re-anchored as build 1's buildOpen return (R-2408). B9 to B14 are build 2's sites. B1 no longer names R-2407 and B2 now skips both checks: under a sources problem the read-only check and the reopen's checkIndex each catch damage alone, so B2's old one-check form is GREEN on 20462e77",
	"(a) every pair runs on macOS; the seat probed each one first on a scratch copy (de48bcdb for build 1's pairs, 20462e77 for build 2's). Pairs that touch the sources-problem path also run sources-file.test.mjs",
	"(b) no pair, Windows only: the close in openDb's catch and the close in buildLocked's finally. On a scratch copy each wrong form is GREEN on macOS across all seven knowledge test files (recover, sources-file, incremental-build, unreadable-root, discovery, hook, extension), because POSIX deletes a file that is still open; only the Windows CI leg can turn R-2400 red for them",
	"(c) no pair: indexDamage's `& 0xff` mask (node:sqlite reports extended codes, a UNIQUE violation reads 2067, but no fixture throws an extended damage code, so dropping the mask is GREEN); `if (opts.rebuild) throw err` in build()'s catch (only a failed delete reaches it; dropping it is GREEN); the recovered MISSING/UNREADABLE wording (the plan's known limit; GREEN); the kept branch's return before the totals lines; problemStats' keptDamage field (C1 reaches the line it feeds); header tags",
	"(d) B9 is expected to survive: R-2407's fixtures delete -wal and -shm, so the reopen's checkIndex still throws before any write and the read-write close has no WAL frame to checkpoint. Probed on a scratch copy of 20462e77 with a docs-page-damaged index, a leftover -wal holding one committed frame and an unparseable sources.json: the tip keeps index.db byte for byte, B9's form checkpoints the frame into it. No check builds over a leftover -wal",
	"(e) no pair for the WAL checkpoint alone under a sources problem (main's line, now reached): skipping it is GREEN, because closing the last connection checkpoints the WAL into index.db anyway; B8 skips it together with built_at and the prune",
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
	], tests: [T], expectRed: [R2400, R2402, R2406] },
	{ n: "B2", name: "buildLocked skips both index checks when opts.rebuild is set (the adversary's pair, on build 2's read-only check and reopen check)", edits: [
		one(BUILD, "\tif (problem && existing) {\n\t\tconst probe", "\tif (problem && existing && !opts.rebuild) {\n\t\tconst probe"),
		one(BUILD, BUILD_CHECK, "\t\tif (!opts.rebuild) checkIndex(db);\n\t\treturn buildOpen(db, sources, t0);"),
	], tests: [T], expectRed: [R2407] },
	{ n: "B3", name: "build() checks and deletes a damaged index before acquireBuildLock", edits: [
		one(BUILD, LOCK, PRE_LOCK + LOCK),
	], tests: [T], expectRed: [R2404, R2406, R2407] },
	{ n: "B4", name: "the retry runs without rebuild: true (build 4: off Windows the recovery has already deleted the files, so this matters only on Windows)", edits: [
		one(BUILD, "const stats = await buildLocked({ rebuild: true, recoveryFilesDeleted: true }, sources);", "const stats = await buildLocked(opts, sources);"),
	], tests: [T], expectRed: [] },
	{ n: "B5", name: "the keptDamage branch is dropped: damage under a sources problem retries", edits: [
		one(BUILD, "\t\t\tif (sources.problem) return problemStats(sources.problem, started, reason);\n", ""),
	], tests: [T, SF], expectRed: [R2407] },
	{ n: "B6", name: "a recovered build does not set stats.recovered", edits: [
		one(BUILD, "\t\t\tstats.recovered = reason;\n", ""),
	], tests: [T], expectRed: [R2406] },
	{ n: "B7", name: "build 1's form: a sources problem with no index.db returns problemStats before any open, so no empty index", edits: [
		one(BUILD, "\t\tconst sources = loadSources();\n\t\ttry {\n", "\t\tconst sources = loadSources();\n\t\tif (sources.problem && !fs.existsSync(paths.db)) return problemStats(sources.problem, started);\n\t\ttry {\n"),
	], tests: [T, SF], expectRed: [R2409] },
	{ n: "B8", name: "build 1's form: buildOpen returns under a sources problem before the finish (no built_at, checkpoint or shown/ prune)", edits: [
		one(BUILD, DEL_DOCS, BUILD1_RETURN + DEL_DOCS),
	], tests: [T, SF], expectRed: [R2408] },
	{ n: "B9", name: "the read-only check before the reopen is dropped: a damaged index under a sources problem is opened read-write", edits: [
		one(BUILD, PROBE, ""),
	], tests: [T, SF], expectRed: [R2407] },
	{ n: "B10", name: "the read-only check also runs with no index.db", edits: [
		one(BUILD, "\tif (problem && existing) {\n\t\tconst probe", "\tif (problem) {\n\t\tconst probe"),
	], tests: [T, SF], expectRed: [R2409] },
	{ n: "B11", name: "build 1's open: the healthy index under a sources problem is reopened read-only", edits: [
		one(BUILD, REOPEN, "const db = await openDb(paths.db, { create: !problem, readonly: !!problem });"),
	], tests: [T, SF], expectRed: [R2408, R2409, R2371, R2372, R2374, R2375] },
	{ n: "B12", name: "the reopen never creates under a sources problem: no index.db gets no schema", edits: [
		one(BUILD, REOPEN, "const db = await openDb(paths.db, { create: !problem });"),
	], tests: [T, SF], expectRed: [R2409] },
	{ n: "B13", name: "the finish under a sources problem keeps the old built_at", edits: [
		one(BUILD, "\tsetMeta(db, \"built_at\", String(Date.now()));", "\tif (!problem) setMeta(db, \"built_at\", String(Date.now()));"),
	], tests: [T, SF], expectRed: [R2408] },
	{ n: "B14", name: "the finish under a sources problem skips the shown/ prune", edits: [
		one(BUILD, "\n\tpruneShown();\n", "\n\tif (!problem) pruneShown();\n"),
	], tests: [T, SF], expectRed: [R2408] },
	{ n: "B15", name: "(round 1 MUST, build 2's form) recovery deletes without taking the write lock first", edits: [
		one(BUILD, "\t\t\tawait assertRecoveryDeleteSafe(opts.onRecoveryLocked);\n", ""),
	], tests: [T], expectRed: [R2400, R2401, R2402] },
	{ n: "B16", name: "a busy or locked failure while taking the write lock lets the delete go ahead", edits: [
		one(BUILD, "\t\tif (!indexDamage(err)) failure = err;", "\t\tvoid err;"),
	], tests: [T], expectRed: [R2403] },
	{ n: "B17", name: "(round 2 MUST, build 3's order) off Windows the lock is released before the delete", edits: [
		one(BUILD, 'if (process.platform === "win32" || !began) {', "if (true) {"),
	], tests: [T], expectRed: [R2403_LATE] },

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

process.exitCode = await runMutations({ lane: "knowledge-index-recover", self: import.meta.url, tip: "5a6972bf", declared: DECLARED, pairs: PAIRS });
