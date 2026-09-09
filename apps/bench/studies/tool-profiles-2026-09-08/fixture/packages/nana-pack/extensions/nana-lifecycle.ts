/**
 * nana-lifecycle — session lifecycle observability.
 *
 * Appends session events (start/compaction/shutdown) as JSONL to the nana
 * journal (~/.pi/agent/nana-journal.jsonl by default) and surfaces compaction
 * in the UI. The footer shows "nana-pack ✓" so a loaded pack is visible.
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
}
