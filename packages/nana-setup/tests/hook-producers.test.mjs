/**
 * @module packages/nana-setup/tests/hook-producers.test.mjs
 * @purpose Pin producer deadlines and fail-open launcher output.
 * @inputs The launcher module and injected producer results.
 * @outputs PASS/FAIL checks for deadlines, bounded limits and launcher output.
 * @effects process (spawns missing producer CLIs).
 * @errors failed checks set a nonzero process exit code.
 */
import path from "node:path";
import { HOOK_DEADLINE_MS, HOOK_PRODUCER_TIMEOUT_MS, hookProducerConfig, runHookProducer } from "../lib/hook-producer.mjs";
let failures = 0;
const check = (title, ok) => { console.log(ok ? "PASS" : "FAIL", title); if (!ok) failures++; };
{
	const startedAt = performance.now();
	let starts = 0;
	const outputs = [];
	for (const reading of [HOOK_DEADLINE_MS, HOOK_DEADLINE_MS - 0.4, HOOK_DEADLINE_MS + 1]) {
		let output = "";
		runHookProducer({
			...hookProducerConfig("objective", "/clone"),
			deadlineMs: HOOK_DEADLINE_MS,
			clock: () => reading,
			run: () => { starts++; return { status: 0, stdout: "started\n" }; },
			stdout: { write: (text) => { output += text; } },
		});
		outputs.push(output);
	}
	// req: R-2673
	check("R-2673: with no whole millisecond left before the deadline, the launcher prints the marker and starts no producer", starts === 0 && outputs.every((output) => output === hookProducerConfig("objective", "/clone").marker));
	console.log(`note: R-2673 elapsed ${Math.round(performance.now() - startedAt)} ms`);
}
{
	const startedAt = performance.now();
	const limits = [];
	const capture = (name, options = {}) => runHookProducer({
		...hookProducerConfig(name, "/clone"),
		...options,
		run: (_command, _args, runOptions) => { limits.push({ name, timeout: runOptions.timeout }); return { status: 0, stdout: "" }; },
		stdout: { write: () => {} },
	});
	capture("objective", { clock: () => 1_000_000_000 });
	for (const name of ["objective", "frontier", "adoption", "stale-copies"]) capture(name, { deadlineMs: HOOK_DEADLINE_MS, clock: () => 0 });
	capture("objective", { deadlineMs: HOOK_DEADLINE_MS, clock: () => HOOK_DEADLINE_MS - 1000.7 });
	// req: R-2674
	check("R-2674: each producer's limit is the cap, or the whole milliseconds left before the deadline when fewer, and the cap when no deadline is given",
		limits.length === 6 && limits.slice(0, 5).every(({ timeout }) => timeout === HOOK_PRODUCER_TIMEOUT_MS) && limits[5].timeout === 1000);
	console.log(`note: R-2674 elapsed ${Math.round(performance.now() - startedAt)} ms`);
}
// req: R-687
check("launcher configurations drive missing-CLI output with canonical markers", ["objective", "adoption"].every((name) => {
	const config = hookProducerConfig(name, "/clone");
	let output = "";
	runHookProducer({ ...config, stdout: { write: (text) => { output += text; } } });
	// Built via path.join, the way hookProducerConfig itself does, so this stays correct on
	// win32, where path.join("/clone", "packages/.../x.mjs") uses backslashes.
	const cli = path.join("/clone", name === "objective" ? "packages/nana-pack/bin/nana-objective.mjs" : "packages/nana-pack/bin/nana-adoption.mjs");
	const expected = name === "objective"
		? `[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (${cli}). Tell the user before spending.\n`
		: `[nana:adoption]\nADOPTION UNAVAILABLE: reader failed (${cli}).\n`;
	return output === expected;
}));
{
	let output = "";
	runHookProducer({ cli: "/producer.mjs", marker: "fallback", run: () => ({ status: 0, stdout: "hello\n\n" }), stdout: { write: (value) => { output += value; } } });
	// req: R-687
	check("successful producer output collapses trailing newlines to one", output === "hello\n");
}
if (failures) process.exitCode = 1;
