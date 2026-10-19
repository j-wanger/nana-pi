/**
 * @module packages/nana-pack/tests/requirements-tree.test.mjs
 * @purpose Pins the capability-tree requirements on the real ledger and proves each structural rule and outline field rejects a broken fixture.
 * @inputs REQUIREMENTS.md, docs/requirements-tree.md, scripts/requirements-tree.mjs and temporary ledger fixtures.
 * @outputs PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
 * @effects disk (reads repository files and creates fixtures under the OS temp directory)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { ID } from "../../../scripts/requirements-trace.mjs";
import { checkTree, renderOutline, parseLedger, checkOutlineFields, compressRowIds, expandRowIds, readRequirementRows, descendants, ledgerReadProblem } from "../../../scripts/requirements-tree.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const root = new URL("../../../", import.meta.url);
const ledger = readFileSync(process.env.REQ_TREE_LEDGER_PATH ?? new URL("REQUIREMENTS.md", root), "utf8");
const map = readFileSync(new URL("docs/requirements-tree.md", root), "utf8");
const actual = checkTree(ledger);
const row = (id) => ledger.split("\n").find((line) => line.startsWith(`| ${id} |`)) ?? "";
// req: R-287
check("R-287: every real requirement row is in a feature or subgroup table", actual.problems.every((p) => !p.includes("not in a feature or subgroup table")) && row("R-287").startsWith("| R-287 | Every requirement row in REQUIREMENTS.md shall sit in a table"), actual.problems.join("; "));
// req: R-288
check("R-288: all real headings have non-empty purposes", actual.parsed.headings.length === 68 && actual.parsed.headings.every((h) => h.purpose.length > 0), `${actual.parsed.headings.length} headings`);
// req: R-288
check("R-288: real ledger has no structural problems", actual.problems.length === 0, actual.problems.join("; "));
// req: R-289
check("R-289: real capability, feature and subgroup IDs are unique", actual.problems.every((p) => !p.includes("duplicate heading ID")), actual.problems.join("\n"));
// req: R-290
check("R-290: real feature and subgroup headings have direct-level parents", actual.problems.every((p) => !p.includes("nested under")), actual.problems.join("\n"));
// req: R-291
check("R-291: committed outline equals a fresh render", map === actual.outline, "committed outline differs from renderOutline");
// req: R-291
check("R-291: committed outline fields and row IDs match the real ledger", checkOutlineFields(map, actual.parsed).length === 0, checkOutlineFields(map, actual.parsed).join("; "));
// req: R-291
check("R-291: every real heading's committed IDs survive expansion and leaf counts total 1,279", (() => {
  const outlineLines = map.split("\n");
  let leafTotal = 0;
  for (const heading of actual.parsed.headings) {
    const titleIndex = outlineLines.findIndex((value) => value.includes(`**${heading.id} · `));
    const line = outlineLines[titleIndex + (heading.id.startsWith("FEAT-") ? 4 : 2)];
    const ids = expandRowIds(line?.match(/IDs: (.+)$/)?.[1] ?? "");
    const children = actual.parsed.headings.some((candidate) => candidate.parent === heading);
    const source = children
      ? actual.parsed.headings.filter((candidate) => candidate === heading || isDescendant(candidate, heading)).flatMap((candidate) => candidate.rows)
      : heading.rows;
    if (!children) leafTotal += heading.rows.length;
    if (ids.length !== source.length || [...ids].sort().join(",") !== [...source].sort().join(",")) return false;
  }
  return leafTotal === 1279;
})(), "committed IDs differ or leaf total is not 1,279");
function isDescendant(candidate, ancestor) {
  let parent = candidate.parent;
  while (parent) { if (parent === ancestor) return true; parent = parent.parent; }
  return false;
}
const feat033 = actual.parsed.headings.find((h) => h.id === "FEAT-033");
const parsedForReader = parseLedger(`# CAP-01 · Cap\nPurpose: capability\nOutcome: a visible outcome\n\n## FEAT-001 · Home\nPurpose: feature\nStatus: active\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| G-001 | A requirement text. | implemented | test cite |\n| R-1000 | A four-digit requirement. | planned | — |\n`);
const rowsForReader = readRequirementRows(parsedForReader);
// req: R-287
check("row reader returns text, G and four-digit rows in document order", rowsForReader.length === 2 && rowsForReader[0].id === "G-001" && rowsForReader[0].requirement === "A requirement text." && rowsForReader[0].status === "implemented" && rowsForReader[0].evidence === "test cite" && rowsForReader[0].line === 10 && rowsForReader[1].id === "R-1000", JSON.stringify(rowsForReader));
// req: R-288
check("capability Outcome is recorded", parsedForReader.headings[0].outcome === "a visible outcome", parsedForReader.headings[0].outcome);
// req: R-287
check("row reader returns its owning heading and descendant walk reaches it", rowsForReader[0].heading.id === "FEAT-001" && descendants(parsedForReader, parsedForReader.headings[0]).some((heading) => heading.id === "FEAT-001"), "owning heading or descendant walk differs");
const sharedRowsParsed = parseLedger(`# CAP-01 · Cap\nPurpose: cap\n\n## FEAT-001 · Home\nPurpose: home\nStatus: active\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | A shared row. | untested | — |\n\n## FEAT-002 · Consumer\nPurpose: consumer\nStatus: active\nAlso applies: R-001\n`);
// req: R-292
check("shared row reader retains its owning home heading", readRequirementRows(sharedRowsParsed).find((row) => row.id === "R-001")?.heading.id === "FEAT-001", "shared owner lost");
// req: R-291
check("R-291: FEAT-033 preserves G row IDs", feat033.rows.includes("G-001") && !feat033.rows.includes("R-001") && map.includes("G-001–G-022") && !map.includes("R-001–R-022"), feat033.rows.join(", "));
// req: R-291
check("R-291: parent row counts aggregate descendants", actual.parsed.headings.filter((h) => h.level < 3 && actual.parsed.headings.some((child) => child.parent === h)).every((h) => {
  const descendantRows = actual.parsed.headings.filter((child) => child === h || isDescendant(child, h)).flatMap((child) => child.rows);
  const lines = map.split("\n");
  const index = lines.findIndex((value) => value.includes(`**${h.id} · `));
  const line = lines[index + (h.id.startsWith("FEAT-") ? 4 : 2)];
  return Number(line?.match(/Rows: (\d+)/)?.[1]) === descendantRows.length && expandRowIds(line?.match(/IDs: (.+)$/)?.[1] ?? "").length === descendantRows.length;
}), "parent count differs from its descendants");

// req: R-291
check("R-291: feature outline carries status and shared IDs", checkOutlineFields(map, actual.parsed).length === 0 && map.includes("Status: active") && map.includes("Also applies: R-") && map.includes("| ID | Home | Also applies to | Count |"), checkOutlineFields(map, actual.parsed).join("; "));
const rowPrefix = new RegExp("^\\| " + ID.source.slice(1, -1) + " \\|");
const sharedRow = actual.outline.split("\n").find((line) => rowPrefix.test(line));
// req: R-291
check("R-291 fixture: outline field check rejects a missing shared-index row", Boolean(sharedRow) && checkOutlineFields(actual.outline.replace(`${sharedRow}\n`, ""), actual.parsed).some((p) => p.includes("index")), "shared index row was not detected");
const multiListerRow = actual.outline.split("\n").find((line) => rowPrefix.test(line) && line.split("|")[3].trim().includes(", "));
// req: R-291
check("R-291 fixture: field check rejects one sharing feature removed from an index row", Boolean(multiListerRow) && checkOutlineFields(actual.outline.replace(multiListerRow, multiListerRow.replace(/, FEAT-\d{3}/, "")), actual.parsed).some((p) => p.includes("index")), "missing sharing feature was not detected");
// req: R-292
check("R-292: real shared IDs exist once, are live, and belong to another feature", actual.problems.every((p) => !p.includes("Also applies")), actual.problems.join("; "));
// req: R-293
check("R-293: every real feature has a valid status", actual.parsed.headings.filter((h) => h.id?.startsWith("FEAT-")).every((h) => ["active", "frozen", "retired", "proposed"].includes(h.status?.split(" ")[0])), actual.problems.join("; "));
// req: R-294
check("R-294: proposed and retired real features hold no rows", actual.problems.every((p) => !p.includes("holds rows")), actual.problems.join("; "));
const fixture = (body) => `# CAP-01 · A\nPurpose: cap\n\n## FEAT-001 · B\nPurpose: feat\nStatus: active\n\n${body}\n`;
const cases = [
  ["row outside feature", "# CAP-01 · A\nPurpose: cap\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-999 | A shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("R-999"))],
  ["row under ordinary heading", "### Ordinary heading\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-999 | A shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("R-999"))],
  ["row after prose in feature", "prose\n| R-999 | A shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("line") && p.includes("R-999"))],
  ["row after blank after table", "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-998 | A shall work. | untested | — |\n\n| R-999 | B shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("R-999"))],
  ["header without delimiter", "| ID | Requirement | Status | Evidence |\n| R-999 | A shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("R-999"))],
  ["row in fenced code", "```md\n| R-999 | A shall work. | untested | — |\n```", (r) => r.problems.some((p) => p.includes("R-999"))],
  ["setext heading closes feature table", "# CAP-01 · A\nPurpose: cap\n\n## FEAT-001 · B\nPurpose: feat\n\nNew heading\n===\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-999 | A shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("R-999"))],
  ["setext heading interrupts purpose", "# CAP-01 · A\nCapability title\n===\nPurpose: cap\n", (r) => r.problems.some((p) => p.includes("CAP-01") && p.includes("Purpose"))],
  ["setext level one closes capability", "# CAP-01 · A\nPurpose: cap\n\nFeature title\n===\n\n## FEAT-001 · B\nPurpose: feat\n", (r) => r.problems.some((p) => p.includes("FEAT-001") && p.includes("nested under"))],
  ["ATX-looking line in fence is opaque", "```md\n# Ordinary fenced text\n```\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-999 | A shall work. | untested | — |", (r) => !r.problems.some((p) => p.includes("R-999"))],
  ["thematic break after blank is not a heading", "\n---\n\n## FEAT-001 · B\nPurpose: feat\n", (r) => !r.problems.some((p) => p.includes("FEAT-001") && p.includes("nested under"))],
  ["heading between capability and purpose", "# CAP-01 · A\n#### Intervening heading\nPurpose: cap\n", (r) => r.problems.some((p) => p.includes("CAP-01") && p.includes("Purpose"))],
  ["unrelated level-one heading closes capability", "# CAP-01 · A\nPurpose: cap\n\n# Ordinary heading\n\n## FEAT-001 · B\nPurpose: feat\n", (r) => r.problems.some((p) => p.includes("FEAT-001") && p.includes("nested under"))],
  ["deleted purpose", "# CAP-01 · A\n## FEAT-001 · B\nPurpose: feat\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-999 | A shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("CAP-01") && p.includes("Purpose"))],
  ["empty purpose", "# CAP-01 · A\nPurpose:\n\n## FEAT-001 · B\nPurpose: feat\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-999 | A shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("CAP-01") && p.includes("Purpose"))],
  ["duplicate feature ID", "## FEAT-001 · B\nPurpose: duplicate\n", (r) => r.problems.some((p) => p.includes("duplicate heading ID"))],
  ["feature before capability", "## FEAT-002 · misplaced\nPurpose: bad\n", (r) => r.problems.some((p) => p.includes("nested under"))],
  ["subgroup before feature", "### SUB-001 · misplaced\nPurpose: bad\n", (r) => r.problems.some((p) => p.includes("nested under"))],
];
const scratch = tmpDir(join(tmpdir(), "req-tree-"));
for (const [name, body, predicate] of cases) {
  const path = join(scratch, `${name.replaceAll(" ", "-")}.md`);
  writeFileSync(path, body.startsWith("# CAP-01") || body.startsWith("## FEAT-002") || body.startsWith("### SUB-001") ? body : fixture(body));
  const result = checkTree(readFileSync(path, "utf8"));
  if (["row outside feature", "row under ordinary heading", "row after prose in feature", "row after blank after table", "header without delimiter", "row in fenced code", "setext heading closes feature table", "ATX-looking line in fence is opaque"].includes(name)) {
    // req: R-287
    check(`R-287 fixture: ${name} fails`, predicate(result), result.problems.join("; "));
  }
  if (name === "deleted purpose" || name === "empty purpose" || name === "heading between capability and purpose" || name === "setext heading interrupts purpose") {
    // req: R-288
    check(`R-288 fixture: ${name} fails`, predicate(result), result.problems.join("; "));
  }
  if (name === "duplicate feature ID") {
    // req: R-289
    check(`R-289 fixture: ${name} fails`, predicate(result), result.problems.join("; "));
  }
  if (name.includes("before") || name.includes("closes capability") || name === "setext level one closes capability" || name === "thematic break after blank is not a heading") {
    // req: R-290
    check(`R-290 fixture: ${name} fails`, predicate(result), result.problems.join("; "));
  }
}
const governance = (status = "active", also = "R-001") => `# CAP-01 · A\nPurpose: cap\n\n## FEAT-001 · Home\nPurpose: home\nStatus: active\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | A shall work. | untested | — |\n\n## FEAT-002 · Shared\nPurpose: shared\nStatus: ${status}\nAlso applies: ${also}\n`;
for (const [label, text] of [
  ["unknown ID", governance("active", "R-999")],
  ["duplicate ID", governance("active", "R-001, R-001")],
  ["retired ID", governance("active", "R-001") .replace("| R-001 | A shall work. | untested | — |", "| R-001 | A shall work. | retired | — |")],
  ["same-home ID", governance("active", "R-001").replace("FEAT-002 · Shared", "FEAT-001 · Shared")],
  ["duplicate share lines", governance("active", "R-001").replace("Also applies: R-001", "Also applies: R-999\nAlso applies: R-001")],
]) {
  const result = checkTree(text);
  check(`R-292 fixture: rejects ${label}`, result.problems.some((p) => p.includes("Also applies")), result.problems.join("; "));
}
const duplicateStatus = checkTree(governance("active", "").replace("Purpose: shared\nStatus: active", "Purpose: shared\nStatus: done\nStatus: active"));
// req: R-293
check("R-293 fixture: duplicate status lines are named and rejected", duplicateStatus.problems.some((p) => /line \d+: FEAT-002 has duplicate Status: line/.test(p)), duplicateStatus.problems.join("; "));
const statusAfterOrdinaryTable = checkTree(governance("active", "").replace(
  "Purpose: shared\nStatus: active",
  "Purpose: shared\n| Detail | Value |\n|---|---|\n| state | active |\nStatus: active",
));
// req: R-293
check("R-293 fixture: status after a two-column Markdown table is rejected at its line", statusAfterOrdinaryTable.problems.some((p) => p.includes("line 16: FEAT-002 has a missing, late or invalid Status: line")), statusAfterOrdinaryTable.problems.join("; "));
// req: R-292
check("R-292 fixture: duplicate Also applies lines validate each listed ID", checkTree(governance("active", "R-001").replace("Also applies: R-001", "Also applies: R-999\nAlso applies: R-001")).problems.some((p) => p.includes("R-999 does not exist")), "invalid earlier share was ignored");
// req: R-292
check("R-292: shared requirement clauses reject invalid IDs", ["R-999", "R-001, R-001"].every((also) => checkTree(governance("active", also)).problems.some((p) => p.includes("Also applies"))) && checkTree(governance("active", "R-001").replace("| R-001 | A shall work. | untested | — |", "| R-001 | A shall work. | retired | — |")).problems.some((p) => p.includes("retired")) && checkTree(governance("active", "R-001").replace("FEAT-002 · Shared", "FEAT-001 · Shared")).problems.some((p) => p.includes("homed")), "a share mutation was accepted");
const fourDigitTree = `# CAP-01 · A\nPurpose: cap\n\n## FEAT-001 · Home\nPurpose: home\nStatus: active\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-999 | A shall work. | untested | — |\n| R-1000 | B shall work. | untested | — |\n| R-1001 | C shall work. | untested | — |\n\n## FEAT-002 · Shares\nPurpose: shares\nStatus: active\nAlso applies: R-1000\n`;
const fourDigitTreeResult = checkTree(fourDigitTree);
// req: R-1000
check("R-1000: tree counts four-digit rows and accepts their cross-feature share", fourDigitTreeResult.problems.length === 0 && fourDigitTreeResult.outline.includes("Rows: 3 · IDs: R-999–R-1001") && fourDigitTreeResult.outline.includes("Also applies: R-1000"), fourDigitTreeResult.problems.join("; "));
// req: R-1000
check("R-1000: row compression and range expansion cross R-999 to R-1000", compressRowIds(["R-999", "R-1000", "R-1001"]) === "R-999–R-1001" && expandRowIds("R-999–R-1001").join(",") === "R-999,R-1000,R-1001", compressRowIds(["R-999", "R-1000", "R-1001"]));
const whitespaceInside = checkTree(fixture("| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n|\u0085R-1000\u001f | A shall work. | untested | — |"));
// req: R-287
check("R-287 fixture: U+0085 and U+001F rows load only inside a feature", whitespaceInside.parsed.tables.some((table) => table.rows.includes("R-1000")) && whitespaceInside.problems.length === 0 && whitespaceInside.outline.includes("Rows: 1 · IDs: R-1000"), whitespaceInside.problems.join("; "));
const whitespaceOutside = checkTree(`# CAP-01 · A\nPurpose: cap\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n|\u0085R-1000\u001f | A shall work. | untested | — |`);
// req: R-287
check("R-287 fixture: whitespace-variant row outside a feature is refused", whitespaceOutside.problems.some((problem) => problem.includes("R-1000 is not in a feature or subgroup table")), whitespaceOutside.problems.join("; "));
const malformedCandidates = [
  "| R-1000 | A shall work. | untested | —",
  "| R-1000 | A shall work. | untested | — |x",
  "| R-1000 | A shall work. | untested | — | extra |",
];
// req: R-287
check("R-287 fixture: malformed requirement candidates are omitted from the outline", malformedCandidates.every((candidate) => {
  const result = checkTree(fixture(`| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n${candidate}`));
  return !result.parsed.tables.some((table) => table.rows.includes("R-1000")) && !result.outline.includes("R-1000");
}), "a malformed candidate was counted or rendered");
// req: R-287 R-291
check("R-291 fixture: a leading BOM before the first heading is read", parseLedger("\ufeff# CAP-01 · A\nPurpose: cap\n").headings.some((heading) => heading.id === "CAP-01"));
for (const [label, status] of [["missing", null], ["unknown", "done"], ["empty frozen", "frozen ()"], ["empty retired", "retired ()"], ["blank reason", "frozen (   )"]]) {
  let text = governance(status ?? "active");
  if (status === null) text = text.replace("Status: active\nAlso applies:", "Also applies:");
  const result = checkTree(text);
  check(`R-293 fixture: rejects ${label} status`, result.problems.some((p) => p.includes("Status")), result.problems.join("; "));
}
// req: R-293
check("R-293: feature lifecycle statuses are required and validated", ["active", "done", "frozen ()", "retired ()", "frozen (   )"].slice(1).every((status) => checkTree(governance(status, "")).problems.some((p) => p.includes("Status"))) && ["proposed", "active", "frozen (reason)", "retired (FEAT-002)"].every((status) => !checkTree(governance(status, "")).problems.some((p) => p.includes("invalid Status"))), "invalid or legal lifecycle status mishandled");
check("R-293 fixture: accepts four lifecycle forms", ["proposed", "active", "frozen (reason)", "retired (FEAT-002)"].every((status) => !checkTree(governance(status, "")).problems.some((p) => p.includes("invalid Status"))), "legal status rejected");
for (const status of ["proposed", "retired (FEAT-002)"]) {
  const result = checkTree(governance(status, "").replace("Status: " + status + "\nAlso applies: \n", "Status: " + status + "\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-002 | B shall work. | untested | — |\nAlso applies: \n"));
  check(`R-294 fixture: ${status} feature cannot hold rows`, result.problems.some((p) => p.includes("holds rows")), result.problems.join("; "));
}
// req: R-294
check("R-294: proposed and retired features have no rows", ["proposed", "retired (FEAT-002)"].every((status) => checkTree(governance(status, "").replace(`Status: ${status}\nAlso applies: \n`, `Status: ${status}\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-002 | B shall work. | untested | — |\nAlso applies: \n`)).problems.some((p) => p.includes("holds rows"))), "a proposed or retired feature held a row");
// req: R-291
check("R-291: row ID compression retains and separates prefixes", compressRowIds(["G-001", "G-002", "G-003", "R-001", "R-002", "R-003"]) === "G-001–G-003, R-001–R-003", compressRowIds(["G-001", "G-002", "G-003", "R-001", "R-002", "R-003"]));
for (const ids of [
  ["R-001"], ["R-001", "R-002"], ["R-001", "R-002", "R-003"], ["R-001", "R-002", "R-003", "R-004"],
  ["R-001", "R-003", "R-004", "R-008"], ["R-004", "R-002", "R-003", "G-001", "G-003", "G-002"],
]) {
  const sorted = [...new Set(ids)].sort();
  // req: R-291
  check(`R-291 property: compression round-trips ${ids.join(" ")}`, expandRowIds(compressRowIds(ids)).sort().join(",") === sorted.join(","), compressRowIds(ids));
}
const sample = fixture("| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | A shall work. | untested | — |\n| G-001 | B shall work. | untested | — |");
const parsedSample = parseLedger(sample);
const original = renderOutline(parsedSample);
// req: R-291
check("R-291 fixture: independent field check catches a broken renderer dropping status", checkOutlineFields(renderOutline(parsedSample).replace("  Status: active\n", ""), parsedSample).some((p) => p.includes("status")), checkOutlineFields(original, parsedSample).join("; "));
check("R-291 fixture: independent field check rejects missing shared index data", checkOutlineFields(original.replace("| ID | Home | Also applies to | Count |", "| ID | Home | Count |"), parsedSample).some((p) => p.includes("index")), checkOutlineFields(original, parsedSample).join("; "));
for (const [field, mutate] of [
  ["ID", (s) => s.replace("FEAT-001", "FEAT-002")],
  ["label", (s) => s.replace("FEAT-001 · B", "FEAT-001 · Changed")],
  ["purpose", (s) => s.replace("Purpose: feat", "Purpose: changed")],
  ["parent", (s) => s.replace("Parent: CAP-01", "Parent: CAP-02")],
  ["row count", (s) => s.replace("Rows: 2", "Rows: 3")],
  ["row IDs", (s) => s.replace("IDs: R-001", "IDs: R-002")],
]) {
  const altered = mutate(original);
  const problems = checkOutlineFields(altered, parsedSample);
  // req: R-291
  check(`R-291 fixture field check rejects altered ${field}`, problems.some((p) => p.includes(`field ${field}`)), problems.join("; "));
}
// ---------------------------------------------------------------- T8-T11, T15: the --root CLI
const TREE_CLI = fileURLToPath(new URL("../../../scripts/requirements-tree.mjs", import.meta.url));
const runTree = (args, cwd) => spawnSync(process.execPath, [TREE_CLI, ...args], { cwd, encoding: "utf8" });
const lines = (s) => (s ?? "").split("\n").filter(Boolean);
const NODE_WARNING = [/^\(node:\d+\) /, /^Reparsing as ES module because/, /^To eliminate this warning, add "type": "module"/, /^\(Use `node --trace-warnings/];
const own = (stderr) => lines(stderr).filter((l) => !NODE_WARNING.some((re) => re.test(l)));
const cliScratch = tmpDir(join(tmpdir(), "req-tree-cli-"));
const writeLedger = (name, content) => { const dir = join(cliScratch, name); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "REQUIREMENTS.md"), content); return dir; };
const crlf = (s) => s.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");

const TREE1 = "# CAP-01 · Cap\nPurpose: capability\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The thing shall work. | untested | — |\n";
const OUTSIDE = `${TREE1}\n| R-002 | Another thing shall work. | untested | — |\n`;
const NOROWS = "# CAP-01 · Cap\nPurpose: capability\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n";
const utf16 = (s) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, "utf16le")]);

{
  const dir = writeLedger("t8-tree", TREE1);
  const r = runTree(["--root", dir], cliScratch);
  // req: R-1157
  check("R-1157: --root checks another project's ledger, names its problems and writes no outline",
    r.status === 0 && lines(r.stdout).join("\n") === "requirements tree: 0 problems; rows 1; features 1" && own(r.stderr).length === 0 &&
    !existsSync(join(dir, "docs")) && !existsSync(join(dir, "requirements-tree.md")),
    `${r.status} ${r.stdout} ${r.stderr}`);
  const outsideDir = writeLedger("t8-outside", OUTSIDE);
  const broken = runTree(["--root", outsideDir], cliScratch);
  // req: R-1157
  check("R-1157 fixture: a row outside its feature exits 1 naming it",
    broken.status === 1 && own(broken.stderr).some((l) => l.includes("is not in a feature or subgroup table")),
    broken.stderr);
  const bad = runTree(["--root", dir, "--write"], cliScratch);
  // req: R-1157
  check("R-1157 fixture: --root <dir> --write exits 2 with usage",
    bad.status === 2 && /--root <dir>/.test(bad.stderr), bad.stderr);
}

{
  const u1 = runTree(["--root", writeLedger("t9-utf16", utf16(TREE1))], cliScratch);
  const u1Err = own(u1.stderr).join("\n");
  const norows = runTree(["--root", writeLedger("t9-norows", NOROWS)], cliScratch);
  // req: R-1160
  check("R-1160: --root refuses a UTF-16 ledger and a ledger with no rows, naming the reason",
    u1.status === 1 && /NUL/.test(u1Err) && /UTF-16/.test(u1Err) && !/\b0 problems\b/.test(u1.stdout + u1.stderr) &&
    norows.status === 1 && own(norows.stderr).some((l) => l.includes("no requirement rows")) && !/\b0 problems\b/.test(norows.stdout + norows.stderr),
    `${u1Err} / ${norows.stderr}`);
}

{
  // A table padded by a markdown formatter — here, one trailing space on the header line —
  // fails the byte-exact "| ID | Requirement | Status | Evidence |" match, so the table
  // (and its one row) goes unrecognised. That must not read as a ledger with no rows.
  const PADDED_HEADER = "# CAP-01 · Cap\nPurpose: capability\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n\n| ID | Requirement | Status | Evidence | \n|---|---|---|---|\n| R-001 | The thing shall work. | untested | — |\n";
  const parsed = parseLedger(PADDED_HEADER);
  // req: R-1160
  check("R-1160: a tree ledger with a padded table header is not refused as having no rows",
    ledgerReadProblem(PADDED_HEADER, parsed) === null,
    String(ledgerReadProblem(PADDED_HEADER, parsed)));
}

{
  const TWO = `${TREE1}\n## FEAT-002 · Second\nStatus: active\n\n| R-002 | Another thing shall work. | untested | — |\n`;
  const lf = checkTree(TWO), cr = checkTree(crlf(TWO));
  const selfLedgerCrlf = checkTree(crlf(ledger));
  // req: R-1158
  check("R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy",
    JSON.stringify(lf.problems) === JSON.stringify(cr.problems) && lf.problems.length === 2 &&
    selfLedgerCrlf.problems.length === 0 && selfLedgerCrlf.parsed.headings.length === 68,
    `${JSON.stringify(lf.problems)} vs ${JSON.stringify(cr.problems)}`);
}

{
  let flat = "# A flat ledger\n\n## 1. Things\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n";
  for (let i = 1; i <= 1000; i++) flat += `| R-${String(i).padStart(3, "0")} | The thing numbered ${i} shall work. | untested | — |\n`;
  const r = runTree(["--root", writeLedger("t11-flat", flat)], cliScratch);
  const flatLines = own(r.stderr);
  // req: R-1159
  check("R-1159: a ledger with rows and no tree gets one line naming the row count and the next step",
    r.status === 1 && flatLines.length === 1 && /\b1000 requirement rows\b/.test(flatLines[0]) && /no requirements tree yet/.test(flatLines[0]) && /requirements skill/.test(flatLines[0]) && !flatLines.some((l) => l.includes("not in a feature or subgroup table")),
    `${flatLines.length} lines: ${flatLines.join(" | ")}`);
}

{
  // Two tables: one with a padded header (never recognised, so its rows never land in
  // readRequirementRows), the other properly headed but with a blank line partway through
  // (which drops the rows after it from readRequirementRows too). The raw per-line count
  // must still find every one of the 5 rows.
  let flat = "# A flat ledger\n\n## 1. Padded\n\n| ID | Requirement | Status | Evidence | \n|---|---|---|---|\n";
  flat += "| R-001 | One thing shall work. | untested | — |\n";
  flat += "| R-002 | Two thing shall work. | untested | — |\n";
  flat += "\n## 2. Interrupted\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n";
  flat += "| R-003 | Three thing shall work. | untested | — |\n";
  flat += "\n";
  flat += "| R-004 | Four thing shall work. | untested | — |\n";
  flat += "| R-005 | Five thing shall work. | untested | — |\n";
  const r = checkTree(flat);
  // req: R-1159
  check("R-1159: a flat ledger's one line counts every requirement row, padded tables and rows after a blank line included",
    r.problems.length === 1 && /\b5 requirement rows\b/.test(r.problems[0]) && /no requirements tree yet/.test(r.problems[0]) && /requirements skill/.test(r.problems[0]),
    r.problems.join("; "));
}

{
  // A fenced requirement row is still a row the trace rail counts (requirementRowId carries no
  // code-fence exception); the raw per-line count must include it too, alongside a normal row
  // in a recognised table.
  const flat = "# A flat ledger\n\n## 1. Things\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | One thing shall work. | untested | — |\n\n```\n| R-002 | A fenced thing shall work. | untested | — |\n```\n";
  const r = checkTree(flat);
  // req: R-1159
  check("R-1159: a flat ledger's count includes a requirement row inside a code fence, as the rail counts it",
    r.problems.length === 1 && /\b2 requirement rows\b/.test(r.problems[0]) && /no requirements tree yet/.test(r.problems[0]) && /requirements skill/.test(r.problems[0]),
    r.problems.join("; "));
}

{
  // A lone subgroup heading has no capability or feature above it: the ledger has no tree
  // yet, same as a plain numbered-section ledger, not a nesting problem for the stray SUB.
  const SUB_ONLY = "### SUB-001 · Lonely\nPurpose: subgroup\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The thing shall work. | untested | — |\n| R-002 | The other thing shall work. | untested | — |\n";
  const r = checkTree(SUB_ONLY);
  // req: R-1159
  check("R-1159: a ledger with subgroup headings but no capability or feature heading still gets the one line",
    r.problems.length === 1 && /\b2 requirement rows\b/.test(r.problems[0]) && /no requirements tree yet/.test(r.problems[0]) && /requirements skill/.test(r.problems[0]),
    r.problems.join("; "));
}

{
  const NEAR = "# CAP-01 - Cap\nPurpose: capability\n\n## FEAT-001 - Feature\nPurpose: feature\nStatus: active\n\n### SUB-001 - Sub\nPurpose: subgroup\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The thing shall work. | untested | — |\n| R-002 | The other thing shall work. | untested | — |\n\n # CAP-02 - Indented\n\n#### SUB-002 - Deep\n";
  const r = runTree(["--root", writeLedger("t15-near", NEAR)], cliScratch);
  const nrLines = own(r.stderr);
  const named = (n, kind) => nrLines.some((l) => new RegExp(`\\bline ${n}\\b`).test(l) && l.includes(`${kind}-`) && l.includes("·"));
  // req: R-1161
  check('R-1161: a tree heading typed with "-" for "·" is named with its line and the expected form, not taken for a flat ledger',
    r.status === 1 && named(1, "CAP") && named(4, "FEAT") && named(8, "SUB") && named(16, "CAP") && named(18, "SUB") && !nrLines.some((l) => l.includes("no requirements tree yet")) && !nrLines.some((l) => l.includes("not in a feature or subgroup table")),
    nrLines.join(" | "));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
