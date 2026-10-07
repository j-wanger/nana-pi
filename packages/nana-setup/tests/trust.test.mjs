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
const before = fs.readFileSync(path.join(agentDir, "trust.json"), "utf8");
const deniedDir = path.join(root, "unconfirmed-project");
fs.mkdirSync(deniedDir);
const denied = run(["trust", deniedDir], { CI: "1" });
// req: R-671
check("noninteractive command refuses without --yes", denied.status !== 0 && store.get(deniedDir) === null && fs.readFileSync(path.join(agentDir, "trust.json"), "utf8") === before, `${denied.status} ${denied.stderr}`);
const rel = run(["trust", dir, "--yes"], { PI_CODING_AGENT_DIR: path.relative(process.cwd(), agentDir) });
// req: R-672
check("relative ambient agent dir is refused", rel.status !== 0 && /relative path/.test(rel.stderr), `${rel.status} ${rel.stderr}`);
fs.rmSync(root, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
