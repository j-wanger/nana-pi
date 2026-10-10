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
import { checkTree, renderOutline, parseLedger, checkOutlineFields, compressRowIds, expandRowIds } from "../../../scripts/requirements-tree.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const root = new URL("../../../", import.meta.url);
const ledger = readFileSync(new URL("REQUIREMENTS.md", root), "utf8");
const map = readFileSync(new URL("docs/requirements-tree.md", root), "utf8");
const actual = checkTree(ledger);
const row = (id) => ledger.split("\n").find((line) => line.startsWith(`| ${id} |`)) ?? "";
// req: R-287
check("R-287: every real requirement row is in a feature or subgroup table", actual.problems.every((p) => !p.includes("not in a feature or subgroup table")) && row("R-287").startsWith("| R-287 | Every requirement row in REQUIREMENTS.md shall sit in a table"), actual.problems.join("; "));
// req: R-288
check("R-288: all real headings have non-empty purposes", actual.parsed.headings.length === 67 && actual.parsed.headings.every((h) => h.purpose.length > 0), `${actual.parsed.headings.length} headings`);
// req: R-289
check("R-289: real capability, feature and subgroup IDs are unique", actual.problems.every((p) => !p.includes("duplicate heading ID")), actual.problems.join("\n"));
// req: R-290
check("R-290: real feature and subgroup headings have direct-level parents", actual.problems.every((p) => !p.includes("nested under")), actual.problems.join("\n"));
// req: R-291
check("R-291: committed outline equals a fresh render", map === actual.outline, "committed outline differs from renderOutline");
// req: R-291
check("R-291: committed outline fields and row IDs match the real ledger", checkOutlineFields(map, actual.parsed).length === 0, checkOutlineFields(map, actual.parsed).join("; "));
// req: R-291
check("R-291: every real heading's committed IDs survive expansion and leaf counts total 1,009", (() => {
  const outlineLines = map.split("\n");
  let leafTotal = 0;
  for (const heading of actual.parsed.headings) {
    const titleIndex = outlineLines.findIndex((value) => value.includes(`**${heading.id} · `));
    const line = outlineLines[titleIndex + 2];
    const ids = expandRowIds(line?.match(/IDs: (.+)$/)?.[1] ?? "");
    const children = actual.parsed.headings.some((candidate) => candidate.parent === heading);
    const source = children
      ? actual.parsed.headings.filter((candidate) => candidate === heading || isDescendant(candidate, heading)).flatMap((candidate) => candidate.rows)
      : heading.rows;
    if (!children) leafTotal += heading.rows.length;
    if (ids.length !== source.length || [...ids].sort().join(",") !== [...source].sort().join(",")) return false;
  }
  return leafTotal === 1009;
})(), "committed IDs differ or leaf total is not 1,009");
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
  const line = lines[index + 2];
  return Number(line?.match(/Rows: (\d+)/)?.[1]) === descendantRows.length && expandRowIds(line?.match(/IDs: (.+)$/)?.[1] ?? "").length === descendantRows.length;
}), "parent count differs from its descendants");

const fixture = (body) => `# CAP-01 · A\nPurpose: cap\n\n## FEAT-001 · B\nPurpose: feat\n\n${body}\n`;
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
