// Nested-LLM-spend accounting, as a plain module so it can be tested without pi.
// The pi extension in ext/bench-nested-usage.ts is a thin wrapper over this.
//
// What it must get right, and why each is a way to make an extension look cheap:
//   1. SCOPE — pi's own Codex transport uses `globalThis.fetch` too. Counting those would add a
//      run's own model calls a second time, as "nested". So a request is only counted while a
//      WATCHED tool call is in flight: pi issues its model requests from the agent loop, never
//      from inside a tool's execute(). The window is opened by `tool_call` and closed by
//      `tool_result` (docs/extensions.md), which is the only signal that says "we are inside
//      this extension's tool right now".
//   2. DEDUPE — a Responses SSE stream carries `usage` on several frames. Only the TERMINAL
//      frame counts, once per request.
//   3. COMPLETION — every intercepted request is tracked until its body has been harvested. An
//      unfinished, failed or timed-out harvest is `unknown`, never 0.
//   4. UNKNOWN IS INDEPENDENT — a window can contain both a measured call and an unmeasurable
//      one; it must report the measured tokens AND unknown:true.
//   5. SILENCE IS NOT ZERO — a watched tool that ran while we saw no network at all is unknown,
//      not free. A cache hit and a transport we cannot observe are indistinguishable here.

/** A pi-ai `Usage` with the token fields zeroed — pi's public field names, deliberately. */
export const ZERO = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 });
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Endpoints that bill tokens. Scope is enforced by the tool window, not by this. */
export const LLM_URL = /(\/v1)?\/(responses|chat\/completions|messages)(\?|$|\/)/;
export const isLlmEndpoint = (url) => LLM_URL.test(String(url ?? ""));

/**
 * Provider-wire usage → pi-ai `Usage`. `input` EXCLUDES cached tokens, exactly as pi's own
 * adapters do. This translation is OURS only because pi does not export it: the mapping lives
 * inside pi's provider adapters, which are not a public entry point. Everything downstream then
 * uses pi's public field names and pi's `calculateCost` — see lib/pi-exports.mjs.
 */
export function mapUsage(usage) {
	if (!usage || typeof usage !== "object") return null;
	const cached = num(usage.input_tokens_details?.cached_tokens) || num(usage.prompt_tokens_details?.cached_tokens) || num(usage.cache_read_input_tokens);
	const input = num(usage.input_tokens) || num(usage.prompt_tokens);
	const output = num(usage.output_tokens) || num(usage.completion_tokens);
	if (!input && !output && !cached) return null;
	return {
		input: Math.max(0, input - cached), // pi-ai openai-responses-shared.js:445
		output,
		cacheRead: cached,
		cacheWrite: num(usage.cache_creation_input_tokens),
		totalTokens: num(usage.total_tokens) || input + output,
	};
}

/**
 * Pull the ONE terminal usage out of a response body (plain JSON or an SSE stream).
 * Returns { usage, model } or null. Non-terminal frames that also carry usage are ignored, so
 * a stream cannot be counted twice.
 */
export function harvestTerminal(text) {
	const s = String(text ?? "");
	const trimmed = s.trim();
	if (trimmed.startsWith("{")) {
		try {
			const j = JSON.parse(trimmed);
			const usage = mapUsage(j.usage);
			return usage ? { usage, model: typeof j.model === "string" ? j.model : null } : null;
		} catch {
			return null;
		}
	}
	let terminal = null;
	let fallback = null;
	for (const line of s.split("\n")) {
		if (!line.startsWith("data: ")) continue;
		const data = line.slice(6).trim();
		if (!data || data === "[DONE]") continue;
		let ev;
		try {
			ev = JSON.parse(data);
		} catch {
			continue;
		}
		const payload = ev?.response ?? ev;
		const usage = mapUsage(payload?.usage);
		if (!usage) continue;
		const hit = { usage, model: typeof payload.model === "string" ? payload.model : null };
		const type = String(ev?.type ?? "");
		if (/(\.completed|\.done|^response\.completed$|message_stop)/.test(type)) terminal = hit;
		else fallback = fallback ?? hit;
	}
	// A stream with usage but no recognised terminal frame is still ONE request's usage.
	return terminal ?? fallback;
}

/**
 * Accumulator for one run. `windowDepth > 0` means a watched tool is executing.
 * All state is per-process, which is what the sidecar needs.
 */
export function createRecorder({ watch = [], now = () => Date.now() } = {}) {
	const watched = new Set(watch);
	let depth = 0;
	let seq = 0;
	const pending = new Map(); // id -> {startedAt}
	let acc = ZERO();
	let calls = 0;
	let unknown = false;
	let unknownReason = null;
	let skipped = 0; // LLM requests seen OUTSIDE a tool window — i.e. pi's own model calls
	let observed = 0; // ALL requests seen inside a window, LLM-shaped or not
	const models = new Set();

	// An empty watch list means "watch every tool"; open and close must agree on this.
	const isWatched = (toolName) => watched.size === 0 || watched.has(toolName);

	const markUnknown = (reason) => {
		unknown = true;
		unknownReason = unknownReason ?? reason;
	};
	const reset = () => {
		acc = ZERO();
		calls = 0;
		unknown = false;
		unknownReason = null;
		observed = 0;
		models.clear();
	};

	return {
		get inWindow() {
			return depth > 0;
		},
		get pendingCount() {
			return pending.size;
		},
		get skippedOwnCalls() {
			return skipped;
		},
		openWindow(toolName) {
			if (isWatched(toolName)) depth++;
			return depth;
		},
		closeWindow(toolName) {
			if (!isWatched(toolName)) return depth;
			depth = Math.max(0, depth - 1);
			// A watched tool ran and we saw NO network from it at all. That is not evidence it
			// was free: a cache hit and a transport we cannot see look identical from here, and
			// "unmeasured" must never be reported as zero. Observed in the wild — one of two
			// pi-web-access searches returned an LLM-style summary with no intercepted request.
			if (depth === 0 && observed === 0) markUnknown("no-network-observed");
			return depth;
		},
		/**
		 * Register an intercepted request. Returns null when it must NOT be counted — outside a
		 * tool window (pi's own call) or a non-LLM URL. A non-null handle MUST later be resolved
		 * or failed, or `drain` will mark the window unknown.
		 */
		note(url) {
			if (depth > 0) observed++;
			if (!isLlmEndpoint(url)) return null;
			if (depth === 0) {
				skipped++;
				return null;
			}
			const id = ++seq;
			pending.set(id, { startedAt: now() });
			return id;
		},
		/** Body harvested. A body with no readable terminal usage is unknown, not zero. */
		resolve(id, bodyText) {
			if (!pending.delete(id)) return false;
			const hit = harvestTerminal(bodyText);
			if (!hit) {
				markUnknown("unparseable-body");
				return false;
			}
			acc.input += hit.usage.input;
			acc.output += hit.usage.output;
			acc.cacheRead += hit.usage.cacheRead;
			acc.cacheWrite += hit.usage.cacheWrite;
			acc.totalTokens += hit.usage.totalTokens;
			if (hit.model) models.add(hit.model);
			calls++;
			return true;
		},
		/** The request or its body read failed. Spend happened; we cannot measure it. */
		fail(id) {
			pending.delete(id);
			markUnknown("request-failed");
		},
		/** Anything still pending at snapshot time is spend we did not measure. */
		markPendingUnknown() {
			if (pending.size) {
				markUnknown("harvest-incomplete");
				pending.clear();
			}
		},
		/**
		 * The value to attach to a tool result. Returns null only when there is genuinely
		 * nothing to report — no measured call AND nothing unknown.
		 */
		snapshot(toolName = null) {
			if (calls === 0 && !unknown) return null;
			const out = {
				// cost is left at zero here on purpose: the sidecar cannot know the nested model's
				// rates. lib/usage.mjs prices it afterwards with pi's calculateCost, or records
				// null with a reason. A zero written here is never treated as "free".
				usage: calls ? { ...acc, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } : undefined,
				details: {
					calls,
					models: [...models],
					unknown, // independent of whether some usage was measured
					unknownReason,
					observedRequests: observed, // ALL network seen in the window, LLM or not
					attributedTo: toolName,
					skippedOwnCalls: skipped,
					note: "measured at the fetch boundary by apps/bench/ext/bench-nested-usage.ts while a watched tool was executing; per-tool attribution is approximate under parallel tool calls, the run total is exact",
				},
			};
			reset();
			return out;
		},
	};
}
