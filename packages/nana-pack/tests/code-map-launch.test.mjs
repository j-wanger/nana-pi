/**
 * @module packages/nana-pack/tests/code-map-launch.test.mjs
 * @purpose Pin exact launch links, blind reach, declarations, history preservation and sealed launch vocabulary.
 * @inputs Shim functions, fixed git history and temporary fixture repositories.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (OS temporary fixtures), process (bounded shim and git children).
 * @errors Failed assertions or per-case deadlines produce exit 1.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { gitShow } from "./git-fixtures.mjs";
import { CASE_LIMIT_MS, withinCaseLimit } from "./report-fixtures.mjs";
import { checkRepo, writeMap } from "../../../scripts/code-map.mjs";

let failures = 0;
async function check(title, action) {
	try { await withinCaseLimit(title, action); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.message); }
}
const shim = new URL("../../../scripts/code-map.mjs", import.meta.url).href;
const configModule = () => import("../../../scripts/code-map-launch-config.mjs");
function fixture(action, variant = "lf") {
	const root = tmpDir(join(tmpdir(), "map-launch-"));
	const config = { roots: ["lib", "tests", "bin", "apps", "scripts", "extensions"], testRoots: ["tests"], moduleExtensions: [".mjs", ".ts"], mapPath: "map.md", runner: "npm run", packages: [{ id: "fixture", prefix: "" }], layers: [{ id: "all", title: "All", blurb: "Fixture", match: ".*" }], launchAlwaysRun: [] };
	const put = (path, source = "") => {
		mkdirSync(dirname(join(root, path)), { recursive: true });
		const text = `/**\n * @module ${path}\n * @purpose Exercise fixture paths.\n * @inputs none\n * @outputs none\n * @effects none\n * @errors none\n */\n${source}`;
		writeFileSync(join(root, path), variant === "crlf" ? text.trimEnd().split("\n").map((line, i) => line + (i % 2 ? "\t" : "  ")).join("\r\n") : text);
	};
	const saveConfig = () => writeFileSync(join(root, "code-map.config.json"), JSON.stringify(config));
	for (const dir of config.roots) mkdirSync(join(root, dir));
	const cli = (...args) => spawnSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(shim)}); process.exitCode = m.repoMain ? m.repoMain(${JSON.stringify(args)}, ${JSON.stringify(root)}) : 0;`], { encoding: "utf8", timeout: CASE_LIMIT_MS });
	const get = (p) => checkRepo(root).graph.modules.get(p);
	saveConfig();
	try { return action({ root, config, put, saveConfig, cli, get }); }
	finally { rmSync(root, { recursive: true, force: true }); }
}
const here = 'const here = dirname(fileURLToPath(import.meta.url));\n';
function anchors(f) {
	f.put("lib/x-child.mjs"); f.put("bin/t.mjs"); f.put("apps/s.mjs"); f.put("scripts/tool.mjs");
	f.put("lib/x.mjs", 'spawnSync(process.execPath, [new URL("x-child.mjs", import.meta.url)]);');
	f.put("tests/a.test.mjs", 'import "../lib/x.mjs";');
	f.put("tests/b.test.mjs", here + 'const bin = join(here, "..", "bin"); spawnSync(process.execPath, [join(bin, "t.mjs")]);');
	f.put("lib/paths.mjs", 'export const root = new URL("../", import.meta.url);');
	f.put("tests/c.test.mjs", 'import { root } from @../lib/paths.mjs@; spawnSync(process.execPath, [join(root, "apps", "s.mjs")]);'.replaceAll("@", '"'));
	f.put("tests/d.test.mjs", 'spawnSync(process.execPath, ["scripts/tool.mjs"]);');
	// Assemble the inert fixture spelling so the suite's real-temp-call audit does not read it as a leak.
	f.put("tests/e.test.mjs", 'const tmp = ' + 'mkdtemp' + 'Sync("x"); spawnSync(process.execPath, [join(tmp, "bin", "t.mjs")]);');
}

// req: R-3149
await check("R-3149: anchors and exact launch literals link reciprocally without temporary-anchor guesses", () => {
	for (const variant of ["lf", "crlf"]) fixture((f) => {
		anchors(f); writeMap(f.root);
		for (const [from, to] of [["lib/x.mjs", "lib/x-child.mjs"], ["tests/b.test.mjs", "bin/t.mjs"], ["tests/c.test.mjs", "apps/s.mjs"], ["tests/d.test.mjs", "scripts/tool.mjs"]]) {
			assert(f.get(from).callees.includes(to), `${from} -> ${to}`);
			assert(f.get(to).callers.includes(from), `${to} <- ${from}`);
			const entry = readFileSync(join(f.root, "map.md"), "utf8").split(`### \`${from}\``)[1].split("### ")[0];
			assert(entry.includes(`\`${to}\``));
		}
		assert(!f.get("tests/e.test.mjs").callees.includes("bin/t.mjs"));
		assert.match(readFileSync(join(f.root, "map.md"), "utf8").split('### `tests/e.test.mjs`')[1], /unresolved launches.*line 9/);
	}, variant);
});

// req: R-3150
await check("R-3150: helper bindings resolve per site and non-launching references add no edge", () => fixture((f) => {
	f.put("bin/t.mjs"); f.put("bin/u.mjs");
	const pre = here + 'const CLI = join(here, "..", "bin", "t.mjs");\nfunction run(file) { return spawnSync(process.execPath, [file]); }\nrun(CLI);';
	f.put("tests/w.test.mjs", pre);
	f.put("tests/v.test.mjs", pre + '\nrun(process.argv[2]);');
	f.put("scripts/reference.mjs", here + 'const named = join(here, "..", "bin", "u.mjs");');
	writeMap(f.root);
	assert.deepEqual(f.get("bin/t.mjs").callers, ["tests/v.test.mjs", "tests/w.test.mjs"]);
	assert.deepEqual(f.get("bin/u.mjs").callers, []);
	const map = readFileSync(join(f.root, "map.md"), "utf8");
	assert(!map.split('### `tests/w.test.mjs`')[1].includes("unresolved launches"));
	assert.match(map.split('### `tests/v.test.mjs`')[1].split("### ")[0], /unresolved launches.*line 11.*binding line 13/);
}));

// req: R-3152
await check("R-3152: unresolved sites are numbered without guessing and stale lists fail check", () => fixture((f) => {
	f.put("bin/x.mjs"); f.put("lib/a.mjs");
	// The unchanged import parser sees import text inside inline code as an external fixture path.
	f.config.ignore = ["tests/lib/a.mjs"]; f.saveConfig();
	const source = 'function run(root) {\nspawnSync(process.execPath, [join(root, "bin", "x.mjs")]);\n}\nspawnSync(process.execPath, ["x.mjs"]);\nspawnSync(process.execPath, ["-e", "import(\'./lib/a.mjs\')"]);\nspawnSync(process.execPath, ["-e", "setInterval(() => {}, 1000)"]);\n// spawnSync(process.execPath, ["comment.mjs"]);\nconst re = /spawnSync\\(process.execPath/;\nconst text = "spawnSync(process.execPath, [])";';
	f.put("tests/u.test.mjs", source); writeMap(f.root);
	assert.deepEqual(f.get("tests/u.test.mjs").callees, []);
	const entry = readFileSync(join(f.root, "map.md"), "utf8").split('### `tests/u.test.mjs`')[1];
	assert.equal((entry.match(/line \d+:/g) ?? []).length, 3, entry);
	for (const line of [10, 12, 13]) assert(entry.includes(`line ${line}:`), entry);
	assert(!entry.includes("line 14:"));
	assert.equal(f.cli("--check").status, 0);
	f.put("tests/u.test.mjs", source + '\nspawnSync(process.execPath, [process.argv[2]]);');
	const result = f.cli("--check"); assert.equal(result.status, 1); assert.match(result.stdout, /stale/);
}));

// req: R-3153
await check("R-3153: impact marks launch-only callers and reports enriched blind reach", async () => fixture((f) => {
	anchors(f); f.put("lib/y.mjs", 'spawnSync(process.execPath, [process.argv[2]]);'); f.put("tests/y.test.mjs", 'import "../lib/y.mjs";');
	writeMap(f.root);
	const r = f.cli("--impact", "lib/x-child.mjs"); assert.equal(r.status, 0, r.stderr);
	assert.match(r.stdout, /tests\/a.test.mjs \[launch\/path\]/);
	const blind = r.stdout.split("always-run tests (blind reach):")[1]; assert(blind, r.stdout);
	assert.match(blind, /^ 2 of 6:/);
	assert(blind.includes("tests/y.test.mjs")); assert(blind.includes("tests/e.test.mjs"));
}));

// req: R-3154
await check("R-3154: launch-only tests count as traced with one untraced of three", () => fixture((f) => {
	f.put("bin/t.mjs"); f.put("tests/import.test.mjs", 'import "../bin/t.mjs";');
	f.put("tests/launch.test.mjs", 'spawnSync(process.execPath, [new URL("../bin/t.mjs", import.meta.url)]);'); f.put("tests/none.test.mjs");
	writeMap(f.root); const r = f.cli("--impact", "bin/t.mjs");
	assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /untraced tests: 1 of 3 test modules link no mapped module/);
	assert(!r.stdout.includes("only starts a process is not linked"));
}));

// req: R-3155
await check("R-3155: repo-code programs require reasoned declarations and remain in blind reach", () => fixture((f) => {
	f.put("extensions/e.ts"); f.put("bin/t.mjs");
	f.put("tests/p.test.mjs", here + 'spawnSync("pi", ["-e", join(here, "..", "extensions", "e.ts")]);');
	f.put("tests/q.test.mjs", 'spawnSync("bash", ["-c", "node bin/t.mjs"]);');
	writeMap(f.root); const bad = f.cli("--check"); assert.equal(bad.status, 1);
	for (const path of ["tests/p.test.mjs", "tests/q.test.mjs"]) assert(bad.stdout.includes(path), bad.stdout);
	assert(f.get("tests/p.test.mjs").callees.includes("extensions/e.ts"));
	f.config.launchAlwaysRun = ["tests/p.test.mjs", "tests/q.test.mjs"].map((path) => ({ path, reason: "Runs repository code under another program." }));
	f.saveConfig(); writeMap(f.root); const good = f.cli("--check"); assert.equal(good.status, 0, good.stdout);
	const blind = f.cli("--impact", "bin/t.mjs").stdout.split("always-run tests (blind reach):")[1];
	assert(blind?.includes("tests/p.test.mjs")); assert(blind?.includes("tests/q.test.mjs"));
}));

// req: R-3156
await check("R-3156: every fixed-base callee survives or has a named loss reason", () => {
	const losses = new Map([
		["packages/nana-pack/tests/objective-golden.test.mjs -> packages/nana-pack/bin/nana-objective.mjs", "Wrong basename guess: the hook runs instead."],
		["packages/nana-setup/tests/stale-copies.test.mjs -> packages/nana-pack/bin/nana-adoption.mjs", "Wrong basename guess: the hook runs instead."],
		["packages/nana-setup/tests/hooks-win32-exec.test.mjs -> packages/nana-knowledge/bin/nana-knowledge.ts", "Command text for a deleted checkout."],
		["packages/nana-setup/tests/hooks-win32-exec.test.mjs -> packages/nana-setup/bin/nana-setup.mjs", "Temporary worktree copy."],
		["packages/nana-setup/tests/copy-record.test.mjs -> packages/nana-setup/bin/nana-setup.mjs", "Temporary repository copy."],
		["packages/nana-pack/tests/review-standard.test.mjs -> packages/nana-pack/bin/pi-review.mjs", "Temporary pack copy."],
		["packages/nana-setup/tests/pi-registration.test.mjs -> packages/nana-setup/bin/nana-setup.mjs", "Twice-bound pkg does not trace."],
		["packages/nana-setup/lib/hook-producer.mjs -> packages/nana-pack/bin/nana-adoption.mjs", "Only a sealed wrapper definition, not a launch call; injected run is outside the sealed call vocabulary."],
		["packages/nana-setup/lib/hook-producer.mjs -> packages/nana-pack/bin/nana-frontier-summary.mjs", "Only a sealed wrapper definition, not a launch call; injected run is outside the sealed call vocabulary."],
		["packages/nana-setup/lib/hook-producer.mjs -> packages/nana-pack/bin/nana-objective.mjs", "Only a sealed wrapper definition, not a launch call; injected run is outside the sealed call vocabulary."],
		["packages/nana-setup/lib/hook-producer.mjs -> packages/nana-setup/bin/stale-copies.mjs", "Only a sealed wrapper definition, not a launch call; injected run is outside the sealed call vocabulary."],
	]);
	const graph = checkRepo().graph;
	for (const entry of gitShow("57167e92", "docs/code-map.md").split(/^### `/m).slice(1)) {
		const path = entry.split("`")[0];
		for (const match of (entry.match(/^- \*\*callees\*\* — (.*)$/m)?.[1] ?? "").matchAll(/`([^`]+)`/g)) {
			const edge = `${path} -> ${match[1]}`;
			assert(graph.modules.get(path)?.callees.includes(match[1]) || losses.get(edge), `lost edge: ${edge}`);
		}
	}
});

// req: R-3157
await check("seal: R-3157 launch names", async () => assert.deepEqual((await configModule()).LAUNCH_CALLS, ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork", "boundedSpawnSync", "runHookProducer"]));
// req: R-3158
await check("seal: R-3158 path-preserving calls", async () => assert.deepEqual((await configModule()).PATH_PRESERVING, ["fileURLToPath", "url.fileURLToPath", "realpathSync", "fs.realpathSync", "realpathSync.native", "fs.realpathSync.native", "realPath"]));
// req: R-3159
await check("seal: R-3159 repo-code programs", async () => assert.deepEqual((await configModule()).REPO_CODE_PROGRAMS, ["pi", "PI_BIN", "piBin", "piPath", "PI_PATH", "bash", "sh", "cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh"]));
// req: R-3160
await check("seal: R-3160 inline-code flags", async () => assert.deepEqual((await configModule()).INLINE_FLAGS, ["-e", "-p", "--eval", "--print", "--input-type"]));
// req: R-3153 R-3154
await check("seal: launch impact labels", async () => assert.deepEqual((await configModule()).IMPACT_LABELS, { launch: "[launch/path]", blind: "always-run tests (blind reach):", untraced: "untraced tests:", unlinked: "test modules link no mapped module" }));
process.exitCode = failures ? 1 : 0;
