#!/usr/bin/env node
/**
 * @module docs/reviews/req-tree-2026-10-09/prove.mjs
 * @purpose Independently prove the increment-B ledger and section map against BASE and approved INPUTS.
 * @inputs --approved BASE --inputs INPUTS <after-ledger> <section-map>.
 * @outputs A proof summary or line-specific failures.
 * @effects disk (reads Git objects and result files), process (sets a non-zero exit on failure)
 * @errors Exit 2 for invalid arguments and exit 1 for an unaccounted or altered output.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) { console.error(message); process.exitCode = 1; }
function git(sha, path) { return execFileSync("git", ["show", `${sha}:${path}`], { encoding: "utf8" }); }
const args = process.argv.slice(2);
if (args.length !== 6 || args[0] !== "--approved" || args[2] !== "--inputs") {
  console.error("Usage: prove.mjs --approved <BASE> --inputs <INPUTS> <after-ledger> <section-map>");
  process.exit(2);
}
const [, baseSha, , inputSha, afterPath, mapPath] = args;
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const base = git(baseSha, "REQUIREMENTS.md");
const baseTree = JSON.parse(git(baseSha, "docs/reviews/req-tree-2026-10-09/tree.json"));
const tree = JSON.parse(git(inputSha, "docs/reviews/req-tree-2026-10-09/tree-b.json"));
const fixedFile = git(inputSha, "docs/reviews/req-tree-2026-10-09/fixed-text-b.md");
const fixed = fixedFile.split("<!-- BEGIN -->\n")[1].split("\n<!-- END -->")[0];
const source = base.replace(/\n$/, "").split("\n");
const evidenceTitle = {
  "R-287": "R-287: every real requirement row is in a feature or subgroup table",
  "R-288": "R-288: all real headings have non-empty purposes",
  "R-289": "R-289: real capability, feature and subgroup IDs are unique",
  "R-290": "R-290: real feature and subgroup headings have direct-level parents",
  "R-291": "R-291: committed outline fields and row IDs match the real ledger",
  "R-292": "R-292: shared requirement clauses reject invalid IDs",
  "R-293": "R-293: feature lifecycle statuses are required and validated",
  "R-294": "R-294: proposed and retired features have no rows",
};
const rows = new Map();
const originalHome = new Map();
const originalSection = new Map();
let oldSection = "";
for (const line of source) {
  if (/^#{1,2} /.test(line)) oldSection = line;
  const match = /^\|\s*([RG]-\d{3})\s*\|/.exec(line);
  if (match) {
    if (rows.has(match[1])) throw Error(`BASE duplicates ${match[1]}`);
    rows.set(match[1], line);
    originalSection.set(match[1], oldSection);
  }
}
function flatten(treeValue) {
  const result = new Map();
  for (const cap of treeValue.capabilities) {
    result.set(cap.id, cap);
    for (const feature of cap.features) {
    result.set(feature.id, feature);
    for (const subgroup of feature.subgroups ?? []) result.set(subgroup.id, subgroup);
    }
  }
  return result;
}
if (baseTree.purpose !== tree.purpose || JSON.stringify(baseTree.outcomes) !== JSON.stringify(tree.outcomes)) throw Error("tree-b changed top-level purpose or outcomes");
const prior = flatten(baseTree), current = flatten(tree);
const moves = new Map(tree.moves.map((move) => [move.id, move]));
for (const [id, oldNode] of prior) {
  const now = current.get(id);
  if (!now || oldNode.label !== now.label || oldNode.purpose !== now.purpose || JSON.stringify(oldNode.outcome) !== JSON.stringify(now.outcome)) throw Error(`tree-b changed identity, label, purpose or outcome for ${id}`);
}
const baseHeadings = [...prior.keys()];
if (JSON.stringify(baseHeadings) !== JSON.stringify([...current.keys()])) throw Error("tree-b changed the complete heading set or order");
for (const [id, oldNode] of prior) {
  const now = current.get(id);
  if (!oldNode.ids) continue;
  const addRows = id === "FEAT-028" ? ["R-292", "R-293", "R-294"] : [];
  const declaredMoves = [...moves].filter(([, move]) => move.from === id || move.to === id).map(([row]) => row);
  const expectedIds = oldNode.ids.filter((row) => ![...moves].some(([rid, move]) => rid === row && move.from === id));
  for (const [rid, move] of moves) if (move.to === id) expectedIds.push(rid);
  expectedIds.push(...addRows.filter((row) => now.ids.includes(row)));
  if (JSON.stringify(expectedIds) !== JSON.stringify(now.ids)) throw Error(`${id} row list differs from declared moves/additions`);
  void declaredMoves;
}
for (const [rid, move] of moves) {
  if (!prior.get(move.from)?.ids.includes(rid) || !current.get(move.to)?.ids.includes(rid)) throw Error(`invalid move declaration for ${rid}`);
}
for (const [id, node] of prior) if (node.see_also) {
  const removed = [...node.see_also.matchAll(/[RG]-\d{3}/g)].map((match) => match[0]);
  const now = current.get(id);
  if (!removed.every((rid) => now.also_applies?.includes(rid))) throw Error(`${id} did not retain every former see_also ID as a share`);
}
const edits = tree.intro_edits;
let intro = source.slice(0, source.indexOf("# Part A. The pi extension pack and the repo test runner")).join("\n");
for (const edit of edits) {
  if (intro.split(edit.from).length !== 2) throw Error(`intro edit is not unique in BASE: ${edit.from}`);
  intro = intro.replace(edit.from, edit.to);
}
const clean = (value) => value.replace(/\n+$/, "");
function paragraphs(heading) {
  const start = source.indexOf(heading);
  if (start < 0) throw Error(`BASE missing heading ${heading}`);
  let end = start + 1;
  while (end < source.length && !/^#{1,2} /.test(source[end])) end++;
  const prose = source.slice(start + 1, end).filter((line) => line !== "| ID | Requirement | Status | Evidence |" && !/^\|[-| ]+\|$/.test(line) && !/^\|\s*[RG]-\d{3}\s*\|/.test(line));
  const output = []; let paragraph = [];
  for (const line of prose) { if (!line.trim()) { if (paragraph.length) output.push(paragraph.join("\n")); paragraph = []; } else paragraph.push(line); }
  if (paragraph.length) output.push(paragraph.join("\n"));
  return output;
}
const expected = [clean(intro), fixed];
const placement = new Map();
function node(n, level) {
  const header = [`${"#".repeat(level)} ${n.id} · ${n.label}`, `Purpose: ${n.purpose}`];
  if (n.outcome) header.push(`Outcome: ${n.outcome}`);
  if (n.status) header.push(`Status: ${n.status}`);
  if (n.also_applies?.length) header.push(`Also applies: ${n.also_applies.join(", ")}`);
  for (const old of n.notes_from ?? []) {
    const match = /^#{1,2} (?:Part )?(\d+[a-z]?\.?)/i.exec(old);
    const label = match?.[1]?.replace(/\.$/, "") ?? old.replace(/^#+ /, "").split(".")[0];
    header.push(`Note (moved from old §${label} on 2026-10-09):\n${paragraphs(old).join("\n\n")}`);
  }
  expected.push(header.join("\n"));
  const children = n.features ?? n.subgroups;
  if (children) { for (const child of children) node(child, level + 1); return; }
  const table = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  for (const id of n.ids ?? []) {
    if (placement.has(id)) throw Error(`tree duplicates ${id}`);
    placement.set(id, n.id);
    if (tree.new_rows[id]) {
      table.push(`| ${id} | ${tree.new_rows[id]} | implemented | \`packages/nana-pack/tests/requirements-tree.test.mjs::${evidenceTitle[id]}\` |`);
    } else {
      const line = rows.get(id);
      if (!line) throw Error(`tree references non-BASE row ${id}`);
      table.push(line);
    }
  }
  expected.push(table.join("\n"));
}
for (const capability of tree.capabilities) node(capability, 1);
for (const id of rows.keys()) if (!placement.has(id)) throw Error(`tree omits BASE row ${id}`);
const block = (heading) => {
  const start = source.indexOf(heading); if (start < 0) throw Error(`BASE missing ${heading}`);
  let end = start + 1; while (end < source.length && !/^#{1,2} /.test(source[end])) end++;
  return clean(source.slice(start, end).join("\n"));
};
expected.push(`${tree.tail.heading}\n\n${block("## Open questions")}\n\n${block("## Deliberate omissions")}`);
const want = `${expected.join("\n\n")}\n`;
const have = readFileSync(resolve(root, afterPath), "utf8");
const wantLines = want.split("\n"), haveLines = have.split("\n");
const evidencePrefix = "packages/nana-pack/tests/requirements-tree.test.mjs::";
for (const id of ["R-287", "R-288", "R-289", "R-290", "R-291", "R-292", "R-293", "R-294"]) {
  const line = haveLines.find((value) => value.startsWith(`| ${id} |`));
  const cells = line?.split("|").map((cell) => cell.trim()) ?? [];
  const expectedRow = wantLines.find((value) => value.startsWith(`| ${id} |`))?.split("|").map((cell) => cell.trim()) ?? [];
  if (!line || cells.length !== 6 || line !== `| ${cells[1]} | ${cells[2]} | ${cells[3]} | ${cells[4]} |` || cells[2] !== expectedRow[2] || cells[3] !== "implemented" || !cells[4].includes(evidencePrefix)) fail(`${id}: expected canonical implemented row with the approved requirement text and requirements-tree test evidence`);
}
let differences = 0;
for (let i = 0; i < Math.max(wantLines.length, haveLines.length); i++) {
  if (wantLines[i] === haveLines[i]) continue;
  const match = /^\|\s*(R-28[7-9]|R-29[0-4])\s*\|/.exec(wantLines[i] ?? "");
  if (match) {
    const expectedCells = wantLines[i].split("|").map((cell) => cell.trim());
    const actualCells = (haveLines[i] ?? "").split("|").map((cell) => cell.trim());
    if (actualCells.length === 6 && actualCells[1] === expectedCells[1] && actualCells[2] === expectedCells[2]) continue;
  }
  fail(`ledger line ${i + 1}: ${i >= wantLines.length ? "unexpected extra line" : i >= haveLines.length ? "missing line" : `expected ${JSON.stringify(wantLines[i])}, got ${JSON.stringify(haveLines[i])}`}`);
  differences++;
}

const homes = new Map();
for (const [id, home] of placement) {
  const origin = originalSection.get(id);
  if (!origin) continue;
  const key = `${origin}\0${home}`; homes.set(key, (homes.get(key) ?? 0) + 1);
}
const features = tree.capabilities.flatMap((capability) => capability.features);
const map = ["# Requirements section map — 2026-10-09", "", "This map records where the old numbered ledger sections went during the capability-tree move. Counts include rows from each old section; Part G headings note their shared-file provenance.", "", "| Old heading | Package | New homes (row counts) | Note moved? |", "|---|---|---|---|"];
for (const item of tree.old_sections) {
  const targets = [...homes].filter(([key]) => key.startsWith(`${item.heading}\0`)).map(([key, count]) => [key.split("\0")[1], count]).sort(([a], [b]) => a.localeCompare(b)).map(([home, count]) => `${home} (${count})`);
  const note = features.find((feature) => feature.notes_from?.includes(item.heading));
  map.push(`| ${item.heading} | ${item.package} | ${targets.join(", ") || "—"} | ${note ? `Yes, to ${note.id}` : "No"} |`);
}
const ten = tree.to_section_map[0];
map.push("", `Note from ${ten}`, "", paragraphs(ten).join("\n\n"), "");
const mapWant = map.join("\n"), mapHave = readFileSync(resolve(root, mapPath), "utf8");
const mw = mapWant.split("\n"), mh = mapHave.split("\n");
for (let i = 0; i < Math.max(mw.length, mh.length); i++) if (mw[i] !== mh[i]) { fail(`section map line ${i + 1}: differs from approved mapping`); differences++; }
if (!process.exitCode) console.log(`prove: ${rows.size} BASE rows preserved once; ${Object.keys(tree.new_rows).length} new rows; ${expected.length} ledger blocks and ${wantLines.length - 1} physical lines accounted; ${tree.old_sections.length} old headings mapped`);
