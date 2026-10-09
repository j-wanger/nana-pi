/**
 * @module packages/nana-setup/lib/doctor.mjs
 * @purpose Judge one machine and return an ordered check list covering its setup surfaces and memory links.
 * @inputs a layout from resolveLayout; opts.projectDir (default process.cwd()), opts.releaseRepo and opts.runGit; NANA_SETUP_PLATFORM
 *  and PATH; `pi --version`; on disk — <claudeHome>/hooks, rules (incl. nana-personal.md), skills, settings.json,
 *  nana-memory/shared/MEMORY.md, projects/<key>/memory, <piHome>/settings.json and
 *  nana-pack.json and the objective file it names, cwd/.pi/nana-pack.json and pi's trust store,
 *  <piHome>/extensions/subagent/config.json,
 *  <piHome>/agents/reviewer.md, <piHome>/npm/node_modules/pi-subagents/package.json,
 *  <piHome>/mcp.json, <knowledgeHome>/index.db, <binDir>/pi-review, pi-worker, nana-land and nana-setup, the LaunchAgents plist;
 *  `node -p process.versions.node` and `launchctl print`
 * @outputs an array of { status, label, detail } rows; knowledgeIndexState(), memoryLinkState(); STATUS (ok | fail | note | warn); NODE_FLOOR
 *  ("22.18"); DESK_NODE_FLOOR ("22.19"); PI_SUBAGENTS_FLOOR ("0.75.0"); parsePlistValues(); nodeMeetsFloor(); versionAtLeast(); skillLinkState()
 *  { ok, detail }; projectFileState() { status, kind, detail }; packageSourceState(); firstOnPath()
 * @effects disk (reads only), process (spawns node, pi --version and launchctl to probe)
 * @errors none thrown — a missing, unparseable or wrong-kind piece becomes a fail row, a
 *  cwd-relative PI_CODING_AGENT_DIR a warn row, and a posix-only piece on win32 a note row
 */
// `doctor` — one ✓/✗ line per piece of the experience. This is the instrument a fresh machine
// is judged by: if every line is ✓, the Claude Code half, the user-scope pi config, the PATH
// entry and (when asked for) the desk service are actually in place.
import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import { DESK_LABEL, pkgRoot, platform, repoRoot } from "./paths.mjs";
import { projectMemoryDir, sharedLinkState } from "./project-key.mjs";
import { hasHook, desiredHooks, knowledgeHookHealthy, commandInvokes } from "./settings.mjs";
import { CLAUDE_RULES, CLAUDE_SKILLS, NEW_CLAUDE_SKILLS, DESK_SERVER, HOOKS, PACK_SKILLS_DIR, PI_REVIEW_BIN, PI_WORKER_BIN, NANA_LAND_BIN, NANA_SETUP_BIN, PI_INSTALL_HINT, remoteMatches, entryMatches, resolvePackageEntryPath, realpathSafe, REVIEWER_MARKER, firstBodyLine, lstatSafe, objectiveTarget, readPiPackConfig, registrationState, ruleSource, skillFiles } from "./steps.mjs";
import { spawnSync } from "node:child_process";
import { releaseStatus } from "../../nana-pack/lib/release-status.mjs";

const OK = "ok";
const FAIL = "fail";
const NOTE = "note";
const WARN = "warn";
const require = createRequire(import.meta.url);

function retiredSettingsCommands(settings) {
	const scripts = ["nana-objective.sh", "nana-adoption.sh", "nana-shared-memory.sh"];
	const findings = [];
	for (const [event, groups] of Object.entries(settings?.hooks ?? {})) {
		if (!Array.isArray(groups)) continue;
		for (const group of groups) {
			if (!Array.isArray(group?.hooks)) continue;
			for (const hook of group.hooks) {
				if (scripts.some((script) => commandInvokes(hook?.command, { interpreters: ["bash", "sh", "zsh"], script })))
					findings.push({ event, command: hook.command });
			}
		}
	}
	return findings;
}

export function knowledgeIndexState(dbPath, DatabaseSync = require("node:sqlite").DatabaseSync) {
	let db;
	try {
		db = new DatabaseSync(dbPath, { readOnly: true });
		const row = db.prepare("SELECT COUNT(*) AS n FROM docs").get();
		return { ok: Number.isInteger(row?.n), detail: `read-only docs count: ${row?.n}` };
	} catch (error) {
		return { ok: false, detail: `cannot open/query expected docs schema (${error.message})` };
	} finally { try { db?.close(); } catch { /* already closed */ } }
}

/**
 * ✓ means "this file is the repo's file". On posix that is a symlink and nothing else — a
 * byte-identical copy would silently stop tracking the repo at the next `git pull`, so it reads
 * as ✗ and `install` relinks it (backing the copy up first). Windows has no usable symlink, so
 * there a matching copy is the installed state.
 */
function linkOk(target, source) {
	try {
		const st = fs.lstatSync(target);
		if (st.isSymbolicLink()) {
			return fs.realpathSync(target) === fs.realpathSync(source);
		}
		return platform() === "win32" && st.isFile() && fs.readFileSync(target).equals(fs.readFileSync(source));
	} catch {
		return false;
	}
}

/**
 * A skill ✓ means Claude Code is reading the pack's own copy. posix: a symlink to that directory
 * and nothing else — a regular directory there is someone's own skill, not ours. win32 has no
 * usable symlink, so the installed state is a copy of every file the source ships.
 */
export function skillLinkState(target, source) {
	const st = lstatSafe(target);
	if (!st) return { ok: false, detail: `missing — run \`nana-setup install\`` };
	if (st.isSymbolicLink()) {
		let current = null;
		try { current = fs.realpathSync(target); } catch { /* dangling link */ }
		let canonicalSource = path.resolve(source);
		try { canonicalSource = fs.realpathSync(source); } catch { /* missing pack source */ }
		return current === canonicalSource ? { ok: true, detail: `-> ${source}` } : { ok: false, detail: `-> ${current ?? "(unreadable)"}, not ${source}` };
	}
	if (platform() !== "win32") return { ok: false, detail: `${st.isDirectory() ? "a directory" : "a regular file"} is there instead of a symlink to ${source} — move it, then re-run \`nana-setup install\`` };
	// win32: a copy of every file the source ships, byte for byte
	const missing = [];
	for (const f of skillFiles(source)) {
		try {
			if (!fs.readFileSync(path.join(target, f)).equals(fs.readFileSync(path.join(source, f)))) missing.push(f);
		} catch {
			missing.push(f);
		}
	}
	return missing.length ? { ok: false, detail: `copy is stale or incomplete (${missing.join(", ")}) — re-run \`nana-setup install\`` } : { ok: true, detail: `copied from ${source} (no symlink on this platform)` };
}

/**
 * objective.projectFile as the PRODUCER reads it (packages/nana-pack/lib/config.ts
 * fileNameOrDefault + lib/objective.ts isBareFileName — same rule, restated here because
 * nana-setup cannot import .ts on its Node floor): absent/null/false/"" or "OBJECTIVE.md"
 * is the default; any other bare filename is a rename; a separator, "." or ".." — or a
 * non-string — is REFUSED by the producer, which falls back to OBJECTIVE.md: ✗ here.
 */
export function projectFileState(v) {
	const DEFAULT = "OBJECTIVE.md";
	if (v === undefined || v === null || v === false || v === "" || v === DEFAULT)
		return { status: OK, kind: "default", detail: `per-repo ${DEFAULT} (the default name)` };
	const shown = JSON.stringify(v)?.slice(0, 120) ?? String(v);
	if (typeof v !== "string")
		return { status: FAIL, kind: "invalid", detail: `${shown} is invalid (expected a bare filename, null or false) — the producer ignores it and uses ${DEFAULT}` };
	if (v === "." || v === ".." || /[\\/]/.test(v))
		return { status: FAIL, kind: "invalid", detail: `${shown} is invalid (a bare filename only: no path separator, not "." or "..") — the producer ignores it and uses ${DEFAULT}` };
	return { status: OK, kind: "renamed", detail: `${shown} (per-repo file renamed from ${DEFAULT})` };
}

/** The objective hook's CLI imports .ts with no flag: Node's type stripping, default from 22.18. */
export const NODE_FLOOR = "22.18";
/** Desk service contract (R-650): chosen 22.19 because the desk runtime is verified at this floor, 2026-10-06. */
export const DESK_NODE_FLOOR = "22.19";

function xmlUnescape(value) {
	return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

export function parsePlistValues(contents) {
	const values = [...contents.matchAll(/<key>([^<]+)<\/key>\s*<string>([\s\S]*?)<\/string>/g)];
	const get = (key) => {
		const found = values.find(([, name]) => name === key);
		return found ? xmlUnescape(found[2]) : null;
	};
	const argsBlock = /<key>ProgramArguments<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(contents)?.[1] ?? "";
	const programArguments = [...argsBlock.matchAll(/<string>([\s\S]*?)<\/string>/g)].map(([, value]) => xmlUnescape(value));
	return { server: programArguments[1] ?? null, programArguments, path: get("PATH") };
}
export function nodeMeetsFloor(version, floor = NODE_FLOOR) {
	const [a, b] = String(version).replace(/^v/, "").split(".").map(Number);
	const [fa, fb] = floor.split(".").map(Number);
	return a > fa || (a === fa && b >= fb);
}

/**
 * pi-subagents floor this pack's seed (R-361) and gate analysis were verified against
 * (architecture-ruling.md, 2026-10-04, §1e): 0.75.0's own CHANGELOG — "Background subagents work
 * on Pi 1.0.0 again. In 0.74.0 they failed to start" — makes it a HARD coupling for pi 1.0
 * adoption, not a nice-to-have. `chosen`: pinned rather than floating, because pi-subagents
 * shipped two behaviour-changing breaks in one month before this version.
 */
export const PI_SUBAGENTS_FLOOR = "0.75.0";
/** chosen: cap diagnostic output while still naming common broken links, 2026-10-07. */
export const MEMORY_LINK_ISSUE_LIMIT = 30;

function memoryFiles(root) {
	const found = [];
	const visit = (dir) => {
		let entries;
		try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
		for (const entry of entries) {
			const file = path.join(dir, entry.name);
			if (entry.isDirectory()) visit(file);
			else if (entry.isFile() && entry.name.endsWith(".md")) found.push(file);
		}
	};
	visit(root);
	return found;
}

function memoryName(file) {
	try {
		const text = fs.readFileSync(file, "utf8");
		const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
		return match?.[1].match(/^name:[ \t]*(.*?)[ \t]*$/m)?.[1]?.replace(/^['"]|['"]$/g, "") || null;
	} catch { return null; }
}

export function memoryLinkState(sharedRoot, projectRoot) {
	const tiers = { shared: new Map(), project: new Map() };
	for (const [tier, root] of [["shared", sharedRoot], ["project", projectRoot]]) {
		for (const file of memoryFiles(root)) {
			const name = memoryName(file);
			if (!name) continue;
			const list = tiers[tier].get(name) ?? [];
			list.push(file);
			tiers[tier].set(name, list);
		}
	}
	const issues = [];
	let danglingCount = 0;
	for (const [tier, root] of [["shared", sharedRoot], ["project", projectRoot]]) {
		for (const file of memoryFiles(root)) {
			let text;
			try { text = fs.readFileSync(file, "utf8"); } catch { continue; }
			for (const [, name] of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
				const shared = tiers.shared.get(name) ?? [];
				const local = tiers.project.get(name) ?? [];
				let issue = null;
				if (shared.length > 1 || (tier === "project" && local.length > 1)) issue = `ambiguous name [[${name}]] in ${shared.length > 1 ? "shared" : "project"} tier`;
				else if (tier === "shared" && !shared.length && local.length) issue = `shared-to-project link [[${name}]]`;
				else if (tier === "shared" && !shared.length || tier === "project" && !shared.length && !local.length) danglingCount++;
				if (issue) issues.push(`${path.basename(file)}: ${issue}`);
			}
		}
	}
	return { ok: issues.length === 0, issues, danglingCount };
}

/** True for a parsed JSON value usable as a config object — never null, an array, or a scalar.
 *  JSON.parse succeeds for all of those; reading a key off one must never throw (astra r1 MUST 2). */
export function isPlainObject(v) {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Describes a non-object JSON value for an error message. */
export function kindOf(v) {
	if (v === null) return "null";
	if (Array.isArray(v)) return "an array";
	return typeof v;
}

/** Three-segment numeric version compare (no pre-release handling — the versions this floor
 *  check reads, an npm package.json's own `version`, never carry one). Non-numeric input (an
 *  absent or malformed version) reads as NOT meeting any floor. */
export function versionAtLeast(version, floor) {
	const parts = (v) =>
		String(v)
			.replace(/^v/, "")
			.split(".")
			.slice(0, 3)
			.map(Number);
	const [a1, a2, a3 = 0] = parts(version);
	const [b1, b2, b3 = 0] = parts(floor);
	if (![a1, a2, a3].every(Number.isFinite)) return false;
	if (a1 !== b1) return a1 > b1;
	if (a2 !== b2) return a2 > b2;
	return a3 >= b3;
}

export function packageSourceState(layout, root = repoRoot) {
	let settings;
	try { settings = JSON.parse(fs.readFileSync(layout.piSettings, "utf8")); } catch { return null; }
	const entries = Array.isArray(settings?.packages) ? settings.packages.flatMap((entry) => typeof entry === "string" ? [entry] : entry && typeof entry === "object" && typeof entry.source === "string" ? [entry.source] : []) : [];
	const checkout = realpathSafe(root);
	const foreign = [];
	let found = false;
	for (const entry of entries) {
		if (remoteMatches(entry)) {
			found = true;
			foreign.push(`${entry} resolves to pi's own clone under ${path.join(layout.piHome, "git")}`);
			continue;
		}
		if (!entryMatches(entry, layout.piHome, root)) continue;
		found = true;
		const resolved = resolvePackageEntryPath(entry, layout.piHome);
		if (resolved !== checkout && !resolved.startsWith(checkout + path.sep)) foreign.push(`${entry} resolves to ${resolved}`);
	}
	if (!found) return null;
	const managedRoot = realpathSafe(path.join(layout.piHome, "git"));
	const managed = checkout === managedRoot || checkout.startsWith(managedRoot + path.sep);
	return {
		status: foreign.length ? FAIL : OK,
		detail: foreign.length ? foreign.join("; ") : `${root}: the tree supplying hooks and rules`,
		remedy: managed
			? "this checkout is pi's managed copy: `git clone https://github.com/j-wanger/nana-pi`, run `nana-setup install` from the clone, then `pi remove <entry>`"
			: `\`pi remove <entry>\`, then re-run \`nana-setup install\` from ${root}`,
	};
}

export function firstOnPath(name, pathValue = process.env.PATH) {
	for (const dir of String(pathValue ?? "").split(path.delimiter).filter(Boolean)) {
		const candidate = path.join(dir, name);
		try { if (fs.statSync(candidate).isFile() && fs.accessSync(candidate, fs.constants.X_OK) === undefined) return candidate; } catch { /* skip missing or non-executable */ }
	}
	return null;
}

export function diagnose(layout, opts = {}) {
	const win = platform() === "win32";
	const checks = [];
	const add = (status, label, detail) => checks.push({ status, label, detail });

	// --- runtime floor: the `node` the objective hook will run (the one on this PATH) ---
	if (win) add(NOTE, "node for the objective hook", "skipped (win32)");
	else {
		const r = spawnSync("node", ["-p", "process.versions.node"], { encoding: "utf8" });
		const v = r.status === 0 ? r.stdout.trim() : null;
		add(
			v && nodeMeetsFloor(v) ? OK : FAIL,
			"node for the objective hook",
			v
				? `${v}${nodeMeetsFloor(v) ? "" : ` is older than ${NODE_FLOOR} — the objective hook prints OBJECTIVE UNAVAILABLE until Node is upgraded`} (needs ≥ ${NODE_FLOOR})`
				: `node not found on PATH (needs ≥ ${NODE_FLOOR})`,
		);
	}

	if (win) add(NOTE, "pi executable", "skipped (win32)");
	else {
		const probe = spawnSync("pi", ["--version"], { encoding: "utf8" });
		const version = probe.status === 0 ? (probe.stdout || "").trim().split(/\r?\n/)[0] : "";
		const valid = /^v?\d+\.\d+\.\d+/.test(version);
		const detail = valid ? version : `${probe.error ? "pi not found on PATH" : probe.status !== 0 ? `pi --version exited ${probe.status}` : "pi --version printed no version"} — install: ${PI_INSTALL_HINT}`;
		add(valid ? OK : layout.isRealHome ? FAIL : NOTE, "pi executable", detail);
	}

	// --- Claude Code half ---
	for (const h of HOOKS) {
		const src = path.join(pkgRoot, "claude", "hooks", h);
		if (win) add(NOTE, `hook ${h}`, "skipped (win32)");
		else add(linkOk(path.join(layout.hooksDir, h), src) ? OK : FAIL, `hook ${h}`, `-> ${src}`);
	}
	for (const rule of CLAUDE_RULES) {
		const src = ruleSource(rule);
		add(linkOk(path.join(layout.rulesDir, rule), src) ? OK : FAIL, `rule ${rule}`, `-> ${src}`);
	}
	// lstat, not existsSync: this file must be a REGULAR file. A symlink here aims the owner's
	// private text at another file — possibly one in this repo — and existsSync would call that ✓.
	const personal = path.join(layout.rulesDir, "nana-personal.md");
	const pst = lstatSafe(personal);
	add(
		pst?.isFile() ? OK : FAIL,
		"rule nana-personal.md",
		pst?.isFile()
			? "private — never in the repo"
			: pst?.isSymbolicLink()
				? "private rule is a symlink — replace with a regular file"
				: pst
					? "private rule is not a regular file — replace with a regular file"
					: "private rule is missing — run `nana-setup install` to seed it",
	);

	for (const name of CLAUDE_SKILLS) {
		if (win && NEW_CLAUDE_SKILLS.includes(name)) {
			add(NOTE, `skill ${name}`, "skipped (win32; pi-only)");
			continue;
		}
		const st = skillLinkState(path.join(layout.skillsDir, name), path.join(PACK_SKILLS_DIR, name));
		add(st.ok ? OK : FAIL, `skill ${name}`, st.detail);
	}
	const legacyFlags = ["enforce", "enforce-memory"].filter((name) => lstatSafe(path.join(layout.claudeHome, name)));
	add(legacyFlags.length ? WARN : OK, "legacy enforcement flags", legacyFlags.length ? `${legacyFlags.join(", ")} present — run nana-setup install to back up recognized empty flags` : "none present");
	const legacyScaffolders = ["py-init", "ts-init", "nana-init"].filter((name) => lstatSafe(path.join(layout.skillsDir, name)));
	add(legacyScaffolders.length ? WARN : OK, "legacy scaffolders", legacyScaffolders.length ? `${legacyScaffolders.join(", ")} present — run nana-setup install to back up recognized nana-dev-kit copies` : "none present");

	let settings = null;
	let parseError = null;
	try {
		const raw = fs.readFileSync(layout.claudeSettings, "utf8");
		settings = raw.trim() === "" ? {} : JSON.parse(raw);
	} catch (err) {
		parseError = err.code === "ENOENT" ? "missing" : `unreadable (${err.message})`;
	}
	for (const w of desiredHooks({ hooksDir: layout.hooksDir, repoRoot })) {
		const posixHook = ["nana-objective.mjs", "nana-adoption.mjs", "nana-shared-memory.mjs", "verifier-pipe.mjs"].includes(w.spec.script);
		if (win && (posixHook || w.label === "PreToolUse verifier pipe")) {
			add(NOTE, `settings ${w.label}`, `skipped (win32${w.label === "PreToolUse verifier pipe" ? "; Claude Code hooks unavailable" : ""})`);
			continue;
		}
		if (parseError) add(FAIL, `settings ${w.label}`, `settings.json ${parseError}`);
		else {
			const healthy = w.label === "UserPromptSubmit knowledge pull"
				? knowledgeHookHealthy(settings, repoRoot)
				: hasHook(settings, w.event, w.spec, w.matcher);
			add(healthy ? OK : FAIL, `settings ${w.label}`, w.label === "UserPromptSubmit knowledge pull" && !healthy
				? `${w.marker} — target is missing or does not resolve inside ${repoRoot}`
				: w.marker);
		}
	}
	for (const { event, command } of retiredSettingsCommands(settings))
		add(FAIL, `settings ${event} retired hook`, `retired bash hook still wired: ${command}`);

	// --- two-tier auto-memory ---
	const idx = path.join(layout.sharedMemoryDir, "MEMORY.md");
	add(fs.existsSync(idx) ? OK : FAIL, "shared memory index", idx);
	const project = path.resolve(opts.projectDir || process.cwd());
	const state = sharedLinkState(layout.projectsDir, project, layout.sharedMemoryDir);
	add(
		state === "linked" ? OK : NOTE,
		"this project's shared link",
		state === "linked" ? project : `${state} for ${project} — the SessionStart hook creates it on the next session`,
	);
	const memoryState = memoryLinkState(layout.sharedMemoryDir, projectMemoryDir(layout.projectsDir, project));
	const issues = memoryState.issues.length
		? `${memoryState.issues.slice(0, MEMORY_LINK_ISSUE_LIMIT).join("; ")}${memoryState.issues.length > MEMORY_LINK_ISSUE_LIMIT ? `; … ${memoryState.issues.length - MEMORY_LINK_ISSUE_LIMIT} more` : ""}`
		: memoryState.danglingCount ? "no cross-tier or ambiguous wiki links" : "all wiki links resolve within permitted memory tiers";
	const dangling = memoryState.danglingCount ? `· ${memoryState.danglingCount} links name memories not written yet` : "";
	add(memoryState.ok ? OK : WARN, "memory links", [issues, dangling].filter(Boolean).join(" "));

	// --- pi user config ---
	// Checked where the PACK reads it: layout.piHome is nana-pack's own active-agent-dir resolver
	// (lib/paths.mjs) unless a flag overrode it, so the default objective below resolves there too.
	add(NOTE, "pi agent dir", `${layout.piHome} (${layout.piHomeSource})`);
	if (layout.piHomeCwdRelative)
		add(WARN, "pi agent dir is cwd-specific", `PI_CODING_AGENT_DIR is relative, resolved against ${layout.piHomeCwdRelative}; pi started in another folder reads a different dir — pass --pi-home <absolute dir> or set an absolute value`);
	const stranded = path.join(layout.base, ".pi", "agent", "nana-pack.json");
	if (layout.piHomeSource === "PI_CODING_AGENT_DIR" && path.resolve(stranded) !== path.resolve(layout.piPackConfig) && fs.existsSync(stranded))
		add(NOTE, "pi default-dir nana-pack.json", `${stranded} exists but is NOT read (PI_CODING_AGENT_DIR is set)`);
	const cfg = readPiPackConfig(layout);
	add(cfg ? OK : FAIL, "pi nana-pack.json", cfg ? layout.piPackConfig : `missing or unparseable: ${layout.piPackConfig}`);
	const pf = projectFileState(cfg?.objective?.projectFile);
	add(pf.status, "pi objective.projectFile", pf.detail);
	const objective = objectiveTarget(layout, cfg);
	add(fs.existsSync(objective) ? OK : FAIL, "pi objective file", objective);
	const projectDir = path.resolve(opts.projectDir || process.cwd());
	if (fs.existsSync(path.join(projectDir, ".pi", "nana-pack.json"))) {
		let vouched = false;
		try {
			const { trustRecord } = require(path.join(repoRoot, "packages", "nana-pack", "lib", "objective.ts"));
			vouched = trustRecord(projectDir, layout.piHome).vouched;
		} catch { /* an unreadable trust store is not affirmative */ }
		add(vouched ? OK : WARN, "project trust", vouched ? `affirmative trust for ${projectDir}` : `project config has no affirmative trust — run nana-setup trust ${projectDir}`);
	}

	// --- pi-subagents: config floor and the reviewer shadow (R-360–R-371, architecture ruling
	// 2026-10-04, astra r1 2026-10-04) --- a third-party vendor extension nana-pi only consumes:
	// seed-once, doctor-verifies, never rewrite a hand edit — same policy as pi nana-pack.json
	// above. ABSENT and PRESENT-BUT-INVALID are two different remedies (astra r1 MUST 1):
	// `nana-setup install` only creates a file that does not exist yet — seedFile() never
	// rewrites one that is already there, however broken — so a present-but-invalid file is
	// told to repair itself by hand, never to run install.
	// astra r2 MUST 1a: name the config's own path AND the literal required values, not just
	// "the required values" — a reader should never have to open the seed to learn them.
	const subCfgRepairHint = (why) =>
		`${why} — repair ${layout.subagentConfig} by hand: set forceTopLevelAsync: true and maxSubagentDepth: 1 (asyncByDefault stays true unless you deliberately want it off), keeping any other settings you have there (\`nana-setup install\` will not touch this file)`;
	let subCfgRaw;
	let subCfgReadErr;
	try {
		subCfgRaw = fs.readFileSync(layout.subagentConfig, "utf8");
	} catch (err) {
		subCfgReadErr = err;
	}
	if (subCfgReadErr?.code === "ENOENT") {
		add(FAIL, "pi subagent config", `missing: ${layout.subagentConfig} — run \`nana-setup install\` to seed it`);
	} else if (subCfgReadErr) {
		add(FAIL, "pi subagent config", subCfgRepairHint(`${layout.subagentConfig} exists but could not be read (${subCfgReadErr.message})`));
	} else {
		let subCfg;
		let parseErr;
		try {
			subCfg = JSON.parse(subCfgRaw);
		} catch (err) {
			parseErr = err;
		}
		if (parseErr) {
			add(FAIL, "pi subagent config", subCfgRepairHint(`${layout.subagentConfig} is not valid JSON (${parseErr.message})`));
		} else if (!isPlainObject(subCfg)) {
			// JSON.parse succeeds for null, an array, or a scalar — none of those is a usable
			// config object, and reading a key off one must never throw (astra r1 MUST 2).
			add(FAIL, "pi subagent config", subCfgRepairHint(`${layout.subagentConfig} must hold a JSON object, not ${kindOf(subCfg)}`));
		} else if (subCfg.forceTopLevelAsync !== true) {
			add(FAIL, "pi subagent config", subCfgRepairHint(`forceTopLevelAsync is ${JSON.stringify(subCfg.forceTopLevelAsync)}, not true, in ${layout.subagentConfig} (this is the key that forces background at the top level)`));
		} else if (subCfg.maxSubagentDepth !== 1) {
			add(FAIL, "pi subagent config", subCfgRepairHint(`maxSubagentDepth is ${JSON.stringify(subCfg.maxSubagentDepth)}, not 1, in ${layout.subagentConfig} (this is the key that caps nested fan-out)`));
		} else if (subCfg.asyncByDefault === false) {
			// Explicitly false, not merely absent: upstream already defaults this to true, so a
			// user who set it false made a deliberate choice this reads as a warning, not a failure.
			add(WARN, "pi subagent config", `asyncByDefault is explicitly false in ${layout.subagentConfig} — a nested call with an omitted async will run foreground (ungated)`);
		} else {
			add(OK, "pi subagent config", layout.subagentConfig);
		}
	}

	let reviewerBody = null;
	try {
		reviewerBody = fs.readFileSync(layout.reviewerAgent, "utf8");
	} catch {
		/* absent */
	}
	if (reviewerBody === null) {
		add(FAIL, "pi reviewer agent", `missing: ${layout.reviewerAgent} — run \`nana-setup install\` to seed it`);
	} else if (firstBodyLine(reviewerBody) !== REVIEWER_MARKER) {
		// Present but unmarked: same ABSENT-vs-INVALID split as the subagent config above —
		// install will never overwrite a file that already exists, so the fix is a manual one.
		add(FAIL, "pi reviewer agent", `${layout.reviewerAgent} is missing the nana marker (${REVIEWER_MARKER}) as the first line of its body — repair it by hand (or delete it and run \`nana-setup install\` to get the full seed; install will not overwrite a file that already exists)`);
	} else {
		add(OK, "pi reviewer agent", layout.reviewerAgent);
	}

	let subagentsPkg = null;
	let subagentsErr = null;
	try {
		subagentsPkg = JSON.parse(fs.readFileSync(layout.piSubagentsPackage, "utf8"));
	} catch (err) {
		subagentsErr = err.code === "ENOENT" ? "not installed" : `unreadable (${err.message})`;
	}
	const subagentsFix = `pi install npm:pi-subagents@${PI_SUBAGENTS_FLOOR}`;
	if (subagentsErr || !versionAtLeast(subagentsPkg?.version, PI_SUBAGENTS_FLOOR)) {
		add(FAIL, "pi pi-subagents", `${subagentsErr ?? `version ${JSON.stringify(subagentsPkg?.version)} is older than ${PI_SUBAGENTS_FLOOR}`} — fix: \`${subagentsFix}\``);
	} else {
		add(OK, "pi pi-subagents", `version ${subagentsPkg.version} (>= ${PI_SUBAGENTS_FLOOR})`);
	}

	// Read-only: nana-setup never writes mcp.json (the seat edits it by hand, architecture
	// ruling §3). WHERE it exists, a server with no `exposure` key defaults to pi's own
	// `codemode` exposure the moment it connects, unless `autoEnableCodemode` is `false`. The
	// same shape defence as the subagent config above (astra r1 MUST 2): a parsed value that is
	// not a usable object — top-level, or `mcpServers` itself — is a failure row, never a crash.
	let mcpCfgRaw;
	let mcpCfgReadErr;
	try {
		mcpCfgRaw = fs.readFileSync(layout.mcpConfig, "utf8");
	} catch (err) {
		mcpCfgReadErr = err;
	}
	if (mcpCfgReadErr?.code === "ENOENT") {
		add(NOTE, "pi mcp.json", `not present: ${layout.mcpConfig}`);
	} else if (mcpCfgReadErr) {
		add(FAIL, "pi mcp.json", `${layout.mcpConfig} exists but could not be read (${mcpCfgReadErr.message})`);
	} else {
		let mcpCfg;
		let parseErr;
		try {
			mcpCfg = JSON.parse(mcpCfgRaw);
		} catch (err) {
			parseErr = err;
		}
		if (parseErr) {
			add(FAIL, "pi mcp.json", `${layout.mcpConfig} is not valid JSON (${parseErr.message})`);
		} else if (!isPlainObject(mcpCfg)) {
			add(FAIL, "pi mcp.json", `${layout.mcpConfig} must hold a JSON object, not ${kindOf(mcpCfg)}`);
		} else if (mcpCfg.mcpServers !== undefined && !isPlainObject(mcpCfg.mcpServers)) {
			add(FAIL, "pi mcp.json", `${layout.mcpConfig}'s mcpServers must be an object, not ${kindOf(mcpCfg.mcpServers)}`);
		} else {
			const servers = mcpCfg.mcpServers ?? {};
			// Checked BEFORE exposure (astra r2 SHOULD 3): pi's own validateMcpServerConfig
			// rejects a non-object server entry outright ("server \"<name>\" must be an
			// object") — reporting it ✓ merely because it has no exposure problem would be
			// misleading next to the shape diagnostics above.
			const invalidServers = Object.keys(servers).filter((name) => !isPlainObject(servers[name]));
			if (invalidServers.length) {
				add(
					FAIL,
					"pi mcp.json",
					`server${invalidServers.length === 1 ? "" : "s"} ${invalidServers.join(", ")} must be an object (pi itself rejects a non-object server config) in ${layout.mcpConfig}`,
				);
			} else {
				const codemodeDefault = mcpCfg.autoEnableCodemode !== false;
				const unexposed = Object.keys(servers).filter((name) => servers[name].exposure === undefined);
				if (codemodeDefault && unexposed.length) {
					add(
						WARN,
						"pi mcp.json",
						`server${unexposed.length === 1 ? "" : "s"} ${unexposed.join(", ")} ${unexposed.length === 1 ? "has" : "have"} no \`exposure\` key while top-level \`autoEnableCodemode\` is not false — codemode will auto-enable on connect; set "exposure" on the server or "autoEnableCodemode": false beside mcpServers`,
					);
				} else {
					add(OK, "pi mcp.json", layout.mcpConfig);
				}
			}
		}
	}

	// --- knowledge pull ---
	const db = path.join(layout.knowledgeHome, "index.db");
	const index = knowledgeIndexState(db);
	add(index.ok ? OK : FAIL, "knowledge index", `${db} — ${index.detail}`);

	// --- PATH ---
	if (win) {
		add(NOTE, "PATH pi-review", "skipped (win32)");
		add(NOTE, "PATH pi-worker", "skipped (win32)");
		add(NOTE, "PATH nana-land", "skipped (win32)");
		add(NOTE, "PATH nana-setup", "skipped (win32)");
	} else {
		const link = path.join(layout.binDir, "pi-review");
		const worker = path.join(layout.binDir, "pi-worker");
		add(linkOk(link, PI_REVIEW_BIN) ? OK : FAIL, "PATH pi-review", `${link} -> ${PI_REVIEW_BIN}`);
		add(linkOk(worker, PI_WORKER_BIN) ? OK : FAIL, "PATH pi-worker", `${worker} -> ${PI_WORKER_BIN}`);
		const landLink = path.join(layout.binDir, "nana-land");
		add(linkOk(landLink, NANA_LAND_BIN) ? OK : FAIL, "PATH nana-land", `${landLink} -> ${NANA_LAND_BIN}`);
		const setupLink = path.join(layout.binDir, "nana-setup");
		add(linkOk(setupLink, NANA_SETUP_BIN) ? OK : FAIL, "PATH nana-setup", `${setupLink} -> ${NANA_SETUP_BIN}`);
		const found = firstOnPath("pi-review");
		const matches = found !== null && realpathSafe(found) === realpathSafe(PI_REVIEW_BIN);
		const remedy = `add ${layout.binDir} to PATH — zsh: echo 'export PATH=\"$HOME/.local/bin:$PATH\"' >> ~/.zprofile, then open a new terminal`;
		const detail = matches ? `${found} resolves to this checkout` : `${found ? `pi-review resolves to ${found}` : "pi-review not found on PATH"}; ${remedy}`;
		add(matches ? OK : layout.isRealHome ? FAIL : NOTE, "PATH resolves pi-review", detail);
	}

	// --- pi package registration ---
	const reg = registrationState(layout);
	// An empty package list under --home is a note because install will not modify the live pi;
	// any partial registration is still a failure naming each missing manifest extension dir.
	add(
		reg.present ? OK : layout.isRealHome || reg.entries.length > 0 ? FAIL : NOTE,
		"pi packages",
		reg.present ? `all extension directories registered${reg.match ? ` as ${reg.match}` : ""}` : `${reg.missing.map((p) => path.relative(repoRoot, p)).join(", ")} not covered by string entries in ${layout.piSettings}`,
	);

	const source = packageSourceState(layout);
	if (source) add(source.status, "pi package source", source.status === OK ? source.detail : `${source.detail} — remedy: ${source.remedy}`);

	// --- desk service (opt-in) ---
	if (platform() !== "darwin") add(NOTE, "desk service", `skipped (${platform()})`);
	else if (!fs.existsSync(layout.plistPath)) add(NOTE, "desk service", "not installed (opt-in: `install --desk`)");
	else {
		let parsed;
		try { parsed = parsePlistValues(fs.readFileSync(layout.plistPath, "utf8")); } catch { parsed = null; }
		const node = parsed?.programArguments?.[0];
		let nodeVersion = null;
		if (node && fs.existsSync(node)) {
			const probe = spawnSync(node, ["-p", "process.versions.node"], { encoding: "utf8" });
			if (probe.status === 0) nodeVersion = probe.stdout.trim();
		}
		const print = layout.isRealHome ? spawnSync("launchctl", ["print", `gui/${process.getuid()}/${DESK_LABEL}`], { encoding: "utf8" }) : null;
		const running = print?.status === 0 && /state\s*=\s*running/.test(`${print.stdout || ""}\n${print.stderr || ""}`);
		const valid = parsed?.server === DESK_SERVER && node && nodeVersion && versionAtLeast(nodeVersion, DESK_NODE_FLOOR);
		const ok = Boolean(running && valid);
		add(!layout.isRealHome ? NOTE : ok ? OK : FAIL, "desk service", `${layout.plistPath}: ${!running ? "launchctl does not report state = running" : "running"}; ${!node ? "ProgramArguments[0] is missing" : !fs.existsSync(node) ? `node executable is missing: ${node}` : !nodeVersion ? `could not read Node version from ${node}` : !versionAtLeast(nodeVersion, DESK_NODE_FLOOR) ? `Node ${nodeVersion} is older than ${DESK_NODE_FLOOR}` : `Node ${nodeVersion}`}`);
	}

	let releaseLine;
	try { releaseLine = releaseStatus({ repo: opts.releaseRepo ?? repoRoot, ...(opts.runGit ? { runGit: opts.runGit } : {}) }).line; }
	catch (error) { releaseLine = `release status unavailable (${error?.message ?? "unknown error"})`; }
	add(NOTE, "release status", releaseLine);

	return checks;
}

export const STATUS = { OK, FAIL, NOTE, WARN };
