/**
 * @module packages/nana-pack/tests/brief-check.test.mjs
 * @purpose Prove brief-check and pi-worker share lane-brief precedent validation without brief-check starting pi.
 * @inputs The two commands, their shared checker source, and a temporary linked-worktree fixture.
 * @outputs Requirement-tagged PASS/FAIL checks.
 * @effects disk (OS temp fixtures and a slow CPU-sampler shim), process (git, command subprocesses
 *  and the bounded shim)
 * @errors A failed comparison prints its cases and exits nonzero.
 */
import { readBrief, checkPrecedent } from "../lib/brief-precedent.mjs";
import * as briefConfig from "../lib/brief-config.mjs";
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
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const worker = path.join(root, "bin", "pi-worker.mjs");
const briefCheck = path.join(root, "bin", "brief-check.mjs");
const sharedCheck = path.join(root, "lib", "brief-precedent.mjs");
const temp = tmpDir(path.join(os.tmpdir(), "brief-check-"));
const repo = path.join(temp, "repo");
const lane = path.join(temp, "lane");
const stubDir = path.join(temp, "stub");
const marker = path.join(temp, "pi-spawned");
const holdRecord = path.join(temp, "pi-hold.json");
const samplerMarker = path.join(temp, "sampler-started");
const out = path.join(temp, "worker-output.md");
const agentDir = path.join(temp, "agent");
fs.mkdirSync(repo);
fs.mkdirSync(stubDir);
fs.mkdirSync(agentDir);

const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args], {
	cwd, encoding: "utf8", timeout: 10_000,
});
let result = git(repo, "init", "-q");
if (result.status !== 0) throw new Error(result.stderr);
fs.writeFileSync(path.join(repo, "seed"), "seed\n");
fs.mkdirSync(path.join(repo, "docs", "known-bugs"), { recursive: true });
fs.writeFileSync(path.join(repo, "docs", "known-bugs", "FEAT-006.md"), "# Fixture known bugs\n");
git(repo, "add", "seed", "docs/known-bugs/FEAT-006.md");
git(repo, "commit", "-qm", "fixture");
git(repo, "worktree", "add", "-qb", "feat/alpha", lane);

// measured 2026-10-23 (R-2670): 15 Windows legs passed brief-check in 1.8 to 4.0 seconds,
// all from legs that failed elsewhere; 30 seconds is 7.5 times the slowest, matches build-records'
// CASE_LIMIT_MS, and keeps seven children under the 300-second per-file land limit.
const CHILD_LIMIT_MS = 30_000;
const nodeBody = `const fs = require("node:fs");\nconst started = Date.now();\nfs.writeFileSync(${JSON.stringify(marker)}, "spawned\\n");\nsetTimeout(() => { fs.writeFileSync(${JSON.stringify(holdRecord)}, JSON.stringify({ heldMs: Date.now() - started })); process.stdout.write("worker output\\n"); }, ${FAKE_PI_HOLD_MS});\n`;
if (process.platform === "win32") writeFakePi(stubDir, nodeBody);
else {
	const body = path.join(stubDir, "fake-pi.cjs");
	fs.writeFileSync(body, nodeBody);
	const pi = path.join(stubDir, "pi");
	fs.writeFileSync(pi, `#!/bin/sh\nexec "${process.execPath}" "${body}" "$@"\n`);
	fs.chmodSync(pi, 0o755);
}
const { samplerShim } = writeSlowSampler(stubDir);
const env = { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, USERPROFILE: temp, PI_CODING_AGENT_DIR: agentDir, SAMPLER_MARKER: samplerMarker, SLOW_SAMPLER_MS: String(SLOW_SAMPLER_MS) };
const resolvedSampler = resolveSampler(env, CHILD_LIMIT_MS);
const writeBrief = (name, text) => {
	const file = path.join(temp, name);
	fs.writeFileSync(file, text);
	return file;
};
const runWorker = (brief) => spawnSync(process.execPath, [worker, "--poll", String(WORKER_POLL_SECS), "--out", out, "--lane", "alpha", "--brief", brief], {
	cwd: lane, encoding: "utf8", timeout: CHILD_LIMIT_MS, env,
});
const runCheck = (brief, cwd = lane) => spawnSync(process.execPath, [briefCheck, "--brief", brief, "--tree", lane], {
	cwd, encoding: "utf8", timeout: CHILD_LIMIT_MS, env,
});
const selectedLine = (stderr) => stderr.split(/\r?\n/).find((line) => line.startsWith("pi-worker: lane refused:") || line.startsWith("pi-worker: precedent:")) ?? null;
const cases = [
	["missing section", writeBrief("missing.md", "Feature: FEAT-006 · Missing\n"), 1, "pi-worker: lane refused:"],
	["untracked path", writeBrief("untracked.md", "Precedent:\n- missing.mjs\n"), 1, "pi-worker: lane refused:"],
	["passing with known bugs", writeBrief("passing.md", "Feature: FEAT-006 · Passing\n\nPrecedent:\n- seed\n"), 0, "pi-worker: precedent:"],
];
const observations = [];
for (const [name, brief, expectedStatus, prefix] of cases) {
	fs.rmSync(marker, { force: true });
	const workerResult = runWorker(brief);
	const workerLine = selectedLine(workerResult.stderr);
	const workerStarted = fs.existsSync(marker);
	fs.rmSync(marker, { force: true });
	const checkResult = runCheck(brief);
	const checkLine = selectedLine(checkResult.stderr);
	observations.push({
		name,
		ok: workerResult.status === expectedStatus && checkResult.status === expectedStatus &&
			workerLine?.startsWith(prefix) && checkLine === workerLine && !fs.existsSync(marker) &&
			(expectedStatus === 0 ? workerStarted && workerLine.includes("known bugs: docs/known-bugs/FEAT-006.md") : !workerStarted),
		workerStatus: workerResult.status,
		checkStatus: checkResult.status,
		workerLine,
		checkLine,
		checkStderr: checkResult.stderr,
	});
}
const workerSource = fs.readFileSync(worker, "utf8");
const checkerSource = fs.existsSync(briefCheck) ? fs.readFileSync(briefCheck, "utf8") : "";
const sharedByBoth = fs.existsSync(sharedCheck) &&
	workerSource.includes("checkBriefForLaunch") && checkerSource.includes("checkBriefForLaunch") &&
	workerSource.includes("../lib/brief-precedent.mjs") && checkerSource.includes("../lib/brief-precedent.mjs") &&
	!["readBrief", "checkPrecedent", "ls-tree", "KNOWN_BUGS_DIR"].some((token) => checkerSource.includes(token));

const hold = fs.existsSync(holdRecord) ? JSON.parse(fs.readFileSync(holdRecord, "utf8")) : null;
const samplerResolvedFirst = samplerIsFirst(resolvedSampler, samplerShim);
const ok = observations.every((entry) => entry.ok) && sharedByBoth;
const check = (title, pass, detail = "") => {
	console.log(pass ? "PASS" : "FAIL", title, pass ? "" : detail);
	if (!pass) process.exitCode = 1;
};
// req: R-2585
check("R-2585: brief-check prints what pi-worker would print for the same brief and starts nothing", ok, JSON.stringify({ observations, sharedByBoth }));
// req: R-2670
check("R-2670: brief-check and pi-worker give the same line for every brief while a CPU sampler slower than the child limit is first on PATH, and the sampler never runs",
	ok && samplerResolvedFirst && hold?.heldMs >= FAKE_PI_HOLD_MS && !fs.existsSync(samplerMarker),
	JSON.stringify({ observations, sharedByBoth, resolvedSampler, samplerShim, hold, samplerStarted: fs.existsSync(samplerMarker) }),
);
// req: R-2670
check("seal: R-2585's children have a 30-second limit and the worker polls less often than that", CHILD_LIMIT_MS === 30_000 && WORKER_POLL_SECS * 1000 > CHILD_LIMIT_MS, JSON.stringify({ CHILD_LIMIT_MS, WORKER_POLL_SECS }));

const unreadableName = "passing.md";
const unreadableTreePath = path.join(lane, unreadableName);
const unrelatedBrief = writeBrief(unreadableName, "Precedent:\n- seed\n");
fs.rmSync(unreadableTreePath, { force: true });
const unreadableResult = runCheck(unreadableName, temp);
const unreadableLines = unreadableResult.stderr.trimEnd().split(/\r?\n/);
const expectedTriedPath = path.resolve(lane, unreadableName);
// req: R-2621
check("R-2621: brief-check names the brief path it tried and the base a relative brief resolves from",
	unreadableResult.status === 1 && unreadableLines.length === 1 && unreadableLines[0].startsWith("brief-check:") &&
	unreadableLines[0].includes(expectedTriedPath) && unreadableLines[0].includes("--tree") &&
	fs.existsSync(unrelatedBrief) && !fs.existsSync(unreadableTreePath), unreadableResult.stderr);

// Literal compatibility fixtures from anatomy-label-check, ci-suite,
// ci-timing-records and build-records briefs/plans (copied, never read at runtime).
const compatibility = [
	["- `scripts/ci-records.mjs:19-30, :44-67`: `ghFromEnvironment`, the command seam that every OS can use, and `ghResult`, whose result classes these are. Both move into gh-runner.mjs, as named moves, and gain a timeout class.", "scripts/ci-records.mjs", "path"],
	["- REQUIREMENTS.md:788-791 — R-2573, R-2574 and R-2576; R-2905 at `:727`; R-1460's lines at `:2217-2219`.", "REQUIREMENTS.md", "path"],
	["- `apps/bench/lib/anatomy.mjs`", "apps/bench/lib/anatomy.mjs", "path"],
	["- AGENTS.md — \"Shared-machine test runs\" is nana-pi's own section after the markers; \"CI covers this repository's suite\" goes there only (S7). \"Install check before a land\" is left alone.", "AGENTS.md", "path"],
	["- packages/nana-pack/lib/review-run.mjs — admission, command launch and verdict recording.", "packages/nana-pack/lib/review-run.mjs", "path"],
	["- none: no tracked code calls gh today, so the gh runner and its JSON handling are new.", "none:", "none"],
	["- apps/bench/lib/usage.mjs — the Usage sum helpers to move into `packages/nana-pack/lib/pi-usage.mjs` and re-export.", "apps/bench/lib/usage.mjs", "path"],
	["- packages/nana-pack/bin/review-round.mjs — `repoKeyOf`, and the tally's field names.", "packages/nana-pack/bin/review-round.mjs", "path"],
];
// req: R-3718
check("R-3718: literal legacy subjects keep their values and membership outcomes", compatibility.every(([bullet, value, kind]) => {
	const entries = readBrief(`## Precedent\n${bullet}`).precedent;
	return entries[0].value === value && entries[0].kind === kind && checkPrecedent(entries, [value]).length === 0 &&
		checkPrecedent(entries, []).length === (kind === "none" ? 0 : 1);
}));

const runnerPath = "packages/nana-pack/tests/test-runner.test.mjs";
for (const name of [runnerPath, "space"]) {
	fs.mkdirSync(path.dirname(path.join(lane, name)), { recursive: true });
	fs.writeFileSync(path.join(lane, name), "fixture\n");
}
git(lane, "add", runnerPath, "space");
git(lane, "commit", "-qm", "selection fixtures");
const selectionCases = [
	[`- the runner's declared Windows skip list in \`${runnerPath}\` (case J)…`, runnerPath],
	[`- the **runner** in \`${runnerPath}:12-30\`,`, runnerPath],
	[`- the runner reads\n  \`${runnerPath}\``, runnerPath],
	[`- the runner in \`\` ${runnerPath} \`\``, runnerPath],
	["- the file `space name.mjs`", "space"],
	[`- the runner in \`${runnerPath}\` then \`missing.mjs\``, runnerPath],
];
const selectionResults = [];
for (const [bullet, expected] of selectionCases) {
	for (const ending of ["\n", "\r\n", ""]) {
		const text = `## Precedent\n${bullet} \t`.replaceAll("\n", ending === "\r\n" ? "\r\n" : "\n") + ending;
		const brief = writeBrief("selection.md", text);
		fs.rmSync(marker, { force: true });
		const launched = runWorker(brief);
		selectionResults.push(readBrief(text).precedent?.[0].value === expected && launched.status === 0 &&
			fs.existsSync(marker) && selectedLine(launched.stderr)?.startsWith("pi-worker: precedent: 1 checked at HEAD"));
	}
}
// req: R-3716
check("R-3716: prose-first code spans launch with one checked entry", selectionResults.every(Boolean), JSON.stringify(selectionResults));

const longBullet = `- the **wrapped** ${"long note ".repeat(20)}\n  names \`missing.mjs\``;
const refusalCases = [
	["- the missing `missing.mjs`", "missing.mjs"],
	["- the error `ENOTFILE`", "ENOTFILE"],
	["- the invalid `../outside.mjs` then `seed`", "../outside.mjs"],
	["- the prose has no span", "the"],
	["- the URL `https://example.invalid/file`", "https://example.invalid/file"],
	[longBullet, "missing.mjs"],
];
const refusalResults = [];
const head = git(lane, "rev-parse", "--short", "HEAD").stdout.trim();
const rule = "each Precedent bullet names one tracked path, in backticks or as its first word";
for (const [bullet, value] of refusalCases) {
	const brief = writeBrief("refusal.md", `## Precedent\r\n${bullet.replaceAll("\n", "\r\n")}\t`);
	const original = bullet.slice(2).split("\n").map((line) => line.trim()).join(" ");
	const cap = briefConfig.PRECEDENT_QUOTE_CAP;
	const quote = original.length > cap ? original.slice(0, cap - 1) + "…" : original;
	const expected = `pi-worker: lane refused: Precedent entries at HEAD ${head}: ${JSON.stringify(value)} is not tracked at HEAD (bullet: ${JSON.stringify(quote)}); ${rule}; commit the file, or merge main if it landed there`;
	fs.rmSync(marker, { force: true });
	const launched = runWorker(brief);
	const checked = runCheck(brief);
	refusalResults.push(launched.status === 1 && checked.status === 1 && !fs.existsSync(marker) &&
		selectedLine(launched.stderr) === expected && selectedLine(checked.stderr) === expected && expected.split(rule).length === 2);
}
// req: R-3717 R-2579
check("R-3717: refusals quote the original bullet and rule identically without starting pi", refusalResults.every(Boolean), JSON.stringify(refusalResults));

const plannerText = fs.readFileSync(path.join(root, "prompts", "planner.md"), "utf8");
const readmeText = fs.readFileSync(path.join(root, "README.md"), "utf8");
// req: R-3719
check("R-3719: planner and README state selection and seal the quote cap", briefConfig.PRECEDENT_QUOTE_CAP === 160 &&
	[plannerText, readmeText].every((text) => text.includes("first backticked span") && text.includes("first word") && text.includes("file extension")));

if (fs.existsSync(samplerMarker)) {
	const samplerPid = Number(fs.readFileSync(samplerMarker, "utf8"));
	if (samplerPid > 0) { try { process.kill(samplerPid, "SIGKILL"); } catch {} }
}
