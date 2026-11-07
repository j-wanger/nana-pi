/**
 * @module apps/bench/lib/usage.mjs
 * @purpose Parse pi JSON event streams for isolated memory-shaping runners.
 * @inputs the raw stream text of one run plus an optional pricer; pi-ai Usage objects carried on
 *  message_end and tool results
 * @outputs parseStream returns own and nested usage, completeness, final text, tool counts and stream diagnostics.
 * @effects none
 * @errors none thrown — an unterminated or malformed stream is reported through `settled: false`
 *  and an unpriceable nested call through nestedCostReason.
 */
// Parse a pi `--mode json` event stream into deterministic per-run metrics.
import { addUsage, emptyUsage } from "../../../packages/nana-pack/lib/pi-usage.mjs";
//
// TOKENS AND COST ARE PI'S ARITHMETIC, NOT OURS. Verified against pi 0.84.4 (2026-09-09):
//   · Every usage object in the stream is a pi-ai `Usage` — {input, output, cacheRead, cacheWrite,
//     cacheWrite1h?, reasoning?, totalTokens, cost{input, output, cacheRead, cacheWrite, total}} —
//     a public root export of `@earendil-works/pi-ai`. We carry those field names verbatim, so
//     there is no rename left to drift, and we take pi's `totalTokens` and pi's `cost` rather than
//     recomputing either. pi computed that cost with `calculateCost(model, usage)` — also a public
//     root export — using the real model pricing.
//   · The only arithmetic still ours is `addUsage`, a field-wise sum, because pi exports no
//     "add two Usage objects" helper.
//
// STREAM CONTRACT (docs/, not internals):
//   · `--mode json` writes one event per line; `message_end` carries the full authoritative
//     message (docs/json.md). `message_update.usage` is deliberately ignored — it "may remain zero
//     when a provider only reports usage at completion" (docs/json.md).
//   · Assistant messages carry their own usage; tool results may carry usage for nested LLM work
//     (docs/session-format.md). The two are kept STRICTLY apart: `tokens` is the run's own model
//     calls, `nested` is what its tools spent. Adding a tool's usage into both is how a consumer
//     that sums own+nested double-counts.
//   · `agent_end` is NOT terminal — "may still be followed by retry, compaction, or queued
//     continuations" (docs/rpc.md). The terminal marker is `agent_settled` (docs/rpc.md).
//   · Retries: `auto_retry_start`/`auto_retry_end`; compaction: `compaction_start`/`_end`;
//     extension faults: `extension_error` (all docs/rpc.md, docs/json.md).

const num = (value) => typeof value === "number" && Number.isFinite(value) ? value : 0;
const ZERO_COST = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 });

const textOf = (m) => (Array.isArray(m?.content) ? m.content.filter((c) => c?.type === "text" && typeof c.text === "string").map((c) => c.text).join("") : "");
const toolCallsOf = (m) => (Array.isArray(m?.content) ? m.content.filter((c) => c?.type === "toolCall") : []);

/**
 * Parse a full `--mode json` stdout capture. Never throws; malformed lines are counted.
 * An optional injected `pricer` prices nested usage pi did not price for us — the sidecar
 * cannot know the search model's rates, so it reports zeros and we price them here with pi's
 * `calculateCost`. Without a pricer, nested cost is `null` with a reason: never a guessed 0.
 */
export function parseStream(text, { pricer = null } = {}) {
	const tokens = emptyUsage();
	const nested = emptyUsage();
	const toolCalls = {};
	const errors = [];
	const extensionErrors = [];
	const retryEvents = [];
	const nestedModels = new Set();
	// Nested usage kept PER MODEL, because pricing is per model: pooling it and pricing the pool
	// with whichever model happened to be first is wrong the moment a tool uses two.
	const nestedByModel = new Map();
	let turns = 0;
	let badLines = 0;
	let agentEnded = 0;
	let settled = false;
	let compactions = 0;
	let sessionId = null;
	let lastAssistant = null;
	let ownModel = null;
	let ownProvider = null;
	let usageMessages = 0;
	let usageEntries = 0; // pi `usage` entries (cache warming) folded into `tokens`
	let nestedMessages = 0;
	let nestedUnknown = false;
	let nestedUnknownReason = null;
	let nestedCalls = 0;
	let skippedOwnCalls = 0;
	const startedTools = new Map(); // toolCallId -> toolName
	const resultedCalls = new Set(); // toolCallIds that produced a toolResult message

	for (const raw of String(text ?? "").split("\n")) {
		const line = raw.trim();
		if (!line) continue;
		let ev;
		try {
			ev = JSON.parse(line);
		} catch {
			badLines++;
			continue;
		}
		if (!ev || typeof ev !== "object") {
			badLines++;
			continue;
		}
		switch (ev.type) {
			case "session":
				sessionId = ev.id ?? null;
				break;
			case "turn_start":
				turns++;
				break;
			case "agent_end":
				agentEnded++;
				break;
			case "agent_settled":
				settled = true;
				break;
			case "entry_appended":
				// pi ≥ 0.86 persists cache-warm refreshes (cacheWarming "streaming", the default) as a
				// `usage` SESSION ENTRY, not an assistant message; json mode forwards it as
				// `entry_appended`. pi counts it in session totals (docs/session-format.md UsageEntry)
				// and so do we: it is the run's own model spend. Unknown `kind`s count too, per the doc.
				if (ev.entry?.type === "usage" && addUsage(tokens, ev.entry.usage)) usageEntries++;
				break;
			case "compaction_end":
				compactions++;
				break;
			case "auto_retry_start":
				retryEvents.push({ kind: "auto", attempt: ev.attempt ?? null, error: String(ev.errorMessage ?? "").slice(0, 200) });
				break;
			case "summarization_retry_attempt_start":
				retryEvents.push({ kind: "summarization", attempt: ev.attempt ?? null, error: "" });
				break;
			case "extension_error":
				extensionErrors.push(`${ev.extensionPath ?? "?"} on ${ev.event ?? "?"}: ${String(ev.error ?? "").slice(0, 200)}`);
				break;
			case "tool_execution_start":
				{
					const name = typeof ev.toolName === "string" ? ev.toolName : "(unknown)";
					toolCalls[name] = (toolCalls[name] || 0) + 1;
					if (ev.toolCallId) startedTools.set(ev.toolCallId, name);
				}
				break;
			case "message_end": {
				const m = ev.message;
				if (!m || typeof m !== "object") break;
				if (m.role === "toolResult") {
					if (m.toolCallId) resultedCalls.add(m.toolCallId);
					const bn = m.details?.benchNested;
					if (addUsage(nested, m.usage)) {
						nestedMessages++;
						nestedCalls += num(bn?.calls) || 1;
						// The sidecar reports usage PER MODEL, so a multi-model window is priced per
						// bucket rather than written off as unattributable. Older records that only
						// carry `models[]` fall back to the single-model case.
						const buckets = bn?.byModel && typeof bn.byModel === "object" ? Object.entries(bn.byModel) : null;
						if (buckets?.length) {
							for (const [key, u] of buckets) {
								if (!nestedByModel.has(key)) nestedByModel.set(key, emptyUsage());
								addUsage(nestedByModel.get(key), u);
							}
						} else {
							const seen = (bn?.models ?? []).filter(Boolean);
							const key = seen.length === 1 ? seen[0] : seen.length > 1 ? `ambiguous(${seen.join("+")})` : "unknown-model";
							if (!nestedByModel.has(key)) nestedByModel.set(key, emptyUsage());
							addUsage(nestedByModel.get(key), m.usage);
						}
					}
					// `unknown` is INDEPENDENT of whether some usage was also measured: one window
					// can hold a measured call and an unmeasurable one.
					if (bn?.unknown) {
						nestedUnknown = true;
						nestedUnknownReason = nestedUnknownReason ?? (bn.unknownReason ?? "unknown");
					}
					for (const mdl of bn?.models ?? []) nestedModels.add(mdl);
					if (num(bn?.skippedOwnCalls) > skippedOwnCalls) skippedOwnCalls = num(bn.skippedOwnCalls);
				}
				if (m.role === "assistant") {
					if (addUsage(tokens, m.usage)) usageMessages++;
					if (typeof m.model === "string") ownModel = m.model;
					if (typeof m.provider === "string") ownProvider = m.provider;
					lastAssistant = m;
					if (m.stopReason === "error" || m.stopReason === "aborted") errors.push(m.errorMessage || `stopReason=${m.stopReason}`);
				}
				break;
			}
		}
	}

	// The sidecar cannot price the nested model, so it reports zero cost. Price each MODEL bucket
	// here with pi's own calculateCost and sum. Any bucket we cannot price makes the whole nested
	// cost null WITH a reason — a partial total would understate C's spend, which is the one number
	// this study must not get wrong.
	let nestedCost = nested.cost;
	let nestedCostReason = null;
	// The buckets we COULD price, retained even when another bucket makes `nestedCost` null.
	let pricedNestedCost = nested.cost;
	const nestedCostByModel = {};
	if (nested.totalTokens > 0 && nested.cost.total === 0) {
		if (!pricer) {
			nestedCost = null;
			pricedNestedCost = null;
			nestedCostReason = "no pricer supplied (pi's calculateCost was not loaded)";
		} else {
			const summed = ZERO_COST();
			const unpriced = [];
			for (const [key, bucket] of nestedByModel) {
				const slash = key.indexOf("/");
				const provider = slash > 0 ? key.slice(0, slash) : ownProvider;
				const model = key.startsWith("ambiguous(") || key === "unknown-model" ? null : slash > 0 ? key.slice(slash + 1) : key;
				const priced = model ? pricer(bucket, { model, provider }) : { cost: null, reason: `cannot attribute ${bucket.totalTokens} tokens to one model (${key})` };
				nestedCostByModel[key] = priced.cost ? priced.cost.total : null;
				if (!priced.cost) unpriced.push(`${key}: ${priced.reason}`);
				else for (const k of ["input", "output", "cacheRead", "cacheWrite", "total"]) summed[k] += num(priced.cost[k]);
			}
			pricedNestedCost = summed;
			if (unpriced.length) {
				nestedCost = null;
				nestedCostReason = unpriced.join("; ");
			} else {
				nestedCost = summed;
			}
		}
	}

	// A tool call that started but never produced a toolResult MESSAGE means the stream stopped
	// mid-flight; the message is the authoritative record (docs/session-format.md).
	const dangling = [...startedTools.keys()].filter((id) => !resultedCalls.has(id));
	const unresolvedFinal = toolCallsOf(lastAssistant).filter((c) => !resultedCalls.has(c.id)).map((c) => c.name);

	// In `--mode json` pi exits 0 even when the assistant errored, so completeness is derived from
	// the stream; the caller ALSO requires a clean process exit.
	const complete = settled && Boolean(lastAssistant) && errors.length === 0 && dangling.length === 0 && unresolvedFinal.length === 0;

	return {
		complete,
		settled,
		tokens, // pi-ai Usage — the run's OWN model calls (incl. pi cache-warm refreshes, see usageEntries)
		nested, // pi-ai Usage — what its tools spent
		nestedCost, // pi's calculateCost applied per model bucket and summed, or null with a reason
		// The same arithmetic over only the buckets that priced — a LOWER BOUND, never a total.
		pricedNestedCost,
		nestedCostReason,
		nestedCostByModel,
		nestedByModel: Object.fromEntries([...nestedByModel].map(([k, v]) => [k, v.totalTokens])),
		nestedModels: [...nestedModels],
		nestedCalls,
		nestedMessages,
		// LLM requests the sidecar saw OUTSIDE any tool window — pi's own calls, correctly not
		// counted as nested. Reported so the scoping is auditable.
		skippedOwnCalls,
		// Never report an unmeasured nested call as zero cost.
		nestedUnknown,
		nestedUnknownReason,
		turns,
		toolCalls,
		finalText: textOf(lastAssistant),
		stopReason: lastAssistant?.stopReason ?? null,
		model: ownModel,
		provider: ownProvider,
		sessionId,
		agentEnded,
		compactions,
		retries: retryEvents.length,
		retryEvents,
		extensionErrors,
		usageMessages,
		usageEntries,
		badLines,
		dangling,
		unresolvedFinal,
		errors,
	};
}
