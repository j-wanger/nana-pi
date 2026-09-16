// Incremental index build. Read-only on every source: we stat, read, hash. Nothing is
// ever written back into a knowledge store.
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { openDb, setMeta, type Db } from "./db.ts";
import { parseArticle, parseLedger, type Row } from "./parse.ts";
import { paths } from "./paths.ts";
import { loadRoots, type Root } from "./sources.ts";

export const MAX_FILE_BYTES = 1024 * 1024;
const SKIP_DIRS = new Set([
	"node_modules",
	".git",
	// wiki convention: raw/ holds unprocessed scrapes; the CURATED articles are the wiki.
	"raw",
	// review corpora are process artifacts, not knowledge — they dominated 2 of the
	// first 3 real queries with reviewer prose about code that has since changed.
	"reviews",
]);
const SHOWN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** A lock older than this is a crashed builder, not a running one. */
export const LOCK_TTL_MS = 10 * 60 * 1000;

function tryCreateLock(now: number): boolean {
	let fd: number;
	// "wx" is the whole mechanism: create-or-fail is ATOMIC, so of two racing builders
	// exactly one gets the fd and the other sees EEXIST. The old stat-then-write let
	// both through and ran two writers against one SQLite file.
	try { fd = fs.openSync(paths.buildLock, "wx"); } catch { return false; }
	try { fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, at: now })); }
	catch { /* the lock exists, which is what matters; the pid is for release */ }
	finally { try { fs.closeSync(fd); } catch { /* ignore */ } }
	return true;
}

/** Read the pid recorded inside the lock, or null when it is absent/unreadable/empty. */
function lockPid(): number | null {
	try {
		const pid = JSON.parse(fs.readFileSync(paths.buildLock, "utf8"))?.pid;
		return typeof pid === "number" && pid > 0 ? pid : null;
	} catch { return null; }
}

/**
 * "stale" — the owner is demonstrably gone (ESRCH), or no owner pid can be read AND the lock
 *           predates the TTL. An ALIVE owner is never stale, however old the lock.
 * "held"  — a real builder is running.
 * "gone"  — the lock vanished while we looked at it; just retry the create.
 *
 * `process.kill(pid, 0)` sends no signal — it only asks "does this pid exist". ESRCH is
 * the one answer that proves death (EPERM means alive but owned by someone else).
 */
function lockState(now: number): "stale" | "held" | "gone" {
	const pid = lockPid();
	if (pid !== null) {
		try {
			process.kill(pid, 0);
			// The owner is ALIVE: never reclaim on age alone (sol r3 C — a long build would be
			// reclaimed under its own writer, and `--rebuild` would delete the db beneath it).
			// The TTL is only for locks whose owner cannot be established at all.
			try { fs.statSync(paths.buildLock); return "held"; } catch { return "gone"; }
		} catch (err) {
			if ((err as NodeJS.ErrnoException)?.code === "ESRCH") return "stale";
			// EPERM: alive but another user's process — treat as held, same as above.
			if ((err as NodeJS.ErrnoException)?.code === "EPERM") {
				try { fs.statSync(paths.buildLock); return "held"; } catch { return "gone"; }
			}
		}
	}
	// No parsable owner pid: the TTL is the only evidence we have.
	try { return now - fs.statSync(paths.buildLock).mtimeMs > LOCK_TTL_MS ? "stale" : "held"; }
	catch { return "gone"; }
}

/** A reclaim is held for ~1 ms; anything older than this is a builder killed mid-reclaim. */
export const RECLAIM_ORPHAN_MS = 30_000;

/**
 * Atomically take the build lock. Returns true iff THIS process owns it.
 *
 * The fresh case is one atomic `wx`. RECLAIMING a stale lock is the hard part, and the
 * defect it has to avoid is a reclaimer acting on an OBSERVATION THAT HAS EXPIRED: builder
 * A sees a stale lock, removes it, creates its own — and B, which read the same stale lock
 * a microsecond earlier, then removes A's FRESH lock and creates its own. Both return true
 * and two writers run, which with `--rebuild` means one of them deletes the database under
 * the other. Renaming the stale file aside instead of unlinking it does NOT fix this: the
 * rename claims the PATH, not the file that was judged stale, so B still renames away A's
 * new lock. (Measured, 32 racing processes x 25 races: remove-then-create produced more
 * than one winner in 3 races, rename-aside in 12. This mechanism: 0.)
 *
 * So: the whole reclaim — re-check AND remove AND create — happens under a second,
 * single-purpose `wx` lock. Inside it the staleness check is re-run, so it cannot be
 * expired: if someone installed a live lock in the meantime we simply lose. The reclaim
 * lock is never itself stale-reclaimed on this logic; it is held for about a millisecond,
 * and an orphan (a builder killed mid-reclaim) is swept after 30 s by a path that NEVER
 * grants the build lock, so two sweepers racing produce zero winners rather than two.
 */
export function acquireBuildLock(now = Date.now()): boolean {
	try { fs.mkdirSync(paths.home, { recursive: true }); } catch { /* ignore */ }
	if (tryCreateLock(now)) return true;
	const state = lockState(now);
	if (state === "gone") return tryCreateLock(now);
	if (state === "held") return false;

	const reclaimLock = paths.buildLock + ".reclaim";
	try { fs.closeSync(fs.openSync(reclaimLock, "wx")); } catch {
		// Someone else is reclaiming right now: lose, and let the next prompt retry in
		// ~60 ms. Sweep an orphan on the way out — this branch returns false regardless,
		// which is what makes the sweep safe to race.
		try { if (Date.now() - fs.statSync(reclaimLock).mtimeMs > RECLAIM_ORPHAN_MS) fs.rmSync(reclaimLock, { force: true }); }
		catch { /* ignore */ }
		return false;
	}
	try {
		if (lockState(Date.now()) !== "stale") return false; // re-checked under exclusion
		try { fs.rmSync(paths.buildLock, { force: true }); } catch { return false; }
		// The instant between rm and create is open to a process arriving FRESH — and that
		// is fine: `wx` admits exactly one of us, and whoever loses it returns false here.
		return tryCreateLock(now);
	} finally {
		try { fs.rmSync(reclaimLock, { force: true }); } catch { /* ignore */ }
	}
}

/** Remove the lock ONLY when the pid inside is ours — never clear another builder's. */
export function releaseBuildLock(): void {
	try {
		const raw = JSON.parse(fs.readFileSync(paths.buildLock, "utf8"));
		if (raw?.pid !== process.pid) return;
	} catch { return; } // absent or unreadable: not provably ours, let the TTL reclaim it
	try { fs.rmSync(paths.buildLock, { force: true }); } catch { /* ignore */ }
}

export class BuildLockedError extends Error {
	constructor() { super("another nana-knowledge build holds " + paths.buildLock); }
}

interface Candidate { path: string; root: string; kind: Root["kind"]; size: number; mtime: number }

export interface RootStat { root: string; kind: string; files: number; rows: number; skipped: number }
export interface BuildStats {
	roots: RootStat[];
	files: number;
	rows: number;
	reindexed: number;
	unchanged: number;
	removed: number;
	/** Rows kept because their root is configured but missing right now (not deleted). */
	preserved: number;
	skippedLarge: number;
	missingRoots: string[];
	ms: number;
	dbBytes: number;
}

function walk(root: string, kind: Root["kind"], out: Candidate[]): void {
	let st: fs.Stats;
	try { st = fs.statSync(root); } catch { return; }
	if (st.isFile()) {
		out.push({ path: root, root, kind, size: st.size, mtime: Math.floor(st.mtimeMs) });
		return;
	}
	const stack = [root];
	while (stack.length) {
		const dir = stack.pop()!;
		let entries: fs.Dirent[];
		try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
		for (const e of entries) {
			const p = path.join(dir, e.name);
			if (e.isSymbolicLink()) continue;
			if (e.isDirectory()) {
				if (!SKIP_DIRS.has(e.name)) stack.push(p);
				continue;
			}
			if (!e.isFile() || !e.name.endsWith(".md")) continue;
			let fst: fs.Stats;
			try { fst = fs.statSync(p); } catch { continue; }
			out.push({ path: p, root, kind, size: fst.size, mtime: Math.floor(fst.mtimeMs) });
		}
	}
}

function hash(content: string): string {
	return crypto.createHash("sha1").update(content).digest("hex");
}

function rowsFor(c: Candidate, content: string): Row[] {
	return c.kind === "ledger" ? parseLedger(c.path, content) : parseArticle(c.path, content);
}

/** Drop per-session dedup files nobody will see again. */
export function pruneShown(now = Date.now()): number {
	let n = 0;
	let entries: string[];
	try { entries = fs.readdirSync(paths.shownDir); } catch { return 0; }
	for (const f of entries) {
		const p = path.join(paths.shownDir, f);
		try {
			if (now - fs.statSync(p).mtimeMs > SHOWN_TTL_MS) { fs.rmSync(p, { force: true }); n++; }
		} catch { /* raced with another prune */ }
	}
	return n;
}

/**
 * @throws BuildLockedError when another build already holds the lock. Every build path
 * goes through here, so "check then spawn" is never needed upstream.
 *
 * Readers are not swapped onto a temp database: WAL already gives a reader a consistent
 * snapshot, and the output is POINTERS — a pointer from generation N-1 still names a real
 * file. A temp-db-and-rename would buy single-generation reads nobody can perceive.
 */
export async function build(opts: { rebuild?: boolean } = {}): Promise<BuildStats> {
	if (!acquireBuildLock()) throw new BuildLockedError();
	try {
		return await buildLocked(opts);
	} finally {
		releaseBuildLock();
	}
}

async function buildLocked(opts: { rebuild?: boolean }): Promise<BuildStats> {
	const t0 = Date.now();
	const roots = loadRoots();
	if (opts.rebuild) {
		for (const suffix of ["", "-wal", "-shm"]) {
			try { fs.rmSync(paths.db + suffix, { force: true }); } catch { /* ignore */ }
		}
	}
	const db = await openDb(paths.db, { create: true });
	const stats: BuildStats = {
		roots: [], files: 0, rows: 0, reindexed: 0, unchanged: 0, removed: 0, preserved: 0,
		skippedLarge: 0, missingRoots: [], ms: 0, dbBytes: 0,
	};

	const candidates: Candidate[] = [];
	for (const r of roots) {
		if (!fs.existsSync(r.path)) { stats.missingRoots.push(r.path); continue; }
		const before = candidates.length;
		walk(r.path, r.kind, candidates);
		stats.roots.push({ root: r.path, kind: r.kind, files: candidates.length - before, rows: 0, skipped: 0 });
	}
	const rootStat = new Map(stats.roots.map((s) => [s.root, s]));
	const scannedRoots = new Set(stats.roots.map((s) => s.root));
	const configuredRoots = new Set(roots.map((r) => r.path));

	const existing = new Map<string, { root: string; hash: string; size: number; mtime: number; rows: number }>(
		db.prepare("SELECT path, root, hash, size, mtime, rows FROM files").all()
			.map((r: any) => [r.path, { root: r.root, hash: r.hash, size: r.size, mtime: r.mtime, rows: r.rows }]),
	);

	const delDocs = db.prepare("DELETE FROM docs WHERE path = ?");
	const insDoc = db.prepare("INSERT INTO docs (key, path, root, kind, loc, title, body) VALUES (?, ?, ?, ?, ?, ?, ?)");
	const upFile = db.prepare(
		"INSERT INTO files (path, root, kind, hash, size, mtime, rows, indexed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)" +
		" ON CONFLICT(path) DO UPDATE SET root=excluded.root, kind=excluded.kind, hash=excluded.hash," +
		" size=excluded.size, mtime=excluded.mtime, rows=excluded.rows, indexed_at=excluded.indexed_at",
	);

	db.exec("BEGIN");
	let pending = 0;
	for (const c of candidates) {
		const rs = rootStat.get(c.root)!;
		if (c.size > MAX_FILE_BYTES) { stats.skippedLarge++; rs.skipped++; rs.files--; continue; }
		const prev = existing.get(c.path);
		existing.delete(c.path);
		// Fast path: same size AND same mtime => assume unchanged, skip the read.
		if (prev && prev.size === c.size && prev.mtime === c.mtime) {
			stats.unchanged++; stats.files++; stats.rows += prev.rows; rs.rows += prev.rows;
			continue;
		}
		let content: string;
		try { content = fs.readFileSync(c.path, "utf8"); } catch { rs.files--; continue; }
		const h = hash(content);
		if (prev && prev.hash === h) {
			// Content identical, only mtime moved: refresh the stat cache, do not re-index.
			upFile.run(c.path, c.root, c.kind, h, c.size, c.mtime, prev.rows, Date.now());
			stats.unchanged++; stats.files++; stats.rows += prev.rows; rs.rows += prev.rows;
			continue;
		}
		const rows = rowsFor(c, content);
		if (prev) delDocs.run(c.path);
		for (const row of rows) insDoc.run(row.key, row.path, c.root, c.kind, row.loc, row.title, row.body);
		upFile.run(c.path, c.root, c.kind, h, c.size, c.mtime, rows.length, Date.now());
		stats.reindexed++; stats.files++; stats.rows += rows.length; rs.rows += rows.length;
		if (++pending >= 500) { db.exec("COMMIT; BEGIN"); pending = 0; }
	}
	// Anything left in `existing` was NOT seen this pass. That means one of two things, and
	// only one of them is evidence of deletion:
	//   - its root WAS scanned, or its root is no longer in sources.json  -> really gone, purge
	//   - its root is still configured but MISSING right now (unmounted volume, repo renamed
	//     mid-build, a laptop off the VPN) -> keep it. An absent directory is not evidence
	//     that the knowledge is gone, and purging would erase the whole root's index until
	//     some later build happens to run while the mount is back.
	const delFile = db.prepare("DELETE FROM files WHERE path = ?");
	for (const [gone, prev] of existing) {
		if (!scannedRoots.has(prev.root) && configuredRoots.has(prev.root)) {
			// still counted: these rows are still IN the index, so the meta counts below
			// and `status` must reflect them.
			stats.preserved++; stats.files++; stats.rows += prev.rows;
			continue;
		}
		delDocs.run(gone); delFile.run(gone); stats.removed++;
	}
	db.exec("COMMIT");

	setMeta(db, "version", "1");
	setMeta(db, "built_at", String(Date.now()));
	setMeta(db, "doc_count", String(stats.rows));
	setMeta(db, "file_count", String(stats.files));
	try { db.exec("PRAGMA wal_checkpoint(TRUNCATE)"); } catch { /* best effort */ }
	db.close();

	pruneShown();
	stats.ms = Date.now() - t0;
	try { stats.dbBytes = fs.statSync(paths.db).size; } catch { /* ignore */ }
	return stats;
}

/** Age of the index in ms, or null when there is no index. */
export function indexAgeMs(now = Date.now()): number | null {
	try { return now - fs.statSync(paths.db).mtimeMs; } catch { return null; }
}

export async function docCount(db: Db): Promise<number> {
	try { return db.prepare("SELECT COUNT(*) AS n FROM docs").get().n as number; } catch { return 0; }
}
