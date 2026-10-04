/**
 * @module packages/nana-pack/tests/handoff-writer-role.test.mjs
 * @purpose Pins that a session whose launcher set NANA_HANDOFF=off neither picks up nor writes the handoff, and that the role is never inferred from the tool list or the UI
 * @inputs extensions/nana-handoff.ts, bin/pi-review.mjs, a stub `pi` on PATH, and a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, store files), process (sets HOME and NANA_HANDOFF, spawns pi-review with the stub pi on PATH)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
// L3 invariant (e): a session whose LAUNCHER set NANA_HANDOFF=off is a non-writer — it
// neither picks up nor writes the handoff, and journals `handoff_skipped_role`. The role
// is never inferred from the tool list or hasUI. pi-review sets the marker in every
// child's spawn env; that is tested against a stub `pi` on PATH, not a live pi.
// Run: node --experimental-strip-types <this file>
const NANA_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
delete process.env.NANA_HANDOFF;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
const JOURNAL = path.join(NANA_HOME, "journal.jsonl");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: true, path: JOURNAL } }));

const mod = await import(new URL("../extensions/nana-handoff.ts", import.meta.url).href);
let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const journal = () => (fs.existsSync(JOURNAL) ? fs.readFileSync(JOURNAL, "utf-8") : "");

function session(cwd, hasUI = false) {
	const handlers = {};
	mod.default({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd, hasUI, ui: { notify() {} }, isProjectTrusted: () => true, sessionManager: { getSessionFile: () => "/s.jsonl" } };
	return {
		compact: (summary) => handlers.session_compact({ compactionEntry: { summary }, reason: "manual" }, ctx),
		prompt: async () => {
			await handlers.session_start({ reason: "startup" }, ctx);
			return (await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx))?.systemPrompt ?? "BASE";
		},
	};
}
const repo = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "handoff-role-")));
fs.mkdirSync(path.join(repo, ".pi"));
fs.writeFileSync(path.join(repo, ".pi", "handoff.md"), "LEGACY\n"); // even the legacy pointer is suppressed
const file = mod.storePathFor(repo);
await session(repo).compact("WRITER-STATE");
const before = fs.readFileSync(file);

process.env.NANA_HANDOFF = "off";
fs.rmSync(JOURNAL, { force: true });
{
	const s = session(repo, true); // hasUI true: the UI is not a role signal
	await s.compact("REVIEWER-STATE");
	// req: R-137
	check("marker: session_compact leaves the store byte-identical", Buffer.compare(before, fs.readFileSync(file)) === 0);
	check("marker: no temp litter", fs.readdirSync(path.dirname(file)).every((f) => !f.endsWith(".tmp")));
	// req: R-137
	check("marker: before_agent_start injects nothing", (await s.prompt()) === "BASE");
	const lines = journal().split("\n").filter((l) => l.includes('"handoff_skipped_role"'));
	// req: R-137
	check("marker: handoff_skipped_role journaled for write AND pickup", lines.some((l) => l.includes('"op":"write"')) && lines.some((l) => l.includes('"op":"pickup"')));
}
process.env.NANA_HANDOFF = "on";
// req: R-807
check("any other marker value: normal behaviour (picks up)", (await session(repo).prompt()).includes("WRITER-STATE"));
delete process.env.NANA_HANDOFF;
// req: R-807
check("no marker: normal behaviour (picks up)", (await session(repo).prompt()).includes("WRITER-STATE"));

// pi-review's child spawn env carries the marker (stub `pi` prints its env; zero model calls)
if (process.platform === "win32") console.log("SKIP pi-review spawn env: POSIX shell stub");
else {
	const bin = fs.mkdtempSync(path.join(os.tmpdir(), "stub-pi-"));
	fs.writeFileSync(path.join(bin, "pi"), '#!/bin/sh\necho "VERDICT: stub NANA_HANDOFF=${NANA_HANDOFF:-unset}"\n', { mode: 0o755 });
	const out = path.join(bin, "review.md");
	const piReview = fileURLToPath(new URL("../bin/pi-review.mjs", import.meta.url));
	const r = spawnSync(process.execPath, [piReview, "--item", "handoff-writer-role-test", "--out", out, "--poll", "1", "--stall-secs", "10", "--retries", "1", "--", "-p", "x"], {
		// HOME → the temp dir: the T2b review ledger this call writes must never be the real one
		env: { ...process.env, HOME: bin, USERPROFILE: bin, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
		encoding: "utf-8",
		timeout: 60_000,
	});
	const text = fs.existsSync(out) ? fs.readFileSync(out, "utf-8") : "";
	// req: R-139
	check("pi-review: child spawn env contains NANA_HANDOFF=off", r.status === 0 && text.includes("NANA_HANDOFF=off"));
	if (r.status !== 0) console.log(r.stderr);
	fs.rmSync(bin, { recursive: true, force: true });
}

fs.rmSync(repo, { recursive: true, force: true });
process.exit(fails);
