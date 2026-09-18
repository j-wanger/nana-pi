// Gate: `install` is idempotent, additive, and never destroys what the owner wrote by hand.
// Every run here goes into a throwaway --home; nothing touches the real machine.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { commandInvokes, desiredHooks } = await import(new URL("../lib/settings.mjs", import.meta.url).href);

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmps = [];
/** A temp home with a tiny knowledge source, so the real build runs but indexes 1 file. */
function freshHome() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.mkdirSync(path.join(td, "src"), { recursive: true });
	fs.writeFileSync(path.join(td, "src", "note.md"), "# Note\nOne tiny knowledge file.\n");
	fs.writeFileSync(
		path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"),
		JSON.stringify({ roots: [{ path: path.join(td, "src"), kind: "articles" }] }),
	);
	return td;
}

const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });

/* --- 1. a fresh machine: every piece lands ------------------------------------------- */
const home = freshHome();
const first = run(["install", "--home", home]);
check("install exits 0", first.status === 0, first.stderr);
const link = (p) => {
	try {
		const st = fs.lstatSync(p);
		return st.isSymbolicLink() ? fs.realpathSync(p) : null;
	} catch {
		return null;
	}
};
for (const h of ["nana-objective.sh", "nana-shared-memory.sh", "context-size-check.sh"]) {
	check(`hook ${h} is a symlink into the repo`, link(path.join(home, ".claude", "hooks", h)) === path.join(pkg, "claude", "hooks", h));
}
check("rule nana-soul.md is a symlink into the repo", link(path.join(home, ".claude", "rules", "nana-soul.md")) === path.join(pkg, "claude", "rules", "nana-soul.md"));
const personal = path.join(home, ".claude", "rules", "nana-personal.md");
check("private rule is a REGULAR file (never a link into the repo)", fs.lstatSync(personal).isFile());
check("private rule is not in the repo", !fs.existsSync(path.join(pkg, "claude", "rules", "nana-personal.md")));

const settings = JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"));
const commands = Object.values(settings.hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
for (const w of desiredHooks({ hooksDir: path.join(home, ".claude", "hooks"), repoRoot: repo })) {
	check(`settings.json wires ${w.marker}`, commands.some((c) => commandInvokes(c, w.spec)));
}
check("settings.json ends with a newline", fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8").endsWith("}\n"));
check("knowledge hook points at this install root", commands.some((c) => c.includes(path.join(repo, "packages", "nana-knowledge"))));

check("shared memory index seeded", fs.readFileSync(path.join(home, ".claude", "nana-memory", "shared", "MEMORY.md"), "utf8").startsWith("# Shared memory"));
check("pi nana-pack.json seeded", JSON.parse(fs.readFileSync(path.join(home, ".pi", "agent", "nana-pack.json"), "utf8")).objective.projectFile === "OBJECTIVE.md");
check("pi nana-objective.md seeded", fs.existsSync(path.join(home, ".pi", "agent", "nana-objective.md")));
check("knowledge index built", fs.existsSync(path.join(home, ".pi", "agent", "nana-knowledge", "index.db")));
check("pi-review on PATH", link(path.join(home, ".local", "bin", "pi-review")) === path.join(repo, "packages", "nana-pack", "bin", "pi-review.mjs"));
check("pi-review is executable with a node shebang", fs.readFileSync(path.join(repo, "packages", "nana-pack", "bin", "pi-review.mjs"), "utf8").startsWith("#!/usr/bin/env node") && (fs.statSync(path.join(repo, "packages", "nana-pack", "bin", "pi-review.mjs")).mode & 0o111) !== 0);
check("nana-pack package.json declares the pi-review bin", JSON.parse(fs.readFileSync(path.join(repo, "packages", "nana-pack", "package.json"), "utf8")).bin?.["pi-review"] === "bin/pi-review.mjs");
check("no desk plist without --desk", !fs.existsSync(path.join(home, "Library", "LaunchAgents", "com.nana.pi-desk.plist")));

/* --- 2. re-running changes nothing --------------------------------------------------- */
const before = JSON.stringify(walk(home));
const second = run(["install", "--home", home]);
check("second install exits 0", second.status === 0, second.stderr);
check("second install reports nothing to do", second.stdout.includes("nothing to do"));
check("second install reports no created/updated line", !/^\s+\+ /m.test(second.stdout), second.stdout);
check("second install left the tree byte-identical", JSON.stringify(walk(home)) === before);

/* --- 3. a regular file in the way is backed up, not clobbered ------------------------- */
const collide = freshHome();
fs.mkdirSync(path.join(collide, ".claude", "hooks"), { recursive: true });
fs.writeFileSync(path.join(collide, ".claude", "hooks", "nana-objective.sh"), "# hand-written\n");
const bak = run(["install", "--home", collide]);
const baks = fs.readdirSync(path.join(collide, ".claude", "hooks")).filter((f) => f.includes(".bak-"));
check("collision: exactly one backup written", baks.length === 1, baks.join(","));
check("collision: backup keeps the old content", fs.readFileSync(path.join(collide, ".claude", "hooks", baks[0]), "utf8") === "# hand-written\n");
check("collision: target is now the repo symlink", link(path.join(collide, ".claude", "hooks", "nana-objective.sh")) === path.join(pkg, "claude", "hooks", "nana-objective.sh"));
check("collision: the backup is reported", bak.stdout.includes("backed up"));

/* --- 4. what the installer must never overwrite --------------------------------------- */
const keep = freshHome();
fs.mkdirSync(path.join(keep, ".claude", "rules"), { recursive: true });
fs.writeFileSync(path.join(keep, ".claude", "rules", "nana-personal.md"), "MINE\n");
fs.writeFileSync(path.join(keep, ".pi", "agent", "nana-pack.json"), '{"objective":{"path":"/somewhere/OBJECTIVE.md"}}');
fs.writeFileSync(path.join(keep, ".pi", "agent", "nana-objective.md"), "MY OBJECTIVE\n");
run(["install", "--home", keep]);
check("existing nana-personal.md untouched", fs.readFileSync(path.join(keep, ".claude", "rules", "nana-personal.md"), "utf8") === "MINE\n");
check("existing nana-pack.json untouched", fs.readFileSync(path.join(keep, ".pi", "agent", "nana-pack.json"), "utf8") === '{"objective":{"path":"/somewhere/OBJECTIVE.md"}}');
check("existing nana-objective.md untouched", fs.readFileSync(path.join(keep, ".pi", "agent", "nana-objective.md"), "utf8") === "MY OBJECTIVE\n");

/* --- 5. the private rule is created only when absent ---------------------------------- */
const absent = freshHome();
run(["install", "--home", absent]);
const seeded = fs.readFileSync(path.join(absent, ".claude", "rules", "nana-personal.md"), "utf8");
check("private rule is seeded from the example", seeded === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-personal.example.md"), "utf8"));
check("the example carries the same top heading as the real rule", seeded.startsWith("# Who you're working with"));

/* --- 6. doctor is the instrument ------------------------------------------------------ */
const ok = run(["doctor", "--home", home]);
check("doctor exits 0 after install", ok.status === 0, ok.stdout);
check("doctor prints no ✗ after install", !ok.stdout.includes("✗"));
fs.unlinkSync(path.join(home, ".claude", "hooks", "nana-shared-memory.sh"));
const bad = run(["doctor", "--home", home]);
check("doctor exits 1 on a missing piece", bad.status === 1);
check("doctor marks the missing piece with ✗", /✗ hook nana-shared-memory\.sh/.test(bad.stdout));
run(["install", "--home", home]);
check("doctor exits 0 again after a repair install", run(["doctor", "--home", home]).status === 0);

/* --- 7. --dry-run writes nothing ------------------------------------------------------ */
const dry = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-dry-"));
tmps.push(dry);
const dryRun = run(["install", "--home", dry, "--dry-run"]);
check("dry run exits 0", dryRun.status === 0, dryRun.stderr);
check("dry run says would change", dryRun.stdout.includes("would change"));
check("dry run created nothing", fs.readdirSync(dry).length === 0, fs.readdirSync(dry).join(","));

/* --- 8. a home with a SPACE in it: the generated commands must actually run ------------- */
{
	const spaced = fs.mkdtempSync(path.join(os.tmpdir(), "Jane Doe "));
	tmps.push(spaced);
	fs.mkdirSync(path.join(spaced, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(spaced, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	const r = run(["install", "--home", spaced]);
	check("space in home: install exits 0", r.status === 0, r.stderr);
	const s = JSON.parse(fs.readFileSync(path.join(spaced, ".claude", "settings.json"), "utf8"));
	const cmds = Object.values(s.hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
	check("space in home: the path is quoted", cmds.every((c) => c.includes("'")), cmds.join(" | "));
	// the real proof: run the SessionStart commands through a shell
	const sessionStart = s.hooks.SessionStart.flatMap((g) => g.hooks.map((h) => h.command));
	for (const c of sessionStart) {
		const out = spawnSync("bash", ["-c", c], { encoding: "utf8", input: "", env: { ...process.env, HOME: spaced, CLAUDE_PROJECT_DIR: "/Users/x/spaced-repo" } });
		check(`space in home: \`${c.slice(0, 40)}…\` runs cleanly`, out.status === 0 && !/No such file|command not found/.test(out.stderr), out.stderr);
	}
	const shared = spawnSync("bash", ["-c", sessionStart.find((c) => c.includes("nana-shared-memory"))], {
		encoding: "utf8",
		input: "",
		env: { ...process.env, HOME: spaced, CLAUDE_PROJECT_DIR: "/Users/x/spaced-repo" },
	});
	check("space in home: the shared-memory hook printed its index", shared.stdout.includes("[nana:shared-memory]"), shared.stdout + shared.stderr);
	check("space in home: doctor exits 0", run(["doctor", "--home", spaced]).status === 0);
}

/* --- 9. the objective seed is gated on nana-pack.json being ours ----------------------- */
{
	// nana-pack.json already points at a real repo's OBJECTIVE.md: creating the starter file
	// would be noise, and the dry run must not offer it either.
	const elsewhere = freshHome();
	const objectiveElsewhere = path.join(elsewhere, "some-repo-OBJECTIVE.md");
	fs.writeFileSync(objectiveElsewhere, "**Objective:** x\n");
	fs.writeFileSync(path.join(elsewhere, ".pi", "agent", "nana-pack.json"), JSON.stringify({ objective: { path: objectiveElsewhere, projectFile: "OBJECTIVE.md" } }));
	const dry = run(["install", "--home", elsewhere, "--dry-run"]);
	check("objective seed: the dry run does not offer to create it", /pi nana-objective\.md\s+unchanged\s+not needed/.test(dry.stdout), dry.stdout);
	const r = run(["install", "--home", elsewhere]);
	check("objective seed: not created when nana-pack.json points elsewhere", !fs.existsSync(path.join(elsewhere, ".pi", "agent", "nana-objective.md")));
	check("objective seed: the reason is reported", /not needed — objective\.path already points at/.test(r.stdout));
	check("objective seed: doctor is still green", run(["doctor", "--home", elsewhere]).status === 0, run(["doctor", "--home", elsewhere]).stdout);

	// and when the config IS ours, the starter file is created
	const ours = freshHome();
	run(["install", "--home", ours]);
	check("objective seed: created alongside a freshly seeded nana-pack.json", fs.existsSync(path.join(ours, ".pi", "agent", "nana-objective.md")));

	// an existing config that points AT the default file still gets it
	const pointsHere = freshHome();
	fs.writeFileSync(path.join(pointsHere, ".pi", "agent", "nana-pack.json"), JSON.stringify({ objective: { path: "~/.pi/agent/nana-objective.md" } }));
	run(["install", "--home", pointsHere]);
	check("objective seed: created when objective.path resolves to it", fs.existsSync(path.join(pointsHere, ".pi", "agent", "nana-objective.md")));
}

/* --- the private rule must be a REGULAR file, never a symlink ------------------------ */
{
	const home = freshHome();
	run(["install", "--home", home]);
	const personal = path.join(home, ".claude", "rules", "nana-personal.md");
	const elsewhere = path.join(home, "private-notes.md");
	// The exact shape sol r2 named: byte-correct content, reached through a LINK. seedFile
	// leaves a symlink alone, so without a check of its own the run would read as healthy —
	// while the owner's private text actually lives wherever that link points (plausibly in
	// this repo, which is how a private rule gets committed).
	fs.renameSync(personal, elsewhere);
	fs.symlinkSync(elsewhere, personal);
	const r = run(["install", "--home", home]);
	check("private rule symlink: install EXITS 1 — automation must not read this as success", r.status === 1, String(r.status));
	check("private rule symlink: --dry-run exits 1 too", run(["install", "--home", home, "--dry-run"]).status === 1);
	check("private rule symlink: install reports ✗ with the fix", /rule nana-personal\.md \(private\)\s+problem\s+private rule is a symlink — replace with a regular file/.test(r.stdout), r.stdout);
	check("private rule symlink: the ✗ symbol is printed", /✗ rule nana-personal\.md \(private\)/.test(r.stdout), r.stdout);
	check("private rule symlink: the summary never says everything is in place", !/everything was already in place/.test(r.stdout), r.stdout);
	check("private rule symlink: nothing is written through the link", fs.lstatSync(personal).isSymbolicLink());
	const d = run(["doctor", "--home", home]);
	check("private rule symlink: doctor reads ✗ with the same message", /✗ rule nana-personal\.md\s+private rule is a symlink — replace with a regular file/.test(d.stdout), d.stdout);
	check("private rule symlink: doctor exits 1", d.status === 1, String(d.status));
	// and a regular file is healthy again
	fs.unlinkSync(personal);
	fs.renameSync(elsewhere, personal);
	check("private rule as a regular file: doctor exits 0", run(["doctor", "--home", home]).status === 0);
	check("private rule as a regular file: a clean install exits 0 again", run(["install", "--home", home]).status === 0);
}

function walk(dir) {
	const out = [];
	for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
		const p = path.join(dir, e.name);
		if (e.isSymbolicLink()) out.push([p, "link", fs.readlinkSync(p)]);
		else if (e.isDirectory()) out.push(...walk(p));
		// the knowledge db is a live sqlite file; its bytes are not part of the idempotency claim
		else if (!p.endsWith("index.db")) out.push([p, "file", fs.readFileSync(p, "utf8")]);
	}
	return out;
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
