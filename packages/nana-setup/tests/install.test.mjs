// Gate: `install` is idempotent, additive, and never destroys what the owner wrote by hand.
// Every run here goes into a throwaway --home; nothing touches the real machine.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

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
for (const want of ["nana-objective.sh", "nana-shared-memory.sh", "context-size-check.sh", "nana-knowledge.ts hook"]) {
	check(`settings.json wires ${want}`, commands.some((c) => c.includes(want)));
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
