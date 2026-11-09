/**
 * @module packages/nana-pack/tests/land-ci-read.test.mjs
 * @purpose Pin land CI read and CI contract checks.
 * @inputs Nana-land fixtures and OS-temp Git repositories.
 * @outputs PASS/FAIL lines and a nonzero exit when a check fails.
 * @effects disk (temporary test repositories and review ledgers).
 * @errors Failed checks exit nonzero; unexpected exceptions fail the process.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { ciFixture, commit, ensureCiReview, executeCi, git, gitRunner, recordReview, repo, reviewTip, runList, tree, workflowRun } from "./land-fixtures.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import * as nanaLand from "../bin/nana-land.mjs";
const { parseLandArgs, runLand: executeLand, runCleanup } = nanaLand;
import { admit, complete, ledgerPaths, reviewTextPath, withReviewLedgerLock } from "../bin/review-round.mjs";
import { realPath } from "../lib/real-path.mjs";
import * as landConfig from "../lib/land-config.mjs";
const { LAND_NOTE_PREFIX, LAND_TIP_ENV } = landConfig;
import { COMPLETION_FILE, COVERAGE_ENV } from "../lib/runtime-map-config.mjs";
import { checkoutDrift, hashFile } from "../lib/runtime-map.mjs";

import { PI_REVIEW, TEST_LOCKED, assertCiRefused, recordTextReview, runLand, tallyRows, writeTallyRows } from "./land-checks.mjs";
let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); }
};

// req: R-2586 R-3490 R-3491
check("R-2586: a tip whose newest CI run of a workflow concluded other than success is refused before the suite", () => {
	const fixture = ciFixture("red");
	for (const [index, conclusion] of ["failure", "cancelled", "timed_out", "action_required", "neutral", "skipped", "stale", "startup_failure", null].entries()) {
		const run = workflowRun({ id: 200 + index, run_attempt: 2, conclusion });
		const out = assertCiRefused(fixture, [run], new RegExp(`ci run ${run.id} attempt 2.*${conclusion === null ? "null" : conclusion}`, "i")); assert.match(out.text, /ci/i);
		if (conclusion === "cancelled") assert.match(out.text, new RegExp(`gh run rerun ${run.id} --repo example/fixture`));
		if (conclusion === "failure") assert.match(out.text, new RegExp(`gh run rerun ${run.id} --repo example/fixture --failed`));
	}
	assertCiRefused(fixture, [workflowRun({ id: 210, run_number: 10 }), workflowRun({ id: 211, run_number: 11, conclusion: "failure" })], /ci run 211 attempt 1.*failure/i);
	assertCiRefused(fixture, [workflowRun({ workflow_id: 1, name: "one", id: 220, run_number: 40 }), workflowRun({ workflow_id: 2, name: "two", id: 221, run_number: 3, conclusion: "failure" })], /two run 221 attempt 1.*failure/i);
	assertCiRefused(fixture, [workflowRun({ workflow_id: 1, name: "same", id: 230 }), workflowRun({ workflow_id: 2, name: "same", id: 231, conclusion: "failure" })], /same run 231 attempt 1.*failure/i);
});

// req: R-2587
check("R-2587: a tip with no CI run, or with a newest run still queued or running, is refused before the suite", () => {
	const fixture = ciFixture("unfinished");
	assertCiRefused(fixture, [], new RegExp(`no CI run for ${fixture.tip.slice(0, 8)}`, "i"));
	for (const [index, status] of ["queued", "in_progress", "waiting", "requested", "pending"].entries()) {
		const run = workflowRun({ id: 300 + index, status, conclusion: null }); assertCiRefused(fixture, [run], new RegExp(`run ${run.id} attempt 1.*${status}`, "i"));
	}
	assertCiRefused(fixture, [workflowRun({ id: 310, run_attempt: 2, status: "in_progress", conclusion: "success" })], /run 310 attempt 2.*in_progress/i);
});

// req: R-2588
check("R-2588: the newest run of each workflow at its latest attempt decides, and the land names it", () => {
	const cases = [
		["attempt", [workflowRun({ id: 757, run_number: 757, run_attempt: 2, event: "push" }), workflowRun({ id: 756, run_number: 756 })], [/^ci: ci run 757 attempt 2 \(push\) success at /m]],
		["new-green", [workflowRun({ id: 411, run_number: 11 }), workflowRun({ id: 410, run_number: 10, conclusion: "failure" })], [/ci: ci run 411/]],
		["oldest-first", [workflowRun({ id: 420, run_number: 10, conclusion: "failure" }), workflowRun({ id: 421, run_number: 11 })], [/ci: ci run 421/]],
		["two", [workflowRun({ workflow_id: 1, name: "one", id: 430, run_number: 10 }), workflowRun({ workflow_id: 1, name: "one", id: 429, run_number: 9, conclusion: "failure" }), workflowRun({ workflow_id: 2, name: "two", id: 431, run_number: 2 })], [/ci: one run 430/, /ci: two run 431/]],
	];
	for (const [name, runs, patterns] of cases) {
		const fixture = ciFixture(`green-${name}`); const events = []; const out = executeCi(fixture, runs, { events });
		assert.equal(out.code, 0, out.text); assert.equal(out.suiteRan, true); for (const pattern of patterns) assert.match(out.text, pattern);
		assert.equal((out.text.match(/^ci: /gm) ?? []).length, patterns.length); assert(events.findIndex((event) => event.kind === "gh") < events.findIndex((event) => event.kind === "suite"));
		const beforeSuite = events.slice(0, events.findIndex((event) => event.kind === "suite"));
		assert.equal(beforeSuite.filter((event) => event.kind === "gh").length, 2); // verdict plus shard-record discovery
		assert.equal(beforeSuite.filter((event) => event.kind === "gh").some((event) => event.args.some((arg) => /\/jobs|\/attempts\//.test(arg))), false);
	}
});

// req: R-2591
check("R-2591: the CI read asks github.com for the full tip SHA in origin's repository", () => {
	const origins = ["https://github.com/example/fixture.git", "https://github.com/example/fixture", "git@github.com:example/fixture.git", "ssh://git@github.com/example/fixture.git"];
	const oldHost = process.env.GH_HOST, oldRepo = process.env.GH_REPO, oldColor = process.env.CLICOLOR_FORCE, oldForceTty = process.env.GH_FORCE_TTY;
	try {
		process.env.GH_HOST = "example.invalid"; process.env.GH_REPO = "wrong/other"; process.env.CLICOLOR_FORCE = "1"; process.env.GH_FORCE_TTY = "1";
		for (const [index, origin] of origins.entries()) {
			const fixture = ciFixture(`request-${index}`, { origin }); const calls = []; const out = executeCi(fixture, [workflowRun()], { runGh: (cwd, args, options) => { calls.push({ cwd, args, options }); return { status: 0, stdout: runList([workflowRun()]), stderr: "" }; } });
			assert.equal(out.code, 0, out.text); assert.equal(calls[0].cwd, path.resolve(fixture.main));
			assert.deepEqual(calls[0].args, ["api", "--hostname", landConfig.CI_HOST, `repos/example/fixture/actions/runs?head_sha=${fixture.tip}&per_page=${landConfig.CI_RUNS_PAGE_SIZE}`]);
			const expectedEnv = { ...process.env, CLICOLOR_FORCE: "0" }; for (const key of Object.keys(expectedEnv)) if (key.toUpperCase() === "GH_FORCE_TTY") delete expectedEnv[key];
			assert.deepEqual(calls[0].options.env, expectedEnv); assert.notEqual(calls[0].options.env, process.env);
		}
	} finally {
		if (oldHost === undefined) delete process.env.GH_HOST; else process.env.GH_HOST = oldHost;
		if (oldRepo === undefined) delete process.env.GH_REPO; else process.env.GH_REPO = oldRepo;
		if (oldColor === undefined) delete process.env.CLICOLOR_FORCE; else process.env.CLICOLOR_FORCE = oldColor;
		if (oldForceTty === undefined) delete process.env.GH_FORCE_TTY; else process.env.GH_FORCE_TTY = oldForceTty;
	}
	if (process.platform !== "win32") {
		const fixture = ciFixture("fake-gh-child"); ensureCiReview(fixture); const fakeBin = path.join(fixture.root, "fake-bin"); mkdirSync(fakeBin); const record = path.join(fixture.root, "gh-record.txt"); const fake = path.join(fakeBin, "gh");
		writeFileSync(fake, `#!/bin/sh\nprintf '%s\\n' "$PWD" "$@" >> ${JSON.stringify(record)}\nprintf '%s\\n' '--call--' >> ${JSON.stringify(record)}\nif { [ -n "$CLICOLOR_FORCE" ] && [ "$CLICOLOR_FORCE" != "0" ]; } || [ -n "$GH_FORCE_TTY" ]; then\n\tprintf '\\033[32m%s\\033[0m\\n' '${runList([workflowRun()])}'\nelse\n\tprintf '%s\\n' '${runList([workflowRun()])}'\nfi\n`); chmodSync(fake, 0o755);
		const gitPath = execFileSync("which", ["git"], { encoding: "utf8" }).trim(); const env = { ...process.env, HOME: fixture.home, USERPROFILE: fixture.home, PATH: `${fakeBin}${path.delimiter}${path.dirname(gitPath)}`, HTTPS_PROXY: "http://127.0.0.1:9", CLICOLOR_FORCE: "1", GH_FORCE_TTY: "1" };
		const suite = `${JSON.stringify(process.execPath)} -e ${JSON.stringify("process.exit(0)")}`;
		const child = spawnSync(process.execPath, [fileURLToPath(new URL("../bin/nana-land.mjs", import.meta.url)), "merge", "--tree", fixture.feature, "--main", fixture.main, "--suite", suite, "--reviewed", fixture.reviewed[0]], { cwd: fixture.feature, env, encoding: "utf8", timeout: 30000 });
		assert.equal(child.status, 0, `${child.stdout}\n${child.stderr}`); const lines = readFileSync(record, "utf8").trim().split("\n"); const firstEnd = lines.indexOf("--call--"); assert.equal(realpathSync(lines[0]), realpathSync(fixture.main)); assert.deepEqual(lines.slice(1, firstEnd), ["api", "--hostname", landConfig.CI_HOST, `repos/example/fixture/actions/runs?head_sha=${fixture.tip}&per_page=${landConfig.CI_RUNS_PAGE_SIZE}`]);
	}
});

// req: R-2592
check("R-2592: the pack README and the shared Land checklist say a land waits for the tip's CI", () => {
	const repoRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url))); const readme = readFileSync(path.join(repoRoot, "packages/nana-pack/README.md"), "utf8");
	assert(readme.includes("Where `origin` is on github.com and the tip tracks a workflow under `.github/workflows`, the helper refuses until the newest CI run of each workflow for the tip has passed at its latest attempt."));
});

// req: R-2586
// req: R-2587
// req: R-2589
// req: R-2590
// req: R-2591
check("seal: the land reads CI from origin on github.com, workflows in .github/workflows, 100 runs a page, within 30 seconds, and passes only completed success", () => {
	assert.equal(landConfig.CI_REMOTE, "origin", "R-2590"); assert.equal(landConfig.CI_HOST, "github.com", "R-2591"); assert.equal(landConfig.CI_WORKFLOW_DIR, ".github/workflows", "R-2590"); assert.deepEqual(landConfig.CI_WORKFLOW_EXTENSIONS, [".yml", ".yaml"], "R-2590");
	assert.equal(landConfig.CI_RUNS_PATH, "repos/<owner>/<repo>/actions/runs", "R-2591"); assert.equal(landConfig.CI_RUNS_PAGE_SIZE, 100, "R-2591"); assert.equal(landConfig.CI_READ_TIMEOUT_MS, 30000, "R-2589"); assert.equal(landConfig.CI_DONE_STATUS, "completed", "R-2587"); assert.equal(landConfig.CI_PASS_CONCLUSION, "success", "R-2586"); assert.equal(landConfig.CHILD_OUTPUT_MAX_BYTES, 16 * 1024 * 1024, "R-2589");
});

process.exit(failures ? 1 : 0);
