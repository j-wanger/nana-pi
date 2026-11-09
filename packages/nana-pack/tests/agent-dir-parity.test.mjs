/**
 * @module packages/nana-pack/tests/agent-dir-parity.test.mjs
 * @purpose Pin one agent-dir resolution across the pack and nana-setup, including scoped-home isolation.
 * @inputs packages/nana-setup/bin/nana-setup.mjs, lib/agent-dir.mjs, a scoped pi version stub and a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME and install targets), process (sets HOME and PI_CODING_AGENT_DIR, spawns the installer and scoped pi stub)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// For absolute, relative, tilde and unset PI_CODING_AGENT_DIR, nana-setup resolves
// exactly piAgentDir(). --home isolates installation from the ambient agent directory.
// Run: node --experimental-strip-types packages/nana-pack/tests/agent-dir-parity.test.mjs
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "../../nana-setup/tests/stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SETUP_BIN = path.join(REPO, "packages", "nana-setup", "bin", "nana-setup.mjs");
const HOME = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "nana-u2p-")));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
const ORIGINAL_CWD = process.cwd(); // win32 will not rmdir a live process cwd — chdir back before the final cleanup
process.chdir(HOME); // the relative case resolves against the process cwd; every child starts here too

const { piAgentDir } = await import(new URL("../lib/gate-paths.ts", import.meta.url).href);
const { resolveLayout } = await import(new URL("../../nana-setup/lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : extra); if (!ok) fails++; };

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
	// req: R-190
	check(`[${name}] piAgentDir() is pi's resolution`, want === expected, want);

	const layout = resolveLayout({});
	// req: R-199
	check(`[${name}] nana-setup piHome === piAgentDir()`, layout.piHome === want, layout.piHome);
	check(`[${name}] nana-setup piPackConfig is the file the pack reads`, layout.piPackConfig === path.join(want, "nana-pack.json"), layout.piPackConfig);
	// req: R-191
	check(`[${name}] nana-setup default objective is in the active dir`, layout.piObjective === path.join(want, "nana-objective.md"), layout.piObjective);

	check(`[${name}] nana-setup flags a cwd-specific piHome exactly when the value is relative`, !!layout.piHomeCwdRelative === (value === "rel-agent"), String(layout.piHomeCwdRelative));
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
	{
		const newHome = path.join(HOME, "r827-home");
		const newPiFolder = path.join(HOME, "r827-pi-folder");
		fs.mkdirSync(newHome);
		fs.mkdirSync(path.join(newPiFolder, "nana-knowledge"), { recursive: true });
		fs.writeFileSync(path.join(newPiFolder, "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
		const r827 = spawnSync(process.execPath, [SETUP_BIN, "install", "--home", newHome, "--pi-home", newPiFolder], { cwd: HOME, env: { ...process.env, HOME: newHome, USERPROFILE: newHome, PI_CODING_AGENT_DIR: ambient }, encoding: "utf-8" });
		// req: R-827
		check("R-827: install with --pi-home, --home and an ambient PI_CODING_AGENT_DIR seeds the --pi-home dir only and writes nothing into the ambient dir",
			r827.status === 0 &&
				fs.existsSync(path.join(newPiFolder, "nana-pack.json")) &&
				!fs.existsSync(path.join(newHome, ".pi", "agent", "nana-pack.json")) &&
				!fs.existsSync(ambient),
			r827.stdout + r827.stderr);
	}
	const seed = JSON.parse(fs.readFileSync(seeded, "utf-8"));
	check("seed pins no objective.path (the pack's active-dir default applies)", seed.objective && !("path" in seed.objective), JSON.stringify(seed));
	const savedPath = process.env.PATH;
	process.env.PATH = "";
	let d;
	try {
		d = withPiStub(() => spawnSync(process.execPath, [SETUP_BIN, "doctor", "--home", tmpHome], { cwd: HOME, env: { ...process.env, HOME: tmpHome, USERPROFILE: tmpHome, PI_CODING_AGENT_DIR: ambient }, encoding: "utf-8" }));
	} finally {
		if (savedPath === undefined) delete process.env.PATH;
		else process.env.PATH = savedPath;
	}
	check("--home doctor checks <home>/.pi/agent and says why", d.stdout.includes(`${path.join(tmpHome, ".pi", "agent")} (--home)`), d.stdout);
	// req: R-952
	check("--home doctor uses the scoped pi version stub", /✓ pi executable\s+1\.0\.2/.test(d.stdout), d.stdout);
	check("--home doctor: the objective file it checks is in <home>/.pi/agent", d.stdout.includes(path.join(tmpHome, ".pi", "agent", "nana-objective.md")), d.stdout);
	delete process.env.PI_CODING_AGENT_DIR;
}

// The real holder (Windows run 2): THIS process never left HOME after the chdir above, and win32
// will not rmdir a live process cwd — no retry window clears that. Leave it before removing it.
process.chdir(ORIGINAL_CWD);
// chosen: Node's own linear-backoff retry for a transient EBUSY/ENOTEMPTY rmdir — kept as defence
// in depth for a spawnSync child (install/doctor --home ran with cwd: HOME) whose handle lags its
// own exit; the chdir above is the fix for the persistent case Windows run 1 and 2 actually hit.
const HOME_CLEANUP_MAX_RETRIES = 5;
const HOME_CLEANUP_RETRY_DELAY_MS = 100;
fs.rmSync(HOME, { recursive: true, force: true, maxRetries: HOME_CLEANUP_MAX_RETRIES, retryDelay: HOME_CLEANUP_RETRY_DELAY_MS });
console.log(fails ? `${fails} FAIL` : "all PASS");
process.exit(fails ? 1 : 0);
