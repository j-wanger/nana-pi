import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
// Concurrency property: a post-edit checker holds pi's per-file mutation queue
// while it runs, and REFUSES to run when it cannot hold it.
//
// pi's edit/write tools take that queue for the file they mutate but RELEASE it
// before the tool_result handler runs, and in pi's default parallel tool mode
// sibling calls from one assistant message execute concurrently — so a
// formatter's read-modify-write could overwrite a newer sibling edit. (Verified
// in the installed pi 0.84.4: agent-loop.js executeToolCallsParallel awaits
// afterToolCall inside each per-call thunk, and file-mutation-queue.js releases
// at the end of the tool's own fn.)
//
// The REAL repo extension is loaded through pi's REAL loader — its bundled jiti
// with the same `alias` config loader.js uses for an unbundled Node install — so
// the queue under test is the one pi's edit tool uses, reached the way it is
// reached in production. Nothing here is a copy or a stand-in.
// Run: node --experimental-strip-types <this file>

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findPiRoot() {
	try {
		const root = execSync("npm root -g", { encoding: "utf-8" }).trim();
		const p = path.join(root, "@earendil-works", "pi-coding-agent");
		return fs.existsSync(path.join(p, "dist", "index.js")) ? p : null;
	} catch {
		return null;
	}
}

const piRoot = findPiRoot();
const jitiEntry = piRoot && path.join(piRoot, "node_modules", "jiti", "lib", "jiti.mjs");
if (!piRoot || !fs.existsSync(jitiEntry)) {
	console.log("SKIP file-queue: @earendil-works/pi-coding-agent (with its bundled jiti) is not installed globally");
	process.exit(0);
}

const packageIndex = path.join(piRoot, "dist", "index.js");
const { createJiti } = await import(pathToFileURL(jitiEntry).href);
// Same options loader.js uses for an unbundled Node install (dist/core/extensions/loader.js:420-427)
const jiti = createJiti(import.meta.url, {
	moduleCache: false,
	alias: { "@earendil-works/pi-coding-agent": packageIndex },
});
const ext = await jiti.import(new URL("../extensions/nana-post-edit.ts", import.meta.url).pathname, { default: true });
// the same resolved file URL the alias points at, so this is pi's own instance
const { withFileMutationQueue } = await import(pathToFileURL(packageIndex).href);
check("pi's file-mutation queue is importable", typeof withFileMutationQueue === "function");

const td = fs.mkdtempSync(path.join(os.tmpdir(), "postedit-queue-"));
const ws = path.join(td, "ws");
fs.mkdirSync(path.join(ws, ".pi"), { recursive: true });
const orderLog = path.join(ws, "order.log");
// the checker only records WHEN it ran, so ordering against the release is provable
const cmd = `node -e "require('fs').appendFileSync('${orderLog}','checker'+String.fromCharCode(10))"`;
fs.writeFileSync(path.join(ws, ".pi", "nana-pack.json"), JSON.stringify({
	journal: { enabled: false },
	receipts: { enabled: true, dir: path.join(td, "receipts") },
	postEdit: { commands: [{ match: "\\.txt$", run: cmd, timeoutMs: 10_000 }] },
}));

const handlers = {};
ext({ on: (name, fn) => { handlers[name] = fn; } });
const ctx = { cwd: ws, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal };
const fire = (file) => handlers.tool_result(
	{ toolName: "edit", isError: false, input: { path: file }, content: [{ type: "text", text: "edited" }] },
	ctx,
);
const readOrder = () => (fs.existsSync(orderLog) ? fs.readFileSync(orderLog, "utf-8") : "");

// (a) a concurrent holder of the file's queue gates the checker, and the checker
// runs only AFTER the release — asserted by ordering, not by a sleep.
{
	const target = path.join(ws, "queued.txt");
	fs.writeFileSync(target, "one\n");

	// handshake: wait until the holder is actually inside the queue
	let entered;
	const holderEntered = new Promise((r) => { entered = r; });
	let release;
	const held = new Promise((r) => { release = r; });
	const holder = withFileMutationQueue(target, () => { entered(); return held; });
	await holderEntered;

	const fired = fire(target);
	// bounded wait: if the checker is NOT gated it runs immediately, and this catches it
	const deadline = Date.now() + 1500;
	while (Date.now() < deadline && !readOrder().includes("checker")) await sleep(25);
	check("checker is gated while pi holds the file's mutation queue", !readOrder().includes("checker"));

	fs.appendFileSync(orderLog, "released\n");
	release();
	await holder;
	await fired;
	check("checker ran strictly after the queue was released", readOrder() === "released\nchecker\n");
}

// (b) queue acquisition FAILS (pi realpath()s the target before admitting anyone;
// an unreadable parent makes that throw). A mutating formatter must not fall back
// to running unlocked: the check does not run, the receipt says not_run, and the
// model is told. Needs POSIX permissions and a non-root uid.
if (process.platform !== "win32" && process.getuid?.() !== 0) {
	const { loadConfig } = await import(new URL("../lib/config.ts", import.meta.url).href);
	const { readLatestReceipt } = await import(new URL("../lib/receipts.ts", import.meta.url).href);
	const vault = path.join(ws, "vault");
	fs.mkdirSync(vault);
	const target = path.join(vault, "locked.txt");
	fs.writeFileSync(target, "one\n");
	const before = readOrder();
	fs.chmodSync(vault, 0o000);
	let ret;
	try {
		ret = await fire(target);
	} finally {
		fs.chmodSync(vault, 0o755);
	}
	const text = ret?.content?.at(-1)?.text ?? "";
	check("b: unlockable file does not silently run the checker", readOrder() === before);
	check("b: refusal is fed back to the model", text.includes("did not run") && text.includes("could not lock"));
	const r = readLatestReceipt(loadConfig(ctx), ws, cmd);
	check("b: receipt records not_run (never passed)", r?.status === "not_run");
	check("b: receipt claims no content binding", Array.isArray(r?.inputs) && r.inputs.length === 0 && r.digest === "");
}

fs.rmSync(td, { recursive: true, force: true });
process.exit(fails);
