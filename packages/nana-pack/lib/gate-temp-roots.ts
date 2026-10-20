/**
 * @module packages/nana-pack/lib/gate-temp-roots.ts
 * @purpose The one shared rule for which temp folders a gate's lane write boundary counts as writable:
 *  the OS temp folder and, on Windows, a differing TMP, except a drive or filesystem root, the home
 *  folder, or a folder above it — the home test by filesystem identity, so an alternate spelling of
 *  home (a macOS data-volume firmlink path) is still caught.
 * @inputs acceptedTempRoots({platform, env, home, tmpdir}): every value injected, never read from
 *  process.env or the OS directly; isExcludedTempRoot(t, home) and within(parent, child) take plain
 *  path strings
 * @outputs acceptedTempRoots(...): the accepted temp roots, each resolved to its on-disk spelling;
 *  isExcludedTempRoot(t, home): true when `t` is excluded; within(parent, child): true when `child`
 *  lies inside, or is, `parent`
 * @effects disk (resolves each candidate and home through lib/real-path's realPath; stats `t` and
 *  home's ancestor chain up to the root, once each, for filesystem identity)
 * @errors never throws — acceptedTempRoots returns [] on any internal failure, and a failed stat falls
 *  back to the text test
 */
// gate-temp-roots — the rule nana-gate.ts's laneWriteHit and, later, the rm-outside-asks lane both
// need: a temp variable naming a drive root, home, or a folder above home must not open the whole
// drive or the home folder to lane writes. Kept out of gate-paths.ts, which has another purpose
// (policy-file and protected-path candidates, not temp-root exemptions). `/tmp` on macOS and Linux
// is a separate POSIX rule the caller keeps for itself — it is not a "temp variable" value.
//
// The home test is filesystem identity (dev+ino), not text: macOS can reach the same home folder
// through two spellings that resolve to different real-path strings — the ordinary path and its
// data-volume firmlink spelling (`/System/Volumes/Data` + the ordinary path) — review finding,
// 2026-10-20. A stat failure (t missing, or a home-chain entry unreadable) falls back to the
// original text test (`within`) for that comparison, so identity trouble never OPENS a path the
// text test would have caught.
import * as fs from "node:fs";
import * as path from "node:path";
import { realPath } from "./real-path.mjs";

/** `child` lies inside, or is, `parent` — on `path.relative`, never a string-prefix test. */
export function within(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);
	return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

type Ident = { dev: bigint; ino: bigint };

/** `p`'s filesystem identity (`fs.statSync`, so a symlink or firmlink resolves to its target), or
 *  null when the stat fails. Follows links on purpose: identity is the on-disk object, not the name. */
function identityOf(p: string): Ident | null {
	try {
		const st = fs.statSync(p, { bigint: true });
		return { dev: st.dev, ino: st.ino };
	} catch {
		return null;
	}
}

/** `home`, then each folder above it up to the filesystem root, each with its identity — stat'd once. */
function homeChain(home: string): { path: string; id: Ident | null }[] {
	const chain: { path: string; id: Ident | null }[] = [];
	let cur = home;
	for (;;) {
		chain.push({ path: cur, id: identityOf(cur) });
		const parent = path.dirname(cur);
		if (parent === cur) break;
		cur = parent;
	}
	return chain;
}

/**
 * `t` is excluded as a temp root: a drive or filesystem root (text), or the home folder or a folder
 * above it. The home test compares filesystem identity first — `t` against home and every folder on
 * home's path up to the root — and falls back to the text test (`within`) only when `t`'s own stat or
 * some chain entry's stat failed, so the identity check never has to be complete to stay safe.
 */
export function isExcludedTempRoot(t: string, home: string): boolean {
	if (path.parse(t).root === t) return true;
	const chain = homeChain(home);
	const tId = identityOf(t);
	if (tId !== null && chain.some(({ id }) => id !== null && id.dev === tId.dev && id.ino === tId.ino)) return true;
	const statIncomplete = tId === null || chain.some(({ id }) => id === null);
	return statIncomplete && within(t, home);
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
