/**
 * @module packages/nana-setup/lib/hook-producer.mjs
 * @purpose Run a nana-pack hook producer and emit its output or the stable fail-open marker.
 * @inputs CLI path, marker text, cwd, environment and injectable process runner.
 * @outputs producer stdout or the supplied marker on stdout.
 * @effects process (spawns a child process and writes stdout).
 * @errors spawn failures, signals and nonzero exits are represented by the marker; never thrown.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const launcherDefinitions = {
	objective: {
		cli: "packages/nana-pack/bin/nana-objective.mjs",
		marker: (cli) => `[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (${cli}). Tell the user before spending.\n`,
	},
	adoption: {
		cli: "packages/nana-pack/bin/nana-adoption.mjs",
		marker: (cli) => `[nana:adoption]\nADOPTION UNAVAILABLE: reader failed (${cli}).\n`,
	},
};

export function hookProducerConfig(name, repoRoot) {
	const definition = launcherDefinitions[name];
	if (!definition) throw new Error(`Unknown hook producer: ${name}`);
	const cli = path.join(repoRoot, definition.cli);
	return { cli, marker: definition.marker(cli) };
}

export function runHookProducer({ cli, marker, cwd, env = process.env, run = spawnSync, stdout = process.stdout }) {
	try {
		const resolvedCwd = cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
		const result = run(process.execPath, ["--no-warnings", cli, "--cwd", resolvedCwd], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], env });
		if (result?.status === 0 && !result.signal && !result.error) {
			if (typeof result.stdout === "string" && result.stdout.length > 0) stdout.write(`${result.stdout.replace(/\n+$/, "")}\n`);
		} else {
			stdout.write(marker);
		}
	} catch {
		stdout.write(marker);
	}
}
