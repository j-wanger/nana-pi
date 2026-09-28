#!/usr/bin/env node
// nana-objective — print the objective block for a session cwd (the Claude Code
// SessionStart hook's producer; pi's extension imports the same lib/objective.ts).
//   node bin/nana-objective.mjs [--cwd <dir>]      (Node >= 22.18 strips the .ts types)
// Output: "[nana:objective]" then the block; nothing when objective.enabled is false.
// Always exits 0 — a hook must never fail the session start.
import { loadUserObjective } from "../lib/config.ts";
import { HEADING, MARKER_PREFIX, produceObjective } from "../lib/objective.ts";

const TAG = "[nana:objective]";
try {
	const i = process.argv.indexOf("--cwd");
	const cwd = (i >= 0 && process.argv[i + 1]) || process.cwd();
	const o = loadUserObjective();
	if (o.enabled) process.stdout.write(`${TAG}\n${produceObjective(cwd, o).text}`); // text ends in its own one "\n"
} catch (err) {
	process.stdout.write(`${TAG}\n${HEADING}\n\n${MARKER_PREFIX}producer failed (${String(err).slice(0, 120)}). Tell the user before spending.\n`);
}
