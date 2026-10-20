/**
 * @module packages/nana-setup/tests/pi-registration.test.mjs
 * @purpose Pins the answer to whether nana-pi is already registered with pi, following pi's own matching rules, so the installer never adds a second root-level package entry
 * @inputs lib/steps.mjs, lib/paths.mjs, and pi settings fixtures under a throwaway --home
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts and settings fixtures), process (spawns the installer CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: "is nana-pi already registered with pi?" A false negative here makes the installer add a
// SECOND, root-level package entry on top of the per-package ones already in settings, and every
// extension would load twice. Matching follows pi's own rules (docs/packages.md, pi 0.84.4):
// relative local paths resolve against the settings file's directory; identity is the resolved
// absolute path; git entries are the repo URL without a ref.
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { findPi } from "../../nana-pack/lib/win-command.mjs";
import { parseJsonText } from "../../nana-pack/lib/json-text.mjs";
import { realPath } from "../../nana-pack/lib/real-path.mjs";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const repoManifestBytes = [path.join(repo, "package.json"), path.join(repo, "packages", "nana-knowledge", "package.json")].map((file) => fs.readFileSync(file));
const { entryMatches, registrationState, remoteMatches, packageCoverage, stepPiRegister, installExitCode, PI_INSTALL_HINT } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const piHome = "/Users/x/.pi/agent";
const root = "/Users/x/nana-pi";

/* --- the shapes that mean "registered" -------------------------------------------------- */
check("relative per-package entry (how this machine is registered)", entryMatches("../../nana-pi/packages/nana-pack", piHome, root));
check("relative per-package entry, the knowledge half", entryMatches("../../nana-pi/packages/nana-knowledge", piHome, root));
check("relative entry to the root itself", entryMatches("../../nana-pi", piHome, root));
check("absolute entry to the root", entryMatches("/Users/x/nana-pi", piHome, root));
check("absolute entry under the root", entryMatches("/Users/x/nana-pi/packages/nana-pack", piHome, root));
/* --- remote spellings: HOST and PATH are both anchored (sol r2) ------------------------- */
for (const e of [
	"git:github.com/j-wanger/nana-pi",
	"git:github.com/j-wanger/nana-pi@v0.4.1",
	"git:github.com/j-wanger/nana-pi#main",
	"git:github.com/j-wanger/nana-pi.git",
	"github:j-wanger/nana-pi",
	"https://github.com/j-wanger/nana-pi",
	"https://github.com/j-wanger/nana-pi.git",
	"https://github.com/j-wanger/nana-pi@v1",
	"git:git@github.com:j-wanger/nana-pi",
	"git@github.com:j-wanger/nana-pi.git",
	"ssh://git@github.com/j-wanger/nana-pi",
	"git://github.com/j-wanger/nana-pi",
	"git+ssh://git@github.com/j-wanger/nana-pi",
// req: R-325
]) check(`remote IS us: ${e}`, remoteMatches(e) && entryMatches(e, piHome, root));
for (const e of [
	"https://evil.example/archive/j-wanger/nana-pi",
	"https://github.com.evil.example/j-wanger/nana-pi",
	"https://evil.example/github.com/j-wanger/nana-pi",
	"git:gitlab.com/j-wanger/nana-pi",
	"https://github.com/someone/nana-pi",
	"https://github.com/j-wanger/nana-pi-other",
	"git:github.com/j-wanger/nana-pi-fork",
	"https://github.com/j-wanger/nana-pi/extra",
	"github:someone/nana-pi",
	"file://github.com/j-wanger/nana-pi", // scheme allowlist: https, ssh, git, git+ssh only
	"http://github.com/j-wanger/nana-pi",
	"ftp://github.com/j-wanger/nana-pi",
	"javascript://github.com/j-wanger/nana-pi",
// req: R-325
]) check(`remote is NOT us: ${e}`, !remoteMatches(e) && !entryMatches(e, piHome, root));

/* --- the shapes that do not ------------------------------------------------------------- */
// req: R-326
check("an npm package is not us", !entryMatches("npm:pi-subagents", piHome, root));
check("another local repo is not us", !entryMatches("../../other-repo", piHome, root));
// req: R-326
check("a sibling with a prefix name is not us", !entryMatches("/Users/x/nana-pi-other", piHome, root));
// req: R-325
check("someone else's fork is not us", !entryMatches("git:github.com/someone/nana-pi", piHome, root));
// req: R-326
check("a non-string entry is not us", !entryMatches(42, piHome, root));

/* --- registrationState against a settings file ------------------------------------------ */
const tmps = [];
function piHomeWith(packages) {
	const td = tmpDir(path.join(os.tmpdir(), "nana-setup-reg-"));
	tmps.push(td);
	const agent = path.join(td, ".pi", "agent");
	fs.mkdirSync(path.join(agent, "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(agent, "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	if (packages) fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ theme: "dark", packages }, null, 2));
	return td;
}
{
	// the entry has to resolve to THIS worktree, so build it relative to the temp pi home
	const home = piHomeWith(null);
	const agent = path.join(home, ".pi", "agent");
	const rel = path.relative(agent, repo);
	fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: ["npm:pi-subagents", rel] }, null, 2));
	const state = registrationState(resolveLayout({ home }));
	// req: R-323 R-392
	check("registered by relative path is detected as present", state.present, JSON.stringify(state));
	check("the matching entry is reported", state.match === rel);
	const r = spawnSync(process.execPath, [cli, "install", "--home", home], { encoding: "utf8" });
	// req: R-323
	check("install reports all extension directories registered", /pi packages\s+unchanged\s+all extension directories registered/.test(r.stdout), r.stdout);
	// req: R-323
	check("install did not add an entry", JSON.parse(fs.readFileSync(path.join(agent, "settings.json"), "utf8")).packages.length === 2);
	const doc = withPiStub(() => spawnSync(process.execPath, [cli, "doctor", "--home", home], { encoding: "utf8" }));
	check("doctor reports pi packages ✓", /✓ pi packages/.test(doc.stdout), doc.stdout);
}
{
	const home = piHomeWith(["npm:pi-mcp-adapter"]);
	const state = registrationState(resolveLayout({ home }));
	// req: R-326
	check("an unrelated package list is not a match", !state.present);
	check("entries are still reported", state.entries.length === 1);
}
{
	const home = piHomeWith(null);
	// req: R-326
	check("a missing pi settings.json is not a match", !registrationState(resolveLayout({ home })).present);
}
{
	// Under the runner's temp root (R-917), sharing the checkout's git identity through a one-line
	// `.git` pointer to its common git dir: the root-entry identity check compares common dirs, and
	// the fixture is only ever probed read-only.
	const fixtureRoot = tmpDir(path.join(os.tmpdir(), "nana-manifest-root-"));
	const commonDir = spawnSync("git", ["-C", repo, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).stdout.trim();
	fs.writeFileSync(path.join(fixtureRoot, ".git"), `gitdir: ${commonDir}\n`);
	tmps.push(fixtureRoot);
	const packRoot = path.join(fixtureRoot, "packages", "nana-pack");
	const knowledgeRoot = path.join(fixtureRoot, "packages", "nana-knowledge");
	fs.mkdirSync(packRoot, { recursive: true });
	fs.mkdirSync(knowledgeRoot, { recursive: true });
	fs.writeFileSync(path.join(fixtureRoot, "package.json"), JSON.stringify({ pi: { extensions: ["packages/nana-pack/extensions", "packages/nana-knowledge/extensions-alt"] } }));
	fs.writeFileSync(path.join(knowledgeRoot, "package.json"), JSON.stringify({ pi: { extensions: [] } }));
	const home = piHomeWith(null);
	const agent = path.join(home, ".pi", "agent");
	const knowledge = path.relative(agent, knowledgeRoot);
	fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [knowledge] }));
	const coverage = packageCoverage(resolveLayout({ home }), fixtureRoot);
	// req: R-392
	check("diverging fixture root manifest extension directory remains uncovered", coverage.missing.includes(path.join(knowledgeRoot, "extensions-alt")), JSON.stringify(coverage));
	fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [path.relative(agent, repo)] }));
	const rootCoverage = packageCoverage(resolveLayout({ home }), fixtureRoot);
	// req: R-679
	check("fixture manifest root checkout identity covers its extension directories", rootCoverage.present && rootCoverage.match === path.relative(agent, repo), JSON.stringify(rootCoverage));
}
{
	const home = piHomeWith(null);
	const agent = path.join(home, ".pi", "agent");
	const knowledge = path.relative(agent, path.join(repo, "packages", "nana-knowledge"));
	fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [knowledge] }));
	const coverage = packageCoverage(resolveLayout({ home }));
	// req: R-392
	check("knowledge-only registration leaves nana-pack's manifest extension directory uncovered", coverage.missing.some((p) => p.endsWith(path.join("packages", "nana-pack", "extensions"))), JSON.stringify(coverage));
	const r = withPiStub(() => spawnSync(process.execPath, [cli, "doctor", "--home", home], { encoding: "utf8" }));
	// req: R-654
	check("doctor names nana-pack's uncovered extensions directory", /✗ pi packages.*packages.nana-pack.extensions/s.test(r.stdout), r.stdout);
	const fakeBin = tmpDir(path.join(os.tmpdir(), "nana-fake-pi-"));
	tmps.push(fakeBin);
	const log = path.join(fakeBin, "calls");
	const recorder = path.join(fakeBin, "record.cjs");
	fs.writeFileSync(recorder, `const fs = require("node:fs");\nconst path = require("node:path");\nfs.appendFileSync(path.join(__dirname, "calls"), JSON.stringify(process.argv.slice(2)) + "\\n");\n`);
	if (process.platform === "win32") fs.writeFileSync(path.join(fakeBin, "pi.cmd"), `@"${process.execPath}" "%~dp0record.cjs" %*\r\n`);
	else {
		fs.writeFileSync(path.join(fakeBin, "pi"), `#!/bin/sh\nexec '${process.execPath}' '${recorder}' "$@"\n`);
		fs.chmodSync(path.join(fakeBin, "pi"), 0o755);
	}
	const savedPath = process.env.PATH;
	process.env.PATH = `${fakeBin}${path.delimiter}${savedPath}`;
	try {
		const fakeReal = { ...resolveLayout({ home }), isRealHome: true };
		const installed = stepPiRegister(fakeReal, {});
		const calls = fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)) : [];
		const ok = installed[0]?.status === "created" && JSON.stringify(calls) === JSON.stringify([["--version"], ["install", path.join(repo, "packages", "nana-pack")]]);
		const extra = `${JSON.stringify(calls)} ${JSON.stringify(installed)}`;
		if (process.platform === "win32") {
			// req: R-1690
			check("win32 install runs a pi.cmd through cmd.exe to add only the missing per-package entry, never a root entry", ok, extra);
		} else {
			// req: R-323
			check("install adds only the missing per-package entry, never a root entry", ok, extra);
		}
	} finally { process.env.PATH = savedPath; }
}

{
	const home = piHomeWith(null);
	const agent = path.join(home, ".pi", "agent");
	const settings = JSON.stringify({ packages: [path.relative(agent, repo)] }, null, 2) + "\n";
	fs.writeFileSync(path.join(agent, "settings.json"), ("\uFEFF" + settings).replace(/\n/g, "\r\n"));
	const calls = [];
	const spawn = (command, args, options) => { calls.push({ command, args, options }); return { status: 0, stdout: "1.0.2", stderr: "" }; };
	const result = stepPiRegister({ ...resolveLayout({ home }), isRealHome: true }, {}, { spawn });
	// req: R-1811
	check("install reports a pi settings.json saved with a byte-order mark as registered and starts no pi", result.length === 1 && result[0]?.status === "unchanged" && calls.length === 0, JSON.stringify({ result, calls }));
}

/* --- a WORKTREE of the same repo is the same repo --------------------------------------- */
{
	// This is the exact shape sol r1 flagged: the installer runs from a worktree
	// (~/nana-pi-wt/<lane>) while settings registers the main checkout by relative path. A
	// lexical guard says "not registered" and `pi install` then loads every extension twice.
	// The test BUILDS that shape (a throwaway linked worktree of this repo, removed at the end)
	// instead of asserting the environment it happens to run in — the first version did the
	// latter and was green in a worktree, red on main (seat catch, 2026-09-18).
	const common = spawnSync("git", ["-C", repo, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" });
	if (common.status !== 0) {
		console.log("SKIP this checkout is not a git repo");
	} else {
		const mainCheckout = path.dirname(common.stdout.trim()); // <main clone>/.git -> <main clone>
		const wt = tmpDir(path.join(os.tmpdir(), "nana-setup-wt-"));
		const added = spawnSync("git", ["-C", repo, "worktree", "add", "--detach", "-q", wt, "HEAD"], { encoding: "utf8" });
		if (added.status !== 0) {
			console.log("SKIP could not create a throwaway worktree: " + added.stderr.trim());
			fs.rmSync(wt, { recursive: true, force: true });
		} else {
			try {
				const wtCli = path.join(wt, "packages", "nana-setup", "bin", "nana-setup.mjs");
				const wtSteps = await import(new URL("file://" + path.join(wt, "packages", "nana-setup", "lib", "steps.mjs")).href);
				const wtPaths = await import(new URL("file://" + path.join(wt, "packages", "nana-setup", "lib", "paths.mjs")).href);
				const worktreeRoot = realPath(wt, { mustExist: true });
				check("the throwaway worktree is a linked worktree of the main clone", realPath(wtPaths.repoRoot, { mustExist: true }) === worktreeRoot && realPath(mainCheckout, { mustExist: true }) !== worktreeRoot, `${wtPaths.repoRoot} vs ${mainCheckout}`);
				const home = piHomeWith(null);
				const agent = path.join(home, ".pi", "agent");
				const rel = path.relative(agent, path.join(mainCheckout, "packages", "nana-pack"));
				const knowledgeRel = path.relative(agent, path.join(mainCheckout, "packages", "nana-knowledge"));
				fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [rel, knowledgeRel] }, null, 2));
				const state = wtSteps.registrationState(wtPaths.resolveLayout({ home }));
				check("the MAIN clone's relative entry marks the WORKTREE as registered", state.present, JSON.stringify(state));
				const r = spawnSync(process.execPath, [wtCli, "install", "--home", home], { encoding: "utf8" });
				check("install from the worktree does not run `pi install` for a registered repo", /pi packages\s+unchanged\s+(?:all extension directories registered|registered as)/.test(r.stdout), r.stdout);
				check("no entry was added", JSON.parse(fs.readFileSync(path.join(agent, "settings.json"), "utf8")).packages.length === 2);

				// the `~/...` spelling of the same clone
				const tildeForm = mainCheckout.startsWith(os.homedir() + path.sep) ? "~/" + path.relative(os.homedir(), path.join(mainCheckout, "packages", "nana-pack")) : null;
				if (!tildeForm) console.log("SKIP the main clone is not under $HOME");
				else {
					const knowledgeTilde = mainCheckout.startsWith(os.homedir() + path.sep) ? "~/" + path.relative(os.homedir(), path.join(mainCheckout, "packages", "nana-knowledge")) : null;
					fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [tildeForm, knowledgeTilde] }, null, 2));
					check(`\`~\` per-package entries are expanded and matched from the worktree`, wtSteps.registrationState(wtPaths.resolveLayout({ home })).present);
				}

				// an unrelated repo still is not us
				const other = tmpDir(path.join(os.tmpdir(), "nana-setup-otherrepo-"));
				tmps.push(other);
				spawnSync("git", ["-C", other, "init", "-q"], { encoding: "utf8" });
				fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [other] }, null, 2));
				// req: R-326
				check("a different git repo is NOT a match", !wtSteps.registrationState(wtPaths.resolveLayout({ home })).present);
			} finally {
				spawnSync("git", ["-C", repo, "worktree", "remove", "--force", wt], { encoding: "utf8" });
				fs.rmSync(wt, { recursive: true, force: true });
				spawnSync("git", ["-C", repo, "worktree", "prune"], { encoding: "utf8" });
			}
		}
	}
}

/* --- the real machine: the live registration must read as PRESENT ----------------------- */
{
	const live = path.join(os.homedir(), ".pi", "agent", "settings.json");
	if (!fs.existsSync(live)) {
		console.log("SKIP no ~/.pi/agent/settings.json on this machine");
	} else {
		const entries = parseJsonText(fs.readFileSync(live, "utf8")).packages ?? [];
		const canonical = path.join(os.homedir(), "nana-pi");
		if (!fs.existsSync(canonical)) console.log("SKIP no ~/nana-pi clone on this machine");
		else
			check(
				"the live settings.json registers ~/nana-pi (by whatever spelling)",
				entries.some((e) => entryMatches(e, path.dirname(live), canonical)),
				JSON.stringify(entries),
			);
	}
}

// Injected POSIX launcher cases are portable; the recording spawn never invokes pi.
{
	const fixture = tmpDir(path.join(os.tmpdir(), "nana-posix-pi-manifest-"));
	tmps.push(fixture);
	fs.writeFileSync(path.join(fixture, "package.json"), JSON.stringify({ pi: { extensions: ["packages/nana-pack/extensions", "packages/nana-knowledge/extensions"] } }));
	const fakeLayout = { piHome: "/Users/fake/.pi/agent", isRealHome: true };
	const injected = { platform: () => "darwin", manifestRoot: fixture };
	const missing = stepPiRegister(fakeLayout, {}, { ...injected, spawn: () => ({ error: Object.assign(new Error("missing"), { code: "ENOENT" }) }) });
	// req: R-1036
	check("darwin missing pi is skipped with install hint", missing[0]?.status === "skipped" && missing[0].detail.includes(PI_INSTALL_HINT));
	const denied = stepPiRegister(fakeLayout, {}, { ...injected, spawn: () => ({ error: Object.assign(new Error("denied"), { code: "EACCES" }) }) });
	// req: R-1036
	check("darwin found pi with EACCES is a problem and fails install", denied[0]?.status === "problem" && installExitCode(denied) === 1);
	const failed = stepPiRegister(fakeLayout, {}, { ...injected, spawn: () => ({ status: 2, stderr: "bad version" }) });
	// req: R-1036
	check("darwin found pi with nonzero version probe is a problem", failed[0]?.status === "problem");
}

// Injected win32 launcher cases are portable; the recording spawn never invokes pi.
{
	const fixture = tmpDir(path.join(os.tmpdir(), "nana-win-pi-manifest-"));
	tmps.push(fixture);
	for (const name of ["nana-pack", "nana-knowledge"]) fs.mkdirSync(path.join(fixture, "packages", name, "extensions"), { recursive: true });
	fs.writeFileSync(path.join(fixture, "package.json"), JSON.stringify({ pi: { extensions: ["packages/nana-pack/extensions", "packages/nana-knowledge/extensions"] } }));
	const fakeLayout = { piHome: "C:\\Users\\fake\\.pi\\agent", isRealHome: true };
	const calls = [];
	const injected = { platform: () => "win32", env: { PATH: "C:\\bin", ComSpec: "C:\\Windows\\cmd.exe" }, exists: (p) => p.toLowerCase() === "c:\\bin\\pi.cmd", manifestRoot: fixture, spawn: (command, args, options) => { calls.push({ command, args, options }); return { status: 0, stdout: "1.2.3", stderr: "" }; } };
	const result = stepPiRegister(fakeLayout, {}, injected);
	// req: R-1033 R-1034 R-1036
	check("win32 pi registration uses ComSpec and sets agent dir for install", result[0]?.status === "created" && calls.length === 3 && calls[0].command === "C:\\Windows\\cmd.exe" && calls[0].args[0] === "/d" && calls[1].options.env.PI_CODING_AGENT_DIR === fakeLayout.piHome, JSON.stringify({ result, calls }));
	const missing = stepPiRegister(fakeLayout, {}, { ...injected, exists: () => false, spawn: () => { throw new Error("must not spawn"); } });
	// req: R-1033
	check("win32 missing pi is skipped with install hint", missing[0]?.status === "skipped" && missing[0].detail.includes(PI_INSTALL_HINT));
	const failed = stepPiRegister(fakeLayout, {}, { ...injected, spawn: () => ({ status: 1, stderr: "failed" }) });
	// req: R-1036
	check("win32 found pi with failing version probe is a problem", failed[0]?.status === "problem");
	const spawnError = stepPiRegister(fakeLayout, {}, { ...injected, spawn: () => ({ error: Object.assign(new Error("denied"), { code: "EACCES" }) }) });
	// req: R-1036
	check("win32 found pi with spawn error is a problem", spawnError[0]?.status === "problem");
	const refused = stepPiRegister(fakeLayout, {}, { ...injected, exists: (p) => p.toLowerCase() === "c:\\%bad\\pi.cmd", env: { PATH: "C:\\%bad", PATHEXT: ".CMD" }, spawn: () => { throw new Error("must not spawn"); } });
	// req: R-1035
	check("win32 refused shim is a problem without spawn", refused[0]?.status === "problem" && refused[0].detail.includes("%"));
	const direct = stepPiRegister(fakeLayout, {}, { ...injected, exists: (p) => p.toLowerCase() === "c:\\bin\\pi.exe", spawn: (command, args) => { calls.push({ command, args }); return { status: 0, stdout: "1.2.3" }; } });
	// req: R-1039
	check("win32 executable launches direct", direct[0]?.status === "created" && calls.some((call) => call.command.toLowerCase().endsWith("pi.exe")));
}

if (process.platform === "win32") {
	const prefix = tmpDir(path.join(os.tmpdir(), "nana npm prefix space "));
	const fixture = path.join(prefix, "manifest root space &()^;", "app");
	const pkg = path.join(prefix, "fake-pi");
	fs.mkdirSync(path.join(fixture, "packages", "nana-pack", "extensions"), { recursive: true });
	fs.mkdirSync(pkg, { recursive: true });
	const log = path.join(prefix, "calls.json");
	fs.writeFileSync(path.join(fixture, "package.json"), JSON.stringify({ pi: { extensions: ["packages/nana-pack/extensions"] } }));
	fs.writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ name: "fake-pi-for-nana", version: "1.0.0", bin: { pi: "cli.cjs" } }));
	fs.writeFileSync(path.join(pkg, "cli.cjs"), `#!/usr/bin/env node\nconst fs=require('node:fs'); const a=process.argv.slice(2); if(a[0]==='--version') console.log('9.9.9'); else fs.writeFileSync(${JSON.stringify(log)}, JSON.stringify(a));\n`);
	// Invoke npm's JS CLI directly so spaces in the fixture prefix remain argv boundaries on Windows.
	const npmCli = process.env.npm_execpath;
	const installed = npmCli
		? spawnSync(process.execPath, [npmCli, "install", "--global", "--prefix", prefix, pkg], { encoding: "utf8" })
		: { status: 1, stderr: "npm_execpath is not set" };
	const fixtureInstalled = installed.status === 0;
	check("Windows fixture npm installed the local shim", fixtureInstalled, installed.stderr);
	const env = { ...process.env, PATH: `${prefix};${process.env.PATH ?? ""}` };
	const expectedShim = path.join(prefix, "pi.cmd");
	const selected = findPi({ env, cwd: prefix });
	const selectedFixture = selected === expectedShim;
	// req: R-1033
	check("Windows integration selected the prepended npm pi shim", selectedFixture, selected);
	if (!fixtureInstalled || !selectedFixture) {
		console.log("SKIP Windows npm-shim registration: fixture installation or exact findPi precondition failed");
	} else {
		const comspec = Object.keys(env).find((key) => key.toLowerCase() === "comspec");
		const guardedSpawn = (command, args, options) => {
			const valid = comspec && command.toLowerCase() === env[comspec].toLowerCase() && args.includes("/c") && args.join(" ").toLowerCase().includes(expectedShim.toLowerCase());
			if (!valid) {
				check("Windows registration spawn is only fixture ComSpec shim", false, JSON.stringify({ command, args, expectedShim }));
				return { error: new Error("refused non-fixture pi invocation") };
			}
			return spawnSync(command, args, options);
		};
		const result = stepPiRegister({ piHome: path.join(prefix, "agent"), isRealHome: true }, {}, { platform: () => "win32", env, spawn: guardedSpawn, manifestRoot: fixture });
		const args = JSON.parse(fs.readFileSync(log, "utf8"));
		// req: R-1034
		check("Windows npm shim preserves spaced metacharacter manifest root argv", result[0]?.status === "created" && JSON.stringify(args) === JSON.stringify(["install", path.join(fixture, "packages", "nana-pack")]), JSON.stringify({ result, args }));
	}
	fs.rmSync(prefix, { recursive: true, force: true });
} else console.log("SKIP Windows npm-generated pi.cmd integration: space/metacharacter manifest root and prepended PATH");

{
	const fakeBin = tmpDir(path.join(os.tmpdir(), "nana-dry-run-pi-"));
	tmps.push(fakeBin);
	const log = path.join(fakeBin, "calls");
	const recorder = path.join(fakeBin, "record.cjs");
	fs.writeFileSync(recorder, `const fs = require("node:fs");\nconst path = require("node:path");\nconst args = process.argv.slice(2);\nfs.appendFileSync(path.join(__dirname, "calls"), JSON.stringify(args) + "\\n");\nif (args[0] === "--version") console.log("1.0.2");\n`);
	if (process.platform === "win32") fs.writeFileSync(path.join(fakeBin, "pi.cmd"), `@"${process.execPath}" "%~dp0record.cjs" %*\r\n`);
	else {
		fs.writeFileSync(path.join(fakeBin, "pi"), `#!/bin/sh\nexec '${process.execPath}' '${recorder}' "$@"\n`);
		fs.chmodSync(path.join(fakeBin, "pi"), 0o755);
	}
	const readCalls = () => fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)) : [];
	const savedPath = process.env.PATH;
	process.env.PATH = `${fakeBin}${path.delimiter}${savedPath ?? ""}`;
	try {
		const installed = spawnSync(process.execPath, [cli, "install", "--home", piHomeWith(null)], { encoding: "utf8" });
		const dry = spawnSync(process.execPath, [cli, "install", "--dry-run", "--home", piHomeWith(null)], { encoding: "utf8" });
		const homePattern = /^\s*\S\s+pi packages\s+skipped\s+not registered \(--home override in play\)\s*$/m;
		const homeCalls = readCalls();
		const beforeAnchor = homeCalls.length;
		const anchored = stepPiRegister({ ...resolveLayout({ home: piHomeWith(null) }), isRealHome: true }, {}, { platform: () => process.platform });
		const anchorCalls = readCalls().slice(beforeAnchor);
		const anchorInstalled = anchorCalls.some((args) => args[0] === "install");
		// req: R-391
		check("R-391: under --home with an unregistered extension directory, install and install --dry-run both report the pi packages step skipped (--home override in play)", installed.status === 0 && dry.status === 0 && homePattern.test(installed.stdout) && homePattern.test(dry.stdout), JSON.stringify({ installed: installed.stdout, dry: dry.stdout }));
		// req: R-358
		check("R-358: under --home, install and install --dry-run start no pi install while a working pi is first on PATH", !homeCalls.some((args) => args[0] === "install") && anchored[0]?.status === "created" && anchorInstalled, JSON.stringify({ homeCalls, anchored, anchorCalls }));
	} finally { process.env.PATH = savedPath; }
}

{
	const makeFixture = (prefix) => {
		const root = tmpDir(path.join(os.tmpdir(), prefix));
		tmps.push(root);
		for (const name of ["nana-pack", "nana-knowledge"]) {
			const packageRoot = path.join(root, "packages", name);
			fs.mkdirSync(path.join(packageRoot, "extensions"), { recursive: true });
			fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ pi: { extensions: ["extensions"] } }));
		}
		fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ pi: { extensions: ["packages/nana-pack/extensions", "packages/nana-knowledge/extensions"] } }));
		return root;
	};
	const fixture = makeFixture("nana-pi-dry-");
	const bangFixture = makeFixture("nana-pi-dry!- ");
	const layoutFor = (root) => ({ piHome: path.join(root, "agent"), piSettings: path.join(root, "agent", "settings.json"), isRealHome: true });
	const carriesInstall = (platformName, call) => platformName === "win32" ? call.args.some((arg) => arg.includes('"install"')) : call.args[0] === "install";
	const runCase = (spec, dryRun) => {
		const calls = [];
		const spawn = (command, args, options) => {
			const call = { command, args, options };
			calls.push(call);
			return spec.reply(call);
		};
		const result = stepPiRegister(layoutFor(spec.root ?? fixture), { dryRun }, { platform: () => spec.platform, env: spec.env, exists: spec.exists, manifestRoot: spec.root ?? fixture, spawn });
		return { result, calls, installCalls: calls.filter((call) => carriesInstall(spec.platform, call)) };
	};
	const missingCases = [
		{ platform: "darwin", env: {}, reply: () => ({ error: Object.assign(new Error("missing"), { code: "ENOENT" }) }) },
		{ platform: "win32", env: { PATH: "C:\\none", PATHEXT: ".CMD", ComSpec: "C:\\Windows\\cmd.exe" }, exists: () => false, reply: () => { throw new Error("must not spawn"); } },
	];
	const missingResults = missingCases.map((spec) => ({ install: runCase(spec, false), dry: runCase(spec, true) }));
	const problemCases = [
		{ platform: "win32", env: { PATH: "C:\\%bad", PATHEXT: ".CMD", ComSpec: "C:\\Windows\\cmd.exe" }, exists: (p) => p.toLowerCase() === "c:\\%bad\\pi.cmd", reply: () => { throw new Error("must not spawn"); } },
		{ platform: "win32", root: bangFixture, env: { PATH: "C:\\bin", PATHEXT: ".CMD", ComSpec: "C:\\Windows\\cmd.exe" }, exists: (p) => p.toLowerCase() === "c:\\bin\\pi.cmd", reply: () => ({ status: 0, stdout: "1.0.2", stderr: "" }) },
		{ platform: "darwin", env: {}, reply: () => ({ status: 2, stdout: "", stderr: "bad version" }) },
		{ platform: "darwin", env: {}, reply: () => ({ error: Object.assign(new Error("denied"), { code: "EACCES" }) }) },
	];
	const problemResults = problemCases.map((spec) => ({ install: runCase(spec, false), dry: runCase(spec, true) }));
	const workingCases = [
		{ platform: "darwin", env: {}, reply: () => ({ status: 0, stdout: "1.0.2", stderr: "" }) },
		{ platform: "win32", env: { PATH: "C:\\bin", PATHEXT: ".CMD", ComSpec: "C:\\Windows\\cmd.exe" }, exists: (p) => p.toLowerCase() === "c:\\bin\\pi.cmd", reply: () => ({ status: 0, stdout: "1.0.2", stderr: "" }) },
	];
	const workingResults = workingCases.map((spec) => ({ install: runCase(spec, false), dry: runCase(spec, true) }));
	const missingOk = missingResults.every(({ install, dry }) => JSON.stringify(dry.result) === JSON.stringify(install.result) && dry.result[0]?.status === "skipped" && dry.result[0]?.detail.includes(PI_INSTALL_HINT));
	const problemOk = problemResults.every(({ install, dry }) => JSON.stringify(dry.result) === JSON.stringify(install.result) && dry.result[0]?.status === "problem" && installExitCode(dry.result) === 1 && dry.installCalls.length === 0);
	const workingOk = workingResults.every(({ dry }) => dry.result[0]?.status === "created" && dry.result[0]?.detail.startsWith("would add per-package entries for ") && dry.installCalls.length === 0);
	// req: R-1930
	check("R-1930: with pi not on PATH, the dry-run pi packages step reports skipped with the pi install hint, as install does, on darwin and win32", missingOk, JSON.stringify(missingResults));
	// req: R-1931
	check("R-1931: when install would report the pi packages step ✗ before any pi install, the dry run reports the same ✗ and exits 1", problemOk, JSON.stringify(problemResults));
	// req: R-1932
	check("R-1932: with a working pi on PATH and an unregistered extension directory, the dry-run pi packages step reports would add and starts no pi install", workingOk, JSON.stringify(workingResults));
}

// req: R-392
check("repository manifests remain byte-identical after fixture coverage checks",   [path.join(repo, "package.json"), path.join(repo, "packages", "nana-knowledge", "package.json")].every((file, index) => fs.readFileSync(file).equals(repoManifestBytes[index])));
for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
