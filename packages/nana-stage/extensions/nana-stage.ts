/**
 * @module packages/nana-stage/extensions/nana-stage.ts
 * @purpose pi extension that validates, stamps, signs and journals the blocks any tool result carries,
 *  replacing the tool's text with the canonical rendering.
 * @inputs pi `tool_result` events (toolName, toolCallId, input, content, details, structuredContent,
 *  isError), `session_start` for the readiness watcher, env NANA_STAGE_KEY and NANA_STAGE_EXPECT_TOOLS,
 *  and pi.getActiveTools()
 * @outputs a patched tool result (canonical text + stamped blocks, or an isError rejection with every
 *  carrier stripped), one `nana-block` session entry per block, and a `nana-tools` UI status of waiting /
 *  ready / missing
 * @effects disk (block entries appended to pi's session), process (reads then deletes both env vars so tool
 *  subprocesses never inherit the key)
 * @errors none thrown — invalid or over-cap blocks come back as an isError tool result, and a watcher error
 *  downgrades the status and keeps polling
 */
/**
 * nana-stage — the stage ledger (docs/agent-frontend-design-2026-09-04.md §3.2).
 *
 * Hooks tool_result for EVERY tool. If the result carries blocks (details.blocks for
 * pi-extension tools; structuredContent.structuredContent.blocks for pi's built-in MCP
 * tools) it validates them at this boundary, stamps `produced_by` from the tool event, SIGNS the stamp with the
 * per-session key the desk handed this child (NANA_STAGE_KEY; the desk server
 * refuses unsigned blocks on both the live event and the ledger read), appends
 * one `nana-block` session entry per block (durable; not LLM context), and
 * REPLACES the tool's text content with the canonical rendering so the model
 * reads exactly what the stage shows. On failure the carrier is stripped so
 * invalid blocks never ride tool_execution_end into a live stage. Registers no
 * tools, no commands. Without a key (plain TUI use) blocks are stamped, unsigned.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { ENTRY_TYPE, processToolResult } from "../lib/blocks.mjs";
import { signBlock } from "../lib/sign.mjs";

export default function nanaStage(pi: ExtensionAPI): void {
	const key = process.env.NANA_STAGE_KEY || "";
	// Taken once, then scrubbed: tool subprocesses (uv, python, git…) and any
	// extension loaded after this one must not inherit the provenance key.
	delete process.env.NANA_STAGE_KEY;
	const sign = key ? (b: unknown) => signBlock(key, b) : null;
	// Tool readiness (design §11.7): the desk names the tools the app session must
	// have; pi's built-in MCP direct tools register asynchronously (the server connects
	// after session_start), so this reports — via the RPC status channel the desk already
	// tracks — when they are all active, or which are missing after the wait. The desk
	// holds POST /api/session until "ready".
	const expect = (process.env.NANA_STAGE_EXPECT_TOOLS || "").split(",").map((t) => t.trim()).filter(Boolean);
	delete process.env.NANA_STAGE_EXPECT_TOOLS;
	if (expect.length) {
		let watching = false;
		// pi awaits event handlers: the watcher must NOT be awaited from session_start, or
		// the session never starts. It is started once and runs for the process lifetime.
		pi.on("session_start", (_event, ctx) => {
			if (watching) return; // a resume/new-session on the same process re-enters here; one watcher
			watching = true;
			void watch(ctx);
		});
		const watch = async (ctx: { ui: { setStatus(key: string, text: string | undefined): void } }) => {
			const deadline = Date.now() + 30000;
			let last = "";
			const report = (state: string) => { if (state !== last) { last = state; ctx.ui.setStatus("nana-tools", state); } };
			report("waiting");
			// Readiness is not one-shot: the adapter can hot-swap or drop direct tools later
			// (server disconnect, metadata refresh). Keep watching; a disappearance downgrades
			// the status and the desk refuses prompts until the tools are back.
			for (;;) {
				// Rejection boundary (review r4): a throw here must not kill the lifetime watcher
				// and leave a stale "ready" behind; it downgrades and keeps polling.
				try {
					const active = new Set(pi.getActiveTools());
					const missing = expect.filter((t) => !active.has(t));
					if (!missing.length) report("ready");
					else if (last === "ready" || Date.now() > deadline) report(`missing: ${missing.join(",")}`);
				} catch (e) {
					try { report(`missing: watcher error ${(e as Error)?.message || e}`); } catch { /* status channel gone: nothing left to report to */ }
				}
				await new Promise((r) => setTimeout(r, last === "ready" || last.startsWith("missing") ? 2000 : 200));
			}
		};
	}

	pi.on("tool_result", async (event) => {
		const r = processToolResult(
			{
				toolName: event.toolName,
				toolCallId: event.toolCallId,
				input: event.input,
				content: event.content,
				details: event.details,
				structuredContent: event.structuredContent,
				isError: event.isError,
			},
			{ sign },
		);
		if (!r) return undefined;
		for (const block of r.entries) pi.appendEntry(ENTRY_TYPE, block);
		return r.patch;
	});
}
