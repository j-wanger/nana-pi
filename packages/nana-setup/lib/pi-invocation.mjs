/**
 * @module packages/nana-setup/lib/pi-invocation.mjs
 * @purpose Choose the direct npm Node-entry or legacy command invocation for one setup pi launch.
 * @inputs a located pi command and arguments; win32, environment, working directory, and injected path readers; pi's npm package.json
 * @outputs { command, args, options } or { refused }
 * @effects disk (on win32, reads pi's npm package manifest and stats its bin entry)
 * @errors never throws for launch resolution; a refused direct launch falls back to winCommand's result
 */
import { piLaunch } from "../../nana-pack/bin/pi-watchdog.mjs";
import { winCommand } from "../../nana-pack/lib/win-command.mjs";

export function piInvocation(pi, args, { win32 = false, env = process.env, cwd = process.cwd(), exists, isFile, readText } = {}) {
	if (!win32) return { command: pi, args, options: {} };
	const direct = piLaunch(args, { platform: "win32", env, cwd, exists, isFile, readText });
	if (!direct.refused) return { ...direct, options: {} };
	const comspecKey = Object.keys(env).find((key) => key.toLowerCase() === "comspec");
	return winCommand(pi, args, { comspec: comspecKey ? env[comspecKey] : undefined });
}
