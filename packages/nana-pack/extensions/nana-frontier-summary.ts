/**
 * @module packages/nana-pack/extensions/nana-frontier-summary.ts
 * @purpose Inject the current project frontier and deliver live owner issue comments to UI seat sessions.
 * @inputs pi session_start and before_agent_start events, ctx.cwd, and optional date/environment seams.
 * @outputs The frontier block in the nana-frontier system-prompt section, or no section when inapplicable.
 * @effects disk (reads HANDOFF.md), process and network (budget-bounded gh calls through frontier-summary.mjs)
 * @errors none; every handler catches failures and never throws into pi.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { frontierSummary } from "../lib/frontier-summary.mjs";
import { FRONTIER_SECTION, LAUNCHER_ROLES } from "../lib/frontier-summary-config.mjs";
import { watchIssues } from "../lib/issue-watch.mjs";

type WatchOptions = Parameters<typeof watchIssues>[0];
export default function (pi: ExtensionAPI, opts: { today?: string; env?: NodeJS.ProcessEnv; clock?: WatchOptions["clock"]; runGh?: WatchOptions["runGh"] } = {}) {
	let block: string | null = null;
	let watch: ReturnType<typeof watchIssues> | null = null;
	const stop = () => { watch?.stop(); watch = null; };
	pi.on("session_start", async (_event, ctx) => {
		stop();
		block = null;
		const env = opts.env ?? process.env;
		try {
			block = frontierSummary({ cwd: ctx.cwd, today: opts.today, env });
			if (ctx.hasUI && !LAUNCHER_ROLES.includes(env.NANA_ROLE)) {
				watch = watchIssues({ root: ctx.cwd, env, clock: opts.clock, runGh: opts.runGh, continuous: true,
					onOwner: (content: string) => {
						pi.sendMessage({ customType: FRONTIER_SECTION, content, display: true }, { triggerTurn: true, deliverAs: "steer" });
					},
				});
			}
		} catch {
			block = null;
		}
	});
	pi.on("session_shutdown", async () => { stop(); });
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
