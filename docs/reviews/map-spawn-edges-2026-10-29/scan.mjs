// Seat scan for the map-spawn-edges plan. Run from the repo root:
//   node docs/reviews/map-spawn-edges-2026-10-29/scan.mjs [runtime-map.json]
// Prints the counts the plan quotes. With no argument it reads the clone's runtime map
// (<git common dir>/nana/runtime-map.json). The builder re-runs it with the built linker by
// setting MAP_EDGES=built (uses scripts/code-map.mjs's checkRepo graph instead of the prototype).
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const cm = await import(pathToFileURL(resolve(root, "scripts/code-map.mjs")).href);
// Fixed old linker: using the built linker as both sides would hide every lost edge.
const oldSource = execFileSync("git", ["show", "57167e92:scripts/code-map-launch.mjs"], { cwd: root, encoding: "utf8" });
const { addLaunchLinks } = await import(`data:text/javascript;base64,${Buffer.from(oldSource).toString("base64")}`);
const proto = await import(new URL("./prototype-edges.mjs", import.meta.url).href);

const config = cm.loadConfig(root);
const sources = cm.collectModules(root, config);
const fresh = () => cm.buildGraph(sources, config);
const gImport = fresh();
const gLaunch = addLaunchLinks(fresh(), sources);
const { graph: gProto, sitesByModule } = process.env.MAP_EDGES === "built"
	? (() => { const graph = cm.checkRepo(root).graph; return { graph, sitesByModule: graph.sitesByModule }; })()
	: proto.addPrototypeEdges(fresh(), sources);

const isTest = (p) => cm.isLayerExempt(config, p) && /\.test\.(?:mjs|ts|js)$/.test(p);
const tests = gImport.order.filter(isTest);
const srcOf = new Map(sources.map((s) => [s.path, s.source]));
const launchRe = new RegExp(proto.LAUNCH_RE.source);
const launchingTests = tests.filter((t) => process.env.MAP_EDGES === "built" ? sitesByModule.has(t) : launchRe.test(srcOf.get(t)));
console.log(`tests: ${tests.length} mapped *.test.* files; ${launchingTests.length} hold a launch call (${proto.LAUNCH_CALLS.join(", ")})`);

const edgesOf = (g) => { const s = new Set(); for (const [p, m] of g.modules) for (const c of m.callees) s.add(`${p} -> ${c}`); return s; };
const imp = edgesOf(gImport), lau = edgesOf(gLaunch), pro = edgesOf(gProto);
const launchOnly = [...lau].filter((e) => !imp.has(e));
const lost = launchOnly.filter((e) => !pro.has(e));
const added = [...pro].filter((e) => !imp.has(e));
console.log(`edges: import ${imp.size}; today's launch links ${launchOnly.length}; new rules' non-import edges ${added.length}; today's launch links the new rules lose: ${lost.length}`);
for (const e of lost) console.log(`  lost: ${e}`);

// Runtime gap.
let dataFile = process.argv[2];
if (!dataFile) dataFile = resolve(root, execFileSync("git", ["rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim(), "nana/runtime-map.json");
if (existsSync(dataFile)) {
	const data = JSON.parse(readFileSync(dataFile, "utf8"));
	const closure = (g, s0) => { const s = new Set([s0]), q = [s0]; while (q.length) for (const c of g.modules.get(q.pop())?.callees ?? []) if (!s.has(c)) { s.add(c); q.push(c); } return s; };
	console.log(`runtime map: tip ${String(data.tip).slice(0, 8)}, ${Object.keys(data.tests).length} measured files`);
	for (const [name, g] of [["import", gImport], ["today's launch links", gLaunch], ["new rules", gProto]]) {
		let gapTests = 0, entryPairs = 0; const entries = new Map();
		for (const [t, rec] of Object.entries(data.tests)) {
			if (!g.modules.has(t)) continue;
			const c = closure(g, t);
			const miss = (rec.ran ?? []).filter((p) => g.modules.has(p) && !c.has(p));
			if (!miss.length) continue;
			gapTests++;
			const roots = miss.filter((m) => !miss.some((o) => o !== m && closure(gImport, o).has(m)));
			entryPairs += roots.length;
			for (const r of roots) entries.set(r, (entries.get(r) ?? 0) + 1);
		}
		console.log(`  ${name}: ${gapTests} measured files ran a mapped module the graph does not reach; ${entryPairs} entry points, ${entries.size} distinct`);
		if (name === "new rules") for (const [r, n] of [...entries].sort((a, b) => b[1] - a[1])) console.log(`    ${n} ${r}`);
	}
}

// Launch sites by kind, and tests that reach a module holding an unresolved or other-program site.
if (sitesByModule.size) {
	const byKind = new Map(); const holders = new Map();
	for (const [m, sites] of sitesByModule) for (const s of sites) {
		byKind.set(s.kind, (byKind.get(s.kind) ?? 0) + 1);
		if (s.kind === "unresolved" || s.kind === "other-program" || s.kind === "program-unknown") holders.set(m, [...(holders.get(m) ?? []), s.kind]);
	}
	console.log(`launch sites: ${[...byKind].map(([k, n]) => `${k} ${n}`).join(", ")}`);
	const blind = tests.filter((t) => { const c = new Set([t]), q = [t]; while (q.length) for (const x of gProto.modules.get(q.pop())?.callees ?? []) if (!c.has(x)) { c.add(x); q.push(x); } return [...holders.keys()].some((m) => c.has(m)); });
	console.log(`always-run blind reach: ${blind.length} of ${tests.length} (${(100 * blind.length / tests.length).toFixed(1)}%); ${holders.size} holding modules`);
	for (const kind of ["unresolved", "other-program", "program-unknown"]) {
		const ms = [...holders].filter(([, ks]) => ks.includes(kind)).map(([m]) => m);
		const reach = tests.filter((t) => { const c = new Set([t]), q = [t]; while (q.length) for (const x of gProto.modules.get(q.pop())?.callees ?? []) if (!c.has(x)) { c.add(x); q.push(x); } return ms.some((m) => c.has(m)); });
		console.log(`  ${kind}: ${ms.length} modules hold one (${ms.filter(isTest).length} tests, ${ms.filter((m) => !isTest(m)).length} non-test); ${reach.length} of ${tests.length} tests hold or reach one`);
	}
}

// map:search neighbours: the modules that gain the most callees.
const gain = gProto.order.map((p) => [p, gProto.modules.get(p).callees.length - gImport.modules.get(p).callees.length]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
console.log(`callee growth (map:search neighbours): ${gain.length} modules gain callees; top ${gain.slice(0, 6).map(([p, n]) => `${posix.basename(p)} +${n}`).join(", ")}`);
