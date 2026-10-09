/**
 * @module packages/nana-setup/tests/install.test.mjs
 * @purpose Pins that `install` is idempotent, additive, and never destroys what the owner wrote by hand
 * @inputs bin/nana-setup.mjs, lib/settings.mjs, lib/steps.mjs, lib/doctor.mjs, and a throwaway --home
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts, settings files, symlinks), process (spawns the installer CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: `install` is idempotent, additive, and never destroys what the owner wrote by hand.
// Every run here goes into a throwaway --home; nothing touches the real machine.
import assert from "node:assert/strict";
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const { commandInvokes, desiredHooks } = await import(new URL("../lib/settings.mjs", import.meta.url).href);
const { PI_SUBAGENTS_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { ruleSource } = await import(new URL("../lib/steps.mjs", import.meta.url).href);

/**
 * A minimal, SEPARATE re-implementation of pi-subagents' own documented frontmatter contract
 * (byte 0 is "---", a line starting "---" ends the block) — deliberately not steps.mjs's
 * firstBodyLine(), so this pins the seed's DISCOVERABILITY as a valid agent independently of
 * nana's own helper (astra r1, 2026-10-04, MUST 3b: astra ran the real pi-subagents 0.75.0
 * discovery code against this seed and confirmed these exact frontmatter values).
 */
function parseFrontmatterIndependently(content) {
	if (!content.startsWith("---\n")) return null;
	const end = content.indexOf("\n---", 4);
	if (end === -1) return null;
	const fm = {};
	for (const line of content.slice(4, end).split("\n")) {
		const m = line.match(/^([\w-]+):\s*(.*)$/);
		if (m) fm[m[1]] = m[2].trim();
	}
	return fm;
}

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

// req: R-589
check("steps module outputs contract names the nana-setup PATH link", /<binDir>\/pi-review, pi-worker, nana-land and nana-setup/.test(fs.readFileSync(path.join(pkg, "lib", "steps.mjs"), "utf8")));

const tmps = [];
/** The pi-subagents vendor package nana-setup only READS (never installs — architecture-ruling
 *  §2): every throwaway home seeds it at the floor, the way a real, already-set-up machine has
 *  it, so doctor's version check (R-364) doesn't fail every fixture that isn't testing it. */
function seedPiSubagents(td, version = PI_SUBAGENTS_FLOOR) {
	const dir = path.join(td, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "pi-subagents", version }));
}

/** A temp home with a tiny knowledge source, so the real build runs but indexes 1 file. */
function freshHome() {
	const td = tmpDir(path.join(os.tmpdir(), "nana-setup-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.mkdirSync(path.join(td, "src"), { recursive: true });
	fs.writeFileSync(path.join(td, "src", "note.md"), "# Note\nOne tiny knowledge file.\n");
	fs.writeFileSync(
		path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"),
		JSON.stringify({ roots: [{ path: path.join(td, "src"), kind: "articles" }] }),
	);
	seedPiSubagents(td);
	return td;
}

const run = (args) => args[0] === "doctor"
	? withPiStub(() => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" }))
	: spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });

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
for (const h of ["nana-objective.mjs", "nana-adoption.mjs", "nana-shared-memory.mjs", "verifier-pipe.mjs"]) {
	// req: R-301 R-985
	check(`hook ${h} is a symlink into the repo`, link(path.join(home, ".claude", "hooks", h)) === path.join(pkg, "claude", "hooks", h));
}
// req: R-357
check("adoption Node hook is installed as a repo symlink", link(path.join(home, ".claude", "hooks", "nana-adoption.mjs")) === path.join(pkg, "claude", "hooks", "nana-adoption.mjs"));
// req: R-301
check("rule nana-soul.md is a symlink into the repo", link(path.join(home, ".claude", "rules", "nana-soul.md")) === path.join(pkg, "claude", "rules", "nana-soul.md"));
// req: R-301
check("rule nana-standards.md is a symlink into the repo", link(path.join(home, ".claude", "rules", "nana-standards.md")) === path.join(pkg, "claude", "rules", "nana-standards.md"));
// req: R-301
check("rule nana-writing.md is a symlink into the repo (sourced from the pack, not nana-setup's own claude/rules)", link(path.join(home, ".claude", "rules", "nana-writing.md")) === ruleSource("nana-writing.md"));
// Amendment 1 acceptance #10: delivery to pi moved to a pack extension — install never
// creates an agent-dir AGENTS.md (the agent-dir link step was removed).
check("no AGENTS.md was created in the pi agent dir", !fs.existsSync(path.join(home, ".pi", "agent", "AGENTS.md")));
// Claude Code reads the pack's own skill — one source for both runtimes (skills-and-standards.test.mjs owns the detail)
// req: R-302
check("skill requirements is a symlink to the pack skill", link(path.join(home, ".claude", "skills", "requirements")) === path.join(repo, "packages", "nana-pack", "skills", "requirements"));
for (const name of ["spec", "py-lint", "py-review", "py-test"]) {
	// req: R-665
	check(`skill ${name} is a symlink to the pack skill`, link(path.join(home, ".claude", "skills", name)) === path.join(repo, "packages", "nana-pack", "skills", name));
}
// req: R-301
check("retired context hook is not installed", !fs.existsSync(path.join(home, ".claude", "hooks", "context-size-check.sh")));
const personal = path.join(home, ".claude", "rules", "nana-personal.md");
check("private rule is a REGULAR file (never a link into the repo)", fs.lstatSync(personal).isFile());
// req: R-306
check("private rule is not in the repo", !fs.existsSync(path.join(pkg, "claude", "rules", "nana-personal.md")));

const settings = JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"));
const commands = Object.values(settings.hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
// req: R-301
check("retired context hook is absent from settings", !JSON.stringify(settings).includes("context-size-check.sh"));
for (const w of desiredHooks({ hooksDir: path.join(home, ".claude", "hooks"), repoRoot: repo })) {
	check(`settings.json wires ${w.marker}`, commands.some((c) => commandInvokes(c, w.spec)));
}
// req: R-321
check("settings.json ends with a newline", fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8").endsWith("}\n"));
check("knowledge hook points at this install root", commands.some((c) => c.includes(path.join(repo, "packages", "nana-knowledge"))));

// req: R-308
check("shared memory index seeded", fs.readFileSync(path.join(home, ".claude", "nana-memory", "shared", "MEMORY.md"), "utf8").startsWith("# Shared memory"));
// req: R-921
check("installer leaves per-project shared-link creation to the SessionStart hook", !fs.existsSync(path.join(home, ".claude", "projects")));
check("pi nana-pack.json seeded", JSON.parse(fs.readFileSync(path.join(home, ".pi", "agent", "nana-pack.json"), "utf8")).objective.projectFile === "OBJECTIVE.md");
check("pi nana-objective.md seeded", fs.existsSync(path.join(home, ".pi", "agent", "nana-objective.md")));
const seededSubagentConfig = JSON.stringify(JSON.parse(fs.readFileSync(path.join(home, ".pi", "agent", "extensions", "subagent", "config.json"), "utf8")));
const subagentConfigSeed = JSON.stringify(JSON.parse(fs.readFileSync(path.join(pkg, "pi", "subagent-config.seed.json"), "utf8")));
// req: R-360
check("subagent config seeded when absent", seededSubagentConfig === subagentConfigSeed);
const installedReviewerBytes = fs.readFileSync(path.join(home, ".pi", "agent", "agents", "reviewer.md"), "utf8");
const reviewerSeedBytes = fs.readFileSync(path.join(pkg, "pi", "reviewer.seed.md"), "utf8");
// req: R-363
check("reviewer agent seeded when absent (full byte match with the seed)", installedReviewerBytes === reviewerSeedBytes);
// A file holding only the marker would pass a marker-only check without being the seed, or a
// discoverable reviewer (astra r1 MUST 3b) — so this independently parses the INSTALLED file's
// frontmatter and checks the fields pi-subagents' own discovery reads.
const installedReviewerFrontmatter = parseFrontmatterIndependently(installedReviewerBytes);
const isValidReviewerAgent =
	installedReviewerBytes.startsWith("---") &&
	installedReviewerFrontmatter?.name === "reviewer" &&
	Boolean(installedReviewerFrontmatter?.description) &&
	(installedReviewerFrontmatter?.tools ?? "").split(",").map((t) => t.trim()).includes("bash");
// req: R-363
check("reviewer agent: valid frontmatter independently parsed (byte 0 is ---, name/description/tools incl. bash)", isValidReviewerAgent, JSON.stringify(installedReviewerFrontmatter));
// req: R-310
check("knowledge index built", fs.existsSync(path.join(home, ".pi", "agent", "nana-knowledge", "index.db")));
// req: R-311
check("pi-review on PATH", link(path.join(home, ".local", "bin", "pi-review")) === path.join(repo, "packages", "nana-pack", "bin", "pi-review.mjs"));
const landDoctorEvidence = (() => {
	try {
		const bin = path.join(home, ".local", "bin", "nana-land");
		assert.equal(link(bin), path.join(repo, "packages", "nana-pack", "bin", "nana-land.mjs"));
		assert.match(spawnSync(bin, [], { encoding: "utf8" }).stdout, /usage: nana-land/);
		const healthy = run(["doctor", "--home", home]); assert.equal(healthy.status, 0, healthy.stdout); assert.match(healthy.stdout, /✓ PATH nana-land/);
		const brokenHome = freshHome(); assert.equal(run(["install", "--home", brokenHome]).status, 0);
		fs.unlinkSync(path.join(brokenHome, ".local", "bin", "nana-land"));
		const missing = run(["doctor", "--home", brokenHome]); assert.notEqual(missing.status, 0, missing.stdout); assert.match(missing.stdout, /✗ PATH nana-land/);
		return { ok: true };
	} catch (error) { return { ok: false, detail: error.message }; }
})();
// req: R-980
check("land bin is linked, executable, and doctor reports accurate state", landDoctorEvidence.ok, landDoctorEvidence.detail);
// req: R-964
check("pi-worker installed as PATH symlink", link(path.join(home, ".local", "bin", "pi-worker")) === path.join(repo, "packages", "nana-pack", "bin", "pi-worker.mjs"));
const setupLink = path.join(home, ".local", "bin", "nana-setup");
// req: R-589
check("nana-setup installed as PATH symlink", link(setupLink) === path.join(pkg, "bin", "nana-setup.mjs"));
// req: R-589
check("nana-setup symlink dispatches usage", spawnSync(setupLink, ["--help"], { encoding: "utf8" }).stdout.includes("nana-setup install [options]"));
const setupDoctor = run(["doctor", "--home", home]);
// req: R-589
check("doctor reports healthy nana-setup link", setupDoctor.status === 0 && /✓ PATH nana-setup/.test(setupDoctor.stdout));
const setupBrokenHome = freshHome();
run(["install", "--home", setupBrokenHome]);
fs.unlinkSync(path.join(setupBrokenHome, ".local", "bin", "nana-setup"));
const setupMissingDoctor = run(["doctor", "--home", setupBrokenHome]);
// req: R-589
check("doctor rejects missing nana-setup link", setupMissingDoctor.status !== 0 && /✗ PATH nana-setup/.test(setupMissingDoctor.stdout));
fs.unlinkSync(setupLink);
fs.symlinkSync(path.join(repo, "packages", "nana-pack", "bin", "pi-review.mjs"), setupLink);
const setupWrongDoctor = run(["doctor", "--home", home]);
// req: R-589
check("doctor rejects wrong nana-setup target", setupWrongDoctor.status === 1 && /✗\s+PATH nana-setup/.test(setupWrongDoctor.stdout));
run(["install", "--home", home]);
const workerDoctor = run(["doctor", "--home", home]);
// req: R-964
check("doctor reports the installed pi-worker link", workerDoctor.status === 0 && /PATH pi-worker/.test(workerDoctor.stdout));
const workerLink = path.join(home, ".local", "bin", "pi-worker");
fs.unlinkSync(workerLink);
fs.symlinkSync(path.join(repo, "packages", "nana-pack", "bin", "pi-review.mjs"), workerLink);
const wrongWorkerDoctor = run(["doctor", "--home", home]);
// req: R-964
check("doctor reports an incorrect pi-worker link", wrongWorkerDoctor.status === 1 && /✗\s+PATH pi-worker/.test(wrongWorkerDoctor.stdout));
fs.unlinkSync(workerLink);
fs.symlinkSync(path.join(repo, "packages", "nana-pack", "bin", "pi-worker.mjs"), workerLink);
// req: R-311
check("pi-review is executable with a node shebang", fs.readFileSync(path.join(repo, "packages", "nana-pack", "bin", "pi-review.mjs"), "utf8").startsWith("#!/usr/bin/env node") && (fs.statSync(path.join(repo, "packages", "nana-pack", "bin", "pi-review.mjs")).mode & 0o111) !== 0);
// req: R-311
check("nana-pack package.json declares the pi-review bin", JSON.parse(fs.readFileSync(path.join(repo, "packages", "nana-pack", "package.json"), "utf8")).bin?.["pi-review"] === "bin/pi-review.mjs");
check("no desk plist without --desk", !fs.existsSync(path.join(home, "Library", "LaunchAgents", "com.nana.pi-desk.plist")));

/* --- 2. re-running changes nothing --------------------------------------------------- */
const before = JSON.stringify(walk(home));
const second = run(["install", "--home", home]);
check("second install exits 0", second.status === 0, second.stderr);
// req: R-300
check("second install reports nothing to do", second.stdout.includes("nothing to do"));
// req: R-300
check("second install reports no created/updated line", !/^\s+\+ /m.test(second.stdout), second.stdout);
// req: R-300
check("second install left the tree byte-identical", JSON.stringify(walk(home)) === before);
// req: R-964
check("second install keeps the identical pi-worker link", link(path.join(home, ".local", "bin", "pi-worker")) === path.join(repo, "packages", "nana-pack", "bin", "pi-worker.mjs"));
// req: R-589
check("second install keeps the identical nana-setup link", link(setupLink) === path.join(pkg, "bin", "nana-setup.mjs"));

/* --- 3. a regular file in the way is backed up, not clobbered ------------------------- */
const collide = freshHome();
fs.mkdirSync(path.join(collide, ".claude", "hooks"), { recursive: true });
fs.writeFileSync(path.join(collide, ".claude", "hooks", "nana-objective.mjs"), "# hand-written\n");
const bak = run(["install", "--home", collide]);
const baks = fs.readdirSync(path.join(collide, ".claude", "hooks")).filter((f) => f.includes(".bak-"));
// req: R-312
check("collision: exactly one backup written", baks.length === 1, baks.join(","));
// req: R-312
check("collision: backup keeps the old content", fs.readFileSync(path.join(collide, ".claude", "hooks", baks[0]), "utf8") === "# hand-written\n");
check("collision: target is now the repo symlink", link(path.join(collide, ".claude", "hooks", "nana-objective.mjs")) === path.join(pkg, "claude", "hooks", "nana-objective.mjs"));
// req: R-312
check("collision: the backup is reported", bak.stdout.includes("backed up"));

/* --- 4. what the installer must never overwrite --------------------------------------- */
const keep = freshHome();
fs.mkdirSync(path.join(keep, ".claude", "rules"), { recursive: true });
fs.writeFileSync(path.join(keep, ".claude", "rules", "nana-personal.md"), "MINE\n");
fs.writeFileSync(path.join(keep, ".pi", "agent", "nana-pack.json"), '{"objective":{"path":"/somewhere/OBJECTIVE.md"}}');
fs.writeFileSync(path.join(keep, ".pi", "agent", "nana-objective.md"), "MY OBJECTIVE\n");
fs.mkdirSync(path.join(keep, ".pi", "agent", "extensions", "subagent"), { recursive: true });
fs.writeFileSync(path.join(keep, ".pi", "agent", "extensions", "subagent", "config.json"), '{"forceTopLevelAsync":false}');
fs.mkdirSync(path.join(keep, ".pi", "agent", "agents"), { recursive: true });
fs.writeFileSync(path.join(keep, ".pi", "agent", "agents", "reviewer.md"), "MY REVIEWER\n");
run(["install", "--home", keep]);
// req: R-306
check("existing nana-personal.md untouched", fs.readFileSync(path.join(keep, ".claude", "rules", "nana-personal.md"), "utf8") === "MINE\n");
// req: R-309
check("existing nana-pack.json untouched", fs.readFileSync(path.join(keep, ".pi", "agent", "nana-pack.json"), "utf8") === '{"objective":{"path":"/somewhere/OBJECTIVE.md"}}');
check("existing nana-objective.md untouched", fs.readFileSync(path.join(keep, ".pi", "agent", "nana-objective.md"), "utf8") === "MY OBJECTIVE\n");
// req: R-360
check("existing subagent config.json byte-identical after install", fs.readFileSync(path.join(keep, ".pi", "agent", "extensions", "subagent", "config.json"), "utf8") === '{"forceTopLevelAsync":false}');
// req: R-363
check("existing reviewer.md untouched", fs.readFileSync(path.join(keep, ".pi", "agent", "agents", "reviewer.md"), "utf8") === "MY REVIEWER\n");

/* --- 5. the private rule is created only when absent ---------------------------------- */
const absent = freshHome();
run(["install", "--home", absent]);
const seeded = fs.readFileSync(path.join(absent, ".claude", "rules", "nana-personal.md"), "utf8");
// req: R-306
check("private rule is seeded from the example", seeded === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-personal.example.md"), "utf8"));
check("the example carries the same top heading as the real rule", seeded.startsWith("# Who you're working with"));

/* --- 6. doctor is the instrument ------------------------------------------------------ */
const ok = run(["doctor", "--home", home]);
check("doctor exits 0 after install", ok.status === 0, ok.stdout);
check("doctor prints no ✗ after install", !ok.stdout.includes("✗"));
// the seed writes projectFile "OBJECTIVE.md" explicitly — that is the default, not a rename
// req: R-343
check("doctor calls the seeded projectFile the default, not a rename",
	/objective\.projectFile\s+per-repo OBJECTIVE\.md \(the default name\)/.test(ok.stdout) && !ok.stdout.includes("renamed"), ok.stdout);
fs.unlinkSync(path.join(home, ".claude", "hooks", "nana-shared-memory.mjs"));
const bad = run(["doctor", "--home", home]);
// req: R-341
check("doctor exits 1 on a missing piece", bad.status === 1);
// req: R-341
check("doctor marks the missing piece with ✗", /✗ hook nana-shared-memory\.mjs/.test(bad.stdout));
run(["install", "--home", home]);
// req: R-341
check("doctor exits 0 again after a repair install", run(["doctor", "--home", home]).status === 0);

/* --- 7. --dry-run writes nothing ------------------------------------------------------ */
const dry = tmpDir(path.join(os.tmpdir(), "nana-setup-dry-"));
tmps.push(dry);
const dryRun = run(["install", "--home", dry, "--dry-run"]);
check("dry run exits 0", dryRun.status === 0, dryRun.stderr);
// req: R-313
check("dry run says would change", dryRun.stdout.includes("would change"));
// req: R-313
check("dry run created nothing", fs.readdirSync(dry).length === 0, fs.readdirSync(dry).join(","));

/* --- 8. a home with a SPACE in it: the generated commands must actually run ------------- */
{
	const spaced = tmpDir(path.join(os.tmpdir(), "Jane Doe "));
	tmps.push(spaced);
	fs.mkdirSync(path.join(spaced, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(spaced, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	seedPiSubagents(spaced);
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
	// req: R-319
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
	// req: R-313
	check("objective seed: the dry run does not offer to create it", /pi nana-objective\.md\s+unchanged\s+not needed/.test(dry.stdout), dry.stdout);
	const r = run(["install", "--home", elsewhere]);
	// req: R-309
	check("objective seed: not created when nana-pack.json points elsewhere", !fs.existsSync(path.join(elsewhere, ".pi", "agent", "nana-objective.md")));
	// req: R-309
	check("objective seed: the reason is reported", /not needed — objective\.path already points at/.test(r.stdout));
	check("objective seed: doctor is still green", run(["doctor", "--home", elsewhere]).status === 0, run(["doctor", "--home", elsewhere]).stdout);

	// and when the config IS ours, the starter file is created
	const ours = freshHome();
	run(["install", "--home", ours]);
	// req: R-309
	check("objective seed: created alongside a freshly seeded nana-pack.json", fs.existsSync(path.join(ours, ".pi", "agent", "nana-objective.md")));

	// an existing config that points AT the default file still gets it
	const pointsHere = freshHome();
	fs.writeFileSync(path.join(pointsHere, ".pi", "agent", "nana-pack.json"), JSON.stringify({ objective: { path: "~/.pi/agent/nana-objective.md" } }));
	run(["install", "--home", pointsHere]);
	// req: R-309
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
	// req: R-307
	check("private rule symlink: install EXITS 1 — automation must not read this as success", r.status === 1, String(r.status));
	// req: R-313
	check("private rule symlink: --dry-run exits 1 too", run(["install", "--home", home, "--dry-run"]).status === 1);
	// req: R-307
	check("private rule symlink: install reports ✗ with the fix", /rule nana-personal\.md \(private\)\s+problem\s+private rule is a symlink — replace with a regular file/.test(r.stdout), r.stdout);
	check("private rule symlink: the ✗ symbol is printed", /✗ rule nana-personal\.md \(private\)/.test(r.stdout), r.stdout);
	// req: R-307
	check("private rule symlink: the summary never says everything is in place", !/everything was already in place/.test(r.stdout), r.stdout);
	// req: R-307
	check("private rule symlink: nothing is written through the link", fs.lstatSync(personal).isSymbolicLink());
	const d = run(["doctor", "--home", home]);
	// req: R-307
	check("private rule symlink: doctor reads ✗ with the same message", /✗ rule nana-personal\.md\s+private rule is a symlink — replace with a regular file/.test(d.stdout), d.stdout);
	// req: R-307
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
