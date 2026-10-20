/**
 * @module packages/nana-pack/tests/handoff-writer-role.test.mjs
 * @purpose Pins that a session whose launcher set NANA_HANDOFF=off neither picks up nor writes the handoff, and that the role is never inferred from the tool list or the UI
 * @inputs extensions/nana-handoff.ts, bin/pi-review.mjs, a stub `pi` on PATH (./fake-pi.mjs on win32), a temp HOME and a scratch git repository
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, store files, a scratch git repository under the OS temp dir), process (sets HOME and NANA_HANDOFF, spawns pi-review with the stub pi on PATH, cwd the scratch repo)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
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
const NANA_HOME = tmpDir(path.join(os.tmpdir(), "nana-home-"));
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
			const event = { systemPromptOptions: { sections: {} } }; await handlers.before_agent_start(event, ctx); return `BASE${event.systemPromptOptions.sections["nana-handoff"] ?? ""}`;
		},
	};
}
const repo = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "handoff-role-")));
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
check("any other marker value: normal behaviour (picks up)", (await session(repo).prompt()).includes("WRITER-STATE"));
delete process.env.NANA_HANDOFF;
check("no marker: normal behaviour (picks up)", (await session(repo).prompt()).includes("WRITER-STATE"));

// marker: every value OTHER than the exact lowercase "off" — unset, "on", a differently-cased
// variant, and "off" with a leading or trailing space — is a normal writer, never the
// non-writer role (R-138, R-807).
const markerCases = [undefined, "on", "OFF", "Off", " off", "off "];
const markerResults = [];
for (const value of markerCases) {
	if (value === undefined) delete process.env.NANA_HANDOFF;
	else process.env.NANA_HANDOFF = value;
	fs.rmSync(JOURNAL, { force: true });
	const summary = `MARKER-STATE-${JSON.stringify(value)}`;
	await session(repo).compact(summary);
	const stored = fs.readFileSync(file, "utf-8").includes(summary);
	const injected = (await session(repo).prompt()).includes(summary);
	const j = journal();
	markerResults.push({
		value,
		stored,
		injected,
		written: j.includes('"handoff_written"'),
		pickup: j.includes('"handoff_pickup"'),
		skippedRole: j.includes('"handoff_skipped_role"'),
	});
}
delete process.env.NANA_HANDOFF;
// req: R-138
check("marker: OFF, Off and off with a leading or trailing space journal no handoff_skipped_role", markerResults.every((r) => !r.skippedRole));
// req: R-807
check("marker: unset, on, OFF, Off and off with a leading or trailing space each write the summary and a fresh session picks it up", markerResults.every((r) => r.stored && r.injected && r.written && r.pickup));

// pi-review's child spawn env carries the marker (stub `pi` prints its env; zero model calls).
// cwd is a one-commit scratch git repo, never this checkout: pi-review's admission flow runs
// `git worktree add`/`remove` against its cwd and copies its tracked files into a temp checkout,
// which in a lane worktree registers a worktree against the main checkout's shared git folder.
const scratchRoot = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "handoff-writer-role-")));
const stubBin = path.join(scratchRoot, "stub-bin");
if (process.platform === "win32") {
	writeFakePi(stubBin, `console.log("stub NANA_HANDOFF=" + (process.env.NANA_HANDOFF || "unset"));
console.log("VERDICT: LAND");
`);
} else {
	fs.mkdirSync(stubBin);
	fs.writeFileSync(path.join(stubBin, "pi"), '#!/bin/sh\necho "stub NANA_HANDOFF=${NANA_HANDOFF:-unset}"\necho "VERDICT: LAND"\n', { mode: 0o755 });
}
const reviewRepo = path.join(scratchRoot, "review-repo");
fs.mkdirSync(reviewRepo);
const git = (...args) => spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: reviewRepo, encoding: "utf8" });
git("init", "-q", "-b", "main");
fs.writeFileSync(path.join(reviewRepo, "seed.txt"), "seed\n");
git("add", "seed.txt");
git("commit", "-qm", "seed");
const out = path.join(scratchRoot, "review.md"); // outside reviewRepo
const piReview = fileURLToPath(new URL("../bin/pi-review.mjs", import.meta.url));
const r = spawnSync(process.execPath, [piReview, "--item", "handoff-writer-role-test", "--out", out, "--poll", "1", "--stall-secs", "10", "--retries", "1", "--", "-p", "x"], {
	cwd: reviewRepo,
	// HOME → the temp dir: the T2b review ledger this call writes must never be the real one
	env: { ...process.env, HOME: scratchRoot, USERPROFILE: scratchRoot, PATH: `${stubBin}${path.delimiter}${process.env.PATH}` },
	encoding: "utf-8",
	timeout: 60_000,
});
const text = fs.existsSync(out) ? fs.readFileSync(out, "utf-8") : "";
// req: R-139 R-1683
check("pi-review: child spawn env contains NANA_HANDOFF=off", r.status === 0 && text.includes("NANA_HANDOFF=off"));
if (r.status !== 0) console.log(r.stderr);
fs.rmSync(scratchRoot, { recursive: true, force: true });

fs.rmSync(repo, { recursive: true, force: true });
process.exit(fails);
