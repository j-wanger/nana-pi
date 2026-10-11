/**
 * @module packages/nana-pack/tests/requirements-tree.test.mjs
 * @purpose Pins the capability-tree requirements on the real ledger and proves each structural rule and outline field rejects a broken fixture.
 * @inputs REQUIREMENTS.md, docs/requirements-tree.md, scripts/requirements-tree.mjs and temporary ledger fixtures.
 * @outputs PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
 * @effects disk (reads repository files and creates fixtures under the OS temp directory)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { ID } from "../../../scripts/requirements-trace.mjs";
import { checkTree, renderOutline, parseLedger, checkOutlineFields, compressRowIds, expandRowIds } from "../../../scripts/requirements-tree.mjs";

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
check("R-288: all real headings have non-empty purposes", actual.parsed.headings.length === 67 && actual.parsed.headings.every((h) => h.purpose.length > 0), `${actual.parsed.headings.length} headings`);
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
check("R-291: every real heading's committed IDs survive expansion and leaf counts total 1,026", (() => {
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
  return leafTotal === 1026;
})(), "committed IDs differ or leaf total is not 1,026");
function isDescendant(candidate, ancestor) {
  let parent = candidate.parent;
  while (parent) { if (parent === ancestor) return true; parent = parent.parent; }
  return false;
}
const feat033 = actual.parsed.headings.find((h) => h.id === "FEAT-033");
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
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
