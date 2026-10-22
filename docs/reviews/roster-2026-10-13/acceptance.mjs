// Seat acceptance for lane roster (frozen; written by the seat 2026-10-13 before the build, after sol plan r3 LAND
// 9/10 and the "Seat amendment (2026-10-13): Node entry"). Run from the worktree root:
//   node docs/reviews/roster-2026-10-13/acceptance.mjs
// Spec: CHANGE.md §2 rows, §3 design, §4 scope, §5 "Seat acceptance, before and after the build".
// (control) today's pi-worker starts the stub pi and the stub records its argv, so no MISS below is the harness's.
// (a) no roster: lane pi-worker starts pi with today's builder and prints the builder line naming source default.
// (b) a valid machine roster in a scratch <agent dir>/nana-pack.json: the stub sees exactly its builder; the line
//     names the file; HOME's and the project's rosters are ignored; non-lane mode reads no roster.
// (c) every malformed roster shape CHANGE §5 lists (plus R-1122's "unreadable") is refused before the stub starts.
// (d) the roster command prints the resolved roster (default, file, `none`, `seat`) or a refusal on stderr.
// (e) shared text: the shared file and nana-soul carry shared-text.proposed.md's bullets byte for byte; AGENTS.md's
//     region equals the shared file; the roster pointer, Layout and the three Support lines; the pack README.
// (f) the Node-entry resolver, forced win32, against fake Windows volumes in scratch (one defect per refusal
//     fixture). The real Windows launch is Windows-leg evidence the seat reads from CI; it is listed, not faked.
// (g) rows R-1120–R-1128 against CHANGE §2's text, one `shall` each, placed as §2 says; R-961 and R-684 reworded;
//     the tree check. (h) scope: the branch diff against §4, the untouched files, and no cmd.exe path in the watchdog.
// POSIX only (the stub pi is a sh script). Every HOME, USERPROFILE, PI_CODING_AGENT_DIR, repo and worktree lives in
// one scratch folder under the OS temp dir, removed at the end; the real ~/.pi and ~/.claude are never touched.
// Line formats the seat reads from the contract: the roster command prints `<slot>: <provider> <model> <thinking>`
// per slot in the order scout, builder, reviewer, land, then `source: <default|file>` (R-1123 with §5's `land:
// seat` and `source: default`, and R-1124's "the same tokens the roster command prints"); pi-worker's refusal is
// `pi-worker: lane refused: roster refused: <file>: <problem>` (§3, laneFailure).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const LANE_DIR = path.join(root, "docs/reviews/roster-2026-10-13");
if (!fs.existsSync(path.join(LANE_DIR, "CHANGE.md"))) {
	console.error("run from the roster worktree root: node docs/reviews/roster-2026-10-13/acceptance.mjs");
	process.exit(2);
}
if (process.platform === "win32") {
	console.error("POSIX only: the stub pi is a sh script; the Windows evidence is win32-launch.test.mjs on the CI leg");
	process.exit(2);
}
let bad = 0, n = 0;
const out = (title, got, want, detail = "") => {
	n++;
	const ok = JSON.stringify(got) === JSON.stringify(want);
	if (!ok) bad++;
	console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got).slice(0, 300)} (want ${JSON.stringify(want).slice(0, 300)})${detail ? ` [${String(detail).replace(/\s+/g, " ").slice(0, 400)}]` : ""}`}`);
};
const windowsLeg = (what) => console.log(`WIN  ${what}`);
const read = (rel) => { try { return fs.readFileSync(path.join(root, rel)); } catch { return null; } };
const text = (rel) => read(rel)?.toString("utf8") ?? null;
const occurrences = (hay, needle) => { if (!hay || !needle) return 0; let k = 0, i = hay.indexOf(needle); while (i >= 0) { k++; i = hay.indexOf(needle, i + needle.length); } return k; };
const lines = (s) => (s ?? "").split("\n").filter((l, i, all) => !(l === "" && i === all.length - 1));

const PI_WORKER = path.join(root, "packages/nana-pack/bin/pi-worker.mjs");
const NANA_ROSTER = path.join(root, "packages/nana-pack/bin/nana-roster.mjs");
const WATCHDOG = path.join(root, "packages/nana-pack/bin/pi-watchdog.mjs");
const WIN_COMMAND = path.join(root, "packages/nana-pack/lib/win-command.mjs");
const SHARED = "templates/_shared/working-under-nana-pi.md";
const SOUL = "packages/nana-setup/claude/rules/nana-soul.md";
const BEGIN = "<!-- nana:working-under-nana-pi begin -->";
const END = "<!-- nana:working-under-nana-pi end -->";

// Contract values (R-1120, R-1124, R-961), literal by design in this seat script.
const DEFAULT_BUILDER = { provider: "openai-codex", model: "gpt-6-luna", thinking: "high" };
const TOOLS = "read,grep,find,bash,edit,write";
const DEFAULT_LINES = ["scout: none", "builder: openai-codex gpt-6-luna high", "reviewer: openai-codex gpt-5.6-sol default", "land: openai-codex gpt-6-astra default", "source: default"];
const PI_PACKAGE = "@earendil-works/pi-coding-agent";
const BOUNDED_READ_CAP = 1024 * 1024; // §3: readBounded (1 MiB)

const base = spawnSync("git", ["merge-base", "main", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();
const atBase = (rel) => spawnSync("git", ["show", `${base}:${rel}`], { cwd: root, encoding: "utf8" }).stdout ?? "";

// ---------------------------------------------------------------- scratch harness
const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "roster-accept-")));
const stubBin = path.join(scratch, "stub-bin");
fs.mkdirSync(stubBin);
const stubJs = path.join(scratch, "stub-pi.mjs");
fs.writeFileSync(stubJs, `import fs from "node:fs";
const record = process.env.ROSTER_ACCEPT_RECORD;
if (record) fs.appendFileSync(record, JSON.stringify({ argv: process.argv.slice(2), role: process.env.NANA_ROLE ?? null }) + "\\n");
console.log("stub pi: done");
`);
fs.writeFileSync(path.join(stubBin, "pi"), `#!/bin/sh\nexec "${process.execPath}" "${stubJs}" "$@"\n`);
fs.chmodSync(path.join(stubBin, "pi"), 0o755);
const home = path.join(scratch, "home");
fs.mkdirSync(home);
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^(NANA_|GIT_|PI_CODING_AGENT_DIR$|ROSTER_ACCEPT_)/.test(k)) delete env[k]; return env; };
const envFor = (agentDir, extra = {}) => ({ ...cleanEnv(), HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: agentDir, PATH: `${stubBin}${path.delimiter}${process.env.PATH}`, ...extra });
let agentCount = 0;
const newAgentDir = (label) => { const d = path.join(scratch, `agent-${++agentCount}-${label.replace(/\W+/g, "-").slice(0, 40)}`); fs.mkdirSync(d); return d; };
const userFile = (agentDir) => path.join(agentDir, "nana-pack.json");
const gitIn = (cwd, ...args) => spawnSync("git", ["-c", "user.name=seat", "-c", "user.email=seat@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", env: { ...cleanEnv(), HOME: home } });
const repo = path.join(scratch, "repo"), lane = path.join(scratch, "lane");
const LANE_NAME = "roster-accept";
fs.mkdirSync(repo);
gitIn(repo, "init", "-q", "-b", "main");
fs.writeFileSync(path.join(repo, "seed.txt"), "seed\n");
gitIn(repo, "add", "seed.txt");
gitIn(repo, "commit", "-qm", "seed");
gitIn(repo, "worktree", "add", "-qb", `feat/${LANE_NAME}`, lane);
let laneLock = null;
try { laneLock = path.join(fs.realpathSync(path.resolve(lane, gitIn(lane, "rev-parse", "--git-dir").stdout.trim())), "nana-lane.lock"); } catch { /* harness case below reports it */ }
const brief = path.join(scratch, "brief.md");
fs.writeFileSync(brief, "Acceptance brief: do nothing.\n");
const INSTRUCTION = `Do the work in your brief for lane ${LANE_NAME}. Your cwd is the lane worktree. Finish with the report shape the brief gives.`;
let runCount = 0;
const readRecord = (file) => { try { return fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
const runWorker = (args, agentDir, { cwd = lane, extra = {} } = {}) => {
	const record = path.join(scratch, `record-${++runCount}.jsonl`);
	const outFile = path.join(scratch, `out-${runCount}.md`);
	const r = spawnSync(process.execPath, [PI_WORKER, "--poll", "0.1", "--stall-secs", "10", "--out", outFile, ...args], { cwd, env: envFor(agentDir, { ROSTER_ACCEPT_RECORD: record, ...extra }), encoding: "utf8", timeout: 60_000 });
	const calls = readRecord(record);
	return { status: r.status, stderr: r.stderr ?? "", calls, argv: calls[0]?.argv ?? null, lockLeft: laneLock ? fs.existsSync(laneLock) : null };
};
const laneRun = (agentDir, opts) => runWorker(["--lane", LANE_NAME, "--brief", brief], agentDir, opts);
const builderLines = (stderr) => stderr.split(/\r?\n/).filter((l) => l.startsWith("pi-worker: builder:"));
const builderLineFirst = (stderr) => { const i = stderr.indexOf("pi-worker: builder:"), j = stderr.indexOf("[pi-worker] attempt 1/1"); return i >= 0 && j >= 0 && i < j; };
const normalise = (argv) => (argv ?? []).map((a, i, all) => (all[i - 1] === "--name" ? "<name>" : all[i - 1] === "--append-system-prompt" && all.indexOf("--append-system-prompt") === i - 1 ? "<preamble>" : a));
const briefReal = fs.realpathSync(brief);
const laneArgv = (b) => ["--provider", b.provider, "--model", b.model, ...(b.thinking === null ? [] : ["--thinking", b.thinking]), "-t", TOOLS,
	"--append-system-prompt", "<preamble>", "--append-system-prompt", briefReal, "-p", INSTRUCTION, "--name", "<name>"];
const entry = (provider, model, thinking) => ({ provider, model, thinking });
const ROSTER = () => ({
	scout: entry("example-gateway", "gpt-6-luna", "medium"),
	builder: entry("example-gateway", "roster-accept-builder", "low"),
	reviewer: entry("example-gateway", "gpt-5.6-sol", null),
	land: null,
});
const writeRoster = (agentDir, roster, raw = null) => { fs.writeFileSync(userFile(agentDir), raw ?? JSON.stringify({ roster }, null, 2)); return userFile(agentDir); };
const restore = [];

try {
	// -------------------------------------------------------------- (control) the harness works on today's code
	out("(control) harness: the scratch lane worktree is on feat/roster-accept and its lock path resolved",
		[gitIn(lane, "branch", "--show-current").stdout.trim(), laneLock !== null], [`feat/${LANE_NAME}`, true]);
	const ctl = runWorker(["--", "-p", "control"], newAgentDir("control"));
	out("(control) non-lane pi-worker starts the stub pi by name: exit 0, one call, argv recorded", [ctl.status, ctl.calls.length, normalise(ctl.argv)], [0, 1, ["-p", "control", "--name", "<name>"]], ctl.stderr);

	// -------------------------------------------------------------- (a) no roster → today's builder, source default
	const a1 = laneRun(newAgentDir("a-absent"));
	out("(a) no nana-pack.json: lane pi-worker exits 0, the stub started once, the lock is released", [a1.status, a1.calls.length, a1.lockLeft], [0, 1, false], a1.stderr);
	out("(a) no nana-pack.json: the stub's argv is today's lane argv, openai-codex gpt-6-luna high (R-1120, R-961)", normalise(a1.argv), laneArgv(DEFAULT_BUILDER));
	out("(a) no nana-pack.json: stderr has exactly one builder line, naming source default (R-1124)", builderLines(a1.stderr), ["pi-worker: builder: openai-codex gpt-6-luna high; source: default"], a1.stderr);
	out("(a) no nana-pack.json: the builder line comes before [pi-worker] attempt 1/1 (R-1124)", builderLineFirst(a1.stderr), true);
	const aMac = newAgentDir("a-objective-only");
	writeRoster(aMac, null, JSON.stringify({ objective: { enabled: true, path: null, projectFile: null } }, null, 2));
	const a2 = laneRun(aMac);
	out("(a) a nana-pack.json with only an objective block (this Mac's shape): today's lane argv (R-1120)", [a2.status, normalise(a2.argv)], [0, laneArgv(DEFAULT_BUILDER)], a2.stderr);
	out("(a) a nana-pack.json with only an objective block: one builder line, source default (R-1124)", builderLines(a2.stderr), ["pi-worker: builder: openai-codex gpt-6-luna high; source: default"], a2.stderr);

	// -------------------------------------------------------------- (b) a valid machine roster replaces the builder
	const homeAgent = path.join(home, ".pi", "agent");
	fs.mkdirSync(homeAgent, { recursive: true });
	fs.writeFileSync(userFile(homeAgent), JSON.stringify({ roster: { ...ROSTER(), builder: entry("home-gateway", "home-model", "high") } })); // decoy: never read while PI_CODING_AGENT_DIR is set
	const bDir = newAgentDir("b-roster");
	const bFile = writeRoster(bDir, ROSTER());
	const b1 = laneRun(bDir);
	out("(b) machine roster: lane exits 0 and the stub started once", [b1.status, b1.calls.length], [0, 1], b1.stderr);
	out("(b) machine roster: the stub's argv carries example-gateway roster-accept-builder low, HOME's roster ignored (R-961, R-1121)",
		normalise(b1.argv), laneArgv(ROSTER().builder));
	out("(b) machine roster: exactly one builder line naming the file (R-1124)", builderLines(b1.stderr), [`pi-worker: builder: example-gateway roster-accept-builder low; source: ${bFile}`], b1.stderr);
	out("(b) machine roster: the builder line comes before [pi-worker] attempt 1/1 (R-1124)", builderLineFirst(b1.stderr), true);
	const bNull = newAgentDir("b-null-thinking");
	const bNullFile = writeRoster(bNull, { ...ROSTER(), builder: entry("example-gateway", "roster-accept-builder", null) });
	const b2 = laneRun(bNull);
	out("(b) builder thinking null: exit 0 and no --thinking in the stub's argv (R-961)", [b2.status, normalise(b2.argv)], [0, laneArgv(entry("example-gateway", "roster-accept-builder", null))], b2.stderr);
	out("(b) builder thinking null: the builder line says default and names the file (R-1124)", builderLines(b2.stderr), [`pi-worker: builder: example-gateway roster-accept-builder default; source: ${bNullFile}`], b2.stderr);
	const bMax = newAgentDir("b-max");
	writeRoster(bMax, { ...ROSTER(), builder: entry("example-gateway", "roster-accept-builder", "max") });
	const b3 = laneRun(bMax);
	out("(b) builder thinking max (pi's seventh level) is accepted and passed (R-1122, R-961)", [b3.status, normalise(b3.argv)], [0, laneArgv(entry("example-gateway", "roster-accept-builder", "max"))], b3.stderr);
	const projectPi = path.join(lane, ".pi");
	fs.mkdirSync(projectPi, { recursive: true });
	fs.writeFileSync(path.join(projectPi, "nana-pack.json"), JSON.stringify({ roster: { ...ROSTER(), builder: entry("project-gateway", "project-model", "low") } }));
	const b4 = laneRun(newAgentDir("b-project-only"));
	fs.rmSync(projectPi, { recursive: true, force: true });
	out("(b) a roster in the worktree's .pi/nana-pack.json with no user roster: today's lane argv (R-1121)", [b4.status, normalise(b4.argv)], [0, laneArgv(DEFAULT_BUILDER)], b4.stderr);
	out("(b) a roster in the worktree's .pi/nana-pack.json: the builder line says source default (R-1121, R-1124)", builderLines(b4.stderr), ["pi-worker: builder: openai-codex gpt-6-luna high; source: default"], b4.stderr);
	const bBadNonLane = newAgentDir("b-nonlane-malformed");
	writeRoster(bBadNonLane, "x");
	const b5 = runWorker(["--", "-p", "non-lane"], bBadNonLane);
	out("(b) non-lane pi-worker with a malformed roster: exit 0, the stub started, no builder line (§3, §6 item 7)", [b5.status, b5.calls.length, builderLines(b5.stderr).length], [0, 1, 0], b5.stderr);

	// -------------------------------------------------------------- (c) malformed rosters are refused before pi starts
	const shaped = (mutate) => { const r = ROSTER(); mutate(r); return r; };
	const SHAPES = [
		// [label, roster value (or raw file bytes via `raw`), token the problem must name]
		["missing slot land", shaped((r) => { delete r.land; }), "land"],
		["extra slot auditor", shaped((r) => { r.auditor = entry("example-gateway", "gpt-6-luna", null); }), "auditor"],
		["builder null", shaped((r) => { r.builder = null; }), "builder"],
		["builder \"x\"", shaped((r) => { r.builder = "x"; }), "builder"],
		["builder []", shaped((r) => { r.builder = []; }), "builder"],
		["reviewer null", shaped((r) => { r.reviewer = null; }), "reviewer"],
		["roster \"x\"", "x", "roster"],
		["roster null", null, "roster"],
		["builder missing provider", shaped((r) => { delete r.builder.provider; }), "provider"],
		["builder missing model", shaped((r) => { delete r.builder.model; }), "model"],
		["builder missing thinking", shaped((r) => { delete r.builder.thinking; }), "thinking"],
		["builder extra tools", shaped((r) => { r.builder.tools = "read"; }), "tools"],
		["builder provider \"\"", shaped((r) => { r.builder.provider = ""; }), "provider"],
		["builder model \"gpt 6\"", shaped((r) => { r.builder.model = "gpt 6"; }), "model"],
		["builder model with a line feed", shaped((r) => { r.builder.model = "gpt-6\nluna"; }), "model"],
		["builder thinking \"ultra\"", shaped((r) => { r.builder.thinking = "ultra"; }), "thinking"],
		// The whole roster is the resolver's input, not the builder alone (R-1122 "each entry").
		["scout model \"gpt 6\" (builder valid)", shaped((r) => { r.scout.model = "gpt 6"; }), "model"],
		["reviewer thinking \"ultra\" (builder valid)", shaped((r) => { r.reviewer.thinking = "ultra"; }), "thinking"],
	];
	const FILE_SHAPES = [
		["invalid JSON", (f) => fs.writeFileSync(f, "{\"roster\": ")],
		["UTF-16LE with its byte-order mark", (f) => fs.writeFileSync(f, Buffer.from(`\ufeff${JSON.stringify({ roster: ROSTER() })}`, "utf16le"))],
		["top level []", (f) => fs.writeFileSync(f, "[]")],
		["top level null", (f) => fs.writeFileSync(f, "null")],
		["a directory", (f) => fs.mkdirSync(f)],
		["a valid roster padded past the 1 MiB cap", (f) => fs.writeFileSync(f, JSON.stringify({ roster: ROSTER() }) + " ".repeat(BOUNDED_READ_CAP))],
		["a dangling symlink", (f) => fs.symlinkSync(path.join(path.dirname(f), "missing-target.json"), f)],
		...(process.getuid?.() === 0 ? [] : [["mode 000 (unreadable)", (f) => { fs.writeFileSync(f, JSON.stringify({ roster: ROSTER() })); fs.chmodSync(f, 0o000); restore.push(() => fs.chmodSync(f, 0o644)); }]]),
	];
	const refusalProblem = (stderr, file) => {
		const prefix = `pi-worker: lane refused: roster refused: ${file}: `;
		const line = stderr.split(/\r?\n/).find((l) => l.startsWith(prefix));
		return line === undefined ? null : line.slice(prefix.length);
	};
	for (const [label, roster, token] of SHAPES) {
		const dir = newAgentDir(`c-${label}`);
		const file = writeRoster(dir, roster);
		const r = laneRun(dir);
		const problem = refusalProblem(r.stderr, file);
		out(`(c) ${label}: exit 1, stub not started, no lock, refusal names the file and ${JSON.stringify(token)} (R-1122, R-961)`,
			[r.status, r.calls.length, r.lockLeft, problem !== null && problem.includes(token)], [1, 0, false, true], r.stderr.split("\n").find((l) => l.includes("refused")) ?? r.stderr);
	}
	for (const [label, arrange] of FILE_SHAPES) {
		const dir = newAgentDir(`c-file-${label}`);
		const file = userFile(dir);
		arrange(file);
		const r = laneRun(dir);
		const problem = refusalProblem(r.stderr, file);
		out(`(c) nana-pack.json ${label}: exit 1, stub not started, no lock, refusal names the file (R-1122, R-961)`,
			[r.status, r.calls.length, r.lockLeft, problem !== null && problem.length > 0], [1, 0, false, true], r.stderr.split("\n").find((l) => l.includes("refused")) ?? r.stderr);
	}

	// -------------------------------------------------------------- (d) the roster command
	const project = path.join(scratch, "project");
	fs.mkdirSync(project);
	const roster = (agentDir, cwd = project) => {
		const r = spawnSync(process.execPath, [NANA_ROSTER], { cwd, env: envFor(agentDir), encoding: "utf8", timeout: 30_000 });
		return { status: r.status, stdout: lines(r.stdout), stderr: r.stderr ?? "" };
	};
	const d1 = roster(newAgentDir("d-absent"));
	out("(d) no nana-pack.json: exit 0, the default roster, source default, nothing on stderr (R-1123, R-1120)", [d1.status, d1.stdout, d1.stderr], [0, DEFAULT_LINES, ""], d1.stderr);
	const dSeat = newAgentDir("d-seat");
	const dSeatFile = writeRoster(dSeat, ROSTER());
	const seatLines = ["scout: example-gateway gpt-6-luna medium", "builder: example-gateway roster-accept-builder low", "reviewer: example-gateway gpt-5.6-sol default", "land: seat", `source: ${dSeatFile}`];
	const d2 = roster(dSeat);
	out("(d) machine roster with a null land: `land: seat`, `default` for a null thinking, source the file; HOME's roster ignored (R-1123, R-1121)", [d2.status, d2.stdout], [0, seatLines], d2.stderr);
	const dNone = newAgentDir("d-none");
	const dNoneFile = writeRoster(dNone, { ...ROSTER(), scout: null, land: entry("example-gateway", "gpt-6-astra", "high") });
	const d3 = roster(dNone);
	out("(d) machine roster with a null scout and a set land: `scout: none`, every slot exactly as written (R-1123, R-1121)", [d3.status, d3.stdout],
		[0, ["scout: none", "builder: example-gateway roster-accept-builder low", "reviewer: example-gateway gpt-5.6-sol default", "land: example-gateway gpt-6-astra high", `source: ${dNoneFile}`]], d3.stderr);
	const dBom = newAgentDir("d-bom-crlf");
	const dBomFile = writeRoster(dBom, null, `\ufeff${JSON.stringify({ roster: ROSTER() }, null, 2).replace(/\n/g, "\r\n")}\r\n`);
	const d4 = roster(dBom);
	out("(d) a roster saved with a BOM and CRLF line endings is read (R-1121)", [d4.status, d4.stdout], [0, seatLines.map((l) => (l.startsWith("source: ") ? `source: ${dBomFile}` : l))], d4.stderr);
	const dMac = newAgentDir("d-objective-only");
	writeRoster(dMac, null, JSON.stringify({ objective: { enabled: true, path: null, projectFile: null } }));
	const d5 = roster(dMac);
	out("(d) a nana-pack.json with only an objective block: the default roster, source default (R-1120)", [d5.status, d5.stdout], [0, DEFAULT_LINES], d5.stderr);
	fs.mkdirSync(path.join(project, ".pi"), { recursive: true });
	fs.writeFileSync(path.join(project, ".pi", "nana-pack.json"), JSON.stringify({ roster: { ...ROSTER(), builder: entry("project-gateway", "project-model", "low") } }));
	const d6 = roster(newAgentDir("d-project"));
	out("(d) a project .pi/nana-pack.json roster in the cwd is never read: the default roster (R-1121)", [d6.status, d6.stdout], [0, DEFAULT_LINES], d6.stderr);
	const notDir = path.join(scratch, "agent-dir-is-a-file");
	fs.writeFileSync(notDir, "a regular file where the agent dir should be\n");
	const d7 = roster(notDir);
	out("(d) PI_CODING_AGENT_DIR names a regular file (ENOTDIR): absent, so the default roster (R-1120, §3)", [d7.status, d7.stdout], [0, DEFAULT_LINES], d7.stderr);
	const dBad = newAgentDir("d-refused");
	const dBadFile = writeRoster(dBad, shaped((r) => { r.builder.thinking = "ultra"; }));
	const d8 = roster(dBad);
	out("(d) a refused roster: exit 1, nothing on stdout, stderr names the file and the field (R-1123, R-1122)", [d8.status, d8.stdout, d8.stderr.includes(dBadFile) && d8.stderr.includes("thinking")], [1, [], true], d8.stderr);
	const dJson = newAgentDir("d-invalid-json");
	const dJsonFile = userFile(dJson);
	fs.writeFileSync(dJsonFile, "{");
	const d9 = roster(dJson);
	out("(d) invalid JSON: exit 1, nothing on stdout, stderr names the file (R-1123, R-1122)", [d9.status, d9.stdout, d9.stderr.includes(dJsonFile)], [1, [], true], d9.stderr);

	// -------------------------------------------------------------- (f) the Node-entry resolver, forced win32
	let mod = null, modError = "";
	try { mod = await import(pathToFileURL(WATCHDOG).href); } catch (e) { modError = e.message; }
	const { findPi } = await import(pathToFileURL(WIN_COMMAND).href);
	const DIR = Symbol("dir");
	let volumes = 0;
	const fakeVolume = () => {
		const vroot = path.join(scratch, "win", `v${++volumes}`);
		fs.mkdirSync(vroot, { recursive: true });
		const segs = (p) => { const m = /^([A-Za-z]):\\(.*)$/.exec(path.win32.resolve(p)); return m ? [m[1].toUpperCase(), ...m[2].split("\\").filter(Boolean)] : null; };
		const child = (dir, name) => { try { return fs.readdirSync(dir).find((e) => e.toLowerCase() === name.toLowerCase()); } catch { return undefined; } };
		const host = (p) => { // names fold case, as NTFS looks them up
			const s = segs(p);
			if (!s) return null;
			let dir = vroot;
			for (const name of s) { const hit = child(dir, name); if (hit === undefined) return null; dir = path.join(dir, hit); }
			return dir;
		};
		const put = (p, content) => {
			const s = segs(p);
			let dir = vroot;
			for (const name of s.slice(0, -1)) { const hit = child(dir, name); dir = path.join(dir, hit ?? name); fs.mkdirSync(dir, { recursive: true }); }
			const target = path.join(dir, s.at(-1));
			if (content === DIR) fs.mkdirSync(target, { recursive: true }); else fs.writeFileSync(target, content);
		};
		return {
			put,
			exists: (p) => { const h = host(p); try { return h !== null && !fs.lstatSync(h).isDirectory(); } catch { return false; } }, // findPi's own rule
			isFile: (p) => { const h = host(p); try { return h !== null && fs.statSync(h).isFile(); } catch { return false; } },
			readText: (p) => { const h = host(p); if (h === null) throw Object.assign(new Error(`ENOENT: no such file or directory, open '${p}'`), { code: "ENOENT" }); return fs.readFileSync(h, "utf8"); },
		};
	};
	// npm cmd-shim 7.0.0's template, as written for pi (research-node-entry.md §3).
	const CMD_SHIM = "@ECHO off\r\nGOTO start\r\n:find_dp0\r\nSET dp0=%~dp0\r\nEXIT /b\r\n:start\r\nSETLOCAL\r\nCALL :find_dp0\r\n\r\nIF EXIST \"%dp0%\\node.exe\" (\r\n  SET \"_prog=%dp0%\\node.exe\"\r\n) ELSE (\r\n  SET \"_prog=node\"\r\n  SET PATHEXT=%PATHEXT:;.JS;=;%\r\n)\r\n\r\nendLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & \"%_prog%\"  \"%dp0%\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js\" %*\r\n";
	const pkgJson = (over = {}) => JSON.stringify({ name: PI_PACKAGE, version: "0.0.0-fake", bin: { pi: "dist/bundle/cli.js" }, ...over });
	const npmPackage = (v, folder, { pkg = pkgJson(), entryKind = "file" } = {}) => {
		const dir = `${folder}\\@earendil-works\\pi-coding-agent`;
		if (pkg !== null) v.put(`${dir}\\package.json`, pkg);
		if (entryKind === "file") v.put(`${dir}\\dist\\bundle\\cli.js`, "#!/usr/bin/env node\n");
		if (entryKind === "dir") v.put(`${dir}\\dist\\bundle\\cli.js`, DIR);
		return dir;
	};
	const npmGlobal = (opts = {}, shim = "pi.cmd") => { const v = fakeVolume(); v.put("C:\\a\\readme.txt", "an earlier PATH folder with no pi\n"); v.put(`C:\\npm\\${shim}`, CMD_SHIM); npmPackage(v, "C:\\npm\\node_modules", opts); return v; };
	const EXEC = "C:\\Program Files\\nodejs\\node.exe";
	const PI_ARGS = ["--append-system-prompt", "line one\nline two\r\nline three", "-p", "a%PATH%b !x! \"q\" ^&|<>", "trailing\\", "--name", "pi-worker-a1-12345"];
	const GLOBAL_ENTRY = "C:\\npm\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js";
	const PATH_GLOBAL = "C:\\a;C:\\npm";
	const launch = (v, PATH, platform = "win32") => {
		if (typeof mod?.piLaunch !== "function") return `piLaunch is not exported by pi-watchdog.mjs${modError ? ` (${modError})` : ""}`;
		try {
			const r = mod.piLaunch([...PI_ARGS], { platform, env: { PATH }, cwd: "C:\\work", exists: v.exists, isFile: v.isFile, readText: v.readText, execPath: EXEC });
			return { command: r?.command, args: r?.args, refused: r?.refused };
		} catch (e) { return `piLaunch threw: ${e.message}`; }
	};
	const g1 = npmGlobal();
	out("(f) harness: findPi with the fake volume's exists finds C:\\npm\\pi.cmd on PATH C:\\a;C:\\npm", findPi({ env: { PATH: PATH_GLOBAL }, cwd: "C:\\work", exists: g1.exists }), "C:\\npm\\pi.cmd");
	out("(f) npm global layout: node runs the package's pi bin entry, arguments unchanged (LF, CRLF, %, !, \", trailing \\) (R-1125)", launch(g1, PATH_GLOBAL), { command: EXEC, args: [GLOBAL_ENTRY, ...PI_ARGS] });
	out("(f) npm global layout with PI.CMD on disk: the same launch (R-1125)", launch(npmGlobal({}, "PI.CMD"), PATH_GLOBAL), { command: EXEC, args: [GLOBAL_ENTRY, ...PI_ARGS] });
	out("(f) npm global layout with a string bin: the same launch (R-1125)", launch(npmGlobal({ pkg: pkgJson({ bin: "dist/bundle/cli.js" }) }), PATH_GLOBAL), { command: EXEC, args: [GLOBAL_ENTRY, ...PI_ARGS] });
	out("(f) npm global layout with a pi.bat shim: the same launch (R-1125)", launch(npmGlobal({}, "pi.bat"), PATH_GLOBAL), { command: EXEC, args: [GLOBAL_ENTRY, ...PI_ARGS] });
	const dotBin = (pathDir) => { const v = fakeVolume(); v.put("C:\\p\\node_modules\\.bin\\pi.cmd", CMD_SHIM); npmPackage(v, "C:\\p\\node_modules"); return launch(v, pathDir); };
	out("(f) npm .bin layout: node runs <shim folder>\\..\\<package>'s entry (R-1125)", dotBin("C:\\p\\node_modules\\.bin"),
		{ command: EXEC, args: ["C:\\p\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js", ...PI_ARGS] });
	const flipped = dotBin("C:\\p\\Node_Modules\\.BIN");
	out("(f) npm .bin layout spelled Node_Modules\\.BIN on PATH: the same entry, compared ignoring case (R-1125)",
		typeof flipped === "string" ? flipped : { command: flipped.command, entry: flipped.args?.[0]?.toLowerCase(), rest: flipped.args?.slice(1), refused: flipped.refused },
		{ command: EXEC, entry: "c:\\p\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js", rest: PI_ARGS });
	const exeVol = fakeVolume();
	exeVol.put("C:\\npm\\PI.EXE", "MZ");
	npmPackage(exeVol, "C:\\npm\\node_modules"); // a package beside it too, so a .exe sent through node is a wrong answer, not a refusal
	const exePath = findPi({ env: { PATH: PATH_GLOBAL }, cwd: "C:\\work", exists: exeVol.exists });
	out("(f) harness: findPi returns its own lowercase candidate C:\\npm\\pi.exe for PI.EXE on disk", exePath, "C:\\npm\\pi.exe");
	out("(f) a located pi.exe starts directly: command is findPi's return, arguments unchanged (R-1125)", launch(exeVol, PATH_GLOBAL), { command: exePath, args: PI_ARGS });
	const comVol = fakeVolume();
	comVol.put("C:\\npm\\pi.com", "MZ");
	out("(f) a located pi.com starts directly (R-1125)", launch(comVol, PATH_GLOBAL), { command: "C:\\npm\\pi.com", args: PI_ARGS });
	for (const platform of ["darwin", "linux"]) {
		out(`(f) ${platform}: pi by name with the arguments unchanged, even with an npm pi.cmd on the injected PATH (R-1125, K7)`, launch(npmGlobal(), PATH_GLOBAL, platform), { command: "pi", args: PI_ARGS });
	}
	// Refusals: each fixture is the valid npm global layout with exactly one defect.
	const refusal = (r, fragments) => (typeof r === "string" ? r : { started: r.command !== undefined, refused: typeof r.refused === "string" && r.refused.length > 0, names: fragments.filter((f) => !String(r.refused ?? "").includes(f)) });
	const REFUSED = { started: false, refused: true, names: [] };
	const NO_PACKAGE = ["pnpm", "Volta", "pi.dev"];
	const REFUSALS = [
		["no pi on PATH", () => [npmGlobal(), "C:\\a"], ["pi is not on PATH"]],
		["a Volta-shaped pi.cmd, no package beside it", () => { const v = fakeVolume(); v.put("C:\\Users\\u\\AppData\\Local\\Volta\\bin\\pi.cmd", "@echo off\r\nvolta run %~n0 %*\r\n"); return [v, "C:\\Users\\u\\AppData\\Local\\Volta\\bin"]; }, NO_PACKAGE],
		["a pnpm-global-shaped pi.cmd, package under global\\v11", () => { const v = fakeVolume(); v.put("C:\\Users\\u\\AppData\\Local\\pnpm\\bin\\pi.cmd", "@SETLOCAL\r\n\"%~dp0\\..\\global\\v11\\abc123\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js\" %*\r\n"); npmPackage(v, "C:\\Users\\u\\AppData\\Local\\pnpm\\global\\v11\\abc123\\node_modules"); return [v, "C:\\Users\\u\\AppData\\Local\\pnpm\\bin"]; }, NO_PACKAGE],
		["a pi.dev-managed-shaped pi.cmd, package under install\\releases", () => { const v = fakeVolume(); v.put("C:\\Users\\u\\.pi\\agent\\bin\\pi.cmd", "@ECHO off\r\nnode \"%~dp0pi-launcher.js\" %*\r\n"); v.put("C:\\Users\\u\\.pi\\agent\\bin\\pi-launcher.js", "// launcher\n"); npmPackage(v, "C:\\Users\\u\\.pi\\agent\\install\\releases\\1.0.2\\node_modules"); return [v, "C:\\Users\\u\\.pi\\agent\\bin"]; }, NO_PACKAGE],
		["package.json names another package (valid bin, entry present)", () => [npmGlobal({ pkg: pkgJson({ name: "@earendil-works/not-pi" }) }), PATH_GLOBAL], ["package.json"]],
		["package.json is invalid JSON", () => [npmGlobal({ pkg: "{\"name\": " }), PATH_GLOBAL], ["package.json"]],
		["package.json declares no bin", () => [npmGlobal({ pkg: JSON.stringify({ name: PI_PACKAGE, version: "0.0.0-fake" }) }), PATH_GLOBAL], ["bin"]],
		["package.json's bin object has no pi key", () => [npmGlobal({ pkg: pkgJson({ bin: { "pi-other": "dist/bundle/cli.js" } }) }), PATH_GLOBAL], ["bin"]],
		["the bin escapes the package (..\\..\\..\\evil.js, C:\\npm\\evil.js present)", () => { const v = npmGlobal({ pkg: pkgJson({ bin: { pi: "..\\..\\..\\evil.js" } }) }); v.put("C:\\npm\\evil.js", "// outside\n"); return [v, PATH_GLOBAL]; }, ["outside"]],
		["the entry is missing", () => [npmGlobal({ entryKind: "none" }), PATH_GLOBAL], ["cli.js"]],
		["the entry is a directory", () => [npmGlobal({ entryKind: "dir" }), PATH_GLOBAL], ["cli.js"]],
	];
	for (const [label, arrange, fragments] of REFUSALS) {
		const [v, PATH] = arrange();
		out(`(f) refused, nothing to start: ${label}; the reason names ${fragments.map((f) => JSON.stringify(f)).join(", ")} (R-1125)`, refusal(launch(v, PATH), fragments), REFUSED);
	}
	for (const title of [
		"Windows: lane pi-worker prints the builder line and starts the npm-installed pi entry with node and the lane argv",
		"Windows: non-lane pi-worker hands pi line breaks, %, !, quotes and a trailing backslash unchanged",
		"Windows: pi-review hands the review standard to pi as text",
		"Windows: a busy pi is not stopped as stalled",
		"Windows: a pi.cmd with no npm package beside it starts nothing and leaves no capture directory",
		"Windows: lane pi-worker starts pi from a short or differently cased worktree path",
	]) windowsLeg(`(f) read from the draft PR's Windows leg on the reviewed tip, PASS required: "${title}"`);
	windowsLeg("(f) read from the tests-first run: all ten win32-launch titles FAIL, each for a named cause (piLaunch missing, spawn pi ENOENT, cwd is not the repository root, or no pi launch refused line)");
	windowsLeg("(f) read from the Windows leg: the `INFO Windows pi-review revision: <revision>` line; `+snap` makes §6 item 15 a named carry");
} finally {
	for (const undo of restore) { try { undo(); } catch { /* best effort */ } }
	fs.rmSync(scratch, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (e) shared text, AGENTS.md, nana-soul, READMEs
const proposed = fs.readFileSync(path.join(LANE_DIR, "shared-text.proposed.md"), "utf8");
const baseShared = atBase(SHARED);
const OVERRIDES = "\n- Project-specific overrides";
const sharedAt = baseShared.indexOf(OVERRIDES);
out("(e) harness: the base shared file has a Project-specific overrides bullet and the proposal is two whole lines", [sharedAt > 0, proposed.endsWith("\n") && lines(proposed).length === 2], [true, true]);
const shared = text(SHARED) ?? "";
const expectedShared = baseShared.slice(0, sharedAt + 1) + proposed + baseShared.slice(sharedAt + 1);
out("(e) the shared file is the base copy with the two proposed bullets inserted before Project-specific overrides (R-1126, R-1127)", shared === expectedShared, true,
	`base ${baseShared.length} bytes, now ${shared.length}, expected ${expectedShared.length}`);
out("(e) the shared file carries the proposed bullets byte for byte, once", occurrences(shared, `\n${proposed}`), 1);
const agents = text("AGENTS.md") ?? "";
const b = agents.indexOf(`${BEGIN}\n`), e = agents.indexOf(`\n${END}`, b + 1);
const region = b < 0 || e < 0 ? null : agents.slice(b + BEGIN.length + 1, e + 1);
out("(e) AGENTS.md's shared region is byte-identical to the shared file (R-859)", region === shared, true);
const baseSoul = atBase(SOUL);
const AVOID = "\n\n## What to avoid";
const soulAt = baseSoul.indexOf(AVOID);
const soul = text(SOUL) ?? "";
const expectedSoul = baseSoul.slice(0, soulAt + 1) + proposed + baseSoul.slice(soulAt + 1);
out("(e) nana-soul is the base copy with the two proposed bullets ending Work habits (R-1128)", soulAt > 0 && soul === expectedSoul, true, `base ${baseSoul.length} bytes, now ${soul.length}, expected ${expectedSoul.length}`);
out("(e) nana-soul carries the proposed bullets byte for byte, once (R-1128)", occurrences(soul, `\n${proposed}`), 1);
const outside = b < 0 || e < 0 ? agents : agents.slice(0, b) + agents.slice(e + END.length + 1);
out("(e) AGENTS.md names no reference_roster", occurrences(agents, "reference_roster"), 0);
const POINTER = "See the shared working pattern below for the defaults and the roster command. Local overrides are explicit in each project.";
out("(e) AGENTS.md's pointer line reads as §3 gives it, once, outside the region", agents.split("\n").filter((l) => l === POINTER).length === 1 && outside.includes(POINTER), true);
const layoutPack = outside.split("\n").findIndex((l) => l.startsWith("- `packages/nana-pack/`"));
const layoutBlock = layoutPack < 0 ? "" : outside.split("\n").slice(layoutPack, outside.split("\n").findIndex((l, i) => i > layoutPack && /^- `/.test(l))).join("\n");
out("(e) AGENTS.md's Layout entry for packages/nana-pack/ names nana-roster", /nana-roster/.test(layoutBlock), true);
let link = null;
try { link = fs.lstatSync(path.join(root, "CLAUDE.md")).isSymbolicLink() ? fs.readlinkSync(path.join(root, "CLAUDE.md")) : "not a symlink"; } catch { link = "absent"; }
out("(e) CLAUDE.md is still a symlink to AGENTS.md", link, "AGENTS.md");
const OLD_LAUNCHERS = "and the review and builder launchers are unavailable;";
const NEW_LAUNCHERS = "and the review and builder launchers run through node from the checkout with an npm-installed pi;";
const baseSupport = atBase("AGENTS.md").split("\n").filter((l) => l.startsWith("Support:"));
out("(e) harness: the base AGENTS.md has one Support line holding the old launcher clause", baseSupport.length === 1 && baseSupport[0].includes(OLD_LAUNCHERS), true);
const canonical = (baseSupport[0] ?? "").replace(OLD_LAUNCHERS, NEW_LAUNCHERS);
for (const rel of ["AGENTS.md", "README.md", "packages/nana-setup/README.md"]) {
	out(`(e) ${rel} carries exactly one Support line, equal to R-684's new canonical line`, (text(rel) ?? "").split("\n").filter((l) => l.startsWith("Support:")), [canonical]);
}
const packReadme = text("packages/nana-pack/README.md") ?? "";
const section = (md, heading) => { const at = md.split("\n").findIndex((l) => l === heading); if (at < 0) return null; const rest = md.split("\n").slice(at + 1); const end = rest.findIndex((l) => /^#{1,4} /.test(l)); return rest.slice(0, end < 0 ? undefined : end).join("\n"); };
const laneBuilder = section(packReadme, "#### Lane builder");
out("(e) pack README's Lane builder names the builder line and drops the literal roster (§3)", [laneBuilder !== null && laneBuilder.includes("pi-worker: builder:"), /gpt-6-luna|openai-codex/.test(laneBuilder ?? "")], [true, false]);
out("(e) pack README has a Machine roster subsection with the example-gateway example and the roster command (§3)",
	[packReadme.split("\n").filter((l) => /^#{2,5} Machine roster\b/.test(l)).length, packReadme.includes("example-gateway"), packReadme.includes('node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"')], [1, true, true]);
out("(e) pack README gives the Windows launcher form node \"$HOME/…/pi-worker.mjs\" and the quoted \"@<full path>\" brief (§3)",
	[packReadme.includes('node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs"'), packReadme.includes('"@<full path>"')], [true, true]);

// ---------------------------------------------------------------- (g) rows R-1120..R-1128, R-961, R-684 and the tree
const change = fs.readFileSync(path.join(LANE_DIR, "CHANGE.md"), "utf8");
const delta = change.slice(change.indexOf("## 2. Requirement delta"), change.indexOf("## 3. Design"));
const drafts = new Map(delta.split("\n").filter((l) => /^\| R-\d+ \|/.test(l)).map((l) => { const c = l.split("|").map((s) => s.trim()); return [c[1], c[3].replace(/\s*Evidence note:.*$/, "")]; }));
const reqLines = (text("REQUIREMENTS.md") ?? "").split("\n");
const rowAt = (id) => reqLines.findIndex((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
const cells = (id) => { const i = rowAt(id); return i < 0 ? [] : reqLines[i].split(/(?<!\\)\|/).map((s) => s.trim()); };
const headingOf = (i) => { for (let k = i; k >= 0; k--) if (/^#{2,3} /.test(reqLines[k])) return reqLines[k].replace(/ ·.*$/, "").replace(/^#+ /, ""); return null; };
out("(g) harness: CHANGE §2 gives draft text for R-961 and R-1120–R-1128", ["R-961", ...Array.from({ length: 9 }, (_, k) => `R-${1120 + k}`)].every((id) => (drafts.get(id) ?? "").includes("shall")), true);
for (let id = 1120; id <= 1128; id++) {
	const rows = reqLines.filter((l) => new RegExp(`^\\|\\s*R-${id}\\s*\\|`).test(l));
	const cell = cells(`R-${id}`)[2] ?? "";
	out(`(g) R-${id} is one row with exactly one "shall"`, [rows.length, (cell.match(/\bshall\b/gi) ?? []).length], [1, 1]);
	out(`(g) R-${id}'s text is CHANGE §2's`, cell, drafts.get(`R-${id}`) ?? "(no draft)");
}
const r961 = cells("R-961");
out("(g) R-961 reworded: CHANGE §2's text, one \"shall\", the dated evidence note", [r961[2] === drafts.get("R-961"), ((r961[2] ?? "").match(/\bshall\b/gi) ?? []).length, (r961[4] ?? "").includes("reworded 2026-10-13 (roster lane)")], [true, 1, true], r961[2]);
const r684 = cells("R-684");
out("(g) R-684 reworded: the launcher clause runs through node with an npm-installed pi, one \"shall\"",
	[(r684[2] ?? "").includes("and the review and builder launchers run through node from the checkout with an npm-installed pi; launchd macOS-only"), (r684[2] ?? "").includes("launchers unavailable"), ((r684[2] ?? "").match(/\bshall\b/gi) ?? []).length], [true, false, 1], r684[2]);
out("(g) evidence notes: R-1120 names Owner's roles, R-1125 names review-ledger run as not covered", [(cells("R-1120")[4] ?? "").includes("Owner named the roles (2026-10-06)"), (cells("R-1125")[4] ?? "").includes("review-ledger run")], [true, true]);
const SECTION = { "R-1120": "FEAT-006", "R-1121": "FEAT-006", "R-1122": "FEAT-006", "R-1123": "FEAT-006", "R-1124": "FEAT-006", "R-1125": "FEAT-006", "R-1126": "SUB-019", "R-1127": "SUB-019", "R-1128": "SUB-012" };
out("(g) each new row sits under the heading §2 names", Object.entries(SECTION).filter(([id, h]) => rowAt(id) < 0 || headingOf(rowAt(id)) !== h).map(([id]) => id), []);
const AFTER = [["R-1120", "R-961"], ["R-1124", "R-1123"], ["R-1125", "R-1124"], ["R-1126", "R-1104"], ["R-1127", "R-1126"], ["R-1128", "R-301"]];
out("(g) each placed row follows the row §2 names, on the next line", AFTER.filter(([id, prev]) => rowAt(id) < 0 || rowAt(prev) < 0 || rowAt(id) !== rowAt(prev) + 1).map(([id, prev]) => `${id} after ${prev}`), []);
const f7 = reqLines.findIndex((l) => l.startsWith("## FEAT-007 "));
const f7Also = reqLines.slice(f7, reqLines.findIndex((l, i) => i > f7 && /^#{2,3} /.test(l))).find((l) => l.startsWith("Also applies:")) ?? "";
out("(g) FEAT-007's Also applies line gains R-1125", /\bR-1125\b/.test(f7Also), true, f7Also);
const tree = spawnSync(process.execPath, ["scripts/requirements-tree.mjs", "--check"], { cwd: root, encoding: "utf8" });
out("(g) node scripts/requirements-tree.mjs --check exits 0", tree.status, 0, tree.stderr);

// ---------------------------------------------------------------- (h) scope: the branch diff against §4
// §4 "In.", quoted: "Code (four files, budget five): `packages/nana-pack/bin/` `worker-config.mjs`, `pi-worker.mjs`,
// `nana-roster.mjs` (new), `pi-watchdog.mjs`. Tests: `nana-roster` (new), `win32-launch` (new), `worker-lane`,
// `templates-render`, `requirements-tree`. Text: `nana-soul.md`, the shared file, `AGENTS.md` (Support line, region,
// `:66`, Layout), root `README.md` and nana-setup `README.md` (Support line only), pack README, `REQUIREMENTS.md`, the
// tree, the code map, HANDOFF and session entry before the final round, the corpus." A fifth code file, if the seat
// spends the budget's slot, is a seat amendment to this list.
const SCOPE = [
	"packages/nana-pack/bin/worker-config.mjs",
	"packages/nana-pack/bin/pi-worker.mjs",
	"packages/nana-pack/bin/nana-roster.mjs",
	"packages/nana-pack/bin/pi-watchdog.mjs",
	"packages/nana-pack/tests/nana-roster.test.mjs",
	"packages/nana-pack/tests/win32-launch.test.mjs",
	"packages/nana-pack/tests/worker-lane.test.mjs",
	"packages/nana-pack/tests/templates-render.test.mjs",
	"packages/nana-pack/tests/requirements-tree.test.mjs",
	"packages/nana-setup/claude/rules/nana-soul.md",
	"templates/_shared/working-under-nana-pi.md",
	"AGENTS.md",
	"README.md",
	"packages/nana-setup/README.md",
	"packages/nana-pack/README.md",
	"REQUIREMENTS.md",
	"docs/requirements-tree.md",
	"docs/code-map.md",
	"HANDOFF.md",
	"docs/sessions/2026-10.md",
  // seat, after build 1: the merged process lane's review-standard test copies the pack's bin and prompts; pi-watchdog now
  // imports win-command.mjs, so that fixture must copy it too (a forced 3-line test change, not a §4 omission)
  "packages/nana-pack/tests/review-standard.test.mjs",
];
const SCOPE_PREFIX = "docs/reviews/roster-2026-10-13/";
const diff = spawnSync("git", ["diff", "--name-only", "main...HEAD"], { cwd: root, encoding: "utf8" });
const changed = diff.stdout.split("\n").filter(Boolean);
out("(h) git diff --name-only main...HEAD lists only §4 paths and the lane's review folder", diff.status === 0 ? changed.filter((p) => !SCOPE.includes(p) && !p.startsWith(SCOPE_PREFIX)) : `git exit ${diff.status}`, []);
const NOT = ["packages/nana-pack/bin/pi-review.mjs", "packages/nana-pack/bin/review-ledger.mjs", "packages/nana-pack/bin/review-round.mjs", "packages/nana-pack/bin/nana-land.mjs",
	"packages/nana-pack/lib/win-command.mjs", "packages/nana-pack/lib/win-command-config.mjs", "packages/nana-setup/lib"];
const notDiff = spawnSync("git", ["diff", "--name-only", "main...HEAD", "--", ...NOT], { cwd: root, encoding: "utf8" });
out("(h) empty merge-base diff on pi-review, review-ledger, review-round, nana-land, win-command(-config) and nana-setup/lib (§4 NOT)", notDiff.status === 0 ? notDiff.stdout.split("\n").filter(Boolean) : `git exit ${notDiff.status}`, []);
const watchdogSrc = text("packages/nana-pack/bin/pi-watchdog.mjs") ?? "";
out("(h) pi-watchdog.mjs names no winCommand, no shell option and no verbatim arguments (§3)", [/winCommand/.test(watchdogSrc), /\bshell\s*:/.test(watchdogSrc), /windowsVerbatimArguments/.test(watchdogSrc)], [false, false, false]);

console.log(`cases: ${n - bad}/${n}`);
console.log(`roster acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
