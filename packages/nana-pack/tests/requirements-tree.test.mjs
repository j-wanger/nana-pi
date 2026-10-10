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
import { checkTree, renderOutline, parseLedger } from "../../../scripts/requirements-tree.mjs";

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
check("R-291: committed outline equals a fresh render", map === actual.outline, "outline differs from renderer");

const fixture = (body) => `# CAP-01 · A\nPurpose: cap\n\n## FEAT-001 · B\nPurpose: feat\n\n${body}\n`;
const cases = [
  ["row outside feature", "# CAP-01 · A\nPurpose: cap\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-999 | A shall work. | untested | — |", (r) => r.problems.some((p) => p.includes("R-999"))],
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
  if (name === "row outside feature") {
    // req: R-287
    check(`R-287 fixture: ${name} fails`, predicate(result), result.problems.join("; "));
  }
  if (name === "deleted purpose" || name === "empty purpose") {
    // req: R-288
    check(`R-288 fixture: ${name} fails`, predicate(result), result.problems.join("; "));
  }
  if (name === "duplicate feature ID") {
    // req: R-289
    check(`R-289 fixture: ${name} fails`, predicate(result), result.problems.join("; "));
  }
  if (name.includes("before")) {
    // req: R-290
    check(`R-290 fixture: ${name} fails`, predicate(result), result.problems.join("; "));
  }
}
const sample = fixture("| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | A shall work. | untested | — |");
const original = renderOutline(parseLedger(sample));
for (const [field, mutate] of [
  ["ID", (s) => s.replace("FEAT-001", "FEAT-002")],
  ["label", (s) => s.replace("FEAT-001 · B", "FEAT-001 · Changed")],
  ["purpose", (s) => s.replace("Purpose: feat", "Purpose: changed")],
  ["parent", (s) => s.replace("# CAP-01 · A", "# CAP-02 · A")],
  ["row count", (s) => s.replace("| R-001 | A shall work. | untested | — |", "")],
  ["row IDs", (s) => s.replace("R-001", "R-002")],
]) {
  const altered = renderOutline(parseLedger(mutate(sample)));
  // req: R-291
  check(`R-291 fixture render changes ${field}`, altered !== original, field);
}
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
