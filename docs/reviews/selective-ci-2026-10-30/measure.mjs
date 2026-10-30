// Seat measurement for the selective-ci plan: what would the planned selector run on recent pull-request pushes?
// Run from the repo root with gh signed in:
//   node docs/reviews/selective-ci-2026-10-30/measure.mjs [--since 2026-10-24] [--limit 400] [--status failure] [--cache <dir>] [--record <windows suite record json>] [--wall <suite-step seconds>] [--rows]
// Knobs: RESOLVE=<n>|all (simulated hub resolutions), DOCRULE=edges|wide|file, BREAKDOWN=1, NODOCS=1.
// A prototype of the plan's rules, not the selector: the builder's selector replaces it.
// Records keep only run id, short sha, branch, mode and counts — no account fields.
// Every historical head is mapped with the CURRENT linker and the CURRENT launchAlwaysRun list (filtered to the head's modules).
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = process.cwd();
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const SINCE = arg("--since", "2026-10-24");
const LIMIT = Number(arg("--limit", "400"));
const CACHE = resolve(arg("--cache", join(tmpdir(), "selective-ci-measure")));
mkdirSync(CACHE, { recursive: true });
const cm = await import(pathToFileURL(resolve(root, "scripts/code-map.mjs")).href);
const { addLaunchLinks } = await import(pathToFileURL(resolve(root, "scripts/code-map-launch.mjs")).href);
const ALWAYS = JSON.parse(readFileSync(resolve(root, "code-map.config.json"), "utf8")).launchAlwaysRun.map((e) => e.path);

const gh = async (args) => (await run("gh", args, { maxBuffer: 1 << 28, cwd: root })).stdout;
const cached = async (key, fn) => { const f = join(CACHE, key); if (existsSync(f)) return readFileSync(f, "utf8"); const v = await fn(); writeFileSync(f, v); return v; };
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28 }).trim();
async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }
const LEG = (name) => /windows/i.test(name) ? "windows" : /macos/i.test(name) ? "macos" : /ubuntu|linux/i.test(name) ? "linux" : null;

// Per run: the tested merge's base and head (from any suite job's checkout log), and each suite leg's failed files.
async function runInfo(runId) {
	const jobs = JSON.parse(await cached(`jobs-${runId}.json`, () => gh(["run", "view", String(runId), "--json", "jobs", "--jq", "[.jobs[]|{id:.databaseId,name:.name,conclusion:.conclusion}]"])));
	let base = null, head = null; const failed = [];
	for (const job of jobs.filter((j) => /^suite/.test(j.name))) {
		if (base && job.conclusion !== "failure") continue;
		const log = await cached(`log-${job.id}.txt`, async () => {
			try { return (await gh(["api", `repos/{owner}/{repo}/actions/jobs/${job.id}/logs`])).split("\n").filter((l) => /Z failed: [a-z]|HEAD is now at [0-9a-f]+ Merge [0-9a-f]{40} into [0-9a-f]{40}/.test(l)).join("\n"); }
			catch { return ""; }
		});
		const merge = log.match(/Merge ([0-9a-f]{40}) into ([0-9a-f]{40})/);
		if (merge) { head = merge[1]; base = merge[2]; }
		if (job.conclusion === "failure") {
			const files = log.split("\n").filter((l) => /Z failed: [a-z]/.test(l)).slice(-1).flatMap((l) => l.split("Z failed: ")[1].split(/,\s*/)).map((f) => f.trim().replace(/\\/g, "/")).filter(Boolean);
			for (const f of new Set(files)) failed.push({ leg: LEG(job.name), file: f });
		}
	}
	return { base, head, failed };
}

const graphs = new Map();
function graphAt(head) {
	if (graphs.has(head)) return graphs.get(head);
	const dir = join(CACHE, `tree-${head.slice(0, 12)}`);
	if (!existsSync(dir)) { mkdirSync(dir); execFileSync("sh", ["-c", `git archive ${head} -- scripts apps packages templates/typescript/template/scripts code-map.config.json package.json | tar -x -C "${dir}"`], { cwd: root }); }
	const config = cm.loadConfig(dir), sources = cm.collectModules(dir, config);
	const graph = addLaunchLinks(cm.buildGraph(sources, config), sources);
	graph.launchAlwaysRun = ALWAYS.filter((p) => graph.modules.has(p));
	const tests = graph.order.filter((p) => cm.isLayerExempt(config, p) && /\.test\.(?:mjs|ts|js)$/.test(p));
	const text = new Map(tests.map((t) => [t, readFileSync(join(dir, t), "utf8")]));
	// Plan rule: computed dynamic imports make a test blind (always run).
	// The three tests FEAT-029 names; a hidden-load rule was dropped with impact selection (issue 274).
	const dynamic = ["packages/nana-pack/tests/config-display-text.test.mjs", "packages/nana-pack/tests/config-handlers-malformed.test.mjs", "packages/nana-pack/tests/hive-page.test.mjs"].filter((t) => tests.includes(t));
	// DOCRULE=edges: document leaf edges, approximated — a mapped module naming a tracked document's repo path
	// (folder included), or a root-level document's name while it also holds a repo-root anchor.
	const modText = new Map(graph.order.map((m) => [m, readFileSync(join(dir, m), "utf8")]));
	// RESOLVE=<n>|all simulates hand resolutions (not planned) for the n non-test hubs with the widest reach.
	const isTest = (p) => tests.includes(p);
	const kinds = ["unresolved", "other-program", "program-unknown"];
	const holders = [...new Set([...graph.launchAlwaysRun, ...[...graph.sitesByModule].filter(([, s]) => s.some((x) => kinds.includes(x.kind))).map(([p]) => p)])];
	const reach = (h) => [h, ...cm.impact(graph, [h]).callers].filter(isTest);
	const hubs = holders.filter((h) => !isTest(h)).sort((a, b) => reach(b).length - reach(a).length);
	const k = process.env.RESOLVE === "all" ? hubs.length : Number(process.env.RESOLVE ?? 0);
	const resolved = new Set(hubs.slice(0, k));
	const blind = new Set(holders.filter((h) => !resolved.has(h)).flatMap(reach));
	const v = { graph, tests, text, modText, blind: new Set([...blind, ...dynamic]), dynamic };
	graphs.clear(); // one tree in memory at a time
	graphs.set(head, v);
	return v;
}

// Plan rules, prototyped.
// Plan A3: a document is a path under docs/, a root-level Markdown file, or a README.md anywhere; other Markdown ships (rules, skills, prompts).
const isDocA3 = (f) => f.startsWith("docs/") || /^[^/]+\.md$/i.test(f) || /(?:^|\/)README\.md$/.test(f);
// Revision 3 (R-3186): exclusions first, then the patterns.
const EXCLUDED = (f) => /^templates\//.test(f) || /^apps\/bench\/studies\//.test(f) || /(?:^|\/)fixtures?\//.test(f) || ["docs/code-map.md", "docs/requirements-tree.md"].includes(f) || (f.startsWith("docs/") && !f.startsWith("docs/reviews/") && !f.endsWith(".md"));
const isDoc = (f) => process.env.DOCRULE === "r3" ? !EXCLUDED(f) && (f.startsWith("docs/reviews/") || /^docs\/.*\.md$/.test(f) || /^[^/]+\.md$/i.test(f) || /(?:^|\/)README\.md$/.test(f)) : isDocA3(f);
const FULL_RUN_PATHS = [/^scripts\/test(?:-locked)?\.mjs$/, /^packages\/nana-pack\/lib\/test-runner-config\.mjs$/, /^packages\/nana-pack\/lib\/windows-skips-config\.mjs$/, /^scripts\/code-map/, /^code-map\.config\.json$/, /^templates\/typescript\/template\/scripts\/code-map\.mjs$/, /^scripts\/ci-select/];
const REPO_WALKERS = ["apps/desk/test/knowledge-home-isolation.test.mjs", "packages/nana-pack/tests/identity-scan.test.mjs", "packages/nana-pack/tests/known-bugs.test.mjs", "packages/nana-pack/tests/land.test.mjs", "packages/nana-pack/tests/readme-check.test.mjs", "packages/nana-pack/tests/requirements-deliverables.test.mjs", "packages/nana-pack/tests/requirements-lift.test.mjs", "packages/nana-pack/tests/requirements-trace.test.mjs", "packages/nana-pack/tests/review-ledger.test.mjs", "packages/nana-pack/tests/runtime-map.test.mjs", "packages/nana-pack/tests/templates-render.test.mjs", "packages/nana-pack/tests/test-runner.test.mjs", "packages/nana-setup/tests/install.test.mjs", "packages/nana-setup/tests/project.test.mjs"];
// Revision 3 rule (DOCRULE=r3, R-3178 and R-3179), text-level like the builder's must be at least:
// a quoted literal equal to a changed document's path or any folder above it ("." excluded), a run of quoted
// segments spelling such a path, or the document's file name while the module holds a root anchor word;
// plus the tests reaching every non-test module that calls a listing primitive (R-3179's forced scan).
const LISTING = /\b(?:readdirSync|readdir|opendirSync|opendir|globSync|glob)\s*\(|["'](?:ls-files|ls-tree|grep|archive|--name-only)["']/;
const ANCHOR = /\b(?:REPO|ROOT|repoRoot|REPO_ROOT|rootDir|repo|root|pkgRoot|packageRoot|here)\b|import\.meta\.(?:url|dirname)/;
function r3Readers(G, docs) {
	const out = new Set();
	const add = (m) => { if (G.tests.includes(m)) out.add(m); for (const c of cm.impact(G.graph, [m]).callers) if (G.tests.includes(c)) out.add(c); };
	for (const [m, src] of G.modText) {
		if (process.env.R3PART !== "links" && !G.tests.includes(m) && LISTING.test(src)) { add(m); continue; }
		if (process.env.R3PART === "listers") continue;
		const hit = docs.some((d) => {
			const parts = d.split("/");
			for (let i = parts.length; i >= (process.env.R3TOP === "off" ? 2 : 1); i--) { const prefix = parts.slice(0, i).join("/"); for (const q of ['"', "'", "`"]) if (src.includes(`${q}${prefix}${q}`) || src.includes(`${q}${prefix}/`)) return true; }
			for (let i = 2; i <= parts.length; i++) if (src.includes(parts.slice(0, i).map((x) => `"${x}"`).join(", "))) return true;
			return process.env.R3NAME !== "off" && src.includes(`"${parts.at(-1)}"`) && ANCHOR.test(src);
		});
		if (hit) add(m);
	}
	return out;
}
function docChecks(G, docs) {
	if (process.env.DOCRULE === "r3") return r3Readers(G, docs);
	if (process.env.DOCRULE === "edges") {
		const out = new Set(REPO_WALKERS.filter((t) => G.text.has(t)));
		const anchor = /\b(?:REPO|ROOT|repoRoot|REPO_ROOT|rootDir|repo)\b|"\.\.", "\.\."/;
		for (const [m, src] of G.modText) {
			const hit = docs.some((d) => {
				const parts = d.split("/");
				for (let i = parts.length; i >= (process.env.R3TOP === "off" ? 2 : 1); i--) { const prefix = parts.slice(0, i).join("/"); if (prefix.includes("/") && (src.includes(`"${prefix}"`) || src.includes(`"${prefix}/`) || src.includes(`'${prefix}'`))) return true; }
				const joined = parts.map((x) => `"${x}"`).join(", ");
				if (parts.length > 1 && src.includes(joined.split(", ").slice(0, 2).join(", "))) return true;
				return parts.length === 1 ? src.includes(`"${d}"`) && anchor.test(src) : false;
			});
			if (!hit) continue;
			if (G.tests.includes(m)) out.add(m);
			for (const c of cm.impact(G.graph, [m]).callers) if (G.tests.includes(c)) out.add(c);
		}
		return out;
	}
	const names = new Set();
	// DOCRULE=wide (default): a test naming the document's file name or any folder name above it. DOCRULE=file: the file name, and the folder name only below docs/.
	for (const d of docs) { names.add(basename(d)); for (let p = dirname(d); p !== "." && p !== ""; p = dirname(p)) if (process.env.DOCRULE !== "file" || (p.startsWith("docs/") && !p.startsWith("docs/reviews"))) names.add(basename(p)); }
	const out = new Set(REPO_WALKERS.filter((t) => G.text.has(t)));
	for (const t of G.tests) { const src = G.text.get(t); if ([...names].some((n) => src.includes(n))) out.add(t); }
	return out;
}
function select(G, changed) {
	if (changed.some((f) => FULL_RUN_PATHS.some((re) => re.test(f)))) return { mode: "full", why: "selector or runner changed", files: new Set(G.tests) };
	const outside = changed.filter((f) => !isDoc(f) && !G.graph.modules.has(f));
	if (outside.length) return { mode: "full", why: `outside map: ${outside[0]}${outside.length > 1 ? ` (+${outside.length - 1})` : ""}`, files: new Set(G.tests) };
	const docs = changed.filter(isDoc), mods = changed.filter((f) => G.graph.modules.has(f));
	const files = docChecks(G, docs);
	if (!mods.length) return { mode: "docs", why: "documents only", files };
	if (process.env.NODOCS) files.clear();
	const nDocs = files.size;
	for (const t of G.blind) files.add(t);
	// Plan R-3179: repository readers list tracked files, so their tests run on every change.
	for (const t of REPO_WALKERS) if (G.text.has(t)) files.add(t);
	const imp = new Set();
	for (const m of mods) { if (G.tests.includes(m)) imp.add(m); for (const c of cm.impact(G.graph, [m]).callers) if (G.tests.includes(c)) imp.add(c); }
	for (const t of imp) files.add(t);
	if (process.env.BREAKDOWN) console.error(`breakdown docs ${nDocs} blind ${G.blind.size} impact ${imp.size} total ${files.size} mods ${mods.slice(0, 3).join(" ")}`);
	return { mode: "selective", why: "", files };
}

const recordPath = arg("--record", "");
const seconds = new Map();
if (recordPath) for (const f of JSON.parse(readFileSync(recordPath, "utf8")).files) seconds.set(f.path, f.seconds);
const WIN_WALL = Number(arg("--wall", "1369"));
const totalSec = [...seconds.values()].reduce((a, b) => a + b, 0);
const median = [...seconds.values()].sort((a, b) => a - b)[Math.floor(seconds.size / 2)] ?? 0;

const runs = JSON.parse(await gh(["run", "list", "--workflow", "ci", "--event", "pull_request", ...(arg("--status", "") ? ["--status", arg("--status", "")] : []), "--limit", String(LIMIT), "--json", "databaseId,headSha,createdAt,conclusion,headBranch"])).filter((r) => r.createdAt >= SINCE);
const infos = await pool(runs, 6, async (r) => ({ r, info: await runInfo(r.databaseId) }));
const rows = [];
for (const { r, info } of infos) {
	if (!info.base || !info.head) { rows.push({ r, mode: "unknown" }); continue; }
	let changed;
	try { changed = git(["diff", "--name-only", git(["merge-base", info.base, info.head]), info.head]).split("\n").filter(Boolean); } catch { rows.push({ r, mode: "unknown" }); continue; }
	const G = graphAt(info.head);
	const s = select(G, changed);
	const sec = [...s.files].reduce((a, f) => a + (seconds.get(f) ?? median), 0);
	const catches = info.failed.map((x) => ({ ...x, caught: s.files.has(x.file) || !G.graph.modules.has(x.file) && s.mode === "full" }));
	rows.push({ r, mode: s.mode, why: s.why, n: s.files.size, of: G.tests.length, sec, changed: changed.length, catches });
}
const known = rows.filter((x) => x.mode !== "unknown");
const by = (m) => known.filter((x) => x.mode === m);
const share = (xs) => xs.length ? (xs.reduce((a, x) => a + x.n / x.of, 0) / xs.length * 100).toFixed(1) : "—";
const wallMin = (x) => (totalSec ? x.sec / totalSec * WIN_WALL : 0) / 60;
const avgMin = (xs) => xs.length ? (xs.reduce((a, x) => a + wallMin(x), 0) / xs.length).toFixed(1) : "—";
console.log(`pull_request ci runs since ${SINCE}: ${runs.length}; base and head known: ${known.length}`);
for (const m of ["docs", "selective", "full"]) console.log(`${m.padEnd(10)} ${String(by(m).length).padStart(4)} pushes; mean share of test files ${share(by(m))}%; mean est. Windows suite-step minutes ${avgMin(by(m))}`);
const allSec = known.reduce((a, x) => a + wallMin(x), 0);
console.log(`all known pushes: mean share ${share(known)}%; est. Windows suite-step minutes ${allSec.toFixed(0)} of ${(known.length * WIN_WALL / 60).toFixed(0)} under the full suite (${(allSec / (known.length * WIN_WALL / 60) * 100).toFixed(0)}%)`);
const fullWhy = new Map();
for (const x of by("full")) { const k = x.why.replace(/^outside map: (\S+?)(?:\/[^ ]*)?(?: .*)?$/, (_, p) => `outside map: ${p.split("/").slice(0, 1)[0]}…`); fullWhy.set(k, (fullWhy.get(k) ?? 0) + 1); }
console.log(`full-run reasons: ${[...fullWhy].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join("; ")}`);
const pairs = known.flatMap((x) => x.catches);
console.log(`failing (run, leg, file) pairs in these runs: ${pairs.length}; caught by the selection: ${pairs.filter((p) => p.caught).length}; missed: ${pairs.filter((p) => !p.caught).length}`);
for (const m of ["docs", "selective", "full"]) { const ps = by(m).flatMap((x) => x.catches); console.log(`  ${m}: ${ps.length} failing pairs, ${ps.filter((p) => p.caught).length} caught`); }
// Documents-only scope (owner, issue 274): only documents-only pushes select; every other push runs the full suite.
{ const docsMin = by("docs").reduce((a, x) => a + wallMin(x), 0), fullMin = known.length * WIN_WALL / 60, scoped = fullMin - by("docs").length * WIN_WALL / 60 + docsMin;
  console.log(`documents-only scope: est. Windows suite-step minutes ${scoped.toFixed(0)} of ${fullMin.toFixed(0)} (${(scoped / fullMin * 100).toFixed(0)}%)`); }
for (const x of known) for (const p of x.catches) if (!p.caught) console.log(`  missed: ${x.r.databaseId} ${x.r.headSha.slice(0, 8)} ${x.r.headBranch} ${p.leg} ${p.file} (mode ${x.mode})`);
if (process.argv.includes("--rows")) for (const x of known) console.log([x.r.databaseId, x.r.headSha.slice(0, 8), x.r.headBranch, x.mode, `${x.n}/${x.of}`, wallMin(x).toFixed(1), x.why].join("\t"));
