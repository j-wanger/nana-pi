/**
 * @module packages/nana-knowledge/lib/db.ts
 * @purpose Open and verify the node:sqlite knowledge database, create its FTS5 schema on the build path, and read or write the meta table.
 * @inputs the database file path and {create, readonly}; node:sqlite imported dynamically with its SQLite
 *  ExperimentalWarning muted
 * @outputs a Db handle (exec / prepare / close), index damage classification and validation, a meta value or null, and SCHEMA_VERSION
 * @effects disk (mkdirs the parent and creates the database file on the create path), database (WAL
 *  pragmas, the docs/files/docs_fts schema and its triggers, meta upserts)
 * @errors openDb rejects after closing a created handle when setup fails; checkIndex throws IndexDamageError or node:sqlite damage; getMeta swallows and returns null
 */
// node:sqlite (Node >= 22.5, bundled SQLite has FTS5). Imported dynamically so the
// ExperimentalWarning can be muted first — the hook writes to stdout and its stderr is
// shown to the user; a warning per prompt would be intolerable.
import * as fs from "node:fs";
import * as path from "node:path";

export interface Db {
	exec(sql: string): void;
	prepare(sql: string): { all(...p: unknown[]): any[]; get(...p: unknown[]): any; run(...p: unknown[]): unknown };
	close(): void;
}

let sqlitePromise: Promise<any> | null = null;
export function loadSqlite(): Promise<any> {
	if (!sqlitePromise) {
		const prev = process.listeners("warning");
		process.removeAllListeners("warning");
		process.on("warning", (w: Error & { name?: string }) => {
			if (w?.name === "ExperimentalWarning" && /SQLite/i.test(w.message)) return;
			for (const l of prev) (l as (e: Error) => void)(w);
		});
		sqlitePromise = import("node:sqlite");
	}
	return sqlitePromise;
}

export const SCHEMA_VERSION = "1";

/** SQLite primary result codes classified as index damage; contract: R-2400, R-2401. */
export const DAMAGE_CODES = new Set([1, 11, 26]);

export class IndexDamageError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "IndexDamageError";
	}
}

/** Return a stable damage reason for known index damage, otherwise null. */
export function indexDamage(err: unknown): string | null {
	if (err instanceof IndexDamageError) return err.message;
	if (!err || typeof err !== "object") return null;
	const sqlite = err as { code?: unknown; errcode?: unknown; message?: unknown };
	if (sqlite.code !== "ERR_SQLITE_ERROR" || typeof sqlite.errcode !== "number" || !DAMAGE_CODES.has(sqlite.errcode & 0xff)) return null;
	return typeof sqlite.message === "string" && sqlite.message ? sqlite.message : "SQLite index error";
}

/** Verify every page and report the first structural finding. */
export function checkIndex(db: Db): void {
	const row = db.prepare("PRAGMA quick_check(1)").get();
	const raw = row && typeof row === "object" ? Object.values(row)[0] : undefined;
	if (raw === "ok") return;
	const finding = String(raw ?? "quick check failed")
		.replace(/^\*\*\* in database main \*\*\*\s*/i, "")
		.replace(/\s+/g, " ")
		.trim();
	throw new IndexDamageError(`database disk image is malformed: ${finding}`);
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS docs (
  id    INTEGER PRIMARY KEY,
  key   TEXT UNIQUE NOT NULL,
  path  TEXT NOT NULL,
  root  TEXT NOT NULL,
  kind  TEXT NOT NULL,
  loc   INTEGER,
  title TEXT NOT NULL,
  body  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS docs_path ON docs(path);

CREATE TABLE IF NOT EXISTS files (
  path       TEXT PRIMARY KEY,
  root       TEXT NOT NULL,
  kind       TEXT NOT NULL,
  hash       TEXT NOT NULL,
  size       INTEGER NOT NULL,
  mtime      INTEGER NOT NULL,
  rows       INTEGER NOT NULL,
  indexed_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
  title, body, content='docs', content_rowid='id', tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS docs_ai AFTER INSERT ON docs BEGIN
  INSERT INTO docs_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
END;
CREATE TRIGGER IF NOT EXISTS docs_ad AFTER DELETE ON docs BEGIN
  INSERT INTO docs_fts(docs_fts, rowid, title, body) VALUES ('delete', old.id, old.title, old.body);
END;
CREATE TRIGGER IF NOT EXISTS docs_au AFTER UPDATE ON docs BEGIN
  INSERT INTO docs_fts(docs_fts, rowid, title, body) VALUES ('delete', old.id, old.title, old.body);
  INSERT INTO docs_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
END;
`;

export async function openDb(dbPath: string, opts: { create?: boolean; readonly?: boolean } = {}): Promise<Db> {
	const { DatabaseSync } = await loadSqlite();
	if (opts.create) fs.mkdirSync(path.dirname(dbPath), { recursive: true });
	const db = new DatabaseSync(dbPath, { readOnly: !!opts.readonly }) as Db;
	try {
		// Schema/PRAGMA only on the build path. The query path opens an existing file and
		// issues nothing but SELECTs — a read-only *handle* would trip over WAL's shm file.
		if (opts.create) {
			db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;");
			db.exec(SCHEMA);
		}
		return db;
	} catch (err) {
		try { db.close(); } catch { /* preserve the setup error */ }
		throw err;
	}
}

export function getMeta(db: Db, key: string): string | null {
	try { return db.prepare("SELECT value FROM meta WHERE key = ?").get(key)?.value ?? null; }
	catch { return null; }
}

export function setMeta(db: Db, key: string, value: string): void {
	db.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}
