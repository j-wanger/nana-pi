/**
 * @module packages/nana-setup/tests/hook-producers.test.mjs
 * @purpose Pin producer deadlines, fail-open launcher output and import safety of verifier hook logic.
 * @inputs the launcher module, installed hook metadata and an open-stdin child process.
 * @outputs PASS/FAIL checks for deadline limits, exact markers and prompt import completion.
 * @effects process (spawns an isolated Node child).
 * @errors failed checks set a nonzero process exit code.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { HOOK_DEADLINE_MS, HOOK_PRODUCER_TIMEOUT_MS, hookProducerConfig, runHookProducer } from "../lib/hook-producer.mjs";
import { desiredHooks } from "../lib/settings.mjs";
let failures = 0;
const check = (title, ok) => { console.log(ok ? "PASS" : "FAIL", title); if (!ok) failures++; };
const invoke = (cli, marker, result) => {
	let output = "";
	runHookProducer({ cli, marker, cwd: "/project", env: {}, run: (...args) => {
		check("launcher uses Node executable and canonical args", args[0] === process.execPath && args[1].join(" ").includes("--no-warnings"));
		return result;
	}, stdout: { write: (text) => { output += text; } } });
	return output;
};
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
{
	const installedLimitMs = desiredHooks({ hooksDir: "/hooks", repoRoot: "/repo", platform: process.platform })
		.find((candidate) => candidate.label === "SessionStart objective").entry.timeout * 1000;
	const startedAt = performance.now();
	// req: R-2674 R-2672
	check("seal: the producer cap is 2,500 ms and the hook deadline 4,000 ms, 1,000 ms under the installed limit",
		HOOK_PRODUCER_TIMEOUT_MS === 2500 && HOOK_DEADLINE_MS === 4000 && installedLimitMs - HOOK_DEADLINE_MS === 1000);
	console.log(`note: seal elapsed ${Math.round(performance.now() - startedAt)} ms`);
}
// req: R-687
check("objective failure marker is byte exact", invoke("/missing/objective.mjs", "[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (/missing/objective.mjs). Tell the user before spending.\n", { status: 1, stdout: "" }) === "[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (/missing/objective.mjs). Tell the user before spending.\n");
// req: R-687
check("adoption failure marker is byte exact", invoke("/missing/adoption.mjs", "[nana:adoption]\nADOPTION UNAVAILABLE: reader failed (/missing/adoption.mjs).\n", { status: 1, stdout: "" }) === "[nana:adoption]\nADOPTION UNAVAILABLE: reader failed (/missing/adoption.mjs).\n");
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
// req: R-687
check("both launcher configurations fail open when fallback cwd resolution throws", ["objective", "adoption"].every((name) => {
	const config = hookProducerConfig(name, "/clone");
	let output = "";
	const originalCwd = process.cwd;
	const originalProjectDir = process.env.CLAUDE_PROJECT_DIR;
	try {
		delete process.env.CLAUDE_PROJECT_DIR;
		process.cwd = () => { throw new Error("cwd unavailable"); };
		runHookProducer({ ...config, stdout: { write: (text) => { output += text; } } });
	} catch {
		return false;
	} finally {
		process.cwd = originalCwd;
		if (originalProjectDir === undefined) delete process.env.CLAUDE_PROJECT_DIR;
		else process.env.CLAUDE_PROJECT_DIR = originalProjectDir;
	}
	return output === config.marker;
}));
{
	let output = "";
	runHookProducer({ cli: "/producer.mjs", marker: "fallback", run: () => ({ status: 0, stdout: "hello\n\n" }), stdout: { write: (value) => { output += value; } } });
	// req: R-687
	check("successful producer output collapses trailing newlines to one", output === "hello\n");
	output = "";
	runHookProducer({ cli: "/producer.mjs", marker: "exact marker", run: () => ({ status: null, signal: "SIGTERM" }), stdout: { write: (value) => { output += value; } } });
	// req: R-687
	check("signal failure emits the exact marker", output === "exact marker");
	output = "";
	runHookProducer({ cli: "/producer.mjs", marker: "spawn marker", run: () => { throw new Error("spawn failed"); }, stdout: { write: (value) => { output += value; } } });
	// req: R-687
	check("spawn failure emits its marker and does not throw", output === "spawn marker");
}
{
	const child = spawn(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(new URL("../lib/verifier-hook.mjs", import.meta.url).href)})`], { stdio: ["pipe", "ignore", "pipe"] });
	let stderr = "";
	child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
	const outcome = await new Promise((resolve) => {
		const timer = setTimeout(() => { child.kill("SIGKILL"); resolve({ timeout: true }); }, 4500);
		child.on("exit", (code) => { clearTimeout(timer); resolve({ code }); });
	});
	// req: R-688
	check("importing verifier logic completes with open stdin and empty stderr", outcome.code === 0 && !outcome.timeout && stderr === "");
}
if (failures) process.exitCode = 1;
