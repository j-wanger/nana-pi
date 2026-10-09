/**
 * @module packages/nana-setup/tests/doctor-knowledge.test.mjs
 * @purpose Pins that doctor validates the knowledge database by opening it read-only and counting the expected docs table.
 * @inputs doctor diagnose, setup path resolution, and temporary SQLite databases.
 * @outputs PASS/FAIL lines and a nonzero process exit when any assertion fails.
 * @effects disk (temporary SQLite databases).
 * @errors a failed assertion prints FAIL and exits nonzero.
 */
import { createRequire } from "node:module";
import * as fs from "node:fs";
import { tmpDir } from "./tmp-dir.mjs";
import * as os from "node:os";
import * as path from "node:path";
import { withPiStub } from "./stub-pi.mjs";
const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");
const { diagnose, knowledgeIndexState } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const diagnoseWithPi = (...args) => withPiStub(() => diagnose(...args));
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);
const home = tmpDir(path.join(os.tmpdir(), "nana-doctor-db-"));
const layout = resolveLayout({ home });
fs.mkdirSync(layout.knowledgeHome, { recursive: true });
const dbPath = path.join(layout.knowledgeHome, "index.db");
let db = new DatabaseSync(dbPath);
db.exec("CREATE TABLE docs (id INTEGER)");
db.close();
fs.chmodSync(dbPath, 0o444);
const row = () => diagnoseWithPi(layout).find((check) => check.label === "knowledge index");
const valid = row();
let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
// req: R-675
check("valid docs table is counted read-only", valid.status === "ok" && /docs count: 0/.test(valid.detail), JSON.stringify(valid));
let readOnly;
class ProbeDatabase { constructor(_file, options) { readOnly = options.readOnly; } prepare() { return { get: () => ({ n: 0 }) }; } close() {} }
// req: R-675
check("doctor opens the knowledge database in read-only mode", knowledgeIndexState(dbPath, ProbeDatabase).ok && readOnly === true, String(readOnly));
fs.chmodSync(dbPath, 0o644);
fs.writeFileSync(dbPath, "not sqlite");
const corrupt = row();
// req: R-675
check("corrupt database is unhealthy", corrupt.status === "fail" && /cannot open\/query/.test(corrupt.detail), JSON.stringify(corrupt));
fs.rmSync(home, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
