/**
 * @module packages/nana-pack/tests/lifecycle-journal.test.mjs
 * @purpose Pins that each of the five session lifecycle events leaves exactly one journal line
 *  carrying the session cwd and the process pid, and that the session_start and session_shutdown
 *  lines carry pi's reason for that event
 * @inputs extensions/nana-lifecycle.ts and a nana-pack.json under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, config file and journal file), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected
 *  throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
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

// The session cwd this run journals from, and the journal file the user config points at.
const TD = tmpDir(path.join(os.tmpdir(), "lifecycle-journal-"));
const JOURNAL_PATH = path.join(TD, "journal.jsonl");
fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: true, path: JOURNAL_PATH } }));

// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-lifecycle.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };

// Register the real extension; registerCommand is a no-op here — /reload-runtime is
// lifecycle-reload.test.mjs's job, not this file's.
const handlers = {};
ext({ on: (name, fn) => { handlers[name] = fn; }, registerCommand: () => {} });

const ctx = { cwd: TD, hasUI: false, isProjectTrusted: () => true };

// Each of the five events, fired once, with the reason pi would carry on that event (session_start
// and session_shutdown are the only two pi 1.0.2 types give a reason on).
const CASES = [
	["session_start", "resume"],
	["session_before_compact", "threshold"],
	["session_compact", "manual"],
	["session_compact_failed", "overflow"],
	["session_shutdown", "fork"],
];
for (const [type, reason] of CASES) await handlers[type]({ type, reason }, ctx);

// loadConfig may add its own config_* diagnostic lines (none expected here, since the user
// config is well-formed) — filter by event name so a diagnostic line cannot be mistaken for
// one of the five lifecycle lines.
const lines = fs
	.readFileSync(JOURNAL_PATH, "utf-8")
	.trim()
	.split("\n")
	.filter(Boolean)
	.map((l) => JSON.parse(l));
const byEvent = (name) => lines.filter((l) => l.event === name);

const perEventOk = CASES.every(([type]) => {
	const matches = byEvent(type);
	return matches.length === 1 && matches[0].cwd === TD && matches[0].pid === process.pid;
});
// req: R-162
check("journal: each of the five lifecycle events leaves one line with the session cwd and this pid",
	perEventOk,
	JSON.stringify(CASES.map(([type]) => [type, byEvent(type)])),
);

const startLine = byEvent("session_start")[0];
const shutdownLine = byEvent("session_shutdown")[0];
// req: R-2140
check("journal: the session_start and session_shutdown lines carry pi's reason",
	startLine?.reason === "resume" && shutdownLine?.reason === "fork",
	JSON.stringify({ start: startLine?.reason, shutdown: shutdownLine?.reason }),
);

fs.rmSync(TD, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
