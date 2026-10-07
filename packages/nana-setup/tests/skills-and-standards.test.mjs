/**
 * @module packages/nana-setup/tests/skills-and-standards.test.mjs
 * @purpose Pins that Claude Code gets the requirements skill and the standards rule from the SAME source pi reads — a symlink into the repository, never a copy that stops tracking a pull
 * @inputs bin/nana-setup.mjs, the packaged requirements skill, the standards rule, and a throwaway --home
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts and symlinks), process (spawns the installer CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: Claude Code gets the `requirements` skill and the `nana-standards.md` rule from the
// SAME source pi reads — a symlink into the repo, never a copy that stops tracking a `git pull`.
// Every run goes into a throwaway --home; nothing touches the real machine.
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const SKILL_SRC = path.join(repo, "packages", "nana-pack", "skills", "requirements");
const RULE_SRC = path.join(pkg, "claude", "rules", "nana-standards.md");
const { PI_SUBAGENTS_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);

let passes = 0;
let fails = 0;
let skips = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (ok) passes++;
	else fails++;
};

const tmps = [];
function freshHome() {
	const td = tmpDir(path.join(os.tmpdir(), "nana-skills-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	// doctor's pi-subagents version check (R-364) reads a vendor package nana-setup never
	// installs — seed it at the floor so this fixture reads as an already-set-up machine.
	const subagentsDir = path.join(td, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentsDir, { recursive: true });
	fs.writeFileSync(path.join(subagentsDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	return td;
}
const run = (args, env) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
const linkTarget = (p) => {
	try {
		const st = fs.lstatSync(p);
		return st.isSymbolicLink() ? path.resolve(path.dirname(p), fs.readlinkSync(p)) : null;
	} catch {
		return null;
	}
};

try {
	/* --- 0. the sources exist and are what the installer claims ------------------------- */
	check("the skill ships a SKILL.md with the `requirements` name", /^name: requirements$/m.test(fs.readFileSync(path.join(SKILL_SRC, "SKILL.md"), "utf8")));
	{
		const fm = fs.readFileSync(path.join(SKILL_SRC, "SKILL.md"), "utf8").split("---")[1] ?? "";
		// the triggers the skill is installed FOR — a description that misses them never fires
		const triggers = ["requirements", "REQUIREMENTS.md", "requirement", "trace", "which rows", "no hardcoding", "code map", "module header", "README", "readme-check", "conflicts", "what is failing"];
		const missing = triggers.filter((t) => !fm.toLowerCase().includes(t.toLowerCase()));
		check("the skill description carries every trigger phrase", missing.length === 0, missing.join(" | "));
	}
	check("the standards rule is one screen, imperative, and not nana-soul.md", fs.readFileSync(RULE_SRC, "utf8").split("\n").length < 80 && /^# Nana — Coding standards$/m.test(fs.readFileSync(RULE_SRC, "utf8")));

	/* --- 1. a fresh machine: both land as symlinks into the repo ------------------------ */
	const home = freshHome();
	const first = run(["install", "--home", home]);
	check("install exits 0", first.status === 0, first.stderr);
	check("install reports the skill", /\+ skill requirements\s+created/.test(first.stdout), first.stdout);
	check("install reports the standards rule", /\+ rule nana-standards\.md\s+created/.test(first.stdout), first.stdout);
	// req: R-302
	check("~/.claude/skills/requirements is a symlink to the PACK skill", linkTarget(path.join(home, ".claude", "skills", "requirements")) === SKILL_SRC, String(linkTarget(path.join(home, ".claude", "skills", "requirements"))));
	check("~/.claude/rules/nana-standards.md is a symlink into the repo", linkTarget(path.join(home, ".claude", "rules", "nana-standards.md")) === RULE_SRC);
	check("the skill is readable through the link", fs.readFileSync(path.join(home, ".claude", "skills", "requirements", "SKILL.md"), "utf8").includes("name: requirements"));
	// the whole point of the symlink: ONE source for both runtimes
	// req: R-302
	check("pi reads the same file (the pack's skills dir is the pi skills root)", JSON.parse(fs.readFileSync(path.join(repo, "package.json"), "utf8")).pi.skills.includes("packages/nana-pack/skills"));

	/* --- 2. idempotent --------------------------------------------------------------------- */
	const second = run(["install", "--home", home]);
	check("second install exits 0", second.status === 0, second.stderr);
	check("second install reports nothing to do", second.stdout.includes("nothing to do"), second.stdout);
	check("second install still has the skill symlink", linkTarget(path.join(home, ".claude", "skills", "requirements")) === SKILL_SRC);

	/* --- 3. doctor is the instrument ------------------------------------------------------ */
	const ok = run(["doctor", "--home", home]);
	check("doctor exits 0 after install", ok.status === 0, ok.stdout);
	check("doctor reads ✓ skill requirements", new RegExp(`✓ skill requirements\\s+-> ${SKILL_SRC.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(ok.stdout), ok.stdout);
	check("doctor reads ✓ rule nana-standards.md", /✓ rule nana-standards\.md/.test(ok.stdout), ok.stdout);
	fs.unlinkSync(path.join(home, ".claude", "skills", "requirements"));
	fs.unlinkSync(path.join(home, ".claude", "rules", "nana-standards.md"));
	const bad = run(["doctor", "--home", home]);
	check("doctor exits 1 when the skill is gone", bad.status === 1, String(bad.status));
	check("doctor marks the missing skill ✗ and names the fix", /✗ skill requirements\s+missing — run `nana-setup install`/.test(bad.stdout), bad.stdout);
	check("doctor marks the missing standards rule ✗", /✗ rule nana-standards\.md/.test(bad.stdout), bad.stdout);
	check("a repair install brings both back", run(["install", "--home", home]).status === 0 && run(["doctor", "--home", home]).status === 0);

	/* --- 4. a REGULAR DIRECTORY already there is reported, never clobbered ---------------- */
	{
		const occupied = freshHome();
		const target = path.join(occupied, ".claude", "skills", "requirements");
		fs.mkdirSync(target, { recursive: true });
		fs.writeFileSync(path.join(target, "SKILL.md"), "---\nname: requirements\n---\n# MINE\n");
		const r = run(["install", "--home", occupied]);
		check("occupied skill dir: install EXITS 1 — automation must not read this as success", r.status === 1, String(r.status));
		check("occupied skill dir: ✗ with what was found and the fix", /✗ skill requirements/.test(r.stdout) && /a directory is already at .* — left untouched; move or remove it, then re-run/.test(r.stdout), r.stdout);
		check("occupied skill dir: the summary never says everything is in place", !/everything was already in place/.test(r.stdout), r.stdout);
		check("occupied skill dir: the owner's file is untouched", fs.readFileSync(path.join(target, "SKILL.md"), "utf8") === "---\nname: requirements\n---\n# MINE\n");
		check("occupied skill dir: nothing was backed up into ~/.claude/skills (a .bak dir would be a SECOND skill of the same name)", fs.readdirSync(path.join(occupied, ".claude", "skills")).join(",") === "requirements");
		check("occupied skill dir: --dry-run exits 1 too", run(["install", "--home", occupied, "--dry-run"]).status === 1);
		const d = run(["doctor", "--home", occupied]);
		check("occupied skill dir: doctor reads ✗ naming the directory", /✗ skill requirements\s+a directory is there instead of a symlink to/.test(d.stdout), d.stdout);
		check("occupied skill dir: doctor exits 1", d.status === 1, String(d.status));
		// and once the owner moves it out of the way, both go green
		fs.rmSync(target, { recursive: true, force: true });
		check("occupied skill dir: green once it is moved away", run(["install", "--home", occupied]).status === 0 && run(["doctor", "--home", occupied]).status === 0);
	}

	/* --- 5. a symlink pointing somewhere ELSE is relinked --------------------------------- */
	{
		const stale = freshHome();
		run(["install", "--home", stale]);
		const target = path.join(stale, ".claude", "skills", "requirements");
		const elsewhere = path.join(stale, "old-skill");
		fs.mkdirSync(elsewhere, { recursive: true });
		fs.unlinkSync(target);
		fs.symlinkSync(elsewhere, target);
		check("stale link: doctor reads ✗ naming both ends", /✗ skill requirements\s+-> .*old-skill, not /.test(run(["doctor", "--home", stale]).stdout));
		const r = run(["install", "--home", stale]);
		// req: R-305
		check("stale link: install relinks it", r.status === 0 && /skill requirements\s+updated\s+relinked/.test(r.stdout), r.stdout);
		check("stale link: it now points at the pack", linkTarget(target) === SKILL_SRC);
		// req: R-305
		check("stale link: the old target directory still exists", fs.existsSync(elsewhere));
	}

	/* --- 6. win32 degrade: a COPY of every file the skill ships, rules copied too --------- */
	if (process.platform === "win32") {
		console.log("SKIP win32 degrade (forcing the branch is only meaningful off win32)");
		skips++;
	} else {
		const w = freshHome();
		const env = { NANA_SETUP_PLATFORM: "win32" };
		const r = run(["install", "--home", w], env);
		check("win32: install exits 0", r.status === 0, r.stderr);
		const target = path.join(w, ".claude", "skills", "requirements");
		check("win32: the skill is a real directory, not a symlink", fs.lstatSync(target).isDirectory() && !fs.lstatSync(target).isSymbolicLink());
		check("win32: every file the source ships is copied byte-for-byte", fs.readFileSync(path.join(target, "SKILL.md")).equals(fs.readFileSync(path.join(SKILL_SRC, "SKILL.md"))));
		check("win32: the standards rule is a copy too", fs.lstatSync(path.join(w, ".claude", "rules", "nana-standards.md")).isFile() && !fs.lstatSync(path.join(w, ".claude", "rules", "nana-standards.md")).isSymbolicLink());
		check("win32: install says so", /skill requirements\s+created\s+\d+ files? copied \(no symlink on this platform\)/.test(r.stdout), r.stdout);
		check("win32: doctor exits 0 on the copy", run(["doctor", "--home", w], env).status === 0, run(["doctor", "--home", w], env).stdout);
		check("win32: doctor calls the copy ✓ and says why", /✓ skill requirements\s+copied from .* \(no symlink on this platform\)/.test(run(["doctor", "--home", w], env).stdout));
		check("win32: a second run changes nothing", run(["install", "--home", w], env).stdout.includes("nothing to do"));
		// a STALE copy is repaired, and a hand-written file is backed up beside itself (a .bak FILE,
		// never a second skill directory)
		fs.writeFileSync(path.join(target, "SKILL.md"), "---\nname: requirements\n---\n# HAND-WRITTEN\n");
		const d = run(["doctor", "--home", w], env);
		check("win32: doctor reads ✗ on a stale copy, naming the file", /✗ skill requirements\s+copy is stale or incomplete \(SKILL\.md\)/.test(d.stdout), d.stdout);
		const fix = run(["install", "--home", w], env);
		check("win32: install refreshes the stale copy", fix.status === 0 && fs.readFileSync(path.join(target, "SKILL.md")).equals(fs.readFileSync(path.join(SKILL_SRC, "SKILL.md"))));
		const baks = fs.readdirSync(target).filter((f) => f.includes(".bak-"));
		check("win32: the hand-written file was backed up, not destroyed", baks.length === 1 && fs.readFileSync(path.join(target, baks[0]), "utf8").includes("HAND-WRITTEN"), baks.join(","));
		check("win32: the backup is a FILE inside the skill dir, never a sibling skill directory", fs.readdirSync(path.join(w, ".claude", "skills")).join(",") === "requirements");
		check("win32: doctor is green again", run(["doctor", "--home", w], env).status === 0);
	}

	/* --- 7. a LINK in the way is never written THROUGH ------------------------------------ */
	// sol r1 CRITICAL: the win32 mirror resolved `<target>/SKILL.md` without ever looking at
	// `<target>` itself, so a directory symlink/junction there was traversed — linkFile saw only
	// the final regular file, backed it up and replaced it, writing OUTSIDE ~/.claude.
	{
		// byte-exact snapshot of a whole tree: names, modes-as-link-or-file, and contents
		const snap = (dir) =>
			fs
				.readdirSync(dir, { recursive: true })
				.sort()
				.map((f) => {
					const p = path.join(dir, f);
					const st = fs.lstatSync(p);
					return `${f}:${st.isDirectory() ? "dir" : st.isSymbolicLink() ? `link>${fs.readlinkSync(p)}` : fs.readFileSync(p).toString("hex")}`;
				})
				.join("|");
		// a victim tree outside ~/.claude, with a file that collides by NAME with what we mirror
		const plantVictim = (home) => {
			const victim = path.join(home, "victim");
			fs.mkdirSync(path.join(victim, "references"), { recursive: true });
			fs.writeFileSync(path.join(victim, "SKILL.md"), "---\nname: someone-elses\n---\n# VICTIM\n");
			fs.writeFileSync(path.join(victim, "references", "notes.md"), "keep me\n");
			return victim;
		};

		// 7a. win32 — the reproduced defect: install must EXIT 1 and leave the victim byte-identical
		if (process.platform === "win32") {
			console.log("SKIP win32 directory-link mirror (forcing the branch is only meaningful off win32)");
			skips++;
		} else {
			const env = { NANA_SETUP_PLATFORM: "win32" };
			const h = freshHome();
			const victim = plantVictim(h);
			const before = snap(victim);
			const target = path.join(h, ".claude", "skills", "requirements");
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.symlinkSync(victim, target); // the directory symlink / junction
			const r = run(["install", "--home", h], env);
			check("win32 dir link: install EXITS 1 — automation must not read this as success", r.status === 1, String(r.status));
			// req: R-352
			check("win32 dir link: ✗ naming the link and refusing to write through it", /✗ skill requirements\s+problem\s+a symlink or junction is already at .* — left untouched and NOT written through/.test(r.stdout), r.stdout);
			// req: R-352
			check("win32 dir link: the VICTIM tree is byte-identical", snap(victim) === before, `${before}\n  ->\n  ${snap(victim)}`);
			// req: R-352
			check("win32 dir link: no .bak was written into the victim", !fs.readdirSync(victim).some((f) => f.includes(".bak-")), fs.readdirSync(victim).join(","));
			check("win32 dir link: the link itself is left exactly as it was", fs.lstatSync(target).isSymbolicLink() && fs.readlinkSync(target) === victim);
			check("win32 dir link: --dry-run exits 1 too, and writes nothing", run(["install", "--home", h, "--dry-run"], env).status === 1 && snap(victim) === before);
			check("win32 dir link: doctor reads ✗ and exits 1", run(["doctor", "--home", h], env).status === 1 && /✗ skill requirements/.test(run(["doctor", "--home", h], env).stdout));
			// a regular FILE at the skill path is the same class: refused, not opened
			const h2 = freshHome();
			fs.mkdirSync(path.join(h2, ".claude", "skills"), { recursive: true });
			fs.writeFileSync(path.join(h2, ".claude", "skills", "requirements"), "not a dir\n");
			const r2 = run(["install", "--home", h2], env);
			// req: R-352
			check("win32 file-at-skill-path: install exits 1 and leaves the file", r2.status === 1 && fs.readFileSync(path.join(h2, ".claude", "skills", "requirements"), "utf8") === "not a dir\n", r2.stdout);
			check("win32 file-at-skill-path: ✗ names the regular file", /a regular file is already at .* — left untouched/.test(r2.stdout), r2.stdout);
		}

		// 7b. posix — the symlink branch REPLACES the link instead of following it, so install
		// legitimately succeeds here; the invariant under test is that the victim is untouched.
		{
			const h = freshHome();
			const victim = plantVictim(h);
			const before = snap(victim);
			const target = path.join(h, ".claude", "skills", "requirements");
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.symlinkSync(victim, target);
			const r = run(["install", "--home", h]);
			check("posix dir link: install exits 0 and relinks", r.status === 0 && /skill requirements\s+updated\s+relinked/.test(r.stdout), r.stdout);
			check("posix dir link: it now points at the pack", linkTarget(target) === SKILL_SRC);
			// req: R-305
			check("posix dir link: the VICTIM tree is byte-identical — nothing was written through", snap(victim) === before, `${before}\n  ->\n  ${snap(victim)}`);
		}

		// 7c. the same traversal class on the RULE links: a file symlink whose target is outside
		// the repo must be replaced, never rewritten through. Both platforms, both rules.
		for (const spec of process.platform === "win32" ? [{ env: {}, tag: "posix" }] : [{ env: {}, tag: "posix" }, { env: { NANA_SETUP_PLATFORM: "win32" }, tag: "win32" }]) {
			const h = freshHome();
			fs.mkdirSync(path.join(h, ".claude", "rules"), { recursive: true });
			const decoys = {};
			for (const rule of ["nana-soul.md", "nana-standards.md"]) {
				const decoy = path.join(h, `decoy-${rule}`);
				fs.writeFileSync(decoy, `DECOY ${rule}\n`);
				decoys[rule] = decoy;
				fs.symlinkSync(decoy, path.join(h, ".claude", "rules", rule));
			}
			const r = run(["install", "--home", h], spec.env);
			check(`${spec.tag} rule link: install exits 0`, r.status === 0, r.stderr);
			for (const rule of ["nana-soul.md", "nana-standards.md"]) {
				const installed = path.join(h, ".claude", "rules", rule);
				// req: R-353
				check(`${spec.tag} rule link ${rule}: the decoy OUTSIDE the repo is untouched`, fs.readFileSync(decoys[rule], "utf8") === `DECOY ${rule}\n`, fs.readFileSync(decoys[rule], "utf8"));
				// req: R-353
				check(`${spec.tag} rule link ${rule}: the entry is now the repo's file, not a link to the decoy`,
					spec.tag === "win32"
						? fs.lstatSync(installed).isFile() && !fs.lstatSync(installed).isSymbolicLink() && fs.readFileSync(installed).equals(fs.readFileSync(path.join(pkg, "claude", "rules", rule)))
						: linkTarget(installed) === path.join(pkg, "claude", "rules", rule),
					String(linkTarget(installed)),
				);
			}
			// req: R-353
			check(`${spec.tag} rule link: no .bak was written next to the decoys`, !fs.readdirSync(h).some((f) => f.includes(".bak-")), fs.readdirSync(h).join(","));
		}

		// 7d. and the HOOK links (posix only — win32 skips hooks entirely)
		if (process.platform !== "win32") {
			const h = freshHome();
			fs.mkdirSync(path.join(h, ".claude", "hooks"), { recursive: true });
			const decoy = path.join(h, "decoy-hook.sh");
			fs.writeFileSync(decoy, "#!/bin/sh\necho DECOY\n");
			fs.symlinkSync(decoy, path.join(h, ".claude", "hooks", "nana-objective.sh"));
			const r = run(["install", "--home", h]);
			check("posix hook link: install exits 0", r.status === 0, r.stderr);
			// req: R-353
			check("posix hook link: the decoy outside the repo is untouched", fs.readFileSync(decoy, "utf8") === "#!/bin/sh\necho DECOY\n");
			// req: R-353
			check("posix hook link: the hook now points into the repo", linkTarget(path.join(h, ".claude", "hooks", "nana-objective.sh")) === path.join(pkg, "claude", "hooks", "nana-objective.sh"));
		}
	}
} finally {
	for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
}

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exit(fails);
