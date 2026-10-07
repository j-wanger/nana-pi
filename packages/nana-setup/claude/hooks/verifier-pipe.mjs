#!/usr/bin/env node
/**
 * @module packages/nana-setup/claude/hooks/verifier-pipe.mjs
 * @purpose Ask before a Claude Code Bash command masks a verifier failure before commit.
 * @inputs Claude Code PreToolUse JSON on stdin.
 * @outputs a PreToolUse permission decision on stdout; diagnostics on stderr.
 * @effects process (reads stdin and writes stdout/stderr).
 * @errors malformed input and internal errors allow the tool and emit a stderr diagnostic.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { decideHook } from "../../lib/verifier-hook.mjs";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	let input;
	try {
		input = JSON.parse(readFileSync(0, "utf8"));
	} catch (error) {
		process.stderr.write(`nana verifier-pipe: ${String(error)}; allowing\n`);
		process.stdout.write(`${JSON.stringify(decideHook(null).response)}\n`);
		process.exit(0);
	}
	const { response, diagnostic } = decideHook(input);
	if (diagnostic) process.stderr.write(`nana verifier-pipe: ${diagnostic}\n`);
	process.stdout.write(`${JSON.stringify(response)}\n`);
}
