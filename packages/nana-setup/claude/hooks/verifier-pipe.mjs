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

/** Run the installed hook protocol with injectable predicate and streams for executable tests. */
export function runHook(rawInput, { predicate, stdout = process.stdout, stderr = process.stderr } = {}) {
	let input;
	try {
		input = JSON.parse(rawInput);
	} catch (error) {
		stderr.write(`nana verifier-pipe: ${String(error)}; allowing\n`);
		stdout.write(`${JSON.stringify(decideHook(null).response)}\n`);
		return;
	}
	const { response, diagnostic } = decideHook(input, predicate);
	if (diagnostic) stderr.write(`nana verifier-pipe: ${diagnostic}\n`);
	stdout.write(`${JSON.stringify(response)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runHook(readFileSync(0, "utf8"));
