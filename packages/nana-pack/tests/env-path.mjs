/**
 * @module packages/nana-pack/tests/env-path.mjs
 * @purpose Build a test environment with one folder prepended to PATH, safe to hand to an in-process lookup.
 * @inputs An environment object, a folder, and a platform name.
 * @outputs A new environment object; the input is never changed.
 * @effects none
 * @errors none
 */
const isPathKey = (key) => key.toUpperCase() === "PATH";

/**
 * On win32 an environment copied from process.env can hold `Path` while a test adds `PATH`. Node keeps
 * the lexicographically first spelling when it spawns, but the in-process lookup (`envValue`) takes the
 * first key it meets. Remove every spelling and write the single key `PATH`, so both read one value.
 * Elsewhere only the exact key `PATH` is replaced and a distinct `Path` stays as it was.
 */
export function withPathPrepended(env, dir, platform = process.platform) {
	const windows = platform === "win32";
	const delimiter = windows ? ";" : ":";
	const spellings = Object.keys(env).filter(isPathKey).sort();
	const current = windows ? (spellings.length ? env[spellings[0]] : undefined) : env.PATH;
	const next = {};
	for (const [key, value] of Object.entries(env)) if (!(windows ? isPathKey(key) : key === "PATH")) next[key] = value;
	next.PATH = current ? `${dir}${delimiter}${current}` : dir;
	return next;
}
