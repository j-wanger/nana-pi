/**
 * @module packages/nana-pack/extensions/nana-frontier-summary.ts
 * @purpose Inject the current project frontier block into every pi session start.
 * @inputs pi session_start and before_agent_start events, ctx.cwd, and optional date/environment seams.
 * @outputs The frontier block in the nana-frontier system-prompt section, or no section when inapplicable.
 * @effects disk (reads HANDOFF.md), process and network (budget-bounded gh calls through frontier-summary.mjs)
 * @errors none; every handler catches failures and never throws into pi.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { frontierSummary } from "../lib/frontier-summary.mjs";
import { FRONTIER_SECTION } from "../lib/frontier-summary-config.mjs";

export default function (pi: ExtensionAPI, opts: { today?: string; env?: NodeJS.ProcessEnv } = {}) {
	let block: string | null = null;
	pi.on("session_start", async (_event, ctx) => {
		block = null;
		try {
			block = frontierSummary({ cwd: ctx.cwd, today: opts.today, env: opts.env ?? process.env });
		} catch {
			block = null;
		}
	});
	pi.on("before_agent_start", async (event, _ctx) => {
		if (!block) return undefined;
		try {
			(event as any).systemPromptOptions.sections[FRONTIER_SECTION] = block;
		} catch {
			// A malformed event must not throw out of an extension handler.
		}
		return undefined;
	});
}
