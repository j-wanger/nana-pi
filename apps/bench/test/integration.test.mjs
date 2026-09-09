// INTEGRATION, with a stub child and NO model calls. The registration probe crashed after its
// paid call because it referenced an out-of-scope `opts` — a ReferenceError that left no evidence
// and no ledger line, so a restart paid for the same probe again. That escaped every unit test
// because the smoke run took a different path. These tests drive the real integrated paths:
//   probe → evidence → ledger, on success, tool-missing, nonzero exit and timeout
//   executeRun → parse → evidence, and what survives when post-processing throws
// Run: node apps/bench/test/integration.test.mjs   (exit 0 = all PASS)
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { costOf, executeRun, observedCostOf, readLedger, registrationProbe, runPlan, spendOf } from "../run.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

const root = await fs.mkdtemp(path.join(os.tmpdir(), "bench-integration-"));
const stub = (name, body) => {
	const p = path.join(root, name);
	return fs.writeFile(p, body).then(() => p);
};

/** A stub `pi --mode json`: emits a canned event stream, ignores its argv entirely. */
const streamOf = ({ text, tokens = 100, tool = null, nestedUnknown = false }) => {
	const lines = [
		{ type: "session", version: 3, id: "stub", timestamp: "2026-09-09T00:00:00.000Z", cwd: "/tmp" },
		{ type: "turn_start" },
	];
	if (tool) {
		lines.push({ type: "tool_execution_start", toolCallId: "t1", toolName: tool, args: {} });
		lines.push({
			type: "message_end",
			message: {
				role: "toolResult",
				toolCallId: "t1",
				toolName: tool,
				content: [],
				isError: false,
				timestamp: 2,
				// A tool whose window saw NO measurable request: unknown spend, never 0.
				...(nestedUnknown ? { details: { benchNested: { calls: 1, models: [], unknown: true, unknownReason: "no-network-observed" } } } : {}),
			},
		});
	}
	lines.push({
		type: "message_end",
		message: {
			role: "assistant",
			content: [{ type: "text", text }],
			provider: "openai-codex",
			model: "gpt-5.6-sol",
			usage: { input: tokens, output: 10, cacheRead: 0, cacheWrite: 0, totalTokens: tokens + 10, cost: { input: 0.001, output: 0.0002, cacheRead: 0, cacheWrite: 0, total: 0.0012 } },
			stopReason: "stop",
			timestamp: 3,
		},
	});
	lines.push({ type: "agent_end", messages: [] }, { type: "agent_settled" });
	return lines.map((l) => JSON.stringify(l)).join("\n") + "\n";
};

const emitScript = (payload, { exitCode = 0, hang = false } = {}) =>
	`process.stdout.write(${JSON.stringify(payload)});\n` + (hang ? "setInterval(()=>{},1000);\n" : `process.exit(${exitCode});\n`);

const TOOLS = ["web_search", "fetch_content"];
const profileFor = (extPath) => ({
	name: "research",
	tools: ["read", ...TOOLS],
	extensions: [{ path: extPath, tools: TOOLS }],
	families: ["research"],
});
const study = { id: "stub-study", model: { provider: "openai-codex", id: "gpt-5.6-sol", thinking: "medium" }, timeoutMs: 60000, profiles: [] };

const freshStudyDir = async (name) => {
	const d = path.join(root, name);
	await fs.mkdir(d, { recursive: true });
	return d;
};

try {
	// ── 1. probe SUCCESS: evidence written, spend reported, ok true ────────────────────────────
	{
		const dir = await freshStudyDir("probe-ok");
		const bin = await stub("ok.mjs", emitScript(streamOf({ text: JSON.stringify(["read", ...TOOLS]) })));
		const p = await registrationProbe({ study, studyDir: dir, profile: profileFor(bin), launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null, pricer: null });
		check("probe: succeeds when every declared tool is named", p.ok === true, p.detail);
		check("probe: reports the tokens it spent", p.tokens === 110, String(p.tokens));
		check("probe: reports the money it spent", Math.abs(p.cost - 0.0012) < 1e-9, String(p.cost));
		check("probe: reports wall time", typeof p.wallMs === "number" && p.wallMs >= 0);
		check("probe: wrote its evidence", Boolean(p.evidence) && (await fs.readFile(path.join(dir, p.evidence, "stream.jsonl"), "utf8")).includes("agent_settled"));
		check("probe: recorded stderr as evidence too", (await fs.stat(path.join(dir, p.evidence, "stderr.txt"))).isFile());
	}

	// ── 2. probe FAILURE: a missing tool name — evidence and spend still recorded ──────────────
	{
		const dir = await freshStudyDir("probe-missing");
		const bin = await stub("missing.mjs", emitScript(streamOf({ text: JSON.stringify(["read", "web_search"]) })));
		const p = await registrationProbe({ study, studyDir: dir, profile: profileFor(bin), launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null, pricer: null });
		check("probe: fails when a declared tool is not registered", p.ok === false && p.detail.includes("fetch_content"), p.detail);
		check("probe: a FAILED probe still reports its spend", p.tokens === 110, String(p.tokens));
		check("probe: a FAILED probe still wrote evidence", Boolean(p.evidence));
	}

	// ── 3. probe NONZERO EXIT: judged a failure, spend preserved ───────────────────────────────
	{
		const dir = await freshStudyDir("probe-exit");
		const bin = await stub("exit3.mjs", emitScript(streamOf({ text: "[]" }), { exitCode: 3 }));
		const p = await registrationProbe({ study, studyDir: dir, profile: profileFor(bin), launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null, pricer: null });
		check("probe: a nonzero exit is a failure", p.ok === false && /exited 3/.test(p.detail), p.detail);
		check("probe: …with the spend that already happened", p.tokens === 110, String(p.tokens));
	}

	// ── 4. probe TIMEOUT: killed, confirmed, spend preserved ───────────────────────────────────
	{
		const dir = await freshStudyDir("probe-timeout");
		const bin = await stub("hang.mjs", emitScript(streamOf({ text: JSON.stringify(["read", ...TOOLS]) }), { hang: true }));
		const p = await registrationProbe({ study, studyDir: dir, profile: profileFor(bin), launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null, pricer: null, timeoutMs: 900 });
		check("probe: a hanging probe times out rather than blocking the study", p.timedOut === true && p.ok === false, p.detail);
		check("probe: …and confirms the child is dead", p.killedCleanly === true, String(p.killedCleanly));
		check("probe: …and still reports the tokens the call had already spent", p.tokens === 110, String(p.tokens));
		check("probe: …and still wrote evidence", Boolean(p.evidence));
	}

	// ── 5. probe with an unspawnable launcher: no crash, no invented success ───────────────────
	{
		const dir = await freshStudyDir("probe-nobin");
		const bin = await stub("real.mjs", "");
		const p = await registrationProbe({ study, studyDir: dir, profile: profileFor(bin), launcher: { cmd: path.join(root, "no-such-binary"), pre: [] }, agentDir: null, pricer: null });
		check("probe: an unspawnable child is a failure, not a pass", p.ok === false);
		check("probe: …and reports zero spend honestly", p.tokens === 0, String(p.tokens));
	}

	// ── 6. the ledger keeps probe spend across a restart, torn tail and all ────────────────────
	{
		const dir = await freshStudyDir("ledger");
		const file = path.join(dir, "ledger.jsonl");
		await fs.writeFile(file, `${JSON.stringify({ kind: "registration-probe", profile: "research", tokens: 110, cost: 0.0012, wallMs: 500, ok: true })}\n{"kind":"registration-probe","profile":"tor`);
		const rows = await readLedger(dir);
		check("ledger: a torn tail is dropped but the good row survives", rows.length === 1 && rows[0].tokens === 110);
		check("ledger: the file is REPAIRED so the next append is readable", (await fs.readFile(file, "utf8")).endsWith("\n"));
		check("ledger: the torn bytes are quarantined, not lost", (await fs.readFile(`${file}.quarantine`, "utf8")).includes("torn-tail"));
		await fs.appendFile(file, `${JSON.stringify({ kind: "registration-probe", profile: "b", tokens: 7, ok: true })}\n`);
		check("ledger: …and the NEXT append is readable (the torn row did not eat it)", (await readLedger(dir)).length === 2);
	}

	// ── 7. executeRun: a graded run through the real post-processing path ──────────────────────
	const task = { id: "stub-task", family: "research", fixture: false, prompt: "say ok", check: { type: "exact", value: "the answer" } };
	{
		const dir = await freshStudyDir("run-ok");
		const bin = await stub("run-ok.mjs", emitScript(streamOf({ text: "the answer", tokens: 500, tool: "web_search" })));
		const rec = await executeRun({
			study, studyDir: dir, task, profile: profileFor(bin), rep: 0, block: "stub-task|0",
			launcher: { cmd: process.execPath, pre: [bin] }, fingerprint: "fp", opts: { dryRun: false, keep: false, agentDir: null, pricer: null },
		});
		check("executeRun: a passing run is state ok", rec.state === "ok" && rec.ok === true, `${rec.state} ${rec.error ?? ""}`);
		check("executeRun: spend is own + nested, counted once", spendOf(rec) === 510, String(spendOf(rec)));
		check("executeRun: evidence written under raw/<task>/<profile>/rep<N>", (await fs.readFile(path.join(dir, rec.evidence, "stream.jsonl"), "utf8")).includes("agent_settled"));
		check("executeRun: argv recorded as evidence", (await fs.readFile(path.join(dir, rec.evidence, "argv.txt"), "utf8")).includes("--mode json"));
		check("executeRun: the checker verdict is carried", rec.check.pass === true);
	}

	// ── 8. executeRun: post-processing THROWS — the child's spend must survive ─────────────────
	{
		const dir = await freshStudyDir("run-throws");
		// `raw` as a FILE makes the evidence mkdir fail, i.e. a throw AFTER the paid child.
		await fs.writeFile(path.join(dir, "raw"), "not a directory");
		const bin = await stub("run-throws.mjs", emitScript(streamOf({ text: "the answer", tokens: 900 })));
		const rec = await executeRun({
			study, studyDir: dir, task, profile: profileFor(bin), rep: 0, block: "stub-task|0",
			launcher: { cmd: process.execPath, pre: [bin] }, fingerprint: "fp", opts: { dryRun: false, keep: false, agentDir: null, pricer: null },
		});
		check("executeRun: a post-processing failure is a grader error, not a model failure", rec.state === "grader-error" && rec.ok === null, rec.state);
		check("executeRun: …and the child's measured spend is PRESERVED, not zeroed", spendOf(rec) === 910, String(spendOf(rec)));
		check("executeRun: …with the token count named in the error", /already spent 910 tokens/.test(rec.error ?? ""), rec.error ?? "");
		check("executeRun: …and wall time preserved", rec.wallMs > 0, String(rec.wallMs));
	}

	// ── 8b. executeRun: an unknown-spend run must PERSIST cost:null with a reason ──────────────
	// astra round 5, C: the record wrote a NUMBER for `cost` whenever the nested token count happened
	// to be 0, even with `nestedUnknown` set — a "silence is not zero" tool window is exactly that
	// case. The reader's helper corrected it, so the persisted line contradicted the contract the
	// README advertises. Verified at 9784d58: cost 0.0012, costReason null, nestedUnknown true.
	{
		const dir = await freshStudyDir("run-unknown-cost");
		const bin = await stub("run-unknown.mjs", emitScript(streamOf({ text: "the answer", tokens: 100, tool: "web_search", nestedUnknown: true })));
		const rec = await executeRun({
			study, studyDir: dir, task, profile: profileFor(bin), rep: 0, block: "stub-task|0",
			launcher: { cmd: process.execPath, pre: [bin] }, fingerprint: "fp", opts: { dryRun: false, keep: false, agentDir: null, pricer: null },
		});
		check("executeRun: an unmeasured tool window flags the run", rec.state === "ok" && rec.nestedUnknown === true, `${rec.state} ${rec.nestedUnknown}`);
		check("executeRun: …and the RECORD ITSELF carries cost null, not a number", rec.cost === null, JSON.stringify(rec.cost));
		check("executeRun: …with a reason naming the unmeasured spend", /unmeasured nested spend \(no-network-observed\)/.test(rec.costReason ?? ""), String(rec.costReason));
		check("executeRun: …while the priced part survives as an explicit lower bound", Math.abs(observedCostOf(rec) - 0.0012) < 1e-9, String(observedCostOf(rec)));
		check("executeRun: …and the shared helper agrees there is no total", costOf(rec) === null);
	}

	// ── 9. executeRun: a timeout is a run-error with the partial spend recorded ────────────────
	{
		const dir = await freshStudyDir("run-timeout");
		const bin = await stub("run-hang.mjs", emitScript(streamOf({ text: "the answer", tokens: 300 }), { hang: true }));
		const rec = await executeRun({
			study, studyDir: dir, task, profile: profileFor(bin), rep: 0, block: "stub-task|0",
			launcher: { cmd: process.execPath, pre: [bin] }, fingerprint: "fp", opts: { dryRun: false, keep: false, agentDir: null, pricer: null, timeoutMs: 900 },
		});
		check("executeRun: a timeout is a run-error", rec.state === "run-error" && /timeout/.test(rec.error ?? ""), rec.error ?? "");
		check("executeRun: …the partial spend is still counted", spendOf(rec) === 310, String(spendOf(rec)));
		check("executeRun: …and the kill is confirmed", rec.killedCleanly === true, String(rec.killedCleanly));
	}
	// ── 10. THE PRODUCTION ORCHESTRATION PATH ─────────────────────────────────────────────────
	// astra: the earlier tests called registrationProbe and then appended synthetic ledger rows
	// separately, so the main loop's failure path was never covered — and it failed OPEN, printing
	// "NOT recorded" and continuing to spend. These drive `runPlan` itself.
	const orchestration = async ({ ledgerFails = false, probeOk = true, runs = 2 } = {}) => {
		const dir = await freshStudyDir(`orch-${Math.random().toString(36).slice(2, 8)}`);
		const bin = await stub(`orch-${Math.random().toString(36).slice(2, 8)}.mjs`, emitScript(streamOf({ text: "the answer" })));
		const profile = profileFor(bin);
		const calls = { probes: 0, runs: 0, ledger: 0, results: 0 };
		const study2 = { ...study, profiles: [profile], timeoutMs: 30000 };
		const tasks = [{ id: "t1", family: "research", fixture: false, prompt: "p", check: { type: "exact", value: "the answer" } }];
		const todo = Array.from({ length: runs }, (_, i) => ({ task: "t1", profile: profile.name, rep: i, block: `t1|${i}` }));
		let error = null;
		try {
			await runPlan({
				study: study2,
				studyDir: dir,
				tasks,
				todo,
				launcher: { cmd: process.execPath, pre: [bin] },
				fingerprint: "fp",
				agentDir: null,
				pricer: null,
				resultsPath: path.join(dir, "results.jsonl"),
				runOpts: { dryRun: false, keep: false, agentDir: null, pricer: null },
				priorRecords: [],
				deps: {
					ledger: [],
					blockKeys: new Map(),
					log: () => {},
					registrationProbe: async () => {
						calls.probes++;
						return { ok: probeOk, detail: probeOk ? "all registered" : "tools missing", tokens: 700, cost: 0.004, wallMs: 900, killedCleanly: null, timedOut: false, evidence: "raw/_probe/x" };
					},
					appendLedger: async () => {
						calls.ledger++;
						if (ledgerFails) throw new Error("ENOSPC: simulated ledger failure");
					},
					executeRun: async (a) => {
						calls.runs++;
						return { ts: "t", fingerprint: "fp", task: a.task.id, profile: a.profile.name, rep: a.rep, state: "ok", ok: true, totalTokens: 100, spend: 100, wallMs: 10, turns: 1, toolCalls: {}, tokens: { totalTokens: 100, cost: { total: 0.001 } } };
					},
					appendResult: async () => {
						calls.results++;
					},
				},
			});
		} catch (e) {
			error = e.message;
		}
		await fs.rm(dir, { recursive: true, force: true });
		return { calls, error };
	};

	{
		const { calls, error } = await orchestration({});
		check("orchestration: the happy path probes once and runs every tuple", error === null && calls.probes === 1 && calls.runs === 2, `${error ?? ""} ${JSON.stringify(calls)}`);
		check("orchestration: …and records the probe in the ledger before spending again", calls.ledger === 1);
		check("orchestration: …and records every completed run", calls.results === 2);
	}
	{
		// THE defect: a failed ledger append used to print a warning and keep spending.
		const { calls, error } = await orchestration({ ledgerFails: true });
		check("orchestration: a FAILED ledger append STOPS the study", error !== null, error ?? "no error");
		check("orchestration: …saying the probe's spend could not be recorded", /could not record the .* registration probe \(700 tokens already spent\)/.test(error ?? ""), (error ?? "").slice(0, 130));
		check("orchestration: …and NO further paid child is spawned", calls.runs === 0, `runs=${calls.runs}`);
		check("orchestration: …and it does not silently retry the probe", calls.probes === 1);
	}
	{
		const { calls, error } = await orchestration({ probeOk: false });
		check("orchestration: a failed probe stops the study before any graded run", error !== null && calls.runs === 0, `${error ?? ""} runs=${calls.runs}`);
		check("orchestration: …but its spend was recorded first", calls.ledger === 1);
	}

	// ── 11. remaining-wall capping has no floor ────────────────────────────────────────────────
	{
		const dir = await freshStudyDir("wall");
		const bin = await stub("wall.mjs", emitScript(streamOf({ text: "the answer" })));
		const profile = profileFor(bin);
		let ran = 0;
		const study3 = { ...study, profiles: [profile], timeoutMs: 300000, maxWallMs: 5000 };
		await runPlan({
			study: study3,
			studyDir: dir,
			tasks: [{ id: "t1", family: "research", fixture: false, prompt: "p", check: { type: "exact", value: "x" } }],
			todo: [{ task: "t1", profile: profile.name, rep: 0, block: "t1|0" }],
			launcher: { cmd: process.execPath, pre: [bin] },
			fingerprint: "fp",
			agentDir: null,
			pricer: null,
			resultsPath: path.join(dir, "results.jsonl"),
			runOpts: { dryRun: false, keep: false, agentDir: null, pricer: null },
			// 4.9 s of a 5 s allowance already spent: less than a useful slice remains.
			priorRecords: [{ state: "ok", spend: 0, wallMs: 4900 }],
			deps: { ledger: [], blockKeys: new Map(), log: () => {}, executeRun: async () => { ran++; return null; }, appendResult: async () => {} },
		});
		check("wall cap: with almost no allowance left, the study STOPS instead of granting 30s", ran === 0, `ran=${ran}`);
		await fs.rm(dir, { recursive: true, force: true });
	}
} finally {
	await fs.rm(root, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
