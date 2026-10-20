/**
 * @module packages/nana-setup/lib/claude-config-home.mjs
 * @purpose Select Claude Code's configured home with the same empty-value fallback in setup and its shared-memory hook.
 * @inputs A home directory and env CLAUDE_CONFIG_DIR.
 * @outputs CLAUDE_CONFIG_ENV and the configured value as given, or <home>/.claude when it is empty or unset.
 * @effects none
 * @errors none
 */
import * as path from "node:path";

// Contract value: Claude Code's config-folder variable, also read by the shared-memory hook (R-386).
export const CLAUDE_CONFIG_ENV = "CLAUDE_CONFIG_DIR";

export function claudeConfigHome(home, env = process.env) {
	return env[CLAUDE_CONFIG_ENV] || path.join(home, ".claude");
}
