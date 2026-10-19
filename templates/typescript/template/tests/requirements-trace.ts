/**
 * @module tests/requirements-trace.ts
 * @purpose Check that every REQUIREMENTS.md row's status agrees with the `req:` markers the test suite actually carries, and that its Requirement cell carries exactly one `shall`.
 * @inputs REQUIREMENTS.md, optional REQUIREMENTS-general.md, every test source (.test.ts, .test.tsx, .test.mjs, .test.js) under the configured test roots, recursively, read from a project root, and an environment mapping for opt-in output
 * @outputs the parsed rows, the traced ids, the ids off EARS form, the `ears:` report line, a list of human-readable problems, a one-line summary, and an optional unclaimed-declaration listing
 * @effects disk (reads REQUIREMENTS.md and the test sources), process (printReport and printUnclaimed write reports to stdout)
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

export const ID = /^[RG]-(?:[0-9]{3}|[1-9][0-9]{3})$/;
export const WHITESPACE =
	"\t\n\v\f\r\u001c\u001d\u001e\u001f \u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff";
const WS_CLASS = [...WHITESPACE]
	.map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`)
	.join("");
const WS = `[${WS_CLASS}]`;
const trimWhitespace = (value: string): string =>
	value.replace(new RegExp(`^${WS}+|${WS}+$`, "gu"), "");
const stripWhitespaceEnd = (value: string): string =>
	value.replace(new RegExp(`${WS}+$`, "gu"), "");
const withoutLeadingBom = (text: string): string =>
	text.startsWith("\ufeff") ? text.slice(1) : text;
const ID_SOURCE = `[RG]-(?:[0-9]{3}|[1-9][0-9]{3})`;
const ROW = new RegExp(`^\\|${WS}*(${ID_SOURCE})${WS}*\\|(.*)\\|${WS}*$`, "s");
const ROW_CANDIDATE = new RegExp(`^\\|${WS}*[RG]-[^${WS_CLASS}]`);

/** Return the ID only when a line is a complete four-cell requirement row. */
export function requirementRowId(line: string): string | null {
	const normalized = stripWhitespaceEnd(line);
	if (!normalized.startsWith("|") || !normalized.endsWith("|")) return null;
	const cells = normalized.slice(1, -1).split("|").map(trimWhitespace);
	const id = cells[0] ?? "";
	return cells.length === 4 && ID.test(id) ? id : null;
}

function assertNoNearMissRows(text: string, file: string): void {
	for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
		const line = stripWhitespaceEnd(rawLine);
		if (!ROW_CANDIDATE.test(line)) continue;
		if (requirementRowId(line) !== null) continue;
		throw new Error(
			`${file}:${index + 1}: malformed requirement row (expected R-NNN or R-NNNN, four digits never starting with 0; four cells and opening/closing pipes required)`,
		);
	}
}
const EXTERNAL = /^[a-z][a-z0-9-]*:/;
const MARKER = new RegExp(`^${WS}*\\/\\/${WS}*req:${WS}*(.+?)${WS}*$`, "s");
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
export const SHALL = /(?<![A-Za-z0-9_])shall(?![A-Za-z0-9_])/gi;

/**
 * The allowance default for a project with no declared value: a new project writes rows
 * one at a time, so it starts at zero (chosen, design-ruling.md 2026-10-04 §1). Pinned by
 * requirements-trace.test.ts::seal: EARS_ALLOWANCE_DEFAULT is 0 (G-015).
 */
export const EARS_ALLOWANCE_DEFAULT = 0;

/** The template-owned Part G source (chosen, R-581). */
export const GENERAL_REQUIREMENTS_FILE = "REQUIREMENTS-general.md";

/** The call names that count as a test declaration, when a project does not say. */
export const CALL_NAMES = ["test", "it"];
/** The test directories scanned, when a project does not say. */
export const TEST_ROOTS = ["tests"];
/** The environment switch for the opt-in unclaimed listing (contract, R-1665). */
export const UNCLAIMED_ENV = "NANA_REQ_UNCLAIMED";
/** The filename suffixes a test source carries, in either runtime. */
export const TEST_EXTENSIONS = [
	".test.ts",
	".test.tsx",
	".test.mjs",
	".test.js",
];

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
	if (EXTERNAL.test(head) || trimWhitespace(cite.slice(at + 2)) === "")
		return false;
	return head.includes("/") && TEST_EXTENSIONS.some((e) => head.endsWith(e));
}

export interface Marked {
	ids: string[];
	title: string;
}

/**
 * Split one Evidence cell into its citations, the rail's own way: backtick spans when any
 * backtick is present (so a comma inside a quoted title survives), otherwise a plain comma
 * split — each trimmed, with an empty cell and the bare "—" placeholder dropped. A consumer
 * outside this rail (the regroup checker's evidence-placement test, R-1176) imports this
 * instead of copying the split, so both read one cell the same way.
 */
export function citesOf(evidence: string): string[] {
	return (
		evidence.includes("`")
			? [...evidence.matchAll(/`([^`]+)`/g)].map((c) => c[1] as string)
			: evidence.split(",")
	)
		.map(trimWhitespace)
		.filter((c) => c !== "" && c !== "—");
}

/** Parse already-normalized REQUIREMENTS.md text (the file reader removed its leading BOM) into rows by ID. Throws on a malformed table. */
export function loadRequirements(text: string): Map<string, Row> {
	const rows = new Map<string, Row>();
	for (const rawLine of text.split(/\r?\n/)) {
		const normalized = stripWhitespaceEnd(rawLine);
		if (requirementRowId(rawLine) === null && !ROW.test(normalized)) continue;
		const m = ROW.exec(normalized);
		if (!m) continue;
		const id = m[1] as string;
		const cells = (m[2] as string).split("|").map(trimWhitespace);
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
		const cites = citesOf(evidence);
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
 * Every row's `shall` count in its Requirement cell, read from already-normalized text
 * (the file reader removed its leading BOM) straight from the table text — independent of
 * `loadRequirements()` so `Row`'s shape carries no new field and every
 * existing comparison against it stays exact.
 */
export function shallCounts(text: string): Map<string, number> {
	const counts = new Map<string, number>();
	for (const rawLine of text.split(/\r?\n/)) {
		if (requirementRowId(rawLine) === null) continue;
		const m = ROW.exec(stripWhitespaceEnd(rawLine));
		if (!m) continue;
		const id = m[1] as string;
		const cells = (m[2] as string).split("|").map(trimWhitespace);
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
		.filter(
			([id, row]) => row.status !== "retired" && (counts.get(id) ?? 0) !== 1,
		)
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
		for (const id of (m[1] as string)
			.split(new RegExp(`[${WS_CLASS},]+`, "u"))
			.filter(Boolean)) {
			if (!ID.test(id)) {
				throw new Error(
					`${name}:${i + 1}: bad requirement id '${id}' (expected R-NNN or R-NNNN, four digits never starting with 0)`,
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
	const lines = withoutLeadingBom(source)
		.split(/\r?\n/)
		.map(stripWhitespaceEnd);
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

/** One test source's declarations that no marker block directly claims. */
function unclaimedSource(
	source: string,
	name: string,
	callNames: string[],
): { line: number; title: string }[] {
	const call = callNames === CALL_NAMES ? CALL : callRegex(callNames);
	const lines = withoutLeadingBom(source)
		.split(/\r?\n/)
		.map(stripWhitespaceEnd);
	const claimed = new Set<number>();
	let i = 0;
	while (i < lines.length) {
		if (!MARKER.test(lines[i] as string)) {
			i += 1;
			continue;
		}
		const { next } = idsAt(lines, i, name);
		const hit = next < lines.length ? call.exec(lines[next] as string) : null;
		if (!hit)
			throw new Error(
				`${name}:${i + 1}: '// req:' must sit directly above a ${callNames.map((n) => `${n}(`).join(" or ")} call`,
			);
		claimed.add(next);
		i = next + 1;
	}
	return lines.flatMap((line, index) => {
		const hit = call.exec(line);
		if (!hit || claimed.has(index)) return [];
		return [
			{
				line: index + 1,
				title: (hit[2] as string).replace(/\\(.)/g, "$1").replace(/`/g, ""),
			},
		];
	});
}

/**
 * The opt-in audit listing, always beginning with its count (including zero).
 * Entries sort by the complete project-relative path, then by source line.
 */
export function unclaimedLines(
	root: string,
	options: Pick<CheckOptions, "testRoots" | "callNames"> = {},
): string[] {
	const testRoots = options.testRoots ?? TEST_ROOTS;
	const callNames = options.callNames ?? CALL_NAMES;
	const entries: { path: string; line: number; title: string }[] = [];
	for (const dir of testRoots) {
		const fullDir = join(root, dir);
		if (!existsSync(fullDir)) continue;
		const prefix = dir.replaceAll("\\", "/").replace(/\/$/, "");
		for (const file of testFiles(fullDir)) {
			const path = prefix === "" ? file : `${prefix}/${file}`;
			for (const declaration of unclaimedSource(
				readFileSync(join(fullDir, file), "utf8"),
				path,
				callNames,
			))
				entries.push({ path, ...declaration });
		}
	}
	entries.sort((a, b) =>
		a.path === b.path ? a.line - b.line : a.path < b.path ? -1 : 1,
	);
	return [
		`unclaimed: ${entries.length} test declarations carry no req: marker`,
		...entries.map(({ path, line, title }) => `  ${path}:${line} ${title}`),
	];
}

/** Print the unclaimed listing only when its environment switch is exactly `1`. */
export function printUnclaimed(
	root: string,
	options: Pick<CheckOptions, "testRoots" | "callNames">,
	env: Readonly<Record<string, string | undefined>>,
): void {
	if (env[UNCLAIMED_ENV] !== "1") return;
	for (const line of unclaimedLines(root, options)) console.log(line);
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
	/** Non-failing reconciliation notice for project-owned Part G text. */
	driftLine?: string;
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
	const projectText = withoutLeadingBom(
		readFileSync(join(root, "REQUIREMENTS.md"), "utf8"),
	);
	const generalPath = join(root, GENERAL_REQUIREMENTS_FILE);
	const hasGeneral = existsSync(generalPath);
	const generalText = hasGeneral
		? withoutLeadingBom(readFileSync(generalPath, "utf8"))
		: "";
	assertNoNearMissRows(projectText, "REQUIREMENTS.md");
	if (hasGeneral) assertNoNearMissRows(generalText, GENERAL_REQUIREMENTS_FILE);
	let text = projectText;
	let driftLine: string | undefined;
	if (hasGeneral) {
		const rowCells = (source: string): Map<string, string[]> => {
			const found = new Map<string, string[]>();
			for (const rawLine of source.split(/\r?\n/)) {
				if (requirementRowId(rawLine) === null) continue;
				const match = ROW.exec(stripWhitespaceEnd(rawLine));
				if (!match) continue;
				const cells = (match[2] as string).split("|").map(trimWhitespace);
				if (cells.length !== 3)
					throw new Error(`${match[1]} has malformed table cells`);
				if (found.has(match[1] as string))
					throw new Error(`duplicate id ${match[1]}`);
				found.set(match[1] as string, cells);
			}
			return found;
		};
		loadRequirements(generalText);
		const projectRows = rowCells(projectText);
		const generalRows = rowCells(generalText);
		for (const id of generalRows.keys())
			if (!id.startsWith("G-"))
				throw new Error(
					`${id} is not a Part G id in ${GENERAL_REQUIREMENTS_FILE}`,
				);
		const differences: string[] = [];
		const merged = new Map(
			[...projectRows].filter(([id]) => !id.startsWith("G-")),
		);
		for (const [id, cells] of generalRows) {
			const owned = projectRows.get(id);
			if (owned && owned[0] !== cells[0]) differences.push(id);
			merged.set(id, [
				cells[0] as string,
				owned?.[1] ?? (cells[1] as string),
				owned?.[2] ?? (cells[2] as string),
			]);
		}
		const mergedLines = [...merged].map(
			([id, cells]) => `| ${id} | ${cells.join(" | ")} |`,
		);
		text = `${projectText
			.split(/\r?\n/)
			.map(stripWhitespaceEnd)
			.filter((line) => requirementRowId(line) === null)
			.join("\n")}\n${mergedLines.join("\n")}\n`;
		if (differences.length)
			driftLine = `part g: ${differences.length} cells in REQUIREMENTS.md differ from REQUIREMENTS-general.md (the file governs): ${differences.sort().join(", ")}`;
	}
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
			problems.push(
				`${id} carries ${counts.get(id) ?? 0} shall (one is the form)`,
			);
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
		...(driftLine === undefined ? {} : { driftLine }),
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
	if (result.driftLine) console.log(result.driftLine);
}
