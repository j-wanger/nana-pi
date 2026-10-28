/**
 * @module packages/nana-pack/tests/code-search.test.mjs
 * @purpose Pin planner search, launch links, fixed-history reuse quality and sealed trial settings.
 * @inputs Search functions, wrapper CLI, committed need/answer fixtures and read-only git history.
 * @outputs Awaited, bounded PASS/FAIL cases and a measured quality line.
 * @effects disk (temp fixtures only), process (bounded git and CLI children).
 * @errors Non-zero exit on failed assertion, missing history or case timeout.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const LIMIT_MS = 45_000; // chosen: each synchronous child and each awaited case has a finite limit.
let failures = 0;
async function check(title, body) {
	let timer;
	try {
		await Promise.race([Promise.resolve().then(body), new Promise((_, reject) => {
			timer = setTimeout(() => reject(new Error("case timed out")), LIMIT_MS);
		})]);
		console.log("PASS", title);
	} catch (error) { failures++; console.log("FAIL", title, error.message); }
	finally { clearTimeout(timer); }
}
const searchModule = () => import("../../../scripts/code-search.mjs");
const configModule = () => import("../../../scripts/code-search-config.mjs");
const entry = (path, purpose, extra = {}) => ({ path, purpose, inputs: "none", outputs: "none", effects: "none", errors: "none", callers: [], callees: [], ...extra });
const mapText = (mods) => mods.map((m) => `### \`${m.path}\`\n\n${Object.entries(m).filter(([k]) => k !== "path").map(([k, v]) => `- **${k}** — ${Array.isArray(v) ? v.map((p) => `\`${p}\``).join(", ") || "—" : v}`).join("\n")}\n`).join("\n");
function gitShow(base, path) {
	const r = spawnSync("git", ["show", `${base}:${path}`], { cwd: ROOT, encoding: "utf8", timeout: LIMIT_MS, maxBuffer: 8 * 1024 * 1024 });
	assert.equal(r.status, 0, `missing history ${base}:${path}: ${r.stderr || r.error || "git failed"}; fetch full history`);
	return r.stdout;
}
const header = (path, purpose) => `/**\n * @module ${path}\n * @purpose ${purpose}\n * @inputs none\n * @outputs none\n * @effects none\n * @errors none\n */\n`;

// req: R-3000
await check("R-3000: written launch links are reciprocal and stale links fail the map check", async () => {
	const { writeMap, checkRepo } = await import("../../../scripts/code-map.mjs");
	const root = tmpDir(join(tmpdir(), "code-search-launch-"));
	const put = (p, s) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), s); };
	try {
		put("code-map.config.json", JSON.stringify({ roots: ["scripts", "tests"], testRoots: ["tests"], moduleExtensions: [".mjs"], mapPath: "map.md", packages: [{ id: "fixture", prefix: "" }], layers: [{ id: "all", title: "All", blurb: "Fixture", match: ".*" }] }));
		put("scripts/tool.mjs", header("scripts/tool.mjs", "Print the launch fixture."));
		put("scripts/other.mjs", header("scripts/other.mjs", "Print an unrelated fixture."));
		put("tests/launch.test.mjs", header("tests/launch.test.mjs", "Start a repo script by path.") + 'const CLI = new URL("../scripts/tool.mjs", import.meta.url);\nspawnSync(process.execPath, [CLI]);');
		put("scripts/launcher.mjs", header("scripts/launcher.mjs", "Launch a repo script.") + 'execFileSync(process.execPath, ["scripts/tool.mjs"]);');
		put("scripts/reference.mjs", header("scripts/reference.mjs", "Name a path without launching it.") + 'const named = "scripts/other.mjs";');
		writeMap(root);
		let result = checkRepo(root);
		assert.deepEqual(result.problems, []);
		assert.deepEqual(result.graph.modules.get("scripts/tool.mjs").callers, ["scripts/launcher.mjs", "tests/launch.test.mjs"]);
		assert(result.graph.modules.get("tests/launch.test.mjs").callees.includes("scripts/tool.mjs"));
		assert.equal(result.graph.modules.get("scripts/other.mjs").callers.length, 0);
		assert(readFileSync(join(root, "map.md"), "utf8").includes("`tests/launch.test.mjs`"));
		put("tests/launch.test.mjs", header("tests/launch.test.mjs", "Start a repo script by path.") + 'spawnSync(process.execPath, ["../scripts/other.mjs"]);');
		result = checkRepo(root);
		assert(result.problems.some((p) => /stale/.test(p)), result.problems.join("\n"));
		writeMap(root);
		assert.deepEqual(checkRepo(root).problems, []);
		const doctor = readFileSync(join(ROOT, "packages/nana-setup/lib/doctor.mjs"), "utf8").split("*/")[0];
		const frontier = readFileSync(join(ROOT, "packages/nana-pack/lib/frontier-summary.mjs"), "utf8").split("*/")[0];
		assert.match(doctor, /Judge one machine and return an ordered check list/);
		assert.match(doctor, /knowledgeHome/);
		assert.match(frontier, /next items and open questions/);
	} finally { rmSync(root, { recursive: true, force: true }); }
});

// req: R-3001
await check("R-3001: search prints five non-tests with reasons then callees using headers paths and artifacts", async () => {
	const { searchCode, formatSearch } = await searchModule();
	const { SHORTLIST_SIZE } = await configModule();
	const mods = [entry("lib/purpose.mjs", "quartz"), entry("lib/inputs.mjs", "Read input.", { inputs: "quartz" }), entry("lib/outputs.mjs", "Produce output.", { outputs: "quartz" }), entry("lib/quartz.mjs", "Path signal."), entry("lib/artifact.mjs", "Build a store."), entry("tests/quartz.test.mjs", "quartz quartz quartz", { callees: ["lib/purpose.mjs"] }), entry("lib/no-match.mjs", "Unrelated module.")];
	mods[0].callees.push("tests/quartz.test.mjs");
	const ledger = "## FEAT-029 · Quartz\nArtifact: A-001 · quartz · tracked: data.json · build: lib/artifact.mjs\nReads: A-001 · lib/outputs.mjs";
	for (const lineEnd of ["\n", "\r\n"]) {
		const map = mapText(mods).trimEnd().split("\n").map((s, i) => s + (i % 2 ? "\t" : "  ")).join(lineEnd);
		const text = ledger.split("\n").map((s) => s + "\t ").join(lineEnd); // no final newline
		const result = searchCode("quartz", map, text);
		assert.equal(result.top.length, SHORTLIST_SIZE);
		assert.deepEqual(new Set(result.top.map((m) => m.path)), new Set(mods.slice(0, SHORTLIST_SIZE).map((m) => m.path)));
		assert(result.callees.includes("tests/quartz.test.mjs"));
		assert(result.top.find((m) => m.path === "lib/artifact.mjs").why.includes("artifact"));
		const output = formatSearch(result);
		for (const m of result.top) {
			assert(output.split("\n").some((line) => line.includes(m.path) && line.includes(m.purpose) && /why:/.test(line)));
		}
		assert(output.indexOf("Callees") > output.indexOf(result.top.at(-1).path));
	}
	const cli = spawnSync(process.execPath, [join(ROOT, "scripts/code-map.mjs"), "--search", "quartz"], { encoding: "utf8", timeout: LIMIT_MS });
	assert.equal(cli.status, 0, cli.stderr);
	assert.match(cli.stdout, /Callees/);
	assert.match(JSON.parse(readFileSync(join(ROOT, "package.json"))).scripts["map:search"], /code-map\.mjs --search/);
});

// req: R-3002
await check("R-3002: ten fixed-base needs meet the printed-output reuse floor without skipping missing history", async () => {
	const start = performance.now();
	const { searchCode, formatSearch } = await searchModule();
	const { QUALITY_FLOOR } = await configModule();
	const needs = JSON.parse(readFileSync(new URL("./fixtures/code-search/needs.json", import.meta.url), "utf8"));
	const answers = JSON.parse(readFileSync(new URL("./fixtures/code-search/landed-reuse.json", import.meta.url), "utf8"));
	assert.equal(needs.length, 10);
	assert.throws(() => gitShow("code-search-missing-base", "docs/code-map.md"), /missing history code-search-missing-base/);
	const cache = new Map();
	let share = 0;
	for (const { lane, need, base } of needs) {
		if (!cache.has(base)) cache.set(base, [gitShow(base, "docs/code-map.md"), gitShow(base, "REQUIREMENTS.md")]);
		const output = formatSearch(searchCode(need, ...cache.get(base)));
		const answer = answers.find((a) => a.lane === lane);
		assert.equal(answer.base, base);
		const expected = [...new Set([...answer.reused_code, ...answer.extended])];
		const printed = new Set([...output.matchAll(/^(?:  )?([\w./-]+\.(?:mjs|ts|js))(?: — |$)/gm)].map((m) => m[1]));
		const found = expected.filter((p) => printed.has(p)).length;
		share += found / expected.length;
		console.log(`quality ${lane}: ${found}/${expected.length}`);
	}
	const measured = share / needs.length;
	console.log(`quality mean share: ${measured.toFixed(6)}; floor ${QUALITY_FLOOR}; check time ${((performance.now() - start) / 1000).toFixed(3)}s`);
	assert(measured >= QUALITY_FLOOR, `mean share ${measured} below ${QUALITY_FLOOR}`);
});

// req: R-3003
await check("R-3003: identical search inputs give identical bytes with no network or model dependency", async () => {
	const { searchCode, formatSearch } = await searchModule();
	const text = mapText([entry("lib/z.mjs", "Quartz."), entry("lib/a.mjs", "Quartz.")]);
	const originalFetch = globalThis.fetch;
	globalThis.fetch = () => { throw new Error("network forbidden"); };
	try {
		const a = formatSearch(searchCode("quartz", text, ""));
		assert.equal(a, formatSearch(searchCode("quartz", text, "")));
		assert(a.indexOf("lib/a.mjs") < a.indexOf("lib/z.mjs"));
		for (const file of ["scripts/code-search.mjs", "scripts/code-search-config.mjs"]) {
			const source = readFileSync(join(ROOT, file), "utf8");
			const dependencies = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
			assert(dependencies.every((p) => p === "./code-search-config.mjs" || p === "node:path"), dependencies.join(", "));
			assert(!/\b(?:fetch|spawn|exec|import)\s*\(/.test(source));
		}
	} finally { globalThis.fetch = originalFetch; }
});

// req: R-3004
await check("R-3004: planners run search for each part and name what they took under Precedent", () => {
	assert(readFileSync(join(ROOT, "packages/nana-pack/prompts/planner.md"), "utf8").includes('Run `npm run map:search -- "<need>"` for each part of the lane; under Precedent, name what you took from the results, adding to your own list rather than replacing it.'));
});

// req: R-3005
await check("seal: R-3005 shortlist size is 5", async () => { assert.equal((await configModule()).SHORTLIST_SIZE, 5); });
// req: R-3006
await check("seal: R-3006 callee depth is 1", async () => { assert.equal((await configModule()).CALLEE_DEPTH, 1); });
// req: R-3007
await check("seal: R-3007 quality floor is 0.75", async () => { assert.equal((await configModule()).QUALITY_FLOOR, 0.75); });
// req: R-3008
await check("seal: R-3008 ranking settings retain the facet-free trial values and provenance", async () => {
	assert.deepEqual((await configModule()).RANKING, {
		k1: 1.2, b: 0.75, fields: { purpose: 2, path: 2, inputs: 1, outputs: 1, effects: 1, errors: 0.5 },
		artifactWeight: 0.5, writerWeight: 1, readerWeight: 1, seeds: 10, damping: 0.5,
		stopwords: "a an the and or of to in on for with from by at as is are be it its this that these those when each every one two its into than then so no not only any all who what which shall must can may packages lib bin mjs ts js scripts apps extensions claude",
	});
	assert.match(readFileSync(join(ROOT, "scripts/code-search-config.mjs"), "utf8"), /2026-10-28.*trial\/structure\.mjs/);
});
process.exitCode = failures ? 1 : 0;
