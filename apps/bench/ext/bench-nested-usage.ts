// BENCH SIDECAR — makes an extension's nested LLM spend visible in the event stream.
//
// The problem it solves (astra's most likely three-hour invalidator): pi-web-access issues its
// own OpenAI Responses request inside `web_search` and returns only `{answer, results}`, so the
// tokens that request burned never reach pi's usage accounting. Profile C would then look
// cheaper than it is, for the exact reason we are running the study.
//
// Why a sidecar and not a patch to the third-party source: pi lets an extension amend another
// extension's tool result — "Handlers can return partial patches (content, details, isError, or
// `usage`); omitted fields keep their current values" (docs/extensions.md:851) — and
// "If a tool makes nested LLM calls, return their combined Usage as `usage`. Pi persists it on
// the tool result and includes it in session totals" (docs/extensions.md:2013). So we can
// measure without editing pi-web-access at all, which keeps its content hash equal to the
// upstream tarball a reviewer can verify, and catches EVERY provider path it might take rather
// than only the one function we happened to read.
//
// Mechanism: wrap `globalThis.fetch`, and for any response from an LLM completion endpoint pull
// `usage` and `model` out of the payload (JSON or SSE). Attribute the accumulated total to the
// next tool result. HONEST LIMITS, recorded in the record itself:
//   * with parallel tool calls, attribution BETWEEN concurrent tools can be wrong; the per-run
//     TOTAL is still exact, and the total is what the study compares.
//   * if a matched request yields no parsable usage we set `unknown`, never 0.
//   * `cost` is reported as zeros — we do not know this endpoint's price list; the study
//     compares tokens, and a fabricated price would be worse than an obvious blank.

const LLM_URL = /(\/v1)?\/(responses|chat\/completions|messages)(\?|$)/;
const ZERO = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 });

type Acc = { u: ReturnType<typeof ZERO>; calls: number; models: Set<string>; unknown: boolean };
const acc: Acc = { u: ZERO(), calls: 0, models: new Set(), unknown: false };
const inflight = new Set<Promise<unknown>>();

function addOpenAIUsage(usage: any, model: unknown) {
	if (!usage || typeof usage !== "object") {
		acc.unknown = true;
		return false;
	}
	const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
	const cached = n(usage.input_tokens_details?.cached_tokens) || n(usage.prompt_tokens_details?.cached_tokens) || n(usage.cache_read_input_tokens);
	const input = n(usage.input_tokens) || n(usage.prompt_tokens);
	const output = n(usage.output_tokens) || n(usage.completion_tokens);
	if (!input && !output && !cached) {
		acc.unknown = true;
		return false;
	}
	// pi's convention: `input` EXCLUDES cached tokens (pi-ai openai-responses-shared.js:445).
	acc.u.input += Math.max(0, input - cached);
	acc.u.output += output;
	acc.u.cacheRead += cached;
	acc.u.cacheWrite += n(usage.cache_creation_input_tokens);
	acc.u.totalTokens += n(usage.total_tokens) || input + output;
	if (typeof model === "string" && model) acc.models.add(model);
	acc.calls += 1;
	return true;
}

/** Pull the terminal payload out of a JSON body or a Responses/Chat SSE stream. */
function harvest(text: string) {
	const trimmed = text.trim();
	if (trimmed.startsWith("{")) {
		try {
			const j = JSON.parse(trimmed);
			return addOpenAIUsage(j.usage, j.model);
		} catch {
			acc.unknown = true;
			return false;
		}
	}
	let found = false;
	for (const line of text.split("\n")) {
		if (!line.startsWith("data: ")) continue;
		const data = line.slice(6).trim();
		if (!data || data === "[DONE]") continue;
		try {
			const ev = JSON.parse(data);
			const payload = ev.response ?? ev;
			if (payload && typeof payload === "object" && payload.usage) found = addOpenAIUsage(payload.usage, payload.model) || found;
		} catch {
			/* a partial SSE frame is not an error */
		}
	}
	if (!found) acc.unknown = true;
	return found;
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async function benchInstrumentedFetch(input: any, init?: any) {
	const res = await originalFetch(input as any, init as any);
	try {
		const url = typeof input === "string" ? input : (input?.url ?? String(input));
		if (LLM_URL.test(String(url))) {
			// Read a CLONE in the background so we never change the caller's timing or body.
			const p = res
				.clone()
				.text()
				.then((t) => {
					harvest(t);
				})
				.catch(() => {
					acc.unknown = true;
				})
				.finally(() => inflight.delete(p));
			inflight.add(p);
		}
	} catch {
		acc.unknown = true; // instrumentation must never break the call it is measuring
	}
	return res;
};

export default function activate(pi: any) {
	// A tool_result handler that throws BLOCKS the tool (fail-safe upstream design), so every
	// line below is inside a try/catch and the fallback is "return nothing, change nothing".
	pi.on("tool_result", async (event: any) => {
		try {
			if (acc.calls === 0 && !acc.unknown) return undefined;
			// Let in-flight body reads finish, but never hang a run on them.
			if (inflight.size) await Promise.race([Promise.allSettled([...inflight]), new Promise((r) => setTimeout(r, 3000))]);
			if (acc.calls === 0 && !acc.unknown) return undefined;

			const usage = acc.calls
				? { ...acc.u, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }
				: undefined;
			const benchNested = {
				calls: acc.calls,
				models: [...acc.models],
				unknown: acc.unknown,
				attributedTo: event?.toolName ?? null,
				note: "measured by apps/bench/ext/bench-nested-usage.ts at the fetch boundary; per-tool attribution is approximate under parallel tool calls, the run total is exact",
			};
			acc.u = ZERO();
			acc.calls = 0;
			acc.models = new Set();
			acc.unknown = false;
			return { details: { ...(event?.details ?? {}), benchNested }, ...(usage ? { usage } : {}) };
		} catch {
			return undefined;
		}
	});
}
