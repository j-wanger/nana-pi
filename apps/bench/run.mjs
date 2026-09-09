#!/usr/bin/env node
// pi bench runner — executes a pre-registered study and appends one JSON line per run.
//
//   node apps/bench/run.mjs <study-dir>                 # DRY RUN (default): schedule + exact argv
//   node apps/bench/run.mjs <study-dir> --smoke         # exactly ONE real model call
//   node apps/bench/run.mjs <study-dir> --go            # the whole study, resumable
//   ... --task <id> --profile <name> --rep <n> --keep
//
// Rules this file enforces:
//   * NO RETRIES. A failed run is written down as data and the plan moves on. pi's own
//     agent-level retry is pinned OFF in the prepared agent dir (settings.md:143).
//   * A run counts as OK only with a clean process exit AND a stream that reached
//     `agent_settled` (rpc.md:866) with no dangling tool calls AND a passing checker.
//   * A GRADER failure is never recorded as a model failure.
//   * Every run leaves evidence on disk: raw stream, stderr, and the workspace diff.
//   * Spend stops on a cumulative budget or on 3 consecutive harness/grader failures.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultBenchDir, defaultSourceDir, PINNED_SETTINGS, prepareAgentDir, verifyAuth } from "./lib/agentdir.mjs";
import { fetchKey, hashTree, liveKeyOf, runCheck } from "./lib/checkers.mjs";
import { applyMutations, copyAssets, materialize, unifiedDiff, verifyFixture } from "./lib/fixture.mjs";
import { assertFingerprint, fileSha, filterPlan, loadOrCreateSchedule, profilesFor, readResults, studyFingerprint, tupleKey } from "./lib/plan.mjs";
import { renderRun } from "./lib/profiles.mjs";
import { createPricer, loadPiExports } from "./lib/pi-exports.mjs";
import { costTotal, emptyUsage, incompleteReason, parseStream, totalTokens } from "./lib/usage.mjs";

const KEY_ERROR = /\b(api[_ -]?key|unauthorized|invalid_api_key|authentication|401|403|not logged in|no credentials)\b/i;
/** Emitted on stderr by ext/bench-nested-usage.ts when nested spend outlived its tool result. */
const UNATTACHED_MARKER = "bench-nested-usage: UNATTACHED";
/**
 * A run's true cost: its own model calls PLUS the LLM calls its tools made, counted ONCE.
 * The parser keeps the two apart (`tokens` = assistant messages, `nestedTokens` = tool-reported),
 * so this addition cannot double-count. `r.spend` is the runner's own copy of the same sum;
 * aggregate.mjs computes it identically.
 */
export const spendOf = (r) => r?.spend ?? (r?.totalTokens ?? 0) + totalTokens(r?.nestedTokens);
/** Money, in pi's own numbers. `null` when any part of the run was never priced. */
export const costOf = (r) => {
	if (!r) return null;
	if (r.nestedTokens && totalTokens(r.nestedTokens) > 0 && r.nestedCost == null) return null;
	return costTotal(r.tokens) + (r.nestedCost?.total ?? 0);
};

export { filterPlan, readResults, tupleKey } from "./lib/plan.mjs";

export function parseArgs(argv) {
	const o = { studyDir: null, go: false, smoke: false, keep: false, task: null, profile: null, rep: null };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--go") o.go = true;
		else if (a === "--smoke") o.smoke = true;
		else if (a === "--dry-run") o.go = false;
		else if (a === "--keep") o.keep = true;
		else if (a === "--task") o.task = argv[++i];
		else if (a === "--profile") o.profile = argv[++i];
		else if (a === "--rep") o.rep = Number(argv[++i]);
		else if (!a.startsWith("-") && !o.studyDir) o.studyDir = a;
		else throw new Error(`unknown argument ${a}`);
	}
	if (!o.studyDir) throw new Error("usage: run.mjs <study-dir> [--dry-run|--smoke|--go] [--task X] [--profile Y] [--rep N] [--keep]");
	return o;
}

export async function loadStudy(studyDir) {
	const study = JSON.parse(await fs.readFile(path.join(studyDir, "study.json"), "utf8"));
	const names = (await fs.readdir(path.join(studyDir, "tasks"))).filter((f) => f.endsWith(".json")).sort();
	const tasks = [];
	for (const n of names) tasks.push(JSON.parse(await fs.readFile(path.join(studyDir, "tasks", n), "utf8")));
	const ids = tasks.map((t) => t.id);
	if (new Set(ids).size !== ids.length) throw new Error("duplicate task ids");
	return { study, tasks, studyDir };
}

// ── child process ────────────────────────────────────────────────────────────────────────────
const alive = (pid) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
};

/** Signal the whole process group (POSIX) or the process tree (win32). */
function signalTree(pid, signal) {
	try {
		if (process.platform === "win32") spawn("taskkill", ["/pid", String(pid), "/t", signal === "SIGKILL" ? "/f" : "/f"], { windowsHide: true });
		else process.kill(-pid, signal);
	} catch { /* already gone */ }
}

/**
 * Spawn one child with a real hard timeout: SIGTERM the group, then SIGKILL the group, then
 * WAIT for the pid to actually disappear. A survivor would keep burning quota and would overlap
 * the next run's wall-clock measurement.
 */
export function runChild({ cmd, args, env, cwd, timeoutMs, graceMs = 5000 }) {
	return new Promise((resolve) => {
		const t0 = Date.now();
		let out = "";
		let err = "";
		let timedOut = false;
		let settled = false;
		const child = spawn(cmd, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32", windowsHide: true });
		const pid = child.pid;
		let killedCleanly = null;
		const finish = async (exit, signal) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			if (timedOut) {
				signalTree(pid, "SIGKILL");
				for (let i = 0; i < 100 && alive(pid); i++) await new Promise((r) => setTimeout(r, 100));
				killedCleanly = !alive(pid);
			}
			resolve({ exit, signal, stdout: out, stderr: err, wallMs: Date.now() - t0, timedOut, killedCleanly, pid });
		};
		const timer = setTimeout(() => {
			timedOut = true;
			signalTree(pid, "SIGTERM");
			// Escalate on its own clock: `close` may never arrive from a SIGTERM-resistant tree.
			setTimeout(() => {
				signalTree(pid, "SIGKILL");
				setTimeout(() => finish(null, "SIGKILL"), 1000).unref();
			}, graceMs).unref();
		}, timeoutMs);
		child.stdout.on("data", (d) => { out += d; });
		child.stderr.on("data", (d) => { err += d; });
		child.on("error", (e) => { err += `\nspawn error: ${e.message}`; finish(null, null); });
		child.on("close", (code, signal) => finish(code, signal));
		LIVE.add(() => signalTree(pid, "SIGKILL"));
	});
}

/** Children to kill if the operator interrupts us. */
const LIVE = new Set();

/** Locate the pi CLI without a shell. Running `node <cli.js>` is the stable form. */
export function resolvePiLauncher(study = {}) {
	const explicit = process.env.PI_BENCH_ENTRY || study.piEntry;
	if (explicit) return { cmd: process.execPath, pre: [explicit] };
	const exts = process.platform === "win32" ? [".cmd", ".exe", ".bat"] : [""];
	for (const dir of (process.env.PATH || "").split(path.delimiter)) {
		for (const ext of exts) {
			const p = path.join(dir, `pi${ext}`);
			if (!existsSync(p)) continue;
			const real = realpathSync(p);
			if (/\.(js|mjs|cjs)$/.test(real)) return { cmd: process.execPath, pre: [real] };
			if (/\.(cmd|bat)$/i.test(real)) return { cmd: process.env.ComSpec || "cmd.exe", pre: ["/c", real] };
			return { cmd: real, pre: [] };
		}
	}
	throw new Error("cannot find the pi CLI — set PI_BENCH_ENTRY (or study.piEntry) to dist/bundle/cli.js");
}

/**
 * `pi --version` is a real pi start-up: with the default config dir it creates and removes a
 * transient file in ~/.pi/agent (observed: the directory mtime moves). Pass the prepared dir so
 * even the version probe stays out of the operator's config.
 */
export async function piVersion(launcher, agentDir) {
	const env = agentDir ? { ...process.env, PI_CODING_AGENT_DIR: agentDir } : process.env;
	const r = await runChild({ cmd: launcher.cmd, args: [...launcher.pre, "--version"], env, cwd: os.tmpdir(), timeoutMs: 30000 });
	return (r.stdout || r.stderr).trim().split("\n")[0] || "unknown";
}

// ── evidence ─────────────────────────────────────────────────────────────────────────────────
async function writeEvidence(dir, { stdout, stderr, argvShown, diffs }) {
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, "stream.jsonl"), stdout);
	await fs.writeFile(path.join(dir, "stderr.txt"), stderr);
	await fs.writeFile(path.join(dir, "argv.txt"), `${argvShown}\n`);
	if (diffs?.length) await fs.writeFile(path.join(dir, "workspace.diff"), `${diffs.join("\n")}\n`);
}

async function workspaceDiffs(baseline, work, fixtureDir, benchPaths) {
	const now = hashTree(work);
	const bench = new Set(benchPaths ?? []);
	const out = [];
	for (const [rel, sha] of now) {
		if (bench.has(rel) || baseline.get(rel) === sha) continue;
		const after = await fs.readFile(path.join(work, rel), "utf8").catch(() => "<binary or unreadable>");
		const before = baseline.has(rel) ? await fs.readFile(path.join(fixtureDir, rel), "utf8").catch(() => "") : "";
		out.push(unifiedDiff(before, after, rel));
	}
	for (const rel of baseline.keys()) if (!now.has(rel)) out.push(`--- a/${rel}\n+++ /dev/null\n@@ deleted @@`);
	return out;
}

// ── one run ──────────────────────────────────────────────────────────────────────────────────
async function prepareWorkspace({ study, studyDir, task, runDir }) {
	const work = path.join(runDir, "work");
	await fs.mkdir(work, { recursive: true });
	const notes = [];
	let fixtureDir = null;
	if (task.fixture !== false) {
		fixtureDir = path.resolve(studyDir, study.fixture.dir);
		const v = await verifyFixture(fixtureDir, study.fixture.sha256);
		if (!v.ok) throw new Error(`fixture drift: sha ${v.sha} != pinned ${study.fixture.sha256}\n  ${v.drift.join("\n  ")}`);
		await materialize(fixtureDir, work);
		notes.push(...(await applyMutations(work, task.mutations)));
	}
	return { work, notes, fixtureDir };
}

async function executeRun({ study, studyDir, task, profile, rep, block, launcher, fingerprint, snapshotKey, snapshotFailed, opts }) {
	const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-bench-"));
	const base = { ts: new Date().toISOString(), fingerprint, task: task.id, family: task.family ?? null, profile: profile.name, rep, block: block ?? null };
	const dead = (state, error) => ({ ...base, state, ok: state === "ok", tokens: emptyUsage(), totalTokens: 0, wallMs: 0, turns: 0, toolCalls: {}, exit: null, error });
	try {
		const sessionDir = path.join(runDir, "sessions");
		await fs.mkdir(sessionDir, { recursive: true });
		const { work, notes, fixtureDir } = await prepareWorkspace({ study, studyDir, task, runDir });
		const { argv, env, blocked } = renderRun(profile, study, { prompt: task.prompt, sessionDir, agentDir: opts.agentDir, studyDir });
		const argvShown = `${launcher.cmd} ${[...launcher.pre, ...argv].map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`;

		if (opts.dryRun) {
			console.log(`${base.task} · ${base.profile} · rep ${rep}${block ? ` · block ${block}` : ""}\n  ${argvShown}`);
			return null;
		}
		if (blocked) return { ...dead("blocked", blocked), ok: false };

		// The bench shares ONE credential with the operator by symlink (agentdir.mjs). Confirm it
		// still resolves before spending, so a deleted login stops the study instead of producing
		// a column of authentication errors that read like model failures.
		if (opts.agentDir) await verifyAuth({ dir: opts.agentDir, sourceDir: opts.sourceDir ?? defaultSourceDir() });
		const baseline = hashTree(work);
		const benchPaths = (task.assets ?? []).map((a) => a.to);

		const r = await runChild({ cmd: launcher.cmd, args: [...launcher.pre, ...argv], env, cwd: work, timeoutMs: task.timeoutMs ?? study.timeoutMs ?? 300000 });
		const parsed = parseStream(r.stdout, { pricer: opts.pricer });
		// Nested spend that finished after the last tool result has no result to ride on; the
		// sidecar announces it on stderr instead. Unmeasured spend must never read as zero.
		const unattached = r.stderr.includes(UNATTACHED_MARKER);
		await copyAssets(studyDir, work, task.assets); // AFTER the child: the probe is ungrabbable
		const diffs = fixtureDir ? await workspaceDiffs(baseline, work, fixtureDir, benchPaths) : [];
		const evidenceDir = path.join(studyDir, "raw", task.id, profile.name, `rep${rep}`);
		await writeEvidence(evidenceDir, { stdout: r.stdout, stderr: r.stderr, argvShown, diffs });

		const check = task.check
			? runCheck(task.check, { finalText: parsed.finalText, dir: work, fixtureDir, baseline, benchPaths, snapshotKey, snapshotFailed })
			: { pass: parsed.complete, detail: "no checker declared" };

		// Run health first: exit code AND terminal stream completion (rpc.md:864-866).
		let state = "ok";
		let error = null;
		if (r.timedOut) { state = "run-error"; error = `timeout after ${task.timeoutMs ?? study.timeoutMs ?? 300000}ms${r.killedCleanly === false ? " (CHILD SURVIVED THE KILL)" : ""}`; }
		else if (r.exit !== 0) { state = "run-error"; error = `pi exited ${r.exit}${r.signal ? ` (${r.signal})` : ""}: ${r.stderr.trim().split("\n").slice(-3).join(" | ").slice(0, 200)}`; }
		else if (!parsed.complete) { state = "run-error"; error = incompleteReason(parsed); }
		else if (check.graderError) { state = "grader-error"; error = `grader: ${check.detail}`.slice(0, 400); }
		else if (!check.pass) state = "fail";
		if (state === "run-error" && KEY_ERROR.test([error, ...parsed.errors, r.stderr].join(" "))) error = `needs-key: ${error}`;

		return {
			...base,
			state, // ok | fail | run-error | grader-error | blocked
			// `ok` is the study's success metric. A grader or harness failure is NOT a model
			// failure, so it is null here and excluded from every success denominator.
			ok: state === "ok" ? true : state === "fail" ? false : null,
			// pi-ai `Usage` objects verbatim (input/output/cacheRead/cacheWrite/totalTokens/cost),
			// with pi's own totalTokens and pi's own cost — see lib/pi-exports.mjs.
			tokens: parsed.tokens,
			totalTokens: totalTokens(parsed.tokens),
			nestedTokens: parsed.nested,
			nestedCalls: parsed.nestedCalls,
			nestedModels: parsed.nestedModels,
			nestedUnknown: parsed.nestedUnknown || unattached,
			nestedUnknownReason: parsed.nestedUnknownReason ?? (unattached ? "unattached-after-final-tool-result" : null),
			nestedUnattached: unattached,
			skippedOwnCalls: parsed.skippedOwnCalls,
			spend: totalTokens(parsed.tokens) + totalTokens(parsed.nested),
			cost: costTotal(parsed.tokens) + (parsed.nestedCost?.total ?? 0),
			ownCost: parsed.tokens.cost,
			nestedCost: parsed.nestedCost,
			nestedCostReason: parsed.nestedCostReason,
			model: parsed.model,
			provider: parsed.provider,
			cacheBucket: parsed.tokens.cacheRead > 0 ? "warm" : "cold",
			wallMs: r.wallMs,
			turns: parsed.turns,
			toolCalls: parsed.toolCalls,
			retries: parsed.retries,
			retryEvents: parsed.retryEvents.slice(0, 5),
			compactions: parsed.compactions,
			extensionErrors: parsed.extensionErrors.slice(0, 3),
			exit: r.exit,
			signal: r.signal ?? null,
			// null when nothing had to be killed; false means a child may still be alive and
			// spending, which stops the study immediately.
			killedCleanly: r.killedCleanly,
			error,
			stopReason: parsed.stopReason,
			check: { pass: Boolean(check.pass), graderError: Boolean(check.graderError), detail: String(check.detail).slice(0, 400) },
			finalTextSha256: createHash("sha256").update(parsed.finalText).digest("hex"),
			finalText: parsed.finalText.slice(0, 300),
			mutations: notes,
			changedFiles: diffs.length,
			evidence: path.relative(studyDir, evidenceDir),
			diagnostics: { badLines: parsed.badLines, usageMessages: parsed.usageMessages, settled: parsed.settled, agentEnded: parsed.agentEnded, dangling: parsed.dangling.length },
		};
	} catch (e) {
		return { ...dead("grader-error", `harness: ${e.message}`), ok: null };
	} finally {
		if (opts.keep) console.log(`  kept ${runDir}`);
		else await fs.rm(runDir, { recursive: true, force: true }).catch(() => {});
	}
}

/**
 * ZERO-TOKEN pre-flight. `--mode rpc` (docs/rpc.md) starts a real session — loading settings,
 * resolving the model and running every `-e` extension — and answers `get_state` (rpc.md:185)
 * without ever calling the model. So it proves, for free:
 *   * both extensions load (a broken sidecar or a moved install fails HERE, not mid-study);
 *   * the pinned model actually resolves under PI_OFFLINE=1;
 *   * the prepared agent dir took effect — `autoCompactionEnabled` must be false, which is only
 *     true if our pinned settings.json (settings.md:118) is the one pi read.
 * It cannot list tool NAMES, which is why the paid registration probe below still exists.
 */
export async function loadProbe({ study, studyDir, profile, launcher, agentDir }) {
	const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-bench-load-"));
	try {
		const { argv, env, blocked } = renderRun(profile, study, { prompt: "unused", sessionDir: path.join(runDir, "s"), agentDir, studyDir });
		if (blocked) return { ok: false, detail: blocked };
		const rpcArgv = argv.slice(0, argv.indexOf("--")).map((a) => (a === "json" ? "rpc" : a));
		const r = await new Promise((resolve) => {
			const child = spawn(launcher.cmd, [...launcher.pre, ...rpcArgv], { cwd: runDir, env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
			let out = "";
			let err = "";
			const t = setTimeout(() => child.kill("SIGKILL"), 120000);
			child.stdout.on("data", (d) => { out += d; });
			child.stderr.on("data", (d) => { err += d; });
			child.on("close", () => { clearTimeout(t); resolve({ out, err }); });
			child.stdin.end('{"type":"get_state"}\n');
		});
		const line = r.out.split("\n").find((l) => l.includes('"get_state"'));
		if (!line) return { ok: false, detail: `no RPC response; stderr: ${r.err.trim().slice(-300)}` };
		let data;
		try { data = JSON.parse(line).data; } catch { return { ok: false, detail: `unparseable RPC response: ${line.slice(0, 200)}` }; }
		const want = { ...(study.model ?? {}), ...(profile.model ?? {}) };
		const problems = [];
		if (/extension|Failed to load|SyntaxError/i.test(r.err)) problems.push(`extension load noise on stderr: ${r.err.trim().slice(0, 200)}`);
		if (data?.model?.id !== want.id) problems.push(`model resolved to ${data?.model?.id} not ${want.id}`);
		if (data?.autoCompactionEnabled !== false) problems.push(`autoCompaction is ${data?.autoCompactionEnabled} — the prepared agent dir's pinned settings were NOT read`);
		return { ok: problems.length === 0, detail: problems.length ? problems.join("; ") : `loaded ${(profile.extensions ?? []).length + (study.sidecarExtension && (profile.extensions ?? []).length ? 1 : 0)} extension(s), model ${data.model.id}, compaction off` };
	} finally {
		await fs.rm(runDir, { recursive: true, force: true }).catch(() => {});
	}
}

/**
 * One cheap call per extension-bearing profile, before any measured spend: does the extension
 * actually REGISTER its tools? Loading proves the file ran; only this proves the tools exist.
 */
async function registrationProbe({ study, studyDir, profile, launcher, agentDir }) {
	const names = (profile.extensions ?? []).flatMap((e) => e.tools);
	if (!names.length) return { ok: true, detail: "no extension tools declared" };
	const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-bench-probe-"));
	try {
		const prompt = `List the exact names of every tool you can call, as a JSON array of strings, and nothing else.`;
		const { argv, env, blocked } = renderRun(profile, study, { prompt, sessionDir: path.join(runDir, "s"), agentDir, studyDir });
		if (blocked) return { ok: false, detail: blocked };
		const r = await runChild({ cmd: launcher.cmd, args: [...launcher.pre, ...argv], env, cwd: runDir, timeoutMs: 180000 });
		const parsed = parseStream(r.stdout, { pricer: opts.pricer });
		// Nested spend that finished after the last tool result has no result to ride on; the
		// sidecar announces it on stderr instead. Unmeasured spend must never read as zero.
		const unattached = r.stderr.includes(UNATTACHED_MARKER);
		await fs.mkdir(path.join(studyDir, "raw", "_probe"), { recursive: true });
		await fs.writeFile(path.join(studyDir, "raw", "_probe", `${profile.name}.jsonl`), r.stdout);
		if (parsed.extensionErrors.length) return { ok: false, detail: `extension_error: ${parsed.extensionErrors[0]}` };
		const missing = names.filter((n) => !parsed.finalText.includes(n));
		return {
			ok: missing.length === 0,
			detail: missing.length ? `tools not registered: ${missing.join(", ")} — reply was ${JSON.stringify(parsed.finalText.slice(0, 200))}` : `all ${names.length} extension tools registered`,
			tokens: totalTokens(parsed.tokens) + totalTokens(parsed.nested),
			wallMs: r.wallMs,
		};
	} finally {
		await fs.rm(runDir, { recursive: true, force: true }).catch(() => {});
	}
}

// ── stop conditions and the budget ledger (pure, so they are testable without spending) ──────

/**
 * A streak of NON-MODEL failures. Run errors count: repeated auth failures, spawn failures or
 * timeouts would otherwise burn the whole schedule 300 seconds at a time and fill every cell with
 * noise (astra F). Only a decided run — ok or fail — resets it.
 */
export const systemicStreak = (streak, rec) => (rec.state === "ok" || rec.state === "fail" ? 0 : streak + 1);
export const SYSTEMIC_LIMIT = 3;

/** A child we could not confirm dead may still be running and spending. Stop at once. */
export const shouldStopForKill = (rec) => rec.killedCleanly === false;

/**
 * Everything spent so far: graded runs plus every probe, across invocations.
 * `accounted` is false when any run carried nested spend we could not measure — a budget that
 * includes an unknown is a lower bound, and must not be reported as a total.
 */
export function budgetFrom(records = [], ledger = []) {
	const tokens = records.reduce((a, r) => a + spendOf(r), 0) + ledger.reduce((a, l) => a + (l.tokens ?? 0), 0);
	const wallMs = records.reduce((a, r) => a + (r.wallMs ?? 0), 0) + ledger.reduce((a, l) => a + (l.wallMs ?? 0), 0);
	const unknownRuns = records.filter((r) => r.nestedUnknown).length;
	return { tokens, wallMs, unknownRuns, accounted: unknownRuns === 0 };
}

/** Spend that is not a graded run — probes — kept across invocations so a resume cannot lose it. */
export async function readLedger(studyDir) {
	const rows = [];
	try {
		for (const line of (await fs.readFile(path.join(studyDir, "ledger.jsonl"), "utf8")).split("\n")) {
			if (!line.trim()) continue;
			try { rows.push(JSON.parse(line)); } catch { /* skip a torn line */ }
		}
	} catch { /* none yet */ }
	return rows;
}
const appendLedger = (studyDir, row) => fs.appendFile(path.join(studyDir, "ledger.jsonl"), `${JSON.stringify({ ts: new Date().toISOString(), ...row })}\n`);

/** One oracle key per comparison block, persisted so a RESUME reuses it instead of refetching. */
export async function readKeys(studyDir) {
	const map = new Map();
	try {
		for (const line of (await fs.readFile(path.join(studyDir, "keys.jsonl"), "utf8")).split("\n")) {
			if (!line.trim()) continue;
			try {
				const k = JSON.parse(line);
				if (k.block) map.set(k.block, k);
			} catch { /* skip a torn line */ }
		}
	} catch { /* none yet */ }
	return map;
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────
async function main() {
	const opts = parseArgs(process.argv.slice(2));
	const studyDir = path.resolve(opts.studyDir);
	const { study, tasks } = await loadStudy(studyDir);
	const launcher = resolvePiLauncher(study);
	const dryRun = !opts.go && !opts.smoke;
	const resultsPath = path.join(studyDir, "results.jsonl");

	// Pin the extension by CONTENT, not by path: a repointed or re-installed extension is a
	// different experiment even when the path is unchanged.
	const extraSha = {};
	for (const p of study.profiles) {
		for (const [i, ext] of (p.extensions ?? []).entries()) {
			extraSha[`ext:${p.name}:${i}`] = (await fileSha(path.resolve(studyDir, ext.path))) ?? "MISSING";
			if (ext.lockfile) extraSha[`lock:${p.name}:${i}`] = (await fileSha(path.resolve(studyDir, ext.lockfile))) ?? "MISSING";
		}
	}
	if (study.sidecarExtension) extraSha["ext:sidecar"] = (await fileSha(path.resolve(studyDir, study.sidecarExtension))) ?? "MISSING";
	// The sidecar is a thin wrapper; its accounting logic lives in lib/nested.mjs, so pinning only
	// the wrapper would leave the part that decides the numbers unpinned.
	if (study.sidecarLib) extraSha["ext:sidecar-lib"] = (await fileSha(path.resolve(studyDir, study.sidecarLib))) ?? "MISSING";
	// The prepared agent dir must exist BEFORE the version probe, so that probe too runs against
	// it and not against ~/.pi/agent.
	const agentCfg = study.agentDir ?? {};
	const agentDir = agentCfg.dir ? path.resolve(agentCfg.dir.replace(/^~(?=[\\/]|$)/, os.homedir())) : defaultBenchDir();
	const sourceDir = agentCfg.sourceDir ? path.resolve(agentCfg.sourceDir.replace(/^~(?=[\\/]|$)/, os.homedir())) : defaultSourceDir();
	if (!dryRun) {
		const prep = await prepareAgentDir({ dir: agentDir, sourceDir, settings: study.pinnedSettings ?? PINNED_SETTINGS });
		console.log(`agent dir ${prep.dir} (settings pinned: retry+compaction off; catalogs ${prep.seeded.join(", ") || "none"}; credential ${prep.credentialMode} → ${sourceDir}/auth.json)`);
	}
	const version = dryRun ? (study.pinnedPiVersion ?? "dry-run") : await piVersion(launcher, agentDir);
	if (!dryRun && study.pinnedPiVersion && version !== study.pinnedPiVersion) {
		throw new Error(`pi is ${version} but the study pins ${study.pinnedPiVersion}. Update the pin deliberately or install the pinned version.`);
	}
	for (const [k, v] of Object.entries(extraSha)) {
		const pinned = study.pinnedSha?.[k];
		if (pinned && pinned !== v) throw new Error(`${k} content changed: ${v} != pinned ${pinned}. The reviewed extension is not the one on disk.`);
	}
	// Borrow pi's OWN token/cost arithmetic. A bench must never silently substitute its own, so a
	// missing install or a missing root export is fatal here, before anything is scheduled.
	let piExports = null;
	let pricer = null;
	if (!dryRun) {
		piExports = await loadPiExports({ piBin: launcher.pre[0] ?? null });
		for (const w of piExports.warnings) console.log(`WARNING: ${w}`);
		pricer = await createPricer(piExports, { provider: study.model?.provider });
		console.log(`pi arithmetic: ${piExports.version} (pi-ai ${piExports.aiVersion}) — Usage + calculateCost from the package roots at ${piExports.root}`);
	}
	const { fingerprint, manifest } = await studyFingerprint({ studyDir, study, tasks, piVersion: version, extraSha });
	await fs.writeFile(path.join(studyDir, "fingerprint.txt"), `${fingerprint}\n\n${manifest}`);

	const sched = await loadOrCreateSchedule(studyDir, study, tasks, fingerprint, { reps: study.repeats ?? 3, seed: study.seed ?? 1 });
	let plan = filterPlan(sched.runs, opts);
	if (opts.smoke) {
		const t = tasks.find((x) => x.id === (opts.task ?? study.smokeTask)) ?? tasks[0];
		const p = opts.profile ?? study.smokeProfile ?? profilesFor(study, t)[0].name;
		plan = [{ task: t.id, profile: p, rep: opts.rep ?? 0, block: `${t.id}|${opts.rep ?? 0}` }];
	}

	const prior = dryRun ? { records: [], done: new Set(), fingerprints: new Set(), quarantined: 0 } : await readResults(resultsPath);
	if (!dryRun) assertFingerprint(prior.fingerprints, fingerprint);
	if (prior.quarantined) console.log(`repaired a torn tail in results.jsonl (moved to results.jsonl.quarantine)`);
	const todo = plan.filter((r) => !prior.done.has(tupleKey(r)));

	console.log(`${dryRun ? "DRY RUN" : opts.smoke ? "SMOKE" : "RUN"} · ${study.id} · fingerprint ${fingerprint.slice(0, 12)}… · seed ${sched.seed}`);
	console.log(`${plan.length} planned, ${plan.length - todo.length} already recorded, ${todo.length} to do`);
	if (dryRun) {
		for (const item of todo) {
			const task = tasks.find((t) => t.id === item.task);
			const profile = study.profiles.find((p) => p.name === item.profile);
			await executeRun({ study, studyDir, task, profile, rep: item.rep, block: item.block, launcher, fingerprint, opts: { ...opts, dryRun } });
		}
		return;
	}

	const runOpts = { ...opts, dryRun: false, agentDir, sourceDir, pricer };

	const cleanup = () => { for (const kill of LIVE) kill(); };
	process.on("SIGINT", () => { console.log("\ninterrupted — killing the current child; results.jsonl keeps every completed run"); cleanup(); process.exit(130); });

	// Zero-token pre-flight for every profile about to run: extensions load, model resolves,
	// pinned settings are in force. Free, so there is no reason to skip it.
	for (const name of new Set(todo.map((r) => r.profile))) {
		const profile = study.profiles.find((p) => p.name === name);
		const lp = await loadProbe({ study, studyDir, profile, launcher, agentDir });
		console.log(`load-probe ${name}: ${lp.ok ? "OK" : "FAILED"} — ${lp.detail}`);
		if (!lp.ok) throw new Error(`load probe failed for profile ${name}; refusing to spend`);
	}

	// Budget ledger: graded runs + every probe, carried across invocations. Probe spend used to
	// vanish on restart and registration probes used to repeat once per invocation.
	const ledger = await readLedger(studyDir);
	const probed = new Set(ledger.filter((l) => l.kind === "registration-probe" && l.ok).map((l) => l.profile));
	const blockKeys = await readKeys(studyDir);
	const budget0 = budgetFrom(prior.records, ledger);
	let spentTokens = budget0.tokens;
	let spentWall = budget0.wallMs;
	let unknownSpendRuns = budget0.unknownRuns;
	let consecutiveHarness = 0;
	let n = 0;
	if (probed.size) console.log(`registration probe already recorded for: ${[...probed].join(", ")} (not repeating)`);
	let spentCost = prior.records.reduce((a, r) => a + (costOf(r) ?? 0), 0);
	console.log(`budget so far: ${spentTokens} tokens, $${spentCost.toFixed(4)}, ${Math.round(spentWall / 60000)} min${unknownSpendRuns ? ` — ${unknownSpendRuns} run(s) carry UNMEASURED nested spend, so this is a lower bound` : ""}`);

	for (const item of todo) {
		const task = tasks.find((t) => t.id === item.task);
		const profile = study.profiles.find((p) => p.name === item.profile);
		if (!task || !profile) throw new Error(`plan references unknown task/profile: ${tupleKey(item)}`);

		if (study.maxTotalTokens && spentTokens >= study.maxTotalTokens) { console.log(`STOP: cumulative budget reached (${spentTokens} >= ${study.maxTotalTokens} tokens). ${todo.length - n} runs left undone.`); break; }
		if (study.maxWallMs && spentWall >= study.maxWallMs) { console.log(`STOP: cumulative wall budget reached (${Math.round(spentWall / 60000)} min). ${todo.length - n} runs left undone.`); break; }

		if ((profile.extensions ?? []).length && !probed.has(profile.name)) {
			const probe = await registrationProbe({ study, studyDir, profile, launcher, agentDir });
			probed.add(profile.name);
			spentTokens += probe.tokens ?? 0;
			spentWall += probe.wallMs ?? 0;
			await appendLedger(studyDir, { kind: "registration-probe", profile: profile.name, tokens: probe.tokens ?? 0, wallMs: probe.wallMs ?? 0, ok: probe.ok, detail: probe.detail.slice(0, 200) });
			console.log(`probe ${profile.name}: ${probe.ok ? "OK" : "FAILED"} — ${probe.detail}`);
			if (!probe.ok) throw new Error(`registration probe failed for profile ${profile.name}; refusing to spend on a profile whose tools may not be loaded`);
		}

		// ONE oracle key per comparison block, fetched at most once EVER and reloaded on resume,
		// so every arm of a comparison is graded against the same fetch. A failure is recorded
		// too: refetching after a failure would silently reintroduce two different keys.
		let snapshotKey;
		let snapshotFailed;
		const lk = liveKeyOf(task.check);
		if (lk) {
			let entry = blockKeys.get(item.block);
			if (!entry) {
				const got = fetchKey(lk, { dir: studyDir });
				entry = got.error ? { block: item.block, task: item.task, rep: item.rep, error: got.error } : { block: item.block, task: item.task, rep: item.rep, key: got.key };
				blockKeys.set(item.block, entry);
				await fs.appendFile(path.join(studyDir, "keys.jsonl"), `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
				if (got.error) console.log(`  oracle unavailable for ${item.block}: ${got.error}`);
			}
			snapshotKey = entry.key;
			snapshotFailed = entry.error;
		}

		const rec = await executeRun({ study, studyDir, task, profile, rep: item.rep, block: item.block, launcher, fingerprint, snapshotKey, snapshotFailed, opts: runOpts });
		if (!rec) continue;
		// Append on a guaranteed newline boundary (readResults already repaired any torn tail).
		await fs.appendFile(resultsPath, `${JSON.stringify(rec)}\n`);
		n++;
		spentTokens += spendOf(rec);
		spentWall += rec.wallMs ?? 0;
		spentCost += costOf(rec) ?? 0;
		if (rec.nestedUnknown) unknownSpendRuns++;
		console.log(
			`[${n}/${todo.length}] ${rec.task} · ${rec.profile} · rep${rec.rep} → ${rec.state.toUpperCase()} ` +
				`${rec.totalTokens ?? 0}tok${rec.nestedUnknown ? "+?" : rec.nestedCalls ? `+${totalTokens(rec.nestedTokens)}nested` : ""} ` +
				`${Math.round((rec.wallMs ?? 0) / 100) / 10}s ${costOf(rec) == null ? "$?" : `$${(costOf(rec)).toFixed(4)}`} ${JSON.stringify(rec.toolCalls)}${rec.retries ? ` retries=${rec.retries}` : ""}${rec.error ? ` err=${rec.error.slice(0, 120)}` : ""}`,
		);
		// NO RETRY, by design: a failure is the measurement.
		// A run-error IS systemic: repeated auth failures, spawn failures or timeouts would
		// otherwise burn the whole schedule three-hundred-seconds at a time.
		consecutiveHarness = systemicStreak(consecutiveHarness, rec);
		if (shouldStopForKill(rec)) {
			console.log(`STOP: a child could not be confirmed dead (pid may still be spending). Nothing further will start.`);
			break;
		}
		if (consecutiveHarness >= SYSTEMIC_LIMIT) { console.log(`STOP: ${SYSTEMIC_LIMIT} consecutive non-model failures (${rec.state}). Fix the harness rather than filling the remaining cells.`); break; }
	}
	console.log(
		`\nspent ${spentTokens} tokens · $${spentCost.toFixed(4)} (pi's own cost arithmetic) · ${Math.round(spentWall / 60000)} min` +
			(unknownSpendRuns ? ` — NOT fully accounted: ${unknownSpendRuns} run(s) carry unmeasured nested spend` : " (fully accounted)") +
			`\nresults → ${resultsPath}\nnext: node apps/bench/aggregate.mjs ${path.relative(process.cwd(), studyDir) || "."}`,
	);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
	main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
}
