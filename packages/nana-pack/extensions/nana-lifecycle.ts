/**
 * nana-lifecycle — session lifecycle observability.
 *
 * Appends session events (start/compaction/shutdown) as JSONL to the nana
 * journal (~/.pi/agent/nana-journal.jsonl by default) and surfaces compaction
 * in the UI. The footer shows "nana-pack ✓" so a loaded pack is visible.
 *
 * Also owns /reload-runtime — the only way a non-TUI host (the desk, any RPC
 * client) can make a running session pick up a skill added after it started.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendJournal, type ConfigContext, loadConfig } from "../lib/config.ts";

export default function (pi: ExtensionAPI) {
	const log = (ctx: ConfigContext, event: string, extra: Record<string, unknown> = {}) => {
		appendJournal(loadConfig(ctx), {
			ts: new Date().toISOString(),
			event,
			cwd: ctx.cwd,
			pid: process.pid,
			...extra,
		});
	};

	pi.on("session_start", async (event, ctx) => {
		log(ctx, "session_start", { reason: (event as any).reason });
		if (ctx.hasUI) ctx.ui.setStatus("nana-pack", ctx.ui.theme.fg("dim", "nana-pack ✓"));
	});

	pi.on("session_before_compact", async (_event, ctx) => {
		log(ctx, "session_before_compact");
		return undefined;
	});

	pi.on("session_compact", async (_event, ctx) => {
		log(ctx, "session_compact");
		if (ctx.hasUI) ctx.ui.notify("context compacted", "info");
	});

	pi.on("session_compact_failed", async (_event, ctx) => {
		log(ctx, "session_compact_failed");
		if (ctx.hasUI) ctx.ui.notify("compaction FAILED", "error");
	});

	pi.on("session_shutdown", async (event, ctx) => {
		log(ctx, "session_shutdown", { reason: (event as any).reason });
	});

	// pi scans skill/extension/prompt/context locations at STARTUP only. The TUI
	// has a built-in /reload; RPC has no reload command at all, so an extension
	// command is the documented entrypoint (docs/extensions.md "ctx.reload()").
	// It re-reads settings.json first, so a skills folder added from the desk's
	// ⚙ → Skills tab counts, then re-discovers resources.
	//
	// NOT named "reload": pi treats an extension command whose name matches a
	// built-in interactive one as a conflict — "Skipping in autocomplete" at every
	// TUI start (dist/modes/interactive/interactive-mode.js), and the built-in
	// would shadow this handler there anyway. Same name as pi's own docs example.
	pi.registerCommand("reload-runtime", {
		description: "Reload extensions, skills, prompt templates and context files (same as the TUI /reload)",
		handler: async (_args, ctx) => {
			// Terminal by contract: everything after this runs from the pre-reload
			// version of this extension, on a ctx that is already stale.
			await ctx.reload();
			return;
		},
	});
}
