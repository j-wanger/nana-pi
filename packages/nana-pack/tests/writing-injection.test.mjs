/**
 * @module packages/nana-pack/tests/writing-injection.test.mjs
 * @purpose Pins that the writing rule reaches every session's system prompt, composes with nana-objective on the installed pi 1.0.2 (a distinctive base, the objective and the writing block each once, in order), that an unusable or oversized or non-regular rule never crashes or hangs the process, that the UTF-8 tail fix strips only a genuine read-boundary split and never a malformed byte, that the read ceiling is pinned directly, and that none of this ever touches the real shipped rule file
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
async function inject(handler, ctx, key = "nana-writing") { const event = { systemPromptOptions: { sections: {} } }; await handler(event, ctx); return event.systemPromptOptions.sections[key]; }

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
	const r = await inject(handlers.before_agent_start, ctx);
	const expected = fs.readFileSync(RULE_PATH, "utf8"); // READ only
	const ok = r.includes(`${HEADING}\n\n${expected}`);
	// req: R-751
	check("inject: the rule text follows the base prompt under its heading (production default)", ok, r);
}

/* --- every session_start reason injects, over a DISPOSABLE fixture (R-751, R-754) ------ */
for (const reason of ["startup", "new", "resume", "fork", "reload"]) {
	const rulePath = path.join(tempDir(), "rule.md");
	fs.writeFileSync(rulePath, "Disposable fixture text.\n");
	const { td, handlers, ctx } = session(writingExt, { rulePath });
	await handlers.session_start({ reason }, ctx);
	const r = await inject(handlers.before_agent_start, ctx);
	// req: R-751 R-754
	check(`inject: reason "${reason}" injects the rule (disposable fixture)`, !!r.includes(HEADING) && r.includes("Disposable fixture text."));
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
	const r = await inject(handlers.before_agent_start, ctx);
	// req: R-752
	check(`unavailable: ${label} injects nothing and journals the cause`, r === undefined, JSON.stringify(r));
	const lines = fs.readFileSync(journal, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
	const added = lines.slice(before);
	// req: R-752
	check(`unavailable: ${label} journal entry names the cause`, added.some((l) => l.event === "writing_rule_unavailable" && l.cause?.startsWith(cause)), JSON.stringify(added));
}

/* ======================================================================================
 * astra r3 MUST 1 — the UTF-8 tail fix. Four fixtures, each a disposable file whose read
 * window (readBudget bytes) ends exactly at the boundary described:
 *   (1) a split € (3-byte sequence), (2) a split 😀 (4-byte sequence) — both ACCEPTED, no
 *   replacement character; (3) a genuinely invalid 0xff AT the tail — REFUSED, because its
 *   own "lead byte" announces nothing to wait for; (4) an invalid byte well inside the
 *   window, away from any boundary — REFUSED, as it already was before this fix.
 * ====================================================================================== */
{
	const { buildBlock: bb, readBudget } = await import(writingExtUrl);
	const want = readBudget(Number.MAX_SAFE_INTEGER); // WRITING_INJECT_CAP + READ_MARGIN
	const tail = Buffer.from("more text after the boundary, well past the cut.".repeat(10));

	const mkFile = (prefixLen, multibyte) => {
		const p = path.join(tempDir(), "rule.md");
		fs.writeFileSync(p, Buffer.concat([Buffer.alloc(prefixLen, 0x41), multibyte, tail]));
		return p;
	};

	// (1) € = 0xE2 0x82 0xAC, split after its first byte at the exact boundary
	{
		const p = mkFile(want - 1, Buffer.from([0xe2, 0x82, 0xac]));
		const r = bb(p);
		const ok = r.cause === null && r.block !== null && !r.block.includes("�");
		// req: R-752
		check("UTF-8 tail: a split € at the read boundary is accepted, no replacement char", ok, JSON.stringify(r.cause));
	}
	// (2) 😀 = 0xF0 0x9F 0x98 0x80, split after its first two bytes at the exact boundary
	{
		const p = mkFile(want - 2, Buffer.from([0xf0, 0x9f, 0x98, 0x80]));
		const r = bb(p);
		const ok = r.cause === null && r.block !== null && !r.block.includes("�");
		// req: R-752
		check("UTF-8 tail: a split 😀 at the read boundary is accepted, no replacement char", ok, JSON.stringify(r.cause));
	}
	// (3) a lone invalid 0xff AS the very last byte read — its own value announces no sequel,
	// so trimIncompleteTail must NOT remove it; the fatal decode then refuses it correctly.
	{
		const p = mkFile(want - 1, Buffer.from([0xff]));
		const r = bb(p);
		const ok = r.cause === "not valid UTF-8" && r.block === null;
		// req: R-752
		check("UTF-8 tail: 0xff AT the tail is REFUSED with a cause, not silently dropped", ok, JSON.stringify(r));
	}
	// (4) an invalid byte well inside the window (not at the boundary) — already worked, stays working
	{
		const p = path.join(tempDir(), "rule.md");
		fs.writeFileSync(p, Buffer.concat([Buffer.alloc(2000, 0x41), Buffer.from([0xff]), Buffer.alloc(2000, 0x42)]));
		const r = bb(p);
		const ok = r.cause === "not valid UTF-8" && r.block === null;
		// req: R-752
		check("UTF-8 tail: an invalid byte well inside the window is refused", ok, JSON.stringify(r));
	}
}

/* --- (c) cap: an oversized rule is cut and announced, plus its seal (R-753) — disposable - */
// req: R-753
check("seal: WRITING_INJECT_CAP is 4000", WRITING_INJECT_CAP === 4000);
{
	const rulePath = path.join(tempDir(), "rule.md");
	fs.writeFileSync(rulePath, "A".repeat(WRITING_INJECT_CAP * 2));
	const { handlers, ctx } = session(writingExt, { rulePath });
	await handlers.session_start({ reason: "startup" }, ctx);
	const r = await inject(handlers.before_agent_start, ctx);
	const block = r ?? "";
	const ok = block.length <= WRITING_INJECT_CAP && block.includes(`cut at ${WRITING_INJECT_CAP} chars`);
	// req: R-753
	check("cap: an oversized rule is cut at the cap and the cut is announced", ok, block.length);
}

/* ======================================================================================
 * astra r3 MUST 3 — the read ceiling, pinned DIRECTLY (R-755), not inferred from the
 * heap-pressure probe below. `readBudget` is the exact arithmetic buildBlock uses to size
 * its bounded read; this asserts its maximum equals WRITING_INJECT_CAP + READ_MARGIN for
 * any file at or above that size, and that a smaller file reads its own full size (never
 * more than the file has).
 * ====================================================================================== */
{
	const { readBudget, READ_MARGIN } = await import(writingExtUrl);
	// req: R-755
	check("seal: READ_MARGIN is 4", READ_MARGIN === 4);
	// req: R-755
	check("byte ceiling: a file at or above the cap never requests more than WRITING_INJECT_CAP + READ_MARGIN bytes", readBudget(WRITING_INJECT_CAP + READ_MARGIN) === WRITING_INJECT_CAP + READ_MARGIN && readBudget(1_000_000_000) === WRITING_INJECT_CAP + READ_MARGIN, JSON.stringify({ atCeiling: readBudget(WRITING_INJECT_CAP + READ_MARGIN), huge: readBudget(1_000_000_000) }));
	// req: R-755
	check("byte ceiling: a file smaller than the ceiling requests exactly its own size, never more", readBudget(10) === 10 && readBudget(0) === 0, JSON.stringify({ ten: readBudget(10), zero: readBudget(0) }));
}
{
	// Behavioral corroboration: a real file whose bytes PAST the ceiling are corrupt must have
	// NO effect on the result — if the read had gone one byte further, the corrupt byte would
	// make the whole thing refuse. This proves the ACTUAL read respects readBudget, not just
	// that the arithmetic above is correct.
	const { buildBlock: bb, readBudget } = await import(writingExtUrl);
	const ceiling = readBudget(Number.MAX_SAFE_INTEGER);
	const p = path.join(tempDir(), "rule.md");
	const clean = Buffer.alloc(ceiling, 0x41); // exactly the ceiling, all valid ASCII
	const corruptPastCeiling = Buffer.from([0xff, 0xff, 0xff, 0xff]); // would refuse if ever read
	fs.writeFileSync(p, Buffer.concat([clean, corruptPastCeiling]));
	const r = bb(p);
	// req: R-755
	check("byte ceiling: corrupt bytes exactly past the ceiling are never read (result is unaffected)", r.cause === null && r.block !== null, JSON.stringify(r.cause));
}

/* --- (d) reload: an edited DISPOSABLE rule is injected after session_start reason reload (R-754) --- */
{
	const rulePath = path.join(tempDir(), "rule.md");
	fs.writeFileSync(rulePath, "Original text.\n");
	const marker = `MARKER-${Date.now()}`;
	const { handlers, ctx } = session(writingExt, { rulePath });
	await handlers.session_start({ reason: "startup" }, ctx);
	const r1 = await inject(handlers.before_agent_start, ctx);
	// req: R-754
	check("reload: the original rule is injected first", !r1.includes(marker) && r1.includes("Original text."));
	fs.writeFileSync(rulePath, `${marker}\n`);
	await handlers.session_start({ reason: "reload" }, ctx);
	const r2 = await inject(handlers.before_agent_start, ctx);
	// req: R-754
	check("reload: an edited rule is injected after session_start reason reload", !!r2.includes(marker), r2);
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
	const mkfifoResult = spawnSync("mkfifo", [fifoPath]);
	if (mkfifoResult.error || mkfifoResult.status !== 0 || !fs.existsSync(fifoPath)) {
		// astra r3 residual 4: without `mkfifo` on PATH (removed from PATH, or a platform that
		// lacks it — e.g. native Windows) this fixture cannot be built at all. That is a missing
		// PREREQUISITE, not a finding about the extension, so it is reported as a skip, never a
		// failure the suite's PASS/FAIL tally would count.
		console.log(`SKIP MUST 1 (subprocess): FIFO fixture — mkfifo is not available (${mkfifoResult.error?.message ?? `exit ${mkfifoResult.status}`})`);
	} else {
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
		const fifoOk = !r.signal && elapsed < TIME_LIMIT_MS && out?.hasBlock === false && out?.cause?.includes("not a regular file");
		// req: R-752
		check("MUST 1 (subprocess): a FIFO with no writer is refused instantly, never read, never hangs", fifoOk, JSON.stringify({ signal: r.signal, elapsed, out, stderr: r.stderr }));
	}
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
	// req: R-755
	check("MUST 1 (subprocess): a 64 MiB rule file under a 32 MiB heap cap does not crash, exits in time, block is capped", bigOk, JSON.stringify({ signal: r.signal, status: r.status, elapsed, out, stderr: r.stderr }));
	fs.rmSync(bigPath, { force: true });
}

/* The real extension handlers share one fake event; exercise every invocation order while
 * retaining a foreign section so neither package discovery order nor key rebuilding defines it.
 */
{
 const rulePath = path.join(tempDir(), "rule.md");
 fs.writeFileSync(rulePath, "Compose fixture text.\n");
 const objSession = session(objectiveExt);
 await objSession.handlers.session_start({ reason: "startup" }, objSession.ctx);
 const handoffExt = (await import(new URL("../extensions/nana-handoff.ts", import.meta.url).href)).default;
 const handoffSession = session(handoffExt);
 await handoffSession.handlers.session_compact({ compactionEntry: { summary: "composition handoff fixture" } }, handoffSession.ctx);
 await handoffSession.handlers.session_start({ reason: "startup" }, handoffSession.ctx);
 const writingSession = session(writingExt, { rulePath });
 await writingSession.handlers.session_start({ reason: "startup" }, writingSession.ctx);
 const handlers = [
  [objSession.handlers.before_agent_start, objSession.ctx],
  [handoffSession.handlers.before_agent_start, handoffSession.ctx],
  [writingSession.handlers.before_agent_start, writingSession.ctx],
 ];
 const orders = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 let allStable = true;
 for (const order of orders) {
  const foreignFirst = { kept: "first" };
  const foreignLast = { kept: "last" };
  const event = { systemPromptOptions: { sections: { "foreign-first": foreignFirst, "foreign-last": foreignLast } } };
  const results = [];
  for (const i of order) results.push(await handlers[i][0](event, handlers[i][1]));
  const sections = event.systemPromptOptions.sections;
  allStable &&= JSON.stringify(Object.keys(sections)) === JSON.stringify(["foreign-first", "foreign-last", "nana-objective", "nana-handoff", "nana-writing"])
   && sections["foreign-first"] === foreignFirst && sections["foreign-last"] === foreignLast && results.every((result) => result === undefined)
   && !("systemPrompt" in event) && !("forceSystemPrompt" in event.systemPromptOptions);
 }
 // req: R-641 R-751
 check("compose: injector orders always produce canonical nana sections and preserve foreign sections", allStable);
}

for (const td of tmps) fs.rmSync(td, { recursive: true, force: true });
fs.rmSync(home, { recursive: true, force: true });
process.exit(fails);
