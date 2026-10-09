/**
 * @module packages/nana-knowledge/tests/discovery.test.mjs
 * @purpose Pins knowledge roots BY CONVENTION — a repository under a configured parent is indexed with no edit to sources.json, and the things that are not knowledge stay out
 * @inputs the discovery path in lib/ plus the build CLI, and temp parent directories holding fake repositories and worktrees
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp directories and markdown fixtures), process (spawns the build CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: roots BY CONVENTION. A repo under a configured parent is indexed without anyone
// editing sources.json — and the things that are not knowledge (a non-repo, an excluded
// name, a repo without the subdir) stay out.
// Run: node packages/nana-knowledge/tests/discovery.test.mjs
import { tmpDir } from "./tmp-dir.mjs";
import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const td = tmpDir(path.join(os.tmpdir(), "nk-discover-"));
const parent = path.join(td, "parent");
const mk = (...p) => { fs.mkdirSync(path.join(parent, ...p), { recursive: true }); return path.join(parent, ...p); };
const md = (p, body) => fs.writeFileSync(p, body);

// repoA: a real repo (.git DIRECTORY) with two of the three convention subdirs
mk("repoA", ".git");
md(path.join(mk("repoA", "docs"), "keep.md"), "# Keep\nalpha bravo charlie\n");
md(path.join(mk("repoA", "docs", "reviews"), "skip.md"), "# Review\nreviewer prose delta\n");
md(path.join(mk("repoA", "docs", "drafts"), "draft.md"), "# Draft\nechoecho foxtrot\n");
md(path.join(mk("repoA", "research"), "note.md"), "# Note\ngolf hotel india\n");
// repoB: NOT a repo (no .git) but has docs/
md(path.join(mk("repoB", "docs"), "x.md"), "# X\n");
// repoC: a git WORKTREE — .git is a FILE, not a directory
mk("repoC");
fs.writeFileSync(path.join(parent, "repoC", ".git"), "gitdir: /elsewhere/.git/worktrees/repoC\n");
md(path.join(mk("repoC", "knowledge"), "c.md"), "# C\njuliet kilo\n");
// repoD: a repo with none of the convention subdirs
mk("repoD", ".git"); mk("repoD", "src");
// an EXCLUDED name that is otherwise a perfect repo
mk("node_modules", ".git");
md(path.join(mk("node_modules", "docs"), "vendored.md"), "# Vendored\n");
// a plain file sitting in the parent
fs.writeFileSync(path.join(parent, "loose.txt"), "not a repo\n");

// A SECOND parent, for the nesting cases only (keeps the counts above independent).
const parent2 = path.join(td, "parent2");
const mk2 = (...p) => { fs.mkdirSync(path.join(parent2, ...p), { recursive: true }); return path.join(parent2, ...p); };
mk2("repoE", ".git");
md(path.join(mk2("repoE", "research"), "top.md"), "# Top\nmike november\n");
md(path.join(mk2("repoE", "research", "knowledge"), "deep.md"), "# Deep\noscar papa\n");
mk2("repoF", ".git");
md(path.join(mk2("repoF", "docs"), "x.md"), "# X\nquebec romeo\n");
mk2("repoF", "docs", "nested", ".git");
md(path.join(mk2("repoF", "docs", "nested", "docs"), "y.md"), "# Y\nsierra tango\n");
const DISCOVER2 = { parents: [parent2], subdirs: ["docs", "research", "knowledge"], exclude: [] };

const DISCOVER = {
	parents: [parent, path.join(td, "no-such-parent")],
	subdirs: ["docs", "research", "knowledge"],
	exclude: ["node_modules", "raw", "reviews", "drafts"],
};

const homeFor = (name) => {
	const h = path.join(td, "home-" + name);
	fs.mkdirSync(h, { recursive: true });
	process.env.NANA_KNOWLEDGE_HOME = h;
	return h;
};
const writeSources = (h, obj) => fs.writeFileSync(path.join(h, "sources.json"), JSON.stringify(obj, null, 2));

const { loadSources, loadRoots, discoverRoots, skipNames, SKIP_DIRS, DEFAULT_DISCOVER } =
	await import(new URL("../lib/sources.ts", import.meta.url).href);
const { build } = await import(new URL("../lib/build.ts", import.meta.url).href);
const { openDb } = await import(new URL("../lib/db.ts", import.meta.url).href);
const { search } = await import(new URL("../lib/query.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const has = (roots, p) => roots.some((r) => r.path === p);

// --- discoverRoots, on its own ---
const d = discoverRoots(DISCOVER);
const paths_ = d.map((r) => r.path);
check("repo with .git DIR contributes each convention subdir it has",
	has(d, path.join(parent, "repoA", "docs")) && has(d, path.join(parent, "repoA", "research")));
check("a git WORKTREE (.git file) counts as a repo", has(d, path.join(parent, "repoC", "knowledge")));
check("a directory WITHOUT .git is not a repo", !has(d, path.join(parent, "repoB", "docs")));
check("a repo without any listed subdir contributes nothing",
	!paths_.some((p) => p.startsWith(path.join(parent, "repoD"))));
// req: R-213
check("an excluded child NAME is skipped even when it is a repo",
	!paths_.some((p) => p.includes("node_modules")));
check("a missing parent is skipped silently", d.length === 3); // repoA docs+research, repoC knowledge
check("discovered roots are articles, and marked", d.every((r) => r.kind === "articles" && r.discovered === true));

// --- sources.json integration ---
const h1 = homeFor("union");
const ledger = path.join(td, "led.md");
md(ledger, "- [uses:1] (ops) lima mike. src: `r`\n");
writeSources(h1, {
	roots: [
		{ path: ledger, kind: "ledger" },
		// the SAME path discovery will produce, but configured as an explicit root
		{ path: path.join(parent, "repoA", "docs"), kind: "articles" },
	],
	discover: DISCOVER,
});
const s1 = loadSources();
// req: R-212
check("explicit + discovered are unioned", s1.roots.length === 4 && has(s1.roots, ledger));
// req: R-212
check("a path in both appears once, keeping the explicit entry",
	s1.roots.filter((r) => r.path === path.join(parent, "repoA", "docs")).length === 1 &&
	s1.roots.find((r) => r.path === path.join(parent, "repoA", "docs")).discovered === undefined);
check("exclude is handed to the builder", s1.exclude.includes("drafts"));
// req: R-213
check("skipNames extends the built-in set, never replaces it",
	skipNames(["drafts"]).has("drafts") && [...SKIP_DIRS].every((n) => skipNames(["drafts"]).has(n)));

const h2 = homeFor("nodiscover");
writeSources(h2, { roots: [{ path: path.join(parent, "repoB", "docs"), kind: "articles" }] });
const s2 = loadSources();
check("no discover block = no discovery", s2.roots.length === 1 && s2.exclude.length === 0);
check("an existing sources.json is NOT rewritten with a discover block",
	!("discover" in JSON.parse(fs.readFileSync(path.join(h2, "sources.json"), "utf8"))));

const h3 = homeFor("malformed");
writeSources(h3, { roots: [], discover: { parents: parent, subdirs: 7 } });
check("a malformed discover block degrades to defaults, never throws",
	Array.isArray(loadRoots()) && loadRoots().length === 0);

const h4 = homeFor("seed");
loadRoots(); // no sources.json yet -> seed
const seeded = JSON.parse(fs.readFileSync(path.join(h4, "sources.json"), "utf8"));
check("a freshly seeded sources.json carries the discover block",
	JSON.stringify(seeded.discover) === JSON.stringify(DEFAULT_DISCOVER));
check("seeding does not invent roots outside the literal list + wikis",
	Array.isArray(seeded.roots) && seeded.roots.every((r) => r.kind === "articles" || r.kind === "ledger"));

// --- roots must not NEST (docs.key is the file path: two roots over one file = UNIQUE failure) ---
const hN1 = homeFor("nest-explicit-inside");
writeSources(hN1, { roots: [
	{ path: path.join(parent2, "repoE", "research", "knowledge"), kind: "articles" },
	// shares a prefix with repoF/docs but is NOT an ancestor of it
	{ path: path.join(parent2, "repoF", "doc"), kind: "articles" },
], discover: DISCOVER2 });
const n1 = loadSources().roots;
// req: R-214
check("a discovered root CONTAINING an explicit root is dropped (explicit wins)",
	has(n1, path.join(parent2, "repoE", "research", "knowledge")) && !has(n1, path.join(parent2, "repoE", "research")));
check("an unrelated discovered root is untouched by that drop", has(n1, path.join(parent2, "repoF", "docs")));

const hN2 = homeFor("nest-discovered-inside");
writeSources(hN2, { roots: [{ path: path.join(parent2, "repoE"), kind: "articles" }], discover: DISCOVER2 });
const n2 = loadSources().roots;
// req: R-214
check("a discovered root INSIDE an explicit root is dropped too",
	has(n2, path.join(parent2, "repoE")) && !has(n2, path.join(parent2, "repoE", "research")));

const hN3 = homeFor("nest-discovered-pair");
writeSources(hN3, { roots: [], discover: { ...DISCOVER2, parents: [parent2, path.join(parent2, "repoF", "docs")] } });
const n3 = loadSources().roots;
// req: R-214
check("between two discovered roots the ANCESTOR is kept and the descendant dropped",
	has(n3, path.join(parent2, "repoF", "docs")) && !has(n3, path.join(parent2, "repoF", "docs", "nested", "docs")));
// req: R-214
check("a shared PREFIX is not containment (…/repoF/doc does not swallow …/repoF/docs)",
	has(n1, path.join(parent2, "repoF", "docs")));

const hN4 = homeFor("nest-build");
writeSources(hN4, { roots: [{ path: path.join(parent2, "repoE", "research", "knowledge"), kind: "articles" }], discover: DISCOVER2 });
let nestStats = null, nestErr = null;
try { nestStats = await build(); } catch (e) { nestErr = e; }
check("a REAL build with an explicit root nested in a discovered one does not throw",
	nestErr === null && nestStats !== null);
if (nestErr) console.log("     build threw:", nestErr.message);
// req: R-214
check("each file is indexed exactly once", nestStats && nestStats.files === 3 && nestStats.rows === 3);
const dbN = await openDb(path.join(hN4, "index.db"), {});
check("the explicit (nested) root is the one that survives", search(dbN, "oscar papa", 5).length === 1);
check("the dropped ancestor's other files are NOT indexed (explicit scope wins, as before discovery)",
	search(dbN, "mike november", 5).length === 0);
dbN.close();

// --- the build actually indexes a discovered root, and honours exclude while walking ---
const h5 = homeFor("build");
writeSources(h5, { roots: [], discover: DISCOVER });
const stats = await build();
check("a discovered root is indexed", stats.files === 3 && stats.rows === 3);
const db = await openDb(path.join(h5, "index.db"), {});
check("its article is searchable", search(db, "alpha bravo", 5).length === 1);
// req: R-202
check("a default-excluded dir under a discovered root is not walked (reviews/)",
	search(db, "reviewer prose", 5).length === 0);
// req: R-213
check("a CONFIGURED exclude name is skipped the same way (drafts/)",
	search(db, "echoecho", 5).length === 0);
db.close();

// --- status marks them ---
const status = cp.spawnSync(process.execPath, [new URL("../bin/nana-knowledge.ts", import.meta.url).pathname, "status"],
	{ encoding: "utf8", env: { ...process.env, NANA_KNOWLEDGE_HOME: h5 } });
// req: R-216
check("status exits 0", status.status === 0);
// req: R-216
check("status marks discovered roots", (status.stdout.match(/\(discovered\)/g) ?? []).length === 3);

// D6: automatic hook excludes monthly archives in SQL before TOP_K, while explicit query retains them.
const archiveRoot = path.join(td, "archive-root");
fs.mkdirSync(path.join(archiveRoot, "sessions"), { recursive: true });
fs.mkdirSync(path.join(archiveRoot, "docs", "sessions"), { recursive: true });
md(path.join(archiveRoot, "sessions", "2026-09.md"), "# Archive One\n" + "quantum archive signal ".repeat(40));
md(path.join(archiveRoot, "sessions", "2026-08.md"), "# Archive Two\n" + "quantum archive signal ".repeat(30));
md(path.join(archiveRoot, "sessions", "2026-07.md"), "# Archive Three\n" + "quantum archive signal ".repeat(20));
md(path.join(archiveRoot, "article.md"), "# Live Article\nquantum archive signal current content\n");
md(path.join(archiveRoot, "docs", "sessions", "README.md"), "# Session Readme\nboundary readme token\n");
md(path.join(archiveRoot, "docs", "2026-09.md"), "# Month Note\nboundary month token\n");
md(path.join(archiveRoot, "sessions", "2026-09-notes.md"), "# Session Notes\nboundary notes token\n");
const archiveHome = homeFor("archives");
writeSources(archiveHome, { roots: [{ path: archiveRoot, kind: "articles" }] });
await build();
const archiveDb = await openDb(path.join(archiveHome, "index.db"), {});
const { runHook } = await import(new URL("../lib/hook.ts", import.meta.url).href);
const queryCli = cp.spawnSync(process.execPath, [new URL("../bin/nana-knowledge.ts", import.meta.url).pathname, "query", "quantum archive signal"], {
	encoding: "utf8", env: { ...process.env, NANA_KNOWLEDGE_HOME: archiveHome },
});
// req: R-239
check("query CLI still returns monthly session archives", queryCli.status === 0 && queryCli.stdout.includes("/sessions/2026-09.md"));
const automatic = await runHook(JSON.stringify({ prompt: "quantum archive signal", session_id: "archive-session", cwd: td }), { spawnFn: () => {} });
// req: R-239
check("hook filters archives before top-three ranking and prints the non-archive article", automatic.reason === "ok" && automatic.hits.some((h) => h.path.endsWith("/article.md")) && automatic.hits.every((h) => !/[/\\\\]sessions[/\\\\][0-9]{4}-[0-9]{2}\\.md$/.test(h.path)));
const nonArchiveMatches = search(archiveDb, "boundary token", 20, { excludeMonthlySessionArchives: true });
// req: R-239
check("README, date outside sessions, and non-monthly session notes are retained", ["README.md", "2026-09.md", "2026-09-notes.md"].every((name) => nonArchiveMatches.some((h) => h.path.endsWith(name))));
archiveDb.prepare("INSERT INTO docs (key,path,root,kind,loc,title,body) VALUES (?,?,?,?,?,?,?)").run("backslash-archive", "C:\\repo\\sessions\\2026-09.md", archiveRoot, "articles", null, "Backslash archive", "quantum archive signal");
// req: R-239
check("backslash-separated monthly archive path is excluded", !search(archiveDb, "quantum archive signal", 20, { excludeMonthlySessionArchives: true }).some((h) => h.key === "backslash-archive"));
archiveDb.close();

// Fresh default seed: nested historical literals must not shadow discovered repo roots.
const fakeHome = path.join(td, "fake-home");
const seedHome = path.join(td, "fresh-seed");
for (const rel of ["the-hive/.git", "the-hive/docs/research", "the-hive/docs/experiments", "nana-agent-loop/.git", "nana-agent-loop/research/knowledge"]) {
	fs.mkdirSync(path.join(fakeHome, rel), { recursive: true });
}
md(path.join(fakeHome, "the-hive/docs/research/a.md"), "# Research\nneedle baseline hive\n");
md(path.join(fakeHome, "the-hive/docs/experiments/b.md"), "# Experiment\nneedle blue hive\n");
md(path.join(fakeHome, "nana-agent-loop/research/knowledge/k.md"), "# Knowledge\nneedle green loop\n");
md(path.join(fakeHome, "nana-agent-loop/research/IDEAS.md"), "# Ideas\nneedle red loop\n");
fs.mkdirSync(seedHome, { recursive: true });
process.env.HOME = fakeHome;
process.env.USERPROFILE = fakeHome;
process.env.NANA_KNOWLEDGE_HOME = seedHome;
const fresh = loadSources();
const hiveDocs = path.join(fakeHome, "the-hive/docs");
const loopResearch = path.join(fakeHome, "nana-agent-loop/research");
// req: R-240
check("fresh seed discovers both roots without explicit nested roots", fresh.roots.some((r) => r.path === hiveDocs && r.discovered) && fresh.roots.some((r) => r.path === loopResearch && r.discovered) && !fresh.roots.some((r) => r.path.startsWith(hiveDocs + path.sep) || r.path.startsWith(loopResearch + path.sep)));
const seededStats = await build();
const seededDb = await openDb(path.join(seedHome, "index.db"), {});
// req: R-240
check("fresh-seeded discovered files are searchable and indexed once", seededStats.files === 4 && search(seededDb, "needle blue hive", 10).some((h) => h.path.endsWith("/experiments/b.md")) && search(seededDb, "needle red loop", 10).some((h) => h.path.endsWith("/IDEAS.md")) && seededDb.prepare("SELECT COUNT(*) AS n FROM docs").get().n === 4);
seededDb.close();

fs.rmSync(td, { recursive: true, force: true });
process.exit(fails);
