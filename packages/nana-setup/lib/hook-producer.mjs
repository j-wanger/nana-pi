/**
 * @module packages/nana-setup/lib/hook-producer.mjs
 * @purpose Run a nana hook producer and emit its output or the stable fail-open marker.
 * @inputs CLI path, marker text, optional producer arguments, cwd, environment and injectable process runner.
 * @outputs producer stdout or the supplied marker on stdout, and the number of characters written.
 * @effects process (spawns a child process and writes stdout).
 * @errors spawn failures, signals, nonzero exits and a run past the time limit are represented by the marker; never thrown.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { FRONTIER_TAG, FRONTIER_UNAVAILABLE } from "../../nana-pack/lib/frontier-summary-config.mjs";
import { SHARED_MEMORY_OUTPUT_BUDGET } from "./shared-memory-config.mjs";
import { STALE_UNAVAILABLE_PREFIX } from "./stale-copies-config.mjs";

/** Reused unchanged from R-2346: the objective and frontier share the 9,000-character hook budget. */
export const FRONTIER_HOOK_BUDGET = SHARED_MEMORY_OUTPUT_BUDGET;

// Chosen 2026-10-20 (R-2013): the adoption hook runs two producers in a row, so twice
// the limit plus the hook's start must stay under the installer's `timeout: 5`; 2000 ms
// would leave about 0.5 s. Measured healthy runs: macOS objective 108 ms, adoption 59 ms,
// stale-copies 67 ms (temp home); a hosted Windows install check ended the adoption hook,
// both producers, 0.34 s after it started beside six other hooks.
export const HOOK_PRODUCER_TIMEOUT_MS = 1500;

const launcherDefinitions = {
	objective: {
		cli: "packages/nana-pack/bin/nana-objective.mjs",
		marker: (cli) => `[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (${cli}). Tell the user before spending.\n`,
	},
	frontier: {
		cli: "packages/nana-pack/bin/nana-frontier-summary.mjs",
		marker: (cli) => `${FRONTIER_TAG}\n${FRONTIER_UNAVAILABLE} producer failed (${cli}).\n`,
	},
	adoption: {
		cli: "packages/nana-pack/bin/nana-adoption.mjs",
		marker: (cli) => `[nana:adoption]\nADOPTION UNAVAILABLE: reader failed (${cli}).\n`,
	},
	"stale-copies": {
		cli: "packages/nana-setup/bin/stale-copies.mjs",
		marker: (cli) => `${STALE_UNAVAILABLE_PREFIX} checker failed (${cli}).\n`,
	},
};

export function hookProducerConfig(name, repoRoot) {
	const definition = launcherDefinitions[name];
	if (!definition) throw new Error(`Unknown hook producer: ${name}`);
	const cli = path.join(repoRoot, definition.cli);
	return { cli, marker: definition.marker(cli) };
}

export function runHookProducer({ cli, marker, args = [], cwd, env = process.env, run = spawnSync, stdout = process.stdout }) {
	let output = marker;
	try {
		const resolvedCwd = cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
		const result = run(process.execPath, ["--no-warnings", cli, "--cwd", resolvedCwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], env, timeout: HOOK_PRODUCER_TIMEOUT_MS });
		if (result?.status === 0 && !result.signal && !result.error) output = typeof result.stdout === "string" && result.stdout.length > 0 ? `${result.stdout.replace(/\n+$/, "")}\n` : "";
	} catch {
		output = marker;
	}
	if (!output) return 0;
	try {
		stdout.write(output);
		return output.length;
	} catch {
		// The hook entry handles stream errors; a custom writer must not fail the producer launcher.
		return 0;
	}
}
