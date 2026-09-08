/**
 * nana-post-edit — post-edit format/lint/test triggers.
 *
 * After a successful edit/write, runs each configured command whose `match`
 * regex hits the file path. Failures are appended to the tool result so the
 * model sees them immediately and can fix them; successes stay silent.
 *
 * Each check ALSO leaves a content-bound receipt (lib/receipts.ts) — for both
 * pass and fail — recording what ran, over which file bytes, and how it exited.
 * That receipt is best-effort evidence a later /nana-verify reads; writing it
 * never changes the feedback fed back to the model.
 *
 * No-op until commands are configured in nana-pack.json, e.g.:
 *   { "postEdit": { "commands": [
 *       { "match": "\\.ts$", "run": "npx prettier --write {file}" },
 *       { "match": "\\.py$", "run": "ruff check {file}" } ] } }
 */

import { type ChildProcess, spawn } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendJournal, loadConfig } from "../lib/config.ts";
import {
	type CheckStatus,
	computeInputsDigest,
	isInside,
	receiptsDir,
	writeReceipt,
} from "../lib/receipts.ts";

/** Cap on captured checker output (matches the previous exec maxBuffer). */
const MAX_OUTPUT = 1024 * 1024;
/** Grace between the deadline's SIGTERM and the unignorable SIGKILL + settlement. */
const KILL_GRACE_MS = 2000;

function quote(file: string): string {
	return `"${file.replace(/(["\\$`])/g, "\\$1")}"`;
}

function tail(s: string, n: number): string {
	return s.length <= n ? s : `…${s.slice(-n)}`;
}

// ---------------------------------------------------------------------------
// Path normalization — MUST match pi's, or we check the wrong file.
//
// pi's edit/write tools resolve the model's `path` with `resolveToCwd`
// (0.84.4 dist/core/tools/path-utils.js:42), which is
// `resolvePath(input, cwd, { normalizeUnicodeSpaces: true, stripAtPrefix: true })`
// (dist/utils/paths.js:58-86): Unicode spaces folded to ASCII, a leading `@`
// stripped, win32 shell paths (/c/…, /mnt/c/…) converted, `~` expanded, file://
// URLs converted. A plain path.resolve() misses all of that, so an input like
// `~/x.ts` or `@src/x.ts` would mutate one file while the checker, the receipt
// digest and the file-queue key targeted another — silently invalidating the
// receipt and bypassing serialization.
//
// pi does not export it: dist/index.js exposes no path helpers and package.json
// declares no subpath for core/tools. Mirrored here instead, with the two
// defaults resolveToCwd relies on inlined (`trim` off, `expandTilde` on).
// ---------------------------------------------------------------------------
const UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

function normalizeWindowsShellPath(filePath: string): string {
	if (!filePath.startsWith("/") || filePath.startsWith("//") || filePath.includes("\\")) return filePath;
	const match = filePath.match(/^\/(?:mnt\/|cygdrive\/)?([a-z])(?:\/(.*))?$/i);
	if (!match) return filePath;
	const suffix = match[2]?.replaceAll("/", "\\");
	return `${match[1].toUpperCase()}:\\${suffix ?? ""}`;
}

function normalizePath(input: string, opts: { normalizeUnicodeSpaces?: boolean; stripAtPrefix?: boolean } = {}): string {
	let normalized = input;
	if (opts.normalizeUnicodeSpaces) normalized = normalized.replace(UNICODE_SPACES, " ");
	if (opts.stripAtPrefix && normalized.startsWith("@")) normalized = normalized.slice(1);
	if (process.platform === "win32") normalized = normalizeWindowsShellPath(normalized);
	const home = os.homedir();
	if (normalized === "~") return home;
	if (normalized.startsWith("~/") || (process.platform === "win32" && normalized.startsWith("~\\"))) {
		return path.join(home, normalized.slice(2));
	}
	if (/^file:\/\//.test(normalized)) return fileURLToPath(normalized);
	return normalized;
}

function resolveToCwd(filePath: string, cwd: string): string {
	const normalized = normalizePath(filePath, { normalizeUnicodeSpaces: true, stripAtPrefix: true });
	const base = normalizePath(cwd);
	return path.isAbsolute(normalized) ? path.resolve(normalized) : path.resolve(base, normalized);
}

/**
 * Kill the checker AND everything it spawned.
 *
 * Node's own `timeout` option sends ONE signal to the direct child and never
 * escalates, so a checker that ignores SIGTERM leaves the run promise pending
 * forever — and since pi awaits the `tool_result` handler, that hangs the turn.
 * It also never reaches the shell's descendants: a grandchild holding the stdio
 * pipe keeps the run unresolved even after the shell dies.
 *  - posix: the child is spawned `detached`, making it a process-GROUP leader,
 *    so a negative pid signals the shell and everything under it.
 *  - win32: signals have no group semantics; `taskkill /T /F` walks the tree.
 *    It can be absent from PATH or denied, and says so through an `error` event
 *    OR a non-zero exit — both are observed, and both fall back to killing the
 *    direct child rather than failing silently.
 * Best-effort and never throws. Killing is not guaranteed to succeed, which is
 * why run()'s escalation settles the promise either way.
 */
function killTree(child: ChildProcess, escalate: boolean): void {
	const pid = child.pid;
	if (pid === undefined) return;
	const signal: NodeJS.Signals = escalate ? "SIGKILL" : "SIGTERM";
	const direct = () => {
		try {
			child.kill(signal);
		} catch {
			// already reaped
		}
	};
	if (process.platform !== "win32") {
		try {
			process.kill(-pid, signal);
		} catch {
			direct(); // group already gone (or never created)
		}
		return;
	}
	try {
		const tk = spawn("taskkill", ["/T", "/F", "/PID", String(pid)], { windowsHide: true, stdio: "ignore" });
		tk.on("error", direct);
		tk.on("close", (code) => {
			if (code !== 0) direct();
		});
	} catch {
		direct();
	}
}

// Classify an exec result into a distinct status. error/timeout/not_run must
// NEVER be folded into checks_passed: a checker that could not run is not a pass.
// Deadline-aware: `timedOut` (elapsed >= the timeout) forces `timeout` even when a
// child traps the kill signal and exits 0 (err === null) — decided BEFORE the
// !err → checks_passed branch, so a killed checker is never recorded as passed.
function classify(err: any, aborted: boolean, timedOut: boolean): CheckStatus {
	if (aborted || err?.name === "AbortError" || err?.code === "ABORT_ERR") return "not_run"; // interrupted
	// Output overflow: the child is killed but no verdict was produced —
	// an error, NOT a timeout. Decide it before the killed → timeout branch below.
	if (err && (err.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" || /maxBuffer/i.test(err.message ?? ""))) return "error";
	if (timedOut || err?.killed) return "timeout"; // deadline fired, or killed by the timeout option
	if (!err) return "checks_passed";
	// shell "command not found" (127) / "found but not executable" (126) / cmd.exe "not recognized" (9009),
	// a direct spawn failure (ENOENT), or permission denied (EACCES) — the checker never produced a verdict.
	if (err.code === "ENOENT" || err.code === "EACCES" || err.code === 127 || err.code === 126 || err.code === 9009) return "error";
	return "checks_failed"; // ran to completion, non-zero exit
}

interface RunResult {
	code: number;
	exitCode: number | null;
	status: CheckStatus;
	out: string;
}

function run(
	cmd: string,
	cwd: string,
	timeoutMs: number,
	signal: AbortSignal | undefined,
	env?: NodeJS.ProcessEnv,
): Promise<RunResult> {
	return new Promise((resolve) => {
		// Capture the start so classify can be deadline-aware: a child that traps the
		// timeout's kill signal and exits 0 returns err === null, but elapsed >= timeout
		// still marks it `timeout`.
		const startedAt = performance.now();
		let out = "";
		let overflow = false;
		let settled = false;
		let deadline: ReturnType<typeof setTimeout> | undefined;
		let escalation: ReturnType<typeof setTimeout> | undefined;

		const finish = (err: any) => {
			if (settled) return;
			settled = true;
			clearTimeout(deadline);
			clearTimeout(escalation);
			signal?.removeEventListener("abort", onAbort);
			// timeoutMs 0 disables the deadline, so there is nothing to fire.
			const timedOut = timeoutMs > 0 && performance.now() - startedAt >= timeoutMs;
			const code = err ? (typeof err.code === "number" ? err.code : 1) : 0;
			const exitCode = err ? (typeof err.code === "number" ? err.code : null) : 0;
			resolve({ code, exitCode, status: classify(err, signal?.aborted ?? false, timedOut), out });
		};

		// Terminate, then escalate AND settle: one shared path for the deadline and
		// for an aborted turn, both of which must bound the wait rather than hope the
		// checker cooperates.
		const terminate = (child: ChildProcess) => {
			killTree(child, false);
			escalation ??= setTimeout(() => {
				killTree(child, true);
				// Settle whether or not the kill worked. SIGKILL is unignorable, but the
				// thing holding this promise open may be out of reach: a descendant that
				// re-parented into its OWN process group still holds the inherited stdio
				// pipe, and on win32 taskkill can be missing or denied. run() must resolve
				// within timeout + grace on every platform, so stop listening, stop
				// holding the event loop open for an abandoned child, and report.
				child.stdout?.destroy();
				child.stderr?.destroy();
				child.unref();
				finish({ killed: true, message: `checker did not exit within ${KILL_GRACE_MS}ms of the kill signal` });
			}, KILL_GRACE_MS);
		};
		function onAbort() {
			if (!settled) terminate(child);
		}

		let child: ChildProcess;
		try {
			child = spawn(cmd, {
				cwd,
				env,
				shell: true,
				windowsHide: true,
				// posix: own process group, so the deadline can reach the whole tree
				detached: process.platform !== "win32",
			});
		} catch (err) {
			finish(err);
			return;
		}

		const onData = (chunk: string) => {
			if (overflow) return;
			out += chunk;
			if (out.length > MAX_OUTPUT) {
				overflow = true;
				out = out.slice(0, MAX_OUTPUT);
				killTree(child, true);
			}
		};
		child.stdout?.setEncoding("utf-8");
		child.stdout?.on("data", onData);
		child.stderr?.setEncoding("utf-8");
		child.stderr?.on("data", onData);
		child.on("error", (err) => finish(err));
		child.on("close", (code, sig) => {
			if (overflow) {
				finish({ code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER", killed: true, message: "stdout maxBuffer length exceeded" });
			} else if (sig !== null) {
				finish({ killed: true, signal: sig, message: `killed by ${sig}` });
			} else {
				finish(code === 0 ? null : { code });
			}
		});

		if (signal?.aborted) onAbort();
		else signal?.addEventListener("abort", onAbort);
		if (timeoutMs > 0) deadline = setTimeout(() => terminate(child), timeoutMs);
	});
}

/**
 * pi's per-file mutation queue, if this extension is running inside pi.
 *
 * pi's edit/write tools take this queue for the file they mutate, but RELEASE it
 * before the `tool_result` handler runs — and in pi's default parallel tool mode
 * sibling tool calls from one assistant message execute concurrently. So a
 * formatter started here can read the file, and a sibling edit can land before
 * the formatter writes: the sibling's change is silently lost. Holding the same
 * queue closes that window (pi's extensions.md gives custom file-mutating tools
 * exactly this guidance).
 *
 * Imported lazily rather than statically: a static import would fail to resolve
 * outside pi and take the whole extension down with it. Verified against pi
 * 0.84.4's real loader (jiti with `alias`, and with `virtualModules` for compiled
 * binaries): the dynamic specifier resolves to pi's OWN module instance, so it is
 * the same queue the edit tool uses.
 *
 * Absence is reported, never silently swallowed — an unserialized formatter is
 * exactly the bug this closes.
 */
type QueueFn = <T>(file: string, fn: () => Promise<T>) => Promise<T>;
let queueFn: QueueFn | null | undefined;
let queueAbsenceReported = false;

async function loadFileQueue(): Promise<QueueFn | null> {
	if (queueFn === undefined) {
		try {
			const m: any = await import("@earendil-works/pi-coding-agent");
			queueFn = typeof m?.withFileMutationQueue === "function" ? m.withFileMutationQueue : null;
		} catch {
			queueFn = null; // not running inside pi — there is no pi edit tool to race
		}
	}
	return queueFn;
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_result", async (event, ctx) => {
		if (event.toolName !== "edit" && event.toolName !== "write") return undefined;
		if (event.isError) return undefined;
		const cfg = loadConfig(ctx);
		if (cfg.postEdit.commands.length === 0) return undefined;
		const file = String((event.input as any).path ?? "");
		if (!file) return undefined;
		// ONE resolution for everything downstream, using pi's own normalization:
		// the bytes we hash, the path we hand the shell, and the file-queue key must
		// all be the file pi's edit/write tool actually touched.
		const abs = resolveToCwd(file, ctx.cwd);

		const queue = await loadFileQueue();
		if (!queue && !queueAbsenceReported) {
			queueAbsenceReported = true;
			appendJournal(cfg, { ts: new Date().toISOString(), event: "postedit_file_queue_unavailable", cwd: ctx.cwd });
			if (ctx.hasUI) ctx.ui.notify("post-edit: pi's file-mutation queue is unavailable — checks are not serialized against edits", "warning");
		}

		const failures: string[] = [];
		for (const c of cfg.postEdit.commands) {
			// Skip a malformed command defensively — a bad entry must never throw out
			// of the handler (a throw here would BLOCK the edit) or abort the rest.
			// `run` must be a usable string, and `timeoutMs` a non-negative INTEGER
			// (a negative/NaN/fractional deadline is malformed config, not a deadline).
			if (!c || typeof c.run !== "string") continue;
			const timeoutMs = c.timeoutMs ?? 30_000;
			if (typeof timeoutMs !== "number" || !Number.isInteger(timeoutMs) || timeoutMs < 0) continue;
			let re: RegExp;
			try {
				re = new RegExp(c.match);
			} catch {
				continue;
			}
			if (!re.test(file)) continue;
			// win32: the shell is cmd.exe, where sh-style quoting corrupts `C:\` paths
			// and %…% expands even inside quotes. Passing the path via an env var and
			// substituting `"%NANA_PI_FILE%"` lets cmd expand it itself — once,
			// non-recursively — so any legal path survives.
			const win = process.platform === "win32";
			const replacement = win ? '"%NANA_PI_FILE%"' : quote(abs);
			// A FUNCTION replacer: in a string replacement `$&`, `` $` ``, `$'`, `$1`
			// and `$$` are substitution patterns, so a filename containing them (say
			// `a$&b.ts`) would be rewritten into the command. A function's return
			// value is inserted literally.
			const cmd = c.run.replaceAll("{file}", () => replacement);
			const env = win ? { ...process.env, NANA_PI_FILE: abs } : undefined;

			// Receipt side-work is best-effort observability: skip ALL of it when
			// receipts are disabled, and isolate the prep so no config shape or IO can
			// throw into the agent (mirrors appendJournal). The check itself always runs.
			// Digests are taken INSIDE the file queue with the check, so
			// `inputsStableDuringCheck` means "the checker changed it", not "someone
			// else did". A configured timeoutMs of 0 makes this hold unbounded — the
			// same explicit no-deadline choice, now also applied to the file lock.
			let declared: string[] = [];
			let before: ReturnType<typeof computeInputsDigest> = null;
			let after: ReturnType<typeof computeInputsDigest> = null;
			const guarded = async (): Promise<RunResult> => {
				if (cfg.receipts.enabled) {
					try {
						// Declared inputs for this checker = the edited file its `match` hit,
						// bound by CONTENTS. Exclude the receipt store itself from any digest.
						declared = isInside(abs, receiptsDir(cfg)) ? [] : [abs];
						// Digest BEFORE the check so we can detect a formatter mutating inputs mid-run.
						before = declared.length ? computeInputsDigest(declared, ctx.cwd) : null;
					} catch {
						declared = []; // best-effort by design — never throw into the agent
					}
				}
				const r = await run(cmd, ctx.cwd, timeoutMs, ctx.signal, env);
				// Digest AFTER so the binding reflects any in-place formatting. If the
				// inputs changed during the check, the receipt is inconclusive, not current.
				if (cfg.receipts.enabled && declared.length) {
					try {
						after = computeInputsDigest(declared, ctx.cwd);
					} catch {
						after = null;
					}
				}
				return r;
			};

			let res: RunResult | undefined;
			let lockError: string | null = null;
			if (queue) {
				try {
					res = await queue(abs, guarded);
				} catch (err) {
					// The queue realpath()s the target before admitting anyone. If it
					// refuses, running anyway would put a MUTATING formatter back outside
					// pi's serialization — the exact race this closes — so the check does
					// not run, and both the receipt and the model say so.
					lockError = err instanceof Error ? err.message : String(err);
				}
			} else {
				res = await guarded();
			}

			if (!res) {
				writeReceipt(cfg, {
					v: 1,
					ts: new Date().toISOString(),
					repoRoot: ctx.cwd,
					checker: c.run,
					command: cmd,
					cwd: ctx.cwd,
					status: "not_run",
					exitCode: null,
					inputs: [],
					digest: "",
					digestBefore: null,
					inputsStableDuringCheck: false,
				});
				failures.push(`\`${cmd}\` did not run — could not lock ${abs} for checking: ${lockError}`);
				continue;
			}
			const { code, exitCode, status, out } = res;

			if (cfg.receipts.enabled && declared.length) {
				try {
					const stable = before != null && after != null && before.digest === after.digest;
					writeReceipt(cfg, {
						v: 1,
						ts: new Date().toISOString(),
						repoRoot: ctx.cwd,
						checker: c.run,
						command: cmd,
						cwd: ctx.cwd,
						status,
						exitCode,
						inputs: after?.inputs ?? [],
						digest: after?.digest ?? "",
						digestBefore: before?.digest ?? null,
						inputsStableDuringCheck: stable,
					});
				} catch {
					// best-effort by design — never throw into the agent
				}
			}

			// Feed back to the model when a check did not PASS — the receipt alone is
			// observability the model never sees. A trapped-timeout can exit 0 yet be
			// classified `timeout`, and a checker that could not run is `error`; a
			// `code !== 0` test alone would leave the model uninformed for those. The
			// pass path stays silent.
			if (status === "timeout" || status === "error") {
				const why = status === "timeout" ? "did not complete (timed out)" : "could not run";
				failures.push(`\`${cmd}\` ${why}:\n${tail(out, 2000)}`);
			} else if (code !== 0) {
				failures.push(`\`${cmd}\` exited ${code}:\n${tail(out, 2000)}`);
			}
		}
		if (failures.length === 0) return undefined;

		if (ctx.hasUI) ctx.ui.notify(`post-edit checks failed: ${file}`, "warning");
		return {
			content: [
				...event.content,
				{
					type: "text" as const,
					text: `[nana-post-edit] ${failures.length} check(s) failed after editing ${file}:\n\n${failures.join("\n\n")}\n\nFix these before proceeding.`,
				},
			],
		};
	});
}
