/**
 * @module packages/nana-pack/tests/writing-injection.test.mjs
 * @purpose Pins that the writing rule reaches every session's system prompt, that an unusable rule injects nothing and journals the cause, that the block is capped with the cut announced, that a reload re-reads an edit, and that this extension composes with nana-objective.ts on the installed pi 1.0.2
 * @inputs extensions/nana-writing.ts, extensions/nana-objective.ts, the real shipped rule file (briefly swapped and always restored), and a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, journal; BRIEFLY overwrites the real rules/nana-writing.md for three fixtures, always restored in a try/finally even on failure), process (sets HOME/USERPROFILE; dynamically imports the installed pi package when present)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates (after the finally restores the rule file) and fails the run
 */
// Gate: the writing rule reaches every session's system prompt via an APPEND, the way
// nana-objective.ts does — design-ruling.md Amendment 1, 2026-10-04, §A1, after astra r1
// MUST 1 (a context-file link can both hide a user's file and be hidden by one). R-752's
// unavailable causes and R-754's reload both need the REAL registered session_start handler
// (buildBlock alone cannot journal), so three fixtures below briefly overwrite the real
// packages/nana-pack/rules/nana-writing.md and ALWAYS restore it in a try/finally.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

// Found BEFORE any HOME swap (objective-golden.test.mjs's own discipline: `npm root -g` and
// `command -v pi` are both HOME/PATH-sensitive, and the fixtures below override HOME).
function findPiIndex() {
	try {
		const root = spawnSync("npm", ["root", "-g"], { encoding: "utf-8" }).stdout.trim();
		const candidate = path.join(root, "@earendil-works", "pi-coding-agent", "dist", "index.js");
		if (fs.existsSync(candidate)) return candidate;
	} catch {
		/* fall through */
	}
	return null;
}
const piIndexPath = findPiIndex();

const home = fs.mkdtempSync(path.join(os.tmpdir(), "writing-inject-home-"));
process.env.HOME = home;
process.env.USERPROFILE = home;
fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });

const { default: writingExt, buildBlock, RULE_PATH, HEADING } = await import(new URL("../extensions/nana-writing.ts", import.meta.url).href);
const { default: objectiveExt } = await import(new URL("../extensions/nana-objective.ts", import.meta.url).href);
const { WRITING_INJECT_CAP } = await import(new URL("../lib/writing-config.mjs", import.meta.url).href);

// Defense in depth beyond withRule's own try/finally below (which already restores after
// every fixture): a final synchronous safety net on process exit, so a bug in a fixture, or
// in withRule itself, can never leave the REAL tracked rule file holding test content. (This
// is not theoretical — an earlier version of this file had an un-awaited withRule and did
// exactly that; fixed, but the belt stays on top of the suspenders.)
const ORIGINAL_RULE_BYTES = fs.readFileSync(RULE_PATH);
process.on("exit", () => {
	try {
		if (!fs.readFileSync(RULE_PATH).equals(ORIGINAL_RULE_BYTES)) fs.writeFileSync(RULE_PATH, ORIGINAL_RULE_BYTES);
	} catch {
		try {
			fs.writeFileSync(RULE_PATH, ORIGINAL_RULE_BYTES);
		} catch {
			/* nothing more we can do synchronously at exit */
		}
	}
});

const journal = path.join(home, "journal.jsonl");
const userCfg = path.join(home, ".pi", "agent", "nana-pack.json");
fs.writeFileSync(userCfg, JSON.stringify({ journal: { enabled: true, path: journal } }));

function session(ext) {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "writing-inject-cwd-"));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	return { td, handlers, ctx: { cwd: td, hasUI: false, isProjectTrusted: () => true } };
}

/** Run `fn` with the REAL rule file replaced by `content` (or removed/directory'd when fn
 *  mutates it itself), restoring the ORIGINAL bytes afterward no matter what. ASYNC, and every
 *  caller MUST await it — fn is async, and an un-awaited finally would restore the file before
 *  fn's own writes land (caught the hard way: it left the real rule file holding a test marker). */
async function withRule(mutate, fn) {
	const original = fs.readFileSync(RULE_PATH);
	try {
		mutate();
		return await fn();
	} finally {
		fs.rmSync(RULE_PATH, { force: true, recursive: true });
		fs.writeFileSync(RULE_PATH, original);
	}
}

/* --- (a) inject: the rule text follows the base prompt under its heading (R-751) ------ */
{
	const { td, handlers, ctx } = session(writingExt);
	await handlers.session_start({ reason: "startup" }, ctx);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	const expected = fs.readFileSync(RULE_PATH, "utf8");
	const ok =
		!!r?.systemPrompt.startsWith("BASE") &&
		r.systemPrompt.includes(`BASE\n\n${HEADING}\n\n${expected}`);
	// req: R-751
	check("inject: the rule text follows the base prompt under its heading", ok, r?.systemPrompt);
	fs.rmSync(td, { recursive: true, force: true });
}

// every session_start reason injects (R-754's "every reason" half)
for (const reason of ["startup", "new", "resume", "fork", "reload"]) {
	const { td, handlers, ctx } = session(writingExt);
	await handlers.session_start({ reason }, ctx);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	// req: R-751 R-754
	check(`inject: reason "${reason}" injects the rule`, !!r?.systemPrompt.includes(HEADING));
	fs.rmSync(td, { recursive: true, force: true });
}

/* --- (b) unavailable: missing / unreadable / invalid UTF-8 (R-752) -------------------- */
for (const [label, cause, mutate] of [
	["missing file", "unreadable (ENOENT", () => fs.rmSync(RULE_PATH, { force: true })],
	["unreadable (path is a directory)", "unreadable (EISDIR", () => {
		fs.rmSync(RULE_PATH, { force: true, recursive: true });
		fs.mkdirSync(RULE_PATH);
	}],
	["not valid UTF-8", "not valid UTF-8", () => fs.writeFileSync(RULE_PATH, Buffer.from([0xff, 0xfe, 0xfd, 0x00, 0x01]))],
]) {
	await withRule(mutate, async () => {
		const before = fs.existsSync(journal) ? fs.readFileSync(journal, "utf-8").trim().split("\n").filter(Boolean).length : 0;
		const { td, handlers, ctx } = session(writingExt);
		await handlers.session_start({ reason: "startup" }, ctx);
		const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
		// req: R-752
		check(`unavailable: ${label} injects nothing and journals the cause`, r === undefined, JSON.stringify(r));
		const lines = fs.readFileSync(journal, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
		const added = lines.slice(before);
		check(`unavailable: ${label} journal entry names the cause`, added.some((l) => l.event === "writing_rule_unavailable" && l.cause?.startsWith(cause)), JSON.stringify(added));
		fs.rmSync(td, { recursive: true, force: true });
	});
}

/* --- (c) cap: an oversized rule is cut and the cut is announced, plus its seal (R-753) - */
// req: R-753
check("seal: WRITING_INJECT_CAP is 4000", WRITING_INJECT_CAP === 4000);
{
	const huge = "A".repeat(WRITING_INJECT_CAP * 2);
	await withRule(() => fs.writeFileSync(RULE_PATH, huge), () => {
		const r = buildBlock();
		const ok = r.block !== null && r.block.length <= WRITING_INJECT_CAP && r.block.includes(`cut at ${WRITING_INJECT_CAP} chars`);
		// req: R-753
		check("cap: an oversized rule is cut at the cap and the cut is announced", ok, r.block?.length);
	});
}

/* --- (d) reload: an edited rule is injected after session_start reason reload (R-754) - */
await withRule(
	() => {},
	async () => {
		const marker = `MARKER-${Date.now()}`;
		const { td, handlers, ctx } = session(writingExt);
		await handlers.session_start({ reason: "startup" }, ctx);
		const r1 = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
		// req: R-754
		check("reload: the original rule is injected first", !r1?.systemPrompt.includes(marker));
		fs.writeFileSync(RULE_PATH, `${marker}\n`);
		await handlers.session_start({ reason: "reload" }, ctx);
		const r2 = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
		// req: R-754
		check("reload: an edited rule is injected after session_start reason reload", !!r2?.systemPrompt.includes(marker), r2?.systemPrompt);
		fs.rmSync(td, { recursive: true, force: true });
	},
);

/* --- (e) composition: nana-objective AND nana-writing both reach the model, each once -- */
// Amendment 1's own stated risk: "two extensions returning systemPrompt compose". Stub harness
// first (always runs): chain the handlers exactly as pi's emitBeforeAgentStart does — the LATER
// handler reads the EARLIER one's already-appended systemPrompt via the live event getter.
{
	const objSession = session(objectiveExt);
	const { handlers: objHandlers, ctx: objCtx } = objSession;
	await objHandlers.session_start({ reason: "startup" }, objCtx); // no objective file: injects nothing, which is fine — this fixture is about COMPOSITION, not content
	const writingSession = session(writingExt);
	const { handlers: wHandlers, ctx: wCtx } = writingSession;
	await wHandlers.session_start({ reason: "startup" }, wCtx);
	let prompt = "BASE";
	const r1 = await objHandlers.before_agent_start({ systemPrompt: prompt }, objCtx);
	if (r1?.systemPrompt !== undefined) prompt = r1.systemPrompt;
	const r2 = await wHandlers.before_agent_start({ systemPrompt: prompt }, wCtx);
	if (r2?.systemPrompt !== undefined) prompt = r2.systemPrompt;
	const expected = fs.readFileSync(RULE_PATH, "utf8");
	check("compose (stub): base prompt survives", prompt.startsWith("BASE"));
	// req: R-751
	check("compose (stub): the writing block appears exactly once", prompt.split(HEADING).length - 1 === 1);
	check("compose (stub): the writing text is present", prompt.includes(expected));
	fs.rmSync(objSession.td, { recursive: true, force: true });
	fs.rmSync(writingSession.td, { recursive: true, force: true });
}

// Real pi 1.0.2: drive the ACTUAL emitBeforeAgentStart over the ACTUAL buildSystemPromptState
// (dist/core/extensions/runner.js, dist/core/system-prompt.js) — not a stub. Skips loudly when
// pi is not installed globally; this is the amendment's "most likely wrong" claim, so it is
// checked against the real runtime, not only reasoned about.
{
	if (!piIndexPath) {
		console.log("SKIP compose (real pi): @earendil-works/pi-coding-agent is not installed");
	} else {
		const { ExtensionRunner } = await import(`file://${piIndexPath}`);
		const fakeExt = (p, eventMap) => {
			const handlers = new Map();
			for (const [event, fns] of Object.entries(eventMap)) handlers.set(event, fns);
			return { path: p, handlers };
		};
		const objSession = session(objectiveExt);
		await objSession.handlers.session_start({ reason: "startup" }, objSession.ctx);
		const writingSession = session(writingExt);
		await writingSession.handlers.session_start({ reason: "startup" }, writingSession.ctx);
		const runner = new ExtensionRunner(
			[
				fakeExt("nana-objective", { before_agent_start: [objSession.handlers.before_agent_start] }),
				fakeExt("nana-writing", { before_agent_start: [writingSession.handlers.before_agent_start] }),
			],
			{},
			process.cwd(),
			undefined,
			undefined,
		);
		const result = await runner.emitBeforeAgentStart("USER", [], { cwd: process.cwd() });
		const finalPrompt = result.systemPromptOptions.forceSystemPrompt ?? "";
		const expected = fs.readFileSync(RULE_PATH, "utf8");
		// req: R-751
		check("compose (real pi 1.0.2): the writing block appears exactly once", finalPrompt.split(HEADING).length - 1 === 1, finalPrompt);
		check("compose (real pi 1.0.2): the writing text is present", finalPrompt.includes(expected));
		fs.rmSync(objSession.td, { recursive: true, force: true });
		fs.rmSync(writingSession.td, { recursive: true, force: true });
	}
}

fs.rmSync(home, { recursive: true, force: true });
process.exit(fails);
