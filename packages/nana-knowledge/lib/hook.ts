// UserPromptSubmit hook. Contract: whatever goes wrong, print nothing and exit 0.
// A knowledge pull is never allowed to be the reason a prompt does not run.
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { indexAgeMs } from "./build.ts";
import { openDb } from "./db.ts";
import { paths } from "./paths.ts";
import { search, type Hit } from "./query.ts";
import { meaningfulTokens, skipReason } from "./tokenize.ts";

export const BUDGET_MS = 1500;
export const BLOCK_MAX_CHARS = 2000;
export const TOP_K = 3;
export const STALE_MS = 24 * 60 * 60 * 1000;
const LOCK_TTL_MS = 10 * 60 * 1000;
const HEADER = "[nana:knowledge]";

export interface HookResult { output: string | null; reason: string; hits: Hit[] }

/** The one place that decides whether an out-of-date index gets refreshed. Never blocks. */
export function ensureFreshIndex(now = Date.now(), spawnFn = spawnBuild): "fresh" | "spawned" | "locked" | "skipped" {
	const age = indexAgeMs(now);
	if (age !== null && age < STALE_MS) return "fresh";
	try {
		const st = fs.statSync(paths.buildLock);
		if (now - st.mtimeMs < LOCK_TTL_MS) return "locked";
	} catch { /* no lock */ }
	try {
		fs.mkdirSync(paths.home, { recursive: true });
		fs.writeFileSync(paths.buildLock, JSON.stringify({ at: now, by: "hook" }));
		spawnFn();
		return "spawned";
	} catch { return "skipped"; }
}

function spawnBuild(): void {
	const cli = fileURLToPath(new URL("../bin/nana-knowledge.ts", import.meta.url));
	const child = spawn(process.execPath, [cli, "build"], {
		detached: true,
		stdio: "ignore",
		env: { ...process.env, NODE_NO_WARNINGS: "1" },
	});
	child.unref();
}

function sessionFile(sessionId: string): string {
	const safe = (sessionId || "unknown").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
	return path.join(paths.shownDir, `${safe}.json`);
}

export function readShown(sessionId: string): Set<string> {
	try {
		const raw = JSON.parse(fs.readFileSync(sessionFile(sessionId), "utf8"));
		return new Set(Array.isArray(raw?.paths) ? raw.paths : []);
	} catch { return new Set(); }
}

export function recordShown(sessionId: string, newKeys: string[]): void {
	try {
		const all = readShown(sessionId);
		for (const p of newKeys) all.add(p);
		fs.mkdirSync(paths.shownDir, { recursive: true });
		fs.writeFileSync(sessionFile(sessionId), JSON.stringify({ updated: Date.now(), paths: [...all] }));
	} catch { /* dedup is best-effort; a lost file means one repeat pointer */ }
}

function appendLog(line: Record<string, unknown>): void {
	try {
		fs.mkdirSync(paths.home, { recursive: true });
		fs.appendFileSync(paths.log, JSON.stringify(line) + "\n");
	} catch { /* best effort */ }
}

export function renderBlock(hits: Hit[]): string {
	const head = `${HEADER} ${hits.length} pointer${hits.length === 1 ? "" : "s"} for this prompt (read only if relevant):`;
	const lines = [head];
	let total = head.length;
	for (const h of hits) {
		const line = `- ${h.title} — ${h.display}${h.snippet ? ` — ${h.snippet}` : ""}`;
		if (total + 1 + line.length > BLOCK_MAX_CHARS) break;
		lines.push(line);
		total += 1 + line.length;
	}
	return lines.length > 1 ? lines.join("\n") : "";
}

/**
 * @param raw   the hook JSON from stdin
 * @returns     what to print (null = print nothing) and why
 */
export async function runHook(raw: string, opts: { now?: number; budgetMs?: number; spawnFn?: () => void } = {}): Promise<HookResult> {
	const t0 = Date.now();
	const budget = opts.budgetMs ?? BUDGET_MS;
	const over = () => Date.now() - t0 > budget;
	const none = (reason: string): HookResult => ({ output: null, reason, hits: [] });

	let input: any;
	try { input = JSON.parse(raw); } catch { return none("bad-json"); }
	if (!input || typeof input !== "object") return none("bad-input");

	const prompt = input.prompt;
	const skip = skipReason(prompt);
	if (skip) return none(skip);

	const freshness = ensureFreshIndex(opts.now ?? Date.now(), opts.spawnFn);
	if (!fs.existsSync(paths.db)) return none(`no-index(${freshness})`);
	if (over()) return none("budget");

	let db;
	try { db = await openDb(paths.db, {}); } catch { return none("db-open-failed"); }
	let hits: Hit[];
	try { hits = search(db, prompt, TOP_K); }
	catch { hits = []; }
	finally { try { db.close(); } catch { /* ignore */ } }
	if (over()) return none("budget");
	if (hits.length === 0) return none("no-hits");

	const sessionId = typeof input.session_id === "string" ? input.session_id : "unknown";
	const shown = readShown(sessionId);
	// Keyed on the doc key, which IS the path for articles and path#Lnn for ledger
	// entries — so one doctrine file can still contribute different lines in a session.
	const fresh = hits.filter((h) => !shown.has(h.key));
	if (fresh.length === 0) return none("all-shown");

	const block = renderBlock(fresh);
	if (!block) return none("empty-block");
	if (over()) return none("budget");

	recordShown(sessionId, fresh.map((h) => h.key));
	appendLog({
		ts: new Date().toISOString(),
		cwd: typeof input.cwd === "string" ? input.cwd : null,
		session_id: sessionId,
		tokens: meaningfulTokens(prompt).slice(0, 24),
		hits: fresh.map((h) => h.display),
		ms: Date.now() - t0,
	});
	return { output: block, reason: "ok", hits: fresh };
}
