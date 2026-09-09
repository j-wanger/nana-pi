// The per-run timeout must actually KILL — not merely stop waiting. A pi run shells out, so a
// survivor keeps burning quota and overlaps the next run's wall-clock measurement. The stub here
// IGNORES SIGTERM and spawns a grandchild, which is the case the earlier implementation lost:
// it resolved the promise on a second timer and left the tree running.
// No pi and no model here.
// Run: node apps/bench/test/timeout.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runChild } from "../run.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};
const alive = (pid) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
};
const waitGone = async (pid, ms = 10000) => {
	const until = Date.now() + ms;
	while (Date.now() < until && alive(pid)) await new Promise((r) => setTimeout(r, 100));
	return !alive(pid);
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-timeout-"));
// A SIGTERM-resistant child with a SIGTERM-resistant grandchild.
fs.writeFileSync(
	path.join(dir, "stubborn.mjs"),
	[
		'import { spawn } from "node:child_process";',
		'const g = spawn(process.execPath, ["-e", "process.on(\'SIGTERM\',()=>{}); process.on(\'SIGHUP\',()=>{}); setInterval(()=>{},1000)"], { stdio: "ignore" });',
		'process.on("SIGTERM", () => {});',
		'process.on("SIGHUP", () => {});',
		'console.log(JSON.stringify({ child: process.pid, grand: g.pid }));',
		"setInterval(() => {}, 1000);",
	].join("\n"),
);
fs.writeFileSync(path.join(dir, "quick.mjs"), 'process.stdout.write("hi\\n"); process.stderr.write("warn\\n"); process.exit(7);\n');

try {
	// 1. a SIGTERM-resistant tree is escalated to SIGKILL and confirmed dead
	const t0 = Date.now();
	const r = await runChild({ cmd: process.execPath, args: [path.join(dir, "stubborn.mjs")], env: process.env, cwd: dir, timeoutMs: 800, graceMs: 700 });
	const elapsed = Date.now() - t0;
	check("timedOut is reported", r.timedOut === true);
	check("it returns without hanging", elapsed < 15000, `${elapsed}ms`);
	check("the runner CONFIRMS termination rather than assuming it", r.killedCleanly === true, String(r.killedCleanly));
	check("stdout captured before the kill", r.stdout.includes('"child"'), r.stdout.trim());

	const pids = JSON.parse(r.stdout.trim().split("\n")[0]);
	check("the SIGTERM-ignoring child is gone", await waitGone(pids.child), `pid ${pids.child}`);
	check("the SIGTERM-ignoring GRANDCHILD is gone too", await waitGone(pids.grand), `pid ${pids.grand}`);

	// 2. a normal child is untouched and its exit code + streams survive
	const q = await runChild({ cmd: process.execPath, args: [path.join(dir, "quick.mjs")], env: process.env, cwd: dir, timeoutMs: 30000 });
	check("fast child: not flagged as timed out", q.timedOut === false);
	check("fast child: exit code preserved (a nonzero exit is a run error, not a pass)", q.exit === 7, String(q.exit));
	check("fast child: stdout captured", q.stdout.trim() === "hi");
	check("fast child: stderr captured", q.stderr.trim() === "warn");
	check("fast child: killedCleanly is null when nothing was killed", q.killedCleanly === null);

	// 3. an unspawnable binary resolves instead of hanging or throwing
	const bad = await runChild({ cmd: path.join(dir, "no-such-binary"), args: [], env: process.env, cwd: dir, timeoutMs: 5000 });
	check("missing binary resolves with a spawn error", bad.exit === null && bad.stderr.includes("spawn error"), bad.stderr.trim().slice(0, 80));
} finally {
	fs.rmSync(dir, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
