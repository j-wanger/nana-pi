/**
 * @module packages/nana-pack/tests/worker-refusal.test.mjs
 * @purpose Pin fail-closed lane and brief verification.
 * @inputs pi-worker, brief config, a temporary git repository/worktree, and a stub pi executable
 * @outputs named PASS/FAIL checks
 * @effects disk (OS temp fixtures), process (git and worker subprocesses)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import { WORKER_POLL_SECS } from "./slow-sampler.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
// R-1125: win32 canonicalizes with the native real path, which keeps an 8.3 or differently cased
// form the way git itself sees it (mirrors pi-worker's own fsReal); POSIX keeps the JS form.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const worker = path.join(root, "bin", "pi-worker.mjs");
const temp = tmpDir(path.join(os.tmpdir(), "worker-lane-"));
const repo = path.join(temp, "repo"), lane = path.join(temp, "lane"), stubDir = path.join(temp, "stub");
fs.mkdirSync(repo); fs.mkdirSync(stubDir);
const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args], { cwd, encoding: "utf8" });
const initialized = git(repo, "init", "-q");
if (initialized.status !== 0) throw new Error(initialized.stderr);
fs.writeFileSync(path.join(repo, "seed"), "seed\n");
fs.mkdirSync(path.join(repo, "tracked"), { recursive: true });
fs.writeFileSync(path.join(repo, "tracked", "nested.mjs"), "export const nested = true;\n");
fs.writeFileSync(path.join(repo, "old-name.mjs"), "export const moved = true;\n");
fs.mkdirSync(path.join(repo, "docs", "known-bugs"), { recursive: true });
fs.writeFileSync(path.join(repo, "docs", "known-bugs", "FEAT-006.md"), "# FEAT-006 known bugs\n\n- fixture bug\n");
fs.writeFileSync(path.join(repo, "docs", "known-bugs", "unplaced.md"), "# Unplaced known bugs\n\n- unplaced fixture\n");
git(repo, "add", "seed", "tracked/nested.mjs", "old-name.mjs", "docs/known-bugs/FEAT-006.md", "docs/known-bugs/unplaced.md"); git(repo, "commit", "-qm", "seed");
git(repo, "worktree", "add", "-qb", "feat/alpha", lane);
git(lane, "mv", "old-name.mjs", "moved-name.mjs"); git(lane, "commit", "-qm", "move precedent fixture");
const laneGitDir = path.resolve(lane, git(lane, "rev-parse", "--git-dir").stdout.trim());
const laneLockPath = path.join(laneGitDir, "nana-lane.lock");
const brief = path.join(temp, "brief.md");
const defaultBriefText = "Serves: roadmap step 3: exercise refusals.\nValidation: fixture run.\nlane brief content\n\nPrecedent:\n- seed\n";
fs.writeFileSync(brief, defaultBriefText);
const pi = path.join(stubDir, "pi");
const piSpawnMarker = path.join(temp, "pi-spawn-marker");
// writeStub lays out the fake `pi` for this platform: a POSIX #!/bin/sh script, unchanged from
// before this lane, or (win32 only, R-1125/CHANGE.md §1) a Node body through fake-pi.mjs, placed
// the way piLaunch finds an npm-installed pi rather than the sh stub it cannot launch on win32.
function writeStub(posixScript, nodeBody) {
	if (process.platform === "win32") writeFakePi(stubDir, nodeBody);
	else { fs.writeFileSync(pi, posixScript); fs.chmodSync(pi, 0o755); }
}
const mainPosixScript = (withMarker) => `#!/bin/sh\n${withMarker ? `echo spawned >> "${piSpawnMarker}"\n` : ""}printf '%s\\n' "$NANA_ROLE:$NANA_WORKTREE_ROOT"\nfor arg in "$@"; do printf '%s\\n' "$arg"; done\n`;
const mainNodeBody = (withMarker) => `const fs = require("node:fs");
${withMarker ? `fs.appendFileSync(${JSON.stringify(piSpawnMarker)}, "spawned\\n");\n` : ""}process.stdout.write(process.env.NANA_ROLE + ":" + process.env.NANA_WORKTREE_ROOT + "\\n");
const args = process.argv.slice(2);
for (const arg of args) process.stdout.write(arg + "\\n");
`;
writeStub(mainPosixScript(true), mainNodeBody(true));
// An empty, fixed agent dir keeps an ambient PI_CODING_AGENT_DIR (e.g. a standalone run started
// from inside a pi session) from leaking into the roster resolver; scripts/test.mjs already
// scrubs the variable under `npm test`, so this is belt-and-suspenders. It is the same directory
// trust.json already uses below, so trust behaviour is unchanged; roster-specific cases override
// it per call.
const defaultAgentDir = path.join(temp, ".pi", "agent");
const out = path.join(temp, "output.md");
// chosen 2026-10-25 (R-2883): R-2619 missed 15 seconds once at 26235c79; a cold CPU sampler is the inferred cause.
const CHILD_LIMIT_MS = 30_000;
const run = (cwd, args, more = {}, piArgs = []) => {
	const started = Date.now();
	const result = spawnSync(process.execPath, [worker, "--poll", String(WORKER_POLL_SECS), "--out", out, ...args, ...(piArgs.length ? ["--", ...piArgs] : [])], {
		cwd, encoding: "utf8", timeout: CHILD_LIMIT_MS,
		env: { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, USERPROFILE: temp, PI_CODING_AGENT_DIR: defaultAgentDir, ...more },
	});
	return { ...result, elapsedMs: Date.now() - started };
};
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) process.exitCode = 1; };
const clearLaunchArtifacts = () => {
	fs.rmSync(piSpawnMarker, { force: true });
	fs.rmSync(out, { force: true });
	fs.rmSync(laneLockPath, { force: true });
};
const runBriefText = (text, file = brief) => {
	clearLaunchArtifacts();
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, text);
	return run(lane, ["--lane", "alpha", "--brief", file]);
};
// req: R-960
check("lane options with missing values refuse before pi spawn", (() => {
	const cases = [
		["lane option missing", ["--lane"]],
		["lane option starts with dash", ["--lane", "-alpha"]],
		["brief option missing", ["--lane", "alpha", "--brief"]],
		["repeated lane with trailing missing value", ["--lane", "alpha", "--brief", brief, "--lane"]],
	];
	return cases.every(([, args]) => {
		fs.rmSync(piSpawnMarker, { force: true });
		const result = run(lane, args);
		return result.status === 1 && /lane refused/.test(result.stderr) && !fs.existsSync(piSpawnMarker);
	});
})());
// req: R-960
check("lane mode refuses the main checkout before starting pi", /main checkout/.test(run(repo, ["--lane", "alpha", "--brief", brief]).stderr) && !fs.existsSync(out));
fs.mkdirSync(path.join(lane, "nested"));
// req: R-960
check("lane mode refuses a nested cwd", /cwd is not the repository root/.test(run(path.join(lane, "nested"), ["--lane", "alpha", "--brief", brief]).stderr));
// req: R-960
check("lane mode refuses a missing brief before starting pi", /brief file does not exist/.test(run(lane, ["--lane", "alpha", "--brief", "missing.md"]).stderr));
const briefDirectory = path.join(temp, "brief-directory"); fs.mkdirSync(briefDirectory);
// req: R-960
check("lane mode refuses a brief directory with a named failure", /brief must be a readable regular file/.test(run(lane, ["--lane", "alpha", "--brief", briefDirectory]).stderr));
// req: R-960
check("lane mode refuses a switched lane branch before starting pi", (() => { git(lane, "checkout", "-qb", "feat/other"); const result = run(lane, ["--lane", "alpha", "--brief", brief]); git(lane, "checkout", "-q", "feat/alpha"); return /expected feat\/alpha/.test(result.stderr); })());
// req: R-2578
check("R-2578: a lane brief with no Precedent section, an empty one or a reasonless none is refused before the lock and before pi starts", (() => {
	const cases = [
		"Feature: FEAT-006 · Missing\n",
		"## Precedent\n\n## Done\n",
		"Precedent:\r\nprose ends this label section\t\r\n",
		"\ufeffPrecedent:\n- none:\t",
	];
	return cases.every((text) => {
		const result = runBriefText(text);
		return result.status === 1 && result.stderr.includes("pi-worker: lane refused:") && result.stderr.includes("Precedent") &&
			result.stderr.includes("- <path>") && result.stderr.includes("- none: <reason>") &&
			!fs.existsSync(piSpawnMarker) && !fs.existsSync(laneLockPath);
	});
})());

// req: R-2579
check("R-2579: Precedent entries not tracked at HEAD are refused, each one named", (() => {
	fs.writeFileSync(path.join(lane, "untracked-present.mjs"), "untracked\n");
	fs.writeFileSync(path.join(lane, "staged-only.mjs"), "staged\n");
	git(lane, "add", "staged-only.mjs");
	const absoluteBad = path.join(temp, "absolute-bad.mjs").replaceAll("\\", "/");
	const bad = ["untracked-present.mjs", "staged-only.mjs", "old-name.mjs", "../outside.md", absoluteBad, "*.mjs", "tracke", "after-wrap.md"];
	const text = [
		"Precedent:",
		"- seed — a tracked entry", "  whose note wraps onto another line", "- after-wrap.md",
		"- untracked-present.mjs", "- staged-only.mjs", "- old-name.mjs", "- ../outside.md",
		`- ${absoluteBad}`, "- *.mjs", "- tracke", "- tracked/nested.mjs", "",
	].join("\n");
	const result = runBriefText(text);
	const sha = git(lane, "rev-parse", "--short", "HEAD").stdout.trim();
	const namedAll = bad.every((entry) => result.stderr.includes(`${JSON.stringify(entry)} is not tracked`));
	const goodNotNamed = !result.stderr.includes('"seed" is not tracked') && !result.stderr.includes('"tracked/nested.mjs" is not tracked');
	const literalPathspec = fs.readFileSync(path.join(root, "lib", "brief-precedent.mjs"), "utf8").includes('"--literal-pathspecs"');
	git(lane, "reset", "-q", "HEAD", "--", "staged-only.mjs");
	fs.rmSync(path.join(lane, "staged-only.mjs"), { force: true });
	fs.rmSync(path.join(lane, "untracked-present.mjs"), { force: true });
	if (!(result.status === 1 && namedAll && goodNotNamed && literalPathspec && result.stderr.includes(sha) && !fs.existsSync(piSpawnMarker))) {
		process.stderr.write(`untracked precedent case failed: status=${result.status} namedAll=${namedAll} goodNotNamed=${goodNotNamed} literalPathspec=${literalPathspec} sha=${sha}\n${result.stderr}\n`);
		return false;
	}

	const tree = git(lane, "rev-parse", "HEAD^{tree}").stdout.trim();
	const common = git(lane, "rev-parse", "--git-common-dir").stdout.trim();
	const objectPath = path.join(path.resolve(lane, common), "objects", tree.slice(0, 2), tree.slice(2));
	let objectBytes;
	try { objectBytes = fs.readFileSync(objectPath); fs.rmSync(objectPath); }
	catch (error) { process.stderr.write(`listing-failure fixture could not remove ${objectPath}: ${error.message}\n`); return false; }
	const failedListing = runBriefText("Precedent:\n- seed\n");
	fs.mkdirSync(path.dirname(objectPath), { recursive: true });
	fs.writeFileSync(objectPath, objectBytes);
	const listingPassed = failedListing.status === 1 && failedListing.stderr.includes("cannot list paths tracked at HEAD") && !fs.existsSync(piSpawnMarker);
	if (!listingPassed) process.stderr.write(`failed-listing precedent case failed: status=${failedListing.status}\n${failedListing.stderr}\n`);
	return listingPassed;
})());

