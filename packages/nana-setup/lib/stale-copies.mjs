/**
 * @module packages/nana-setup/lib/stale-copies.mjs
 * @purpose Compare installed files and project working sections with this checkout and render their stale-copy notices.
 * @inputs installed and source paths, stale doctor labels, optional blocked skill paths, a session folder and environment,
 *  the active platform and package root, and the active Claude settings entry that records nana-setup's adoption-hook install.
 * @outputs LAUNCHER_ROLES, linkOk(), hasAdoptionInstallRecord(), staleNotice(labels, movePaths) and projectStaleLine(sessionDir, options).
 * @effects disk (lstat, realpath and bounded byte reads).
 * @errors comparison or settings-read failures return false or an empty project line; notice rendering is total.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { REVIEWER_CHILD_ENV } from "../../nana-pack/bin/worker-config.mjs";
import { MARKER, canonicalCwd, printable, repoRootOf } from "../../nana-pack/lib/adoption.mjs";
import { readBounded } from "../../nana-pack/lib/bounded-read.mjs";
import { codeSpan } from "../../nana-pack/lib/display.mjs";
import { realPath } from "../../nana-pack/lib/real-path.mjs";
import { pkgRoot, platform, repoRoot } from "./paths.mjs";
import { hasHook, desiredHooks } from "./settings.mjs";
import { PROJECT_STALE_LABEL, PROJECT_STALE_NO_PATH_CHARS, PROJECT_STALE_PREFIX, PROJECT_STALE_ROOT_PHRASE, STALE_PREFIX } from "./stale-copies-config.mjs";
import { WORKING_FILE, readSharedWorking, regionVerdict } from "./working-region.mjs";

/** Reviewer comes from the sealed review child environment; worker is the pi-worker contract. */
export const LAUNCHER_ROLES = Object.freeze([REVIEWER_CHILD_ENV.NANA_ROLE, "worker"]);

/**
 * ✓ means "this file is the repo's file". On posix that is a symlink and nothing else — a
 * byte-identical copy would silently stop tracking the repo at the next `git pull`, so it reads
 * as ✗ and `install` relinks it (backing the copy up first). Windows has no usable symlink, so
 * there a matching copy is the installed state.
 */
export function linkOk(target, source) {
	try {
		const st = fs.lstatSync(target);
		if (st.isSymbolicLink()) {
			return realPath(target, { mustExist: true }) === realPath(source, { mustExist: true });
		}
		return platform() === "win32" && st.isFile() && fs.readFileSync(target).equals(fs.readFileSync(source));
	} catch {
		return false;
	}
}

/** The SessionStart adoption entry is the install record for the hook that asks this question. */
export function hasAdoptionInstallRecord(layout, parsedSettings) {
	try {
		let settings = parsedSettings;
		if (arguments.length < 2) {
			const raw = fs.readFileSync(layout.claudeSettings, "utf8");
			settings = raw.trim() === "" ? {} : JSON.parse(raw);
		}
		const platformValue = platform() === "win32" ? "win32" : undefined;
		const adoption = desiredHooks({ hooksDir: layout.hooksDir, repoRoot, platform: platformValue })
			.find((entry) => entry.label === "SessionStart adoption");
		return Boolean(adoption && hasHook(settings, adoption.event, adoption.spec, adoption.matcher, platformValue));
	} catch {
		return false;
	}
}

export function projectStaleLine(sessionDir, { env = process.env } = {}) {
	try {
		if (LAUNCHER_ROLES.includes(env?.NANA_ROLE)) return "";
		const session = canonicalCwd(sessionDir);
		const root = repoRootOf(session);
		if (!root) return "";
		const git = fs.lstatSync(path.join(root, ".git"));
		if (git.isFile()) return "";
		try {
			fs.lstatSync(path.join(root, "templates", "_shared", WORKING_FILE));
			return "";
		} catch { /* not this checkout */ }
		try {
			fs.lstatSync(path.join(root, MARKER));
			return "";
		} catch { /* not dismissed */ }
		const agents = path.join(root, "AGENTS.md");
		const stat = fs.lstatSync(agents);
		if (!stat.isFile() || stat.isSymbolicLink()) return "";
		const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(readBounded(agents));
		if (regionVerdict(text, readSharedWorking()) !== "differs") return "";
		let fix = null;
		if (![...PROJECT_STALE_NO_PATH_CHARS].some((character) => root.includes(character)) && printable(root)) {
			fix = codeSpan(`node "${path.join(pkgRoot, "bin", "nana-setup.mjs")}" project "${root}"`);
		}
		if (!fix) fix = `\`nana-setup project\` ${PROJECT_STALE_ROOT_PHRASE}`;
		return `${PROJECT_STALE_PREFIX} ${PROJECT_STALE_LABEL} — tell the user; they fix it with ${fix}`;
	} catch {
		return "";
	}
}

export function staleNotice(labels, movePaths = []) {
	if (!labels.length) return "";
	const command = `node "${path.join(pkgRoot, "bin", "nana-setup.mjs")}" install`;
	const install = codeSpan(command) ?? "nana-setup install";
	if (!movePaths.length) return `${STALE_PREFIX} ${labels.join(", ")} — tell the user; they fix it with ${install}`;
	const moves = movePaths.map((movePath) => codeSpan(movePath) ?? `skill ${path.basename(movePath)}`);
	return `${STALE_PREFIX} ${labels.join(", ")} — tell the user; they move ${moves.join(", ")} out of the way, then fix it with ${install}`;
}
