/**
 * nana-post-edit — post-edit format/lint/test triggers.
 *
 * After a successful edit/write, runs each configured command whose `match`
 * regex hits the file path. Failures are appended to the tool result so the
 * model sees them immediately and can fix them; successes stay silent.
 *
 * No-op until commands are configured in nana-pack.json, e.g.:
 *   { "postEdit": { "commands": [
 *       { "match": "\\.ts$", "run": "npx prettier --write {file}" },
 *       { "match": "\\.py$", "run": "ruff check {file}" } ] } }
 */

import { exec } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "../lib/config.ts";

function quote(file: string): string {
	return `"${file.replace(/(["\\$`])/g, "\\$1")}"`;
}

function tail(s: string, n: number): string {
	return s.length <= n ? s : `…${s.slice(-n)}`;
}

function run(
	cmd: string,
	cwd: string,
	timeoutMs: number,
	signal: AbortSignal,
	env?: NodeJS.ProcessEnv,
): Promise<{ code: number; out: string }> {
	return new Promise((resolve) => {
		exec(
			cmd,
			{ cwd, env, timeout: timeoutMs, signal, maxBuffer: 1024 * 1024, windowsHide: true },
			(err, stdout, stderr) => {
				const code = err ? (typeof (err as any).code === "number" ? (err as any).code : 1) : 0;
				resolve({ code, out: `${stdout ?? ""}${stderr ?? ""}` });
			},
		);
	});
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_result", async (event, ctx) => {
		if (event.toolName !== "edit" && event.toolName !== "write") return undefined;
		if (event.isError) return undefined;
		const cfg = loadConfig(ctx.cwd);
		if (cfg.postEdit.commands.length === 0) return undefined;
		const file = String((event.input as any).path ?? "");
		if (!file) return undefined;

		const failures: string[] = [];
		for (const c of cfg.postEdit.commands) {
			let re: RegExp;
			try {
				re = new RegExp(c.match);
			} catch {
				continue;
			}
			if (!re.test(file)) continue;
			// win32: exec() goes through cmd.exe, where sh-style quoting corrupts
			// `C:\` paths and %…% expands even inside quotes. Passing the path via
			// an env var and substituting `"%NANA_PI_FILE%"` lets cmd expand it
			// itself — once, non-recursively — so any legal path survives.
			const win = process.platform === "win32";
			const cmd = c.run.replaceAll("{file}", win ? '"%NANA_PI_FILE%"' : quote(file));
			const env = win ? { ...process.env, NANA_PI_FILE: file } : undefined;
			const { code, out } = await run(cmd, ctx.cwd, c.timeoutMs ?? 30_000, ctx.signal, env);
			if (code !== 0) failures.push(`\`${cmd}\` exited ${code}:\n${tail(out, 2000)}`);
		}
		if (failures.length === 0) return undefined;

		if (ctx.hasUI) ctx.ui.notify(`post-edit checks failed: ${file}`, "warning");
		return {
			content: [
				...event.content,
				{
					type: "text" as const,
					text: `[nana-post-edit] ${failures.length} check(s) failed after editing ${file}:\n\n${failures.join("\n\n")}\n\nFix these before proceeding.`,
				},
			],
		};
	});
}
