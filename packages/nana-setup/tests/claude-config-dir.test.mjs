/**
 * @module packages/nana-setup/tests/claude-config-dir.test.mjs
 * @purpose Pin nana-setup install and doctor to Claude Code's configured home while keeping explicit flags authoritative and relative ambient paths safe.
 * @inputs bin/nana-setup.mjs, CLAUDE_CONFIG_DIR, fresh temporary homes, and the shared pi stub.
 * @outputs Seven PASS/FAIL lines and a nonzero exit when any requirement check fails.
 * @effects disk (temporary homes only), process (spawns install and doctor under bounded cases).
 * @errors A failed or timed-out case prints FAIL with its observations and makes the process exit nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(packageRoot, "bin", "nana-setup.mjs");
const CLAUDE_CONFIG_ENV = "CLAUDE_CONFIG_DIR";
// chosen: setup cases normally finish in seconds; one minute bounds a loaded shared CI worker.
const CASE_TIMEOUT_MS = 60_000;
const CHILD_TIMEOUT_MS = 45_000;
let failures = 0;

const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (!ok) failures++;
};

async function withinLimit(title, fn) {
	let timer;
	try {
		await Promise.race([
			Promise.resolve().then(fn),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timed out after ${CASE_TIMEOUT_MS} ms`)), CASE_TIMEOUT_MS); }),
		]);
	} catch (error) {
		console.log("FAIL", title, error?.stack ?? String(error));
		failures++;
	} finally {
		clearTimeout(timer);
	}
}

function freshCase(name) {
	const home = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), `nana-claude-config-${name}-`)));
	const work = path.join(home, "work");
	const piHome = path.join(home, ".pi", "agent");
	fs.mkdirSync(path.join(piHome, "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(piHome, "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	fs.mkdirSync(work);
	return { home, work, piHome };
}

function childEnv(home, value, extra = {}) {
	const env = { ...process.env };
	for (const name of [CLAUDE_CONFIG_ENV, "PI_CODING_AGENT_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_SETUP_PLATFORM"]) delete env[name];
	env.HOME = home;
	env.USERPROFILE = home;
	if (value !== undefined) env["CLAUDE_CONFIG_DIR"] = value;
	return { ...env, ...extra };
}

function runInstall(fixture, value, args = []) {
	return spawnSync(process.execPath, [cli, "install", "--pi-home", fixture.piHome, ...args], {
		cwd: fixture.work,
		env: childEnv(fixture.home, value),
		encoding: "utf8",
		timeout: CHILD_TIMEOUT_MS,
	});
}

function runDoctor(fixture, value, args = []) {
	return withPiStub(() => spawnSync(process.execPath, [cli, "doctor", "--pi-home", fixture.piHome, ...args], {
		cwd: fixture.work,
		env: childEnv(fixture.home, value, { PATH: process.env.PATH }),
		encoding: "utf8",
		timeout: CHILD_TIMEOUT_MS,
	}));
}

const output = (run) => `${run.stdout ?? ""}${run.stderr ?? ""}`;
const emptyOrAbsent = (directory) => {
	try { return fs.readdirSync(directory).length === 0; }
	catch (error) { return error?.code === "ENOENT"; }
};

await withinLimit("install with an absolute CLAUDE_CONFIG_DIR writes the Claude files there and nothing under ~/.claude", async () => {
	const fixture = freshCase("absolute");
	const configured = path.join(fixture.home, "named claude");
	const run = runInstall(fixture, configured + path.sep);
	const expected = [
		path.join(configured, "settings.json"),
		path.join(configured, "rules", "nana-soul.md"),
		path.join(configured, "skills", "requirements"),
		path.join(configured, "nana-memory", "shared", "MEMORY.md"),
	];
	const hook = path.join(configured, "hooks", "nana-shared-memory.mjs");
	const hookOk = process.platform === "win32" || (fs.existsSync(hook) && fs.lstatSync(hook).isSymbolicLink());
	// req: R-2390
	check("install with an absolute CLAUDE_CONFIG_DIR writes the Claude files there and nothing under ~/.claude", run.status === 0 && expected.every((file) => fs.existsSync(file)) && hookOk && !fs.existsSync(path.join(fixture.home, ".claude")), `${run.status}\n${output(run)}\n${expected.filter((file) => !fs.existsSync(file)).join("\n")}`);
});

await withinLimit("doctor checks the CLAUDE_CONFIG_DIR folder, not a fully installed ~/.claude", async () => {
	const fixture = freshCase("doctor-target");
	const installed = runInstall(fixture, undefined);
	const control = runDoctor(fixture, undefined);
	const configured = path.join(fixture.home, "empty claude");
	fs.mkdirSync(configured);
	const alternate = runDoctor(fixture, configured);
	const controlOk = /✓ rule nana-soul\.md/.test(control.stdout) && /✓ shared memory index/.test(control.stdout);
	const alternateOk = /✗ rule nana-soul\.md/.test(alternate.stdout) && alternate.stdout.split(/\r?\n/).some((line) => line.includes("✗ shared memory index") && line.includes(configured));
	// req: R-2391
	check("doctor checks the CLAUDE_CONFIG_DIR folder, not a fully installed ~/.claude", installed.status === 0 && controlOk && alternateOk, `install=${installed.status}\ncontrol=${control.status}\n${output(control)}\nalternate=${alternate.status}\n${output(alternate)}`);
});

await withinLimit("--claude-home and --home win over CLAUDE_CONFIG_DIR", async () => {
	const fixture = freshCase("flags");
	const ambient = path.join(fixture.home, "ambient claude");
	const explicit = path.join(fixture.home, "explicit claude");
	const explicitRun = runInstall(fixture, ambient, ["--claude-home", explicit]);
	const secondHome = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "nana-claude-config-flag-home-")));
	const homeRun = runInstall(fixture, ambient, ["--home", secondHome]);
	const explicitFiles = fs.existsSync(path.join(explicit, "settings.json")) && fs.existsSync(path.join(explicit, "rules", "nana-soul.md"));
	const homeFiles = fs.existsSync(path.join(secondHome, ".claude", "settings.json")) && fs.existsSync(path.join(secondHome, ".claude", "rules", "nana-soul.md"));
	// req: R-2392
	check("--claude-home and --home win over CLAUDE_CONFIG_DIR", explicitRun.status === 0 && homeRun.status === 0 && explicitFiles && homeFiles && emptyOrAbsent(ambient), `explicit=${explicitRun.status}\n${output(explicitRun)}\nhome=${homeRun.status}\n${output(homeRun)}\nambient=${fs.existsSync(ambient) ? fs.readdirSync(ambient).join(",") : "absent"}`);
});

await withinLimit("a relative CLAUDE_CONFIG_DIR: install exits 2 naming the variable and writes nothing", async () => {
	const fixture = freshCase("relative-install");
	const run = runInstall(fixture, "rel-claude");
	const resolved = path.join(fixture.work, "rel-claude");
	// req: R-2393
	check("a relative CLAUDE_CONFIG_DIR: install exits 2 naming the variable and writes nothing", run.status === 2 && run.stderr.includes("CLAUDE_CONFIG_DIR") && run.stderr.includes(resolved) && run.stderr.includes(fixture.work) && run.stderr.includes("--claude-home <absolute dir>") && !fs.existsSync(resolved) && !fs.existsSync(path.join(fixture.home, ".claude")) && !fs.existsSync(path.join(fixture.piHome, "nana-pack.json")), `${run.status}\n${output(run)}`);
});

await withinLimit("the install banner names the CLAUDE_CONFIG_DIR folder and its source", async () => {
	const fixture = freshCase("banner-home");
	const outside = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "nana-claude-config-banner-folder-")));
	const run = runInstall(fixture, outside);
	const line = run.stdout.split(/\r?\n/).find((candidate) => candidate.includes("claude home")) ?? "";
	// req: R-2394
	check("the install banner names the CLAUDE_CONFIG_DIR folder and its source", run.status === 0 && line.includes(outside) && line.includes("(from CLAUDE_CONFIG_DIR)"), `${run.status}\n${line}\n${output(run)}`);
});

await withinLimit("an empty CLAUDE_CONFIG_DIR falls back to ~/.claude", async () => {
	const fixture = freshCase("empty");
	const run = runInstall(fixture, "");
	// req: R-2397
	check("an empty CLAUDE_CONFIG_DIR falls back to ~/.claude", run.status === 0 && fs.existsSync(path.join(fixture.home, ".claude", "settings.json")), `${run.status}\n${output(run)}`);
});

await withinLimit("a relative CLAUDE_CONFIG_DIR: doctor's summary names it as install's refusal", async () => {
	const fixture = freshCase("relative-doctor");
	const run = runDoctor(fixture, "rel-claude");
	// req: R-2398
	check("a relative CLAUDE_CONFIG_DIR: doctor's summary names it as install's refusal", run.stdout.includes("nana-setup install will not run until this is fixed:") && run.stdout.includes("CLAUDE_CONFIG_DIR") && fs.readdirSync(fixture.work).length === 0, `${run.status}\n${output(run)}\nwork=${fs.readdirSync(fixture.work).join(",")}`);
});

process.exitCode = failures ? 1 : 0;
