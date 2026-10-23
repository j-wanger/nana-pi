/**
 * @module packages/nana-pack/tests/rulings.test.mjs
 * @purpose Pins that the installed rulings file reaches every session's system prompt on every
 *  session_start reason, that an unusable or oversized or non-regular installed file never
 *  crashes or hangs the process and instead yields one user-facing marker line, that the
 *  sealed read cap is pinned directly, and that the shipped rulings file itself names no owner,
 *  no work project and no model id, opens with the required scope sentence, and holds only
 *  dated bullets.
 * @inputs extensions/nana-rulings.ts (production default via PI_CODING_AGENT_DIR, and an
 *  injected, disposable agentDir for every failure fixture — never the shipped file is written),
 *  lib/rulings-config.mjs, bin/worker-config.mjs (ROSTER_DEFAULTS, CLAUDE_CODE_SUBAGENT_MODELS),
 *  the shipped packages/nana-pack/rules/nana-rulings.md (read only), a temp HOME/agent dir, and
 *  (for the FIFO fixture) a Node subprocess with a time limit
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp dirs, disposable rulings-file fixtures only — the shipped file is read at
 *  most, never written), process (sets PI_CODING_AGENT_DIR; spawns one bounded Node subprocess
 *  for the FIFO fixture)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected
 *  throw propagates and fails the run
 */
// rulings-file lane (2026-10-19). Titles below are copied verbatim from
// docs/reviews/rulings-file-2026-10-19/must-meet.md's must-meet table.
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { countIdentityWords } from "../../../scripts/identity-scan.mjs";

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

const extUrl = new URL("../extensions/nana-rulings.ts", import.meta.url).href;
const { default: rulingsExt, buildBlock } = await import(extUrl);
const { RULINGS_FILE, RULINGS_HEADING, RULINGS_READ_CAP, RULINGS_SECTION, RULINGS_UNAVAILABLE } = await import(new URL("../lib/rulings-config.mjs", import.meta.url).href);
const { ROSTER_DEFAULTS, CLAUDE_CODE_SUBAGENT_MODELS } = await import(new URL("../bin/worker-config.mjs", import.meta.url).href);

const SHIPPED_PATH = fileURLToPath(new URL("../rules/nana-rulings.md", import.meta.url));
const SHIPPED_TEXT = fs.readFileSync(SHIPPED_PATH, "utf8"); // READ only — never written in this file
const IDENTITY_CONFIG = JSON.parse(fs.readFileSync(fileURLToPath(new URL("../../../identity-scan.config.json", import.meta.url)), "utf8"));

const tmps = [];
function tempDir(prefix = "rulings-") {
	const td = tmpDir(path.join(os.tmpdir(), prefix));
	tmps.push(td);
	return td;
}

/** A fresh extension instance over `opts` (e.g. { agentDir }), with recorded handlers. */
function session(opts) {
	const handlers = {};
	rulingsExt({ on: (name, fn) => { handlers[name] = fn; } }, opts);
	return handlers;
}

async function inject(handlers, ctx = { cwd: tempDir() }) {
	await handlers.session_start({ reason: "startup" }, ctx);
	const event = { systemPromptOptions: { sections: {} } };
	await handlers.before_agent_start(event, ctx);
	return event.systemPromptOptions.sections[RULINGS_SECTION];
}

/* ========================================================================================
 * R-1410 — the PRODUCTION DEFAULT: PI_CODING_AGENT_DIR, every session_start reason, a reload
 * re-reads the file. The fixture is the REAL shipped file, copied whole into the fixture agent
 * dir — never into the fixture's path is the shipped file itself written, so growth of the real
 * file past RULINGS_READ_CAP fails THIS test at the land that causes it, rather than silently.
 * ======================================================================================== */
{
	const agentDir = tempDir("rulings-agentdir-");
	const savedEnv = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = agentDir; // outside HOME: proves the extension follows this, not ~/.pi/agent
	fs.writeFileSync(path.join(agentDir, RULINGS_FILE), SHIPPED_TEXT);
	try {
		const expected = `${RULINGS_HEADING}\n\n${SHIPPED_TEXT}`;
		const perReason = ["startup", "new", "resume", "fork", "reload"].map((reason) => {
			const handlers = session(); // no opts: production default reads PI_CODING_AGENT_DIR
			return { reason, handlers };
		});
		const results = [];
		for (const { reason, handlers } of perReason) {
			await handlers.session_start({ reason }, { cwd: agentDir });
			const event = { systemPromptOptions: { sections: {} } };
			await handlers.before_agent_start(event, { cwd: agentDir });
			results.push({ reason, block: event.systemPromptOptions.sections[RULINGS_SECTION] });
		}
		// req: R-1410
		check("an installed rulings file reaches the nana-rulings section on every session_start reason",
			results.every(({ block }) => block === expected),
			JSON.stringify(results.map((r) => ({ reason: r.reason, ok: r.block === expected }))),
		);

		// the file is edited BETWEEN reasons: a reload must re-read it from disk
		const handlers = session();
		await handlers.session_start({ reason: "startup" }, { cwd: agentDir });
		const before = await inject(handlers, { cwd: agentDir });
		const marker = `MARKER-${Date.now()}`;
		fs.writeFileSync(path.join(agentDir, RULINGS_FILE), `${marker}\n`);
		await handlers.session_start({ reason: "reload" }, { cwd: agentDir });
		const event = { systemPromptOptions: { sections: {} } };
		await handlers.before_agent_start(event, { cwd: agentDir });
		const after = event.systemPromptOptions.sections[RULINGS_SECTION];
		// req: R-1410
		check("an installed rulings file reaches the nana-rulings section on every session_start reason",
			before === expected && after.includes(marker) && !after.includes(SHIPPED_TEXT),
			JSON.stringify({ before: before === expected, after }),
		);
	} finally {
		if (savedEnv === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = savedEnv;
	}
}

/* ========================================================================================
 * seal — RULINGS_READ_CAP pinned directly (req R-1411).
 * ======================================================================================== */
// req: R-1411
check("seal: RULINGS_READ_CAP is 8192", RULINGS_READ_CAP === 8192);

/* ========================================================================================
 * R-1411 — missing / empty / directory / FIFO / over-cap / invalid-UTF-8, each a DISPOSABLE
 * fixture (the `{ agentDir }` test seam — never the shipped file). One line, never a throw.
 * ======================================================================================== */
{
	// req R-1411's clause that the marker "names the file and `nana-setup install`": a one-line
	// marker that merely starts with RULINGS_UNAVAILABLE is not enough — it must also name the
	// rulings file (its basename, RULINGS_FILE) and the exact repair command, nana-setup install.
	const oneLineMarker = (block) => typeof block === "string" && !block.includes("\n") && block.startsWith(RULINGS_UNAVAILABLE) && block.includes(RULINGS_FILE) && block.includes("nana-setup install");
	const fixtures = [
		{ name: "missing", make: () => {} },
		{ name: "empty", make: (p) => fs.writeFileSync(p, "") },
		{ name: "directory", make: (p) => fs.mkdirSync(p) },
		{ name: "over-cap", make: (p) => fs.writeFileSync(p, "A".repeat(RULINGS_READ_CAP + 1)) },
		{ name: "invalid-UTF-8", make: (p) => fs.writeFileSync(p, Buffer.from([0xff, 0xfe, 0xfd, 0x00, 0x01])) },
	].map(({ name, make }) => {
		const dir = tempDir();
		make(path.join(dir, RULINGS_FILE));
		const block = buildBlock(dir);
		return { name, ok: oneLineMarker(block), block };
	});

	// FIFO, in a SUBPROCESS with a time limit — skipped on win32 (no mkfifo).
	let fifoOutcome = { name: "FIFO", ok: true, block: "SKIPPED (win32)" };
	if (process.platform !== "win32") {
		const fifoDir = tempDir("rulings-fifo-");
		const fifoPath = path.join(fifoDir, RULINGS_FILE);
		const mkfifoResult = spawnSync("mkfifo", [fifoPath]);
		if (mkfifoResult.error || mkfifoResult.status !== 0 || !fs.existsSync(fifoPath)) {
			console.log(`SKIP R-1411 FIFO fixture — mkfifo is not available (${mkfifoResult.error?.message ?? `exit ${mkfifoResult.status}`})`);
		} else {
			const runnerPath = path.join(fifoDir, "runner.mjs");
			fs.writeFileSync(
				runnerPath,
				`const [, , extUrl, dir] = process.argv;\n` +
					`const { buildBlock } = await import(extUrl);\n` +
					`const r = buildBlock(dir);\n` +
					`console.log(JSON.stringify({ oneLine: !r.includes("\\n"), startsRight: r.startsWith(${JSON.stringify(RULINGS_UNAVAILABLE)}) }));\n`,
			);
			const TIME_LIMIT_MS = 5000;
			const start = Date.now();
			const r = spawnSync(process.execPath, ["--experimental-strip-types", runnerPath, extUrl, fifoDir], { encoding: "utf8", timeout: TIME_LIMIT_MS });
			const elapsed = Date.now() - start;
			let out = null;
			try {
				out = JSON.parse(r.stdout.trim().split("\n").pop());
			} catch {
				out = null;
			}
			const ok = !r.signal && elapsed < TIME_LIMIT_MS && out?.oneLine === true && out?.startsRight === true;
			fifoOutcome = { name: "FIFO", ok, block: JSON.stringify({ signal: r.signal, elapsed, out, stderr: r.stderr }) };
		}
	}

	const all = [...fixtures, fifoOutcome];
	// req: R-1411
	check("a missing, empty, directory, FIFO, over-cap or invalid-UTF-8 rulings file yields the one-line unavailable marker, never a throw or a hang",
		all.every((o) => o.ok),
		JSON.stringify(all),
	);

	// the boundary this row also pins: exactly at the cap injects, one byte over gets the marker.
	const atCapDir = tempDir();
	fs.writeFileSync(path.join(atCapDir, RULINGS_FILE), "A".repeat(RULINGS_READ_CAP));
	const atCap = buildBlock(atCapDir);
	const overDir = tempDir();
	fs.writeFileSync(path.join(overDir, RULINGS_FILE), "A".repeat(RULINGS_READ_CAP + 1));
	const overCap = buildBlock(overDir);
	// req: R-1411
	check("boundary: a file of exactly RULINGS_READ_CAP bytes injects whole and RULINGS_READ_CAP + 1 bytes gets the marker",
		atCap === `${RULINGS_HEADING}\n\n${"A".repeat(RULINGS_READ_CAP)}` && oneLineMarker(overCap) && overCap.includes(`${RULINGS_READ_CAP}`),
		JSON.stringify({ atCapLen: atCap.length, overCap }),
	);

	// no fixture text leaks into any marker line.
	const leaked = fixtures.some((f) => f.name !== "missing" && f.name !== "directory" && f.block.includes("A".repeat(10)));
	// req: R-1411
	check("no fixture text leaks into the unavailable marker", !leaked, JSON.stringify(fixtures));
}

/* ========================================================================================
 * R-1415 to R-1418 — the SHIPPED file's own content (read only — this file never writes it).
 * ======================================================================================== */
function containsWholeWord(text, word) {
	const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

{
	const counts = countIdentityWords({ content: SHIPPED_TEXT, config: IDENTITY_CONFIG });
	// req: R-1415
	check("the rulings file names no owner and no work project",
		counts.every((count) => count === 0),
		JSON.stringify({ counts }),
	);
}

{
	const bulletLines = SHIPPED_TEXT.split("\n").filter((line) => line.startsWith("- "));
	const badBullets = bulletLines.filter((line) => !/^- \d{4}-\d{2}-\d{2}:/.test(line));
	// req: R-1416
	check("every ruling is one bullet that opens with its date",
		bulletLines.length >= 1 && badBullets.length === 0,
		JSON.stringify({ bulletCount: bulletLines.length, badBullets }),
	);
	const helperRuling = "- 2026-10-22: A helper's second caller imports it rather than copying it. A plan's Precedent section names any move of a private helper to a shared module.";
	// req: R-2663
	check("R-2663: the rulings file carries one dated ruling that a helper's second caller imports it and the plan names any move",
		bulletLines.filter((line) => line === helperRuling).length === 1,
		JSON.stringify({ helperRuling, matches: bulletLines.filter((line) => line.includes("helper")) }),
	);
}

{
	// R-1417's words: each ROSTER_DEFAULTS model id, its last hyphen part, and CLAUDE_CODE_SUBAGENT_MODELS.
	const modelIds = Object.values(ROSTER_DEFAULTS)
		.filter((slot) => slot && typeof slot === "object" && typeof slot.model === "string")
		.map((slot) => slot.model);
	const shortNames = modelIds.map((id) => id.split("-").pop());
	const modelWords = [...new Set([...modelIds, ...shortNames, ...CLAUDE_CODE_SUBAGENT_MODELS])];
	const found = modelWords.filter((w) => containsWholeWord(SHIPPED_TEXT, w));
	// req: R-1417
	check("the rulings file names no model, leaving the lineup to the roster",
		found.length === 0,
		JSON.stringify({ found, checked: modelWords }),
	);
}

{
	const EXPECTED_SCOPE_SENTENCE = "These rulings guide the seat, the session that plans lanes and launches builders and reviewers; a builder or reviewer acts only within its brief and reads them as background.";
	const lines = SHIPPED_TEXT.split("\n");
	const headingLine = lines[0];
	const firstBulletIndex = lines.findIndex((line) => line.startsWith("- "));
	const between = lines.slice(1, firstBulletIndex).filter((line) => line.trim().length > 0);
	// req: R-1418
	check("the rulings file opens with the scope sentence for builders and reviewers",
		headingLine.startsWith("# ") && firstBulletIndex > 0 && between.length === 1 && between[0] === EXPECTED_SCOPE_SENTENCE,
		JSON.stringify({ headingLine, between, firstBulletIndex }),
	);
}

for (const td of tmps) {
	try {
		fs.rmSync(td, { recursive: true, force: true });
	} catch {
		/* best effort cleanup */
	}
}
process.exit(fails);
