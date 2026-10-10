#!/usr/bin/env node
/**
 * @module docs/reviews/req-tree-2026-10-09/prove.mjs
 * @purpose Independently prove every ledger line and section-map entry against the checkpointed inputs and approved base.
 * @inputs --approved <sha> <after-ledger> <section-map>.
 * @outputs One proof summary line or line-specific failures.
 * @effects disk (reads Git objects and the supplied result files), process (sets a non-zero exit on any difference)
 * @errors Exit 2 for invalid arguments and exit 1 naming each unaccounted or altered output line.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) { console.error(message); process.exitCode = 1; }
function git(sha, path) { return execFileSync("git", ["show", `${sha}:${path}`], { encoding: "utf8" }); }
const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== "--approved") {
  console.error("Usage: prove.mjs --approved <sha> <after-ledger> <section-map>");
  process.exit(2);
}
const [, sha, afterPath, mapPath] = args;
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const base = git(sha, "REQUIREMENTS.md");
const tree = JSON.parse(git(sha, "docs/reviews/req-tree-2026-10-09/tree.json"));
const fixedFile = git(sha, "docs/reviews/req-tree-2026-10-09/fixed-text.md");
const fixed = fixedFile.split("<!-- BEGIN -->\n")[1].split("\n<!-- END -->")[0];
const source = base.replace(/\n$/, "").split("\n");
const rows = new Map();
const originalSection = new Map();
let oldSection = "";
for (const line of source) {
  if (/^#{1,2} /.test(line)) oldSection = line;
  const id = /^\|\s*([RG]-\d{3})\s*\|/.exec(line)?.[1];
  if (id) { if (rows.has(id)) throw Error(`approved base duplicates ${id}`); rows.set(id, line); originalSection.set(id, oldSection); }
}
const expected = [];
const placement = new Map();
const clean = (s) => s.replace(/\n+$/, "");
const partA = source.indexOf("# Part A. The pi extension pack and the repo test runner");
if (partA < 0) throw Error("approved base has no Part A");
expected.push(clean(source.slice(0, partA).join("\n").replace(tree.intro_edit.from, tree.intro_edit.to)), fixed);
function textParagraphs(heading) {
  const start = source.indexOf(heading);
  if (start < 0) throw Error(`approved base missing ${heading}`);
  let end = start + 1;
  while (end < source.length && !/^#{1,2} /.test(source[end])) end++;
  const prose = source.slice(start + 1, end).filter((line) => line !== "| ID | Requirement | Status | Evidence |" && !/^\|[-| ]+\|$/.test(line) && !/^\|\s*[RG]-\d{3}\s*\|/.test(line));
  const result = []; let paragraph = [];
  for (const line of prose) { if (!line.trim()) { if (paragraph.length) result.push(paragraph.join("\n")); paragraph = []; } else paragraph.push(line); }
  if (paragraph.length) result.push(paragraph.join("\n"));
  return result;
}
function node(n, level) {
  const header = [`${"#".repeat(level)} ${n.id} · ${n.label}`, `Purpose: ${n.purpose}`];
  if (n.outcome) header.push(`Outcome: ${n.outcome}`);
  if (n.see_also) header.push(n.see_also);
  for (const heading of n.notes_from ?? []) {
    const match = /^#{1,2} (?:Part )?(\d+[a-z]?\.?)/i.exec(heading);
    const label = match?.[1]?.replace(/\.$/, "") ?? heading.replace(/^#+ /, "").split(".")[0];
    header.push(`Note (moved from old §${label} on 2026-10-09):\n${textParagraphs(heading).join("\n\n")}`);
  }
  expected.push(header.join("\n"));
  const children = n.features ?? n.subgroups;
  if (children) { for (const child of children) node(child, level + 1); return; }
  const table = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  for (const id of n.ids ?? []) {
    if (placement.has(id)) throw Error(`tree places ${id} twice`);
    placement.set(id, n.id);
    table.push(tree.new_rows[id] ? `| ${id} | ${tree.new_rows[id]} | untested | — |` : rows.get(id));
  }
  expected.push(table.join("\n"));
}
for (const cap of tree.capabilities) node(cap, 1);
const absent = [...rows.keys()].filter((id) => !placement.has(id));
if (absent.length) throw Error(`tree omits approved rows: ${absent.join(", ")}`);
function headingBlock(heading) {
  const at = source.indexOf(heading);
  if (at < 0) throw Error(`approved base missing ${heading}`);
  let end = at + 1;
  while (end < source.length && !/^#{1,2} /.test(source[end])) end++;
  return clean(source.slice(at, end).join("\n"));
}
expected.push(`${tree.tail.heading}\n\n${headingBlock("## Open questions")}\n\n${headingBlock("## Deliberate omissions")}`);
const want = `${expected.join("\n\n")}\n`;
const have = readFileSync(resolve(root, afterPath), "utf8");
const a = want.split("\n"); const b = have.split("\n");
let mismatches = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] === b[i]) continue;
  const newRowId = /^\|\s*(R-28[7-9]|R-29[01])\s*\|/.exec(a[i] ?? "")?.[1];
  if (newRowId && b[i]) {
    const expectedCells = a[i].split("|").map((cell) => cell.trim());
    const actualCells = b[i].split("|").map((cell) => cell.trim());
    const actualLine = b[i];
    const canonical = actualCells.length === 6
      && actualLine === `| ${actualCells[1]} | ${actualCells[2]} | ${actualCells[3]} | ${actualCells[4]} |`;
    const evidence = actualCells[4] ?? "";
    if (canonical
      && actualCells[1] === expectedCells[1]
      && actualCells[2] === expectedCells[2]
      && actualCells[3] === "implemented"
      && evidence.length > 0
      && evidence.includes("packages/nana-pack/tests/requirements-tree.test.mjs::")) continue;
  }
  fail(`ledger line ${i + 1}: ${i >= a.length ? "unexpected extra line" : i >= b.length ? "missing line" : `expected ${JSON.stringify(a[i])}, got ${JSON.stringify(b[i])}`}`); mismatches++;
}

// Recompute the section-map row counts and homes from approved source, independently of move.mjs.
const homes = new Map();
for (const [id, home] of placement) {
  const origin = originalSection.get(id);
  if (!origin) continue;
  const key = `${origin}\0${home}`;
  homes.set(key, (homes.get(key) ?? 0) + 1);
}
const featureNodes = tree.capabilities.flatMap((c) => c.features);
const map = ["# Requirements section map — 2026-10-09", "", "This map records where the old numbered ledger sections went during the capability-tree move. Counts include rows from each old section; Part G headings note their shared-file provenance.", "", "| Old heading | Package | New homes (row counts) | Note moved? |", "|---|---|---|---|"];
for (const item of tree.old_sections) {
  const targets = [...homes].filter(([key]) => key.startsWith(`${item.heading}\0`)).map(([key, count]) => [key.split("\0")[1], count]).sort(([a], [b]) => a.localeCompare(b)).map(([home, count]) => `${home} (${count})`);
  const note = featureNodes.find((n) => n.notes_from?.includes(item.heading));
  map.push(`| ${item.heading} | ${item.package} | ${targets.join(", ") || "—"} | ${note ? `Yes, to ${note.id}` : "No"} |`);
}
const ten = tree.to_section_map[0];
map.push("", `Note from ${ten}`, "", textParagraphs(ten).join("\n\n"), "");
const mapWant = map.join("\n");
const mapHave = readFileSync(resolve(root, mapPath), "utf8");
const ma = mapWant.split("\n"); const mb = mapHave.split("\n");
for (let i = 0; i < Math.max(ma.length, mb.length); i++) if (ma[i] !== mb[i]) { fail(`section map line ${i + 1}: differs from approved mapping`); mismatches++; }
if (!mismatches) console.log(`prove: ${rows.size} base rows preserved once; ${Object.keys(tree.new_rows).length} new rows; ${expected.length} ledger blocks and ${a.length - 1} physical lines accounted; ${tree.old_sections.length} old headings mapped`);
