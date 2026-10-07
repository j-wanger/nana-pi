/**
 * @module packages/nana-setup/lib/verifier-hook.mjs
 * @purpose Convert Claude Code PreToolUse input into a fail-open verifier-pipe decision.
 * @inputs parsed hook JSON and optionally an injected pipe-reason predicate.
 * @outputs a hook response object and an optional diagnostic.
 * @effects none
 * @errors predicate failures become allow responses with diagnostic text.
 */
import { verifierPipeReason } from "../../nana-pack/lib/pipe-guard.mjs";

const allowResponse = { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow" } };

/** Turn one hook event into a response; injected predicate errors fail open. */
export function decideHook(input, predicate = verifierPipeReason) {
	try {
		if (input?.hook_event_name !== "PreToolUse" || input?.tool_name !== "Bash" || typeof input?.tool_input?.command !== "string") {
			return { response: allowResponse, diagnostic: "malformed or unrelated hook input; allowing" };
		}
		const reason = predicate(input.tool_input.command);
		return reason
			? { response: { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } }, diagnostic: "" }
			: { response: allowResponse, diagnostic: "" };
	} catch (error) {
		return { response: allowResponse, diagnostic: `${String(error)}; allowing` };
	}
}
