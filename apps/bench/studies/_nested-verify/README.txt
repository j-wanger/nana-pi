DIAGNOSTIC, not a study.

Purpose: prove end-to-end that the bench sidecar (apps/bench/ext/bench-nested-usage.ts +
apps/bench/lib/nested.mjs) measures pi-web-access's nested OpenAI Responses request, attributes it
to the tool result, and excludes pi's own model calls.

The profile deliberately carries `web_search` ONLY — no bash, no read, no fetch_content — because
with bash available the model simply shells out and the nested path is never exercised. Two earlier
attempts confirmed that: profile C on a research task answered from memory with zero tool calls,
and a web+fetch profile chose fetch_content, which makes no LLM call.

RESULT (2026-09-09, one run):
  toolCalls {"web_search": 2}
  own tokens    7,780   (4 assistant messages, reconciled against raw/.../stream.jsonl)
  nested tokens 8,509   (1 tool result carrying benchNested)
  spend        16,289   = own + nested, counted exactly once
  benchNested  calls 1 · models ["gpt-5.6-terra"] · unknown false · skippedOwnCalls 0

The nested model id (gpt-5.6-terra) differs from the run's own model (gpt-5.6-sol). That is the
direct evidence that the interceptor caught pi-web-access's request and NOT pi's own transport.

KNOWN GAP found by this run: the FIRST of the two web_search calls returned an LLM-style summary
while no request reached the interceptor at all, and was reported as nothing. lib/nested.mjs now
treats a watched-tool window with zero observed requests as `unknown: "no-network-observed"` rather
than as free — a cache hit and a transport we cannot see are indistinguishable from here. That rule
is unit-tested but has NOT been observed on a live run; expect it to flag real C runs until the
first-search path is understood.
