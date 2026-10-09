/**
 * @module packages/nana-setup/tests/retired-artifacts.test.mjs
 * @purpose Verifies safe retirement, provenance preservation, context-hook deregistration, and doctor visibility using isolated home trees.
 * @inputs nana-setup CLI, retirement manifest and throwaway home fixtures.
 * @outputs PASS/FAIL checks on stdout and a nonzero exit when an assertion fails.
 * @effects disk (temporary homes, backups, settings and symlinks), process (installer/doctor subprocesses).
 * @errors unexpected process or filesystem errors fail the test; assertion failures are counted.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fingerprintManifestComplete, matchesFingerprintArtifact, retiredArtifacts } from "../lib/retired.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import testFingerprints from "./fixtures/retired/dev-check-fingerprints.json" with { type: "json" };

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
let failures = 0;
const dirs = [];
const check = (name, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!ok) failures++;
};
function home() {
	const dir = tmpDir(path.join(os.tmpdir(), "nana-retired-"));
	dirs.push(dir);
	fs.mkdirSync(path.join(dir, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(dir, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	const vendor = path.join(dir, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(vendor, { recursive: true });
	fs.writeFileSync(path.join(vendor, "package.json"), JSON.stringify({ name: "pi-subagents", version: "0.75.0" }));
	return dir;
}
const run = (args, env = process.env) => {
	const invoke = () => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...env, PATH: process.env.PATH } });
	return args[0] === "doctor" ? withPiStub(invoke) : invoke();
};
const install = (h, extra = []) => run(["install", "--home", h, ...extra]);
const date = new Date().toISOString().slice(0, 10);
const backup = (h, root, rel) => path.join(h, root, "backups", `${date}-retired`, rel);
const fixture = path.join(pkg, "tests", "fixtures", "retired");
function copyTree(from, to) {
	const stat = fs.lstatSync(from);
	if (stat.isDirectory()) {
		fs.mkdirSync(to, { recursive: true });
		for (const name of fs.readdirSync(from)) copyTree(path.join(from, name), path.join(to, name));
	} else fs.copyFileSync(from, to);
}
function treeSnapshot(root) {
	const entries = [];
	const walk = (dir, rel = "") => {
		for (const name of fs.readdirSync(dir).sort()) {
			const child = path.join(dir, name);
			const childRel = rel ? `${rel}/${name}` : name;
			const stat = fs.lstatSync(child);
			if (stat.isDirectory()) { entries.push([childRel, "dir"]); walk(child, childRel); }
			else if (stat.isSymbolicLink()) entries.push([childRel, `link:${fs.readlinkSync(child)}`]);
			else entries.push([childRel, fs.readFileSync(child).toString("base64")]);
		}
	};
	walk(root);
	return JSON.stringify(entries);
}

try {
	{
		const realLegacy = path.join(fixture, "dev-check");
		const copied = path.join(home(), ".agents", "skills", "dev-check");
		copyTree(realLegacy, copied);
		// req: R-668 R-669
		check("copied real legacy skill matches its test-only exact manifest", matchesFingerprintArtifact(copied, "dev-check", testFingerprints));
		fs.appendFileSync(path.join(copied, "SKILL.md"), "owner edit\n");
		// req: R-669
		check("edited real legacy skill no longer matches its fingerprint", !matchesFingerprintArtifact(copied, "dev-check", testFingerprints));
		const addedHome = home();
		const added = path.join(addedHome, ".agents", "skills", "dev-check");
		copyTree(realLegacy, added);
		fs.writeFileSync(path.join(added, "owner-notes.md"), "owner file\n");
		// req: R-669
		check("added owner file invalidates real legacy artifact fingerprint", !matchesFingerprintArtifact(added, "dev-check", testFingerprints));
		const productionEntries = retiredArtifacts("/home/example");
		const productionFingerprints = JSON.parse(fs.readFileSync(path.join(pkg, "lib", "retired-fingerprints.json"), "utf8"));
		// req: R-668
		check("production fingerprints cover every declared artifact", fingerprintManifestComplete(productionEntries, productionFingerprints));
		const missingFingerprint = { ...productionFingerprints };
		delete missingFingerprint[".claude/enforce"];
		// req: R-668
		check("missing production fingerprint invalidates manifest completeness", !fingerprintManifestComplete(productionEntries, missingFingerprint));
		const names = productionEntries.map((entry) => entry.relative);
		// req: R-668
		check("manifest names all 22 requested legacy Agent Skills", ["dev-check", "dev-debrief", "dev-init", "dev-plan", "dev-scan", "dev-wiki", "knowledge-wiki", "memory-consolidate", "nana", "nana-init", "py-init", "ts-init", "wiki-absorb", "wiki-add", "wiki-bootstrap", "wiki-consolidate", "wiki-health", "wiki-index", "wiki-init", "wiki-query", "wiki-registry", "wiki-reorg"].every((name) => names.includes(`.agents/skills/${name}`)));
		// req: R-668
		check("manifest includes all Claude scaffolders, shared runtime-neutral copies, and both empty flags", ["py-init", "ts-init", "nana-init", "nana", "spec", "py-lint", "py-review", "py-test"].every((name) => names.includes(`.claude/skills/${name}`)) && names.includes(".claude/enforce") && names.includes(".claude/enforce-memory"));
		// req: R-668
		check("manifest excludes synced skills and unrelated Claude workflows", !names.some((name) => name.includes("synced") || name.startsWith(".claude/skills/dev-") || name.startsWith(".claude/skills/wiki-")) && !names.includes(".claude/skills/knowledge-wiki"));
	}
	{
		const h = home();
		const oldSkill = path.join(h, ".claude", "skills", "spec");
		copyTree(path.join(fixture, "spec"), oldSkill);
		const codex = path.join(h, ".agents", "skills", "dev-check");
		copyTree(path.join(fixture, "dev-check"), codex);
		const emptyFlag = path.join(h, ".claude", "enforce");
		fs.mkdirSync(path.dirname(emptyFlag), { recursive: true });
		fs.writeFileSync(emptyFlag, "");
		const hookSource = path.join(repo, "packages", "nana-setup", "claude", "hooks", "context-size-check.sh");
		const hookLink = path.join(h, ".claude", "hooks", "context-size-check.sh");
		fs.mkdirSync(path.dirname(hookLink), { recursive: true });
		fs.symlinkSync(hookSource, hookLink);
		const oldHookBackup = path.join(h, ".claude", "hooks", "nana-objective.sh.bak-20260918");
		fs.copyFileSync(path.join(fixture, "hook-backup"), oldHookBackup);
		const juneHook = path.join(h, ".claude", "hooks", "nana-june.sh.bak-20260622");
		fs.writeFileSync(juneHook, "# nana June copy retained\n");
		const foreignBackup = path.join(h, ".claude", "hooks", "foreign.sh.bak-20260918");
		fs.writeFileSync(foreignBackup, "owner backup mentions nana but is not in the captured manifest\n");
		const customizedHook = { type: "command", command: "bash ~/.claude/hooks/context-size-check.sh", owner: "Jake", enabled: true };
		const nonCommandHook = { type: "prompt", command: "bash ~/.claude/hooks/context-size-check.sh", prompt: "owner text" };
		const ownerHooks = [
			{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh --owner-variant" },
			customizedHook,
			nonCommandHook,
		];
		fs.writeFileSync(path.join(h, ".claude", "settings.json"), JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [
			{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh" },
			...ownerHooks,
		] }] } }, null, 2));
		const foreign = path.join(h, "foreign-skill");
		fs.mkdirSync(foreign, { recursive: true });
		fs.writeFileSync(path.join(foreign, "SKILL.md"), "Imported ~/.Codex content must not be followed\n");
		const linkedImport = path.join(h, ".agents", "skills", "wiki-query");
		fs.mkdirSync(path.dirname(linkedImport), { recursive: true });
		fs.symlinkSync(foreign, linkedImport);
		const synced = path.join(h, ".agents", "skills", "synced", "sample");
		fs.mkdirSync(synced, { recursive: true });
		fs.writeFileSync(path.join(synced, "SKILL.md"), "keep synced skill\n");
		const dry = install(h, ["--dry-run"]);
		// req: R-664
		check("dry-run reports a provenance-confirmed move", dry.status === 0 && dry.stdout.includes("would move to") && fs.existsSync(path.join(oldSkill, "SKILL.md")), dry.stdout);
		// req: R-664
		check("dry-run leaves flags and Agent Skills source in place", fs.existsSync(emptyFlag) && fs.existsSync(path.join(codex, "SKILL.md")), dry.stdout);
		const result = install(h);
		// req: R-663 R-665
		check("recognized Claude skill and empty flag move under dated backups", result.status === 0 && fs.existsSync(backup(h, ".claude", "skills/spec/SKILL.md")) && fs.existsSync(backup(h, ".claude", "enforce")), result.stdout);
		// req: R-663
		check("recognized Codex import moves under the agent backup root", fs.existsSync(backup(h, ".agents", "skills/dev-check/SKILL.md")), result.stdout);
		// req: R-663
		check("manifest symlink is not followed or moved", fs.lstatSync(linkedImport, { throwIfNoEntry: false })?.isSymbolicLink() && fs.readlinkSync(linkedImport) === foreign && fs.readFileSync(path.join(foreign, "SKILL.md"), "utf8").includes("must not be followed"), result.stdout);
		// req: R-668
		check("nana-owned 2026-09-18 hook backup is retired", fs.existsSync(backup(h, ".claude", "hooks/nana-objective.sh.bak-20260918")), result.stdout);
		// req: R-668
		check("June hook copies remain in place", fs.existsSync(juneHook));
		// req: R-668
		check("unrelated dated backup mentioning nana remains in place", fs.existsSync(foreignBackup));
		// req: R-661
		check("repository-managed context hook symlink is removed", !fs.existsSync(hookLink) && !fs.lstatSync(hookLink, { throwIfNoEntry: false }), result.stdout);
		const settings = JSON.parse(fs.readFileSync(path.join(h, ".claude", "settings.json"), "utf8"));
		const retainedContextEntries = settings.hooks.UserPromptSubmit[0].hooks.filter((hook) => hook.command === "bash ~/.claude/hooks/context-size-check.sh" || hook.command === "bash ~/.claude/hooks/context-size-check.sh --owner-variant");
		// req: R-660
		check("exact nana settings entry is removed while customized and non-command entries remain byte-identical", JSON.stringify(retainedContextEntries) === JSON.stringify(ownerHooks), JSON.stringify(retainedContextEntries));
		// req: R-662
		check("install prints a manual marker cleanup reminder", result.stdout.includes("delete .claude/.context-warned files manually"), result.stdout);
		// req: R-668
		check("synced Agent Skills content stays in place", fs.readFileSync(path.join(synced, "SKILL.md"), "utf8") === "keep synced skill\n");
		// req: R-665
		check("managed pack skill replaces the backed-up legacy spec", fs.realpathSync(path.join(h, ".claude", "skills", "spec")) === fs.realpathSync(path.join(repo, "packages", "nana-pack", "skills", "spec")));
		// req: R-666
		check("doctor reads a canonical pack skill link as healthy", run(["doctor", "--home", h]).stdout.includes("✓ skill spec"));
		const rerun = install(h);
		// req: R-669
		check("rerun after completed moves succeeds and keeps the dated backup", rerun.status === 0 && fs.existsSync(backup(h, ".claude", "skills/spec/SKILL.md")), rerun.stdout);
		const interrupted = home();
		const pending = path.join(interrupted, ".claude", "skills", "nana");
		copyTree(path.join(fixture, "nana"), pending);
		fs.mkdirSync(path.dirname(backup(interrupted, ".claude", "skills/nana")), { recursive: true });
		const recovered = install(interrupted);
		// req: R-669
		check("rerun recovers after the dated backup directory was created but before rename", recovered.status === 0 && fs.existsSync(backup(interrupted, ".claude", "skills/nana/SKILL.md")), recovered.stdout);
	}
	{
		const h = home();
		const external = tmpDir(path.join(os.tmpdir(), "nana-source-target-"));
		dirs.push(external);
		copyTree(path.join(fixture, "spec"), path.join(external, "spec"));
		fs.mkdirSync(path.join(external, "py-lint"), { recursive: true });
		fs.writeFileSync(path.join(external, "py-lint", "owner.txt"), "external owner bytes\n");
		fs.mkdirSync(path.join(h, ".claude"), { recursive: true });
		fs.symlinkSync(external, path.join(h, ".claude", "skills"));
		const before = treeSnapshot(external);
		const dry = install(h, ["--dry-run"]);
		const dryUnchanged = treeSnapshot(external) === before;
		const result = install(h);
		// req: R-663
		check("source symlink ancestors are refused without changing their external target", dry.status !== 0 && result.status !== 0 && dryUnchanged && treeSnapshot(external) === before, `${dry.stdout}\n${result.stdout}`);
	}
	{
		const h = home();
		const external = tmpDir(path.join(os.tmpdir(), "nana-hook-target-"));
		dirs.push(external);
		const hook = path.join(external, "context-size-check.sh");
		fs.writeFileSync(hook, "keep hook\n");
		fs.mkdirSync(path.join(h, ".claude"), { recursive: true });
		fs.symlinkSync(external, path.join(h, ".claude", "hooks"));
		const result = install(h);
		// req: R-663
		check("hook source symlink ancestor is refused without changing its external target", result.status !== 0 && fs.readFileSync(hook, "utf8") === "keep hook\n", result.stdout);
	}
	{
		const h = home();
		const external = tmpDir(path.join(os.tmpdir(), "nana-backup-target-"));
		dirs.push(external);
		fs.mkdirSync(path.join(h, ".claude"), { recursive: true });
		fs.writeFileSync(path.join(h, ".claude", "enforce"), "");
		fs.symlinkSync(external, path.join(h, ".claude", "backups"));
		const result = install(h);
		// req: R-663
		check("backup symlink ancestors are refused without changing their external target", result.status !== 0 && fs.existsSync(path.join(h, ".claude", "enforce")) && fs.readdirSync(external).length === 0, result.stdout);
	}
	{
		const h = home();
		const alternateClaude = path.join(h, "alternate-claude");
		const defaultSkill = path.join(h, ".claude", "skills", "spec");
		const selectedSkill = path.join(alternateClaude, "skills", "spec");
		copyTree(path.join(fixture, "spec"), defaultSkill);
		copyTree(path.join(fixture, "spec"), selectedSkill);
		const result = run(["install", "--home", h, "--claude-home", alternateClaude]);
		// req: R-663
		check("alternate Claude home scopes retirement away from the default home", result.status === 0 && fs.existsSync(path.join(defaultSkill, "SKILL.md")) && fs.realpathSync(selectedSkill) === fs.realpathSync(path.join(repo, "packages", "nana-pack", "skills", "spec")) && fs.existsSync(path.join(alternateClaude, "backups", `${date}-retired`, "skills", "spec", "SKILL.md")), result.stdout);
	}
	{
		const h = home();
		const alternateClaude = path.join(h, "selected-claude");
		fs.mkdirSync(path.join(alternateClaude), { recursive: true });
		fs.writeFileSync(path.join(alternateClaude, "enforce"), "");
		const result = run(["doctor", "--home", h, "--claude-home", alternateClaude]);
		// req: R-667
		check("doctor checks enforcement flags in the selected Claude home", result.stdout.includes("! legacy enforcement flags") && result.stdout.includes("enforce present"), result.stdout);
	}
	{
		const h = home();
		const ownerSkill = path.join(h, ".claude", "skills", "spec");
		fs.mkdirSync(ownerSkill, { recursive: true });
		fs.writeFileSync(path.join(ownerSkill, "SKILL.md"), "owner-authored spec\n");
		const legacyDir = path.join(h, ".claude", "skills", "py-init");
		copyTree(path.join(fixture, "py-init"), legacyDir);
		fs.writeFileSync(path.join(h, ".claude", "enforce-memory"), "");
		const before = run(["doctor", "--home", h]);
		// req: R-667
		check("doctor warns while active enforcement flags and legacy scaffolders remain", before.stdout.includes("! legacy enforcement flags") && before.stdout.includes("! legacy scaffolders"), before.stdout);
		const result = install(h);
		// req: R-663 R-669
		check("provenance mismatch remains untouched and is reported", result.status === 1 && fs.readFileSync(path.join(ownerSkill, "SKILL.md"), "utf8") === "owner-authored spec\n" && result.stdout.includes("unrecognized kind or provenance"), result.stdout);
		const doc = run(["doctor", "--home", h]);
		// req: R-666
		check("doctor reports a same-name regular skill directory as unhealthy", doc.stdout.includes("✗ skill spec") && doc.status === 1, doc.stdout);
		// req: R-667
		check("doctor reports absent legacy wiring as healthy", doc.stdout.includes("✓ legacy enforcement flags") && doc.stdout.includes("✓ legacy scaffolders"), doc.stdout);
	}
	{
		const h = home();
		const edited = path.join(h, ".claude", "skills", "spec");
		copyTree(path.join(fixture, "spec"), edited);
		fs.appendFileSync(path.join(edited, "SKILL.md"), "owner edit\n");
		const added = path.join(h, ".agents", "skills", "dev-check");
		copyTree(path.join(fixture, "dev-check"), added);
		fs.writeFileSync(path.join(added, "owner-notes.md"), "owner file\n");
		const result = install(h);
		// req: R-669
		check("edited and extended real legacy artifacts stay active and unbacked", result.status === 1 && fs.existsSync(path.join(edited, "SKILL.md")) && fs.existsSync(path.join(added, "owner-notes.md")) && !fs.existsSync(backup(h, ".claude", "skills/spec")) && !fs.existsSync(backup(h, ".agents", "skills/dev-check")), result.stdout);
	}
	{
		const h = home();
		const external = tmpDir(path.join(os.tmpdir(), "nana-foreign-skill-"));
		dirs.push(external);
		fs.writeFileSync(path.join(external, "SKILL.md"), "owner's separate skill\n");
		const skills = path.join(h, ".claude", "skills");
		fs.mkdirSync(skills, { recursive: true });
		const target = path.join(skills, "spec");
		fs.symlinkSync(external, target);
		const result = install(h);
		// req: R-665 R-669
		check("foreign newly managed skill link survives end-to-end install", result.status === 1 && fs.lstatSync(target).isSymbolicLink() && fs.readlinkSync(target) === external && fs.readFileSync(path.join(external, "SKILL.md"), "utf8") === "owner's separate skill\n" && result.stdout.includes("foreign link"), result.stdout);
	}
	{
		const h = home();
		const target = path.join(h, ".claude", "skills", "spec");
		const source = path.join(repo, "packages", "nana-pack", "skills", "spec");
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.symlinkSync(path.relative(path.dirname(target), source), target);
		const result = install(h);
		// req: R-665
		check("newly managed skill canonical realpath link is accepted", result.status === 0 && fs.readlinkSync(target) === path.relative(path.dirname(target), source) && !result.stdout.includes("foreign link"), result.stdout);
	}
	{
		const h = home();
		const edited = path.join(h, ".claude", "skills", "spec");
		fs.mkdirSync(edited, { recursive: true });
		fs.writeFileSync(path.join(edited, "SKILL.md"), "owner's unrecognized win32 skill\n");
		const result = run(["install", "--home", h], { ...process.env, NANA_SETUP_PLATFORM: "win32" });
		const doctor = run(["doctor", "--home", h], { ...process.env, NANA_SETUP_PLATFORM: "win32" });
		// req: R-665 R-669
		check("win32 install leaves the unrecognized skill owner directory unchanged", result.status === 0 && fs.readFileSync(path.join(edited, "SKILL.md"), "utf8") === "owner's unrecognized win32 skill\n", `${result.status} ${result.stdout}`);
		// req: R-665
		check("win32 install reports all four new skill rows skipped", ["spec", "py-lint", "py-review", "py-test"].every((name) => result.stdout.includes(`skill ${name}`) && result.stdout.includes("skipped (win32)")), result.stdout);
		// req: R-665 R-666
		check("win32 preserves requirements mirror behavior and doctor skips pi-only skills", fs.readFileSync(path.join(h, ".claude", "skills", "requirements", "SKILL.md")).equals(fs.readFileSync(path.join(repo, "packages", "nana-pack", "skills", "requirements", "SKILL.md"))) && /✓ skill requirements\s+copied from/.test(doctor.stdout) && ["spec", "py-lint", "py-review", "py-test"].every((name) => new RegExp(`· skill ${name}\\s+skipped \\(win32; pi-only\\)`).test(doctor.stdout)), doctor.stdout);
	}
	{
		const h = home();
		const elsewhere = path.join(h, "foreign-hook.sh");
		fs.writeFileSync(elsewhere, "keep\n");
		const hookLink = path.join(h, ".claude", "hooks", "context-size-check.sh");
		fs.mkdirSync(path.dirname(hookLink), { recursive: true });
		fs.symlinkSync(elsewhere, hookLink);
		const result = install(h);
		// req: R-661
		check("link pointing outside this repository is preserved", fs.lstatSync(hookLink).isSymbolicLink() && fs.readlinkSync(hookLink) === elsewhere, result.stdout);
		// req: R-669
		check("unrecognized external hook target remains byte-identical", fs.readFileSync(elsewhere, "utf8") === "keep\n");
	}
} finally {
	for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
}
console.log(`SUMMARY PASS=${failures ? 0 : 1} FAIL=${failures}`);
process.exit(failures ? 1 : 0);
