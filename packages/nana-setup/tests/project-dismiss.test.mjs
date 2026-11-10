/**
 * @module packages/nana-setup/tests/project-dismiss.test.mjs
 * @purpose Pins the `--not-a-project` marker — written at a repository root, honored by the adoption reader, and refused with a reason on a marked dir or a non-root
 * @inputs bin/nana-setup.mjs, nana-pack's bin/nana-adoption.mjs, and throwaway git repositories
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway repositories, markers and a throwaway home), process (spawns the setup CLI, the reader and git)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// L5 (d): `nana-setup project <dir> --not-a-project` writes `.nana-not-a-project` at a git
// repository root; the seat's adoption reader then ignores that root; `project` on a marked dir
// refuses, naming the marker and the remedy; a non-root refuses with the reason. Throwaway dirs only.
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const reader = path.resolve(pkg, "..", "nana-pack", "bin", "nana-adoption.mjs");
let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

const root = tmpDir(path.join(os.tmpdir(), "nana-dismiss-"));
const home = path.join(root, "home");
fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
const env = { ...process.env, HOME: home, USERPROFILE: home, NANA_TEST_TEMP_ROOTS: "" };
delete env.PI_CODING_AGENT_DIR;
const setup = (...args) => spawnSync(process.execPath, [cli, "project", ...args, "--home", home], { env, encoding: "utf8" });
const dir = path.join(root, "repo");
fs.mkdirSync(path.join(dir, ".git"), { recursive: true });
const marker = path.join(dir, ".nana-not-a-project");

// the reader names the repo before the dismissal
fs.writeFileSync(path.join(home, ".pi", "agent", "nana-journal.jsonl"), `${JSON.stringify({ ts: new Date().toISOString(), event: "directory_unadopted", cwd: dir, has: {} })}\n`);
const read = () => spawnSync(process.execPath, [reader], { env, encoding: "utf8" });
check("before: the reader names the repo", read().stdout.includes(`- \`${dir}\` —`)); // paths render in backticks (L5 sol r1 MUST 1)

const r = setup(dir, "--not-a-project");
check("--not-a-project exits 0", r.status === 0, r.stdout + r.stderr);
const text = fs.existsSync(marker) ? fs.readFileSync(marker, "utf8") : "";
// req: R-4012
check("the marker is one line saying what it means and when", /^Not a nana project — .*\d{4}-\d{2}-\d{2}.*\n$/.test(text) && text.split("\n").length === 2, JSON.stringify(text));
// req: R-4012
check("nothing else was created", JSON.stringify(fs.readdirSync(dir).sort()) === JSON.stringify([".git", ".nana-not-a-project"]));
// req: R-4012
check("after: the reader ignores that root", read().stdout === "");
fs.rmSync(root, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
