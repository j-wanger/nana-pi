// Parse a pi `--mode json` event stream into deterministic per-run metrics.
//
// Source of truth (pi 0.84.4, verified in the installed docs + dist):
//   - `--mode json` writes one event per line (docs/json.md:1-7, 67-85). Every event except
//     `message_update` passes through unchanged (dist/modes/json-event.js:16-19), so
//     `message_end` carries the FULL authoritative message (docs/json.md:92).
//   - Usage = {input, output, cacheRead, cacheWrite, totalTokens, cost} (docs/session-format.md:104-117)
//     on assistant messages (:87) and optionally on tool results, for nested LLM work (:99).
//     The provider adapter ASSIGNS usage per API call (pi-ai/dist/api/openai-responses-shared.js:443-453)
//     — it does not accumulate — and `input` excludes cached tokens (line 445), so the four
//     buckets are disjoint and summing across `message_end` gives the run total.
//   - Tool calls: `tool_execution_start` / `tool_execution_end` carry `toolName` (docs/json.md:49-51).
//   - Turns: `turn_start` (docs/json.md:41).
//   - COMPLETION: `agent_end` is NOT terminal — "One low-level agent run completes (may still be
//     followed by retry, compaction, or queued continuations)" (docs/rpc.md:864). The terminal
//     marker is `agent_settled`: "no automatic retry, compaction retry, or queued continuation
//     remains" (docs/rpc.md:866, 905-911).
//   - Retries are visible: `auto_retry_start` {attempt, maxAttempts, delayMs, errorMessage} and
//     `auto_retry_end` (docs/rpc.md:1109-1123); summarization retries at :868-870; compaction at
//     `compaction_start`/`compaction_end` (docs/json.md:31); `extension_error` at docs/rpc.md:1171.
//
// We do NOT read `message_update.usage`: docs/json.md:88-90 warns it "may remain zero when a
// provider only reports usage at completion".

const EMPTY = () => ({ in: 0, out: 0, cacheRead: 0, cacheWrite: 0 });
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function addUsage(acc, usage) {
	if (!usage || typeof usage !== "object") return false;
	acc.in += num(usage.input);
	acc.out += num(usage.output);
	acc.cacheRead += num(usage.cacheRead);
	acc.cacheWrite += num(usage.cacheWrite);
	return true;
}

const textOf = (m) => (Array.isArray(m?.content) ? m.content.filter((c) => c?.type === "text" && typeof c.text === "string").map((c) => c.text).join("") : "");
const toolCallsOf = (m) => (Array.isArray(m?.content) ? m.content.filter((c) => c?.type === "toolCall") : []);

/** Parse a full `--mode json` stdout capture. Never throws; malformed lines are counted. */
export function parseStream(text) {
	const tokens = EMPTY();
	const nested = EMPTY();
	const toolCalls = {};
	const errors = [];
	const extensionErrors = [];
	const retryEvents = [];
	let turns = 0;
	let badLines = 0;
	let agentEnded = 0;
	let settled = false;
	let compactions = 0;
	let sessionId = null;
	let lastAssistant = null;
	let usageMessages = 0;
	let nestedUnknown = false;
	let nestedCalls = 0;
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
				if (addUsage(tokens, m.usage)) usageMessages++;
				if (m.role === "toolResult") {
					if (m.toolCallId) resultedCalls.add(m.toolCallId);
					// Nested LLM work reported by a tool (docs/session-format.md:99). The bench
					// sidecar extension supplies this for pi-web-access; see ext/bench-nested-usage.ts.
					if (m.usage) {
						addUsage(nested, m.usage);
						nestedCalls += num(m.details?.benchNested?.calls) || 1;
					} else if (m.details?.benchNested?.unknown) {
						nestedUnknown = true;
					}
				}
				if (m.role === "assistant") {
					lastAssistant = m;
					if (m.stopReason === "error" || m.stopReason === "aborted") errors.push(m.errorMessage || `stopReason=${m.stopReason}`);
				}
				break;
			}
		}
	}

	// A tool call that started but never produced a toolResult MESSAGE means the stream stopped
	// mid-flight. The message is the authoritative record (docs/session-format.md:93-102);
	// `tool_execution_end` is a progress event and is deliberately not required here.
	const dangling = [...startedTools.keys()].filter((id) => !resultedCalls.has(id));
	// The final assistant message must not be left asking for a tool nobody answered.
	const unresolvedFinal = toolCallsOf(lastAssistant).filter((c) => !resultedCalls.has(c.id)).map((c) => c.name);

	// NOTE: in `--mode json` pi exits 0 even when the assistant errored — the stopReason check
	// only runs in text mode (dist/modes/print-mode.js:110-127). `complete` is therefore derived
	// from the stream; the caller ALSO requires a clean process exit.
	const complete = settled && Boolean(lastAssistant) && errors.length === 0 && dangling.length === 0 && unresolvedFinal.length === 0;

	return {
		complete,
		settled,
		tokens,
		nested,
		nestedCalls,
		// Never report an unmeasured nested call as zero cost — that is the single easiest way
		// to make an extension look cheap (astra: "C looks cheaper because its internal model
		// calls were never counted").
		nestedUnknown,
		turns,
		toolCalls,
		finalText: textOf(lastAssistant),
		stopReason: lastAssistant?.stopReason ?? null,
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

export const totalTokens = (t) => num(t?.in) + num(t?.out) + num(t?.cacheRead) + num(t?.cacheWrite);

/** Why a parsed stream is not a completed run — for the record's `error` field. */
export function incompleteReason(p) {
	if (p.errors.length) return p.errors[0].slice(0, 300);
	if (!p.settled) return "stream never reached agent_settled (truncated, killed, or still retrying)";
	if (!p.finalText && !p.stopReason) return "no assistant message in the stream";
	if (p.dangling.length) return `dangling tool call(s): ${p.dangling.slice(0, 4).join(", ")}`;
	if (p.unresolvedFinal.length) return `final assistant message left tool call(s) unresolved: ${p.unresolvedFinal.join(", ")}`;
	return null;
}
