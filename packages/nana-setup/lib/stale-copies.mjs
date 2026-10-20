/**
 * @module packages/nana-setup/lib/stale-copies.mjs
 * @purpose Compare installed files with this checkout and render one shared stale-copy notice.
 * @inputs installed and source paths, stale doctor labels, optional blocked skill paths, the active platform and package root,
 *  and the active Claude settings entry that records nana-setup's adoption-hook install.
 * @outputs linkOk(), hasAdoptionInstallRecord() and staleNotice(labels, movePaths).
 * @effects disk (lstat, realpath and byte reads).
 * @errors comparison or settings-read failures return false; notice rendering is total.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { codeSpan } from "../../nana-pack/lib/display.mjs";
import { realPath } from "../../nana-pack/lib/real-path.mjs";
import { pkgRoot, platform, repoRoot } from "./paths.mjs";
import { hasHook, desiredHooks } from "./settings.mjs";
import { STALE_PREFIX } from "./stale-copies-config.mjs";

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

export function staleNotice(labels, movePaths = []) {
	if (!labels.length) return "";
	const command = `node "${path.join(pkgRoot, "bin", "nana-setup.mjs")}" install`;
	const install = codeSpan(command) ?? "nana-setup install";
	if (!movePaths.length) return `${STALE_PREFIX} ${labels.join(", ")} — tell the user; they fix it with ${install}`;
	const moves = movePaths.map((movePath) => codeSpan(movePath) ?? `skill ${path.basename(movePath)}`);
	return `${STALE_PREFIX} ${labels.join(", ")} — tell the user; they move ${moves.join(", ")} out of the way, then fix it with ${install}`;
}
