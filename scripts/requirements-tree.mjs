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
const ROW = /^\|\s*([RG]-\d{3})\s*\|/;

export function parseLedger(text) {
  const lines = text.split("\n");
  const headings = [];
  const tables = [];
  let current = null;
  let table = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = HEADING.exec(line);
    if (match) {
      current = { level: match[1].length, id: match[2], label: match[3], line: i + 1, purpose: "", parent: null, rows: [] };
      headings.push(current);
      table = null;
      continue;
    }
    if (/^#{1,3} /.test(line)) { current = null; table = null; continue; }
    if (current && /^Purpose:/.test(line)) current.purpose = line.slice("Purpose:".length).trim();
    if (line === "| ID | Requirement | Status | Evidence |") {
      table = { heading: current, line: i + 1, rows: [] };
      tables.push(table);
      continue;
    }
    const row = ROW.exec(line);
    if (row && table) { table.rows.push(row[1]); if (current) current.rows.push(row[1]); }
  }
  const stack = [];
  for (const h of headings) {
    while (stack.length && stack.at(-1).level >= h.level) stack.pop();
    h.parent = stack.at(-1) ?? null;
    stack.push(h);
  }
  return { lines, headings, tables };
}

export function checkRowsUnderFeatures(parsed) {
  const problems = [];
  let nearest = null;
  for (let i = 0; i < parsed.lines.length; i++) {
    const h = HEADING.exec(parsed.lines[i]);
    if (h) nearest = { level: h[1].length, id: h[2], line: i + 1 };
    const row = ROW.exec(parsed.lines[i]);
    if (row && (!nearest || !/^FEAT-|^SUB-/.test(nearest.id) || !parsed.tables.some((t) => t.line <= i + 1 && t.rows.includes(row[1]))))
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
      if (/^#{1,3} /.test(line) || line === "| ID | Requirement | Status | Evidence |") break;
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
    const expected = h.level - 1;
    if (h.level > 1 && (!h.parent || h.parent.level !== expected || (h.level === 2 && !h.parent.id.startsWith("CAP-")) || (h.level === 3 && !h.parent.id.startsWith("FEAT-"))))
      problems.push(`line ${h.line}: ${h.id} must be nested under the directly preceding heading level`);
    if ((h.level === 1 && !h.id.startsWith("CAP-")) || (h.level === 2 && !h.id.startsWith("FEAT-")) || (h.level === 3 && !h.id.startsWith("SUB-")))
      problems.push(`line ${h.line}: ${h.id} has the wrong heading level`);
  }
  return problems;
}
function compress(ids) {
  const nums = ids.map((id) => Number(id.slice(2))).sort((a,b) => a-b);
  const groups = [];
  for (let i = 0; i < nums.length;) { let j = i; while (j + 1 < nums.length && nums[j+1] === nums[j]+1) j++; groups.push(j-i >= 2 ? `R-${String(nums[i]).padStart(3,"0")}–R-${String(nums[j]).padStart(3,"0")}` : `R-${String(nums[i]).padStart(3,"0")}`); i = j+1; }
  return groups.join(", ") || "—";
}
export function renderOutline(parsed) {
  const out = ["# Requirements tree", "", "Generated from `REQUIREMENTS.md`; requirement statuses are intentionally omitted.", ""];
  for (const h of parsed.headings) {
    const depth = h.level - 1;
    const parent = h.parent?.id ?? "—";
    out.push(`${"  ".repeat(depth)}- **${h.id} · ${h.label}**`);
    out.push(`${"  ".repeat(depth+1)}Purpose: ${h.purpose}`);
    out.push(`${"  ".repeat(depth+1)}Parent: ${parent} · Rows: ${h.rows.length} · IDs: ${compress(h.rows)}`);
  }
  return `${out.join("\n")}\n`;
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
