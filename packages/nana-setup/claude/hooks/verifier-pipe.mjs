#!/usr/bin/env node
/**
 * @module packages/nana-setup/claude/hooks/verifier-pipe.mjs
 * @purpose Run the verifier-pipe decision for one Claude Code Bash PreToolUse event.
 * @inputs Claude Code PreToolUse JSON on stdin.
 * @outputs a hit decision on stdout; errors produce a stderr diagnostic.
 * @effects process (reads stdin and writes stdout/stderr).
 * @errors malformed input and internal errors abstain with a stderr diagnostic.
 */
import { readFileSync } from "node:fs";
import { runHook } from "../../lib/verifier-hook.mjs";
try {
	runHook(readFileSync(0, "utf8"));
} catch (error) {
	process.stderr.write(`nana verifier-pipe: ${String(error)}; abstaining\n`);
}
