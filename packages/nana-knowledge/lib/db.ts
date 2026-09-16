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
	// Schema/PRAGMA only on the build path. The query path opens an existing file and
	// issues nothing but SELECTs — a read-only *handle* would trip over WAL's shm file.
	if (opts.create) {
		db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;");
		db.exec(SCHEMA);
	}
	return db;
}

export function getMeta(db: Db, key: string): string | null {
	try { return db.prepare("SELECT value FROM meta WHERE key = ?").get(key)?.value ?? null; }
	catch { return null; }
}

export function setMeta(db: Db, key: string, value: string): void {
	db.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}
