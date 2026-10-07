/**
 * @module packages/nana-pack/tests/adoption-producer.test.mjs
 * @purpose Pins the L5 adoption producer — `directory_unadopted` is journaled once per repository root per day, only for the shapes that qualify, and nothing about adoption reaches the prompt
 * @inputs extensions/nana-handoff.ts, lib/adoption.mjs, a nana-pack.json journal config under a temp HOME, and throwaway git repositories
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, journal and repository fixtures under the OS temp dir), process (sets HOME and USERPROFILE, spawns git)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
// L5 producer: `directory_unadopted` is journaled once per repo root per day, only for a
// "missing" store entry with no configured handoff.path, in a git repo whose ROOT has no store
// entry / OBJECTIVE.md / .nana-not-a-project — and nothing reaches the prompt. Temp HOME.
// Run: node --experimental-strip-types <this file>
const NANA_HOME = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-")));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
delete process.env.NANA_HANDOFF;
delete process.env.PI_CODING_AGENT_DIR;
process.env.NANA_TEST_TEMP_ROOTS = "";
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
const JOURNAL = path.join(NANA_HOME, "journal.jsonl");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
const cfg = (extra = {}) => fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: true, path: JOURNAL }, ...extra }));
cfg();

const mod = await import(new URL("../extensions/nana-handoff.ts", import.meta.url).href);
const lib = await import(new URL("../lib/adoption.mjs", import.meta.url).href);
let fails = 0;
const check = (n, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why); if (!ok) fails++; };
const reports = () =>
	(fs.existsSync(JOURNAL) ? fs.readFileSync(JOURNAL, "utf-8") : "").split("\n").filter((l) => l.includes('"directory_unadopted"')).map((l) => JSON.parse(l));
const reportsFor = (root) => reports().filter((r) => r.cwd === root);

function session(m, cwd) {
	const handlers = {};
	m.default({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd, hasUI: false, isProjectTrusted: () => true, sessionManager: { getSessionFile: () => "/sessions/s1.jsonl" } };
	return {
		compact: (summary) => handlers.session_compact({ compactionEntry: { summary }, reason: "manual" }, ctx),
		prompt: async (reason = "startup") => {
			await handlers.session_start({ reason }, ctx);
			const event = { systemPrompt: "BASE", systemPromptOptions: { sections: {} } };
			const result = await handlers.before_agent_start(event, ctx);
			const section = event.systemPromptOptions.sections["nana-handoff"];
			return section ? `BASE${section}` : result?.systemPrompt ?? "BASE";
		},
	};
}
const prompt = (cwd) => session(mod, cwd).prompt();
const mk = (p) => (fs.mkdirSync(p, { recursive: true }), p);
const repo = (name, files = []) => {
	const r = mk(path.join(base, name));
	mk(path.join(r, ".git"));
	for (const f of files) f.endsWith("/") ? mk(path.join(r, f)) : fs.writeFileSync(path.join(r, f), "x\n");
	return r;
};
const base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "adoption-producer-")));

// ONE store resolver (sol r1 MUST 3): the extension re-exports lib/adoption.mjs's functions — the
// same objects, not an agreeing copy — and its source no longer hashes a store key of its own.
{
	const src = fs.readFileSync(new URL("../extensions/nana-handoff.ts", import.meta.url), "utf8");
	check("one store: extension storePathFor/storeDir/canonicalCwd ARE lib/adoption.mjs's", mod.storePathFor === lib.storePathFor && mod.storeDir === lib.storeDir && mod.canonicalCwd === lib.canonicalCwd);
	check("one store: no createHash / storeDir definition left in the extension", !src.includes("createHash") && !/(const|function) (storeDir|storePathFor|canonicalCwd)\b/.test(src));
	// req: R-108
	check("one store: the store stays fixed at ~/.pi/agent/handoffs", lib.storeDir() === path.join(NANA_HOME, ".pi", "agent", "handoffs"));
}

// (a) written once for a repo root with nothing — the line as emitted
{
	const r = repo("bare", ["AGENTS.md", "docs/sessions/"]);
	// req: R-144
	check("a: prompt unchanged (BASE)", (await prompt(r)) === "BASE");
	const got = reportsFor(r);
	// req: R-143
	check("a: one directory_unadopted line for the root", got.length === 1, JSON.stringify(got));
	console.log(`  emitted: ${fs.readFileSync(JOURNAL, "utf-8").split("\n").find((l) => l.includes('"directory_unadopted"'))}`);
	// req: R-143
	check("a: has = what the root shows", JSON.stringify(got[0]?.has) === JSON.stringify({ handoff: false, objective: false, agents: true, sessions: true }));
	// req: R-143
	check("a: ts is ISO", !Number.isNaN(Date.parse(got[0]?.ts)));
	await prompt(r);
	await prompt(mk(path.join(r, "src")));
	// req: R-146
	check("a: NOT written by a second session the same day (root or subdir)", reportsFor(r).length === 1);
	check("a: the subdirectory is never the reported path", reportsFor(path.join(r, "src")).length === 0);
}
// a subdirectory of an UNadopted repo reports the repo root
{
	const r = repo("sub-only");
	await prompt(mk(path.join(r, "pkg", "leaf")));
	const got = reportsFor(r);
	// req: R-145
	check("a: a session in a subdirectory reports the repository root", got.length === 1 && JSON.stringify(got[0].has) === JSON.stringify({ handoff: false, objective: false, agents: false, sessions: false }));
}
// no .git anywhere above
{
	const plain = mk(path.join(base, "plain", "deep"));
	if (lib.repoRootOf(plain) !== null) console.log(`SKIP no-.git: ${lib.repoRootOf(plain)} is a git repo above the temp dir`);
	else {
		const before = reports().length;
		check("a: no .git above → prompt BASE", (await prompt(plain)) === "BASE");
		// req: R-147
		check("a: no .git above → no line", reports().length === before);
	}
}
// The complete Nana structure adopts; HANDOFF.md by itself does not.
{
	const complete = repo("complete-nana", ["HANDOFF.md", "AGENTS.md", "docs/sessions/"]);
	await prompt(complete);
	// req: R-152
	check("adoption: complete Nana structure root is adopted", reportsFor(complete).length === 0);
	const handoffOnly = repo("handoff-only", ["HANDOFF.md"]);
	await prompt(handoffOnly);
	// req: R-143
	check("adoption: HANDOFF.md-only root remains unadopted", reportsFor(handoffOnly).length === 1);
}
// Test-only injected temp roots: production defaults skip OS temp roots, ordinary fixtures opt out.
{
	const r = repo("injected-temporary-root");
	process.env.NANA_TEST_TEMP_ROOTS = path.dirname(r);
	await prompt(r);
	process.env.NANA_TEST_TEMP_ROOTS = "";
	// req: R-640
	check("adoption: injected temporary parent skips producer root", reportsFor(r).length === 0);
}
// adopted / dismissed roots
for (const [label, files] of [["OBJECTIVE.md at the root", ["OBJECTIVE.md"]], ["dismissal marker at the root", [lib.MARKER]]]) {
	const r = repo(`adopted-${files[0]}`, files);
	await prompt(r);
	await prompt(mk(path.join(r, "src")));
	// req: R-158
	check(`a: ${label} → no line (root and subdir)`, reportsFor(r).length === 0 && reports().every((x) => !x.cwd.startsWith(r)));
}
// a root with a store entry: a subdir session is missing but the ROOT is adopted
{
	const r = repo("stored");
	await session(mod, r).compact("ROOT-STATE");
	await prompt(r);
	const sp = await prompt(mk(path.join(r, "src")));
	check("a: a root with a store entry → no line (subdir session)", reports().every((x) => !x.cwd.startsWith(r)));
	check("a: …and the in-session ancestor line is still there", sp.includes(`An ancestor directory (${r}) has one`));
}
// an unreadable store entry (read.kind === "error") never reports
{
	const r = repo("unreadable");
	fs.mkdirSync(path.dirname(mod.storePathFor(r)), { recursive: true });
	fs.writeFileSync(mod.storePathFor(r), Buffer.from([0xff, 0xfe, 0x41]));
	await prompt(r);
	// req: R-147
	check("a: unreadable store → handoff_pickup_failed, no line", fs.readFileSync(JOURNAL, "utf-8").includes('"handoff_pickup_failed"') && reportsFor(r).length === 0);
}
// a configured handoff.path is a deliberate adoption
{
	const r = repo("custom");
	cfg({ handoff: { path: path.join(base, "nowhere", "h.md") } });
	await prompt(r);
	cfg();
	// req: R-147
	check("a: configured handoff.path → no line", reportsFor(r).length === 0);
}
// NANA_HANDOFF=off returns before it
{
	const r = repo("role-off");
	process.env.NANA_HANDOFF = "off";
	await prompt(r);
	delete process.env.NANA_HANDOFF;
	// req: R-147
	check("a: NANA_HANDOFF=off → no line", reportsFor(r).length === 0);
}
// (b) a linked worktree (.git FILE) is its own root, even nested inside another repo
{
	const outer = repo("outer");
	const wt = mk(path.join(outer, "wt"));
	fs.writeFileSync(path.join(wt, ".git"), `gitdir: ${outer}/.git/worktrees/wt\n`);
	await prompt(mk(path.join(wt, "src")));
	// req: R-809
	check("b: a linked worktree is reported as its own root", reportsFor(wt).length === 1 && reportsFor(outer).length === 0);
}
// a symlinked repo root is one canonical entry
{
	const r = repo("real-root");
	const link = path.join(base, "link-root");
	fs.symlinkSync(r, link);
	await prompt(link);
	await prompt(r);
	// req: R-145
	check("symlinked root: reported once, under the canonical path", reportsFor(r).length === 1 && reportsFor(link).length === 0);
}
// the 24h window: a report older than a day does not suppress a new one
{
	const r = repo("stale-report");
	fs.appendFileSync(JOURNAL, `${JSON.stringify({ ts: new Date(Date.now() - 25 * 3_600_000).toISOString(), event: "directory_unadopted", cwd: r, has: {} })}\n`);
	await prompt(r);
	// req: R-146
	check("24h: a report 25h old → a new line", reportsFor(r).length === 2);
}
// a huge journal is read by its tail only
{
	const big = path.join(base, "big.jsonl");
	fs.writeFileSync(big, `${"x".repeat(1024)}\n`.repeat(2048));
	const lines = lib.tailLines(big);
	// req: R-146
	check("tail: a 2 MiB journal yields ≤ 256 KiB of whole lines", lines.join("\n").length <= lib.TAIL_BYTES && lines.every((l) => l.length === 1024));
	check("tail: absent journal → []", lib.tailLines(path.join(base, "absent.jsonl")).length === 0);
}
// an unwritable / absent journal location never throws out of the handler
{
	const r = repo("no-journal");
	cfg({ journal: { enabled: true, path: path.join(base, "missing-dir", "j.jsonl") } });
	// req: R-161
	check("journal unwritable: prompt still BASE, no throw", (await prompt(r)) === "BASE");
	cfg();
}

// producer and reader agree on ONE journal (sol r1 MUST 2): a project-scope journal.path never
// captures the event, a relative user-scope path is not honoured for it — both land in
// <agent dir>/nana-journal.jsonl, which is exactly where the reader looks.
{
	const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "nana-adoption.mjs");
	const DEFAULT_J = path.join(NANA_HOME, ".pi", "agent", "nana-journal.jsonl");
	const readerEnv = { ...process.env, HOME: NANA_HOME, USERPROFILE: NANA_HOME };
	const reader = (cwd) => spawnSync(process.execPath, [BIN], { cwd, env: readerEnv, encoding: "utf8" });
	const listed = (out, r) => out.includes(`- \`${r}\` —`);
	// project-scope override (trusted project)
	const r = repo("project-override");
	const projJ = path.join(base, "project-journal.jsonl");
	mk(path.join(r, ".pi"));
	fs.writeFileSync(path.join(r, ".pi", "nana-pack.json"), JSON.stringify({ journal: { path: projJ } }));
	const { loadConfig, usePiTrustModule } = await import(new URL("../lib/config.ts", import.meta.url).href);
	usePiTrustModule({ hasTrustRequiringProjectResources: () => true, ProjectTrustStore: class { get() { return true; } } }); // nana-trusted
	// req: R-160
	check("journal: the project journal.path IS honoured by config (test is not vacuous)", loadConfig({ cwd: r, hasUI: false, isProjectTrusted: () => true }).journal.path === projJ);
	await prompt(r);
	// req: R-810
	check("journal: project journal.path does NOT capture directory_unadopted", !(fs.existsSync(projJ) && fs.readFileSync(projJ, "utf8").includes('"directory_unadopted"')));
	// req: R-148
	check("journal: …the user-scope journal does", reportsFor(r).length === 1);
	// req: R-810 R-159
	check("journal: …other events still follow the project journal.path", fs.existsSync(projJ) && fs.readFileSync(projJ, "utf8").includes('"handoff_missing"'));
	// req: R-160
	check("journal: …and the reader lists it", listed(reader(base).stdout, r), reader(base).stdout);
	// relative user-scope path: producer (pi cwd = r2) and reader (another cwd) both use the default
	const r2 = repo("relative-user");
	// A RELATIVE path is the point of this case, but `appendJournal` resolves it against the test
	// process cwd — so point it at the temp home, or ordinary handoff events litter the repository
	// (sol r2 found a committed rel-journal.jsonl). Still relative as written.
	const relJ = path.relative(process.cwd(), path.join(NANA_HOME, "rel-journal.jsonl"));
	cfg({ journal: { enabled: true, path: relJ } });
	await prompt(r2);
	const out = reader(NANA_HOME).stdout;
	cfg();
	const inDefault = fs.existsSync(DEFAULT_J) && fs.readFileSync(DEFAULT_J, "utf8").split("\n").some((l) => l.includes('"directory_unadopted"') && l.includes(JSON.stringify(r2)));
	// req: R-148
	check("journal: relative user journal.path → the event goes to <agent dir>/nana-journal.jsonl", inDefault);
	// req: R-810
	check("journal: …not to a cwd-relative file", !fs.existsSync(path.resolve(relJ)) || !fs.readFileSync(path.resolve(relJ), "utf8").includes('"directory_unadopted"'));
	check("journal: …and the reader, from another cwd, lists it", listed(out, r2), out);
}
// a root the reader would refuse (a newline in its name) is never journaled — not once, not daily
{
	const r = repo("nl\n## FORGED");
	await prompt(r);
	await prompt(r);
	// req: R-149
	check("unprintable root: no directory_unadopted line", reportsFor(r).length === 0 && !fs.readFileSync(JOURNAL, "utf8").includes("FORGED\",\"has"));
}
// the configured objective filename counts as adoption (sol r1 MUST 5), in producer and reader alike
{
	const r = repo("renamed-objective", ["GOALS.md"]);
	cfg({ objective: { projectFile: "GOALS.md" } });
	await prompt(r);
	// req: R-150
	check("objective: GOALS.md with objective.projectFile=GOALS.md → adopted, no line", reportsFor(r).length === 0);
	check("objective: adoptionSettings() names it", lib.adoptionSettings().objectiveFile === "GOALS.md");
	const { projectFileName } = await import(new URL("../lib/objective.ts", import.meta.url).href);
	for (const v of ["GOALS.md", "", ".", "..", "a/b", "a\\b", 7, null, false]) {
		cfg({ objective: { projectFile: v } });
		// req: R-811
		check(`objective: adoption's name agrees with lib/objective.ts for ${JSON.stringify(v)}`, lib.adoptionSettings().objectiveFile === projectFileName({ projectFile: v }));
	}
	cfg();
	const r2 = repo("default-objective-only", ["GOALS.md"]);
	await prompt(r2);
	// req: R-150
	check("objective: without the setting GOALS.md is not an objective → line", reportsFor(r2).length === 1);
}

// (e) the session prompt is byte-identical to the pre-L5 extension (eca3de4), same scenarios
{
	const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
	const old = spawnSync("git", ["-C", repoRoot, "show", "eca3de4:packages/nana-pack/extensions/nana-handoff.ts"], { encoding: "utf8" });
	const golden = async (m, cwd) => session(m, cwd).prompt();
	const cases = [];
	const r1 = repo("golden-bare");
	cases.push(r1, mk(path.join(r1, "a", "b")));
	const r2 = repo("golden-stored");
	await session(mod, r2).compact("G-STATE");
	cases.push(mk(path.join(r2, "src")));
	// exact goldens (no git needed)
	// req: R-144
	check("e: unadopted repo root → prompt exactly BASE", (await golden(mod, r1)) === "BASE");
	check(
		"e: subdir of a stored root → the exact ancestor block",
		(await golden(mod, cases[2])) ===
			`BASE\n\n## Handoff (nana — agent-written compaction summary)\n\nNo handoff for this directory. An ancestor directory (${r2}) has one at ${mod.storePathFor(r2)} — NOT injected; read it only if relevant.\n`,
	);
	if (old.status !== 0) console.log("SKIP e: A/B vs eca3de4 (git history unavailable)");
	else {
		const tmp = mk(path.join(base, "old-pack", "extensions"));
		fs.symlinkSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "lib"), path.join(base, "old-pack", "lib"));
		fs.writeFileSync(path.join(tmp, "nana-handoff.ts"), old.stdout);
		const oldMod = await import(new URL(`file://${path.join(tmp, "nana-handoff.ts")}`).href);
		for (const c of cases) {
			const [a, b] = [await golden(oldMod, c), await golden(mod, c)];
			// req: R-144
			check(`e: byte-identical to eca3de4 — ${path.relative(base, c)}`, a === b, JSON.stringify({ a, b }));
		}
	}
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
