#!/usr/bin/env node
/**
 * @module packages/nana-setup/claude/hooks/verifier-pipe.mjs
 * @purpose Run the verifier-pipe decision for one Claude Code Bash or PowerShell PreToolUse event.
 * @inputs Claude Code PreToolUse JSON on stdin.
 * @outputs a hit decision on stdout; errors produce a stderr diagnostic.
 * @effects process (reads stdin and writes stdout/stderr).
 * @errors malformed input and internal errors abstain with a stderr diagnostic; a stdout error, such as a reader that closed it, is ignored and the hook exits 0.
 */
import { readFileSync } from "node:fs";
import { runHook } from "../../lib/verifier-hook.mjs";

// R-1944: Ignore every stdout error so a closed hook reader cannot fail the hook.
process.stdout.on("error", () => {});

try {
	runHook(readFileSync(0, "utf8"));
} catch (error) {
	process.stderr.write(`nana verifier-pipe: ${String(error)}; abstaining\n`);
}
