// Gate: on Windows every posix-only step SAYS it skipped instead of failing. The repo rule is
// cross-platform or degrade gracefully — an installer that throws on win32 is the failure mode.
// NANA_SETUP_PLATFORM is the seam (lib/paths.mjs); process.platform is never monkey-patched, so
// sibling packages and the node runtime behave normally.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmps = [];
function freshHome() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-win-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	return td;
}
const run = (args, env = {}) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, ...env } });

const home = freshHome();
const r = run(["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
check("win32 install exits 0", r.status === 0, r.stderr);

const lines = r.stdout.split("\n");
const line = (label) => lines.find((l) => l.includes(label)) ?? "";
for (const label of ["hook nana-objective.sh", "hook nana-shared-memory.sh", "hook context-size-check.sh", "PATH pi-review"]) {
	check(`win32: ${label} reports skipped (win32)`, /skipped\s+skipped \(win32\)/.test(line(label)), line(label));
}
for (const label of ["settings SessionStart objective", "settings SessionStart shared-memory", "settings UserPromptSubmit context-size"]) {
	check(`win32: ${label} reports skipped (win32: bash hook)`, line(label).includes("skipped (win32: bash hook)"), line(label));
}
check("win32: no hooks directory is created", !fs.existsSync(path.join(home, ".claude", "hooks")));
check("win32: no ~/.local/bin entry is created", !fs.existsSync(path.join(home, ".local", "bin", "pi-review")));
check("win32: no launchd plist", !fs.existsSync(path.join(home, "Library", "LaunchAgents", "com.nana.pi-desk.plist")));

/* the pieces that DO work on Windows still run */
const soul = path.join(home, ".claude", "rules", "nana-soul.md");
check("win32: nana-soul.md is installed as a copy", fs.lstatSync(soul).isFile() && !fs.lstatSync(soul).isSymbolicLink());
check("win32: the copy matches the repo file", fs.readFileSync(soul, "utf8") === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-soul.md"), "utf8"));
check("win32: the private rule is still seeded", fs.existsSync(path.join(home, ".claude", "rules", "nana-personal.md")));
check("win32: the pi config is still seeded", fs.existsSync(path.join(home, ".pi", "agent", "nana-pack.json")));
check("win32: the knowledge index is still built", fs.existsSync(path.join(home, ".pi", "agent", "nana-knowledge", "index.db")));
const settings = JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"));
const cmds = settings.hooks.UserPromptSubmit.flatMap((g) => g.hooks.map((h) => h.command));
check("win32: only the knowledge hook is wired", cmds.length === 1 && cmds[0].includes("nana-knowledge.ts"));
check("win32: no `VAR=1 cmd` env prefix (cmd.exe cannot run it)", !cmds[0].startsWith("NODE_NO_WARNINGS="));
check("win32: no bash hooks in settings", !JSON.stringify(settings).includes("bash "));

/* doctor agrees, and does not fail on what the platform cannot have */
const doc = run(["doctor", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
check("win32 doctor exits 0", doc.status === 0, doc.stdout);
check("win32 doctor prints no ✗", !doc.stdout.includes("✗"));
check("win32 doctor marks the skipped pieces", (doc.stdout.match(/skipped \(win32\)/g) || []).length >= 4);
check("win32 doctor marks the desk service as skipped", /desk service\s+skipped \(win32\)/.test(doc.stdout));

/* re-running is still idempotent under the win32 branch */
const again = run(["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
check("win32: second install reports nothing to do", again.stdout.includes("nothing to do"));

/* --- the copy path owes the same no-destruction guarantee as the symlink path --------- */
{
	const collide = freshHome();
	fs.mkdirSync(path.join(collide, ".claude", "rules"), { recursive: true });
	fs.writeFileSync(path.join(collide, ".claude", "rules", "nana-soul.md"), "# my own soul\n");
	const r = run(["install", "--home", collide], { NANA_SETUP_PLATFORM: "win32" });
	const baks = fs.readdirSync(path.join(collide, ".claude", "rules")).filter((f) => f.includes(".bak-"));
	check("win32 collision: a backup is written", baks.length === 1, baks.join(","));
	check("win32 collision: the backup keeps the old content", fs.readFileSync(path.join(collide, ".claude", "rules", baks[0]), "utf8") === "# my own soul\n");
	check("win32 collision: the target now holds the repo copy", fs.readFileSync(path.join(collide, ".claude", "rules", "nana-soul.md"), "utf8") === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-soul.md"), "utf8"));
	check("win32 collision: the backup is reported", r.stdout.includes("backed up"), r.stdout);
}
{
	// never write THROUGH a symlink: that would overwrite whatever it points at
	const linked = freshHome();
	fs.mkdirSync(path.join(linked, ".claude", "rules"), { recursive: true });
	const decoy = path.join(linked, "decoy.md");
	fs.writeFileSync(decoy, "DECOY\n");
	fs.symlinkSync(decoy, path.join(linked, ".claude", "rules", "nana-soul.md"));
	const r = run(["install", "--home", linked], { NANA_SETUP_PLATFORM: "win32" });
	check("win32 symlink: the link's target is untouched", fs.readFileSync(decoy, "utf8") === "DECOY\n");
	check("win32 symlink: the target is now a regular file", fs.lstatSync(path.join(linked, ".claude", "rules", "nana-soul.md")).isFile() && !fs.lstatSync(path.join(linked, ".claude", "rules", "nana-soul.md")).isSymbolicLink());
	check("win32 symlink: it holds the repo copy", fs.readFileSync(path.join(linked, ".claude", "rules", "nana-soul.md"), "utf8") === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-soul.md"), "utf8"));
	check("win32 symlink: the replacement is reported", /replaced a symlink/.test(r.stdout), r.stdout);
}

/* the seam does not leak: a normal run on this machine still links */
if (process.platform !== "win32") {
	const posix = freshHome();
	run(["install", "--home", posix]);
	check("seam does not leak: a normal run links the hooks", fs.lstatSync(path.join(posix, ".claude", "hooks", "nana-objective.sh")).isSymbolicLink());
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
