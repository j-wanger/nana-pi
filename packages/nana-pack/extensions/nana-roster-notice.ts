/**
 * @module packages/nana-pack/extensions/nana-roster-notice.ts
 * @purpose Show the roster notice as one widget above the editor at every UI session start.
 * @inputs pi `session_start` events (reason startup, new, resume, fork), pi's active agent dir,
 *  and the user-scope nana-pack.json there
 * @outputs one widget, keyed WIDGET_KEY, holding the roster notice as its only line
 * @effects disk (reads the user-scope nana-pack.json)
 * @errors none — the handler swallows everything; it never throws and never notifies
 */
/**
 * nana-roster-notice — the pi-seat half of the roster notice (CHANGE.md 3.6). Claude Code gets
 * it from a SessionStart hook (claude/hooks/nana-roster-notice.mjs); this extension composes the
 * SAME line from the SAME module (lib/roster-notice.mjs) and shows it as a widget rather than a
 * notify: an info notify would erase another extension's info status at the same start (e.g.
 * nana-handoff's startup pickup notice), where a widget shares no status line and simply stays
 * until the next show replaces it or pi resets the extension UI on new, resume, fork or reload.
 * The widget is shown even when the roster is refused — a whole-file problem already gets
 * config.ts's own warning once, so a second one here would report it twice.
 *
 * No NANA_ROLE check: every NANA_ROLE child runs with no UI (pi-worker, pi-review), so
 * `ctx.hasUI` is already false there and this handler returns immediately.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as path from "node:path";
import { resolveRoster } from "../bin/nana-roster.mjs";
import { rosterNotice } from "../lib/roster-notice.mjs";
import { piAgentDir, piAgentDirIsCwdRelative } from "../lib/agent-dir.mjs";
import { SHOW_SOURCES, WIDGET_KEY } from "../lib/roster-notice-config.mjs";

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (event, ctx) => {
		try {
			if (!ctx.hasUI) return;
			const reason = (event as { reason?: string }).reason;
			if (!reason || !(SHOW_SOURCES as readonly string[]).includes(reason)) return;
			const agentDir = piAgentDir();
			const relative = piAgentDirIsCwdRelative();
			const result = resolveRoster(agentDir);
			const file = path.join(agentDir, "nana-pack.json");
			const notice = rosterNotice(result, file, relative);
			ctx.ui.setWidget(WIDGET_KEY, [notice]);
		} catch {
			// never throw out of a handler
		}
	});
}
