#!/usr/bin/env node
/**
 * @module packages/nana-pack/tests/requirements-unclaimed.test.mjs
 * @purpose Pin the opt-in unclaimed-test listing shared by the TypeScript and Python requirements trace rails.
 * @inputs the two template rails, nana-pi's trace shim and requirements skill, plus temporary TypeScript and Python fixture projects
 * @outputs six PASS, FAIL or SKIP lines and exit 1 when a required contract check fails
 * @effects disk (reads this checkout and writes temporary fixtures), process (runs Node and uvx child processes)
 * @errors a failed check prints FAIL; Python-dependent checks SKIP only when uvx cannot resolve pytest unless CI requires it
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { tmpDir } from "./tmp-dir.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const TS_RAIL = join(ROOT, "templates/typescript/template/tests/requirements-trace.ts");
const PY_RAIL = join(ROOT, "templates/python/template/tests/conftest.py");
const TRACE_CLI = join(ROOT, "scripts/requirements-trace.mjs");
const SKILL = join(ROOT, "packages/nana-pack/skills/requirements/SKILL.md");
const trace = await import(new URL("../../../scripts/requirements-trace.mjs", import.meta.url).href);
const EXPECTED_SWITCH = "NANA_REQ_UNCLAIMED";
const SWITCH = trace.UNCLAIMED_ENV ?? EXPECTED_SWITCH;
const TEST_EXTENSIONS = [".test.ts", ".test.tsx", ".test.mjs", ".test.js"];
const REQUIRE_PYTEST = process.env.NANA_TEST_REQUIRE_COPIER === "1";
let fails = 0;

function check(name, ok, why = "") {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why);
	if (!ok) fails += 1;
}

function skip(name, why) {
	console.log("SKIP", name, "—", why);
}

function run(command, args, cwd = ROOT, env = process.env) {
	return spawnSync(command, args, { cwd, env, encoding: "utf-8", timeout: 240_000 });
}

function output(result) {
	return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function makeDir(prefix) {
	return tmpDir(join(tmpdir(), prefix));
}

function write(root, path, source) {
	const full = join(root, path);
	mkdirSync(dirname(full), { recursive: true });
	writeFileSync(full, source);
}

function tryTsUnclaimed(root, options = {}) {
	try {
		return { lines: trace.unclaimedLines(root, options), error: "" };
	} catch (error) {
		return { lines: [], error: String(error) };
	}
}

function pythonRunpy(expression, ...args) {
	const script = `import json, runpy, sys\nfrom pathlib import Path\nns = runpy.run_path(sys.argv[1])\nprint(json.dumps(${expression}, ensure_ascii=False))`;
	return run("uvx", ["--with", "pytest", "python", "-c", script, PY_RAIL, ...args], ROOT, {
		...process.env,
		PYTHONIOENCODING: "utf-8",
	});
}

function pythonUnclaimed(root, testRoots = ["tests"], callNames = ["test", "it", "check"]) {
	const result = pythonRunpy("ns['unclaimed_lines'](Path(sys.argv[2]), tuple(json.loads(sys.argv[3])), tuple(json.loads(sys.argv[4])))", root, JSON.stringify(testRoots), JSON.stringify(callNames));
	if (result.status !== 0) return { lines: [], error: output(result) };
	try {
		return { lines: JSON.parse((result.stdout ?? "").trim()), error: "" };
	} catch (error) {
		return { lines: [], error: `${String(error)}\n${output(result)}` };
	}
}

const pytestProbe = run("uvx", ["--with", "pytest", "pytest", "--version"]);
const pytestAvailable = pytestProbe.status === 0;
const pythonUnavailable = `uvx could not resolve pytest: ${output(pytestProbe).slice(-500)}`;

const tsRoot = makeDir("nana-unclaimed-ts-");
write(tsRoot, "tests/a-b.test.ts", "// req: R-001\ntest(\"claimed\", () => {});\ntest(\"directly under claimed\", () => {});\ndescribe(\"not a declaration\", () => {});\ntest.skip(\"also not a declaration\", () => {});\n");
write(tsRoot, "tests/a/x.test.ts", "it('alpha', () => {});\n");
write(tsRoot, "tests/sub/z.test.ts", "const cases = [1];\r\nfor (const c of cases) check(\"loop case\", c);\t");
write(tsRoot, "tests/helper.ts", "test(\"helper is outside the grammar\", () => {});\n");
const tsListing = tryTsUnclaimed(tsRoot, { callNames: ["test", "it", "check"] });
const expectedTs = [
	"unclaimed: 3 test declarations carry no req: marker",
	"  tests/a-b.test.ts:3 directly under claimed",
	"  tests/a/x.test.ts:1 alpha",
	"  tests/sub/z.test.ts:2 loop case",
];
const zeroRoot = makeDir("nana-unclaimed-zero-");
write(zeroRoot, "tests/all.test.ts", "// req: R-001\ntest(\"claimed one\", () => {});\n// req: R-002\nit(\"claimed two\", () => {});\n");
const zeroListing = tryTsUnclaimed(zeroRoot);
const title1660 = "R-1660: the TypeScript rail lists each unclaimed test, it and check declaration by path, line and title in path order, and a zero count when none";
// req: R-1660
check("R-1660: the TypeScript rail lists each unclaimed test, it and check declaration by path, line and title in path order, and a zero count when none", JSON.stringify(tsListing.lines) === JSON.stringify(expectedTs) && JSON.stringify(zeroListing.lines) === JSON.stringify(["unclaimed: 0 test declarations carry no req: marker"]), `${tsListing.error || tsListing.lines.join("\n")}\nzero: ${zeroListing.error || zeroListing.lines.join("\n")}`);

const pyRoot = makeDir("nana-unclaimed-py-");
write(pyRoot, "tests/test_main.py", "# req: R-001\n@first\n@second(value=True)\ndef test_claimed(): pass\n@decorated\ndef test_decorated(): pass\nasync def test_async(): pass\nclass Tests:\n    def test_method(self): pass\nfor case in cases: check(\"call title\", case)\n");
write(pyRoot, "tests/sub/test_nested.py", "value = 1\r\ndef test_nested(): pass\t");
const expectedPy = [
	"unclaimed: 5 test declarations carry no req: marker",
	"  tests/sub/test_nested.py:2 test_nested",
	"  tests/test_main.py:6 test_decorated",
	"  tests/test_main.py:7 test_async",
	"  tests/test_main.py:9 test_method",
	"  tests/test_main.py:10 call title",
];
const pyListing = pytestAvailable ? pythonUnclaimed(pyRoot) : { lines: [], error: pythonUnavailable };
const title1661 = "R-1661: the Python rail lists unclaimed def and call declarations, and a marker above decorators claims its def";
if (!pytestAvailable && !REQUIRE_PYTEST) skip(title1661, pythonUnavailable);
else {
	// req: R-1661
	check("R-1661: the Python rail lists unclaimed def and call declarations, and a marker above decorators claims its def", pytestAvailable && JSON.stringify(pyListing.lines) === JSON.stringify(expectedPy), pyListing.error || pyListing.lines.join("\n"));
}

const TWIN_LAYOUT = [
	{ key: "a-b", ts: "tests/a-b.test.ts", py: "tests/test_a-b.py", rows: [{ title: "test_top" }, { title: "test_claimed", claimed: true }, { title: "test_under_claimed" }] },
	{ key: "a/x", ts: "tests/a/x.test.ts", py: "tests/test_a/test_x.py", rows: [{ title: "test_folder" }] },
	{ key: "sub/z", ts: "tests/sub/z.test.ts", py: "tests/test_sub/test_z.py", rows: [{ title: "test_nested" }] },
];
const twinTsRoot = makeDir("nana-unclaimed-twin-ts-");
const twinPyRoot = makeDir("nana-unclaimed-twin-py-");
for (const file of TWIN_LAYOUT) {
	const tsSource = file.rows.flatMap((row) => [...(row.claimed ? ["// req: R-001"] : []), `test(\"${row.title}\", () => {});`]).join("\n");
	const pySource = file.rows.flatMap((row) => [...(row.claimed ? ["# req: R-001"] : []), `def ${row.title}(): pass`]).join("\n");
	write(twinTsRoot, file.ts, tsSource);
	write(twinPyRoot, file.py, pySource);
}
function normalizeTwin(lines, language) {
	const paths = new Map(TWIN_LAYOUT.map((file) => [language === "ts" ? file.ts : file.py, file.key]));
	return lines.map((line, index) => {
		if (index === 0) return line;
		const match = /^  (.*):(\d+) (.*)$/.exec(line);
		return match ? `  ${paths.get(match[1]) ?? match[1]}:${match[2]} ${match[3]}` : line;
	});
}
const twinTs = tryTsUnclaimed(twinTsRoot);
const twinPy = pytestAvailable ? pythonUnclaimed(twinPyRoot) : { lines: [], error: pythonUnavailable };
const title1662 = "R-1662: twin fixtures give the same unclaimed listing from the TypeScript and Python rails";
if (!pytestAvailable && !REQUIRE_PYTEST) skip(title1662, pythonUnavailable);
else {
	// req: R-1662
	check("R-1662: twin fixtures give the same unclaimed listing from the TypeScript and Python rails", pytestAvailable && twinTs.error === "" && twinPy.error === "" && JSON.stringify(normalizeTwin(twinTs.lines, "ts")) === JSON.stringify(normalizeTwin(twinPy.lines, "py")), `TS: ${twinTs.error || normalizeTwin(twinTs.lines, "ts").join("\n")}\nPY: ${twinPy.error || normalizeTwin(twinPy.lines, "py").join("\n")}`);
}

function sha(path) {
	return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function filesUnder(root, accept) {
	const found = [];
	function visit(dir) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory()) visit(full);
			else if (entry.isFile() && accept(full)) found.push(full);
		}
	}
	visit(root);
	return found.sort();
}

function hashes(paths) {
	return new Map(paths.map((path) => [path, sha(path)]));
}

function sameHashes(before) {
	return [...before].every(([path, digest]) => sha(path) === digest);
}

function offEnvironment(extra = {}) {
	const env = { ...process.env, ...extra };
	delete env[EXPECTED_SWITCH];
	return env;
}

function listingBlock(stdout) {
	const lines = stdout.replace(/\r\n/g, "\n").split("\n");
	const index = lines.findIndex((line) => line.startsWith("unclaimed: "));
	if (index < 0) return { index, count: -1, entries: [], without: lines };
	const count = Number(/^unclaimed: (\d+) /.exec(lines[index])?.[1] ?? -1);
	const following = lines.slice(index + 1);
	const entries = [];
	for (const line of following) {
		if (!/^  .+:\d+ /.test(line)) break;
		entries.push(line);
	}
	return { index, count, entries, without: [...lines.slice(0, index), ...following.slice(entries.length)] };
}

const repoSources = [join(ROOT, "REQUIREMENTS.md"), ...trace.TEST_ROOTS.flatMap((testRoot) => filesUnder(join(ROOT, testRoot), (path) => TEST_EXTENSIONS.some((extension) => path.endsWith(extension))))];
const repoBefore = hashes(repoSources);
const nodeArgs = ["--experimental-strip-types", TRACE_CLI];
const nodeOff = run(process.execPath, nodeArgs, ROOT, offEnvironment());
const nodeOn = run(process.execPath, nodeArgs, ROOT, { ...offEnvironment(), [SWITCH]: "1" });
const nodeBlock = listingBlock(nodeOn.stdout ?? "");
const nodeSwitchOk = nodeOn.status === nodeOff.status && (nodeOn.stdout ?? "").startsWith(nodeOff.stdout ?? "") && nodeBlock.count === nodeBlock.entries.length && nodeBlock.index >= 0 && sameHashes(repoBefore);

let pythonSwitchOk = false;
let pythonSwitchWhy = pythonUnavailable;
if (pytestAvailable) {
	const project = makeDir("nana-unclaimed-pytest-");
	write(project, "pytest.ini", "[pytest]\ntestpaths = tests\n");
	write(project, "REQUIREMENTS.md", "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The fixture shall stay stale. | untested | — |\n");
	cpSync(PY_RAIL, join(project, "tests/conftest.py"), { recursive: false });
	write(project, "tests/test_sample.py", "# req: R-001\ndef test_claimed(): pass\ndef test_first_unclaimed(): pass\ndef test_second_unclaimed(): pass\n");
	const projectSources = [join(project, "REQUIREMENTS.md"), ...filesUnder(join(project, "tests"), (path) => path.endsWith(".py"))];
	const before = hashes(projectSources);
	const args = ["--with", "pytest", "pytest", "-p", "no:cacheprovider"];
	const pyOffEnv = offEnvironment({ PYTHONIOENCODING: "utf-8", PYTHONDONTWRITEBYTECODE: "1" });
	const pyOff = run("uvx", args, project, pyOffEnv);
	const pyOn = run("uvx", args, project, { ...pyOffEnv, [SWITCH]: "1" });
	const block = listingBlock(pyOn.stdout ?? "");
	const removeTiming = (lines) => lines.filter((line) => !/^=+ .* in \d+(?:\.\d+)?s =+$/.test(line));
	const expectedEntries = ["  tests/test_sample.py:3 test_first_unclaimed", "  tests/test_sample.py:4 test_second_unclaimed"];
	const pyOnLines = (pyOn.stdout ?? "").replace(/\r\n/g, "\n").split("\n");
	const requirementsIndex = pyOnLines.findIndex((line) => line.startsWith("requirements: "));
	const problemEndIndex = pyOnLines.findIndex((line) => line.includes("fix REQUIREMENTS.md or the markers"));
	pythonSwitchOk = pyOn.status === pyOff.status && pyOff.status === 1 && block.index > requirementsIndex && block.index > problemEndIndex && problemEndIndex >= 0 && block.count === block.entries.length && JSON.stringify(block.entries) === JSON.stringify(expectedEntries) && JSON.stringify(removeTiming(block.without)) === JSON.stringify(removeTiming((pyOff.stdout ?? "").replace(/\r\n/g, "\n").split("\n"))) && sameHashes(before);
	pythonSwitchWhy = `off=${pyOff.status} on=${pyOn.status}\nOFF:\n${pyOff.stdout}\nON:\n${pyOn.stdout}\nERR:\n${pyOn.stderr}`;
}
const title1663 = "R-1663: the unclaimed switch adds the whole listing and changes no other line, exit status or file";
if (!pytestAvailable && !REQUIRE_PYTEST) skip(title1663, pythonUnavailable);
else {
	// req: R-1663
	check("R-1663: the unclaimed switch adds the whole listing and changes no other line, exit status or file", pytestAvailable && nodeSwitchOk && pythonSwitchOk, `node off=${nodeOff.status} on=${nodeOn.status} listing=${nodeBlock.count}/${nodeBlock.entries.length}\n${pythonSwitchWhy}`);
}

const skill = readFileSync(SKILL, "utf-8");
const pass1 = skill.indexOf("**Pass 1");
const pass2 = skill.indexOf("**Pass 2", pass1 + 1);
const auditSlice = pass1 >= 0 && pass2 > pass1 ? skill.slice(pass1, pass2) : "";
// req: R-1664
check("R-1664: the audit mode names the rail's unclaimed switch after Pass 1 and calls each listed declaration a proposal", auditSlice.includes(`${trace.UNCLAIMED_ENV}=1`) && /\bproposal\b/.test(auditSlice), auditSlice.slice(-1000));

let pythonSwitch = "";
let pythonConstantWhy = pythonUnavailable;
if (pytestAvailable) {
	const result = pythonRunpy("ns['UNCLAIMED_ENV']");
	pythonConstantWhy = output(result);
	if (result.status === 0) {
		try { pythonSwitch = JSON.parse((result.stdout ?? "").trim()); } catch { pythonSwitch = ""; }
	}
}
const title1665 = "seal: UNCLAIMED_ENV is NANA_REQ_UNCLAIMED in both rails (R-1665)";
if (!pytestAvailable && !REQUIRE_PYTEST) skip(title1665, pythonUnavailable);
else {
	// req: R-1665
	check("seal: UNCLAIMED_ENV is NANA_REQ_UNCLAIMED in both rails (R-1665)", pytestAvailable && trace.UNCLAIMED_ENV === EXPECTED_SWITCH && pythonSwitch === EXPECTED_SWITCH, `TypeScript=${trace.UNCLAIMED_ENV} Python=${pythonSwitch}\n${pythonConstantWhy}`);
}

if (fails) process.exitCode = 1;
