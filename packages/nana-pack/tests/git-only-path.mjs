/**
 * @module packages/nana-pack/tests/git-only-path.mjs
 * @purpose Build a child PATH folder that resolves to git and nothing else, for CLI fixtures pinning a missing-tool outcome.
 * @inputs A temporary directory to hold the POSIX symlink.
 * @outputs The PATH folder a child process should use.
 * @effects disk (POSIX: creates one symlink under the given directory); process (runs `which`/`where` to locate git)
 * @errors Throws when git cannot be located, or when the resolved win32 git folder also holds uvx
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * On win32, Git for Windows' launcher resolves its own runtime from its install folder, so an
 * extensionless symlinked `git` both goes unfound by libuv's PATH search (which only tries
 * `git.com`/`git.exe`) and would dangle anyway. This returns the real folder of the first
 * `where git` line instead of linking into it, and refuses if that folder also holds `uvx` so a
 * "reports missing uvx" assertion cannot pass or fail depending on the machine.
 *
 * On POSIX, unchanged: `which git` plus a symlink under `tmp` named `git`.
 */
export function gitOnlyPath(tmp) {
	if (process.platform === "win32") {
		const lines = execFileSync("where", ["git"], { encoding: "utf8" }).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
		if (lines.length === 0) throw new Error("gitOnlyPath: `where git` found no git");
		const dir = dirname(lines[0]);
		// Checked by file presence, not by spawning `where` with PATH narrowed to `dir`: that
		// would make the probe search for `where.exe` itself inside the very folder being tested.
		const hasUvx = ["uvx.exe", "uvx.cmd", "uvx.bat", "uvx.ps1", "uvx"].some((name) => existsSync(join(dir, name)));
		if (hasUvx) throw new Error(`gitOnlyPath: ${dir} also holds uvx, so a missing-uvx fixture cannot depend on it`);
		return dir;
	}
	const gitBinary = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
	mkdirSync(tmp, { recursive: true });
	symlinkSync(gitBinary, join(tmp, "git"));
	return tmp;
}
