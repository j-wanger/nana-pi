#!/usr/bin/env node
/**
 * @module packages/nana-knowledge/bin/nana-knowledge.ts
 * @purpose The knowledge CLI — build, refresh then query, and status over the local index.
 * @inputs argv (`build [--rebuild]`, `query <text> [--limit N] [--json]`, `status`), sources.json and the index
 * @outputs build counts, source/root and index-damage markers, query pointers or JSON and index/root status on stdout; usage, stale-results warnings and query failures on stderr
 * @effects disk (builds and reads the index), database, process (sets the exit code)
 * @errors exit 2 on bad invocation, 1 when query cannot use the index, and 0 otherwise, including a build that lost the lock
 */
// nana-knowledge — build / query / status.
// Run directly: `node bin/nana-knowledge.ts <cmd>` (Node >= 22.18 strips the types).
import * as fs from "node:fs";
import { build, BuildLockedError } from "../lib/build.ts";
import { checkIndex, getMeta, indexDamage, openDb } from "../lib/db.ts";
import { paths } from "../lib/paths.ts";
import { search } from "../lib/query.ts";
import { loadSources } from "../lib/sources.ts";
import { formatSourcesProblem } from "../lib/sources-file.mjs";

const USAGE = `nana-knowledge — local BM25 index over the knowledge stores

  nana-knowledge build [--rebuild]        (re)build ~/.pi/agent/nana-knowledge/index.db
  nana-knowledge query "<text>" [--limit N] [--json]
  nana-knowledge status                   index age, row counts, configured roots
`;

function mb(n: number): string { return (n / 1048576).toFixed(1) + " MB"; }

async function cmdBuild(argv: string[]): Promise<number> {
	const rebuild = argv.includes("--rebuild");
	try {
		const s = await build({ rebuild });
		if (s.keptDamage) {
			console.log(`  index was damaged (${s.keptDamage}) — not rebuilt while sources.json has a problem; repair it, then run nana-knowledge build`);
			if (s.problem) console.log(`  ${paths.sources}  ${formatSourcesProblem(s.problem)}`);
			return 0;
		}
		if (s.recovered) console.log(`  index was damaged (${s.recovered}) — rebuilt from the sources`);
		const pad = Math.max(...s.roots.map((r) => r.root.length), 4);
		for (const r of s.roots) {
			console.log(`  ${r.root.padEnd(pad)}  ${String(r.files).padStart(6)} files  ${String(r.rows).padStart(7)} rows  ${r.kind}${r.skipped ? `  (${r.skipped} >1MB skipped)` : ""}`);
		}
		if (s.problem) console.log(`  ${paths.sources}  ${formatSourcesProblem(s.problem)}`);
		const skipped = rebuild || s.recovered ? "(skipped; the rebuild dropped its rows)" : "(skipped, rows kept)";
		for (const m of s.missingRoots) console.log(`  ${m}  MISSING ${skipped}`);
		for (const u of s.unreadable) console.log(`  ${u}  UNREADABLE ${skipped}`);
		console.log(`\n  files ${s.files} · rows ${s.rows} · reindexed ${s.reindexed} · unchanged ${s.unchanged} · removed ${s.removed} · preserved ${s.preserved} · skipped>1MB ${s.skippedLarge}`);
		console.log(`  ${(s.ms / 1000).toFixed(1)}s · db ${mb(s.dbBytes)} · ${paths.db}`);
		return 0;
	} catch (err) {
		// The lock is the builder's own; a losing build says so and exits 0 rather than
		// clearing someone else's lock (the old unconditional rmSync did exactly that).
		if (err instanceof BuildLockedError) { console.error(err.message); return 0; }
		throw err;
	}
}

async function cmdQuery(argv: string[]): Promise<number> {
	const json = argv.includes("--json");
	const li = argv.indexOf("--limit");
	const limit = li >= 0 ? Math.max(1, parseInt(argv[li + 1], 10) || 5) : 5;
	const text = argv.filter((a, i) => !a.startsWith("--") && !(li >= 0 && i === li + 1)).join(" ").trim();
	if (!text) { console.error(USAGE); return 2; }
	try {
		const stats = await build();
		if (stats.problem || stats.keptDamage) console.error("index refresh incomplete — results may be stale");
	} catch (err) {
		console.error(`${err instanceof BuildLockedError ? "index refresh locked" : "index refresh failed"} — results may be stale`);
	}
	if (!fs.existsSync(paths.db)) { console.error(`no index at ${paths.db} — run: nana-knowledge build`); return 1; }
	let db;
	let hits;
	try {
		db = await openDb(paths.db, {});
		hits = search(db, text, limit, { excludeMonthlySessionArchives: true });
	} catch (err) {
		console.error(`query failed: ${err instanceof Error ? err.message : "index error"}`);
		return 1;
	} finally {
		try { db?.close(); } catch { /* ignore */ }
	}
	if (json) { console.log(JSON.stringify(hits, null, 2)); return 0; }
	if (hits.length === 0) { console.log("(no hits)"); return 0; }
	for (const h of hits) console.log(`- ${h.title} — ${h.display} — ${h.snippet}`);
	return 0;
}

function rootStatus(p: string): "MISS" | "UNREADABLE" | "ok  " {
	let st: fs.Stats;
	try { st = fs.statSync(p); } catch { return "MISS"; }
	if (st.isDirectory()) {
		try { fs.opendirSync(p).closeSync(); } catch { return "UNREADABLE"; }
	}
	return "ok  ";
}

async function cmdStatus(): Promise<number> {
	const { roots, problem } = loadSources();
	console.log(`sources ${paths.sources}${problem ? `  ${formatSourcesProblem(problem)}` : ""}`);
	for (const r of roots) console.log(`  ${rootStatus(r.path)} ${r.kind.padEnd(8)} ${r.path}${r.discovered ? "  (discovered)" : ""}`);
	if (!fs.existsSync(paths.db)) { console.log(`\nno index at ${paths.db}`); return 0; }
	let db;
	let built;
	let docs;
	let files;
	try {
		db = await openDb(paths.db, {});
		checkIndex(db);
		built = Number(getMeta(db, "built_at") || 0);
		docs = db.prepare("SELECT COUNT(*) AS n FROM docs").get().n;
		files = db.prepare("SELECT COUNT(*) AS n FROM files").get().n;
	} catch (err) {
		const reason = indexDamage(err);
		if (!reason) throw err;
		console.log(`index ${paths.db} is damaged (${reason}) — repair: nana-knowledge build --rebuild`);
		return 0;
	} finally {
		try { db?.close(); } catch { /* preserve the status result */ }
	}
	const ageH = built ? ((Date.now() - built) / 3600000).toFixed(1) : "?";
	console.log(`\nindex ${paths.db} · ${mb(fs.statSync(paths.db).size)} · ${files} files · ${docs} rows · built ${ageH}h ago`);
	return 0;
}

const [cmd, ...argv] = process.argv.slice(2);
let code = 0;
switch (cmd) {
	case "build": code = await cmdBuild(argv); break;
	case "query": code = await cmdQuery(argv); break;
	case "status": code = await cmdStatus(); break;
	default: console.error(USAGE); code = cmd ? 2 : 0;
}
process.exit(code);
