/**
 * @module packages/nana-setup/tests/trust.test.mjs
 * @purpose Pins that the explicit trust command records through pi's ProjectTrustStore only after owner confirmation.
 * @inputs bin/nana-setup.mjs, pi's installed trust-manager module, and temporary project and home roots.
 * @outputs PASS/FAIL lines and a nonzero process exit when any assertion fails.
 * @effects disk (temporary trust store and project), process (runs the setup CLI and resolves the installed pi package).
 * @errors a failed assertion prints FAIL and exits nonzero; unexpected errors fail the test.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const { decideTrust } = await import("../lib/trust-decision.mjs");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "nana-trust-test-"));
const home = path.join(root, "home");
const dir = path.join(root, "project");
fs.mkdirSync(dir, { recursive: true });
const nodeModules = spawnSync("npm", ["root", "-g"], { encoding: "utf8" }).stdout.trim();
const { ProjectTrustStore } = await import(path.join(nodeModules, "@earendil-works", "pi-coding-agent", "dist", "core", "trust-manager.js"));
const agentDir = path.join(home, ".pi", "agent");
const store = new ProjectTrustStore(agentDir);
const run = (args, env = {}) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, HOME: home, PI_CODING_AGENT_DIR: agentDir, ...env } });
let fails = 0;
const check = (name, ok, detail = "") => {
 console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
 if (!ok) fails++;
};
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
const rel = run(["trust", dir, "--yes"], { PI_CODING_AGENT_DIR: path.relative(process.cwd(), agentDir) });
// req: R-672
check("relative ambient agent dir is refused", rel.status !== 0 && /relative path/.test(rel.stderr), `${rel.status} ${rel.stderr}`);
fs.rmSync(root, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
