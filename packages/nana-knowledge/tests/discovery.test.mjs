// Gate: roots BY CONVENTION. A repo under a configured parent is indexed without anyone
// editing sources.json — and the things that are not knowledge (a non-repo, an excluded
// name, a repo without the subdir) stay out.
// Run: node packages/nana-knowledge/tests/discovery.test.mjs
import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const td = fs.mkdtempSync(path.join(os.tmpdir(), "nk-discover-"));
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
check("explicit + discovered are unioned", s1.roots.length === 4 && has(s1.roots, ledger));
check("a path in both appears once, keeping the explicit entry",
	s1.roots.filter((r) => r.path === path.join(parent, "repoA", "docs")).length === 1 &&
	s1.roots.find((r) => r.path === path.join(parent, "repoA", "docs")).discovered === undefined);
check("exclude is handed to the builder", s1.exclude.includes("drafts"));
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

// --- the build actually indexes a discovered root, and honours exclude while walking ---
const h5 = homeFor("build");
writeSources(h5, { roots: [], discover: DISCOVER });
const stats = await build();
check("a discovered root is indexed", stats.files === 3 && stats.rows === 3);
const db = await openDb(path.join(h5, "index.db"), {});
check("its article is searchable", search(db, "alpha bravo", 5).length === 1);
check("a default-excluded dir under a discovered root is not walked (reviews/)",
	search(db, "reviewer prose", 5).length === 0);
check("a CONFIGURED exclude name is skipped the same way (drafts/)",
	search(db, "echoecho", 5).length === 0);
db.close();

// --- status marks them ---
const status = cp.spawnSync(process.execPath, [new URL("../bin/nana-knowledge.ts", import.meta.url).pathname, "status"],
	{ encoding: "utf8", env: { ...process.env, NANA_KNOWLEDGE_HOME: h5 } });
check("status exits 0", status.status === 0);
check("status marks discovered roots", (status.stdout.match(/\(discovered\)/g) ?? []).length === 3);

fs.rmSync(td, { recursive: true, force: true });
process.exit(fails);
