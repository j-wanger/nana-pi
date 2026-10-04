/**
 * @module packages/nana-pack/tests/writing-injection.test.mjs
 * @purpose Pins that the writing rule reaches every session's system prompt, composes with nana-objective on the installed pi 1.0.2 (base, objective and writing each once, in order), that an unusable or oversized or non-regular rule never crashes or hangs the process, and that none of this ever touches the real shipped rule file
 * @inputs extensions/nana-writing.ts (with an injected, disposable rulePath — never the shipped file), extensions/nana-objective.ts, a temp HOME, and (for the two resource-failure fixtures) a Node subprocess with a time limit
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, journal, disposable rule-file fixtures only — the shipped rule file is read at most, never written), process (sets HOME/USERPROFILE; spawns bounded Node subprocesses for the FIFO and oversized-file fixtures; dynamically imports the installed pi package when present)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate, amended after astra r2 (BLOCK, 8/10):
//   MUST 1 — a FIFO or an oversized rule file must never hang or crash the process. Tested in
//   subprocesses with a time limit, because a hang in-process would hang this whole suite.
//   MUST 4 — a test must NEVER touch the shipped rule file. The extension's default export now
//   takes an optional `{ rulePath }` (the production call site, one argument, is unchanged), so
//   every fixture below injects its OWN disposable file. The one test that reads the REAL file
//   (R-751's base case) only ever READS it (fs.readFileSync), to prove the production default —
//   never writes, moves or deletes it.
//   MUST 3(d) — the composition regression now seeds a REAL objective and asserts the base
//   prompt, the objective block and the writing block each appear exactly once, IN ORDER,
//   through both a hand-rolled stub chain and the installed pi 1.0.2 ExtensionRunner.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

const writingExtUrl = new URL("../extensions/nana-writing.ts", import.meta.url).href;
const { default: writingExt, RULE_PATH, HEADING } = await import(writingExtUrl);
const { default: objectiveExt } = await import(new URL("../extensions/nana-objective.ts", import.meta.url).href);
const { HEADING: OBJECTIVE_HEADING } = await import(new URL("../lib/objective.ts", import.meta.url).href);
const { WRITING_INJECT_CAP } = await import(new URL("../lib/writing-config.mjs", import.meta.url).href);

const journal = path.join(home, "journal.jsonl");
const userCfg = path.join(home, ".pi", "agent", "nana-pack.json");
const objectiveFile = path.join(home, "OBJECTIVE.md");
fs.writeFileSync(userCfg, JSON.stringify({ journal: { enabled: true, path: journal }, objective: { path: objectiveFile } }));
fs.writeFileSync(objectiveFile, "**Objective:** ship the writing trial.\n\n**Current priority:** close astra r2.\n");

const tmps = [];
function tempDir() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "writing-inject-cwd-"));
	tmps.push(td);
	return td;
}

/** A fresh extension instance over `opts` (e.g. { rulePath }), with recorded handlers. */
function session(ext, opts) {
	const td = tempDir();
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } }, opts);
	return { td, handlers, ctx: { cwd: td, hasUI: false, isProjectTrusted: () => true } };
}

/* --- (a) inject: the PRODUCTION DEFAULT — reads the real file, never writes it (R-751) - */
{
	const { td, handlers, ctx } = session(writingExt); // no opts: production default, RULE_PATH
	await handlers.session_start({ reason: "startup" }, ctx);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	const expected = fs.readFileSync(RULE_PATH, "utf8"); // READ only
	const ok = !!r?.systemPrompt.startsWith("BASE") && r.systemPrompt.includes(`BASE\n\n${HEADING}\n\n${expected}`);
	// req: R-751
	check("inject: the rule text follows the base prompt under its heading (production default)", ok, r?.systemPrompt);
}

/* --- every session_start reason injects, over a DISPOSABLE fixture (R-751, R-754) ------ */
for (const reason of ["startup", "new", "resume", "fork", "reload"]) {
	const rulePath = path.join(tempDir(), "rule.md");
	fs.writeFileSync(rulePath, "Disposable fixture text.\n");
	const { td, handlers, ctx } = session(writingExt, { rulePath });
	await handlers.session_start({ reason }, ctx);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	// req: R-751 R-754
	check(`inject: reason "${reason}" injects the rule (disposable fixture)`, !!r?.systemPrompt.includes(HEADING) && r.systemPrompt.includes("Disposable fixture text."));
}

/* --- (b) unavailable: missing / a directory / invalid UTF-8, all disposable (R-752) ---- */
for (const [label, cause, mk] of [
	["missing file", "unreadable (ENOENT", (p) => p], // never created
	["a directory in its place", "not a regular file", (p) => {
		fs.mkdirSync(p);
		return p;
	}],
	["not valid UTF-8", "not valid UTF-8", (p) => {
		fs.writeFileSync(p, Buffer.from([0xff, 0xfe, 0xfd, 0x00, 0x01]));
		return p;
	}],
]) {
	const rulePath = mk(path.join(tempDir(), "rule.md"));
	const before = fs.existsSync(journal) ? fs.readFileSync(journal, "utf-8").trim().split("\n").filter(Boolean).length : 0;
	const { handlers, ctx } = session(writingExt, { rulePath });
	await handlers.session_start({ reason: "startup" }, ctx);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	// req: R-752
	check(`unavailable: ${label} injects nothing and journals the cause`, r === undefined, JSON.stringify(r));
	const lines = fs.readFileSync(journal, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
	const added = lines.slice(before);
	// req: R-752
	check(`unavailable: ${label} journal entry names the cause`, added.some((l) => l.event === "writing_rule_unavailable" && l.cause?.startsWith(cause)), JSON.stringify(added));
}

/* --- (c) cap: an oversized rule is cut and announced, plus its seal (R-753) — disposable - */
// req: R-753
check("seal: WRITING_INJECT_CAP is 4000", WRITING_INJECT_CAP === 4000);
{
	const rulePath = path.join(tempDir(), "rule.md");
	fs.writeFileSync(rulePath, "A".repeat(WRITING_INJECT_CAP * 2));
	const { handlers, ctx } = session(writingExt, { rulePath });
	await handlers.session_start({ reason: "startup" }, ctx);
	const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	const block = r?.systemPrompt.slice("BASE\n\n".length) ?? "";
	const ok = block.length <= WRITING_INJECT_CAP && block.includes(`cut at ${WRITING_INJECT_CAP} chars`);
	// req: R-753
	check("cap: an oversized rule is cut at the cap and the cut is announced", ok, block.length);
}

/* --- (d) reload: an edited DISPOSABLE rule is injected after session_start reason reload (R-754) --- */
{
	const rulePath = path.join(tempDir(), "rule.md");
	fs.writeFileSync(rulePath, "Original text.\n");
	const marker = `MARKER-${Date.now()}`;
	const { handlers, ctx } = session(writingExt, { rulePath });
	await handlers.session_start({ reason: "startup" }, ctx);
	const r1 = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	// req: R-754
	check("reload: the original rule is injected first", !r1?.systemPrompt.includes(marker) && r1?.systemPrompt.includes("Original text."));
	fs.writeFileSync(rulePath, `${marker}\n`);
	await handlers.session_start({ reason: "reload" }, ctx);
	const r2 = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
	// req: R-754
	check("reload: an edited rule is injected after session_start reason reload", !!r2?.systemPrompt.includes(marker), r2?.systemPrompt);
}

/* ======================================================================================
 * astra r2 MUST 1 — a FIFO or an oversized file must never hang or crash the process.
 * Run in SUBPROCESSES with a time limit: a hang here must never hang this suite.
 * ====================================================================================== */
const runnerPath = path.join(tempDir(), "runner.mjs");
fs.writeFileSync(
	runnerPath,
	`const [, , extUrl, rulePath] = process.argv;\n` +
		`const { buildBlock } = await import(extUrl);\n` +
		`const r = buildBlock(rulePath);\n` +
		`console.log(JSON.stringify({ hasBlock: r.block !== null, cause: r.cause, len: r.block ? r.block.length : null }));\n`,
);
const TIME_LIMIT_MS = 5000;

{
	const fifoPath = path.join(tempDir(), "fifo.md");
	try {
		spawnSync("mkfifo", [fifoPath]);
	} catch {
		/* platform without mkfifo — the check below reports it, not a crash */
	}
	const start = Date.now();
	const r = spawnSync(process.execPath, ["--experimental-strip-types", runnerPath, writingExtUrl, fifoPath], {
		encoding: "utf8",
		timeout: TIME_LIMIT_MS,
	});
	const elapsed = Date.now() - start;
	const out = (() => {
		try {
			return JSON.parse(r.stdout.trim().split("\n").pop());
		} catch {
			return null;
		}
	})();
	const fifoOk = fs.existsSync(fifoPath) && !r.signal && elapsed < TIME_LIMIT_MS && out?.hasBlock === false && out?.cause?.includes("not a regular file");
	// req: R-752
	check("MUST 1 (subprocess): a FIFO with no writer is refused instantly, never read, never hangs", fifoOk, JSON.stringify({ signal: r.signal, elapsed, out, stderr: r.stderr }));
}

{
	const bigPath = path.join(tempDir(), "big.md");
	const fd = fs.openSync(bigPath, "w");
	fs.writeSync(fd, Buffer.alloc(64 * 1024 * 1024, 0x41)); // 64 MiB of 'A' — one bounded write, not a giant JS string
	fs.closeSync(fd);
	const start = Date.now();
	const r = spawnSync(process.execPath, ["--max-old-space-size=32", "--experimental-strip-types", runnerPath, writingExtUrl, bigPath], {
		encoding: "utf8",
		timeout: TIME_LIMIT_MS,
	});
	const elapsed = Date.now() - start;
	const out = (() => {
		try {
			return JSON.parse(r.stdout.trim().split("\n").pop());
		} catch {
			return null;
		}
	})();
	const bigOk = !r.signal && r.status === 0 && elapsed < TIME_LIMIT_MS && out?.hasBlock === true && out?.len <= WRITING_INJECT_CAP;
	// req: R-753
	check("MUST 1 (subprocess): a 64 MiB rule file under a 32 MiB heap cap does not crash, exits in time, block is capped", bigOk, JSON.stringify({ signal: r.signal, status: r.status, elapsed, out, stderr: r.stderr }));
	fs.rmSync(bigPath, { force: true });
}

/* ======================================================================================
 * astra r2 MUST 3(d) — composition: a REAL objective seeded, base + objective + writing
 * each appear EXACTLY ONCE, IN ORDER (objective registered before writing).
 * ====================================================================================== */
{
	const rulePath = path.join(tempDir(), "rule.md");
	fs.writeFileSync(rulePath, "Compose fixture text.\n");
	const objSession = session(objectiveExt);
	await objSession.handlers.session_start({ reason: "startup" }, objSession.ctx);
	const writingSession = session(writingExt, { rulePath });
	await writingSession.handlers.session_start({ reason: "startup" }, writingSession.ctx);
	let prompt = "BASE";
	const r1 = await objSession.handlers.before_agent_start({ systemPrompt: prompt }, objSession.ctx);
	if (r1?.systemPrompt !== undefined) prompt = r1.systemPrompt;
	const r2 = await writingSession.handlers.before_agent_start({ systemPrompt: prompt }, writingSession.ctx);
	if (r2?.systemPrompt !== undefined) prompt = r2.systemPrompt;
	const objOnce = prompt.split(OBJECTIVE_HEADING).length - 1 === 1;
	const writingOnce = prompt.split(HEADING).length - 1 === 1;
	const inOrder = prompt.indexOf(OBJECTIVE_HEADING) !== -1 && prompt.indexOf(OBJECTIVE_HEADING) < prompt.indexOf(HEADING);
	check("compose (stub): base prompt survives", prompt.startsWith("BASE"));
	// req: R-751
	check("compose (stub): base, objective and writing each appear exactly once, objective before writing", objOnce && writingOnce && inOrder, prompt);
}

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
		const rulePath = path.join(tempDir(), "rule.md");
		fs.writeFileSync(rulePath, "Compose fixture text (real pi).\n");
		const objSession = session(objectiveExt);
		await objSession.handlers.session_start({ reason: "startup" }, objSession.ctx);
		const writingSession = session(writingExt, { rulePath });
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
		const objOnce = finalPrompt.split(OBJECTIVE_HEADING).length - 1 === 1;
		const writingOnce = finalPrompt.split(HEADING).length - 1 === 1;
		const inOrder = finalPrompt.indexOf(OBJECTIVE_HEADING) !== -1 && finalPrompt.indexOf(OBJECTIVE_HEADING) < finalPrompt.indexOf(HEADING);
		// req: R-751
		check("compose (real pi 1.0.2): base, objective and writing each appear exactly once, objective before writing", objOnce && writingOnce && inOrder, finalPrompt);
	}
}

for (const td of tmps) fs.rmSync(td, { recursive: true, force: true });
fs.rmSync(home, { recursive: true, force: true });
process.exit(fails);
