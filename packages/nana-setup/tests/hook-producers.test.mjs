/**
 * @module packages/nana-setup/tests/hook-producers.test.mjs
 * @purpose Pins fail-open producer launcher output and import safety of verifier hook logic.
 * @inputs the launcher module and an open-stdin child process.
 * @outputs PASS/FAIL checks for exact markers and prompt import completion.
 * @effects process (spawns an isolated Node child).
 * @errors failed checks set a nonzero process exit code.
 */
import { spawn } from "node:child_process";
import { runHookProducer } from "../lib/hook-producer.mjs";
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
// req: R-687
check("objective failure marker is byte exact", invoke("/missing/objective.mjs", "[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (/missing/objective.mjs). Tell the user before spending.\n", { status: 1, stdout: "" }) === "[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (/missing/objective.mjs). Tell the user before spending.\n");
// req: R-687
check("adoption failure marker is byte exact", invoke("/missing/adoption.mjs", "[nana:adoption]\nADOPTION UNAVAILABLE: reader failed (/missing/adoption.mjs).\n", { status: 1, stdout: "" }) === "[nana:adoption]\nADOPTION UNAVAILABLE: reader failed (/missing/adoption.mjs).\n");
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
