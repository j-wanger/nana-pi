/**
 * nana-knowledge — the same prompt-time knowledge pull pi already gets in Claude
 * Code, as a pi extension.
 *
 * ONE producer of pointers. The Claude Code side runs `bin/nana-knowledge.ts hook`
 * as a UserPromptSubmit command; this file runs the SAME CLI, out-of-process, and
 * injects whatever it prints. Nothing here re-implements querying, dedup, staleness
 * or logging — if the two sides ever disagree about what a pointer is, that is a bug
 * with one place to fix it.
 *
 * Why out-of-process, when an in-process import would be one function call:
 *   - The index is `node:sqlite`. The hook's own fail-open budget is a `setTimeout`,
 *     which bounds ASYNCHRONOUS stalls only — a wedged filesystem inside a single
 *     SQLite call blocks the event loop and the timer never fires. On the Claude Code
 *     side the harness hook timeout is the outer bound that saves the prompt. pi has
 *     no per-handler timeout, so a synchronous stall here would freeze pi's agent
 *     loop. The stall now happens in a child instead, and the handler stops waiting
 *     on a timer of its OWN — execFile's `timeout` ends any child a SIGKILL can end,
 *     but its callback fires on CLOSE, and a child wedged in an uninterruptible
 *     syscall never closes. See makePull: the parent-side timer is what bounds the
 *     turn in that one case.
 *   - It also keeps node:sqlite out of pi's process entirely. This file must never
 *     import lib/hook.ts, lib/db.ts or lib/build.ts.
 *
 * Why `message` and not `systemPrompt`: pi rebuilds the system prompt from scratch at
 * every agent start, so a pointer injected there would vanish the moment it was
 * deduped on the next turn — and the pull dedups per session by design. A message is
 * stored in the session, exactly like the Claude Code hook's output is stored in the
 * transcript, so the turn it was pulled for is where it stays.
 *
 * Why `display: true`: the owner has to see what the agent sees. The desk already
 * renders a custom message as a `⧉ nana-knowledge` expandable bubble; hiding it would
 * put untrusted search output into the context with nothing on screen saying so.
 *
 * Why there is no config key: the off switch is uninstalling the package, and
 * `rm -rf ~/.pi/agent/nana-knowledge` removes the index — with no index the CLI
 * prints nothing and the feature goes quiet on its own. A knob would be a third
 * place to look when it is silent.
 */

import { execFile } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PROMPT_MAX_CHARS } from "../lib/tokenize.ts";

/**
 * pi has no handler timeout of its own, so this is the bound. 2 s against a query
 * measured at ~8 ms inside a ~60 ms node start: generous for the happy path, short
 * enough that a wedged store costs one late turn rather than a frozen agent.
 */
const TIMEOUT_MS = 2000;
/** The CLI caps its block at 2000 chars; 64 KB is slack, not a budget. */
const MAX_BUFFER = 64 * 1024;

/**
 * The CLI's contract is Node ≥ 22.18 (type stripping, `node:sqlite`), and pi itself may
 * be running under bun — so reuse `process.execPath` only when it IS node, and otherwise
 * let execFile resolve `node` from PATH (no node there → ENOENT → fail-open as usual).
 */
function nodeExecutable(): string {
	return path.basename(process.execPath).toLowerCase().startsWith("node") ? process.execPath : "node";
}

export interface PullInput {
	prompt: string;
	sessionId: string;
	cwd: string;
}

/**
 * Run the pull CLI and return what it printed, or null.
 *
 * `bin`, `timeoutMs` and `execFileFn` exist for the tests — a hanging script and a
 * missing path are two failures that have to stay silent, and the third, a child no
 * kill can end, cannot be produced by a real process at all (see the timer below).
 */
export function makePull(opts: { bin?: string; timeoutMs?: number; execFileFn?: typeof execFile } = {}): (input: PullInput) => Promise<string | null> {
	const bin = opts.bin ?? fileURLToPath(new URL("../bin/nana-knowledge.ts", import.meta.url));
	const timeout = opts.timeoutMs ?? TIMEOUT_MS;
	const execFileFn = opts.execFileFn ?? execFile;

	return (input: PullInput) =>
		new Promise<string | null>((resolve) => {
			let settled = false;
			let timer: ReturnType<typeof setTimeout> | undefined;
			const done = (value: string | null) => {
				if (settled) return;
				settled = true;
				if (timer) clearTimeout(timer);
				resolve(value);
			};
			try {
				const child = execFileFn(
					nodeExecutable(),
					[bin, "hook"],
					{ timeout, killSignal: "SIGKILL", maxBuffer: MAX_BUFFER, windowsHide: true, env: { ...process.env, NODE_NO_WARNINGS: "1" } },
					(err, stdout) => {
						// Spawn failure (ENOENT), non-zero exit, the deadline kill and a
						// blown maxBuffer all arrive here as `err`. Every one of them means
						// no pointers, never a thrown prompt.
						if (err) return done(null);
						const text = String(stdout ?? "").trim();
						done(text ? text : null);
					},
				);
				// THE bound on the turn. execFile's own `timeout` (SIGKILL) ends every child a
				// kill can end — Node destroys the child's stdio before signalling, so even a
				// descendant holding the pipe does not delay the callback (measured: 207 ms
				// with a grandchild on stdout and this timer removed). What it cannot end is
				// a child wedged in an uninterruptible syscall — the wedged-filesystem case
				// that put the pull out-of-process in the first place — and there the
				// callback never fires. So resolve FIRST, then try to kill. Progress never
				// depends on the child; cleanup is best-effort.
				timer = setTimeout(() => {
					done(null);
					try { child.kill("SIGKILL"); } catch { /* already gone (on win32 this just terminates) */ }
				}, timeout);
				timer.unref?.(); // a pending pull must never hold pi's process open
				// The child can be gone before the payload is written — killed at the
				// deadline, or exited on a bad path. Without this listener that EPIPE is
				// an unhandled "error" EVENT, i.e. an uncaught exception inside pi.
				child.stdin?.on("error", () => { /* no reader left; the callback above decides */ });
				child.stdin?.end(
					JSON.stringify({
						// Slice here, not only in the child: a pasted megabyte is not a better
						// query and there is no reason to push it through a pipe first.
						prompt: input.prompt.slice(0, PROMPT_MAX_CHARS),
						session_id: input.sessionId,
						cwd: input.cwd,
						source: "pi",
					}),
				);
			} catch {
				done(null); // a synchronous spawn throw is still just "no pointers"
			}
		});
}

export default function (pi: ExtensionAPI) {
	const pull = makePull();

	pi.on("before_agent_start", async (event, ctx) => {
		// Fail-open is the whole contract: this runs on every prompt the owner types,
		// and a rejection here is a broken turn.
		try {
			// The only guard here is the API shape. Every skip rule (too short, slash
			// command, harness notification, too few tokens) belongs to the producer —
			// duplicating even one of them here is how the two sides start to drift.
			const prompt = (event as { prompt?: unknown }).prompt;
			if (typeof prompt !== "string") return undefined;
			// Dedup lives in the child and is keyed on the session id, so no id means no
			// safe pull — better silent than repeating the same pointers every turn.
			const sessionId = (ctx.sessionManager as { getSessionId?: () => string } | undefined)?.getSessionId?.();
			if (typeof sessionId !== "string" || sessionId === "") return undefined;
			const text = await pull({ prompt, sessionId, cwd: ctx.cwd });
			if (!text) return undefined;
			return { message: { customType: "nana-knowledge", content: text, display: true } };
		} catch {
			return undefined;
		}
	});
}
