/**
 * @module packages/nana-pack/lib/objective-path.mjs
 * @purpose Resolve objective.path exactly once, so the objective producer, nana-setup's installer
 *  and its doctor can never disagree about which file governs.
 * @inputs a raw objective.path value (any JSON type) and { home, agentDir, platform } — the home
 *  folder, pi's active agent dir, and the platform whose path flavour and tilde rules apply
 * @outputs resolveObjectivePath(value, opts) — the absolute file path the resolver picks, as a string
 *  in the chosen platform's path flavour — and DEFAULT_OBJECTIVE_FILE ("nana-objective.md")
 * @effects none
 * @errors none
 */
// One resolver for objective.path (lane objective-path-shapes, 2026-10-20). Before this file,
// packages/nana-pack/lib/objective.ts and packages/nana-setup/lib/steps.mjs each hand-rolled the
// same rule, and the nana-setup copy crashed on a non-string, non-null value (`p.startsWith` on a
// number, a boolean, an object or an array) instead of treating it as the default — drift between
// two copies of the rule was the bug. Both now call this.
import path from "node:path";

/** contract value, R-004: the default objective source's filename, resolved under agentDir. */
export const DEFAULT_OBJECTIVE_FILE = "nana-objective.md";

/**
 * `value` is objective.path exactly as read from JSON — any type. A non-string value, or "",
 * resolves to `<agentDir>/DEFAULT_OBJECTIVE_FILE`. "~" resolves to home. A leading `~/` resolves
 * under home on every platform; a leading `~\` resolves under home only where `platform` is
 * "win32" (pi's normalizePath rule, as agent-dir.mjs's piNormalizePath copies it — elsewhere `~\`
 * is just part of a name, resolved under agentDir like any other relative value). An absolute
 * value (judged in the chosen platform's own flavour) stays unchanged; anything else resolves
 * under agentDir, never cwd. `platform` picks path.win32 or path.posix, so the win32 branch is
 * checkable on a Mac.
 */
export function resolveObjectivePath(value, { home, agentDir, platform }) {
	const p = platform === "win32" ? path.win32 : path.posix;
	if (typeof value !== "string" || value === "") return p.join(agentDir, DEFAULT_OBJECTIVE_FILE);
	if (value === "~") return home;
	if (value.startsWith("~/")) return p.join(home, value.slice(2));
	if (platform === "win32" && value.startsWith("~\\")) return p.join(home, value.slice(2));
	return p.isAbsolute(value) ? value : p.join(agentDir, value);
}
