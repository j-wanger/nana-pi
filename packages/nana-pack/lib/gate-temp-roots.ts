/**
 * @module packages/nana-pack/lib/gate-temp-roots.ts
 * @purpose The one shared rule for which temp folders a gate's lane write boundary counts as writable:
 *  the OS temp folder and, on Windows, a differing TMP, except a drive or filesystem root, the home
 *  folder, or a folder above it.
 * @inputs acceptedTempRoots({platform, env, home, tmpdir}): every value injected, never read from
 *  process.env or the OS directly; isExcludedTempRoot(t, home) and within(parent, child) take plain
 *  path strings
 * @outputs acceptedTempRoots(...): the accepted temp roots, each resolved to its on-disk spelling;
 *  isExcludedTempRoot(t, home): true when `t` is excluded; within(parent, child): true when `child`
 *  lies inside, or is, `parent`
 * @effects disk (resolves each candidate and home through lib/real-path's realPath)
 * @errors never throws — acceptedTempRoots returns [] on any internal failure
 */
// gate-temp-roots — the rule nana-gate.ts's laneWriteHit and, later, the rm-outside-asks lane both
// need: a temp variable naming a drive root, home, or a folder above home must not open the whole
// drive or the home folder to lane writes. Kept out of gate-paths.ts, which has another purpose
// (policy-file and protected-path candidates, not temp-root exemptions). `/tmp` on macOS and Linux
// is a separate POSIX rule the caller keeps for itself — it is not a "temp variable" value.
import * as path from "node:path";
import { realPath } from "./real-path.mjs";

/** `child` lies inside, or is, `parent` — on `path.relative`, never a string-prefix test. */
export function within(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);
	return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

/** `t` is excluded as a temp root: a drive or filesystem root, or the home folder, or a folder above it. */
export function isExcludedTempRoot(t: string, home: string): boolean {
	return path.parse(t).root === t || within(t, home);
}

const resolve = (p: string): string => {
	try {
		return realPath(p);
	} catch {
		return path.resolve(p);
	}
};

/**
 * The accepted temp roots after the root and home exclusions: `tmpdir`, plus `env.TMP` on win32
 * when it is set. Every input is injected, so this runs with no NANA_WORKTREE_ROOT and no ambient
 * env read of its own. Never throws.
 */
export function acceptedTempRoots({
	platform,
	env,
	home,
	tmpdir,
}: {
	platform: string;
	env: Record<string, string | undefined>;
	home: string;
	tmpdir: string;
}): string[] {
	try {
		const resolvedHome = resolve(home);
		const candidates = [tmpdir];
		if (platform === "win32" && env.TMP) candidates.push(env.TMP);
		return candidates.map(resolve).filter((t) => !isExcludedTempRoot(t, resolvedHome));
	} catch {
		return [];
	}
}
