/**
 * @module packages/nana-setup/lib/settings-lock.mjs
 * @purpose Name and inspect the settings lock and render its platform-specific manual removal commands.
 * @inputs A settings file or lock path, a platform name, the lock's JSON bytes and the current time.
 * @outputs SETTINGS_LOCK_NAME, settingsLockPath(), lockHolder() and removalCommands().
 * @effects disk
 * @errors An unreadable or corrupt lock is described with an unrecorded pid and time; other helpers do not throw.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { shq } from "./settings.mjs";

/** Contract value from packages/nana-setup/README.md's settings.json section. */
export const SETTINGS_LOCK_NAME = ".settings.json.nana-setup.lock";

export function settingsLockPath(file) {
	return path.join(path.dirname(file), SETTINGS_LOCK_NAME);
}

export function lockHolder(lock) {
	let held = null;
	try {
		held = JSON.parse(fs.readFileSync(lock, "utf8"));
	} catch {
		/* unreadable or corrupt */
	}
	const age = Number.isFinite(held?.at) ? `${Math.round((Date.now() - held.at) / 1000)}s ago` : "at an unrecorded time";
	return `${held?.pid ? `pid ${held.pid}` : "an unrecorded pid"}, ${age}`;
}

export function removalCommands(lock, platformName) {
	if (platformName !== "win32") return [{ shell: "sh", command: `rm ${shq(lock)}` }];
	const powerShellPath = String(lock).replace(/['‘’‚‛]/gu, "$&$&");
	return [
		{ shell: "Command Prompt", command: `del "${lock}"` },
		{ shell: "PowerShell", command: `Remove-Item -LiteralPath '${powerShellPath}'` },
	];
}
