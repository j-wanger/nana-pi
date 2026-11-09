/**
 * @module packages/nana-pack/tests/win-shards.test.mjs
 * @purpose Pin Windows sharding, CI gates, record aggregation and partial reruns.
 * @inputs Real runner and workflow bytes, real collected paths and injected GitHub responses.
 * @outputs Must-meet PASS/FAIL lines.
 * @effects disk (OS temporary fixtures), process (bounded copied-runner children).
 * @errors Assertion failures set exit code 1.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
import * as runnerConfig from "../lib/test-runner-config.mjs";
import { readCiRecords } from "../lib/ci-records.mjs";
import { proveCiSuite } from "../lib/land-ci.mjs";
import { mainCi } from "../lib/main-ci.mjs";
import { ciFixture as landFixture, executeCi, git } from "./land-fixtures.mjs";

const repo = fileURLToPath(new URL("../../../", import.meta.url));
const td = tmpDir(path.join(os.tmpdir(), "win-shards-"));
const workflow = fs.readFileSync(path.join(repo, ".github/workflows/ci.yml"), "utf8");
const sha = "a".repeat(40);
const check = async (title, fn) => {
	const timer = setTimeout(() => { console.log("FAIL", title, "case limit"); process.exit(1); }, 120000);
	try { await fn(); console.log("PASS", title); }
	catch (error) { console.log("FAIL", title, error.stack); process.exitCode = 1; }
	finally { clearTimeout(timer); }
};
function collected() {
	const files = [];
	const take = (dir) => { if (fs.existsSync(path.join(repo, dir))) for (const name of fs.readdirSync(path.join(repo, dir)).sort()) if (name.endsWith(".test.mjs")) files.push(`${dir}/${name}`); };
	for (const pkg of fs.readdirSync(path.join(repo, "packages")).sort()) take(`packages/${pkg}/tests`);
	take("apps/bench/test");
	return files;
}
function fixtureRoot(name, files) {
	const root = path.join(td, name);
	fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
	fs.copyFileSync(path.join(repo, "scripts/test.mjs"), path.join(root, "scripts/test.mjs"));
	// Copy the runner's real dependency closure, not a substitute implementation.
	const copy = (rel, seen = new Set()) => {
		if (seen.has(rel)) return; seen.add(rel);
		const source = fs.readFileSync(path.join(repo, rel), "utf8");
		for (const match of source.matchAll(/from\s+"(\.[^"]+\.mjs)"/g)) {
			const next = path.posix.normalize(path.posix.join(path.posix.dirname(rel), match[1]));
			fs.mkdirSync(path.dirname(path.join(root, next)), { recursive: true });
			fs.copyFileSync(path.join(repo, next), path.join(root, next)); copy(next, seen);
		}
	};
	copy("scripts/test.mjs");
	for (const [file, body] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), body); }
	return root;
}
function execute(root, args, record = path.join(td, "record.json")) {
	return spawnSync(process.execPath, [path.join(root, "scripts/test.mjs"), ...args], {
		cwd: root, encoding: "utf8", timeout: 30000,
		env: { ...process.env, NANA_TEST_SELFTEST: "0", NANA_SUITE_RECORD_FILE: record, PROBE_OUT: root, TMPDIR: td, TEMP: td, TMP: td },
	});
}
const run = { id: 71, workflow_id: 1, run_number: 1, run_attempt: 2, name: "ci", head_sha: sha, head_branch: "main", path: ".github/workflows/ci.yml", event: "push", status: "completed", conclusion: "success" };
const leg = (index) => `windows-latest-shard-${index}-of-3`;
const value = (index, failed = false) => ({ schema: 1, platform: "win32", filters: [], shard: { index, count: 3 }, files: [{ path: `file-${index}.test.mjs`, label: failed ? "FAIL" : "PASS", seconds: index }], unnamedFailures: [], exitCode: failed ? 1 : 0, jobs: 4, wallSeconds: index * 10, fileTimeoutMs: 900000 });
function ciFixture({ old = false, outcome = "success", absent, rerun, missingLatest = false, reversed = false, noStart = false } = {}) {
	const items = old ? [{ leg: "windows-latest", attempt: 1, record: { ...value(1), shard: undefined } }] : [1, 2, 3].filter((i) => i !== absent).map((i) => ({ leg: leg(i), attempt: 1, record: value(i, rerun === i ? !reversed : outcome === "failure" && i === 2) }));
	if (rerun && !missingLatest) items.push({ leg: leg(rerun), attempt: 2, record: value(rerun, reversed) });
	items.push(...["macos-latest", "ubuntu-latest"].map((leg) => ({ leg, attempt: 1, record: { ...value(1), platform: leg === "macos-latest" ? "darwin" : "linux", shard: undefined } })));
	const jobs = (old ? ["windows-latest"] : [leg(1), leg(2), leg(3)]).filter((name) => name !== leg(absent)).map((name) => ({ name: `suite (${name})`, status: "completed", conclusion: name === leg(rerun) ? (reversed ? "failure" : "success") : name === leg(2) ? outcome : "success", run_attempt: run.run_attempt, started_at: noStart ? undefined : `2026-11-07T0${name === leg(rerun) ? 2 : 0}:30:00Z` }));
	jobs.push(...["macos-latest", "ubuntu-latest"].map((name) => ({ name: `suite (${name})`, status: "completed", conclusion: "success", run_attempt: 1 })), ...["macos-latest", "windows-latest"].flatMap((os) => ["ceiling", "floor"].map((pi) => ({ name: `install-check (${os}, ${pi})`, status: "completed", conclusion: "success", run_attempt: 1 }))));
	const artifacts = items.map((item, i) => ({ id: i + 1, name: `suite-record-${item.leg}-${item.attempt}`, created_at: `2026-11-07T0${item.attempt}:00:00Z` }));
	const runGit = (_cwd, args) => ({ status: 0, stdout: args[0] === "remote" ? "https://github.com/example/project.git\r\n" : sha });
	const runGh = (_cwd, args) => {
		if (args[0] === "repo") return { status: 0, stdout: JSON.stringify({ nameWithOwner: "example/project" }) };
		if (args[0] === "api") return { status: 0, stdout: JSON.stringify(args.at(-1).includes("/jobs?") ? { jobs } : args.at(-1).includes("/artifacts?") ? { artifacts } : { total_count: 1, workflow_runs: [run] }) };
		assert.equal(args[0], "run");
		const artifact = artifacts.find((entry) => entry.name === args[args.indexOf("--name") + 1]);
		const folder = args[args.indexOf("--dir") + 1]; fs.mkdirSync(folder, { recursive: true });
		fs.writeFileSync(path.join(folder, "record.json"), JSON.stringify(items[artifact.id - 1].record)); return { status: 0 };
	};
	const records = readCiRecords([sha], { cwd: td, runGit, runGh, tempRoot: td, writeLine: () => {} });
	const main = mainCi({ cwd: td, env: {}, runGit, runGh, tempRoot: td, writeLine: () => {} });
	const fixture = landFixture("shards", { workflowOnMain: true });
	const land = executeCi(fixture, [run], { runGh, platform: "win32", keepLandCiRecords: () => ({ lines: [], notes: [] }) });
	const unchanged = git(fixture.main, "rev-parse", "HEAD") !== fixture.tip;
	return { proof: proveCiSuite(records, [run], "win32"), main, land, unchanged };
}

// req: R-3815
await check("M1: real file shards are stable disjoint and complete across path spellings", () => {
	const files = collected(); assert(files.length > 100);
	for (let count = 1; count <= 4; count++) {
		const sets = Array.from({ length: count }, (_, i) => runnerConfig.shardFiles(files, { index: i + 1, count }));
		assert.deepEqual(sets.flat().sort(), [...files].sort()); assert.equal(new Set(sets.flat()).size, files.length);
		for (let i = 0; i < count; i++) assert.deepEqual(runnerConfig.shardFiles(files.map((f) => f.replaceAll("/", "\\")), { index: i + 1, count }).map((f) => f.replaceAll("\\", "/")), sets[i]);
	}
});
// req: R-3816
await check("M2: bad shards refuse before any file executes", () => {
	assert.equal(runnerConfig.SHARD_FLAG, "--shard=");
	const root = fixtureRoot("bad", { "packages/probe/tests/a.test.mjs": 'import fs from "node:fs"; fs.writeFileSync(process.env.PROBE_OUT + "/ran", "yes"); console.log("PASS ran");' });
	for (const args of [["--shard=0/3"], ["--shard=4/3"], ["--shard=a/b"], ["--shard=1/3", "--self-test"]]) {
		const result = execute(root, args); assert.equal(result.status, 1); assert.match(result.stdout, /\[runner\] bad --shard argument:/); assert(!fs.existsSync(path.join(root, "ran")));
	}
});
// req: R-3817
await check("M3: CI runs three Windows shards with distinct artifacts and unchanged other legs", () => {
	for (let i = 1; i <= 3; i++) assert(workflow.includes(`"leg":"${leg(i)}","shard":"${i}/3"`));
	assert.equal((workflow.match(/"os":"windows-latest"/g) ?? []).length, 3);
	for (const os of ["macos-latest", "ubuntu-latest"]) assert(workflow.includes(`"leg":"${os}","shard":""`));
	assert(workflow.includes("--shard=${{ matrix.shard }}"));
	assert(workflow.includes("name: suite (${{ matrix.leg }})"));
	assert(workflow.includes("name: suite-record-${{ matrix.leg }}-${{ github.run_attempt }}"));
	assert(workflow.includes("continue-on-error: ${{ matrix.os == 'ubuntu-latest' }}"));
});
// req: R-3818
await check("M4: land and main require every successful Windows shard", () => {
	const good = ciFixture(); assert.equal(good.proof.ok, true); assert.equal(good.main.red, false); assert.equal(good.land.code, 0, good.land.text); assert.equal(good.land.suiteRan, false);
	assert.equal(good.proof.records.length, 1); assert.equal(good.proof.records[0].record.wallSeconds, 60); assert.equal(good.proof.records[0].record.files.length, 3);
	for (const options of [{ outcome: "failure" }, { outcome: "cancelled" }, { outcome: "skipped" }, { absent: 2 }]) {
		const result = ciFixture(options); assert.equal(result.proof.ok, false, JSON.stringify(options)); assert.equal(result.main.red, true, JSON.stringify(options)); assert.equal(result.land.code, 1, result.land.text); assert.equal(result.land.suiteRan, false); assert(result.unchanged);
	}
});
// req: R-3819
await check("M5: historical single-record Windows runs still pass both readers", () => {
	const result = ciFixture({ old: true }); assert.equal(result.proof.ok, true); assert.equal(result.main.red, false); assert.equal(result.land.code, 0, result.land.text); assert.equal(result.land.suiteRan, false);
});
// req-candidate: R-3820 (the seat must still measure this lane's real hosted CI run)
await check("M6: CI reports each Windows shard's wall time and warns without failing at 20 minutes", () => {
	assert.match(workflow, /NANA_CI_SHARD_MAX_SECONDS: "1200"/);
	const script = workflow.match(/\/\/ win-shards wall check begin\n([\s\S]*?)\n\s*\/\/ win-shards wall check end/)?.[1]; assert(script, "wall check exists");
	const source = script.split("\n").map((line) => line.replace(/^ {10}/, "")).join("\n");
	const record = path.join(td, "wall.json"), summary = path.join(td, "summary.md");
	for (const [seconds, warning] of [[1199.9, false], [1200, true], [1200.1, true]]) {
		fs.writeFileSync(record, JSON.stringify({ wallSeconds: seconds }));
		const result = spawnSync(process.execPath, ["--input-type=module", "-e", source], { encoding: "utf8", timeout: 10000, env: { ...process.env, NANA_SUITE_RECORD_FILE: record, GITHUB_STEP_SUMMARY: summary, NANA_CI_SHARD_MAX_SECONDS: "1200" } });
		assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, new RegExp(`${seconds}s`));
		assert.equal(result.stdout.includes("::warning::"), warning, result.stdout);
		assert(fs.readFileSync(summary, "utf8").includes(String(seconds)));
	}
});
// req: R-3821
await check("M7: release blocks each failed cancelled or skipped Windows shard and Linux stays advisory", () => {
	const release = workflow.split("\n  release:\n")[1]; assert(release);
	assert.match(release, /needs: \[suite, install-check\]/);
	assert.match(release, /if: github.event_name == 'push' && github.ref == 'refs\/heads\/main' && needs.suite.result == 'success' && needs.install-check.result == 'success'/);
	assert(!/always\(\)|!cancelled\(\)/.test(release.split("steps:")[0]));
	const matrix = [...workflow.matchAll(/"leg":"(windows-latest-shard-\d-of-3)"/g)].map((m) => m[1]); assert.equal(matrix.length, 3);
	const required = [...release.match(/^    if: (.+)$/m)[1].matchAll(/needs.suite.outputs.shard(\d+) == 'success'/g)].map((m) => Number(m[1]));
	assert.deepEqual(required, [1, 2, 3]);
	assert(workflow.includes('run: echo "shard${SHARD%%/*}=success" >> "$GITHUB_OUTPUT"'));
	assert(workflow.includes("if: ${{ success() && matrix.os == 'windows-latest' }}"));
	for (const index of required) assert(workflow.includes(`shard${index}: \${{ steps.shard-result.outputs.shard${index} }}`));
	const releaseMayRun = (results) => required.every((index) => results[index - 1] === "success");
	assert(releaseMayRun(matrix.map(() => "success")));
	for (const index of matrix.keys()) for (const state of ["failure", "cancelled", "skipped"]) assert(!releaseMayRun(matrix.map((_, i) => i === index ? state : "success")));
	assert(workflow.includes("continue-on-error: ${{ matrix.os == 'ubuntu-latest' }}"));
});
// req: R-3822
await check("M8: partial reruns select the latest execution per shard and count each file once", () => {
	const good = ciFixture({ rerun: 2 }); assert.equal(good.proof.ok, true); assert.equal(good.main.red, false); assert.equal(good.land.code, 0, good.land.text); assert.equal(good.land.suiteRan, false);
	assert.deepEqual(good.proof.records[0].record.files.map((f) => f.path).sort(), ["file-1.test.mjs", "file-2.test.mjs", "file-3.test.mjs"]);
	for (const options of [{ rerun: 2, reversed: true }, { rerun: 2, missingLatest: true }, { rerun: 2, noStart: true }]) { const result = ciFixture(options); assert.equal(result.proof.ok, false); assert.equal(result.main.red, true); assert.equal(result.land.code, 1, result.land.text); assert.equal(result.land.suiteRan, false); assert(result.unchanged); }
});
// req: R-3823
await check("M9: real sharded two-job runner executes only assigned files and isolates RUN_ALONE", () => {
	const alone = Object.keys(runnerConfig.RUN_ALONE).find((f) => !f.includes("nana-knowledge"));
	const names = [alone, ...Array.from({ length: 18 }, (_, i) => `packages/probe/tests/file-${i}.test.mjs`)];
	const body = (name, partner) => `import fs from "node:fs"; import path from "node:path";
		const file = path.join(process.env.PROBE_OUT, ${JSON.stringify(path.basename(name) + ".jsonl")});
		const start = Date.now(); fs.writeFileSync(file + ".ready", "ready");
		const partner = ${JSON.stringify(partner ? path.basename(partner) + ".jsonl.ready" : null)};
		const deadline = Date.now() + 15000;
		while (partner && !fs.existsSync(path.join(process.env.PROBE_OUT, partner)) && Date.now() < deadline) await new Promise(r => setTimeout(r, 20));
		await new Promise(r => setTimeout(r, 100));
		fs.appendFileSync(file, JSON.stringify({start, end: Date.now()}) + "\\n"); console.log("PASS ran");`;
	for (let index = 1; index <= 3; index++) {
		const assigned = runnerConfig.shardFiles(names, { index, count: 3 });
		const partners = assigned.filter((name) => name !== alone).sort().slice(0, 2);
		const root = fixtureRoot(`execution-${index}`, Object.fromEntries(names.map((name) => [name, body(name, partners.includes(name) ? partners.find((other) => other !== name) : null)])));
		const recordFile = path.join(root, "suite.json");
		const result = execute(root, [`--shard=${index}/3`, "--jobs=2"], recordFile); assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		const record = JSON.parse(fs.readFileSync(recordFile, "utf8")); assert.deepEqual(record.shard, { index, count: 3 }); assert.deepEqual(record.files.map((f) => f.path).sort(), [...assigned].sort());
		const intervals = new Map();
		for (const name of names) {
			const file = path.join(root, path.basename(name) + ".jsonl");
			assert.equal(fs.existsSync(file), assigned.includes(name), name);
			if (assigned.includes(name)) { const lines = fs.readFileSync(file, "utf8").trim().split("\n"); assert.equal(lines.length, 1); intervals.set(name, JSON.parse(lines[0])); }
		}
		const overlap = (a, b) => a.start < b.end && b.start < a.end;
		const ordinary = [...intervals].filter(([name]) => name !== alone).map(([, iv]) => iv); assert(ordinary.some((a, i) => ordinary.some((b, j) => i !== j && overlap(a, b))));
		if (intervals.has(alone)) assert(ordinary.every((iv) => !overlap(iv, intervals.get(alone))));
	}
});
fs.rmSync(td, { recursive: true, force: true });
