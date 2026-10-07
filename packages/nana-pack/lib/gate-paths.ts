/**
 * @module packages/nana-pack/lib/gate-paths.ts
 * @purpose Resolve tool paths the way pi does, and recognise the POLICY files that sit on the gate's floor.
 * @inputs a tool path or a shell command plus the session cwd, env PI_CODING_AGENT_DIR, and the filesystem
 *  (realpath, readlink and lstat of candidates, agent dirs and code-loading policy files)
 * @outputs pi's resolution of an edit/write path, every candidate form of it, the policy file a candidate
 *  set or a command word lands on (or null), and pi's active trust store path
 * @effects disk (realpath / readlink / lstat of candidate paths, agent dirs and code-loading policy files)
 * @errors none — every function is total and degrades to the raw input or to null
 */
/**
 * gate-paths — resolve tool paths the way pi does, and recognise POLICY files (L2).
 *
 * Policy files include nana-pack/trust evidence, pi code-loading files in active/default agent dirs,
 * project `.pi/settings.json`, `.pi/mcp.json`, `.pi/extensions/**`, and Claude settings/hooks. Files
 * whose content runs or shapes the next session's code sit on the gate floor; prompt-only resources do not.
 * Agent-dir files are checked by absolute location, while project resources are matched by `.pi/` shape.
 * Matching is case-insensitive and slash-agnostic on every platform, and aliases are checked through
 * resolved candidates. Every function is total: it returns, it never throws.
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

// Chosen 2026-10-06: a bounded scan prevents extension-tree enumeration from becoming unbounded.
export const EXTENSION_WALK_ENTRY_CAP = 2048;

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

// Policy files are files whose content runs or shapes the next session's code. Prompt-only resources
// are intentionally outside this floor. Project pi resources are anchored to a `.pi/` segment.
export const NANA_PACK_POLICY_RE = /(?:^|[/\\])\.pi[/\\](agent[/\\])?nana-pack\.json(?![\w.])/i;
const POLICY_RES: RegExp[] = [
	NANA_PACK_POLICY_RE,
	/(?:^|[/\\])\.pi[/\\](settings|mcp)\.json(?![\w.])/i,
	/(?:^|[/\\])\.pi[/\\]extensions[/\\]/i,
	/(?:^|[/\\])\.pi[/\\]agent[/\\](trust|auth|settings|mcp)\.json(?![\w.])/i,
	/\.claude[/\\](settings(\.local)?\.json|hooks([/\\]|$))/i,
];

/**
 * The policy files that live in pi's ACTIVE agent dir (`PI_CODING_AGENT_DIR` moves it out of
 * `~/.pi/agent`, docs/environment-variables.md) and in the DEFAULT one: the trust store and the
 * user `nana-pack.json` — at the dir, at the dir's realpath (a symlinked agent dir), and at the
 * realpath of each FILE (a symlinked `nana-pack.json` / `trust.json`: the gate reads and enforces
 * the TARGET, so the target is policy too). The shape regexes above keep the default dir's
 * names protected; this list also floors the remaining active/default agent code-loading resources,
 * including each agent directory's extensions subtree, by absolute path rather than suffix shape.
 */
function activeDirPolicyFiles(): string[] {
	const out = new Set<string>();
	for (const d of [piAgentDir(), path.join(os.homedir(), ".pi", "agent")]) {
		for (const dir of [d, realish(d)]) {
			if (!dir) continue;
			for (const f of ["trust.json", "nana-pack.json", "auth.json", "settings.json", "mcp.json"]) {
				const file = path.join(dir, f);
				out.add(key(file));
				const target = realish(file);
				if (target) out.add(key(target));
				const next = linkTarget(file);
				if (next) out.add(key(next));
			}
			out.add(`${key(path.join(dir, "extensions"))}/`);
		}
	}
	return [...out];
}

function extensionSymlinkFloors(dir: string): { prefixes: string[]; overflow: boolean } {
	const prefixes: string[] = [];
	const resolvedRoot = realish(dir);
	if (resolvedRoot) prefixes.push(`${key(resolvedRoot)}/`);
	let visited = 0;
	let overflow = false;
	const walk = (current: string, depth: number) => {
		if (depth > 2 || overflow) return;
		let entries: fs.Dirent[];
		try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { return; }
		for (const entry of entries) {
			if (++visited >= EXTENSION_WALK_ENTRY_CAP) { overflow = true; return; }
			const full = path.join(current, entry.name);
			if (entry.isSymbolicLink()) {
				try {
					const target = fs.realpathSync(full);
					const isDirectory = fs.statSync(target).isDirectory();
					prefixes.push(`${key(target)}${isDirectory ? "/" : ""}`);
				} catch { /* dangling links and loops cannot resolve to a loadable target */ }
			} else if (entry.isDirectory() && depth < 2) walk(full, depth + 1);
			if (overflow) return;
		}
	};
	walk(dir, 1);
	return { prefixes, overflow };
}

type ExtensionWalk = { floors: string[]; overflow: string | null };

function extensionWalk(cwd: string): ExtensionWalk {
	const dirs = [...new Set([
		path.join(piAgentDir(), "extensions"),
		path.join(os.homedir(), ".pi", "agent", "extensions"),
		path.join(cwd, ".pi", "extensions"),
	])];
	const floors: string[] = [];
	for (const dir of dirs) {
		const scan = extensionSymlinkFloors(dir);
		floors.push(...scan.prefixes);
		if (scan.overflow) return { floors, overflow: `${dir} (extension walk limit reached; gate call coverage incomplete)` };
	}
	return { floors, overflow: null };
}

function policyFileHitWithWalk(candidates: string[], walk: ExtensionWalk): string | null {
	for (const c of candidates) if (POLICY_RES.some((re) => re.test(c))) return c;
	if (walk.overflow) return walk.overflow;
	const alt = [...activeDirPolicyFiles(), ...walk.floors];
	for (const c of candidates) {
		const candidate = key(c);
		if (alt.some((p) => p.endsWith("/") ? candidate.startsWith(p) : candidate === p || candidate.startsWith(`${p}/`))) return c;
	}
	return null;
}

/** The policy file a set of path candidates lands on, or null. */
export function policyFileHit(candidates: string[], cwd = process.cwd()): string | null {
	try {
		return policyFileHitWithWalk(candidates, extensionWalk(cwd));
	} catch {
		return null;
	}
}

// A shell word naming a policy file through the agent-dir variable itself — the shell expands it,
// the gate cannot (`> $PI_CODING_AGENT_DIR/nana-pack.json`, `%PI_CODING_AGENT_DIR%\\trust.json`).
// Exactly the four balanced spellings `$NAME`, `${NAME}`, `%NAME%`, `$env:NAME` (README / AGENTS.md);
// case-insensitive on purpose — cmd and pwsh names are, and over-blocking a variable NAME is harmless.
const AGENT_DIR_VAR_RE = /(?:\$PI_CODING_AGENT_DIR|\$\{PI_CODING_AGENT_DIR\}|%PI_CODING_AGENT_DIR%|\$env:PI_CODING_AGENT_DIR)[/\\]+(?:nana-pack|trust)\.json/i;

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
		const walk = extensionWalk(cwd);
		if (walk.overflow) return walk.overflow;
		for (const w of text.split(/[\s;|&<>()=,`]+/)) {
			const hit = policyFileHitWithWalk(pathCandidates(w, cwd), walk);
			if (hit) return hit;
		}
		return null;
	} catch {
		return null;
	}
}
