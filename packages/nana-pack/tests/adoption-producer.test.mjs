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
			return (await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx))?.systemPrompt ?? "BASE";
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

check("the shared predicate's store path equals the extension's storePathFor", [base, "/", "/tmp/x y", NANA_HOME].every((p) => lib.storeEntryFor(p) === mod.storePathFor(p)));

// (a) written once for a repo root with nothing — the line as emitted
{
	const r = repo("bare", ["AGENTS.md", "docs/sessions/"]);
	check("a: prompt unchanged (BASE)", (await prompt(r)) === "BASE");
	const got = reportsFor(r);
	check("a: one directory_unadopted line for the root", got.length === 1, JSON.stringify(got));
	console.log(`  emitted: ${fs.readFileSync(JOURNAL, "utf-8").split("\n").find((l) => l.includes('"directory_unadopted"'))}`);
	check("a: has = what the root shows", JSON.stringify(got[0]?.has) === JSON.stringify({ handoff: false, objective: false, agents: true, sessions: true }));
	check("a: ts is ISO", !Number.isNaN(Date.parse(got[0]?.ts)));
	await prompt(r);
	await prompt(mk(path.join(r, "src")));
	check("a: NOT written by a second session the same day (root or subdir)", reportsFor(r).length === 1);
	check("a: the subdirectory is never the reported path", reportsFor(path.join(r, "src")).length === 0);
}
// a subdirectory of an UNadopted repo reports the repo root
{
	const r = repo("sub-only");
	await prompt(mk(path.join(r, "pkg", "leaf")));
	const got = reportsFor(r);
	check("a: a session in a subdirectory reports the repository root", got.length === 1 && JSON.stringify(got[0].has) === JSON.stringify({ handoff: false, objective: false, agents: false, sessions: false }));
}
// no .git anywhere above
{
	const plain = mk(path.join(base, "plain", "deep"));
	if (lib.repoRootOf(plain) !== null) console.log(`SKIP no-.git: ${lib.repoRootOf(plain)} is a git repo above the temp dir`);
	else {
		const before = reports().length;
		check("a: no .git above → prompt BASE", (await prompt(plain)) === "BASE");
		check("a: no .git above → no line", reports().length === before);
	}
}
// adopted / dismissed roots
for (const [label, files] of [["OBJECTIVE.md at the root", ["OBJECTIVE.md"]], ["dismissal marker at the root", [lib.MARKER]]]) {
	const r = repo(`adopted-${files[0]}`, files);
	await prompt(r);
	await prompt(mk(path.join(r, "src")));
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
	check("a: unreadable store → handoff_pickup_failed, no line", fs.readFileSync(JOURNAL, "utf-8").includes('"handoff_pickup_failed"') && reportsFor(r).length === 0);
}
// a configured handoff.path is a deliberate adoption
{
	const r = repo("custom");
	cfg({ handoff: { path: path.join(base, "nowhere", "h.md") } });
	await prompt(r);
	cfg();
	check("a: configured handoff.path → no line", reportsFor(r).length === 0);
}
// NANA_HANDOFF=off returns before it
{
	const r = repo("role-off");
	process.env.NANA_HANDOFF = "off";
	await prompt(r);
	delete process.env.NANA_HANDOFF;
	check("a: NANA_HANDOFF=off → no line", reportsFor(r).length === 0);
}
// (b) a linked worktree (.git FILE) is its own root, even nested inside another repo
{
	const outer = repo("outer");
	const wt = mk(path.join(outer, "wt"));
	fs.writeFileSync(path.join(wt, ".git"), `gitdir: ${outer}/.git/worktrees/wt\n`);
	await prompt(mk(path.join(wt, "src")));
	check("b: a linked worktree is reported as its own root", reportsFor(wt).length === 1 && reportsFor(outer).length === 0);
}
// a symlinked repo root is one canonical entry
{
	const r = repo("real-root");
	const link = path.join(base, "link-root");
	fs.symlinkSync(r, link);
	await prompt(link);
	await prompt(r);
	check("symlinked root: reported once, under the canonical path", reportsFor(r).length === 1 && reportsFor(link).length === 0);
}
// the 24h window: a report older than a day does not suppress a new one
{
	const r = repo("stale-report");
	fs.appendFileSync(JOURNAL, `${JSON.stringify({ ts: new Date(Date.now() - 25 * 3_600_000).toISOString(), event: "directory_unadopted", cwd: r, has: {} })}\n`);
	await prompt(r);
	check("24h: a report 25h old → a new line", reportsFor(r).length === 2);
}
// a huge journal is read by its tail only
{
	const big = path.join(base, "big.jsonl");
	fs.writeFileSync(big, `${"x".repeat(1024)}\n`.repeat(2048));
	const lines = lib.tailLines(big);
	check("tail: a 2 MiB journal yields ≤ 256 KiB of whole lines", lines.join("\n").length <= lib.TAIL_BYTES && lines.every((l) => l.length === 1024));
	check("tail: absent journal → []", lib.tailLines(path.join(base, "absent.jsonl")).length === 0);
}
// an unwritable / absent journal location never throws out of the handler
{
	const r = repo("no-journal");
	cfg({ journal: { enabled: true, path: path.join(base, "missing-dir", "j.jsonl") } });
	check("journal unwritable: prompt still BASE, no throw", (await prompt(r)) === "BASE");
	cfg();
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
			check(`e: byte-identical to eca3de4 — ${path.relative(base, c)}`, a === b, JSON.stringify({ a, b }));
		}
	}
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
