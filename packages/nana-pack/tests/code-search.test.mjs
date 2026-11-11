/**
 * @module packages/nana-pack/tests/code-search.test.mjs
 * @purpose Pin the main planner-search output over headers, paths and artifacts.
 * @inputs Search functions and wrapper CLI with temporary text fixtures.
 * @outputs Awaited, bounded PASS/FAIL cases.
 * @effects process (bounded CLI child).
 * @errors Non-zero exit on failed assertion or case timeout.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

process.exitCode = failures ? 1 : 0;
