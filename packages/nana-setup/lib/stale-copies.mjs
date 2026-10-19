/**
 * @module packages/nana-setup/lib/stale-copies.mjs
 * @purpose Compare installed files with this checkout and render one shared stale-copy notice.
 * @inputs installed and source paths, stale doctor labels, the active platform and package root.
 * @outputs linkOk() and staleNotice().
 * @effects disk (lstat, realpath and byte reads).
 * @errors comparison failures return false; notice rendering is total.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { codeSpan } from "../../nana-pack/lib/display.mjs";
import { pkgRoot, platform } from "./paths.mjs";
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
			return fs.realpathSync(target) === fs.realpathSync(source);
		}
		return platform() === "win32" && st.isFile() && fs.readFileSync(target).equals(fs.readFileSync(source));
	} catch {
		return false;
	}
}

export function staleNotice(labels) {
	if (!labels.length) return "";
	const command = `node "${path.join(pkgRoot, "bin", "nana-setup.mjs")}" install`;
	return `${STALE_PREFIX} ${labels.join(", ")} — tell the user; they fix it with ${codeSpan(command) ?? "nana-setup install"}`;
}
