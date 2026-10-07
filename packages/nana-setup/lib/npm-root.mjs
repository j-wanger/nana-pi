/**
 * @module packages/nana-setup/lib/npm-root.mjs
 * @purpose Resolve npm's global package root through its platform-specific command shim.
 * @inputs an optional platform name, environment, and spawn implementation.
 * @outputs the child-process result from npm root -g.
 * @effects process (starts npm with fixed arguments).
 * @errors spawn failures are returned by the child-process implementation.
 */
import { spawnSync } from "node:child_process";

export function spawnNpmRoot({ platform = process.platform, env = process.env, spawn = spawnSync } = {}) {
	const windows = platform === "win32";
	return spawn(windows ? "npm.cmd" : "npm", ["root", "-g"], {
		encoding: "utf8",
		env,
		...(windows ? { shell: true } : {}),
	});
}
