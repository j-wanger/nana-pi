/**
 * @module packages/nana-knowledge/tests/sources-file.test.mjs
 * @purpose Pin byte-mark decoding and safe index preservation and reporting when sources.json cannot be parsed or read.
 * @inputs Temporary profiles, knowledge homes, article roots, marked JSON bytes, malformed JSON fixtures, and the knowledge CLI.
 * @outputs Seven PASS/FAIL lines for sources-file behavior, with exit 1 when a check fails.
 * @effects disk (temporary fixtures and indexes), process (spawns the CLI with isolated homes).
 * @errors A failed check prints FAIL; an unexpected fixture or child-process failure makes its check fail.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FORWARD_SLASH_ADVICE, MANUAL_JSON_ADVICE } from "../../nana-pack/lib/json-text.mjs";

const td = tmpDir(path.join(os.tmpdir(), "nk-sources-file-"));
const cli = fileURLToPath(new URL("../bin/nana-knowledge.ts", import.meta.url));
const F1 = '{\n  "roots": [\n    { "path": "C:\\Users\\x\\docs", "kind": "articles" }\n  ]\n}\n';
const F2 = '{\n  "roots": [\n    { "path": "/one", "kind": "articles" }\n    { "path": "/two", "kind": "articles" }\n  ]\n}\n';
const F3 = '{\n  "roots": [\n    { "path": "/one", "kind": "articles" },\n  ]\n}\n';
const F4 = "";
// chosen 2026-10-25: 10 seconds missed once during an inferred sustained runner stall; 30 seconds bounds each child.
const CHILD_LIMIT_MS = 30_000;

function fixture(name, token = `sourcesfilesignal${name.replace(/\W/g, "")}`) {
	const base = path.join(td, name);
	const profile = path.join(base, "profile");
	const home = path.join(base, "knowledge-home");
	const root = path.join(base, "root");
	fs.mkdirSync(profile, { recursive: true });
	fs.mkdirSync(home, { recursive: true });
	fs.mkdirSync(root, { recursive: true });
	fs.writeFileSync(path.join(root, "article.md"), `# Kept\n${token}\n`);
	return { profile, home, root, token, sources: path.join(home, "sources.json") };
}

function run(f, ...args) {
	const started = Date.now();
	const child = spawnSync(process.execPath, [cli, ...args], {
		encoding: "utf8",
		env: { ...process.env, HOME: f.profile, USERPROFILE: f.profile, NANA_KNOWLEDGE_HOME: f.home, NODE_NO_WARNINGS: "1" },
		timeout: CHILD_LIMIT_MS,
	});
	return { ...child, elapsedMs: Date.now() - started, label: `${path.basename(path.dirname(f.home))}:${args.join(" ")}` };
}

function writeGood(f, bytes = null) {
	const text = JSON.stringify({ roots: [{ path: f.root, kind: "articles" }] });
	fs.writeFileSync(f.sources, bytes ? bytes(text) : text);
}

function hit(f) {
	const result = run(f, "query", f.token);
	return { ok: result.status === 0 && !result.stdout.includes("(no hits)") && result.stdout.includes(f.token), result };
}

function countLine(stdout, expected) {
	return stdout.split(/\r?\n/).filter((line) => line === expected).length;
}

const marked = [
	["plain", (text) => Buffer.from(text, "utf8")],
	["utf8", (text) => Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, "utf8")])],
	["utf16le", (text) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")])],
	["utf16be", (text) => Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(text, "utf16le").swap16()])],
];
const markedResults = marked.map(([name, encode]) => {
	const f = fixture(`marked-${name}`);
	writeGood(f, encode);
	const build = run(f, "build");
	const query = hit(f);
	return { ok: build.status === 0 && query.ok, build, query: query.result };
});

const malformed = [F1, F2, F3, F4].map((text, index) => {
	const f = fixture(`malformed-${index + 1}`);
	writeGood(f);
	const first = run(f, "build");
	fs.writeFileSync(f.sources, text);
	const build = run(f, "build");
	const queryHit = hit(f);
	return { f, first, build, queryHit: queryHit.ok, query: queryHit.result };
});
const expectedMarkers = [
	`  ${malformed[0].f.sources}  UNPARSEABLE at line 3, column 19 (no roots read, rows kept). ${FORWARD_SLASH_ADVICE}`,
	`  ${malformed[1].f.sources}  UNPARSEABLE at line 4, column 5 (no roots read, rows kept). ${MANUAL_JSON_ADVICE}`,
	`  ${malformed[2].f.sources}  UNPARSEABLE (no roots read, rows kept). ${MANUAL_JSON_ADVICE}`,
];
const status = run(malformed[0].f, "status");

const rebuildFixture = fixture("rebuild");
writeGood(rebuildFixture);
const rebuildFirst = run(rebuildFixture, "build");
fs.writeFileSync(rebuildFixture.sources, F1);
const rebuild = run(rebuildFixture, "build", "--rebuild");
const rebuildQuery = hit(rebuildFixture);
const rebuildHit = rebuildQuery.ok;

const unreadableFixture = fixture("unreadable");
writeGood(unreadableFixture);
const unreadableFirst = run(unreadableFixture, "build");
fs.rmSync(unreadableFixture.sources);
fs.mkdirSync(unreadableFixture.sources);
const unreadable = run(unreadableFixture, "build");
const unreadableQuery = hit(unreadableFixture);
const unreadableHit = unreadableQuery.ok;
const unreadableMarker = `  ${unreadableFixture.sources}  UNREADABLE (no roots read, rows kept)`;

const emptyFixture = fixture("empty-roots");
writeGood(emptyFixture);
const emptyFirst = run(emptyFixture, "build");
fs.writeFileSync(emptyFixture.sources, JSON.stringify({ roots: [] }));
const emptyBuild = run(emptyFixture, "build");
const emptyQuery = run(emptyFixture, "query", emptyFixture.token);

let fails = 0;
const childDetail = (children) => JSON.stringify(children.flat().filter(Boolean).map((child) => ({ label: child.label, elapsedMs: child.elapsedMs, status: child.status, signal: child.signal })));
function check(name, ok, detail) {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!ok) fails++;
}

// req: R-2370
check("R-2370: a sources.json with a UTF-8, UTF-16LE or UTF-16BE byte-order mark indexes its root like its plain UTF-8 twin", markedResults.every((entry) => entry.ok), childDetail(markedResults.flatMap((entry) => [entry.build, entry.query])));
// req: R-2371
check("R-2371: a sources.json that does not parse, including an empty one, removes no row and a later query still hits", malformed.every(({ first, build, queryHit }) => first.status === 0 && build.status === 0 && queryHit), childDetail(malformed.flatMap((entry) => [entry.first, entry.build, entry.query])));
// req: R-2372
check("R-2372: build names an unparseable sources.json with its place and repair and exits 0", malformed.slice(0, 3).every(({ build }, index) => build.status === 0 && countLine(build.stdout, expectedMarkers[index]) === 1), childDetail(malformed.slice(0, 3).map((entry) => entry.build)));
// req: R-2373
check("R-2373: status marks a sources.json that does not parse UNPARSEABLE and exits 0", status.status === 0 && countLine(status.stdout, `sources ${malformed[0].f.sources}  UNPARSEABLE at line 3, column 19 (no roots read, rows kept). ${FORWARD_SLASH_ADVICE}`) === 1, childDetail([status]));
// req: R-2374
check("R-2374: a rebuild with a sources.json that does not parse keeps the index searchable", rebuildFirst.status === 0 && rebuild.status === 0 && rebuildHit, childDetail([rebuildFirst, rebuild, rebuildQuery.result]));
// req: R-2375
check("R-2375: a sources.json that exists but cannot be read keeps every row and is named UNREADABLE", unreadableFirst.status === 0 && unreadable.status === 0 && unreadableHit && countLine(unreadable.stdout, unreadableMarker) === 1, childDetail([unreadableFirst, unreadable, unreadableQuery.result]));
// req: R-2376
check("R-2376: a sources.json that parses with no roots and no discover block still purges every row", emptyFirst.status === 0 && emptyBuild.status === 0 && emptyQuery.status === 0 && emptyQuery.stdout.includes("(no hits)"), childDetail([emptyFirst, emptyBuild, emptyQuery]));

process.exitCode = fails;
