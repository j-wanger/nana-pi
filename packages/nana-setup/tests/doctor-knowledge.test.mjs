/**
 * @module packages/nana-setup/tests/doctor-knowledge.test.mjs
 * @purpose Pins the knowledge sources diagnostic and built_at age beside the read-only knowledge index check.
 * @inputs doctor state functions, setup path resolution, sources files and temporary SQLite databases.
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
const { diagnose, knowledgeIndexState, knowledgeSourcesState } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { SOURCES_FROZEN_CLAUSE } = await import(new URL("../../nana-knowledge/lib/sources-file.mjs", import.meta.url).href);
const { FORWARD_SLASH_ADVICE, MANUAL_JSON_ADVICE } = await import(new URL("../../nana-pack/lib/json-text.mjs", import.meta.url).href);
const { KNOWLEDGE_CLI } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
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
const sourceRoot = path.join(home, "source-cases");
fs.mkdirSync(sourceRoot, { recursive: true });
const sourceFile = path.join(sourceRoot, "sources.json");
const stateFor = (bytes) => {
	fs.writeFileSync(sourceFile, bytes);
	const before = fs.readFileSync(sourceFile);
	const state = knowledgeSourcesState(sourceFile);
	return { state, unchanged: before.equals(fs.readFileSync(sourceFile)) };
};
const plainSources = stateFor(JSON.stringify({ roots: [] }));
const utf16Sources = stateFor(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(JSON.stringify({ roots: [] }), "utf16le")]));
const wrongShapeSources = stateFor(JSON.stringify({ roots: 5 }));
const lineEnd = String.fromCharCode(10);
const slash = String.fromCharCode(92);
const f1 = ["{", '  "roots": [', `    { "path": "C:${slash}nana-fixture-only${slash}docs", "kind": "articles" }`, "  ]", "}"].join(lineEnd) + lineEnd;
const unparseableSources = stateFor(f1);
const f3 = ["{", '  "roots": [', '    { "path": "/one", "kind": "articles" },', "  ]", "}"].join(lineEnd) + lineEnd;
const manualSources = stateFor(f3);
const quotedParserText = "private-parser-message-secret";
const quotedParserSources = stateFor(`{"roots":[${quotedParserText}]}`);
fs.rmSync(sourceFile);
fs.mkdirSync(sourceFile);
const unreadableSources = knowledgeSourcesState(sourceFile);
fs.rmSync(sourceFile, { recursive: true });
const missingPath = path.join(sourceRoot, "missing-parent", "sources.json");
const absentSources = knowledgeSourcesState(missingPath);
const noIndexRows = diagnoseWithPi({ ...layout, knowledgeHome: path.join(home, "no-index-home") });
const sourceRow = noIndexRows.filter((check) => check.label === "knowledge sources");
const sourceRowFile = path.join(home, "no-index-home", "sources.json");
const sourceRowBytesAbsent = !fs.existsSync(sourceRowFile);
const quotedFile = path.join(home, "with space", "sources.json");
fs.mkdirSync(path.dirname(quotedFile), { recursive: true });
fs.writeFileSync(quotedFile, f1);
const quotedRescan = knowledgeSourcesState(quotedFile);
const expectedMarker = "UNPARSEABLE at line 3, column 37 (no roots read, rows kept).";
// req: R-2862
check("R-2862: doctor's knowledge sources row is ok for a parsing file, a note for an absent one and a fail naming the marker, the frozen index and a rescan command for a broken one, and never writes the file", plainSources.state.status === "ok" && utf16Sources.state.status === "ok" && wrongShapeSources.state.status === "ok" && [plainSources, utf16Sources, wrongShapeSources].every((item) => item.unchanged) && unparseableSources.state.status === "fail" && unparseableSources.state.detail.startsWith(sourceFile) && unparseableSources.state.detail.includes(expectedMarker) && unparseableSources.state.detail.includes(FORWARD_SLASH_ADVICE) && unparseableSources.state.detail.includes(SOURCES_FROZEN_CLAUSE) && unparseableSources.state.detail.includes(`node ${KNOWLEDGE_CLI} build`) && !unparseableSources.state.detail.includes(`C:${slash}nana-fixture-only${slash}docs`) && manualSources.state.status === "fail" && manualSources.state.detail.includes(MANUAL_JSON_ADVICE) && !manualSources.state.detail.includes("/one") && quotedParserSources.state.status === "fail" && !quotedParserSources.state.detail.includes("private-pa") && unreadableSources.status === "fail" && unreadableSources.detail.includes("UNREADABLE (no roots read, rows kept)") && unreadableSources.detail.includes(SOURCES_FROZEN_CLAUSE) && absentSources.status === "note" && absentSources.detail.startsWith(missingPath) && absentSources.detail.includes("next build seeds it") && !fs.existsSync(missingPath) && sourceRow.length === 1 && sourceRow[0].status === "note" && noIndexRows.filter((check) => check.label === "knowledge index").length === 1 && sourceRow[0].label !== noIndexRows.find((check) => check.label === "knowledge index")?.label && sourceRowFile.startsWith(path.join(home, "no-index-home")) && sourceRowBytesAbsent && quotedRescan.detail.includes(KNOWLEDGE_CLI.includes(" ") ? `node "${KNOWLEDGE_CLI}" build` : `node ${KNOWLEDGE_CLI} build`), "R-2862: doctor detail echoed the quoted fixture path");

const ageNow = 2_000_000_000_000;
const agedDbPath = path.join(home, "aged-index.db");
db = new DatabaseSync(agedDbPath);
db.exec("CREATE TABLE docs (id INTEGER); CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);");
db.prepare("INSERT INTO docs VALUES (1)").run();
db.prepare("INSERT INTO meta VALUES ('built_at', ?)").run(String(ageNow - 2.5 * 60 * 60 * 1000));
db.close();
fs.utimesSync(agedDbPath, new Date(ageNow - 24 * 60 * 60 * 1000), new Date(ageNow - 24 * 60 * 60 * 1000));
const aged = knowledgeIndexState(agedDbPath, DatabaseSync, ageNow);
const docsOnlyPath = path.join(home, "docs-only-index.db");
const docsOnlyDb = new DatabaseSync(docsOnlyPath);
docsOnlyDb.exec("CREATE TABLE docs (id INTEGER)");
docsOnlyDb.close();
const noMeta = knowledgeIndexState(docsOnlyPath, DatabaseSync, ageNow);
const writeMeta = (value) => {
	const handle = new DatabaseSync(agedDbPath);
	handle.prepare("UPDATE meta SET value = ? WHERE key = 'built_at'").run(value);
	handle.close();
	return knowledgeIndexState(agedDbPath, DatabaseSync, ageNow);
};
const invalidAges = [writeMeta("abc"), writeMeta("0"), writeMeta(String(ageNow + 60 * 60 * 1000))];
// req: R-2863
check("R-2863: doctor's knowledge index row gives the built_at age in hours and stays ok when no build time is recorded", aged.ok && aged.detail.includes("docs count: 1") && aged.detail.includes("built 2.5h ago") && noMeta.ok && noMeta.detail.includes("no build time recorded") && invalidAges.every((state) => state.ok && state.detail.includes("no build time recorded")));

fs.rmSync(home, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
