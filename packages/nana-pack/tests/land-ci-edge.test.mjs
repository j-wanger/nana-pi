/**
 * @module packages/nana-pack/tests/land-ci-edge.test.mjs
 * @purpose Pin land CI edge and skip checks.
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

// req: R-2589 R-3490 R-3491
check("R-2589: a CI read that cannot complete refuses before the suite and names the cause", () => {
	const originListFailure = ciFixture("origin-list-failure");
	assertCiRefused(originListFailure, [], /git remote failed.*injected remote-list failure/i, { runGit: (cwd, args) => args.join(" ") === "remote" ? { status: 128, stdout: "", stderr: "injected remote-list failure" } : gitRunner(cwd, args) });
	const originUrlFailure = ciFixture("origin-url-failure");
	assertCiRefused(originUrlFailure, [], /remote get-url origin failed.*injected origin failure/i, { runGit: (cwd, args) => args.join(" ") === "remote get-url origin" ? { status: 128, stdout: "", stderr: "injected origin failure" } : gitRunner(cwd, args) });
	const fixture = ciFixture("gh-failures");
	const ghCases = [
		[{ error: Object.assign(new Error("spawn gh ENOENT"), { code: "ENOENT" }), status: null, stdout: "", stderr: "" }, /gh.*PATH/i],
		[{ status: 4, stdout: "", stderr: "To get started with GitHub CLI, please run:  gh auth login\nmore" }, /gh.*To get started with GitHub CLI/i],
		[{ status: 1, stdout: "", stderr: "error connecting to api.github.com\ncheck your internet connection or https:\/\/githubstatus.com" }, /error connecting to api\.github\.com/i],
		[{ status: 1, stdout: "", stderr: "Get api.github.com: proxyconnect tcp: connection refused\nsecond" }, /proxyconnect tcp: connection refused/i],
		[{ error: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }), status: null, signal: "SIGTERM", stdout: "", stderr: "" }, /timed out.*30000/i],
	];
	for (const [answer, pattern] of ghCases) assertCiRefused(fixture, [], pattern, { runGh: () => answer });
	for (const stdout of ["not json", "null", "[]", "1", "{}", '{"message":"Not Found"}', '{"workflow_runs":[]}', '{"total_count":"1","workflow_runs":[]}', '{"workflow_runs":{}}', runList([null]), runList([{ ...workflowRun(), status: undefined }]), runList([{ ...workflowRun(), run_number: undefined }]), runList([{ ...workflowRun(), workflow_id: undefined }])])
		assertCiRefused(fixture, [], /not a workflow-run list/i, { runGh: () => ({ status: 0, stdout, stderr: "" }) });
	if (process.platform !== "win32") {
		const slow = ciFixture("slow-gh"); const bin = path.join(slow.root, "bin"); mkdirSync(bin); const gh = path.join(bin, "gh"); writeFileSync(gh, "#!/bin/sh\nsleep 2\nprintf '%s' '{\"total_count\":0,\"workflow_runs\":[]}'\n"); chmodSync(gh, 0o755);
		const runner = nanaLand.ghDefault({ timeoutMs: 200, maxBuffer: 1024 });
		assertCiRefused(slow, [], /timed out.*200/i, { runGh: (cwd, args, options) => runner(cwd, args, { ...options, env: { ...options.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` } }) });
	}
	const missing = ciFixture("real-missing-gh"); const empty = path.join(missing.root, "empty-bin"); mkdirSync(empty);
	const runner = nanaLand.ghDefault();
	assertCiRefused(missing, [], /gh.*PATH/i, { runGh: (cwd, args, options) => runner(cwd, args, { ...options, env: { ...options.env, PATH: empty } }) });
	const childFixture = ciFixture("missing-gh-child"); ensureCiReview(childFixture); const before = git(childFixture.main, "rev-parse", "HEAD");
	const locate = process.platform === "win32" ? ["where.exe", ["git"]] : ["which", ["git"]]; const gitPath = execFileSync(locate[0], locate[1], { encoding: "utf8" }).trim().split(/\r?\n/)[0];
	const childBin = path.join(childFixture.root, "node-git-bin"); mkdirSync(childBin);
	let childPath;
	if (process.platform === "win32") {
		childPath = path.dirname(gitPath);
	} else {
		for (const [name, real] of [["node", process.execPath], ["git", gitPath]]) symlinkSync(real, path.join(childBin, name));
		childPath = childBin;
	}
	const childEnv = { ...process.env, HOME: childFixture.home, USERPROFILE: childFixture.home, PATH: childPath };
	const extensions = process.platform === "win32" ? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";") : [""];
	const ghResolves = childPath.split(path.delimiter).some((dir) => extensions.some((extension) => existsSync(path.join(dir, `gh${extension}`))));
	if (ghResolves) console.log("SKIP R-2589 child no-gh assertions: gh resolves on the isolated node/git PATH");
	else {
		const suite = `${JSON.stringify(process.execPath)} -e ${JSON.stringify("process.exit(0)")}`;
		const child = spawnSync(process.execPath, [fileURLToPath(new URL("../bin/nana-land.mjs", import.meta.url)), "merge", "--tree", childFixture.feature, "--main", childFixture.main, "--suite", suite, "--reviewed", childFixture.reviewed[0]], { cwd: childFixture.feature, env: childEnv, encoding: "utf8", timeout: 30000 });
		assert.equal(child.status, 1, `${child.stdout}\n${child.stderr}`); assert.match(child.stdout, /^refused:.*gh.*PATH/im); assert.equal(git(childFixture.main, "rev-parse", "HEAD"), before);
	}
});

// req: R-2590
check("R-2590: a repository or tip without GitHub CI skips the CI read and notes why", () => {
	const scenarios = [
		["no-origin", { origin: null }, /no origin remote/],
		["local", { origin: "LOCAL" }, /origin is not a github\.com repository URL/],
		["gitlab", { origin: "https://gitlab.com/example/fixture.git" }, /origin is not a github\.com repository URL/],
		["substring", { origin: "https://example.com/github.com/fixture.git" }, /origin is not a github\.com repository URL/],
		["uppercase", { origin: "https://GitHub.com/example/fixture.git" }, /origin is not a github\.com repository URL/],
		["credentials", { origin: "https://user:token@github.com/example/fixture.git" }, /origin is not a github\.com repository URL/],
		["deleted", { workflowOnMain: true, workflowOnTip: false }, /the tip tracks no workflow/],
		["readme", { workflowPath: ".github/workflows/README.md" }, /the tip tracks no workflow/],
		["nested", { workflowPath: ".github/workflows/sub/x.yml" }, /the tip tracks no workflow/],
	];
	for (const [name, settings, reason] of scenarios) {
		const fixture = ciFixture(`skip-${name}`, settings); let ghCalls = 0; const out = executeCi(fixture, [], { runGh: () => { ghCalls++; throw new Error("gh must not run"); } });
		assert.equal(out.code, 0, out.text); assert.equal(out.suiteRan, true); assert.equal(ghCalls, 0); const notes = out.text.split(/\r?\n/).filter((line) => line.startsWith(`${LAND_NOTE_PREFIX} note: CI not read:`)); assert.equal(notes.length, 1, out.text); assert.match(notes[0], reason);
	}
	const lineEndings = ciFixture("remote-lines"); let ghCallsForLines = 0;
	const lineOut = executeCi(lineEndings, [], { runGit: (cwd, args) => args.join(" ") === "remote" ? { status: 0, stdout: "upstream \t\r\nbackup", stderr: "" } : gitRunner(cwd, args), runGh: () => { ghCallsForLines++; throw new Error("gh must not run"); } });
	assert.equal(lineOut.code, 0, lineOut.text); assert.equal(ghCallsForLines, 0); assert.match(lineOut.text, /CI not read: no origin remote/);
	const tipOnly = ciFixture("tip-only"); let ghCalls = 0; let suiteStarted = false; const out = executeCi(tipOnly, [workflowRun()], {
		runGh: () => { if (!suiteStarted) ghCalls++; return { status: 0, stdout: runList([workflowRun()]), stderr: "" }; },
		runCommand: () => { suiteStarted = true; return { status: 0, stdout: "", stderr: "" }; },
	});
	assert.equal(out.code, 0, out.text); assert.equal(ghCalls, 1);
});

process.exit(failures ? 1 : 0);
