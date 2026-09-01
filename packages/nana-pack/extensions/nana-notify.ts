/**
 * nana-notify — desktop notification when the agent settles and waits for input.
 *
 * darwin: osascript notification · win32: PowerShell toast · else: OSC 777
 * (terminal protocol, only written when a UI is attached so piped/RPC stdout
 * is never polluted). Headless runs are silent unless notify.headless is true.
 */

import { execFile } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "../lib/config.ts";

function darwinNotify(title: string, body: string): void {
	execFile(
		"osascript",
		["-e", `display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)}`],
		() => {},
	);
}

function windowsNotify(title: string, body: string): void {
	const t = "Windows.UI.Notifications";
	const script = [
		`[${t}.ToastNotificationManager, ${t}, ContentType = WindowsRuntime] > $null`,
		`$xml = [${t}.ToastNotificationManager]::GetTemplateContent([${t}.ToastTemplateType]::ToastText01)`,
		`$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${body}')) > $null`,
		`[${t}.ToastNotificationManager]::CreateToastNotifier('${title}').Show([${t}.ToastNotification]::new($xml))`,
	].join("; ");
	execFile("powershell.exe", ["-NoProfile", "-Command", script], () => {});
}

export default function (pi: ExtensionAPI) {
	pi.on("agent_settled", async (_event, ctx) => {
		const cfg = loadConfig(ctx.cwd);
		if (!cfg.notify.enabled) return;
		if (!ctx.hasUI && !cfg.notify.headless) return;

		const body = "Ready for input";
		if (process.platform === "darwin") darwinNotify("pi", body);
		else if (process.platform === "win32") windowsNotify("pi", body);
		else if (ctx.hasUI) process.stdout.write(`\x1b]777;notify;pi;${body}\x07`);
	});
}
