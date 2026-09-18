// Claude Code's per-project directory name (~/.claude/projects/<key>).
//
// Verified 2026-09-18 against the installed CLI (2.1.269): the key is the project path with
// every character outside [A-Za-z0-9] replaced by "-", and, when that exceeds 200 characters,
// truncated to 200 with "-<hash>" appended (hash = the 32-bit string hash, base 36). The
// shared-memory hook reproduces the short form in bash and matches the long form by glob, so
// a new repo links itself to the shared memory dir on its first session.
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
export function sharedLinkState(projectsDir, projectPath, sharedMemoryDir) {
	const link = path.join(projectMemoryDir(projectsDir, projectPath), "shared");
	let st;
	try {
		st = fs.lstatSync(link);
	} catch {
		return "absent";
	}
	if (!st.isSymbolicLink()) return "not-a-symlink";
	const target = path.resolve(path.dirname(link), fs.readlinkSync(link));
	return target === path.resolve(sharedMemoryDir) ? "linked" : "elsewhere";
}
