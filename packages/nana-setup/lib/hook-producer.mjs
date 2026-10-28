/**
 * @module packages/nana-setup/lib/hook-producer.mjs
 * @purpose Run a nana hook producer and emit its output or the stable fail-open marker.
 * @inputs CLI path, marker text, optional producer arguments, cwd, environment, process-clock deadline and injectable clock and runner.
 * @outputs producer stdout or the supplied marker on stdout, and the number of characters written.
 * @effects process (spawns a child process and writes stdout).
 * @errors spawn failures, signals, nonzero exits, no time left and a run past the time limit are represented by the marker; never thrown.
 */
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { FRONTIER_TAG, FRONTIER_UNAVAILABLE } from "../../nana-pack/lib/frontier-summary-config.mjs";
import { SHARED_MEMORY_OUTPUT_BUDGET } from "./shared-memory-config.mjs";
import { STALE_UNAVAILABLE_PREFIX } from "./stale-copies-config.mjs";

/** Reused unchanged from R-2346: the objective and frontier share the 9,000-character hook budget. */
export const FRONTIER_HOOK_BUDGET = SHARED_MEMORY_OUTPUT_BUDGET;

// Chosen 2026-10-23 (R-2674): one measured Windows stall ran every hook about six times
// its median, and the objective producer then needed at least 1.5 s (it was stopped there).
// 2,500 ms is about 1.7 times that lower bound. The observed 1.36 s hook start is an upper
// bound inferred from a one-process hook's whole run.
export const HOOK_PRODUCER_TIMEOUT_MS = 2500;
// Contract and chosen 2026-10-23 (R-2672): Claude Code's installed `timeout: 5` minus a
// chosen 1,000 ms for process creation before Node's clock, killing a hung producer, marker
// writes and exit. Hooks ended 16 to 44 ms after this deadline on macOS only; Windows was
// not measured.
export const HOOK_DEADLINE_MS = 4000;

const launcherDefinitions = {
	objective: {
		cli: "packages/nana-pack/bin/nana-objective.mjs",
		marker: (cli) => `[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (${cli}). Tell the user before spending.\n`,
	},
	frontier: {
		passLimit: true,
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
	return { cli, marker: definition.marker(cli), passLimit: definition.passLimit === true };
}

export function runHookProducer({ cli, marker, passLimit = false, args = [], cwd, env = process.env, deadlineMs, clock = () => performance.now(), run = spawnSync, stdout = process.stdout }) {
	let output = marker;
	try {
		const limit = deadlineMs === undefined ? HOOK_PRODUCER_TIMEOUT_MS : Math.min(HOOK_PRODUCER_TIMEOUT_MS, Math.floor(deadlineMs - clock()));
		if (limit > 0) {
			const resolvedCwd = cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
			const result = run(process.execPath, ["--no-warnings", cli, "--cwd", resolvedCwd, ...args, ...(passLimit ? ["--limit-ms", String(limit)] : [])], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], env, timeout: limit });
			if (result?.status === 0 && !result.signal && !result.error) output = typeof result.stdout === "string" && result.stdout.length > 0 ? `${result.stdout.replace(/\n+$/, "")}\n` : "";
		}
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
