// EVERY ORCHESTRATION PATH, DRIVEN AT LEAST ONCE, with stub children and no model calls.
//
// Why this file exists, in one sentence: two reviews in a row found an UNDECLARED IDENTIFIER on a
// path no test ever entered — `opts` inside `registrationProbe` (round 3, after the paid call) and
// `onBuffer` inside `loadProbe` (round 5, right after the RPC child was spawned). Both are
// ReferenceErrors that only fire when the line runs, and both would have cost real money to find.
// So: `loadProbe`, `registrationProbe`, `executeRun`, `runPlan` and the SIGINT salvage path are each
// executed here against stubs, so an undeclared reference in any of them fails in CI instead.
//
// It also covers what astra asked for beyond the guard:
//   * the REAL `appendLedger`/`appendResult` on the happy path (the other DI test replaces both);
//   * a results-append failure;
//   * interruption during the child, during postprocessing and during the append — each keeping the
//     partial evidence and an unknown-spend record.
// Run: node apps/bench/test/orchestration-paths.test.mjs   (exit 0 = all PASS)
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
	executeRun,
	handleInterrupt,
	inflightKeys,
	inflightProbeKey,
	inflightRunKey,
	installInterruptHandler,
	loadProbe,
	readLedger,
	registrationProbe,
	releaseInflight,
	runPlan,
	spendOf,
} from "../run.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

const root = await fs.mkdtemp(path.join(os.tmpdir(), "bench-orch-"));
const stub = async (name, body) => {
	const p = path.join(root, name);
	await fs.writeFile(p, body);
	return p;
};
const freshStudyDir = async (name) => {
	const d = path.join(root, name);
	await fs.mkdir(d, { recursive: true });
	return d;
};
const readJsonl = async (p) => (await fs.readFile(p, "utf8")).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
const waitFor = async (pred, ms = 4000) => {
	const deadline = Date.now() + ms;
	while (Date.now() < deadline) {
		if (await pred()) return true;
		await new Promise((r) => setTimeout(r, 25));
	}
	return false;
};

/** A stub `pi --mode json` stream. `tool` adds one tool call, so nested accounting is exercised. */
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
	return `${lines.map((l) => JSON.stringify(l)).join("\n")}\n`;
};
const emitScript = (payload, { exitCode = 0, hang = false } = {}) =>
	`process.stdout.write(${JSON.stringify(payload)});\n` + (hang ? "setInterval(()=>{},1000);\n" : `process.exit(${exitCode});\n`);
/**
 * Emits a PREFIX of a stream, touches `marker`, then hangs: a paid child that is still in flight.
 * The marker is what makes an interruption test deterministic — without it the interrupt races the
 * child's first write, and "the salvage found no tokens" would be a flaky pass rather than a bug.
 */
const partialThenHang = (payload, marker) =>
	`import fs from "node:fs";\nprocess.stdout.write(${JSON.stringify(payload)});\nfs.writeFileSync(${JSON.stringify(marker)}, "1");\nsetInterval(()=>{},1000);\n`;
const wrote = (marker) => waitFor(() => fs.stat(marker).then(() => true).catch(() => false));

const TOOLS = ["web_search", "fetch_content"];
const study = { id: "orch-study", model: { provider: "openai-codex", id: "gpt-5.6-sol", thinking: "medium" }, timeoutMs: 60000, profiles: [] };
const plainProfile = { name: "lean", tools: ["read", "bash"], families: ["code"] };
const extProfile = (extPath) => ({ name: "research", tools: ["read", ...TOOLS], extensions: [{ path: extPath, tools: TOOLS }], families: ["research"] });
const task = { id: "t1", family: "research", fixture: false, prompt: "p", check: { type: "exact", value: "the answer" } };

try {
	// ── 1. loadProbe: the ZERO-TOKEN preflight, against a stub RPC child ──────────────────────────
	// astra round 5, E1: `run.mjs` referenced an undeclared `onBuffer` here, so EVERY real preflight
	// threw a ReferenceError right after spawning its RPC child — before any run could start, and
	// after the integration suite had already passed, because no test entered this function.
	const rpcStub = (payload) =>
		'let buf = "";\nprocess.stdin.on("data", (d) => { buf += d; });\nprocess.stdin.on("end", () => {\n' +
		`  process.stdout.write(${JSON.stringify(payload)});\n` +
		"  process.exit(0);\n});\n";
	const stateLine = (data) => `${JSON.stringify({ type: "response", request: "get_state", data })}\n`;
	{
		const dir = await freshStudyDir("load-ok");
		const bin = await stub("rpc-ok.mjs", rpcStub(stateLine({ model: { id: "gpt-5.6-sol", provider: "openai-codex" }, autoCompactionEnabled: false })));
		const lp = await loadProbe({ study, studyDir: dir, profile: plainProfile, launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null });
		check("loadProbe: a profile whose model resolves with compaction off passes", lp.ok === true, lp.detail);
		check("loadProbe: …and says what it proved", /model gpt-5\.6-sol, compaction off/.test(lp.detail), lp.detail);
	}
	{
		const dir = await freshStudyDir("load-compaction");
		const bin = await stub("rpc-compaction.mjs", rpcStub(stateLine({ model: { id: "gpt-5.6-sol" }, autoCompactionEnabled: true })));
		const lp = await loadProbe({ study, studyDir: dir, profile: plainProfile, launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null });
		check("loadProbe: compaction still ON means the pinned settings were not read", lp.ok === false && /autoCompaction is true/.test(lp.detail), lp.detail);
	}
	{
		const dir = await freshStudyDir("load-model");
		const bin = await stub("rpc-model.mjs", rpcStub(stateLine({ model: { id: "gpt-4-something" }, autoCompactionEnabled: false })));
		const lp = await loadProbe({ study, studyDir: dir, profile: plainProfile, launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null });
		check("loadProbe: the wrong model resolving is a failure", lp.ok === false && /model resolved to gpt-4-something/.test(lp.detail), lp.detail);
	}
	{
		const dir = await freshStudyDir("load-silent");
		const bin = await stub("rpc-silent.mjs", 'process.stderr.write("extension failed to load: SyntaxError\\n");\nprocess.exit(1);\n');
		const lp = await loadProbe({ study, studyDir: dir, profile: plainProfile, launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null });
		check("loadProbe: no RPC response is a failure carrying the stderr", lp.ok === false && /no RPC response/.test(lp.detail), lp.detail);
	}
	{
		const dir = await freshStudyDir("load-garbage");
		const bin = await stub("rpc-garbage.mjs", rpcStub('{"type":"response","request":"get_state" NOT JSON\n'));
		const lp = await loadProbe({ study, studyDir: dir, profile: plainProfile, launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null });
		check("loadProbe: an unparseable RPC response is a failure, not a crash", lp.ok === false && /unparseable RPC response/.test(lp.detail), lp.detail);
	}
	{
		const dir = await freshStudyDir("load-blocked");
		const bin = await stub("rpc-unused.mjs", "process.exit(0);\n");
		const blockedProfile = { ...extProfile(path.join(root, "does-not-exist.ts")) };
		const lp = await loadProbe({ study, studyDir: dir, profile: blockedProfile, launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null });
		check("loadProbe: a missing extension path is reported before anything spawns", lp.ok === false && /needs-entry/.test(lp.detail), lp.detail);
	}

	// ── 2. registrationProbe and executeRun keep their salvage hook until the append ──────────────
	{
		const dir = await freshStudyDir("probe-inflight");
		const bin = await stub("probe-ok.mjs", emitScript(streamOf({ text: JSON.stringify(["read", ...TOOLS]) })));
		const p = await registrationProbe({ study, studyDir: dir, profile: extProfile(bin), launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null, pricer: null });
		check("registrationProbe: still succeeds with the salvage hook wired in", p.ok === true && p.tokens === 110, p.detail);
		check("registrationProbe: its hook is NOT dropped when the child exits", inflightKeys().includes(inflightProbeKey("research")), inflightKeys().join(","));
		releaseInflight(inflightProbeKey("research"));
		check("registrationProbe: …and releasing it clears the hook", !inflightKeys().includes(inflightProbeKey("research")));
	}
	{
		const dir = await freshStudyDir("run-inflight");
		const bin = await stub("run-ok.mjs", emitScript(streamOf({ text: "the answer", tokens: 500, tool: "web_search" })));
		const rec = await executeRun({
			study, studyDir: dir, task, profile: extProfile(bin), rep: 0, block: "t1|0",
			launcher: { cmd: process.execPath, pre: [bin] }, fingerprint: "fp", opts: { dryRun: false, keep: false, agentDir: null, pricer: null },
		});
		check("executeRun: a passing run is still state ok", rec.state === "ok" && rec.ok === true, `${rec.state} ${rec.error ?? ""}`);
		check("executeRun: its hook survives the child's exit (the postprocessing window)", inflightKeys().includes(inflightRunKey("t1", "research", 0)), inflightKeys().join(","));
		releaseInflight(inflightRunKey("t1", "research", 0));
		check("executeRun: …and the runner's release clears it", inflightKeys().length === 0, inflightKeys().join(","));
	}

	// ── 3. INTERRUPTION: during the child ────────────────────────────────────────────────────────
	// The child has emitted a session, a turn and one usage-bearing assistant message, then hangs.
	// It is PAID FOR. An interrupt has to write the evidence and the partial record before exiting.
	{
		const dir = await freshStudyDir("int-child");
		const resultsPath = path.join(dir, "results.jsonl");
		const marker = path.join(dir, "child-wrote");
		const bin = await stub("int-child.mjs", partialThenHang(streamOf({ text: "half way", tokens: 700 }).split("\n").slice(0, 4).join("\n"), marker));
		const running = executeRun({
			study, studyDir: dir, task, profile: extProfile(bin), rep: 0, block: "t1|0",
			launcher: { cmd: process.execPath, pre: [bin] }, fingerprint: "fp", opts: { dryRun: false, keep: false, agentDir: null, pricer: null, resultsPath, timeoutMs: 30000 },
		});
		check("interrupt/child: the run registers a salvage hook while the child is live", await waitFor(async () => inflightKeys().includes(inflightRunKey("t1", "research", 0))));
		check("interrupt/child: …and the child really has written part of its stream", await wrote(marker));
		const out = await handleInterrupt({ resultsPath, log: () => {}, drainMs: 500, confirmMs: 800 });
		check("interrupt/child: one paid operation was written down", out.persisted.length === 1, JSON.stringify(out.persisted.map((p) => p.key)));
		check("interrupt/child: …and the child was CONFIRMED dead, not assumed", out.killedCleanly === true, String(out.killedCleanly));
		const rows = await readJsonl(resultsPath);
		check("interrupt/child: the record is a run-error naming the interrupt", rows.length === 1 && rows[0].state === "run-error" && /interrupted \(SIGINT\)/.test(rows[0].error), JSON.stringify(rows[0]?.error));
		check("interrupt/child: …with the tokens measured so far, not zero", rows[0].totalTokens === 710 && spendOf(rows[0]) === 710, String(rows[0].totalTokens));
		check("interrupt/child: …flagged as unknown spend", rows[0].nestedUnknown === true && rows[0].ok === null);
		check("interrupt/child: …with no invented price", rows[0].cost === null && typeof rows[0].costReason === "string");
		check("interrupt/child: …and its measured wall time", typeof rows[0].wallMs === "number" && rows[0].wallMs >= 0, String(rows[0].wallMs));
		const ev = path.join(dir, rows[0].evidence);
		check("interrupt/child: the RAW LIVE BUFFER was persisted as evidence", (await fs.readFile(path.join(ev, "stream.jsonl"), "utf8")).includes('"turn_start"'));
		check("interrupt/child: …with stderr and argv beside it", (await fs.stat(path.join(ev, "stderr.txt"))).isFile() && (await fs.readFile(path.join(ev, "argv.txt"), "utf8")).includes("--mode json"));
		check("interrupt/child: the hook is consumed, so a second interrupt writes nothing twice", !inflightKeys().includes(inflightRunKey("t1", "research", 0)));
		const again = await handleInterrupt({ resultsPath, log: () => {}, drainMs: 50, confirmMs: 50 });
		check("interrupt/child: …a second pass persists nothing", again.persisted.length === 0 && (await readJsonl(resultsPath)).length === 1);
		await running.catch(() => {}); // the killed child resolves as a run-error; we already have the salvage
	}

	// ── 4. INTERRUPTION: after the child, during postprocessing ──────────────────────────────────
	// The window astra named: the child is finished and PAID, the record is not appended yet.
	{
		const dir = await freshStudyDir("int-post");
		const resultsPath = path.join(dir, "results.jsonl");
		const bin = await stub("int-post.mjs", emitScript(streamOf({ text: "the answer", tokens: 900, tool: "web_search", nestedUnknown: true })));
		const rec = await executeRun({
			study, studyDir: dir, task, profile: extProfile(bin), rep: 0, block: "t1|0",
			launcher: { cmd: process.execPath, pre: [bin] }, fingerprint: "fp", opts: { dryRun: false, keep: false, agentDir: null, pricer: null, resultsPath },
		});
		check("interrupt/postprocessing: the run completed and is still unrecorded", rec.state === "ok" && inflightKeys().includes(inflightRunKey("t1", "research", 0)));
		const out = await handleInterrupt({ resultsPath, log: () => {}, drainMs: 50, confirmMs: 50 });
		const rows = await readJsonl(resultsPath);
		check("interrupt/postprocessing: the paid run is written down anyway", out.persisted.length === 1 && rows[0].state === "run-error", JSON.stringify(rows[0]?.state));
		check("interrupt/postprocessing: …carrying the MEASURED spend from the finished child", rows[0].totalTokens === 910, String(rows[0].totalTokens));
		check("interrupt/postprocessing: …still flagged unknown-spend and unpriced", rows[0].nestedUnknown === true && rows[0].cost === null);
		check("interrupt/postprocessing: …with nothing alive to kill", out.killedCleanly === null, String(out.killedCleanly));
		check("interrupt/postprocessing: …and the evidence retained", (await fs.readFile(path.join(dir, rows[0].evidence, "stream.jsonl"), "utf8")).includes("agent_settled"));
	}

	// ── 5. INTERRUPTION: during the results append, and the REAL append implementations ──────────
	{
		const dir = await freshStudyDir("int-append");
		const resultsPath = path.join(dir, "results.jsonl");
		const bin = await stub("int-append.mjs", emitScript(streamOf({ text: "the answer", tokens: 300 })));
		const profile = extProfile(bin);
		let interruptOut = null;
		await runPlan({
			study: { ...study, profiles: [profile] },
			studyDir: dir,
			tasks: [task],
			todo: [{ task: "t1", profile: profile.name, rep: 0, block: "t1|0" }],
			launcher: { cmd: process.execPath, pre: [bin] },
			fingerprint: "fp",
			agentDir: null,
			pricer: null,
			resultsPath,
			runOpts: { dryRun: false, keep: false, agentDir: null, pricer: null },
			priorRecords: [],
			deps: {
				ledger: [],
				blockKeys: new Map(),
				log: () => {},
				// the probe is stubbed out here; interruption DURING a probe is case 6 below
				registrationProbe: async () => ({ ok: true, detail: "stub", tokens: 0, cost: 0, wallMs: 0, killedCleanly: null, timedOut: false, evidence: "raw/_probe/x" }),
				appendLedger: async () => {},
				// Ctrl-C lands INSIDE the append: the record is not on disk yet, and the run is paid.
				appendResult: async (p, rec) => {
					interruptOut = await handleInterrupt({ resultsPath: p, log: () => {}, drainMs: 50, confirmMs: 50 });
					await fs.appendFile(p, `${JSON.stringify(rec)}\n`);
				},
			},
		});
		const rows = await readJsonl(resultsPath);
		check("interrupt/append: an interrupt inside the append still salvages the run", interruptOut?.persisted.length === 1, JSON.stringify(interruptOut?.persisted.map((x) => x.key)));
		check("interrupt/append: …the salvaged record carries the spend and the unknown flag", rows[0].state === "run-error" && rows[0].totalTokens === 310 && rows[0].nestedUnknown === true, JSON.stringify([rows[0].state, rows[0].totalTokens]));
		check("interrupt/append: …and it went to the SAME results file the runner appends to", rows.length === 2 && rows[1].state === "ok", String(rows.length));
		releaseInflight(inflightRunKey("t1", "research", 0));
	}

	// ── 6. INTERRUPTION during the registration probe: the ledger, not the results file ───────────
	{
		const dir = await freshStudyDir("int-probe");
		const marker = path.join(dir, "probe-wrote");
		const bin = await stub("int-probe.mjs", partialThenHang(streamOf({ text: "[\"read\"", tokens: 250 }).split("\n").slice(0, 4).join("\n"), marker));
		const running = registrationProbe({ study, studyDir: dir, profile: extProfile(bin), launcher: { cmd: process.execPath, pre: [bin] }, agentDir: null, pricer: null, timeoutMs: 30000 });
		check("interrupt/probe: the probe registers a salvage hook of its own", await waitFor(async () => inflightKeys().includes(inflightProbeKey("research"))));
		check("interrupt/probe: …and the probe child really has written part of its stream", await wrote(marker));
		const out = await handleInterrupt({ resultsPath: path.join(dir, "results.jsonl"), log: () => {}, drainMs: 500, confirmMs: 800 });
		check("interrupt/probe: the probe's partial spend is written down", out.persisted.length === 1, JSON.stringify(out.persisted.map((p) => p.key)));
		const ledger = await readLedger(dir);
		check("interrupt/probe: …to the LEDGER, where probe spend lives", ledger.length === 1 && ledger[0].kind === "registration-probe", JSON.stringify(ledger[0] ?? null).slice(0, 120));
		check("interrupt/probe: …with the tokens it had already spent", ledger[0].tokens === 260, String(ledger[0].tokens));
		check("interrupt/probe: …not marked ok, so a resume re-runs it rather than trusting it", ledger[0].ok === false && ledger[0].interrupted === true);
		check("interrupt/probe: …and unpriced", ledger[0].cost === null);
		check("interrupt/probe: …with the raw buffer as evidence", (await fs.readFile(path.join(dir, ledger[0].evidence, "stream.jsonl"), "utf8")).includes('"turn_start"'));
		check("interrupt/probe: no results line was written for a probe", await fs.readFile(path.join(dir, "results.jsonl"), "utf8").then(() => false).catch(() => true));
		await running.catch(() => {});
		releaseInflight(inflightProbeKey("research"));
	}

	// ── 7. the REAL appendLedger and appendResult on the happy path ───────────────────────────────
	// astra's requested DI answer was "no": the other orchestration test replaces BOTH append
	// functions even when nothing is meant to fail, so production's own writers were never driven.
	{
		const dir = await freshStudyDir("real-appends");
		const resultsPath = path.join(dir, "results.jsonl");
		const bin = await stub("real-append.mjs", emitScript(streamOf({ text: "the answer", tokens: 120 })));
		const profile = extProfile(bin);
		const logs = [];
		await runPlan({
			study: { ...study, profiles: [profile] },
			studyDir: dir,
			tasks: [task],
			todo: [0, 1].map((rep) => ({ task: "t1", profile: profile.name, rep, block: `t1|${rep}` })),
			launcher: { cmd: process.execPath, pre: [bin] },
			fingerprint: "fp",
			agentDir: null,
			pricer: null,
			resultsPath,
			runOpts: { dryRun: false, keep: false, agentDir: null, pricer: null },
			priorRecords: [],
			// ONLY the probe is stubbed (it would need a real extension to spawn); both appends and
			// executeRun are production code writing real files.
			deps: {
				ledger: [],
				blockKeys: new Map(),
				log: (m) => logs.push(String(m)),
				registrationProbe: async () => ({ ok: true, detail: "all registered", tokens: 700, cost: 0.004, wallMs: 900, killedCleanly: null, timedOut: false, evidence: "raw/_probe/x" }),
			},
		});
		const rows = await readJsonl(resultsPath);
		check("real appends: production appendResult wrote one line per run", rows.length === 2 && rows.every((r) => r.state === "ok"), JSON.stringify(rows.map((r) => r.state)));
		check("real appends: …on a newline boundary, so the next append is readable", (await fs.readFile(resultsPath, "utf8")).endsWith("\n"));
		const ledger = await readLedger(dir);
		check("real appends: production appendLedger recorded the probe's spend", ledger.length === 1 && ledger[0].tokens === 700 && ledger[0].kind === "registration-probe", JSON.stringify(ledger[0] ?? null).slice(0, 110));
		check("real appends: …timestamped, so a resume can order it", typeof ledger[0].ts === "string");
		check("real appends: every hook was released once its append was acknowledged", inflightKeys().length === 0, inflightKeys().join(","));
		check("real appends: the budget line counts the probe AND both runs", logs.some((l) => /spent 960 tokens/.test(l)), logs.filter((l) => /spent/.test(l)).join(" | "));
		// and an interrupt after all that has nothing left to salvage
		const out = await handleInterrupt({ resultsPath, log: () => {}, drainMs: 20, confirmMs: 20 });
		check("real appends: …so an interrupt afterwards writes nothing", out.persisted.length === 0 && (await readJsonl(resultsPath)).length === 2);
	}

	// ── 8. a results-append FAILURE stops the study, with the real appendResult ───────────────────
	{
		const dir = await freshStudyDir("append-fails");
		// results.jsonl as a DIRECTORY makes the production append fail with EISDIR.
		const resultsPath = path.join(dir, "results.jsonl");
		await fs.mkdir(resultsPath, { recursive: true });
		const bin = await stub("append-fails.mjs", emitScript(streamOf({ text: "the answer", tokens: 400 })));
		const profile = extProfile(bin);
		let error = null;
		let runs = 0;
		try {
			await runPlan({
				study: { ...study, profiles: [profile] },
				studyDir: dir,
				tasks: [task],
				todo: [0, 1].map((rep) => ({ task: "t1", profile: profile.name, rep, block: `t1|${rep}` })),
				launcher: { cmd: process.execPath, pre: [bin] },
				fingerprint: "fp",
				agentDir: null,
				pricer: null,
				resultsPath,
				runOpts: { dryRun: false, keep: false, agentDir: null, pricer: null },
				priorRecords: [],
				deps: {
					ledger: [],
					blockKeys: new Map(),
					log: () => {},
					registrationProbe: async () => ({ ok: true, detail: "stub", tokens: 0, cost: 0, wallMs: 0, killedCleanly: null, timedOut: false, evidence: "raw/_probe/x" }),
					appendLedger: async () => {},
					executeRun: async (a) => {
						runs++;
						return { ts: "t", fingerprint: "fp", task: a.task.id, profile: a.profile.name, rep: a.rep, state: "ok", ok: true, totalTokens: 410, spend: 410, wallMs: 10, turns: 1, toolCalls: {}, tokens: { totalTokens: 410, cost: { total: 0.002 } } };
					},
				},
			});
		} catch (e) {
			error = e.message;
		}
		check("append failure: a results append that fails STOPS the study", error !== null, error ?? "no error");
		check("append failure: …naming the spend that is now unrecorded", /could not record a completed run \(410 tokens already spent\)/.test(error ?? ""), (error ?? "").slice(0, 140));
		check("append failure: …and no further paid child starts", runs === 1, `runs=${runs}`);
	}

	// ── 9. the SIGINT wiring itself, driven through process.emit ──────────────────────────────────
	// installInterruptHandler is what main() calls; driving the handler it registers proves the wiring
	// as well as the salvage, without a real signal killing this test process.
	{
		const dir = await freshStudyDir("sigint-wiring");
		const resultsPath = path.join(dir, "results.jsonl");
		const marker = path.join(dir, "sigint-wrote");
		const bin = await stub("sigint.mjs", partialThenHang(streamOf({ text: "half", tokens: 40 }).split("\n").slice(0, 4).join("\n"), marker));
		const codes = [];
		const logs = [];
		const before = process.listenerCount("SIGINT");
		const handler = installInterruptHandler({ resultsPath, studyDir: dir, log: (m) => logs.push(String(m)), exit: (c) => codes.push(c) });
		check("SIGINT wiring: the handler is registered on the process", process.listenerCount("SIGINT") === before + 1);
		const running = executeRun({
			study, studyDir: dir, task, profile: extProfile(bin), rep: 0, block: "t1|0",
			launcher: { cmd: process.execPath, pre: [bin] }, fingerprint: "fp", opts: { dryRun: false, keep: false, agentDir: null, pricer: null, resultsPath, timeoutMs: 30000 },
		});
		await waitFor(async () => inflightKeys().includes(inflightRunKey("t1", "research", 0)));
		check("SIGINT wiring: the child has written part of its stream before the signal", await wrote(marker));
		process.emit("SIGINT");
		check("SIGINT wiring: the record lands before the exit is requested", await waitFor(async () => codes.length > 0, 6000) && (await readJsonl(resultsPath)).length === 1, JSON.stringify(codes));
		check("SIGINT wiring: …and it exits 130", codes[0] === 130, JSON.stringify(codes));
		const rows = await readJsonl(resultsPath);
		check("SIGINT wiring: …with the interrupted record and its partial spend", rows[0].state === "run-error" && rows[0].totalTokens === 50, JSON.stringify([rows[0].state, rows[0].totalTokens]));
		process.emit("SIGINT");
		await new Promise((r) => setTimeout(r, 200));
		check("SIGINT wiring: a second Ctrl-C does not start a second salvage pass", codes.length === 1, JSON.stringify(codes));
		process.removeListener("SIGINT", handler);
		await running.catch(() => {});
		releaseInflight(inflightRunKey("t1", "research", 0));
	}

	check("EVERY orchestration path was driven: nothing is left registered", inflightKeys().length === 0, inflightKeys().join(","));
} finally {
	await fs.rm(root, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
