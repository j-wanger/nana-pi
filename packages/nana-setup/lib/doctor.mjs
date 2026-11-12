/**
 * @module packages/nana-setup/lib/doctor.mjs
 * @purpose Judge one machine and return an ordered check list covering its setup surfaces.
 * @inputs a layout from resolveLayout; opts.projectDir (default process.cwd()), opts.releaseRepo and opts.runGit; NANA_SETUP_PLATFORM
 *  and PATH; `pi --version`; on disk — <claudeHome>/hooks, rules (incl. nana-personal.md and nana-rulings.md), skills, settings.json,
 *  the settings lock, nana-memory/shared/MEMORY.md, projects/<key>/memory, <piHome>/settings.json and
 *  nana-pack.json and the objective file it names, <piHome>/nana-rulings.md, cwd/.pi/nana-pack.json and pi's trust store,
 *  pi's npm package.json, <piHome>/mcp.json, <knowledgeHome>/index.db and <knowledgeHome>/sources.json, and the PATH_COMMANDS entries under <binDir>, including nana-writing;
 *  `node -p process.versions.node`
 * @outputs an array of { status, label, detail, installLabel? } rows, including pi's `pi dependencies` row, linked-folder legacy rows that name every present path to move by hand, and a safe place and error-kind repair
 *  for invalid nana-pack JSON, a FAIL `pi objective.path` row (naming the value and the default file) only when
 *  that value is present and neither a string nor null, and a win32-only note row naming the Claude Code hooks' CLAUDE_CODE_EXEC_FLOOR;
 *  knowledgeIndexState(), knowledgeSourcesState(); STATUS (ok | fail | note | warn); NODE_FLOOR
 *  ("22.18"); PI_NODE_FLOOR ("22.19"); versionAtLeast(); skillLinkState()
 *  { ok, detail }; projectFileState() { status, kind, detail }; packageSourceState(); firstOnPath(); winShimState()
 * @effects disk (reads only), process (spawns node and a bounded pi --version process tree to probe)
 * @errors none thrown — a missing, unparseable or wrong-kind piece becomes a fail row, a
 *  cwd-relative PI_CODING_AGENT_DIR a warn row, and a posix-only piece on win32 a note row
 */
// `doctor` — one ✓/✗ line per piece of the experience. This is the instrument a fresh machine
// is judged by: if every line is ✓, the Claude Code half, the user-scope pi config, the PATH
// entry are actually in place.
import * as fs from "node:fs";
import { configFailureDetail, jsonErrorPlace, jsonParseFailure, MANUAL_JSON_ADVICE, parseJsonBytes, parseJsonText } from "../../nana-pack/lib/json-text.mjs";
import { frozenNotice, readSourcesFile } from "../../nana-knowledge/lib/sources-file.mjs";
import { codeSpan } from "../../nana-pack/lib/display.mjs";
import { realPath } from "../../nana-pack/lib/real-path.mjs";
import * as path from "node:path";
import { createRequire } from "node:module";
import { pkgRoot, platform, repoRoot } from "./paths.mjs";
import { sharedLinkState } from "./project-key.mjs";
import { retiredHookCommands, commandInvokes, entryInvokes, retiredKnowledgeHook, retiredMemoryHook, CLAUDE_CODE_EXEC_FLOOR } from "./settings.mjs";
import { CLAUDE_RULES, CLAUDE_SKILLS, PACK_SKILLS_DIR, PI_REVIEW_BIN, PI_INSTALL_HINT, PATH_COMMANDS, KNOWLEDGE_CLI, directoryAncestorsAreSafe, remoteMatches, entryMatches, resolvePackageEntryPath, realpathSafe, linkedSkillFolder, lstatSafe, objectiveTarget, ownSkillCopy, packageCoverage, ruleSource, skillFiles } from "./steps.mjs";
import { hookLinkRows, hookSettingsRows } from "./hook-health.mjs";
import { lockHolder, removalCommands, settingsLockPath } from "./settings-lock.mjs";
import { RULINGS_FILE, SEAT_GUIDE_FILE } from "../../nana-pack/lib/rulings-config.mjs";
import { spawnSync } from "node:child_process";
import { releaseStatus } from "../../nana-pack/lib/release-status.mjs";
import { findOnPath, findPi } from "../../nana-pack/lib/win-command.mjs";
import { PI_LAUNCH_LIMITS_MS } from "./steps.mjs";
import { boundedSpawnSync } from "./bounded-spawn.mjs";
import { piInvocation } from "./pi-invocation.mjs";
import { renderWinShims, WIN_SHIM_SUFFIXES } from "./win-shims.mjs";
import { linkOk } from "./stale-copies.mjs";
import { piPackagesState } from "./pi-dependencies.mjs";

const OK = "ok";
const FAIL = "fail";
const NOTE = "note";
const WARN = "warn";
const require = createRequire(import.meta.url);

function retiredRuntimeCommands(settings) {
	const findings = [];
	for (const [event, groups] of Object.entries(settings?.hooks ?? {})) {
		if (!Array.isArray(groups)) continue;
		for (const group of groups) {
			if (!Array.isArray(group?.hooks)) continue;
			for (const hook of group.hooks) {
				if ((event === "UserPromptSubmit" && (entryInvokes(hook, retiredKnowledgeHook().spec, "win32") || commandInvokes(hook?.command, retiredKnowledgeHook().spec))) ||
					(event === 'SessionEnd' && (entryInvokes(hook, retiredMemoryHook().spec, 'win32') || commandInvokes(hook?.command, retiredMemoryHook().spec))) ||
					(event === "PreToolUse" && (entryInvokes(hook, { interpreters: ["node"], script: "verifier-pipe.mjs" }, "win32") || commandInvokes(hook?.command, { interpreters: ["node"], script: "verifier-pipe.mjs" }))))
					findings.push({ event, command: [hook.command, ...(Array.isArray(hook.args) ? hook.args : [])].join(" ") });
			}
		}
	}
	return findings;
}

export function knowledgeIndexState(dbPath, DatabaseSync = require("node:sqlite").DatabaseSync, now = Date.now()) {
	let db;
	try {
		db = new DatabaseSync(dbPath, { readOnly: true });
		const row = db.prepare("SELECT COUNT(*) AS n FROM docs").get();
		// Restate status's built_at read and one-decimal hour form: nana-setup cannot import nana-knowledge's .ts db module below its Node floor.
		let age = "no build time recorded";
		try {
			const built = Number(db.prepare("SELECT value FROM meta WHERE key = 'built_at'").get()?.value);
			if (Number.isFinite(built) && built > 0 && built <= now) age = `built ${((now - built) / 3600000).toFixed(1)}h ago`;
		} catch { /* older or docs-only index has no meta table */ }
		return { ok: Number.isInteger(row?.n), detail: `read-only docs count: ${row?.n}; ${age}` };
	} catch (error) {
		return { ok: false, detail: `cannot open/query expected docs schema (${error.code ?? "UNKNOWN"})` };
	} finally { try { db?.close(); } catch { /* already closed */ } }
}

export function knowledgeSourcesState(file) {
	const result = readSourcesFile(file);
	if (result.status === "absent") return { status: NOTE, detail: `${file} — not present; the next build seeds it` };
	if (result.status === "parsed") return { status: OK, detail: `${file} — parses` };
	const commandPath = KNOWLEDGE_CLI.includes(" ") ? `"${KNOWLEDGE_CLI}"` : KNOWLEDGE_CLI;
	const rescan = `node ${commandPath} build`;
	return { status: FAIL, detail: `${file} — ${frozenNotice(result.problem)} Rescan with \`${rescan}\`.` };
}

/**
 * A skill ✓ means Claude Code is reading the pack's own copy. posix: a symlink to that directory
 * and nothing else — a regular directory there is someone's own skill, not ours. win32 has no
 * usable symlink, so the installed state is a copy of every file the source ships.
 */
export function skillLinkState(target, source) {
	const st = lstatSafe(target);
	if (!st) return { ok: false, detail: `missing — run \`nana-setup install\`` };
	if (platform() === "win32" && st.isSymbolicLink())
		return { ok: false, detail: `a symlink or junction is there instead of nana-setup's copy of ${source} — move it, then re-run \`nana-setup install\`` };
	if (st.isSymbolicLink()) {
		let current = null;
		try { current = realPath(target, { mustExist: true }); } catch { /* dangling link */ }
		let canonicalSource = path.resolve(source);
		try { canonicalSource = realPath(source, { mustExist: true }); } catch { /* missing pack source */ }
		return current === canonicalSource ? { ok: true, detail: `-> ${source}` } : { ok: false, detail: `-> ${current ?? "(unreadable)"}, not ${source}` };
	}
	if (platform() !== "win32") return { ok: false, detail: `${st.isDirectory() ? "a directory" : "a regular file"} is there instead of a symlink to ${source} — move it, then re-run \`nana-setup install\`` };
	if (!st.isDirectory())
		return { ok: false, detail: `a regular file is there instead of nana-setup's copy of ${source} — move it, then re-run \`nana-setup install\`` };
	// win32: a directory nana-setup did not make is refused, same as posix (R-1423)
	if (st.isDirectory() && !ownSkillCopy(target, source))
		return { ok: false, detail: `a directory is there instead of nana-setup's copy of ${source} — move it, then re-run \`nana-setup install\`` };
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
/** measured: installed pi 1.4.0 package.json engines.node >=22.19.0, read 2026-11-09; R-650. */
export const PI_NODE_FLOOR = "22.19";

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
	try { settings = parseJsonText(fs.readFileSync(layout.piSettings, "utf8")); } catch { return null; }
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

/** Both Windows launcher files must be regular, byte-equal renderings for this checkout. */
export function winShimState(name, source, binDir) {
	const rendered = renderWinShims(source, binDir);
	const files = [
		[path.join(binDir, `${name}${WIN_SHIM_SUFFIXES.sh}`), rendered.sh],
		[path.join(binDir, `${name}${WIN_SHIM_SUFFIXES.cmd}`), rendered.cmd],
	];
	const wrong = files.filter(([file, wanted]) => {
		try {
			const stat = fs.lstatSync(file);
			return stat.isSymbolicLink() || !stat.isFile() || !fs.readFileSync(file).equals(Buffer.from(wanted));
		} catch { return true; }
	}).map(([file]) => file);
	return wrong.length
		? { ok: false, detail: `missing or stale: ${wrong.join(", ")} — run \`nana-setup install\`` }
		: { ok: true, detail: `sh and .cmd match this checkout in ${binDir}` };
}

function privateJsonFailure(file, error) {
	const place = jsonErrorPlace(error);
	const where = place ? ` at line ${place.line}, column ${place.column}` : "";
	return `${file} unparseable${where}. ${MANUAL_JSON_ADVICE}`;
}

function piPackConfigState(file) {
	let bytes;
	try {
		bytes = fs.readFileSync(file);
	} catch {
		return { cfg: null, parseDetail: null };
	}
	try {
		return { cfg: parseJsonBytes(bytes), parseDetail: null };
	} catch (error) {
		return { cfg: null, parseDetail: configFailureDetail(file, jsonParseFailure(error)) };
	}
}

export function diagnose(layout, opts = {}) {
	const win = platform() === "win32";
	const checks = [];
	const add = (status, label, detail, installLabel) => checks.push({ status, label, detail, ...(installLabel === undefined ? {} : { installLabel }) });

	// --- runtime floor: the `node` the objective and rm guard hooks will run (on this PATH) ---
	// R-1057: win32 runs this too now, on whatever `node` doctor's own PATH finds — which may
	// differ from the one Claude Code's exec-form hooks resolve (declared limit, CHANGE.md §3).
	{
		const r = spawnSync("node", ["-p", "process.versions.node"], { encoding: "utf8" });
		const v = r.status === 0 ? r.stdout.trim() : null;
		add(
			v && versionAtLeast(v, NODE_FLOOR) ? OK : FAIL,
			"node for the objective hook",
			v
				? `${v}${versionAtLeast(v, NODE_FLOOR) ? "" : ` is older than ${NODE_FLOOR} — the objective hook prints OBJECTIVE UNAVAILABLE and the rm guard gives no decision until Node is upgraded`} (needs ≥ ${NODE_FLOOR})`
				: `node not found on PATH — the objective hook is unavailable and the rm guard gives no decision (needs ≥ ${NODE_FLOOR})`,
		);
	}

	{
		const piOpts = opts.pi ?? {};
		const piPlatform = piOpts.platform ?? platform;
		const piEnv = piOpts.env ?? process.env;
		const piSpawn = piOpts.spawn ?? boundedSpawnSync;
		const piLimits = piOpts.limits ?? PI_LAUNCH_LIMITS_MS;
		const piExists = piOpts.exists;
		const piIsFile = piOpts.isFile;
		const piReadText = piOpts.readText;
		const isWin = (typeof piPlatform === "function" ? piPlatform() : piPlatform) === "win32";
		const executable = isWin ? findPi({ env: piEnv, cwd: process.cwd(), exists: piExists }) : "pi";
		let probe;
		let refusal;
		let invocation;
		if (!executable) probe = { error: new Error("pi not found on PATH") };
		else {
			invocation = piInvocation(executable, ["--version"], { win32: isWin, env: piEnv, cwd: process.cwd(), exists: piExists, isFile: piIsFile, readText: piReadText });
			refusal = invocation.refused;
			if (!refusal) probe = piSpawn(invocation.command, invocation.args, { ...invocation.options, encoding: "utf8", timeout: piLimits.version });
		}
		const version = !refusal && probe?.status === 0 ? (probe.stdout || "").split(/\r?\n/)[0] : "";
		const valid = /^v?\d+\.\d+\.\d+/.test(version);
		const detail = valid ? version : refusal ? `pi launch refused: ${refusal} — install: ${PI_INSTALL_HINT}` : probe?.error?.code === "ETIMEDOUT" ? `pi --version gave no answer within ${piLimits.version / 1_000} s and was stopped — install: ${PI_INSTALL_HINT}` : probe?.error ? `pi not found or could not start — install: ${PI_INSTALL_HINT}` : probe?.status !== 0 ? `pi --version exited ${probe?.status} — install: ${PI_INSTALL_HINT}` : `pi --version printed no version — install: ${PI_INSTALL_HINT}`;
		add(valid ? OK : layout.isRealHome ? FAIL : NOTE, "pi executable", detail);
		const packages = piPackagesState({
			win32: isWin,
			env: piEnv,
			piEntry: isWin && invocation?.command === process.execPath ? invocation.args?.[0] : null,
			versionAtLeast,
			firstOnPath,
			...(piReadText ? { readText: piReadText } : {}),
		});
		add(packages.status, "pi dependencies", packages.detail);
	}

	// --- Claude Code half ---
	for (const row of hookLinkRows(layout)) add(row.ok ? OK : FAIL, row.label, row.detail);
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
		"rule nana-personal.md (private)",
	);

	// A linked Claude home or skills folder is the SAME refusal stepSkills already makes for every
	// name (`linkedSkillFolder` reuses its own test): a ✗ row then points at the folder to move
	// aside, matching the session-start line, rather than the generic "run nana-setup install"
	// text that run would refuse anyway (plan-attack.md amendments 1–2).
	const linkedFolder = linkedSkillFolder(layout);
	for (const name of CLAUDE_SKILLS) {
		const st = skillLinkState(path.join(layout.skillsDir, name), path.join(PACK_SKILLS_DIR, name));
		const detail = !st.ok && linkedFolder
			? `install will not add skills under the linked folder ${codeSpan(linkedFolder) ?? linkedFolder} — move it aside, then run \`nana-setup install\``
			: st.detail;
		add(st.ok ? OK : FAIL, `skill ${name}`, detail);
	}
	const legacyByHand = (names, linked, itemRoot) => {
		const folder = codeSpan(linked) ?? linked;
		const items = names.map((name) => codeSpan(path.join(itemRoot, name)) ?? path.join(itemRoot, name));
		return `${names.join(", ")} present — install will not back these up through the linked folder ${folder}; move ${items.join(", ")} out of the way by hand`;
	};
	const legacyFlags = ["enforce", "enforce-memory"].filter((name) => lstatSafe(path.join(layout.claudeHome, name)));
	const flagsRefused = legacyFlags.length && !directoryAncestorsAreSafe(layout.claudeHome, layout.claudeHome, true);
	add(legacyFlags.length ? WARN : OK, "legacy enforcement flags", !legacyFlags.length ? "none present" : flagsRefused ? legacyByHand(legacyFlags, layout.claudeHome, layout.claudeHome) : `${legacyFlags.join(", ")} present — run nana-setup install to back up recognized empty flags`);
	const legacyScaffolders = ["py-init", "ts-init", "nana-init"].filter((name) => lstatSafe(path.join(layout.skillsDir, name)));
	add(legacyScaffolders.length ? WARN : OK, "legacy scaffolders", !legacyScaffolders.length ? "none present" : linkedFolder ? legacyByHand(legacyScaffolders, linkedFolder, layout.skillsDir) : `${legacyScaffolders.join(", ")} present — run nana-setup install to back up recognized nana-dev-kit copies`);

	let settings = null;
	let parseError = null;
	let settingsText;
	try {
		settingsText = fs.readFileSync(layout.claudeSettings, "utf8");
	} catch (error) {
		parseError = error.code === "ENOENT" ? "missing" : `unreadable (${error.code ?? "UNKNOWN"})`;
	}
	if (settingsText !== undefined) {
		try {
			settings = settingsText.trim() === "" ? {} : JSON.parse(settingsText);
		} catch (error) {
			parseError = privateJsonFailure(layout.claudeSettings, error);
		}
	}
	// Active settings rows check presence and, on win32, checkout targets.
	// Retired knowledge wiring is reported separately below, never as a missing active hook.
	for (const row of hookSettingsRows(layout, settings, parseError)) add(row.ok ? OK : FAIL, row.label, row.detail);
	// R-1060: stated, not checked — a probe of `claude --version` brings back the Windows launch
	// problem pi-cmd-launch solved for pi, which is not worth it for a floor the owner already exceeds.
	if (win) add(NOTE, "Claude Code hooks floor", `need Claude Code ${CLAUDE_CODE_EXEC_FLOOR} or later (not checked here — \`claude --version\` is never run)`);
	const settingsLock = settingsLockPath(layout.claudeSettings);
	const settingsLockStat = lstatSafe(settingsLock);
	if (!settingsLockStat) add(OK, "settings lock", "no leftover lock");
	else {
		const commands = removalCommands(settingsLock, platform());
		const fix = commands.length === 1
			? commands[0].command
			: `in ${commands[0].shell}: ${commands[0].command} — or in ${commands[1].shell}: ${commands[1].command}`;
		add(FAIL, "settings lock", `${settingsLock} is left over (${lockHolder(settingsLock)}) — install will not run until it is removed; if no nana-setup is running, remove it: ${fix}`);
	}
	for (const { event, command } of [...retiredHookCommands(settings), ...retiredRuntimeCommands(settings)])
		add(FAIL, `settings ${event} retired hook`, /nana-knowledge\.ts|verifier-pipe\.mjs/.test(command) || event === 'SessionEnd'
			? `retired hook still wired: ${command} — run \`nana-setup install\``
			: `retired bash hook still wired: ${command}`);

	// --- two-tier auto-memory ---
	const idx = path.join(layout.sharedMemoryDir, "MEMORY.md");
	add(fs.existsSync(idx) ? OK : FAIL, "shared memory index", idx, "shared memory MEMORY.md");
	const project = path.resolve(opts.projectDir || process.cwd());
	const state = sharedLinkState(layout.projectsDir, project, layout.sharedMemoryDir);
	add(
		state === "linked" ? OK : NOTE,
		"this project's shared link",
		state === "linked" ? project : `${state} for ${project} — the SessionStart hook creates it on the next session`,
	);

	// --- pi user config ---
	// Checked where the PACK reads it: layout.piHome is nana-pack's own active-agent-dir resolver
	// (lib/paths.mjs) unless a flag overrode it, so the default objective below resolves there too.
	add(NOTE, "pi agent dir", `${layout.piHome} (${layout.piHomeSource})`);
	if (layout.piHomeCwdRelative)
		add(WARN, "pi agent dir is cwd-specific", `PI_CODING_AGENT_DIR is relative, resolved against ${layout.piHomeCwdRelative}; pi started in another folder reads a different dir — pass --pi-home <absolute dir> or set an absolute value`);
	const stranded = path.join(layout.base, ".pi", "agent", "nana-pack.json");
	if (layout.piHomeSource === "PI_CODING_AGENT_DIR" && path.resolve(stranded) !== path.resolve(layout.piPackConfig) && fs.existsSync(stranded))
		add(NOTE, "pi default-dir nana-pack.json", `${stranded} exists but is NOT read (PI_CODING_AGENT_DIR is set)`);
	const configState = piPackConfigState(layout.piPackConfig);
	const cfg = configState.cfg;
	add(cfg ? OK : FAIL, "pi nana-pack.json", cfg ? layout.piPackConfig : configState.parseDetail ?? `missing or unparseable: ${layout.piPackConfig}`);
	const pf = projectFileState(cfg?.objective?.projectFile);
	add(pf.status, "pi objective.projectFile", pf.detail);
	const rawObjectivePath = cfg?.objective?.path;
	if (rawObjectivePath !== undefined && rawObjectivePath !== null && typeof rawObjectivePath !== "string") {
		const shown = JSON.stringify(rawObjectivePath)?.slice(0, 120) ?? String(rawObjectivePath);
		add(FAIL, "pi objective.path", `${shown} is invalid (expected a path string or null) — the producer ignores it and uses ${layout.piObjective}; set objective.path in ${layout.piPackConfig} to a path string, or null for the default`);
	}
	const objective = objectiveTarget(layout, cfg);
	add(fs.existsSync(objective) ? OK : FAIL, "pi objective file", objective, "pi nana-objective.md");
	add(linkOk(layout.piRulings, ruleSource(RULINGS_FILE)) ? OK : FAIL, "pi nana-rulings.md", `-> ${ruleSource(RULINGS_FILE)}`);
	const seatGuideSource = ruleSource(SEAT_GUIDE_FILE);
	add(linkOk(layout.piSeatGuide, seatGuideSource) ? OK : FAIL, "pi nana-seat.md", `-> ${seatGuideSource}`);
	const projectDir = path.resolve(opts.projectDir || process.cwd());
	if (fs.existsSync(path.join(projectDir, ".pi", "nana-pack.json"))) {
		let vouched = false;
		try {
			const { trustRecord } = require(path.join(repoRoot, "packages", "nana-pack", "lib", "objective.ts"));
			vouched = trustRecord(projectDir, layout.piHome).vouched;
		} catch { /* an unreadable trust store is not affirmative */ }
		add(vouched ? OK : WARN, "project trust", vouched ? `affirmative trust for ${projectDir}` : `project config has no affirmative trust — run nana-setup trust ${projectDir}`);
	}

	// Read-only: MCP config is secret; never echo a parser's file-byte excerpt.
	let mcpText;
	try {
		mcpText = fs.readFileSync(layout.mcpConfig, "utf8");
	} catch (error) {
		add(error.code === "ENOENT" ? NOTE : FAIL, "pi mcp.json", error.code === "ENOENT"
			? `not present: ${layout.mcpConfig}` : `${layout.mcpConfig} unreadable (${error.code ?? "UNKNOWN"})`);
	}
	if (mcpText !== undefined) try {
		const mcpCfg = parseJsonText(mcpText);
		const servers = mcpCfg?.mcpServers;
		if (!mcpCfg || typeof mcpCfg !== "object" || Array.isArray(mcpCfg) ||
			(servers !== undefined && (!servers || typeof servers !== "object" || Array.isArray(servers)))) {
			add(FAIL, "pi mcp.json", `${layout.mcpConfig} must hold an object with mcpServers absent or an object`);
		} else {
			const unexposed = Object.keys(servers ?? {}).filter((name) => servers[name]?.exposure === undefined);
			add(mcpCfg.autoEnableCodemode !== false && unexposed.length ? WARN : OK, "pi mcp.json",
				mcpCfg.autoEnableCodemode !== false && unexposed.length
					? `server${unexposed.length === 1 ? "" : "s"} ${unexposed.join(", ")} ${unexposed.length === 1 ? "has" : "have"} no \`exposure\` key while top-level \`autoEnableCodemode\` is not false — codemode will auto-enable on connect; set "exposure" on the server or "autoEnableCodemode": false beside mcpServers`
					: layout.mcpConfig);
		}
	} catch (error) {
		add(FAIL, "pi mcp.json", privateJsonFailure(layout.mcpConfig, error));
	}

	// --- knowledge pull ---
	const db = path.join(layout.knowledgeHome, "index.db");
	const index = knowledgeIndexState(db);
	add(index.ok ? OK : FAIL, "knowledge index", `${db} — ${index.detail}`);
	const sources = knowledgeSourcesState(path.join(layout.knowledgeHome, "sources.json"));
	add(sources.status, "knowledge sources", sources.detail);

	// --- PATH ---
	if (win) {
		for (const [name, source] of PATH_COMMANDS) {
			const state = winShimState(name, source, layout.binDir);
			add(state.ok ? OK : FAIL, `PATH ${name}`, state.detail);
		}
		const found = findOnPath("pi-review");
		const expected = path.win32.resolve(path.join(layout.binDir, `pi-review${WIN_SHIM_SUFFIXES.cmd}`));
		const matches = found !== null && path.win32.resolve(found).toLowerCase() === expected.toLowerCase();
		// Same split findOnPath uses internally: trim each entry and strip a surrounding quote pair.
		const entries = String(process.env.PATH ?? "").split(";").map((dir) => dir.trim().replace(/^"|"$/g, "")).filter(Boolean);
		const binAt = entries.findIndex((dir) => path.win32.resolve(dir).toLowerCase() === path.win32.resolve(layout.binDir).toLowerCase());
		// No spread of process.env: Windows' own "Path" key would outrank this injected PATH in findOnPath's case-insensitive lookup.
		const installFixes = !matches && binAt >= 0 && findOnPath("pi-review", { env: { PATH: entries.slice(0, binAt).join(";"), PATHEXT: process.env.PATHEXT } }) === null;
		const remedy = `add ${layout.binDir} to the user Path in Environment Variables, then open a new terminal`;
		const foundDetail = found ? `pi-review resolves to ${found}` : "pi-review not found on PATH";
		const detail = matches
			? `${found} is this checkout's .cmd shim`
			: installFixes
				? `${foundDetail}; ${layout.binDir} is on PATH — run \`nana-setup install\` to recreate the launcher`
				: `${foundDetail}; ${remedy}`;
		add(matches ? OK : layout.isRealHome ? FAIL : NOTE, "PATH resolves pi-review", detail, installFixes ? "PATH pi-review" : undefined);
	} else {
		for (const [name, source] of PATH_COMMANDS) {
			const link = path.join(layout.binDir, name);
			add(linkOk(link, source) ? OK : FAIL, `PATH ${name}`, `${link} -> ${source}`);
		}
		const found = firstOnPath("pi-review");
		const matches = found !== null && realpathSafe(found) === realpathSafe(PI_REVIEW_BIN);
		const entries = String(process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
		const binAt = entries.findIndex((dir) => path.resolve(dir) === path.resolve(layout.binDir));
		const installFixes = !matches && binAt >= 0 && firstOnPath("pi-review", entries.slice(0, binAt).join(path.delimiter)) === null;
		const remedy = `add ${layout.binDir} to PATH — zsh: echo 'export PATH=\"$HOME/.local/bin:$PATH\"' >> ~/.zprofile, then open a new terminal`;
		const foundDetail = found ? `pi-review resolves to ${found}` : "pi-review not found on PATH";
		const detail = matches
			? `${found} resolves to this checkout`
			: installFixes
				? `${foundDetail}; ${layout.binDir} is on PATH — run \`nana-setup install\` to recreate the launcher`
				: `${foundDetail}; ${remedy}`;
		add(matches ? OK : layout.isRealHome ? FAIL : NOTE, "PATH resolves pi-review", detail, installFixes ? "PATH pi-review" : undefined);
	}

	// --- pi package registration ---
	const reg = packageCoverage(layout);
	// An empty package list under --home is a note because install will not modify the live pi;
	// any partial registration is still a failure naming each missing manifest extension dir.
	add(
		reg.present ? OK : layout.isRealHome || reg.entries.length > 0 ? FAIL : NOTE,
		"pi packages",
		reg.present ? `all extension directories registered${reg.match ? ` as ${reg.match}` : ""}` : `${reg.missing.map((p) => path.relative(repoRoot, p)).join(", ")} not covered by string entries in ${layout.piSettings}`,
	);

	const source = packageSourceState(layout);
	if (source) add(source.status, "pi package source", source.status === OK ? source.detail : `${source.detail} — remedy: ${source.remedy}`);

	let releaseLine;
	try { releaseLine = releaseStatus({ repo: opts.releaseRepo ?? repoRoot, ...(opts.runGit ? { runGit: opts.runGit } : {}) }).line; }
	catch (error) { releaseLine = `release status unavailable (${error?.message ?? "unknown error"})`; }
	add(NOTE, "release status", releaseLine);

	return checks;
}

export const STATUS = { OK, FAIL, NOTE, WARN };
