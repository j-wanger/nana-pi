/**
 * nana-gate — pre-tool permission gating.
 *
 * Gates bash/powershell commands matching dangerous patterns and any tool
 * touching protected paths. Interactive sessions confirm via UI (Block is the
 * default choice); headless runs BLOCK fail-closed. Handler errors also block
 * (pi's tool_call is fail-safe upstream). A running `gate ✓ N checked · M gated`
 * status shows the gate is live even when it is letting everything through.
 *
 * This gate is advisory-by-load-path: anyone can run pi without it. Unattended
 * enforcement belongs to the container/sandbox layer, not here.
 */

import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { compileRegexes, loadConfig } from "../lib/config.ts";

const DANGEROUS: RegExp[] = [
	/\brm\s+-[a-z]*r[a-z]*f/i, // rm -rf, -Rf, -r ... -f combined short flags
	/\brm\s+-[a-z]*f[a-z]*r/i, // rm -fr
	/\brm\s+.*(--recursive|--force|--no-preserve-root)/i,
	/\bsudo\b/,
	/\bgit\s+push\b[^|;&]*(\s--force\b|\s-f\b)/,
	/\bgit\s+reset\s+--hard/,
	/\bgit\s+clean\b[^|;&]*\s-[a-z]*f/i,
	/\b(chmod|chown)\b[^|;&]*\b777\b/,
	/\bdd\b[^|;&]*\bof=\/dev\//,
	/\bmkfs\b/,
	/\b(shutdown|reboot|halt)\b/,
	/Remove-Item\b[^|;&]*(-Recurse|-Force)/i,
	/\b(rd|rmdir)\b[^|;&]*\s\/s\b/i, // cmd.exe: rd /s /q
	/\b(del|erase)\b[^|;&]*\s\/[fsq]\b/i, // cmd.exe: del /f /s /q (+ its erase alias)
	/\bformat\s+[a-z]:(\s|$)/i, // disk format (colon guard keeps `ruff format c:\…` safe)
];

const PROTECTED_PATHS: RegExp[] = [
	/\.pi[/\\]agent[/\\]auth\.json/i,
	/\.pi[/\\]agent[/\\]settings\.json/i,
	// L1 (2026-09-28): the gate's own policy and pi's trust store are trust EVIDENCE for
	// project-scope config; a tool write to either could forge a wider policy for the next
	// process (sol L1 r2). L2 adds the bash/PowerShell redirection forms and segment rules.
	/\.pi[/\\]agent[/\\]trust\.json/i,
	/\.pi[/\\](agent[/\\])?nana-pack\.json/i,
	/(^|[\s/\\"'])\.ssh([/\\]|\b)/,
	/(^|[\s/\\"'])\.env(\.[\w-]+)?\b/,
];

// Protected-path checks run on the RESOLVED path, not the model's raw string:
// `~/.pi/agent/../agent/trust.json` and `.pi/x/../nana-pack.json` both resolve onto a
// policy file, and a raw-string regex misses them (sol L1 r3). Mirrors pi's own
// `resolveToCwd` (dist/core/tools/path-utils.js) the same way nana-post-edit.ts does —
// unicode spaces folded, leading `@` stripped, win32 shell paths converted, `~` expanded,
// file:// converted — so the gate checks the file pi will actually open. Copied, not
// imported: post-edit is another lane's file. L2 may factor both into one lib.
const UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

function normalizeWindowsShellPath(filePath: string): string {
	if (!filePath.startsWith("/") || filePath.startsWith("//") || filePath.includes("\\")) return filePath;
	const match = filePath.match(/^\/(?:mnt\/|cygdrive\/)?([a-z])(?:\/(.*))?$/i);
	if (!match) return filePath;
	const suffix = match[2]?.replaceAll("/", "\\");
	return `${match[1].toUpperCase()}:\\${suffix ?? ""}`;
}

function normalizeToolPath(input: string): string {
	let normalized = input.replace(UNICODE_SPACES, " ");
	if (normalized.startsWith("@")) normalized = normalized.slice(1);
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
			return normalized; // a malformed file:// URL must never throw out of the gate
		}
	}
	return normalized;
}

// Never throws: a resolution failure degrades to the raw subject, which is still matched.
function resolveToolPath(filePath: string, cwd: string): string {
	try {
		const normalized = normalizeToolPath(filePath);
		const base = normalizeToolPath(cwd || ".");
		return path.isAbsolute(normalized) ? path.resolve(normalized) : path.resolve(base, normalized);
	} catch {
		return filePath;
	}
}

function truncate(s: string, n: number): string {
	return s.length <= n ? s : `${s.slice(0, n)}…`;
}

export default function (pi: ExtensionAPI) {
	// Per-session counters (this closure is created once per extension load).
	// `checked` = tool calls the gate actually inspected; `gated` = the ones that
	// hit a pattern and had to be decided (a dialog interactively, a fail-closed
	// block headless). A silent gate is indistinguishable from an absent one, so
	// the running tally is the happy-path signal.
	let checked = 0;
	let gated = 0;
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

	pi.on("tool_call", async (event, ctx) => {
		const cfg = loadConfig(ctx);

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

		// Malformed user gate block and no valid policy loaded in this process
		// (lib/config.ts): stop conservatively — every gated tool class is blocked,
		// interactive or not, until the owner repairs the file.
		if (cfg.gate.stopReason) {
			gated += 1;
			publishStatus(ctx);
			return { block: true, reason: `nana-gate: ${cfg.gate.stopReason}` };
		}

		if (compileRegexes(cfg.gate.allowPatterns).some((r) => r.test(subject))) {
			publishStatus(ctx);
			return undefined;
		}

		const dangerousHit = isCommand
			? [...DANGEROUS, ...compileRegexes(cfg.gate.extraPatterns)].find((r) => r.test(subject))
			: undefined;
		// Match the raw subject AND the resolved path: raw keeps every documented
		// pattern working on relative forms, resolved closes `..` traversal (sol L1 r3).
		const pathSubjects = isCommand ? [subject] : [subject, resolveToolPath(subject, String((ctx as any).cwd ?? ""))];
		const protectedHit = [...PROTECTED_PATHS, ...compileRegexes(cfg.gate.protectedPaths)].find((r) =>
			pathSubjects.some((p) => r.test(p)),
		);
		const hit = dangerousHit ?? protectedHit;
		if (hit) gated += 1;
		publishStatus(ctx);
		if (!hit) return undefined;

		const label = dangerousHit ? "dangerous command" : "protected path";
		if (!ctx.hasUI) {
			return { block: true, reason: `nana-gate: ${label} blocked (headless fail-closed): ${hit}` };
		}

		const choice = await ctx.ui.select(
			`nana-gate — ${label} (${hit}) in ${event.toolName}:\n\n  ${truncate(subject, 400)}\n\nAllow?`,
			["Block", "Allow once"],
		);
		if (choice !== "Allow once") {
			return { block: true, reason: "nana-gate: blocked by user" };
		}
		return undefined;
	});
}
