/**
 * @module packages/nana-pack/lib/mutation-runner.mjs
 * @purpose Run a lane's mutation pair table in scratch worktrees of its tip, split across shard processes, and write one judged record.
 * @inputs a lane table object (lane, self, tip, pairs, optional branch/declared/config), argv pair ids, SEAT_MUTATE_ env vars
 * @outputs a judged record (console and optionally SEAT_MUTATE_OUT), the process exit code
 * @effects disk (scratch git worktrees, the record and lock files, per-pair logs), process (spawns shard children and test-file children, applies signal handlers)
 * @errors refuses before any worktree on a bad id, config key, shard count, stagger or unresolved tip (R-1240, R-1244); reports ANCHOR-MISS/SYNTAX/RED per pair; never throws out of runMutations
 */
// CHANGE.md §3 (docs/reviews/mutate-runner-2026-10-17/CHANGE.md): a lane's table calls `runMutations(table)`
// once, in the role the environment gives it. With no SEAT_MUTATE_SHARD set, this call is the PARENT: it
// validates, takes the record lock, spawns N shard children of the SAME table script (`node <table.self>
// <ids>`, round-robin, staggered), and merges their part files into one record (S16 — a parent never judges
// a pair itself, one shard included). With SEAT_MUTATE_SHARD set, this call IS a shard: it owns one scratch
// worktree, runs its baseline and pairs, and writes its part file.
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline";
import { fileURLToPath } from "node:url";
import {
	BASELINE_RETRIES,
	DRAIN_MS,
	ENV_NAMES,
	EXIT_REFUSED,
	EXIT_TABLE_FAULT,
	FILE_TIMEOUT_MS,
	LOCK_SUFFIX,
	MAIN_BRANCH,
	NPM_COMMAND,
	NPM_KEYS,
	GLOBAL_PREFIX_KEY,
	OVERRIDABLE,
	SCRATCH_PREFIX,
	SHARDS_DEFAULT,
	SIGNAL_EXITS,
	STAGGER_SECS_DEFAULT,
	TABLE_HASH_ALGO,
	TASKKILL_ARGS,
	WORKTREE_REMOVE_RETRIES,
	WORKTREE_REMOVE_RETRY_MS,
	WORKTREE_LOCK_WAIT_MS,
	WORKTREE_LOCK_UNREADABLE_STALE_MS,
	WORKTREE_LOCK_WAIT_LIMIT_MS,
	CHILD_NODE_ARGS,
	TS_CHECK_ARGS,
	logName,
} from "./mutation-runner-config.mjs";

const posix = process.platform !== "win32";
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
const count = (hay, needle) => hay.split(needle).length - 1;
const short = (s, n = 160) => { const t = String(s); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const baseName = (p) => path.basename(p);
const titleSource = (t) => (t instanceof RegExp ? String(t) : t);
const PAIR_LINE = /^(?:RED|GREEN|ANCHOR-MISS|SYNTAX|DRY ok) (\S+) /;

// ── judging (R-1237) — pure, so it is tested without git ───────────────────────────────────────
const linesWith = (out, tag) => out.split(/\r?\n/).filter((l) => l.startsWith(`${tag} `)).map((l) => l.slice(tag.length + 1).trim());
const isTitle = (t, title) => (title instanceof RegExp ? title.test(t) : t === title || t.startsWith(`${title} `));
const fileCrashed = (out) => /^Node\.js v\d+\.\d+\.\d+$/.test(out.trim().split(/\r?\n/).at(-1) ?? "");

/** Pure: judge one pair from its test files' raw output. No effects (R-1237). */
export function judgePair(pair, runs) {
	const judged = pair.expectRed ?? [];
	const declared = pair.alsoRed ?? [];
	const allFails = [];
	const passTitles = [];
	const crashed = [];
	for (const r of runs) {
		const fails = linesWith(r.out, "FAIL");
		passTitles.push(...linesWith(r.out, "PASS"));
		allFails.push(...fails.map((t) => ({ rel: r.rel, t })));
		if (fileCrashed(r.out)) crashed.push(`${baseName(r.rel)} THREW (later checks never ran)`);
		else if ((r.code !== 0 || r.timedOut) && fails.length === 0) crashed.push(`${baseName(r.rel)} exit ${r.code}${r.timedOut ? " (timeout)" : ""}`);
		else if (r.code === 0 && fails.length) crashed.push(`${baseName(r.rel)} printed FAIL lines but exited 0`);
	}
	const failed = (title) => allFails.some(({ t }) => isTitle(t, title));
	const matchedNamed = judged.filter(failed);
	const namedButGreen = judged.filter((s) => !failed(s) && passTitles.some((t) => isTitle(t, s)));
	const notReached = judged.filter((s) => !failed(s) && !passTitles.some((t) => isTitle(t, s)));
	const declaredRed = declared.filter(failed);
	const declaredGreen = declared.filter((s) => !failed(s));
	const unnamedRed = allFails.filter(({ t }) => ![...judged, ...declared].some((s) => isTitle(t, s)));
	const failCount = allFails.length;
	const verdict = matchedNamed.length || failCount || crashed.length ? "RED" : "GREEN";
	return { verdict, matchedNamed, namedButGreen, notReached, declaredRed, declaredGreen, unnamedRed, crashed, failCount };
}

function formatPairLine(pair, j, diffText) {
	if (j.verdict === "GREEN") return `GREEN ${pair.n} ${pair.name} — SURVIVED`;
	const parts = [];
	parts.push(j.matchedNamed.length ? `${j.matchedNamed.length}/${(pair.expectRed ?? []).length} named: ${j.matchedNamed.map((t) => short(titleSource(t), 100)).join(" | ")}` : "(no named case)");
	if (j.declaredRed.length) parts.push(`also (declared): ${j.declaredRed.map((t) => short(titleSource(t), 80)).join(" | ")}`);
	if (j.declaredGreen.length) parts.push(`declared but GREEN: ${j.declaredGreen.map(titleSource).join(", ")}`);
	if (j.namedButGreen.length) parts.push(`named but GREEN: ${j.namedButGreen.map(titleSource).join(", ")}`);
	if (j.notReached.length) parts.push(`named but NOT REACHED: ${j.notReached.map(titleSource).join(", ")}`);
	if (j.unnamedRed.length) parts.push(`UNNAMED red: ${j.unnamedRed.map(({ rel, t }) => `[${baseName(rel)}] ${short(t, 110)}`).join(" | ")}`);
	parts.push(`${j.failCount} FAIL total${diffText ? ` (${diffText})` : ""}`);
	if (j.crashed.length) parts.push(`CRASH ${j.crashed.join(" || ")}`);
	return `RED ${pair.n} ${pair.name} — ${parts.join("; ")}`;
}

function resultLine(totalPairs, tally, survivors, { missing, shards, interrupted = false, dry = false }) {
	const tail = `${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}${missing ? `, ${missing} MISSING` : ""}${shards ? `, across ${shards} shards` : ""}${interrupted ? " (INTERRUPTED)" : ""}`;
	if (dry) return `RESULT (DRY): ${totalPairs - tally.anchorMiss - tally.syntax - missing}/${totalPairs} pairs apply${tail}`;
	return `RESULT: ${tally.red}/${tally.runnable} red (${tally.exact} exactly their named titles, ${tally.namedGreen} with a named title green, ${tally.unnamedRed} with an unnamed red), ${tally.survived} survived${survivors.length ? ` [${survivors.join(", ")}]` : ""}${tail}`;
}

// ── shard count (R-1238) — pure ─────────────────────────────────────────────────────────────────
/** Pure: the shard count for this run. No effects. `selected` is the array of selected pairs. */
export function shardCount(env, selected, config) {
	if (env[ENV_NAMES.SHARD]) return 1; // a shard never splits again
	const raw = env[ENV_NAMES.SHARDS];
	const n = raw !== undefined ? Number(raw) : config.SHARDS_DEFAULT;
	return Math.max(1, Math.min(n, selected.length || 1));
}

// ── config merge (R-1244) ───────────────────────────────────────────────────────────────────────
const BASE_CONFIG = { SHARDS_DEFAULT, STAGGER_SECS_DEFAULT, FILE_TIMEOUT_MS, BASELINE_RETRIES, DRAIN_MS, SCRATCH_PREFIX, MAIN_BRANCH, LOCK_SUFFIX, TABLE_HASH_ALGO, NPM_COMMAND };

function mergeConfig(tableConfig) {
	if (!tableConfig) return { value: { ...BASE_CONFIG } };
	const bad = Object.keys(tableConfig).find((k) => !OVERRIDABLE.includes(k));
	if (bad) return { error: `config key '${bad}' is not one of the overridable tunables (${OVERRIDABLE.join(", ")})` };
	return { value: { ...BASE_CONFIG, ...tableConfig } };
}

// ── validation (R-1240), before any worktree ────────────────────────────────────────────────────
function validateIdsAndTable(argvIds, pairs) {
	const ns = pairs.map((p) => p.n);
	const unknown = argvIds.filter((id) => !ns.includes(id));
	if (unknown.length) return `unknown pair id ${unknown.join(", ")} (ids are ${ns.join(", ")})`;
	const seen = new Set();
	for (const n of ns) {
		if (typeof n !== "string" || n.trim() === "") return "the table holds a blank or whitespace-only pair id";
		if (/\s/.test(n)) return `pair id ${JSON.stringify(n)} holds white space`;
		if (seen.has(n)) return `the table repeats pair id ${JSON.stringify(n)}`;
		seen.add(n);
	}
	return null;
}

// ── git / worktree primitives (R-1230) ──────────────────────────────────────────────────────────
function repoRootOf(selfPath) {
	const r = sh("git", ["-C", path.dirname(selfPath), "rev-parse", "--show-toplevel"]);
	return r.status === 0 ? r.stdout.trim() : null;
}

function resolveTip(repoRoot, tipArg, branch) {
	const tipSha = sh("git", ["-C", repoRoot, "rev-parse", "--verify", `${tipArg}^{commit}`]).stdout.trim();
	if (!tipSha) return { error: `tip ${tipArg} does not resolve to a commit in ${repoRoot}` };
	const mb = sh("git", ["-C", repoRoot, "merge-base", MAIN_BRANCH, tipSha]);
	const mergeBase = mb.status === 0 ? mb.stdout.trim() : "";
	if (!mergeBase) return { error: `tip ${tipArg} has no merge base with ${MAIN_BRANCH} in ${repoRoot}` };
	const branchHead = branch ? sh("git", ["-C", repoRoot, "rev-parse", branch]).stdout.trim() || null : null;
	return { tipSha, mergeBase, branchHead };
}

function tableHash(pairs, tableConfig) {
	const norm = pairs.map((p) => ({ ...p, expectRed: (p.expectRed ?? []).map(titleSource), alsoRed: (p.alsoRed ?? []).map(titleSource) }));
	return createHash(TABLE_HASH_ALGO).update(JSON.stringify({ pairs: norm, config: tableConfig ?? null })).digest("hex");
}

/** Resolve `relPath` against the real `root`, following symlinks; never throws. */
function realContainment(root, relPath) {
	const want = path.resolve(root, relPath);
	let probe = want;
	const tail = [];
	for (;;) {
		try {
			const real = fs.realpathSync.native(probe);
			const full = tail.length ? path.join(real, ...tail) : real;
			const rel = path.relative(root, full);
			const within = rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
			return { target: full, exists: probe === want, within };
		} catch {
			const base = path.dirname(probe);
			if (base === probe) return { target: want, exists: false, within: false };
			tail.unshift(path.basename(probe));
			probe = base;
		}
	}
}

/** Reset a scratch worktree to `tip`, refusing first unless `dir` is its own git root (M2, R-1230). */
export function resetScratch(dir, tip, _config) {
	const top = sh("git", ["-C", dir, "rev-parse", "--show-toplevel"]);
	let realTop = null;
	let realDir = null;
	try { realTop = fs.realpathSync.native(top.stdout.trim()); } catch { /* missing */ }
	try { realDir = fs.realpathSync.native(dir); } catch { /* missing */ }
	if (top.status !== 0 || !realTop || !realDir || realTop !== realDir) {
		throw new Error(`scratch worktree is gone or not its own git root: ${(top.stderr || top.stdout || "").trim()}`);
	}
	const noHooks = path.join(path.dirname(dir), "no-hooks");
	const hooksArg = fs.existsSync(noHooks) ? ["-c", `core.hooksPath=${noHooks}`] : [];
	// core.autocrlf=false (R-1322): the reset checks files out again, and the scratch worktree
	// must hold the committed bytes whatever the repository's own autocrlf setting is.
	const r1 = sh("git", [...hooksArg, "-c", "core.autocrlf=false", "-C", dir, "reset", "-q", "--hard", tip]);
	if (r1.status !== 0) throw new Error(`git reset failed: ${r1.stderr}`);
	const r2 = sh("git", [...hooksArg, "-C", dir, "clean", "-fdxq"]);
	if (r2.status !== 0) throw new Error(`git clean failed: ${r2.stderr}`);
	const head = sh("git", ["-C", dir, "rev-parse", "HEAD"]).stdout.trim();
	if (head !== tip) throw new Error(`scratch HEAD ${head} is not the tip ${tip} after reset`);
	const st = sh("git", ["-C", dir, "status", "--porcelain"]);
	if (st.stdout.trim()) throw new Error(`scratch worktree not clean after reset:\n${st.stdout}`);
}

function killPid(pid) {
	if (!Number.isInteger(pid) || pid <= 0) return;
	try {
		if (posix) process.kill(-pid, "SIGKILL");
		else spawnSync("taskkill", [...TASKKILL_ARGS, String(pid)], { stdio: "ignore", windowsHide: true });
	} catch { /* already gone */ }
}

function pidIsAlive(pid) {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try { process.kill(pid, 0); return true; } catch (err) { return err.code === "EPERM"; }
}

const TRANSIENT_LOCK_CODES = new Set(["EPERM", "EACCES", "EBUSY"]);
const isTransientLockError = (err) => TRANSIENT_LOCK_CODES.has(err?.code);

function publishWorktreeLock(lockPath, ownerText, io) {
	const tempPath = path.join(path.dirname(lockPath), `.${path.basename(lockPath)}.${process.pid}.${randomUUID()}.tmp`);
	try {
		io.writeFileSync(tempPath, ownerText, { flag: "wx" });
		try {
			io.linkSync(tempPath, lockPath);
			return "acquired";
		} catch (err) {
			if (err.code === "EEXIST") return "contended";
			if (isTransientLockError(err)) return "retry";
			throw err;
		}
	} finally {
		try { io.rmSync(tempPath, { force: true }); } catch { /* the lock directory's owner may be cleaning it */ }
	}
}

function removeWorktreeLockIfOwned(lockPath, ownerText, io) {
	try {
		if (io.readFileSync(lockPath, "utf8") !== ownerText) return "not-owned";
		io.unlinkSync(lockPath);
		return "removed";
	} catch (err) {
		if (err.code === "ENOENT") return "not-owned";
		if (isTransientLockError(err)) return "retry";
		throw err;
	}
}

/** Run one scratch-worktree add or complete removal while no other shard can run either operation. */
export function withWorktreeOperationLock(lockPath, operation, options = {}) {
	const sleeper = new Int32Array(new SharedArrayBuffer(4));
	const io = {
		writeFileSync: options.writeFileSync ?? fs.writeFileSync,
		linkSync: options.linkSync ?? fs.linkSync,
		rmSync: options.rmSync ?? fs.rmSync,
		readFileSync: options.readFileSync ?? fs.readFileSync,
		statSync: options.statSync ?? fs.statSync,
		unlinkSync: options.unlinkSync ?? fs.unlinkSync,
	};
	const now = options.now ?? Date.now;
	const wait = options.wait ?? ((ms) => Atomics.wait(sleeper, 0, 0, ms));
	const waitLimitMs = options.waitLimitMs ?? WORKTREE_LOCK_WAIT_LIMIT_MS;
	const report = options.report ?? ((line) => console.error(line));
	const ownerText = JSON.stringify({ pid: process.pid, started: new Date().toISOString(), owner: randomUUID() });
	const waitStarted = now();
	let holderPid = null;
	const waitOrFail = () => {
		if (now() - waitStarted >= waitLimitMs) {
			const line = `seat-mutate: worktree-operation lock ${lockPath} held by pid ${holderPid ?? "?"} did not release within ${waitLimitMs} milliseconds`;
			report(line);
			throw new Error(line);
		}
		wait(WORKTREE_LOCK_WAIT_MS);
	};
	for (;;) {
		const publication = publishWorktreeLock(lockPath, ownerText, io);
		if (publication === "acquired") break;
		if (publication === "retry") { waitOrFail(); continue; }

		let observed;
		try { observed = io.readFileSync(lockPath, "utf8"); } catch (err) {
			if (err.code === "ENOENT") continue;
			if (isTransientLockError(err)) { waitOrFail(); continue; }
			throw err;
		}
		let holder = null;
		try { holder = JSON.parse(observed); } catch { /* age decides whether unreadable content is stale */ }
		const parsedPid = Number(holder?.pid);
		if (Number.isInteger(parsedPid) && parsedPid > 0) holderPid = parsedPid;
		let held = pidIsAlive(parsedPid);
		if (!holder) {
			try { held = now() - io.statSync(lockPath).mtimeMs <= WORKTREE_LOCK_UNREADABLE_STALE_MS; } catch (err) {
				if (err.code === "ENOENT") continue;
				if (isTransientLockError(err)) { waitOrFail(); continue; }
				throw err;
			}
		}
		if (!held) {
			const removal = removeWorktreeLockIfOwned(lockPath, observed, io);
			if (removal === "removed") continue;
		}
		waitOrFail();
	}
	try {
		return operation();
	} finally {
		for (;;) {
			const removal = removeWorktreeLockIfOwned(lockPath, ownerText, io);
			if (removal !== "retry") break;
			// A live owner must not abandon its lock: waiters cannot distinguish that leftover from
			// a still-running critical section, and Windows can keep an open file delete-pending.
			wait(WORKTREE_LOCK_WAIT_MS);
		}
	}
}

/** Remove this runner's scratch worktree entry, retrying a refused removal by its unique suffix. */
function removeScratchWorktree(repoRoot, scratchDir, operationLockPath, report) {
	return withWorktreeOperationLock(operationLockPath, () => {
		const wt = path.join(scratchDir, "wt");
		const noHooks = path.join(scratchDir, "no-hooks");
		const suffix = `${path.basename(scratchDir)}/wt`;
		const remove = (name) => sh("git", ["-c", `core.hooksPath=${noHooks}`, "-C", repoRoot, "worktree", "remove", "--force", name]);
		const isListed = () => {
			const list = sh("git", ["-C", repoRoot, "worktree", "list", "--porcelain"]);
			if (list.status !== 0) return true;
			return list.stdout.split(/\r?\n/).some((line) => {
				if (!line.startsWith("worktree ")) return false;
				const listedPath = line.slice("worktree ".length).replace(/[ \t]+$/, "").replace(/\\/g, "/");
				return listedPath.endsWith(`/${suffix}`);
			});
		};

		if (remove(wt).status === 0) return null;
		for (let retry = 0; retry < WORKTREE_REMOVE_RETRIES; retry++) {
			if (!isListed()) return null;
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, WORKTREE_REMOVE_RETRY_MS);
			try { fs.rmSync(wt, { recursive: true, force: true }); } catch { /* ignore */ }
			if (remove(suffix).status === 0) return null;
		}
		return isListed() ? `seat-mutate: git worktree entry ${wt} is still listed after ${WORKTREE_REMOVE_RETRIES} retries` : null;
	}, { report });
}

/** Dead-shard cleanup (R-1231): the shard ended but its scratch folder is still there. */
function cleanupDeadShard(repoRoot, scratchDir, operationLockPath, keep, log) {
	const pidFile = path.join(scratchDir, "running.pid");
	try {
		const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
		killPid(pid);
	} catch { /* no running test file */ }
	if (keep) {
		log?.(`seat-mutate: KEEP — scratch left at ${scratchDir}`);
		return null;
	}
	const cleanupLine = removeScratchWorktree(repoRoot, scratchDir, operationLockPath, log);
	try { fs.rmSync(scratchDir, { recursive: true, force: true }); } catch { /* ignore */ }
	return cleanupLine;
}

// ── one test file's run (R-1232, R-1233, R-1234) ────────────────────────────────────────────────
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR" || /^SEAT_MUTATE_/.test(k);

function baseChildEnv(npmCommand) {
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k)) delete e[k];
	const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${c}`] = "0";
	e.GIT_CONFIG_COUNT = String(c + 1);
	const notRead = [];
	for (const key of NPM_KEYS) {
		const name = `npm_config_${key}`;
		if (e[name]) continue;
		const r = sh(npmCommand, ["config", "get", key], { env: process.env });
		const v = r.status === 0 && !r.error ? r.stdout?.trim() : undefined;
		if (v && v !== "undefined") e[name] = v;
		else notRead.push(key);
	}
	const globalName = `npm_config_${GLOBAL_PREFIX_KEY}`;
	if (!e[globalName]) {
		if (e.npm_config_prefix) e[globalName] = e.npm_config_prefix;
		else notRead.push(GLOBAL_PREFIX_KEY);
	}
	return { env: e, notRead };
}

/** Run one test file exactly as scripts/test.mjs does; resolves { code, out, timedOut }. Never throws. */
function runTestFile(absFile, cwd, env, timeoutMs, onPid) {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [...CHILD_NODE_ARGS, absFile], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: posix, windowsHide: true });
		onPid?.(child.pid);
		let out = "";
		child.stdout.on("data", (d) => { out += d; });
		child.stderr.on("data", (d) => { out += d; });
		let timedOut = false;
		let exitInfo = null;
		let settled = false;
		let drainTimer = null;
		const timeoutTimer = setTimeout(() => { timedOut = true; killPid(child.pid); }, timeoutMs);
		const settle = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timeoutTimer);
			clearTimeout(drainTimer);
			killPid(child.pid); // R-1234: kill what remains of the group once the result is known
			try { child.stdout.destroy(); } catch { /* ignore */ }
			try { child.stderr.destroy(); } catch { /* ignore */ }
			onPid?.(null);
			resolve({ code: exitInfo?.code ?? null, signal: exitInfo?.signal ?? null, timedOut, out });
		};
		child.on("error", (err) => { out += `\n[mutation-runner] spawn error: ${err.message}\n`; settle(); });
		child.on("exit", (code, signal) => {
			exitInfo = { code, signal };
			clearTimeout(timeoutTimer);
			drainTimer = setTimeout(settle, DRAIN_MS); // R-1234: wait for close up to the drain
		});
		child.on("close", () => settle());
	});
}

// ── edits and syntax (R-1235) ───────────────────────────────────────────────────────────────────
function applyEdits(worktreeReal, pair) {
	for (const e of pair.edits) {
		const { target, exists, within } = realContainment(worktreeReal, e.file);
		if (!within) return { file: e.file, detail: "resolves outside the scratch worktree" };
		if (!exists) return { file: e.file, detail: "does not exist" };
		let text;
		try { text = fs.readFileSync(target, "utf8"); } catch (err) { return { file: e.file, detail: `cannot be read: ${err.message}` }; }
		const c = count(text, e.anchor);
		if (c !== e.times) return { file: e.file, detail: `anchor occurs ${c}× (want ${e.times})` };
		fs.writeFileSync(target, text.split(e.anchor).join(e.replacement));
	}
	return null;
}

function syntaxProblem(worktreeReal, pair) {
	for (const f of new Set(pair.edits.map((e) => e.file))) {
		const abs = path.join(worktreeReal, f);
		if (/\.(mjs|js)$/.test(f)) {
			const r = sh(process.execPath, ["--check", abs]);
			if (r.status !== 0) return { file: f, detail: short(r.stderr, 300) };
		} else if (/\.ts$/.test(f)) {
			const checker = path.join(worktreeReal, TS_CHECK_ARGS[2]);
			const r = sh(process.execPath, [TS_CHECK_ARGS[0], TS_CHECK_ARGS[1], checker, abs]);
			if (r.status !== 0) return { file: f, detail: short(r.stderr || r.stdout, 300) };
		}
	}
	return null;
}

// ── one shard ────────────────────────────────────────────────────────────────────────────────────
async function runOneShard(pairs, ctx) {
	const { env, repoRoot, tipSha, config } = ctx;
	const scratchDir = env[ENV_NAMES.SCRATCH];
	const noHooks = path.join(scratchDir, "no-hooks");
	fs.mkdirSync(noHooks, { recursive: true });
	const wt = path.join(scratchDir, "wt");
	const runningPidFile = path.join(scratchDir, "running.pid");
	const dry = env[ENV_NAMES.DRY] === "1";
	const keep = env[ENV_NAMES.KEEP] === "1";
	const logdir = env[ENV_NAMES.LOGDIR] || null;
	if (logdir) fs.mkdirSync(logdir, { recursive: true });
	const shardTag = env[ENV_NAMES.SHARD] || null;
	const partFile = env[ENV_NAMES.OUT] || null;
	const tallyFile = env[ENV_NAMES.TALLY] || null;
	const operationLockPath = env[ENV_NAMES.WORKTREE_LOCK];

	const lines = [];
	const log = (l) => lines.push(l);
	let currentPid = null;
	let stopping = false;
	let exitCode = 0;

	const writePart = () => { if (partFile) fs.writeFileSync(partFile, lines.length ? `${lines.join("\n")}\n` : ""); };
	const finish = (code) => {
		if (keep) log(`seat-mutate: KEEP — scratch left at ${scratchDir}`);
		writePart(); // write before any cleanup removes the folder the part file lives in
		try { fs.rmSync(runningPidFile, { force: true }); } catch { /* ignore */ }
		if (!keep) {
			try {
				const cleanupLine = removeScratchWorktree(repoRoot, scratchDir, operationLockPath, log);
				if (cleanupLine) log(cleanupLine);
				writePart();
			} catch (err) {
				log(`seat-mutate: scratch worktree cleanup failed for ${scratchDir}: ${err?.message ?? err}`);
				writePart();
			}
			try { fs.rmSync(scratchDir, { recursive: true, force: true }); } catch { /* ignore */ }
		}
		return code;
	};

	const onSignal = (sig) => {
		if (stopping) return;
		stopping = true;
		killPid(currentPid);
		log(`seat-mutate: ${sig} — stopping${keep ? `; KEEP — scratch left at ${scratchDir}` : ", removing the scratch worktree"}`);
		process.exitCode = finish(SIGNAL_EXITS[sig]);
		process.exit(process.exitCode);
	};
	const sigHandlers = {};
	for (const sig of ["SIGINT", "SIGTERM"]) { const h = () => onSignal(sig); sigHandlers[sig] = h; process.on(sig, h); }
	const offSignals = () => { for (const sig of ["SIGINT", "SIGTERM"]) process.off(sig, sigHandlers[sig]); };

	try {
		// core.autocrlf=false (R-1322): the new scratch worktree holds the committed bytes
		// whatever the repository's own autocrlf setting is, so a multi-line anchor that spans
		// a line break still matches.
		const add = withWorktreeOperationLock(operationLockPath, () => sh("git", ["-c", `core.hooksPath=${noHooks}`, "-c", "core.autocrlf=false", "-C", repoRoot, "worktree", "add", "--detach", wt, tipSha]), { report: log });
		if (add.status !== 0) { log(`seat-mutate: worktree add ${tipSha} failed: ${short(add.stderr, 300)}`); return finish(EXIT_REFUSED); }
		const worktreeReal = fs.realpathSync.native(wt);

		log(`seat-mutate: lane ${ctx.lane}${shardTag ? `, shard ${shardTag}` : ""}, tip ${tipSha}, merge-base ${ctx.mergeBase}, ${pairs.length} pairs${dry ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);

		const runTest = async (rel) => {
			const abs = path.join(worktreeReal, rel);
			const cwd = path.dirname(path.dirname(abs));
			const { env: childEnv, notRead } = baseChildEnv(config.NPM_COMMAND);
			if (notRead.length) log(`seat-mutate: npm could not give ${notRead.join(", ")}`);
			const home = fs.mkdtempSync(path.join(scratchDir, "home-"));
			const tmp = fs.mkdtempSync(path.join(scratchDir, "tmp-"));
			const fileEnv = { ...childEnv, HOME: home, USERPROFILE: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
			const res = await runTestFile(abs, cwd, fileEnv, config.FILE_TIMEOUT_MS, (pid) => { currentPid = pid; if (pid) fs.writeFileSync(runningPidFile, String(pid)); else try { fs.rmSync(runningPidFile, { force: true }); } catch { /* ignore */ } });
			try { fs.rmSync(home, { recursive: true, force: true }); } catch { /* ignore */ }
			try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
			return { rel, ...res };
		};

		const basePass = {};
		let baselineOk = true;
		if (!dry) {
			const files = [...new Set(pairs.flatMap((p) => p.tests))];
			for (const rel of files) {
				const { within } = realContainment(worktreeReal, rel);
				if (!within) { baselineOk = false; log(`seat-mutate: baseline test file resolves outside the scratch worktree: ${rel}`); continue; }
				let ok = false;
				for (let attempt = 1; attempt <= 1 + config.BASELINE_RETRIES && !ok; attempt++) {
					resetScratch(wt, tipSha, config);
					const res = await runTest(rel);
					const fails = linesWith(res.out, "FAIL");
					ok = res.code === 0 && !res.timedOut && fails.length === 0;
					basePass[rel] = linesWith(res.out, "PASS");
					log(`BASELINE${attempt > 1 ? " RETRY" : ""} ${ok ? "ok  " : "FAIL"} ${rel} (exit ${res.code}, ${basePass[rel].length} PASS, ${fails.length} FAIL, ${res.secs ?? ""})`);
					if (!ok && logdir) fs.writeFileSync(path.join(logdir, `baseline-${shardTag ? `${shardTag.replace("/", "of")}-` : ""}${baseName(rel)}${attempt > 1 ? "-retry" : ""}.log`), res.out);
				}
				if (!ok) { baselineOk = false; log(`BASELINE MISSING — ${rel} stayed red`); }
			}
			for (const p of pairs) for (const title of [...(p.expectRed ?? []), ...(p.alsoRed ?? [])]) {
				if (!p.tests.some((rel) => (basePass[rel] ?? []).some((t) => isTitle(t, title)))) {
					baselineOk = false;
					log(`BASELINE MISSING title for pair ${p.n}: ${short(titleSource(title), 160)} is not a PASS line in ${p.tests.join(", ")}`);
				}
			}
			resetScratch(wt, tipSha, config);
		}

		const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
		const survivors = [];
		if (!baselineOk) {
			log("seat-mutate: baseline not green — refusing to judge mutations");
			exitCode = EXIT_REFUSED;
		} else {
			for (const p of pairs) {
				resetScratch(wt, tipSha, config);
				const anchorProblem = applyEdits(worktreeReal, p);
				if (anchorProblem) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${anchorProblem.file}: ${anchorProblem.detail}`); continue; }
				const diff = sh("git", ["-C", wt, "diff", "--shortstat"]).stdout.trim() || "no tracked change";
				const bad = syntaxProblem(worktreeReal, p);
				if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad.file}: ${bad.detail}`); continue; }
				if (dry) { log(`DRY ok ${p.n} ${p.name} (${diff})`); continue; }
				tally.runnable++;
				let pairPathProblem = null;
				const runs = [];
				for (const rel of p.tests) {
					const { within } = realContainment(worktreeReal, rel);
					if (!within) { pairPathProblem = rel; break; }
					runs.push(await runTest(rel));
				}
				if (pairPathProblem) { log(`seat-mutate: pair ${p.n} test file resolves outside the scratch worktree: ${pairPathProblem}`); exitCode = EXIT_REFUSED; break; }
				for (const r of runs) if (logdir) fs.writeFileSync(path.join(logdir, logName(p.n, baseName(r.rel))), r.out);
				const j = judgePair(p, runs);
				if (j.verdict === "GREEN") { tally.survived++; survivors.push(p.n); }
				else {
					tally.red++;
					if (j.namedButGreen.length || j.notReached.length) tally.namedGreen++;
					if (j.unnamedRed.length) tally.unnamedRed++;
					if (j.matchedNamed.length && !j.namedButGreen.length && !j.notReached.length && !j.unnamedRed.length) tally.exact++;
					else if (!j.matchedNamed.length) tally.namedGreen++;
				}
				log(formatPairLine(p, j, diff));
			}
		}
		if (tallyFile) fs.writeFileSync(tallyFile, JSON.stringify({ tally, survivors }));
		log(resultLine(pairs.length, tally, survivors, { missing: 0, shards: 0, dry }));
		if (tally.anchorMiss || tally.syntax) exitCode = EXIT_TABLE_FAULT;
		return finish(exitCode);
	} catch (err) {
		log(`seat-mutate: shard threw: ${err?.stack ?? err}`);
		return finish(1);
	} finally {
		offSignals();
	}
}

// ── the parent ───────────────────────────────────────────────────────────────────────────────────
function acquireLock(lockPath) {
	for (;;) {
		try {
			fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, started: new Date().toISOString() }), { flag: "wx" });
			return { ok: true };
		} catch (err) {
			if (err.code !== "EEXIST") return { error: `could not create lock ${lockPath}: ${err.message}` };
			let holder = null;
			try { holder = JSON.parse(fs.readFileSync(lockPath, "utf8")); } catch { /* unreadable */ }
			const pid = Number(holder?.pid);
			let alive = false;
			if (Number.isInteger(pid) && pid > 0) {
				try { process.kill(pid, 0); alive = true; } catch (e) { alive = e.code === "EPERM"; }
			}
			if (alive) return { error: `${lockPath} is held by pid ${pid} started ${holder?.started ?? "?"} — refusing a second run on this record` };
			return { error: `stale lock reported and replaced (pid ${pid} no longer runs)`, stale: true, retry: true };
		}
	}
}

function takeLock(lockPath) {
	const r = acquireLock(lockPath);
	if (r.ok) return { ok: true };
	if (!r.retry) return r;
	console.log(`seat-mutate: ${r.error}`);
	try { fs.rmSync(lockPath, { force: true }); } catch { /* ignore */ }
	const r2 = acquireLock(lockPath);
	return r2.ok ? { ok: true } : (r2.error ? r2 : { error: "lock still held after removing the stale one" });
}

async function runParent(selected, n, staggerMs, ctx) {
	const groups = Array.from({ length: n }, () => []);
	selected.forEach((p, i) => groups[i % n].push(p.n));
	const dry = ctx.dry;
	const header = `seat-mutate: lane ${ctx.lane}, tip ${ctx.tipSha}, table ${ctx.tableHash}${ctx.branchHead && ctx.branchHead !== ctx.tipSha ? ` (NOTE: ${ctx.branch} is now ${ctx.branchHead})` : ""}, merge-base ${ctx.mergeBase}, ${selected.length} pairs in ${n} shards (${groups.map((g) => g.length).join("+")}, round-robin, ${staggerMs / 1000}s apart)${dry ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`;
	console.log(header);
	for (const d of ctx.declared) console.log(`DECLARED ${d}`);

	let interrupted = false;
	const kids = new Set();
	const sigHandlers = {};
	for (const sig of ["SIGINT", "SIGTERM"]) {
		const h = () => { interrupted = true; for (const c of kids) { try { c.kill(sig); } catch { /* ignore */ } } };
		sigHandlers[sig] = h;
		process.on(sig, h);
	}
	// Part and tally files live in their OWN temp folder, separate from each shard's scratch worktree
	// folder, so a shard's own (graceful) cleanup of its scratch folder can never delete the file the
	// parent is about to read (S14): the parent, not the shard, owns and removes this folder.
	const partsDir = fs.mkdtempSync(path.join(os.tmpdir(), `${ctx.config.SCRATCH_PREFIX}parts-`));
	const operationLockPath = path.join(partsDir, "worktree-operation.lock");
	try {
		const scratchDirs = [];
		const runShard = (k, ids) => new Promise((resolve) => {
			const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), ctx.config.SCRATCH_PREFIX));
			scratchDirs.push(scratchDir);
			const partFile = path.join(partsDir, `part${k}of${n}.txt`);
			const tallyFile = path.join(partsDir, `part${k}of${n}.json`);
			if (interrupted) { resolve({ k, code: null, signal: "not started", scratchDir, partFile, tallyFile }); return; }
			const env = {
				...process.env,
				[ENV_NAMES.SHARD]: `${k}/${n}`,
				[ENV_NAMES.SHARDS]: "1",
				[ENV_NAMES.OUT]: partFile,
				[ENV_NAMES.TALLY]: tallyFile,
				[ENV_NAMES.SCRATCH]: scratchDir,
				[ENV_NAMES.TIP_COMMIT]: ctx.tipSha,
				[ENV_NAMES.TABLE_HASH]: ctx.tableHash,
				[ENV_NAMES.WORKTREE_LOCK]: operationLockPath,
			};
			const child = spawn(process.execPath, [ctx.selfPath, ...ids], { env, stdio: ["ignore", "pipe", "pipe"] });
			kids.add(child);
			readline.createInterface({ input: child.stdout }).on("line", (l) => console.log(`[${k}/${n}] ${l}`));
			readline.createInterface({ input: child.stderr }).on("line", (l) => console.error(`[${k}/${n}] ${l}`));
			child.on("close", (code, signal) => { kids.delete(child); resolve({ k, code, signal, scratchDir, partFile, tallyFile }); });
		});
		const ends = await Promise.all(groups.map((ids, i) => new Promise((resolve) => setTimeout(() => resolve(runShard(i + 1, ids)), i * staggerMs))));

		const notes = [];
		for (const end of ends) if (end.scratchDir && fs.existsSync(end.scratchDir)) {
			const cleanupLine = cleanupDeadShard(ctx.repoRoot, end.scratchDir, operationLockPath, ctx.keep, (l) => {
				console.log(l);
				notes.push(`[${end.k}/${n}] ${l}`);
			});
			if (cleanupLine) notes.push(`[${end.k}/${n}] ${cleanupLine}`);
		}

		const total = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
		const survivors = [];
		const pairLines = new Map();
		let shardFailed = false;
		for (const end of ends) {
			const lines = end.partFile && fs.existsSync(end.partFile) ? fs.readFileSync(end.partFile, "utf8").split("\n").filter(Boolean) : [];
			for (const l of lines) {
				const m = PAIR_LINE.exec(l);
				if (m) pairLines.set(m[1], l);
				else notes.push(`[${end.k}/${n}] ${l}`);
			}
			let t = null;
			try { t = JSON.parse(fs.readFileSync(end.tallyFile, "utf8")); } catch { /* no tally */ }
			if (t?.tally) { for (const key of Object.keys(total)) total[key] += t.tally[key] ?? 0; survivors.push(...(t.survivors ?? [])); }
			if (end.code !== 0 && end.code !== EXIT_TABLE_FAULT) { shardFailed = true; notes.push(`[${end.k}/${n}] seat-mutate: shard exited ${end.code ?? end.signal}${t ? "" : " with no tally"}`); }
		}
		const order = new Map(selected.map((p, i) => [p.n, i]));
		survivors.sort((a, b) => order.get(a) - order.get(b));
		const shardOf = new Map(groups.flatMap((ids, i) => ids.map((id) => [id, i + 1])));
		const merged = [header, ...ctx.declared.map((d) => `DECLARED ${d}`), ...notes];
		let missing = 0;
		for (const p of selected) {
			if (pairLines.has(p.n)) merged.push(pairLines.get(p.n));
			else { missing++; merged.push(`MISSING ${p.n} ${p.name} — shard ${shardOf.get(p.n)}/${n} printed no line for it`); }
		}
		const result = resultLine(selected.length, total, survivors, { missing, shards: n, interrupted, dry });
		merged.push(result);
		if (ctx.outFile) fs.writeFileSync(ctx.outFile, `${merged.join("\n")}\n`);
		for (const l of merged.slice(1 + ctx.declared.length)) console.log(l);
		console.log(`seat-mutate: merged output ${ctx.outFile ?? "(console only)"}`);
		if (!ctx.keep) {
			for (const d of scratchDirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ } }
			try { fs.rmSync(partsDir, { recursive: true, force: true }); } catch { /* ignore */ }
		}

		if (total.anchorMiss || total.syntax) return EXIT_TABLE_FAULT;
		if (missing || shardFailed || interrupted) return EXIT_REFUSED;
		return 0;
	} finally {
		for (const sig of ["SIGINT", "SIGTERM"]) process.off(sig, sigHandlers[sig]);
	}
}

// ── entry point ──────────────────────────────────────────────────────────────────────────────────
/** Run a lane's pair table in the role the environment gives it; resolves to the process exit code. Never throws. */
export async function runMutations(table) {
	const env = process.env;
	const merged = mergeConfig(table.config);
	if (merged.error) { console.error(`seat-mutate: ${merged.error}`); return EXIT_REFUSED; }
	const config = merged.value;

	let selfPath;
	try { selfPath = fileURLToPath(table.self); } catch { console.error("seat-mutate: table.self is not a file:// URL"); return EXIT_REFUSED; }
	const repoRoot = repoRootOf(selfPath);
	if (!repoRoot) { console.error(`seat-mutate: ${selfPath} is not inside a git repository`); return EXIT_REFUSED; }

	const argvIds = process.argv.slice(2);
	const idProblem = validateIdsAndTable(argvIds, table.pairs);
	if (idProblem) { console.error(`seat-mutate: ${idProblem}`); return EXIT_REFUSED; }
	const selected = argvIds.length ? table.pairs.filter((p) => argvIds.includes(p.n)) : table.pairs;

	const tipArg = env[ENV_NAMES.TIP] || table.tip;
	const tipInfo = resolveTip(repoRoot, tipArg, table.branch);
	if (tipInfo.error) { console.error(`seat-mutate: ${tipInfo.error}`); return EXIT_REFUSED; }
	const myHash = tableHash(table.pairs, table.config ?? null);

	const isShard = Boolean(env[ENV_NAMES.SHARD]);
	if (isShard) {
		if (!env[ENV_NAMES.WORKTREE_LOCK]) { console.error(`seat-mutate: shard requires ${ENV_NAMES.WORKTREE_LOCK}`); return EXIT_REFUSED; }
		const parentTip = env[ENV_NAMES.TIP_COMMIT];
		const parentHash = env[ENV_NAMES.TABLE_HASH];
		if (parentTip && parentTip !== tipInfo.tipSha) { console.error(`seat-mutate: shard tip ${tipInfo.tipSha} differs from the parent's ${parentTip}`); return EXIT_REFUSED; }
		if (parentHash && parentHash !== myHash) { console.error(`seat-mutate: shard table ${myHash} differs from the parent's ${parentHash}`); return EXIT_REFUSED; }
		return runOneShard(selected, { env, repoRoot, lane: table.lane, tipSha: tipInfo.tipSha, mergeBase: tipInfo.mergeBase, config });
	}

	const rawShards = env[ENV_NAMES.SHARDS];
	if (rawShards !== undefined && (!Number.isSafeInteger(Number(rawShards)) || Number(rawShards) < 1)) {
		console.error(`seat-mutate: ${ENV_NAMES.SHARDS} must be a whole number of 1 or more (got ${JSON.stringify(rawShards)})`);
		return EXIT_REFUSED;
	}
	const rawStagger = env[ENV_NAMES.STAGGER_SECS];
	if (rawStagger !== undefined && (!Number.isFinite(Number(rawStagger)) || Number(rawStagger) < 0)) {
		console.error(`seat-mutate: ${ENV_NAMES.STAGGER_SECS} must be 0 or more (got ${JSON.stringify(rawStagger)})`);
		return EXIT_REFUSED;
	}
	const n = shardCount(env, selected, config);
	const staggerMs = (rawStagger !== undefined ? Number(rawStagger) : config.STAGGER_SECS_DEFAULT) * 1000;
	const keep = env[ENV_NAMES.KEEP] === "1";
	const dry = env[ENV_NAMES.DRY] === "1";

	const outFile = env[ENV_NAMES.OUT] || null;
	let lockPath = null;
	if (outFile) {
		lockPath = outFile + LOCK_SUFFIX;
		const lockResult = takeLock(lockPath);
		if (lockResult.error) { console.error(`seat-mutate: ${lockResult.error}`); return EXIT_REFUSED; }
	}
	try {
		return await runParent(selected, n, staggerMs, {
			selfPath,
			repoRoot,
			lane: table.lane,
			branch: table.branch,
			tipSha: tipInfo.tipSha,
			mergeBase: tipInfo.mergeBase,
			branchHead: tipInfo.branchHead,
			tableHash: myHash,
			declared: table.declared ?? [],
			config,
			outFile,
			keep,
			dry,
		});
	} finally {
		if (lockPath) try { fs.rmSync(lockPath, { force: true }); } catch { /* ignore */ }
	}
}
