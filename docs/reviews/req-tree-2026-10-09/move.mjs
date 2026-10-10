#!/usr/bin/env node
/**
 * @module docs/reviews/req-tree-2026-10-09/move.mjs
 * @purpose Move base requirement rows into the checkpointed capability tree and document every old section's new homes.
 * @inputs The approved base ledger, checkpoint tree, fixed text and output path.
 * @outputs The reorganized ledger and dated old-section map.
 * @effects disk (reads source files and writes the requested output and section map)
 * @errors A thrown Error when a declared row is missing, duplicated or cannot be assigned exactly once.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../..");
const BASE = "6b9202a501a7fe03dfc834ab34cdfc212f6d92ce";
const INPUTS = "9e415db252464d47515f83a7b793569163a79a22";
const gitShow = (sha, path) => execFileSync("git", ["show", `${sha}:${path}`], { cwd: ROOT, encoding: "utf8" });
const base = gitShow(BASE, "REQUIREMENTS.md");
const tree = JSON.parse(gitShow(INPUTS, "docs/reviews/req-tree-2026-10-09/tree-b.json"));
const fixedSource = gitShow(INPUTS, "docs/reviews/req-tree-2026-10-09/fixed-text-b.md");
const fixed = fixedSource.split("<!-- BEGIN -->\n")[1].split("\n<!-- END -->")[0];
const lines = base.replace(/\n$/, "").split("\n");
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
const rowRe = /^\|\s*([RG]-\d{3})\s*\|/;
const rows = new Map();
const sourceSection = new Map();
let section = "";
for (const line of lines) {
  if (/^#{1,2} /.test(line)) section = line;
  const id = rowRe.exec(line)?.[1];
  if (id) {
    if (rows.has(id)) throw new Error(`duplicate base row ${id}`);
    rows.set(id, line);
    sourceSection.set(id, section);
  }
}
const oldHeadings = tree.old_sections.map((s) => s.heading);
function sectionBlock(heading) {
  const at = lines.indexOf(heading);
  if (at < 0) throw new Error(`missing old heading ${heading}`);
  let end = at + 1;
  while (end < lines.length && !/^#{1,2} /.test(lines[end])) end++;
  return lines.slice(at + 1, end).filter((line) => !rowRe.test(line) && line !== "| ID | Requirement | Status | Evidence |" && !/^\|[-| ]+\|$/.test(line));
}
function paragraphs(heading) {
  const text = sectionBlock(heading);
  const out = [];
  let p = [];
  for (const line of text) {
    if (!line.trim()) { if (p.length) out.push(p.join("\n")); p = []; }
    else p.push(line);
  }
  if (p.length) out.push(p.join("\n"));
  return out;
}
const introEnd = lines.indexOf("# Part A. The pi extension pack and the repo test runner");
if (introEnd < 0) throw new Error("missing Part A boundary");
let intro = lines.slice(0, introEnd).join("\n");
for (const edit of tree.intro_edits) {
  if (intro.split(edit.from).length !== 2) throw new Error(`intro edit source is not unique: ${edit.from}`);
  intro = intro.replace(edit.from, edit.to);
}
intro = intro.replace(/\n+$/, "");
const blocks = [intro, fixed];
const placements = new Map();
const newRows = tree.new_rows;
function emitHeading(node, level) {
  const header = [`${"#".repeat(level)} ${node.id} · ${node.label}`, `Purpose: ${node.purpose}`];
  if (node.outcome) header.push(`Outcome: ${node.outcome}`);
  if (node.status) header.push(`Status: ${node.status}`);
  if (node.also_applies?.length) header.push(`Also applies: ${node.also_applies.join(", ")}`);
  for (const old of node.notes_from ?? []) {
    const note = paragraphs(old);
    const sectionNumber = old.match(/^#{1,2} (?:Part )?(\d+[a-z]?)/i)?.[1];
    header.push(`Note (moved from old §${sectionNumber ?? old.replace(/^#+ /, "").split(".")[0]} on 2026-10-09):\n${note.join("\n\n")}`);
  }
  blocks.push(header.join("\n"));
  const childNodes = node.features ?? node.subgroups;
  if (childNodes) {
    for (const child of childNodes) emitHeading(child, level + 1);
    return;
  }
  const table = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  for (const id of node.ids ?? []) {
    if (placements.has(id)) throw new Error(`${id} placed more than once`);
    placements.set(id, node.id);
    if (newRows[id]) table.push(`| ${id} | ${newRows[id]} | implemented | \`packages/nana-pack/tests/requirements-tree.test.mjs::${evidenceTitle[id]}\` |`);
    else {
      const line = rows.get(id);
      if (!line) throw new Error(`${id} absent from approved base`);
      table.push(line);
    }
  }
  blocks.push(table.join("\n"));
}
for (const cap of tree.capabilities) emitHeading(cap, 1);
const missing = [...rows.keys()].filter((id) => !placements.has(id));
const extraneous = [...placements.keys()].filter((id) => !rows.has(id) && !newRows[id]);
if (missing.length || extraneous.length) throw new Error(`row accounting: missing ${missing.join(", ")}; extraneous ${extraneous.join(", ")}`);
for (const id of Object.keys(newRows)) if (!placements.has(id)) throw new Error(`${id} not placed`);
const tailHeading = tree.tail.heading;
function headingBlock(heading) {
  const at = lines.indexOf(heading);
  if (at < 0) throw new Error(`missing tail heading ${heading}`);
  let end = at + 1;
  while (end < lines.length && !/^#{1,2} /.test(lines[end])) end++;
  return lines.slice(at, end).join("\n").replace(/\n+$/, "");
}
blocks.push(`${tailHeading}\n\n${headingBlock("## Open questions")}\n\n${headingBlock("## Deliberate omissions")}`);
const output = `${blocks.join("\n\n").replace(/\n+$/, "")}\n`;
const outPath = resolve(process.argv[2] ?? resolve(ROOT, "REQUIREMENTS.md"));
writeFileSync(outPath, output);

const homesForSection = (oldHeading) => {
  const tally = new Map();
  for (const [id, old] of sourceSection) {
    if (old !== oldHeading) continue;
    const home = placements.get(id);
    if (home) tally.set(home, (tally.get(home) ?? 0) + 1);
  }
  return [...tally].sort(([a], [b]) => a.localeCompare(b)).map(([home, count]) => `${home} (${count})`).join(", ") || "—";
};
const mapLines = ["# Requirements section map — 2026-10-09", "", "This map records where the old numbered ledger sections went during the capability-tree move. Counts include rows from each old section; Part G headings note their shared-file provenance.", "", "| Old heading | Package | New homes (row counts) | Note moved? |", "|---|---|---|---|"];
for (const item of tree.old_sections) {
  const hasNote = (tree.capabilities.flatMap((c) => c.features).some((n) => n.notes_from?.includes(item.heading)));
  mapLines.push(`| ${item.heading} | ${item.package} | ${homesForSection(item.heading)} | ${hasNote ? `Yes, to ${tree.capabilities.flatMap((c) => c.features).find((n) => n.notes_from?.includes(item.heading)).id}` : "No"} |`);
}
const oldTen = tree.to_section_map[0];
const note = paragraphs(oldTen).join("\n\n");
mapLines.push("", `Note from ${oldTen}`, "", note, "");
writeFileSync(resolve(ROOT, "docs/requirements-sections-2026-10-09.md"), mapLines.join("\n"));
console.log(`move: ${rows.size} base rows placed once; ${Object.keys(newRows).length} new rows; BASE ${BASE}; INPUTS ${INPUTS}`);
