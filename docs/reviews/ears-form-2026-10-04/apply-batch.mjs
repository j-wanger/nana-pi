#!/usr/bin/env node
/**
 * @module docs/reviews/ears-form-2026-10-04/apply-batch.mjs
 * @purpose Apply one EARS-form split batch mapping (batch-<n>.json) to REQUIREMENTS.md and the `// req:` markers it names, the allowance literal and its seal, and G-013/G-015's evidence cells, then verify the result AGAINST AN EXPLICIT BASE REVISION — every pre-existing row byte-identical unless it is a mapped origin, and every changed line under any test root a `// req:` marker line (one sanctioned seal-literal exception) — refusing and changing nothing on any failed check, PRE-WRITE checks included.
 * @inputs a batch-<n>.json path (argv[2]), an optional `--base <rev>` (default `main`), REQUIREMENTS.md, scripts/requirements-trace.mjs, packages/nana-pack/tests/requirements-trace.test.mjs, every test file a markerEdit names, `git` (diff/show against the base revision), and — only when the mapping sets `mutationRecords: true` — each implemented clause's own `mutations` array (file/break/cite/result)
 * @outputs REQUIREMENTS.md rewritten in place; named marker lines, the allowance literal, its seal and G-013/G-015's evidence counts edited in place; a verification report, the sibling-cite list and the merged list on stdout
 * @effects disk (rewrites the files named above, and restores every one of them to its PRE-RUN content if a post-write check fails), process (exits non-zero on any failed check; spawns `git diff`/`git show` against the base revision and `node scripts/requirements-trace.mjs` to re-measure the rail)
 * @errors exits 1 naming every failed check; every check computable without live files on disk (mutation-record shape and redness, ID existence/block/placement, committed-cell text, the standard evidence sentence) runs BEFORE any write and a failure there leaves every file untouched; the two checks that genuinely need live files (the rail spawn; the whole-branch git diff) run after the write and, on failure, every touched file is restored to its exact pre-write content before exiting 1; re-running over an already-applied mapping is a no-op that still re-verifies against the base revision
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");
const REQUIREMENTS_PATH = join(REPO_ROOT, "REQUIREMENTS.md");
const RAIL_SCRIPT = join(REPO_ROOT, "scripts", "requirements-trace.mjs");
const RAIL_TEST = join(REPO_ROOT, "packages", "nana-pack", "tests", "requirements-trace.test.mjs");
const RAIL_TEST_REL = "packages/nana-pack/tests/requirements-trace.test.mjs";

const ROW = /^\|\s*([RG]-\d{3})\s*\|(.*)\|\s*$/;
const MARKER_LINE = /^\s*\/\/\s*req:\s*(.+?)\s*$/;
const SHALL = /(?<![A-Za-z0-9_])shall(?![A-Za-z0-9_])/gi;
/** A path this repo's test runner collects from (scripts/test.mjs's TEST_ROOTS). */
const TEST_ROOT = /(^|\/)(tests|test)\//;

function maskCodeSpans(text) {
	let out = "", i = 0;
	while (i < text.length) {
		if (text[i] !== "`") { out += text[i]; i++; continue; }
		let j = i;
		while (j < text.length && text[j] === "`") j++;
		const n = j - i;
		let k = j, closeEnd = -1;
		while (k < text.length) {
			if (text[k] !== "`") { k++; continue; }
			let m = k;
			while (m < text.length && text[m] === "`") m++;
			if (m - k === n) { closeEnd = m; break; }
			k = m;
		}
		if (closeEnd === -1) { out += text.slice(i, j); i = j; }
		else { out += " "; i = closeEnd; }
	}
	return out;
}

const preWriteFails = [];
const postWriteFails = [];
let fails = preWriteFails; // which bucket `must()` appends to — swapped after the write
function must(label, ok, detail = "") {
	if (!ok) fails.push(detail ? `${label}: ${detail}` : label);
	return ok;
}
function abort(msg) {
	console.error(`REFUSED: ${msg}`);
	process.exit(1);
}
function git(args) {
	const r = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
	if (r.status !== 0) abort(`git ${args.join(" ")} failed: ${r.stderr || r.stdout}`);
	return r.stdout;
}

// ---------------------------------------------------------------------------
// 0. Args: the mapping and the base revision every branch-level claim is checked against.
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const batchPath = argv.find((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--base");
if (!batchPath) abort("usage: node apply-batch.mjs <batch-n.json> [--base <rev>]");
const baseFlagIdx = argv.indexOf("--base");
const BASE = baseFlagIdx !== -1 ? argv[baseFlagIdx + 1] : "main";
if (baseFlagIdx !== -1 && !BASE) abort("--base needs a revision");

const batch = JSON.parse(readFileSync(resolve(process.cwd(), batchPath), "utf8"));
const batchLabel = String(batch.batch);
const batchDate = batch.date;
const oldAllowance = batch.allowanceBefore;
const newAllowance = batch.allowanceAfter;

// ---------------------------------------------------------------------------
// 1. Read REQUIREMENTS.md, index every row currently present.
// ---------------------------------------------------------------------------
const reqTextBefore = readFileSync(REQUIREMENTS_PATH, "utf8");
const linesBefore = reqTextBefore.split("\n");
const idLineBefore = new Map(); // id -> line index
for (let i = 0; i < linesBefore.length; i++) {
	const m = ROW.exec(linesBefore[i]);
	if (m) idLineBefore.set(m[1], i);
}
const preExistingIds = new Set(idLineBefore.keys());

/**
 * The evidence cell for one clause. `implemented` cells join `cites` in backticks.
 * Any other clause may carry its own explicit `evidence` string (a deviation, a
 * residual, a merge rationale, or a precise PARTIAL-fix note) — used verbatim.
 * With neither, the origin's own (pre-split, untouched) clause reads "—", and a
 * genuine SPLIT row gets the standard sentence, auto-generated so the mapping
 * need not repeat it for every untested row.
 */
function evidenceCell(clause, originId) {
	if (clause.status === "implemented") {
		if (!clause.cites || clause.cites.length === 0) abort(`${clause.id}: implemented with no cites`);
		return clause.cites.map((c) => `\`${c}\``).join(", ");
	}
	if (typeof clause.evidence === "string" && clause.evidence.trim() !== "") return clause.evidence;
	if (clause.id === originId) return "—";
	return `split from ${originId} ${batchDate} (EARS form batch ${batchLabel}): no test pins this clause`;
}

function rowLine(clause, originId) {
	return `| ${clause.id} | ${clause.text} | ${clause.status} | ${evidenceCell(clause, originId)} |`;
}

// ---------------------------------------------------------------------------
// 2. For each origin, compute the target lines and where they land. Pure
// computation — nothing on disk changes in this section or any section below
// it until the WRITE step explicitly marked as such.
// ---------------------------------------------------------------------------
const rowsAddedThisBatch = [];
const edits = []; // { lineIndex, kind: 'replace'|'insert-after', text }
const allClauses = []; // flat list of every clause across every origin, for later checks

for (const origin of batch.origins) {
	const originId = origin.origin;
	const lineIdx = idLineBefore.get(originId);
	if (lineIdx === undefined) abort(`origin ${originId} not found in REQUIREMENTS.md`);
	const clauses = origin.clauses;
	if (clauses[0].id !== originId) abort(`${originId}: clauses[0].id must equal the origin id`);
	for (const c of clauses) allClauses.push({ ...c, originId });

	const targetOriginLine = rowLine(clauses[0], originId);
	if (linesBefore[lineIdx].trim() !== targetOriginLine.trim()) {
		edits.push({ lineIndex: lineIdx, kind: "replace", text: targetOriginLine, id: originId });
	}

	const newClauses = clauses.slice(1);
	if (newClauses.length === 0) continue; // merged: nothing to insert

	// Idempotency: how many of the following lines already carry this origin's
	// new-row ids, in order?
	let already = 0;
	while (
		already < newClauses.length &&
		idLineBefore.get(newClauses[already].id) === lineIdx + 1 + already
	) already++;

	if (already === newClauses.length) {
		// fully present already: verify each matches, byte for byte
		for (let k = 0; k < newClauses.length; k++) {
			const want = rowLine(newClauses[k], originId);
			const got = linesBefore[lineIdx + 1 + k];
			if (got.trim() !== want.trim())
				abort(`${newClauses[k].id}: already present but does not match the mapping (got: ${got})`);
		}
		continue;
	}
	if (already !== 0) abort(`${originId}: partial prior application detected (${already}/${newClauses.length} siblings present) — resolve by hand`);

	// Collision guard: a new id already existing ANYWHERE else (not directly after its
	// origin) is a conflict to refuse, never to silently duplicate or overwrite.
	for (const c of newClauses) {
		if (idLineBefore.has(c.id)) abort(`${c.id}: already exists elsewhere in REQUIREMENTS.md with different content — refusing to guess`);
	}

	// nothing present: insert all new rows directly after the origin line, in order
	edits.push({
		lineIndex: lineIdx,
		kind: "insert-after",
		texts: newClauses.map((c) => rowLine(c, originId)),
	});
	for (const c of newClauses) rowsAddedThisBatch.push(c.id);
}

// ---------------------------------------------------------------------------
// 3. Rebuild REQUIREMENTS.md IN MEMORY: apply replacements, then insertions, by
// line index. Still nothing on disk.
// ---------------------------------------------------------------------------
const replaceByLine = new Map(edits.filter((e) => e.kind === "replace").map((e) => [e.lineIndex, e.text]));
const insertByLine = new Map(edits.filter((e) => e.kind === "insert-after").map((e) => [e.lineIndex, e.texts]));

const rebuilt = [];
for (let i = 0; i < linesBefore.length; i++) {
	rebuilt.push(replaceByLine.has(i) ? replaceByLine.get(i) : linesBefore[i]);
	if (insertByLine.has(i)) for (const t of insertByLine.get(i)) rebuilt.push(t);
}

// G-013's evidence cell: the count only.
const g013Idx = rebuilt.findIndex((l) => ROW.exec(l)?.[1] === "G-013");
if (g013Idx === -1) abort("G-013 row not found");
{
	const line = rebuilt[g013Idx];
	const oldCount = String(batch.measuredOffFormBeforeBatch);
	const newCount = String(batch.measuredOffFormAfterBatch);
	if (line.includes(`${newCount} rows off form`)) {
		// already applied
	} else if (line.includes(`${oldCount} rows off form`)) {
		rebuilt[g013Idx] = line.replace(`${oldCount} rows off form`, `${newCount} rows off form`);
	} else {
		abort(`G-013 evidence cell carries neither ${oldCount} nor ${newCount}: ${line}`);
	}
}

// G-015's evidence cell cites the seal test's TITLE, which embeds the allowance number —
// it must track the same literal the seal itself is being moved to (both seals carry the
// new count), the same narrow count-only edit as G-013.
const g015Idx = rebuilt.findIndex((l) => ROW.exec(l)?.[1] === "G-015");
if (g015Idx === -1) abort("G-015 row not found");
{
	const line = rebuilt[g015Idx];
	const oldStr = `seal: EARS_ALLOWANCE is ${oldAllowance} (G-015)`;
	const newStr = `seal: EARS_ALLOWANCE is ${newAllowance} (G-015)`;
	if (line.includes(newStr)) {
		// already applied
	} else if (line.includes(oldStr)) {
		rebuilt[g015Idx] = line.replace(oldStr, newStr);
	} else {
		abort(`G-015 evidence cell carries neither '${oldStr}' nor '${newStr}'`);
	}
}

const reqTextAfter = rebuilt.join("\n");

// ---------------------------------------------------------------------------
// 4. The allowance literal + its seal — computed in memory.
// ---------------------------------------------------------------------------
const railTextBefore = readFileSync(RAIL_SCRIPT, "utf8");
let railTextAfter = railTextBefore;
{
	const oldDecl = `export const EARS_ALLOWANCE = ${oldAllowance};`;
	const newDecl = `export const EARS_ALLOWANCE = ${newAllowance};`;
	if (railTextBefore.includes(newDecl)) {
		// already applied
	} else if (railTextBefore.includes(oldDecl)) {
		railTextAfter = railTextBefore.replace(oldDecl, newDecl);
	} else {
		abort(`scripts/requirements-trace.mjs carries neither '${oldDecl}' nor '${newDecl}'`);
	}
}

const railTestTextBefore = readFileSync(RAIL_TEST, "utf8");
let railTestTextAfter = railTestTextBefore;
{
	const oldSealStr = `"seal: EARS_ALLOWANCE is ${oldAllowance} (G-015)"`;
	const newSealStr = `"seal: EARS_ALLOWANCE is ${newAllowance} (G-015)"`;
	const oldCmp = `EARS_ALLOWANCE === ${oldAllowance}`;
	const newCmp = `EARS_ALLOWANCE === ${newAllowance}`;
	const alreadySeal = railTestTextBefore.includes(newSealStr) && railTestTextBefore.includes(newCmp);
	const hasOld = railTestTextBefore.includes(oldSealStr) && railTestTextBefore.includes(oldCmp);
	if (alreadySeal) {
		// already applied
	} else if (hasOld) {
		railTestTextAfter = railTestTextAfter.replace(oldSealStr, newSealStr).replace(oldCmp, newCmp);
	} else {
		abort(`${RAIL_TEST} does not carry the expected old seal literal`);
	}
}

// ---------------------------------------------------------------------------
// 5. Marker edits, computed in memory. `new: null` DELETES the marker line
// entirely (symmetric with `old: null`, which INSERTS a brand-new one). Either
// way the anchor line itself — the `check(`/`test(`/`it(` call — is never
// touched.
// ---------------------------------------------------------------------------
const fileCache = new Map(); // path -> { before, lines }
function loadFile(path) {
	if (!fileCache.has(path)) {
		const before = readFileSync(path, "utf8");
		fileCache.set(path, { before, lines: before.split("\n") });
	}
	return fileCache.get(path);
}

const markerEdits = batch.origins.flatMap((o) => o.markerEdits ?? []);
for (const me of markerEdits) {
	const abs = join(REPO_ROOT, me.file);
	const f = loadFile(abs);
	const anchorHits = [];
	for (let i = 0; i < f.lines.length; i++) if (f.lines[i].includes(me.anchor)) anchorHits.push(i);
	if (anchorHits.length !== 1)
		abort(`${me.file}: anchor '${me.anchor}' matched ${anchorHits.length} lines, expected exactly 1`);
	const anchorIdx = anchorHits[0];
	const aboveIdx = anchorIdx - 1;
	const above = f.lines[aboveIdx];

	if (me.old === null) {
		// insertion: a brand-new marker line directly above the anchor
		if (above.trim() === me.new.trim()) continue; // already applied
		f.lines.splice(anchorIdx, 0, me.new);
		continue;
	}

	if (me.new === null) {
		// deletion: the marker that used to sit here is no longer needed by anything
		if (above.trim() !== me.old.trim()) continue; // already applied (or never there) — nothing to delete
		f.lines.splice(aboveIdx, 1);
		continue;
	}

	if (above.trim() === me.new.trim()) continue; // already applied
	if (above.trim() !== me.old.trim())
		abort(`${me.file}:${aboveIdx + 1}: expected '${me.old}' directly above the '${me.anchor}' line, found '${above}'`);
	f.lines[aboveIdx] = me.new;
}

// ===========================================================================
// PRE-WRITE VALIDATION — every check computable from the IN-MEMORY computed
// text above, with NOTHING read back from disk and NOTHING written yet. A
// failure here (astra r2 MUST) leaves every file byte-identical to its state
// before this process started, because none of them has been touched.
// ===========================================================================
const afterLines = reqTextAfter.split("\n");
const idLineAfterMem = new Map();
for (let i = 0; i < afterLines.length; i++) {
	const m = ROW.exec(afterLines[i]);
	if (m) idLineAfterMem.set(m[1], i);
}
const touchedIds = new Set(allClauses.map((c) => c.id));

// (a) BRANCH-LEVEL: every pre-existing (base) row is byte-identical in the final
// file unless it is a mapped origin. Reads REQUIREMENTS.md at BASE directly —
// not this run's own pre-state — so a row mutated earlier in the branch (by
// hand, by another tool, by anything) is caught, not just a mutation from THIS
// invocation. `git show` reads the BASE REVISION's object, never the working
// tree, so this is safe to run before any write.
const baseReqText = git(["show", `${BASE}:REQUIREMENTS.md`]);
const baseRowById = new Map();
for (const line of baseReqText.split("\n")) {
	const m = ROW.exec(line);
	if (m) baseRowById.set(m[1], line);
}
for (const [id, baseLine] of baseRowById) {
	must("pre-existing id missing from the final file", idLineAfterMem.has(id), id);
	if (!idLineAfterMem.has(id)) continue;
	if (touchedIds.has(id) || id === "G-013" || id === "G-015") continue; // declared per-batch edits
	const finalLine = afterLines[idLineAfterMem.get(id)];
	must("untouched row changed since base", finalLine === baseLine, `${id} (base ${BASE})`);
}
// every id this mapping claims as an origin must actually have existed at base
// (otherwise it is not "a pre-existing row this batch may touch" — it is new).
for (const origin of batch.origins) {
	must("origin not present at base — not a legitimate split target", baseRowById.has(origin.origin), `${origin.origin} @ ${BASE}`);
}

// (b) every new id inside ITS OWN origin's declared continuation block (design-ruling.md
// §2's table). Generalized across packages so this script needs no change in later batches.
const PACKAGE_BLOCKS = [
	{ name: "pack", own: [[1, 199], [700, 755]], continuation: [[756, 879]] },
	{ name: "knowledge", own: [[200, 249]], continuation: [[880, 909]] },
	{ name: "stage", own: [[250, 299]], continuation: [[250, 299]] }, // "none": new rows draw from its own free numbers
	{ name: "installer", own: [[300, 399]], continuation: [[920, 939]] },
	{ name: "desk", own: [[400, 499]], continuation: [[940, 959]] },
	{ name: "bench", own: [[500, 599]], continuation: [[500, 599]] }, // "none": same as stage
	{ name: "runner", own: [[600, 619]], continuation: [[910, 919]] },
];
function packageFor(id) {
	if (id[0] === "G") return { name: "general", continuation: [[1, 9999]] };
	const n = Number(id.slice(2));
	return PACKAGE_BLOCKS.find((p) => p.own.some(([a, b]) => n >= a && n <= b)) ?? null;
}
for (const origin of batch.origins) {
	const pkg = packageFor(origin.origin);
	must("origin's package is not a recognized ID block", !!pkg, origin.origin);
	if (!pkg) continue;
	for (const c of origin.clauses.slice(1)) {
		const n = Number(c.id.slice(2));
		must(
			"new id outside its origin's declared continuation block",
			pkg.continuation.some(([a, b]) => n >= a && n <= b),
			`${c.id} (origin ${origin.origin}, package ${pkg.name})`,
		);
	}
}

// (c) every new id directly after its origin or previous sibling.
for (const origin of batch.origins) {
	const originId = origin.origin;
	const newIds = origin.clauses.slice(1).map((c) => c.id);
	let prevLine = idLineAfterMem.get(originId);
	for (const id of newIds) {
		const line = idLineAfterMem.get(id);
		must("new id not directly after its origin/sibling", line === prevLine + 1, `${id} after ${originId}`);
		prevLine = line;
	}
}

// (d) every committed cell equals the mapping's text.
for (const origin of batch.origins) {
	for (const clause of origin.clauses) {
		const line = idLineAfterMem.get(clause.id);
		const want = rowLine(clause, origin.origin);
		const got = afterLines[line];
		must("committed cell mismatch", got.trim() === want.trim(), clause.id);
	}
}

// (g) every implemented split row names an assertion in the mapping.
for (const clause of allClauses) {
	if (clause.status === "implemented") must("implemented clause has no assertion", !!clause.assertion && clause.assertion.length > 0, clause.id);
}

// (g2) OPT-IN (batch.mutationRecords === true, A2 onward): an implemented clause's "an
// executed mutation is the only evidence" rule, made mechanical. A code-read ("this is
// clearly a different function") is not a mutation record and does not satisfy this check.
// EVERY entry in a clause's `mutations` array is validated individually (astra r2 SHOULD —
// a single `some(valid)` let one well-formed record cover for a malformed sibling): each must
// name the file changed (`file`, non-empty), what was broken (`break`, non-empty prose), which
// of the CLAUSE'S OWN `cites` it targeted (`cite`, must be a member of `cites`) and the
// observed `result` (exactly "red" or "green" — no other value is a real observation). Beyond
// per-record shape, at least one well-formed entry per implemented clause must read
// `result: "red"`. batch-a1.json predates this field and carries none, so the check is gated
// behind the flag rather than applied unconditionally — the smaller change (see this header
// and the batch-a2 land notes for why retrofitting A1's two review files into structured
// records was rejected as the larger one).
if (batch.mutationRecords === true) {
	for (const clause of allClauses) {
		if (clause.status !== "implemented") continue;
		const muts = clause.mutations;
		const citeSet = new Set(clause.cites ?? []);
		must("implemented clause has no mutations array", Array.isArray(muts) && muts.length > 0, clause.id);
		if (!Array.isArray(muts)) continue;
		let anyRed = false;
		muts.forEach((m, i) => {
			const shapeOk =
				m && typeof m === "object" &&
				typeof m.file === "string" && m.file.length > 0 &&
				typeof m.break === "string" && m.break.length > 0 &&
				typeof m.cite === "string" && citeSet.has(m.cite) &&
				(m.result === "red" || m.result === "green");
			must(`mutation record #${i} is malformed, or cites outside the clause's own citations`, shapeOk, clause.id);
			if (shapeOk && m.result === "red") anyRed = true;
		});
		must("implemented clause has no recorded red mutation (mutationRecords: true)", anyRed, clause.id);
	}
}

// (h) every untested/violated/planned split row (new, not origin) WITHOUT its own
// explicit `evidence` override carries the standard evidence sentence.
for (const origin of batch.origins) {
	for (const clause of origin.clauses.slice(1)) {
		if (clause.status === "implemented") continue;
		if (typeof clause.evidence === "string" && clause.evidence.trim() !== "") continue; // explicit override: no standard sentence required
		const want = `split from ${origin.origin} ${batchDate} (EARS form batch ${batchLabel}): no test pins this clause`;
		const got = afterLines[idLineAfterMem.get(clause.id)];
		must("untested split row missing the standard evidence sentence", got.includes(want), clause.id);
	}
}

// Sibling-cite list + merged list — pure computation over the mapping, available any time.
const siblingCites = [];
for (const origin of batch.origins) {
	const originCites = JSON.stringify([...(origin.clauses[0].cites ?? [])].sort());
	for (const clause of origin.clauses.slice(1)) {
		if (clause.status !== "implemented") continue;
		const theirs = JSON.stringify([...(clause.cites ?? [])].sort());
		if (theirs === originCites) siblingCites.push(clause.id);
	}
}

if (preWriteFails.length) {
	console.log(`batch ${batchLabel} (base ${BASE}): PRE-WRITE CHECKS FAILED — nothing written`);
	for (const f of preWriteFails) console.log(`  FAIL: ${f}`);
	process.exit(1);
}

// ===========================================================================
// WRITE — only reached once every pre-write check above has passed.
// ===========================================================================
if (reqTextAfter !== reqTextBefore) writeFileSync(REQUIREMENTS_PATH, reqTextAfter);
if (railTextAfter !== railTextBefore) writeFileSync(RAIL_SCRIPT, railTextAfter);
if (railTestTextAfter !== railTestTextBefore) writeFileSync(RAIL_TEST, railTestTextAfter);
for (const [path, f] of fileCache) {
	const after = f.lines.join("\n");
	if (after !== f.before) writeFileSync(path, after);
}

/** Undo every write this run made, restoring each touched file to its exact pre-run bytes. */
function rollback() {
	if (reqTextAfter !== reqTextBefore) writeFileSync(REQUIREMENTS_PATH, reqTextBefore);
	if (railTextAfter !== railTextBefore) writeFileSync(RAIL_SCRIPT, railTextBefore);
	if (railTestTextAfter !== railTestTextBefore) writeFileSync(RAIL_TEST, railTestTextBefore);
	for (const [path, f] of fileCache) {
		if (f.lines.join("\n") !== f.before) writeFileSync(path, f.before);
	}
}

// ===========================================================================
// POST-WRITE VALIDATION — the two checks that genuinely need live files on
// disk (a child-process rail run; a whole-branch `git diff` against BASE, which
// reads the WORKING TREE, not an in-memory string). On any failure here, every
// file this run touched is rolled back to its exact pre-write content before
// exiting 1, so a refusal is byte-identical to a no-op regardless of which
// check — pre-write or post-write — caught the problem (astra r2 MUST).
// ===========================================================================
fails = postWriteFails;

const finalReqText = readFileSync(REQUIREMENTS_PATH, "utf8");
const finalLines = finalReqText.split("\n");
const idLineAfter = new Map();
for (let i = 0; i < finalLines.length; i++) {
	const m = ROW.exec(finalLines[i]);
	if (m) idLineAfter.set(m[1], i);
}

// (e)+(f) the rail is green; batch sections at zero off form; ears:/seal/G-013 carry the new count.
const railRun = spawnSync(process.execPath, [RAIL_SCRIPT], { encoding: "utf8", cwd: REPO_ROOT });
must("rail exit code", railRun.status === 0, `exit ${railRun.status}\n${railRun.stdout}\n${railRun.stderr}`);
const earsLineOut = (railRun.stdout ?? "").split("\n").find((l) => l.startsWith("ears: "));
must("ears: line carries the new allowance", earsLineOut === `ears: ${newAllowance} rows off form (allowance ${newAllowance})`, earsLineOut);

const countsNow = new Map();
for (const line of finalLines) {
	const m = ROW.exec(line);
	if (!m) continue;
	const cells = m[2].split("|").map((c) => c.trim());
	if (cells.length !== 3) continue;
	countsNow.set(m[1], (maskCodeSpans(cells[0]).match(SHALL) ?? []).length);
}
for (const clause of allClauses) {
	const status = finalLines[idLineAfter.get(clause.id)].split("|").map((c) => c.trim())[2];
	if (status === "retired") continue;
	must("batch row still off form", countsNow.get(clause.id) === 1, clause.id);
}

must("G-013 evidence carries the new count", finalLines[g013Idx].includes(`${newAllowance} rows off form`), finalLines[g013Idx]);
must("rail script carries the new allowance literal", readFileSync(RAIL_SCRIPT, "utf8").includes(`EARS_ALLOWANCE = ${newAllowance};`));
must("rail test seal carries the new allowance", readFileSync(RAIL_TEST, "utf8").includes(`seal: EARS_ALLOWANCE is ${newAllowance} (G-015)`));

// (i) BRANCH-LEVEL, WHOLE-DIFF: every changed line under ANY test root, across the
// FULL diff against base (not just files named in markerEdits, not stopping at the
// first divergence), must itself be a `// req:` marker line — i.e. no assertion
// moved anywhere this batch could have touched. One sanctioned exception: the seal
// literal in requirements-trace.test.mjs (the allowance number embedded in both the
// check's title and its comparison), which design-ruling.md's allowlist explicitly
// permits each batch to move.
const changedFiles = git(["diff", BASE, "--name-only"]).split("\n").filter(Boolean);
const testRootFiles = changedFiles.filter((f) => TEST_ROOT.test(f));
/**
 * The seal line's COMPLETE, normalized form — anchored start to end, only the two
 * numeric literals (which must agree with each other and with old/new allowance)
 * free to vary. A substring match (the round-2 defect astra found) would let
 * `EARS_ALLOWANCE === 157 || true` through, since that text still CONTAINS the
 * valid substring; the trailing ` || true` only breaks a full-line anchor.
 */
const SEAL_LINE = /^check\("seal: EARS_ALLOWANCE is (\d+) \(G-015\)", EARS_ALLOWANCE === (\d+)\);$/;
function isSanctionedSealLine(content) {
	const m = SEAL_LINE.exec(content.trim());
	if (!m) return false;
	if (m[1] !== m[2]) return false; // the title's number and the comparison's number must agree
	return m[1] === String(oldAllowance) || m[1] === String(newAllowance);
}
for (const f of testRootFiles) {
	const patch = git(["diff", BASE, "--", f]);
	for (const line of patch.split("\n")) {
		if (line.length === 0) continue;
		const marker = line[0];
		if (marker !== "+" && marker !== "-") continue; // diff metadata (diff/index/---/+++/@@): not content
		if (marker === "+" && line.startsWith("+++")) continue;
		if (marker === "-" && line.startsWith("---")) continue;
		const content = line.slice(1);
		if (MARKER_LINE.test(content)) continue;
		if (f === RAIL_TEST_REL && isSanctionedSealLine(content)) continue; // sanctioned per-batch seal move, whole line only
		must("non-marker line changed under a test root", false, `${f}: ${JSON.stringify(content)}`);
	}
}

if (postWriteFails.length) {
	rollback();
	console.log(`batch ${batchLabel} (base ${BASE}): POST-WRITE CHECKS FAILED — rolled back, every file restored`);
	for (const f of postWriteFails) console.log(`  FAIL: ${f}`);
	process.exit(1);
}

console.log(`batch ${batchLabel} (base ${BASE}): ALL CHECKS GREEN`);
console.log(`rows added: ${rowsAddedThisBatch.length} (${rowsAddedThisBatch.join(", ")})`);
console.log(`sibling-cite list (${siblingCites.length}): ${siblingCites.join(", ") || "(none)"}`);
console.log(`merged (${(batch.merged ?? []).length}): ${(batch.merged ?? []).map((m) => `${m.origin} — ${m.reason}`).join(" | ") || "(none)"}`);
console.log(railRun.stdout);

process.exit(0);
