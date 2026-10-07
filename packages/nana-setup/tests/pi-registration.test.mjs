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
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const { entryMatches, registrationState, remoteMatches, packageCoverage, stepPiRegister } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
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
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-reg-"));
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
	const doc = spawnSync(process.execPath, [cli, "doctor", "--home", home], { encoding: "utf8" });
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
	const rootManifestPath = path.join(repo, "package.json");
	const packageManifestPath = path.join(repo, "packages", "nana-knowledge", "package.json");
	const originalRootManifest = fs.readFileSync(rootManifestPath, "utf8");
	const originalPackageManifest = fs.readFileSync(packageManifestPath, "utf8");
	try {
		const rootManifest = JSON.parse(originalRootManifest);
		rootManifest.pi.extensions[1] = "packages/nana-knowledge/extensions-alt";
		fs.writeFileSync(rootManifestPath, JSON.stringify(rootManifest, null, 2));
		const packageManifest = JSON.parse(originalPackageManifest);
		packageManifest.pi.extensions = [];
		fs.writeFileSync(packageManifestPath, JSON.stringify(packageManifest, null, 2));
		const home = piHomeWith(null);
		const agent = path.join(home, ".pi", "agent");
		const knowledge = path.relative(agent, path.join(repo, "packages", "nana-knowledge"));
		fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [knowledge] }));
		const coverage = packageCoverage(resolveLayout({ home }));
		// req: R-392
		check("diverging root manifest extension directory remains uncovered", coverage.missing.includes(path.join(repo, "packages", "nana-knowledge", "extensions-alt")), JSON.stringify(coverage));
	} finally {
		fs.writeFileSync(rootManifestPath, originalRootManifest);
		fs.writeFileSync(packageManifestPath, originalPackageManifest);
	}
}
{
	const home = piHomeWith(null);
	const agent = path.join(home, ".pi", "agent");
	const knowledge = path.relative(agent, path.join(repo, "packages", "nana-knowledge"));
	fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [knowledge] }));
	const coverage = packageCoverage(resolveLayout({ home }));
	// req: R-392
	check("knowledge-only registration leaves nana-pack's manifest extension directory uncovered", coverage.missing.some((p) => p.endsWith(path.join("packages", "nana-pack", "extensions"))), JSON.stringify(coverage));
	const r = spawnSync(process.execPath, [cli, "doctor", "--home", home], { encoding: "utf8" });
	// req: R-654
	check("doctor names nana-pack's uncovered extensions directory", /✗ pi packages.*packages.nana-pack.extensions/s.test(r.stdout), r.stdout);
	const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), "nana-fake-pi-"));
	tmps.push(fakeBin);
	const log = path.join(fakeBin, "calls");
	fs.writeFileSync(path.join(fakeBin, "pi"), `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}'\nexit 0\n`);
	fs.chmodSync(path.join(fakeBin, "pi"), 0o755);
	const savedPath = process.env.PATH;
	process.env.PATH = `${fakeBin}:${savedPath}`;
	try {
		const fakeReal = { ...resolveLayout({ home }), isRealHome: true };
		const installed = stepPiRegister(fakeReal, {});
		const calls = fs.readFileSync(log, "utf8").trim().split("\n");
		// req: R-323
		check("install adds only the missing per-package entry, never a root entry", calls.length === 2 && calls[1] === `install ${path.join(repo, "packages", "nana-pack")}` && !calls.some((line) => line === `install ${repo}`), `${JSON.stringify(calls)} ${JSON.stringify(installed)}`);
	} finally { process.env.PATH = savedPath; }
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
		const wt = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-wt-"));
		const added = spawnSync("git", ["-C", repo, "worktree", "add", "--detach", "-q", wt, "HEAD"], { encoding: "utf8" });
		if (added.status !== 0) {
			console.log("SKIP could not create a throwaway worktree: " + added.stderr.trim());
			fs.rmSync(wt, { recursive: true, force: true });
		} else {
			try {
				const wtCli = path.join(wt, "packages", "nana-setup", "bin", "nana-setup.mjs");
				const wtSteps = await import(new URL("file://" + path.join(wt, "packages", "nana-setup", "lib", "steps.mjs")).href);
				const wtPaths = await import(new URL("file://" + path.join(wt, "packages", "nana-setup", "lib", "paths.mjs")).href);
				check("the throwaway worktree is a linked worktree of the main clone", fs.realpathSync(wtPaths.repoRoot) === fs.realpathSync(wt) && fs.realpathSync(mainCheckout) !== fs.realpathSync(wt), `${wtPaths.repoRoot} vs ${mainCheckout}`);
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
				const other = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-otherrepo-"));
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
		const entries = JSON.parse(fs.readFileSync(live, "utf8")).packages ?? [];
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

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
