/**
 * @module tests/requirements-trace.ts
 * @purpose Check that every REQUIREMENTS.md row's status agrees with the `req:` markers the test suite actually carries, and that its Requirement cell carries exactly one `shall`.
 * @inputs REQUIREMENTS.md and every test source (.test.ts, .test.tsx, .test.mjs, .test.js) under the configured test roots, recursively, read from a project root
 * @outputs the parsed rows, the traced ids, the ids off EARS form, the `ears:` report line, a list of human-readable problems and a one-line summary
 * @effects disk (reads REQUIREMENTS.md and the test sources), process (printReport writes the report to stdout)
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
//
// `check()` also counts the EARS form (G-013/G-014/G-015): every non-retired row's
// Requirement cell must carry exactly one whole-word `shall` outside a code span. The
// count of off-form rows is reported on its own `ears:` line every run, and once that
// count exceeds the declared allowance (CheckOptions.earsAllowance, default
// EARS_ALLOWANCE_DEFAULT), each off-form row becomes a problem line too.

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

/**
 * Mask every code span in `text`, CommonMark style (astra r1 MUST 1): a run of N backticks
 * opens a span that closes only at the NEXT run of EXACTLY N backticks, so `` `shall` ``,
 * ``shall`` and `` `` `shall` `` `` are each ONE span, not a pair of empty ones either side
 * of a bare "shall". An unmatched backtick run is literal text, not a span. The whole span —
 * delimiters and content — is replaced with a SINGLE SPACE, never with nothing (astra r2
 * MUST 3): deleting it outright let the words either side glue together — `` sh`x`all ``
 * read back as the word "shall" (falsely counted), and `` shall`x`é `` read back as one
 * token "shallé" (a real `shall` lost). A `shall` inside a span is a mention, never a
 * promise (G-013); the space is a separator, not content.
 */
function maskCodeSpans(text: string): string {
	let out = "";
	let i = 0;
	while (i < text.length) {
		if (text[i] !== "`") {
			out += text[i];
			i++;
			continue;
		}
		let j = i;
		while (j < text.length && text[j] === "`") j++;
		const n = j - i;
		let k = j;
		let closeEnd = -1;
		while (k < text.length) {
			if (text[k] !== "`") {
				k++;
				continue;
			}
			let m = k;
			while (m < text.length && text[m] === "`") m++;
			if (m - k === n) {
				closeEnd = m;
				break;
			}
			k = m;
		}
		if (closeEnd === -1) {
			out += text.slice(i, j); // no matching close: the opening run is literal text
			i = j;
		} else {
			out += " "; // the whole span becomes ONE separator, delimiters and content gone
			i = closeEnd;
		}
	}
	return out;
}

/**
 * A `shall`, case-insensitive, not preceded or followed by an ASCII letter, digit or
 * underscore — explicitly `[A-Za-z0-9_]`, written identically (the literal class, not `\w`
 * or a Unicode property) in both rails (astra r2 MUST 1). Requirement rows are English
 * prose, so this is a deliberately NARROWER contract than "every Unicode word character":
 * a non-ASCII letter immediately touching "shall" (e.g. "shallé") counts as a BOUNDARY, not
 * as part of a longer word — "shallé" carries a `shall`. The reason is version independence,
 * not linguistics: `\p{L}`/`\w` read from the runtime's OWN Unicode database, and Node
 * 22 (Unicode 17) and Python 3.14 (Unicode 16) disagreed on 4,657 codepoints' letter/digit
 * membership, including U+088F and U+A7F1 — a silent, version-dependent split neither
 * language's own tests would ever catch. An explicit ASCII class has no Unicode database to
 * disagree about. See PARITY_FIXTURES below for the codepoints this was measured against.
 */
const SHALL = /(?<![A-Za-z0-9_])shall(?![A-Za-z0-9_])/gi;

/**
 * The allowance default for a project with no declared value: a new project writes rows
 * one at a time, so it starts at zero (chosen, design-ruling.md 2026-10-04 §1). Pinned by
 * requirements-trace.test.ts::seal: EARS_ALLOWANCE_DEFAULT is 0 (G-015).
 */
export const EARS_ALLOWANCE_DEFAULT = 0;

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

/**
 * Every row's `shall` count in its Requirement cell, read straight from the table text —
 * independent of `loadRequirements()` so `Row`'s shape carries no new field and every
 * existing comparison against it stays exact.
 */
export function shallCounts(text: string): Map<string, number> {
	const counts = new Map<string, number>();
	for (const line of text.split("\n")) {
		const m = ROW.exec(line);
		if (!m) continue;
		const id = m[1] as string;
		const cells = (m[2] as string).split("|").map((c) => c.trim());
		if (cells.length !== 3) continue; // loadRequirements already throws on this shape
		const requirement = cells[0] as string;
		counts.set(id, (maskCodeSpans(requirement).match(SHALL) ?? []).length);
	}
	return counts;
}

/**
 * Ids off EARS form (G-013): not `retired`, and the Requirement cell's `shall` count,
 * code spans masked, is not exactly one.
 */
export function earsOffForm(
	requirements: Map<string, Row>,
	counts: Map<string, number>,
): string[] {
	return [...requirements]
		.filter(([id, row]) => row.status !== "retired" && (counts.get(id) ?? 0) !== 1)
		.map(([id]) => id)
		.sort();
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
	/** Ids off EARS form (G-013), sorted — in the result so a caller can list them unflagged. */
	earsOffForm: string[];
	/** The `ears:` report line (G-014), printed after `line` every run regardless of pass/fail. */
	earsLine: string;
	/**
	 * `line` and `earsLine` joined by one newline, in that order — a structural guarantee
	 * (G-014's "in its own line after the summary line") a caller can print as one block and
	 * a test can pin without spying on a consumer's print statements.
	 */
	report: string;
}

export interface CheckOptions {
	/** The test directories to scan, project-root-relative. Default `['tests']`. */
	testRoots?: string[];
	/** What this project spells its test declaration. Default `['test', 'it']`. */
	callNames?: string[];
	/** Rows off EARS form tolerated before the rail fails naming them (G-015). Default EARS_ALLOWANCE_DEFAULT. */
	earsAllowance?: number;
}

/**
 * Read a project's REQUIREMENTS.md, scan its test roots and report the disagreements.
 * A monorepo passes every suite it owns; citations stay project-root-relative, so a
 * row cites `packages/x/tests/y.test.ts::title` exactly as the rail reports it.
 */
export function check(root: string, options: CheckOptions = {}): CheckResult {
	const testRoots = options.testRoots ?? TEST_ROOTS;
	const callNames = options.callNames ?? CALL_NAMES;
	const earsAllowance = options.earsAllowance ?? EARS_ALLOWANCE_DEFAULT;
	const text = readFileSync(join(root, "REQUIREMENTS.md"), "utf8");
	const requirements = loadRequirements(text);
	const traced = new Map<string, string[]>();
	for (const dir of testRoots) {
		if (!existsSync(join(root, dir))) continue;
		for (const [id, cites] of scanDir(join(root, dir), callNames, dir)) {
			const have = traced.get(id);
			if (have) have.push(...cites);
			else traced.set(id, [...cites]);
		}
	}
	const counts = shallCounts(text);
	const earsOffFormIds = earsOffForm(requirements, counts);
	const problems = traceProblems(requirements, traced);
	if (earsOffFormIds.length > earsAllowance) {
		for (const id of earsOffFormIds) {
			problems.push(`${id} carries ${counts.get(id) ?? 0} shall (one is the form)`);
		}
	}
	const line = summary(requirements, traced);
	const earsLine = `ears: ${earsOffFormIds.length} rows off form (allowance ${earsAllowance})`;
	return {
		requirements,
		traced,
		problems,
		line,
		earsOffForm: earsOffFormIds,
		earsLine,
		report: `${line}\n${earsLine}`,
	};
}

/**
 * Print a check() result's report to the console — the ONE function every real caller
 * uses (this rail ships no separate CLI of its own; a project's own test run, printed by
 * vitest, is its reporting surface). A test spies on THIS function directly (astra r2
 * MUST 2), so a mutation to its body — not just to the computed `report` field a test
 * could read without ever printing it — turns the cited test red.
 */
export function printReport(result: CheckResult): void {
	console.log(result.report);
}
