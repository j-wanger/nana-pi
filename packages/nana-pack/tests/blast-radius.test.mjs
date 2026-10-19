/**
 * @module packages/nana-pack/tests/blast-radius.test.mjs
 * @purpose Pin the blast-radius page's node set, column placement, edges, changed-set detection, unmapped list, no-linked-test label and determinism against a built git fixture.
 * @inputs scripts/blast-radius.mjs and a fixture git repository built under the OS temp directory.
 * @outputs PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
 * @effects disk (creates a scratch git repository under the OS temp directory; never touches the repository this test runs in), process (spawns node and git as children)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { main } from "../../../scripts/blast-radius.mjs";
import {
	COLUMN_IDS,
	DATA_COLUMN_ATTR,
	DATA_FROM_ATTR,
	DATA_NO_LINKED_TEST_ATTR,
	DATA_PATH_ATTR,
	DATA_TO_ATTR,
	DATA_UNMAPPED_ATTR,
	NO_LINKED_TEST_LABEL,
} from "../lib/blast-radius-config.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };

const CLI = fileURLToPath(new URL("../../../scripts/blast-radius.mjs", import.meta.url));

// ---------------------------------------------------------------- the fixture

const P = {
	a: "src/a.mjs",
	b: "src/b.mjs",
	c: "src/c.mjs",
	newFile: "src/new.mjs",
	spawned: "src/spawned.mjs",
	m: "src/m.mjs",
	n2: "src/n2.mjs",
	u: "src/u.mjs",
	top: "src/top.mjs",
	gen: "src/gen.mjs",
	d: "src/d.mjs",
	d2: "src/d2.mjs",
	far: "src/far.mjs",
	lonely: "src/lonely.mjs",
	vendorV: "src/vendor/v.mjs",
	gone: "src/gone.mjs",
	aTest: "tests/a.test.mjs",
	helper: "tests/helper.mjs",
	hTest: "tests/h.test.mjs",
	spTest: "tests/sp.test.mjs",
	d2Test: "tests/d2.test.mjs",
	toolsX: "tools/x.mjs",
	readme: "README.md",
	docsP: "docs/p.html",
};

const CONFIG = JSON.stringify({
	roots: ["src", "tests"],
	testRoots: ["tests"],
	ignore: ["src/vendor"],
	moduleExtensions: [".mjs"],
	mapPath: "docs/code-map.md",
	packages: [{ id: "fixture", prefix: "" }],
	layers: [{ id: "all", title: "All", blurb: "Fixture modules.", match: "^(src/|tests/)" }],
});

function cleanEnv() {
	const env = { ...process.env };
	for (const key of Object.keys(env)) if (/^GIT_/.test(key)) delete env[key];
	return env;
}
const env = cleanEnv();

function write(root, path, content) {
	const full = join(root, path);
	mkdirSync(dirname(full), { recursive: true });
	writeFileSync(full, content);
}

function gitAt(root) {
	return (...args) =>
		spawnSync(
			"git",
			["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args],
			{ cwd: root, encoding: "utf8", env },
		);
}

/** The injected git runner `main` takes: same shape as scripts/requirements-moved.mjs's defaultGit. */
function testGit(root, args) {
	return spawnSync("git", args, { cwd: root, encoding: "utf8", env });
}

function commit(root, message) {
	const git = gitAt(root);
	const add = git("add", "-A");
	if (add.status !== 0) throw new Error(`git add failed: ${add.stderr}`);
	const made = git("commit", "-qm", message);
	if (made.status !== 0) throw new Error(`git commit failed: ${made.stderr}`);
}

/** Builds the whole fixture repository at `root`, ending on branch `feat` with HEAD there. The
 * shape matches must-meet.md's Fixture section: changed = a (committed), b (uncommitted), new
 * (untracked, imports a), c (cycle with n2), spawned (tests/sp.test only starts it as a process),
 * h.test (committed); chains a->m->b, u->a, top->u, helper->u, h.test->helper, a.test->a,
 * a->d->d2, b->d2, gen->a (gen untracked and gitignored); negatives far->d2, d2.test->d2, lonely
 * (far and lonely edited on main only after the branch point); the lane also deletes gone, edits
 * vendor/v (map-ignored, tracked), tools/x (outside the roots), README.md and docs/p.html. */
function buildFixture(root) {
	const git = gitAt(root);

	write(root, "code-map.config.json", CONFIG);
	write(root, ".gitignore", "src/gen.mjs\n");
	write(root, P.a, "import './m.mjs';\nimport './d.mjs';\n");
	write(root, P.b, "import './d2.mjs';\n");
	write(root, P.c, "import './n2.mjs';\n");
	write(root, P.spawned, "export const spawned = 1;\n");
	write(root, P.m, "import './b.mjs';\n");
	write(root, P.n2, "import './c.mjs';\n");
	write(root, P.u, "import './a.mjs';\n");
	write(root, P.top, "import './u.mjs';\n");
	write(root, P.d, "import './d2.mjs';\n");
	write(root, P.d2, "export const d2 = 1;\n");
	write(root, P.far, "import './d2.mjs';\n");
	write(root, P.lonely, "export const lonely = 1;\n");
	write(root, P.vendorV, "export const v = 1;\n");
	write(root, P.gone, "export const gone = 1;\n");
	write(root, P.aTest, "import '../src/a.mjs';\n");
	write(root, P.helper, "import '../src/u.mjs';\n");
	write(root, P.hTest, "import './helper.mjs';\n");
	write(root, P.spTest, "// spawns src/spawned.mjs as a child process, never imports it\n");
	write(root, P.d2Test, "import '../src/d2.mjs';\n");
	write(root, P.toolsX, "export const x = 1;\n");
	write(root, P.readme, "# fixture\n");
	write(root, P.docsP, "<p>fixture</p>\n");

	git("init", "-q", "-b", "main");
	git("config", "core.autocrlf", "false");
	commit(root, "c1");

	const branched = git("checkout", "-q", "-b", "feat");
	if (branched.status !== 0) throw new Error(`git checkout -b feat failed: ${branched.stderr}`);

	write(root, P.a, "import './m.mjs';\nimport './d.mjs';\n// edited on feat\n");
	write(root, P.c, "import './n2.mjs';\n// edited on feat\n");
	write(root, P.spawned, "export const spawned = 2;\n");
	write(root, P.hTest, "import './helper.mjs';\n// edited on feat\n");
	write(root, P.vendorV, "export const v = 2;\n");
	write(root, P.toolsX, "export const x = 2;\n");
	write(root, P.readme, "# fixture\n\nedited on feat\n");
	write(root, P.docsP, "<p>fixture</p><p>edited on feat</p>\n");
	const removed = git("rm", "-q", P.gone);
	if (removed.status !== 0) throw new Error(`git rm failed: ${removed.stderr}`);
	commit(root, "feat edits");

	const toMain = git("checkout", "-q", "main");
	if (toMain.status !== 0) throw new Error(`git checkout main failed: ${toMain.stderr}`);
	write(root, P.far, "import './d2.mjs';\n// edited on main after the branch point\n");
	write(root, P.lonely, "export const lonely = 2;\n");
	commit(root, "main edits far and lonely");

	const backToFeat = git("checkout", "-q", "feat");
	if (backToFeat.status !== 0) throw new Error(`git checkout feat failed: ${backToFeat.stderr}`);

	// Working-tree-only (R-1553): an uncommitted edit, an untracked new file, and the
	// untracked, gitignored module collectModules still walks because it ignores .gitignore.
	write(root, P.b, "import './d2.mjs';\n// uncommitted edit\n");
	write(root, P.newFile, "import './a.mjs';\n");
	write(root, P.gen, "import './a.mjs';\n");
}

const fixtureRoot = tmpDir(join(tmpdir(), "blast-radius-"));
buildFixture(fixtureRoot);
const outFile = join(fixtureRoot, "page.html");
const runResult = main(["--root", fixtureRoot, "--base", "main", "--out", outFile], testGit);
const page = runResult === 0 ? readFileSync(outFile, "utf8") : "";

// ------------------------------------------------------------------- parsing

const NODE_RE = new RegExp(
	`<g class="node" ${DATA_PATH_ATTR}="([^"]*)" ${DATA_COLUMN_ATTR}="([^"]*)"( ${DATA_NO_LINKED_TEST_ATTR})?><rect x="(-?\\d+)" y="(-?\\d+)" width="(\\d+)" height="(\\d+)" class="[^"]*"/><text[^>]*>([^<]*)</text></g>`,
	"g",
);
const EDGE_RE = new RegExp(`<path class="edge" ${DATA_FROM_ATTR}="([^"]*)" ${DATA_TO_ATTR}="([^"]*)" d="[^"]*"/>`, "g");
const UNMAPPED_RE = new RegExp(`<li ${DATA_UNMAPPED_ATTR}>([^<]*)</li>`, "g");

function parseNodes(html) {
	return [...html.matchAll(NODE_RE)].map((m) => ({
		path: m[1],
		column: m[2],
		noLinkedTest: Boolean(m[3]),
		x: Number(m[4]),
		y: Number(m[5]),
		width: Number(m[6]),
		height: Number(m[7]),
		text: m[8],
	}));
}
function parseEdges(html) {
	return [...html.matchAll(EDGE_RE)].map((m) => `${m[1]}->${m[2]}`);
}
function parseUnmapped(html) {
	return [...html.matchAll(UNMAPPED_RE)].map((m) => m[1]);
}

const sortStrings = (list) => [...list].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const nodes = parseNodes(page);
const edges = parseEdges(page);
const unmapped = parseUnmapped(page);

// ------------------------------------------------------------------ must-meet

const expectedAllNodes = sortStrings([
	P.a, P.b, P.c, P.newFile, P.spawned, P.hTest,
	P.aTest, P.helper,
	P.gen, P.m, P.n2, P.top, P.u,
	P.d, P.d2,
]);
// req: R-1550
check("R-1550: the page draws one node for each changed mapped module and each transitive caller and callee, and no other module",
	runResult === 0 && sortStrings(nodes.map((n) => n.path)).join(",") === expectedAllNodes.join(","),
	`status ${runResult}; nodes: ${sortStrings(nodes.map((n) => n.path)).join(",")}`,
);

const expectedColumns = {
	tests: sortStrings([P.aTest, P.helper]),
	upstream: sortStrings([P.gen, P.m, P.n2, P.top, P.u]),
	changed: sortStrings([P.a, P.b, P.c, P.newFile, P.spawned, P.hTest]),
	downstream: sortStrings([P.d, P.d2]),
};
const columnsMatch = COLUMN_IDS.every(
	(id) => sortStrings(nodes.filter((n) => n.column === id).map((n) => n.path)).join(",") === expectedColumns[id].join(","),
);
const LEFT_TO_RIGHT = ["tests", "upstream", "changed", "downstream"];
const xOrdered = LEFT_TO_RIGHT.every((id, i) => {
	if (i === 0) return true;
	const leftXs = nodes.filter((n) => n.column === LEFT_TO_RIGHT[i - 1]).map((n) => n.x);
	const rightXs = nodes.filter((n) => n.column === id).map((n) => n.x);
	if (!leftXs.length || !rightXs.length) return true;
	return Math.min(...rightXs) > Math.max(...leftXs);
});
// req: R-1551
check("R-1551: nodes sit in four columns, tests, upstream, changed, downstream, left to right, with changed first and a caller never downstream",
	columnsMatch && xOrdered,
	`columns: ${JSON.stringify(COLUMN_IDS.map((id) => [id, sortStrings(nodes.filter((n) => n.column === id).map((n) => n.path))]))}`,
);

const expectedEdges = sortStrings([
	`${P.a}->${P.m}`,
	`${P.m}->${P.b}`,
	`${P.u}->${P.a}`,
	`${P.top}->${P.u}`,
	`${P.helper}->${P.u}`,
	`${P.hTest}->${P.helper}`,
	`${P.aTest}->${P.a}`,
	`${P.a}->${P.d}`,
	`${P.d}->${P.d2}`,
	`${P.b}->${P.d2}`,
	`${P.gen}->${P.a}`,
	`${P.newFile}->${P.a}`,
	`${P.c}->${P.n2}`,
	`${P.n2}->${P.c}`,
]);
// req: R-1552
check("R-1552: the drawn edges are exactly the map's imports between drawn nodes, importer to imported",
	sortStrings(edges).join(",") === expectedEdges.join(","),
	`edges: ${sortStrings(edges).join(",")}`,
);

const expectedChanged = sortStrings([P.a, P.b, P.c, P.newFile, P.spawned, P.hTest]);
const actualChanged = sortStrings(nodes.filter((n) => n.column === "changed").map((n) => n.path));
// req: R-1553
check("R-1553: changed means differing from the merge base in the working tree, uncommitted and untracked included, base-only changes and git-ignored files excluded",
	actualChanged.join(",") === expectedChanged.join(",") && !nodes.some((n) => n.path === P.far || n.path === P.lonely),
	`changed: ${actualChanged.join(",")}`,
);

const expectedUnmapped = sortStrings([P.gone, P.vendorV, P.toolsX]);
// req: R-1554
check("R-1554: the page lists exactly the changed module-extension files the map does not hold",
	sortStrings(unmapped).join(",") === expectedUnmapped.join(",") && !unmapped.includes(P.readme) && !unmapped.includes(P.docsP),
	`unmapped: ${sortStrings(unmapped).join(",")}`,
);

const expectedNoLink = sortStrings([P.c, P.newFile, P.spawned]);
const actualNoLink = sortStrings(nodes.filter((n) => n.noLinkedTest).map((n) => n.path));
const labelsOk = nodes
	.filter((n) => n.noLinkedTest)
	.every((n) => n.text.includes(NO_LINKED_TEST_LABEL))
	&& nodes.filter((n) => !n.noLinkedTest).every((n) => !n.text.includes(NO_LINKED_TEST_LABEL));
// req: R-1555
check("R-1555: exactly the changed modules outside the test roots that no test imports carry the no-linked-test label",
	actualNoLink.join(",") === expectedNoLink.join(",") && labelsOk,
	`no-link: ${actualNoLink.join(",")}`,
);

function pathSpellings(p) {
	return [p, p.split(sep).join("/"), p.split("/").join("\\")];
}
const shortRoot = tmpDir(join(tmpdir(), "br-s-"));
const longRoot = tmpDir(join(tmpdir(), "blast-radius-long-path-fixture-copy-"));
const deepLongRoot = join(longRoot, "deeper", "still", "more");
mkdirSync(deepLongRoot, { recursive: true });
cpSync(fixtureRoot, shortRoot, { recursive: true });
cpSync(fixtureRoot, deepLongRoot, { recursive: true });
const outA = join(shortRoot, "a.html");
const outB = join(deepLongRoot, "b.html");
const runA = spawnSync(process.execPath, [CLI, "--root", shortRoot, "--base", "main", "--out", outA], { encoding: "utf8", env });
const runB = spawnSync(process.execPath, [CLI, "--root", deepLongRoot, "--base", "main", "--out", outB], { encoding: "utf8", env });
const bytesA = runA.status === 0 ? readFileSync(outA) : Buffer.alloc(0);
const bytesB = runB.status === 0 ? readFileSync(outB) : Buffer.alloc(0);
const noRootLeak =
	pathSpellings(shortRoot).every((s) => !bytesA.toString("utf8").includes(s))
	&& pathSpellings(deepLongRoot).every((s) => !bytesB.toString("utf8").includes(s));
const noDateOrTime = ![bytesA, bytesB].some((b) => /\b\d{4}-\d{2}-\d{2}\b/.test(b.toString("utf8")) || /\b\d{2}:\d{2}:\d{2}\b/.test(b.toString("utf8")));
// req: R-1556
check("R-1556: two copies of one checkout in different folders give byte-identical pages with no folder path and no date",
	runA.status === 0 && runB.status === 0 && bytesA.length > 0 && bytesA.equals(bytesB) && noRootLeak && noDateOrTime,
	`statusA ${runA.status} statusB ${runB.status}; equal ${bytesA.equals(bytesB)}; noRootLeak ${noRootLeak}; noDateOrTime ${noDateOrTime}`,
);
const noScript = !/<script/i.test(page);
const noExternal = !/<link\b/i.test(page) && !/\bsrc="https?:/i.test(page) && !/\bhref="https?:/i.test(page) && !/<img\b/i.test(page);
// req: R-1557
check("R-1557: the page carries no script and references no file outside itself",
	runResult === 0 && page.length > 0 && noScript && noExternal,
	`noScript ${noScript}; noExternal ${noExternal}`,
);

if (fails > 0) { console.log(`${fails} check(s) failed`); process.exit(1); }
console.log("all checks passed");
