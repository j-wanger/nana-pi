#!/usr/bin/env node
/**
 * @module scripts/requirements-tree.mjs
 * @purpose Validate the capability and feature structure of REQUIREMENTS.md and render its lifecycle and shared-requirement outline.
 * @inputs REQUIREMENTS.md and, for the CLI, docs/requirements-tree.md.
 * @outputs Parsed headings and tables, structural problem lists, and rendered outline Markdown.
 * @effects disk (reads the ledger and optionally writes or checks the generated outline), process (CLI reports errors and exit status)
 * @errors Named structural problems for misplaced rows, invalid purposes, duplicate IDs, invalid lifecycle or sharing, nesting, or stale output.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HEADING = /^(#{1,3}) (CAP-\d{2}|FEAT-\d{3}|SUB-\d{3}) · (.+)$/;
const ATX = /^ {0,3}(#{1,6})(?:[ \t]|$)/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const ROW = /^\|\s*([RG]-\d{3})\s*\|/;
const STATUS = /^(?:proposed|active|frozen \(\S(?:.*\S)?\)|retired \(\S(?:.*\S)?\))$/;
const TABLE_HEADER = "| ID | Requirement | Status | Evidence |";
const TABLE_DELIMITER = /^\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

function scanBlocks(lines) {
  const opaque = Array(lines.length).fill(false);
  const headingsByLine = new Map();
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      opaque[i] = true;
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null;
      continue;
    }
    const opener = FENCE.exec(line);
    if (opener) { opaque[i] = true; fence = { char: opener[1][0], length: opener[1].length }; continue; }
    const atx = ATX.exec(line);
    if (atx) {
      const structural = HEADING.exec(line);
      headingsByLine.set(i, structural
        ? { level: atx[1].length, id: structural[2], label: structural[3], line: i + 1, purpose: "", status: null, statusLine: null, alsoApplies: [], parent: null, rows: [], markdownHeading: true }
        : { level: atx[1].length, id: null, label: line.slice(atx[0].length).trim().replace(/\s+#+\s*$/, ""), line: i + 1, purpose: "", status: null, statusLine: null, alsoApplies: [], parent: null, rows: [], markdownHeading: true });
      continue;
    }
    if (SETEXT.test(line) && i > 0 && lines[i - 1].trim() && !ATX.test(lines[i - 1]) && !SETEXT.test(lines[i - 1]) && lines[i - 1] !== TABLE_HEADER && !ROW.test(lines[i - 1])) {
      const prior = headingsByLine.get(i - 1);
      if (!prior) headingsByLine.set(i - 1, { level: line.trimStart()[0] === "=" ? 1 : 2, id: null, label: lines[i - 1].trim(), line: i, purpose: "", status: null, alsoApplies: [], parent: null, rows: [], markdownHeading: true });
    }
  }
  return { opaque, headingsByLine };
}

export function parseLedger(text) {
  const lines = text.split("\n");
  const { opaque, headingsByLine } = scanBlocks(lines);
  const headings = [...headingsByLine.values()].filter((h) => h.id);
  const allHeadings = [...headingsByLine.values()];
  const tables = [];
  const rowsInTables = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (opaque[i] || lines[i] !== TABLE_HEADER || opaque[i + 1] || !TABLE_DELIMITER.test(lines[i + 1] ?? "")) continue;
    const heading = [...headingsByLine].filter(([lineNo]) => lineNo < i).at(-1)?.[1] ?? null;
    const table = { heading: heading?.id ? heading : null, line: i + 1, rows: [], rowLines: [] };
    for (let j = i + 2; j < lines.length && !opaque[j]; j++) {
      const row = ROW.exec(lines[j]);
      if (!row) break;
      table.rows.push(row[1]); table.rowLines.push(j + 1); rowsInTables.add(j + 1);
      if (heading?.id) heading.rows.push(row[1]);
    }
    tables.push(table);
  }
  for (let i = 0; i < lines.length; i++) {
    const heading = headingsByLine.get(i);
    if (heading?.id && !opaque[i]) {
      for (let j = i + 1; j < lines.length && !headingsByLine.has(j); j++) {
        if (opaque[j]) continue;
        if (!heading.purpose && /^Purpose:/.test(lines[j])) heading.purpose = lines[j].slice("Purpose:".length).trim();
        if (heading.id.startsWith("FEAT-") && /^Status:/.test(lines[j])) { heading.status = lines[j].slice("Status:".length).trim(); heading.statusLine = j + 1; }
        if (heading.id.startsWith("FEAT-") && /^Also applies:/.test(lines[j])) {
          const value = lines[j].slice("Also applies:".length).trim();
          heading.alsoApplies = value ? value.split(/,\s*/) : [];
        }
      }
    }
  }
  const stack = [];
  for (const h of allHeadings.sort((a, b) => a.line - b.line)) {
    while (stack.length && stack.at(-1).level >= h.level) stack.pop();
    h.parent = stack.at(-1) ?? null;
    stack.push(h);
  }
  return { lines, headings, tables, allHeadings, opaque, headingsByLine, rowsInTables };
}

export function checkRowsUnderFeatures(parsed) {
  const problems = [];
  let nearest = null;
  for (let i = 0; i < parsed.lines.length; i++) {
    if (parsed.opaque[i]) continue;
    const heading = parsed.headingsByLine.get(i);
    if (heading) nearest = heading.id ? { id: heading.id } : null;
    const row = ROW.exec(parsed.lines[i]);
    if (row && (!parsed.rowsInTables.has(i + 1) || !nearest || !/^(FEAT|SUB)-/.test(nearest.id)))
      problems.push(`line ${i + 1}: ${row[1]} is not in a feature or subgroup table`);
  }
  for (let i = 0; i < parsed.lines.length; i++) {
    if (parsed.opaque[i] && ROW.test(parsed.lines[i])) problems.push(`line ${i + 1}: ${ROW.exec(parsed.lines[i])[1]} is not in a feature or subgroup table`);
  }
  return problems;
}
export function checkPurposes(parsed) {
  const problems = [];
  for (const h of parsed.headings) {
    let found = false;
    for (let i = h.line; i < parsed.lines.length; i++) {
      if (parsed.headingsByLine.has(i) || parsed.tables.some((table) => table.line === i + 1)) break;
      if (!parsed.opaque[i] && /^Purpose:\s*\S/.test(parsed.lines[i])) { found = true; break; }
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

export function checkLifecycleAndShares(parsed) {
  const problems = [];
  const features = parsed.headings.filter((h) => h.id.startsWith("FEAT-"));
  const rowHome = new Map();
  const rowStatus = new Map();
  for (const table of parsed.tables) {
    const feature = table.heading?.id?.startsWith("FEAT-") ? table.heading : table.heading?.parent;
    for (const id of table.rows) {
      if (feature?.id?.startsWith("FEAT-")) rowHome.set(id, feature.id);
      const source = parsed.lines[table.rowLines[table.rows.indexOf(id)] - 1] ?? "";
      const cells = source.split("|").map((cell) => cell.trim());
      rowStatus.set(id, cells[3] ?? "");
    }
  }
  for (const feature of features) {
    const status = feature.status;
    const featureTable = parsed.tables.find((table) => table.heading === feature || table.heading?.parent === feature);
    if (!status || !STATUS.test(status) || (featureTable && feature.statusLine >= featureTable.line)) problems.push(`line ${feature.line}: ${feature.id} has a missing, late or invalid Status: line`);
    if (status && /^(?:proposed|retired\b)/.test(status)) {
      const ids = parsed.headings.filter((h) => h === feature || h.parent === feature || h.parent?.parent === feature).flatMap((h) => h.rows);
      if (ids.length) problems.push(`${feature.id} has Status ${status} but holds rows`);
    }
    const seen = new Set();
    for (const id of feature.alsoApplies) {
      let why = "";
      if (!/^[RG]-\d{3}$/.test(id) || !rowHome.has(id)) why = "does not exist";
      else if (seen.has(id)) why = "is listed more than once";
      else if (rowStatus.get(id) === "retired") why = "is retired";
      else if (rowHome.get(id) === feature.id) why = "is homed in this feature";
      if (why) problems.push(`${feature.id} Also applies: ${id} ${why}`);
      seen.add(id);
    }
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
      if (j - i === 1) compressed.push(end);
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
  const rows = children ? descendants(parsed, h).flatMap((candidate) => candidate.rows) : h.rows;
  return {
    prefix: "  ".repeat(h.level - 1),
    parent: h.parent?.id ?? "—",
    rows: rows.length,
    ids: compressRowIds(rows),
  };
}
export function renderOutline(parsed) {
  const out = ["# Requirements tree", "", "Generated from `REQUIREMENTS.md`; feature lifecycle and shared requirements are shown.", ""];
  for (const h of parsed.headings) {
    const { prefix, parent, rows, ids } = outlineFields(parsed, h);
    out.push(`${prefix}- **${h.id} · ${h.label}**`);
    out.push(`${prefix}  Purpose: ${h.purpose}`);
    if (h.id.startsWith("FEAT-")) {
      out.push(`${prefix}  Status: ${h.status ?? ""}`);
      out.push(`${prefix}  Also applies: ${h.alsoApplies.join(", ") || "—"}`);
    }
    out.push(`${prefix}  Parent: ${parent} · Rows: ${rows} · IDs: ${ids}`);
  }
  const links = parsed.headings.filter((h) => h.id.startsWith("FEAT-")).flatMap((feature) => feature.alsoApplies.map((id) => ({ id, feature: feature.id })));
  const byId = new Map();
  for (const link of links) {
    if (!byId.has(link.id)) byId.set(link.id, { id: link.id, features: [] });
    byId.get(link.id).features.push(link.feature);
  }
  const home = new Map();
  for (const table of parsed.tables) for (const id of table.rows) home.set(id, table.heading?.id?.startsWith("FEAT-") ? table.heading.id : table.heading?.parent?.id);
  out.push("", "| ID | Home | Also applies to | Count |", "|---|---|---|---:|");
  const idOrder = (a, b) => {
    const rank = (id) => id.startsWith("R-") ? 0 : 1;
    return rank(a) - rank(b) || Number(a.slice(2)) - Number(b.slice(2));
  };
  const ordered = [...byId.values()].sort((a, b) => b.features.length - a.features.length || idOrder(a.id, b.id));
  for (const item of ordered) out.push(`| ${item.id} | ${home.get(item.id) ?? "—"} | ${item.features.join(", ")} | ${item.features.length} |`);
  return `${out.join("\n")}\n`;
}
export function expandRowIds(text) {
  if (text === "—" || text === "") return [];
  const ids = [];
  for (const item of text.split(/,\s*/)) {
    const range = /^([A-Za-z]+)-(\d{3})–([A-Za-z]+)-(\d{3})$/.exec(item);
    if (range) {
      if (range[1] !== range[3] || Number(range[4]) < Number(range[2])) throw new Error(`invalid row ID range: ${item}`);
      for (let number = Number(range[2]); number <= Number(range[4]); number++) ids.push(`${range[1]}-${String(number).padStart(3, "0")}`);
      continue;
    }
    if (!/^[A-Za-z]+-\d{3}$/.test(item)) throw new Error(`invalid row ID: ${item}`);
    ids.push(item);
  }
  return ids;
}
export function checkOutlineFields(outline, parsed) {
  const problems = [];
  const lines = outline.split("\n");
  for (const h of parsed.headings) {
    const titleIndex = lines.findIndex((line) => line.includes(`**${h.id} · `));
    if (titleIndex < 0) { problems.push(`${h.id}: outline field ID is missing`); continue; }
    const expected = renderOutline(parsed).split("\n");
    const statusOffset = h.id.startsWith("FEAT-") ? 2 : 0;
    const positions = [0, 1, 2 + statusOffset];
    for (const offset of positions) {
      if (lines[titleIndex + offset] !== expected[titleIndex + offset]) {
        const label = offset === 0 ? (lines[titleIndex].includes(`**${h.id} · `) ? "label" : "ID") : offset === 1 ? "purpose" : "metadata";
        problems.push(`${h.id}: outline field ${label} is missing or altered`);
      }
    }
    const detailOffset = titleIndex + (h.id.startsWith("FEAT-") ? 4 : 2);
    const actualDetail = /^\s+Parent: (.*?) · Rows: (\d+) · IDs: (.*)$/.exec(lines[detailOffset] ?? "");
    const expectedDetail = /^\s+Parent: (.*?) · Rows: (\d+) · IDs: (.*)$/.exec(expected[detailOffset] ?? "");
    if (!actualDetail || !expectedDetail || actualDetail[1] !== expectedDetail[1]) problems.push(`${h.id}: outline field parent is missing or altered`);
    if (!actualDetail || !expectedDetail || actualDetail[2] !== expectedDetail[2]) problems.push(`${h.id}: outline field row count is missing or altered`);
    if (!actualDetail || !expectedDetail || actualDetail[3] !== expectedDetail[3]) problems.push(`${h.id}: outline field row IDs are missing or altered`);
    if (h.id.startsWith("FEAT-")) {
      if (lines[titleIndex + 2] !== expected[titleIndex + 2]) problems.push(`${h.id}: outline status is missing or altered`);
      if (lines[titleIndex + 3] !== expected[titleIndex + 3]) problems.push(`${h.id}: outline shared requirements are missing or altered`);
    }
  }
  const expected = renderOutline(parsed).split("\n");
  const expectedIndex = expected.slice(expected.findIndex((line) => line === "| ID | Home | Also applies to | Count |"));
  const actualIndex = lines.slice(lines.findIndex((line) => line === "| ID | Home | Also applies to | Count |"));
  if (expectedIndex.join("\n") !== actualIndex.join("\n")) problems.push("shared index is missing or altered");
  return problems;
}
export function checkTree(text) {
  const parsed = parseLedger(text);
  const problems = [...checkRowsUnderFeatures(parsed), ...checkPurposes(parsed), ...checkUniqueHeadingIds(parsed), ...checkNesting(parsed), ...checkLifecycleAndShares(parsed)];
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
