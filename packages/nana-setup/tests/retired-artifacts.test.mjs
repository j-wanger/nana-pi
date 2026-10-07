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
import { retiredArtifacts } from "../lib/retired.mjs";

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
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-retired-"));
	dirs.push(dir);
	fs.mkdirSync(path.join(dir, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(dir, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	const vendor = path.join(dir, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(vendor, { recursive: true });
	fs.writeFileSync(path.join(vendor, "package.json"), JSON.stringify({ name: "pi-subagents", version: "0.75.0" }));
	return dir;
}
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
const install = (h, extra = []) => run(["install", "--home", h, ...extra]);
const date = new Date().toISOString().slice(0, 10);
const backup = (h, root, rel) => path.join(h, root, "backups", `${date}-retired`, rel);

try {
	{
		const names = retiredArtifacts("/home/example").map((entry) => entry.relative);
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
		fs.mkdirSync(oldSkill, { recursive: true });
		fs.writeFileSync(path.join(oldSkill, "SKILL.md"), "nana-dev-kit legacy spec copy\n");
		const codex = path.join(h, ".agents", "skills", "dev-check");
		fs.mkdirSync(codex, { recursive: true });
		fs.writeFileSync(path.join(codex, "SKILL.md"), "Imported paths use ~/.Codex/skills and .Codex/rules\n");
		const emptyFlag = path.join(h, ".claude", "enforce");
		fs.mkdirSync(path.dirname(emptyFlag), { recursive: true });
		fs.writeFileSync(emptyFlag, "");
		const hookSource = path.join(repo, "packages", "nana-setup", "claude", "hooks", "context-size-check.sh");
		const hookLink = path.join(h, ".claude", "hooks", "context-size-check.sh");
		fs.mkdirSync(path.dirname(hookLink), { recursive: true });
		fs.symlinkSync(hookSource, hookLink);
		const oldHookBackup = path.join(h, ".claude", "hooks", "nana-old.sh.bak-20260918");
		fs.writeFileSync(oldHookBackup, "# nana legacy hook backup\n");
		const juneHook = path.join(h, ".claude", "hooks", "nana-june.sh.bak-20260622");
		fs.writeFileSync(juneHook, "# nana June copy retained\n");
		const foreignBackup = path.join(h, ".claude", "hooks", "foreign.sh.bak-20260918");
		fs.writeFileSync(foreignBackup, "foreign backup without ownership evidence\n");
		fs.writeFileSync(path.join(h, ".claude", "settings.json"), JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [
			{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh" },
			{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh --owner-variant" },
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
		check("nana-owned 2026-09-18 hook backup is retired", fs.existsSync(backup(h, ".claude", "hooks/nana-old.sh.bak-20260918")), result.stdout);
		// req: R-668
		check("June hook copies remain in place", fs.existsSync(juneHook));
		// req: R-668
		check("dated hook backups without nana provenance remain in place", fs.existsSync(foreignBackup));
		// req: R-661
		check("repository-managed context hook symlink is removed", !fs.existsSync(hookLink) && !fs.lstatSync(hookLink, { throwIfNoEntry: false }), result.stdout);
		const settings = JSON.parse(fs.readFileSync(path.join(h, ".claude", "settings.json"), "utf8"));
		const commands = settings.hooks.UserPromptSubmit.flatMap((group) => group.hooks.map((hook) => hook.command));
		// req: R-660
		check("exact nana settings entry is removed while owner variant remains", !commands.includes("bash ~/.claude/hooks/context-size-check.sh") && commands.includes("bash ~/.claude/hooks/context-size-check.sh --owner-variant"), JSON.stringify(commands));
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
		fs.mkdirSync(pending, { recursive: true });
		fs.writeFileSync(path.join(pending, "SKILL.md"), "nana-dev-kit legacy capability skill\n");
		fs.mkdirSync(path.dirname(backup(interrupted, ".claude", "skills/nana")), { recursive: true });
		const recovered = install(interrupted);
		// req: R-669
		check("rerun recovers after the dated backup directory was created but before rename", recovered.status === 0 && fs.existsSync(backup(interrupted, ".claude", "skills/nana/SKILL.md")), recovered.stdout);
	}
	{
		const h = home();
		const ownerSkill = path.join(h, ".claude", "skills", "spec");
		fs.mkdirSync(ownerSkill, { recursive: true });
		fs.writeFileSync(path.join(ownerSkill, "SKILL.md"), "owner-authored spec\n");
		const legacyDir = path.join(h, ".claude", "skills", "py-init");
		fs.mkdirSync(legacyDir, { recursive: true });
		fs.writeFileSync(path.join(legacyDir, "SKILL.md"), "nana-dev-kit 5-layer harness\n");
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
