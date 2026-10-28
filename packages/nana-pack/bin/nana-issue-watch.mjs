#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-issue-watch.mjs
 * @purpose Print an opted-in project's live issue-comment monitor with a bounded restart cursor.
 * @inputs argv (--root <project root>, optional --since <ISO time>), environment and HANDOFF pointer.
 * @outputs One line per comment or status, and a final runnable restart command.
 * @effects disk (HANDOFF), process (timers and gh), network (read-only gh API).
 * @errors Bad arguments exit 2; no opt-in exits 0; gh failures retry quietly within the run limit.
 */
import { watchIssues } from "../lib/issue-watch.mjs";
import { LAUNCHER_ROLES } from "../lib/frontier-summary-config.mjs";

try {
	const args = process.argv.slice(2), options = {};
	for (let i = 0; i < args.length; i += 2) {
		if (!["--root", "--since"].includes(args[i]) || !args[i + 1] || options[args[i]] !== undefined) throw new Error("usage: nana-issue-watch --root <project root> [--since <ISO time>]");
		options[args[i]] = args[i + 1];
	}
	if (!options["--root"] || (options["--since"] !== undefined && !Number.isFinite(Date.parse(options["--since"])))) throw new Error("usage: nana-issue-watch --root <project root> [--since <ISO time>]");
	if (!LAUNCHER_ROLES.includes(process.env.NANA_ROLE)) {
		const watch = watchIssues({ root: options["--root"], since: options["--since"], emit: (line) => process.stdout.write(line + "\n") });
		const stop = () => watch.stop();
		process.once("SIGINT", stop); process.once("SIGTERM", stop);
		await watch.done;
		process.removeListener("SIGINT", stop); process.removeListener("SIGTERM", stop);
	}
} catch (error) {
	process.stderr.write(`${error.message}\n`); process.exitCode = 2;
}
