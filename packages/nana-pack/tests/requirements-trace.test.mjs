/**
 * @module packages/nana-pack/tests/requirements-trace.test.mjs
 * @purpose Holds nana-pi to the requirements-first rail it ships: an implemented row has a marked test behind it, a lesser row has no marker contradicting it, every cited test exists and carries the marker, the EARS form count and allowance behave on fixtures, and the shipped CLI really prints the report line after the summary line.
 * @inputs scripts/requirements-trace.mjs, REQUIREMENTS.md, and the markers in the six test dirs npm test collects
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (reads this checkout; writes and removes scratch dirs under the OS temp dir for the EARS fixtures), process (spawns the real CLI once)
 * @errors a failed check prints FAIL with the problem list and the run exits 1; an unexpected throw propagates and fails the run
 */
// nana-pi under its own rule: the requirements-first rail runs over THIS repo, so a row that
// claims `implemented` has a test marked `// req: <id>` behind it, a row that claims less has
// no marker contradicting it, and every `implemented` row's evidence cites a test that exists
// and carries the marker. The rail itself is the template's — scripts/requirements-trace.mjs is
// a shim over templates/typescript/template/tests/requirements-trace.ts — and it is pointed at
// the six test dirs `npm test` collects.
//
// Reads this checkout only — no temp HOME needed, no network, no model — except the EARS
// fixtures below, which write a throwaway scratch REQUIREMENTS.md to prove the count and the
// allowance on data this repo does not own, independent of today's real off-form count, and
// the CLI spawn below, which runs the real shipped entry point once.
// Run: node --experimental-strip-types <this file>
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { CALL_NAMES, EARS_ALLOWANCE, REPO_ROOT, TEST_ROOTS, check: checkEars, checkRepo, scanSource } = await import(
	new URL("../../../scripts/requirements-trace.mjs", import.meta.url).href
);

let fails = 0;
const check = (n, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why);
	if (!ok) fails++;
};

const { earsLine, earsOffForm, problems, line, requirements, traced } = checkRepo();
console.log(line);
console.log(earsLine);

// G-014, through the REAL CLI (astra r1 MUST 2): "report...in its own line after the
// summary line" is a claim about what scripts/requirements-trace.mjs actually prints, not
// just about the off-form id list, so it is pinned by spawning the real entry point and
// reading its real stdout, line by line — not by re-reading the in-process `earsLine`
// value, which a mutation to the SAME computation would also poison.
const cli = spawnSync(
	process.execPath,
	["--experimental-strip-types", join(REPO_ROOT, "scripts", "requirements-trace.mjs")],
	{ encoding: "utf-8" },
);
const cliLines = (cli.stdout ?? "").split("\n");
const summaryIdx = cliLines.findIndex((l) => l.startsWith("requirements: "));
const earsIdx = cliLines.findIndex((l) => l.startsWith("ears: "));
const expectedEarsLine = `ears: ${earsOffForm.length} rows off form (allowance ${EARS_ALLOWANCE})`;
// req: G-014
check("ears: the CLI prints the report line right after the summary line, naming the count and the allowance",
	summaryIdx >= 0 && earsIdx === summaryIdx + 1 && cliLines[earsIdx] === expectedEarsLine,
	`summaryIdx=${summaryIdx} earsIdx=${earsIdx} got='${cliLines[earsIdx]}' want='${expectedEarsLine}'\n${cli.stdout?.slice(0, 400)}`,
);

check(
	"REQUIREMENTS.md and the markers the suite carries agree",
	problems.length === 0,
	`\n  ${problems.join("\n  ")}`,
);
const expectedRoots = [
	...readdirSync(join(REPO_ROOT, "packages"), { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && existsSync(join(REPO_ROOT, "packages", entry.name, "tests")))
		.map((entry) => `packages/${entry.name}/tests`),
	"apps/desk/test", "apps/bench/test",
].sort();
const nestedTests = TEST_ROOTS.flatMap((root) => {
	const visit = (dir, depth = 0) => readdirSync(join(REPO_ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
		if (entry.isDirectory()) {
			if (entry.name === "fixture" || entry.name === "fixtures") return [];
			return visit(`${dir}/${entry.name}`, depth + 1);
		}
		return depth > 0 && entry.isFile() && entry.name.endsWith(".test.mjs") ? [`${dir}/${entry.name}`] : [];
	});
	return existsSync(join(REPO_ROOT, root)) ? visit(root) : [];
});
check("rail roots equal the package test roots and two app roots collected by npm test",
	JSON.stringify([...TEST_ROOTS].sort()) === JSON.stringify(expectedRoots) && CALL_NAMES.includes("check"),
	`rail=${TEST_ROOTS.join(",")} expected=${expectedRoots.join(",")}`,
);
check("no collected test root has nested test files outside fixture directories", nestedTests.length === 0, nestedTests.join(", "));
check(
	"the rail read the whole file and traced something",
	requirements.size > 400 && traced.size > 0,
	`${requirements.size} rows, ${traced.size} traced`,
);

// EARS form fixtures (G-014/G-015): a scratch REQUIREMENTS.md with a two-shall row, a
// no-shall row and a retired no-shall row, independent of today's real off-form count.
const EARS_FIXTURE = [
	"# fixture",
	"| ID | Requirement | Status | Evidence |",
	"|---|---|---|---|",
	"| R-900 | The system shall do X and shall do Y. | untested | — |",
	"| R-901 | The system does Z with no promise word. | untested | — |",
	"| R-902 | Gone from the product. | retired | — |",
	"",
].join("\n");

const earsDir = tmpDir(join(tmpdir(), "nana-ears-"));
writeFileSync(join(earsDir, "REQUIREMENTS.md"), EARS_FIXTURE);
mkdirSync(join(earsDir, "tests"));
const { earsOffForm: fixtureOffForm } = checkEars(earsDir, { testRoots: ["tests"] });
// req: G-014
check("ears: a two-shall row and a no-shall row are counted, a retired one is not",
	JSON.stringify(fixtureOffForm) === JSON.stringify(["R-900", "R-901"]),
	`${fixtureOffForm}`,
);
rmSync(earsDir, { recursive: true, force: true });

// TWO off-form rows (astra r1 MUST 2): a fixture with only one cannot tell "names EACH
// off-form row" apart from "names the first offending row, done".
const allowDir = tmpDir(join(tmpdir(), "nana-ears-allow-"));
writeFileSync(
	join(allowDir, "REQUIREMENTS.md"),
	[
		"# fixture",
		"| ID | Requirement | Status | Evidence |",
		"|---|---|---|---|",
		"| R-900 | The system shall do X and shall do Y. | untested | — |",
		"| R-901 | The system shall do A and shall do B and shall do C. | untested | — |",
		"",
	].join("\n"),
);
mkdirSync(join(allowDir, "tests"));
const over = checkEars(allowDir, { testRoots: ["tests"], earsAllowance: 0 });
const atAllowance = checkEars(allowDir, { testRoots: ["tests"], earsAllowance: 2 });
// req: G-015
check("ears: over the allowance each off-form row is a problem, at the allowance none",
	JSON.stringify(over.earsOffForm) === JSON.stringify(["R-900", "R-901"]) &&
		over.earsLine === "ears: 2 rows off form (allowance 0)" &&
		over.problems.includes("R-900 carries 2 shall (one is the form)") &&
		over.problems.includes("R-901 carries 3 shall (one is the form)") &&
		atAllowance.problems.filter((p) => p.startsWith("R-900") || p.startsWith("R-901")).length === 0,
	`over: ${over.problems.join(" | ")}; at: ${atAllowance.problems.join(" | ")}`,
);
rmSync(allowDir, { recursive: true, force: true });

// req: G-015
check("seal: EARS_ALLOWANCE is 0 (G-015)", EARS_ALLOWANCE === 0);
// G-013 for THIS repo: the lane that split every multi-shall row closed 2026-10-04; from here
// a new off-form row fails this check by name (lane-close-ruling.md §1).
// req: G-013
check("this repo: zero rows off form", earsOffForm.length === 0, `off form: ${earsOffForm.join(", ")}`);

// req: R-757
check("seal: EARS_ALLOWANCE equals the measured off-form count (no stale headroom)",
	earsOffForm.length === EARS_ALLOWANCE,
	`measured ${earsOffForm.length}, declared ${EARS_ALLOWANCE} — a landing must lower EARS_ALLOWANCE to match (deviation, Open questions #7)`,
);

// Four-digit identity and raw near-miss fixtures. Every project is created in the OS temp dir.
const ID_HEAD = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|";
const idFixture = (ledger, general = null, source = "") => {
	const dir = tmpDir(join(tmpdir(), "nana-req-ids-"));
	writeFileSync(join(dir, "REQUIREMENTS.md"), ledger);
	if (general !== null) writeFileSync(join(dir, "REQUIREMENTS-general.md"), general);
	mkdirSync(join(dir, "tests"));
	if (source) writeFileSync(join(dir, "tests", "a.test.mjs"), source);
	return dir;
};

const fourDigitRows = idFixture(`# fixture\n${ID_HEAD}\n| R-1000 | The trace rail shall accept four digits. | untested | — |\n| G-1000 | The trace rail shall accept four digits. | untested | — |\n`);
const fourDigitResult = checkEars(fourDigitRows, { testRoots: ["tests"] });
const endingHead = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n";
const crlf = (text) => text.replace(/\n/g, "\r\n");
const endingRows = idFixture(
	crlf(`# fixture\n${endingHead}| R-001 | The rail shall accept CRLF. | untested | — |\n| R-1000 | The rail shall accept four digits. | untested | — |\n`),
	crlf(`# fixture\n${endingHead}| G-001 | The rail shall accept CRLF. | untested | — |\n| G-1000 | The rail shall accept four digits. | untested | — |\n`),
);
const endingRowsResult = checkEars(endingRows, { testRoots: ["tests"] });
// req: R-1000 R-1001
check("R-1000: CRLF ledger/general rows and trailing spaces/tab are read and clean",
	endingRowsResult.problems.length === 0 && endingRowsResult.requirements.has("R-001") && endingRowsResult.requirements.has("R-1000") && endingRowsResult.requirements.has("G-001") && endingRowsResult.requirements.has("G-1000"), endingRowsResult.problems.join(" | "));
const trailingRows = idFixture(`# fixture\n${endingHead}| R-001 | The rail shall accept spaces. | untested | — |   \n| R-1000 | The rail shall accept tabs. | untested | — |\t\n`, `# fixture\n${endingHead}| G-001 | The rail shall accept spaces. | untested | — |   \n| G-1000 | The rail shall accept tabs. | untested | — |\t\n`);
const trailingResult = checkEars(trailingRows, { testRoots: ["tests"] });
// req: R-1000 R-1001
check("R-1000: spaces and tab after closing pipes are read and clean", trailingResult.problems.length === 0 && trailingResult.requirements.has("R-001") && trailingResult.requirements.has("R-1000") && trailingResult.requirements.has("G-001") && trailingResult.requirements.has("G-1000"), trailingResult.problems.join(" | "));
const missingEnding = idFixture(crlf(`# fixture\n${endingHead}| R-1000 | The rail shall reject a missing pipe. | untested | —\n`));
let missingEndingError = "";
try { checkEars(missingEnding, { testRoots: ["tests"] }); } catch (error) { missingEndingError = String(error.message); }
// req: R-1001
check("R-1001: CRLF row missing its closing pipe fails at REQUIREMENTS.md:4", missingEndingError.includes("REQUIREMENTS.md:4"), missingEndingError || "missing pipe was accepted");
const crlfMarkerFixture = idFixture(
	crlf(`# fixture\n${endingHead}| R-1000 | The rail shall trace its CRLF marker. | implemented | sample:tests/a.test.mjs::four |\n`),
	null,
	"// req: R-1000\r\ntest('four', () => {});\r\n",
);
const crlfMarkerResult = checkEars(crlfMarkerFixture, { testRoots: ["tests"] });
// req: R-1000 R-1001
check("R-1000: CRLF test-file marker traces its four-digit row", crlfMarkerResult.problems.length === 0 && crlfMarkerResult.traced.has("R-1000"), crlfMarkerResult.problems.join(" | "));
// req: R-1000
check("R-1000: both four-digit row prefixes load", fourDigitResult.requirements.has("R-1000") && fourDigitResult.requirements.has("G-1000") && fourDigitResult.problems.length === 0, fourDigitResult.problems.join(" | "));
// req: R-1000
check("R-1000: TS markers accept four-digit R/G and reject zero, five and non-ASCII digits", scanSource("// req: R-1000 G-1000\ntest('four', () => {});", "tests/a.test.mjs")[0].ids.join(",") === "R-1000,G-1000" && ["R-0123", "R-10000", "R-１２３"].every((id) => { try { scanSource(`// req: ${id}\ntest('bad', () => {});`, "tests/a.test.mjs"); return false; } catch (error) { return error.message.includes("bad requirement id") && error.message.includes("tests/a.test.mjs:1") && error.message.includes("four digits never starting with 0"); } }), "marker grammar or diagnostic differs");

const badIds = ["R-0123", "R-10000", "R-１２３"];
for (const id of badIds) {
	const dir = idFixture(`# fixture\n${ID_HEAD}\n| ${id} | The trace rail shall reject this ID. | untested | — |\n`);
	let message = "";
	try { checkEars(dir, { testRoots: ["tests"] }); } catch (error) { message = String(error.message); }
	// req: R-1000
	check(`R-1000: invalid row ID ${id} is rejected`, message.includes("REQUIREMENTS.md:4") && message.includes("four digits never starting with 0"), message || "invalid row was silently ignored");
}

const nearMisses = [
	["missing closing pipe", "| R-1001 | The trace rail shall reject malformed rows. | untested | —", 5],
	["fenced example", "```\n| R-squared | example |\n```", 6],
	["R candidate", "| R-squared | 0.9 |", 5],
	["G candidate", "| G-squared | 0.9 |", 5],
];
for (const [label, row, lineNo] of nearMisses) {
	for (const filename of ["REQUIREMENTS.md", "REQUIREMENTS-general.md"]) {
		const main = `# fixture\n${ID_HEAD}\n| G-001 | Every tool shall exist. | untested | — |\n`;
		const dir = idFixture(filename === "REQUIREMENTS.md" ? `${main}${row}\n` : main, filename === "REQUIREMENTS-general.md" ? `${main}${row}\n` : null);
		let message = "";
		try { checkEars(dir, { testRoots: ["tests"] }); } catch (error) { message = String(error.message); }
		// req: R-1001
		check(`R-1001: ${label} names ${filename}:${lineNo}`, message.includes(`${filename}:${lineNo}`), message || "candidate was silently ignored");
	}
}

const uvxProbe = spawnSync("uvx", ["--with", "pytest", "python", "-c", "import pytest"], { encoding: "utf8" });
if (uvxProbe.status !== 0) console.log("SKIP Python R-1000/R-1001 fixture rail: uvx with pytest unavailable");
else {
	const conf = join(REPO_ROOT, "templates/python/template/tests/conftest.py");
	const py = (dir) => spawnSync("uvx", ["--with", "pytest", "python", "-c", "import runpy,sys; from pathlib import Path; import pytest; m=runpy.run_path(sys.argv[2]);\ntry:\n r=m['check'](Path(sys.argv[1]),test_roots=())\n print('OK '+','.join(sorted(r[0])))\nexcept pytest.UsageError as e:\n print('ERR '+str(e))", dir, conf], { encoding: "utf8", cwd: dir });
	const accepted = py(fourDigitRows);
	// req: R-1000
	check("R-1000: Python rail reads four-digit R/G rows", accepted.status === 0 && accepted.stdout.includes("OK G-1000,R-1000"), accepted.stderr || accepted.stdout);
	const pythonInvalidRows = badIds.every((id) => {
		const dir = idFixture(`# fixture\n${ID_HEAD}\n| ${id} | The trace rail shall reject this ID. | untested | — |\n`);
		const result = py(dir);
		return result.status === 0 && result.stdout.includes("ERR REQUIREMENTS.md:4:") && result.stdout.includes("four digits never starting with 0");
	});
	// req: R-1000
	check("R-1000: Python row grammar rejects leading-zero, five-digit and non-ASCII IDs", pythonInvalidRows);
	const markerCode = `import runpy,sys,pytest\nm=runpy.run_path(sys.argv[1])\nassert m['scan_source']('# req: R-1000 G-1000\\ndef test_four():\\n pass\\n','tests/test_a.py')[0][0] == ['R-1000','G-1000']\nfor rid in ['R-0123','R-10000','R-１２３']:\n try: m['scan_source'](f'# req: {rid}\\ndef test_bad():\\n pass\\n','tests/test_a.py')\n except pytest.UsageError as e: assert 'bad requirement id' in str(e) and 'tests/test_a.py:1' in str(e) and 'four digits never starting with 0' in str(e)\n else: raise AssertionError(rid)`;
	const markerCheck = spawnSync("uvx", ["--with", "pytest", "python", "-c", markerCode, conf], { encoding: "utf8" });
	// req: R-1000
	check("R-1000: Python markers accept four-digit R/G and reject zero, five and non-ASCII digits", markerCheck.status === 0, markerCheck.stderr || markerCheck.stdout);
	const pythonEndingRows = py(endingRows);
	// req: R-1000 R-1001
	check("R-1001: Python CRLF ledger/general rows and trailing spaces/tab are read and clean", pythonEndingRows.status === 0 && pythonEndingRows.stdout.includes("OK G-001,G-1000,R-001,R-1000"), pythonEndingRows.stderr || pythonEndingRows.stdout);
	const pythonTrailingRows = py(trailingRows);
	// req: R-1000 R-1001
	check("R-1001: Python spaces and tab after closing pipes are read and clean", pythonTrailingRows.status === 0 && pythonTrailingRows.stdout.includes("OK G-001,G-1000,R-001,R-1000"), pythonTrailingRows.stderr || pythonTrailingRows.stdout);
	const pythonMissingEnding = py(missingEnding);
	// req: R-1001
	check("R-1001: Python CRLF row missing its closing pipe fails at REQUIREMENTS.md:4", pythonMissingEnding.status === 0 && pythonMissingEnding.stdout.includes("ERR REQUIREMENTS.md:4:"), pythonMissingEnding.stderr || pythonMissingEnding.stdout);
	for (const [label, row, lineNo] of nearMisses) for (const filename of ["REQUIREMENTS.md", "REQUIREMENTS-general.md"]) {
		const main = `# fixture\n${ID_HEAD}\n| G-001 | Every tool shall exist. | untested | — |\n`;
		const dir = idFixture(filename === "REQUIREMENTS.md" ? `${main}${row}\n` : main, filename === "REQUIREMENTS-general.md" ? `${main}${row}\n` : null);
		const result = py(dir);
		// req: R-1001
		check(`R-1001: Python ${label} names ${filename}:${lineNo}`, result.status === 0 && result.stdout.includes(`${filename}:${lineNo}`), result.stderr || result.stdout);
	}
}

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
