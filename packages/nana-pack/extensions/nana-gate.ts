/**
 * nana-gate — pre-tool permission gating.
 *
 * Gates bash/powershell commands matching dangerous patterns and any tool
 * touching protected paths. Interactive sessions confirm via UI (Block is the
 * default choice); headless runs BLOCK fail-closed. Handler errors also block
 * (pi's tool_call is fail-safe upstream).
 *
 * This gate is advisory-by-load-path: anyone can run pi without it. Unattended
 * enforcement belongs to the container/sandbox layer, not here.
 */

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
	/(^|[\s/\\"'])\.ssh([/\\]|\b)/,
	/(^|[\s/\\"'])\.env(\.[\w-]+)?\b/,
];

function truncate(s: string, n: number): string {
	return s.length <= n ? s : `${s.slice(0, n)}…`;
}

export default function (pi: ExtensionAPI) {
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
			return undefined;
		}

		if (compileRegexes(cfg.gate.allowPatterns).some((r) => r.test(subject))) return undefined;

		const dangerousHit = isCommand
			? [...DANGEROUS, ...compileRegexes(cfg.gate.extraPatterns)].find((r) => r.test(subject))
			: undefined;
		const protectedHit = [...PROTECTED_PATHS, ...compileRegexes(cfg.gate.protectedPaths)].find((r) =>
			r.test(subject),
		);
		const hit = dangerousHit ?? protectedHit;
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
