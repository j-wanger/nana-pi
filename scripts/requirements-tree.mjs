#!/usr/bin/env node
/**
 * @module scripts/requirements-tree.mjs
 * @purpose Validate the capability and feature structure of REQUIREMENTS.md and render its compact, status-free outline.
 * @inputs REQUIREMENTS.md and, for the CLI, docs/requirements-tree.md.
 * @outputs Parsed headings and tables, structural problem lists, and rendered outline Markdown.
 * @effects disk (reads the ledger and optionally writes or checks the generated outline), process (CLI reports errors and exit status)
 * @errors Named structural problems for misplaced rows, missing purpose lines, duplicate IDs, invalid nesting or stale output.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HEADING = /^(#{1,3}) (CAP-\d{2}|FEAT-\d{3}|SUB-\d{3}) · (.+)$/;
const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?)\s*#*\s*|[ \t]*)$/;
const ROW = /^\|\s*([RG]-\d{3})\s*\|/;
const TABLE_HEADER = "| ID | Requirement | Status | Evidence |";

export function parseLedger(text) {
  const lines = text.split("\n");
  const headings = [];
  const tables = [];
  const allHeadings = [];
  let current = null;
  let table = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const markdown = ATX.exec(line);
    if (markdown) {
      current = null;
      table = null;
      const structural = HEADING.exec(line);
      const h = structural
        ? { level: structural[1].length, id: structural[2], label: structural[3], line: i + 1, purpose: "", parent: null, rows: [], markdownHeading: true }
        : { level: markdown[1].length, id: null, label: markdown[2] ?? "", line: i + 1, purpose: "", parent: null, rows: [], markdownHeading: true };
      allHeadings.push(h);
      if (structural) { headings.push(h); current = h; }
      continue;
    }
    if (current && /^Purpose:/.test(line)) current.purpose = line.slice("Purpose:".length).trim();
    if (line === TABLE_HEADER) {
      table = { heading: current, line: i + 1, rows: [] };
      tables.push(table);
      continue;
    }
    const row = ROW.exec(line);
    if (row && table) { table.rows.push(row[1]); if (table.heading) table.heading.rows.push(row[1]); }
  }
  const stack = [];
  for (const h of allHeadings) {
    while (stack.length && stack.at(-1).level >= h.level) stack.pop();
    h.parent = stack.at(-1) ?? null;
    stack.push(h);
  }
  return { lines, headings, tables, allHeadings };
}

export function checkRowsUnderFeatures(parsed) {
  const problems = [];
  let nearest = null;
  let table = null;
  for (let i = 0; i < parsed.lines.length; i++) {
    const line = parsed.lines[i];
    const markdown = ATX.exec(line);
    if (markdown) {
      nearest = null;
      table = null;
      const heading = HEADING.exec(line);
      if (heading) nearest = { level: heading[1].length, id: heading[2], line: i + 1 };
    }
    if (line === TABLE_HEADER) {
      table = parsed.tables.find((candidate) => candidate.line === i + 1) ?? null;
      continue;
    }
    const row = ROW.exec(line);
    if (row && (!nearest || !/^FEAT-|^SUB-/.test(nearest.id) || !table || table.heading?.id !== nearest.id || !table.rows.includes(row[1])))
      problems.push(`line ${i + 1}: ${row[1]} is not in a feature or subgroup table`);
  }
  return problems;
}
export function checkPurposes(parsed) {
  const problems = [];
  for (const h of parsed.headings) {
    let found = false;
    for (let i = h.line; i < parsed.lines.length; i++) {
      const line = parsed.lines[i];
      if (ATX.test(line) || line === TABLE_HEADER) break;
      if (/^Purpose:\s*\S/.test(line)) { found = true; break; }
    }
    if (!found) problems.push(`line ${h.line}: ${h.id} has no non-empty Purpose: line before its table or next heading`);
  }
  return problems;
}
export function checkUniqueHeadingIds(parsed) {
  const seen = new Set(); const problems = [];
  for (const h of parsed.headings) { if (seen.has(h.id)) problems.push(`line ${h.line}: duplicate heading ID ${h.id}`); seen.add(h.id); }
  return problems;
}
export function checkNesting(parsed) {
  const problems = [];
  for (const h of parsed.headings) {
    const expectedLevel = h.level - 1;
    const parent = h.parent;
    const validParent = h.level === 1
      ? parent === null
      : parent?.markdownHeading && parent.level === expectedLevel &&
        (h.level === 2 ? parent.id?.startsWith("CAP-") : parent.id?.startsWith("FEAT-"));
    if (h.level > 1 && !validParent)
      problems.push(`line ${h.line}: ${h.id} must be nested under the directly preceding heading level`);
    if ((h.level === 1 && !h.id.startsWith("CAP-")) || (h.level === 2 && !h.id.startsWith("FEAT-")) || (h.level === 3 && !h.id.startsWith("SUB-")))
      problems.push(`line ${h.line}: ${h.id} has the wrong heading level`);
  }
  return problems;
}

export function compressRowIds(ids) {
  const prefixes = new Map();
  for (const id of ids) {
    const prefix = id[0];
    if (!prefixes.has(prefix)) prefixes.set(prefix, []);
    prefixes.get(prefix).push(Number(id.slice(2)));
  }
  const compressed = [];
  for (const [prefix, values] of prefixes) {
    const nums = [...new Set(values)].sort((a, b) => a - b);
    for (let i = 0; i < nums.length;) {
      let j = i;
      while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
      const start = `${prefix}-${String(nums[i]).padStart(3, "0")}`;
      const end = `${prefix}-${String(nums[j]).padStart(3, "0")}`;
      compressed.push(j - i >= 2 ? `${start}–${end}` : start);
      i = j + 1;
    }
  }
  return compressed.join(", ") || "—";
}
function descendants(parsed, heading) {
  return parsed.headings.filter((candidate) => {
    let parent = candidate;
    while (parent) { if (parent === heading) return true; parent = parent.parent; }
    return false;
  });
}
function outlineFields(parsed, h) {
  const children = parsed.headings.some((candidate) => candidate.parent === h);
  const rows = descendants(parsed, h).flatMap((candidate) => candidate.rows);
  return {
    prefix: "  ".repeat(h.level - 1),
    parent: h.parent?.id ?? "—",
    rows: rows.length,
    ids: children ? "listed below" : compressRowIds(h.rows),
  };
}
export function renderOutline(parsed) {
  const out = ["# Requirements tree", "", "Generated from `REQUIREMENTS.md`; requirement statuses are intentionally omitted.", ""];
  for (const h of parsed.headings) {
    const { prefix, parent, rows, ids } = outlineFields(parsed, h);
    out.push(`${prefix}- **${h.id} · ${h.label}**`);
    out.push(`${prefix}  Purpose: ${h.purpose}`);
    out.push(`${prefix}  Parent: ${parent} · Rows: ${rows} · IDs: ${ids}`);
  }
  return `${out.join("\n")}\n`;
}
export function checkOutlineFields(outline, parsed) {
  const problems = [];
  const lines = outline.split("\n");
  for (const h of parsed.headings) {
    const { prefix, parent, rows, ids } = outlineFields(parsed, h);
    const expected = [
      ["ID", `${prefix}- **${h.id} · ${h.label}**`],
      ["label", `${prefix}- **${h.id} · ${h.label}**`],
      ["purpose", `${prefix}  Purpose: ${h.purpose}`],
      ["parent", `${prefix}  Parent: ${parent} · Rows: ${rows} · IDs: ${ids}`],
      ["row count", `${prefix}  Parent: ${parent} · Rows: ${rows} · IDs: ${ids}`],
      ["row IDs", `${prefix}  Parent: ${parent} · Rows: ${rows} · IDs: ${ids}`],
    ];
    for (const [field, line] of expected) if (!lines.includes(line)) problems.push(`${h.id}: outline field ${field} is missing or altered`);
  }
  return problems;
}
export function checkTree(text) {
  const parsed = parseLedger(text);
  const problems = [...checkRowsUnderFeatures(parsed), ...checkPurposes(parsed), ...checkUniqueHeadingIds(parsed), ...checkNesting(parsed)];
  return { parsed, problems, outline: renderOutline(parsed) };
}
export function main(argv = process.argv.slice(2)) {
  const mode = argv[0] ?? "--check";
  if (argv.length > 1 || !["--write", "--check"].includes(mode)) { console.error("Usage: requirements-tree.mjs [--write | --check]"); return 2; }
  const ledger = readFileSync(resolve(REPO_ROOT, "REQUIREMENTS.md"), "utf8");
  const result = checkTree(ledger);
  for (const p of result.problems) console.error(p);
  if (result.problems.length) return 1;
  const target = resolve(REPO_ROOT, "docs/requirements-tree.md");
  if (mode === "--write") writeFileSync(target, result.outline);
  else {
    const committed = readFileSync(target, "utf8");
    if (committed !== result.outline) {
      const a = committed.split("\n"), b = result.outline.split("\n");
      const i = a.findIndex((line, n) => line !== b[n]);
      console.error(`docs/requirements-tree.md:${i + 1}: differs from rendered outline`);
      return 1;
    }
  }
  return 0;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) process.exit(main());
