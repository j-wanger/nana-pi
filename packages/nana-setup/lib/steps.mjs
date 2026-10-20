/**
 * @module packages/nana-setup/lib/steps.mjs
 * @purpose The install steps and the `install` sequencer link, seed, retire, merge or register one piece of the experience and report { label, status, detail }.
 * @inputs a layout from resolveLayout; { dryRun, desk, afterTempWrite }; this package's own sources
 *  (claude/hooks, claude/rules, claude/rules/nana-personal.example.md, claude/memory/MEMORY.seed.md,
 *  pi/nana-pack.seed.json, pi/nana-objective.seed.md, pi/subagent-config.seed.json,
 *  pi/reviewer.seed.md, launchd/com.nana.pi-desk.plist.tmpl) and packages/nana-pack/skills and
 *  packages/nana-pack/rules (the writing rule and the rulings file); the
 *  live <claudeHome>/settings.json, <piHome>/nana-pack.json and <piHome>/settings.json;
 *  <claudeHome>/nana-setup-copies.json; pi's npm package.json; NANA_SETUP_PLATFORM
 * @outputs an array of { label, status, detail }; on disk — symlinks in <claudeHome>/hooks and
 *  rules (copies on win32), a seeded nana-personal.md, the missing hook entries
 *  merged into <claudeHome>/settings.json; on win32 a copy record tracks the last installed bytes;
 *  install takes the O_EXCL .settings.json.nana-setup.lock before its first write and holds it
 *  through the PATH entries; the settings write's fsync'd temp-file rename
 *  preserves mode; <claudeHome>/nana-memory/shared/MEMORY.md,
 *  <piHome>/nana-pack.json, nana-objective.md and nana-rulings.md (link on POSIX, copy on
 *  win32), <piHome>/extensions/subagent/config.json,
 *  <piHome>/agents/reviewer.md, <knowledgeHome>/index.db, <binDir>/pi-review, pi-worker, nana-land and nana-setup, the desk plist
 *  (+ launchctl bootstrap/kickstart), per-package pi `packages` registrations, the win32 skill
 *  mirror's SKILL_COPY_MARKER (".nana-setup-copy") file; also exports HOOKS, CLAUDE_RULES,
 *  PACK_RULES_DIR, ruleSource, CLAUDE_SKILLS, PACK_SKILLS_DIR, PI_REVIEW_BIN, PI_WORKER_BIN, KNOWLEDGE_CLI,
 *  DESK_SERVER, NANA_LAND_BIN, NANA_SETUP_BIN, PI_INSTALL_HINT, PI_LAUNCH_LIMITS_MS, PRIVATE_RULE_SEED, SHARED_MEMORY_SEED, PI_PACK_SEED, PI_OBJECTIVE_SEED, SUBAGENT_CONFIG_SEED, REVIEWER_SEED, realpathSafe(), resolvePackageEntryPath(), REVIEWER_MARKER, firstBodyLine, directoryAncestorsAreSafe(), linkedSkillFolder(), SKILL_COPY_MARKER, ownSkillCopy(), SetupError and the helpers doctor reuses
 * @effects disk, process (spawns `nana-knowledge build`, `launchctl print|bootout|bootstrap`,
 *  bounded `pi --version` / `pi install` process trees, `git rev-parse`)
 * @errors SetupError — settings.json unreadable, not valid JSON, or a shape the merge will not
 *  edit; install cannot take its settings lock before its first write and hold it through the
 *  PATH entries; settings.json changed on disk during the run; a plist placeholder with no
 *  value. Every other failure is a row: PROBLEM for a non-regular
 *  nana-personal.md, or anything already sitting where the skill symlink
 *  belongs, SKIPPED for unsupported win32 pieces, a failed knowledge build or missing pi, and PROBLEM for a failed
 *  per-package `pi install` or launchctl bootstrap/kickstart
 */
// The install steps. Each one reports {label, status, detail}; none of them prompts, and none
// of them overwrites something the owner wrote by hand (see fsops.mjs).
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { parseJsonBytes, parseJsonText } from "../../nana-pack/lib/json-text.mjs";
import { resolveObjectivePath } from "../../nana-pack/lib/objective-path.mjs";
import { realPath } from "../../nana-pack/lib/real-path.mjs";
import * as os from "node:os";
import * as path from "node:path";
import { CREATED, PROBLEM, SKIPPED, UNCHANGED, UPDATED, ensureDir, linkFile, seedFile, writeBytesWithBackup, writeIfChanged } from "./fsops.mjs";
import { DESK_LABEL, pkgRoot, platform, repoRoot } from "./paths.mjs";
import { commandInvokes, desiredHooks, mergeHooks, mergeRepoHooks, migrateLegacyHooks, removeInstallerHooks, removeRetiredContextHook, serialize, validateShape } from "./settings.mjs";
import { lockHolder, removalCommands, settingsLockPath } from "./settings-lock.mjs";
import { matchesRetiredArtifact, retiredArtifacts } from "./retired.mjs";
import { findOnPath, findPi } from "../../nana-pack/lib/win-command.mjs";
import { boundedSpawnSync } from "./bounded-spawn.mjs";
import { piInvocation } from "./pi-invocation.mjs";
import { renderWinShims, WIN_SHIM_SUFFIXES } from "./win-shims.mjs";
import { pinPiInstall, readPiPin } from "./pi-pin.mjs";
import { RULINGS_FILE } from "../../nana-pack/lib/rulings-config.mjs";
import skillCopyHistory from "./skill-copy-history.json" with { type: "json" };
import { openCopyRecord } from "./copy-record.mjs";

export class SetupError extends Error {}

export const HOOKS = ["nana-objective.mjs", "nana-adoption.mjs", "nana-shared-memory.mjs", "nana-roster-notice.mjs", "verifier-pipe.mjs"];
const RETIRED_HOOKS = ["nana-objective.sh", "nana-adoption.sh", "nana-shared-memory.sh"];
/** The rules installed into ~/.claude/rules, each a symlink into claude/rules/ here —
 *  except nana-writing.md and RULINGS_FILE, sourced from the pack (see ruleSource below;
 *  Amendment 1, §A1; rulings-file lane, 2026-10-19). */
export const CLAUDE_RULES = ["nana-soul.md", "nana-standards.md", "nana-writing.md", "nana-seat.md", RULINGS_FILE];
/** nana-writing.md and RULINGS_FILE ship with the pack, not with this package, because pi reads
 *  a copy of the SAME file — one source for both runtimes, the way PACK_SKILLS_DIR already
 *  shares the requirements skill (design-ruling.md Amendment 1, §A1). */
export const PACK_RULES_DIR = path.join(repoRoot, "packages", "nana-pack", "rules");
/** Where a CLAUDE_RULES entry's content actually lives. */
export function ruleSource(rule) {
	return rule === "nana-writing.md" || rule === RULINGS_FILE ? path.join(PACK_RULES_DIR, rule) : path.join(pkgRoot, "claude", "rules", rule);
}
/** Skills Claude Code gets from the SAME source pi reads: packages/nana-pack/skills/<name>. */
export const CLAUDE_SKILLS = ["requirements", "spec", "py-lint", "py-review", "py-test"];
export const NEW_CLAUDE_SKILLS = ["spec", "py-lint", "py-review", "py-test"];
export const PACK_SKILLS_DIR = path.join(repoRoot, "packages", "nana-pack", "skills");
export const PRIVATE_RULE_SEED = path.join(pkgRoot, "claude", "rules", "nana-personal.example.md");
export const SHARED_MEMORY_SEED = path.join(pkgRoot, "claude", "memory", "MEMORY.seed.md");
export const PI_PACK_SEED = path.join(pkgRoot, "pi", "nana-pack.seed.json");
export const PI_OBJECTIVE_SEED = path.join(pkgRoot, "pi", "nana-objective.seed.md");
export const SUBAGENT_CONFIG_SEED = path.join(pkgRoot, "pi", "subagent-config.seed.json");
export const REVIEWER_SEED = path.join(pkgRoot, "pi", "reviewer.seed.md");
export const PI_REVIEW_BIN = path.join(repoRoot, "packages", "nana-pack", "bin", "pi-review.mjs");
export const PI_WORKER_BIN = path.join(repoRoot, "packages", "nana-pack", "bin", "pi-worker.mjs");
export const NANA_LAND_BIN = path.join(repoRoot, "packages", "nana-pack", "bin", "nana-land.mjs");
export const NANA_SETUP_BIN = path.join(pkgRoot, "bin", "nana-setup.mjs");
export const KNOWLEDGE_CLI = path.join(repoRoot, "packages", "nana-knowledge", "bin", "nana-knowledge.ts");
export const DESK_SERVER = path.join(repoRoot, "apps", "desk", "server.mjs");

const win = () => platform() === "win32";

function rememberCopy(o, target, sourceBytes, result) {
	if (win() && !o.dryRun && [CREATED, UPDATED, UNCHANGED].includes(result.status)) o.copyRecord?.remember(target, sourceBytes);
}

/** lstat that never throws — the link itself, never what it points at. */
export function lstatSafe(p) {
	try {
		return fs.lstatSync(p);
	} catch {
		return null;
	}
}

export function directoryAncestorsAreSafe(root, targetDirectory, allowMissing = false) {
	const relative = path.relative(root, targetDirectory);
	if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) return false;
	let current = root;
	for (const part of [null, ...relative.split(path.sep).filter(Boolean)]) {
		const stat = lstatSafe(current);
		if (!stat) return allowMissing;
		if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
		if (part !== null) current = path.join(current, part);
	}
	const finalStat = lstatSafe(current);
	return !finalStat ? allowMissing : finalStat.isDirectory() && !finalStat.isSymbolicLink();
}

/* ---------------------------------------------------------------- claude hooks and rules */

export function stepHooks(layout, o) {
	if (win()) return [];
	return HOOKS.map((h) => {
		const r = linkFile(path.join(layout.hooksDir, h), path.join(pkgRoot, "claude", "hooks", h), o);
		return { label: `hook ${h}`, ...r };
	});
}

export function stepRules(layout, o) {
	const out = [];
	for (const rule of CLAUDE_RULES) {
		const target = path.join(layout.rulesDir, rule);
		const source = ruleSource(rule);
		const sourceBytes = win() ? fs.readFileSync(source) : null;
		const r = linkFile(target, source, {
			...o,
			// Windows needs a privilege for symlinks; a copy still gets the identity in place.
			copyInstead: win(),
			unedited: o.copyRecord?.unedited(target),
		});
		rememberCopy(o, target, sourceBytes, r);
		out.push({ label: `rule ${rule}`, ...r });
	}
	// PRIVATE, and never in the repo: created from the example only when absent, then never
	// touched again — not even to compare it. It must be a REGULAR file: a symlink there points
	// the owner's private text at some other file — plausibly one inside this repo, which is how
	// a private rule ends up committed. seedFile would leave it alone and the run would then read
	// as "everything already in place", so this is reported ✗ instead (sol r2).
	const personalPath = path.join(layout.rulesDir, "nana-personal.md");
	const pst = lstatSafe(personalPath);
	if (pst && !pst.isFile()) {
		out.push({
			label: "rule nana-personal.md (private)",
			status: PROBLEM,
			detail: pst.isSymbolicLink()
				? "private rule is a symlink — replace with a regular file"
				: "private rule is not a regular file — replace with a regular file",
		});
		return out;
	}
	const personal = seedFile(personalPath, fs.readFileSync(PRIVATE_RULE_SEED, "utf8"), o);
	out.push({ label: "rule nana-personal.md (private)", ...personal });
	return out;
}

/* ----------------------------------------------------------------------------- claude skills */

/** Every file a skill directory ships, relative to its root (recursive, sorted). */
export function skillFiles(root) {
	const out = [];
	const walk = (rel) => {
		for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			const r = rel ? path.join(rel, e.name) : e.name;
			if (e.isDirectory()) walk(r);
			else if (e.isFile()) out.push(r);
		}
	};
	walk("");
	return out;
}

/** The win32 mirror's ownership marker: a regular file whose presence alone marks a directory as
 *  nana-setup's own copy. chosen: presence marks a win32 mirror nana-setup made; sealed by R-1425. */
export const SKILL_COPY_MARKER = ".nana-setup-copy";
/** Constant content: no path, no timestamp — a different checkout or a later day must never
 *  rewrite it (plan-attack.md amendment 2). */
const SKILL_COPY_MARKER_CONTENT = "nana-setup wrote this skill copy\n";

/**
 * True when the real directory at `target` is a win32 mirror nana-setup made or can safely keep
 * refreshing, decided with `lstat` alone — never following a link:
 *  1. it holds a regular file named SKILL_COPY_MARKER;
 *  2. every file `skillFiles(source)` lists is byte-equal to the pack (doctor's own ✓ test);
 *  3. its regular-file SKILL.md, read with CRLF turned into LF, hashes to a version this pack
 *     shipped before the marker existed (`skill-copy-history.json`).
 * Any other real directory there is one nana-setup did not make.
 */
export function ownSkillCopy(target, source) {
	if (lstatSafe(path.join(target, SKILL_COPY_MARKER))?.isFile()) return true;
	const files = skillFiles(source);
	if (
		files.length &&
		files.every((f) => {
			try {
				return fs.readFileSync(path.join(target, f)).equals(fs.readFileSync(path.join(source, f)));
			} catch {
				return false;
			}
		})
	)
		return true;
	if (!lstatSafe(path.join(target, "SKILL.md"))?.isFile()) return false;
	try {
		const text = fs.readFileSync(path.join(target, "SKILL.md"), "utf8").replace(/\r\n/g, "\n");
		const hash = createHash("sha256").update(text).digest("hex");
		return hash in skillCopyHistory;
	} catch {
		return false;
	}
}

/**
 * Every directory the win32 mirror would write into, root first: the skill root plus one entry per
 * subdirectory the source ships. Sorted, so an ancestor is always judged before its children.
 */
export function mirrorDirs(target, files) {
	const dirs = new Set([target]);
	for (const f of files) {
		let rel = path.dirname(f);
		while (rel && rel !== "." && rel !== path.sep) {
			dirs.add(path.join(target, rel));
			rel = path.dirname(rel);
		}
	}
	return [...dirs].sort();
}

/**
 * Refuse, WITHOUT traversing, any mirror directory that is not a real directory created at that
 * path. `lstat` never follows, so a symlink or junction is seen as itself; absent is fine (the
 * mirror creates it). This is the guard that keeps the copy path inside `~/.claude`: resolving
 * `target/<file>` through a directory link hands `linkFile` a regular file in someone else's tree,
 * which it cannot tell apart from a hand-written file of ours — it would back it up and replace it.
 */
export function mirrorDirsProblem(target, files) {
	for (const dir of mirrorDirs(target, files)) {
		const st = lstatSafe(dir);
		if (!st) continue;
		if (st.isSymbolicLink())
			return {
				status: PROBLEM,
				detail: `a symlink or junction is already at ${dir} — left untouched and NOT written through; move or remove it, then re-run`,
			};
		if (!st.isDirectory())
			return {
				status: PROBLEM,
				detail: `a regular file is already at ${dir} — left untouched; move or remove it, then re-run`,
			};
	}
	return null;
}

/**
 * `~/.claude/skills/<name>` -> `packages/nana-pack/skills/<name>`, so Claude Code and pi read ONE
 * source: the skill is authored once in the pack and a `git pull` updates both runtimes.
 *
 * posix: a symlink to the directory, and nothing else. A regular directory (or file) already
 * sitting there is someone else's skill or a stale copy — it is REPORTED and left exactly as it
 * is, never backed up into `~/.claude/skills/` (a `requirements.bak-<date>` directory there would
 * be loaded as a SECOND skill claiming the same name) and never written through.
 *
 * win32 has no usable symlink, so every runtime-neutral skill's source files are mirrored through
 * the same copy path the rules use. An unrecognized directory at any managed name is refused.
 *
 * The win32 mirror checks the DIRECTORIES it is about to write into before it touches a file
 * (sol r1, CRITICAL): `linkFile` only ever sees the leaf, so a directory symlink/junction at
 * `~/.claude/skills/requirements` used to be traversed silently — the mirror backed up and
 * overwrote the SKILL.md of whatever tree that link pointed at, a write outside `~/.claude`.
 *
 * win32 also refuses, the same as posix, a real directory it did not make: a directory there
 * that fails `ownSkillCopy` is reported ✗ and left untouched before any write, dry run included
 * (R-1420-R-1422). A mirror it wrote (or can keep refreshing) gets the `SKILL_COPY_MARKER` file
 * after a successful copy, so the next run's ownership check needs no file-by-file compare.
 */
export function linkSkill(target, source, o = {}) {
	if (win()) {
		const files = skillFiles(source);
		const dirProblem = mirrorDirsProblem(target, files);
		if (dirProblem) return dirProblem;
		// A real directory nana-setup did not make is refused before any write, dry run
		// included — never backed up, never opened as a second skill (R-1420, R-1421, R-1422).
		if (lstatSafe(target)?.isDirectory() && !ownSkillCopy(target, source)) {
			return {
				status: PROBLEM,
				detail: `a directory is already at ${target} — left untouched; move or remove it, then re-run`,
			};
		}
		const results = files.map((f) => {
			const fileTarget = path.join(target, f);
			const sourceBytes = fs.readFileSync(path.join(source, f));
			const result = linkFile(fileTarget, path.join(source, f), { ...o, copyInstead: true, unedited: o.copyRecord?.unedited(fileTarget) });
			rememberCopy(o, fileTarget, sourceBytes, result);
			return result;
		});
		const problem = results.find((r) => r.status === PROBLEM);
		if (problem) return problem;
		const marker = writeIfChanged(path.join(target, SKILL_COPY_MARKER), SKILL_COPY_MARKER_CONTENT, o);
		const all = [...results, marker];
		const changed = all.filter((r) => r.status !== UNCHANGED);
		const detail = `${files.length} file${files.length === 1 ? "" : "s"} copied (no symlink on this platform)`;
		if (!changed.length) return { status: UNCHANGED, detail };
		return { status: changed.length === all.length && !all.some((r) => r.status === UPDATED) ? CREATED : UPDATED, detail };
	}
	const st = lstatSafe(target);
	const resolved = path.resolve(source);
	if (st?.isSymbolicLink()) {
		let current = path.resolve(path.dirname(target), fs.readlinkSync(target));
		if (o.preserveForeignLink && current !== resolved) {
			try {
				if (realPath(target, { mustExist: true }) !== realPath(source, { mustExist: true }))
					return { status: PROBLEM, detail: `foreign link at ${target} -> ${current} — left untouched` };
			} catch {
				return { status: PROBLEM, detail: `foreign link at ${target} -> ${current} — left untouched` };
			}
		}
		if (current === resolved) return { status: UNCHANGED, detail: null };
		if (o.dryRun) return { status: UPDATED, detail: `would relink (was ${current})` };
		fs.unlinkSync(target);
		fs.symlinkSync(resolved, target);
		return { status: UPDATED, detail: `relinked (was ${current})` };
	}
	if (st) {
		return {
			status: PROBLEM,
			detail: `${st.isDirectory() ? "a directory" : "a regular file"} is already at ${target} — left untouched; move or remove it, then re-run`,
		};
	}
	if (o.dryRun) return { status: CREATED, detail: "would link" };
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.symlinkSync(resolved, target);
	return { status: CREATED, detail: null };
}

export function stepRetiredArtifacts(layout, o) {
	const out = [];
	const date = new Date().toISOString().slice(0, 10);
	for (const entry of retiredArtifacts(layout.base)) {
		const root = entry.relative.startsWith(".agents/") ? ".agents" : ".claude";
		const artifactHome = root === ".claude" ? layout.claudeHome : layout.base;
		const relativeTail = entry.relative.slice(root.length + 1);
		const source = root === ".claude" ? path.join(artifactHome, relativeTail) : path.join(artifactHome, entry.relative);
		// Read first (lstat alone, never a write): a retired path absent under an unsafe ancestor
		// prints no row at all — only a retired path actually THERE is this install's business
		// (seat ruling, lane spec: an existence check by lstat may run before the ancestor check).
		const st = lstatSafe(source);
		if (!st) continue;
		const newlyManagedSkill = NEW_CLAUDE_SKILLS.some((name) => entry.relative === `.claude/skills/${name}`);
		if (newlyManagedSkill && (st.isSymbolicLink() || (st.isDirectory() && lstatSafe(path.join(source, SKILL_COPY_MARKER))?.isFile()))) {
			// stepSkills reports every link at these managed names and owns every marked win32 copy.
			continue;
		}
		if (!directoryAncestorsAreSafe(artifactHome, path.dirname(source), true)) {
			out.push({ label: `retired ${entry.relative}`, status: PROBLEM, detail: `unsafe source ancestor under ${artifactHome}; source left untouched` });
			continue;
		}
		if (!matchesRetiredArtifact(entry, st, source)) {
			out.push({ label: `retired ${entry.relative}`, status: SKIPPED, detail: `unrecognized kind or provenance at ${source} — left untouched` });
			continue;
		}
		const backupRoot = root === ".claude" ? artifactHome : path.join(artifactHome, root);
		const destination = path.join(backupRoot, "backups", `${date}-retired`, relativeTail);
		if (!directoryAncestorsAreSafe(backupRoot, path.dirname(destination), true)) {
			out.push({ label: `retired ${entry.relative}`, status: PROBLEM, detail: `unsafe backup ancestor under ${backupRoot}; source left untouched` });
			continue;
		}
		if (lstatSafe(destination)) {
			out.push({ label: `retired ${entry.relative}`, status: PROBLEM, detail: `backup already exists at ${destination}; source left untouched` });
			continue;
		}
		if (!o.dryRun) {
			fs.mkdirSync(path.dirname(destination), { recursive: true });
			fs.renameSync(source, destination);
		}
		out.push({ label: `retired ${entry.relative}`, status: UPDATED, detail: `${o.dryRun ? "would move" : "moved"} to ${destination}` });
	}
	for (const old of RETIRED_HOOKS) {
		const link = path.join(layout.hooksDir, old);
		const st = lstatSafe(link);
		if (!st) continue;
		if (!directoryAncestorsAreSafe(layout.claudeHome, layout.hooksDir, true)) {
			out.push({ label: `retired ${old} link`, status: PROBLEM, detail: `unsafe source ancestor under ${layout.claudeHome}; link left untouched` });
			continue;
		}
		let owned = false;
		if (st.isSymbolicLink()) {
			try {
				const target = path.resolve(path.dirname(link), fs.readlinkSync(link));
				const targetParent = path.dirname(target);
				owned = path.basename(target) === old && realPath(targetParent, { mustExist: true }) === realPath(path.join(pkgRoot, "claude", "hooks"), { mustExist: true });
			} catch { owned = false; }
		}
		if (owned) {
			if (!o.dryRun) fs.unlinkSync(link);
			out.push({ label: `retired ${old} link`, status: UPDATED, detail: `${o.dryRun ? "would unlink" : "unlinked"} repository-managed link` });
		} else out.push({ label: `retired ${old} link`, status: PROBLEM, detail: `${old} is not a repository-managed symlink — left untouched` });
	}
	const legacyHook = path.join(layout.hooksDir, "context-size-check.sh");
	// lstat first — a regular file counts too, not only a link: the guard below must run (and the
	// ✗ row print) whenever anything at all sits there, so it never misses a non-link occupant
	// through an unsafe ancestor (plan-attack.md amendment 5).
	const hookStat = lstatSafe(legacyHook);
	if (hookStat) {
		const hookAncestorsSafe = directoryAncestorsAreSafe(layout.claudeHome, path.dirname(legacyHook), true);
		if (!hookAncestorsSafe) {
			out.push({ label: "retired context-size-check.sh link", status: PROBLEM, detail: `unsafe source ancestor under ${layout.claudeHome}; link left untouched` });
		} else if (hookStat.isSymbolicLink()) {
			let target = null;
			try { target = realPath(legacyHook, { mustExist: true }); } catch { /* dangling */ }
			const root = realPath(repoRoot, { mustExist: true });
			if (target && (target === root || target.startsWith(root + path.sep))) {
				if (!o.dryRun) fs.unlinkSync(legacyHook);
				out.push({ label: "retired context-size-check.sh link", status: UPDATED, detail: `${o.dryRun ? "would unlink" : "unlinked"} repository-managed link` });
			}
		}
	}
	out.push({ label: "repository context-warning markers", status: UNCHANGED, detail: "if present, delete .claude/.context-warned files manually; repositories were not scanned" });
	return out;
}

export function stepSkills(layout, o) {
	return CLAUDE_SKILLS.map((name) => {
		const target = path.join(layout.skillsDir, name);
		const source = path.join(PACK_SKILLS_DIR, name);
		if (!directoryAncestorsAreSafe(layout.claudeHome, layout.skillsDir, true))
			return { label: `skill ${name}`, status: PROBLEM, detail: `unsafe source ancestor under ${layout.claudeHome}; skill left untouched` };
		const legacy = retiredArtifacts(layout.base).find((entry) => entry.relative === `.claude/skills/${name}`);
		const st = lstatSafe(target);
		if (o.dryRun && legacy && matchesRetiredArtifact(legacy, st, target))
			return { label: `skill ${name}`, status: UPDATED, detail: "would link after the provenance-confirmed backup" };
		return { label: `skill ${name}`, ...linkSkill(target, source, { ...o, preserveForeignLink: NEW_CLAUDE_SKILLS.includes(name) }) };
	});
}

/**
 * The Claude home or skills folder a linked ancestor is forcing `stepSkills` to refuse every
 * skill through, or null when its own refusal test (`directoryAncestorsAreSafe` above) already
 * holds. Decided by `lstat` alone — the same read every skill name already performs — never a
 * write: the Claude home is checked first, then the skills folder, and the first one `lstat`
 * reports as a link is the one doctor and the stale-copies notice both name to move aside.
 */
export function linkedSkillFolder(layout) {
	if (directoryAncestorsAreSafe(layout.claudeHome, layout.skillsDir, true)) return null;
	for (const candidate of [layout.claudeHome, layout.skillsDir]) {
		if (lstatSafe(candidate)?.isSymbolicLink()) return candidate;
	}
	return null;
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
	const lock = settingsLockPath(file);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	let fd;
	try {
		fd = fs.openSync(lock, "wx");
	} catch (err) {
		if (err.code !== "EEXIST") throw err;
		const commands = removalCommands(lock, platform());
		const removal = commands.length === 1
			? `  ${commands[0].command}`
			: commands.map(({ shell, command }) => `  in ${shell}:\n    ${command}`).join("\n");
		throw new SetupError(
			`${file} is locked by another nana-setup run.\n` +
				`  lock:    ${lock}\n` +
				`  written: ${lockHolder(lock)}\n` +
				"Nothing was written. If no nana-setup is running (this lock is left over from an interrupted run), clear it:\n" +
				removal,
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

function retiredHookCommands(settings) {
	const names = ["nana-objective.sh", "nana-adoption.sh", "nana-shared-memory.sh"];
	const findings = [];
	for (const [event, groups] of Object.entries(settings?.hooks ?? {})) {
		if (!Array.isArray(groups)) continue;
		for (const group of groups) {
			if (!Array.isArray(group?.hooks)) continue;
			for (const hook of group.hooks) {
				for (const script of names) {
					if (commandInvokes(hook?.command, { interpreters: ["bash", "sh", "zsh"], script })) {
						findings.push({ event, command: hook.command });
						break;
					}
				}
			}
		}
	}
	return findings;
}

export function stepSettings(layout, o, state, { lockHeld = false } = {}) {
	const platformValue = win() ? "win32" : undefined;
	// On win32 every entry applies, written in exec form from the checkout (R-1050, R-1051); on
	// every other platform desiredHooks() with no platform stays byte-identical to `main`.
	const wanted = desiredHooks({ hooksDir: layout.hooksDir, repoRoot, platform: platformValue });
	const report = (added, settings) => [
		...wanted.map((w) => ({
			label: `settings ${w.label}`,
			status: added.includes(w.label) ? CREATED : UNCHANGED,
			detail: added.includes(w.label) ? "added" : "already wired",
		})),
		...(added.includes("UserPromptSubmit context-size retirement") ? [{ label: "settings UserPromptSubmit context-size retirement", status: UPDATED, detail: "removed exact nana-managed invocation" }] : []),
		...(added.includes("SessionStart retired hook migration") ? [{ label: "settings SessionStart retired hook migration", status: UPDATED, detail: o.dryRun ? "would migrate managed entries in place" : "migrated managed entries in place" }] : []),
		...retiredHookCommands(settings).map(({ event, command }) => ({ label: `settings ${event} retired hook`, status: PROBLEM, detail: `retired bash hook still wired: ${command}` })),
	];
	const merge = (settings) => {
		const retiredContext = removeRetiredContextHook(settings, { hooksDir: layout.hooksDir });
		const migratedLegacy = !win() && migrateLegacyHooks(settings, { hooksDir: layout.hooksDir, claudeHome: layout.claudeHome });
		// Repo-anchored entries (the knowledge pull on every platform, all six on win32) are
		// repaired in place when stale or (on win32) not yet in exec form (R-1056, R-1059);
		// everything else goes through the ordinary append-if-missing merge.
		const repo = mergeRepoHooks(settings, { repoRoot, wanted, platform: platformValue });
		const toAppend = wanted.filter((w) => !repo[w.label]?.found);
		const result = mergeHooks(settings, toAppend, platformValue);
		for (const w of wanted) if (repo[w.label]?.replaced) result.added.push(w.label);
		if (retiredContext) result.added.push("UserPromptSubmit context-size retirement");
		if (migratedLegacy) result.added.push("SessionStart retired hook migration");
		return result;
	};
	if (o.dryRun) {
		const settings = structuredClone(state.settings);
		return report(merge(settings).added, settings);
	}
	const write = () => {
		// Re-read INSIDE the lock: the preflight decided this install could run at all, this
		// decides what is written, and the two must agree or nothing is written.
		const fresh = readClaudeSettings(layout);
		if (fresh.snapshot.raw !== state.snapshot.raw) {
			throw new SetupError(
				`${layout.claudeSettings} changed on disk since nana-setup started.\n` +
					"Nothing was written to it. Re-run when nothing else is writing.",
			);
		}
		const { added } = merge(fresh.settings);
		if (added.length) writeSettingsAtomic(layout.claudeSettings, serialize(fresh.settings), fresh.snapshot, o);
		return report(added, fresh.settings);
	};
	return lockHeld ? write() : withSettingsLock(layout.claudeSettings, write);
}

/* ------------------------------------------------------------------------- shared memory */

export function stepSharedMemory(layout, o) {
	const dir = ensureDir(layout.sharedMemoryDir, o);
	const header = fs.readFileSync(SHARED_MEMORY_SEED, "utf8");
	const idx = seedFile(path.join(layout.sharedMemoryDir, "MEMORY.md"), header, o);
	return [
		{ label: "shared memory dir", ...dir },
		{ label: "shared memory MEMORY.md", ...idx },
		{
			label: "per-project `shared` link",
			status: UNCHANGED,
			// No installer step by design: the SessionStart hook creates it for whatever
			// project the session is in, so a brand-new repo heals itself.
			detail: "maintained by the nana-shared-memory.mjs hook, per project",
		},
	];
}

/* ------------------------------------------------------------------------- pi user config */

/**
 * Resolve nana-pack.json's `objective.path` through the shared resolver (lib/objective-path.mjs):
 * a non-string or "" value, or one missing, is the default file; "~" and a leading `~/` expand
 * under the home folder (`~\` too, on win32); an absolute value stays as is; anything else
 * resolves against the pi home, never cwd. Shared with `doctor` so the two can never disagree
 * about which file the objective lives in, and never throws on a raw JSON value of any shape —
 * nana-pack.json is read here with no schema layer, unlike the producer's loadUserObjective().
 */
export function objectiveTarget(layout, cfg) {
	return resolveObjectivePath(cfg?.objective?.path, { home: layout.base, agentDir: layout.piHome, platform: process.platform });
}

export function stepPiConfig(layout, o) {
	const seedText = fs.readFileSync(PI_PACK_SEED, "utf8");
	const pack = seedFile(layout.piPackConfig, seedText, o);
	const out = [{ label: "pi nana-pack.json", ...pack }];
	// The starter objective file belongs to the SEED. When nana-pack.json already exists and
	// points its objective at a real repo's OBJECTIVE.md, creating ~/.pi/agent/nana-objective.md
	// would be a file nothing reads (sol r1 / dry-run noise on this machine).
	const cfg = pack.status === CREATED ? JSON.parse(seedText) : readPiPackConfig(layout);
	const target = objectiveTarget(layout, cfg);
	if (pack.status === CREATED || path.resolve(target) === path.resolve(layout.piObjective)) {
		out.push({ label: "pi nana-objective.md", ...seedFile(layout.piObjective, fs.readFileSync(PI_OBJECTIVE_SEED, "utf8"), o) });
	} else {
		out.push({ label: "pi nana-objective.md", status: UNCHANGED, detail: `not needed — objective.path already points at ${target}` });
	}
	// The owner's install ruling ("install to user level .pi folder", rulings-file lane,
	// 2026-10-19): a symlink on POSIX, a byte-equal copy on win32 — the nana-rulings extension
	// reads THIS copy, never the pack file directly (unlike nana-writing's extension default).
	const rulingsSource = ruleSource(RULINGS_FILE);
	const rulingsBytes = win() ? fs.readFileSync(rulingsSource) : null;
	const rulings = linkFile(layout.piRulings, rulingsSource, { ...o, copyInstead: win(), unedited: o.copyRecord?.unedited(layout.piRulings) });
	rememberCopy(o, layout.piRulings, rulingsBytes, rulings);
	out.push({ label: "pi nana-rulings.md", ...rulings });
	return out;
}

/** What nana-pack.json says about the objective — reported by `doctor`, never rewritten. */
export function readPiPackConfig(layout) {
	try {
		return parseJsonBytes(fs.readFileSync(layout.piPackConfig));
	} catch {
		return null;
	}
}

/* ------------------------------------------------------------- pi-subagents config (R-360) */

/**
 * Seed-if-absent, exactly `stepPiConfig`'s pattern: pi-subagents is a third-party vendor
 * extension nana-pi only consumes (architecture-ruling.md 2026-10-04 §2), so it is owned here,
 * never merged into, same as nana-pack.json. The three sealed keys (R-361) live in the seed file
 * ONLY — this function never states them again.
 */
export function stepSubagentConfig(layout, o) {
	const seedText = fs.readFileSync(SUBAGENT_CONFIG_SEED, "utf8");
	return [{ label: "pi subagent config", ...seedFile(layout.subagentConfig, seedText, o) }];
}

/* ---------------------------------------------------------------- pi reviewer agent (R-363) */

/**
 * The nana-owned reviewer.md's identity marker. Deviation from the architecture ruling's literal
 * wording ("first line [of the file]"): pi-subagents' own `frontmatter.js` requires byte 0 of the
 * file to be `---` — `parseFrontmatter` returns an EMPTY frontmatter object for any other first
 * byte, and `loadAgentsFromDefinitionFiles` then silently SKIPS the agent for lacking
 * `name`/`description` (verified against the installed 0.75.0 source: `src/agents/frontmatter.js`
 * `if (!normalized.startsWith("---"))`, `src/agents/agents.js` `if (!frontmatter.name ||
 * !frontmatter.description) continue;`). A literal byte-0 marker would therefore stop this file
 * from shadowing the builtin `reviewer` at all — the opposite of R-363's purpose. The marker
 * instead sits as the first line of the BODY (immediately after the closing `---`, matching pi's
 * own `body = content.slice(frontmatterEnd).trim()` boundary exactly), which doctor and the seed
 * agree on below.
 */
export const REVIEWER_MARKER = "<!-- nana-setup reviewer seed -->";

/** The first line of a reviewer.md-shaped file's BODY, by the same boundary pi-subagents' own
 *  frontmatter.js uses (`\n---` after byte 0, then `.trim()`) — see REVIEWER_MARKER above. */
export function firstBodyLine(content) {
	const normalized = content.replace(/\r\n/g, "\n");
	if (!normalized.startsWith("---")) return (normalized.trim().split("\n")[0] ?? "");
	const end = normalized.indexOf("\n---", 3);
	if (end === -1) return (normalized.trim().split("\n")[0] ?? "");
	return (normalized.slice(end + 4).trim().split("\n")[0] ?? "");
}

export function stepReviewerAgent(layout, o) {
	const seedText = fs.readFileSync(REVIEWER_SEED, "utf8");
	return [{ label: "pi reviewer agent", ...seedFile(layout.reviewerAgent, seedText, o) }];
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
	const commands = [
		["pi-review", PI_REVIEW_BIN],
		["pi-worker", PI_WORKER_BIN],
		["nana-land", NANA_LAND_BIN],
		["nana-setup", NANA_SETUP_BIN],
	];
	let out;
	if (win()) {
		out = commands.map(([name, source]) => {
			const rendered = renderWinShims(source, layout.binDir);
			const writes = [
				writeBytesWithBackup(path.join(layout.binDir, `${name}${WIN_SHIM_SUFFIXES.sh}`), rendered.sh, { ...o, action: "write" }),
				writeBytesWithBackup(path.join(layout.binDir, `${name}${WIN_SHIM_SUFFIXES.cmd}`), rendered.cmd, { ...o, action: "write" }),
			];
			const status = writes.every((result) => result.status === UNCHANGED)
				? UNCHANGED
				: writes.every((result) => result.status === CREATED) ? CREATED : UPDATED;
			const detail = status === UNCHANGED
				? "sh: no write; .cmd: no write"
				: writes.map((result, index) => `${index ? ".cmd" : "sh"}: ${result.status === UNCHANGED ? "no write" : result.detail ?? result.status}`).join("; ");
			return { label: `PATH ${name}`, status, detail };
		});
	} else {
		out = commands.map(([name, source]) => ({ label: `PATH ${name}`, ...linkFile(path.join(layout.binDir, name), source, o) }));
	}
	const onPath = win()
		? (() => {
			const found = findOnPath("pi-review");
			return found !== null && path.win32.resolve(found).toLowerCase() === path.win32.resolve(path.join(layout.binDir, `pi-review${WIN_SHIM_SUFFIXES.cmd}`)).toLowerCase();
		})()
		: (process.env.PATH || "").split(path.delimiter).includes(layout.binDir);
	if (!onPath) out.push({ label: "PATH check", status: SKIPPED, detail: `${layout.binDir} is not on this shell's PATH — add it${win() ? " to the user Path in Environment Variables" : ""}` });
	return out;
}

/* ------------------------------------------------------------------------- desk service */

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// R-396 (2026-10-06): chosen curated launchd search paths because launchd must not inherit the shell snapshot.
const DESK_PATH_SYSTEM = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
/** chosen: wait at most 2s for launchd unload to settle, polling every 50ms to avoid a busy loop. */
export const DESK_UNLOAD_TIMEOUT_MS = 2_000;
export const DESK_UNLOAD_POLL_MS = 50;

function pathVisibleNode(nodeExecutable) {
	const expected = realpathSafe(nodeExecutable);
	for (const dir of (process.env.PATH || "").split(path.delimiter).filter(Boolean)) {
		const candidate = path.join(dir, process.platform === "win32" ? "node.exe" : "node");
		try { if (realPath(candidate, { mustExist: true }) === expected) return candidate; } catch { /* next PATH entry */ }
	}
	return nodeExecutable;
}

function curatedDeskPath(nodeExecutable, home) {
	return [...new Set([path.dirname(nodeExecutable), path.join(home, ".local", "bin"), ...DESK_PATH_SYSTEM])].join(path.delimiter);
}

function waitForJobAbsent(service) {
	const end = Date.now() + DESK_UNLOAD_TIMEOUT_MS;
	while (Date.now() < end) {
		const remaining = end - Date.now();
		const state = spawnSync("launchctl", ["print", service], { encoding: "utf8", timeout: remaining });
		if (state.error?.code === "ETIMEDOUT") return false;
		if (state.status !== 0) return true;
		const pause = Math.min(DESK_UNLOAD_POLL_MS, Math.max(0, end - Date.now()));
		if (pause) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, pause);
	}
	return false;
}

// `PI_CODING_AGENT_DIR` (optional): the agent dir the installer chose, when it is not the
// default for the layout's base. launchd does not inherit the installing shell's environment,
// so without it the service desk would start on ~/.pi/agent while the pack was installed
// elsewhere. Absent → the entry is omitted and the plist is byte-identical to before.
export function renderPlist({ PI_CODING_AGENT_DIR, ...vars }) {
	vars.AGENT_DIR_ENV = PI_CODING_AGENT_DIR ? `\n\t\t<key>PI_CODING_AGENT_DIR</key><string>${xml(PI_CODING_AGENT_DIR)}</string>` : "";
	const tmpl = fs.readFileSync(path.join(pkgRoot, "launchd", "com.nana.pi-desk.plist.tmpl"), "utf8");
	return tmpl.replace(/\{\{(\w+)\}\}/g, (m, k) => {
		if (!(k in vars)) throw new SetupError(`plist template placeholder {{${k}}} has no value`);
		return k === "AGENT_DIR_ENV" ? vars[k] : xml(vars[k]);
	});
}

export function stepDesk(layout, o) {
	if (platform() !== "darwin") return [{ label: "desk service", status: SKIPPED, detail: `skipped (${platform()}: launchd is macOS-only)` }];
	if (!fs.existsSync(DESK_SERVER)) return [{ label: "desk service", status: SKIPPED, detail: `no ${DESK_SERVER}` }];
	const nodeExecutable = pathVisibleNode(process.execPath);
	const contents = renderPlist({
		LABEL: DESK_LABEL,
		NODE: nodeExecutable,
		SERVER: DESK_SERVER,
		WORKDIR: repoRoot,
		PATH: curatedDeskPath(nodeExecutable, layout.base),
		LOG: layout.deskLog,
		// always absolute here: install refuses an ambient relative override, flags are resolved
		PI_CODING_AGENT_DIR: path.resolve(layout.piHome) === path.join(layout.base, ".pi", "agent") ? "" : path.resolve(layout.piHome),
	});
	const w = writeIfChanged(layout.plistPath, contents, o);
	const out = [{ label: "desk plist", ...w }];
	if (o.dryRun) return out;
	if (w.status === SKIPPED) {
		// writeIfChanged refused a symlink or directory in the way (fsops.mjs R-379): there is
		// no plist of ours to read, so no launchctl call can be trusted to target the right
		// thing — print/bootout/bootstrap never run, and nothing already loaded is touched.
		out.push({ label: "desk launchctl", status: SKIPPED, detail: "not touched (desk plist write was skipped)" });
		return out;
	}
	if (!layout.isRealHome) {
		out.push({ label: "desk launchctl", status: SKIPPED, detail: "not loaded (--home override in play)" });
		return out;
	}
	const uid = process.getuid();
	const domain = `gui/${uid}`;
	const service = `${domain}/${DESK_LABEL}`;
	const loaded = spawnSync("launchctl", ["print", service], { encoding: "utf8" }).status === 0;
	if (loaded && w.status === UNCHANGED) {
		const restart = spawnSync("launchctl", ["kickstart", "-k", service], { encoding: "utf8" });
		out.push(restart.status === 0
			? { label: "desk launchctl", status: UPDATED, detail: "restarted" }
			: { label: "desk launchctl", status: PROBLEM, detail: `kickstart failed: ${(restart.stderr || "").trim() || `exit ${restart.status}`}` });
		return out;
	}
	if (loaded) {
		const down = spawnSync("launchctl", ["bootout", service], { encoding: "utf8" });
		if (down.status !== 0) {
			out.push({ label: "desk launchctl", status: PROBLEM, detail: `bootout failed: ${(down.stderr || "").trim() || `exit ${down.status}`}` });
			return out;
		}
		if (!waitForJobAbsent(service)) {
			out.push({ label: "desk launchctl", status: PROBLEM, detail: `launchd job remained loaded after ${DESK_UNLOAD_TIMEOUT_MS}ms` });
			return out;
		}
	}
	let bootstrap = spawnSync("launchctl", ["bootstrap", domain, layout.plistPath], { encoding: "utf8" });
	const isIoError = (r) => /(?:error\s*5|input\/output error)/i.test(`${r.stderr || ""} ${r.stdout || ""}`);
	if (bootstrap.status !== 0 && (bootstrap.status === 5 || isIoError(bootstrap)) && waitForJobAbsent(service)) {
		bootstrap = spawnSync("launchctl", ["bootstrap", domain, layout.plistPath], { encoding: "utf8" });
	}
	if (bootstrap.status !== 0) {
		out.push({ label: "desk launchctl", status: PROBLEM, detail: `bootstrap failed: ${(bootstrap.stderr || "").trim() || `exit ${bootstrap.status}`}` });
		return out;
	}
	const kickstart = spawnSync("launchctl", ["kickstart", ...(loaded ? ["-k"] : []), service], { encoding: "utf8" });
	out.push(kickstart.status === 0
		? { label: "desk launchctl", status: loaded ? UPDATED : CREATED, detail: loaded ? "reloaded and restarted" : "bootstrapped and started" }
		: { label: "desk launchctl", status: PROBLEM, detail: `kickstart failed: ${(kickstart.stderr || "").trim() || `exit ${kickstart.status}`}` });
	return out;
}

/* ------------------------------------------------------------- pi package registration */

/** The install hint is derived from CI's checked pi version and cutoff. */
const PI_INSTALL_BASE = "npm i -g --ignore-scripts @earendil-works/pi-coding-agent";
export const PI_INSTALL_HINT = pinPiInstall(PI_INSTALL_BASE, readPiPin(repoRoot));

/** realpath, falling back to the nearest existing ancestor so a non-existent path still resolves. */
export function realpathSafe(p) {
	return realPath(p);
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

export function resolvePackageEntryPath(entry, piHome) {
	if (typeof entry !== "string") return null;
	const expanded = entry === "~" ? os.homedir() : entry.startsWith("~/") ? path.join(os.homedir(), entry.slice(2)) : entry;
	return realpathSafe(path.resolve(piHome, expanded));
}

export function entryMatches(entry, piHome, root) {
	if (typeof entry !== "string" || entry.startsWith("npm:")) return false;
	if (/^(git:|github:|[a-z][a-z0-9+.-]*:\/\/)/i.test(entry) || /^[^@/\s]+@[^:/\s]+:/.test(entry)) return remoteMatches(entry);
	const abs = resolvePackageEntryPath(entry, piHome);
	const r = realpathSafe(root);
	if (abs === r || abs.startsWith(r + path.sep)) return true;
	if (!fs.existsSync(abs)) return false;
	const mine = gitCommonDir(r);
	return Boolean(mine) && gitCommonDir(fs.statSync(abs).isDirectory() ? abs : path.dirname(abs)) === mine;
}

function manifestExtensions(manifestRoot) {
	try {
		const manifest = JSON.parse(fs.readFileSync(path.join(manifestRoot, "package.json"), "utf8"));
		return Array.isArray(manifest.pi?.extensions) ? manifest.pi.extensions.filter((p) => typeof p === "string").map((p) => path.resolve(manifestRoot, p)) : [];
	} catch { return []; }
}

function exactLocalEntry(entry, layout, target, manifestRoot = repoRoot) {
	if (typeof entry !== "string" || entry.startsWith("npm:") || remoteMatches(entry)) return false;
	const expanded = entry === "~" ? os.homedir() : entry.startsWith("~/") ? path.join(os.homedir(), entry.slice(2)) : entry;
	const resolved = realpathSafe(path.resolve(layout.piHome, expanded));
	const expected = realpathSafe(target);
	if (resolved === expected) return true;
	const common = gitCommonDir(expected);
	if (!common || gitCommonDir(resolved) !== common) return false;
	let checkoutRoot = resolved;
	for (;;) {
		const parent = path.dirname(checkoutRoot);
		if (parent === checkoutRoot || gitCommonDir(parent) !== common) break;
		checkoutRoot = parent;
	}
	const targetRel = path.relative(manifestRoot, target);
	return path.relative(checkoutRoot, resolved) === targetRel;
}

export function packageCoverage(layout, manifestRoot = repoRoot) {
	const extensionDirs = manifestExtensions(manifestRoot);
	const packageRoots = [...new Set(extensionDirs.map((dir) => {
		const rel = path.relative(manifestRoot, dir).split(path.sep);
		return rel[0] === "packages" && rel.length > 2 ? path.join(manifestRoot, rel[0], rel[1]) : manifestRoot;
	}))];
	let settings = {};
	try { settings = parseJsonText(fs.readFileSync(layout.piSettings, "utf8")); } catch { /* no settings */ }
	const entries = Array.isArray(settings.packages) ? settings.packages.filter((e) => typeof e === "string") : [];
	const rootEntry = entries.find((entry) => remoteMatches(entry) || exactLocalEntry(entry, layout, manifestRoot, manifestRoot));
	const loaded = new Set(rootEntry ? extensionDirs : []);
	let match = rootEntry ?? null;
	if (!rootEntry) {
		for (const root of packageRoots) {
			if (root === manifestRoot) continue;
			const entry = entries.find((candidate) => exactLocalEntry(candidate, layout, root, manifestRoot));
			if (!entry) continue;
			for (const dir of manifestExtensions(root)) loaded.add(dir);
			match ??= entry;
		}
	}
	const missing = extensionDirs.filter((dir) => !loaded.has(dir));
	return { present: missing.length === 0, entries, match, missing, packageRoots };
}

export function registrationState(layout) {
	return packageCoverage(layout);
}

// chosen 2026-10-20: measured pi 1.0.2 launches took 0.15 s; 30 s covers cold starts and 120 s covers startup tidy and settings-lock retries while keeping two installs under the install check's 300 s bound.
export const PI_LAUNCH_LIMITS_MS = Object.freeze({ version: 30_000, install: 120_000 });

export function stepPiRegister(layout, o, { platform: getPlatform = platform, env = process.env, spawn = boundedSpawnSync, limits = PI_LAUNCH_LIMITS_MS, exists, isFile, readText, manifestRoot = repoRoot } = {}) {
	const state = packageCoverage(layout, manifestRoot);
	if (state.present) return [{ label: "pi packages", status: UNCHANGED, detail: `all extension directories registered${state.match ? ` as ${state.match}` : ""}` }];
	if (!layout.isRealHome) return [{ label: "pi packages", status: SKIPPED, detail: "not registered (--home override in play)" }];
	const win32 = (typeof getPlatform === "function" ? getPlatform() : getPlatform) === "win32";
	const pi = win32 ? findPi({ env, cwd: process.cwd(), exists }) : "pi";
	if (!pi) return [{ label: "pi packages", status: SKIPPED, detail: `pi is not on PATH — \`${PI_INSTALL_HINT}\`, then re-run` }];
	const launch = (args, install = false) => {
		const command = piInvocation(pi, args, { win32, env, cwd: process.cwd(), exists, isFile, readText });
		if (command.refused) return { refused: command.refused };
		// the dry run stops here, before the first pi install, after every check install runs.
		if (install && o.dryRun) return { status: 0 };
		return spawn(command.command, command.args, { ...command.options, encoding: "utf8", timeout: install ? limits.install : limits.version, ...(install ? { env: { ...env, PI_CODING_AGENT_DIR: layout.piHome } } : {}) });
	};
	const probe = launch(["--version"]);
	if (probe.refused) return [{ label: "pi packages", status: PROBLEM, detail: `pi launch refused: ${probe.refused}` }];
	if (!win32 && probe.error?.code === "ENOENT") return [{ label: "pi packages", status: SKIPPED, detail: `pi is not on PATH — \`${PI_INSTALL_HINT}\`, then re-run` }];
	if (probe.error?.code === "ETIMEDOUT") return [{ label: "pi packages", status: PROBLEM, detail: `pi --version gave no answer within ${limits.version / 1_000} s and was stopped` }];
	if (probe.error || probe.status !== 0) return [{ label: "pi packages", status: PROBLEM, detail: `pi --version ${probe.error ? `could not start: ${probe.error.message}` : `failed: ${(probe.stderr || "").trim().split("\n").pop() || `exit ${probe.status}`}`}` }];
	const added = [];
	for (const dir of state.packageRoots.filter((root) => state.missing.some((ext) => ext.startsWith(root + path.sep)))) {
		const r = launch(["install", dir], true);
		if (r.refused) return [{ label: "pi packages", status: PROBLEM, detail: `pi install refused: ${r.refused}` }];
		if (r.error?.code === "ETIMEDOUT") return [{ label: "pi packages", status: PROBLEM, detail: `pi install ${dir} gave no answer within ${limits.install / 1_000} s and was stopped` }];
		if (r.error || r.status !== 0) return [{ label: "pi packages", status: PROBLEM, detail: `pi install ${dir} failed: ${(r.stderr || "").trim().split("\n").pop() || r.error?.message || `exit ${r.status}`}` }];
		added.push(dir);
	}
	return [{ label: "pi packages", status: CREATED, detail: o.dryRun ? `would add per-package entries for ${state.missing.join(", ")}` : `added per-package entries: ${added.join(", ")}` }];
}

/* ------------------------------------------------------------------------------- install */

export function installExitCode(results) {
	return results.some((result) => result.status === PROBLEM) ? 1 : 0;
}

export function install(layout, opts = {}) {
	// `afterTempWrite` is the settings write's test seam; the CLI never produces it.
	const o = { dryRun: Boolean(opts.dryRun), afterTempWrite: opts.afterTempWrite };
	// Pre-flight: the one thing that can abort. Parse before any write.
	const settingsState = readClaudeSettings(layout);
	const results = [];
	const fileSteps = (lockHeld) => {
		const copyRecord = win() ? openCopyRecord(layout.copyRecord) : null;
		const fileOptions = { ...o, copyRecord };
		results.push(...stepRetiredArtifacts(layout, fileOptions));
		results.push(...stepHooks(layout, fileOptions));
		results.push(...stepRules(layout, fileOptions));
		results.push(...stepSkills(layout, fileOptions));
		results.push(...stepSettings(layout, fileOptions, settingsState, { lockHeld }));
		results.push(...stepSharedMemory(layout, fileOptions));
		results.push(...stepPiConfig(layout, fileOptions));
		results.push(...stepSubagentConfig(layout, fileOptions));
		results.push(...stepReviewerAgent(layout, fileOptions));
		results.push(...stepPath(layout, fileOptions));
		if (copyRecord) results.push(...copyRecord.save(fileOptions));
	};
	if (o.dryRun) fileSteps(false);
	else withSettingsLock(layout.claudeSettings, () => fileSteps(true));
	results.push(...stepKnowledge(layout, o));
	if (opts.desk) results.push(...stepDesk(layout, o));
	results.push(...stepPiRegister(layout, o));
	return results;
}
