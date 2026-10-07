/**
 * @module packages/nana-setup/lib/trust-decision.mjs
 * @purpose Apply trust confirmation and dry-run decisions before invoking the trust-store writer.
 * @inputs yes/dryRun flags, an async confirmation callback, and a trust-store writer callback.
 * @outputs whether trust was recorded and the decision label for CLI reporting.
 * @effects process (invokes the supplied writer only after affirmative confirmation outside dry-run).
 * @errors confirmation and writer errors propagate to the caller.
 */
export async function decideTrust({ yes, dryRun, confirm, write }) {
	if (!yes && !(await confirm())) return { recorded: false, decision: "declined" };
	if (dryRun) return { recorded: false, decision: "would record affirmative trust" };
	write();
	return { recorded: true, decision: "recorded affirmative trust" };
}
