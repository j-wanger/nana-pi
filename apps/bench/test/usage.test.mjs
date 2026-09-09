// Stream parsing: tokens, nested tokens, turns, per-tool counts, retries, terminal completion,
// dangling tool calls, final text, error detection. Fixtures are captured/constructed event
// streams — no model is called.
// Run: node apps/bench/test/usage.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { incompleteReason, parseStream, totalTokens } from "../lib/usage.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(here, "fixtures", f), "utf8");

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

const s = parseStream(read("sample-stream.jsonl"));

// tokens = the SUM over every message_end that carries a usage object.
check("tokens.in summed across messages", s.tokens.in === 1000 + 7 + 2000, String(s.tokens.in));
check("tokens.out summed", s.tokens.out === 50 + 3 + 80, String(s.tokens.out));
check("tokens.cacheRead summed", s.tokens.cacheRead === 200 + 900, String(s.tokens.cacheRead));
check("tokens.cacheWrite summed", s.tokens.cacheWrite === 10, String(s.tokens.cacheWrite));
check("totalTokens adds the four disjoint buckets", totalTokens(s.tokens) === 4250, String(totalTokens(s.tokens)));
check("three messages contributed usage", s.usageMessages === 3, String(s.usageMessages));
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
check("truncated: partial usage is still recorded (a killed run still cost money)", totalTokens(trunc.tokens) === 920);
check("a stream with a plausible answer but no terminator cannot pass", trunc.finalText.includes("blocks.mjs:53") && trunc.complete === false);

// RETRIES: pinned off in the prepared agent dir, but counted if they ever happen (rpc.md:1109).
const rt = parseStream(read("retry-stream.jsonl"));
check("retries counted from auto_retry_start", rt.retries === 2, String(rt.retries));
check("retry error text captured", rt.retryEvents[0].error.includes("529"), JSON.stringify(rt.retryEvents[0]));
check("compaction counted", rt.compactions === 1, String(rt.compactions));
check("a retried run that settles is still complete", rt.complete === true);

// NESTED USAGE: the sidecar reports an extension's own LLM calls as toolResult usage.
const nu = parseStream(read("nested-usage-stream.jsonl"));
check("nested tokens captured separately from own tokens", totalTokens(nu.nested) === 4810, String(totalTokens(nu.nested)));
check("own tokens exclude the nested call", nu.tokens.in === 3200 + 1500, String(nu.tokens.in));
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
check("errored run still reports its tokens", e.tokens.in === 10);
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
check("real stream: tokens.in", real.tokens.in === 4148, String(real.tokens.in));
check("real stream: tokens.out", real.tokens.out === 55, String(real.tokens.out));
check("real stream: tokens.cacheRead", real.tokens.cacheRead === 1024, String(real.tokens.cacheRead));
check("real stream: total", totalTokens(real.tokens) === 5227, String(totalTokens(real.tokens)));
check("real stream: turns", real.turns === 2, String(real.turns));
check("real stream: tool mix", JSON.stringify(real.toolCalls) === JSON.stringify({ bash: 1 }), JSON.stringify(real.toolCalls));
check("real stream: final text is the answer", real.finalText === "packages/nana-stage/lib/blocks.mjs:53", JSON.stringify(real.finalText));
check("real stream: reached agent_settled", real.settled === true);
check("real stream: complete, no dangling calls", real.complete === true && real.dangling.length === 0);
check("real stream: no malformed lines", real.badLines === 0, String(real.badLines));
check("real stream: no retries under the pinned settings", real.retries === 0);

process.exit(fails ? 1 : 0);
