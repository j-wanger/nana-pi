/**
 * @module packages/nana-setup/lib/doctor.mjs
 * @purpose Judge one machine and return an ordered check list covering the Node floor, the Claude
 *  Code half, the two-tier auto-memory, pi's user config, the knowledge index, PATH and the desk
 *  service.
 * @inputs a layout from resolveLayout; opts.projectDir (default process.cwd()); NANA_SETUP_PLATFORM
 *  and PATH; on disk — <claudeHome>/hooks, rules (incl. nana-personal.md), skills, settings.json,
 *  nana-memory/shared/MEMORY.md, projects/<key>/memory/shared, <piHome>/settings.json and
 *  nana-pack.json and the objective file it names, <knowledgeHome>/index.db, <binDir>/pi-review,
 *  the LaunchAgents plist; `node -p process.versions.node` and `launchctl print`
 * @outputs an array of { status, label, detail } rows; STATUS (ok | fail | note | warn); NODE_FLOOR
 *  ("22.18"); nodeMeetsFloor(); skillLinkState() { ok, detail }; projectFileState() { status, kind,
 *  detail }
 * @effects disk (reads only), process (spawns node and launchctl to probe)
 * @errors none thrown — a missing, unparseable or wrong-kind piece becomes a fail row, a
 *  cwd-relative PI_CODING_AGENT_DIR a warn row, and a posix-only piece on win32 a note row
 */
// `doctor` — one ✓/✗ line per piece of the experience. This is the instrument a fresh machine
// is judged by: if every line is ✓, the Claude Code half, the user-scope pi config, the PATH
// entry and (when asked for) the desk service are actually in place.
import * as fs from "node:fs";
import * as path from "node:path";
import { DESK_LABEL, pkgRoot, platform, repoRoot } from "./paths.mjs";
import { sharedLinkState } from "./project-key.mjs";
import { hasHook, desiredHooks } from "./settings.mjs";
import { CLAUDE_RULES, CLAUDE_SKILLS, DESK_SERVER, HOOKS, PACK_SKILLS_DIR, PI_REVIEW_BIN, lstatSafe, objectiveTarget, readPiPackConfig, registrationState, skillFiles } from "./steps.mjs";
import { spawnSync } from "node:child_process";

const OK = "ok";
const FAIL = "fail";
const NOTE = "note";
const WARN = "warn";

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
			return path.resolve(path.dirname(target), fs.readlinkSync(target)) === path.resolve(source);
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
		try {
			current = path.resolve(path.dirname(target), fs.readlinkSync(target));
		} catch {
			/* unreadable link */
		}
		return current === path.resolve(source) ? { ok: true, detail: `-> ${source}` } : { ok: false, detail: `-> ${current ?? "(unreadable)"}, not ${source}` };
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
export function nodeMeetsFloor(version, floor = NODE_FLOOR) {
	const [a, b] = String(version).replace(/^v/, "").split(".").map(Number);
	const [fa, fb] = floor.split(".").map(Number);
	return a > fa || (a === fa && b >= fb);
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

	// --- Claude Code half ---
	for (const h of HOOKS) {
		const src = path.join(pkgRoot, "claude", "hooks", h);
		if (win) add(NOTE, `hook ${h}`, "skipped (win32)");
		else add(linkOk(path.join(layout.hooksDir, h), src) ? OK : FAIL, `hook ${h}`, `-> ${src}`);
	}
	for (const rule of CLAUDE_RULES) {
		const src = path.join(pkgRoot, "claude", "rules", rule);
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
		const st = skillLinkState(path.join(layout.skillsDir, name), path.join(PACK_SKILLS_DIR, name));
		add(st.ok ? OK : FAIL, `skill ${name}`, st.detail);
	}

	let settings = null;
	let parseError = null;
	try {
		const raw = fs.readFileSync(layout.claudeSettings, "utf8");
		settings = raw.trim() === "" ? {} : JSON.parse(raw);
	} catch (err) {
		parseError = err.code === "ENOENT" ? "missing" : `unreadable (${err.message})`;
	}
	for (const w of desiredHooks({ hooksDir: layout.hooksDir, repoRoot })) {
		if (win && w.entry.command.startsWith("bash ")) {
			add(NOTE, `settings ${w.label}`, "skipped (win32)");
			continue;
		}
		if (parseError) add(FAIL, `settings ${w.label}`, `settings.json ${parseError}`);
		else add(hasHook(settings, w.event, w.spec) ? OK : FAIL, `settings ${w.label}`, w.marker);
	}

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

	// --- knowledge pull ---
	const db = path.join(layout.knowledgeHome, "index.db");
	add(fs.existsSync(db) ? OK : FAIL, "knowledge index", db);

	// --- PATH ---
	if (win) add(NOTE, "PATH pi-review", "skipped (win32)");
	else {
		const link = path.join(layout.binDir, "pi-review");
		add(linkOk(link, PI_REVIEW_BIN) ? OK : FAIL, "PATH pi-review", `${link} -> ${PI_REVIEW_BIN}`);
		const onPath = (process.env.PATH || "").split(path.delimiter).includes(layout.binDir);
		if (!onPath) add(NOTE, "PATH contains ~/.local/bin", `${layout.binDir} is not on this shell's PATH`);
	}

	// --- pi package registration ---
	const reg = registrationState(layout);
	// Registration is the one check that cannot be satisfied under a --home override, because
	// install refuses to touch the live pi there: report it, do not fail on it.
	add(
		reg.present ? OK : layout.isRealHome ? FAIL : NOTE,
		"pi packages",
		reg.present ? `registered as ${reg.match}` : `nana-pi not in ${layout.piSettings}${layout.isRealHome ? "" : " (not registered under a --home override)"}`,
	);

	// --- desk service (opt-in) ---
	if (platform() !== "darwin") add(NOTE, "desk service", `skipped (${platform()})`);
	else if (!fs.existsSync(layout.plistPath)) add(NOTE, "desk service", "not installed (opt-in: `install --desk`)");
	else {
		const contents = fs.readFileSync(layout.plistPath, "utf8");
		const points = contents.includes(DESK_SERVER);
		const loaded = layout.isRealHome && spawnSync("launchctl", ["print", `gui/${process.getuid()}/${DESK_LABEL}`], { encoding: "utf8" }).status === 0;
		add(points ? OK : FAIL, "desk service", `${layout.plistPath}${points ? "" : ` does not point at ${DESK_SERVER}`}${points ? (loaded ? " (loaded)" : " (not loaded)") : ""}`);
	}

	return checks;
}

export const STATUS = { OK, FAIL, NOTE, WARN };
