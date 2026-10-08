/**
 * @module packages/nana-setup/lib/verifier-hook.mjs
 * @purpose Convert Claude Code PreToolUse input into an ask decision or fail-open abstention.
 * @inputs parsed hook JSON and optionally an injected pipe-reason predicate.
 * @outputs an optional hook response and an optional diagnostic.
 * @effects none
 * @errors predicate failures become abstentions with diagnostic text.
 */
import { verifierPipeReason } from "../../nana-pack/lib/pipe-guard.mjs";

/** Turn one hook event into a response; unrelated input and errors abstain. */
export function decideHook(input, predicate = verifierPipeReason) {
	try {
		if (input?.hook_event_name !== "PreToolUse" || input?.tool_name !== "Bash" || typeof input?.tool_input?.command !== "string") {
			return { response: null, diagnostic: "malformed or unrelated hook input; abstaining" };
		}
		const reason = predicate(input.tool_input.command);
		return reason
			? { response: { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } }, diagnostic: "" }
			: { response: null, diagnostic: "" };
	} catch (error) {
		return { response: null, diagnostic: `${String(error)}; abstaining` };
	}
}
