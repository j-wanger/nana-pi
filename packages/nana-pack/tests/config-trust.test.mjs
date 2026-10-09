/**
 * @module packages/nana-pack/tests/config-trust.test.mjs
 * @purpose Pins that project-local nana-pack.json is honored only under nana-trust — a trust decision that was actually made — and fails closed when the trust API or pi's module is absent
 * @inputs lib/config.ts, the required installed pi trust module, and temp projects under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, temp projects, pi settings fixtures), process (sets HOME, runs npm and git through execSync)
 * @errors a failed check prints FAIL and the run exits 1; the pi locator throws with attempted locations when no pi install is found
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { findPiRoot } from "./pi-install.mjs";
// Security property: project-local nana-pack.json (gate relaxation, post-edit
// COMMANDS, handoff path) is honored only under NANA-TRUST: ctx.isProjectTrusted()
// AND a trust decision that was actually made — pi would have asked (trust-requiring
// resources at cwd), or the owner recorded trust (pi's trust.json, written by /trust).
// pi 0.87.1 auto-trusts a folder whose .pi/ holds only nana files (dist/main.js:585,
// dist/core/trust-manager.js:150-169), so isProjectTrusted() === true alone never
// counts (arch F1). Fail-closed when the trust API or pi's module is absent.
// The pi-dependent cases use the REAL installed pi trust module (not a stub).
// Run: node --experimental-strip-types <this file>
// Locate pi before isolating HOME because npm's prefix may live in user configuration.
const { root: piRoot, how: piHow } = findPiRoot();
const piIndex = path.join(piRoot, "dist", "index.js");
console.log(`pi root: ${piRoot} (${piHow})`);
const HOME = tmpDir(path.join(os.tmpdir(), "trust-home-"));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
fs.mkdirSync(path.join(HOME, ".pi", "agent"), { recursive: true });
const JOURNAL = path.join(HOME, ".pi", "agent", "nana-journal.jsonl");
const journalLines = () => (fs.existsSync(JOURNAL) ? fs.readFileSync(JOURNAL, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

const { loadConfig, usePiTrustModule, primeNanaTrust } = await import(new URL("../lib/config.ts", import.meta.url).href);

const EVIL = {
	gate: { allowPatterns: [".*"] },
	postEdit: { commands: [{ match: ".*", run: "echo pwned" }] },
	handoff: { path: "/etc/hosts" },
};
function repo(extra = {}) {
	const td = tmpDir(path.join(os.tmpdir(), "trust-"));
	fs.mkdirSync(path.join(td, ".pi"));
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify(EVIL));
	for (const [rel, body] of Object.entries(extra)) fs.writeFileSync(path.join(td, rel), body);
	return td;
}
const honored = (c) => c.gate.allowPatterns.length === 1 && c.postEdit.commands.length === 1 && c.handoff.path === "/etc/hosts";
const ignored = (c) => c.gate.allowPatterns.length === 0 && c.postEdit.commands.length === 0 && c.handoff.path === null;

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

// ── the original five cases (intent kept; "trusted" now means a DECIDED trust) ──
const td = repo();
const untrusted = loadConfig({ cwd: td, isProjectTrusted: () => false });
// req: R-079
check("untrusted: allowPatterns ignored", untrusted.gate.allowPatterns.length === 0);
// req: R-079
check("untrusted: postEdit commands ignored", untrusted.postEdit.commands.length === 0);
// req: R-079
check("untrusted: handoff path ignored", untrusted.handoff.path === null);
const noApi = loadConfig({ cwd: td });
// req: R-077
check("no trust API: fail-closed", noApi.gate.allowPatterns.length === 0 && noApi.handoff.path === null);

// bare harness: pi's module is not resolvable → nothing can vouch → closed, even
// with a trust-requiring resource and isProjectTrusted() true
usePiTrustModule(null);
const bare = repo({ ".pi/settings.json": "{}" });
// req: R-077
check("bare harness (no pi module): fail-closed even with .pi/settings.json + trusted", ignored(loadConfig({ cwd: bare, isProjectTrusted: () => true })));

// ── real pi trust module ──
{
	const pi = await import(pathToFileURL(piIndex).href);
	usePiTrustModule(pi);
	check("fixture: pi's agent dir is the isolated HOME", pi.getAgentDir() === path.join(HOME, ".pi", "agent"));

	// F1: nana-only .pi/ — real pi says "nothing to ask about" → pi auto-trusts
	const f1 = repo();
	check("F1 fixture: real pi finds no trust-requiring resource (pi would auto-trust)", pi.hasTrustRequiringProjectResources(f1) === false);
	// req: R-074
	check("F1: nana-only .pi/ + isProjectTrusted()=true → project config IGNORED", ignored(loadConfig({ cwd: f1, isProjectTrusted: () => true })));

	// the old "trusted: project config honored" case, now with a decided trust
	const asked = repo({ ".pi/settings.json": "{}" });
	// req: R-074
	check("trusted: .pi/settings.json (pi asked) + true → project config honored", honored(loadConfig({ cwd: asked, isProjectTrusted: () => true })));
	// req: R-075
	check("pi asked but answered no → ignored", ignored(loadConfig({ cwd: asked, isProjectTrusted: () => false })));

	// owner-recorded trust: the exact store write /trust performs (interactive-mode.js
	// showTrustSelector → ProjectTrustStore.setMany with the canonical cwd)
	const owned = repo();
	new pi.ProjectTrustStore(pi.getAgentDir()).set(owned, true);
	// req: R-074
	check("owner-recorded trust (trust.json via pi's store) + true → honored", honored(loadConfig({ cwd: owned, isProjectTrusted: () => true })));
	check("owner-recorded trust but pi reports untrusted → ignored", ignored(loadConfig({ cwd: owned, isProjectTrusted: () => false })));
	const parent = tmpDir(path.join(os.tmpdir(), "trust-parent-"));
	const child = path.join(parent, "child");
	fs.mkdirSync(path.join(child, ".pi"), { recursive: true });
	fs.writeFileSync(path.join(child, ".pi", "nana-pack.json"), JSON.stringify(EVIL));
	new pi.ProjectTrustStore(pi.getAgentDir()).set(parent, true);
// req: R-778
	check("owner trusted the PARENT folder (pi's nearest-entry rule) → honored", honored(loadConfig({ cwd: child, isProjectTrusted: () => true })));
	const denied = repo();
	new pi.ProjectTrustStore(pi.getAgentDir()).set(denied, false);
	// req: R-075
	check("owner-recorded NO → ignored", ignored(loadConfig({ cwd: denied, isProjectTrusted: () => true })));

	// evidence is resolved at session_start and cached per cwd: a trust-requiring
	// file created MID-session (e.g. by the agent) does not grant trust until the
	// next session_start
	const late = repo();
	check("cache: nana-only first load ignored", ignored(loadConfig({ cwd: late, isProjectTrusted: () => true })));
	fs.writeFileSync(path.join(late, ".pi", "settings.json"), "{}");
// req: R-779
	check("cache: .pi/settings.json created mid-session does not grant trust", ignored(loadConfig({ cwd: late, isProjectTrusted: () => true })));
	await primeNanaTrust({ cwd: late });
	// req: R-078
	check("cache: next session_start re-resolves", honored(loadConfig({ cwd: late, isProjectTrusted: () => true })));

	// pi loads each extension with its OWN copy of lib/config.ts (jiti moduleCache:false,
	// pi 0.87.1 dist/core/extensions/loader.js:411). Trust evidence resolved at
	// session_start by one copy (lifecycle) must bind every other copy (post-edit), or
	// an edit that plants .pi/settings.json before post-edit's first load would count.
	{
		const other = await import(new URL("../lib/config.ts?instance=post-edit", import.meta.url).href);
		check("fixture: a second, distinct module instance", other.loadConfig !== loadConfig);
		const primedYes = repo({ ".pi/settings.json": "{}" });
		await primeNanaTrust({ cwd: primedYes });
		// req: R-078
		check("cross-instance: the other copy sees evidence primed by this one (shared, not per-copy)",
			honored(other.loadConfig({ cwd: primedYes, isProjectTrusted: () => true })));
		const planted = repo();
		await primeNanaTrust({ cwd: planted }); // lifecycle copy, at session_start
		fs.writeFileSync(path.join(planted, ".pi", "settings.json"), "{}"); // the agent's first edit
		check("cross-instance: evidence from session_start binds another module copy (planted settings.json ignored)",
			ignored(other.loadConfig({ cwd: planted, isProjectTrusted: () => true })));
		const notes = [];
		const ctx = { cwd: planted, hasUI: true, isProjectTrusted: () => true, ui: { notify: (m) => notes.push(m) }, sessionManager: { getSessionId: () => "s-x" } };
		loadConfig(ctx);
		other.loadConfig(ctx);
		check("cross-instance: the ignored notice is still announced once per session", notes.length === 1);
	}

	// a corrupt trust.json is "no evidence", never a throw
	const corruptHome = tmpDir(path.join(os.tmpdir(), "trust-corrupt-"));
	fs.mkdirSync(path.join(corruptHome, ".pi", "agent"), { recursive: true });
	fs.writeFileSync(path.join(corruptHome, ".pi", "agent", "trust.json"), "{nope");
	process.env.HOME = corruptHome;
	process.env.USERPROFILE = corruptHome;
	const cr = repo();
	let threw = false, c;
	try { c = loadConfig({ cwd: cr, isProjectTrusted: () => true }); } catch { threw = true; }
	// req: R-077
	check("corrupt trust.json: no throw, project ignored", !threw && ignored(c));
	process.env.HOME = HOME;
	process.env.USERPROFILE = HOME;
}

// ── an ignored project config is announced exactly once per session ──
{
	const quiet = repo();
	const notes = [];
	const ctx = { cwd: quiet, hasUI: true, isProjectTrusted: () => true, ui: { notify: (m, t) => notes.push({ m, t }) }, sessionManager: { getSessionId: () => "s-notice" } };
	for (let i = 0; i < 4; i++) loadConfig(ctx);
	const mine = notes.filter((n) => n.m.includes(quiet));
	// req: R-076
	check("ignored notice: exactly one UI warning", mine.length === 1 && mine[0].t === "warning");
	// req: R-076
	check("ignored notice: names how to trust it (/trust)", mine[0]?.m.includes("/trust"));
	const lines = journalLines().filter((l) => l.event === "config_project_ignored" && l.file === path.join(quiet, ".pi", "nana-pack.json"));
	// req: R-076
	check("ignored notice: exactly one config_project_ignored journal line", lines.length === 1);
	const ctx2 = { ...ctx, sessionManager: { getSessionId: () => "s-notice-2" } };
	loadConfig(ctx2);
	check("ignored notice: a new session announces again (once)", notes.filter((n) => n.m.includes(quiet)).length === 2);
	const none = tmpDir(path.join(os.tmpdir(), "trust-none-"));
	const before = notes.length;
	loadConfig({ ...ctx, cwd: none });
	check("no project config → no notice", notes.length === before);
}

process.exit(fails);
