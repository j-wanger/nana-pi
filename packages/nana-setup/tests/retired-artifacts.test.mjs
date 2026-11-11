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
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { stepRetiredArtifacts } from "../lib/steps.mjs";
import assert from 'node:assert/strict';
import { resolveLayout } from "../lib/paths.mjs";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
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
	const invoke = () => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", timeout: 20_000, env: { ...env, PATH: process.env.PATH } });
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

{
  let timer, problem;
  try {
    await Promise.race([Promise.resolve().then(() => {
      for (const platform of ['darwin', 'win32']) {
        const h = home();
        const layout = resolveLayout({ home: h });
        fs.mkdirSync(layout.hooksDir, { recursive: true });
        const target = path.join(layout.hooksDir, 'verifier-pipe.mjs');
        fs.symlinkSync(path.join(pkg, 'claude/hooks/verifier-pipe.mjs'), target);
        const shell = { type: 'command', command: `node '${h}/.claude/hooks/verifier-pipe.mjs'`, timeout: 5, statusMessage: 'nana: verifier pipe' };
        const exec = { type: 'command', command: 'node', args: ['C:/old checkout/packages/nana-setup/claude/hooks/verifier-pipe.mjs'], timeout: 5, statusMessage: 'nana: verifier pipe' };
        const foreign = { ...shell, timeout: 17 };
        const groups = [{ matcher: 'Bash', owner: 'keep', hooks: [shell, foreign] }, { matcher: 'Bash|PowerShell', hooks: [exec] }];
        fs.writeFileSync(layout.claudeSettings, JSON.stringify({ hooks: { PreToolUse: groups } }));
        const env = { ...process.env, NANA_SETUP_PLATFORM: platform };
        const before = run(['doctor', '--home', h], env);
        if (!before.stdout.split('\n').some(l => l.includes('✗ settings PreToolUse retired hook') && l.includes('verifier-pipe.mjs') && l.includes('nana-setup install'))) throw new Error('doctor must name the retired hook and install fix');
        const result = run(['install', '--home', h], env);
        if (result.status !== 0) throw new Error(result.stdout + result.stderr);
        const after = JSON.parse(fs.readFileSync(layout.claudeSettings, 'utf8'));
        if (JSON.stringify(after.hooks.PreToolUse) !== JSON.stringify([{ matcher: 'Bash', owner: 'keep', hooks: [foreign] }])) throw new Error('managed verifier entries survive or foreign siblings changed');
        if (fs.lstatSync(target, { throwIfNoEntry: false })) throw new Error('retired hook link remains installed');
      }
    }), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('retirement case timeout')), 20_000); })]);
  } catch (error) { problem = error.message; }
  finally { clearTimeout(timer); }
  // req: R-3799
  check('M1: install retires released verifier forms and owned links while doctor names the fix', !problem, problem);
}

{
  let timer, problem;
  try {
    await Promise.race([Promise.resolve().then(() => {
      if (process.platform === 'win32') return; // uninstall is POSIX-only
      const h = home();
      const layout = resolveLayout({ home: h });
      fs.mkdirSync(layout.claudeHome, { recursive: true });
      const shell = { type: 'command', command: `node '${h}/.claude/hooks/verifier-pipe.mjs'`, timeout: 5, statusMessage: 'nana: verifier pipe' };
      const exec = { type: 'command', command: 'node', args: ['C:/old checkout/packages/nana-setup/claude/hooks/verifier-pipe.mjs'], timeout: 5, statusMessage: 'nana: verifier pipe' };
      const foreign = { type: 'command', command: 'echo owner', timeout: 9 };
      fs.writeFileSync(layout.claudeSettings, JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [shell, foreign] }, { matcher: 'Bash|PowerShell', hooks: [exec] }] } }));
      for (const [file, source] of [[layout.subagentConfig, 'subagent-config.seed.json'], [layout.reviewerAgent, 'reviewer.seed.md']]) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.copyFileSync(path.join(pkg, 'pi', 'retired', source), file);
      }
      const removed = run(['uninstall', '--yes', '--home', h], { ...process.env, NANA_SETUP_PLATFORM: 'darwin' });
      if (removed.status !== 0) throw new Error(removed.stdout + removed.stderr);
      if (fs.existsSync(layout.subagentConfig) || fs.existsSync(layout.reviewerAgent)) throw new Error('unchanged old seeds survived uninstall');
      const remaining = JSON.parse(fs.readFileSync(layout.claudeSettings, 'utf8'));
      if (JSON.stringify(remaining.hooks.PreToolUse) !== JSON.stringify([{ matcher: 'Bash', hooks: [foreign] }])) throw new Error('uninstall left retired wiring or changed siblings');
      fs.writeFileSync(layout.claudeSettings, JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [shell, exec, foreign] }] } }));
      const installed = run(['install', '--home', h]);
      if (installed.status !== 0) throw new Error(installed.stdout + installed.stderr);
      const after = JSON.parse(fs.readFileSync(layout.claudeSettings, 'utf8'));
      if (JSON.stringify(after.hooks.PreToolUse) !== JSON.stringify([{ matcher: 'Bash', hooks: [foreign] }])) throw new Error('install left a released verifier form or changed siblings');
    }), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('old-home retirement timeout')), 20_000); })]);
  } catch (error) { problem = error.message; }
  finally { clearTimeout(timer); }
  if (process.platform === 'win32') console.log('SKIP M9: old-home uninstall is POSIX-only');
  else {
    // req: R-3807
    check('M9: old-home uninstall removes retired wiring and unchanged seeds before install preserves only foreign siblings', !problem, problem);
  }
}

async function test(title, body) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(body), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('seed retirement timeout')), 20_000); })]);
    check(title, true);
  } catch (error) { check(title, false, error.stack); }
  finally { clearTimeout(timer); }
}
const oldSeeds = layout => [[layout.subagentConfig, 'subagent-config.seed.json'], [layout.reviewerAgent, 'reviewer.seed.md']];
const seedBytes = name => fs.readFileSync(path.join(pkg, 'pi', 'retired', name));

// req: R-3803
await test('M5: install retires unchanged seeds without new seeds doctor rows or vendor retries', async () => {
  for (const platform of ['darwin', 'win32']) {
    const env = { ...process.env, NANA_SETUP_PLATFORM: platform };
    for (const old of [false, true]) {
      const h = home(), layout = resolveLayout({ home: h });
      if (old) for (const [file, name] of oldSeeds(layout)) {
        fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, seedBytes(name));
      }
      const result = run(['install', '--home', h], env);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      for (const [file] of oldSeeds(layout)) assert.equal(fs.lstatSync(file, { throwIfNoEntry: false }), undefined);
      const doctor = run(['doctor', '--home', h], env);
      assert.ok(!/pi (subagent config|reviewer agent|pi-subagents)/.test(doctor.stdout), doctor.stdout);
    }
  }
});

// req: R-3806
await test('M8: retirement preserves edited marked foreign and linked seeds and their targets including dry runs', () => {
  for (const platform of ['darwin', 'win32']) for (const mode of ['edited', 'foreign', 'link', 'parent-link']) {
    const h = home(), layout = resolveLayout({ home: h });
    const expected = [];
    for (const [file, name] of oldSeeds(layout)) {
      const bytes = mode === 'foreign' ? Buffer.from('owner bytes\r\nwith trailing space \t') : Buffer.concat([seedBytes(name), Buffer.from('\r\nowner edit \t')]);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (mode === 'parent-link') {
        const external = path.join(h, `external-${name}`);
        fs.mkdirSync(external); fs.rmdirSync(path.dirname(file)); fs.symlinkSync(external, path.dirname(file), 'junction');
        fs.writeFileSync(path.join(external, path.basename(file)), seedBytes(name));
      } else if (mode === 'link') {
        const target = path.join(h, `external-${name}`); fs.writeFileSync(target, seedBytes(name)); fs.symlinkSync(target, file);
      } else fs.writeFileSync(file, bytes);
      expected.push([file, fs.readFileSync(file), mode === 'link' ? fs.readlinkSync(file) : null]);
    }
    for (const command of ['install', ...(platform === 'darwin' ? ['uninstall'] : [])]) for (const dry of [true, false]) {
      const result = run([command, '--home', h, ...(command === 'uninstall' && !dry ? ['--yes'] : []), ...(dry ? ['--dry-run'] : [])], { ...process.env, NANA_SETUP_PLATFORM: platform });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      for (const [file, bytes, link] of expected) {
        assert.deepEqual(fs.readFileSync(file), bytes);
        if (link) { assert.equal(fs.readlinkSync(file), link); assert.deepEqual(fs.readFileSync(link), bytes); }
        if (mode === 'parent-link') assert.ok(fs.lstatSync(path.dirname(file)).isSymbolicLink());
      }
    }
  }
});

try {
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
		const customizedHook = { type: "command", command: "bash ~/.claude/hooks/context-size-check.sh", owner: "the owner", enabled: true };
		const nonCommandHook = { type: "prompt", command: "bash ~/.claude/hooks/context-size-check.sh", prompt: "owner text" };
		const ownerHooks = [
			{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh --owner-variant" },
			customizedHook,
			nonCommandHook,
		];
		fs.writeFileSync(path.join(h, ".claude", "settings.json"), JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [
			{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh" },
			{ type: "command", command: `bash '${path.join(h, ".claude", "hooks", "context-size-check.sh")}'` },
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
		// req: R-663 R-665 R-668
		check("recognized Claude skill and empty flag move under dated backups", result.status === 0 && fs.existsSync(backup(h, ".claude", "skills/spec/SKILL.md")) && fs.existsSync(backup(h, ".claude", "enforce")), result.stdout);
		// req: R-663 R-668
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
		const completeContextEntries = settings.hooks.UserPromptSubmit[0].hooks;
		// Knowledge retirement adds no replacement beside the retained owner commands.
		const expectedInstalledHooks = [...ownerHooks];
		// bd33b926: Windows keeps this foreign quoted-backslash entry and every sibling in order.
		const quotedBackslashEntry = { type: "command", command: `bash '${path.join(h, ".claude", "hooks", "context-size-check.sh")}'` };
		if (process.platform !== "win32") {
			// req: R-660
			check("install removes released quoted context hook and preserves the expected variants", !completeContextEntries.some((hook) => hook.command === quotedBackslashEntry.command) && JSON.stringify(completeContextEntries) === JSON.stringify(expectedInstalledHooks), JSON.stringify(completeContextEntries));
		} else {
			console.log("SKIP win32 quoted-context-hook removal (no released Windows install ever wrote this retired hook, in any form — see settings.mjs/steps.mjs history: b39518f, b965bd0, 7b46022)");
			// req: R-660
			check("win32: the unrecognised quoted-backslash entry is left in place, and every other entry matches", JSON.stringify(completeContextEntries) === JSON.stringify([quotedBackslashEntry, ...expectedInstalledHooks]), JSON.stringify(completeContextEntries));
		}
		const retainedContextEntries = settings.hooks.UserPromptSubmit[0].hooks.filter((hook) => hook.command === "bash ~/.claude/hooks/context-size-check.sh" || hook.command === "bash ~/.claude/hooks/context-size-check.sh --owner-variant" || hook.owner === "the owner" || hook.type === "prompt");
		// req: R-660
		check("exact nana settings entry is removed while customized and non-command entries remain byte-identical", JSON.stringify(retainedContextEntries) === JSON.stringify(ownerHooks), JSON.stringify(retainedContextEntries));
		// req: R-668
		check("synced Agent Skills content stays in place", fs.readFileSync(path.join(synced, "SKILL.md"), "utf8") === "keep synced skill\n");
		if (process.platform === "win32") {
			// req: R-351
			check("win32: the legacy spec directory is replaced by the pack's byte-equal SKILL.md copy", fs.readFileSync(path.join(oldSkill, "SKILL.md")).equals(fs.readFileSync(path.join(repo, "packages", "nana-pack", "skills", "spec", "SKILL.md"))));
		} else {
			// req: R-665
			check("managed pack skill replaces the backed-up legacy spec", fs.realpathSync(oldSkill) === fs.realpathSync(path.join(repo, "packages", "nana-pack", "skills", "spec")));
		}
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
		// `spec` alone proves nothing on win32 (steps.mjs:263 drops it before `artifactHome` is
		// even chosen, so the scoping question never arises): an empty `enforce` flag in BOTH
		// homes is a retired artifact win32 DOES retire, and the seat's own probe against the
		// real CLI confirmed it moves only the selected home's copy.
		const defaultFlag = path.join(h, ".claude", "enforce");
		const selectedFlag = path.join(alternateClaude, "enforce");
		fs.mkdirSync(path.dirname(defaultFlag), { recursive: true });
		fs.writeFileSync(defaultFlag, "");
		fs.mkdirSync(path.dirname(selectedFlag), { recursive: true });
		fs.writeFileSync(selectedFlag, "");
		const result = run(["install", "--home", h, "--claude-home", alternateClaude]);
		if (process.platform !== "win32") {
			// req: R-663
			check("alternate Claude home scopes retirement away from the default home", result.status === 0 && fs.existsSync(path.join(defaultSkill, "SKILL.md")) && fs.realpathSync(selectedSkill) === fs.realpathSync(path.join(repo, "packages", "nana-pack", "skills", "spec")) && fs.existsSync(path.join(alternateClaude, "backups", `${date}-retired`, "skills", "spec", "SKILL.md")), result.stdout);
		} else {
			// req: R-663
			check("win32: alternate Claude home scopes the enforce-flag retirement away from the default home", result.status === 0 && fs.existsSync(defaultFlag) && !fs.existsSync(selectedFlag) && fs.existsSync(path.join(alternateClaude, "backups", `${date}-retired`, "enforce")) && !fs.existsSync(path.join(h, ".claude", "backups", `${date}-retired`, "enforce")), result.stdout);
		}
	}
	{
		const h = home();
		const ownerSkill = path.join(h, ".claude", "skills", "spec");
		fs.mkdirSync(ownerSkill, { recursive: true });
		fs.writeFileSync(path.join(ownerSkill, "SKILL.md"), "owner-authored spec\n");
		const legacyDir = path.join(h, ".claude", "skills", "py-init");
		copyTree(path.join(fixture, "py-init"), legacyDir);
		fs.writeFileSync(path.join(h, ".claude", "enforce-memory"), "");
		const result = install(h);
		// req: R-663 R-669
		check("provenance mismatch remains untouched and is reported", result.status === 1 && fs.readFileSync(path.join(ownerSkill, "SKILL.md"), "utf8") === "owner-authored spec\n" && result.stdout.includes("unrecognized kind or provenance"), result.stdout);
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
		const outside = tmpDir(path.join(os.tmpdir(), "nana-retired-link-"));
		dirs.push(outside);
		fs.writeFileSync(path.join(outside, "SKILL.md"), "outside skill\n");
		const target = path.join(h, ".claude", "skills", "nana");
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.symlinkSync(outside, target, "junction");
		const before = fs.readlinkSync(target);
		const result = install(h);
		// req: R-1593
		check("a link at a retired skill name install does not link is still reported unrecognized", /retired \.claude\/skills\/nana\s+skipped\s+unrecognized kind or provenance/.test(result.stdout) && fs.readlinkSync(target) === before, result.stdout);
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
		if (process.platform === "win32") {
			// req: R-352
			check("win32: the pi-only foreign skill link is refused and stays intact", result.status === 1 && fs.lstatSync(target).isSymbolicLink() && fs.readlinkSync(target) === external && fs.readFileSync(path.join(external, "SKILL.md"), "utf8") === "owner's separate skill\n" && result.stdout.includes("symlink or junction"), result.stdout);
		} else {
			// req: R-665 R-669
			check("foreign newly managed skill link survives end-to-end install", result.status === 1 && fs.lstatSync(target).isSymbolicLink() && fs.readlinkSync(target) === external && fs.readFileSync(path.join(external, "SKILL.md"), "utf8") === "owner's separate skill\n" && result.stdout.includes("foreign link"), result.stdout);
		}
	}
	{
		const h = home();
		const target = path.join(h, ".claude", "skills", "spec");
		const source = path.join(repo, "packages", "nana-pack", "skills", "spec");
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.symlinkSync(path.relative(path.dirname(target), source), target);
		const originalLink = fs.readlinkSync(target);
		const result = install(h);
		// req: R-665 R-352
		check("newly managed skill canonical realpath link is accepted", process.platform === "win32"
			? result.status === 1 && fs.lstatSync(target).isSymbolicLink() && fs.readlinkSync(target) === originalLink && result.stdout.includes("symlink or junction")
			: result.status === 0 && fs.readlinkSync(target) === originalLink && !result.stdout.includes("foreign link"), result.stdout);
	}
	{
		const h = home();
		const env = { ...process.env, NANA_SETUP_PLATFORM: "win32" };
		const names = ["spec", "py-lint", "py-review", "py-test"];
		const skills = path.join(h, ".claude", "skills");
		for (const name of names) {
			const dir = path.join(skills, name);
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(path.join(dir, "SKILL.md"), "mine");
		}
		const before = names.map((name) => treeSnapshot(path.join(skills, name)));
		const result = run(["install", "--home", h], env);
		const dry = run(["install", "--home", h, "--dry-run"], env);
		// req: R-1901
		check("R-1901: forced win32 install and dry-run refuse all four owner skill directories without changing them",
			result.status === 1 && dry.status === 1 && [result, dry].every((runResult) => names.every((name) => runResult.stdout.includes(`✗ skill ${name}`) && /a directory is already at .*move or remove it/.test(runResult.stdout))) && names.every((name, index) => treeSnapshot(path.join(skills, name)) === before[index]),
			`${result.stdout}\n--- dry ---\n${dry.stdout}`);
	}
	{
		const h = home();
		const env = { ...process.env, NANA_SETUP_PLATFORM: "win32" };
		const spec = path.join(h, ".claude", "skills", "spec");
		copyTree(path.join(fixture, "spec"), spec);
		const result = run(["install", "--home", h], env);
		// req: R-1902
		check("R-1902: forced win32 install retires the recognized spec fixture and installs the pack copy",
			result.status === 0 && fs.existsSync(backup(h, ".claude", "skills/spec/SKILL.md")) && fs.existsSync(path.join(spec, "SKILL.md")) && fs.readFileSync(path.join(spec, "SKILL.md")).equals(fs.readFileSync(path.join(repo, "packages", "nana-pack", "skills", "spec", "SKILL.md"))),
			result.stdout);
	}
	{
		const h = home();
		const layout = resolveLayout({ home: h });
		fs.mkdirSync(layout.hooksDir, { recursive: true });
		const dangling = path.join(layout.hooksDir, "nana-objective.sh");
		const repoDangling = path.join(pkg, "claude", "hooks", "nana-objective.sh");
		fs.symlinkSync(repoDangling, dangling);
		const outside = path.join(h, "outside-target");
		fs.writeFileSync(outside, "leave me\n");
		const foreign = path.join(layout.hooksDir, "nana-adoption.sh");
		fs.symlinkSync(outside, foreign);
		const regular = path.join(layout.hooksDir, "nana-shared-memory.sh");
		fs.writeFileSync(regular, "owner file\n");
		const result = stepRetiredArtifacts(layout, { dryRun: false });
		// req: R-804
		check("dangling repository retired link is unlinked safely", !fs.existsSync(dangling) && result.some((row) => row.label === "retired nana-objective.sh link" && row.status === "updated"));
		// req: R-804
		check("external retired hook link is preserved", fs.lstatSync(foreign).isSymbolicLink() && fs.readlinkSync(foreign) === outside && fs.readFileSync(outside, "utf8") === "leave me\n" && result.some((row) => row.label === "retired nana-adoption.sh link" && row.status === "problem"));
		// req: R-804
		check("regular retired hook file is preserved", fs.lstatSync(regular).isFile() && fs.readFileSync(regular, "utf8") === "owner file\n" && result.some((row) => row.label === "retired nana-shared-memory.sh link" && row.status === "problem"));
	}
	{
		const h = home();
		const layout = resolveLayout({ home: h });
		fs.mkdirSync(layout.hooksDir, { recursive: true });
		const link = path.join(layout.hooksDir, "nana-objective.sh");
		fs.symlinkSync(path.join(pkg, "claude", "hooks", "nana-objective.sh"), link);
		const result = stepRetiredArtifacts(layout, { dryRun: true });
		// req: R-804
		check("dry run reports would-unlink and keeps the repository link", fs.lstatSync(link).isSymbolicLink() && result.some((row) => row.label === "retired nana-objective.sh link" && row.detail.includes("would unlink")));
	}
	{
		const h = home();
		const layout = resolveLayout({ home: h });
		const externalHooks = path.join(h, "external-hooks");
		fs.mkdirSync(externalHooks);
		const dangling = path.join(externalHooks, "nana-objective.sh");
		fs.symlinkSync(path.join(pkg, "claude", "hooks", "nana-objective.sh"), dangling);
		fs.mkdirSync(layout.claudeHome, { recursive: true });
		fs.symlinkSync(externalHooks, layout.hooksDir, "junction");
		const result = stepRetiredArtifacts(layout, { dryRun: false });
		// req: R-804
		check("unsafe hooks directory is refused without removing anything", fs.lstatSync(dangling).isSymbolicLink() && result.some((row) => row.label === "retired nana-objective.sh link" && row.status === "problem"));
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
