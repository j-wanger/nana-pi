/**
 * @module packages/nana-pack/tests/windows-skip-lines.test.mjs
 * @purpose Pins that each check one of eight test files runs only off Windows prints its own SKIP line, naming the check and a reason, on the branch those files take on Windows.
 * @inputs the eight test files must-meet.md's Design section names (docs/reviews/win-silent-skips-2026-10-19/must-meet.md), read as text from this checkout
 * @outputs PASS/FAIL lines per file on stdout, and exit 1 when any file fails
 * @effects none
 * @errors a failing check prints the unmatched titles, or "no guarded check" with a hint to retire the row; an unexpected throw propagates and fails the run
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

// The separator every SKIP line uses between its check title and its reason. Chosen to match
// the literal must-meet.md's Design section and build-brief-1.md specify for every SKIP line
// this lane writes (win-silent-skips, 2026-10-19).
const SKIP_SEPARATOR = " — ";

// The eight files must-meet.md's Evidence table names as dropping checks silently on Windows
// (docs/reviews/win-silent-skips-2026-10-19/must-meet.md, win-silent-skips, 2026-10-19), one row
// each, R-1950 to R-1957.
const TARGET_FILES = [
	{ req: "R-1950", rel: "packages/nana-pack/tests/requirements-regroup.test.mjs", label: "requirements-regroup.test.mjs" },
	{ req: "R-1951", rel: "packages/nana-pack/tests/requirements-lift.test.mjs", label: "requirements-lift.test.mjs" },
	{ req: "R-1952", rel: "packages/nana-pack/tests/bounded-read.test.mjs", label: "bounded-read.test.mjs" },
	{ req: "R-1953", rel: "packages/nana-pack/tests/adoption-producer.test.mjs", label: "adoption-producer.test.mjs" },
	{ req: "R-1954", rel: "packages/nana-pack/tests/post-edit-hardening.test.mjs", label: "post-edit-hardening.test.mjs" },
	{ req: "R-1955", rel: "packages/nana-pack/tests/adoption-reader.test.mjs", label: "adoption-reader.test.mjs" },
	{ req: "R-1956", rel: "packages/nana-setup/tests/win32-degrade.test.mjs", label: "win32-degrade.test.mjs" },
	{ req: "R-1957", rel: "packages/nana-pack/tests/test-locked.test.mjs", label: "test-locked.test.mjs" },
];

/** A guard-opening line: `if (process.platform !== "win32" ...) {`, its inverted `===` form, or
 * `if (NAME) {` / `if (!NAME) {` where NAME is bound to `process.platform !== "win32"` earlier
 * in the file. Polarity does not change which block is scanned — see design note below. */
const DIRECT_GUARD_RE = /^\s*if\s*\(\s*process\.platform\s*(?:!==|===)\s*"win32"/;
const NAMED_GUARD_RE = /^\s*if\s*\(\s*!?\s*([A-Za-z_$][\w$]*)\s*\)\s*\{\s*$/;
const BIND_RE = /^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*process\.platform\s*!==\s*"win32"\s*;/;
const CHECK_CALL_RE = /\bcheck\(\s*(["'`])/g;

/** Read a quoted literal starting at `startIdx` (the character after the opening quote) on one
 * line. For a backtick string, stops at the first unescaped `${` too, reporting `truncated`. */
function readLiteral(line, startIdx, quote) {
	let i = startIdx;
	let text = "";
	while (i < line.length) {
		const ch = line[i];
		if (ch === "\\") {
			text += ch + (line[i + 1] ?? "");
			i += 2;
			continue;
		}
		if (quote === "`" && ch === "$" && line[i + 1] === "{") return { text, truncated: true };
		if (ch === quote) return { text, truncated: false };
		text += ch;
		i += 1;
	}
	return { text, truncated: false };
}

/** The titles of every `check(` call across `bodyLines`. A template title is taken before its
 * first `${`, trimmed of trailing spaces and a trailing `(`. */
function extractTitles(bodyLines) {
	const titles = [];
	for (const line of bodyLines) {
		const re = new RegExp(CHECK_CALL_RE);
		let m;
		while ((m = re.exec(line))) {
			const { text, truncated } = readLiteral(line, m.index + m[0].length, m[1]);
			let title = text;
			if (truncated) {
				title = title.replace(/\s+$/, "");
				if (title.endsWith("(")) title = title.slice(0, -1).replace(/\s+$/, "");
			}
			titles.push(title);
		}
	}
	return titles;
}

/** Every guard this scanner recognizes in `lines`: `{ start, end, indent }`, where `start` is
 * the guard-opening line and `end` is the line closing the guard's own block at the same
 * indentation (design: "the first later line that starts with the guard's own indentation and
 * `}`"). */
function findGuards(lines) {
	const boundNames = new Set();
	for (const line of lines) {
		const m = line.match(BIND_RE);
		if (m) boundNames.add(m[1]);
	}
	const guards = [];
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const indent = (line.match(/^\s*/) ?? [""])[0];
		const named = line.match(NAMED_GUARD_RE);
		const isDirect = DIRECT_GUARD_RE.test(line) && line.trimEnd().endsWith("{");
		const isNamed = named !== null && boundNames.has(named[1]) && line.trimEnd().endsWith("{");
		if (!isDirect && !isNamed) continue;
		let end = -1;
		for (let k = i + 1; k < lines.length; k += 1) {
			if (lines[k].startsWith(`${indent}}`)) {
				end = k;
				break;
			}
		}
		if (end === -1) continue;
		guards.push({ start: i, end, indent });
	}
	return guards;
}

/** The Windows branch for a guard found by `findGuards`: design says it is "the `} else …` on
 * that line: the rest of the line, or a block to its own `}` at that indentation." `null` when
 * no `} else` sits on the closing line itself (a same-line requirement — an `else` written on
 * its own following line is not recognized). */
function windowsBranchLines(lines, guard) {
	const closeLine = lines[guard.end];
	const rest = closeLine.slice(guard.indent.length);
	const elseMatch = rest.match(/^\}\s*else\s*(.*)$/s);
	if (!elseMatch) return null;
	const tail = elseMatch[1];
	if (tail.trim() === "{") {
		let blockEnd = -1;
		for (let k = guard.end + 1; k < lines.length; k += 1) {
			if (lines[k].startsWith(`${guard.indent}}`)) {
				blockEnd = k;
				break;
			}
		}
		if (blockEnd === -1) return null;
		return lines.slice(guard.end + 1, blockEnd);
	}
	return [tail];
}

/** Read a quoted literal's full content starting at `startIdx`, closing-quote to closing-quote.
 * A backtick template's `${…}` interpolation is not evaluated; its braces are balanced and it
 * contributes one placeholder character, so a reason supplied only through interpolation still
 * counts as present without the scanner having to run the file. */
function readFullLiteral(line, startIdx, quote) {
	let i = startIdx;
	let text = "";
	while (i < line.length) {
		const ch = line[i];
		if (ch === "\\") {
			text += ch + (line[i + 1] ?? "");
			i += 2;
			continue;
		}
		if (ch === quote) return text;
		if (quote === "`" && ch === "$" && line[i + 1] === "{") {
			let depth = 1;
			i += 2;
			while (i < line.length && depth > 0) {
				if (line[i] === "{") depth += 1;
				else if (line[i] === "}") depth -= 1;
				i += 1;
			}
			text += "✱"; // non-space stand-in: an interpolation's own value is not scanned
			continue;
		}
		text += ch;
		i += 1;
	}
	return text; // unterminated on this line — treated as whatever content it had
}

/** Every `console.log(…)` call's full literal content across `windowsLines`. */
function extractSkipLiterals(windowsLines) {
	const literals = [];
	const re = /console\.log\(\s*(["'`])/g;
	for (const line of windowsLines) {
		re.lastIndex = 0;
		let m;
		while ((m = re.exec(line))) {
			literals.push(readFullLiteral(line, m.index + m[0].length, m[1]));
		}
	}
	return literals;
}

/** Does one of `literals` carry its own `SKIP <title><separator><reason>`, with a non-space
 * reason actually inside the literal (not the closing quote or statement punctuation after
 * it)? One literal serves one title: the literal must START with the prefix. */
function hasSkip(literals, title) {
	const prefix = `SKIP ${title}${SKIP_SEPARATOR}`;
	return literals.some((literal) => literal.startsWith(prefix) && /\S/.test(literal.slice(prefix.length)));
}

/** Scans one file for the Design's contract: every check a recognized guard runs only off
 * Windows has a matching SKIP literal on the branch Windows takes. A guard whose Windows branch
 * itself calls `check(` is a counterpart (a check meant to run only on Windows, already paired
 * with its own off-Windows SKIP) and is exempt. */
function scanFile(absPath, label) {
	const lines = fs.readFileSync(absPath, "utf8").split(/\r?\n/);
	const guards = findGuards(lines);
	let totalTitles = 0;
	const unmatched = [];
	for (const guard of guards) {
		const windowsLines = windowsBranchLines(lines, guard);
		if (windowsLines && /\bcheck\(/.test(windowsLines.join("\n"))) continue; // counterpart: exempt
		const literals = windowsLines ? extractSkipLiterals(windowsLines) : [];
		const bodyLines = lines.slice(guard.start + 1, guard.end);
		for (const title of extractTitles(bodyLines)) {
			totalTitles += 1;
			if (!hasSkip(literals, title)) unmatched.push(title);
		}
	}
	if (totalTitles === 0) {
		return { ok: false, reason: `${label}: no guarded check found — retire this row if its Windows guards are gone` };
	}
	if (unmatched.length > 0) {
		return { ok: false, reason: `${label}: missing or malformed SKIP for: ${unmatched.join(" | ")}` };
	}
	return { ok: true, reason: `${label}: ${totalTitles} guarded check(s) each have a matching SKIP` };
}

let fails = 0;
const check = (title, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : why);
	if (!ok) fails += 1;
};

{
	const result = scanFile(path.join(REPO_ROOT, TARGET_FILES[0].rel), TARGET_FILES[0].label);
	// req: R-1950
	check("requirements-regroup.test.mjs: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch", result.ok, result.reason);
}
{
	const result = scanFile(path.join(REPO_ROOT, TARGET_FILES[1].rel), TARGET_FILES[1].label);
	// req: R-1951
	check("requirements-lift.test.mjs: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch", result.ok, result.reason);
}
{
	const result = scanFile(path.join(REPO_ROOT, TARGET_FILES[2].rel), TARGET_FILES[2].label);
	// req: R-1952
	check("bounded-read.test.mjs: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch", result.ok, result.reason);
}
{
	const result = scanFile(path.join(REPO_ROOT, TARGET_FILES[3].rel), TARGET_FILES[3].label);
	// req: R-1953
	check("adoption-producer.test.mjs: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch", result.ok, result.reason);
}
{
	const result = scanFile(path.join(REPO_ROOT, TARGET_FILES[4].rel), TARGET_FILES[4].label);
	// req: R-1954
	check("post-edit-hardening.test.mjs: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch", result.ok, result.reason);
}
{
	const result = scanFile(path.join(REPO_ROOT, TARGET_FILES[5].rel), TARGET_FILES[5].label);
	// req: R-1955
	check("adoption-reader.test.mjs: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch", result.ok, result.reason);
}
{
	const result = scanFile(path.join(REPO_ROOT, TARGET_FILES[6].rel), TARGET_FILES[6].label);
	// req: R-1956
	check("win32-degrade.test.mjs: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch", result.ok, result.reason);
}
{
	const result = scanFile(path.join(REPO_ROOT, TARGET_FILES[7].rel), TARGET_FILES[7].label);
	// req: R-1957
	check("test-locked.test.mjs: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch", result.ok, result.reason);
}

console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
