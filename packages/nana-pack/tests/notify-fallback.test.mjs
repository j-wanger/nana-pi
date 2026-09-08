import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Silence property: when the OS notifier fails, the pack must SAY SO instead of
// dropping the notification. The Windows toast path was the live case — a
// PowerShell/WinRT failure was swallowed by an empty execFile callback, and the
// OSC-777 terminal fallback is unreachable once platform === "win32", so a
// Windows session got nothing and left no trace of why. A HUNG notifier was the
// same silence with a held pipe on top.
//
// Failures are provoked for real, not stubbed. process.platform is faked to the
// platform whose notifier this host cannot run (win32 host → osascript;
// anything else → powershell.exe) and PATH is isolated to an EMPTY temp dir, so
// "not found" is guaranteed rather than assumed — powershell.exe can exist on a
// non-Windows box. On POSIX hosts PATH is instead pointed at a fixture notifier
// (a shell script under the faked binary's name) so the non-zero-exit, stderr
// error-record and hang paths run end to end through the REAL registered
// agent_settled handler. No production seam anywhere.
// Run: node --experimental-strip-types <this file>
const mod = await import(new URL("../extensions/nana-notify.ts", import.meta.url).href);
const ext = mod.default;
const { notifierFailure } = mod;

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The notifier this host cannot possibly run, and the name the extension invokes it by.
const MISSING_NOTIFIER_PLATFORM = process.platform === "win32" ? "darwin" : "win32";
const NOTIFIER_BIN = MISSING_NOTIFIER_PLATFORM === "win32" ? "powershell.exe" : "osascript";
// The extension's own deadline (nana-notify NOTIFIER_TIMEOUT_MS); the hang case
// waits past it. Kept as a local constant so this file needs no production seam.
const NOTIFIER_TIMEOUT_MS = 8000;

// Fresh workspace + registered handler + a ctx whose ui records instead of rendering.
function setup(opts = {}) {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "notify-fallback-"));
	fs.mkdirSync(path.join(td, ".pi"));
	const journalPath = path.join(td, "journal.jsonl");
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({
		journal: { enabled: true, path: journalPath },
		// pinned explicitly so a user-level ~/.pi/agent/nana-pack.json cannot mute this
		notify: { enabled: true, headless: true },
	}));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const notifies = [];
	const ctx = {
		cwd: td,
		hasUI: true,
		isProjectTrusted: () => true,
		ui: { notify: (message, type) => notifies.push({ message, type }) },
		...(opts.ctx ?? {}),
	};
	const journal = () => (fs.existsSync(journalPath) ? fs.readFileSync(journalPath, "utf-8") : "");
	return { td, notifies, journal, fire: () => handlers.agent_settled({}, ctx) };
}

// The notifier callback is async — poll for it rather than sleeping blind.
async function waitFor(predicate, ms = 5000) {
	const deadline = Date.now() + ms;
	while (Date.now() < deadline) {
		if (predicate()) return true;
		await sleep(25);
	}
	return predicate();
}

async function withFakePlatform(platform, fn) {
	const original = Object.getOwnPropertyDescriptor(process, "platform");
	Object.defineProperty(process, "platform", { value: platform, configurable: true, enumerable: true, writable: false });
	try {
		return await fn();
	} finally {
		Object.defineProperty(process, "platform", original);
	}
}

// PATH is the only thing that decides which binary the extension reaches, so it
// is the whole injection surface: an empty dir guarantees "not found", a dir
// holding a fixture guarantees THAT script runs.
async function withPath(dir, fn) {
	const original = process.env.PATH;
	process.env.PATH = dir;
	try {
		return await fn();
	} finally {
		if (original === undefined) delete process.env.PATH;
		else process.env.PATH = original;
	}
}

/** A stand-in for the OS notifier, under the exact name the extension invokes. POSIX only. */
function fixtureNotifier(body) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "notify-bin-"));
	const bin = path.join(dir, NOTIFIER_BIN);
	fs.writeFileSync(bin, `#!/bin/sh\n${body}\n`);
	fs.chmodSync(bin, 0o755);
	return dir;
}

const POSIX = process.platform !== "win32";
// A fixture runs with PATH isolated to its own dir, so anything it calls must be
// absolute — `sleep` is not a shell builtin.
const SLEEP_BIN = ["/bin/sleep", "/usr/bin/sleep"].find((p) => fs.existsSync(p));

// (a) the classifier: every shape execFile can report a failure in, and the
// benign output that must NOT be read as one.
{
	check("a: spawn failure (no notifier binary) is a failure",
		(notifierFailure(Object.assign(new Error("spawn powershell.exe ENOENT"), { code: "ENOENT" }), "") ?? "").includes("ENOENT"));
	check("a: non-zero exit is a failure (execFile reports it through err.code)",
		notifierFailure(Object.assign(new Error("Command failed"), { code: 1 }), "") !== null);
	check("a: the deadline is a failure, and names the kill signal",
		(notifierFailure({ killed: true, signal: "SIGTERM", code: null, message: "Command failed" }, "") ?? "").includes("SIGTERM"));
	check("a: exit 0 with a PowerShell error record on stderr is a failure",
		notifierFailure(null, "At line:1 char:1\n    + CategoryInfo          : ObjectNotFound: (x:String) []\n    + FullyQualifiedErrorId : CommandNotFoundException") !== null);
	check("a: exit 0 with a failed WinRT member call is a failure",
		notifierFailure(null, 'Exception calling "Show" with "1" argument(s): "Element not found."') !== null);
	check("a: a clean run is not a failure", notifierFailure(null, "") === null);
	check("a: benign stderr chatter is not a failure", notifierFailure(null, "warning: shell profile skipped") === null);
	// the word "exception" alone is not a failure — it is an ordinary path component
	check("a: a benign path containing 'Exception' is not a failure",
		notifierFailure(null, "wrote report to C:\\Exception Reports\\2026-09-08.txt") === null);
	check("a: 'exception' in prose without a record shape is not a failure",
		notifierFailure(null, "no exception was raised") === null);
	check("a: the reason is bounded (it lands in a journal line)",
		(notifierFailure(Object.assign(new Error("x".repeat(5000)), { code: 1 }), "") ?? "").length <= 300);
}

// (b) end to end: the notifier binary cannot be found, so the in-app
// notification fires and the reason is journalled. This is the case Jake hit on
// Windows — silence before. PATH is an EMPTY dir, so ENOENT is guaranteed on
// any host rather than assumed from the platform name.
{
	const { td, notifies, journal, fire } = setup();
	const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "notify-nopath-"));
	await withFakePlatform(MISSING_NOTIFIER_PLATFORM, () => withPath(emptyDir, async () => {
		await fire();
		await waitFor(() => notifies.length > 0);
	}));
	check("b: a failed OS notifier falls back to the in-app notification",
		notifies.length === 1 && notifies[0].message === "Ready for input" && notifies[0].type === "info");
	const lines = journal().trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
	const entry = lines.find((l) => l.event === "notify_fallback");
	check("b: the fallback is journalled as notify_fallback", !!entry);
	check("b: the journal line carries the platform that failed", entry?.platform === MISSING_NOTIFIER_PLATFORM);
	check("b: the journal line carries a reason", typeof entry?.reason === "string" && entry.reason.length > 0);
	check("b: the reason names the missing notifier", /ENOENT/.test(entry?.reason ?? ""));
	fs.rmSync(emptyDir, { recursive: true, force: true });
	fs.rmSync(td, { recursive: true, force: true });
}

// (c) headless with notify.headless: there is no ctx.ui to fall back to. The
// failure must still be journalled, and the missing ui must not throw out of the
// (already resolved) handler into an unhandled rejection.
{
	const { td, journal, fire } = setup({ ctx: { hasUI: false, ui: undefined } });
	const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "notify-nopath-"));
	let unhandled = null;
	const onUnhandled = (err) => { unhandled = err; };
	process.on("unhandledRejection", onUnhandled);
	process.on("uncaughtException", onUnhandled);
	await withFakePlatform(MISSING_NOTIFIER_PLATFORM, () => withPath(emptyDir, async () => {
		await fire();
		await waitFor(() => journal().includes("notify_fallback"));
	}));
	await sleep(50);
	process.off("unhandledRejection", onUnhandled);
	process.off("uncaughtException", onUnhandled);
	check("c: headless failure is still journalled", journal().includes("notify_fallback"));
	check("c: a missing ctx.ui raises nothing into the agent process", unhandled === null);
	fs.rmSync(emptyDir, { recursive: true, force: true });
	fs.rmSync(td, { recursive: true, force: true });
}

// (d) notify disabled: no notifier is attempted, so there is nothing to fall back
// from — the fallback must not invent a notification of its own.
{
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "notify-off-"));
	fs.mkdirSync(path.join(td, ".pi"));
	const journalPath = path.join(td, "journal.jsonl");
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({
		journal: { enabled: true, path: journalPath },
		notify: { enabled: false, headless: true },
	}));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const notifies = [];
	const ctx = { cwd: td, hasUI: true, isProjectTrusted: () => true, ui: { notify: (m, t) => notifies.push({ m, t }) } };
	const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "notify-nopath-"));
	await withFakePlatform(MISSING_NOTIFIER_PLATFORM, () => withPath(emptyDir, async () => {
		await handlers.agent_settled({}, ctx);
		await sleep(300);
	}));
	check("d: notify.enabled false raises no notification", notifies.length === 0);
	check("d: notify.enabled false writes no fallback line",
		!(fs.existsSync(journalPath) ? fs.readFileSync(journalPath, "utf-8") : "").includes("notify_fallback"));
	fs.rmSync(emptyDir, { recursive: true, force: true });
	fs.rmSync(td, { recursive: true, force: true });
}

// The remaining cases replace the notifier with a fixture script under its own
// name. A shell script is only executable on POSIX (win32 CreateProcess needs a
// real .exe/.bat), so a Windows host reports the skip rather than hiding it.
if (!POSIX) {
	console.log("SKIP e/f/g: fixture notifiers are shell scripts — POSIX hosts only");
} else {
	// (e) the notifier RAN and exited non-zero — a real failure the empty callback
	// used to discard.
	{
		const { td, notifies, journal, fire } = setup();
		const binDir = fixtureNotifier('echo "toast subsystem unavailable" 1>&2\nexit 3');
		await withFakePlatform(MISSING_NOTIFIER_PLATFORM, () => withPath(binDir, async () => {
			await fire();
			await waitFor(() => notifies.length > 0);
		}));
		check("e: a non-zero notifier exit falls back", notifies.length === 1 && notifies[0].message === "Ready for input");
		check("e: the non-zero exit is journalled", journal().includes("notify_fallback"));
		fs.rmSync(binDir, { recursive: true, force: true });
		fs.rmSync(td, { recursive: true, force: true });
	}

	// (f) the notifier exited 0 while printing a PowerShell error record — the
	// silent-failure shape that a `code !== 0` test alone would miss. And the
	// benign twin: exit 0 with ordinary output must NOT fall back.
	{
		const { td, notifies, journal, fire } = setup();
		const binDir = fixtureNotifier('echo \'Exception calling "Show" with "1" argument(s): "Element not found."\' 1>&2\nexit 0');
		await withFakePlatform(MISSING_NOTIFIER_PLATFORM, () => withPath(binDir, async () => {
			await fire();
			await waitFor(() => notifies.length > 0);
		}));
		check("f: exit 0 with an error record still falls back", notifies.length === 1);
		check("f: the exit-0 failure is journalled", journal().includes("notify_fallback"));
		fs.rmSync(binDir, { recursive: true, force: true });
		fs.rmSync(td, { recursive: true, force: true });

		const ok = setup();
		const okDir = fixtureNotifier('echo "notification posted to C:\\\\Exception Reports\\\\log.txt"\nexit 0');
		await withFakePlatform(MISSING_NOTIFIER_PLATFORM, () => withPath(okDir, async () => {
			await ok.fire();
			await sleep(400);
		}));
		check("f: a working notifier raises no fallback notification", ok.notifies.length === 0);
		check("f: a working notifier writes no fallback line", !ok.journal().includes("notify_fallback"));
		fs.rmSync(okDir, { recursive: true, force: true });
		fs.rmSync(ok.td, { recursive: true, force: true });
	}

	// (g) the notifier HANGS. Without a deadline the callback never fires: no
	// fallback, no journal line, and the child holds the pipe open. Slow by
	// construction — it must outlast the extension's own 8 s deadline.
	if (!SLEEP_BIN) {
		console.log("SKIP g: no /bin/sleep or /usr/bin/sleep to build a hanging notifier from");
	} else {
		console.log(`(g runs the real ${NOTIFIER_TIMEOUT_MS}ms notifier deadline — expect a pause)`);
		const { td, notifies, journal, fire } = setup();
		const binDir = fixtureNotifier(`exec ${SLEEP_BIN} 60`);
		const startedAt = Date.now();
		await withFakePlatform(MISSING_NOTIFIER_PLATFORM, () => withPath(binDir, async () => {
			await fire();
			await waitFor(() => notifies.length > 0, NOTIFIER_TIMEOUT_MS + 7000);
		}));
		const elapsed = Date.now() - startedAt;
		check("g: a hung notifier still falls back", notifies.length === 1 && notifies[0].message === "Ready for input");
		check("g: the hang is journalled with the kill signal",
			/notify_fallback/.test(journal()) && /killed \(SIG/.test(journal()));
		check("g: the fallback is bounded by the deadline, not by the hung child",
			elapsed >= NOTIFIER_TIMEOUT_MS && elapsed < NOTIFIER_TIMEOUT_MS + 6000);
		fs.rmSync(binDir, { recursive: true, force: true });
		fs.rmSync(td, { recursive: true, force: true });
	}
}

process.exit(fails);
