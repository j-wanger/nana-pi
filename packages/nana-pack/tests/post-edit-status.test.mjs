import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
// Visibility property: post-edit reports EVERY run through ctx.ui.setStatus, not
// only the failing ones — a hook that is working must not look identical to a
// hook that is absent. The status also preserves the receipts' rule that a check
// which could not run is never folded into a pass: timeout, turn-abort and lock
// refusal each get their own text, distinct from ✓.
// Drives the REAL registered handler with a fake ctx that records UI calls.
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-post-edit.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

// Fresh workspace + registered handler + a ctx whose ui records instead of rendering.
// opts.ctx merges into the ctx (e.g. { hasUI: false }); opts.signal overrides ctx.signal.
function setup(commands, opts = {}) {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "postedit-status-"));
	fs.mkdirSync(path.join(td, ".pi"));
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({
		journal: { enabled: false },
		receipts: { enabled: false },
		postEdit: { commands },
	}));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const statuses = [];
	const notifies = [];
	const ctx = {
		cwd: td,
		hasUI: true,
		isProjectTrusted: () => true,
		signal: opts.signal ?? new AbortController().signal,
		ui: {
			setStatus: (key, text) => statuses.push({ key, text }),
			notify: (message, type) => notifies.push({ message, type }),
			// mirrors pi's theme.fg(color, text); the color is recorded so the
			// severity of the chip is asserted, not just its words
			theme: { fg: (color, text) => `[${color}]${text}` },
		},
		...(opts.ctx ?? {}),
	};
	const fire = (file) => handlers.tool_result(
		{ toolName: "edit", isError: false, input: { path: file }, content: [{ type: "text", text: "edited" }] },
		ctx,
	);
	return { td, statuses, notifies, fire };
}

const last = (a) => a.at(-1);
const PASS_CMD = 'node -e "process.exit(0)"';
const FAIL_CMD = 'node -e "process.exit(1)"';

// (a) all checks pass → a ✓ chip naming the count and the file, under the "dim" color.
{
	const { td, statuses, notifies, fire } = setup([
		{ match: "\\.txt$", run: PASS_CMD },
		{ match: "\\.txt$", run: 'node -e "console.log(\'ok\')"' },
	]);
	const file = path.join(td, "foo.txt");
	fs.writeFileSync(file, "one\n");
	await fire(file);

	check("a: a passing run sets a status (the happy path is visible at all)", statuses.length === 1);
	check("a: status key is nana-post-edit", last(statuses)?.key === "nana-post-edit");
	check("a: status text counts the checks and names the file",
		last(statuses)?.text === "[dim]post-edit ✓ 2 checks · foo.txt");
	// (the pack may emit its one-time "file-mutation queue unavailable" warning here,
	// since this harness is not running inside pi — that is not a check-failure toast)
	check("a: a passing run raises no check-failure toast",
		!notifies.some((n) => n.message.includes("checks failed")));
	fs.rmSync(td, { recursive: true, force: true });
}

// (b) one of two fails → ✗ n/m in the error color, and the EXISTING failure
// feedback (toast + tool-result text) is unchanged by the new chip.
{
	const { td, statuses, notifies, fire } = setup([
		{ match: "\\.txt$", run: PASS_CMD },
		{ match: "\\.txt$", run: FAIL_CMD },
	]);
	const file = path.join(td, "bar.txt");
	fs.writeFileSync(file, "x\n");
	const ret = await fire(file);

	check("b: failure chip is ✗ n/m in the error color",
		last(statuses)?.text === "[error]post-edit ✗ 1/2 · bar.txt");
	check("b: failure toast unchanged",
		notifies.some((n) => n.type === "warning" && n.message === `post-edit checks failed: ${path.join(td, "bar.txt")}`));
	check("b: failure tool-result text unchanged",
		typeof ret?.content?.at(-1)?.text === "string" && /] 1 check\(s\) failed/.test(ret.content.at(-1).text));
	fs.rmSync(td, { recursive: true, force: true });
}

// (c) a check that times out is reported as a timeout, NEVER as a pass — even
// though the passing sibling would otherwise make the run look ✓ 1/2.
{
	const { td, statuses, fire } = setup([
		{ match: "\\.txt$", run: PASS_CMD },
		{ match: "\\.txt$", run: 'node -e "setTimeout(()=>{},10000)"', timeoutMs: 300 },
	]);
	const file = path.join(td, "slow.txt");
	fs.writeFileSync(file, "y\n");
	await fire(file);

	check("c: timeout chip says timeout", last(statuses)?.text === "[warning]post-edit ⏱ timeout · slow.txt");
	check("c: timeout is never shown as ✓", !(last(statuses)?.text ?? "").includes("✓"));
	fs.rmSync(td, { recursive: true, force: true });
}

// (d) the turn was aborted before the check could produce a verdict (pi aborts
// ctx.signal on interrupt) → skipped, not passed.
{
	const ac = new AbortController();
	ac.abort();
	const { td, statuses, fire } = setup([{ match: "\\.txt$", run: PASS_CMD }], { signal: ac.signal });
	const file = path.join(td, "abort.txt");
	fs.writeFileSync(file, "z\n");
	await fire(file);

	check("d: aborted turn chip says skipped (aborted)",
		last(statuses)?.text === "[warning]post-edit – skipped (aborted) · abort.txt");
	check("d: aborted run is never shown as ✓", !(last(statuses)?.text ?? "").includes("✓"));
	fs.rmSync(td, { recursive: true, force: true });
}

// (e) nothing matched this file → the previous chip is left alone rather than
// replaced with a meaningless "0 checks".
{
	const { td, statuses, fire } = setup([{ match: "\\.py$", run: PASS_CMD }]);
	const file = path.join(td, "nomatch.txt");
	fs.writeFileSync(file, "q\n");
	await fire(file);
	check("e: a run where no command matched sets no status", statuses.length === 0);
	fs.rmSync(td, { recursive: true, force: true });
}

// (f) headless (print/JSON mode): no ctx.ui at all. The status must be guarded by
// ctx.hasUI, and the failure feedback to the model must still arrive.
{
	const { td, fire } = setup([{ match: "\\.txt$", run: FAIL_CMD }], { ctx: { hasUI: false, ui: undefined } });
	const file = path.join(td, "headless.txt");
	fs.writeFileSync(file, "h\n");
	let ret, threw = false;
	try { ret = await fire(file); } catch { threw = true; }
	check("f: headless run does not throw (no ctx.ui to call)", !threw);
	check("f: headless failure feedback still returned",
		typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));
	fs.rmSync(td, { recursive: true, force: true });
}

// (g) a throwing setStatus (a hostile/absent theme) must NOT escape the
// tool_result handler — observability may never eat an edit's result.
{
	const { td, fire } = setup([{ match: "\\.txt$", run: PASS_CMD }], {
		ctx: { ui: { setStatus: () => { throw new Error("boom"); }, notify: () => {}, theme: { fg: (_c, t) => t } } },
	});
	const file = path.join(td, "hostile.txt");
	fs.writeFileSync(file, "b\n");
	let threw = false;
	try { await fire(file); } catch { threw = true; }
	check("g: a throwing setStatus does not throw out of the handler", !threw);
	fs.rmSync(td, { recursive: true, force: true });
}

// (h) the lock refusal: pi's file-mutation queue exists but cannot be acquired,
// so the checker does NOT run. The chip must say so instead of reporting a pass.
// Needs pi installed globally (its bundled jiti resolves the queue the way pi's
// own loader does — same setup as post-edit-file-queue.test.mjs), POSIX mode bits
// and a non-root uid to make the acquisition fail.
{
	const piRoot = (() => {
		try {
			const root = execSync("npm root -g", { encoding: "utf-8" }).trim();
			const p = path.join(root, "@earendil-works", "pi-coding-agent");
			return fs.existsSync(path.join(p, "dist", "index.js")) ? p : null;
		} catch {
			return null;
		}
	})();
	const jitiEntry = piRoot && path.join(piRoot, "node_modules", "jiti", "lib", "jiti.mjs");
	if (!piRoot || !fs.existsSync(jitiEntry)) {
		console.log("SKIP h: @earendil-works/pi-coding-agent (with its bundled jiti) is not installed globally");
	} else if (process.platform === "win32" || process.getuid?.() === 0) {
		console.log("SKIP h: lock refusal needs POSIX mode bits and a non-root uid");
	} else {
		const { createJiti } = await import(pathToFileURL(jitiEntry).href);
		const jiti = createJiti(import.meta.url, {
			moduleCache: false,
			alias: { "@earendil-works/pi-coding-agent": path.join(piRoot, "dist", "index.js") },
		});
		const lockExt = await jiti.import(new URL("../extensions/nana-post-edit.ts", import.meta.url).pathname, { default: true });

		const td = fs.mkdtempSync(path.join(os.tmpdir(), "postedit-lock-"));
		fs.mkdirSync(path.join(td, ".pi"));
		fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({
			journal: { enabled: false },
			receipts: { enabled: false },
			postEdit: { commands: [{ match: "\\.txt$", run: PASS_CMD }] },
		}));
		const handlers = {};
		lockExt({ on: (name, fn) => { handlers[name] = fn; } });
		const statuses = [];
		const ctx = {
			cwd: td,
			hasUI: true,
			isProjectTrusted: () => true,
			signal: new AbortController().signal,
			ui: { setStatus: (key, text) => statuses.push({ key, text }), notify: () => {}, theme: { fg: (c, t) => `[${c}]${t}` } },
		};
		const vault = path.join(td, "vault");
		fs.mkdirSync(vault);
		const target = path.join(vault, "locked.txt");
		fs.writeFileSync(target, "one\n");
		fs.chmodSync(vault, 0o000);
		try {
			await handlers.tool_result(
				{ toolName: "edit", isError: false, input: { path: target }, content: [{ type: "text", text: "edited" }] },
				ctx,
			);
		} finally {
			fs.chmodSync(vault, 0o755);
		}
		check("h: unlockable file chip says skipped (lock)",
			last(statuses)?.text === "[warning]post-edit – skipped (lock) · locked.txt");
		check("h: a check that never ran is never shown as ✓", !(last(statuses)?.text ?? "").includes("✓"));
		fs.rmSync(td, { recursive: true, force: true });
	}
}

process.exit(fails);
