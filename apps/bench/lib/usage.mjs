// Parse a pi `--mode json` event stream into deterministic per-run metrics.
//
// TOKENS AND COST ARE PI'S ARITHMETIC, NOT OURS. Verified against pi 0.84.4 (2026-09-09):
//   · Every usage object in the stream is a pi-ai `Usage` — {input, output, cacheRead, cacheWrite,
//     cacheWrite1h?, reasoning?, totalTokens, cost{input, output, cacheRead, cacheWrite, total}} —
//     a public root export of `@earendil-works/pi-ai`. We carry those field names verbatim, so
//     there is no rename left to drift, and we take pi's `totalTokens` and pi's `cost` rather than
//     recomputing either. pi computed that cost with `calculateCost(model, usage)` — also a public
//     root export — using the real model pricing.
//   · The only arithmetic still ours is `addUsage`, a field-wise sum, because pi exports no
//     "add two Usage objects" helper. See lib/pi-exports.mjs for the full public/not-public list.
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

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const ZERO_COST = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 });
/** An empty pi-ai `Usage`. Same field names as pi's public type, deliberately. */
export const emptyUsage = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, reasoning: 0, totalTokens: 0, cost: ZERO_COST() });

/**
 * Field-wise sum of pi-ai `Usage` objects. OURS, because pi exports no summing helper — the one
 * piece of usage arithmetic that is not borrowed. `totalTokens` and `cost` are pi's own numbers;
 * we only add them up.
 */
export function addUsage(acc, usage) {
	if (!usage || typeof usage !== "object") return false;
	acc.input += num(usage.input);
	acc.output += num(usage.output);
	acc.cacheRead += num(usage.cacheRead);
	acc.cacheWrite += num(usage.cacheWrite);
	// Optional public fields (docs: `Usage.cacheWrite1h` is the 1h-retention subset of cacheWrite;
	// `reasoning` is a subset of output). Carried so nothing pi reports is dropped on the floor.
	acc.cacheWrite1h = num(acc.cacheWrite1h) + num(usage.cacheWrite1h);
	acc.reasoning = num(acc.reasoning) + num(usage.reasoning);
	acc.totalTokens += num(usage.totalTokens);
	for (const k of ["input", "output", "cacheRead", "cacheWrite", "total"]) acc.cost[k] += num(usage.cost?.[k]);
	return true;
}

/** pi's own `totalTokens`, summed. Never recomputed from the buckets. */
export const totalTokens = (u) => num(u?.totalTokens);
/** pi's own cost total, summed. `null` when nothing priced it, never a guessed 0. */
export const costTotal = (u) => num(u?.cost?.total);

/**
 * THE one cost helper. Both the runner and the aggregator call this, so they cannot disagree about
 * what a record cost — they used to: the runner wrote a numeric `cost` of 0 for an unpriceable
 * nested call, and the aggregator trusted that number and reported money for a record the runner
 * itself considered unpriced.
 *
 * Returns `null` when ANY part of the run went unpriced. A number means the whole run is priced —
 * never a total that quietly omits a piece.
 */
export function costOfRecord(r) {
	if (!r) return null;
	if (r.cost === null) return null; // the writer already said it could not price this
	if (totalTokens(r.nestedTokens) > 0 && r.nestedCost == null) return null;
	if (typeof r.cost === "number") return r.cost;
	return costTotal(r.tokens) + (r.nestedCost?.total ?? 0);
}

const textOf = (m) => (Array.isArray(m?.content) ? m.content.filter((c) => c?.type === "text" && typeof c.text === "string").map((c) => c.text).join("") : "");
const toolCallsOf = (m) => (Array.isArray(m?.content) ? m.content.filter((c) => c?.type === "toolCall") : []);

/**
 * Parse a full `--mode json` stdout capture. Never throws; malformed lines are counted.
 * `pricer` (from lib/pi-exports.mjs) prices nested usage pi did not price for us — the sidecar
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
						const seen = (bn?.models ?? []).filter(Boolean);
						// One model named: that bucket. Several (or none): a bucket we refuse to
						// price, because we cannot say which rates apply to which tokens.
						const key = seen.length === 1 ? seen[0] : seen.length > 1 ? `ambiguous(${seen.join("+")})` : "unknown-model";
						if (!nestedByModel.has(key)) nestedByModel.set(key, emptyUsage());
						addUsage(nestedByModel.get(key), m.usage);
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
	const nestedCostByModel = {};
	if (nested.totalTokens > 0 && nested.cost.total === 0) {
		if (!pricer) {
			nestedCost = null;
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
		tokens, // pi-ai Usage — the run's OWN model calls
		nested, // pi-ai Usage — what its tools spent
		nestedCost, // pi's calculateCost applied per model bucket and summed, or null with a reason
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
		badLines,
		dangling,
		unresolvedFinal,
		errors,
	};
}

/** Why a parsed stream is not a completed run — for the record's `error` field. */
export function incompleteReason(p) {
	if (p.errors.length) return p.errors[0].slice(0, 300);
	if (!p.settled) return "stream never reached agent_settled (truncated, killed, or still retrying)";
	if (!p.finalText && !p.stopReason) return "no assistant message in the stream";
	if (p.dangling.length) return `dangling tool call(s): ${p.dangling.slice(0, 4).join(", ")}`;
	if (p.unresolvedFinal.length) return `final assistant message left tool call(s) unresolved: ${p.unresolvedFinal.join(", ")}`;
	return null;
}
