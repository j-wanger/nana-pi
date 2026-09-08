/**
 * nana-post-edit — post-edit format/lint/test triggers.
 *
 * After a successful edit/write, runs each configured command whose `match`
 * regex hits the file path. Failures are appended to the tool result so the
 * model sees them immediately and can fix them; successes stay silent.
 *
 * Each check ALSO leaves a content-bound receipt (lib/receipts.ts) — for both
 * pass and fail — recording what ran, over which file bytes, and how it exited.
 * That receipt is best-effort evidence a later /nana-verify reads; writing it
 * never changes the feedback fed back to the model.
 *
 * No-op until commands are configured in nana-pack.json, e.g.:
 *   { "postEdit": { "commands": [
 *       { "match": "\\.ts$", "run": "npx prettier --write {file}" },
 *       { "match": "\\.py$", "run": "ruff check {file}" } ] } }
 */

import { exec } from "node:child_process";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "../lib/config.ts";
import {
	type CheckStatus,
	computeInputsDigest,
	isInside,
	receiptsDir,
	writeReceipt,
} from "../lib/receipts.ts";

function quote(file: string): string {
	return `"${file.replace(/(["\\$`])/g, "\\$1")}"`;
}

function tail(s: string, n: number): string {
	return s.length <= n ? s : `…${s.slice(-n)}`;
}

// Classify an exec result into a distinct status. error/timeout/not_run must
// NEVER be folded into checks_passed: a checker that could not run is not a pass.
// Deadline-aware: `timedOut` (elapsed >= the timeout) forces `timeout` even when a
// child traps the kill signal and exits 0 (err === null) — decided BEFORE the
// !err → checks_passed branch, so a killed checker is never recorded as passed.
function classify(err: any, aborted: boolean, timedOut: boolean): CheckStatus {
	if (aborted || err?.name === "AbortError" || err?.code === "ABORT_ERR") return "not_run"; // interrupted
	// Output overflow: exec kills the child (err.killed is set) but no verdict was produced —
	// an error, NOT a timeout. Decide it before the killed → timeout branch below.
	if (err && (err.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" || /maxBuffer/i.test(err.message ?? ""))) return "error";
	if (timedOut || err?.killed) return "timeout"; // deadline fired, or killed by the timeout option
	if (!err) return "checks_passed";
	// shell "command not found" (127) / "found but not executable" (126) / cmd.exe "not recognized" (9009),
	// a direct spawn failure (ENOENT), or permission denied (EACCES) — the checker never produced a verdict.
	if (err.code === "ENOENT" || err.code === "EACCES" || err.code === 127 || err.code === 126 || err.code === 9009) return "error";
	return "checks_failed"; // ran to completion, non-zero exit
}

function run(
	cmd: string,
	cwd: string,
	timeoutMs: number,
	signal: AbortSignal | undefined,
	env?: NodeJS.ProcessEnv,
): Promise<{ code: number; exitCode: number | null; status: CheckStatus; out: string }> {
	return new Promise((resolve) => {
		// Capture the start so classify can be deadline-aware: a child that traps the
		// timeout's kill signal and exits 0 returns err === null, but elapsed >= timeout
		// still marks it `timeout`. (signal === undefined is a valid, harmless exec option.)
		const startedAt = performance.now();
		exec(
			cmd,
			{ cwd, env, timeout: timeoutMs, signal, maxBuffer: 1024 * 1024, windowsHide: true },
			(err, stdout, stderr) => {
				// timeoutMs 0 disables Node's timeout, so there is no deadline to fire.
				const timedOut = timeoutMs > 0 && performance.now() - startedAt >= timeoutMs;
				const code = err ? (typeof (err as any).code === "number" ? (err as any).code : 1) : 0;
				const exitCode = err ? (typeof (err as any).code === "number" ? (err as any).code : null) : 0;
				resolve({
					code,
					exitCode,
					status: classify(err, signal?.aborted ?? false, timedOut),
					out: `${stdout ?? ""}${stderr ?? ""}`,
				});
			},
		);
	});
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_result", async (event, ctx) => {
		if (event.toolName !== "edit" && event.toolName !== "write") return undefined;
		if (event.isError) return undefined;
		const cfg = loadConfig(ctx);
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

			// Receipt side-work is best-effort observability: skip ALL of it when
			// receipts are disabled, and isolate the prep so no config shape or IO can
			// throw into the agent (mirrors appendJournal). The check itself always runs.
			let declared: string[] = [];
			let before: ReturnType<typeof computeInputsDigest> = null;
			if (cfg.receipts.enabled) {
				try {
					// Declared inputs for this checker = the edited file its `match` hit,
					// bound by CONTENTS. Exclude the receipt store itself from any digest.
					const abs = path.isAbsolute(file) ? file : path.join(ctx.cwd, file);
					declared = isInside(abs, receiptsDir(cfg)) ? [] : [abs];
					// Digest BEFORE the check so we can detect a formatter mutating inputs mid-run.
					before = declared.length ? computeInputsDigest(declared, ctx.cwd) : null;
				} catch {
					declared = []; // best-effort by design — never throw into the agent
				}
			}

			const { code, exitCode, status, out } = await run(cmd, ctx.cwd, c.timeoutMs ?? 30_000, ctx.signal, env);

			// Digest AFTER so the binding reflects any in-place formatting. If the
			// inputs changed during the check, the receipt is inconclusive, not current.
			if (cfg.receipts.enabled && declared.length) {
				try {
					const after = computeInputsDigest(declared, ctx.cwd);
					const stable = before != null && after != null && before.digest === after.digest;
					writeReceipt(cfg, {
						v: 1,
						ts: new Date().toISOString(),
						repoRoot: ctx.cwd,
						checker: c.run,
						command: cmd,
						cwd: ctx.cwd,
						status,
						exitCode,
						inputs: after?.inputs ?? [],
						digest: after?.digest ?? "",
						digestBefore: before?.digest ?? null,
						inputsStableDuringCheck: stable,
					});
				} catch {
					// best-effort by design — never throw into the agent
				}
			}

			// Feedback behavior unchanged: the receipt is observability only.
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
