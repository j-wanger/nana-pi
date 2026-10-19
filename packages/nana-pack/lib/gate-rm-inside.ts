/**
 * @module packages/nana-pack/lib/gate-rm-inside.ts
 * @purpose Decide whether a plain recursive/forced rm of literal relative targets strictly inside the session working directory may run with no approval, per Jake's 2026-10-10 ruling.
 * @inputs a raw bash command string, the session cwd, an optional home override (default os.homedir()), env PI_CODING_AGENT_DIR (through gate-paths), and the filesystem (realpath and lstat of cwd, home, the active pi agent folder, every target and its intermediate parts)
 * @outputs rmInsideCwd(command, cwd, home?): true only when every guard below passes, false otherwise
 * @effects disk (realpath and lstat of cwd, home, the active pi agent folder and each target's parts)
 * @errors never throws — any unexpected error anywhere in the walk is treated as false
 */
/**
 * gate-rm-inside — the one exemption nana-gate.ts clears a non-floor "rm recursive/forced"
 * danger for (L2, 2026-10-19): a command that is EXACTLY `rm`, flags drawn only from
 * -r/-R/-f/-v (alone or combined) or --recursive/--force/--verbose, and one or more literal
 * relative targets strictly inside the session cwd. Every other rm form — and every rm from
 * the powershell tool, a check this module does not make — keeps today's verdict. This module
 * never clears the floor (rm on / or ~): nana-gate.ts only reaches it after the floor loop,
 * and extra/protected-path checks still run afterward over the raw command text unchanged.
 *
 * Every path is spelled by realPath (lib/real-path.mjs), the one canonical-path function in
 * this repo, so a case-folded or symlink-resolved spelling of the active pi agent folder
 * cannot slip past the overlap check. Containment is tested with `inside`, one helper on
 * `path.relative` — never a naive string prefix test, which would wrongly treat a sibling
 * folder whose name extends the parent's (`/home/agentdir-evil` against `/home/agentdir`) as
 * contained.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { piAgentDir } from "./gate-paths.ts";
import { realPath } from "./real-path.mjs";

// contract: R-1490, R-1494 — the whole raw command must be built only from this character set,
// so no quote, expansion, separator or second command can be hiding in accepted text; a command
// this narrow needs no shell parse to read safely.
const PLAIN_RM = /^rm([ \t]+[A-Za-z0-9._@/-]+)+$/;
const RM_FLAG = /^(-[rRfv]+|--recursive|--force|--verbose)$/;

/** `child` lies inside, or is, `parent` — on `path.relative`, never a string-prefix test. */
function inside(child: string, parent: string): boolean {
	const relative = path.relative(parent, child);
	return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

const isFsRoot = (p: string): boolean => path.dirname(p) === p;
const hasDotPart = (p: string): boolean => p.split(path.sep).some((part) => part.length > 0 && part.startsWith("."));

/**
 * true only for a command that is exactly `rm`, flags drawn only from -r/-R/-f/-v (alone or
 * combined) or --recursive/--force/--verbose, and one or more relative targets each strictly
 * inside `cwd` — none a link anywhere on the way, none dot-named, none directly holding a
 * `.git` entry, none overlapping the active pi agent folder in either direction — and `cwd`
 * itself is not a filesystem root, not home or an ancestor of home, and has no dot-named part.
 * Never throws.
 */
export function rmInsideCwd(command: string, cwd: string, home = os.homedir()): boolean {
	try {
		// 1: shape
		if (!cwd || !PLAIN_RM.test(command)) return false;
		const words = command.split(/[ \t]+/).filter(Boolean);
		const rest = words.slice(1);

		// 2: flags vs. targets — every word RM_FLAG does not match is a target
		const targets = rest.filter((w) => !RM_FLAG.test(w));
		if (!targets.length || targets.some((t) => t.startsWith("-") || t.startsWith("/"))) return false;

		// 3: the cwd itself
		const cwdReal = realPath(cwd);
		const homeReal = realPath(home);
		if (isFsRoot(cwdReal) || inside(homeReal, cwdReal) || hasDotPart(cwdReal)) return false;

		const agentReal = realPath(piAgentDir());

		for (const target of targets) {
			// 4: per-target parts — drop empty and "." parts; none left, or one starting with
			// "." (so "..", ".git", ".GIT", ".pi"), is false
			const parts = target.split("/").filter((p) => p !== "" && p !== ".");
			if (!parts.length || parts.some((p) => p.startsWith("."))) return false;

			// 5: lstat each existing part from cwd down — a link (junction too) is false,
			// ENOENT ends the walk, any other error is false
			let cur = cwd;
			for (const part of parts) {
				cur = path.join(cur, part);
				let st: fs.Stats;
				try {
					st = fs.lstatSync(cur);
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
					return false;
				}
				if (st.isSymbolicLink()) return false;
			}

			// 6: the target and the active pi agent folder must not overlap, either direction
			const targetReal = realPath(path.resolve(cwd, target));
			if (inside(targetReal, agentReal) || inside(agentReal, targetReal)) return false;

			// 7: the target must not directly hold a .git entry
			try {
				fs.lstatSync(path.join(cwd, target, ".git"));
				return false;
			} catch (error) {
				const code = (error as NodeJS.ErrnoException).code;
				if (code !== "ENOENT" && code !== "ENOTDIR") return false;
			}
		}
		return true;
	} catch {
		return false;
	}
}
