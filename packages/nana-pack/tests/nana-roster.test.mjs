/**
 * @module packages/nana-pack/tests/nana-roster.test.mjs
 * @purpose Pin the machine roster resolver and command: the sealed default, a valid machine
 *  roster, every refused shape, and the printed lines.
 * @inputs nana-roster.mjs's resolveRoster/validateRosterShape/formatRosterLines, worker-config.mjs's
 *  ROSTER_DEFAULTS/LANE_DEFAULTS, and spawned nana-roster.mjs CLI runs under a temp HOME
 * @outputs named PASS/FAIL checks
 * @effects disk (temp fixtures), process (spawns the roster CLI)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin", "nana-roster.mjs");
const { resolveRoster, validateRosterShape, formatRosterLines } = await import(new URL("../bin/nana-roster.mjs", import.meta.url).href);
const { ROSTER_DEFAULTS, LANE_DEFAULTS } = await import(new URL("../bin/worker-config.mjs", import.meta.url).href);

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };

const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "nana-roster-")));
let agentCount = 0;
const freshAgentDir = (label) => { const d = path.join(temp, `agent-${++agentCount}-${label}`); fs.mkdirSync(d, { recursive: true }); return d; };
const entry = (provider, model, thinking) => ({ provider, model, thinking });
const sampleRoster = () => ({
	scout: entry("example-gateway", "gpt-6-luna", "medium"),
	builder: entry("example-gateway", "roster-model", "low"),
	reviewer: entry("example-gateway", "gpt-5.6-sol", null),
	land: null,
});
const writeRosterRaw = (dir, bytes) => { const f = path.join(dir, "nana-pack.json"); fs.writeFileSync(f, bytes); return f; };
const writeRoster = (dir, roster) => writeRosterRaw(dir, JSON.stringify({ roster }));

// req: R-1120
check("sealed default roster is luna high builder, sol reviewer, astra land and no scout",
	ROSTER_DEFAULTS.scout === null &&
	JSON.stringify(ROSTER_DEFAULTS.builder) === JSON.stringify({ provider: "openai-codex", model: "gpt-6-luna", thinking: "high" }) &&
	JSON.stringify(ROSTER_DEFAULTS.reviewer) === JSON.stringify({ provider: "openai-codex", model: "gpt-5.6-sol", thinking: null }) &&
	JSON.stringify(ROSTER_DEFAULTS.land) === JSON.stringify({ provider: "openai-codex", model: "gpt-6-astra", thinking: null }) &&
	ROSTER_DEFAULTS.builder.provider === LANE_DEFAULTS.provider && ROSTER_DEFAULTS.builder.model === LANE_DEFAULTS.model && ROSTER_DEFAULTS.builder.thinking === LANE_DEFAULTS.thinking,
	JSON.stringify(ROSTER_DEFAULTS));

{
	const enoentDir = path.join(freshAgentDir("absent-enoent"), "missing-nested");
	const r1 = resolveRoster(enoentDir);
	const fileAsDir = freshAgentDir("absent-enotdir-base");
	fs.writeFileSync(path.join(fileAsDir, "placeholder"), "x");
	const r2 = resolveRoster(path.join(fileAsDir, "placeholder"));
	// req: R-1120
	check("absent user nana-pack.json yields the default roster",
		r1.ok && r1.roster === ROSTER_DEFAULTS && r1.source === "default" &&
		r2.ok && r2.roster === ROSTER_DEFAULTS && r2.source === "default",
		JSON.stringify([r1, r2]));
}

{
	const dir = freshAgentDir("no-roster-key");
	writeRosterRaw(dir, JSON.stringify({ objective: { enabled: true, path: null, projectFile: null } }));
	const r = resolveRoster(dir);
	// req: R-1120
	check("user nana-pack.json without a roster yields the default roster", r.ok && r.roster === ROSTER_DEFAULTS && r.source === "default", JSON.stringify(r));
}

{
	const dir = freshAgentDir("valid-roster");
	const roster = { ...sampleRoster(), scout: null, land: null };
	const file = writeRoster(dir, roster);
	const r = resolveRoster(dir);
	// req: R-1121
	check("a valid machine roster replaces every slot, keeping a null scout and a null land",
		r.ok && r.source === file &&
		r.roster.scout === null && r.roster.land === null &&
		JSON.stringify(r.roster.builder) === JSON.stringify(roster.builder) &&
		JSON.stringify(r.roster.reviewer) === JSON.stringify(roster.reviewer),
		JSON.stringify(r));
}

{
	const dir = freshAgentDir("bom-crlf");
	const roster = sampleRoster();
	const file = writeRosterRaw(dir, `﻿${JSON.stringify({ roster }, null, 2).replace(/\n/g, "\r\n")}\r\n`);
	const r = resolveRoster(dir);
	// req: R-1121
	check("a machine roster saved with a byte-order mark and CRLF line endings is read",
		r.ok && r.source === file && JSON.stringify(r.roster.builder) === JSON.stringify(roster.builder) && r.roster.land === null,
		JSON.stringify(r));
}

{
	const homeAgent = path.join(temp, "home-root", ".pi", "agent");
	fs.mkdirSync(homeAgent, { recursive: true });
	writeRoster(homeAgent, { ...sampleRoster(), builder: entry("home-gateway", "home-model", "high") }); // decoy
	const realDir = freshAgentDir("pi-coding-agent-dir");
	const file = writeRoster(realDir, sampleRoster());
	const r = spawnSync(process.execPath, [cli], { encoding: "utf8", env: { ...process.env, HOME: path.join(temp, "home-root"), USERPROFILE: path.join(temp, "home-root"), PI_CODING_AGENT_DIR: realDir } });
	const lines = r.stdout.split("\n").filter(Boolean);
	// req: R-1121
	check("the roster is read from PI_CODING_AGENT_DIR, not the home agent dir",
		r.status === 0 && lines.includes("builder: example-gateway roster-model low") && lines.includes(`source: ${file}`),
		JSON.stringify({ status: r.status, stdout: r.stdout, stderr: r.stderr }));
}

{
	const dir = freshAgentDir("project-roster-ignored");
	writeRoster(dir, sampleRoster());
	const projectCwd = path.join(temp, "project-cwd");
	fs.mkdirSync(path.join(projectCwd, ".pi"), { recursive: true });
	fs.writeFileSync(path.join(projectCwd, ".pi", "nana-pack.json"), JSON.stringify({ roster: { ...sampleRoster(), builder: entry("project-gateway", "project-model", "low") } }));
	// resolveRoster takes only the agent dir; a cwd holding its own project roster changes nothing.
	const before = process.cwd();
	process.chdir(projectCwd);
	let r;
	try { r = resolveRoster(dir); } finally { process.chdir(before); }
	// req: R-1121
	check("a project .pi/nana-pack.json roster is never read",
		r.ok && r.roster.builder.provider === "example-gateway" && r.roster.builder.model === "roster-model",
		JSON.stringify(r));
}

{
	const shaped = (mutate) => { const r = sampleRoster(); mutate(r); return r; };
	const SHAPES = [
		["missing slot land", shaped((r) => { delete r.land; }), "land"],
		["extra slot auditor", shaped((r) => { r.auditor = entry("example-gateway", "gpt-6-luna", null); }), "auditor"],
		["builder null", shaped((r) => { r.builder = null; }), "builder"],
		["builder string", shaped((r) => { r.builder = "x"; }), "builder"],
		["builder array", shaped((r) => { r.builder = []; }), "builder"],
		["reviewer null", shaped((r) => { r.reviewer = null; }), "reviewer"],
		["roster string", "x", "roster"],
		["roster null", null, "roster"],
		["builder missing provider", shaped((r) => { delete r.builder.provider; }), "provider"],
		["builder missing model", shaped((r) => { delete r.builder.model; }), "model"],
		["builder missing thinking", shaped((r) => { delete r.builder.thinking; }), "thinking"],
		["builder extra tools", shaped((r) => { r.builder.tools = "read"; }), "tools"],
		["builder provider empty", shaped((r) => { r.builder.provider = ""; }), "provider"],
		["builder model with a space", shaped((r) => { r.builder.model = "gpt 6"; }), "model"],
		["builder model with a line feed", shaped((r) => { r.builder.model = "gpt-6\nluna"; }), "model"],
		["builder thinking ultra", shaped((r) => { r.builder.thinking = "ultra"; }), "thinking"],
		["builder thinking max is accepted", shaped((r) => { r.builder.thinking = "max"; }), null],
		["scout model with a space, builder valid", shaped((r) => { r.scout.model = "gpt 6"; }), "model"],
		["reviewer thinking ultra, builder valid", shaped((r) => { r.reviewer.thinking = "ultra"; }), "thinking"],
	];
	const results = SHAPES.map(([label, roster, token]) => {
		const { roster: ok, problem } = validateRosterShape(roster);
		if (token === null) return [label, ok !== undefined && !problem];
		return [label, Boolean(problem) && problem.includes(token)];
	});
	// req: R-1122
	check("each invalid roster shape is refused naming the slot or field",
		results.every(([, pass]) => pass),
		JSON.stringify(results.filter(([, pass]) => !pass)));
}

{
	const FILE_SHAPES = [
		["invalid JSON", (f) => fs.writeFileSync(f, "{\"roster\": ")],
		["top level is an array", (f) => fs.writeFileSync(f, "[]")],
		["top level is null", (f) => fs.writeFileSync(f, "null")],
		["a directory", (f) => fs.mkdirSync(f)],
		["a valid roster padded past the 1 MiB cap", (f) => fs.writeFileSync(f, JSON.stringify({ roster: sampleRoster() }) + " ".repeat(1024 * 1024))],
		...(process.platform === "win32" ? [] : [["a dangling symlink", (f) => fs.symlinkSync(path.join(path.dirname(f), "missing-target.json"), f)]]),
		...(process.getuid?.() === 0 ? [] : [["mode 000 (unreadable)", (f) => { fs.writeFileSync(f, JSON.stringify({ roster: sampleRoster() })); fs.chmodSync(f, 0o000); }]]),
	];
	const results = FILE_SHAPES.map(([label, arrange]) => {
		const dir = freshAgentDir(`file-shape-${label.replace(/\W+/g, "-")}`);
		const file = path.join(dir, "nana-pack.json");
		arrange(file);
		const r = resolveRoster(dir);
		if (label.startsWith("mode 000")) fs.chmodSync(file, 0o644);
		return [label, !r.ok && r.file === file && typeof r.problem === "string" && r.problem.length > 0];
	});
	if (process.platform === "win32") console.log("SKIP a dangling symlink: POSIX symlinks (win32)");
	// req: R-1122
	check("an unreadable or malformed user nana-pack.json is refused naming the file",
		results.every(([, pass]) => pass),
		JSON.stringify(results.filter(([, pass]) => !pass)));
}

{
	const dirDefault = freshAgentDir("print-default");
	const rDefault = spawnSync(process.execPath, [cli], { encoding: "utf8", env: { ...process.env, HOME: dirDefault, USERPROFILE: dirDefault, PI_CODING_AGENT_DIR: dirDefault } });
	const dirSeatNone = freshAgentDir("print-seat-none");
	const file = writeRoster(dirSeatNone, { ...sampleRoster(), scout: null, land: null });
	const rFile = spawnSync(process.execPath, [cli], { encoding: "utf8", env: { ...process.env, PI_CODING_AGENT_DIR: dirSeatNone } });
	// req: R-1123
	check("roster command prints one line per slot and the source",
		rDefault.status === 0 && rDefault.stdout === "scout: none\nbuilder: openai-codex gpt-6-luna high\nreviewer: openai-codex gpt-5.6-sol default\nland: openai-codex gpt-6-astra default\nsource: default\n" &&
		rFile.status === 0 && rFile.stdout === `scout: none\nbuilder: example-gateway roster-model low\nreviewer: example-gateway gpt-5.6-sol default\nland: seat\nsource: ${file}\n`,
		JSON.stringify({ rDefault, rFile }));
}

{
	const dir = freshAgentDir("print-refused");
	const file = writeRoster(dir, { ...sampleRoster(), builder: null });
	const r = spawnSync(process.execPath, [cli], { encoding: "utf8", env: { ...process.env, PI_CODING_AGENT_DIR: dir } });
	// req: R-1123
	check("roster command prints a refused roster on stderr and exits 1",
		r.status === 1 && r.stdout === "" && r.stderr.includes(file) && r.stderr.includes("builder"),
		JSON.stringify(r));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
