/**
 * @module packages/nana-pack/tests/worker-lane.test.mjs
 * @purpose Pins fail-closed lane verification, preamble delivery, and the sealed worker ceiling.
 * @inputs pi-worker, a temporary git repository/worktree, and a stub pi executable
 * @outputs named PASS/FAIL checks
 * @effects disk (OS temp fixtures), process (git and worker subprocesses)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
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
git(repo, "add", "seed"); git(repo, "commit", "-qm", "seed");
git(repo, "worktree", "add", "-qb", "feat/alpha", lane);
const laneGitDir = real(path.resolve(lane, git(lane, "rev-parse", "--git-dir").stdout.trim()));
const laneLockPath = path.join(laneGitDir, "nana-lane.lock");
const brief = path.join(temp, "brief.md"); fs.writeFileSync(brief, "lane brief content");
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
const run = (cwd, args, more = {}, piArgs = []) => spawnSync(process.execPath, [worker, "--poll", "0.1", "--out", out, ...args, ...(piArgs.length ? ["--", ...piArgs] : [])], {
	cwd, encoding: "utf8", timeout: 15000,
	env: { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, PI_CODING_AGENT_DIR: defaultAgentDir, ...more },
});
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) process.exitCode = 1; };
const legacyRepeat = run(lane, ["--poll", "invalid"], {}, ["-p", "legacy"]);
// req: R-960
check("non-lane repeated worker options keep the legacy first-occurrence behaviour", legacyRepeat.status === 0 && !/duplicate option/.test(legacyRepeat.stderr), legacyRepeat.stderr);
fs.rmSync(piSpawnMarker, { force: true }); fs.rmSync(out, { force: true });
// req: R-960
check("non-lane usage text remains the legacy form", spawnSync(process.execPath, [worker], { cwd: lane, encoding: "utf8" }).stderr === "usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n");
// req: R-960
check("lane options with missing values refuse before pi spawn", (() => {
	const cases = [
		["lane option missing", ["--lane"]],
		["lane option empty", ["--lane", ""]],
		["lane option starts with dash", ["--lane", "-alpha"]],
		["brief option missing", ["--lane", "alpha", "--brief"]],
		["max-secs option missing", ["--lane", "alpha", "--brief", brief, "--max-secs"]],
		["repeated lane with trailing missing value", ["--lane", "alpha", "--brief", brief, "--lane"]],
		["repeated brief with trailing missing value", ["--lane", "alpha", "--brief", brief, "--brief"]],
		["repeated max-secs with trailing missing value", ["--lane", "alpha", "--brief", brief, "--max-secs", "30", "--max-secs"]],
		["brief missing even without lane value", ["--brief"]],
		["max-secs missing even without lane value", ["--max-secs"]],
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
const good = run(lane, ["--lane", "alpha", "--brief", path.relative(lane, brief)]);
const result = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
const promptPaths = result.split("\n").reduce((all, arg, i, args) => arg === "--append-system-prompt" ? [...all, args[i + 1]] : all, []);
const prompt1Path = path.join(temp, "prompt-1");
// A missing prompt-1 (the win32 stub's copy failed) fails this check by name rather than
// throwing ENOENT and crashing the rest of the file.
const prompt1Text = fs.existsSync(prompt1Path) ? fs.readFileSync(prompt1Path, "utf8") : "";
// req: R-961
check("verified lane passes preamble and validated brief as ordered file paths", good.status === 0 && /worker:/.test(result) && promptPaths.length === 2 && !fs.existsSync(promptPaths[0]) && promptPaths[1] === real(brief) && prompt1Text.includes("on branch feat/alpha") && fs.readFileSync(path.join(temp, "prompt-2"), "utf8") === "lane brief content", `${good.stderr}${result} paths=${promptPaths.join(",")}`);
const plainWorker = run(lane, [], { NANA_ROLE: "inherited" }, ["-p", "plain"]);
const plainResult = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
// req: R-286
check("every pi-worker child receives NANA_ROLE=worker", result.startsWith("worker:") && plainWorker.status === 0 && plainResult.startsWith("worker:"), `${result}\n${plainResult}`);
// req: R-628
check("lane preamble forbids the named package-manager operations at a worktree root", prompt1Text.includes("Never run pnpm, npm, or npx install, exec, add, or dlx at a worktree root"));
const preambleText = prompt1Text;
const RULE_LINE = {
	wrongCodeFirst: "Wrong code first: run each new test against the obvious wrong implementation and see it fail before you write the code.",
	mustMeetTests: "Write the must-meet tests your brief names and no other new test, except the one test that pins each new sealed tunable. Edit an existing test only where your change makes it false, and list each such edit in your report.",
	awaitEveryAsyncCase: "A test harness awaits every async case under a per-case limit.",
	crlfAndWhitespace: "A change that reads text line by line gets CRLF, trailing space or tab, and no-final-newline cases.",
	idsFromBriefRange: "New requirement rows take IDs only from the range your brief names.",
	noSuiteTestRunsSeatScript: "No suite test runs, imports or copies a seat script.",
	noUnnamedTestDeleted: "Never delete a test your brief does not name.",
	touchedTestsBeforeCommit: "Each commit follows a green run of the tests your change touches; your last commit follows a green full suite.",
	seatChecksBeforeDone: "Run every seat check your brief names on your last commit. DONE means each one passes; a title check passes only at `0 missing`.",
	longOutputToFile: "Send long script output to a committed file and paste only the lines your brief asks for.",
	readCiOnce: "When your brief asks for CI, read the finished run once and report. Do not wait for another notification.",
	suiteCheckCountInReport: "Then commits; per item, files, rows, mutation pairs, commands and exit codes; the suite summary line with its check count; and what was not done.",
};
const preambleOnce = (line) => preambleText.includes(line) && preambleText.split(line).length - 1 === 1;
// req: R-1110
check("lane preamble carries: wrong code first", preambleOnce(RULE_LINE.wrongCodeFirst), RULE_LINE.wrongCodeFirst);
// req: R-1110
check("lane preamble carries: must-meet tests and no other new test, with the seal-test exception", preambleOnce(RULE_LINE.mustMeetTests), RULE_LINE.mustMeetTests);
// req: R-1110
check("lane preamble carries: await every async case", preambleOnce(RULE_LINE.awaitEveryAsyncCase), RULE_LINE.awaitEveryAsyncCase);
// req: R-1110
check("lane preamble carries: CRLF and whitespace cases", preambleOnce(RULE_LINE.crlfAndWhitespace), RULE_LINE.crlfAndWhitespace);
// req: R-1110
check("lane preamble carries: IDs from the brief's range", preambleOnce(RULE_LINE.idsFromBriefRange), RULE_LINE.idsFromBriefRange);
// req: R-1110
check("lane preamble carries: no suite test runs a seat script", preambleOnce(RULE_LINE.noSuiteTestRunsSeatScript), RULE_LINE.noSuiteTestRunsSeatScript);
// req: R-1110
check("lane preamble carries: no unnamed test deleted", preambleOnce(RULE_LINE.noUnnamedTestDeleted), RULE_LINE.noUnnamedTestDeleted);
// req: R-1110
check("lane preamble carries: touched tests before each commit and the full suite before the last", preambleOnce(RULE_LINE.touchedTestsBeforeCommit), RULE_LINE.touchedTestsBeforeCommit);
// req: R-1110
check("lane preamble carries: seat checks before DONE", preambleOnce(RULE_LINE.seatChecksBeforeDone), RULE_LINE.seatChecksBeforeDone);
// req: R-1110
check("lane preamble carries: long output to a committed file", preambleOnce(RULE_LINE.longOutputToFile), RULE_LINE.longOutputToFile);
// req: R-1110
check("lane preamble carries: read CI once", preambleOnce(RULE_LINE.readCiOnce), RULE_LINE.readCiOnce);
// req: R-1110
check("lane preamble carries: the suite check count in the report", preambleOnce(RULE_LINE.suiteCheckCountInReport), RULE_LINE.suiteCheckCountInReport);
// req: R-1110
check("R-1110: the builder preamble has the must-meet line with its seal-test exception and no fix-the-class line",
	preambleOnce(RULE_LINE.mustMeetTests) && !preambleText.includes("Fix the class, not the named example"),
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

fs.rmSync(piSpawnMarker, { force: true });
const w3 = (() => {
	const results = [];
	const refusalOk = (stderr) => stderr.includes("roster.largerBuilder") && /starts pi entries only/.test(stderr) &&
		/subagent from a Claude Code seat/.test(stderr) && /put a pi entry in largerBuilder/.test(stderr);
	const w3Dir = freshAgentDir("lane-size-larger-claude");
	writeRoster(w3Dir, { ...sampleRoster(), largerBuilder: { runtime: "claude-code", model: "sonnet" } });
	const w3Run = run(lane, ["--lane", "alpha", "--brief", brief, "--lane-size", "larger"], { PI_CODING_AGENT_DIR: w3Dir });
	results.push(["no pre-existing lock", w3Run.status === 1 && refusalOk(w3Run.stderr) && !fs.existsSync(piSpawnMarker) && !fs.existsSync(laneLockPath)]);
	// A lock already held by another run must be left untouched: the refusal fires before any
	// lock attempt, so a mutation that moves it after the lock would instead surface the
	// lock-exists refusal (and release the pre-existing lock as its own cleanup) — pair 53.
	fs.rmSync(piSpawnMarker, { force: true });
	fs.writeFileSync(laneLockPath, "424242\n");
	const w3PreLockDir = freshAgentDir("lane-size-larger-claude-prelock");
	writeRoster(w3PreLockDir, { ...sampleRoster(), largerBuilder: { runtime: "claude-code", model: "sonnet" } });
	const w3PreLockRun = run(lane, ["--lane", "alpha", "--brief", brief, "--lane-size", "larger"], { PI_CODING_AGENT_DIR: w3PreLockDir });
	const preLockUntouched = fs.existsSync(laneLockPath) && fs.readFileSync(laneLockPath, "utf8") === "424242\n";
	results.push(["pre-existing lock left untouched, same refusal", w3PreLockRun.status === 1 && refusalOk(w3PreLockRun.stderr) && !/worktree lock/.test(w3PreLockRun.stderr) && preLockUntouched && !fs.existsSync(piSpawnMarker)]);
	fs.rmSync(laneLockPath, { force: true });
	return { pass: results.every(([, p]) => p), results };
})();
// req: R-1191
check("lane size larger refuses a Claude Code larger-lane builder before lock or spawn, naming roster.largerBuilder and both ways out as the user's choice", w3.pass, JSON.stringify(w3.results));

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
const launchTogether = () => spawn(process.execPath, [worker, "--poll", "0.1", "--out", out, "--lane", "alpha", "--brief", brief], { cwd: lane, env: { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, PI_CODING_AGENT_DIR: defaultAgentDir }, stdio: "ignore" });
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
