/**
 * @module packages/nana-pack/tests/requirements-trace.test.mjs
 * @purpose Holds nana-pi to the requirements-first rail it ships: an implemented row has a marked test behind it, a lesser row has no marker contradicting it, and every cited test exists and carries the marker.
 * @inputs scripts/requirements-trace.mjs, REQUIREMENTS.md, and the markers in the six test dirs npm test collects
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (reads this checkout)
 * @errors a failed check prints FAIL with the problem list and the run exits 1; an unexpected throw propagates and fails the run
 */
// nana-pi under its own rule: the requirements-first rail runs over THIS repo, so a row that
// claims `implemented` has a test marked `// req: <id>` behind it, a row that claims less has
// no marker contradicting it, and every `implemented` row's evidence cites a test that exists
// and carries the marker. The rail itself is the template's — scripts/requirements-trace.mjs is
// a shim over templates/typescript/template/tests/requirements-trace.ts — and it is pointed at
// the six test dirs `npm test` collects.
//
// Reads this checkout only — no temp HOME needed, no network, no model.
// Run: node --experimental-strip-types <this file>
const { CALL_NAMES, TEST_ROOTS, checkRepo } = await import(
	new URL("../../../scripts/requirements-trace.mjs", import.meta.url).href
);

let fails = 0;
const check = (n, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why);
	if (!ok) fails++;
};

const { problems, line, requirements, traced } = checkRepo();
console.log(line);

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

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
