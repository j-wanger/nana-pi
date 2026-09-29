/**
 * Shared config for the nana pack.
 *
 * Sources (project wins over user, both optional — every extension works with defaults):
 *   user:    <pi's ACTIVE agent dir>/nana-pack.json — gate-paths' piAgentDir(), exactly as pi finds
 *            settings.json/auth.json/models.json: `PI_CODING_AGENT_DIR` (tilde-expanded; a
 *            relative value against the process cwd), else ~/.pi/agent. A nana-pack.json left in
 *            ~/.pi/agent while the active dir has none is NOT read — it is announced once per
 *            session (`config_agent_dir_mismatch`), and the gate runs without a user config.
 *   project: <cwd>/.pi/nana-pack.json — NANA-TRUSTED PROJECTS ONLY. Project config can
 *   relax the gate (allowPatterns), define post-edit COMMANDS, and redirect the
 *   handoff path, so a repo must not be able to supply it by itself. pi auto-trusts
 *   a folder whose `.pi/` holds nothing pi considers trust-requiring (pi 0.87.1
 *   dist/main.js:585, dist/core/trust-manager.js:150-169), so `ctx.isProjectTrusted()`
 *   alone is not a decision. nana-trust = isProjectTrusted() AND (pi would have asked,
 *   or trust.json holds an owner decision for this folder — `/trust`). Fail-closed
 *   when the trust API or pi's module is missing (bare harness, older pi).
 *
 * Never throws: any bytes in either file yield a fully typed config. A malformed
 * leaf falls back to its default (in a trusted project file: to the user value for
 * that leaf, if set), a malformed array entry is dropped, an unparsable
 * file contributes nothing — each reported once per session (journal
 * `config_invalid` + one UI warning; the journal line is written even when
 * `journal.enabled` is false). EXCEPT the gate block, user or nana-trusted project:
 * a malformed one falls back to the last valid gate policy of that file loaded IN THIS
 * PROCESS (process-wide, across sessions), and with none (fresh process) the gate
 * stops conservatively (`gate.stopReason`; the user stop wins if both). Nothing is persisted: a policy
 * file on disk could be forged by the very agent the gate constrains.
 *
 * Read on every event so config edits apply live, without restarting the session — except
 * that nana-gate (L2) treats the gate block as a session baseline: live changes may only
 * TIGHTEN it; loosening applies at the next session_start (incl. /reload).
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { piAgentDir } from "./gate-paths.ts";
import { displayPath, displayText, isBareFileName } from "./objective.ts";

export interface PostEditCommand {
	/** Regex (string) tested against the edited file's path */
	match: string;
	/** Shell command; every `{file}` is replaced with the quoted file path */
	run: string;
	timeoutMs?: number;
}

export interface GateConfig {
	/** Extra dangerous-command regexes (strings) added to the built-in list */
	extraPatterns: string[];
	/** Regexes that exempt ONE command segment (or an edit/write path) — never a compound, never the gate's floor */
	allowPatterns: string[];
	/** Extra protected-path regexes added to the built-in list */
	protectedPaths: string[];
	/**
	 * Not a config leaf (never read from a file). Non-null = a gate block — the USER's, or a
	 * nana-trusted PROJECT's — is malformed and this process never loaded a valid one at that
	 * scope: the gate blocks every gated tool until the owner repairs the named file. The user
	 * stop wins when both are malformed. A last-good policy at that scope is used instead, so a
	 * file corrupted mid-process does not stop anything.
	 */
	stopReason: string | null;
}

export interface NanaPackConfig {
	gate: GateConfig;
	postEdit: { commands: PostEditCommand[] };
	notify: { enabled: boolean; headless: boolean };
	journal: { enabled: boolean; path: string | null };
	/** `staleAfterDays`: a summary older than this is injected as a bounded pointer, not its text. */
	handoff: { enabled: boolean; path: string | null; staleAfterDays: number };
	/**
	 * The owner's objective + current priority, injected into every system prompt.
	 * USER SCOPE ONLY — project config never contributes (see loadConfig).
	 * `path` null = <pi's active agent dir>/nana-objective.md (PI_CODING_AGENT_DIR, else ~/.pi/agent).
	 * The nearest OBJECTIVE.md walking UP from the session cwd ALWAYS wins over `path`
	 * (no opt-in). `projectFile` only renames that file: a bare filename, owner-set at
	 * user scope; null/false = the default name "OBJECTIVE.md" (never "off").
	 */
	objective: { enabled: boolean; path: string | null; projectFile: string | null };
	/** Content-bound post-edit check receipts (see lib/receipts.ts). `dir` null = <pi's active agent dir>/receipts. */
	receipts: { enabled: boolean; dir: string | null };
}

const DEFAULTS: NanaPackConfig = {
	gate: { extraPatterns: [], allowPatterns: [], protectedPaths: [], stopReason: null },
	postEdit: { commands: [] },
	notify: { enabled: true, headless: false },
	journal: { enabled: true, path: null },
	handoff: { enabled: true, path: null, staleAfterDays: 7 },
	objective: { enabled: true, path: null, projectFile: null },
	receipts: { enabled: true, dir: null },
};

// ---------------------------------------------------------------- process-wide state
// pi loads every extension through its own jiti instance with moduleCache:false
// (pi 0.87.1 dist/core/extensions/loader.js:411), so each extension gets its OWN copy
// of this module. State that must be shared — the per-session dedupe, the trust
// evidence resolved at session_start, the last valid gate — lives on globalThis.
interface SharedState {
	reported: Set<string>;
	decidedByCwd: Map<string, boolean>;
	lastValidUserGate: Map<string, GateLeaves>;
	lastValidProjectGate: Map<string, Record<string, unknown>>;
	piTrust: PiTrustApi | null | undefined;
	piTrustLoading: Promise<void> | undefined;
}
const G: SharedState = ((globalThis as any)[Symbol.for("nana-pack.config.state")] ??= {
	reported: new Set(),
	decidedByCwd: new Map(),
	lastValidUserGate: new Map(),
	lastValidProjectGate: new Map(),
	piTrust: undefined,
	piTrustLoading: undefined,
});

// ---------------------------------------------------------------- normalization

type Block = Record<string, unknown>;
type Blocks = Record<string, Block>;

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

const kind = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

type Leaf = (v: unknown, where: string, problems: string[]) => { ok: boolean; value?: unknown };

const bool: Leaf = (v, where, problems) => {
	if (typeof v === "boolean") return { ok: true, value: v };
	problems.push(`${where}: expected true/false, got ${kind(v)} — using the default`);
	return { ok: false };
};

const pathOrNull: Leaf = (v, where, problems) => {
	if (v === null || typeof v === "string") return { ok: true, value: v };
	problems.push(`${where}: expected a string or null, got ${kind(v)} — using the default`);
	return { ok: false };
};

/** objective.projectFile: a BARE filename (no separator, not "."/".."), or null/false meaning the default name (normalised to null). */
const fileNameOrDefault: Leaf = (v, where, problems) => {
	if (v === null || v === false) return { ok: true, value: null };
	if (typeof v === "string" && (v === "" || isBareFileName(v))) return { ok: true, value: v || null };
	if (typeof v === "string") {
		problems.push(`${where}: expected a bare filename (no path separator, not "." or "..") — using the default (OBJECTIVE.md)`);
		return { ok: false };
	}
	problems.push(`${where}: expected a filename, null or false, got ${kind(v)} — using the default (OBJECTIVE.md)`);
	return { ok: false };
};

const positiveNumber: Leaf = (v, where, problems) => {
	if (typeof v === "number" && Number.isFinite(v) && v > 0) return { ok: true, value: v };
	problems.push(`${where}: expected a positive number, got ${kind(v)} — using the default`);
	return { ok: false };
};

/** Per gate list, entries 1..MAX_GATE_PATTERNS as written are considered; the rest never are. */
export const MAX_GATE_PATTERNS = 200;
/** The only gate problem that is not fatal: allowPatterns past the cap (dropping an exception only tightens). */
const ALLOW_CAP = /^gate\.allowPatterns: \d+ entries exceed the cap/;

// Any other gate-list problem makes the gate block malformed (last valid policy, else STOP):
// dropping an extraPatterns / protectedPaths entry would silently remove protection.
const regexList =
	(flags: string): Leaf =>
	(v, where, problems) => {
		if (!Array.isArray(v)) {
			problems.push(`${where}: expected an array of regex strings, got ${kind(v)} — using the default`);
			return { ok: false };
		}
		if (v.length > MAX_GATE_PATTERNS)
			problems.push(`${where}: ${v.length} entries exceed the cap of ${MAX_GATE_PATTERNS} — entries ${MAX_GATE_PATTERNS + 1}–${v.length} (from ${JSON.stringify(v[MAX_GATE_PATTERNS]).slice(0, 80)}) not considered`);
		const out: string[] = [];
		v.slice(0, MAX_GATE_PATTERNS).forEach((p, i) => {
			if (typeof p !== "string") return void problems.push(`${where}[${i}]: expected a regex string, got ${kind(p)} — dropped`);
			try {
				new RegExp(p, flags);
				out.push(p);
			} catch {
				problems.push(`${where}[${i}] ${JSON.stringify(p).slice(0, 80)}: invalid regex — dropped`);
			}
		});
		return { ok: true, value: out };
	};

const commandList: Leaf = (v, where, problems) => {
	if (!Array.isArray(v)) {
		problems.push(`${where}: expected an array of {match, run} commands, got ${kind(v)} — using the default`);
		return { ok: false };
	}
	const out: PostEditCommand[] = [];
	v.forEach((c, i) => {
		const bad = (why: string) => problems.push(`${where}[${i}]: ${why} — dropped`);
		if (!isObj(c)) return void bad(`expected an object, got ${kind(c)}`);
		if (typeof c.run !== "string") return void bad("`run` must be a string");
		if (typeof c.match !== "string") return void bad("`match` must be a regex string");
		try {
			new RegExp(c.match);
		} catch {
			return void bad("`match` is an invalid regex");
		}
		if (c.timeoutMs !== undefined && !(typeof c.timeoutMs === "number" && Number.isInteger(c.timeoutMs) && c.timeoutMs >= 0))
			return void bad("`timeoutMs` must be a non-negative integer");
		const cmd: PostEditCommand = { match: c.match, run: c.run };
		if (c.timeoutMs !== undefined) cmd.timeoutMs = c.timeoutMs as number;
		out.push(cmd);
	});
	return { ok: true, value: out };
};

/** The config-file schema: block → leaf → validator. `gate.stopReason` is deliberately absent. */
const SCHEMA: Record<string, Record<string, Leaf>> = {
	gate: { extraPatterns: regexList("i"), allowPatterns: regexList("i"), protectedPaths: regexList("i") },
	postEdit: { commands: commandList },
	notify: { enabled: bool, headless: bool },
	journal: { enabled: bool, path: pathOrNull },
	handoff: { enabled: bool, path: pathOrNull, staleAfterDays: positiveNumber },
	objective: { enabled: bool, path: pathOrNull, projectFile: fileNameOrDefault },
	receipts: { enabled: bool, dir: pathOrNull },
};

interface FileRead {
	/** false = file absent (not a problem) */
	present: boolean;
	/** valid leaves only, by block */
	blocks: Blocks;
	problems: string[];
	/** true when the gate block is known-good (absent file, or no gate problem) */
	gateValid: boolean;
}

/** Validate a parsed value against SCHEMA. Pure; never throws. */
export function normalizeRaw(raw: unknown): { blocks: Blocks; problems: string[] } {
	const problems: string[] = [];
	const blocks: Blocks = {};
	if (!isObj(raw)) {
		problems.push(`top level: expected an object, got ${kind(raw)} — file ignored`);
		return { blocks, problems };
	}
	for (const [name, leaves] of Object.entries(SCHEMA)) {
		const b = raw[name];
		if (b === undefined) continue;
		if (!isObj(b)) {
			problems.push(`${name}: expected an object, got ${kind(b)} — using the defaults`);
			continue;
		}
		const out: Block = {};
		for (const [leaf, check] of Object.entries(leaves)) {
			if (b[leaf] === undefined) continue;
			const r = check(b[leaf], `${name}.${leaf}`, problems);
			if (r.ok) out[leaf] = r.value;
		}
		blocks[name] = out;
	}
	return { blocks, problems };
}

function isLink(p: string): boolean {
	try {
		return fs.lstatSync(p).isSymbolicLink();
	} catch {
		return false;
	}
}

function linkText(p: string): string {
	try {
		return fs.readlinkSync(p);
	} catch {
		return "?";
	}
}

function readConfigFile(p: string): FileRead {
	let text: string;
	try {
		text = fs.readFileSync(p, "utf-8");
	} catch (e: any) {
		if (e?.code === "ENOENT" || e?.code === "ENOTDIR") {
			// Absent only if NOTHING is there. A symlink that resolves nowhere is a policy file
			// that cannot be read — unusable, so the last-valid / stop rule applies (never a
			// silent fall to the defaults, which would drop its denies).
			if (isLink(p)) return { present: true, blocks: {}, problems: [`unreadable (dangling symlink → ${linkText(p)}) — file ignored`], gateValid: false };
			return { present: false, blocks: {}, problems: [], gateValid: true };
		}
		return { present: true, blocks: {}, problems: [`unreadable (${e?.code ?? "error"}) — file ignored`], gateValid: false };
	}
	let raw: unknown;
	try {
		raw = JSON.parse(text.replace(/^﻿/, ""));
	} catch (e: any) {
		return { present: true, blocks: {}, problems: [`invalid JSON (${String(e?.message ?? e).slice(0, 120)}) — file ignored`], gateValid: false };
	}
	const { blocks, problems } = normalizeRaw(raw);
	const gateValid = isObj(raw) && !problems.some((m) => m.startsWith("gate") && !ALLOW_CAP.test(m));
	return { present: true, blocks, problems, gateValid };
}

// ---------------------------------------------------------------- last valid gate (in memory only)

const userConfigPath = () => path.join(piAgentDir(), "nana-pack.json");
const defaultUserConfigPath = () => path.join(os.homedir(), ".pi", "agent", "nana-pack.json");

type GateLeaves = Omit<GateConfig, "stopReason">;
const gateLeaves = (b: Block | undefined): GateLeaves => ({
	extraPatterns: (b?.extraPatterns as string[]) ?? [],
	allowPatterns: (b?.allowPatterns as string[]) ?? [],
	protectedPaths: (b?.protectedPaths as string[]) ?? [],
});

// G.lastValidUserGate: keyed by user config path (so a HOME change is a fresh state)
// G.lastValidProjectGate: keyed by project config path

/**
 * The gate's STOP reason — shown to the model as the block reason and in the UI, so both
 * interpolated fields are display text: the file via displayPath(), the problem via
 * displayText() (a JSON parse message quotes raw file bytes; a path can hold a newline).
 */
export const gateStopReason = (file: string, problem: string, scope: "user" | "project" = "user") =>
	`${scope} nana-pack.json gate block is malformed — repair it (${displayPath(file)}:${displayText(problem.replace(/ — (using the default|using the defaults|dropped|file ignored)$/, ""))})`;

// ---------------------------------------------------------------- nana-trust

interface PiTrustApi {
	hasTrustRequiringProjectResources: (cwd: string) => boolean;
	ProjectTrustStore: new (agentDir: string) => { get(cwd: string): boolean | null };
	getAgentDir?: () => string;
}
// G.piTrust: undefined = not tried yet; null = pi not resolvable (bare harness) → fail-closed
// G.decidedByCwd: canonical cwd → "trust was actually decided" (pi would have asked, or trust.json says yes)

/** Install pi's trust module (called with the real module inside pi; tests may pass pi's own). */
export function usePiTrustModule(m: unknown): void {
	const x = m as any;
	G.piTrust =
		x && typeof x.hasTrustRequiringProjectResources === "function" && typeof x.ProjectTrustStore === "function"
			? (x as PiTrustApi)
			: null;
	G.decidedByCwd.clear();
}

function loadPiTrust(): Promise<void> {
	G.piTrustLoading ??= import("@earendil-works/pi-coding-agent")
		.then((m) => {
			if (G.piTrust === undefined) usePiTrustModule(m);
		})
		.catch(() => {
			if (G.piTrust === undefined) G.piTrust = null; // not inside pi: nothing can vouch → closed
		});
	return G.piTrustLoading;
}
void loadPiTrust(); // start early so the first session_start usually finds it resolved

const cwdKey = (cwd: string) => {
	try {
		return fs.realpathSync(path.resolve(cwd));
	} catch {
		return path.resolve(cwd);
	}
};

function computeDecided(cwd: string): boolean {
	const api = G.piTrust;
	if (!api) return false;
	try {
		if (api.hasTrustRequiringProjectResources(cwd)) return true; // pi would have asked
	} catch {
		// fall through to the store
	}
	try {
		const agentDir = api.getAgentDir?.() ?? piAgentDir();
		return new api.ProjectTrustStore(agentDir).get(cwd) === true; // owner-recorded (`/trust`)
	} catch {
		return false; // unreadable trust.json → no evidence
	}
}

/** Resolve trust evidence for ctx.cwd (call at session_start). Never throws. */
export async function primeNanaTrust(ctx: { cwd: string }): Promise<void> {
	try {
		await loadPiTrust();
		G.decidedByCwd.set(cwdKey(ctx.cwd), computeDecided(ctx.cwd));
	} catch {
		// closed
	}
}

/** nana-trust: pi reports trusted AND trust was actually decided (never pi's auto-trust). */
export function isNanaTrusted(ctx: ConfigContext): boolean {
	try {
		if (typeof ctx.isProjectTrusted !== "function" || ctx.isProjectTrusted() !== true) return false;
		const key = cwdKey(ctx.cwd);
		let decided = G.decidedByCwd.get(key);
		if (decided === undefined) {
			if (G.piTrust === undefined) return false; // pi module still loading: closed, not cached
			decided = computeDecided(ctx.cwd);
			G.decidedByCwd.set(key, decided);
		}
		return decided;
	} catch {
		return false;
	}
}

// ---------------------------------------------------------------- diagnostics

/** The UI text of one config diagnostic: both fields display text. Exported for the probe tests. */
export const configNotice = (file: string, problem: string): string => `nana-pack: ${displayPath(file)}: ${displayText(problem)}`;

function sessionKey(ctx: any): string {
	try {
		return String(ctx?.sessionManager?.getSessionId?.() ?? "");
	} catch {
		return "";
	}
}

/**
 * Once per session per (file, problem): a journal line, and one UI warning when a UI exists.
 * The journal keeps the raw fields (JSON-encoded, one line per entry); the UI warning is
 * display text — a repo path may hold a newline, a problem may quote raw file bytes — so
 * no attacker-chosen text can start a line of its own there.
 */
function surface(ctx: any, cfg: NanaPackConfig, event: string, file: string, problem: string): void {
	try {
		const key = `${sessionKey(ctx)}\0${event}\0${file}\0${problem}`;
		if (G.reported.has(key)) return;
		G.reported.add(key);
		// Diagnostics are not event journaling: written even when journal.enabled is
		// false (a malformed journal.path already fell back to the default path).
		appendJournalLine(cfg, { ts: new Date().toISOString(), event, file, problem, cwd: ctx?.cwd });
		if (ctx?.hasUI) ctx.ui.notify(configNotice(file, problem), "warning");
	} catch {
		// observability must never break a handler
	}
}

// ---------------------------------------------------------------- loadConfig

export interface ConfigContext {
	cwd: string;
	isProjectTrusted?: () => boolean;
	hasUI?: boolean;
	ui?: any;
	sessionManager?: any;
}

const merge = (name: string, ...parts: (Block | undefined)[]): any =>
	Object.assign({}, (DEFAULTS as any)[name], ...parts.filter(Boolean));

export function loadConfig(ctx: ConfigContext): NanaPackConfig {
	const notes: [event: string, file: string, problem: string][] = [];
	let cfg: NanaPackConfig;
	try {
		const userFile = userConfigPath();
		// A relative userFile means the agent dir could not be resolved (a relative
		// PI_CODING_AGENT_DIR under a deleted cwd): which file pi reads is unknowable — unusable.
		const user: FileRead = path.isAbsolute(userFile)
			? readConfigFile(userFile)
			: { present: true, blocks: {}, problems: ["unreadable (agent dir unresolvable: relative PI_CODING_AGENT_DIR and the working directory is gone) — file ignored"], gateValid: false };
		for (const p of user.problems) notes.push(["config_invalid", userFile, p]);

		// --- user gate: never "default" when the block is malformed
		let gate: GateConfig;
		if (!user.present) {
			gate = { ...gateLeaves(undefined), stopReason: null };
			// Absence is legitimate (no stop), but a config stranded in the DEFAULT dir while
			// PI_CODING_AGENT_DIR points elsewhere must not vanish silently. Never read it.
			const stranded = defaultUserConfigPath();
			if (path.resolve(stranded) !== path.resolve(userFile) && fs.existsSync(stranded))
				notes.push([
					"config_agent_dir_mismatch",
					userFile,
					`no user config in pi's active agent dir (PI_CODING_AGENT_DIR); ${stranded} exists but is NOT read — gate extraPatterns/protectedPaths and every other user setting are at their defaults. Move it into the active dir, or unset PI_CODING_AGENT_DIR`,
				]);
		} else if (user.gateValid) {
			const g = gateLeaves(user.blocks.gate);
			G.lastValidUserGate.set(userFile, g);
			gate = { ...g, stopReason: null };
		} else {
			const last = G.lastValidUserGate.get(userFile);
			if (last) {
				gate = { ...last, stopReason: null };
				notes.push(["config_gate_fallback", userFile, "gate policy invalid — enforcing the last valid policy loaded in this process"]);
			} else {
				const problem = user.problems.find((m) => m.startsWith("gate") && !ALLOW_CAP.test(m)) ?? user.problems[0] ?? "malformed";
				gate = { ...gateLeaves(undefined), stopReason: gateStopReason(userFile, problem) };
				notes.push(["config_gate_fallback", userFile, "gate policy invalid and no valid policy loaded in this process — every gated tool is BLOCKED until the file is repaired"]);
			}
		}

		// --- project scope: only under nana-trust
		const projectFile = path.join(ctx.cwd, ".pi", "nana-pack.json");
		let project: Blocks = {};
		let projectStop: string | null = null;
		if (isNanaTrusted(ctx)) {
			const pr = readConfigFile(projectFile);
			for (const p of pr.problems) notes.push(["config_invalid", projectFile, p]);
			project = pr.blocks;
			if (pr.present) {
				if (pr.gateValid) G.lastValidProjectGate.set(projectFile, project.gate ?? {});
				else {
					// Same rule as the user gate (invariant 6 — never widens): keep the last
					// valid project gate loaded in this process, else STOP. Substituting "no
					// project contribution" would drop the project's denies/protected paths
					// and resurrect user exceptions it had cancelled (astra L1 land ruling).
					const last = G.lastValidProjectGate.get(projectFile);
					if (last) {
						project = { ...project, gate: last };
						notes.push(["config_gate_fallback", projectFile, "gate policy invalid — enforcing the last valid project policy loaded in this process"]);
					} else {
						const problem = pr.problems.find((m) => m.startsWith("gate") && !ALLOW_CAP.test(m)) ?? pr.problems[0] ?? "malformed";
						projectStop = gateStopReason(projectFile, problem, "project");
						notes.push(["config_gate_fallback", projectFile, "project gate policy invalid and no valid project policy loaded in this process — every gated tool is BLOCKED until the file is repaired"]);
					}
				}
			}
		} else if (fs.existsSync(projectFile)) {
			notes.push([
				"config_project_ignored",
				projectFile,
				"project config ignored — this folder's trust was never decided by you. Run /trust in pi for this folder (then restart) to honor it",
			]);
		}

		const u = user.blocks;
		const pg = project.gate;
		cfg = {
			// user stop wins (its reason names the user file); then the project stop
			gate: gate.stopReason
				? gate
				: projectStop
					? { ...gate, stopReason: projectStop }
					: { ...gate, ...(pg as Record<string, string[]> | undefined) },
			postEdit: merge("postEdit", u.postEdit, project.postEdit),
			notify: merge("notify", u.notify, project.notify),
			journal: merge("journal", u.journal, project.journal),
			handoff: merge("handoff", u.handoff, project.handoff),
			// USER SCOPE ONLY — `project` is deliberately absent from this one merge.
			// objective.path names a file whose contents go into EVERY session's system
			// prompt, so a repo that could set it would be writing the standing
			// instructions of every session run inside it; a repo that could set
			// enabled:false would silently suppress the owner's objective. Project trust
			// says "run this repo's tooling", not "speak for the user's own priorities",
			// so trusted projects are excluded too. projectFile is the same: it only RENAMES the
			// file the (unconditional) walk-up looks for — no opt-in, never "off" — and a
			// repo must not be able to rename it for itself.
			objective: merge("objective", u.objective),
			receipts: merge("receipts", u.receipts, project.receipts),
		};
	} catch (e) {
		// Unreachable by design; if it happens, the safest typed config is a stopped gate.
		cfg = structuredClone(DEFAULTS);
		// userFile is not in scope here and userConfigPath() may be what threw: name the file
		// generically (no fs, no cwd, no resolution) — this catch must not throw.
		cfg.gate.stopReason = gateStopReason(
			"<pi agent dir>/nana-pack.json",
			`config load failed (${String(e).slice(0, 120)})`);
	}
	for (const [event, file, problem] of notes) surface(ctx, cfg, event, file, problem);
	return cfg;
}

/**
 * The objective block alone, user scope — exactly what loadConfig(ctx).objective yields,
 * without the gate/project machinery or its journal side effects. For bin/nana-objective.mjs
 * (the Claude Code hook's producer), so both runtimes read the same three settings.
 */
export function loadUserObjective(): NanaPackConfig["objective"] {
	try {
		return merge("objective", readConfigFile(userConfigPath()).blocks.objective);
	} catch {
		return structuredClone(DEFAULTS.objective);
	}
}

export function compileRegexes(patterns: string[]): RegExp[] {
	const out: RegExp[] = [];
	// Malformed config (e.g. `"allowPatterns": null`) must not throw out of the
	// gate handler — a throw there BLOCKS the tool. A non-array = no patterns.
	if (!Array.isArray(patterns)) return out;
	for (const p of patterns) {
		try {
			out.push(new RegExp(p, "i"));
		} catch {
			// invalid user regex: skip rather than break the extension
		}
	}
	return out;
}

export function journalFile(cfg: NanaPackConfig): string {
	return cfg.journal.path ?? path.join(piAgentDir(), "nana-journal.jsonl");
}

/** Best-effort append; observability must never break the agent. */
export function appendJournal(cfg: NanaPackConfig, entry: Record<string, unknown>): void {
	if (!cfg.journal.enabled) return;
	appendJournalLine(cfg, entry);
}

function appendJournalLine(cfg: NanaPackConfig, entry: Record<string, unknown>): void {
	try {
		fs.appendFileSync(journalFile(cfg), `${JSON.stringify(entry)}\n`);
	} catch {
		// best-effort by design
	}
}
