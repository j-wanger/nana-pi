// Gate: the pi extension is ONE THIN WRAPPER around the hook CLI — fail-open on every
// child failure, never a reject out of before_agent_start, and no node:sqlite inside
// pi's own process. It runs on every prompt the owner types; a throw here is a dead turn.
// Run: node --experimental-strip-types <this file>
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const td = fs.mkdtempSync(path.join(os.tmpdir(), "nk-ext-"));
const home = path.join(td, "home");
const src = path.join(td, "src");
fs.mkdirSync(home, { recursive: true });
fs.mkdirSync(src, { recursive: true });
process.env.NANA_KNOWLEDGE_HOME = home;

fs.writeFileSync(path.join(src, "rounds.md"), "---\ntitle: Review round cap\n---\nPi review rounds are capped at four; beyond that the reviewer repeats itself.\n");
fs.writeFileSync(path.join(src, "compaction.md"), "# Context compaction handoff\nThe handoff file survives compaction because it is injected at session start.\n");
fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({ roots: [{ path: src, kind: "articles" }] }));

// The index is built through lib/build.ts HERE, in the harness — the extension itself
// must never reach it (check 9 below is what pins that).
const { build } = await import(new URL("../lib/build.ts", import.meta.url).href);
await build();

const extUrl = new URL("../extensions/nana-knowledge.ts", import.meta.url).href;
const { default: ext, makePull } = await import(extUrl);
const { PROMPT_MAX_CHARS } = await import(new URL("../lib/tokenize.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

const HEADER = "[nana:knowledge] untrusted search pointers for this prompt";

// The real default export, driven through a fake pi that just records handlers.
const handlers = {};
ext({ on: (name, fn) => { handlers[name] = fn; } });
check("registers exactly one before_agent_start handler", Object.keys(handlers).join(",") === "before_agent_start");

const ctxFor = (sessionId) => ({
	cwd: td,
	hasUI: false,
	sessionManager: { getSessionId: () => sessionId },
});
const logLines = () => {
	const f = path.join(home, "pull.log");
	return fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
};

// (1) a real prompt injects a displayed nana-knowledge message
const r1 = await handlers.before_agent_start({ prompt: "what is the pi review round cap" }, ctxFor("pi-s1"));
check("1: a real prompt returns a message", !!r1?.message);
check("1: customType is nana-knowledge", r1?.message?.customType === "nana-knowledge");
check("1: display is true (the owner sees what the agent sees)", r1?.message?.display === true);
check("1: content is the untrusted-pointers block", typeof r1?.message?.content === "string" && r1.message.content.startsWith(HEADER));
check("1: no systemPrompt mutation", r1 !== undefined && !("systemPrompt" in r1));

// (2) the pull is logged as a pi pull, under pi's session id
{
	const last = logLines().at(-1);
	check("2: pull.log carries the pi session id", last?.session_id === "pi-s1");
	check('2: pull.log carries source "pi"', last?.source === "pi");
	check("2: pull.log carries the cwd the extension was given", last?.cwd === td);
}

// (3) dedup lives in the CHILD: the same prompt in the same session injects nothing
check("3: same prompt, same session → undefined", (await handlers.before_agent_start({ prompt: "what is the pi review round cap" }, ctxFor("pi-s1"))) === undefined);

// (4) ...and a different session id gets the pointers again
{
	const r = await handlers.before_agent_start({ prompt: "what is the pi review round cap" }, ctxFor("pi-s2"));
	check("4: a different session id pulls again", r?.message?.content?.startsWith(HEADER) === true);
	check("4: and it is logged under THAT session id", logLines().at(-1)?.session_id === "pi-s2");
}

// (5) a HUNG child is abandoned at the deadline — this is pi's only bound, it has no
// handler timeout of its own.
{
	const hang = path.join(td, "hang.mjs");
	fs.writeFileSync(hang, "setTimeout(() => process.exit(0), 10000);\n");
	const t0 = Date.now();
	const out = await makePull({ bin: hang, timeoutMs: 200 })({ prompt: "pi review round cap", sessionId: "pi-hang", cwd: td });
	const ms = Date.now() - t0;
	check("5: a hung child yields null", out === null);
	check(`5: and the deadline actually fires (${ms} ms)`, ms < 1500);
}

// (5b) THE HARD BOUND, and the one test (5) does not prove. No real process can stand
// in for the child that matters — one wedged in an uninterruptible syscall, which a
// SIGKILL cannot end and whose stdio therefore never closes. Every killable stand-in
// (a SIGTERM-deaf child; a child whose grandchild holds stdout) settles through
// execFile's OWN timeout even with the parent timer deleted (measured 205–207 ms, sol
// r2). So the only honest proof fakes execFile: a callback that never fires. Without
// the parent timer this await would hang forever.
{
	const kills = [];
	const neverCloses = (_file, _args, _opts, _cb) => ({
		stdin: { on() {}, end() {} },
		kill(sig) { kills.push(sig); return true; },
	});
	const t0 = Date.now();
	const out = await Promise.race([
		makePull({ bin: "/irrelevant", timeoutMs: 200, execFileFn: neverCloses })({ prompt: "pi review round cap", sessionId: "pi-wedged", cwd: td }),
		new Promise((r) => setTimeout(() => r("STILL-HANGING"), 3000)),
	]);
	const ms = Date.now() - t0;
	check("5b: a child whose callback never fires still yields null", out === null);
	check(`5b: ...near the deadline, on the handler's OWN timer (${ms} ms)`, ms >= 150 && ms < 1000);
	check("5b: the kill is attempted after resolving, with SIGKILL", kills.length === 1 && kills[0] === "SIGKILL");
}

// (6) a missing CLI is silence, not a throw
{
	let threw = false;
	let out = "unset";
	try { out = await makePull({ bin: "/nonexistent/x.ts" })({ prompt: "pi review round cap", sessionId: "pi-enoent", cwd: td }); }
	catch { threw = true; }
	check("6: a missing bin does not throw", !threw);
	check("6: a missing bin yields null", out === null);
}

// (7) a ctx without getSessionId: dedup is keyed on the session id, so no id = no pull
{
	let threw = false;
	let r = "unset";
	try { r = await handlers.before_agent_start({ prompt: "what is the pi review round cap" }, { cwd: td, hasUI: false, sessionManager: {} }); }
	catch { threw = true; }
	check("7: a sessionManager without getSessionId does not throw", !threw);
	check("7: ...and injects nothing", r === undefined);
}

// (8) the prompt is sliced BEFORE the child sees it. The tokens that would match sit
// past the cap, so a pull that found them would prove the whole prompt went down the pipe.
{
	const fat = "x".repeat(PROMPT_MAX_CHARS + 500) + " pi review round cap reviewer repeats";
	check("8: tokens past the cap do not drive the query", (await handlers.before_agent_start({ prompt: fat }, ctxFor("pi-cap"))) === undefined);
	// ...and directly: an echo child reports the length it actually received.
	const echo = path.join(td, "echo-len.mjs");
	fs.writeFileSync(echo, [
		"let raw = '';",
		"for await (const c of process.stdin) raw += c;",
		"process.stdout.write(String(JSON.parse(raw).prompt.length));",
	].join("\n") + "\n");
	const len = await makePull({ bin: echo })({ prompt: fat, sessionId: "pi-cap2", cwd: td });
	check(`8: the child receives exactly PROMPT_MAX_CHARS (${len})`, Number(len) === PROMPT_MAX_CHARS);
}

// (9) THE ISOLATION PROPERTY: a FULL pull through the extension must not load
// node:sqlite into pi's process. A wedged filesystem inside one SQLite call blocks the
// event loop, and pi — unlike Claude Code's hook harness — has no outer timeout to save
// the turn. The child does that work and can be killed; pi's process never touches it.
// Checked in a SUBPROCESS: this test file imported lib/build.ts above, so the in-process
// module list is contaminated by design.
{
	const probeBody = (body) => body.join("\n") + "\nconst hits = process.moduleLoadList.filter((m) => /sqlite/i.test(m));\n";
	const probe = path.join(td, "probe.mjs");
	fs.writeFileSync(probe, probeBody([
		`const { default: ext } = await import(${JSON.stringify(extUrl)});`,
		"const handlers = {};",
		"ext({ on: (n, f) => { handlers[n] = f; } });",
		`const r = await handlers.before_agent_start({ prompt: "what is the pi review round cap" }, { cwd: ${JSON.stringify(td)}, hasUI: false, sessionManager: { getSessionId: () => "pi-probe" } });`,
	]) + "process.stdout.write((r?.message ? 'PULLED' : 'NOPULL') + ' ' + (hits.length ? hits.join('|') : 'NONE'));\n");
	const out = execFileSync(process.execPath, [probe], { encoding: "utf8", env: { ...process.env, NODE_NO_WARNINGS: "1" } });
	check(`9: a real pull happened in the probe (${out})`, out.startsWith("PULLED "));
	check("9: ...and node:sqlite never loaded in the extension's process", out.endsWith(" NONE"));
	// Control, so the check above is measuring something real rather than a filter that
	// can never match: node:sqlite is loaded LAZILY (lib/db.ts loadSqlite), so the thing
	// that must show up in moduleLoadList is the load itself.
	const control = path.join(td, "probe-control.mjs");
	fs.writeFileSync(control, probeBody([
		`const { loadSqlite } = await import(${JSON.stringify(new URL("../lib/db.ts", import.meta.url).href)});`,
		"await loadSqlite();",
	]) + "process.stdout.write(hits.length ? hits.join('|') : 'NONE');\n");
	const controlOut = execFileSync(process.execPath, [control], { encoding: "utf8", env: { ...process.env, NODE_NO_WARNINGS: "1" } });
	check(`9: control — the index path DOES load node:sqlite (${controlOut})`, controlOut !== "NONE");
}

// (10) the only guard in the wrapper is the API shape: a non-string prompt never
// reaches the child. Everything else is the producer's call.
for (const [label, prompt] of [["undefined", undefined], ["a number", 12345], ["an object", { a: 1 }]]) {
	let threw = false;
	let r = "unset";
	try { r = await handlers.before_agent_start({ prompt }, ctxFor("pi-s3")); } catch { threw = true; }
	check(`10: ${label} prompt does not throw`, !threw);
	check(`10: ${label} prompt injects nothing`, r === undefined);
}

// (11) ...and an EMPTY string is a string: it goes to the producer, which skips it.
// Duplicating even that one skip rule in the wrapper is how the two sides drift.
{
	const echoLen = path.join(td, "echo-len.mjs"); // written in (8)
	check("11: an empty prompt is PASSED to the child", (await makePull({ bin: echoLen })({ prompt: "", sessionId: "pi-empty", cwd: td })) === "0");
	let threw = false;
	let r = "unset";
	try { r = await handlers.before_agent_start({ prompt: "" }, ctxFor("pi-empty")); } catch { threw = true; }
	check("11: an empty prompt does not throw", !threw);
	check("11: ...and injects nothing (the producer skips it)", r === undefined);
}

fs.rmSync(td, { recursive: true, force: true });
process.exit(fails);
