/**
 * @module packages/nana-knowledge/tests/sources-file.test.mjs
 * @purpose Pin byte-mark decoding, safe source-file reading and frozen-index notices when sources.json cannot be parsed or read.
 * @inputs Temporary profiles, knowledge homes, article roots, marked JSON fixtures, malformed sources files, and the knowledge CLI.
 * @outputs Ten PASS/FAIL lines for sources-file behavior, with exit 1 when a check fails.
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
import { runHook, renderBlock, BUDGET_MS } from "../lib/hook.ts";
import { paths } from "../lib/paths.ts";
import { formatSourcesProblem, SOURCES_FROZEN_CLAUSE } from "../lib/sources-file.mjs";

const td = tmpDir(path.join(os.tmpdir(), "nk-sources-file-"));
const cli = fileURLToPath(new URL("../bin/nana-knowledge.ts", import.meta.url));
const F1 = '{\n  "roots": [\n    { "path": "C:\\Users\\x\\docs", "kind": "articles" }\n  ]\n}\n';
const F2 = '{\n  "roots": [\n    { "path": "/one", "kind": "articles" }\n    { "path": "/two", "kind": "articles" }\n  ]\n}\n';
const F3 = '{\n  "roots": [\n    { "path": "/one", "kind": "articles" },\n  ]\n}\n';
const F4 = "";

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
	return spawnSync(process.execPath, [cli, ...args], {
		encoding: "utf8",
		env: { ...process.env, HOME: f.profile, USERPROFILE: f.profile, NANA_KNOWLEDGE_HOME: f.home, NODE_NO_WARNINGS: "1" },
		timeout: 10_000,
	});
}

function writeGood(f, bytes = null) {
	const text = JSON.stringify({ roots: [{ path: f.root, kind: "articles" }] });
	fs.writeFileSync(f.sources, bytes ? bytes(text) : text);
}

function hit(f) {
	const result = run(f, "query", f.token);
	return result.status === 0 && !result.stdout.includes("(no hits)") && result.stdout.includes(f.token);
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
	return build.status === 0 && hit(f);
});

const malformed = [F1, F2, F3, F4].map((text, index) => {
	const f = fixture(`malformed-${index + 1}`);
	writeGood(f);
	const first = run(f, "build");
	fs.writeFileSync(f.sources, text);
	const build = run(f, "build");
	const queryHit = hit(f);
	return { f, first, build, queryHit };
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
const rebuildHit = hit(rebuildFixture);

const unreadableFixture = fixture("unreadable");
writeGood(unreadableFixture);
const unreadableFirst = run(unreadableFixture, "build");
fs.rmSync(unreadableFixture.sources);
fs.mkdirSync(unreadableFixture.sources);
const unreadable = run(unreadableFixture, "build");
const unreadableHit = hit(unreadableFixture);
const unreadableMarker = `  ${unreadableFixture.sources}  UNREADABLE (no roots read, rows kept)`;

const emptyFixture = fixture("empty-roots");
writeGood(emptyFixture);
const emptyFirst = run(emptyFixture, "build");
fs.writeFileSync(emptyFixture.sources, JSON.stringify({ roots: [] }));
const emptyBuild = run(emptyFixture, "build");
const emptyQuery = run(emptyFixture, "query", emptyFixture.token);

let fails = 0;
function check(name, ok) {
	console.log(ok ? "PASS" : "FAIL", name);
	if (!ok) fails++;
}

// req: R-2370
check("R-2370: a sources.json with a UTF-8, UTF-16LE or UTF-16BE byte-order mark indexes its root like its plain UTF-8 twin", markedResults.every(Boolean));
// req: R-2371
check("R-2371: a sources.json that does not parse, including an empty one, removes no row and a later query still hits", malformed.every(({ first, build, queryHit }) => first.status === 0 && build.status === 0 && queryHit));
// req: R-2372
check("R-2372: build names an unparseable sources.json with its place and repair and exits 0", malformed.slice(0, 3).every(({ build }, index) => build.status === 0 && countLine(build.stdout, expectedMarkers[index]) === 1));
// req: R-2373
check("R-2373: status marks a sources.json that does not parse UNPARSEABLE and exits 0", status.status === 0 && countLine(status.stdout, `sources ${malformed[0].f.sources}  UNPARSEABLE at line 3, column 19 (no roots read, rows kept). ${FORWARD_SLASH_ADVICE}`) === 1);
// req: R-2374
check("R-2374: a rebuild with a sources.json that does not parse keeps the index searchable", rebuildFirst.status === 0 && rebuild.status === 0 && rebuildHit);
// req: R-2375
check("R-2375: a sources.json that exists but cannot be read keeps every row and is named UNREADABLE", unreadableFirst.status === 0 && unreadable.status === 0 && unreadableHit && countLine(unreadable.stdout, unreadableMarker) === 1);
// req: R-2376
check("R-2376: a sources.json that parses with no roots and no discover block still purges every row", emptyFirst.status === 0 && emptyBuild.status === 0 && emptyQuery.status === 0 && emptyQuery.stdout.includes("(no hits)"));

// Pull cases use the existing F1-F4 fixtures and the same unreadable folder stand-in.
const hookPayload = (prompt, session_id = "frozen-test") => JSON.stringify({ prompt, session_id, cwd: td, source: "claude-code" });
const activatePull = (f) => {
	process.env.NANA_KNOWLEDGE_HOME = f.home;
	delete process.env.NANA_ROLE;
};
const expectedMarkerFromStatus = (f) => {
	const result = run(f, "status");
	return result.stdout.split(String.fromCharCode(10)).find((line) => line.startsWith(`sources ${f.sources}  `))?.slice(`sources ${f.sources}  `.length);
};
const runPull = (raw, opts) => {
	let timer;
	return Promise.race([
		runHook(raw, opts),
		new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("pull case exceeded its deadline")), BUDGET_MS + 1000); }),
	]).finally(() => clearTimeout(timer));
};
const pullCase = async (f, prompt = `${f.token} knowledge`, session = "frozen-test", opts = {}) => {
	activatePull(f);
	return runPull(hookPayload(prompt, session), { spawnFn: () => {}, ...opts });
};
const freshBroken = malformed[0].f;
fs.writeFileSync(freshBroken.sources, F1);
const sameHit = await pullCase(freshBroken);
const marker = expectedMarkerFromStatus(freshBroken);
const noticeLine = `[nana:knowledge] sources.json ${marker} ${SOURCES_FROZEN_CLAUSE}`;
const hitOutput = sameHit.output?.split(String.fromCharCode(10)) ?? [];
const hitBlock = renderBlock(sameHit.hits);
const noHit = await pullCase(freshBroken, "unmatched distinct query words");
const noIndex = fixture("notice-no-index");
fs.writeFileSync(noIndex.sources, F1);
const absentIndex = await pullCase(noIndex);
const repeated = await pullCase(freshBroken, `${freshBroken.token} knowledge`, "frozen-test");
const randomIndex = fixture("notice-random-index");
fs.writeFileSync(randomIndex.sources, F1);
fs.writeFileSync(path.join(randomIndex.home, "index.db"), Buffer.from([1, 2, 3]));
const random = await pullCase(randomIndex);
const budget = await pullCase(freshBroken, `${freshBroken.token} knowledge`, "budget-test", { budgetMs: -1 });
const unreadablePull = await pullCase(unreadableFixture);
const emptyFilePull = await pullCase(malformed[3].f);
fs.writeFileSync(malformed[2].f.sources, F3);
const manual = await pullCase(malformed[2].f);
const cliInputFixture = malformed[0].f;
const cliResult = spawnSync(process.execPath, [cli, "hook"], {
	input: hookPayload(`${cliInputFixture.token} knowledge`, "cli-fresh-index"), encoding: "utf8", timeout: 10_000,
	env: Object.fromEntries(Object.entries({ ...process.env, HOME: cliInputFixture.profile, USERPROFILE: cliInputFixture.profile, NANA_KNOWLEDGE_HOME: cliInputFixture.home, NODE_NO_WARNINGS: "1" }).filter(([key]) => key !== "NANA_ROLE")),
});
const noticePullGoodTwin = fixture("notice-good-twin");
writeGood(noticePullGoodTwin);
run(noticePullGoodTwin, "build");
activatePull(noticePullGoodTwin);
const goodHitTwin = await runPull(hookPayload(`${noticePullGoodTwin.token} knowledge`, "good-twin"), { spawnFn: () => {} });
const goodNoHitTwin = await runPull(hookPayload("unmatched distinct query words", "good-no-hit-twin"), { spawnFn: () => {} });
const roleFixture = freshBroken;
process.env.NANA_ROLE = "reviewer";
const reviewer = await runPull(hookPayload(`${roleFixture.token} knowledge`), { spawnFn: () => {} });
process.env.NANA_ROLE = "worker";
const worker = await runPull(hookPayload(`${roleFixture.token} knowledge`), { spawnFn: () => {} });
delete process.env.NANA_ROLE;
const short = await runPull(hookPayload("hi"), { spawnFn: () => {} });
const badJson = await runPull("{", {});
const badInput = await runPull("null", {});
const sourceReadOnlyPlain = fixture("pull-good-plain");
writeGood(sourceReadOnlyPlain);
run(sourceReadOnlyPlain, "build");
const plainBytes = fs.readFileSync(sourceReadOnlyPlain.sources);
const plainPull = await pullCase(sourceReadOnlyPlain);
const sourceReadOnlyUtf8 = fixture("pull-good-utf8");
writeGood(sourceReadOnlyUtf8, (text) => Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text)]));
run(sourceReadOnlyUtf8, "build");
const utf8Bytes = fs.readFileSync(sourceReadOnlyUtf8.sources);
const utf8Pull = await pullCase(sourceReadOnlyUtf8);
const sourceReadOnlyUtf16 = fixture("pull-good-utf16le");
writeGood(sourceReadOnlyUtf16, (text) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]));
run(sourceReadOnlyUtf16, "build");
const utf16Bytes = fs.readFileSync(sourceReadOnlyUtf16.sources);
const utf16Pull = await pullCase(sourceReadOnlyUtf16);
const crlfFixture = fixture("pull-good-crlf");
writeGood(crlfFixture, (text) => Buffer.from(text.replaceAll(String.fromCharCode(10), String.fromCharCode(13) + String.fromCharCode(10))));
run(crlfFixture, "build");
const crlfBytes = fs.readFileSync(crlfFixture.sources);
const crlfPull = await pullCase(crlfFixture);
const wrongShape = fixture("pull-wrong-shape");
fs.writeFileSync(wrongShape.sources, JSON.stringify({ roots: 5 }));
run(wrongShape, "build");
const wrongShapeBytes = fs.readFileSync(wrongShape.sources);
const wrongShapePull = await pullCase(wrongShape);
const absentSources = fixture("pull-absent-sources");
run(absentSources, "build");
fs.rmSync(absentSources.sources);
const absentPull = await pullCase(absentSources);
const absentStillAbsent = !fs.existsSync(absentSources.sources);
const goodBytesUnchanged = plainBytes.equals(fs.readFileSync(sourceReadOnlyPlain.sources)) && utf8Bytes.equals(fs.readFileSync(sourceReadOnlyUtf8.sources)) && utf16Bytes.equals(fs.readFileSync(sourceReadOnlyUtf16.sources)) && crlfBytes.equals(fs.readFileSync(crlfFixture.sources)) && wrongShapeBytes.equals(fs.readFileSync(wrongShape.sources));
const pullLogs = (f) => fs.existsSync(path.join(f.home, "pull.log")) ? fs.readFileSync(path.join(f.home, "pull.log"), "utf8").trim().split(String.fromCharCode(10)).filter(Boolean).map((line) => JSON.parse(line)) : [];
const hitLog = pullLogs(freshBroken).find((entry) => entry.session_id === "frozen-test");
// req: R-2860
check("R-2860: a pull with an unparseable or unreadable sources.json prints one frozen-index notice line first, with or without pointers", marker && sameHit.reason === "ok" && hitOutput[0] === noticeLine && hitOutput.filter((line) => line === noticeLine).length === 1 && hitOutput.slice(1).join(String.fromCharCode(10)) === hitBlock && noHit.output === `[nana:knowledge] sources.json ${expectedMarkerFromStatus(freshBroken)} ${SOURCES_FROZEN_CLAUSE}` && absentIndex.reason === "no-index(spawned)" && absentIndex.output?.startsWith("[nana:knowledge] sources.json ") && repeated.reason === "all-shown" && repeated.output?.startsWith("[nana:knowledge] sources.json ") && ["db-open-failed", "query-failed"].includes(random.reason) && random.output?.startsWith("[nana:knowledge] sources.json ") && budget.reason === "budget" && budget.output?.startsWith("[nana:knowledge] sources.json ") && unreadablePull.output?.includes("UNREADABLE") && emptyFilePull.output?.startsWith("[nana:knowledge] sources.json UNPARSEABLE") && manual.output?.includes(MANUAL_JSON_ADVICE) && !manual.output?.includes("/one") && cliResult.status === 0 && cliResult.stderr === "" && cliResult.stdout.startsWith("[nana:knowledge] sources.json ") && goodHitTwin.reason === sameHit.reason && goodNoHitTwin.reason === noHit.reason && hitLog?.reason === sameHit.reason && pullLogs(freshBroken).filter((entry) => entry.session_id === "frozen-test" || entry.session_id === "budget-test").every((entry) => Object.keys(entry).sort().join(",") === "cwd,hits,ms,reason,session_id,source,tokens,ts") && [reviewer, worker, short, badJson, badInput].every((result) => result.output === null));
// req: R-2861
check("R-2861: a pull with a parsing or absent sources.json prints no notice, and its own read never creates or rewrites the file", [plainPull, utf8Pull, utf16Pull, crlfPull, wrongShapePull].every((result) => result.output === null || result.output.startsWith("[nana:knowledge] untrusted search pointers")) && goodBytesUnchanged && absentPull.output === null && absentStillAbsent);
// req: R-2860
// req: R-2862
check('seal: the frozen-index clause reads "The knowledge index is frozen until the user repairs sources.json; the next build after the repair rescans it."', SOURCES_FROZEN_CLAUSE === "The knowledge index is frozen until the user repairs sources.json; the next build after the repair rescans it.");

process.exitCode = fails;
