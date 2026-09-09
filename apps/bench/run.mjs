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
import fsSync, { existsSync, realpathSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultBenchDir, defaultSourceDir, PINNED_SETTINGS, prepareAgentDir, verifyAuth } from "./lib/agentdir.mjs";
import { fetchKey, hashTree, liveKeyOf, runCheck } from "./lib/checkers.mjs";
import { applyMutations, copyAssets, materialize, unifiedDiff, verifyFixture } from "./lib/fixture.mjs";
import { assertFingerprint, fileSha, filterPlan, loadOrCreateSchedule, profilesFor, readJsonl, readResults, studyFingerprint, tupleKey } from "./lib/plan.mjs";
import { renderRun } from "./lib/profiles.mjs";
import { createPricer, loadPiExports } from "./lib/pi-exports.mjs";
import { costOfRecord, costTotal, emptyUsage, incompleteReason, parseStream, totalTokens } from "./lib/usage.mjs";

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
/** Money, in pi's own numbers — the SHARED helper, so runner and aggregator cannot disagree. */
export const costOf = costOfRecord;

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
/**
 * Is anything from this child still running? Checking the leader pid alone misses the descendants
 * a pi run spawns (a shell, a test process), which are exactly what keeps burning quota. On POSIX
 * signal 0 to the NEGATIVE pid probes the whole process group; win32 has no groups, so there the
 * leader is the best signal available and `taskkill /T` is what does the work.
 */
export const treeAlive = (pid) => {
	if (!pid) return false;
	const probe = (target) => {
		try {
			process.kill(target, 0);
			return true;
		} catch (e) {
			return e.code === "EPERM"; // exists but not ours to signal
		}
	};
	if (process.platform !== "win32" && probe(-pid)) return true;
	return probe(pid);
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
export function runChild({ cmd, args, env, cwd, timeoutMs, graceMs = 5000, onBuffer = null }) {
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
				for (let i = 0; i < 100 && treeAlive(pid); i++) await new Promise((r) => setTimeout(r, 100));
				killedCleanly = !treeAlive(pid);
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
		if (onBuffer) onBuffer(() => out);
		child.stdout.on("data", (d) => { out += d; });
		child.stderr.on("data", (d) => { err += d; });
		child.on("error", (e) => { err += `\nspawn error: ${e.message}`; finish(null, null); });
		child.on("close", (code, signal) => finish(code, signal));
		LIVE.add(() => signalTree(pid, "SIGKILL"));
	});
}

/** Children to kill if the operator interrupts us. */
const LIVE = new Set();
/**
 * Salvage callbacks for runs in flight. On SIGINT each returns a record for the paid-but-unfinished
 * child — its buffered stream, its measured partial spend — so an interrupt costs the study its
 * result, never its accounting.
 */
const INFLIGHT = new Set();

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
/** Concrete paths a `changed-paths` check will diff — the allow globs plus any declared range. */
export function shapedPaths(check, out = new Set()) {
	if (!check || typeof check !== "object") return out;
	if (check.type === "changed-paths") {
		for (const g of check.allow ?? []) if (!g.includes("*")) out.add(g);
		for (const k of Object.keys(check.withinLines ?? {})) out.add(k);
	}
	for (const child of check.checks ?? []) shapedPaths(child, out);
	return out;
}

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

export async function executeRun({ study, studyDir, task, profile, rep, block, launcher, fingerprint, snapshotKey, snapshotFailed, opts }) {
	const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-bench-"));
	const base = { ts: new Date().toISOString(), fingerprint, task: task.id, family: task.family ?? null, profile: profile.name, rep, block: block ?? null };
	const dead = (state, error) => ({ ...base, state, ok: state === "ok", tokens: emptyUsage(), totalTokens: 0, wallMs: 0, turns: 0, toolCalls: {}, exit: null, error });
	// What the CHILD cost, captured the moment it is known. A later failure in asset copying,
	// diffing or evidence writing must not replace a measured run with a zero-token harness record
	// — that would quietly delete spend from the budget.
	let measured = null;
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
		// Pre-run CONTENT of every file a diff-shape rule will inspect. Captured after mutations and
		// before the child runs, because "what did the model change, and where" needs the bytes the
		// model actually started from, not the pristine fixture.
		const preRun = new Map();
		for (const rel of shapedPaths(task.check)) {
			if (!baseline.has(rel)) continue;
			preRun.set(rel, await fs.readFile(path.join(work, rel), "utf8"));
		}

		// Salvage hook: if the operator interrupts us mid-child, this is what gets written down.
		const salvage = (buffered) => () => {
			const p = parseStream(buffered(), { pricer: opts.pricer });
			return {
				...base,
				state: "run-error",
				ok: null,
				error: "interrupted (SIGINT) — partial spend recorded, result discarded",
				tokens: p.tokens,
				totalTokens: totalTokens(p.tokens),
				nestedTokens: p.nested,
				nestedUnknown: true,
				nestedUnknownReason: "run interrupted before the stream completed",
				spend: totalTokens(p.tokens) + totalTokens(p.nested),
				cost: null,
				costReason: "interrupted",
				wallMs: null,
				turns: p.turns,
				toolCalls: p.toolCalls,
				exit: null,
				killedCleanly: null,
			};
		};
		let hook = null;
		const r = await runChild({
			cmd: launcher.cmd,
			args: [...launcher.pre, ...argv],
			env,
			cwd: work,
			timeoutMs: opts.timeoutMs ?? task.timeoutMs ?? study.timeoutMs ?? 300000,
			onBuffer: (read) => {
				hook = salvage(read);
				INFLIGHT.add(hook);
			},
		});
		if (hook) INFLIGHT.delete(hook);
		const parsed = parseStream(r.stdout, { pricer: opts.pricer });
		// The stderr-only UNATTACHED marker has to be folded in BEFORE `measured` is built, or a
		// postprocessing failure would preserve the spend while losing its unknown status.
		const unattachedEarly = r.stderr.includes(UNATTACHED_MARKER);
		measured = {
			tokens: parsed.tokens,
			totalTokens: totalTokens(parsed.tokens),
			nestedTokens: parsed.nested,
			nestedUnknown: parsed.nestedUnknown || unattachedEarly,
			nestedUnknownReason: parsed.nestedUnknownReason ?? (unattachedEarly ? "unattached-after-final-tool-result" : null),
			cost: null,
			costReason: "record salvaged after a postprocessing failure; cost not computed",
			spend: totalTokens(parsed.tokens) + totalTokens(parsed.nested),
			wallMs: r.wallMs,
			turns: parsed.turns,
			toolCalls: parsed.toolCalls,
			exit: r.exit,
			signal: r.signal ?? null,
			killedCleanly: r.killedCleanly,
		};
		const unattached = unattachedEarly;
		await copyAssets(studyDir, work, task.assets); // AFTER the child: the probe is ungrabbable
		const diffs = fixtureDir ? await workspaceDiffs(baseline, work, fixtureDir, benchPaths) : [];
		const evidenceDir = path.join(studyDir, "raw", task.id, profile.name, `rep${rep}`);
		await writeEvidence(evidenceDir, { stdout: r.stdout, stderr: r.stderr, argvShown, diffs });

		const check = task.check
			? runCheck(task.check, { finalText: parsed.finalText, dir: work, fixtureDir, baseline, benchPaths, preRun, snapshotKey, snapshotFailed })
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
			// NULL, not 0, when any part went unpriced — the aggregator reads this field directly.
			cost: parsed.nestedCost == null && totalTokens(parsed.nested) > 0 ? null : costTotal(parsed.tokens) + (parsed.nestedCost?.total ?? 0),
			costReason: parsed.nestedCostReason,
			ownCost: parsed.tokens.cost,
			nestedCost: parsed.nestedCost,
			nestedCostReason: parsed.nestedCostReason,
			nestedCostByModel: parsed.nestedCostByModel,
			nestedByModel: parsed.nestedByModel,
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
		// Preserve the child's measured cost through a post-processing failure.
		const base2 = measured ? { ...dead("grader-error", null), ...measured } : dead("grader-error", null);
		return { ...base2, state: "grader-error", ok: null, error: `harness: ${e.message}${measured ? ` (child had already spent ${measured.spend} tokens — preserved)` : ""}` };
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
			if (onBuffer) onBuffer(() => out);
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
 *
 * Everything measurable is captured and written to disk BEFORE any judgement is returned. The
 * earlier version referenced an out-of-scope `opts` after the paid call, threw a ReferenceError,
 * and left no evidence and no ledger line — so a restart paid for the same probe again. A probe
 * costs real money: its spend must survive every subsequent failure, including its own.
 */
export async function registrationProbe({ study, studyDir, profile, launcher, agentDir, pricer = null, timeoutMs = 180000 }) {
	const names = (profile.extensions ?? []).flatMap((e) => e.tools);
	const blank = { ok: true, detail: "no extension tools declared", tokens: 0, wallMs: 0, killedCleanly: null, timedOut: false };
	if (!names.length) return blank;
	const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-bench-probe-"));
	// Measured facts live OUTSIDE the try, so a later throw cannot erase them.
	let measured = { ok: false, detail: "probe did not run", tokens: 0, wallMs: 0, killedCleanly: null, timedOut: false };
	try {
		const prompt = "List the exact names of every tool you can call, as a JSON array of strings, and nothing else.";
		const { argv, env, blocked } = renderRun(profile, study, { prompt, sessionDir: path.join(runDir, "s"), agentDir, studyDir });
		if (blocked) return { ...blank, ok: false, detail: blocked };

		const r = await runChild({ cmd: launcher.cmd, args: [...launcher.pre, ...argv], env, cwd: runDir, timeoutMs });
		const parsed = parseStream(r.stdout, { pricer });
		measured = {
			ok: false,
			detail: "",
			tokens: totalTokens(parsed.tokens) + totalTokens(parsed.nested),
			cost: costTotal(parsed.tokens) + (parsed.nestedCost?.total ?? 0),
			wallMs: r.wallMs,
			killedCleanly: r.killedCleanly,
			timedOut: r.timedOut,
			exit: r.exit,
		};
		// Evidence FIRST, and never let a write failure lose the numbers.
		const evidenceDir = path.join(studyDir, "raw", "_probe", profile.name);
		try {
			await fs.mkdir(evidenceDir, { recursive: true });
			await fs.writeFile(path.join(evidenceDir, "stream.jsonl"), r.stdout);
			await fs.writeFile(path.join(evidenceDir, "stderr.txt"), r.stderr);
			measured.evidence = path.relative(studyDir, evidenceDir);
		} catch (e) {
			measured.evidenceError = e.message;
		}

		// Only now judge.
		if (r.timedOut) measured.detail = `probe timed out after ${timeoutMs}ms${r.killedCleanly === false ? " (CHILD SURVIVED THE KILL)" : ""}`;
		else if (r.exit !== 0) measured.detail = `probe exited ${r.exit}: ${r.stderr.trim().split("\n").slice(-2).join(" | ").slice(0, 200)}`;
		else if (parsed.extensionErrors.length) measured.detail = `extension_error: ${parsed.extensionErrors[0]}`;
		else {
			const missing = names.filter((n) => !parsed.finalText.includes(n));
			measured.ok = missing.length === 0;
			measured.detail = missing.length ? `tools not registered: ${missing.join(", ")} — reply was ${JSON.stringify(parsed.finalText.slice(0, 200))}` : `all ${names.length} extension tools registered`;
		}
		return measured;
	} catch (e) {
		// A crash after the call must still report what the call cost.
		return { ...measured, ok: false, detail: `probe harness error after ${measured.tokens} measured tokens: ${e.message}` };
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
	// Same torn-tail repair as results.jsonl: a ledger whose last line is half-written would eat
	// the next probe record too, and probe spend that vanishes is spend nobody accounts for.
	const { rows } = await readJsonl(path.join(studyDir, "ledger.jsonl"));
	return rows;
}
const appendLedger = (studyDir, row) => fs.appendFile(path.join(studyDir, "ledger.jsonl"), `${JSON.stringify({ ts: new Date().toISOString(), ...row })}\n`);

/** One oracle key per comparison block, persisted so a RESUME reuses it instead of refetching. */
export async function readKeys(studyDir) {
	const { rows } = await readJsonl(path.join(studyDir, "keys.jsonl"));
	const map = new Map();
	for (const k of rows) if (k.block) map.set(k.block, k);
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
	// The trusted evaluator decides every edit-task verdict; an unpinned grader is an unpinned study.
	if (study.evaluator) extraSha["trusted-evaluator"] = (await fileSha(path.resolve(studyDir, study.evaluator))) ?? "MISSING";
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
		// The prepared agent dir's catalogs must price the study, not whatever config this process
		// inherited — otherwise the pricing catalog and the measured children's catalog can differ.
		pricer = await createPricer(piExports, { provider: study.model?.provider, agentDir });
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

	// Ctrl-C: kill the child, then WRITE DOWN what it had already cost. Exiting straight after the
	// signal threw away the buffered stream and the partial spend of a run that was genuinely paid
	// for — the record now says `run-error: interrupted` and carries its tokens.
	process.on("SIGINT", () => {
		console.log("\ninterrupted — killing the current child and recording its partial spend");
		for (const kill of LIVE) kill();
		try {
			for (const salvage of INFLIGHT) {
				const rec = salvage();
				if (rec) fsSync.appendFileSync(resultsPath, `${JSON.stringify(rec)}\n`);
			}
		} catch (e) {
			console.error(`could not persist the interrupted run: ${e.message}`);
		}
		process.exit(130);
	});

	// Zero-token pre-flight for every profile about to run: extensions load, model resolves,
	// pinned settings are in force. Free, so there is no reason to skip it.
	for (const name of new Set(todo.map((r) => r.profile))) {
		const profile = study.profiles.find((p) => p.name === name);
		const lp = await loadProbe({ study, studyDir, profile, launcher, agentDir });
		console.log(`load-probe ${name}: ${lp.ok ? "OK" : "FAILED"} — ${lp.detail}`);
		if (!lp.ok) throw new Error(`load probe failed for profile ${name}; refusing to spend`);
	}

	await runPlan({ study, studyDir, tasks, todo, launcher, fingerprint, agentDir, pricer, resultsPath, runOpts, priorRecords: prior.records });
}

/**
 * THE ORCHESTRATION. Extracted from main() and dependency-injected so the production path — probe,
 * ledger append, spawn, record — is exercised by tests rather than approximated by them. astra found
 * a ReferenceError in the probe and a fail-OPEN ledger append precisely because the tests called the
 * pieces separately and never drove this loop.
 *
 * Injectable seams (defaulting to the real thing): `deps.registrationProbe`, `deps.executeRun`,
 * `deps.appendLedger`, `deps.appendResult`, `deps.fetchKey`, `deps.log`.
 */
export async function runPlan({ study, studyDir, tasks, todo, launcher, fingerprint, agentDir, pricer, resultsPath, runOpts, priorRecords = [], deps = {} }) {
	const probeFn = deps.registrationProbe ?? registrationProbe;
	const runFn = deps.executeRun ?? executeRun;
	const ledgerFn = deps.appendLedger ?? appendLedger;
	const resultFn = deps.appendResult ?? ((p, rec) => fs.appendFile(p, `${JSON.stringify(rec)}\n`));
	const keyFn = deps.fetchKey ?? fetchKey;
	const log = deps.log ?? console.log;
	const ledger = deps.ledger ?? (await readLedger(studyDir));
	const blockKeys = deps.blockKeys ?? (await readKeys(studyDir));
	const probed = new Set(ledger.filter((l) => l.kind === "registration-probe" && l.ok).map((l) => l.profile));
	const budget0 = budgetFrom(priorRecords, ledger);
	let spentTokens = budget0.tokens;
	let spentWall = budget0.wallMs;
	let unknownSpendRuns = budget0.unknownRuns;
	// Restore the streak from the trailing records: three non-model failures in a row do not stop
	// mattering because the operator restarted the runner.
	let consecutiveHarness = 0;
	for (const r of [...priorRecords].reverse()) {
		if (r.state === "ok" || r.state === "fail") break;
		consecutiveHarness++;
	}
	if (consecutiveHarness) log(`resuming with a streak of ${consecutiveHarness} non-model failure(s) already on record`);
	let n = 0;
	if (probed.size) log(`registration probe already recorded for: ${[...probed].join(", ")} (not repeating)`);
	// The caps are BETWEEN-RUN thresholds, not hard ceilings: a run already in flight can carry us
	// past them, and unknown nested spend means the token figure is a lower bound. What we CAN do
	// is refuse to start another run, and cap each child by the wall time still allowed.
	// NO floor: granting 30 s when 5 s of allowance remains hands out time the budget does not have.
	// Too little left is a budget STOP, decided by `overBudget` below, not a grant.
	const MIN_USEFUL_MS = 20000;
	const remainingWall = () => (study.maxWallMs ? study.maxWallMs - spentWall : Infinity);
	const childTimeout = (want) => Math.min(want, remainingWall());
	const overBudget = () => (study.maxTotalTokens && spentTokens >= study.maxTotalTokens) || remainingWall() < MIN_USEFUL_MS;
	let spentCost = priorRecords.reduce((a, r) => a + (costOf(r) ?? 0), 0) + ledger.reduce((a, l) => a + (l.cost ?? 0), 0);
	log(`budget so far: ${spentTokens} tokens, $${spentCost.toFixed(4)}, ${Math.round(spentWall / 60000)} min${unknownSpendRuns ? ` — ${unknownSpendRuns} run(s) carry UNMEASURED nested spend, so this is a lower bound` : ""}`);

	for (const item of todo) {
		const task = tasks.find((t) => t.id === item.task);
		const profile = study.profiles.find((p) => p.name === item.profile);
		if (!task || !profile) throw new Error(`plan references unknown task/profile: ${tupleKey(item)}`);

		if (overBudget()) { log(`STOP: cumulative budget reached (${spentTokens} tokens / ${Math.round(spentWall / 60000)} min). ${todo.length - n} runs left undone.`); break; }
		if (consecutiveHarness >= SYSTEMIC_LIMIT) { log(`STOP: ${SYSTEMIC_LIMIT} consecutive non-model failures already on record. Fix the harness before resuming.`); break; }

		if ((profile.extensions ?? []).length && !probed.has(profile.name)) {
			const probe = await probeFn({ study, studyDir, profile, launcher, agentDir, pricer, timeoutMs: childTimeout(study.timeoutMs ?? 300000) });
			probed.add(profile.name);
			// LEDGER FIRST, always: a probe's spend must be recorded before anything can throw,
			// or a restart pays for it again.
			// FAIL CLOSED. If the probe's spend cannot be recorded durably, nothing further may be
			// paid for: a resume would pay for this probe again and its tokens would be missing from
			// every budget. "NOT recorded, continuing" was the bug.
			try {
				await ledgerFn(studyDir, {
					kind: "registration-probe",
					profile: profile.name,
					tokens: probe.tokens ?? 0,
					cost: probe.cost ?? null,
					wallMs: probe.wallMs ?? 0,
					ok: probe.ok,
					killedCleanly: probe.killedCleanly ?? null,
					evidence: probe.evidence ?? null,
					evidenceError: probe.evidenceError ?? null,
					detail: String(probe.detail).slice(0, 200),
				});
			} catch (e) {
				throw new Error(`could not record the ${profile.name} registration probe (${probe.tokens} tokens already spent): ${e.message}. Refusing to spend anything further — fix the ledger, then resume.`);
			}
			if (probe.evidenceError) throw new Error(`the ${profile.name} registration probe ran but its evidence could not be written (${probe.evidenceError}); refusing to spend further without an audit trail`);
			spentTokens += probe.tokens ?? 0;
			spentWall += probe.wallMs ?? 0;
			spentCost += probe.cost ?? 0;
			log(`probe ${profile.name}: ${probe.ok ? "OK" : "FAILED"} — ${probe.detail}`);
			if (probe.killedCleanly === false) throw new Error(`the registration probe for ${profile.name} left a child that could not be confirmed dead; refusing to start anything else`);
			if (!probe.ok) throw new Error(`registration probe failed for profile ${profile.name}; refusing to spend on a profile whose tools may not be loaded`);
			// A probe costs tokens and wall time, so the caps have to be retested before the run
			// that follows it — not only between graded runs.
			if (overBudget()) { log(`STOP: budget reached after the ${profile.name} registration probe. ${todo.length - n} runs left undone.`); break; }
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
				const got = keyFn(lk, { dir: studyDir });
				entry = got.error ? { block: item.block, task: item.task, rep: item.rep, error: got.error } : { block: item.block, task: item.task, rep: item.rep, key: got.key };
				blockKeys.set(item.block, entry);
				await fs.appendFile(path.join(studyDir, "keys.jsonl"), `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
				if (got.error) log(`  oracle unavailable for ${item.block}: ${got.error}`);
			}
			snapshotKey = entry.key;
			snapshotFailed = entry.error;
		}

		const rec = await runFn({ study, studyDir, task, profile, rep: item.rep, block: item.block, launcher, fingerprint, snapshotKey, snapshotFailed, opts: { ...runOpts, timeoutMs: childTimeout(task.timeoutMs ?? study.timeoutMs ?? 300000) } });
		if (!rec) continue;
		// Append on a guaranteed newline boundary (readResults already repaired any torn tail).
		// FAIL CLOSED for the same reason as the probe: an unrecorded paid run is lost spend.
		try {
			await resultFn(resultsPath, rec);
		} catch (e) {
			throw new Error(`could not record a completed run (${spendOf(rec)} tokens already spent): ${e.message}. Refusing to spend anything further.`);
		}
		n++;
		spentTokens += spendOf(rec);
		spentWall += rec.wallMs ?? 0;
		spentCost += costOf(rec) ?? 0;
		if (rec.nestedUnknown) unknownSpendRuns++;
		log(
			`[${n}/${todo.length}] ${rec.task} · ${rec.profile} · rep${rec.rep} → ${rec.state.toUpperCase()} ` +
				`${rec.totalTokens ?? 0}tok${rec.nestedUnknown ? "+?" : rec.nestedCalls ? `+${totalTokens(rec.nestedTokens)}nested` : ""} ` +
				`${Math.round((rec.wallMs ?? 0) / 100) / 10}s ${costOf(rec) == null ? "$?" : `$${(costOf(rec)).toFixed(4)}`} ${JSON.stringify(rec.toolCalls)}${rec.retries ? ` retries=${rec.retries}` : ""}${rec.error ? ` err=${rec.error.slice(0, 120)}` : ""}`,
		);
		// NO RETRY, by design: a failure is the measurement.
		// A run-error IS systemic: repeated auth failures, spawn failures or timeouts would
		// otherwise burn the whole schedule three-hundred-seconds at a time.
		consecutiveHarness = systemicStreak(consecutiveHarness, rec);
		if (shouldStopForKill(rec)) {
			log(`STOP: a child could not be confirmed dead (pid may still be spending). Nothing further will start.`);
			break;
		}
		if (consecutiveHarness >= SYSTEMIC_LIMIT) { log(`STOP: ${SYSTEMIC_LIMIT} consecutive non-model failures (${rec.state}). Fix the harness rather than filling the remaining cells.`); break; }
	}
	log(
		`\nspent ${spentTokens} tokens · $${spentCost.toFixed(4)} (pi's own cost arithmetic) · ${Math.round(spentWall / 60000)} min` +
			(unknownSpendRuns ? ` — NOT fully accounted: ${unknownSpendRuns} run(s) carry unmeasured nested spend` : " (fully accounted)") +
			`\nresults → ${resultsPath}\nnext: node apps/bench/aggregate.mjs ${path.relative(process.cwd(), studyDir) || "."}`,
	);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
	main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
}
