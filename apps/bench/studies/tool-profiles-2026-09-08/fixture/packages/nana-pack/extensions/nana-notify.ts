/**
 * nana-notify — desktop notification when the agent settles and waits for input.
 *
 * darwin: osascript notification · win32: PowerShell toast · else: OSC 777
 * (terminal protocol, only written when a UI is attached so piped/RPC stdout
 * is never polluted). Headless runs are silent unless notify.headless is true.
 *
 * The OS notifier is best-effort and can fail on a machine we never see (no
 * WinRT toast registration, a locked-down PowerShell, osascript denied). It used
 * to fail SILENTLY — the execFile callbacks swallowed everything — so a Windows
 * session simply got no notification and no trace of why. A failure now falls
 * back to the in-app notification (TUI + desk toast) and leaves a
 * `notify_fallback` journal line carrying the reason — and the notifier runs
 * under a deadline, so a HUNG one fails over too instead of holding the pipe
 * open forever.
 */

import { execFile } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendJournal, loadConfig } from "../lib/config.ts";

type OnFail = (reason: string) => void;

/**
 * Deadline for the OS notifier. A notification nobody has seen after this long
 * has already failed for the user, and an unbounded child is worse than a late
 * one: it holds the pipe (and the Node process) open and the fallback never
 * fires. execFile kills the child at the deadline and reports it through `err`.
 */
const NOTIFIER_TIMEOUT_MS = 8000;

/**
 * A structured PowerShell error record on stderr. Matched narrowly ON PURPOSE:
 * the plain word "exception" appears in perfectly healthy output (a path like
 * `C:\Exception Reports\…`), so only the record's own shape counts — the
 * line-anchored `CategoryInfo :` / `FullyQualifiedErrorId :` fields, or the
 * `Exception calling "Member"` wrapper a failed WinRT call produces.
 *
 * CAVEAT: these labels ARE localized by PowerShell's UI culture, so a
 * non-English Windows can print an error record this does not match. That case
 * degrades to today's behaviour (a missed exit-0 failure), never to a false
 * alarm; the `err` path — spawn failure, non-zero exit, timeout — is unaffected
 * and language-independent.
 */
const PS_ERROR_RECORD = /^[\s+]*(?:CategoryInfo|FullyQualifiedErrorId)\s*:/m;
const PS_EXCEPTION_CALL = /Exception calling "[^"]*"/;

/**
 * Why the platform notifier failed, or null when it worked.
 *
 * execFile reports a spawn failure (ENOENT — no powershell.exe on PATH), a
 * non-zero exit (`err.code` is the exit code) AND the deadline (`err.killed`
 * with the kill signal) all through `err`. PowerShell additionally exits 0
 * while printing a non-terminating error record to stderr, so a clean exit
 * alone is not proof a toast appeared.
 *
 * Exported for the test that pins those shapes deterministically — the
 * extension itself calls it only from the two notifier callbacks below.
 */
export function notifierFailure(err: unknown, stderr: string | undefined): string | null {
	if (err) {
		const e = err as { code?: unknown; signal?: string; killed?: boolean; message?: string };
		const label = e.killed && e.signal ? `killed (${e.signal})` : e.code === undefined || e.code === null ? "" : String(e.code);
		return `${label ? `${label}: ` : ""}${e.message ?? String(err)}`.slice(0, 300);
	}
	const s = String(stderr ?? "").trim();
	if (s && (PS_ERROR_RECORD.test(s) || PS_EXCEPTION_CALL.test(s))) return s.slice(0, 300);
	return null;
}

function darwinNotify(title: string, body: string, onFail: OnFail): void {
	execFile(
		"osascript",
		["-e", `display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)}`],
		{ timeout: NOTIFIER_TIMEOUT_MS, windowsHide: true },
		(err, _stdout, stderr) => {
			const reason = notifierFailure(err, stderr);
			if (reason) onFail(reason);
		},
	);
}

function windowsNotify(title: string, body: string, onFail: OnFail): void {
	const t = "Windows.UI.Notifications";
	const script = [
		`[${t}.ToastNotificationManager, ${t}, ContentType = WindowsRuntime] > $null`,
		`$xml = [${t}.ToastNotificationManager]::GetTemplateContent([${t}.ToastTemplateType]::ToastText01)`,
		`$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${body}')) > $null`,
		`[${t}.ToastNotificationManager]::CreateToastNotifier('${title}').Show([${t}.ToastNotification]::new($xml))`,
	].join("; ");
	// -NonInteractive: a toast notifier must never stop to ask the console
	// anything — a prompt here is an invisible hang. (No -ExecutionPolicy
	// override: -Command runs a string, which policy does not gate anyway.)
	execFile(
		"powershell.exe",
		["-NoProfile", "-NonInteractive", "-Command", script],
		{ timeout: NOTIFIER_TIMEOUT_MS, windowsHide: true },
		(err, _stdout, stderr) => {
			const reason = notifierFailure(err, stderr);
			if (reason) onFail(reason);
		},
	);
}

export default function (pi: ExtensionAPI) {
	pi.on("agent_settled", async (_event, ctx) => {
		const cfg = loadConfig(ctx);
		if (!cfg.notify.enabled) return;
		if (!ctx.hasUI && !cfg.notify.headless) return;

		const body = "Ready for input";
		// Runs AFTER this handler has resolved, so it must not throw: an
		// exception here would surface as an unhandled rejection in the agent.
		const onFail = (reason: string) => {
			try {
				appendJournal(cfg, {
					ts: new Date().toISOString(),
					event: "notify_fallback",
					cwd: ctx.cwd,
					platform: process.platform,
					reason,
				});
				if (ctx.hasUI) ctx.ui.notify(body, "info");
			} catch {
				// best-effort by design
			}
		};

		if (process.platform === "darwin") darwinNotify("pi", body, onFail);
		else if (process.platform === "win32") windowsNotify("pi", body, onFail);
		else if (ctx.hasUI) process.stdout.write(`\x1b]777;notify;pi;${body}\x07`);
	});
}
