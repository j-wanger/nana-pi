// U2 astra land (MUST 2, MUST 3): widening the agent-dir resolution must not split a producer from
// its consumer.
//   MUST 2 — under an ABSOLUTE ambient PI_CODING_AGENT_DIR the installer's knowledge home is the
//            nana-knowledge RUNTIME default (<home>/.pi/agent/nana-knowledge), which never reads
//            that variable; the explicit --pi-home / --home flags still place it.
//   MUST 3 — the RENDERED desk plist carries the directory the installer chose, because launchd
//            does not inherit the installing shell's environment; the default dir renders nothing.
// Run with --experimental-strip-types (the runtime paths module is TypeScript). Nothing here calls
// launchctl: every install passes --claude-home, so the layout is never the real home.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const PATHS = new URL("../lib/paths.mjs", import.meta.url).href;
const KPATHS = new URL("../../nana-knowledge/lib/paths.ts", import.meta.url).href;

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const HOME = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-adc-")));
const CUSTOM = path.join(HOME, "custom-agent"); // absolute override
const baseEnv = { ...process.env, HOME, USERPROFILE: HOME };
delete baseEnv.NANA_KNOWLEDGE_HOME;
delete baseEnv.PI_CODING_AGENT_DIR;

// Both resolvers, each in a fresh process with the env under test (they read env at call time,
// but os.homedir() and the resolver must see exactly what a real run would).
function paths(env, opts = {}) {
	const src = `const L = await import(${JSON.stringify(PATHS)}); const K = await import(${JSON.stringify(KPATHS)});
		const l = L.resolveLayout(${JSON.stringify(opts)}); console.log(JSON.stringify({ piHome: l.piHome, knowledgeHome: l.knowledgeHome, runtime: K.home() }));`;
	const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", src], { env, encoding: "utf-8" });
	if (r.status !== 0) throw new Error(r.stderr);
	return JSON.parse(r.stdout);
}

try {
	// ── MUST 2 ──
	const amb = paths({ ...baseEnv, PI_CODING_AGENT_DIR: CUSTOM });
	check("MUST 2: the ambient absolute override still moves piHome", amb.piHome === CUSTOM, JSON.stringify(amb));
	check("MUST 2: installer knowledgeHome == the nana-knowledge runtime default under that override",
		amb.knowledgeHome === amb.runtime && amb.runtime === path.join(HOME, ".pi", "agent", "nana-knowledge"), JSON.stringify(amb));
	const dflt = paths(baseEnv);
	check("MUST 2: with no override the two agree too", dflt.knowledgeHome === dflt.runtime, JSON.stringify(dflt));
	const flagged = paths({ ...baseEnv, PI_CODING_AGENT_DIR: CUSTOM }, { piHome: path.join(HOME, "flag-agent") });
	check("MUST 2: an explicit --pi-home still places it", flagged.knowledgeHome === path.join(HOME, "flag-agent", "nana-knowledge"), JSON.stringify(flagged));
	const homed = paths(baseEnv, { home: path.join(HOME, "h2") });
	check("MUST 2: --home still places it", homed.knowledgeHome === path.join(HOME, "h2", ".pi", "agent", "nana-knowledge"), JSON.stringify(homed));

	if (process.platform !== "darwin") {
		console.log("SKIP MUST 3 — stepDesk writes a launchd plist on macOS only (no service definition elsewhere)");
	} else {
		// ── MUST 3: install --desk with the ambient absolute override, then read the RENDERED plist ──
		const kn = path.join(HOME, ".pi", "agent", "nana-knowledge");
		fs.mkdirSync(kn, { recursive: true });
		fs.writeFileSync(path.join(kn, "sources.json"), JSON.stringify({ roots: [] }));
		const plist = path.join(HOME, "Library", "LaunchAgents", "com.nana.pi-desk.plist");
		const r = spawnSync(process.execPath, [cli, "install", "--desk", "--claude-home", path.join(HOME, ".claude")],
			{ env: { ...baseEnv, PI_CODING_AGENT_DIR: CUSTOM }, encoding: "utf-8" });
		check("MUST 3: install --desk under an absolute override exits 0", r.status === 0, r.stdout + r.stderr);
		check("MUST 3: launchctl was not called", r.stdout.includes("not loaded"), r.stdout);
		const body = fs.existsSync(plist) ? fs.readFileSync(plist, "utf-8") : "";
		check("MUST 3: the rendered plist exports PI_CODING_AGENT_DIR = the chosen dir",
			body.includes(`<key>PI_CODING_AGENT_DIR</key><string>${CUSTOM}</string>`), body);
		check("MUST 3: ...inside EnvironmentVariables", /<key>EnvironmentVariables<\/key>\s*<dict>[^]*PI_CODING_AGENT_DIR[^]*<\/dict>/.test(body), body);
		check("MUST 3: ...and the pack config went to that same dir", fs.existsSync(path.join(CUSTOM, "nana-pack.json")));
		check("MUST 3: plutil accepts the rendered plist", spawnSync("plutil", ["-lint", plist], { encoding: "utf-8" }).status === 0);

		// the default dir renders no entry (an unchanged plist for everyone not using an override)
		const H2 = path.join(HOME, "plain");
		fs.mkdirSync(path.join(H2, ".pi", "agent", "nana-knowledge"), { recursive: true });
		fs.writeFileSync(path.join(H2, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
		spawnSync(process.execPath, [cli, "install", "--desk", "--home", H2], { env: baseEnv, encoding: "utf-8" });
		const plain = fs.readFileSync(path.join(H2, "Library", "LaunchAgents", "com.nana.pi-desk.plist"), "utf-8");
		check("MUST 3: the default agent dir renders no PI_CODING_AGENT_DIR entry", !plain.includes("PI_CODING_AGENT_DIR") && plain.includes("<key>PATH</key>"), plain);
		// an explicit --pi-home is the installer's choice too
		const H3 = path.join(HOME, "pinned");
		const PH = path.join(H3, "elsewhere");
		fs.mkdirSync(path.join(PH, "nana-knowledge"), { recursive: true });
		fs.writeFileSync(path.join(PH, "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
		spawnSync(process.execPath, [cli, "install", "--desk", "--home", H3, "--pi-home", PH], { env: baseEnv, encoding: "utf-8" });
		const pinned = fs.readFileSync(path.join(H3, "Library", "LaunchAgents", "com.nana.pi-desk.plist"), "utf-8");
		check("MUST 3: an explicit --pi-home is rendered into the plist", pinned.includes(`<key>PI_CODING_AGENT_DIR</key><string>${PH}</string>`), pinned);
	}
} finally {
	fs.rmSync(HOME, { recursive: true, force: true });
}
console.log(fails ? `${fails} FAILED` : "all PASS");
process.exit(fails ? 1 : 0);
