/**
 * @module packages/nana-pack/lib/agent-dir.mjs
 * @purpose Resolve pi's ACTIVE agent dir exactly as pi does, and flag a PI_CODING_AGENT_DIR that stays
 *  cwd-relative.
 * @inputs env PI_CODING_AGENT_DIR, os.homedir(), process.platform, process.cwd()
 * @outputs the resolved agent dir, pi's normalizePath result for any input (win32 shell path, `~`,
 *  file://), and whether the configured value resolves per-process
 * @effects none
 * @errors none — every function is total and returns a value even when process.cwd() no longer exists
 */
/**
 * agent-dir — pi's ACTIVE agent dir, resolved exactly as pi does. The ONE implementation in the
 * repo: nana-pack (lib/gate-paths.ts re-exports it), the desk (apps/desk/server.mjs) and
 * nana-setup (lib/paths.mjs) all import this file, so they cannot disagree about which
 * nana-pack.json / trust.json / settings.json is live. Plain JS so `.mjs` consumers can import it.
 *
 * pi: getAgentDir() = `PI_CODING_AGENT_DIR` (non-empty) through normalizePath, else ~/.pi/agent
 * (dist/config.js); ProjectTrustStore then resolvePath()s it, so a RELATIVE value resolves against
 * process.cwd() (dist/core/trust-manager.js).
 *
 * Every function is total: it returns, it never throws — including when process.cwd() no longer
 * exists (a relative value then cannot be resolved; the value is returned unresolved, and callers
 * that need an absolute path treat it as they would any other unusable location).
 */

import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

function normalizeWindowsShellPath(filePath) {
	if (!filePath.startsWith("/") || filePath.startsWith("//") || filePath.includes("\\")) return filePath;
	const match = filePath.match(/^\/(?:mnt\/|cygdrive\/)?([a-z])(?:\/(.*))?$/i);
	if (!match) return filePath;
	const suffix = match[2]?.replaceAll("/", "\\");
	return `${match[1].toUpperCase()}:\\${suffix ?? ""}`;
}

/** pi's `normalizePath` with its defaults (dist/utils/paths.js): win32 shell path, `~` / `~/`, file://. */
export function piNormalizePath(input) {
	let normalized = input;
	if (process.platform === "win32") normalized = normalizeWindowsShellPath(normalized);
	const home = os.homedir();
	if (normalized === "~") return home;
	if (normalized.startsWith("~/") || (process.platform === "win32" && normalized.startsWith("~\\"))) {
		return path.join(home, normalized.slice(2));
	}
	if (/^file:\/\//.test(normalized)) {
		try {
			return fileURLToPath(normalized);
		} catch {
			return normalized;
		}
	}
	return normalized;
}

/** `path.resolve` that cannot throw: a relative input under a deleted cwd comes back normalized, unresolved. */
function safeResolve(p) {
	try {
		return path.resolve(p);
	} catch {
		return path.isAbsolute(p) ? path.normalize(p) : p;
	}
}

/** pi's ACTIVE agent dir. Never throws. */
export function piAgentDir() {
	const env = process.env.PI_CODING_AGENT_DIR;
	if (!env) return path.join(os.homedir(), ".pi", "agent");
	let normalized = env;
	try {
		normalized = piNormalizePath(env);
	} catch {
		// keep the raw value
	}
	return safeResolve(normalized);
}

/**
 * True when `PI_CODING_AGENT_DIR` is set to a value that stays RELATIVE after pi's normalizePath:
 * each pi process then resolves it against its OWN start folder (pi dist/main.js:458 getAgentDir →
 * trust-manager.js:173 resolvePath), so starting pi elsewhere selects a DIFFERENT store. Never throws.
 */
export function piAgentDirIsCwdRelative() {
	const env = process.env.PI_CODING_AGENT_DIR;
	if (!env) return false;
	try {
		return !path.isAbsolute(piNormalizePath(env));
	} catch {
		return !path.isAbsolute(env);
	}
}
