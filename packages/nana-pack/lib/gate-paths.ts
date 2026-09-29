/**
 * gate-paths — resolve tool paths the way pi does, and recognise POLICY files (L2).
 *
 * Policy files are the gate's own policy and the trust evidence behind it: `nana-pack.json`
 * (user and project scope) and pi's `trust.json` — each in the default agent dir AND in pi's
 * active one (`PI_CODING_AGENT_DIR`, and its realpath), and wherever a symlinked policy file points,
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
import { piAgentDir, piAgentDirIsCwdRelative, piNormalizePath } from "./agent-dir.mjs";

// Mirrors pi's `resolveToCwd` (dist/core/tools/path-utils.js): unicode spaces folded, leading `@`
// stripped, then pi's normalizePath (lib/agent-dir.mjs: win32 shell paths, `~`, file://).
const UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

function normalizeToolPath(input: string): string {
	let normalized = input.replace(UNICODE_SPACES, " ");
	if (normalized.startsWith("@")) normalized = normalized.slice(1);
	return piNormalizePath(normalized);
}

// pi's ACTIVE agent dir: ONE implementation, shared with the desk and nana-setup (lib/agent-dir.mjs).
export { piAgentDir, piAgentDirIsCwdRelative };

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

function linkTarget(p: string): string | null {
	try {
		return path.resolve(path.dirname(p), fs.readlinkSync(p));
	} catch {
		return null;
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
 * `~/.pi/agent`, docs/environment-variables.md) and in the DEFAULT one: the trust store and the
 * user `nana-pack.json` — at the dir, at the dir's realpath (a symlinked agent dir), and at the
 * realpath of each FILE (a symlinked `nana-pack.json` / `trust.json`: the gate reads and enforces
 * the TARGET, so the target is policy too). The shape regexes above keep the default dir's
 * names protected; this list adds what no shape can see.
 */
function activeDirPolicyFiles(): string[] {
	const out = new Set<string>();
	for (const d of [piAgentDir(), path.join(os.homedir(), ".pi", "agent")]) {
		for (const dir of [d, realish(d)]) {
			if (!dir) continue;
			for (const f of ["trust.json", "nana-pack.json"]) {
				const file = path.join(dir, f);
				out.add(key(file));
				const target = realish(file);
				if (target) out.add(key(target));
				const next = linkTarget(file); // a dangling link: realpath fails, its first hop does not
				if (next) out.add(key(next));
			}
		}
	}
	return [...out];
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
