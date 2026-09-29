/**
 * gate-paths — resolve tool paths the way pi does, and recognise POLICY files (L2).
 *
 * Policy files are the gate's own policy and the trust evidence behind it: `nana-pack.json`
 * (user and project scope) and pi's `trust.json` — each in the default agent dir AND in pi's
 * active one (`PI_CODING_AGENT_DIR`, and its realpath),
 * and the Claude policy files `.claude/settings.json`, `.claude/settings.local.json`,
 * `.claude/hooks/**` (user `~/.claude` and project scope alike). A tool call touching one is on the gate's FLOOR: no allow pattern
 * exempts it. Matching is case-insensitive and slash-agnostic on every platform (macOS and
 * win32 filesystems are case-insensitive by default), and also runs on the realpath of the
 * target (or of its parent), so a symlinked alias of `~/.claude` resolves onto the real file.
 * Every function is total: it returns, it never throws.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Mirrors pi's `resolveToCwd` (dist/core/tools/path-utils.js), copied from nana-post-edit.ts
// (not imported: post-edit is another lane's file): unicode spaces folded, leading `@`
// stripped, win32 shell paths converted, `~` expanded, file:// converted.
const UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

function normalizeWindowsShellPath(filePath: string): string {
	if (!filePath.startsWith("/") || filePath.startsWith("//") || filePath.includes("\\")) return filePath;
	const match = filePath.match(/^\/(?:mnt\/|cygdrive\/)?([a-z])(?:\/(.*))?$/i);
	if (!match) return filePath;
	const suffix = match[2]?.replaceAll("/", "\\");
	return `${match[1].toUpperCase()}:\\${suffix ?? ""}`;
}

/** pi's `normalizePath` with its defaults (dist/utils/paths.js): win32 shell path, `~` / `~/`, file://. */
function piNormalizePath(input: string): string {
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

function normalizeToolPath(input: string): string {
	let normalized = input.replace(UNICODE_SPACES, " ");
	if (normalized.startsWith("@")) normalized = normalized.slice(1);
	return piNormalizePath(normalized);
}

/**
 * pi's ACTIVE agent dir, resolved exactly as pi does — the ONE resolution nana-pack uses for it
 * (the gate's policy floor and the T2c label's trust store alike). pi: getAgentDir() =
 * `PI_CODING_AGENT_DIR` (non-empty) through normalizePath, else ~/.pi/agent (dist/config.js);
 * ProjectTrustStore then resolvePath()s it, so a RELATIVE value resolves against process.cwd()
 * (dist/core/trust-manager.js). Never throws.
 */
export function piAgentDir(): string {
	const env = process.env.PI_CODING_AGENT_DIR;
	if (!env) return path.join(os.homedir(), ".pi", "agent");
	try {
		return path.resolve(piNormalizePath(env));
	} catch {
		return path.resolve(env);
	}
}

/**
 * True when `PI_CODING_AGENT_DIR` is set to a value that stays RELATIVE after pi's normalizePath:
 * each pi process then resolves it against its OWN start folder (pi dist/main.js:458 getAgentDir →
 * trust-manager.js:173 resolvePath), so starting pi elsewhere selects a DIFFERENT store. Never throws.
 */
export function piAgentDirIsCwdRelative(): boolean {
	const env = process.env.PI_CODING_AGENT_DIR;
	if (!env) return false;
	try {
		return !path.isAbsolute(piNormalizePath(env));
	} catch {
		return !path.isAbsolute(env);
	}
}

/** pi's ACTIVE trust store: `<piAgentDir()>/trust.json` (ProjectTrustStore.trustPath). */
export const piTrustStorePath = (): string => path.join(piAgentDir(), "trust.json");

/** pi's resolution of an edit/write path. Never throws (degrades to the raw input). */
export function resolveToolPath(filePath: string, cwd: string): string {
	try {
		const normalized = normalizeToolPath(filePath);
		const base = normalizeToolPath(cwd || ".");
		return path.isAbsolute(normalized) ? path.resolve(normalized) : path.resolve(base, normalized);
	} catch {
		return filePath;
	}
}

function realish(p: string): string | null {
	try {
		return fs.realpathSync(p);
	} catch {
		try {
			return path.join(fs.realpathSync(path.dirname(p)), path.basename(p));
		} catch {
			return null;
		}
	}
}

const key = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();

/** Every form of a tool path worth checking: raw, resolved, slash-normalised, realpath. */
export function pathCandidates(raw: string, cwd: string): string[] {
	const out = new Set<string>([raw]);
	for (const form of [raw, raw.replace(/\\/g, "/")]) {
		const r = resolveToolPath(form, cwd);
		out.add(r);
		const rp = realish(r);
		if (rp) out.add(rp);
	}
	return [...out];
}

// Policy files, scope-agnostic: nana-pack.json at user or project scope, pi's trust store, and
// the Claude policy files (user `~/.claude/…` and a project's `.claude/…` alike — both carry
// hooks that run code in the next Claude session).
const POLICY_RES: RegExp[] = [
	/\.pi[/\\](agent[/\\])?nana-pack\.json/i,
	/\.pi[/\\]agent[/\\]trust\.json/i,
	/\.claude[/\\](settings(\.local)?\.json|hooks([/\\]|$))/i,
];

/**
 * The policy files that live in pi's ACTIVE agent dir (`PI_CODING_AGENT_DIR` moves it out of
 * `~/.pi/agent`, docs/environment-variables.md): the trust store and the user `nana-pack.json`,
 * at piAgentDir() and at its realpath (a symlinked agent dir). The shape regexes above keep the
 * DEFAULT dir's files protected even when they are not the active ones.
 */
function activeDirPolicyFiles(): string[] {
	const d = piAgentDir();
	const dirs = [d, realish(d)].filter((x): x is string => !!x);
	return dirs.flatMap((a) => ["trust.json", "nana-pack.json"].map((f) => key(path.join(a, f))));
}

/** The policy file a set of path candidates lands on, or null. */
export function policyFileHit(candidates: string[]): string | null {
	try {
		for (const c of candidates) if (POLICY_RES.some((re) => re.test(c))) return c;
		const alt = activeDirPolicyFiles();
		for (const c of candidates) if (alt.includes(key(c))) return c;
		return null;
	} catch {
		return null;
	}
}

// A shell word naming a policy file through the agent-dir variable itself — the shell expands it,
// the gate cannot (`> $PI_CODING_AGENT_DIR/nana-pack.json`, `%PI_CODING_AGENT_DIR%\\trust.json`).
const AGENT_DIR_VAR_RE = /(\$\{?|\$env:|%)PI_CODING_AGENT_DIR\}?%?[/\\]+(nana-pack|trust)\.json/i;

/**
 * A shell command that names a policy file (redirection, `tee`, `sed -i`, `Set-Content`,
 * `Out-File`, `cp`, even `cat`). Word-level: each word is resolved like a tool path, with
 * `$HOME` / `${HOME}` / `$env:USERPROFILE` / `%USERPROFILE%` read as `~`. Cannot follow a
 * `cd` earlier in the command (named residual) — the scope-agnostic regexes still apply.
 */
export function commandPolicyHit(command: string, cwd: string): string | null {
	try {
		const text = command
			.replace(/["']/g, "")
			.replace(/(\$\{HOME\}|\$HOME|\$env:USERPROFILE|%USERPROFILE%|\$env:HOME)(?=[/\\])/gi, "~");
		const direct = [...POLICY_RES, AGENT_DIR_VAR_RE].find((re) => re.test(text));
		if (direct) return String(direct);
		for (const w of text.split(/[\s;|&<>()=,`]+/)) {
			if (!/[/\\]/.test(w)) continue; // a path word: resolve it (symlinked alias, alt agent dir)
			const hit = policyFileHit(pathCandidates(w, cwd));
			if (hit) return hit;
		}
		return null;
	} catch {
		return null;
	}
}
