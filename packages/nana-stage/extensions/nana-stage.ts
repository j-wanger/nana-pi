/**
 * nana-stage — the stage ledger (docs/agent-frontend-design-2026-09-04.md §3.2).
 *
 * Hooks tool_result for EVERY tool. If the result carries blocks (details.blocks
 * for pi-extension tools; details.mcpResult.structuredContent.blocks for MCP
 * tools through pi-mcp-adapter in "bounded" mode) it validates them at this
 * boundary, stamps `produced_by` from the tool event, appends one `nana-block`
 * session entry per block (durable; not LLM context), and REPLACES the tool's
 * text content with the canonical rendering so the model reads exactly what
 * the stage shows. On failure the carrier is stripped so invalid blocks never
 * ride tool_execution_end into a live stage. Registers no tools, no commands.
 *
 * Load it LAST in the manifest's extension list: tool_result handlers chain in
 * load order and this one must be the final block-relevant mutator.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { ENTRY_TYPE, processToolResult } from "../lib/blocks.mjs";

export default function nanaStage(pi: ExtensionAPI): void {
	pi.on("tool_result", async (event) => {
		const r = processToolResult({
			toolName: event.toolName,
			toolCallId: event.toolCallId,
			input: event.input,
			content: event.content,
			details: event.details,
			isError: event.isError,
		});
		if (!r) return undefined;
		for (const block of r.entries) pi.appendEntry(ENTRY_TYPE, block);
		return r.patch;
	});
}
