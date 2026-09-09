import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Evidence property: a post-edit check leaves a CONTENT-BOUND receipt for both
// pass and fail, with a DISTINCT status (a checker that could not run is never
// "passed"), and staleness is detectable by re-reading the workspace. The key
// case is (b): re-editing an already-dirty file changes contents but not the
// filename — a sha+filename binding would still read "current"; only a content
// digest goes stale. Drives the REAL registered handler (not a reimplementation).
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-post-edit.ts", import.meta.url).href)).default;
const { loadConfig } = await import(new URL("../lib/config.ts", import.meta.url).href);
const { receiptState, readLatestReceipt } = await import(new URL("../lib/receipts.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const ALLOWED_NOT_PASSED = new Set(["error", "timeout", "not_run"]);

// Fresh workspace + registered handler + config. Returns { td, ctx, cfg, fire }.
// opts.ctx merges into the ctx (e.g. { signal: undefined }); opts.receipts overrides the receipts config.
function setup(commands, opts = {}) {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "receipt-"));
	fs.mkdirSync(path.join(td, ".pi"));
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({
		journal: { enabled: false },
		receipts: opts.receipts ?? { enabled: true, dir: path.join(td, "receipts") },
		postEdit: { commands },
	}));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal, ...(opts.ctx ?? {}) };
	const cfg = loadConfig(ctx);
	const fire = (file) => handlers.tool_result(
		{ toolName: "edit", isError: false, input: { path: file }, content: [{ type: "text", text: "edited" }] },
		ctx,
	);
	return { td, ctx, cfg, fire };
}

// (a) contents pass → receipt checks_passed + digest D1; helper reports current.
// (b) SAME file re-edited with new contents → the prior receipt goes stale.
{
	const cmd = 'node -e "process.exit(0)"';
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: cmd }]);
	const file = path.join(td, "foo.txt");
	fs.writeFileSync(file, "one\n");
	await fire(file);

	const r1 = readLatestReceipt(cfg, td, cmd);
	check("a: receipt written", !!r1);
	check("a: status checks_passed", r1?.status === "checks_passed");
	check("a: digest D1 is sha256 hex", /^[0-9a-f]{64}$/.test(r1?.digest ?? ""));
	check("a: input bound by relative path + contents", r1?.inputs?.length === 1 && r1.inputs[0].path === "foo.txt");
	check("a: helper reports current", receiptState(r1, td) === "current");
	const D1 = r1.digest;

	// re-edit the same (already-dirty) file, changing CONTENTS only
	fs.writeFileSync(file, "two\n");
	check("b: prior receipt now stale (content binding)", receiptState(r1, td) === "stale");
	await fire(file); // a fresh check binds the new contents
	const r2 = readLatestReceipt(cfg, td, cmd);
	check("b: new receipt has a different digest D2", r2?.digest && r2.digest !== D1);
	check("b: new receipt is current", receiptState(r2, td) === "current");

	fs.rmSync(td, { recursive: true, force: true });
}

// (c) non-zero exit → checks_failed (never passed); failure feedback still fed back.
{
	const cmd = 'node -e "process.exit(1)"';
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: cmd }]);
	const file = path.join(td, "bar.txt");
	fs.writeFileSync(file, "x\n");
	const ret = await fire(file);

	const r = readLatestReceipt(cfg, td, cmd);
	check("c: status checks_failed", r?.status === "checks_failed");
	check("c: never checks_passed", r?.status !== "checks_passed");
	check("c: failure feedback still returned (control flow unchanged)",
		typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));

	fs.rmSync(td, { recursive: true, force: true });
}

// (d) missing executable + timeout → status in {error,timeout,not_run}, never passed.
{
	const missing = "nana-nonexistent-cmd-zzz-9000";
	const slow = 'node -e "setTimeout(()=>{},10000)"';
	const { td, cfg, fire } = setup([
		{ match: "\\.txt$", run: missing },
		{ match: "\\.txt$", run: slow, timeoutMs: 300 },
	]);
	const file = path.join(td, "baz.txt");
	fs.writeFileSync(file, "y\n");
	await fire(file);

	const rMissing = readLatestReceipt(cfg, td, missing);
	check("d: missing exe not passed", rMissing?.status !== "checks_passed");
	check("d: missing exe status in {error,timeout,not_run}", ALLOWED_NOT_PASSED.has(rMissing?.status));
	check("d: missing exe classified error", rMissing?.status === "error");

	const rSlow = readLatestReceipt(cfg, td, slow);
	check("d: timeout not passed", rSlow?.status !== "checks_passed");
	check("d: timeout status in {error,timeout,not_run}", ALLOWED_NOT_PASSED.has(rSlow?.status));
	check("d: timeout classified timeout", rSlow?.status === "timeout");

	fs.rmSync(td, { recursive: true, force: true });
}

// (e) F2: a checker that traps the timeout's kill signal and exits 0 AFTER the deadline
// is recorded `timeout`, NEVER checks_passed — a killed checker that could not run is not a pass.
{
	const trap = `node -e "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000)"`;
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: trap, timeoutMs: 300 }]);
	const file = path.join(td, "trap.txt");
	fs.writeFileSync(file, "z\n");
	const ret = await fire(file);

	const r = readLatestReceipt(cfg, td, trap);
	check("e: SIGTERM-trap exit-0 never checks_passed", r?.status !== "checks_passed");
	check("e: SIGTERM-trap exit-0 classified timeout", r?.status === "timeout");
	// R4: a non-completing check (timeout) must be fed back to the MODEL, not only
	// recorded in the receipt — this case exits 0, so a `code !== 0` test would miss it.
	check("e: timeout is fed back to the model (not only the receipt)",
		typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));
	// R5: the exit-0 pin assumes POSIX signal semantics (win32 has no SIGTERM), so
	// guard it by platform; the status===timeout assertion above stays cross-platform.
	if (process.platform !== "win32") {
		check("e: trap exited 0 — the null-error path (not err.killed) is what is pinned", r?.exitCode === 0);
	}

	fs.rmSync(td, { recursive: true, force: true });
}

// (f) F5c: ctx.signal may be undefined (pi: "undefined when the agent is not streaming").
// The handler must not throw and must still write a receipt.
{
	const cmd = 'node -e "process.exit(0)"';
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: cmd }], { ctx: { signal: undefined } });
	const file = path.join(td, "nosig.txt");
	fs.writeFileSync(file, "q\n");

	let threw = false;
	try { await fire(file); } catch { threw = true; }
	check("f: undefined signal does not throw", !threw);
	const r = readLatestReceipt(cfg, td, cmd);
	check("f: receipt still written with undefined signal", !!r && r.status === "checks_passed");

	fs.rmSync(td, { recursive: true, force: true });
}

// (g) F5b: a malformed receipts.dir (non-string) must NOT throw into the agent, and a
// failing check must still feed back its failure text. HOME→td keeps any default-dir write contained.
{
	const cmd = 'node -e "process.exit(1)"';
	const origHome = process.env.HOME;
	const origUserProfile = process.env.USERPROFILE;
	const { td, fire } = setup([{ match: "\\.txt$", run: cmd }], { receipts: { enabled: true, dir: 42 } });
	try {
		process.env.HOME = td; process.env.USERPROFILE = td; // default receiptsDir resolves under td (HOME on posix, USERPROFILE on win32)
		const file = path.join(td, "bad.txt");
		fs.writeFileSync(file, "w\n");
		let ret, threw = false;
		try { ret = await fire(file); } catch { threw = true; }
		check("g: non-string receipts.dir does not throw", !threw);
		check("g: failing-check feedback still returned",
			typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));
	} finally {
		if (origHome === undefined) delete process.env.HOME;
		else process.env.HOME = origHome;
		if (origUserProfile === undefined) delete process.env.USERPROFILE;
		else process.env.USERPROFILE = origUserProfile;
		fs.rmSync(td, { recursive: true, force: true });
	}
}

// (h) F2 residual: timeoutMs:0 means "no deadline" (Node disables its timeout) — a passing
// check must stay checks_passed, never timeout. Fails without the `timeoutMs > 0` guard.
{
	const cmd = 'node -e "process.exit(0)"';
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: cmd, timeoutMs: 0 }]);
	const file = path.join(td, "zero.txt");
	fs.writeFileSync(file, "k\n");
	await fire(file);
	const r = readLatestReceipt(cfg, td, cmd);
	check("h: timeoutMs:0 passing check is checks_passed (not timeout)", r?.status === "checks_passed");
	fs.rmSync(td, { recursive: true, force: true });
}

// (i) R6: a malformed postEdit command (missing `run`, or a negative/NaN/fractional
// timeoutMs that would make exec() throw — it requires a non-negative integer) must NOT throw out of the handler and must NOT skip
// the remaining valid checks — the bad entries are skipped, the good one still runs.
{
	const good = 'node -e "process.exit(1)"'; // a real, failing check that must still run
	const { td, fire } = setup([
		{ match: "\\.txt$" }, // missing run → malformed, skip
		{ match: "\\.txt$", run: good, timeoutMs: -5 }, // negative timeoutMs → would throw in exec(), skip
		{ match: "\\.txt$", run: good, timeoutMs: 0.5 }, // fractional timeoutMs → exec() ERR_OUT_OF_RANGE, skip
		{ match: "\\.txt$", run: good }, // valid → must still run
	]);
	const file = path.join(td, "mal.txt");
	fs.writeFileSync(file, "m\n");
	let ret, threw = false;
	try { ret = await fire(file); } catch { threw = true; }
	check("i: malformed command (missing run / negative timeoutMs) does not throw", !threw);
	check("i: the valid check still ran (malformed entries skipped, not the rest)",
		typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));
	// exactly ONE failure — the two malformed entries produced no feedback (had one run, it would read "2 check(s) failed")
	check("i: only the valid check reported (1 failure)", /] 1 check\(s\) failed/.test(ret?.content?.at(-1)?.text ?? ""));
	fs.rmSync(td, { recursive: true, force: true });
}

process.exit(fails);
