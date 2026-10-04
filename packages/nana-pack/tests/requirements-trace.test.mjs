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
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { CALL_NAMES, EARS_ALLOWANCE, REPO_ROOT, TEST_ROOTS, check: checkEars, checkRepo } = await import(
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
check(
	"the rail scanned every test dir npm test collects",
	TEST_ROOTS.length === 6 && CALL_NAMES.includes("check"),
	`${TEST_ROOTS.length} roots, calls ${CALL_NAMES.join("/")}`,
);
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

const earsDir = mkdtempSync(join(tmpdir(), "nana-ears-"));
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
const allowDir = mkdtempSync(join(tmpdir(), "nana-ears-allow-"));
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
check("seal: EARS_ALLOWANCE is 194 (G-015)", EARS_ALLOWANCE === 194);

// req: R-757
check("seal: EARS_ALLOWANCE equals the measured off-form count (no stale headroom)",
	earsOffForm.length === EARS_ALLOWANCE,
	`measured ${earsOffForm.length}, declared ${EARS_ALLOWANCE} — a landing must lower EARS_ALLOWANCE to match (deviation, Open questions #7)`,
);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
