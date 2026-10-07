/**
 * @module packages/nana-pack/extensions/nana-post-edit.ts
 * @purpose Run the configured format, lint and test checks after a successful edit or write, feeding only
 *  failures back to the model.
 * @inputs pi `tool_result` events for edit/write (input.path, isError), postEdit.commands config, pi's
 *  file-mutation queue, and ctx (cwd, signal, hasUI, ui)
 * @outputs one bounded failure line per failing check appended to the tool result, a post-edit UI status
 *  naming the worst outcome, and `postedit_file_queue_unavailable` journal lines
 * @effects process (spawns each check in a shell under its timeoutMs, then SIGTERM and SIGKILL over its
 *  tree), disk (appends the journal)
 * @errors never throws — each check is classified checks_passed / checks_failed / error / timeout / not_run
 *  plus a `lock` refusal, and a malformed command entry or bad match regex is skipped
 */
/**
 * nana-post-edit — post-edit format/lint/test triggers.
 *
 * After a successful edit/write, runs each configured command whose `match`
 * regex hits the file path. Failures are appended to the tool result so the
 * model sees them immediately and can fix them; successes stay out of the
 * model's context. Every run leaves a one-line UI status instead, so a working
 * hook is visible rather than indistinguishable from no hook at all.
 *
 * No-op until commands are configured in nana-pack.json, e.g.:
 *   { "postEdit": { "commands": [
 *       { "match": "\\.ts$", "run": "npx prettier --write {file}" },
 *       { "match": "\\.py$", "run": "ruff check {file}" } ] } }
 */

import { type ChildProcess, spawn } from "node:child_process";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendJournal, loadConfig } from "../lib/config.ts";
import { resolveToolPath } from "../lib/gate-paths.ts";
import { promptPath, promptText, uiPath } from "../lib/display.mjs";

/** Cap on captured checker output (matches the previous exec maxBuffer). */
const MAX_OUTPUT = 1024 * 1024;
/** Grace between the deadline's SIGTERM and the unignorable SIGKILL + settlement. */
const KILL_GRACE_MS = 2000;

function quote(file: string): string {
	return `"${file.replace(/(["\\$`])/g, "\\$1")}"`;
}

/** Cap on one failure's checker output as fed to the model (its TAIL is kept: errors print last). */
const FAILURE_CAP = 2000;
const CMD_CAP = 400; // the repo-configured command, shown to the model; its truncation is stated

/**
 * One failure as ONE line of model-visible text (lib/display.mjs promptText): the command and the
 * checker's output are repo-controlled, so neither may start a line, a heading or a fence of its
 * own. Output line breaks are shown as " ⏎ " so the lines stay legible; the tail FAILURE_CAP chars
 * are kept, and BOTH truncations — command and output — are stated.
 */
function failureLine(cmd: string, what: string, out?: string): string {
	// The COMMAND is repo-configured too, so its truncation is stated like the output's (sol r1 #1):
	// a silently cut command leaves the model reading something the project never configured.
	const shownCmd = promptText(cmd, CMD_CAP);
	const cmdCut = String(cmd).length > CMD_CAP;
	const head = `- check ${shownCmd}${cmdCut ? ` (command truncated: first ${CMD_CAP} of ${String(cmd).length} chars shown)` : ""} ${what}`;
	if (out === undefined) return head;
	const o = String(out);
	const cut = o.length > FAILURE_CAP;
	const body = promptText((cut ? o.slice(-FAILURE_CAP) : o).replace(/\r\n|[\n\r\u0085\u2028\u2029]/g, " ⏎ "), FAILURE_CAP * 3);
	return `${head}${cut ? ` (output truncated: last ${FAILURE_CAP} of ${o.length} chars shown)` : ""}: ${body}`;
}

/** Per-check outcome for the status line: pi's own statuses plus the lock refusal. */
type CheckStatus = "checks_passed" | "checks_failed" | "error" | "timeout" | "not_run";
type Outcome = CheckStatus | "lock";

/**
 * One short line summarising the run for the footer/desk chip.
 *
 * The hook used to be silent unless something failed, so a working post-edit
 * config looked exactly like no hook at all. This is the happy-path signal.
 * It shares the TUI status line with everything else pi puts there, so it stays
 * short, and it reports the WORST outcome first: a check that could not run is
 * never folded into a pass.
 */
function statusLine(outcomes: Outcome[], name: string): { text: string; color: "dim" | "warning" | "error" } {
	if (outcomes.includes("lock")) return { text: `post-edit – skipped (lock) · ${name}`, color: "warning" };
	if (outcomes.includes("not_run")) return { text: `post-edit – skipped (aborted) · ${name}`, color: "warning" };
	if (outcomes.includes("timeout")) return { text: `post-edit ⏱ timeout · ${name}`, color: "warning" };
	const bad = outcomes.filter((s) => s !== "checks_passed").length;
	if (bad > 0) return { text: `post-edit ✗ ${bad}/${outcomes.length} · ${name}`, color: "error" };
	return { text: `post-edit ✓ ${outcomes.length} check${outcomes.length === 1 ? "" : "s"} · ${name}`, color: "dim" };
}

// Path interpretation is shared with the gate so policy checks and post-edit
// path checks agree, including malformed file URLs.


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
		const abs = resolveToolPath(file, ctx.cwd);

		const queue = await loadFileQueue();
		if (!queue && !queueAbsenceReported) {
			queueAbsenceReported = true;
			appendJournal(cfg, { ts: new Date().toISOString(), event: "postedit_file_queue_unavailable", cwd: ctx.cwd });
			if (ctx.hasUI) ctx.ui.notify("post-edit: pi's file-mutation queue is unavailable — checks are not serialized against edits", "warning");
		}

		const failures: string[] = [];
		const outcomes: Outcome[] = [];
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

			const guarded = async (): Promise<RunResult> => run(cmd, ctx.cwd, timeoutMs, ctx.signal, env);

			let res: RunResult | undefined;
			let lockError: string | null = null;
			if (queue) {
				try {
					res = await queue(abs, guarded);
				} catch (err) {
					// The queue realpath()s the target before admitting anyone. If it
					// refuses, running anyway would put a MUTATING formatter back outside
					// pi's serialization — the exact race this closes — so the check does
					// not run, and the model is told so.
					lockError = err instanceof Error ? err.message : String(err);
				}
			} else {
				res = await guarded();
			}

			if (!res) {
				failures.push(failureLine(cmd, `did not run — could not lock ${promptPath(abs)} for checking: ${promptText(lockError, 300)}`));
				outcomes.push("lock");
				continue;
			}
			const { code, exitCode, status, out } = res;
			outcomes.push(status);

			// Feed back to the model when a check did not PASS. A trapped-timeout can exit 0 yet be
			// classified `timeout`, and a checker that could not run is `error`; a
			// `code !== 0` test alone would leave the model uninformed for those. The
			// pass path stays silent.
			if (status === "timeout" || status === "error") {
				const why = status === "timeout" ? "did not complete (timed out)" : "could not run";
				failures.push(failureLine(cmd, why, out));
			} else if (code !== 0) {
				failures.push(failureLine(cmd, `exited ${code}`, out));
			}
		}

		// Happy-path visibility. Only set when at least one check actually ran (or
		// was refused): a run where nothing matched leaves the previous chip alone
		// rather than replacing it with noise. Wrapped — a status update must never
		// throw out of the tool_result handler and take the edit's result with it.
		if (ctx.hasUI && outcomes.length > 0) {
			try {
				const s = statusLine(outcomes, uiPath(path.basename(abs)));
				ctx.ui.setStatus("nana-post-edit", ctx.ui.theme.fg(s.color, s.text));
			} catch {
				// observability only
			}
		}

		if (failures.length === 0) return undefined;

		if (ctx.hasUI) ctx.ui.notify(`post-edit checks failed: ${uiPath(file)}`, "warning");
		return {
			content: [
				...event.content,
				{
					type: "text" as const,
					text: `[nana-post-edit] ${failures.length} check(s) failed after editing ${promptPath(file)}:\n\n${failures.join("\n")}\n\nFix these before proceeding.`,
				},
			],
		};
	});
}
