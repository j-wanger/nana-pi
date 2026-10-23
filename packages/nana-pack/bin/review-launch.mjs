/**
 * @module packages/nana-pack/bin/review-launch.mjs
 * @purpose Resolve a non-pi command to its direct or Windows cmd.exe launch, while retaining the pi-specific route for review callers.
 * @inputs a child argv and injected platform, environment, cwd, file probes, text reader, and Node executable.
 * @outputs a spawn command, arguments and optional options, or a named refusal.
 * @effects disk (default Windows command, path existence and pi lookup probes).
 * @errors lookup, absent Windows batch paths and unsafe Windows arguments return refusals; injected readers may throw.
 */
import * as path from "node:path";
import { defaultExists, findOnPath, winCommand } from "../lib/win-command.mjs";
import { PI_EXTENSIONS } from "../lib/win-command-config.mjs";
import { piLaunch } from "./pi-watchdog.mjs";
import { PI_BIN_NAME } from "./worker-config.mjs";

export function reviewLaunch(child, {
	platform = process.platform,
	env = process.env,
	cwd = process.cwd(),
	exists = defaultExists,
	isFile,
	readText,
	execPath = process.execPath,
} = {}) {
	const [word, ...args] = child;
	const piOptions = { platform, env, cwd, exists, isFile, readText, execPath };
	if (platform !== "win32") return word === PI_BIN_NAME ? piLaunch(args, piOptions) : { command: word, args };

	const folded = word.toLowerCase();
	const piNames = [PI_BIN_NAME, ...PI_EXTENSIONS.map((extension) => PI_BIN_NAME + extension)];
	if (piNames.includes(folded)) {
		const launch = piLaunch(args, piOptions);
		return launch.refused ? { refused: `pi launch refused: ${launch.refused}` } : launch;
	}

	const comspec = Object.entries(env).find(([key]) => /^comspec$/i.test(key))?.[1];
	if (/[\\/:]/.test(word)) {
		const extension = path.win32.extname(word).toLowerCase();
		const resolved = path.win32.resolve(cwd, word);
		if (PI_EXTENSIONS.slice(-2).includes(extension) && !exists(resolved)) return { refused: `no file at ${resolved}` };
		return PI_EXTENSIONS.slice(-2).includes(extension) ? winCommand(word, args, { comspec }) : { command: word, args };
	}

	const found = findOnPath(word, { env, cwd, exists });
	return found ? winCommand(found, args, { comspec }) : { refused: "not on PATH" };
}
