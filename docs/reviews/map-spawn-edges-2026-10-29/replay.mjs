// Seat replay for the map-spawn-edges plan: would impact selection have picked each failing test file?
// Run from the repo root with gh signed in:
//   node docs/reviews/map-spawn-edges-2026-10-29/replay.mjs [--limit 200] [--since <ISO date>] [--cache <dir>] [--rows]
// Records keep only run id, short sha, branch, leg and file — no account fields (plan NOTE 14).
// MAP_EDGES=built applies the current built linker to each historical tree's sources.
// The old-linker baseline stays pinned at 57167e92, not the current implementation.
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = process.cwd();
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const LIMIT = Number(arg("--limit", "200"));
const CACHE = resolve(arg("--cache", join(tmpdir(), "map-spawn-edges-replay")));
mkdirSync(CACHE, { recursive: true });
const cm = await import(pathToFileURL(resolve(root, "scripts/code-map.mjs")).href);
const { addLaunchLinks: builtLinks } = await import(pathToFileURL(resolve(root, "scripts/code-map-launch.mjs")).href);
const oldSource = execFileSync("git", ["show", "57167e92:scripts/code-map-launch.mjs"], { cwd: root, encoding: "utf8" });
const { addLaunchLinks } = await import(`data:text/javascript;base64,${Buffer.from(oldSource).toString("base64")}`);
const proto = await import(new URL("./prototype-edges.mjs", import.meta.url).href);

const gh = async (args) => (await run("gh", args, { maxBuffer: 1 << 28, cwd: root })).stdout;
const cached = async (key, fn) => { const f = join(CACHE, key); if (existsSync(f)) return readFileSync(f, "utf8"); const v = await fn(); writeFileSync(f, v); return v; };
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }

const LEG = (name) => /windows/i.test(name) ? "windows" : /macos/i.test(name) ? "macos" : /ubuntu|linux/i.test(name) ? "linux" : null;
/** Per failed suite job: leg, failed files, and the tested merge's base and head. */
async function failuresOf(runId) {
	const jobs = JSON.parse(await cached(`jobs-${runId}.json`, () => gh(["run", "view", String(runId), "--json", "jobs", "--jq", "[.jobs[]|{id:.databaseId,name:.name,conclusion:.conclusion}]"])));
	const out = [];
	for (const job of jobs) {
		if (!/^suite/.test(job.name) || job.conclusion !== "failure") continue;
		const log = await cached(`log-${job.id}.txt`, async () => {
			try { return (await gh(["api", `repos/{owner}/{repo}/actions/jobs/${job.id}/logs`])).split("\n").filter((l) => /Z failed: [a-z]|HEAD is now at [0-9a-f]+ Merge [0-9a-f]{40} into [0-9a-f]{40}/.test(l)).join("\n"); }
			catch { return ""; }
		});
		// The suite runner prints its summary last; child runners under test print their own earlier.
		const files = log.split("\n").filter((l) => /Z failed: [a-z]/.test(l)).slice(-1).flatMap((l) => l.split("Z failed: ")[1].split(/,\s*/)).map((f) => f.trim().replace(/\\/g, "/")).filter(Boolean);
		const merge = log.match(/Merge ([0-9a-f]{40}) into ([0-9a-f]{40})/);
		out.push({ leg: LEG(job.name), files: [...new Set(files)], head: merge?.[1] ?? null, base: merge?.[2] ?? null });
	}
	return out;
}

const runs = JSON.parse(await gh(["run", "list", "--workflow", "ci", "--status", "failure", "--limit", String(LIMIT), "--json", "databaseId,headSha,event,createdAt,headBranch"]));
const SINCE = arg("--since", "");
const prRuns = runs.filter((r) => r.event === "pull_request" && r.createdAt >= SINCE);
console.log(`failed ci runs listed: ${runs.length} (${runs.at(-1)?.createdAt.slice(0, 10)} to ${runs[0]?.createdAt.slice(0, 10)}); replayed pull_request runs${SINCE ? ` since ${SINCE}` : ""}: ${prRuns.length}`);

const failed = await pool(prRuns, 6, async (r) => ({ r, jobs: await failuresOf(r.databaseId) }));
const baseFails = new Map();
async function baseFailures(base) {
	if (baseFails.has(base)) return baseFails.get(base);
	const list = JSON.parse(await cached(`base-${base}.json`, () => gh(["run", "list", "--workflow", "ci", "--commit", base, "--json", "databaseId,conclusion"])));
	const legs = new Map();
	for (const b of list.filter((x) => x.conclusion === "failure")) for (const j of await failuresOf(b.databaseId)) for (const f of j.files) legs.set(`${j.leg} ${f}`, true);
	const v = { known: list.length > 0, legs };
	baseFails.set(base, v);
	return v;
}

const graphs = new Map();
function graphsAt(head) {
	if (graphs.has(head)) return graphs.get(head);
	const dir = join(CACHE, `tree-${head.slice(0, 12)}`);
	if (!existsSync(dir)) { mkdirSync(dir); execFileSync("sh", ["-c", `git archive ${head} -- scripts apps packages templates/typescript/template/scripts code-map.config.json package.json | tar -x -C "${dir}"`], { cwd: root }); }
	const config = cm.loadConfig(dir), sources = cm.collectModules(dir, config);
	const fresh = () => cm.buildGraph(sources, config);
	const { graph: gNew, sitesByModule } = process.env.MAP_EDGES === "built"
		? (() => { const graph = builtLinks(fresh(), sources); return { graph, sitesByModule: graph.sitesByModule }; })()
		: proto.addPrototypeEdges(fresh(), sources);
	const v = { config, gImport: fresh(), gLaunch: addLaunchLinks(fresh(), sources), gNew, sitesByModule };
	graphs.set(head, v);
	return v;
}
const closure = (g, s0) => { const s = new Set([s0]), q = [s0]; while (q.length) for (const c of g.modules.get(q.pop())?.callees ?? []) if (!s.has(c)) { s.add(c); q.push(c); } return s; };

const rows = [];
for (const { r, jobs } of failed) {
	for (const job of jobs) {
		for (const file of job.files) {
			const row = { run: r.databaseId, sha: r.headSha.slice(0, 8), branch: r.headBranch, leg: job.leg, file, cls: "" };
			rows.push(row);
			if (!job.base || !job.head) { row.cls = "unknown-base"; continue; }
			let changed;
			try { changed = git(["diff", "--name-only", git(["merge-base", job.base, job.head]), job.head]).split("\n").filter(Boolean); } catch { row.cls = "unknown-base"; continue; }
			const base = await baseFailures(job.base);
			if (base.legs.has(`${job.leg} ${file}`)) { row.cls = "red-on-base"; continue; }
			if (changed.includes(file)) { row.cls = "changed-test"; continue; }
			const G = graphsAt(job.head);
			if (!G.gImport.modules.has(file)) { row.cls = "not-mapped"; continue; }
			const mods = changed.filter((c) => G.gImport.modules.has(c));
			const hit = (g) => { const c = closure(g, file); return mods.some((m) => c.has(m)); };
			if (hit(G.gImport)) row.cls = "import";
			else if (hit(G.gLaunch)) row.cls = "today-launch";
			else if (hit(G.gNew)) row.cls = "new-edge";
			else {
				const c = closure(G.gNew, file);
				const blind = [...G.sitesByModule].some(([m, sites]) => c.has(m) && sites.some((s) => ["unresolved", "other-program", "program-unknown", "wrapper-passthrough"].includes(s.kind)));
				const outside = changed.some((x) => !G.gImport.modules.has(x) && !/^docs\/|\.md$/.test(x));
				row.cls = blind ? "always-run" : outside ? "outside-map" : "unreached";
			}
		}
	}
}
const legs = ["macos", "linux", "windows"];
const count = (pred) => legs.map((l) => rows.filter((x) => x.leg === l && pred(x)).length);
const line = (name, pred) => { const c = count(pred); console.log(`${name.padEnd(34)} ${String(c.reduce((a, b) => a + b, 0)).padStart(4)}  macos ${c[0]}  linux ${c[1]}  windows ${c[2]}`); };
const windowsOnly = rows.filter((x) => x.leg === "windows" && !rows.some((y) => y.run === x.run && y.file === x.file && y.leg !== "windows")).length;
console.log(`pairs (run, leg, failing file): ${rows.length}; windows-only (run, file) ${windowsOnly}`);
line("selected: changed test", (x) => x.cls === "changed-test");
line("selected: import edges", (x) => x.cls === "import");
line("selected: + today's launch links", (x) => x.cls === "today-launch");
line("selected: + new rules' edges", (x) => x.cls === "new-edge");
line("selected: always-run (blind reach)", (x) => x.cls === "always-run");
line("missed: changed file outside map", (x) => x.cls === "outside-map");
line("missed: nothing reached", (x) => x.cls === "unreached");
line("excluded: red on base, same leg", (x) => x.cls === "red-on-base");
line("excluded: base unknown", (x) => x.cls === "unknown-base");
line("excluded: file not mapped", (x) => x.cls === "not-mapped");
if (process.argv.includes("--rows")) for (const x of rows) console.log([x.run, x.sha, x.branch, x.leg, x.file, x.cls].join("\t"));
