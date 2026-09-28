/**
 * nana-objective — the owner's standing objective + current priority, in every
 * session's system prompt.
 *
 * Ruled 2026-09-16: every session (Claude Code and pi) starts by seeing the same
 * two lines, so it can say which of them its spend serves. Claude Code gets them
 * through a global SessionStart hook; pi gets them here. One file is the source
 * of truth (default ~/.pi/agent/nana-objective.md, usually pointed at the real
 * OBJECTIVE.md via objective.path) — edit that file, and the next agent start
 * everywhere sees the new text.
 *
 * Why this reads on EVERY session_start reason while nana-handoff reads only on
 * "startup"/"new": the handoff is *continuity* — a resumed or forked session
 * already carries that context in its own transcript, so re-injecting it is
 * noise. The objective is *standing governance*, and it lives only in the system
 * prompt, which pi reassembles from scratch at every agent start (see
 * before_agent_start's `systemPrompt`). A resumed, forked or reloaded session is
 * just as able to spend on the wrong thing as a fresh one, so all five reasons
 * (startup, new, resume, fork, reload) pick it up.
 *
 * Per-repo objectives (2026-09-18, parity with ~/.claude/hooks/nana-objective.sh):
 * a product repo now carries its own OBJECTIVE.md, and a session there must be
 * charged against the product's two lines, not the umbrella's. UNCONDITIONALLY (no
 * configuration needed), the nearest <dir>/OBJECTIVE.md walking UP from the session
 * cwd wins; the user-scope objective.path is the fallback (the program file), whose
 * objective and current priority are shown alongside a product's. Only the OWNER, at
 * user scope, can rename the file looked for (objective.projectFile) — a repo cannot,
 * and cannot turn the fallback or the whole feature off.
 *
 * Config (nana-pack.json): objective.enabled (default true), objective.path
 * (default ~/.pi/agent/nana-objective.md; "~/" expands, a RELATIVE path resolves
 * against ~/.pi/agent and NEVER against cwd), objective.projectFile (default null
 * = "OBJECTIVE.md"; false also means the default name — the walk is never off). USER SCOPE ONLY — see lib/config.ts.
 *
 * Resolution and rendering live in ONE place, lib/objective.ts (lane T2a,
 * 2026-09-28) — the Claude Code hook runs bin/nana-objective.mjs over the same
 * module, so both runtimes print byte-identical text (tests/objective-golden).
 * Imported here rather than spawned: session_start stays synchronous, in-process
 * and free of a node-on-PATH dependency. This file only journals, notifies and
 * injects. When a product file governs, the program objective AND current
 * priority are shown with the precedence stated (Jake's ruling 1, 2026-09-28).
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendJournal, loadConfig } from "../lib/config.ts";
import { produceObjective } from "../lib/objective.ts";

export default function (pi: ExtensionAPI) {
	// The whole block (heading first) exactly as lib/objective.ts rendered it. null only when off.
	let block: string | null = null;

	pi.on("session_start", async (_event, ctx) => {
		// every reason, deliberately — see the header comment
		// Cleared BEFORE the enabled check: a live config toggle to enabled:false
		// must not leave the previous session's objective text cached and injectable.
		block = null;
		try {
			const cfg = loadConfig(ctx);
			if (!cfg.objective.enabled) return;
			const r = produceObjective(ctx.cwd, cfg.objective);
			block = r.text;
			const ts = new Date().toISOString();
			for (const e of r.events) appendJournal(cfg, { ts, cwd: ctx.cwd, ...e });
			if (ctx.hasUI) for (const n of r.notices) ctx.ui.notify(n, "warning");
		} catch {
			// never throw out of a handler; produceObjective itself cannot throw
		}
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!block) return undefined;
		if (!loadConfig(ctx).objective.enabled) return undefined;
		return { systemPrompt: `${(event as any).systemPrompt}\n\n${block}` };
	});
}
