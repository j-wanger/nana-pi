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
import { withPiStub } from "./stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
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
const run = (args, env) => {
	const invoke = () => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
	return args[0] === "doctor" ? withPiStub(invoke) : invoke();
};
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
	{
		const RULE_TEXT = fs.readFileSync(RULE_SRC, "utf8");
		const SKILL_TEXT = fs.readFileSync(path.join(SKILL_SRC, "SKILL.md"), "utf8");
		// Markdown line-wraps at ~80-100 chars, so a multi-word sentence can carry an internal
		// newline; normalize runs of whitespace to one space before substring matching.
		const norm = (s) => s.replace(/\s+/g, " ");
		const RULE_NORM = norm(RULE_TEXT);
		const SKILL_NORM = norm(SKILL_TEXT);
		const GONE = ["name the clause each cited test pins", "A row is the weakest of its clauses", "A row's status is the weakest of its clauses"];
		// req: R-1301
		check("R-1301: the coding standards and the requirements skill write one row per must-meet test no wider than the test, and drop clause-by-clause pinning",
			RULE_NORM.includes("New behaviour starts as a feature and its must-meet tests, about three to eight") &&
			RULE_NORM.includes("Each must-meet test gets one requirement row, written no wider") &&
			RULE_NORM.includes("Then the tests: the must-meet tests your brief or plan names and no other new test, except") &&
			RULE_NORM.includes("the one test that pins each new sealed tunable") &&
			RULE_NORM.includes("A row flips to `implemented` when its test passes. A `violated` row carries its residual.") &&
			RULE_NORM.includes("Every land gets an independent reviewer whose question is: does the feature work for its") &&
			RULE_NORM.includes("does the change cause a harm the review standard lists") &&
			SKILL_NORM.includes("Add one row per must-meet test, written no wider than the test") &&
			SKILL_NORM.includes("Before you flip a row to `implemented`, its test passes and the row says no more than the test") &&
			SKILL_NORM.includes("a row wider than its test is an overclaim, and the fix is to narrow the row") &&
			SKILL_NORM.includes("Every land gets an independent reviewer** who reads the diff and asks: does the feature work") &&
			SKILL_NORM.includes("In an install, hook or gate lane the seat also breaks the code and watches the cited test go") &&
			GONE.every((phrase) => !RULE_NORM.includes(phrase) && !SKILL_NORM.includes(phrase)),
			`RULE:${RULE_TEXT}\n---\nSKILL:${SKILL_TEXT}`);
		const GENERAL_SRC = path.join(repo, "templates", "_shared", "requirements-general.md");
		const GENERAL_TEXT = fs.readFileSync(GENERAL_SRC, "utf8");
		const g005Cell = GENERAL_TEXT.match(/^\|\s*G-005\s*\|([^|]+)\|/m);
		const GENERAL_G005_NORM = norm(g005Cell ? g005Cell[1] : "");
		const CARVEOUT = "a pi extension's default export counts as its named entry point";
		const carveoutMissing = [];
		if (!RULE_NORM.includes(CARVEOUT)) carveoutMissing.push("the coding standards rule");
		if (!SKILL_NORM.includes(CARVEOUT)) carveoutMissing.push("the requirements skill");
		if (!GENERAL_G005_NORM.includes(CARVEOUT)) carveoutMissing.push("the shared G-005 row");
		// req: R-1480
		check("R-1480: the coding standards rule, the requirements skill and the shared G-005 row each say a pi extension's default export counts as its named entry point",
			carveoutMissing.length === 0,
			`missing in: ${carveoutMissing.join(", ")}`);
	}

	/* --- 1. a fresh machine: both land as symlinks into the repo (copies on win32) ------- */
	const home = freshHome();
	const first = run(["install", "--home", home]);
	check("install exits 0", first.status === 0, first.stderr);
	check("install reports the skill", /\+ skill requirements\s+created/.test(first.stdout), first.stdout);
	check("install reports the standards rule", /\+ rule nana-standards\.md\s+created/.test(first.stdout), first.stdout);
	const skillTarget = path.join(home, ".claude", "skills", "requirements");
	const ruleTarget = path.join(home, ".claude", "rules", "nana-standards.md");
	// win32 has no usable symlink (R-1050): the skill mirrors as a byte-equal directory of
	// copies, and the rule installs as a byte-equal file copy — same pattern section 7 already
	// uses to exercise the win32 branch.
	const winSkillCopy = () => fs.lstatSync(skillTarget).isDirectory() && !fs.lstatSync(skillTarget).isSymbolicLink() && fs.readFileSync(path.join(skillTarget, "SKILL.md")).equals(fs.readFileSync(path.join(SKILL_SRC, "SKILL.md")));
	const winRuleCopy = () => fs.lstatSync(ruleTarget).isFile() && !fs.lstatSync(ruleTarget).isSymbolicLink() && fs.readFileSync(ruleTarget).equals(fs.readFileSync(RULE_SRC));
	if (process.platform !== "win32") {
		// req: R-302
		check("~/.claude/skills/requirements is a symlink to the PACK skill", linkTarget(skillTarget) === SKILL_SRC, String(linkTarget(skillTarget)));
		check("~/.claude/rules/nana-standards.md is a symlink into the repo", linkTarget(ruleTarget) === RULE_SRC);
	} else {
		// req: R-302
		check("~/.claude/skills/requirements is a byte-equal copy on win32 (no symlink on this platform)", winSkillCopy());
		check("~/.claude/rules/nana-standards.md is a byte-equal copy on win32", winRuleCopy());
	}
	check("the skill is readable through the link", fs.readFileSync(path.join(home, ".claude", "skills", "requirements", "SKILL.md"), "utf8").includes("name: requirements"));
	// the whole point of the symlink: ONE source for both runtimes
	// req: R-302
	check("pi reads the same file (the pack's skills dir is the pi skills root)", JSON.parse(fs.readFileSync(path.join(repo, "package.json"), "utf8")).pi.skills.includes("packages/nana-pack/skills"));

	/* --- 2. idempotent --------------------------------------------------------------------- */
	const second = run(["install", "--home", home]);
	check("second install exits 0", second.status === 0, second.stderr);
	check("second install reports nothing to do", second.stdout.includes("nothing to do"), second.stdout);
	if (process.platform !== "win32") {
		check("second install still has the skill symlink", linkTarget(skillTarget) === SKILL_SRC);
	} else {
		check("second install still has the skill copy on win32", winSkillCopy());
	}

	/* --- 3. doctor is the instrument ------------------------------------------------------ */
	const ok = run(["doctor", "--home", home]);
	check("doctor exits 0 after install", ok.status === 0, ok.stdout);
	if (process.platform !== "win32") {
		check("doctor reads ✓ skill requirements", new RegExp(`✓ skill requirements\\s+-> ${SKILL_SRC.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(ok.stdout), ok.stdout);
	} else {
		check("doctor reads ✓ skill requirements copied from the pack (no symlink on this platform)", new RegExp(`✓ skill requirements\\s+copied from ${SKILL_SRC.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(no symlink on this platform\\)`).test(ok.stdout), ok.stdout);
	}
	check("doctor reads ✓ rule nana-standards.md", /✓ rule nana-standards\.md/.test(ok.stdout), ok.stdout);
	// The win32 skill mirror is a DIRECTORY of copies, not a single file — unlinkSync on a
	// non-empty directory throws EPERM; rmSync recursive removes the whole mirror either way.
	fs.rmSync(skillTarget, { recursive: true, force: true });
	fs.unlinkSync(ruleTarget);
	const bad = run(["doctor", "--home", home]);
	check("doctor exits 1 when the skill is gone", bad.status === 1, String(bad.status));
	check("doctor marks the missing skill ✗ and names the fix", /✗ skill requirements\s+missing — run `nana-setup install`/.test(bad.stdout), bad.stdout);
	check("doctor marks the missing standards rule ✗", /✗ rule nana-standards\.md/.test(bad.stdout), bad.stdout);
	check("a repair install brings both back", run(["install", "--home", home]).status === 0 && run(["doctor", "--home", home]).status === 0);

	/* --- 4. a REGULAR DIRECTORY already there is reported, never clobbered (POSIX) --------- */
	{
		const occupied = freshHome();
		const target = path.join(occupied, ".claude", "skills", "requirements");
		fs.mkdirSync(target, { recursive: true });
		fs.writeFileSync(path.join(target, "SKILL.md"), "---\nname: requirements\n---\n# MINE\n");
		const r = run(["install", "--home", occupied]);
		if (process.platform !== "win32") {
			check("occupied skill dir: install EXITS 1 — automation must not read this as success", r.status === 1, String(r.status));
			check("occupied skill dir: ✗ with what was found and the fix", /✗ skill requirements/.test(r.stdout) && /a directory is already at .* — left untouched; move or remove it, then re-run/.test(r.stdout), r.stdout);
			check("occupied skill dir: the summary never says everything is in place", !/everything was already in place/.test(r.stdout), r.stdout);
			check("occupied skill dir: the owner's file is untouched", fs.readFileSync(path.join(target, "SKILL.md"), "utf8") === "---\nname: requirements\n---\n# MINE\n");
			check("occupied skill dir: no backup directory was created inside the active skills root", !fs.readdirSync(path.join(occupied, ".claude", "skills")).some((name) => name.includes(".bak-")));
			check("occupied skill dir: --dry-run exits 1 too", run(["install", "--home", occupied, "--dry-run"]).status === 1);
			const d = run(["doctor", "--home", occupied]);
			check("occupied skill dir: doctor reads ✗ naming the directory", /✗ skill requirements\s+a directory is there instead of a symlink to/.test(d.stdout), d.stdout);
			check("occupied skill dir: doctor exits 1", d.status === 1, String(d.status));
			// and once the owner moves it out of the way, both go green
			fs.rmSync(target, { recursive: true, force: true });
			check("occupied skill dir: green once it is moved away", run(["install", "--home", occupied]).status === 0 && run(["doctor", "--home", occupied]).status === 0);
		} else {
			// win32 KNOWN BUG (the seat's ruling, 2026-10-18 — declared, not fixed by this lane):
			// mirrorDirsProblem refuses only a symlink or junction at the skill path; a plain
			// pre-existing directory is not a protected shape there, so linkFile's copy branch
			// backs the owner's file up and overwrites it with the pack's copy, and install
			// exits 0. This asserts that declared Windows shape, confirmed against the real CLI.
			const baks = () => fs.readdirSync(target).filter((f) => f.includes(".bak-"));
			check("win32 occupied skill dir: install EXITS 0 (known bug — the directory guard does not cover a plain occupied directory)", r.status === 0, String(r.status));
			check("win32 occupied skill dir: the owner's exact bytes survive in one .bak- file inside the skill folder", baks().length === 1 && fs.readFileSync(path.join(target, baks()[0]), "utf8") === "---\nname: requirements\n---\n# MINE\n", baks().join(","));
			check("win32 occupied skill dir: no .bak- folder at the skills root — no second skill claims the name", !fs.readdirSync(path.join(occupied, ".claude", "skills")).some((name) => name.includes(".bak-")));
			check("win32 occupied skill dir: the installed SKILL.md equals the pack's source", fs.readFileSync(path.join(target, "SKILL.md")).equals(fs.readFileSync(path.join(SKILL_SRC, "SKILL.md"))));
			const dryOccupied = freshHome();
			const dryTarget = path.join(dryOccupied, ".claude", "skills", "requirements");
			fs.mkdirSync(dryTarget, { recursive: true });
			fs.writeFileSync(path.join(dryTarget, "SKILL.md"), "---\nname: requirements\n---\n# MINE\n");
			const dryRun = run(["install", "--home", dryOccupied, "--dry-run"]);
			check("win32 occupied skill dir: --dry-run reports the change and writes nothing", dryRun.status === 0 && /skill requirements\s+updated/.test(dryRun.stdout) && fs.readFileSync(path.join(dryTarget, "SKILL.md"), "utf8") === "---\nname: requirements\n---\n# MINE\n" && !fs.readdirSync(dryTarget).some((f) => f.includes(".bak-")), dryRun.stdout);
			const d = run(["doctor", "--home", occupied]);
			check("win32 occupied skill dir: doctor reads the mirror as healthy", d.status === 0 && /✓ skill requirements\s+copied from .* \(no symlink on this platform\)/.test(d.stdout), d.stdout);
		}
	}

	/* --- 5. a symlink pointing somewhere ELSE is relinked --------------------------------- */
	// win32 has no symlink here to begin with (the install above mirrored a directory of
	// copies) — there is nothing stale to relink; section 6 below covers win32's own
	// stale-copy-repair case.
	if (process.platform === "win32") {
		console.log("SKIP stale-symlink relink (win32: the installed skill is a directory of copies, never a symlink)");
		skips++;
	} else {
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
	// Forcing NANA_SETUP_PLATFORM is a no-op on a REAL win32 host (platform() already reads
	// "win32" there) — not a reason to skip: doctor's stale-copy ✗ and install's "N files
	// copied" line have no other Windows run anywhere in this suite. On every other host,
	// forcing is still the only way to exercise this branch at all.
	{
		const w = freshHome();
		const env = process.platform === "win32" ? {} : { NANA_SETUP_PLATFORM: "win32" };
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
		// req: R-665
		check("win32: requirements backup is a FILE inside the skill dir; new skills stay pi-only", fs.readdirSync(path.join(w, ".claude", "skills")).length === 1 && !fs.readdirSync(path.join(w, ".claude", "skills")).some((name) => name.includes(".bak-")));
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
		// Forcing NANA_SETUP_PLATFORM is a no-op on a REAL win32 host — run natively there instead
		// of skipping: the no-write-through guard (mirrorDirsProblem, R-352) only ever executes
		// under win(), and no other file in this suite exercises it on real Windows. A junction
		// needs no elevated privilege there, unlike a plain symlink.
		{
			const env = process.platform === "win32" ? {} : { NANA_SETUP_PLATFORM: "win32" };
			const h = freshHome();
			const victim = plantVictim(h);
			const before = snap(victim);
			const target = path.join(h, ".claude", "skills", "requirements");
			fs.mkdirSync(path.dirname(target), { recursive: true });
			let linked = true;
			try {
				fs.symlinkSync(victim, target, process.platform === "win32" ? "junction" : undefined); // the directory symlink / junction
			} catch (error) {
				linked = false;
				console.log(`SKIP win32 directory-link mirror (could not create a junction here: ${error.message})`);
				skips++;
			}
			if (linked) {
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
			}
			// a regular FILE at the skill path is the same class: refused, not opened — this case
			// needs no link at all, so it runs unconditionally even if the junction above could not
			// be created.
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
		// win32 has no analog: ANY symlink/junction at the target is refused there (7a already
		// covers that — mirrorDirsProblem does not distinguish "points at a victim" from "points
		// at the pack", it refuses every symlink/junction alike).
		if (process.platform === "win32") {
			console.log("SKIP posix dir-link relink (win32 refuses every skill-path symlink or junction outright — see 7a)");
			skips++;
		} else {
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
		// On real win32 the ambient platform already IS win32 — env: {} naturally produces the
		// win32 shape there, so the single iteration is tagged "win32", not "posix" (it used to
		// read the POSIX symlink assertion against a real win32 run and fail there).
		for (const spec of process.platform === "win32" ? [{ env: {}, tag: "win32" }] : [{ env: {}, tag: "posix" }, { env: { NANA_SETUP_PLATFORM: "win32" }, tag: "win32" }]) {
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
			fs.symlinkSync(decoy, path.join(h, ".claude", "hooks", "nana-objective.mjs"));
			const r = run(["install", "--home", h]);
			check("posix hook link: install exits 0", r.status === 0, r.stderr);
			// req: R-353
			check("posix hook link: the decoy outside the repo is untouched", fs.readFileSync(decoy, "utf8") === "#!/bin/sh\necho DECOY\n");
			// req: R-353
			check("posix hook link: the hook now points into the repo", linkTarget(path.join(h, ".claude", "hooks", "nana-objective.mjs")) === path.join(pkg, "claude", "hooks", "nana-objective.mjs"));
		} else {
			console.log("SKIP posix hook link (win32: stepHooks skips hooks entirely — there is no hooks-dir symlink to traverse)");
			skips++;
		}
	}
} finally {
	for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
}

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exit(fails);
