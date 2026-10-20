/**
 * @module packages/nana-pack/tests/notify-dispatch.test.mjs
 * @purpose Pins that the OS notifier is genuinely dispatched per platform with the right body
 *  only when a UI is attached or headless is opted in, and that no terminal escape code is ever
 *  written without an attached UI, even when the notifier fails
 * @inputs extensions/nana-notify.ts with node:child_process execFile replaced by a recording
 *  stand-in, and a nana-pack.json under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME and config file), process (monkeypatches node:child_process execFile
 *  via require('node:child_process') + syncBuiltinESMExports — restored before exit; sets HOME
 *  and USERPROFILE; fakes process.platform within try/finally)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected
 *  throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import { createRequire, syncBuiltinESMExports } from "node:module";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// L1 fixture: a nana-only `.pi/` is never nana-trusted (pi auto-trusts it; that is not a
// decision), so this file's config lives at USER scope under an isolated HOME
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
delete process.env.PI_CODING_AGENT_DIR;
const NANA_HOME = tmpDir(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });

// No real osascript or powershell.exe may ever start: swap node:child_process's execFile for a
// recording stand-in on the CJS exports object, then re-sync the ESM binding every consumer
// (including nana-notify.ts, imported below) reads through — the same seam shared-link-state,
// fsops and doctor-fix-line's tests use for a builtin that cannot be live-patched any other way.
const require = createRequire(import.meta.url);
const cp = require("node:child_process");
const realExecFile = cp.execFile;
let execCalls = [];
let nextResult = { err: null, stdout: "", stderr: "" };
const setExecResult = (r) => { nextResult = r; };
cp.execFile = function execFileStub(file, args, _options, callback) {
	execCalls.push({ file, args });
	const { err, stdout, stderr } = nextResult;
	// Two chained turns, not one: a real child's callback never lands in the same tick its
	// spawn was requested in, and the extension's own async handler does not await it either.
	setImmediate(() => setImmediate(() => callback(err, stdout ?? "", stderr ?? "")));
};
syncBuiltinESMExports();

// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-notify.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };

const handlers = {};
ext({ on: (name, fn) => { handlers[name] = fn; } });

function withPlatform(platform, fn) {
	const original = Object.getOwnPropertyDescriptor(process, "platform");
	Object.defineProperty(process, "platform", { value: platform, configurable: true, enumerable: true, writable: false });
	try {
		return fn();
	} finally {
		Object.defineProperty(process, "platform", original);
	}
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

/** Swaps stdout only around the handler call and two setImmediate turns, restoring it before
 *  any check() runs — never prints a check line into its own capture. */
async function fireCapturingStdout(ctx) {
	const original = process.stdout.write;
	let out = "";
	process.stdout.write = function (chunk) { out += String(chunk); return true; };
	try {
		await handlers.agent_settled({}, ctx);
		await tick();
		await tick();
	} finally {
		process.stdout.write = original;
	}
	return out;
}

function writeUserConfig(journalPath, notify) {
	fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: true, path: journalPath }, notify }));
}

/** One case: a fresh session cwd + journal, a chosen notify config, platform and ctx, the
 *  clean-run or failing stand-in result, fired once with stdout captured. */
async function runCase({ ctxBase, platform, notify, execResult }) {
	const td = tmpDir(path.join(os.tmpdir(), "notify-dispatch-"));
	const journalPath = path.join(td, "journal.jsonl");
	writeUserConfig(journalPath, notify);
	execCalls = [];
	setExecResult(execResult ?? { err: null, stdout: "", stderr: "" });
	const notifies = [];
	// pi 1.0.2 binds a no-op UI object even with no UI (print/json), never undefined — the
	// recording ui is kept on every ctx so a wrong guard that reads it anyway is caught.
	const ctx = { cwd: td, isProjectTrusted: () => true, ui: { notify: (m, t) => notifies.push({ m, t }) }, ...ctxBase };
	const out = await withPlatform(platform, () => fireCapturingStdout(ctx));
	const journal = fs.existsSync(journalPath) ? fs.readFileSync(journalPath, "utf-8") : "";
	fs.rmSync(td, { recursive: true, force: true });
	return { calls: execCalls, out, journal, notifies };
}

const TUI = { mode: "tui", hasUI: true };
const RPC = { mode: "rpc", hasUI: true };
const PRINT = { mode: "print", hasUI: false };
const JSON_MODE = { mode: "json", hasUI: false };
const UI_CTXS = [TUI, RPC];
const NO_UI_CTXS = [PRINT, JSON_MODE];

// ── R-166 macOS: with a UI, darwin starts osascript once with the Ready for input body ──
{
	const failures = [];
	for (const ctxBase of UI_CTXS) {
		const r = await runCase({ ctxBase, platform: "darwin", notify: { enabled: true, headless: false } });
		const call = r.calls[0];
		const ok =
			r.calls.length === 1 &&
			call?.file === "osascript" &&
			call.args.join(" ").includes('display notification "Ready for input" with title "pi"') &&
			r.out === "" &&
			r.notifies.length === 0;
		if (!ok) failures.push({ ctx: ctxBase.mode, calls: r.calls, out: r.out, notifies: r.notifies });
	}
	// req: R-166
	check("settle: with a UI, macOS starts osascript once with the Ready for input notification", failures.length === 0, JSON.stringify(failures));
}

// ── R-166 Windows: with a UI, win32 starts powershell.exe once with a Ready for input toast ──
{
	const failures = [];
	for (const ctxBase of UI_CTXS) {
		const r = await runCase({ ctxBase, platform: "win32", notify: { enabled: true, headless: false } });
		const call = r.calls[0];
		const lastArg = call?.args?.at(-1) ?? "";
		const ok =
			r.calls.length === 1 &&
			call?.file === "powershell.exe" &&
			lastArg.includes("ToastNotificationManager") &&
			lastArg.includes("Ready for input") &&
			r.out === "" &&
			r.notifies.length === 0;
		if (!ok) failures.push({ ctx: ctxBase.mode, calls: r.calls, out: r.out, notifies: r.notifies });
	}
	// req: R-166
	check("settle: with a UI, Windows starts powershell.exe once with a Ready for input toast", failures.length === 0, JSON.stringify(failures));
}

// ── R-166 Linux: the TUI gets one OSC 777 Ready for input sequence and no process starts ──
{
	const r = await runCase({ ctxBase: TUI, platform: "linux", notify: { enabled: true, headless: false } });
	const ok = r.calls.length === 0 && r.out === "\u001b]777;notify;pi;Ready for input\u0007" && r.notifies.length === 0;
	// req: R-166
	check("settle: on Linux, the TUI gets one OSC 777 Ready for input sequence and no process starts", ok, JSON.stringify({ calls: r.calls, out: r.out, notifies: r.notifies }));
}

// ── R-173: headless is opt-in — a run without a UI starts the notifier only when notify.headless is true ──
{
	const platforms = ["darwin", "win32", "linux"];
	const negativeConfigs = [{ enabled: true }, { enabled: true, headless: false }];
	const failures = [];
	for (const notify of negativeConfigs) {
		for (const ctxBase of NO_UI_CTXS) {
			for (const platform of platforms) {
				const r = await runCase({ ctxBase, platform, notify });
				const ok = r.calls.length === 0 && r.out === "" && !r.journal.includes("notify_fallback");
				if (!ok) failures.push({ kind: "negative", notify, ctx: ctxBase.mode, platform, calls: r.calls, out: r.out });
			}
		}
	}
	const positivePlatforms = ["darwin", "win32"];
	for (const ctxBase of NO_UI_CTXS) {
		for (const platform of positivePlatforms) {
			const r = await runCase({ ctxBase, platform, notify: { enabled: true, headless: true } });
			const ok = r.calls.length === 1;
			if (!ok) failures.push({ kind: "positive", ctx: ctxBase.mode, platform, calls: r.calls });
		}
	}
	// req: R-173
	check("headless: a run without a UI starts the notifier only when notify.headless is true", failures.length === 0, JSON.stringify(failures));
}

// ── R-818: no terminal escape codes without an attached UI, even when the notifier fails ──
{
	const platforms = ["darwin", "win32", "linux"];
	const failures = [];
	for (const ctxBase of NO_UI_CTXS) {
		for (const platform of platforms) {
			const r = await runCase({
				ctxBase,
				platform,
				notify: { enabled: true, headless: true },
				execResult: { err: Object.assign(new Error("boom"), { code: 1 }), stdout: "", stderr: "" },
			});
			const ok = !r.out.includes("\u001b") && !r.out.includes("\u0007");
			if (!ok) failures.push({ ctx: ctxBase.mode, platform, out: r.out });
		}
	}
	// req: R-818
	check("headless: a run without a UI writes no escape code, even when the notifier fails", failures.length === 0, JSON.stringify(failures));
}

cp.execFile = realExecFile;
syncBuiltinESMExports();

console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
