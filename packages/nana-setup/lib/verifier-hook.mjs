/**
 * @module packages/nana-setup/lib/verifier-hook.mjs
 * @purpose Convert Claude Code PreToolUse input into an ask decision or fail-open abstention.
 * @inputs parsed hook JSON (tool_name Bash or PowerShell) and optionally an injected pipe-reason predicate.
 * @outputs an optional hook response and an optional diagnostic; runHook writes protocol output.
 * @effects process (runHook writes stdout and stderr).
 * @errors predicate failures become abstentions with diagnostic text.
 */
import { verifierPipeReason } from "../../nana-pack/lib/pipe-guard.mjs";

/** Turn one hook event into a response; unrelated input and errors abstain. R-1054: a PowerShell
 *  event is judged with the pipe guard's PowerShell dialect (R-1062) — the PowerShell tool's
 *  input "fields match the Bash tool, with the command string in `command`" (hooks#powershell). */
export function decideHook(input, predicate = verifierPipeReason) {
	try {
		const tool = input?.tool_name;
		if (input?.hook_event_name !== "PreToolUse" || (tool !== "Bash" && tool !== "PowerShell") || typeof input?.tool_input?.command !== "string") {
			return { response: null, diagnostic: "malformed or unrelated hook input; abstaining" };
		}
		const reason = predicate(input.tool_input.command, tool === "PowerShell" ? "powershell" : "bash");
		return reason
			? { response: { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } }, diagnostic: "" }
			: { response: null, diagnostic: "" };
	} catch (error) {
		return { response: null, diagnostic: `${String(error)}; abstaining` };
	}
}

/** Run the protocol from already-read input; importing this module never reads stdin. */
export function runHook(rawInput, { predicate, stdout = process.stdout, stderr = process.stderr } = {}) {
	let input;
	try {
		input = JSON.parse(rawInput);
	} catch (error) {
		stderr.write(`nana verifier-pipe: ${String(error)}; abstaining\n`);
		return;
	}
	const { response, diagnostic } = decideHook(input, predicate);
	if (diagnostic) stderr.write(`nana verifier-pipe: ${diagnostic}\n`);
	if (response) stdout.write(`${JSON.stringify(response)}\n`);
}
