/**
 * @module packages/nana-pack/tests/brief-check.test.mjs
 * @purpose Pin pi-worker lane-brief validation and the shared Precedent parser.
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
const selectedLine = (stderr) => stderr.split(/\r?\n/).find((line) => line.startsWith("pi-worker: lane refused:") || line.startsWith("pi-worker: precedent:")) ?? null;
const cases = [
	["missing section", writeBrief("missing.md", "Feature: FEAT-006 · Missing\n"), 1, "pi-worker: lane refused:"],
	["untracked path", writeBrief("untracked.md", "Precedent:\n- missing.mjs\n"), 1, "pi-worker: lane refused:"],
	["passing with known bugs", writeBrief("passing.md", "Serves: roadmap step 3: exercise the launcher.\nFeature: FEAT-006 · Passing\n\nPrecedent:\n- seed\n"), 0, "pi-worker: precedent:"],
];
const observations = [];
for (const [name, brief, expectedStatus, prefix] of cases) {
	fs.rmSync(marker, { force: true });
	const workerResult = runWorker(brief);
	const workerLine = selectedLine(workerResult.stderr);
	const workerStarted = fs.existsSync(marker);
	observations.push({
		name,
		ok: workerResult.status === expectedStatus &&
			workerLine?.startsWith(prefix) &&
			(expectedStatus === 0 ? workerStarted && workerLine.includes("known bugs: docs/known-bugs/FEAT-006.md") : !workerStarted),
		workerStatus: workerResult.status,
		workerLine,
	});
}
const check = (title, pass, detail = "") => {
	console.log(pass ? "PASS" : "FAIL", title, pass ? "" : detail);
	if (!pass) process.exitCode = 1;
};
// Seven off-roadmap launches prompted this refusal (memory-sort plan).
// Each child has CHILD_LIMIT_MS; cases are synchronous and all are observed.
const servesResults = [];
for (const [label, value, accepted] of [
	["missing", null, false], ["empty", "", false], ["whitespace", " \t", false],
	["malformed", "useful work", false], ["bare step", "roadmap step 3", false],
	["bare owner", "owner 2026-11-08", false], ["bad date", "owner today: do this", false],
	["roadmap", "roadmap step 3: move guidance into both seat runtimes.", true],
	["owner", "owner 2026-11-08: run this lane.", true],
]) {
	for (const [ending, suffix] of [["\n", "\n"], ["\r\n", " \t\r\n"], ["\n", ""]]) {
		const text = `Precedent:${ending}- seed${ending}${value === null ? "" : `Serves: ${value}${suffix}`}`;
		const brief = writeBrief("serves.md", text);
		fs.rmSync(marker, { force: true });
		const launched = runWorker(brief);
		const started = fs.existsSync(marker);
		servesResults.push({ label, ending, suffix, ok: launched.status === (accepted ? 0 : 1) &&
			started === accepted &&
			(accepted || /lane refused: Serves:/.test(launched.stderr)), stderr: launched.stderr });
	}
}
// req: R-3948
check("R-3948: Serves refuses missing empty and malformed values and launches complete roadmap or owner forms", servesResults.every((r) => r.ok), JSON.stringify(servesResults.filter((r) => !r.ok)));
// req: R-3949
check("R-3949: the alignment label is sealed as Serves:", briefConfig.SERVES_LINE_PREFIX === "Serves:");

// Literal compatibility fixtures from anatomy-label-check, ci-suite,
// ci-timing-records and build-records briefs/plans (copied, never read at runtime).
const compatibility = [
	["- `packages/nana-pack/lib/ci-records.mjs:19-30, :44-67`: `ghFromEnvironment`, the command seam that every OS can use, and `ghResult`, whose result classes these are. Both move into gh-runner.mjs, as named moves, and gain a timeout class.", "packages/nana-pack/lib/ci-records.mjs", "path"],
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
		const text = `Serves: roadmap step 3: exercise selection.\n## Precedent\n${bullet} \t`.replaceAll("\n", ending === "\r\n" ? "\r\n" : "\n") + ending;
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
	refusalResults.push(launched.status === 1 && !fs.existsSync(marker) &&
		selectedLine(launched.stderr) === expected && expected.split(rule).length === 2);
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
