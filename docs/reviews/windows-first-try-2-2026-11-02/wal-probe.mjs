// Does a knowledge build that finishes while a reader holds a read transaction leave index.db's mtime stale?
// Usage: node wal-probe.mjs <repo root>
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repo = process.argv[2];
const cli = path.join(repo, "packages", "nana-knowledge", "bin", "nana-knowledge.ts");
const home = fs.mkdtempSync(path.join(os.tmpdir(), "walprobe-"));
const src = path.join(home, "src"); fs.mkdirSync(src);
fs.writeFileSync(path.join(src, "a.md"), "# Quasar notes\nnebula telescope.\n");
fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({ roots: [{ path: src, kind: "articles" }] }));
const env = { ...process.env, NANA_KNOWLEDGE_HOME: home, NODE_NO_WARNINGS: "1" };
const build = () => spawnSync(process.execPath, ["--experimental-strip-types", cli, "build"], { env, encoding: "utf8" });
const db = path.join(home, "index.db");
const meta = () => { const d = new DatabaseSync(db, { readOnly: true }); try { return d.prepare("SELECT value FROM meta WHERE key='built_at'").get()?.value; } finally { d.close(); } };

const b1 = build(); if (b1.status !== 0) { console.log("first build failed", b1.stderr); process.exit(1); }
const stale = Date.now() / 1000 - 7200; fs.utimesSync(db, stale, stale);
const staleMs = fs.statSync(db).mtimeMs; const metaBefore = meta();

for (const hold of [false, true]) {
 fs.utimesSync(db, stale, stale);
 const reader = new DatabaseSync(db, { readOnly: true });
 if (hold) { reader.exec("BEGIN"); reader.prepare("SELECT count(*) AS n FROM meta").get(); }
 const r = build();
 const mtimeMoved = fs.statSync(db).mtimeMs > staleMs + 60000;
 const walBytes = fs.existsSync(db + "-wal") ? fs.statSync(db + "-wal").size : 0;
 if (hold) reader.exec("COMMIT");
 reader.close();
 const builtAt = meta();
 console.log(JSON.stringify({ readerHoldsTxn: hold, buildStatus: r.status, mtimeMovedWhileReaderOpen: mtimeMoved, walBytes, builtAtAdvanced: builtAt !== metaBefore, mtimeMovedAfterReaderClosed: fs.statSync(db).mtimeMs > staleMs + 60000 }));
}
fs.rmSync(home, { recursive: true, force: true });
