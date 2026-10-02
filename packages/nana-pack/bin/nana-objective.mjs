#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-objective.mjs
 * @purpose Print the objective block for a session cwd as the Claude Code SessionStart hook's producer.
 * @inputs argv (`--cwd <dir>`, default process.cwd()), process.versions.node, and the user-scope objective
 *  settings read through lib/config.ts loadUserObjective
 * @outputs `[nana:objective]` plus lib/objective.ts's block on stdout, and nothing at all when
 *  objective.enabled is false
 * @effects disk (lib/objective.ts reads the objective files and the trust store)
 * @errors none — always exits 0; a Node older than 22.18 or a failed dynamic import prints an `OBJECTIVE
 *  UNAVAILABLE` marker naming the cause
 */
// nana-objective — print the objective block for a session cwd (the Claude Code
// SessionStart hook's producer; pi's extension imports the same lib/objective.ts).
//   node bin/nana-objective.mjs [--cwd <dir>]
// REQUIRES Node >= 22.18: the producer is lib/objective.ts, imported with no flag, which
// relies on Node's built-in type stripping (on by default from 22.18). On an older Node
// this prints a named "OBJECTIVE UNAVAILABLE: Node <v> is older than 22.18" marker instead
// of failing inside the import — checked BEFORE the .ts imports, which are dynamic for that reason.
// Output: "[nana:objective]" then the block; nothing when objective.enabled is false.
// Always exits 0 — a hook must never fail the session start.
const TAG = "[nana:objective]";
const HEADING_FALLBACK = "## Objective and current priority (nana)"; // lib/objective.ts HEADING, for the pre-import path
const NODE_FLOOR = [22, 18];

const [maj, min] = process.versions.node.split(".").map(Number);
if (maj < NODE_FLOOR[0] || (maj === NODE_FLOOR[0] && min < NODE_FLOOR[1])) {
	process.stdout.write(
		`${TAG}\n${HEADING_FALLBACK}\n\nOBJECTIVE UNAVAILABLE: Node ${process.versions.node} is older than ${NODE_FLOOR.join(".")} (the objective producer needs Node's built-in TypeScript stripping) — upgrade Node. Tell the user before spending.\n`,
	);
	process.exit(0);
}

let lib;
try {
	const { loadUserObjective } = await import("../lib/config.ts");
	lib = await import("../lib/objective.ts");
	const i = process.argv.indexOf("--cwd");
	const cwd = (i >= 0 && process.argv[i + 1]) || process.cwd();
	const o = loadUserObjective();
	if (o.enabled) process.stdout.write(`${TAG}\n${lib.produceObjective(cwd, o).text}`); // text ends in its own one "\n"
} catch (err) {
	const heading = lib?.HEADING ?? HEADING_FALLBACK;
	const marker = lib?.MARKER_PREFIX ?? "OBJECTIVE UNAVAILABLE: ";
	const why = lib ? lib.displayText(String(err), 120) : String(err?.code ?? "import failed").replace(/[^\w .:-]/g, "").slice(0, 60);
	process.stdout.write(`${TAG}\n${heading}\n\n${marker}producer failed (${why}). Tell the user before spending.\n`);
}
