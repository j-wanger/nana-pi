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
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const reader = path.resolve(pkg, "..", "nana-pack", "bin", "nana-adoption.mjs");
let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "nana-dismiss-")));
const home = path.join(root, "home");
fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
const env = { ...process.env, HOME: home, USERPROFILE: home };
delete env.PI_CODING_AGENT_DIR;
const setup = (...args) => spawnSync(process.execPath, [cli, "project", ...args, "--home", home], { env, encoding: "utf8" });
const dir = path.join(root, "repo");
fs.mkdirSync(path.join(dir, ".git"), { recursive: true });
const marker = path.join(dir, ".nana-not-a-project");

// the reader names the repo before the dismissal
fs.writeFileSync(path.join(home, ".pi", "agent", "nana-journal.jsonl"), `${JSON.stringify({ ts: new Date().toISOString(), event: "directory_unadopted", cwd: dir, has: {} })}\n`);
const read = () => spawnSync(process.execPath, [reader], { env, encoding: "utf8" });
check("before: the reader names the repo", read().stdout.includes(`- \`${dir}\` —`)); // paths render in backticks (L5 sol r1 MUST 1)

const dry = setup(dir, "--not-a-project", "--dry-run");
check("dry run writes nothing", dry.status === 0 && !fs.existsSync(marker), dry.stdout + dry.stderr);
const r = setup(dir, "--not-a-project");
check("--not-a-project exits 0", r.status === 0, r.stdout + r.stderr);
const text = fs.existsSync(marker) ? fs.readFileSync(marker, "utf8") : "";
// req: R-340
check("the marker is one line saying what it means and when", /^Not a nana project — .*\d{4}-\d{2}-\d{2}.*\n$/.test(text) && text.split("\n").length === 2, JSON.stringify(text));
// req: R-340
check("nothing else was created", JSON.stringify(fs.readdirSync(dir).sort()) === JSON.stringify([".git", ".nana-not-a-project"]));
// req: R-340
check("after: the reader ignores that root", read().stdout === "");
const again = setup(dir, "--not-a-project");
// req: R-340
check("a second --not-a-project leaves the recorded file alone", again.status === 0 && fs.readFileSync(marker, "utf8") === text);

const refuse = setup(dir);
// req: R-340
check("project on a marked dir refuses (exit 2)", refuse.status === 2, refuse.stdout + refuse.stderr);
// req: R-340
check("…naming the marker and the remedy", refuse.stderr.includes(marker) && /delete it to adopt/.test(refuse.stderr), refuse.stderr);
// req: R-340
check("…and seeds nothing", !fs.existsSync(path.join(dir, "OBJECTIVE.md")) && fs.readFileSync(marker, "utf8") === text);

// a linked worktree (.git FILE) is a repository root; a subdirectory / a plain folder is not
const wt = path.join(root, "wt");
fs.mkdirSync(wt);
fs.writeFileSync(path.join(wt, ".git"), "gitdir: /elsewhere\n");
check("a linked worktree root accepts the marker", setup(wt, "--not-a-project").status === 0 && fs.existsSync(path.join(wt, ".nana-not-a-project")));
const sub = path.join(dir, "src");
fs.mkdirSync(sub);
for (const [label, d] of [["a subdirectory of a repo", sub], ["a plain folder", path.join(root, "home")], ["a missing folder", path.join(root, "nope")]]) {
	const x = setup(d, "--not-a-project");
	// req: R-340
	check(`--not-a-project on ${label} refuses with the reason`, x.status === 2 && x.stderr.includes("is not a git repository root") && !fs.existsSync(path.join(d, ".nana-not-a-project")), x.stdout + x.stderr);
}

fs.rmSync(root, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
