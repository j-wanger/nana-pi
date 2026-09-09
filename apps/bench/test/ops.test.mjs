// Operational safety rails: when the runner stops, and what it believes it has spent.
// Both were defects astra found — a run-error streak could burn the whole schedule, and probe
// spend vanished on every resume. No pi, no model.
// Run: node apps/bench/test/ops.test.mjs   (exit 0 = all PASS)
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { budgetFrom, costOf, observedCostOf, readKeys, readLedger, shouldStopForKill, spendOf, systemicStreak, SYSTEMIC_LIMIT, treeAlive } from "../run.mjs";
import { spawn } from "node:child_process";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};
const streak = (states) => states.reduce((acc, state) => systemicStreak(acc, { state }), 0);

// ── systemic stop ────────────────────────────────────────────────────────────────────────────
check("a grader-error streak trips the limit", streak(["grader-error", "grader-error", "grader-error"]) >= SYSTEMIC_LIMIT);
// astra F: run-errors were EXCLUDED, so repeated auth failures or timeouts could exhaust the
// whole schedule instead of stopping after three.
check("a run-error streak trips the limit too", streak(["run-error", "run-error", "run-error"]) >= SYSTEMIC_LIMIT, String(streak(["run-error", "run-error", "run-error"])));
check("mixed non-model failures still count as one streak", streak(["run-error", "grader-error", "blocked"]) >= SYSTEMIC_LIMIT);
check("a passing run resets the streak", streak(["run-error", "run-error", "ok", "run-error"]) === 1);
check("a FAILING but decided run also resets it (that is a measurement, not a fault)", streak(["run-error", "run-error", "fail", "run-error"]) === 1);
check("two non-model failures do not trip it", streak(["run-error", "blocked"]) < SYSTEMIC_LIMIT);

// ── the streak SURVIVES a restart ────────────────────────────────────────────────────────────
// It used to reset to 0 on resume, so three failures in a row stopped mattering the moment the
// operator restarted the runner — exactly when they matter most.
const restoredStreak = (records) => {
	let n = 0;
	for (const r of [...records].reverse()) {
		if (r.state === "ok" || r.state === "fail") break;
		n++;
	}
	return n;
};
check("a trailing run of non-model failures is restored on resume", restoredStreak([{ state: "ok" }, { state: "run-error" }, { state: "run-error" }, { state: "grader-error" }]) === 3);
check("…and stops the study immediately at the limit", restoredStreak([{ state: "run-error" }, { state: "run-error" }, { state: "run-error" }]) >= SYSTEMIC_LIMIT);
check("a decided run in the tail clears it", restoredStreak([{ state: "run-error" }, { state: "run-error" }, { state: "fail" }]) === 0);
check("an empty results file has no streak", restoredStreak([]) === 0);

// ── unconfirmed kill ─────────────────────────────────────────────────────────────────────────
check("a child that could not be confirmed dead stops the study", shouldStopForKill({ killedCleanly: false }) === true);
check("a confirmed kill does not", shouldStopForKill({ killedCleanly: true }) === false);
check("a run where nothing was killed does not", shouldStopForKill({ killedCleanly: null }) === false);

// Kill confirmation must look at the whole tree, not just the leader: a surviving grandchild is
// what keeps burning quota.
{
	check("treeAlive says false for a pid that never existed", treeAlive(0x7ffffff0) === false);
	check("treeAlive says false for a null pid", treeAlive(null) === false);
	const child = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], { stdio: "ignore", detached: process.platform !== "win32" });
	await new Promise((r) => setTimeout(r, 200));
	check("treeAlive sees a live child", treeAlive(child.pid) === true);
	if (process.platform !== "win32") process.kill(-child.pid, "SIGKILL");
	else child.kill("SIGKILL");
	for (let i = 0; i < 50 && treeAlive(child.pid); i++) await new Promise((r) => setTimeout(r, 50));
	check("treeAlive sees the group die", treeAlive(child.pid) === false);
}

// ── spend, counted exactly once ──────────────────────────────────────────────────────────────
// Usage is pi-ai shaped: totalTokens is pi's own field, not a bucket sum of ours.
check("spendOf uses the recorded spend when present", spendOf({ spend: 777, totalTokens: 500, nestedTokens: { totalTokens: 400 } }) === 777);
check("spendOf falls back to own + nested", spendOf({ totalTokens: 500, nestedTokens: { totalTokens: 400 } }) === 900);
check("spendOf tolerates a record with no nested field", spendOf({ totalTokens: 500 }) === 500);
check("spendOf of nothing is 0, not NaN", spendOf({}) === 0);

// ── cost, in pi's own numbers ────────────────────────────────────────────────────────────────
const priced = { tokens: { totalTokens: 100, cost: { total: 0.01 } }, nestedTokens: { totalTokens: 50 }, nestedCost: { total: 0.02 } };
check("costOf adds own cost and nested cost", Math.abs(costOf(priced) - 0.03) < 1e-9, String(costOf(priced)));
check("costOf is null when nested spend went unpriced", costOf({ tokens: { totalTokens: 100, cost: { total: 0.01 } }, nestedTokens: { totalTokens: 50 }, nestedCost: null }) === null);
check("costOf is a real number when there was no nested spend", Math.abs(costOf({ tokens: { totalTokens: 100, cost: { total: 0.01 } } }) - 0.01) < 1e-9);
check("costOf of nothing is null, not 0", costOf(null) === null);
// THE BUDGET's money is the OBSERVED bound, not `costOf(...) ?? 0` (astra round 5, C): a run whose
// nested spend could not be measured still spent known dollars on its own calls, and counting those
// as zero made the running total read LOWER than what had already been paid.
{
	const unknownRun = { state: "ok", spend: 660, wallMs: 10, tokens: { totalTokens: 520, cost: { total: 0.006 } }, nestedTokens: { totalTokens: 140 }, nestedUnknown: true, cost: null, pricedNestedCost: { total: 0.04 } };
	check("an unknown-spend run has no total cost", costOf(unknownRun) === null);
	check("…but the budget still counts the dollars it DOES know", Math.abs(observedCostOf(unknownRun) - 0.046) < 1e-9, String(observedCostOf(unknownRun)));
	check("…and a priced run is unchanged by that helper", Math.abs(observedCostOf({ cost: 0.02 }) - 0.02) < 1e-9);
	check("…and nothing is 0, not NaN", observedCostOf(null) === 0);
	// The token side of the same rule: a run carrying unknown nested spend makes the whole budget a
	// lower bound, and `budgetFrom` says so rather than reporting a total.
	const b = budgetFrom([unknownRun], []);
	check("the budget reports itself NOT fully accounted", b.accounted === false && b.unknownRuns === 1, JSON.stringify(b));
}

// ── budget ledger ────────────────────────────────────────────────────────────────────────────
const runs = [
	{ spend: 1000, wallMs: 5000 },
	{ spend: 2000, wallMs: 7000, nestedUnknown: true },
];
const ledger = [
	{ kind: "registration-probe", profile: "research", tokens: 400, wallMs: 3000, ok: true },
	{ kind: "registration-probe", profile: "research", tokens: 0, wallMs: 100, ok: true },
];
const b = budgetFrom(runs, ledger);
check("budget adds graded runs and probe spend", b.tokens === 3400, String(b.tokens));
check("budget adds probe WALL time too (it is real time on the clock)", b.wallMs === 15100, String(b.wallMs));
check("budget counts runs carrying unmeasured nested spend", b.unknownRuns === 1);
check("…and refuses to call itself fully accounted", b.accounted === false);
check("a clean study IS fully accounted", budgetFrom([{ spend: 5 }], []).accounted === true);
check("an empty study is 0 and accounted", budgetFrom().tokens === 0 && budgetFrom().accounted === true);

// ── persistence across invocations ───────────────────────────────────────────────────────────
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "bench-ops-"));
try {
	check("a missing ledger reads as empty, not as a crash", (await readLedger(dir)).length === 0);
	check("a missing keys file reads as empty", (await readKeys(dir)).size === 0);

	await fs.writeFile(
		path.join(dir, "ledger.jsonl"),
		`${JSON.stringify({ kind: "registration-probe", profile: "research", tokens: 700, wallMs: 4000, ok: true })}\n` + `{"kind":"registration-probe","profile":"tor` /* torn */,
	);
	const led = await readLedger(dir);
	check("the ledger survives a torn tail", led.length === 1 && led[0].tokens === 700);
	check("a recorded successful probe means it is not repeated", led.some((l) => l.kind === "registration-probe" && l.ok && l.profile === "research"));
	check("probe spend survives a restart", budgetFrom([], led).tokens === 700);

	// One oracle key per comparison block, reloaded on resume. Both arms of a comparison must be
	// graded against the SAME fetch, so a resume may not refetch — and a recorded FAILURE must
	// come back as a failure rather than triggering a fresh fetch per arm.
	await fs.writeFile(
		path.join(dir, "keys.jsonl"),
		[
			JSON.stringify({ ts: "t", block: "res-npm-latest|0", task: "res-npm-latest", rep: 0, key: "6.0.0" }),
			JSON.stringify({ ts: "t", block: "res-doc-phrase|1", task: "res-doc-phrase", rep: 1, error: "HTTP 503" }),
		].join("\n") + "\n",
	);
	const keys = await readKeys(dir);
	check("a snapshotted key is reloaded on resume", keys.get("res-npm-latest|0").key === "6.0.0");
	check("a snapshotted oracle FAILURE is reloaded too", keys.get("res-doc-phrase|1").error === "HTTP 503");
	check("…so the second arm cannot quietly refetch a different key", keys.get("res-doc-phrase|1").key === undefined);
	check("an unseen block has no entry, and will be fetched once", keys.get("res-npm-latest|1") === undefined);

	// The keys log gets the same torn-tail repair as results.jsonl and the ledger.
	const kf = path.join(dir, "keys.jsonl");
	await fs.appendFile(kf, '{"block":"torn|9","key":"x');
	const repaired = await readKeys(dir);
	check("keys: a torn tail is dropped", repaired.get("torn|9") === undefined);
	check("keys: …and the file is repaired to a newline boundary", (await fs.readFile(kf, "utf8")).endsWith("\n"));
	await fs.appendFile(kf, `${JSON.stringify({ block: "after|0", key: "kept" })}\n`);
	check("keys: …so the NEXT append survives", (await readKeys(dir)).get("after|0").key === "kept");
} finally {
	await fs.rm(dir, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
