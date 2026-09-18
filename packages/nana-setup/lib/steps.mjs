// The install steps. Each one reports {label, status, detail}; none of them prompts, and none
// of them overwrites something the owner wrote by hand (see fsops.mjs).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { CREATED, SKIPPED, UNCHANGED, UPDATED, ensureDir, linkFile, seedFile, writeIfChanged } from "./fsops.mjs";
import { DESK_LABEL, pkgRoot, platform, repoRoot } from "./paths.mjs";
import { desiredHooks, mergeHooks, serialize } from "./settings.mjs";

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

/** Parse first, so a malformed settings.json aborts BEFORE anything on disk has moved. */
export function readClaudeSettings(layout) {
	let raw;
	try {
		raw = fs.readFileSync(layout.claudeSettings, "utf8");
	} catch {
		return {};
	}
	if (raw.trim() === "") return {};
	try {
		const parsed = JSON.parse(raw);
		if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new Error("top level is not an object");
		}
		return parsed;
	} catch (err) {
		throw new SetupError(
			`${layout.claudeSettings} is not valid JSON (${err.message}).\n` +
				"Nothing was changed. Fix or move that file, then re-run — the installer will not rewrite settings it cannot parse.",
		);
	}
}

export function stepSettings(layout, o, settings) {
	const wanted = desiredHooks({ hooksDir: layout.hooksDir, repoRoot });
	// win32: the three bash hooks have no interpreter there, and `VAR=1 cmd` is not a thing in
	// cmd.exe — so drop those entries and the env prefix on the one that survives.
	const applicable = win()
		? wanted
				.filter((w) => !w.entry.command.startsWith("bash "))
				.map((w) => ({ ...w, entry: { ...w.entry, command: w.entry.command.replace(/^NODE_NO_WARNINGS=1 /, "") } }))
		: wanted;
	const { added } = mergeHooks(settings, applicable);
	const live = new Set(applicable.map((w) => w.label));
	const out = [];
	for (const w of wanted) {
		const isSkipped = !live.has(w.label);
		out.push({
			label: `settings ${w.label}`,
			status: isSkipped ? SKIPPED : added.includes(w.label) ? CREATED : UNCHANGED,
			detail: isSkipped ? "skipped (win32: bash hook)" : added.includes(w.label) ? "added" : "already wired",
		});
	}
	if (added.length && !o.dryRun) {
		fs.mkdirSync(path.dirname(layout.claudeSettings), { recursive: true });
		fs.writeFileSync(layout.claudeSettings, serialize(settings));
	}
	return out;
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

export function stepPiConfig(layout, o) {
	const pack = seedFile(layout.piPackConfig, fs.readFileSync(path.join(pkgRoot, "pi", "nana-pack.seed.json"), "utf8"), o);
	const objective = seedFile(layout.piObjective, fs.readFileSync(path.join(pkgRoot, "pi", "nana-objective.seed.md"), "utf8"), o);
	return [
		{ label: "pi nana-pack.json", ...pack },
		{ label: "pi nana-objective.md", ...objective },
	];
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

/**
 * Does one pi `packages` entry mean "this install root is registered"?
 *
 * Verified against pi 0.84.4 (`docs/packages.md`): a relative local path resolves against the
 * settings file it appears in, and package identity for a local entry is its resolved absolute
 * path. An entry UNDER the root counts too — the packages are registered one by one on this
 * machine (`../../nana-pi/packages/nana-pack`), and adding a second, root-level entry on top of
 * that would load every extension twice.
 */
export function entryMatches(entry, piHome, root) {
	if (typeof entry !== "string" || entry.startsWith("npm:")) return false;
	if (/^(git:|https?:|ssh:|git@)/.test(entry)) return /(^|[/:])j-wanger\/nana-pi(\.git)?(@|$)/.test(entry.replace(/^git:/, ""));
	const abs = path.resolve(piHome, entry);
	const r = path.resolve(root);
	return abs === r || abs.startsWith(r + path.sep);
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
	const o = { dryRun: Boolean(opts.dryRun) };
	// Pre-flight: the one thing that can abort. Parse before any write.
	const settings = readClaudeSettings(layout);
	const results = [];
	results.push(...stepHooks(layout, o));
	results.push(...stepRules(layout, o));
	results.push(...stepSettings(layout, o, settings));
	results.push(...stepSharedMemory(layout, o));
	results.push(...stepPiConfig(layout, o));
	results.push(...stepKnowledge(layout, o));
	results.push(...stepPath(layout, o));
	if (opts.desk) results.push(...stepDesk(layout, o));
	results.push(...stepPiRegister(layout, o));
	return results;
}
