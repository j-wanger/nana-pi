/**
 * @module packages/nana-pack/tests/main-ci.test.mjs
 * @purpose Pin main push CI reporting and seat-only identity-scanned issue creation.
 * @inputs Injected gh and git, temporary suite-record downloads and identity scanner.
 * @outputs Requirement-tagged PASS or FAIL lines.
 * @effects disk (OS temporary fixtures only).
 * @errors Failed assertions set exit code 1.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { mainCi } from "../lib/main-ci.mjs";
import { countIdentityWords } from "../../../scripts/identity-scan.mjs";
import { RECORD_SCHEMA, CI_WORKFLOW_RUN_PATH } from "../lib/suite-records-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { check } from "./profile-fixture.mjs";
import { artifactGh, ciFixture, commit, executeCi, git, gitRunner, mergeSnapshot } from "./land-fixtures.mjs";

const root = tmpDir(path.join(os.tmpdir(), "main-ci-"));
const sha = "a".repeat(40);
const legs = ["macos-latest", "ubuntu-latest", "windows-latest"];
const run = (id, overrides = {}) => ({ id, path: CI_WORKFLOW_RUN_PATH, name: "ci", head_branch: "main", head_sha: sha, event: "push", status: "completed", conclusion: "success", run_attempt: 1, ...overrides });
function fixture({ runs = [run(20), run(30, { event: "pull_request" })], failLeg = "windows-latest", failJob, missing, duplicate = false, role, post = false, file = "packages/p/tests/red.test.mjs", scanFailure = false } = {}) {
	const calls = [], output = [], scans = [];
	const jobs = legs.map((leg) => ({ name: `suite (${leg})`, status: "completed", conclusion: "success", run_attempt: 1, started_at: "2026-10-30T00:00:00Z" }));
	jobs.push(...["macos-latest", "windows-latest"].flatMap(os => ["ceiling", "floor"].map(pi => ({ name: `install-check (${os}, ${pi})`, status: "completed", conclusion: "success" }))));
	if (failJob) jobs.push({ name: failJob, status: "completed", conclusion: "failure" });
	const runGh = (_cwd, args) => {
		calls.push(args);
		let answer;
		if (args[0] === "api") {
			const endpoint = args.at(-1);
			if (endpoint === "user") answer = { login: "example" };
			else if (endpoint.includes("/jobs?")) answer = { jobs };
			else if (endpoint.includes("/artifacts?")) answer = { artifacts: legs.filter((leg) => leg !== missing).map((leg, i) => ({ id: i + 1, name: `suite-record-${leg}-1`, created_at: "2026-10-30T01:00:00Z" })) };
			else answer = { workflow_runs: runs };
		} else if (args[0] === "repo" && args[1] === "view") answer = { nameWithOwner: "example/project" };
		else if (args[0] === "run" && args[1] === "download") {
			const leg = args[args.indexOf("--name") + 1].replace(/^suite-record-/, "").replace(/-1$/, "");
			const dir = args[args.indexOf("--dir") + 1];
			fs.mkdirSync(dir, { recursive: true });
			const failed = args[2] === "20" && leg === failLeg;
			fs.writeFileSync(path.join(dir, "record.json"), JSON.stringify({ schema: RECORD_SCHEMA, exitCode: failed ? 1 : 0, platform: leg, wallSeconds: 1, jobs: 4,
				files: [{ path: file, label: failed ? "FAIL" : "PASS", seconds: 1 }] }));
			return { status: 0 };
		} else if (args[0] === "issue" && args[1] === "list") {
			answer = duplicate ? [{ title: args[args.indexOf("--search") + 1].replace(/ in:title$/, "") }] : [];
		} else if (args[0] === "issue" && args[1] === "create") return { status: 0, stdout: "created" };
		else throw new Error(`unexpected gh: ${args.join(" ")}`);
		return { status: 0, stdout: JSON.stringify(answer) };
	};
	const config = { wordDigests: [createHash("sha256").update("privateword").digest("hex")], wordLengths: [11], allowlist: [] };
	const result = mainCi({ cwd: root, post, env: role ? { NANA_ROLE: role } : {}, runGh,
		runGit: (_cwd, args) => ({ status: 0, stdout: args[0] === "remote" ? "https://github.com/example/project.git\r\n" : sha }),
		scanText: (text) => { scans.push(text); calls.push(["scan"]); return { status: scanFailure || countIdentityWords({ content: text, config }).some(Boolean) ? 1 : 0 }; },
		tempRoot: root, writeLine: (line) => output.push(line) });
	return { ...result, calls, scans, output: output.join("\n"), creates: calls.filter((args) => args[0] === "issue" && args[1] === "create") };
}

// req: R-3183
await check("R-3183: main push reds include required and advisory legs with scanned deduplicated seat-only posting", () => {
	const red = fixture();
	assert.equal(red.red, true); assert.match(red.output, /windows-latest.*packages\/p\/tests\/red.test.mjs/);
	assert.match(red.output, /--post/);
	assert(red.calls.filter((args) => args[0] === "run").every((args) => args[2] === "20"), "read only push artifacts, never same-SHA PR artifacts");
	const greenRunRedLeg = fixture({ failLeg: "ubuntu-latest" });
	assert.equal(greenRunRedLeg.red, true); assert.match(greenRunRedLeg.output, /ubuntu-latest.*red.test.mjs/);
	for (const failJob of ["install-check (windows-latest, floor)", "release"]) {
		const result = fixture({ failLeg: null, failJob }); assert.equal(result.red, true); assert(result.output.includes(failJob));
	}
	const newer = fixture({ runs: [run(40, { status: "in_progress", conclusion: null }), run(20)] });
	assert.equal(newer.red, true); assert.match(newer.output, /40.*unfinished/); assert.equal(newer.code, 1);
	const cancelled = fixture({ post: true, runs: [run(40, { conclusion: "cancelled" }), run(10, { conclusion: "cancelled" }), run(20), run(50, { conclusion: "cancelled" })] });
	const allCancelled = fixture({ post: true, runs: [run(40, { event: "pull_request" }), run(30, { conclusion: "cancelled" }), run(20, { conclusion: "cancelled" })] });
	assert.deepEqual({ cancelledCode: cancelled.code, allCancelledCode: allCancelled.code, allCancelledPosts: allCancelled.creates.length },
		{ cancelledCode: 1, allCancelledCode: 1, allCancelledPosts: 0 }, "the newest cancelled main run blocks without posting or falling back to old green");
	assert.equal(cancelled.creates.length, 0);
	assert.match(cancelled.output, /^Main CI: run 50 .* red$/m);
	assert(cancelled.calls.filter((args) => args[0] === "run").every((args) => args[2] === "50"), "do not download an older run");
	assert.match(allCancelled.output, /^Main CI: run 30 .* red$/m);
	assert.match(allCancelled.output, /cancelled main run; nothing to post/);
	assert.equal(allCancelled.scans.length, 0);
	assert(!allCancelled.calls.some((args) => args[0] === "issue"), "never prepare or post an issue for cancelled runs");
	const missing = fixture({ failLeg: null, missing: "windows-latest" });
	assert.equal(missing.red, true); assert.match(missing.output, /windows-latest.*no record/);
	const green = fixture({ failLeg: null, post: true }); assert.equal(green.red, false); assert.equal(green.creates.length, 0);
	const posted = fixture({ post: true });
	assert.equal(posted.code, 0); assert.equal(posted.creates.length, 1);
	const args = posted.creates[0], title = args[args.indexOf("--title") + 1], body = args[args.indexOf("--body") + 1];
	assert.equal(args[args.indexOf("--label") + 1], "next"); assert.match(body, /^Seat:/);
	assert(!title.includes("20") && !title.includes(sha.slice(0, 8)), "title deduplicates recurring failures across runs");
	assert(body.includes("20") && body.includes(sha.slice(0, 8)) && body.includes("windows-latest") && body.includes("packages/p/tests/red.test.mjs"));
	assert(!body.includes("https:") && !body.includes("example") && !body.includes("project"));
	assert.deepEqual(posted.scans, [`${title}\n${body}`]);
	assert(posted.calls.findIndex((args) => args[0] === "scan") < posted.calls.indexOf(posted.creates[0]));
	const duplicate = fixture({ post: true, duplicate: true }); assert.equal(duplicate.creates.length, 0); assert.equal(duplicate.code, 0);
	const hit = fixture({ post: true, file: "packages/privateword/tests/red.test.mjs" });
	assert.equal(hit.creates.length, 0); assert.notEqual(hit.code, 0); assert.match(hit.output, /identity scan/i);
	for (const role of ["worker", "reviewer"]) { const child = fixture({ role, post: true }); assert.equal(child.creates.length, 0); assert.notEqual(child.code, 0); }
});

// req: R-3183
await check("network replay: main evidence stays unreadable and land refuses until GitHub answers", () => {
	for (const failure of [{ status: 1, stderr: "net/http: TLS handshake timeout" }, { error: Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }), nanaTimeoutMs: 30000 }]) {
		const f = ciFixture("network", { workflowOnMain: true });
		commit(f.main, "package.json", '{"name":"nana-pi"}\n', "toolkit");
		git(f.feature, "merge", "--no-edit", "main"); f.tip = git(f.feature, "rev-parse", "HEAD");
		const mainSha = git(f.main, "rev-parse", "HEAD"), before = mergeSnapshot(f);
		const main = run(43165681762, { workflow_id: 1, run_number: 1, head_sha: mainSha }), lane = run(101, { workflow_id: 1, run_number: 2, head_sha: f.tip, event: "pull_request", head_branch: "integration" });
		const items = [main, lane].flatMap(r => legs.map(leg => ({ run: r.id, leg, attempt: 1, record: { schema: RECORD_SCHEMA, platform: leg, exitCode: 0, files: [{ path: "fixture.test.mjs", label: "PASS" }] } })));
		const artifacts = artifactGh([main, lane], items);
		const jobs = [...legs.map(leg => `suite (${leg})`), ...["macos-latest", "windows-latest"].flatMap(os => ["ceiling", "floor"].map(pi => `install-check (${os}, ${pi})`))].map(name => ({ name, status: "completed", conclusion: "success", run_attempt: 1 }));
		let failures = 4;
		const runGh = (cwd, args, opts) => {
			assert.notEqual(args[0], "issue", "network failures never authorize posting");
			if (args[0] === "repo") return { status: 0, stdout: '{"nameWithOwner":"example/fixture"}' };
			if (args.at(-1).includes("/actions/workflows/")) return { status: 0, stdout: JSON.stringify({ workflow_runs: [main] }) };
			if (args.at(-1).includes(`/runs/${main.id}/artifacts?`) && failures-- > 0) return failure;
			if (args.at(-1).includes("/jobs?")) return { status: 0, stdout: JSON.stringify({ jobs }) };
			return artifacts(cwd, args, opts);
		};
		const read = () => {
			const output = [];
			const result = mainCi({ cwd: f.main, runGh, runGit: gitRunner, tempRoot: f.root, env: {}, post: true, expectedSha: mainSha, writeLine: l => output.push(l) });
			return { ...result, text: output.join("\n") };
		};
		for (let i = 0; i < 3; i++) {
			const out = read(); assert.equal(out.code, 1); assert.notEqual(out.red, true); assert.equal(out.evidenceReadable, false, out.text);
			assert.match(out.text, /unreadable: GitHub did not answer; retry/); assert.doesNotMatch(out.text, /\bred\b|--post|missing/);
		}
		const refused = executeCi(f, [lane], { runGh });
		assert.equal(refused.code, 1); assert.match(refused.text, /unreadable: GitHub did not answer; retry/); assert.doesNotMatch(refused.text, /--post/);
		assert.deepEqual(mergeSnapshot(f), before);
		assert.equal(read().red, false);
		const landed = executeCi(f, [lane], { runGh }); assert.equal(landed.code, 0, landed.text);
	}
});
