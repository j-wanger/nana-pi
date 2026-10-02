/**
 * @module tests/requirements-trace.test.ts
 * @purpose Pin the requirements rail — the checker against fixtures, then this project's REQUIREMENTS.md against the markers its suite carries.
 * @inputs the exports of tests/requirements-trace.ts, small fixture strings, a scratch project in a temp dir, and this project root
 * @outputs vitest assertions and the summary line on stdout
 * @effects disk (reads this project; writes and removes a scratch project under the OS temp dir)
 * @errors none beyond assertion failures
 */
// Two parts. The first pins the checker itself against fixtures. The second runs
// it against THIS project and fails the suite when a row's status lies — an
// `implemented` row nobody tests, or an `untested` row a test already pins. The
// checker reads test SOURCE, so a single-file run is still a full check.
//
// Fixture test sources are written as ONE physical line with \n escapes on
// purpose: a marker comment spelled on its own line in this file would be picked
// up as a real marker when the checker scans this very file.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, test } from "vitest";

import {
	check,
	loadRequirements,
	scanSource,
	summary,
	traceProblems,
} from "./requirements-trace.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REQS = `# reqs
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-001 | The system shall do one thing. | implemented | \`tests/a.test.ts::one\` |
| R-002 | The system shall do another. | untested | — |
| R-003 | The system shall do a third. | planned | docs/x.md |
| G-004 | The sibling shall hold. | implemented | \`other-repo:tests/b.test.ts::holds\` |
`;

const scratch: string[] = [];
afterAll(() => {
	for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

describe("loadRequirements", () => {
	test("reads id, status and whether the evidence is external", () => {
		const rows = loadRequirements(REQS);
		expect([...rows.keys()]).toEqual(["R-001", "R-002", "R-003", "G-004"]);
		expect(rows.get("R-001")).toEqual({
			status: "implemented",
			external: false,
			local: ["tests/a.test.ts::one"],
			other: [],
		});
		expect(rows.get("G-004")).toEqual({
			status: "implemented",
			external: true,
			local: [],
			other: [],
		});
	});

	test("rejects duplicate ids, unknown statuses and a pipe inside a cell", () => {
		expect(() =>
			loadRequirements(`${REQS}| R-001 | dup | untested | — |\n`),
		).toThrow(/duplicate id R-001/);
		expect(() =>
			loadRequirements(`${REQS}| R-009 | bad | done | — |\n`),
		).toThrow(/unknown status 'done'/);
		expect(() =>
			loadRequirements(`${REQS}| R-010 | a \\| b | untested | — |\n`),
		).toThrow(/R-010 has 5 cells/);
	});

	test("a row with mixed local and external evidence is not external", () => {
		const rows = loadRequirements(
			`${REQS}| R-005 | x | implemented | \`o:t::a\`, \`tests/b.test.ts::b\` |\n`,
		);
		expect(rows.get("R-005")?.external).toBe(false);
	});
});

describe("scanSource", () => {
	test("binds a marker to the test call directly below it, stacked markers merged", () => {
		const src =
			"// req: R-001 R-002\ntest('first', () => {});\n// req: R-003\n// req: G-004\nit(\"second\", () => {});\n";
		expect(scanSource(src, "x")).toEqual([
			{ ids: ["R-001", "R-002"], title: "first" },
			{ ids: ["R-003", "G-004"], title: "second" },
		]);
	});

	test("a marker binds to a mid-line call, and callNames is configurable", () => {
		// a table-driven suite declares its cases through a helper, mid-line
		const loop =
			"// req: R-001\nfor (const c of CASES) check(`a bounded page never repeats a row`, c);\n";
		expect(scanSource(loop, "x", ["test", "it", "check"])).toEqual([
			{ ids: ["R-001"], title: "a bounded page never repeats a row" },
		]);
		const guarded =
			'// req: R-002\n\tenter(w); try { check("holds under reentry", w) } finally { exit(w) }\n';
		expect(scanSource(guarded, "x", ["check"])).toEqual([
			{ ids: ["R-002"], title: "holds under reentry" },
		]);
		// a template literal keeps its interpolation verbatim, and the FIRST call on the
		// line wins. INTERP is assembled so Biome does not read it as a mistyped template.
		const INTERP = `$${"{i}"}`;
		const interpolated = `// req: R-003\n]) check(\`case ${INTERP} holds\`, () => {}); check('second', () => {});\n`;
		expect(scanSource(interpolated, "x", ["check"])[0]?.title).toBe(
			`case ${INTERP} holds`,
		);
		// a name that merely CONTAINS a call name is not a call
		expect(() =>
			scanSource("// req: R-001\ncheckProject('x');\n", "x", ["check"]),
		).toThrow(/must sit directly above/);
	});

	test("an orphan marker or a bad id fails loudly", () => {
		expect(() => scanSource("// req: R-001\nconst x = 1;\n", "x")).toThrow(
			/must sit directly above/,
		);
		expect(() => scanSource("// req: R1\ntest('t', () => {});\n", "x")).toThrow(
			/bad requirement id 'R1'/,
		);
	});
});

describe("traceProblems", () => {
	const rows = loadRequirements(
		`${REQS}| R-006 | gone | retired | — |\n| R-007 | v | violated | — |\n`,
	);

	test("flags each mismatch and nothing else", () => {
		const traced = new Map([
			["R-002", ["t::a"]],
			["R-003", ["t::b"]],
			["R-006", ["t::c"]],
			["R-007", ["t::e"]],
			["R-099", ["t::d"]],
		]);
		expect(traceProblems(rows, traced).map((p) => p.split(" ")[0])).toEqual([
			"R-099",
			"R-001",
			"R-001",
			"R-002",
			"R-003",
			"R-007",
		]);
	});

	test("clean when the status matches, external evidence counting as traced", () => {
		expect(
			traceProblems(rows, new Map([["R-001", ["tests/a.test.ts::one"]]])),
		).toEqual([]);
	});

	test("a cited local test that does not exist or does not carry the marker is a problem", () => {
		expect(
			traceProblems(rows, new Map([["R-001", ["tests/a.test.ts::other"]]])),
		).toEqual([
			"R-001 cites 'tests/a.test.ts::one' but no test with that title carries '// req: R-001'",
		]);
	});

	test("an implemented row whose evidence names no test here is a problem", () => {
		const bad = loadRequirements(
			`${REQS}| R-100 | none at all | implemented | — |
| R-101 | prose instead of a test | implemented | docs/design.md says so |
| R-102 | a half-written citation | implemented | \`tests/a.test.ts\` |
| R-103 | external plus local | implemented | \`o:tests/b.test.ts::b\`, \`tests/a.test.ts::one\` |
`,
		);
		expect(bad.get("R-102")).toEqual({
			status: "implemented",
			external: false,
			local: [],
			other: ["tests/a.test.ts"],
		});
		const problems = traceProblems(
			bad,
			new Map([
				["R-001", ["tests/a.test.ts::one"]],
				["R-100", ["tests/a.test.ts::one"]],
				["R-101", ["tests/a.test.ts::one"]],
				["R-102", ["tests/a.test.ts::one"]],
				["R-103", ["tests/a.test.ts::one"]],
			]),
		).join("\n");
		expect(problems).toMatch(
			/R-100 is 'implemented' but its evidence names no test in this repo/,
		);
		expect(problems).toMatch(
			/R-101 evidence 'docs\/design\.md says so' is not a test citation/,
		);
		expect(problems).toMatch(
			/R-102 evidence 'tests\/a\.test\.ts' is not a test citation/,
		);
		// a row mixing an external reference with a local one is satisfied
		expect(problems).not.toMatch(/R-103/);
	});

	test("the summary line counts statuses", () => {
		expect(summary(rows, new Map([["R-001", ["t::a"]]]))).toBe(
			"requirements: 6 total (2 implemented · 1 planned · 1 retired · 1 untested · 1 violated); 1 traced by tests",
		);
	});
});

describe("check over a scratch project", () => {
	test("reads the file and scans tests/ end to end", () => {
		const dir = mkdtempSync(join(tmpdir(), "req-trace-"));
		scratch.push(dir);
		mkdirSync(join(dir, "tests"));
		writeFileSync(join(dir, "REQUIREMENTS.md"), REQS);
		writeFileSync(
			join(dir, "tests", "a.test.ts"),
			"// req: R-001\ntest('one', () => {});\n",
		);
		writeFileSync(
			join(dir, "tests", "helper.ts"),
			"// req: R-002\ntest('not a test file', () => {});\n",
		);
		const { problems, traced } = check(dir);
		expect(problems).toEqual([]);
		expect([...traced]).toEqual([["R-001", ["tests/a.test.ts::one"]]]);
	});

	test("a nested test is scanned, and its citation keeps the nested path", () => {
		const dir = mkdtempSync(join(tmpdir(), "req-trace-nested-"));
		scratch.push(dir);
		mkdirSync(join(dir, "tests", "feature"), { recursive: true });
		writeFileSync(
			join(dir, "REQUIREMENTS.md"),
			REQS.replace(
				"| R-002 | The system shall do another. | untested | — |",
				`| R-002 | The system shall do another. | implemented | \`tests/feature/b.test.ts::two\` |`,
			),
		);
		writeFileSync(
			join(dir, "tests", "a.test.ts"),
			"// req: R-001\ntest('one', () => {});\n",
		);
		writeFileSync(
			join(dir, "tests", "feature", "b.test.ts"),
			"// req: R-002\ntest('two', () => {});\n",
		);
		const { problems, traced } = check(dir);
		expect(problems).toEqual([]);
		expect(traced.get("R-002")).toEqual(["tests/feature/b.test.ts::two"]);
	});

	test("an unknown id in a NESTED test fails the check", () => {
		const dir = mkdtempSync(join(tmpdir(), "req-trace-unknown-"));
		scratch.push(dir);
		mkdirSync(join(dir, "tests", "feature"), { recursive: true });
		writeFileSync(join(dir, "REQUIREMENTS.md"), REQS);
		writeFileSync(
			join(dir, "tests", "a.test.ts"),
			"// req: R-001\ntest('one', () => {});\n",
		);
		writeFileSync(
			join(dir, "tests", "feature", "b.test.ts"),
			"// req: R-999\ntest('two', () => {});\n",
		);
		expect(check(dir).problems.join("\n")).toMatch(
			/R-999 is marked on 1 test\(s\) but is not in REQUIREMENTS\.md/,
		);
	});
});

describe("check options", () => {
	test("testRoots and callNames let one repo scan several suites", () => {
		const dir = mkdtempSync(join(tmpdir(), "req-trace-roots-"));
		scratch.push(dir);
		mkdirSync(join(dir, "packages", "a", "tests"), { recursive: true });
		writeFileSync(
			join(dir, "REQUIREMENTS.md"),
			REQS.replace(
				"| R-002 | The system shall do another. | untested | — |",
				`| R-002 | The system shall do another. | implemented | \`packages/a/tests/b.test.ts::two\` |`,
			),
		);
		writeFileSync(
			join(dir, "packages", "a", "tests", "b.test.ts"),
			"// req: R-002\nfor (const c of CASES) check('two', c);\n",
		);
		// R-001's own evidence lives in the default tests/ dir, which this project has not got
		const { problems, traced } = check(dir, {
			testRoots: ["packages/a/tests"],
			callNames: ["test", "it", "check"],
		});
		expect(traced.get("R-002")).toEqual(["packages/a/tests/b.test.ts::two"]);
		expect(problems.join("\n")).toMatch(
			/R-001 is 'implemented' but no test carries/,
		);
		// a monorepo citation is a LOCAL citation: the row it backs raises nothing
		expect(problems.filter((p) => p.startsWith("R-002"))).toEqual([]);
	});
});

describe("this project", () => {
	test("REQUIREMENTS.md status agrees with the markers in tests/", () => {
		const { problems, line } = check(ROOT);
		console.log(line);
		expect(
			problems,
			`requirements trace FAILED:\n  ${problems.join("\n  ")}`,
		).toEqual([]);
	});
});
