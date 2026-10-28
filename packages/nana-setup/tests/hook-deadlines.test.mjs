/**
 * @module packages/nana-setup/tests/hook-deadlines.test.mjs
 * @purpose Prove session-start hooks preserve live producer output and replace hung output before one process-clock deadline.
 * @inputs Copied canonical hooks and launcher library, checkout hook metadata, a late-start preload, and live, slow or hung producer stubs.
 * @outputs PASS/FAIL checks for adoption and objective/frontier deadline and shared-budget behavior.
 * @effects disk (creates a throwaway checkout and writes preload timing), process (spawns copied hooks and producer stubs).
 * @errors A watchdog kills an over-limit hook; failed checks set a nonzero process exit code.
 */
import { spawn } from "node:child_process";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { ghDefault, ghResult } from "../../nana-pack/lib/gh-runner.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { HOOK_DEADLINE_MS, HOOK_PRODUCER_TIMEOUT_MS, hookProducerConfig, runHookProducer } from "../lib/hook-producer.mjs";
import { desiredHooks } from "../lib/settings.mjs";
import { SHARED_MEMORY_OUTPUT_BUDGET } from "../lib/shared-memory-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { GH_COMMAND_ENV } from "../../nana-pack/lib/suite-records-config.mjs";
import { readHandoffIssues } from "../../nana-pack/lib/handoff-issues.mjs";
import { ISSUES_READ_LIMIT_MS, ISSUES_WRITE_RESERVE_MS } from "../../nana-pack/lib/frontier-summary-config.mjs";

delete process.env.NANA_ROLE;

const checkoutRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const root = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "nana-hook-deadlines-")));
const tempHome = path.join(root, "home");
const hooksDir = path.join(root, "packages", "nana-setup", "claude", "hooks");
const copiedLib = path.join(root, "packages", "nana-setup", "lib");
const STUB_HANG_MS = 30_000; // Chosen to outlast both the hook limit and the test watchdog.
const CASE_LIMIT_MS = 15_000; // Chosen to bound a broken hook while allowing the installed 5 s limit.
// Chosen 2026-10-23: main kills this at least 200 ms early, with about 800 ms under the new cap.
const SLOW_PRODUCER_MS = 1700;
// Chosen 2026-10-23: main's two hung producers end after 5 s, while this stays below the hook deadline.
const LATE_START_MS = 2500;

fs.mkdirSync(tempHome, { recursive: true });
fs.mkdirSync(path.dirname(hooksDir), { recursive: true });
fs.cpSync(path.join(checkoutRoot, "packages", "nana-setup", "claude", "hooks"), hooksDir, { recursive: true });
fs.cpSync(path.join(checkoutRoot, "packages", "nana-setup", "lib"), copiedLib, { recursive: true });
fs.cpSync(path.join(checkoutRoot, "packages", "nana-pack", "lib"), path.join(root, "packages", "nana-pack", "lib"), { recursive: true });
fs.cpSync(path.join(checkoutRoot, "packages", "nana-pack", "bin"), path.join(root, "packages", "nana-pack", "bin"), { recursive: true });

const stubPaths = {
	adoption: path.join(root, "packages", "nana-pack", "bin", "nana-adoption.mjs"),
	"stale-copies": path.join(root, "packages", "nana-setup", "bin", "stale-copies.mjs"),
	objective: path.join(root, "packages", "nana-pack", "bin", "nana-objective.mjs"),
	frontier: path.join(root, "packages", "nana-pack", "bin", "nana-frontier-summary.mjs"),
};
const liveFrontierSource = fs.readFileSync(path.join(checkoutRoot, "packages", "nana-pack", "bin", "nana-frontier-summary.mjs"));
const hungStub = `process.stdout.write("PARTIAL\\n");\nsetTimeout(() => {}, ${STUB_HANG_MS});\n`;
const liveLine = "STALE COPY OK\n";
const liveStub = `process.stdout.write(${JSON.stringify(liveLine)});\n`;
const slowLine = "SLOW PRODUCER OK\n";
const nextLine = "NEXT PRODUCER OK\n";
const slowStub = `import { performance } from "node:perf_hooks";\nsetTimeout(() => process.stdout.write(${JSON.stringify(slowLine)}), Math.max(0, ${SLOW_PRODUCER_MS} - performance.now()));\n`;
const nextStub = `process.stdout.write(${JSON.stringify(nextLine)});\n`;
const lateStartPreload = path.join(root, "late-start-preload.mjs");
fs.writeFileSync(lateStartPreload, `import * as fs from "node:fs";\nimport { performance } from "node:perf_hooks";\nfs.writeFileSync(process.env.NANA_HOOK_TIME_ORIGIN_FILE, String(performance.timeOrigin));\nAtomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${LATE_START_MS});\n`);
const writeStub = (name, source) => {
	fs.mkdirSync(path.dirname(stubPaths[name]), { recursive: true });
	fs.writeFileSync(stubPaths[name], source);
};

const installedLimit = (label) => {
	const hook = desiredHooks({ hooksDir, repoRoot: root, platform: process.platform }).find((candidate) => candidate.label === label);
	return hook.entry.timeout * 1000;
};
let runNumber = 0;
const runHook = (hookName, { preload = null, extraEnv = {} } = {}) => new Promise((resolve) => {
	const timeOriginFile = path.join(root, `time-origin-${++runNumber}.txt`);
	const args = [...(preload ? ["--import", pathToFileURL(preload).href] : []), path.join(hooksDir, hookName)];
	const startedAt = Date.now();
	const child = spawn(process.execPath, args, {
		cwd: root,
		env: { ...process.env, CLAUDE_PROJECT_DIR: root, HOME: tempHome, USERPROFILE: tempHome, NANA_HOOK_TIME_ORIGIN_FILE: timeOriginFile, ...extraEnv },
		stdio: ["ignore", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	let spawnError = "";
	let timedOut = false;
	child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
	child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
	child.on("error", (error) => { spawnError = String(error); });
	const watchdog = setTimeout(() => {
		timedOut = true;
		child.kill("SIGKILL");
	}, CASE_LIMIT_MS);
	child.on("close", (code, signal) => {
		clearTimeout(watchdog);
		const elapsed = Date.now() - startedAt;
		let beforeClock = null;
		try { beforeClock = Number(fs.readFileSync(timeOriginFile, "utf8")) - startedAt; } catch {}
		resolve({ code, signal, stdout, stderr: stderr || spawnError, timedOut, elapsed, beforeClock, afterDeadline: beforeClock === null ? null : elapsed - beforeClock - HOOK_DEADLINE_MS });
	});
});

let failures = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", `${title}${ok || !detail ? "" : ` — ${detail}`}`);
	if (!ok) failures++;
};

const r2671StartedAt = performance.now();
writeStub("objective", slowStub);
writeStub("frontier", nextStub);
const slowObjective = await runHook("nana-objective.mjs");
writeStub("adoption", slowStub);
writeStub("stale-copies", nextStub);
const slowAdoption = await runHook("nana-adoption.mjs");
writeStub("objective", liveStub);
writeStub("frontier", nextStub);
const lateObjective = await runHook("nana-objective.mjs", { preload: lateStartPreload });
writeStub("adoption", liveStub);
writeStub("stale-copies", nextStub);
const lateAdoption = await runHook("nana-adoption.mjs", { preload: lateStartPreload });
const liveExpected = liveLine + nextLine;
const slowExpected = slowLine + nextLine;
// req: R-2671
check("R-2671: the objective and adoption hooks print a producer's output when it takes 1.7 seconds, and the next producer's output after it, also when the hook starts 2.5 seconds late",
	SLOW_PRODUCER_MS < HOOK_PRODUCER_TIMEOUT_MS && [slowObjective, slowAdoption].every((run) => run.code === 0 && !run.timedOut && run.stdout === slowExpected) &&
	[lateObjective, lateAdoption].every((run) => run.code === 0 && !run.timedOut && run.stdout === liveExpected),
	JSON.stringify({ slowObjective, slowAdoption, lateObjective, lateAdoption }));
console.log(`note: R-2671 elapsed ${Math.round(performance.now() - r2671StartedAt)} ms; cases ${[slowObjective, slowAdoption, lateObjective, lateAdoption].map((run) => run.elapsed).join(",")} ms`);

const r2672StartedAt = performance.now();
writeStub("objective", hungStub);
writeStub("frontier", hungStub);
const lateHungObjective = await runHook("nana-objective.mjs", { preload: lateStartPreload });
writeStub("adoption", hungStub);
writeStub("stale-copies", hungStub);
const lateHungAdoption = await runHook("nana-adoption.mjs", { preload: lateStartPreload });
const lateHungExpected = {
	objective: hookProducerConfig("objective", root).marker + hookProducerConfig("frontier", root).marker,
	adoption: hookProducerConfig("adoption", root).marker + hookProducerConfig("stale-copies", root).marker,
};
// req: R-2672
check("R-2672: the objective and adoption hooks print both markers before their installed limit when they start 2.5 seconds late and both producers hang",
	LATE_START_MS < HOOK_DEADLINE_MS && lateHungObjective.code === 0 && !lateHungObjective.timedOut && lateHungObjective.stdout === lateHungExpected.objective && lateHungObjective.elapsed < installedLimit("SessionStart objective") &&
	lateHungAdoption.code === 0 && !lateHungAdoption.timedOut && lateHungAdoption.stdout === lateHungExpected.adoption && lateHungAdoption.elapsed < installedLimit("SessionStart adoption"),
	JSON.stringify({ lateHungObjective, lateHungAdoption }));
console.log(`note: R-2672 elapsed ${Math.round(performance.now() - r2672StartedAt)} ms; objective ${lateHungObjective.elapsed} ms (before clock ${lateHungObjective.beforeClock} ms, after deadline ${lateHungObjective.afterDeadline} ms); adoption ${lateHungAdoption.elapsed} ms (before clock ${lateHungAdoption.beforeClock} ms, after deadline ${lateHungAdoption.afterDeadline} ms)`);

writeStub("adoption", hungStub);
writeStub("stale-copies", liveStub);
let result = await runHook("nana-adoption.mjs");
let expected = hookProducerConfig("adoption", root).marker + liveLine;
// req: R-2010
check("adoption hook prints its marker and the stale-copy output when the adoption producer hangs", result.code === 0 && !result.timedOut && result.stdout === expected, `code=${String(result.code)} elapsed=${result.elapsed} stdout=${JSON.stringify(result.stdout)} stderr=${JSON.stringify(result.stderr)}`);

writeStub("adoption", hungStub);
writeStub("stale-copies", hungStub);
result = await runHook("nana-adoption.mjs");
expected = hookProducerConfig("adoption", root).marker + hookProducerConfig("stale-copies", root).marker;
// req: R-2011
check("adoption hook prints both markers before its installed limit when both producers hang", result.code === 0 && !result.timedOut && result.stdout === expected && result.elapsed < installedLimit("SessionStart adoption"), `code=${String(result.code)} elapsed=${result.elapsed} limit=${installedLimit("SessionStart adoption")} stdout=${JSON.stringify(result.stdout)} stderr=${JSON.stringify(result.stderr)}`);

writeStub("objective", hungStub);
writeStub("frontier", "");
result = await runHook("nana-objective.mjs");
expected = hookProducerConfig("objective", root).marker;
// req: R-2012
check("objective hook prints its marker before its installed limit when its producer hangs", result.code === 0 && !result.timedOut && result.stdout === expected && result.elapsed < installedLimit("SessionStart objective"), `code=${String(result.code)} elapsed=${result.elapsed} limit=${installedLimit("SessionStart objective")} stdout=${JSON.stringify(result.stdout)} stderr=${JSON.stringify(result.stderr)}`);

writeStub("objective", hungStub);
writeStub("frontier", hungStub);
const bothHung = await runHook("nana-objective.mjs");
const bothMarkers = hookProducerConfig("objective", root).marker + hookProducerConfig("frontier", root).marker;

writeStub("objective", `process.stdout.write("x".repeat(8000));\n`);
fs.writeFileSync(stubPaths.frontier, liveFrontierSource);
fs.writeFileSync(path.join(root, "HANDOFF.md"), ["## Next", ...Array.from({ length: 100 }, (_, index) => `- Next ${index} ${"n".repeat(100)}`), "## Open for the owner", ...Array.from({ length: 20 }, (_, index) => `- **[blocking, since 2026-10-01] Ask ${index}.** body`)].join("\n"));
const budgeted = await runHook("nana-objective.mjs");
const objectiveWhole = `${"x".repeat(8000)}\n`;
// req: R-2613
check("R-2613: objective hook prints both markers before its installed limit when both producers hang, and keeps a long objective whole under the cap",
	bothHung.code === 0 && !bothHung.timedOut && bothHung.stdout === bothMarkers && bothHung.elapsed < installedLimit("SessionStart objective") &&
	budgeted.code === 0 && !budgeted.timedOut && budgeted.stdout.startsWith(objectiveWhole) && budgeted.stdout.length <= SHARED_MEMORY_OUTPUT_BUDGET + 1000 && budgeted.stdout.includes("[nana:frontier]"),
	`hung code=${String(bothHung.code)} elapsed=${bothHung.elapsed} limit=${installedLimit("SessionStart objective")} stdout=${JSON.stringify(bothHung.stdout)} stderr=${JSON.stringify(bothHung.stderr)}; budget code=${String(budgeted.code)} length=${budgeted.stdout.length} stdout-tail=${JSON.stringify(budgeted.stdout.slice(-300))}`,
);

writeStub("objective", "");
fs.writeFileSync(stubPaths.frontier, liveFrontierSource);
fs.writeFileSync(path.join(root, "HANDOFF.md"), "## Next\n- Keep local next\n## Open for the owner\nQuestions: https://github.com/example/project/issues.\n");
const slowGh = path.join(root, "slow-gh.mjs");
fs.writeFileSync(slowGh, `setTimeout(() => process.stdout.write('[]'), ${STUB_HANG_MS});`);
const issueTimeout = await runHook("nana-objective.mjs", { preload: lateStartPreload, extraEnv: { [GH_COMMAND_ENV]: JSON.stringify([process.execPath, slowGh]) } });
const issueBudgets = [];
const issueText = fs.readFileSync(path.join(root, "HANDOFF.md"), "utf8");
for (const limitMs of [1000, 10000, 100]) {
 readHandoffIssues({ text: issueText, cwd: root, limitMs, clock: () => 200, runGh: (_cwd, _args, options) => { issueBudgets.push(options.timeoutMs); return { status: 0, stdout: JSON.stringify([{ number: 1, title: "Kept", labels: [{ name: "ask" }], author: { login: "example" } }]) };  } });
}
const producerLimits = [];
for (const name of ["objective", "frontier", "adoption", "stale-copies"]) {
 runHookProducer({ ...hookProducerConfig(name, root), deadlineMs: 1200, clock: () => 200,
  run: (_cmd, args) => { producerLimits.push({ name, args }); return { status: 0, stdout: "" }; }, stdout: { write() {} } });
}
let defaultOptions;
const originalSpawn = childProcess.spawnSync;
try {
 childProcess.spawnSync = (_cmd, _args, options) => { defaultOptions = options; return { status: 0, stdout: "" }; };
 syncBuiltinESMExports();
 ghDefault()(root, []);
} finally { childProcess.spawnSync = originalSpawn; syncBuiltinESMExports(); }
const timeoutReason = ghResult(() => ({ error: { code: "ETIMEDOUT" }, nanaTimeoutMs: 123 }), root, []);
// req: R-2974
check("R-2974: late-start objective hook keeps Next timeout and check lines when gh hangs",
 JSON.stringify(issueBudgets) === JSON.stringify([1000 - 200 - ISSUES_WRITE_RESERVE_MS, ISSUES_READ_LIMIT_MS]) &&
 producerLimits.every(({ name, args }) => name === "frontier" ? args.slice(-2).join(" ") === "--limit-ms 1000" : !args.includes("--limit-ms")) &&
 !Object.hasOwn(defaultOptions, "timeout") && timeoutReason.reason === "gh timed out after 123 ms" &&
 issueTimeout.code === 0 && !issueTimeout.timedOut && issueTimeout.elapsed < installedLimit("SessionStart objective") &&
 issueTimeout.stdout.includes("Keep local next") && issueTimeout.stdout.includes("Frontier check:") &&
 (issueTimeout.stdout.match(/Open issues: unavailable \(timeout, after \d+ ms\); see https:\/\/github.com\/example\/project\/issues/g) ?? []).length === 1 && !issueTimeout.stdout.includes("producer failed"), JSON.stringify(issueTimeout));

if (failures) process.exitCode = 1;
