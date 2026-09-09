// Nested-LLM-spend accounting. Each block below is a defect astra reproduced; the assertions are
// written so that the OLD behaviour fails them.
//   1. own-call contamination — pi's own Codex requests also go through globalThis.fetch
//   2. lost late usage — a body read that finishes after the empty check
//   3. double counting — tool usage added to both `tokens` and `nested`
//   4. suppressed unknown — measured usage hid an unmeasurable call in the same window
// No pi, no network, no model.
// Run: node apps/bench/test/nested.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRecorder, harvestTerminal, isLlmEndpoint, mapUsage } from "../lib/nested.mjs";
import { parseStream, totalTokens } from "../lib/usage.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(here, "fixtures", f), "utf8");
let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

const CODEX = "https://chatgpt.com/backend-api/codex/responses";
const sse = (frames) => frames.map((f) => `data: ${JSON.stringify(f)}`).join("\n\n") + "\n\ndata: [DONE]\n";
const completed = (usage, model = "gpt-5.6-sol") => ({ type: "response.completed", response: { model, usage } });
const inProgress = (usage) => ({ type: "response.in_progress", response: { model: "gpt-5.6-sol", usage } });
const U = (i, o, c = 0) => ({ input_tokens: i, output_tokens: o, total_tokens: i + o, input_tokens_details: { cached_tokens: c } });

// ── usage mapping ────────────────────────────────────────────────────────────────────────────
check("mapUsage splits cached out of input, as pi does", JSON.stringify(mapUsage(U(1000, 50, 200))) === JSON.stringify({ input: 800, output: 50, cacheRead: 200, cacheWrite: 0, totalTokens: 1050 }));
check("mapUsage returns null for an absent/empty usage object", mapUsage(undefined) === null && mapUsage({}) === null);
check("isLlmEndpoint matches the Codex responses URL", isLlmEndpoint(CODEX));
check("isLlmEndpoint ignores an ordinary web fetch", !isLlmEndpoint("https://registry.npmjs.org/chalk"));

// ── 2b. dedupe: one request contributes its usage ONCE ───────────────────────────────────────
const multi = sse([inProgress(U(900, 10)), inProgress(U(900, 30)), completed(U(1000, 50, 200))]);
const h = harvestTerminal(multi);
check("harvestTerminal takes the TERMINAL frame only", h.usage.output === 50 && h.usage.input === 800, JSON.stringify(h.usage));
check("harvestTerminal keeps the model id", h.model === "gpt-5.6-sol");
check("harvestTerminal reads a plain JSON body too", harvestTerminal(JSON.stringify({ model: "m", usage: U(10, 5) })).usage.output === 5);
check("harvestTerminal returns null when there is no usage at all", harvestTerminal(sse([{ type: "response.created", response: {} }])) === null);
check("a stream with usage but no terminal frame still counts once", harvestTerminal(sse([inProgress(U(7, 3))])).usage.output === 3);

// ── 1. SCOPE: pi's own model calls must NOT be counted as nested ──────────────────────────────
{
	const r = createRecorder({ watch: ["web_search"] });
	// pi's agent-loop request: same URL, same process, but NO tool is executing.
	check("a request outside any tool window is NOT counted", r.note(CODEX) === null);
	check("…and is recorded as a skipped own call", r.skippedOwnCalls === 1);
	check("…so the window has nothing to report", r.snapshot("web_search") === null);

	r.openWindow("web_search");
	const id = r.note(CODEX);
	check("a request INSIDE a watched tool window is counted", id !== null);
	r.resolve(id, sse([completed(U(3000, 400, 1200))]));
	r.closeWindow("web_search");
	const snap = r.snapshot("web_search");
	check("the nested usage is reported", snap.usage.input === 1800 && snap.usage.cacheRead === 1200 && snap.usage.output === 400, JSON.stringify(snap.usage));
	check("the report says how many own calls were skipped", snap.details.skippedOwnCalls === 1);

	// After the window closes, pi's next model call must not be attributed to the extension.
	check("a request AFTER the window closes is not counted", r.note(CODEX) === null);
	check("…and the accumulator stays empty", r.snapshot("web_search") === null);
}
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("bash"); // an UNwatched tool is not a window
	check("an unwatched tool does not open a counting window", r.note(CODEX) === null && r.skippedOwnCalls === 1);
	r.closeWindow("bash");
}
{
	// Parallel siblings: two watched tools preflighted before either finishes (extensions.md:784).
	const r = createRecorder({ watch: ["web_search", "fetch_content"] });
	r.openWindow("web_search");
	r.openWindow("fetch_content");
	const a = r.note(CODEX);
	r.closeWindow("web_search");
	check("the window stays open while a sibling watched tool is still running", r.note(CODEX) !== null);
	r.resolve(a, sse([completed(U(100, 10))]));
	r.closeWindow("fetch_content");
	check("only after the LAST sibling closes is the window shut", r.note(CODEX) === null);
}

// ── 2. COMPLETION: late, failed and timed-out harvesting are unknown, never zero ──────────────
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("web_search");
	const id = r.note(CODEX);
	r.closeWindow("web_search");
	// The body read has NOT finished. Snapshotting now must not claim "nothing happened".
	r.markPendingUnknown();
	const snap = r.snapshot("web_search");
	check("an unfinished body read is reported as unknown, not as no-spend", snap !== null && snap.details.unknown === true);
	check("…with no usage object, because nothing was measured", snap.usage === undefined);
}
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("web_search");
	r.fail(r.note(CODEX));
	check("a failed request (network error) marks unknown", r.snapshot("web_search").details.unknown === true);
}
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("web_search");
	r.resolve(r.note(CODEX), "<html>gateway error</html>");
	const snap = r.snapshot("web_search");
	check("an unparseable body marks unknown rather than 0", snap.details.unknown === true && snap.usage === undefined);
}

// ── 5. SILENCE IS NOT ZERO: a watched tool that ran with no observed network ─────────────────
// Seen in the wild: one of two pi-web-access `web_search` calls returned an LLM-style summary
// while no request reached the interceptor. A cache hit and a transport we cannot see are
// indistinguishable from here, so the window is unknown, not free.
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("web_search");
	r.closeWindow("web_search");
	const snap = r.snapshot("web_search");
	check("a watched tool that produced NO observable network is unknown, not free", snap !== null && snap.details.unknown === true);
	check("…with a reason a reviewer can act on", snap.details.unknownReason === "no-network-observed", String(snap.details.unknownReason));
	check("…and no usage invented for it", snap.usage === undefined);
}
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("web_search");
	r.note("https://duckduckgo.com/html?q=chalk"); // real traffic, just not an LLM endpoint
	r.closeWindow("web_search");
	check("a tool that made only NON-LLM requests is genuinely free (no flag)", r.snapshot("web_search") === null);
}
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("web_search");
	r.resolve(r.note(CODEX), sse([completed(U(10, 5))]));
	r.closeWindow("web_search");
	const snap = r.snapshot("web_search");
	check("a measured window is not flagged by the silence rule", snap.details.unknown === false && snap.details.observedRequests === 1);
}
{
	// watch-all mode must open and close symmetrically, or every window would stay open
	const r = createRecorder({});
	r.openWindow("bash");
	check("watch-all: any tool opens a window", r.inWindow === true);
	r.closeWindow("bash");
	check("watch-all: the same tool closes it", r.inWindow === false);
}

// ── 4. UNKNOWN IS INDEPENDENT of a measured call in the same window ───────────────────────────
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("web_search");
	r.resolve(r.note(CODEX), sse([completed(U(2000, 100))]));
	r.fail(r.note(CODEX));
	const snap = r.snapshot("web_search");
	check("a window with one measured and one unmeasurable call reports BOTH", snap.usage.input === 2000 && snap.details.unknown === true, JSON.stringify(snap.details));
	check("…and counts only the measured call", snap.details.calls === 1);
	check("…and reports how many requests were observed at all", snap.details.observedRequests === 2, String(snap.details.observedRequests));
}
{
	const r = createRecorder({ watch: ["web_search"] });
	r.openWindow("web_search");
	r.resolve(r.note(CODEX), sse([completed(U(5, 5))]));
	r.closeWindow("web_search");
	r.snapshot("web_search");
	check("state resets between windows (no carry-over into the next tool)", r.snapshot("web_search") === null);
}

// ── 3. the parser keeps own and nested APART, so nobody can add tool usage twice ──────────────
const nu = parseStream(read("nested-usage-stream.jsonl"));
check("own tokens are the ASSISTANT messages only", totalTokens(nu.tokens) === 1530, String(totalTokens(nu.tokens)));
check("nested tokens are the tool-carried usage only", totalTokens(nu.nested) === 4810, String(totalTokens(nu.nested)));
check("own + nested = the true total (astra's 1,530 + 4,810 = 6,340)", totalTokens(nu.tokens) + totalTokens(nu.nested) === 6340);
check("tool usage is NOT also inside `tokens`", totalTokens(nu.tokens) !== 6340);

const mixed = parseStream(read("nested-mixed-stream.jsonl"));
check("stream: measured nested usage AND unknown are both reported", totalTokens(mixed.nested) === 2100 && mixed.nestedUnknown === true);
check("stream: own tokens unaffected by the flag", totalTokens(mixed.tokens) === 520);
check("stream: skipped own calls are surfaced for audit", mixed.skippedOwnCalls === 3, String(mixed.skippedOwnCalls));

const unk = parseStream(read("nested-unknown-stream.jsonl"));
check("stream: unknown with no measured usage stays 0 tokens + flagged", totalTokens(unk.nested) === 0 && unk.nestedUnknown === true);

const sample = parseStream(read("sample-stream.jsonl"));
check("a legacy tool-usage record still lands in `nested`, not `tokens`", totalTokens(sample.tokens) === 4240 && totalTokens(sample.nested) === 10);

process.exit(fails ? 1 : 0);
