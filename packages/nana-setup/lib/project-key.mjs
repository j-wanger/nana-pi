/**
 * @module packages/nana-setup/lib/project-key.mjs
 * @purpose Reproduce Claude Code's ~/.claude/projects/<key> directory name for a project path and
 *  report whether that project's memory dir carries the `shared` symlink.
 * @inputs a project's absolute path; the layout's projectsDir and sharedMemoryDir; the filesystem
 *  (lstat + readlink of <projectsDir>/<key>/memory/shared); sharedLinkState's 4th arg optionally
 *  injects readlinkSync (a test seam — production callers never pass it)
 * @outputs KEY_MAX (200); slug() and pathHash() strings; projectKey() (the slug, or 200 chars plus
 *  "-<base36 32-bit hash>"); projectMemoryDir() path; sharedLinkState() — "absent" |
 *  "not-a-symlink" | "linked" | "elsewhere"
 * @effects disk (lstat and readlink only, read-only)
 * @errors none — a missing or unreadable link reads as "absent"
 */
// Claude Code's per-project directory name (~/.claude/projects/<key>).
//
// Verified 2026-09-18 against the installed CLI (2.1.269): the key is the project path with
// every character outside [A-Za-z0-9] replaced by "-", and, when that exceeds 200 characters,
// truncated to 200 with "-<hash>" appended (hash = the 32-bit string hash, base 36). The
// The Node shared-memory hook imports this implementation directly, so short, long and non-ASCII
// paths use the CLI's UTF-16 string rule without guessing by pattern.
import * as fs from "node:fs";
import * as path from "node:path";

export const KEY_MAX = 200;

/** The plain form: every non-alphanumeric character becomes "-". */
export function slug(projectPath) {
	return projectPath.replace(/[^A-Za-z0-9]/g, "-");
}

/** The 32-bit rolling string hash the CLI appends to an over-long key. */
export function pathHash(projectPath) {
	let h = 0;
	for (let i = 0; i < projectPath.length; i++) h = ((h << 5) - h + projectPath.charCodeAt(i)) | 0;
	return Math.abs(h).toString(36);
}

export function projectKey(projectPath) {
	const s = slug(projectPath);
	return s.length <= KEY_MAX ? s : `${s.slice(0, KEY_MAX)}-${pathHash(projectPath)}`;
}

export function projectMemoryDir(projectsDir, projectPath) {
	return path.join(projectsDir, projectKey(projectPath), "memory");
}

/** Does this project's memory dir carry the `shared` symlink the hook maintains? */
export function sharedLinkState(projectsDir, projectPath, sharedMemoryDir, { readlinkSync = fs.readlinkSync } = {}) {
	const link = path.join(projectMemoryDir(projectsDir, projectPath), "shared");
	let st;
	try {
		st = fs.lstatSync(link);
	} catch {
		return "absent";
	}
	if (!st.isSymbolicLink()) return "not-a-symlink";
	let linkTarget;
	try {
		linkTarget = readlinkSync(link);
	} catch {
		// The link existed at lstat but can no longer be read — removed between the two calls,
		// or unreadable for any other reason. Read it as "absent", the same as a missing link,
		// rather than throwing past this module's no-error contract (line 11).
		return "absent";
	}
	const target = path.resolve(path.dirname(link), linkTarget);
	return target === path.resolve(sharedMemoryDir) ? "linked" : "elsewhere";
}
