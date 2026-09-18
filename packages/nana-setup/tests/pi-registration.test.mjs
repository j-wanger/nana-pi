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
const { entryMatches, registrationState, remoteMatches } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
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
]) check(`remote is NOT us: ${e}`, !remoteMatches(e) && !entryMatches(e, piHome, root));

/* --- the shapes that do not ------------------------------------------------------------- */
check("an npm package is not us", !entryMatches("npm:pi-subagents", piHome, root));
check("another local repo is not us", !entryMatches("../../other-repo", piHome, root));
check("a sibling with a prefix name is not us", !entryMatches("/Users/x/nana-pi-other", piHome, root));
check("someone else's fork is not us", !entryMatches("git:github.com/someone/nana-pi", piHome, root));
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
	const rel = path.relative(agent, path.join(repo, "packages", "nana-pack"));
	fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: ["npm:pi-subagents", rel] }, null, 2));
	const state = registrationState(resolveLayout({ home }));
	check("registered by relative path is detected as present", state.present, JSON.stringify(state));
	check("the matching entry is reported", state.match === rel);
	const r = spawnSync(process.execPath, [cli, "install", "--home", home], { encoding: "utf8" });
	check("install reports it as already registered", /pi packages\s+unchanged\s+registered as/.test(r.stdout), r.stdout);
	check("install did not add an entry", JSON.parse(fs.readFileSync(path.join(agent, "settings.json"), "utf8")).packages.length === 2);
	const doc = spawnSync(process.execPath, [cli, "doctor", "--home", home], { encoding: "utf8" });
	check("doctor reports pi packages ✓", /✓ pi packages/.test(doc.stdout), doc.stdout);
}
{
	const home = piHomeWith(["npm:pi-mcp-adapter"]);
	const state = registrationState(resolveLayout({ home }));
	check("an unrelated package list is not a match", !state.present);
	check("entries are still reported", state.entries.length === 1);
}
{
	const home = piHomeWith(null);
	check("a missing pi settings.json is not a match", !registrationState(resolveLayout({ home })).present);
}

/* --- a WORKTREE of the same repo is the same repo --------------------------------------- */
{
	// This is the exact shape sol r1 flagged: the installer runs from a worktree
	// (~/nana-pi-wt/<lane>) while settings registers the main checkout by relative path. A
	// lexical guard says "not registered" and `pi install` then loads every extension twice.
	const common = spawnSync("git", ["-C", repo, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" });
	if (common.status !== 0) {
		console.log("SKIP this checkout is not a git repo");
	} else {
		const mainCheckout = path.dirname(common.stdout.trim()); // <main clone>/.git -> <main clone>
		const isWorktree = path.resolve(mainCheckout) !== path.resolve(repo);
		check("this run is inside a linked worktree of the main clone", isWorktree, `${repo} vs ${mainCheckout}`);
		const home = piHomeWith(null);
		const agent = path.join(home, ".pi", "agent");
		const rel = path.relative(agent, path.join(mainCheckout, "packages", "nana-pack"));
		fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [rel] }, null, 2));
		const state = registrationState(resolveLayout({ home }));
		check("the MAIN clone's relative entry marks this WORKTREE as registered", state.present, JSON.stringify(state));
		const r = spawnSync(process.execPath, [cli, "install", "--home", home], { encoding: "utf8" });
		check("install does not run `pi install` for a worktree of a registered repo", /pi packages\s+unchanged\s+registered as/.test(r.stdout), r.stdout);
		check("no entry was added", JSON.parse(fs.readFileSync(path.join(agent, "settings.json"), "utf8")).packages.length === 1);

		// the `~/...` spelling of the same clone
		const tildeForm = mainCheckout.startsWith(os.homedir() + path.sep) ? "~/" + path.relative(os.homedir(), path.join(mainCheckout, "packages", "nana-pack")) : null;
		if (!tildeForm) console.log("SKIP the main clone is not under $HOME");
		else {
			fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [tildeForm] }, null, 2));
			check(`a \`~\` entry (${tildeForm}) is expanded and matched`, registrationState(resolveLayout({ home })).present);
		}

		// an unrelated repo still is not us
		const other = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-otherrepo-"));
		tmps.push(other);
		spawnSync("git", ["-C", other, "init", "-q"], { encoding: "utf8" });
		fs.writeFileSync(path.join(agent, "settings.json"), JSON.stringify({ packages: [other] }, null, 2));
		check("a different git repo is NOT a match", !registrationState(resolveLayout({ home })).present);
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
