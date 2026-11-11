/**
 * @module packages/nana-pack/tests/rulings.test.mjs
 * @purpose Pin rulings and seat-guide injection, unavailable markers and public-text identity safety.
 * @inputs extensions/nana-rulings.ts, lib/rulings-config.mjs, shipped guidance and disposable agent directories.
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temporary fixtures), process (sets PI_CODING_AGENT_DIR)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected
 *  throw propagates and fails the run
 */
// rulings-file lane (2026-10-19). Titles below are copied verbatim from
// docs/reviews/rulings-file-2026-10-19/must-meet.md's must-meet table.
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { countIdentityWords } from "../../../scripts/identity-scan.mjs";

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

const extUrl = new URL("../extensions/nana-rulings.ts", import.meta.url).href;
const { default: rulingsExt, buildBlock, buildSeatGuideBlock } = await import(extUrl);
const { RULINGS_FILE, RULINGS_HEADING, RULINGS_READ_CAP, RULINGS_SECTION, RULINGS_UNAVAILABLE } = await import(new URL("../lib/rulings-config.mjs", import.meta.url).href);
const { SEAT_GUIDE_FILE, SEAT_GUIDE_HEADING, SEAT_GUIDE_READ_CAP, SEAT_GUIDE_SECTION, SEAT_GUIDE_UNAVAILABLE } = await import(new URL("../lib/rulings-config.mjs", import.meta.url).href);
const { STALE_SECTION } = await import(new URL("../../nana-setup/lib/stale-copies-config.mjs", import.meta.url).href);

const SHIPPED_PATH = fileURLToPath(new URL("../rules/nana-rulings.md", import.meta.url));
const SHIPPED_TEXT = fs.readFileSync(SHIPPED_PATH, "utf8"); // READ only — never written in this file
const PLANNER_TEXT = fs.readFileSync(fileURLToPath(new URL("../prompts/planner.md", import.meta.url)), "utf8");
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

async function injectSections(handlers, ctx = { cwd: tempDir() }) {
	await handlers.session_start({ reason: "startup" }, ctx);
	const event = { systemPromptOptions: { sections: {} } };
	await handlers.before_agent_start(event, ctx);
	return event.systemPromptOptions.sections;
}

{
	const agentDir = tempDir("seat-guide-agentdir-");
	const guide = "# Nana — Running builders and reviewers\nSeat guide fixture.\n";
	fs.writeFileSync(path.join(agentDir, SEAT_GUIDE_FILE), guide);
	const sections = await injectSections(session({ agentDir, env: {} }), { cwd: agentDir });
	// req: R-3021 R-3966
	check("pi seat receives the complete installed guide under its fixed heading", sections[SEAT_GUIDE_SECTION] === `${SEAT_GUIDE_HEADING}\n\n${guide}`,
		JSON.stringify(sections[SEAT_GUIDE_SECTION]));
}

{
	const agentDir = tempDir("seat-guide-stale-");
	fs.writeFileSync(path.join(agentDir, SEAT_GUIDE_FILE), "stale guide content\\n");
	const sections = await injectSections(session({ agentDir, env: {} }), { cwd: agentDir });
	// req: R-3024
	check("stale guide installation notice names the pi seat guide and nana-setup install", sections[STALE_SECTION]?.includes(`pi ${SEAT_GUIDE_FILE}`) && sections[STALE_SECTION]?.includes(" install"), String(sections[STALE_SECTION]));
}

{
	const agentDir = tempDir("seat-guide-worker-");
	const guide = "# Nana — Running builders and reviewers\nSeat guide fixture.\n";
	fs.writeFileSync(path.join(agentDir, SEAT_GUIDE_FILE), guide);
	const results = [];
	for (const role of ["worker", "reviewer"]) {
		const sections = await injectSections(session({ agentDir, env: { NANA_ROLE: role } }), { cwd: agentDir });
		results.push({ role, omitted: !sections[SEAT_GUIDE_SECTION], rulings: typeof sections[RULINGS_SECTION] === "string" });
	}
	// req: R-3022
	check("pi builder and reviewer omit both guide and rulings sections", results.every((result) => result.omitted && !result.rulings), JSON.stringify(results));
}

{
	const agentDir = tempDir("seat-guide-unavailable-");
	const p = path.join(agentDir, SEAT_GUIDE_FILE);
	const unusable = [
		{ name: "missing", setup: () => {} },
		{ name: "empty", setup: () => fs.writeFileSync(p, "") },
		{ name: "oversized", setup: () => fs.writeFileSync(p, "x".repeat(SEAT_GUIDE_READ_CAP + 1)) },
		{ name: "invalid UTF-8", setup: () => fs.writeFileSync(p, Buffer.from([0xff])) },
	];
	const results = unusable.map(({ name, setup }) => {
		fs.rmSync(p, { force: true });
		setup();
		const marker = buildSeatGuideBlock(agentDir);
		return { name, ok: marker.startsWith(SEAT_GUIDE_UNAVAILABLE) && !marker.includes("\n") && marker.includes(SEAT_GUIDE_FILE) && marker.includes("nana-setup install") };
	});
	// req: R-3023
	check("missing, empty, oversized and invalid-UTF-8 seat guides yield one user-facing install marker without throwing", results.every((result) => result.ok), JSON.stringify(results));
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
 * R-1411 — missing / empty / directory / over-cap / invalid-UTF-8, each a DISPOSABLE
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

	// req: R-1411
	check("a missing, empty, directory, over-cap or invalid-UTF-8 rulings file yields the one-line unavailable marker",
		fixtures.every((o) => o.ok), JSON.stringify(fixtures));

	// no fixture text leaks into any marker line.
	const leaked = fixtures.some((f) => f.name !== "missing" && f.name !== "directory" && f.block.includes("A".repeat(10)));
	// req: R-1411
	check("no fixture text leaks into the unavailable marker", !leaked, JSON.stringify(fixtures));
}

/* ========================================================================================
 * R-1415 and R-1416 — the SHIPPED file's identity safety and dated bullets (read only).
 * ======================================================================================== */
{
	const counts = countIdentityWords({ content: PLANNER_TEXT, config: IDENTITY_CONFIG });
	check("planner prompt names no owner or work project",
		counts.every((count) => count === 0),
		JSON.stringify({ counts }));
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
}

for (const td of tmps) {
	try {
		fs.rmSync(td, { recursive: true, force: true });
	} catch {
		/* best effort cleanup */
	}
}
process.exit(fails);
