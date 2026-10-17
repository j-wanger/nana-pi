/**
 * @module packages/nana-setup/tests/roster-notice-hook.test.mjs
 * @purpose Pins the Claude Code roster notice SessionStart hook: its SessionStart context on
 *  every source, its systemMessage on a session-start-like or unreadable source only, and its
 *  fail-open unavailable notice when it cannot load its modules.
 * @inputs claude/hooks/nana-roster-notice.mjs, its exported runRosterNoticeHook, and a
 *  throwaway HOME with PI_CODING_AGENT_DIR overridden
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home and agent-dir layouts), process (runs and imports the Node hook)
 * @errors a failed check prints FAIL with the observed value and the run exits 1
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import { Readable } from "node:stream";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const hook = path.join(pkg, "claude", "hooks", "nana-roster-notice.mjs");
const { runRosterNoticeHook } = await import(new URL("../claude/hooks/nana-roster-notice.mjs", import.meta.url).href);
const { NOTICE_PREFIX, CHANGE_POINTER } = await import(new URL("../../nana-pack/lib/roster-notice-config.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmps = [];
function freshAgentDir() {
	const td = tmpDir(path.join(os.tmpdir(), "nana-roster-hook-"));
	tmps.push(td);
	return td;
}
const run = (agentDir, stdin) =>
	spawnSync(process.execPath, [hook], { encoding: "utf8", input: stdin, env: { PATH: process.env.PATH, HOME: os.homedir(), PI_CODING_AGENT_DIR: agentDir } });
const parseOne = (stdout) => {
	const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
	if (lines.length !== 1) return null;
	try { return JSON.parse(lines[0]); } catch { return null; }
};

/* --- H1: one JSON object with SessionStart context on every source and with no source --- */
{
	const sources = ["startup", "resume", "clear", "fork", "compact"];
	const results = sources.map((source) => {
		const r = run(freshAgentDir(), JSON.stringify({ source }));
		const parsed = parseOne(r.stdout);
		return [source, r.status === 0 && parsed !== null && parsed.hookSpecificOutput?.hookEventName === "SessionStart" && typeof parsed.hookSpecificOutput?.additionalContext === "string" && parsed.hookSpecificOutput.additionalContext.startsWith(NOTICE_PREFIX)];
	});
	const noSource = run(freshAgentDir(), "");
	const parsedNoSource = parseOne(noSource.stdout);
	results.push(["no source", noSource.status === 0 && parsedNoSource !== null && parsedNoSource.hookSpecificOutput?.hookEventName === "SessionStart" && typeof parsedNoSource.hookSpecificOutput?.additionalContext === "string" && parsedNoSource.hookSpecificOutput.additionalContext.startsWith(NOTICE_PREFIX)]);
	// req: R-1205
	check("roster notice hook: one JSON object with the notice as SessionStart context on every source and with no source, and exit 0", results.every(([, pass]) => pass), JSON.stringify(results));
}

/* --- H2: systemMessage on startup/resume/clear/fork, missing/unreadable source, a read
   failure, but never on compact ------------------------------------------------------------ */
{
	const results = [];
	for (const source of ["startup", "resume", "clear", "fork"]) {
		const r = run(freshAgentDir(), JSON.stringify({ source }));
		const parsed = parseOne(r.stdout);
		results.push([source, r.status === 0 && typeof parsed?.systemMessage === "string" && parsed.systemMessage.startsWith(NOTICE_PREFIX)]);
	}
	{
		const r = run(freshAgentDir(), "");
		const parsed = parseOne(r.stdout);
		results.push(["missing source", r.status === 0 && typeof parsed?.systemMessage === "string"]);
	}
	{
		const r = run(freshAgentDir(), "not json at all {{{");
		const parsed = parseOne(r.stdout);
		results.push(["unreadable source", r.status === 0 && typeof parsed?.systemMessage === "string"]);
	}
	{
		const r = run(freshAgentDir(), JSON.stringify({ source: "compact" }));
		const parsed = parseOne(r.stdout);
		results.push(["compact", r.status === 0 && parsed?.systemMessage === undefined]);
	}
	{
		// R-1206: an input read error counts as no source — fed directly, with no child
		// process, through the exported runner (the brief's note: a directory given as a
		// spawned child's stdin reads as EMPTY, not as a read error, so a real spawn cannot
		// produce this case).
		const failing = new Readable({ read() { this.emit("error", Object.assign(new Error("boom"), { code: "EPIPE" })); } });
		failing.isTTY = false;
		let written = "";
		await runRosterNoticeHook({ input: failing, write: (text) => { written += text; } });
		const parsed = parseOne(written);
		// a read failure must still show the REAL notice (the change pointer, never the
		// unavailable fallback, which also starts with NOTICE_PREFIX but carries no pointer).
		results.push(["read failure", typeof parsed?.systemMessage === "string" && parsed.systemMessage.startsWith(NOTICE_PREFIX) && parsed.systemMessage.includes(CHANGE_POINTER) && !parsed.systemMessage.includes("unavailable")]);
	}
	// req: R-1206
	check("roster notice hook: the notice is a user message for startup, resume, clear and fork, for a missing or unreadable source and for an input that fails on read, and not for compact", results.every(([, pass]) => pass), JSON.stringify(results));
}

/* --- H3: a copy that cannot load its modules fails open with the unavailable notice ------ */
{
	const isolated = tmpDir(path.join(os.tmpdir(), "nana-roster-hook-isolated-"));
	tmps.push(isolated);
	const copy = path.join(isolated, "nana-roster-notice.mjs");
	fs.copyFileSync(hook, copy);
	const r = spawnSync(process.execPath, [copy], { encoding: "utf8", input: JSON.stringify({ source: "startup" }) });
	const parsed = parseOne(r.stdout);
	// req: R-1207
	check("roster notice hook: a copy that cannot load its modules prints the unavailable notice in both fields with no path, and exits 0",
		r.status === 0 && parsed !== null &&
		typeof parsed.systemMessage === "string" && parsed.systemMessage.startsWith("nana active · roster notice unavailable (") &&
		parsed.systemMessage === parsed.hookSpecificOutput?.additionalContext &&
		parsed.hookSpecificOutput?.hookEventName === "SessionStart" &&
		!parsed.systemMessage.includes("/") && !parsed.systemMessage.includes("\\"),
		JSON.stringify({ status: r.status, stdout: r.stdout, stderr: r.stderr }));
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
