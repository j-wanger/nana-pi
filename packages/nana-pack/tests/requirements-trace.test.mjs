/**
 * @module packages/nana-pack/tests/requirements-trace.test.mjs
 * @purpose Holds nana-pi to the requirements-first rail it ships: an implemented row has a marked test behind it, a lesser row has no marker contradicting it, every cited test exists and carries the marker, and the EARS form count and allowance behave on fixtures.
 * @inputs scripts/requirements-trace.mjs, REQUIREMENTS.md, and the markers in the six test dirs npm test collects
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (reads this checkout; writes and removes scratch dirs under the OS temp dir for the EARS fixtures)
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
// allowance on data this repo does not own, independent of today's real off-form count.
// Run: node --experimental-strip-types <this file>
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { CALL_NAMES, EARS_ALLOWANCE, TEST_ROOTS, check: checkEars, checkRepo } = await import(
	new URL("../../../scripts/requirements-trace.mjs", import.meta.url).href
);

let fails = 0;
const check = (n, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why);
	if (!ok) fails++;
};

const { earsLine, problems, line, requirements, traced } = checkRepo();
console.log(line);
console.log(earsLine);

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
const { earsOffForm } = checkEars(earsDir, { testRoots: ["tests"] });
// req: G-014
check("ears: a two-shall row and a no-shall row are counted, a retired one is not",
	JSON.stringify(earsOffForm) === JSON.stringify(["R-900", "R-901"]),
	`${earsOffForm}`,
);
rmSync(earsDir, { recursive: true, force: true });

const allowDir = mkdtempSync(join(tmpdir(), "nana-ears-allow-"));
writeFileSync(
	join(allowDir, "REQUIREMENTS.md"),
	"# fixture\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-900 | The system shall do X and shall do Y. | untested | — |\n",
);
mkdirSync(join(allowDir, "tests"));
const over = checkEars(allowDir, { testRoots: ["tests"], earsAllowance: 0 });
const atAllowance = checkEars(allowDir, { testRoots: ["tests"], earsAllowance: 1 });
// req: G-015
check("ears: over the allowance each off-form row is a problem, at the allowance none",
	over.problems.includes("R-900 carries 2 shall (one is the form)") &&
		atAllowance.problems.filter((p) => p.startsWith("R-900")).length === 0,
	`over: ${over.problems.join(" | ")}; at: ${atAllowance.problems.join(" | ")}`,
);
rmSync(allowDir, { recursive: true, force: true });

// req: G-015
check("seal: EARS_ALLOWANCE is 194 (G-015)", EARS_ALLOWANCE === 194);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
