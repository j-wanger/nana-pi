/**
 * @module packages/nana-pack/tests/worker-lane.test.mjs
 * @purpose Pins fail-closed lane and brief verification, prompt delivery, and the sealed worker ceiling.
 * @inputs pi-worker, brief config, a temporary git repository/worktree, and a stub pi executable
 * @outputs named PASS/FAIL checks
 * @effects disk (OS temp fixtures and a slow CPU-sampler shim), process (git and worker subprocesses)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import {
	FAKE_PI_HOLD_MS,
	resolveSampler,
	samplerIsFirst,
	SLOW_SAMPLER_MS,
	WORKER_POLL_SECS,
	writeSlowSampler,
} from "./slow-sampler.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { KNOWN_BUGS_DIR } from "../../../scripts/known-bugs.mjs";
// R-1125: win32 canonicalizes with the native real path, which keeps an 8.3 or differently cased
// form the way git itself sees it (mirrors pi-worker's own fsReal); POSIX keeps the JS form.
const real = (p) => (process.platform === "win32" ? fs.realpathSync.native(p) : fs.realpathSync(p));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const worker = path.join(root, "bin", "pi-worker.mjs");
const temp = real(tmpDir(path.join(os.tmpdir(), "worker-lane-")));
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
const laneGitDir = real(path.resolve(lane, git(lane, "rev-parse", "--git-dir").stdout.trim()));
const laneLockPath = path.join(laneGitDir, "nana-lane.lock");
const brief = path.join(temp, "brief.md");
const defaultBriefText = "Serves: roadmap step 3: exercise the launcher.\nValidation: fixture run.\nlane brief content\n\nPrecedent:\n- seed\n";
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
const mainPosixScript = (withMarker) => `#!/bin/sh\n${withMarker ? `echo spawned >> "${piSpawnMarker}"\n` : ""}printf '%s\\n' "$NANA_ROLE:$NANA_WORKTREE_ROOT"\nprev=0; n=0\nfor arg in "$@"; do printf '%s\\n' "$arg"; if [ "$prev" = 1 ]; then n=$((n+1)); cp "$arg" "${path.join(temp, "prompt-")}"$n; prev=0; elif [ "$arg" = "--append-system-prompt" ]; then prev=1; fi; done\n`;
const mainNodeBody = (withMarker) => `const fs = require("node:fs");
${withMarker ? `fs.appendFileSync(${JSON.stringify(piSpawnMarker)}, "spawned\\n");\n` : ""}process.stdout.write(process.env.NANA_ROLE + ":" + process.env.NANA_WORKTREE_ROOT + "\\n");
const args = process.argv.slice(2);
let prev = false, n = 0;
const promptPrefix = ${JSON.stringify(path.join(temp, "prompt-"))};
for (const arg of args) {
  process.stdout.write(arg + "\\n");
  if (prev) { n++; fs.copyFileSync(arg, promptPrefix + n); prev = false; }
  else if (arg === "--append-system-prompt") prev = true;
}
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
	for (let index = 1; index <= 4; index++) fs.rmSync(path.join(temp, `prompt-${index}`), { force: true });
};
const runBriefText = (text, file = brief) => {
	clearLaunchArtifacts();
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, text.replace(/^(\uFEFF)?/u, "$1Serves: roadmap step 3: exercise the launcher.\nValidation: fixture run.\n"));
	return run(lane, ["--lane", "alpha", "--brief", file]);
};
const legacyRepeat = run(lane, ["--poll", "invalid"], {}, ["-p", "legacy"]);
// req: R-960
check("non-lane repeated worker options keep the legacy first-occurrence behaviour", legacyRepeat.status === 0 && !/duplicate option/.test(legacyRepeat.stderr), legacyRepeat.stderr);
fs.rmSync(piSpawnMarker, { force: true }); fs.rmSync(out, { force: true });
// req: R-960
check("non-lane usage text remains the legacy form", spawnSync(process.execPath, [worker], { cwd: lane, encoding: "utf8" }).stderr === "usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n");
// req: R-2580
check("R-2580: honest Precedent forms pass and the launch line names the checked entry count", (() => {
	const subfolderBrief = path.join(lane, "brief-fixtures", "nested-brief.md");
	const cases = [
		["slash separators", "Precedent:\n- tracked/nested.mjs\n", 1, brief],
		["backslash separators", "Precedent:\n- tracked\\nested.mjs\n", 1, brief],
		["backticks", "Precedent:\n- `seed` note\n", 1, brief],
		["single line suffix", "Precedent:\n- seed:12\n", 1, brief],
		["range line suffix", "Precedent:\n- tracked/nested.mjs:12-40\n", 1, brief],
		["trailing comma", "Precedent:\n- seed:12,\n", 1, brief],
		["trailing semicolon", "Precedent:\n- seed;\n", 1, brief],
		["trailing full stop", "Precedent:\n- seed.\n", 1, brief],
		["trailing bracket", "Precedent:\n- seed)\n", 1, brief],
		["folder", "Precedent:\n- tracked\n", 1, brief],
		["brief in worktree subfolder", "Precedent:\n- seed\n", 1, subfolderBrief],
		["wrapped entry", "Precedent:\n- seed — note\n  continued note\n- none: second entry\n", 2, brief],
		["heading", "## Precedent\n- seed\n## Done\n- missing\n", 1, brief],
		["plain label", "Precedent:\n- seed\n", 1, brief],
		["plain label ends before numbered steps after a blank line", "Precedent:\n- seed\n- none: second entry\n\n1. Run the next step\n2. Update another thing\n", 2, brief],
		["fenced example", "```md\nPrecedent:\n- missing\n```\n\nPrecedent:\n- seed\n", 1, brief],
		["CRLF", "Precedent:\r\n- seed\t\r\n", 1, brief],
		["trailing blanks", "Precedent: \t\n\n- seed \t\n", 1, brief],
		["BOM", "\ufeffPrecedent:\n- seed\n", 1, brief],
		["no final newline", "Precedent:\n- seed", 1, brief],
		["none reason", "Precedent:\n- none: no earlier implementation exists\n", 1, brief],
	];
	return cases.every(([label, text, count, file]) => {
		const result = runBriefText(text, file);
		const line = result.stderr.split(/\r?\n/).find((entry) => entry.startsWith("pi-worker: precedent:"));
		const beforeAttempt = result.stderr.indexOf("pi-worker: precedent:") < result.stderr.indexOf("[pi-worker] attempt 1/1");
		if (!(result.status === 0 && fs.existsSync(piSpawnMarker) && line?.startsWith(`pi-worker: precedent: ${count} checked at HEAD`) && beforeAttempt)) {
			process.stderr.write(`passing precedent case failed: ${label}: ${result.stderr}\n`);
			return false;
		}
		return true;
	});
})());

// req: R-2616
check("R-2616: a numbered step list straight after a plain Precedent list is not read as entries", (() => {
	const passes = [
		"Precedent:\n- seed\nSteps:\n1. Run the next step\n2. Update another thing\n",
		"Precedent:\n- seed\n1. Run the next step\n",
		"Precedent:\n1. seed\n2. none: second entry\nThen:\n- Run the next step\n",
	];
	for (const text of passes) {
		const result = runBriefText(text);
		const line = result.stderr.split(/\r?\n/).find((entry) => entry.startsWith("pi-worker: precedent:"));
		if (result.status !== 0 || !fs.existsSync(piSpawnMarker) || !line?.startsWith("pi-worker: precedent:")) return false;
	}
	for (const text of [
		"Precedent:\n- seed — reuse the\nreader below\n* missing.mjs\n",
		"Precedent:\n1. seed — reuse:\n   - the parser\n2. missing.mjs\n",
		"Precedent:\n- seed — reuse:\n  1. the parser\n- missing.mjs\n",
	]) {
		const result = runBriefText(text);
		if (result.status !== 1 || fs.existsSync(piSpawnMarker) || !result.stderr.includes('"missing.mjs" is not tracked')) return false;
	}
	return true;
})());

// req: R-2617
check("R-2617: a bold Precedent label line starts the Precedent section", (() => {
	for (const label of ["**Precedent:**", "**Precedent**:"]) {
		const result = runBriefText(`${label}\n- seed\n`);
		if (result.status !== 0 || !fs.existsSync(piSpawnMarker) || !result.stderr.includes("1 checked at HEAD")) return false;
	}
	const missing = runBriefText("**Precedent:**\n- missing.mjs\n");
	return missing.status === 1 && !fs.existsSync(piSpawnMarker) && missing.stderr.includes('"missing.mjs" is not tracked');
})());

// req: R-2618
check("R-2618: a brief with no Precedent section is told the label stands on a line of its own", (() => {
	const phraseChecks = ["Precedent: seed — the inline form\n", "Feature: FEAT-006 · Missing\n"].map((text) => {
		const result = runBriefText(text);
		return result.status === 1 && result.stderr.includes("a Precedent heading") && result.stderr.includes("a line holding only Precedent:") && result.stderr.includes("- <path>") && result.stderr.includes("- none: <reason>") && !fs.existsSync(piSpawnMarker) && !fs.existsSync(laneLockPath);
	});
	const empty = runBriefText("## Precedent\n\n## Done\n");
	const actualSection = runBriefText("Precedent: the rail is one source\n\n## Precedent\n- seed\n");
	return phraseChecks.every(Boolean) && empty.status === 1 && !empty.stderr.includes("a Precedent heading") && actualSection.status === 0 && fs.existsSync(piSpawnMarker);
})());

const r2619Launches = [];
const r2619Ok = (() => {
	const passing = [
		"- **seed** — note", "- **`tracked/nested.mjs`**:12,", "- seed:93-100).", "- seed: the reader",
		"- `seed`: the reader", "- seed:12: note", "- **none:** no earlier code exists",
	];
	for (const entry of passing) {
		const result = runBriefText(`Precedent:\n${entry}\n`);
		r2619Launches.push({ entry, status: result.status, elapsedMs: result.elapsedMs, stderrTail: result.stderr.trim().split(/\r?\n/).slice(-3).join(" | ") });
		if (result.status !== 0 || !fs.existsSync(piSpawnMarker) || !result.stderr.includes("1 checked at HEAD")) return false;
	}
	for (const entry of ["- *.mjs", "- [seed](seed)", "- tracked/..", "- **missing.mjs**"]) {
		const result = runBriefText(`Precedent:\n${entry}\n`);
		r2619Launches.push({ entry, status: result.status, elapsedMs: result.elapsedMs, stderrTail: result.stderr.trim().split(/\r?\n/).slice(-3).join(" | ") });
		if (result.status !== 1 || fs.existsSync(piSpawnMarker)) return false;
	}
	return true;
})();
// req: R-2619
check("R-2619: bold and punctuated Precedent paths are checked as the bare path", r2619Ok, JSON.stringify(r2619Launches));

const samplerDir2883 = path.join(temp, "r2883-sampler");
const samplerMarker2883 = path.join(temp, "r2883-sampler-started");
const holdRecord2883 = path.join(temp, "r2883-hold.json");
const { samplerName: samplerName2883, samplerShim: samplerShim2883 } = writeSlowSampler(samplerDir2883);
const holdBody2883 = `const fs = require("node:fs");\nconst started = Date.now();\nsetTimeout(() => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000); fs.writeFileSync(${JSON.stringify(holdRecord2883)}, JSON.stringify({ timerFired: true, heldMs: Date.now() - started })); process.stdout.write("worker output\\n"); }, ${FAKE_PI_HOLD_MS});\n`;
const holdScript2883 = path.join(stubDir, "r2883-hold.cjs");
fs.writeFileSync(holdScript2883, holdBody2883);
writeStub(`#!/bin/sh\nexec "${process.execPath}" "${holdScript2883}" "$@"\n`, holdBody2883);
fs.writeFileSync(brief, defaultBriefText);
clearLaunchArtifacts();
const launchEnv2883 = {
	PATH: `${samplerDir2883}${path.delimiter}${stubDir}${path.delimiter}${process.env.PATH}`,
	SAMPLER_MARKER: samplerMarker2883,
	SLOW_SAMPLER_MS: String(SLOW_SAMPLER_MS),
};
const resolvedLaunchSampler2883 = resolveSampler({ ...process.env, ...launchEnv2883 }, CHILD_LIMIT_MS);
// The timer callback itself injects one second of scheduling delay.
const launch2883 = run(lane, ["--lane", "alpha", "--brief", brief], launchEnv2883);
writeStub(mainPosixScript(true), mainNodeBody(true));
const defaultSamplerEnv2883 = { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}` };
const resolvedDefaultSampler2883 = resolveSampler(defaultSamplerEnv2883, CHILD_LIMIT_MS);
const hold2883 = fs.existsSync(holdRecord2883) ? JSON.parse(fs.readFileSync(holdRecord2883, "utf8")) : null;
const samplerStarted2883 = fs.existsSync(samplerMarker2883);
const stubHasSampler2883 = fs.existsSync(path.join(stubDir, path.basename(samplerShim2883)));
// req: R-2883 R-3810 R-3812
check("R-2883: worker-lane's launcher runs a fake pi that holds one second to exit 0 without starting a CPU sampler slower than the child limit, and no other launch finds that sampler",
	launch2883.status === 0 && samplerIsFirst(resolvedLaunchSampler2883, samplerShim2883)
		&& hold2883?.timerFired === true && !samplerStarted2883
		&& !samplerIsFirst(resolvedDefaultSampler2883, samplerShim2883) && !stubHasSampler2883,
	JSON.stringify({ status: launch2883.status, signal: launch2883.signal, elapsedMs: launch2883.elapsedMs, stderrTail: launch2883.stderr?.trim().split(/\r?\n/).slice(-3).join(" | "), samplerName: samplerName2883, resolvedLaunchSampler: resolvedLaunchSampler2883, resolvedDefaultSampler: resolvedDefaultSampler2883, hold: hold2883, samplerStarted: samplerStarted2883, stubHasSampler: stubHasSampler2883 }));
if (samplerStarted2883) {
	const samplerPid = Number(fs.readFileSync(samplerMarker2883, "utf8"));
	if (samplerPid > 0) { try { process.kill(samplerPid, "SIGKILL"); } catch {} }
}
// req: R-2883
check("seal: worker-lane's launches have a 30-second limit and poll less often than that",
	CHILD_LIMIT_MS === 30_000 && WORKER_POLL_SECS * 1000 > CHILD_LIMIT_MS,
	JSON.stringify({ CHILD_LIMIT_MS, WORKER_POLL_SECS }));

// req: R-2620
check("R-2620: a heading such as Precedent audit is not read as the Precedent section", (() => {
	const bypass = runBriefText("## Precedent audit\n- missing.mjs\n\n## Precedent\n- seed\n");
	const noSection = runBriefText("## Precedent audit\n- seed\n");
	const parenthetical = runBriefText("## Precedent (this lane's own)\n- seed\n");
	const dash = runBriefText("## Precedent — the reader\n- seed\n");
	return bypass.status === 0 && fs.existsSync(piSpawnMarker) && noSection.status === 1 && noSection.stderr.includes("a Precedent heading") &&
		parenthetical.status === 0 && dash.status === 0;
})());

// req: R-2581
check("R-2581: pi builders receive a known-bug read instruction instead of an inlined file", (() => {
	const bugRelative = "docs/known-bugs/FEAT-006.md";
	const bugFile = path.join(lane, bugRelative);
	const bugBytes = fs.readFileSync(bugFile);
	const cases = [
		["Feature: FEAT-006 · Worker\n\nPrecedent:\n- seed\n", 3, bugRelative, bugRelative],
		["Feature: FEAT-006 · Worker \t\r\n\r\nPrecedent:\r\n- seed\r\n", 3, bugRelative, bugRelative],
		["Feature: FEAT-012 · Missing\n\nPrecedent:\n- seed", 3, "none"],
		["This prose mentions FEAT-006 but is not a feature line.\n\nPrecedent:\n- seed\n", 2, "none"],
	];
	const ordinary = cases.every(([text, promptCount, launchValue, readPath]) => {
		const result = runBriefText(text);
		const output = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
		const prompts = output.split("\n").filter((arg) => arg === "--append-system-prompt").length;
		const copied = promptCount === 3 && fs.existsSync(path.join(temp, "prompt-3")) ? fs.readFileSync(path.join(temp, "prompt-3")) : null;
		return result.status === 0 && prompts === promptCount && result.stderr.includes(`known bugs: ${launchValue}`) &&
			(promptCount === 2 ? !fs.existsSync(path.join(temp, "prompt-3")) && !output.includes("unplaced.md") : copied.toString() === (readPath ? `Read \`${readPath}\` (this feature's known bugs) before you change code.` : "No known bugs are recorded for this feature.") && !output.includes(real(bugFile)));
	});
	fs.rmSync(bugFile);
	fs.mkdirSync(bugFile);
	const directoryCase = runBriefText("Feature: FEAT-006 · Directory\n\nPrecedent:\n- seed\n");
	const directoryOutput = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
	fs.rmSync(bugFile, { recursive: true, force: true });
	fs.writeFileSync(bugFile, bugBytes);
	return ordinary && directoryCase.status === 0 && directoryOutput.split("\n").filter((arg) => arg === "--append-system-prompt").length === 3 &&
		directoryCase.stderr.includes("known bugs: none") && !directoryOutput.includes("unplaced.md") &&
		fs.readFileSync(path.join(temp, "prompt-3"), "utf8") === "No known bugs are recorded for this feature.";
})());

// req: R-2578 R-2581
check("seal: a brief's precedent section is Precedent, its no-precedent entry starts none: and its feature line starts Feature:", (() => {
	const module = path.join(root, "lib", "brief-config.mjs");
	const probe = spawnSync(process.execPath, ["--input-type=module", "-e", `import { PRECEDENT_SECTION, PRECEDENT_NONE, FEATURE_LINE_PREFIX, PRECEDENT_TRAILING_PUNCTUATION, PRECEDENT_LIST_MAX_BYTES } from ${JSON.stringify(pathToFileURL(module).href)}; process.exit(PRECEDENT_SECTION === "Precedent" && PRECEDENT_NONE === "none:" && FEATURE_LINE_PREFIX === "Feature: " && PRECEDENT_TRAILING_PUNCTUATION === ",;.):" && PRECEDENT_LIST_MAX_BYTES === 65536 ? 0 : 1);`], { encoding: "utf8", timeout: 5000 });
	return probe.status === 0;
})());

fs.writeFileSync(brief, defaultBriefText);
clearLaunchArtifacts();
const good = run(lane, ["--lane", "alpha", "--brief", path.relative(lane, brief)]);
const result = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
const promptPaths = result.split("\n").reduce((all, arg, i, args) => arg === "--append-system-prompt" ? [...all, args[i + 1]] : all, []);
const prompt1Path = path.join(temp, "prompt-1");
// A missing prompt-1 (the win32 stub's copy failed) fails this check by name rather than
// throwing ENOENT and crashing the rest of the file.
const prompt1Text = fs.existsSync(prompt1Path) ? fs.readFileSync(prompt1Path, "utf8") : "";
// req: R-961
check("verified lane passes preamble and validated brief as ordered file paths", good.status === 0 && /worker:/.test(result) && promptPaths.length === 2 && !fs.existsSync(promptPaths[0]) && promptPaths[1] === real(brief) && prompt1Text.includes("on branch feat/alpha") && fs.readFileSync(path.join(temp, "prompt-2"), "utf8") === defaultBriefText, `${good.stderr}${result} paths=${promptPaths.join(",")}`);
const plainWorker = run(lane, [], { NANA_ROLE: "inherited" }, ["-p", "plain"]);
const plainResult = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
// req: R-286
check("every pi-worker child receives NANA_ROLE=worker", result.startsWith("worker:") && plainWorker.status === 0 && plainResult.startsWith("worker:"), `${result}\n${plainResult}`);
// req: R-628
check("lane preamble forbids the named package-manager operations at a worktree root", prompt1Text.includes("Never run pnpm, npm, or npx install, exec, add, or dlx at a worktree root"));
const preambleText = prompt1Text;
const RULE_LINE = {
	storedCredential: "- Never read, print or use a stored credential: no `git credential fill` or `get`, no token from a keychain, file or environment variable, and no direct GitHub API call. If a step needs a credential or `gh` is missing, report it and stop.",
	knownBugsFolder: `- Remove only the known-bug lines your brief names; never make any other edit under \`${KNOWN_BUGS_DIR}/\`.`,
	trackedDeletion: "- Delete tracked files with `git rm -q --`.",
	sharedTemp: "- Test files use the shared `tmpDir` helper for temp folders and never call `mkdtemp`.",
	testInventory: "- After adding or deleting a test file, run `node scripts/test.mjs test-runner`.",
	removedTextSearch: "- Before reporting, grep tests for every sentence, path and file name the change removed or renamed.",
	noNestedCheckers: "- Suite tests never re-run the suite or whole-repo checkers.\n  Code map, README, requirements tree and requirements trace run as seat checks and in their own tests.",
	precedentFirst: "- Read every file your brief's Precedent section names before designing, follow its pattern, and report each departure with its reason.",
	reuseNotCopy: "- When your change needs a function a Precedent file already has, import it from that file and never copy it. If it is private, drop the leading underscore, update its existing callers, and import the public name; never import a private name from another module. A move to a shared module needs the brief to name it.",
	knownBugsContext: "- The feature's known-bug file is context; fix only those the brief names, and report each one the change touches.",
	validationFirst: "Change the affected requirement rows first, then the code. Run the validation your brief names, small and early, and report its command and result.",
	briefNamedTests: "Write only the new tests your brief names: a test pins a failure that happened, the main use of a kept feature, or a safety line (privacy, credentials, rm, identity, Windows paths). Edit an existing test only where your change makes it false, and list each such edit in your report.",
	awaitEveryAsyncCase: "A test harness awaits every async case under a per-case limit.",
	crlfAndWhitespace: "A change that reads text line by line gets CRLF, trailing space or tab, and no-final-newline cases.",
	idsFromBriefRange: "New requirement rows take IDs only from the range your brief names.",
	noSuiteTestRunsSeatScript: "No suite test runs, imports or copies a seat script.",
	noUnnamedTestDeleted: "Never delete a test your brief does not name.",
	touchedTestsBeforeCommit: "Each commit follows a green run of the tests your change touches.",
	fullSuiteFallback: "Run the repository's full suite unless its `AGENTS.md` says CI covers it, with one machine lock when the repo declares one. Read every exit code standalone; no pipe before `&&` or a commit.",
	seatChecksBeforeDone: "Run every seat check your brief names on your last commit. DONE means each one passes; a title check passes only at `0 missing`.",
	longOutputToFile: "Keep long script output outside the repository (for example under the system temp folder); put each command, its exit code and a one-line result summary in your report; commit no raw output.",
	readCiOnce: "Do not push; the seat pushes after verifying; report the tip. Do not wait for or read CI.",
	suiteCheckCountInReport: "Then commits; per item, files, rows, the validation run and its result, commands and exit codes; the branch, the tip's full SHA and the seat checks run on it, or the full-suite summary line with its check count where you ran it; and what was not done.",
};
const preambleOnce = (line) => preambleText.includes(line) && preambleText.split(line).length - 1 === 1;
// req: R-2510
check("R-2510: only brief-named known-bug removals are allowed and HANDOFF stays protected",
	preambleOnce("- Never edit `HANDOFF.md`.") && preambleOnce(RULE_LINE.knownBugsFolder) &&
	!preambleText.includes(`Never edit \`HANDOFF.md\` or \`${KNOWN_BUGS_DIR}/\``), RULE_LINE.knownBugsFolder);
// req: R-3897
check("M4: tracked deletion uses git rm", preambleOnce(RULE_LINE.trackedDeletion));
// req: R-3897
check("M4: test temp folders use shared tmpDir without mkdtemp", preambleOnce(RULE_LINE.sharedTemp));
// req: R-3897
check("M4: test file changes run the test-runner checks", preambleOnce(RULE_LINE.testInventory));
// req: R-3897
check("M4: removed and renamed text gets a test search before reporting", preambleOnce(RULE_LINE.removedTextSearch));
// req: R-3903
check("M10: suite tests do not re-run the suite or whole-repo checkers", preambleOnce(RULE_LINE.noNestedCheckers));
// req: R-3650
check("R-3650: the builder preamble forbids reading, printing or using a stored credential exactly once", preambleOnce(RULE_LINE.storedCredential), RULE_LINE.storedCredential);
// req: R-2582
check("R-2582: the builder preamble tells the builder to read its Precedent files first, follow their pattern and report each departure", preambleOnce(RULE_LINE.precedentFirst), RULE_LINE.precedentFirst);
// req: R-2662
check("R-2662: the builder preamble tells the builder to import a needed function, never copy it, and make a private helper public without an unnamed shared move", preambleOnce(RULE_LINE.reuseNotCopy), RULE_LINE.reuseNotCopy);
// req: R-2583
check("R-2583: the builder preamble frames the known-bug file as context to report, not to fix", preambleOnce(RULE_LINE.knownBugsContext), RULE_LINE.knownBugsContext);
// req: R-3436
check("lane preamble carries: validation first", preambleOnce(RULE_LINE.validationFirst), RULE_LINE.validationFirst);
// req: R-3436
check("lane preamble carries: brief-named eligible tests", preambleOnce(RULE_LINE.briefNamedTests), RULE_LINE.briefNamedTests);
// req: R-3436
check("lane preamble carries: await every async case", preambleOnce(RULE_LINE.awaitEveryAsyncCase), RULE_LINE.awaitEveryAsyncCase);
// req: R-3436
check("lane preamble carries: CRLF and whitespace cases", preambleOnce(RULE_LINE.crlfAndWhitespace), RULE_LINE.crlfAndWhitespace);
// req: R-3436
check("lane preamble carries: IDs from the brief's range", preambleOnce(RULE_LINE.idsFromBriefRange), RULE_LINE.idsFromBriefRange);
// req: R-3436
check("lane preamble carries: no suite test runs a seat script", preambleOnce(RULE_LINE.noSuiteTestRunsSeatScript), RULE_LINE.noSuiteTestRunsSeatScript);
// req: R-3436
check("lane preamble carries: no unnamed test deleted", preambleOnce(RULE_LINE.noUnnamedTestDeleted), RULE_LINE.noUnnamedTestDeleted);
// req: R-3436
check("lane preamble carries: touched tests before each commit", preambleOnce(RULE_LINE.touchedTestsBeforeCommit), RULE_LINE.touchedTestsBeforeCommit);
// req: R-3436
check("lane preamble carries: seat checks before DONE", preambleOnce(RULE_LINE.seatChecksBeforeDone), RULE_LINE.seatChecksBeforeDone);
// req: R-3436
check("lane preamble carries: long output outside the repository and no raw output committed", preambleOnce(RULE_LINE.longOutputToFile), RULE_LINE.longOutputToFile);
// req: R-3436
check("lane preamble carries: no builder push", preambleOnce(RULE_LINE.readCiOnce), RULE_LINE.readCiOnce);
// req: R-3436
check("lane preamble carries: branch tip and seat checks in the report", preambleOnce(RULE_LINE.suiteCheckCountInReport), RULE_LINE.suiteCheckCountInReport);
// req: R-3436
check("R-3436: the preamble runs the full suite unless AGENTS says CI covers it, and contains none of the replaced lines",
	preambleOnce(RULE_LINE.fullSuiteFallback) && preambleOnce(RULE_LINE.briefNamedTests)
		&& !preambleText.includes("Run the repository's full suite only where its `AGENTS.md` says CI does not cover it")
		&& !preambleText.includes("Fix the class, not the named example")
		&& !preambleText.includes("your last commit follows a green full suite")
		&& !preambleText.includes("When your brief asks for CI, read the finished run once and report")
		&& !preambleText.includes("the suite summary line with its check count; and what was not done."),
	preambleText);
const defaultPairs = [["--provider", "openai-codex"], ["--model", "gpt-6-luna"], ["--thinking", "high"], ["-t", "read,grep,find,bash,edit,write"]];
const receivedArgs = result.split("\n");
// req: R-961
check("lane passes only the sealed roster and fixed brief instruction", defaultPairs.every(([flag, value]) => receivedArgs.indexOf(flag) >= 0 && receivedArgs[receivedArgs.indexOf(flag) + 1] === value && receivedArgs.filter((seen) => seen === flag).length === 1) && receivedArgs.includes("Do the work in your brief for lane alpha. Your cwd is the lane worktree. Finish with the report shape the brief gives."));
fs.rmSync(piSpawnMarker, { force: true });
const overridden = run(lane, ["--lane", "alpha", "--brief", brief], {}, ["--provider", "override-provider", "--model", "override-model", "--thinking", "low", "-p", "instruction"]);
// req: R-961
check("lane mode refuses all caller pi arguments before lock or spawn", overridden.status === 1 && /caller pi arguments are refused/.test(overridden.stderr) && !fs.existsSync(piSpawnMarker) && !fs.existsSync(laneLockPath));
const missingTools = run(lane, ["--lane", "alpha", "--brief", brief], {}, ["-t", "read,grep,find,bash", "-p", "instruction"]);
// req: R-961
check("lane refuses caller tools without edit and write", missingTools.status === 1 && /caller pi arguments are refused/.test(missingTools.stderr));
const toolControlForms = [["-t", "read,edit,write"], ["--tools", "read,edit,write"], ["--exclude-tools", "edit"], ["--no-tools"]];
// req: R-961
check("lane refuses tool-control forms -t, --tools, --exclude-tools, --no-tools", toolControlForms.every((form) => run(lane, ["--lane", "alpha", "--brief", brief], {}, form).status === 1));
const resourceDisableForms = [["-nc"], ["--no-context-files"], ["-ne"], ["--no-extensions"], ["-na"], ["--no-approve"]];
// req: R-961
check("lane refuses resource-disabling forms -nc, --no-context-files, -ne, --no-extensions, -na, --no-approve", resourceDisableForms.every((form) => run(lane, ["--lane", "alpha", "--brief", brief], {}, form).status === 1));
// req: R-961
check("lane refuses retries before launch", run(lane, ["--lane", "alpha", "--brief", brief, "--retries", "1"]).status === 1 && /--retries greater than zero/.test(run(lane, ["--lane", "alpha", "--brief", brief, "--retries", "1"]).stderr));

const freshAgentDir = (label) => { const d = path.join(temp, `agent-${label}`); fs.mkdirSync(d, { recursive: true }); return d; };
const writeRoster = (dir, roster) => { const f = path.join(dir, "nana-pack.json"); fs.writeFileSync(f, JSON.stringify({ roster })); return f; };
const rosterEntry = (provider, model, thinking) => ({ provider, model, thinking });
const sampleRoster = () => ({ scout: null, builder: rosterEntry("example-gateway", "roster-model", "low"), reviewer: rosterEntry("example-gateway", "gpt-5.6-sol", null), land: null });

fs.rmSync(piSpawnMarker, { force: true });
const rosterGoodDir = freshAgentDir("roster-good");
writeRoster(rosterGoodDir, sampleRoster());
const rosterGoodRun = run(lane, ["--lane", "alpha", "--brief", brief], { PI_CODING_AGENT_DIR: rosterGoodDir });
const rosterGoodArgs = (fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "").split("\n");
// req: R-961
check("lane passes the machine roster builder to pi, each flag once",
	rosterGoodRun.status === 0 && [["--provider", "example-gateway"], ["--model", "roster-model"], ["--thinking", "low"]].every(([flag, value]) =>
		rosterGoodArgs.indexOf(flag) >= 0 && rosterGoodArgs[rosterGoodArgs.indexOf(flag) + 1] === value && rosterGoodArgs.filter((seen) => seen === flag).length === 1),
	rosterGoodRun.stderr);

fs.rmSync(piSpawnMarker, { force: true });
const rosterNullDir = freshAgentDir("roster-null-thinking");
writeRoster(rosterNullDir, { ...sampleRoster(), builder: rosterEntry("example-gateway", "roster-model", null) });
const rosterNullRun = run(lane, ["--lane", "alpha", "--brief", brief], { PI_CODING_AGENT_DIR: rosterNullDir });
const rosterNullArgs = (fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "").split("\n");
// req: R-961
check("lane omits --thinking when the machine roster builder thinking is null",
	rosterNullRun.status === 0 && !rosterNullArgs.includes("--thinking") && rosterNullArgs.includes("--provider") && rosterNullArgs.includes("roster-model"),
	rosterNullRun.stderr);

fs.rmSync(piSpawnMarker, { force: true });
const rosterBadDir = freshAgentDir("roster-bad");
const rosterBadFile = writeRoster(rosterBadDir, { ...sampleRoster(), builder: null });
const rosterBadRun = run(lane, ["--lane", "alpha", "--brief", brief], { PI_CODING_AGENT_DIR: rosterBadDir });
// req: R-961
check("lane refuses a refused roster before starting pi, naming the file",
	rosterBadRun.status === 1 &&
	rosterBadRun.stderr === `pi-worker: lane refused: roster refused: ${rosterBadFile}: roster.builder is not an entry (null)\n` &&
	!fs.existsSync(piSpawnMarker) && !fs.existsSync(laneLockPath),
	rosterBadRun.stderr);

fs.rmSync(piSpawnMarker, { force: true });
const projectPiDir = path.join(lane, ".pi");
fs.mkdirSync(projectPiDir, { recursive: true });
fs.writeFileSync(path.join(projectPiDir, "nana-pack.json"), JSON.stringify({ roster: { ...sampleRoster(), builder: rosterEntry("project-gateway", "project-model", "low") } }));
const projectIgnoredRun = run(lane, ["--lane", "alpha", "--brief", brief]);
fs.rmSync(projectPiDir, { recursive: true, force: true });
const projectIgnoredArgs = (fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "").split("\n");
// req: R-1121
check("lane ignores a roster in project .pi/nana-pack.json",
	projectIgnoredRun.status === 0 &&
	projectIgnoredArgs.indexOf("--provider") >= 0 && projectIgnoredArgs[projectIgnoredArgs.indexOf("--provider") + 1] === "openai-codex" &&
	projectIgnoredArgs.indexOf("--model") >= 0 && projectIgnoredArgs[projectIgnoredArgs.indexOf("--model") + 1] === "gpt-6-luna",
	projectIgnoredRun.stderr);

fs.rmSync(piSpawnMarker, { force: true });
const builderLineRun = run(lane, ["--lane", "alpha", "--brief", brief]);
const builderLines = builderLineRun.stderr.split(/\r?\n/).filter((l) => l.startsWith("pi-worker: builder:"));
const builderLineIdx = builderLineRun.stderr.indexOf("pi-worker: builder:");
const attemptIdx = builderLineRun.stderr.indexOf("[pi-worker] attempt 1/1");
fs.rmSync(piSpawnMarker, { force: true });
const builderLineFileDir = freshAgentDir("roster-builder-line-file");
const builderLineFile = writeRoster(builderLineFileDir, { ...sampleRoster(), builder: rosterEntry("example-gateway", "roster-model", null) });
const builderLineFileRun = run(lane, ["--lane", "alpha", "--brief", brief], { PI_CODING_AGENT_DIR: builderLineFileDir });
const builderLinesFile = builderLineFileRun.stderr.split(/\r?\n/).filter((l) => l.startsWith("pi-worker: builder:"));
// req: R-1124
check("lane prints the resolved builder and roster source on stderr before starting pi",
	builderLineRun.status === 0 && builderLines.length === 1 && builderLines[0] === "pi-worker: builder: openai-codex gpt-6-luna high; source: default" && builderLineIdx >= 0 && attemptIdx >= 0 && builderLineIdx < attemptIdx &&
	builderLineFileRun.status === 0 && builderLinesFile.length === 1 && builderLinesFile[0] === `pi-worker: builder: example-gateway roster-model default; source: ${builderLineFile}`,
	`${builderLineRun.stderr}\n---\n${builderLineFileRun.stderr}`);

fs.rmSync(piSpawnMarker, { force: true });
const w1Dir = freshAgentDir("lane-size-larger-pi");
writeRoster(w1Dir, { ...sampleRoster(), largerBuilder: rosterEntry("example-gateway", "larger-model", "medium") });
const w1Run = run(lane, ["--lane", "alpha", "--brief", brief, "--lane-size", "larger"], { PI_CODING_AGENT_DIR: w1Dir });
const w1Args = (fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "").split("\n");
// req: R-1190 R-961
check("lane size larger starts pi with the larger-lane builder's provider, model and thinking, each flag once",
	w1Run.status === 0 && [["--provider", "example-gateway"], ["--model", "larger-model"], ["--thinking", "medium"]].every(([flag, flagValue]) =>
		w1Args.indexOf(flag) >= 0 && w1Args[w1Args.indexOf(flag) + 1] === flagValue && w1Args.filter((seen) => seen === flag).length === 1),
	w1Run.stderr);

fs.rmSync(piSpawnMarker, { force: true });
const w2Dir = freshAgentDir("lane-size-larger-null");
writeRoster(w2Dir, sampleRoster());
const w2Run = run(lane, ["--lane", "alpha", "--brief", brief, "--lane-size", "larger"], { PI_CODING_AGENT_DIR: w2Dir });
const w2Args = (fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "").split("\n");
const w2Lines = w2Run.stderr.split(/\r?\n/).filter((l) => l.startsWith("pi-worker: builder"));
// req: R-1190
check("lane size larger with no larger-lane builder starts pi with the builder",
	w2Run.status === 0 && w2Args.indexOf("--provider") >= 0 && w2Args[w2Args.indexOf("--provider") + 1] === "example-gateway" &&
	w2Args.indexOf("--model") >= 0 && w2Args[w2Args.indexOf("--model") + 1] === "roster-model" &&
	// the null-slot fallback prints the plain "builder:" line, never "builder (larger lanes):"
	w2Lines.length === 1 && w2Lines[0].startsWith("pi-worker: builder:") && !w2Lines[0].includes("(larger lanes)"),
	w2Run.stderr);

fs.rmSync(piSpawnMarker, { force: true });
const wSmallDir = freshAgentDir("lane-size-small-with-larger-set");
writeRoster(wSmallDir, { ...sampleRoster(), largerBuilder: rosterEntry("example-gateway", "larger-model", "medium") });
const wSmallRun = run(lane, ["--lane", "alpha", "--brief", brief, "--lane-size", "small"], { PI_CODING_AGENT_DIR: wSmallDir });
const wSmallArgs = (fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "").split("\n");
const wSmallLines = wSmallRun.stderr.split(/\r?\n/).filter((l) => l.startsWith("pi-worker: builder"));
// req: R-1190
check("lane size small starts pi with the builder even when largerBuilder is set",
	wSmallRun.status === 0 &&
	wSmallArgs.indexOf("--provider") >= 0 && wSmallArgs[wSmallArgs.indexOf("--provider") + 1] === "example-gateway" &&
	wSmallArgs.indexOf("--model") >= 0 && wSmallArgs[wSmallArgs.indexOf("--model") + 1] === "roster-model" &&
	!wSmallArgs.includes("larger-model") &&
	wSmallLines.length === 1 && wSmallLines[0].startsWith("pi-worker: builder:") && !wSmallLines[0].includes("(larger lanes)"),
	wSmallRun.stderr);

// req: R-960
check("lane size with a missing or unknown value refuses before pi spawn", (() => {
	const cases = [
		["lane-size option missing", ["--lane", "alpha", "--brief", brief, "--lane-size"]],
		["lane-size unknown value", ["--lane", "alpha", "--brief", brief, "--lane-size", "medium"]],
	];
	return cases.every(([, args]) => {
		fs.rmSync(piSpawnMarker, { force: true });
		const result = run(lane, args);
		return result.status === 1 && /lane refused/.test(result.stderr) && !fs.existsSync(piSpawnMarker);
	});
})());

fs.rmSync(piSpawnMarker, { force: true });
const w5Dir = freshAgentDir("lane-size-larger-line");
const w5File = writeRoster(w5Dir, { ...sampleRoster(), largerBuilder: rosterEntry("example-gateway", "larger-model", null) });
const w5Run = run(lane, ["--lane", "alpha", "--brief", brief, "--lane-size", "larger"], { PI_CODING_AGENT_DIR: w5Dir });
const w5Lines = w5Run.stderr.split(/\r?\n/).filter((l) => l.startsWith("pi-worker: builder"));
// req: R-1124
check("lane size larger prints the larger-lane builder line before starting pi",
	w5Run.status === 0 && w5Lines.length === 1 && w5Lines[0] === `pi-worker: builder (larger lanes): example-gateway larger-model default; source: ${w5File}`,
	w5Run.stderr);

// req: R-1212
check("with a larger-lane builder set, a launch with no lane size, the --lane-size=larger form included, is refused before lock or spawn, naming largerBuilder and both sizes", (() => {
	const dir = freshAgentDir("lane-size-required");
	writeRoster(dir, { ...sampleRoster(), largerBuilder: rosterEntry("example-gateway", "larger-model", null) });
	const refusalOk = (stderr) => stderr.includes("largerBuilder") && /--lane-size larger/.test(stderr) && /--lane-size small/.test(stderr);
	const cases = [["no --lane-size", []], ["--lane-size=larger form", ["--lane-size=larger"]]];
	const plainOk = cases.every(([, extra]) => {
		fs.rmSync(piSpawnMarker, { force: true });
		const result = run(lane, ["--lane", "alpha", "--brief", brief, ...extra], { PI_CODING_AGENT_DIR: dir });
		return result.status === 1 && refusalOk(result.stderr) && !fs.existsSync(piSpawnMarker) && !fs.existsSync(laneLockPath);
	});
	// A lock already held by another run must be left untouched: the refusal fires before any
	// lock attempt, so a mutation that moves it after the lock would surface the lock-exists
	// refusal instead and touch this file.
	fs.rmSync(piSpawnMarker, { force: true });
	fs.writeFileSync(laneLockPath, "424242\n");
	const preLockResult = run(lane, ["--lane", "alpha", "--brief", brief], { PI_CODING_AGENT_DIR: dir });
	const preLockOk = preLockResult.status === 1 && refusalOk(preLockResult.stderr) && !/worktree lock/.test(preLockResult.stderr) &&
		fs.existsSync(laneLockPath) && fs.readFileSync(laneLockPath, "utf8") === "424242\n" && !fs.existsSync(piSpawnMarker);
	fs.rmSync(laneLockPath, { force: true });
	return plainOk && preLockOk;
})());

const laneSpawnCount = path.join(temp, "lane-spawns");
writeStub(`#!/bin/sh\necho spawned >> "${laneSpawnCount}"\necho output\nsleep 3\n`,
	`const fs = require("node:fs");\nfs.appendFileSync(${JSON.stringify(laneSpawnCount)}, "spawned\\n");\nconsole.log("output");\nsetTimeout(() => {}, 3000);\n`);
const launchTogether = () => spawn(process.execPath, [worker, "--poll", "0.1", "--out", out, "--lane", "alpha", "--brief", brief], { cwd: lane, env: { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, USERPROFILE: temp, PI_CODING_AGENT_DIR: defaultAgentDir }, stdio: "ignore" });
const lockChildren = [launchTogether(), launchTogether()];
await Promise.all(lockChildren.map((child) => new Promise((resolve) => child.once("close", resolve))));
// req: R-960
check("synchronized concurrent lane launchers spawn exactly one pi", fs.readFileSync(laneSpawnCount, "utf8").trim().split("\n").length === 1);
// On win32 the wrapper below is never found: Node's PATH search for an extensionless name tries
// only .com/.exe (R-1033/win-command.mjs), so the real git.exe runs and the branch never appears
// changed. No .cmd/.bat stands in, because that lookup tries no other extension either.
if (process.platform !== "win32") {
	const gitCalls = path.join(temp, "git-branch-calls");
	const gitWrapper = path.join(stubDir, "git");
	fs.writeFileSync(gitWrapper, `#!/bin/sh\nif [ "$1" = "branch" ] && [ "$2" = "--show-current" ]; then n=$(cat "${gitCalls}" 2>/dev/null || echo 0); n=$((n+1)); echo "$n" > "${gitCalls}"; if [ "$n" -ge 2 ]; then echo feat/other; exit 0; fi; fi\nexec /usr/bin/git "$@"\n`); fs.chmodSync(gitWrapper, 0o755);
	fs.rmSync(piSpawnMarker, { force: true });
	const changedBranch = run(lane, ["--lane", "alpha", "--brief", brief], { PATH: `${stubDir}${path.delimiter}${process.env.PATH}` });
	git(lane, "checkout", "-q", "feat/alpha");
	fs.unlinkSync(gitWrapper);
	// req: R-960
	check("production lane revalidation refuses changed branch before pi spawn", changedBranch.status === 1 && changedBranch.stderr.includes("expected feat/alpha") && !fs.existsSync(piSpawnMarker) && !fs.existsSync(laneLockPath));
} else {
	console.log("SKIP production lane revalidation refuses changed branch before pi spawn — Node's Windows PATH search tries only .com/.exe, so the extensionless git wrapper cannot run");
}
writeStub(mainPosixScript(false), mainNodeBody(false));
// req: R-965
check("missing trust prints notice before worker attempt", good.stderr.indexOf("trust: none for") >= 0 && good.stderr.indexOf("trust: none for") < good.stderr.indexOf("attempt 1"));
const trustDir = path.join(temp, ".pi", "agent"); fs.mkdirSync(trustDir, { recursive: true });
fs.writeFileSync(path.join(trustDir, "trust.json"), JSON.stringify({ [real(lane)]: true }));
const trusted = run(lane, ["--lane", "alpha", "--brief", brief]);
// req: R-965
check("affirmative trust record suppresses notice", trusted.status === 0 && !trusted.stderr.includes("trust: none for"));
const lockDir = laneLockPath;
// req: R-960
check("handled worker exit removes its worktree lock", !fs.existsSync(lockDir));
fs.writeFileSync(lockDir, "not-a-pid\n");
const unreadableLockRun = run(lane, ["--lane", "alpha", "--brief", brief]);
// req: R-960
check("unreadable worktree lock is refused", unreadableLockRun.status === 1 && unreadableLockRun.stderr.includes(lockDir) && /recorded pid unreadable/.test(unreadableLockRun.stderr));
fs.writeFileSync(lockDir, "999999999\n");
const staleLockRun = run(lane, ["--lane", "alpha", "--brief", brief]);
// req: R-960
check("existing worktree lock refuses and names path and pid", staleLockRun.status === 1 && staleLockRun.stderr.includes(lockDir) && /pid 999999999/.test(staleLockRun.stderr) && /confirm no builder and no pi process group.*remov.*by hand/i.test(staleLockRun.stderr) && fs.existsSync(lockDir), staleLockRun.stderr);
fs.rmSync(lockDir);
const config = await import("../bin/worker-config.mjs");
// req: R-963
check("sealed lane ceiling is 28,800 seconds", config.LANE_MAX_SECS === 28_800);
const descendantPid = path.join(temp, "descendant.pid");
writeStub(`#!/bin/sh\nsleep 30 &\necho $! > "${descendantPid}"\nwait\n`,
	`const { spawn } = require("node:child_process");\nconst fs = require("node:fs");\nconst child = spawn(process.execPath, ["-e", "setTimeout(()=>{}, 30000)"], { stdio: "ignore" });\nfs.writeFileSync(${JSON.stringify(descendantPid)}, String(child.pid) + "\\n");\nchild.on("exit", () => process.exit(0));\n`);
const capped = run(lane, ["--lane", "alpha", "--brief", brief, "--max-secs", "1", "--stall-secs", "10"]);
// req: R-963
check("max-secs override kills and names the lane wall-clock ceiling", capped.status === 1 && /wall-clock ceiling 1s reached/.test(capped.stderr));
let descendantAlive = false;
try { process.kill(Number(fs.readFileSync(descendantPid, "utf8").trim()), 0); descendantAlive = true; } catch { /* process group was reaped */ }
// req: R-963
check("wall-clock ceiling kills the worker process group", capped.status === 1 && !descendantAlive);
