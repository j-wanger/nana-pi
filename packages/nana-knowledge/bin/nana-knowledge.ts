#!/usr/bin/env node
// nana-knowledge — build / query / hook.
// Run directly: `node bin/nana-knowledge.ts <cmd>` (Node >= 22.18 strips the types).
import * as fs from "node:fs";
import { build, pruneShown, BuildLockedError } from "../lib/build.ts";
import { openDb, getMeta } from "../lib/db.ts";
import { paths } from "../lib/paths.ts";
import { search } from "../lib/query.ts";
import { loadRoots } from "../lib/sources.ts";
import { runHook, BUDGET_MS, STDIN_MAX_BYTES } from "../lib/hook.ts";

const USAGE = `nana-knowledge — local BM25 index over the knowledge stores

  nana-knowledge build [--rebuild]        (re)build ~/.pi/agent/nana-knowledge/index.db
  nana-knowledge query "<text>" [--limit N] [--json]
  nana-knowledge hook                     read Claude Code hook JSON on stdin
  nana-knowledge status                   index age, row counts, configured roots
`;

function mb(n: number): string { return (n / 1048576).toFixed(1) + " MB"; }

async function cmdBuild(argv: string[]): Promise<number> {
	const rebuild = argv.includes("--rebuild");
	try {
		const s = await build({ rebuild });
		const pad = Math.max(...s.roots.map((r) => r.root.length), 4);
		for (const r of s.roots) {
			console.log(`  ${r.root.padEnd(pad)}  ${String(r.files).padStart(6)} files  ${String(r.rows).padStart(7)} rows  ${r.kind}${r.skipped ? `  (${r.skipped} >1MB skipped)` : ""}`);
		}
		for (const m of s.missingRoots) console.log(`  ${m}  MISSING (skipped, rows kept)`);
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
	if (!fs.existsSync(paths.db)) { console.error(`no index at ${paths.db} — run: nana-knowledge build`); return 1; }
	const db = await openDb(paths.db, {});
	const hits = search(db, text, limit);
	db.close();
	if (json) { console.log(JSON.stringify(hits, null, 2)); return 0; }
	if (hits.length === 0) { console.log("(no hits)"); return 0; }
	for (const h of hits) console.log(`- ${h.title} — ${h.display} — ${h.snippet}`);
	return 0;
}

// The hook's own budget — NOT a hard wall-clock bound, and the README says so too.
// This timer runs on the event loop, so it bounds ASYNCHRONOUS stalls only: a stdin that
// is never closed, a slow spawn, a blocked pipe. A SYNCHRONOUS stall — a wedged
// filesystem inside a single SQLite call, existsSync, or the log append — blocks the loop,
// the timer never fires, and the harness hook timeout is then the only bound.
// In practice the query work is measured at ~8 ms, so a real pull finishes well under it.
// .unref() so it never holds a healthy fast path open.
function armDeadline(ms: number): void {
	setTimeout(() => process.exit(0), ms).unref();
}

async function cmdHook(): Promise<number> {
	armDeadline(BUDGET_MS); // BEFORE stdin is touched — a hung read must still exit 0
	try {
		const chunks: Buffer[] = [];
		let bytes = 0;
		for await (const c of process.stdin) {
			const buf = c as Buffer;
			bytes += buf.length;
			if (bytes > STDIN_MAX_BYTES) break; // stop reading; truncated JSON fails open below
			chunks.push(buf);
		}
		const res = await runHook(Buffer.concat(chunks).toString("utf8"));
		if (res.output) process.stdout.write(res.output + "\n");
	} catch { /* fail open, always */ }
	return 0;
}

async function cmdStatus(): Promise<number> {
	const roots = loadRoots();
	console.log(`sources ${paths.sources}`);
	for (const r of roots) console.log(`  ${fs.existsSync(r.path) ? "ok  " : "MISS"} ${r.kind.padEnd(8)} ${r.path}${r.discovered ? "  (discovered)" : ""}`);
	if (!fs.existsSync(paths.db)) { console.log(`\nno index at ${paths.db}`); return 0; }
	const db = await openDb(paths.db, {});
	const built = Number(getMeta(db, "built_at") || 0);
	const docs = db.prepare("SELECT COUNT(*) AS n FROM docs").get().n;
	const files = db.prepare("SELECT COUNT(*) AS n FROM files").get().n;
	db.close();
	const ageH = built ? ((Date.now() - built) / 3600000).toFixed(1) : "?";
	console.log(`\nindex ${paths.db} · ${mb(fs.statSync(paths.db).size)} · ${files} files · ${docs} rows · built ${ageH}h ago`);
	console.log(`shown sessions ${(() => { try { return fs.readdirSync(paths.shownDir).length; } catch { return 0; } })()} · log ${fs.existsSync(paths.log) ? mb(fs.statSync(paths.log).size) : "none"}`);
	return 0;
}

const [cmd, ...argv] = process.argv.slice(2);
let code = 0;
switch (cmd) {
	case "build": code = await cmdBuild(argv); break;
	case "query": code = await cmdQuery(argv); break;
	case "hook": code = await cmdHook(); break;
	case "status": code = await cmdStatus(); break;
	case "prune": pruneShown(); break;
	default: console.error(USAGE); code = cmd ? 2 : 0;
}
process.exit(code);
