// Stream parsing: tokens, nested tokens, turns, per-tool counts, retries, terminal completion,
// dangling tool calls, final text, error detection. Fixtures are captured/constructed event
// streams — no model is called.
// Run: node apps/bench/test/usage.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addUsage, costOfRecord, costTotal, costUnknownReason, emptyUsage, incompleteReason, observedCostOfRecord, parseStream, totalTokens } from "../lib/usage.mjs";
import { loadPiExports, PI_MIN_VERSION, REQUIRED_PI_AI } from "../lib/pi-exports.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(here, "fixtures", f), "utf8");

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

const s = parseStream(read("sample-stream.jsonl"));

// Usage is carried in pi-ai's PUBLIC field names — input/output/cacheRead/cacheWrite/totalTokens
// — so there is no rename left to drift out of step with pi.
check("usage uses pi-ai's field names, not ours", ["input", "output", "cacheRead", "cacheWrite", "totalTokens", "cost"].every((k) => k in s.tokens) && !("in" in s.tokens));
check("tokens.input sums the ASSISTANT messages", s.tokens.input === 1000 + 2000, String(s.tokens.input));
check("tokens.output summed", s.tokens.output === 50 + 80, String(s.tokens.output));
check("tokens.cacheRead summed", s.tokens.cacheRead === 200 + 900, String(s.tokens.cacheRead));
check("tokens.cacheWrite summed", s.tokens.cacheWrite === 10, String(s.tokens.cacheWrite));
// pi's OWN totalTokens, summed — never recomputed from the buckets.
check("own total is pi's totalTokens, summed", totalTokens(s.tokens) === 1260 + 2980, String(totalTokens(s.tokens)));
check("the tool result's usage is NESTED, not own", totalTokens(s.nested) === 10, String(totalTokens(s.nested)));
check("own + nested is the true total", totalTokens(s.tokens) + totalTokens(s.nested) === 4250);
// addUsage is the ONE piece of usage arithmetic that is ours, because pi exports no summing helper.
const acc = emptyUsage();
addUsage(acc, { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, totalTokens: 10, cost: { input: 0.1, output: 0, cacheRead: 0, cacheWrite: 0, total: 0.1 } });
addUsage(acc, { input: 1, output: 1, cacheRead: 1, cacheWrite: 1, totalTokens: 4, cost: { input: 0.2, output: 0, cacheRead: 0, cacheWrite: 0, total: 0.2 } });
check("addUsage sums every public field including totalTokens", acc.input === 2 && acc.output === 3 && acc.totalTokens === 14, JSON.stringify(acc));
check("addUsage sums pi's cost too", Math.abs(acc.cost.total - 0.3) < 1e-9 && Math.abs(acc.cost.input - 0.3) < 1e-9);
check("addUsage ignores a missing usage object", addUsage(acc, undefined) === false);
check("two assistant messages contributed own usage", s.usageMessages === 2, String(s.usageMessages));
check("one tool message contributed nested usage", s.nestedMessages === 1, String(s.nestedMessages));
check("turns counted from turn_start", s.turns === 2, String(s.turns));
check("tool calls counted per tool", JSON.stringify(s.toolCalls) === JSON.stringify({ grep: 2, read: 1, parallel: 1 }), JSON.stringify(s.toolCalls));
check("the builtin `parallel` tool is counted like any other", s.toolCalls.parallel === 1);
check("final text concatenates the last assistant's text blocks", s.finalText === "packages/nana-stage/lib/blocks.mjs:53", JSON.stringify(s.finalText));
check("thinking blocks are excluded from final text", !s.finalText.includes("hmm"));
check("a malformed line is counted, not fatal", s.badLines === 1, String(s.badLines));
check("session id captured", s.sessionId === "11111111-2222-3333-4444-555555555555");
check("complete when settled, no errors, nothing dangling", s.complete === true);

// COMPLETION: agent_end is not terminal (rpc.md:864); agent_settled is (rpc.md:866).
const trunc = parseStream(read("truncated-stream.jsonl"));
check("truncated: agent_end present but NOT settled", trunc.agentEnded === 1 && trunc.settled === false);
check("truncated: NOT complete", trunc.complete === false);
check("truncated: dangling tool call detected", trunc.dangling.length === 1, JSON.stringify(trunc.dangling));
check("truncated: final assistant left a tool call unresolved", trunc.unresolvedFinal.join() === "bash", JSON.stringify(trunc.unresolvedFinal));
check("truncated: reason names the missing terminator first", /agent_settled/.test(incompleteReason(trunc)), incompleteReason(trunc));
check("truncated: partial usage is still recorded (a killed run still cost money)", totalTokens(trunc.tokens) === 920, String(totalTokens(trunc.tokens)));
check("a stream with a plausible answer but no terminator cannot pass", trunc.finalText.includes("blocks.mjs:53") && trunc.complete === false);

// RETRIES: pinned off in the prepared agent dir, but counted if they ever happen (rpc.md:1109).
const rt = parseStream(read("retry-stream.jsonl"));
check("retries counted from auto_retry_start", rt.retries === 2, String(rt.retries));
check("retry error text captured", rt.retryEvents[0].error.includes("529"), JSON.stringify(rt.retryEvents[0]));
check("compaction counted", rt.compactions === 1, String(rt.compactions));
check("a retried run that settles is still complete", rt.complete === true);

// NESTED USAGE — the full accounting is exercised in nested.test.mjs; these are the parser's
// share of the contract.
const nu = parseStream(read("nested-usage-stream.jsonl"));
check("nested tokens captured separately from own tokens", totalTokens(nu.nested) === 4810, String(totalTokens(nu.nested)));
check("own tokens EXCLUDE the nested call (no double counting)", totalTokens(nu.tokens) === 1530, String(totalTokens(nu.tokens)));
check("nested call count recorded", nu.nestedCalls === 1, String(nu.nestedCalls));
check("nestedUnknown false when the usage was measured", nu.nestedUnknown === false);

const unk = parseStream(read("nested-unknown-stream.jsonl"));
check("UNMEASURED nested work is flagged, never reported as 0", unk.nestedUnknown === true && totalTokens(unk.nested) === 0);
check("…and the run's own tokens are untouched by the flag", totalTokens(unk.tokens) === 105);

// An errored run: pi exits 0 in --mode json (print-mode.js:110-127), so the stream is the only
// place the failure is visible.
const e = parseStream(read("error-stream.jsonl"));
check("error stopReason → not complete", e.complete === false);
check("error message captured", e.errors.length === 1 && e.errors[0].includes("401 unauthorized"), JSON.stringify(e.errors));
check("errored run still reports its tokens", e.tokens.input === 10, String(e.tokens.input));
check("the error text, not the terminator, is the reported reason", incompleteReason(e).includes("401"));

// Degenerate inputs must not throw.
for (const [name, input] of [["empty", ""], ["null", null], ["garbage", "not json at all\n{"], ["only header", '{"type":"session","id":"x"}']]) {
	let threw = null;
	try {
		threw = parseStream(input).complete === false ? null : "expected complete=false";
	} catch (err) {
		threw = err.message;
	}
	check(`degenerate input (${name}) parses to complete=false without throwing`, threw === null, threw ?? "");
}

// A REAL captured stream (pi 0.84.4, --mode json, openai-codex/gpt-5.6-sol, code-define-small on
// pi-defaults, 2026-09-08). Only the event types the parser reads are kept and one large
// tool-result body is truncated; every usage, tool, turn and stopReason field is verbatim, and
// these numbers match a parse of the full 63-line raw stream.
const real = parseStream(read("real-smoke-stream.jsonl"));
check("real stream: tokens.input", real.tokens.input === 4148, String(real.tokens.input));
check("real stream: tokens.output", real.tokens.output === 55, String(real.tokens.output));
check("real stream: tokens.cacheRead", real.tokens.cacheRead === 1024, String(real.tokens.cacheRead));
check("real stream: total is pi's totalTokens (1168 + 4059)", totalTokens(real.tokens) === 5227, String(totalTokens(real.tokens)));
// COST comes from pi: each assistant message already carries `usage.cost`, computed by pi's own
// calculateCost with the real model pricing. We only add the numbers up.
check("real stream: cost is summed from pi's own per-message cost", Math.abs(costTotal(real.tokens) - 0.022902) < 1e-9, String(costTotal(real.tokens)));
check("real stream: the cost buckets are summed too", Math.abs(real.tokens.cost.input - 0.02074) < 1e-9 && Math.abs(real.tokens.cost.cacheRead - 0.000512) < 1e-9, JSON.stringify(real.tokens.cost));
check("real stream: the model pi used is recorded", real.model === "gpt-5.6-sol", String(real.model));
check("nothing nested here, so nested cost is a real zero, not a null", real.nestedCost !== null && costTotal(real.nested) === 0);
check("real stream: turns", real.turns === 2, String(real.turns));
check("real stream: tool mix", JSON.stringify(real.toolCalls) === JSON.stringify({ bash: 1 }), JSON.stringify(real.toolCalls));
check("real stream: final text is the answer", real.finalText === "packages/nana-stage/lib/blocks.mjs:53", JSON.stringify(real.finalText));
check("real stream: reached agent_settled", real.settled === true);
check("real stream: complete, no dangling calls", real.complete === true && real.dangling.length === 0);
check("real stream: no malformed lines", real.badLines === 0, String(real.badLines));
check("real stream: no retries under the pinned settings", real.retries === 0);

// ── nested cost: priced with pi's calculateCost, or null WITH a reason. Never a guessed 0. ────
const nestedNoPricer = parseStream(read("nested-usage-stream.jsonl"));
check("nested spend with no pricer is null, not 0", nestedNoPricer.nestedCost === null);
check("…and says why", /no pricer/.test(nestedNoPricer.nestedCostReason ?? ""), String(nestedNoPricer.nestedCostReason));
const priced = parseStream(read("nested-usage-stream.jsonl"), { pricer: () => ({ cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0, total: 3 }, reason: null }) });
check("a pricer supplies the nested cost", priced.nestedCost.total === 3);
const unpriceable = parseStream(read("nested-usage-stream.jsonl"), { pricer: () => ({ cost: null, reason: "model x is not in pi's offline catalog" }) });
check("an unpriceable nested model stays null with pi's reason", unpriceable.nestedCost === null && /offline catalog/.test(unpriceable.nestedCostReason));
check("the nested model id is surfaced for pricing", nestedNoPricer.nestedModels.includes("gpt-5.6-sol"), JSON.stringify(nestedNoPricer.nestedModels));

// ── MIXED pricing: one bucket prices, another does not (astra round 5, C) ─────────────────────
// `nestedCost` must go null for the whole run — a partial total would understate it. But the
// buckets that DID price are real, known dollars, and the observed LOWER BOUND has to keep them:
// dropping them because a different model was unpriceable understates the bound instead.
{
	const mixedStream = [
		{ type: "session", version: 3, id: "mix", timestamp: "2026-09-09T00:00:00.000Z", cwd: "/tmp" },
		{ type: "turn_start" },
		{ type: "tool_execution_start", toolCallId: "w1", toolName: "web_search", args: {} },
		{
			type: "message_end",
			message: {
				role: "toolResult",
				toolCallId: "w1",
				toolName: "web_search",
				content: [],
				isError: false,
				timestamp: 2,
				usage: { input: 3000, output: 200, cacheRead: 0, cacheWrite: 0, totalTokens: 3200, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
				details: {
					benchNested: {
						calls: 2,
						models: ["gpt-5.6-terra", "gpt-5.6-luna"],
						byModel: {
							"openai-codex/gpt-5.6-terra": { input: 2000, output: 100, cacheRead: 0, cacheWrite: 0, totalTokens: 2100, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
							"openai-codex/gpt-5.6-luna": { input: 1000, output: 100, cacheRead: 0, cacheWrite: 0, totalTokens: 1100, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
						},
					},
				},
			},
		},
		{
			type: "message_end",
			message: {
				role: "assistant",
				content: [{ type: "text", text: "done" }],
				provider: "openai-codex",
				model: "gpt-5.6-sol",
				usage: { input: 500, output: 20, cacheRead: 0, cacheWrite: 0, totalTokens: 520, cost: { input: 0.005, output: 0.001, cacheRead: 0, cacheWrite: 0, total: 0.006 } },
				stopReason: "stop",
				timestamp: 3,
			},
		},
		{ type: "agent_end", messages: [] },
		{ type: "agent_settled" },
	]
		.map((l) => JSON.stringify(l))
		.join("\n");
	// terra prices at $0.04; luna is not in the offline catalog.
	const halfPricer = (_u, { model }) =>
		model === "gpt-5.6-terra"
			? { cost: { input: 0.03, output: 0.01, cacheRead: 0, cacheWrite: 0, total: 0.04 }, reason: null }
			: { cost: null, reason: `${model} is not in pi's offline catalog` };
	const mixed = parseStream(mixedStream, { pricer: halfPricer });
	check("mixed pricing: nestedCost is null for the whole run", mixed.nestedCost === null);
	check("mixed pricing: …naming the bucket that could not be priced", /gpt-5\.6-luna is not in pi's offline catalog/.test(mixed.nestedCostReason ?? ""), String(mixed.nestedCostReason));
	check("mixed pricing: the priced buckets are RETAINED separately", mixed.pricedNestedCost?.total === 0.04, JSON.stringify(mixed.pricedNestedCost));
	check("mixed pricing: per-model costs record which one is unknown", mixed.nestedCostByModel["openai-codex/gpt-5.6-terra"] === 0.04 && mixed.nestedCostByModel["openai-codex/gpt-5.6-luna"] === null, JSON.stringify(mixed.nestedCostByModel));
	// The record the runner would persist for that run.
	const rec = {
		tokens: mixed.tokens,
		nestedTokens: mixed.nested,
		nestedUnknown: mixed.nestedUnknown,
		cost: null,
		costReason: mixed.nestedCostReason,
		nestedCost: mixed.nestedCost,
		pricedNestedCost: mixed.pricedNestedCost,
	};
	check("mixed pricing: the run has no total cost", costOfRecord(rec) === null);
	check("mixed pricing: …but its observed lower bound keeps own + priced nested", Math.abs(observedCostOfRecord(rec) - 0.046) < 1e-9, String(observedCostOfRecord(rec)));
	check("mixed pricing: …and the reason is readable", typeof costUnknownReason(rec) === "string" && costUnknownReason(rec).length > 0, String(costUnknownReason(rec)));
	// UNKNOWN nested spend is a different condition from "unpriced", and both null the total.
	const unknownRec = { tokens: mixed.tokens, nestedTokens: mixed.nested, nestedUnknown: true, nestedUnknownReason: "no-network-observed", cost: null, pricedNestedCost: mixed.pricedNestedCost };
	check("unknown nested spend: no total cost", costOfRecord(unknownRec) === null);
	check("unknown nested spend: the observed bound is STILL the known dollars, not 0", Math.abs(observedCostOfRecord(unknownRec) - 0.046) < 1e-9, String(observedCostOfRecord(unknownRec)));
	check("unknown nested spend: the reason names the unmeasured part", /unmeasured nested spend/.test(costUnknownReason(unknownRec) ?? ""), String(costUnknownReason(unknownRec)));
}

// ── startup export check: a bench must FAIL rather than substitute its own arithmetic ──────────
{
	const stub = (mod) => async () => mod;
	let threw = null;
	try {
		await loadPiExports({ piBin: null, importer: stub({ ModelRuntime: function () {} }) }); // no calculateCost
	} catch (e) {
		threw = e.message;
	}
	check("a pi without calculateCost fails LOUDLY at startup", threw !== null);
	check("…naming the missing export", /calculateCost \(expected function/.test(threw ?? ""), (threw ?? "").split("\n")[1] ?? "");
	check("…and refusing to fall back", /will NOT substitute its own arithmetic/.test(threw ?? ""));
	check("…and naming the version it was verified against", (threw ?? "").includes(PI_MIN_VERSION));
	check("the required-export list is exported so it is reviewable", REQUIRED_PI_AI.calculateCost === "function");

	threw = null;
	try {
		await loadPiExports({ piBin: null, importer: stub({ calculateCost: () => {} }) }); // no ModelRuntime
	} catch (e) {
		threw = e.message;
	}
	check("a pi without ModelRuntime also fails loudly", /ModelRuntime \(expected function/.test(threw ?? ""), (threw ?? "").split("\n")[1] ?? "");

	// A BENCH_PI_ROOT that points nowhere must fail with the paths it tried, not fall back.
	const prev = process.env.BENCH_PI_ROOT;
	process.env.BENCH_PI_ROOT = "/definitely/not/a/pi/install";
	threw = null;
	try {
		await loadPiExports({ piBin: null });
	} catch (e) {
		threw = e.message;
	}
	if (prev === undefined) delete process.env.BENCH_PI_ROOT;
	else process.env.BENCH_PI_ROOT = prev;
	check("a wrong BENCH_PI_ROOT fails and names the path tried", /definitely\/not\/a\/pi\/install/.test(threw ?? ""), (threw ?? "").slice(0, 80));
	check("…and tells the maintainer how to fix it", /npm i -g @earendil-works\/pi-coding-agent/.test(threw ?? ""));
}

process.exit(fails ? 1 : 0);
