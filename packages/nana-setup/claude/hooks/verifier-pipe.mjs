#!/usr/bin/env node
/**
 * @module packages/nana-setup/claude/hooks/verifier-pipe.mjs
 * @purpose Ask before a Claude Code Bash command masks a verifier failure before commit.
 * @inputs Claude Code PreToolUse JSON on stdin.
 * @outputs a hit decision on stdout; errors produce a stderr diagnostic and no decision.
 * @effects process (reads stdin and writes stdout/stderr).
 * @errors malformed input and internal errors abstain with a stderr diagnostic.
 */
import { readFileSync } from "node:fs";
import { decideHook } from "../../lib/verifier-hook.mjs";

/** Run the installed hook protocol with injectable predicate and streams for executable tests. */
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

try {
	runHook(readFileSync(0, "utf8"));
} catch (error) {
	process.stderr.write(`nana verifier-pipe: ${String(error)}; abstaining\n`);
}
