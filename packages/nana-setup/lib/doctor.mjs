// `doctor` — one ✓/✗ line per piece of the experience. This is the instrument a fresh machine
// is judged by: if every line is ✓, the Claude Code half, the user-scope pi config, the PATH
// entry and (when asked for) the desk service are actually in place.
import * as fs from "node:fs";
import * as path from "node:path";
import { DESK_LABEL, pkgRoot, platform, repoRoot } from "./paths.mjs";
import { sharedLinkState } from "./project-key.mjs";
import { hasHook, desiredHooks } from "./settings.mjs";
import { DESK_SERVER, HOOKS, PI_REVIEW_BIN, lstatSafe, objectiveTarget, readPiPackConfig, registrationState } from "./steps.mjs";
import { spawnSync } from "node:child_process";

const OK = "ok";
const FAIL = "fail";
const NOTE = "note";

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

export function diagnose(layout, opts = {}) {
	const win = platform() === "win32";
	const checks = [];
	const add = (status, label, detail) => checks.push({ status, label, detail });

	// --- Claude Code half ---
	for (const h of HOOKS) {
		const src = path.join(pkgRoot, "claude", "hooks", h);
		if (win) add(NOTE, `hook ${h}`, "skipped (win32)");
		else add(linkOk(path.join(layout.hooksDir, h), src) ? OK : FAIL, `hook ${h}`, `-> ${src}`);
	}
	const soul = path.join(pkgRoot, "claude", "rules", "nana-soul.md");
	add(linkOk(path.join(layout.rulesDir, "nana-soul.md"), soul) ? OK : FAIL, "rule nana-soul.md", `-> ${soul}`);
	// lstat, not existsSync: this file must be a REGULAR file. A symlink here aims the owner's
	// private text at another file — possibly one in this repo — and existsSync would call that ✓.
	const personal = path.join(layout.rulesDir, "nana-personal.md");
	const pst = lstatSafe(personal);
	add(
		pst?.isFile() ? OK : FAIL,
		"rule nana-personal.md",
		pst?.isSymbolicLink()
			? "private rule is a symlink — replace with a regular file"
			: pst
				? "private rule is not a regular file — replace with a regular file"
				: "private — never in the repo",
	);

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
	const cfg = readPiPackConfig(layout);
	add(cfg ? OK : FAIL, "pi nana-pack.json", cfg ? layout.piPackConfig : `missing or unparseable: ${layout.piPackConfig}`);
	const projectFile = cfg?.objective?.projectFile;
	add(projectFile ? OK : NOTE, "pi objective.projectFile", projectFile ? `${projectFile} (per-repo objectives on)` : "not set — only the user-scope objective is used");
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

export const STATUS = { OK, FAIL, NOTE };
