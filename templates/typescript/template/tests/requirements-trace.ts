/**
 * @module tests/requirements-trace.ts
 * @purpose Check that every REQUIREMENTS.md row's status agrees with the `req:` markers the test suite actually carries.
 * @inputs REQUIREMENTS.md and every test source (.test.ts, .test.tsx, .test.mjs, .test.js) under the configured test roots, recursively, read from a project root
 * @outputs the parsed rows, the traced ids, a list of human-readable problems and a one-line summary
 * @effects disk (reads REQUIREMENTS.md and the test sources)
 * @errors a thrown Error for a malformed requirements table (duplicate id, unknown status, a pipe inside a cell) or a bad or orphan marker
 */
// The requirements-first rail. A test declares which rows it evidences with a
// comment directly above its `test(` / `it(` call:
//
//     // req: R-001 G-004
//     test("a bounded page never repeats a row", () => { ... });
//
// Stacked comment lines merge. `check()` returns the mismatches:
//   * a row with status `implemented` and no marker (and no external evidence)
//   * a row with status `untested`, `planned` or `violated` that a marker traces
//   * a marker naming an id that is not a row
//   * an evidence citation `<test source>::<title>` — the path project-root-relative,
//     `tests/a.test.ts` or `packages/x/tests/y.test.mjs` — whose test does not exist
//     or does not carry that row's marker
//   * an `implemented` row whose evidence names no test in this repo — empty, prose,
//     or a half-written citation: the cell is a claim the suite has to back
// Evidence that lives in another repo is cited with a `<repo>:` prefix
// (`other-repo:tests/...`); a row whose evidence is entirely external is traced
// there, not here, and is exempt from the local-marker rule.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const STATUSES = new Set([
	"implemented",
	"untested",
	"planned",
	"violated",
	"retired",
]);

const ID = /^[RG]-\d{3}$/;
const ROW = /^\|\s*([RG]-\d{3})\s*\|(.*)\|\s*$/;
const EXTERNAL = /^[a-z][a-z0-9-]*:/;
const MARKER = /^\s*\/\/\s*req:\s*(.+?)\s*$/;
/** The statuses that a traced row contradicts. */
const STALE = new Set(["untested", "planned", "violated"]);

/** The call names that count as a test declaration, when a project does not say. */
export const CALL_NAMES = ["test", "it"];
/** The test directories scanned, when a project does not say. */
export const TEST_ROOTS = ["tests"];
/** The filename suffixes a test source carries, in either runtime. */
export const TEST_EXTENSIONS = [".test.ts", ".test.tsx", ".test.mjs", ".test.js"];

/**
 * The marked call may sit ANYWHERE on the line — `for (const c of CASES) check(...)`,
 * `enter(w); try { check("…", …) }` — so the name is matched after a non-identifier
 * boundary rather than at line start, and the FIRST such call on the line wins.
 */
function callRegex(names: string[]): RegExp {
	const alt = names.map((n) => n.replace(/[^\w$]/g, "")).join("|");
	return new RegExp(
		`(?:^|[^\\w.$])(?:${alt})\\s*\\(\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`,
	);
}
const CALL = callRegex(CALL_NAMES);

export interface Row {
	/** One of STATUSES. */
	status: string;
	/** True when every citation names another repo, so this row is traced there. */
	external: boolean;
	/** The `tests/<file>::<title>` citations that must exist in THIS suite. */
	local: string[];
	/**
	 * Citation text that is neither a local test citation nor an external `<repo>:`
	 * reference. On an `implemented` row that is a problem, not evidence.
	 */
	other: string[];
}

/**
 * A well-formed citation of a test in THIS repo: `<path to a test source>::<title>`,
 * the path project-root-relative exactly as the rail reports it — `tests/a.test.ts`
 * in a single-package project, `packages/x/tests/y.test.mjs` in a monorepo.
 */
function isLocal(cite: string): boolean {
	const at = cite.indexOf("::");
	if (at === -1) return false;
	const head = cite.slice(0, at);
	if (EXTERNAL.test(head) || cite.slice(at + 2).trim() === "") return false;
	return head.includes("/") && TEST_EXTENSIONS.some((e) => head.endsWith(e));
}

export interface Marked {
	ids: string[];
	title: string;
}

/** Parse REQUIREMENTS.md into rows by id. Throws on a malformed table. */
export function loadRequirements(text: string): Map<string, Row> {
	const rows = new Map<string, Row>();
	for (const line of text.split("\n")) {
		const m = ROW.exec(line);
		if (!m) continue;
		const id = m[1] as string;
		const cells = (m[2] as string).split("|").map((c) => c.trim());
		if (cells.length !== 3) {
			throw new Error(
				`${id} has ${cells.length + 1} cells, expected 4 (a '|' inside a cell?)`,
			);
		}
		const status = cells[1] as string;
		const evidence = cells[2] as string;
		if (!STATUSES.has(status))
			throw new Error(`${id}: unknown status '${status}'`);
		if (rows.has(id)) throw new Error(`duplicate id ${id}`);
		// Citations are backticked (`tests/x.test.ts::title`) so a comma inside a title
		// survives; an un-backticked cell is split on commas.
		const cites = (
			evidence.includes("`")
				? [...evidence.matchAll(/`([^`]+)`/g)].map((c) => c[1] as string)
				: evidence.split(",")
		)
			.map((c) => c.trim())
			.filter((c) => c !== "" && c !== "—");
		rows.set(id, {
			status,
			external: cites.length > 0 && cites.every((c) => EXTERNAL.test(c)),
			local: cites.filter(isLocal),
			other: cites.filter((c) => !isLocal(c) && !EXTERNAL.test(c)),
		});
	}
	return rows;
}

/** The ids of the marker block starting at `start`, and the line after it. */
function idsAt(
	lines: string[],
	start: number,
	name: string,
): { ids: string[]; next: number } {
	const ids: string[] = [];
	let i = start;
	while (i < lines.length) {
		const m = MARKER.exec(lines[i] as string);
		if (!m) break;
		for (const id of (m[1] as string).split(/[\s,]+/).filter(Boolean)) {
			if (!ID.test(id)) {
				throw new Error(
					`${name}:${i + 1}: bad requirement id '${id}' (expected R-NNN or G-NNN)`,
				);
			}
			ids.push(id);
		}
		i += 1;
	}
	return { ids, next: i };
}

/**
 * Scan one test source for markers. Throws on a bad id or an orphan marker.
 * `callNames` is what this project spells its test declaration (default `test`, `it`;
 * a suite driven by a helper passes e.g. `['test', 'it', 'check']`).
 */
export function scanSource(
	source: string,
	name: string,
	callNames: string[] = CALL_NAMES,
): Marked[] {
	const call0 = callNames === CALL_NAMES ? CALL : callRegex(callNames);
	const lines = source.split("\n");
	const found: Marked[] = [];
	let i = 0;
	while (i < lines.length) {
		if (!MARKER.test(lines[i] as string)) {
			i += 1;
			continue;
		}
		const { ids, next } = idsAt(lines, i, name);
		const call = next < lines.length ? call0.exec(lines[next] as string) : null;
		if (!call)
			throw new Error(
				`${name}:${i + 1}: '// req:' must sit directly above a ${callNames.map((n) => `${n}(`).join(" or ")} call`,
			);
		// a title is compared with an evidence cell, which carries no backticks and no escapes
		found.push({
			ids,
			title: (call[2] as string).replace(/\\(.)/g, "$1").replace(/`/g, ""),
		});
		i = next + 1;
	}
	return found;
}

/** Every test source under a directory, as paths relative to it, deterministically ordered. */
function testFiles(dir: string, prefix = ""): string[] {
	const found: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
		a.name < b.name ? -1 : 1,
	)) {
		const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
			found.push(...testFiles(join(dir, entry.name), rel));
		} else if (TEST_EXTENSIONS.some((e) => entry.name.endsWith(e))) {
			found.push(rel);
		}
	}
	return found;
}

/**
 * Every marker under ONE tests directory, as id -> [`<prefix>/<path>::<title>`].
 * Recursive: feature-shaped suites nest their tests, so a marker in
 * `tests/billing/caps.test.ts` counts, and its citation keeps the path relative to
 * the project root (`prefix` is that directory as the project root sees it).
 */
export function scanDir(
	dir: string,
	callNames: string[] = CALL_NAMES,
	prefix = "tests",
): Map<string, string[]> {
	const traced = new Map<string, string[]>();
	for (const f of testFiles(dir)) {
		for (const { ids, title } of scanSource(
			readFileSync(join(dir, f), "utf8"),
			`${prefix}/${f}`,
			callNames,
		)) {
			for (const id of ids) {
				const cite = `${prefix}/${f}::${title}`;
				const have = traced.get(id);
				if (have) have.push(cite);
				else traced.set(id, [cite]);
			}
		}
	}
	return traced;
}

/** The mismatches, as human-readable lines; empty when the file and the suite agree. */
export function traceProblems(
	requirements: Map<string, Row>,
	traced: Map<string, string[]>,
): string[] {
	const problems: string[] = [];
	for (const id of [...traced.keys()]
		.filter((k) => !requirements.has(k))
		.sort()) {
		problems.push(
			`${id} is marked on ${traced.get(id)?.length} test(s) but is not in REQUIREMENTS.md`,
		);
	}
	for (const [id, row] of [...requirements].sort(([a], [b]) =>
		a < b ? -1 : 1,
	)) {
		problems.push(...rowProblems(id, row, traced.get(id) ?? []));
	}
	return problems;
}

/** What one row's status and evidence claim, measured against what traces it. */
function rowProblems(id: string, row: Row, have: string[]): string[] {
	const problems: string[] = [];
	if (row.status === "implemented" && have.length === 0 && !row.external) {
		problems.push(
			`${id} is 'implemented' but no test carries '// req: ${id}' and its evidence is not external`,
		);
	} else if (STALE.has(row.status) && have.length > 0) {
		problems.push(
			`${id} is '${row.status}' but ${have.length} test(s) trace it; set status to implemented`,
		);
	}
	// on an implemented row a cited local test must exist and carry this row's
	// marker: the evidence cell is a claim the suite has to back, not prose
	if (row.status !== "implemented") return problems;
	if (!row.external) {
		for (const junk of row.other) {
			problems.push(
				`${id} evidence '${junk}' is not a test citation ('tests/<file>::<title>') or an external '<repo>:' reference`,
			);
		}
		if (row.local.length === 0) {
			problems.push(
				`${id} is 'implemented' but its evidence names no test in this repo (expected 'tests/<file>::<title>', backticked)`,
			);
		}
	}
	for (const cite of row.local) {
		if (!have.includes(cite)) {
			problems.push(
				`${id} cites '${cite}' but no test with that title carries '// req: ${id}'`,
			);
		}
	}
	return problems;
}

/** The one-line status tally the suite prints. */
export function summary(
	requirements: Map<string, Row>,
	traced: Map<string, string[]>,
): string {
	const counts = new Map<string, number>();
	for (const { status } of requirements.values())
		counts.set(status, (counts.get(status) ?? 0) + 1);
	const parts = [...counts.keys()]
		.sort()
		.map((s) => `${counts.get(s)} ${s}`)
		.join(" · ");
	return `requirements: ${requirements.size} total (${parts}); ${traced.size} traced by tests`;
}

export interface CheckResult {
	requirements: Map<string, Row>;
	traced: Map<string, string[]>;
	problems: string[];
	line: string;
}

export interface CheckOptions {
	/** The test directories to scan, project-root-relative. Default `['tests']`. */
	testRoots?: string[];
	/** What this project spells its test declaration. Default `['test', 'it']`. */
	callNames?: string[];
}

/**
 * Read a project's REQUIREMENTS.md, scan its test roots and report the disagreements.
 * A monorepo passes every suite it owns; citations stay project-root-relative, so a
 * row cites `packages/x/tests/y.test.ts::title` exactly as the rail reports it.
 */
export function check(root: string, options: CheckOptions = {}): CheckResult {
	const testRoots = options.testRoots ?? TEST_ROOTS;
	const callNames = options.callNames ?? CALL_NAMES;
	const requirements = loadRequirements(
		readFileSync(join(root, "REQUIREMENTS.md"), "utf8"),
	);
	const traced = new Map<string, string[]>();
	for (const dir of testRoots) {
		if (!existsSync(join(root, dir))) continue;
		for (const [id, cites] of scanDir(join(root, dir), callNames, dir)) {
			const have = traced.get(id);
			if (have) have.push(...cites);
			else traced.set(id, [...cites]);
		}
	}
	return {
		requirements,
		traced,
		problems: traceProblems(requirements, traced),
		line: summary(requirements, traced),
	};
}
