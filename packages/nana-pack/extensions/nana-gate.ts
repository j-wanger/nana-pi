/**
 * @module packages/nana-pack/extensions/nana-gate.ts
 * @purpose Gate every bash or powershell command and every edit or write path against the session's
 *  ratcheted gate policy.
 * @inputs pi `tool_call` and `session_start` events (toolName, input.command / input.path, reason), the
 *  gate block of the live config, and ctx (cwd, hasUI, ui)
 * @outputs a {block, reason} verdict or undefined, an interactive Block / Allow once dialog showing the
 *  subject through the shared renderers, a running `gate ✓ N checked · M gated` status, and
 *  `gate_policy_widened` / `config_invalid` journal lines
 * @effects disk (appends the journal, realpaths candidate paths via gate-paths), process (the
 *  adopted-policy map lives on globalThis so widening is seen across extension copies)
 * @errors never throws — a failed policy load becomes a stopReason and a failed analysis becomes the hit
 *  `gate analysis failed`, and both block; headless hits block fail-closed
 */
/**
 * nana-gate — pre-tool permission gating.
 *
 * Gates bash/powershell commands matching dangerous forms and any tool touching protected
 * paths. Interactive sessions confirm via UI (Block is the default choice); headless runs
 * BLOCK fail-closed. Handler errors also block (pi's tool_call is fail-safe upstream). A
 * running `gate ✓ N checked · M gated` status shows the gate is live even when it is letting
 * everything through.
 *
 * Policy (L2, 2026-09-28): the gate policy adopted at `session_start` (startup / new / resume /
 * fork / reload — lazily on the first tool_call if none fired) is the session's baseline. A
 * config change mid-session can TIGHTEN it at once (extra/protected patterns added, allow
 * patterns removed, a stop) but never LOOSEN it: loosening applies at the next session_start
 * and is journaled `gate_policy_widened`. Allow patterns exempt one command segment, never a
 * compound (lib/gate-shell.ts), and never the FLOOR: pipe to a stdin-reading shell/interpreter,
 * `rm -r` on / or ~ (any lexically equal spelling), mkfs, `dd of=/dev/`, `diskutil erase*`,
 * Format-Volume (also behind sudo/doas/env/nice/time), and every policy file (lib/gate-paths.ts).
 * An allow pattern matching the empty string is rejected with a warning.
 *
 * Policy files are caught via edit/write (resolved path) and via targets a command names
 * LITERALLY. NOT caught: shell-computed paths — relative after `cd`, escapes, globs, variables,
 * a symlink created in the same command, `cd … | xargs tee`, script files, interpreter
 * string-building. GATE loosening from such a write waits for session_start; the file's other
 * blocks, incl. postEdit.commands, apply live — so it can run code in the SAME session through
 * post-edit. The sandbox/container layer closes that, not more patterns.
 *
 * This gate is advisory-by-load-path: anyone can run pi without it, a later extension can
 * mutate input after it, and it reads command TEXT — not a shell security boundary.
 * Unattended enforcement belongs to the container/sandbox layer, not here.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { compileRegexes, type GateConfig, journalFile, loadConfig, type NanaPackConfig, primeNanaTrust } from "../lib/config.ts";
import { displayPath, displayText } from "../lib/objective.ts";
import { commandPolicyHit, pathCandidates, policyFileHit } from "../lib/gate-paths.ts";
import { type Danger, detectionSegments, dequote, segmentDanger, splitCommand } from "../lib/gate-shell.ts";

const PROTECTED_PATHS: RegExp[] = [
	/\.pi[/\\]agent[/\\]auth\.json/i,
	/\.pi[/\\]agent[/\\]settings\.json/i,
	/\.pi[/\\]agent[/\\]trust\.json/i,
	/\.pi[/\\](agent[/\\])?nana-pack\.json/i,
	/(^|[\s/\\"'])\.ssh([/\\]|\b)/,
	/(^|[\s/\\"'])\.env(\.[\w-]+)?\b/,
	/\.aws[/\\]credentials\b/i,
	/(^|[\s/\\"'=])\.netrc\b/i,
	/\.config[/\\]gh[/\\]hosts\.yml\b/i,
];

// Bounds on user regex work: at most 200 patterns per list (lib/config.ts) and no exception for a
// command over MAX_SUBJECT. A catastrophic regex the OWNER configured is not detected: it can
// make the owner's own gate slow or hang (README "Bounded regex work").
const MAX_SUBJECT = 64 * 1024;

type Policy = Omit<GateConfig, "stopReason"> & { stopReason: string | null };
type Hit = { label: string; reason: string } | null;

const uniq = (a: string[]) => [...new Set(Array.isArray(a) ? a : [])];
const matchesEmpty = (p: string) => {
	try {
		return new RegExp(p, "i").test("");
	} catch {
		return false;
	}
};

// Last policy in force (adopted at session_start, ratcheted by live tightening), per cwd,
// process-wide — only to journal widening at the next session_start.
const ADOPTED: Map<string, Policy> = ((globalThis as any)[Symbol.for("nana-pack.gate.adopted")] ??= new Map());

/**
 * Live config may only tighten the session baseline. The STOP is live in both directions: a
 * repaired file clears it at once (L1's contract) — but a baseline adopted while stopped holds
 * no allow patterns, so the repaired file's exceptions still wait for the next session_start.
 */
function tighten(base: Policy, live: Policy): Policy {
	const liveAllow = new Set(live.allowPatterns);
	return {
		stopReason: live.stopReason,
		extraPatterns: uniq([...base.extraPatterns, ...live.extraPatterns]),
		protectedPaths: uniq([...base.protectedPaths, ...live.protectedPaths]),
		allowPatterns: base.allowPatterns.filter((p) => liveAllow.has(p)),
	};
}

function widening(prev: Policy, next: Policy): Record<string, unknown> | null {
	const w = {
		allowAdded: next.allowPatterns.filter((p) => !prev.allowPatterns.includes(p)),
		extraRemoved: prev.extraPatterns.filter((p) => !next.extraPatterns.includes(p)),
		protectedRemoved: prev.protectedPaths.filter((p) => !next.protectedPaths.includes(p)),
		stopCleared: !!prev.stopReason && !next.stopReason,
	};
	return w.allowAdded.length || w.extraRemoved.length || w.protectedRemoved.length || w.stopCleared ? w : null;
}

function journal(cfg: NanaPackConfig, entry: Record<string, unknown>): void {
	try {
		// A security event, like config diagnostics: written even when journal.enabled is false.
		fs.appendFileSync(journalFile(cfg), `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
	} catch {
		// best-effort
	}
}

function commandHit(command: string, gate: Policy, cwd: string): Hit {
	const policy = commandPolicyHit(command, cwd);
	if (policy) return { label: "policy file", reason: `${policy} (floor)` };
	const split = splitCommand(command);
	const segments = split.segments;
	const segmentable = split.segmentable && command.length <= MAX_SUBJECT;
	const det = segmentable ? segments : [...segments, ...detectionSegments(command)];
	const dangers = new Map(det.map((s) => [s, segmentDanger(s)] as [typeof s, Danger | null]));
	for (const d of dangers.values()) if (d?.floor) return { label: "dangerous command", reason: d.reason };
	const allow = compileRegexes(gate.allowPatterns);
	const extra = compileRegexes(gate.extraPatterns);
	const prot = [...PROTECTED_PATHS, ...compileRegexes(gate.protectedPaths)];
	const segHit = (s: { text: string }, d: Danger | null | undefined): Hit => {
		if (d) return { label: "dangerous command", reason: d.reason };
		const dq = dequote(s.text);
		const e = extra.find((r) => r.test(s.text) || r.test(dq));
		if (e) return { label: "dangerous command", reason: String(e) };
		const dqKeep = dequote(s.text, false);
		const p = prot.find((r) => r.test(s.text) || r.test(dqKeep));
		return p ? { label: "protected path", reason: String(p) } : null;
	};
	for (const s of det) {
		const h = segHit(s, dangers.get(s));
		// An exception applies only to a whole segment of a segmentable command.
		if (h && !(segmentable && allow.some((r) => r.test(s.text)))) return h;
	}
	// A configured pattern that only matches ACROSS segments is never exempt.
	for (const r of [...extra, ...prot]) {
		if (r.test(command) && !det.some((s) => r.test(s.text)))
			return { label: extra.includes(r) ? "dangerous command" : "protected path", reason: String(r) };
	}
	return null;
}

function pathHit(subject: string, gate: Policy, cwd: string): Hit {
	const cands = pathCandidates(subject, cwd);
	const policy = policyFileHit(cands);
	if (policy) return { label: "policy file", reason: `${policy} (floor)` };
	if (subject.length <= MAX_SUBJECT && compileRegexes(gate.allowPatterns).some((r) => r.test(subject))) return null;
	const p = [...PROTECTED_PATHS, ...compileRegexes(gate.protectedPaths)].find((r) => cands.some((c) => r.test(c)));
	return p ? { label: "protected path", reason: String(p) } : null;
}

export default function (pi: ExtensionAPI) {
	// Per-session counters (this closure is created once per extension load).
	// `checked` = tool calls the gate actually inspected; `gated` = the ones that
	// hit a pattern and had to be decided (a dialog interactively, a fail-closed
	// block headless). A silent gate is indistinguishable from an absent one, so
	// the running tally is the happy-path signal.
	let checked = 0;
	let gated = 0;
	const baseline = new Map<string, Policy>(); // session baseline, per cwd
	const warned = new Set<string>();
	const publishStatus = (ctx: { hasUI?: boolean; ui?: any }) => {
		// tool_call handler errors BLOCK the tool, so observability is wrapped:
		// no status update may ever decide whether a command runs.
		try {
			if (!ctx.hasUI) return;
			ctx.ui.setStatus("nana-gate", ctx.ui.theme.fg("dim", `gate ✓ ${checked} checked · ${gated} gated`));
		} catch {
			// observability only
		}
	};

	/** The config's gate policy, with empty-matching allow patterns rejected (and warned about). */
	const livePolicy = (ctx: any): { cfg: NanaPackConfig; gate: Policy } => {
		const cfg = loadConfig(ctx);
		const g = cfg.gate;
		const allowPatterns = uniq(g.allowPatterns).filter((p) => {
			if (!matchesEmpty(p)) return true;
			if (!warned.has(p)) {
				warned.add(p);
				const problem = `gate.allowPatterns ${JSON.stringify(p)} matches the empty string (it would exempt everything) — rejected`;
				journal(cfg, { event: "config_invalid", file: "nana-pack.json", problem, cwd: ctx?.cwd });
				try {
					if (ctx?.hasUI) ctx.ui.notify(`nana-pack: ${displayText(problem)}`, "warning"); // a config diagnostic: display text, like lib/config.ts
				} catch {
					// observability only
				}
			}
			return false;
		});
		return {
			cfg,
			gate: {
				stopReason: g.stopReason,
				allowPatterns,
				extraPatterns: uniq(g.extraPatterns),
				protectedPaths: uniq(g.protectedPaths),
			},
		};
	};
	// Total: path.resolve of a relative cwd throws once process.cwd() is gone — keep the raw key.
	const cwdOf = (ctx: any) => {
		const raw = String(ctx?.cwd ?? ".");
		try {
			return path.resolve(raw);
		} catch {
			return raw;
		}
	};

	pi.on("session_start", async (event, ctx) => {
		try {
			await primeNanaTrust(ctx);
			const { cfg, gate } = livePolicy(ctx);
			const k = cwdOf(ctx);
			const prev = baseline.get(k) ?? ADOPTED.get(k);
			const w = prev ? widening(prev, gate) : null;
			if (w) journal(cfg, { event: "gate_policy_widened", reason: (event as any)?.reason, cwd: ctx.cwd, ...w });
			ADOPTED.set(k, gate);
			baseline.set(k, gate);
		} catch {
			// the first tool_call initialises lazily
		}
	});

	pi.on("tool_call", async (event, ctx) => {
		let subject: string;
		let isCommand: boolean;
		if (event.toolName === "bash" || event.toolName === "powershell") {
			subject = String((event.input as any).command ?? "");
			isCommand = true;
		} else if (event.toolName === "edit" || event.toolName === "write") {
			subject = String((event.input as any).path ?? "");
			isCommand = false;
		} else {
			return undefined; // outside the gate's scope — stays silent, uncounted
		}
		checked += 1;

		let live: Policy;
		try {
			live = livePolicy(ctx).gate;
		} catch (e) {
			// loadConfig is total by contract; if it ever is not, the handler still must not throw.
			live = { extraPatterns: [], allowPatterns: [], protectedPaths: [], stopReason: `policy load failed (${displayText(String(e).slice(0, 120))}) — every gated tool is blocked` };
		}
		const k = cwdOf(ctx);
		let base = baseline.get(k);
		if (!base) {
			base = live; // no session_start fired (bare harness): adopt lazily
			baseline.set(k, base);
			if (!ADOPTED.has(k)) ADOPTED.set(k, base);
		}
		const gate = tighten(base, live);
		// Ratchet: a tightening seen once holds for the session (undoing it is a loosening).
		baseline.set(k, { ...gate, stopReason: null });
		ADOPTED.set(k, { ...gate, stopReason: null });

		// Malformed user (or nana-trusted project) gate block and no valid policy of
		// that file loaded in this process (lib/config.ts): stop conservatively — every gated tool class is blocked, interactive or not.
		if (gate.stopReason) {
			gated += 1;
			publishStatus(ctx);
			return { block: true, reason: `nana-gate: ${gate.stopReason}` };
		}

		const cwd = String((ctx as any).cwd ?? "");
		let hit: Hit;
		try {
			hit = isCommand ? commandHit(subject, gate, cwd) : pathHit(subject, gate, cwd);
		} catch {
			hit = { label: "unanalysable call", reason: "gate analysis failed" };
		}
		if (hit) gated += 1;
		publishStatus(ctx);
		if (!hit) return undefined;

		if (!ctx.hasUI) {
			return { block: true, reason: `nana-gate: ${hit.label} blocked (headless fail-closed): ${hit.reason}` };
		}

		// DISPLAY only: the raw subject above decided the hit; the person sees it through the shared
		// renderers — a command as one line of text (cut shown with …), a path as an escaped path.
		const shown = isCommand ? `${displayText(subject, 400)}${subject.length > 400 ? "…" : ""}` : displayPath(subject);
		const choice = await ctx.ui.select(
			`nana-gate — ${displayText(hit.label, 80)} (${displayText(hit.reason, 400)}) in ${displayText(event.toolName, 40)}:\n\n  ${shown}\n\nAllow?`,
			["Block", "Allow once"],
		);
		if (choice !== "Allow once") {
			return { block: true, reason: "nana-gate: blocked by user" };
		}
		return undefined;
	});
}
