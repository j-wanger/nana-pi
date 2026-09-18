// The install steps. Each one reports {label, status, detail}; none of them prompts, and none
// of them overwrites something the owner wrote by hand (see fsops.mjs).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CREATED, SKIPPED, UNCHANGED, UPDATED, ensureDir, linkFile, seedFile, writeIfChanged } from "./fsops.mjs";
import { DESK_LABEL, pkgRoot, platform, repoRoot } from "./paths.mjs";
import { desiredHooks, mergeHooks, serialize, validateShape } from "./settings.mjs";

export class SetupError extends Error {}

export const HOOKS = ["nana-objective.sh", "nana-shared-memory.sh", "context-size-check.sh"];
export const PI_REVIEW_BIN = path.join(repoRoot, "packages", "nana-pack", "bin", "pi-review.mjs");
export const KNOWLEDGE_CLI = path.join(repoRoot, "packages", "nana-knowledge", "bin", "nana-knowledge.ts");
export const DESK_SERVER = path.join(repoRoot, "apps", "desk", "server.mjs");

const win = () => platform() === "win32";
const skip = (label) => ({ label, status: SKIPPED, detail: "skipped (win32)" });

/* ---------------------------------------------------------------- claude hooks and rules */

export function stepHooks(layout, o) {
	if (win()) return HOOKS.map((h) => skip(`hook ${h}`));
	return HOOKS.map((h) => {
		const r = linkFile(path.join(layout.hooksDir, h), path.join(pkgRoot, "claude", "hooks", h), o);
		return { label: `hook ${h}`, ...r };
	});
}

export function stepRules(layout, o) {
	const out = [];
	const soul = linkFile(path.join(layout.rulesDir, "nana-soul.md"), path.join(pkgRoot, "claude", "rules", "nana-soul.md"), {
		...o,
		// Windows needs a privilege for symlinks; a copy still gets the identity in place.
		copyInstead: win(),
	});
	out.push({ label: "rule nana-soul.md", ...soul });
	// PRIVATE, and never in the repo: created from the example only when absent, then never
	// touched again — not even to compare it.
	const personal = seedFile(
		path.join(layout.rulesDir, "nana-personal.md"),
		fs.readFileSync(path.join(pkgRoot, "claude", "rules", "nana-personal.example.md"), "utf8"),
		o,
	);
	out.push({ label: "rule nana-personal.md (private)", ...personal });
	return out;
}

/* -------------------------------------------------------------------- claude settings.json */

/**
 * Preflight. Runs BEFORE any file moves, and everything that can legitimately stop the install
 * is decided here: the file must parse, and its `hooks` must have a shape the merge can extend
 * ({"hooks":"disabled"} parses but would throw mid-install — sol r1). Returns the parsed object
 * plus a SNAPSHOT of the bytes and mode, which the write step uses to detect a concurrent edit.
 */
export function readClaudeSettings(layout) {
	let raw = null;
	let mode = 0o600; // what Claude Code itself writes
	try {
		raw = fs.readFileSync(layout.claudeSettings, "utf8");
		mode = fs.statSync(layout.claudeSettings).mode & 0o777;
	} catch (err) {
		if (err.code !== "ENOENT") {
			throw new SetupError(`${layout.claudeSettings} cannot be read (${err.message}).\nNothing was changed.`);
		}
		return { settings: {}, snapshot: { raw: null, mode } };
	}
	const abort = (why) =>
		new SetupError(
			`${layout.claudeSettings} ${why}.\n` +
				"Nothing was changed. Fix or move that file, then re-run — the installer will not rewrite settings it cannot understand.",
		);
	if (raw.trim() === "") return { settings: {}, snapshot: { raw, mode } };
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		throw abort(`is not valid JSON (${err.message})`);
	}
	const bad = validateShape(parsed);
	if (bad) throw abort(`has a shape this installer will not edit (${bad})`);
	return { settings: parsed, snapshot: { raw, mode } };
}

/**
 * Hold an exclusive lock for the whole read → validate → write-temp → re-compare → rename
 * sequence. `O_EXCL` creation IS the lock, and that is the entire protocol: if the lock exists,
 * this run aborts and says how to clear it.
 *
 * There is deliberately NO stale-lock reclamation (sol r3). Reclaiming under the same lock is a
 * race — two runs can both judge a lock stale, and the loser's `unlink` deletes the winner's
 * fresh lock, putting both inside the critical section. Doing it safely needs a second lock, and
 * a human-run one-shot installer does not earn one: a leftover lock is a crash artifact, and the
 * message below tells the human exactly how to remove it.
 */
export function withSettingsLock(file, fn) {
	const lock = path.join(path.dirname(file), ".settings.json.nana-setup.lock");
	fs.mkdirSync(path.dirname(file), { recursive: true });
	let fd;
	try {
		fd = fs.openSync(lock, "wx");
	} catch (err) {
		if (err.code !== "EEXIST") throw err;
		let held = null;
		try {
			held = JSON.parse(fs.readFileSync(lock, "utf8"));
		} catch {
			/* unreadable or corrupt */
		}
		const age = Number.isFinite(held?.at) ? `${Math.round((Date.now() - held.at) / 1000)}s ago` : "at an unrecorded time";
		throw new SetupError(
			`${file} is locked by another nana-setup run.\n` +
				`  lock:    ${lock}\n` +
				`  written: ${held?.pid ? `pid ${held.pid}` : "an unrecorded pid"}, ${age}\n` +
				"Nothing was written. If no nana-setup is running (this lock is left over from an interrupted run), clear it:\n" +
				`  rm ${lock}`,
		);
	}
	fs.writeSync(fd, JSON.stringify({ pid: process.pid, at: Date.now() }));
	fs.closeSync(fd);
	try {
		return fn();
	} finally {
		try {
			// only ever remove a lock that is still ours
			if (JSON.parse(fs.readFileSync(lock, "utf8")).pid === process.pid) fs.rmSync(lock, { force: true });
		} catch {
			/* someone else's lock, or already gone */
		}
	}
}

/**
 * Write settings.json by temp file + rename, with the mode preserved, and re-compare the target
 * AFTER the temp file is written and fsynced — immediately before the rename, so the window in
 * which a foreign write can be lost is the rename itself rather than the whole serialize+write.
 * `afterTempWrite` is a test seam: the tests use it to change the file at exactly that point and
 * prove the compare sits after the temp write.
 */
export function writeSettingsAtomic(file, contents, snapshot, { afterTempWrite } = {}) {
	const read = () => {
		try {
			return fs.readFileSync(file, "utf8");
		} catch (err) {
			if (err.code === "ENOENT") return null;
			throw new SetupError(`${file} cannot be re-read before writing (${err.message}). Nothing was changed.`);
		}
	};
	const changed = () =>
		new SetupError(
			`${file} changed on disk while nana-setup was running — another process (an editor, or a live Claude Code session) wrote to it.\n` +
				"Nothing was written to it, and the install stopped here rather than overwriting that change. Re-run when nothing else is writing.",
		);
	if (read() !== snapshot.raw) throw changed();
	const dir = path.dirname(file);
	fs.mkdirSync(dir, { recursive: true });
	const tmp = path.join(dir, `.settings.json.nana-setup.${process.pid}.tmp`);
	const clean = () => {
		try {
			fs.rmSync(tmp, { force: true });
		} catch {
			/* nothing to clean */
		}
	};
	try {
		const fd = fs.openSync(tmp, "w", snapshot.mode);
		try {
			fs.writeFileSync(fd, contents);
			fs.fsyncSync(fd);
		} finally {
			fs.closeSync(fd);
		}
		fs.chmodSync(tmp, snapshot.mode);
		if (afterTempWrite) afterTempWrite(tmp);
		// LAST look before the swap. An external writer that ignores our lock can still land in
		// the microseconds between here and the rename — that is the POSIX floor (README).
		if (read() !== snapshot.raw) throw changed();
		fs.renameSync(tmp, file);
	} catch (err) {
		clean();
		throw err;
	}
}

export function stepSettings(layout, o, state) {
	const wanted = desiredHooks({ hooksDir: layout.hooksDir, repoRoot });
	// win32: the three bash hooks have no interpreter there, and `VAR=1 cmd` is not a thing in
	// cmd.exe — so drop those entries and the env prefix on the one that survives.
	const applicable = win()
		? wanted
				.filter((w) => !w.entry.command.startsWith("bash "))
				.map((w) => ({ ...w, entry: { ...w.entry, command: w.entry.command.replace(/^NODE_NO_WARNINGS=1 /, "") } }))
		: wanted;
	const live = new Set(applicable.map((w) => w.label));
	const report = (added) =>
		wanted.map((w) => ({
			label: `settings ${w.label}`,
			status: !live.has(w.label) ? SKIPPED : added.includes(w.label) ? CREATED : UNCHANGED,
			detail: !live.has(w.label) ? "skipped (win32: bash hook)" : added.includes(w.label) ? "added" : "already wired",
		}));
	if (o.dryRun) return report(mergeHooks(structuredClone(state.settings), applicable).added);
	return withSettingsLock(layout.claudeSettings, () => {
		// Re-read INSIDE the lock: the preflight decided this install could run at all, this
		// decides what is written, and the two must agree or nothing is written.
		const fresh = readClaudeSettings(layout);
		if (fresh.snapshot.raw !== state.snapshot.raw) {
			throw new SetupError(
				`${layout.claudeSettings} changed on disk since nana-setup started.\n` +
					"Nothing was written to it. Re-run when nothing else is writing.",
			);
		}
		const { added } = mergeHooks(fresh.settings, applicable);
		if (added.length) writeSettingsAtomic(layout.claudeSettings, serialize(fresh.settings), fresh.snapshot, o);
		return report(added);
	});
}

/* ------------------------------------------------------------------------- shared memory */

export function stepSharedMemory(layout, o) {
	const dir = ensureDir(layout.sharedMemoryDir, o);
	const header = fs.readFileSync(path.join(pkgRoot, "claude", "memory", "MEMORY.seed.md"), "utf8");
	const idx = seedFile(path.join(layout.sharedMemoryDir, "MEMORY.md"), header, o);
	return [
		{ label: "shared memory dir", ...dir },
		{ label: "shared memory MEMORY.md", ...idx },
		{
			label: "per-project `shared` link",
			status: UNCHANGED,
			// No installer step by design: the SessionStart hook creates it for whatever
			// project the session is in, so a brand-new repo heals itself.
			detail: "maintained by the nana-shared-memory.sh hook, per project",
		},
	];
}

/* ------------------------------------------------------------------------- pi user config */

/**
 * Resolve nana-pack.json's `objective.path` the way the pack does: `~/` expands, a relative path
 * resolves against the pi home and NEVER against cwd, null means the default file. Shared with
 * `doctor` so the two can never disagree about which file the objective lives in.
 */
export function objectiveTarget(layout, cfg) {
	const p = cfg?.objective?.path;
	if (!p) return layout.piObjective;
	if (p === "~") return layout.base;
	if (p.startsWith("~/")) return path.join(layout.base, p.slice(2));
	return path.isAbsolute(p) ? p : path.join(layout.piHome, p);
}

export function stepPiConfig(layout, o) {
	const seedText = fs.readFileSync(path.join(pkgRoot, "pi", "nana-pack.seed.json"), "utf8");
	const pack = seedFile(layout.piPackConfig, seedText, o);
	const out = [{ label: "pi nana-pack.json", ...pack }];
	// The starter objective file belongs to the SEED. When nana-pack.json already exists and
	// points its objective at a real repo's OBJECTIVE.md, creating ~/.pi/agent/nana-objective.md
	// would be a file nothing reads (sol r1 / dry-run noise on this machine).
	const cfg = pack.status === CREATED ? JSON.parse(seedText) : readPiPackConfig(layout);
	const target = objectiveTarget(layout, cfg);
	if (pack.status === CREATED || path.resolve(target) === path.resolve(layout.piObjective)) {
		out.push({ label: "pi nana-objective.md", ...seedFile(layout.piObjective, fs.readFileSync(path.join(pkgRoot, "pi", "nana-objective.seed.md"), "utf8"), o) });
	} else {
		out.push({ label: "pi nana-objective.md", status: UNCHANGED, detail: `not needed — objective.path already points at ${target}` });
	}
	return out;
}

/** What nana-pack.json says about the objective — reported by `doctor`, never rewritten. */
export function readPiPackConfig(layout) {
	try {
		return JSON.parse(fs.readFileSync(layout.piPackConfig, "utf8"));
	} catch {
		return null;
	}
}

/* ------------------------------------------------------------------------ knowledge index */

export function stepKnowledge(layout, o) {
	const db = path.join(layout.knowledgeHome, "index.db");
	if (fs.existsSync(db)) {
		return [{ label: "knowledge index", status: UNCHANGED, detail: `${db} exists — refresh with \`nana-knowledge build\`` }];
	}
	if (o.dryRun) return [{ label: "knowledge index", status: CREATED, detail: "would build" }];
	fs.mkdirSync(layout.knowledgeHome, { recursive: true });
	const r = spawnSync(process.execPath, [KNOWLEDGE_CLI, "build"], {
		env: { ...process.env, NANA_KNOWLEDGE_HOME: layout.knowledgeHome, NODE_NO_WARNINGS: "1" },
		encoding: "utf8",
		timeout: 10 * 60_000,
	});
	if (r.status !== 0 || !fs.existsSync(db)) {
		const why = (r.stderr || r.error?.message || `exit ${r.status}`).trim().split("\n").slice(-2).join(" ");
		return [{ label: "knowledge index", status: SKIPPED, detail: `build failed, the pull just stays quiet: ${why}` }];
	}
	const rows = (r.stdout || "").trim().split("\n").filter((l) => l.includes("files ")).pop();
	return [{ label: "knowledge index", status: CREATED, detail: (rows || "built").trim() }];
}

/* ------------------------------------------------------------------------------ PATH bin */

export function stepPath(layout, o) {
	if (win()) return [skip("PATH pi-review")];
	const r = linkFile(path.join(layout.binDir, "pi-review"), PI_REVIEW_BIN, o);
	const out = [{ label: "PATH pi-review", ...r }];
	const onPath = (process.env.PATH || "").split(path.delimiter).includes(layout.binDir);
	if (!onPath) out.push({ label: "PATH check", status: SKIPPED, detail: `${layout.binDir} is not on this shell's PATH — add it` });
	return out;
}

/* ------------------------------------------------------------------------- desk service */

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderPlist(vars) {
	const tmpl = fs.readFileSync(path.join(pkgRoot, "launchd", "com.nana.pi-desk.plist.tmpl"), "utf8");
	return tmpl.replace(/\{\{(\w+)\}\}/g, (m, k) => {
		if (!(k in vars)) throw new SetupError(`plist template placeholder {{${k}}} has no value`);
		return xml(vars[k]);
	});
}

export function stepDesk(layout, o) {
	if (platform() !== "darwin") return [{ label: "desk service", status: SKIPPED, detail: `skipped (${platform()}: launchd is macOS-only)` }];
	if (!fs.existsSync(DESK_SERVER)) return [{ label: "desk service", status: SKIPPED, detail: `no ${DESK_SERVER}` }];
	const contents = renderPlist({
		LABEL: DESK_LABEL,
		NODE: process.execPath,
		SERVER: DESK_SERVER,
		WORKDIR: repoRoot,
		PATH: process.env.PATH || "",
		LOG: layout.deskLog,
	});
	const w = writeIfChanged(layout.plistPath, contents, o);
	const out = [{ label: "desk plist", ...w }];
	if (o.dryRun) return out;
	if (!layout.isRealHome) {
		out.push({ label: "desk launchctl", status: SKIPPED, detail: "not loaded (--home override in play)" });
		return out;
	}
	const uid = process.getuid();
	const loaded = spawnSync("launchctl", ["print", `gui/${uid}/${DESK_LABEL}`], { encoding: "utf8" }).status === 0;
	if (loaded && w.status === UNCHANGED) {
		out.push({ label: "desk launchctl", status: UNCHANGED, detail: "already loaded" });
		return out;
	}
	if (loaded) spawnSync("launchctl", ["bootout", `gui/${uid}/${DESK_LABEL}`], { encoding: "utf8" });
	const r = spawnSync("launchctl", ["bootstrap", `gui/${uid}`, layout.plistPath], { encoding: "utf8" });
	out.push(
		r.status === 0
			? { label: "desk launchctl", status: loaded ? UPDATED : CREATED, detail: loaded ? "reloaded" : "bootstrapped" }
			: { label: "desk launchctl", status: SKIPPED, detail: `bootstrap failed: ${(r.stderr || "").trim() || `exit ${r.status}`}` },
	);
	return out;
}

/* ------------------------------------------------------------- pi package registration */

/** realpath, falling back to the nearest existing ancestor so a non-existent path still resolves. */
function realpathSafe(p) {
	let cur = path.resolve(p);
	const tail = [];
	for (;;) {
		try {
			return path.join(fs.realpathSync(cur), ...tail);
		} catch {
			const parent = path.dirname(cur);
			if (parent === cur) return path.resolve(p);
			tail.unshift(path.basename(cur));
			cur = parent;
		}
	}
}

const gitDirCache = new Map();
/**
 * The repository's IDENTITY: its common git dir, which a linked worktree shares with the main
 * checkout (`git rev-parse --git-common-dir` — verified: from ~/nana-pi-wt/setup it reports
 * /Users/jwang/nana-pi/.git, the same value the main clone reports). Null when the path is not in
 * a repo, or git is unavailable.
 */
export function gitCommonDir(dir) {
	const key = path.resolve(dir);
	if (gitDirCache.has(key)) return gitDirCache.get(key);
	let out = null;
	for (const args of [["--path-format=absolute", "--git-common-dir"], ["--git-common-dir"]]) {
		const r = spawnSync("git", ["-C", key, "rev-parse", ...args], { encoding: "utf8" });
		if (r.status === 0 && r.stdout.trim()) {
			out = realpathSafe(path.resolve(key, r.stdout.trim()));
			break;
		}
	}
	gitDirCache.set(key, out);
	return out;
}

/**
 * Does one pi `packages` entry mean "this install root is already registered"?
 *
 * Identity, not string equality (sol r1). `~` is expanded, a relative path resolves against the
 * pi home (pi's own rule: relative entries resolve against the settings file — docs/packages.md,
 * pi 0.84.4), both sides are realpath'd, and an entry that lands inside THIS repository counts —
 * including through another checkout of it, because a git worktree and its main clone share one
 * common git dir. Getting this wrong adds a second, root-level package entry on top of the
 * per-package ones and loads every extension twice.
 */
const REMOTE_HOST = "github.com";
const REMOTE_PATH = "j-wanger/nana-pi";

/**
 * Is this entry a REMOTE spelling of nana-pi? Host and path are both anchored (sol r2:
 * `https://evil.example/archive/j-wanger/nana-pi` used to count). The accepted spellings are
 * pi's own (docs/packages.md, pi 0.84.4): `git:` shorthand, `git@host:path`, and the protocol
 * URLs, with an optional `.git` suffix and an optional pinned ref (`@ref`; `#ref` is accepted
 * too, though pi documents `@`). `github:owner/repo` is accepted as a convenience spelling —
 * pi's docs do not list it.
 */
export function remoteMatches(entry) {
	const strip = (p) => {
		let out = p.replace(/^\/+/, "").replace(/\/+$/, "");
		const seg = out.split("/");
		seg[seg.length - 1] = seg[seg.length - 1].replace(/[@#][^@#/]*$/, "");
		out = seg.join("/");
		return out.replace(/\.git$/, "");
	};
	const hit = (host, p) => host.toLowerCase() === REMOTE_HOST && strip(p) === REMOTE_PATH;
	let s = entry.trim();
	if (s.startsWith("github:")) return strip(s.slice("github:".length)) === REMOTE_PATH;
	// `git:` is pi's shorthand marker; `git://` is a real scheme and must survive to the URL branch
	if (s.startsWith("git:") && !s.startsWith("git://")) s = s.slice("git:".length);
	const scp = /^(?:[^@/\s]+@)?([^:/\s]+):(.+)$/.exec(s);
	if (scp && !/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return hit(scp[1], scp[2]);
	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
		// pi's remote schemes only (docs/packages.md lists http:// as well; we do not accept it —
		// a false negative just runs the idempotent `pi install`, a false positive suppresses it).
		if (!/^(https|ssh|git|git\+ssh):\/\//i.test(s)) return false;
		try {
			// a trailing `@ref`/`#ref` is pi's pin, not part of the URL (an `@` inside the
			// authority is followed by more path, so this anchored strip cannot eat it)
			const u = new URL(s.replace(/[@#][^@#/]*$/, ""));
			return hit(u.hostname, u.pathname);
		} catch {
			return false;
		}
	}
	// bare shorthand: host/owner/repo
	const bare = /^([^/\s]+)\/(.+)$/.exec(s);
	return Boolean(bare) && hit(bare[1], bare[2]);
}

export function entryMatches(entry, piHome, root) {
	if (typeof entry !== "string" || entry.startsWith("npm:")) return false;
	if (/^(git:|github:|[a-z][a-z0-9+.-]*:\/\/)/i.test(entry) || /^[^@/\s]+@[^:/\s]+:/.test(entry)) return remoteMatches(entry);
	const expanded = entry === "~" ? os.homedir() : entry.startsWith("~/") ? path.join(os.homedir(), entry.slice(2)) : entry;
	const abs = realpathSafe(path.resolve(piHome, expanded));
	const r = realpathSafe(root);
	if (abs === r || abs.startsWith(r + path.sep)) return true;
	if (!fs.existsSync(abs)) return false;
	const mine = gitCommonDir(r);
	return Boolean(mine) && gitCommonDir(fs.statSync(abs).isDirectory() ? abs : path.dirname(abs)) === mine;
}

export function registrationState(layout) {
	let settings;
	try {
		settings = JSON.parse(fs.readFileSync(layout.piSettings, "utf8"));
	} catch {
		return { present: false, entries: [], match: null, note: "no pi settings.json" };
	}
	const entries = Array.isArray(settings.packages) ? settings.packages.filter((e) => typeof e === "string") : [];
	const match = entries.find((e) => entryMatches(e, layout.piHome, repoRoot));
	return { present: Boolean(match), entries, match: match ?? null };
}

export function stepPiRegister(layout, o) {
	const state = registrationState(layout);
	if (state.present) return [{ label: "pi packages", status: UNCHANGED, detail: `registered as ${state.match}` }];
	if (o.dryRun) return [{ label: "pi packages", status: CREATED, detail: `would run \`pi install ${repoRoot}\`` }];
	if (!layout.isRealHome) {
		return [{ label: "pi packages", status: SKIPPED, detail: "not registered (--home override in play)" }];
	}
	const probe = spawnSync("pi", ["--version"], { encoding: "utf8" });
	if (probe.error) return [{ label: "pi packages", status: SKIPPED, detail: "pi is not on PATH — `npm i -g @earendil-works/pi-coding-agent`, then re-run" }];
	// Verified 2026-09-18 against pi 0.84.4: `pi install <path>` is idempotent (a second run
	// leaves `packages` untouched), so the guard above is about NOT adding a second, broader
	// entry when the packages are already registered individually.
	const r = spawnSync("pi", ["install", repoRoot], { encoding: "utf8", env: { ...process.env, PI_CODING_AGENT_DIR: layout.piHome } });
	return r.status === 0
		? [{ label: "pi packages", status: CREATED, detail: `pi install ${repoRoot}` }]
		: [{ label: "pi packages", status: SKIPPED, detail: `pi install failed: ${(r.stderr || "").trim().split("\n").pop() || `exit ${r.status}`}` }];
}

/* ------------------------------------------------------------------------------- install */

export function install(layout, opts = {}) {
	// `afterTempWrite` is the settings write's test seam; the CLI never produces it.
	const o = { dryRun: Boolean(opts.dryRun), afterTempWrite: opts.afterTempWrite };
	// Pre-flight: the one thing that can abort. Parse before any write.
	const settingsState = readClaudeSettings(layout);
	const results = [];
	results.push(...stepHooks(layout, o));
	results.push(...stepRules(layout, o));
	results.push(...stepSettings(layout, o, settingsState));
	results.push(...stepSharedMemory(layout, o));
	results.push(...stepPiConfig(layout, o));
	results.push(...stepKnowledge(layout, o));
	results.push(...stepPath(layout, o));
	if (opts.desk) results.push(...stepDesk(layout, o));
	results.push(...stepPiRegister(layout, o));
	return results;
}
