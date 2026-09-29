// U2 fix round (MUST E, 2026-09-28): ONE agent-dir resolution across packages. For an absolute,
// a relative and a tilde PI_CODING_AGENT_DIR (and unset), the desk (/api/settings paths) and
// nana-setup (resolveLayout().piHome) resolve exactly piAgentDir(); `--home` keeps the installer
// hermetic (an ambient PI_CODING_AGENT_DIR is not read, and the install writes under <home>).
// U2 fix round 2 (sol r2 HIGH): the desk, the resolver and a session the desk SPAWNS now run from
// three DIFFERENT cwds, so a relative value that each process resolved for itself would show up
// as a split. The desk pins its resolved absolute dir into every child; absolute/tilde/unset pass
// through untouched. The spawned "pi" is a stub that records the dir it resolves with pi's rule.
// Run: node --experimental-strip-types packages/nana-pack/tests/agent-dir-parity.test.mjs
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SERVER = path.join(REPO, "apps", "desk", "server.mjs");
const SETUP_BIN = path.join(REPO, "packages", "nana-setup", "bin", "nana-setup.mjs");
const HOME = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "nana-u2p-")));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
process.chdir(HOME); // the relative case resolves against the process cwd; every child starts here too

const { piAgentDir } = await import(new URL("../lib/gate-paths.ts", import.meta.url).href);
const { resolvePiBin, resolvePiPackage } = await import(new URL("../../../apps/desk/pi-session.mjs", import.meta.url).href);
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const DESK_CWD = path.join(HOME, "desk-cwd"); // the desk's own start folder
const PROJECT = path.join(HOME, "project"); // where the desk starts a session
const BIN = path.join(HOME, "bin");
const STUB_OUT = path.join(HOME, "stub-out.jsonl");
for (const d of [DESK_CWD, PROJECT, BIN]) fs.mkdirSync(d);
// stub pi: records its cwd, the raw env value and the dir pi's own rule resolves it to (agent-dir.mjs
// IS that rule, resolved against THIS process's cwd), then answers get_state and idles.
fs.writeFileSync(path.join(BIN, "pi"), `#!/usr/bin/env node
import(${JSON.stringify(path.join(REPO, "packages", "nana-pack", "lib", "agent-dir.mjs"))}).then(({ piAgentDir }) => {
	require("node:fs").appendFileSync(process.env.STUB_OUT, JSON.stringify({ cwd: process.cwd(), raw: process.env.PI_CODING_AGENT_DIR ?? null, dir: piAgentDir() }) + "\\n");
});
let buf = "";
process.stdin.on("data", (c) => {
	buf += c;
	for (let nl; (nl = buf.indexOf("\\n")) >= 0; ) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		if (cmd.type === "get_state") process.stdout.write(JSON.stringify({ type: "response", id: cmd.id, command: cmd.type, success: true, data: { isStreaming: false, sessionFile: "/tmp/stub.jsonl", model: { provider: "stub", id: "stub" }, thinkingLevel: "off" } }) + "\\n");
	}
});
`, { mode: 0o755 });
const { resolveLayout } = await import(new URL("../../nana-setup/lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : extra); if (!ok) fails++; };

function get(port, p) {
	return new Promise((resolve, reject) => {
		http.get({ host: "127.0.0.1", port, path: p, headers: { host: `127.0.0.1:${port}` } }, (res) => {
			let b = "";
			res.on("data", (c) => (b += c));
			res.on("end", () => resolve(JSON.parse(b)));
		}).on("error", reject);
	});
}

function post(port, p, body) {
	return fetch(`http://127.0.0.1:${port}${p}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
}

// The desk runs in DESK_CWD; it starts one session in PROJECT and returns /api/settings + what that session resolved.
async function deskSettings(env) {
	fs.rmSync(STUB_OUT, { force: true });
	const child = spawn(process.execPath, [SERVER], { cwd: DESK_CWD, env: { ...process.env, ...env, HOME, DESK_PORT: "0", DESK_APPS_DIR: path.join(HOME, "no-apps"), DESK_PI_ROOT: PI_ROOT, STUB_OUT, PATH: `${BIN}${path.delimiter}${process.env.PATH}` }, stdio: ["ignore", "pipe", "pipe"] });
	let log = "";
	child.stdout.on("data", (c) => (log += c));
	child.stderr.on("data", (c) => (log += c));
	try {
		const t0 = Date.now();
		let port = null;
		while (!port && Date.now() - t0 < 15000) {
			port = Number(/http:\/\/127\.0\.0\.1:(\d+)/.exec(log)?.[1]) || null;
			if (!port) await new Promise((r) => setTimeout(r, 50));
		}
		if (!port) throw new Error(`desk did not start: ${log}`);
		const settings = await get(port, "/api/settings");
		const sp = await post(port, "/api/spawn", { cwd: PROJECT });
		let session = null;
		for (const t0 = Date.now(); !session && Date.now() - t0 < 10000; await new Promise((r) => setTimeout(r, 50)))
			session = fs.existsSync(STUB_OUT) ? JSON.parse(fs.readFileSync(STUB_OUT, "utf-8").split("\n")[0] || "null") : null;
		if (!session) throw new Error(`spawned session never reported: ${JSON.stringify(sp)} ${log}`);
		return { settings, session };
	} finally {
		child.kill();
	}
}

const FORMS = [
	["unset", undefined],
	["absolute", path.join(HOME, "abs-agent")],
	["relative", "rel-agent"],
	["tilde", "~/tilde-agent"],
];

for (const [name, value] of FORMS) {
	if (value === undefined) delete process.env.PI_CODING_AGENT_DIR;
	else process.env.PI_CODING_AGENT_DIR = value;
	const want = piAgentDir();
	const expected = value === undefined ? path.join(HOME, ".pi", "agent") : value === "rel-agent" ? path.join(HOME, "rel-agent") : value.startsWith("~") ? path.join(HOME, "tilde-agent") : value;
	check(`[${name}] piAgentDir() is pi's resolution`, want === expected, want);

	const layout = resolveLayout({});
	check(`[${name}] nana-setup piHome === piAgentDir()`, layout.piHome === want, layout.piHome);
	check(`[${name}] nana-setup piPackConfig is the file the pack reads`, layout.piPackConfig === path.join(want, "nana-pack.json"), layout.piPackConfig);
	check(`[${name}] nana-setup default objective is in the active dir`, layout.piObjective === path.join(want, "nana-objective.md"), layout.piObjective);

	check(`[${name}] nana-setup flags a cwd-specific piHome exactly when the value is relative`, !!layout.piHomeCwdRelative === (value === "rel-agent"), String(layout.piHomeCwdRelative));

	// the desk resolves in ITS cwd (DESK_CWD), not this process's (HOME)
	const deskWant = value === "rel-agent" ? path.join(DESK_CWD, "rel-agent") : want;
	const { settings: s, session } = await deskSettings(value === undefined ? {} : { PI_CODING_AGENT_DIR: value });
	check(`[${name}] desk nanaPath === <desk's active dir>/nana-pack.json`, s.nanaPath === path.join(deskWant, "nana-pack.json"), s.nanaPath);
	check(`[${name}] desk settingsPath / mcpPath / agentsDir / piDir follow it`, s.settingsPath === path.join(deskWant, "settings.json") && s.mcpPath === path.join(deskWant, "mcp.json") && s.agentsDir === path.join(deskWant, "agents") && s.piDir === deskWant, JSON.stringify(s));
	check(`[${name}] the spawned session really ran in a DIFFERENT cwd than the desk`, session.cwd === PROJECT, session.cwd);
	check(`[${name}] a session spawned in another cwd resolves the SAME dir the desk shows`, session.dir === s.piDir, `${session.dir} vs desk ${s.piDir}`);
	if (value === "rel-agent") {
		check("[relative] the desk pinned the absolute dir into the child env", session.raw === deskWant, session.raw);
		check("[relative] /api/settings tells the user it pinned, naming the dir", typeof s.agentDirNote === "string" && s.agentDirNote.includes("relative") && s.agentDirNote.includes(deskWant), String(s.agentDirNote));
	} else {
		check(`[${name}] the value reaches the child untouched`, session.raw === (value ?? null), String(session.raw));
		check(`[${name}] no pin note`, s.agentDirNote === null, String(s.agentDirNote));
	}
}

// ── --home hermeticity: an ambient PI_CODING_AGENT_DIR must not leak into a --home run ──
{
	const ambient = path.join(HOME, "ambient-agent");
	process.env.PI_CODING_AGENT_DIR = ambient;
	const tmpHome = path.join(HOME, "hermetic-home");
	fs.mkdirSync(tmpHome);
	const l = resolveLayout({ home: tmpHome });
	check("--home: piHome is <home>/.pi/agent, not the ambient env", l.piHome === path.join(tmpHome, ".pi", "agent"), l.piHome);
	check("--home: piHomeSource names the flag", l.piHomeSource === "--home", l.piHomeSource);
	const lp = resolveLayout({ home: tmpHome, piHome: path.join(HOME, "explicit") });
	check("--pi-home beats --home and the env", lp.piHome === path.join(HOME, "explicit"), lp.piHome);
	const r = spawnSync(process.execPath, [SETUP_BIN, "install", "--home", tmpHome], { cwd: HOME, env: { ...process.env, HOME: tmpHome, USERPROFILE: tmpHome, PI_CODING_AGENT_DIR: ambient }, encoding: "utf-8" });
	check("--home install exits 0 with an ambient PI_CODING_AGENT_DIR", r.status === 0, r.stdout + r.stderr);
	const seeded = path.join(tmpHome, ".pi", "agent", "nana-pack.json");
	check("--home install seeds <home>/.pi/agent/nana-pack.json", fs.existsSync(seeded));
	check("--home install writes nothing into the ambient agent dir", !fs.existsSync(ambient));
	const seed = JSON.parse(fs.readFileSync(seeded, "utf-8"));
	check("seed pins no objective.path (the pack's active-dir default applies)", seed.objective && !("path" in seed.objective), JSON.stringify(seed));
	const d = spawnSync(process.execPath, [SETUP_BIN, "doctor", "--home", tmpHome], { cwd: HOME, env: { ...process.env, HOME: tmpHome, USERPROFILE: tmpHome, PI_CODING_AGENT_DIR: ambient }, encoding: "utf-8" });
	check("--home doctor checks <home>/.pi/agent and says why", d.stdout.includes(`${path.join(tmpHome, ".pi", "agent")} (--home)`), d.stdout);
	check("--home doctor: the objective file it checks is in <home>/.pi/agent", d.stdout.includes(path.join(tmpHome, ".pi", "agent", "nana-objective.md")), d.stdout);
	delete process.env.PI_CODING_AGENT_DIR;
}

// ── exactly ONE implementation of the resolver in the repo ──
{
	const hits = spawnSync("git", ["grep", "-n", "-E", "PI_CODING_AGENT_DIR;?$|process\\.env\\.PI_CODING_AGENT_DIR", "--", "*.ts", "*.mjs", "*.js", ":!**/tests/**", ":!**/test/**"], { cwd: REPO, encoding: "utf-8" }).stdout.trim().split("\n").filter(Boolean);
	const files = [...new Set(hits.map((h) => h.split(":")[0]))];
	// apps/bench hands the raw value to pi's own pricer API (pi resolves it) — not a second resolver.
	const allowed = new Set(["packages/nana-pack/lib/agent-dir.mjs", "apps/bench/lib/pi-exports.mjs"]);
	check("PI_CODING_AGENT_DIR is resolved only by agent-dir.mjs", files.every((f) => allowed.has(f)), hits.join("\n"));
}

fs.rmSync(HOME, { recursive: true, force: true });
console.log(fails ? `${fails} FAIL` : "all PASS");
process.exit(fails ? 1 : 0);
