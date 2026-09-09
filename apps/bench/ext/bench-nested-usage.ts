// BENCH SIDECAR — makes an extension's nested LLM spend visible in the event stream.
//
// The problem (astra's "most likely three-hour invalidator"): pi-web-access issues its own
// OpenAI Responses request inside `web_search` and returns only `{answer, results}`, so the tokens
// that request burned never reach pi's accounting and profile C looks cheaper than it is.
//
// Why a sidecar rather than a patch to the third-party source: pi lets an extension amend another
// extension's tool result — "Handlers can return partial patches (content, details, isError, or
// `usage`)" (docs/extensions.md:851) and "If a tool makes nested LLM calls, return their combined
// Usage as `usage`. Pi persists it on the tool result" (docs/extensions.md:2013). So we measure
// without editing pi-web-access, keeping its content hash equal to the upstream tarball, and we
// catch every provider path rather than the one function we happened to read.
//
// SCOPE: a request is only counted while a WATCHED tool is executing — the window opened by
// `tool_call` and closed by `tool_result`. pi issues its model requests from the agent loop, never
// from inside a tool's execute(), so the window separates a tool's spend from the run's own.
//
// COVERAGE, and its known hole. pi's Codex API speaks over a **WebSocket** by default
// (`pi-ai/dist/api/openai-codex-responses.js` obtains `globalThis.WebSocket` at connection time and
// constructs it) — so a nested call on that path never reaches a fetch wrapper. It is NOT
// fetch-free, though: the same adapter has an SSE fallback through `options.fetch ?? globalThis.fetch`
// (around line 265), and THAT path our wrapper does see. pi-web-access's search step makes its own
// hand-rolled HTTP POST and is visible; its summary step goes through pi-ai's `complete()` and, on
// the WebSocket default, is not. Measuring one and reporting the other as nothing is the failure
// this file refuses to commit: we (1) notice WebSocket model connections opened inside a window and
// mark the window unknown, and (2) read the tool's own report of which phases it ran on which model,
// and mark unknown any phase whose model we never measured.
//
// All accounting logic lives in ../lib/nested.mjs so it is unit-testable without pi.
// This file is only the wiring, and every handler is total: a `tool_call` handler that throws
// BLOCKS the tool (fail-safe upstream design), so nothing here may throw.

import { createRecorder } from "../lib/nested.mjs";

const WATCH = ["web_search", "fetch_content", "source_check", "get_search_content"];
/** Hosts whose WebSocket traffic is a model call we cannot read. */
const WS_LLM_HOST = /(chatgpt\.com|openai\.com|anthropic\.com|googleapis\.com)/i;
const DRAIN_MS = 5000;
/** The runner greps stderr for this and flags the record. Keep it in sync with run.mjs. */
export const UNATTACHED_MARKER = "bench-nested-usage: UNATTACHED";

const recorder = createRecorder({ watch: WATCH });
const inflight = new Set<Promise<unknown>>();

const originalFetch = globalThis.fetch;
globalThis.fetch = async function benchInstrumentedFetch(input: any, init?: any) {
	let id: number | null = null;
	try {
		const url = typeof input === "string" ? input : (input?.url ?? String(input));
		id = recorder.note(url);
	} catch {
		/* instrumentation must never break the call it is measuring */
	}
	let res: Response;
	try {
		res = await originalFetch(input as any, init as any);
	} catch (err) {
		if (id !== null) recorder.fail(id); // the request happened and may have been billed
		throw err;
	}
	if (id !== null) {
		// Read a CLONE in the background so the caller's timing and body are untouched.
		const handle = id;
		const p = res
			.clone()
			.text()
			.then((t) => {
				recorder.resolve(handle, t);
			})
			.catch(() => {
				recorder.fail(handle);
			})
			.finally(() => {
				inflight.delete(p);
			});
		inflight.add(p);
	}
	return res;
};

// pi's Codex transport is a WebSocket, so a model call can happen inside a tool window with no
// fetch at all. We cannot read those frames — reverse-engineering an undocumented wire format to
// bill it would be worse than admitting the gap — but we CAN see the connection open and refuse to
// call the window free.
const OriginalWebSocket = (globalThis as any).WebSocket;
if (typeof OriginalWebSocket === "function") {
	function BenchWebSocket(this: any, url: any, ...rest: any[]) {
		try {
			if (WS_LLM_HOST.test(String(url))) recorder.noteUnobservable("websocket-transport-unobservable");
		} catch {
			/* instrumentation must never break the call it is watching */
		}
		return new OriginalWebSocket(url, ...rest);
	}
	BenchWebSocket.prototype = OriginalWebSocket.prototype;
	for (const k of ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]) {
		try {
			(BenchWebSocket as any)[k] = OriginalWebSocket[k];
		} catch {
			/* read-only constant: skip */
		}
	}
	(globalThis as any).WebSocket = BenchWebSocket;
}

async function drain() {
	// Wait for outstanding body reads BEFORE deciding there is nothing to report — otherwise a
	// last tool's usage lands after its own tool_result and is lost with no later result to carry
	// it. A read still outstanding after the deadline is unknown spend, not zero.
	if (!inflight.size) return;
	let timedOut = false;
	await Promise.race([
		Promise.allSettled([...inflight]),
		new Promise((r) => setTimeout(() => { timedOut = true; r(null); }, DRAIN_MS)),
	]);
	if (timedOut || recorder.pendingCount) recorder.markPendingUnknown();
}

export default function activate(pi: any) {
	pi.on("tool_call", (event: any) => {
		try {
			recorder.openWindow(event?.toolName);
		} catch {
			/* never block a tool */
		}
		return undefined;
	});

	pi.on("tool_result", async (event: any) => {
		try {
			const name = event?.toolName;
			await drain();
			// The tool's OWN report of what it ran, before the window closes: a phase naming a
			// model we never measured is spend we missed, and the window is not silent, so nothing
			// else would catch it.
			try {
				recorder.notePaths(event?.details);
			} catch {
				/* a malformed details object must not block the tool */
			}
			recorder.closeWindow(name);
			const snap = recorder.snapshot(name ?? null);
			if (!snap) return undefined;
			return { details: { ...(event?.details ?? {}), benchNested: snap.details }, ...(snap.usage ? { usage: snap.usage } : {}) };
		} catch {
			return undefined;
		}
	});

	// Last chance: a body read that finishes after the FINAL tool result has no result left to
	// ride on. Rather than dropping that spend, announce it on stderr — stdout is the JSON event
	// stream, stderr is captured as evidence, and the runner turns this marker into
	// `nestedUnknown: true` on the record. Unmeasured spend must never read as zero.
	pi.on("agent_settled", async () => {
		try {
			await drain();
			const snap = recorder.snapshot(null);
			if (snap) console.error(`${UNATTACHED_MARKER} ${JSON.stringify(snap.details)}`);
		} catch {
			/* nothing to do */
		}
		return undefined;
	});
}
