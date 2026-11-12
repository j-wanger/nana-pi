/**
 * @module packages/nana-pack/tests/land-merge.test.mjs
 * @purpose Pin land review text, merge and cleanup checks.
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
import { check as boundedCheck } from './profile-fixture.mjs';
import { cleanMergeFixture, executeCleanMerge, mergeSnapshot } from './land-fixtures.mjs';

{
const check = boundedCheck;
// req: R-3960
await check('M1: exact lane merges are covered and land with merge-tip CI', () => {
 const f = cleanMergeFixture('covered');
 const accepted = reviewTip(f.feature, f.home); f.reviewed = [`${accepted}=item`];
 git(f.feature, 'merge', '--no-ff', '--no-edit', f.capturedMain);
 // Coverage must propagate through more than one unreviewed merge, including an older main parent.
 const firstMerge = git(f.feature, 'rev-parse', 'HEAD');
 commit(f.main, 'later.txt', 'later main\n', 'later main');
 git(f.feature, 'merge', '--no-ff', '--no-edit', 'main');
 f.tip = git(f.feature, 'rev-parse', 'HEAD');
 const out = executeCleanMerge(f);
 assert.equal(out.code, 0, out.text); assert.equal(out.suites, 0);
 assert.equal(git(f.main, 'rev-parse', 'HEAD'), f.tip);
 assert(out.calls.filter(args => args.at(-1).includes('/actions/runs?')).every(args => args.at(-1).includes(`head_sha=${f.tip}&`)));
 withReviewLedgerLock(f.home, ({ rounds }) => assert(!rounds.some(row => [firstMerge, f.tip].includes(row.revision))));
});

// req: R-3961
await check('M2: a hidden merge edit is uncovered and named', () => {
 const f = cleanMergeFixture('hidden');
 f.reviewed = [`${reviewTip(f.feature, f.home)}=item`];
 git(f.feature, 'merge', '--no-ff', '--no-edit', f.capturedMain);
 writeFileSync(path.join(f.feature, 'lane.txt'), 'hidden edit\n');
 git(f.feature, 'add', 'lane.txt'); git(f.feature, 'commit', '--amend', '--no-edit');
 f.tip = git(f.feature, 'rev-parse', 'HEAD');
 const before = mergeSnapshot(f), out = executeCleanMerge(f);
 assert.equal(out.code, 1, out.text); assert.match(out.text, /uncovered commits/); assert(out.text.includes(f.tip));
 assert.deepEqual(mergeSnapshot(f), before); assert.equal(out.calls.length, 0);
});

// req: R-3963
await check('M4: moved main refuses with lane merge remedy and unchanged refs', () => {
 const f = cleanMergeFixture('must-merge-in-lane');
 const before = mergeSnapshot(f), out = executeCleanMerge(f);
 assert.equal(out.code, 1, out.text); assert.deepEqual(mergeSnapshot(f), before);
 for (const phrase of ['git merge main', 'push', 'CI', 'conflict resolutions and other edits need review']) assert(out.text.includes(phrase), out.text);
 assert.equal(out.suites, 0); assert.equal(out.calls.length, 0);
 git(f.feature, 'merge', '--no-ff', '--no-edit', 'main');
 f.tip = git(f.feature, 'rev-parse', 'HEAD');
 const landed = executeCleanMerge(f);
 assert.equal(landed.code, 0, landed.text); assert.equal(git(f.main, 'rev-parse', 'HEAD'), f.tip);
});
}
import { PI_REVIEW, TEST_LOCKED, assertCiRefused, recordTextReview, runLand, tallyRows, writeTallyRows } from "./land-checks.mjs";
let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); }
};

// req: R-977 R-3490 R-3491
check("successful land updates main checkout files and leaves tracked state clean", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-invocations-")); const main = repo(root, "main");
	writeFileSync(path.join(main, "remove.txt"), "remove me\n"); git(main, "add", "remove.txt"); git(main, "commit", "-m", "add removable file");
	const feature = tree(main, "integration");
	writeFileSync(path.join(feature, "base.txt"), "modified\n"); writeFileSync(path.join(feature, "added.txt"), "added\n");
	git(feature, "rm", "remove.txt"); git(feature, "add", "base.txt", "added.txt"); git(feature, "commit", "-m", "change files");
	const tip = git(feature, "rev-parse", "HEAD"); const calls = [];
	const runGit = (cwd, args) => { calls.push({ cwd, args }); try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; } catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: "" }; } };
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runGit, runCommand: () => ({ status: 0 }) });
	assert.equal(out.code, 0, out.text);
	assert.equal(calls.filter(({ cwd, args }) => cwd === main && args[0] === "merge" && args[1] === "--ff-only").length, 1);
	assert(calls.some(({ cwd, args }) => cwd === main && args.join(" ") === `merge --ff-only ${tip}`));
	assert.equal(git(main, "rev-parse", "HEAD"), tip); assert.equal(readFileSync(path.join(main, "base.txt"), "utf8"), "modified\n");
	assert.equal(readFileSync(path.join(main, "added.txt"), "utf8"), "added\n"); assert.equal(existsSync(path.join(main, "remove.txt")), false);
	assert.equal(git(main, "status", "--porcelain", "--untracked-files=no"), "");
});
// req: R-977
check("untracked collision refuses land without changing main", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-collision-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "collision.txt", "landed\n", "add collision");
	writeFileSync(path.join(main, "collision.txt"), "untracked stays\n"); const before = git(main, "rev-parse", "HEAD");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => ({ status: 0 }) });
	assert.notEqual(out.code, 0); assert.match(out.text, /refused|failed/i); assert.doesNotMatch(out.text, /HANDOFF Landed:|Session archive stub:|push command:/);
	assert.equal(git(main, "rev-parse", "HEAD"), before); assert.equal(git(main, "rev-parse", "refs/heads/main"), before);
	assert.equal(readFileSync(path.join(main, "collision.txt"), "utf8"), "untracked stays\n"); assert.notEqual(tip, before);
});
// req: R-977
check("branch switch at merge invocation refuses without a success report", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-merge-switch-")); const main = repo(root, "main");
	const initialMain = git(main, "rev-parse", "refs/heads/main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	git(main, "branch", "other", initialMain);
	const calls = []; let switched = false;
	const runGit = (cwd, args) => {
		calls.push({ cwd, args });
		if (cwd === main && args[0] === "merge" && !switched) { git(main, "checkout", "other"); switched = true; }
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runGit, runCommand: () => ({ status: 0 }) });
	assert(calls.some(({ cwd, args }) => cwd === main && args[0] === "merge"), "switch injection must run immediately before merge");
	assert.notEqual(out.code, 0); assert.match(out.text, /branch main/i); assert.doesNotMatch(out.text, /HANDOFF Landed:|Session archive stub:|push command:/);
	assert.equal(git(main, "rev-parse", "refs/heads/main"), initialMain); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "other")); assert.notEqual(tip, initialMain);
});
// req: R-977
check("main advancing during suite refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-cas-")); const main = repo(root, "main");
	const initialMain = git(main, "rev-parse", "refs/heads/main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	let advancedMain;
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => {
		commit(main, "parallel.txt", "parallel\n", "parallel"); advancedMain = git(main, "rev-parse", "refs/heads/main"); return { status: 0 };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /HEAD.*captured|main checkout/i);
	assert.notEqual(advancedMain, initialMain); assert.equal(git(main, "rev-parse", "refs/heads/main"), advancedMain); assert.notEqual(advancedMain, tip);
});
// req: R-2522
check("the land runs its suite with the source tip's full SHA in NANA_LAND_TIP", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-tip-env-")); const main = repo(root, "main");
	const mainBefore = git(main, "rev-parse", "HEAD");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	const output = path.join(root, "suite-tip.txt"); const probe = path.join(root, "write-tip.mjs");
	writeFileSync(probe, `import { writeFileSync } from "node:fs"; writeFileSync(process.argv[2], process.env.${LAND_TIP_ENV} ?? "");\n`);
	const suite = `${JSON.stringify(process.execPath)} ${JSON.stringify(probe)} ${JSON.stringify(output)}`;
	const out = runLand({ tree: feature, main, suite, reviewed: [] });
	assert.notEqual(tip, mainBefore); assert.equal(out.code, 0, out.text); assert.equal(readFileSync(output, "utf8"), tip);
});

// req: R-2530
check("a passing land shows its suite's land notes", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-notes-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const note = `${LAND_NOTE_PREFIX} visible note`;
	const trailing = `${LAND_NOTE_PREFIX} trailing note \t`;
	const noFinalNewline = `${LAND_NOTE_PREFIX} stderr note without final newline`;
	const out = runLand({ tree: feature, main, suite: "injected", reviewed: [], runCommand: () => ({ status: 0, stdout: `${note}\r\n${trailing}\r\nordinary suite output\r\n`, stderr: noFinalNewline }) });
	assert.equal(out.code, 0, out.text); assert.ok(out.text.includes(`${note}\n`)); assert.ok(out.text.includes(`${trailing}\n`)); assert.ok(out.text.includes(`${noFinalNewline}\n`));
	assert.doesNotMatch(out.text, /ordinary suite output/);
});

// req: R-977
check("suite command runs in the source tree", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-suite-cwd-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); let suiteCwd = null;
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: (_command, cwd) => { suiteCwd = cwd; return { status: 0, stdout: "", stderr: "" }; } });
	assert.equal(out.code, 0, out.text); assert.equal(suiteCwd, feature);
});
// req: R-977
check("suite failure leaves main unchanged and prints no success report", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-suite-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); const before = git(main, "rev-parse", "HEAD");
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(7)"', reviewed: [] });
	assert.notEqual(out.code, 0); assert.equal(git(main, "rev-parse", "HEAD"), before); assert.doesNotMatch(out.text, /Landed:/);
});
// req: R-977
check("a suite killed by signal refuses and names a nonzero exit", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-signal-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "unused", reviewed: [], runCommand: () => ({ status: null, signal: "SIGTERM", stdout: "", stderr: "" }) });
	assert.notEqual(out.code, 0); assert.match(out.text, /exit SIGTERM/); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-979
check("cleanup refuses a contained branch when checkout is not on main", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-nonmain-")); const main = repo(root, "main");
	const feature = tree(main, "feat/other"); commit(feature, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/other"); git(main, "checkout", "-b", "alternate");
	const result = runCleanup("other", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /checkout.*main/i); assert.equal(existsSync(feature), true);
});
// req: R-979
check("cleanup refuses a branch not contained by main", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-")); const main = repo(root, "main");
	const feature = tree(main, "feat/other"); commit(feature, "next.txt", "next\n", "next");
	const result = runCleanup("other", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /contained/i, result.text);
});
// req: R-979
check("cleanup refuses untracked dirt in a contained worktree", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-dirty-")); const main = repo(root, "main");
	const feature = tree(main, "feat/dirty"); commit(feature, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/dirty");
	writeFileSync(path.join(feature, "extra.txt"), "untracked\n");
	const result = runCleanup("dirty", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /dirty/i);
});
// req: R-979
check("cleanup refuses a branch checked out in multiple worktrees", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-dupe-")); const main = repo(root, "main");
	const feature = tree(main, "feat/dupe"); commit(feature, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/dupe");
	const duplicate = path.join(root, "duplicate"); execFileSync("git", ["worktree", "add", "--force", duplicate, "feat/dupe"], { cwd: main, stdio: "ignore" });
	const result = runCleanup("dupe", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /multiple worktrees/i);
});
// req: R-979
check("cleanup reports a lane branch deleted before cleanup", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-deleted-")); const main = repo(root, "main");
	const feature = tree(main, "feat/deleted"); commit(feature, "next.txt", "next\n", "next");
	git(main, "update-ref", "-d", "refs/heads/feat/deleted");
	const result = runCleanup("deleted", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /does not exist/i);
});
// req: R-979
check("cleanup removes a contained feat branch without force", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-ok-")); const main = repo(root, "main");
	const feature = tree(main, "feat/landed"); commit(feature, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/landed");
	// W7c: cleanup now removes by git's OWN registered spelling, not the --worktree argument's — on
	// this Mac, the default TMPDIR's /var -> /private/var symlink already makes the two differ, so
	// the captured real path (while the worktree still exists) is what the remove call must name.
	// SHOULD 6 (brief 2): compare through realPath on both sides, not by raw string — git's own
	// registered path always uses forward slashes, while `realpathSync.native` on Windows returns
	// backslashes, so a literal `===` would fail there even though both name the same entry.
	const featureReal = realpathSync.native(feature);
	const calls = []; const runGit = (cwd, args) => {
		calls.push({ cwd, args });
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const result = runCleanup("landed", { main, worktree: feature, runGit });
	assert.equal(result.code, 0, result.text);
	assert(calls.some(({ cwd, args }) => cwd === main && args.length === 3 && args[0] === "worktree" && args[1] === "remove" && realPath(args[2]) === realPath(featureReal)));
	assert(calls.some(({ cwd, args }) => cwd === main && args.length === 3 && args[0] === "branch" && args[1] === "-d" && args[2] === "feat/landed"));
	assert.equal(existsSync(feature), false); assert.throws(() => git(main, "show-ref", "--verify", "refs/heads/feat/landed"));
});
// req: R-588
check("successful merge prints post-merge release status and divergence", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-release-normal-")); const main = repo(root, "main");
	writeFileSync(path.join(main, "copier.yml"), "source\n"); mkdirSync(path.join(main, "templates"), { recursive: true }); writeFileSync(path.join(main, "templates", "base"), "base\n");
	git(main, "add", "copier.yml", "templates"); git(main, "commit", "-m", "template base"); git(main, "tag", "v0.1.0");
	const bare = path.join(root, "origin.git"); git(root, "init", "--bare", bare); git(main, "remote", "add", "origin", bare); git(main, "push", "-u", "origin", "main");
	const feature = tree(main, "integration"); commit(feature, "templates/new", "new\n", "template change");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => ({ status: 0 }) });
	assert.equal(out.code, 0, out.text); assert.match(out.text, /release status: .*template changes since v0\.1\.0.*main 1 ahead.*origin/i);
});
// req: R-588 R-1007
check("release status failure after merge keeps success code and output", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-release-failure-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next"); let releaseStarted = false;
	const runGit = (cwd, args) => {
		if (releaseStarted) return { status: 128, stdout: "", stderr: "injected failure" };
		try {
			const stdout = execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
			if (cwd === main && args.join(" ") === "rev-parse --verify --quiet refs/heads/main") releaseStarted = true;
			return { status: 0, stdout, stderr: "" };
		} catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runGit, runCommand: () => ({ status: 0 }) });
	assert.equal(out.code, 0, out.text); assert.equal(git(main, "rev-parse", "HEAD"), tip);
	assert.match(out.text, /release status: .*unavailable/i); assert.match(out.text, /push command:/); assert.doesNotMatch(out.text, /Session archive stub:|HANDOFF Landed:/);
	const throwingRoot = tmpDir(path.join(os.tmpdir(), "land-release-throw-")); const throwingMain = repo(throwingRoot, "main");
	const throwingFeature = tree(throwingMain, "integration"); const throwingTip = commit(throwingFeature, "next.txt", "next\n", "next");
	const guarded = runLand({ tree: throwingFeature, main: throwingMain, suite: "canonical", reviewed: [], runCommand: () => ({ status: 0 }), readReleaseStatus: () => { throw new Error("injected status reader failure"); } });
	assert.equal(guarded.code, 0, guarded.text); assert.equal(git(throwingMain, "rev-parse", "HEAD"), throwingTip);
	assert.match(guarded.text, /release status: .*unavailable/i); assert.match(guarded.text, /push command:/); assert.doesNotMatch(guarded.text, /Session archive stub:|HANDOFF Landed:/);
});
// req: R-1003
check("unknown land options, including either exemption placement, are named before git runs", () => {
	for (const args of [
		["merge", "--tree", "/tmp/tree", "--main", "/tmp/main", "--suite", "true", "--exempt", "reason", "--reviewed", "abc=item"],
		["merge", "--tree", "/tmp/tree", "--main", "/tmp/main", "--suite", "true", "--reviewed", "abc=item", "--exempt", "reason"],
		["merge", "--tree", "/tmp/tree", "--main", "/tmp/main", "--suite", "true", "--reviewed", "abc=item", "--mystery", "x"],
	]) {
		assert.throws(() => parseLandArgs(args), (error) => {
			const rejected = args[args.indexOf("--exempt") >= 0 ? args.indexOf("--exempt") : args.indexOf("--mystery")];
			assert.match(error.message, new RegExp(rejected)); return true;
		});
	}
});
// req: R-1009
check("a separate clone is refused before reviewed-SHA resolution or ledger reading", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clone-order-")); const main = repo(root, "main");
	const clone = path.join(root, "clone"); git(root, "clone", main, clone);
	const reviewed = "a".repeat(40); const calls = [];
	const runGit = (cwd, args) => {
		calls.push({ cwd, args });
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const out = executeLand({ tree: clone, main, suite: 'node -e "process.exit(0)"', reviewed: [`${reviewed}=item`], runGit });
	assert.notEqual(out.code, 0); assert.match(out.text, /share one git repository/);
	assert.equal(calls.some(({ args }) => args[0] === "cat-file" || (args[0] === "rev-parse" && args.includes(reviewed))), false);
});
// req: R-1372
check("normalized checkout review lands its exact tip", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-mm3-"));
	const main = repo(root, "mm3-main"); // repo() commits base.txt "base\n" under core.autocrlf=false
	git(main, "config", "core.autocrlf", "true"); // the linked worktree below checks base.txt out CRLF
	git(main, "config", "core.fileMode", "false");
	writeFileSync(path.join(main, "run.sh"), "#!/bin/sh\n");
	git(main, "add", "run.sh");
	git(main, "update-index", "--chmod=+x", "run.sh"); // a committed mode, never chmod
	git(main, "commit", "-m", "exec");
	const feature = tree(main, "mm3-integration"); // `git worktree add` checks out base.txt as CRLF here
	commit(feature, "next.txt", "next\r\n", "next");
	chmodSync(path.join(feature, "run.sh"), 0o644); // the committed exec bit is lost on disk
	const crlfBytes = readFileSync(path.join(feature, "base.txt"));
	assert.ok(crlfBytes.includes(0x0d), "precondition: base.txt was not checked out with CRLF");
	const tip = git(feature, "rev-parse", "HEAD");
	const home = path.join(root, "home");
	mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const fakeBin = path.join(root, "fake-bin");
	if (process.platform === "win32") writeFakePi(fakeBin, "console.log('VERDICT: LAND');\n");
	else { mkdirSync(fakeBin, { recursive: true }); writeFileSync(path.join(fakeBin, "pi"), "#!/bin/sh\necho 'VERDICT: LAND'\n"); chmodSync(path.join(fakeBin, "pi"), 0o755); }
	const out = path.join(root, "r1.md");
	const env = { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: path.join(home, '.pi/agent'), PATH: `${fakeBin}${path.delimiter}${process.env.PATH}` };
	const review = spawnSync(process.execPath, [PI_REVIEW, "--item", "mm3", "--out", out, "--retries", "0", "--", "-p", "review"], { cwd: feature, env, encoding: "utf8", timeout: 30000 });
	assert.equal(review.status, 0, review.stderr);
	const result = executeLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${tip}=mm3`], home });
	assert.equal(result.code, 0, result.text);
	assert.equal(git(main, "rev-parse", "HEAD"), tip);
});

process.exitCode = failures || process.exitCode ? 1 : 0;
