/**
 * @module packages/nana-setup/tests/trust.test.mjs
 * @purpose Pins that the explicit trust command records through pi's ProjectTrustStore only after owner confirmation.
 * @inputs bin/nana-setup.mjs, pi's installed trust-manager module, the shared PI_INSTALL_HINT, and temporary project and home roots.
 * @outputs PASS/FAIL lines and a nonzero process exit when any assertion fails.
 * @effects disk (temporary trust store and project), process (runs the setup CLI and resolves the installed pi package).
 * @errors a failed assertion prints FAIL and exits nonzero; unexpected errors fail the test.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { tmpDir } from "./tmp-dir.mjs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const { decideTrust } = await import("../lib/trust-decision.mjs");
const { spawnNpmRoot } = await import("../lib/npm-root.mjs");
const { PI_INSTALL_HINT } = await import("../lib/steps.mjs");
const root = tmpDir(path.join(os.tmpdir(), "nana-trust-test-"));
const home = path.join(root, "home");
const dir = path.join(root, "project");
fs.mkdirSync(dir, { recursive: true });
const nodeModules = spawnNpmRoot().stdout.trim();
const { ProjectTrustStore } = await import(pathToFileURL(path.join(nodeModules, "@earendil-works", "pi-coding-agent", "dist", "core", "trust-manager.js")).href);
const agentDir = path.join(home, ".pi", "agent");
const store = new ProjectTrustStore(agentDir);
const run = (args, env = {}, cwd = process.cwd()) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", env: { ...process.env, HOME: home, PI_CODING_AGENT_DIR: agentDir, ...env } });
let fails = 0;
const check = (name, ok, detail = "") => {
 console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
 if (!ok) fails++;
};
const setupReadme = fs.readFileSync(path.join(pkg, "README.md"), "utf8");
check("README command examples close their code fence", setupReadme.includes("trust ~/my-thing --yes # record pi project trust after confirmation\n```\n\nRuntime dependencies:"));
const yes = run(["trust", dir, "--yes", "--home", home]);
// req: R-670
check("affirmative trust is saved by pi's ProjectTrustStore", yes.status === 0 && store.get(dir) === true, `${yes.status} ${yes.stderr} ${yes.stdout}`);
// req: R-670
check("command prints pi trust store path", yes.stdout.includes(path.join(agentDir, "trust.json")), yes.stdout);
const deniedDir = path.join(root, "fresh-untrusted-project");
fs.mkdirSync(deniedDir);
const beforeRefusal = fs.readFileSync(path.join(agentDir, "trust.json"), "utf8");
const before = beforeRefusal;
const denied = run(["trust", deniedDir], { CI: "1" });
// req: R-671
check("noninteractive command refuses without --yes and leaves a fresh decision absent", denied.status !== 0 && store.get(deniedDir) === null && fs.readFileSync(path.join(agentDir, "trust.json"), "utf8") === beforeRefusal, `${denied.status} ${denied.stderr}`);
const dryDir = path.join(root, "dry-project");
fs.mkdirSync(dryDir);
const dry = run(["trust", dryDir, "--yes", "--dry-run"]);
// req: R-313
check("trust dry run reports intended decision without writing", dry.status === 0 && /Would record affirmative pi project trust/.test(dry.stdout) && dry.stdout.includes(path.join(agentDir, "trust.json")) && store.get(dryDir) === null && fs.readFileSync(path.join(agentDir, "trust.json"), "utf8") === before, `${dry.status} ${dry.stdout} ${dry.stderr}`);
let writes = 0;
const accepted = await decideTrust({ yes: false, dryRun: false, confirm: async () => true, write: () => writes++ });
const declined = await decideTrust({ yes: false, dryRun: false, confirm: async () => false, write: () => writes++ });
// req: R-671
check("interactive confirmation accepts or declines without unintended writes", accepted.recorded && !declined.recorded && writes === 1);
const externalAgent = path.join(root, "outside-test-home-agent");
const unsafe = run(["trust", dir, "--yes", "--home", home, "--pi-home", externalAgent]);
// req: R-670
check("--home refuses an external agent directory without writing", unsafe.status !== 0 && /inside --home/.test(unsafe.stderr) && !fs.existsSync(path.join(externalAgent, "trust.json")), `${unsafe.status} ${unsafe.stderr}`);
const linkedExternal = path.join(root, "linked-external");
const linkedAgent = path.join(home, "agent-link");
fs.mkdirSync(linkedExternal);
fs.symlinkSync(linkedExternal, linkedAgent, process.platform === "win32" ? "junction" : "dir");
const linkedUnsafe = run(["trust", dir, "--yes", "--home", home, "--pi-home", linkedAgent]);
// req: R-670
check("--home refuses an in-home symlink to external storage without creating store or lock", linkedUnsafe.status !== 0 && /inside --home/.test(linkedUnsafe.stderr) && !fs.existsSync(path.join(linkedExternal, "trust.json")) && !fs.existsSync(path.join(linkedExternal, "trust.json.lock")), `${linkedUnsafe.status} ${linkedUnsafe.stderr}`);
let npmInvocation;
spawnNpmRoot({ platform: "win32", env: {}, spawn: (...args) => { npmInvocation = args; return { status: 0, stdout: "global-root" }; } });
// req: R-670
check("Windows npm root uses the command shim with a fixed shell invocation", npmInvocation[0] === "npm.cmd" && npmInvocation[1].join(" ") === "root -g" && npmInvocation[2].shell === true);
const externalStore = path.join(root, "external-trust-store.json");
const externalBytes = "{}\n";
fs.writeFileSync(externalStore, externalBytes);
const fileLinkAgent = path.join(home, "file-link-agent");
fs.mkdirSync(fileLinkAgent);
fs.symlinkSync(externalStore, path.join(fileLinkAgent, "trust.json"));
const fileLinkUnsafe = run(["trust", dir, "--yes", "--home", home, "--pi-home", fileLinkAgent]);
// req: R-670
check("--home refuses external trust-store symlink before pi writes or creates a lock", fileLinkUnsafe.status !== 0 && /trust storage path resolves outside --home/.test(fileLinkUnsafe.stderr) && fs.readFileSync(externalStore, "utf8") === externalBytes && !fs.existsSync(externalStore + ".lock") && !fs.existsSync(path.join(fileLinkAgent, "trust.json.lock")), `${fileLinkUnsafe.status} ${fileLinkUnsafe.stderr}`);
// A literal relative string, not path.relative(process.cwd(), agentDir): on Windows CI the
// checkout and the temp root can sit on different drives, where path.relative returns an
// ABSOLUTE path instead — this only needs any value path.isAbsolute rejects.
// cwd is pinned to the temp root: if the product ever regressed and accepted this relative
// value, pi's store would resolve against cwd — the npm-test process cwd is the checkout, so
// an unpinned cwd here could write into it instead of staying inside this test's temp root.
const rel = run(["trust", dir, "--yes"], { PI_CODING_AGENT_DIR: path.join("relative", "agent") }, root);
// req: R-672
check("relative ambient agent dir is refused", rel.status !== 0 && /relative path/.test(rel.stderr), `${rel.status} ${rel.stderr}`);
// Builds an env naming a fresh, isolated npm global prefix, so the product's own
// `spawnNpmRoot` resolves a trust-module path this test controls. Deletes every case
// variant of npm_config_prefix first: npm's own child processes set the lowercase key, and
// a machine may export the uppercase one, so both can be present and whichever is read
// first wins unless both are cleared before this test's value is set.
const freshTrustEnv = (label) => {
	const env = { ...process.env };
	for (const key of Object.keys(env)) if (key.toLowerCase() === "npm_config_prefix") delete env[key];
	const freshHome = path.join(root, `${label}-home`);
	const freshAgentDir = path.join(root, `${label}-agent`);
	const freshPrefix = path.join(root, `${label}-prefix`);
	fs.mkdirSync(freshPrefix, { recursive: true });
	env.HOME = freshHome;
	env.PI_CODING_AGENT_DIR = freshAgentDir;
	env.npm_config_prefix = freshPrefix;
	const probeEnv = { ...env };
	delete probeEnv.HOME;
	delete probeEnv.USERPROFILE;
	const probedRoot = spawnNpmRoot({ env: probeEnv });
	const modulePath = path.join(probedRoot.stdout.trim(), "@earendil-works", "pi-coding-agent", "dist", "core", "trust-manager.js");
	return { env, freshAgentDir, modulePath };
};
const oneNonEmptyLine = (stderr) => stderr.split(/\r?\n/).filter((line) => line.length > 0);
const noPi = freshTrustEnv("no-pi");
const noPiResult = spawnSync(process.execPath, [cli, "trust", dir, "--yes"], { cwd: root, encoding: "utf8", env: noPi.env });
const noPiLines = oneNonEmptyLine(noPiResult.stderr);
// req: R-1800
check("no pi under npm's global folder exits 2 with one line naming the module path and the install command", noPiResult.status === 2 && noPiLines.length === 1 && noPiLines[0].includes(noPi.modulePath) && noPiLines[0].includes(PI_INSTALL_HINT) && !fs.existsSync(path.join(noPi.freshAgentDir, "trust.json")), `${noPiResult.status} ${JSON.stringify(noPiLines)}`);
const noCtor = freshTrustEnv("no-ctor");
fs.mkdirSync(path.dirname(noCtor.modulePath), { recursive: true });
fs.writeFileSync(noCtor.modulePath, "module.exports = {};\n");
const noCtorResult = spawnSync(process.execPath, [cli, "trust", dir, "--yes"], { cwd: root, encoding: "utf8", env: noCtor.env });
const noCtorLines = oneNonEmptyLine(noCtorResult.stderr);
// req: R-1801
check("a pi trust module without ProjectTrustStore exits 2 with one line naming the module path and the install command", noCtorResult.status === 2 && noCtorLines.length === 1 && noCtorLines[0].includes(noCtor.modulePath) && noCtorLines[0].includes(PI_INSTALL_HINT), `${noCtorResult.status} ${JSON.stringify(noCtorLines)}`);
fs.rmSync(root, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
