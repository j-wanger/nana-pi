/**
 * @module packages/nana-pack/extensions/nana-writing.ts
 * @purpose Append the "Writing for Jake" rule to every session's system prompt, read fresh at
 *  every session_start so a reload picks up an edit — the seventh pack extension.
 * @inputs pi `session_start` (every reason) and `before_agent_start` events; the shipped rule
 *  file packages/nana-pack/rules/nana-writing.md; ctx (cwd)
 * @outputs the rule block appended under "## Writing for Jake (nana)"; one journal line
 *  (writing_rule_unavailable) when the file is missing, unreadable or not valid UTF-8
 * @effects disk (reads the rule file; appends the journal)
 * @errors none — the handler swallows everything; an unusable rule injects nothing rather than
 *  throwing or blanking the prompt
 */
/**
 * nana-writing — the companion to nana-objective (design-ruling.md Amendment 1, 2026-10-04,
 * §A1, after astra r1 MUST 1): delivery moved from an agent-dir AGENTS.md link to a pack
 * extension, because pi selects the first usable file of five names per directory
 * (AGENTS.override.md, AGENTS.md, AGENTS.MD, CLAUDE.md, CLAUDE.MD) and a link in that race can
 * both hide a user's own file AND be hidden by one. An append replaces nothing: no context
 * file, project prompt or override can remove it.
 *
 * Uses the exact call nana-objective.ts uses: read at `session_start` for every reason
 * (R-754 — a reload must pick up an edit to the rule), append
 * `${event.systemPrompt}\n\n${block}` at `before_agent_start`. Verified against the installed
 * pi 1.0.2 (`dist/core/extensions/runner.js` emitBeforeAgentStart): `event.systemPrompt` is a
 * live getter over a SHARED options object, and a handler's `{systemPrompt}` return sets that
 * object's `forceSystemPrompt` — so a later-registered extension's `event.systemPrompt` sees
 * the EARLIER one's already-appended text, and composition holds (both blocks reach the
 * model, each once). See writing-injection.test.mjs's pi-1.0.2 harness.
 *
 * The rule file is NOT user-configurable (unlike the objective's): one file, shipped with the
 * pack, read from where it lives on disk regardless of cwd.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { appendJournal, loadConfig } from "../lib/config.ts";
import { WRITING_INJECT_CAP } from "../lib/writing-config.mjs";

/** The shipped rule file. */
export const RULE_PATH = fileURLToPath(new URL("../rules/nana-writing.md", import.meta.url));

export const HEADING = "## Writing for Jake (nana)";

export interface BuildResult {
	block: string | null;
	cause: string | null;
}

/**
 * Read the rule file and build the injected block. `{ block: null, cause }` when the file is
 * missing, unreadable or not valid UTF-8 (R-752). Otherwise the block is capped at
 * WRITING_INJECT_CAP chars with the cut announced inside the text (R-753).
 */
export function buildBlock(rulePath: string = RULE_PATH): BuildResult {
	let bytes: Buffer;
	try {
		bytes = fs.readFileSync(rulePath);
	} catch (err) {
		return { block: null, cause: `unreadable (${(err as Error).message})` };
	}
	let text: string;
	try {
		text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return { block: null, cause: "not valid UTF-8" };
	}
	const full = `${HEADING}\n\n${text}`;
	if (full.length <= WRITING_INJECT_CAP) return { block: full, cause: null };
	const notice = `\n\n…(cut at ${WRITING_INJECT_CAP} chars)`;
	const keep = Math.max(0, WRITING_INJECT_CAP - notice.length);
	return { block: `${full.slice(0, keep)}${notice}`, cause: null };
}

export default function (pi: ExtensionAPI) {
	let block: string | null = null;

	pi.on("session_start", async (_event, ctx) => {
		// every reason, deliberately — R-754: a reload must re-read the file from disk
		block = null;
		try {
			const { block: b, cause } = buildBlock();
			block = b;
			if (cause) {
				const cfg = loadConfig(ctx);
				appendJournal(cfg, { ts: new Date().toISOString(), cwd: ctx.cwd, event: "writing_rule_unavailable", cause });
			}
		} catch {
			// never throw out of a handler
		}
	});

	pi.on("before_agent_start", async (event, _ctx) => {
		if (!block) return undefined;
		return { systemPrompt: `${(event as any).systemPrompt}\n\n${block}` };
	});
}
