#!/usr/bin/env node
/**
 * @module scripts/requirements-tree.mjs
 * @purpose Validate the capability and feature structure of REQUIREMENTS.md and render its lifecycle and shared-requirement outline.
 * @inputs REQUIREMENTS.md and, for the CLI, docs/requirements-tree.md.
 * @outputs Parsed headings and tables, structural problem lists, and rendered outline Markdown.
 * @effects disk (reads the ledger and optionally writes or checks the generated outline), process (CLI reports errors and exit status)
 * @errors Named structural problems for misplaced rows, invalid purposes, duplicate IDs, invalid capability fields, lifecycle or sharing, nesting, or stale output.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDeliverables } from "./deliverables.mjs";
import { ID, requirementRowId, WHITESPACE } from "./requirements-trace.mjs";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HEADING = /^(#{1,3}) (CAP-\d{2}|FEAT-\d{3}|SUB-\d{3}) · (.+)$/;
const ATX = /^ {0,3}(#{1,6})(?:[ \t]|$)/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const STATUS = /^(?:proposed|active|frozen \(\S(?:.*\S)?\)|retired \(\S(?:.*\S)?\))$/;
// contract: R-2441 — the complete capability field vocabulary, in outline order.
export const CAPABILITY_FIELD_LABELS = ["Kind", "Needs", "Binds", "Deliverables", "Retired"];
const CAPABILITY_LIST_FIELDS = new Set(CAPABILITY_FIELD_LABELS.filter((label) => label !== "Kind"));
export const TABLE_HEADER = "| ID | Requirement | Status | Evidence |";
export const TABLE_DELIMITER = /^\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*$/;
const MARKDOWN_TABLE_DELIMITER_CELL = /^:?-+:?$/;
export function markdownTableCells(line) {
  if (!line.includes("|")) return null;
  const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  return cells.length >= 2 ? cells : null;
}
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
        ? { level: atx[1].length, id: structural[2], label: structural[3], line: i + 1, purpose: "", status: null, statusLine: null, statusLines: [], alsoApplies: [], alsoAppliesLines: [], firstMarkdownTableLine: null, parent: null, rows: [], markdownHeading: true }
        : { level: atx[1].length, id: null, label: line.slice(atx[0].length).trim().replace(/\s+#+\s*$/, ""), line: i + 1, purpose: "", status: null, statusLine: null, statusLines: [], alsoApplies: [], alsoAppliesLines: [], firstMarkdownTableLine: null, parent: null, rows: [], markdownHeading: true });
      continue;
    }
    if (SETEXT.test(line) && i > 0 && lines[i - 1].trim() && !ATX.test(lines[i - 1]) && !SETEXT.test(lines[i - 1]) && lines[i - 1] !== TABLE_HEADER && requirementRowId(lines[i - 1]) === null) {
      const prior = headingsByLine.get(i - 1);
      if (!prior) headingsByLine.set(i - 1, { level: line.trimStart()[0] === "=" ? 1 : 2, id: null, label: lines[i - 1].trim(), line: i, purpose: "", status: null, statusLine: null, statusLines: [], alsoApplies: [], alsoAppliesLines: [], parent: null, rows: [], markdownHeading: true });
    }
  }
  return { opaque, headingsByLine };
}

export function parseLedger(text) {
  const lines = (text.startsWith("\ufeff") ? text.slice(1) : text).split(/\r?\n/);
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
      const rowId = requirementRowId(lines[j]);
      if (!rowId) {
        if (lines[j].startsWith("|")) continue;
        break;
      }
      table.rows.push(rowId); table.rowLines.push(j + 1); rowsInTables.add(j + 1);
      if (heading?.id) heading.rows.push(rowId);
    }
    tables.push(table);
  }
  for (let i = 0; i < lines.length; i++) {
    const heading = headingsByLine.get(i);
    if (heading?.id && !opaque[i]) {
      for (let j = i + 1; j < lines.length && !headingsByLine.has(j); j++) {
        if (opaque[j]) continue;
        if (!heading.purpose && /^Purpose:/.test(lines[j])) heading.purpose = lines[j].slice("Purpose:".length).trim();
        if (heading.id.startsWith("CAP-") && !heading.outcome && /^Outcome:/.test(lines[j])) heading.outcome = lines[j].slice("Outcome:".length).trim();
        if (heading.id.startsWith("CAP-")) {
          const label = CAPABILITY_FIELD_LABELS.find((candidate) => lines[j].startsWith(`${candidate}:`));
          if (label) {
            heading.capabilityFieldCandidates ??= Object.fromEntries(CAPABILITY_FIELD_LABELS.map((candidate) => [candidate, []]));
            heading.capabilityFieldCandidates[label].push({ value: lines[j].slice(label.length + 1).trim(), line: j + 1 });
          }
        }
        if (heading.id.startsWith("FEAT-") && /^Status:/.test(lines[j])) {
          const value = lines[j].slice("Status:".length).trim();
          heading.statusLines.push({ value, line: j + 1 });
          if (heading.statusLines.length === 1) { heading.status = value; heading.statusLine = j + 1; }
        }
        if (heading.id.startsWith("FEAT-") && /^Also applies:/.test(lines[j])) {
          const value = lines[j].slice("Also applies:".length).trim();
          heading.alsoAppliesLines.push({ value, line: j + 1 });
          if (value) heading.alsoApplies.push(...value.split(/,\s*/));
        }
      }
      if (heading.id.startsWith("CAP-")) {
        const candidates = heading.capabilityFieldCandidates ?? Object.fromEntries(CAPABILITY_FIELD_LABELS.map((label) => [label, []]));
        const hasKind = candidates.Kind.length > 0;
        heading.capabilityFields = Object.fromEntries(CAPABILITY_FIELD_LABELS.map((label) => [label, (label === "Kind" || label === "Retired" || hasKind) ? candidates[label] : []]));
        delete heading.capabilityFieldCandidates;
      }
    }
  }
  const stack = [];
  for (const h of allHeadings.sort((a, b) => a.line - b.line)) {
    while (stack.length && stack.at(-1).level >= h.level) stack.pop();
    h.parent = stack.at(-1) ?? null;
    stack.push(h);
  }
  for (let i = 0; i < lines.length - 1; i++) {
    if (opaque[i] || opaque[i + 1]) continue;
    const headerCells = markdownTableCells(lines[i]);
    const delimiterCells = markdownTableCells(lines[i + 1]);
    if (!headerCells || headerCells.length !== delimiterCells?.length || !delimiterCells.every((cell) => MARKDOWN_TABLE_DELIMITER_CELL.test(cell))) continue;
    const owner = [...headingsByLine].filter(([lineNo]) => lineNo < i).at(-1)?.[1];
    let feature = owner;
    while (feature && !feature.id?.startsWith("FEAT-")) feature = feature.parent;
    if (feature?.id?.startsWith("FEAT-") && feature.firstMarkdownTableLine === null) feature.firstMarkdownTableLine = i + 1;
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
    const rowId = requirementRowId(parsed.lines[i]);
    if (rowId && (!parsed.rowsInTables.has(i + 1) || !nearest || !/^(FEAT|SUB)-/.test(nearest.id)))
      problems.push(`line ${i + 1}: ${rowId} is not in a feature or subgroup table`);
  }
  for (let i = 0; i < parsed.lines.length; i++) {
    const rowId = parsed.opaque[i] ? requirementRowId(parsed.lines[i]) : null;
    if (rowId) problems.push(`line ${i + 1}: ${rowId} is not in a feature or subgroup table`);
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
  for (const row of readRequirementRows(parsed)) {
    const feature = row.heading?.id?.startsWith("FEAT-") ? row.heading : row.heading?.parent;
    if (feature?.id?.startsWith("FEAT-")) rowHome.set(row.id, feature.id);
    rowStatus.set(row.id, row.status);
  }
  for (const feature of features) {
    const status = feature.status;
    const featureTable = parsed.tables.find((table) => table.heading === feature || table.heading?.parent === feature);
    const firstTableLine = feature.firstMarkdownTableLine ?? featureTable?.line ?? null;
    if (feature.statusLines.length > 1) for (const entry of feature.statusLines) problems.push(`line ${entry.line}: ${feature.id} has duplicate Status: line`);
    if (feature.alsoAppliesLines.length > 1) for (const entry of feature.alsoAppliesLines) problems.push(`line ${entry.line}: ${feature.id} has duplicate Also applies: line`);
    if (!status || !STATUS.test(status) || (firstTableLine !== null && feature.statusLine >= firstTableLine)) problems.push(`line ${feature.statusLine ?? feature.line}: ${feature.id} has a missing, late or invalid Status: line`);
    if (status && /^(?:proposed|retired\b)/.test(status)) {
      const ids = parsed.headings.filter((h) => h === feature || h.parent === feature || h.parent?.parent === feature).flatMap((h) => h.rows);
      if (ids.length) problems.push(`${feature.id} has Status ${status} but holds rows`);
    }
    const seen = new Set();
    for (const entry of feature.alsoAppliesLines) {
      const ids = entry.value ? entry.value.split(/,\s*/) : [];
      for (const id of ids) {
        let why = "";
        if (!ID.test(id) || !rowHome.has(id)) why = "does not exist";
        else if (seen.has(id)) why = "is listed more than once";
        else if (rowStatus.get(id) === "retired") why = "is retired";
        else if (rowHome.get(id) === feature.id) why = "is homed in this feature";
        if (why) problems.push(`line ${entry.line}: ${feature.id} Also applies: ${id} ${why}`);
        seen.add(id);
      }
    }
  }
  return problems;
}
const capabilityEntries = (heading, label) => heading.capabilityFields?.[label] ?? [];
const capabilityKind = (heading) => capabilityEntries(heading, "Kind")[0]?.value ?? null;
const isRetiredCapability = (heading) => capabilityEntries(heading, "Retired").length > 0;
const splitCapabilityList = (value) => value.split(/,\s*/);
function capabilityOf(heading) {
  let current = heading;
  while (current && !current.id?.startsWith("CAP-")) current = current.parent;
  return current?.id?.startsWith("CAP-") ? current : null;
}

export function checkCapabilityFields(parsed) {
  const problems = [];
  const capabilities = parsed.headings.filter((heading) => heading.id.startsWith("CAP-"));
  const capabilitiesById = new Map(capabilities.map((heading) => [heading.id, heading]));
  const rowsById = new Map(readRequirementRows(parsed).map((entry) => [entry.id, entry]));
  const fieldProblem = (heading, entry, label, detail) => problems.push(`line ${entry?.line ?? heading.line}: ${heading.id} ${label}: ${entry?.value ?? ""} ${detail}`);

  for (const capability of capabilities) {
    for (const label of CAPABILITY_FIELD_LABELS) {
      const entries = capabilityEntries(capability, label);
      if (entries.length > 1) for (const entry of entries) fieldProblem(capability, entry, label, "is a duplicate field line");
    }
    for (const entry of capabilityEntries(capability, "Kind")) {
      if (entry.value !== "product" && entry.value !== "constraint") fieldProblem(capability, entry, "Kind", "must be exactly product or constraint");
    }
  }

  const validateCapabilityTargets = (capability, label, entry, predicate, detail) => {
    const seen = new Set();
    for (const token of splitCapabilityList(entry.value)) {
      const target = /^CAP-\d{2}$/.test(token) ? capabilitiesById.get(token) : null;
      if (seen.has(token)) fieldProblem(capability, entry, label, `${token || "(empty)"} is listed more than once`);
      if (!target || !predicate(target, token)) fieldProblem(capability, entry, label, `${token || "(empty)"} ${detail}`);
      seen.add(token);
    }
  };

  for (const capability of capabilities) {
    const kind = capabilityKind(capability);
    const deliverables = capabilityEntries(capability, "Deliverables");
    if (deliverables.length && kind !== "product") for (const entry of deliverables) fieldProblem(capability, entry, "Deliverables", "is allowed only on Kind: product");
    if (kind === "product") for (const entry of deliverables) {
      const seen = new Set();
      for (const token of splitCapabilityList(entry.value)) {
        const item = ID.test(token) ? rowsById.get(token) : null;
        let detail = "";
        if (!item) detail = "does not name a requirement row";
        else if (item.status === "retired") detail = "is retired";
        else if (capabilityOf(item.heading) !== capability) detail = "is homed under another capability";
        if (seen.has(token)) fieldProblem(capability, entry, "Deliverables", `${token || "(empty)"} is listed more than once`);
        if (detail) fieldProblem(capability, entry, "Deliverables", `${token || "(empty)"} ${detail}`);
        seen.add(token);
      }
    }

    const binds = capabilityEntries(capability, "Binds");
    if (kind === "constraint" && !isRetiredCapability(capability) && binds.length !== 1)
      fieldProblem(capability, binds[0], "Binds", "must occur exactly once on Kind: constraint");
    if (binds.length && kind !== "constraint") for (const entry of binds) fieldProblem(capability, entry, "Binds", "is allowed only on Kind: constraint");
    if (kind === "constraint") for (const entry of binds) validateCapabilityTargets(
      capability,
      "Binds",
      entry,
      (target) => capabilityKind(target) === "product" && !isRetiredCapability(target),
      "must name a live Kind: product capability",
    );

    const needs = capabilityEntries(capability, "Needs");
    if (needs.length && kind !== "product") for (const entry of needs) fieldProblem(capability, entry, "Needs", "is allowed only on Kind: product");
    if (kind === "product") for (const entry of needs) validateCapabilityTargets(
      capability,
      "Needs",
      entry,
      (target) => target.line < capability.line && capabilityKind(target) === "product" && !isRetiredCapability(target),
      "must name an earlier live Kind: product capability",
    );

    const retired = capabilityEntries(capability, "Retired");
    for (const entry of retired) {
      validateCapabilityTargets(
        capability,
        "Retired",
        entry,
        (target) => target !== capability && !isRetiredCapability(target),
        "must name another live capability",
      );
      for (const label of CAPABILITY_FIELD_LABELS.filter((candidate) => !["Kind", "Retired"].includes(candidate))) {
        for (const stageEntry of capabilityEntries(capability, label)) fieldProblem(capability, stageEntry, "Retired", `may not carry ${label}:`);
      }
      for (const feature of parsed.headings.filter((heading) => heading.parent === capability && heading.id.startsWith("FEAT-"))) {
        if (!feature.status?.startsWith("retired (")) fieldProblem(capability, entry, "Retired", `holds live feature ${feature.id}`);
      }
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
export function readRequirementRows(parsed) {
  const trim = (value) => value.replace(new RegExp(`^[${WHITESPACE}]+|[${WHITESPACE}]+$`, "gu"), "");
  const rows = [];
  for (const table of parsed.tables) {
    for (let index = 0; index < table.rows.length; index++) {
      const line = parsed.lines[table.rowLines[index] - 1] ?? "";
      const cells = line.split("|").map(trim);
      rows.push({
        id: table.rows[index],
        requirement: cells[2] ?? "",
        status: cells[3] ?? "",
        evidence: cells[4] ?? "",
        line: table.rowLines[index],
        heading: table.heading,
      });
    }
  }
  return rows;
}
export function descendants(parsed, heading) {
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
    if (h.id.startsWith("CAP-")) {
      for (const label of CAPABILITY_FIELD_LABELS) {
        const entries = capabilityEntries(h, label);
        if (!entries.length) continue;
        const values = entries.flatMap((entry) => CAPABILITY_LIST_FIELDS.has(label) ? splitCapabilityList(entry.value) : [entry.value]);
        out.push(`${prefix}  ${label}: ${values.join(", ")}`);
      }
    }
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
    const range = /^([RG]-(?:[0-9]{3}|[1-9][0-9]{3}))–([RG]-(?:[0-9]{3}|[1-9][0-9]{3}))$/.exec(item);
    if (range) {
      const start = range[1];
      const end = range[2];
      const prefix = start.slice(0, 1);
      const first = Number(start.slice(2));
      const last = Number(end.slice(2));
      if (prefix !== end.slice(0, 1) || last < first) throw new Error(`invalid row ID range: ${item}`);
      for (let number = first; number <= last; number++) ids.push(`${prefix}-${String(number).padStart(3, "0")}`);
      continue;
    }
    if (!ID.test(item)) throw new Error(`invalid row ID: ${item}`);
    ids.push(item);
  }
  return ids;
}
export function checkOutlineFields(outline, parsed) {
  const problems = [];
  const lines = outline.split("\n");
  const compress = (ids) => {
    const groups = new Map();
    for (const id of ids) {
      const prefix = id[0];
      if (!groups.has(prefix)) groups.set(prefix, []);
      groups.get(prefix).push(Number(id.slice(2)));
    }
    const result = [];
    for (const [prefix, values] of groups) {
      const numbers = [...new Set(values)].sort((a, b) => a - b);
      for (let i = 0; i < numbers.length;) {
        let end = i;
        while (end + 1 < numbers.length && numbers[end + 1] === numbers[end] + 1) end++;
        const first = `${prefix}-${String(numbers[i]).padStart(3, "0")}`;
        const last = `${prefix}-${String(numbers[end]).padStart(3, "0")}`;
        result.push(end - i >= 2 ? `${first}–${last}` : first);
        if (end - i === 1) result.push(last);
        i = end + 1;
      }
    }
    return result.join(", ") || "—";
  };
  const descendsFrom = (candidate, ancestor) => {
    let parent = candidate;
    while (parent) { if (parent === ancestor) return true; parent = parent.parent; }
    return false;
  };
  for (const h of parsed.headings) {
    const prefix = "  ".repeat(h.level - 1);
    const titleIndex = lines.findIndex((line) => line.startsWith(`${prefix}- **${h.id} · `));
    if (titleIndex < 0) { problems.push(`${h.id}: outline field ID is missing`); continue; }
    if (lines[titleIndex] !== `${prefix}- **${h.id} · ${h.label}**`) problems.push(`${h.id}: outline field label is missing or altered`);
    if (lines[titleIndex + 1] !== `${prefix}  Purpose: ${h.purpose}`) problems.push(`${h.id}: outline field purpose is missing or altered`);
    const hasChildren = parsed.headings.some((candidate) => candidate.parent === h);
    const rows = hasChildren ? parsed.headings.filter((candidate) => descendsFrom(candidate, h)).flatMap((candidate) => candidate.rows) : h.rows;
    let detailOffset = 2;
    if (h.id.startsWith("FEAT-")) {
      if (lines[titleIndex + 2] !== `${prefix}  Status: ${h.status ?? ""}`) problems.push(`${h.id}: outline status is missing or altered`);
      if (lines[titleIndex + 3] !== `${prefix}  Also applies: ${h.alsoApplies.join(", ") || "—"}`) problems.push(`${h.id}: outline shared requirements are missing or altered`);
      detailOffset = 4;
    }
    const expectedDetail = `${prefix}  Parent: ${h.parent?.id ?? "—"} · Rows: ${rows.length} · IDs: ${compress(rows)}`;
    const actualDetail = lines[titleIndex + detailOffset] ?? "";
    if (!actualDetail.includes(`Parent: ${h.parent?.id ?? "—"}`)) problems.push(`${h.id}: outline field parent is missing or altered`);
    if (!actualDetail.includes(`Rows: ${rows.length} ·`)) problems.push(`${h.id}: outline field row count is missing or altered`);
    if (!actualDetail.endsWith(`IDs: ${compress(rows)}`)) problems.push(`${h.id}: outline field row IDs are missing or altered`);
    if (actualDetail !== expectedDetail && !problems.some((problem) => problem.startsWith(`${h.id}: outline field`))) problems.push(`${h.id}: outline field metadata is altered`);
    if (h.id.startsWith("CAP-")) {
      let fieldOffset = detailOffset + 1;
      for (const label of CAPABILITY_FIELD_LABELS) {
        const entries = capabilityEntries(h, label);
        if (!entries.length) continue;
        const values = entries.flatMap((entry) => CAPABILITY_LIST_FIELDS.has(label) ? splitCapabilityList(entry.value) : [entry.value]);
        const expected = `${prefix}  ${label}: ${values.join(", ")}`;
        if (lines[titleIndex + fieldOffset] !== expected) problems.push(`${h.id}: outline ${label}: is missing or altered`);
        fieldOffset++;
      }
    }
  }
  const links = parsed.headings.filter((feature) => feature.id.startsWith("FEAT-")).flatMap((feature) => feature.alsoApplies.map((id) => ({ id, feature: feature.id })));
  const homes = new Map();
  for (const table of parsed.tables) for (const id of table.rows) homes.set(id, table.heading?.id?.startsWith("FEAT-") ? table.heading.id : table.heading?.parent?.id);
  const grouped = new Map();
  for (const link of links) {
    if (!grouped.has(link.id)) grouped.set(link.id, { id: link.id, listers: [] });
    grouped.get(link.id).listers.push(link.feature);
  }
  const before = (a, b) => (a.startsWith("R-") ? 0 : 1) - (b.startsWith("R-") ? 0 : 1) || Number(a.slice(2)) - Number(b.slice(2));
  const expectedIndex = ["| ID | Home | Also applies to | Count |", "|---|---|---|---:|"];
  for (const entry of [...grouped.values()].sort((a, b) => b.listers.length - a.listers.length || before(a.id, b.id))) expectedIndex.push(`| ${entry.id} | ${homes.get(entry.id) ?? "—"} | ${entry.listers.join(", ")} | ${entry.listers.length} |`);
  const indexStart = lines.findIndex((line) => line === expectedIndex[0]);
  if (indexStart < 0 || lines.slice(indexStart, indexStart + expectedIndex.length).join("\n") !== expectedIndex.join("\n") || lines.slice(indexStart + expectedIndex.length).some((line) => line.startsWith("| "))) problems.push("shared index is missing or altered");
  return problems;
}
// R-1161: a heading that looks like it is reaching for the tree form (a CAP/FEAT/SUB id at
// an ATX level, zero to three leading spaces and one to six #s, the same levels and leading
// space the ATX parser above accepts) but that the heading parser above rejects — wrong
// separator, wrong digit count, or anything else off the exact "# CAP-nn · Label" form.
const TREE_HEADING_LIKE = /^\s{0,3}#{1,6}\s*(CAP|FEAT|SUB)-\d+/;
const NEAR_MISS_FORM = { CAP: "# CAP-nn · Label", FEAT: "## FEAT-nnn · Label", SUB: "### SUB-nnn · Label" };
function checkNearMissHeadings(parsed) {
  const problems = [];
  for (let i = 0; i < parsed.lines.length; i++) {
    if (parsed.opaque[i]) continue;
    const line = parsed.lines[i];
    if (HEADING.test(line)) continue;
    const nearMiss = TREE_HEADING_LIKE.exec(line);
    if (!nearMiss) continue;
    problems.push(`line ${i + 1}: heading looks like a tree heading but is not in the form "${NEAR_MISS_FORM[nearMiss[1]]}"`);
  }
  return problems;
}
// R-1159 / R-1160: a raw count of requirement row lines, by requirementRowId alone, fenced
// rows included (the trace rail counts every line it recognises, fenced or not) — never
// through readRequirementRows, whose table detection needs a byte-exact
// "| ID | Requirement | Status | Evidence |" header and breaks a table at a blank line. A
// padded header (a markdown formatter, or one trailing space), a blank line inside a table, or
// a row inside a code fence must not undercount the rows a no-tree ledger holds, or make a
// ledger that has rows read as having none.
export function countRequirementRowLines(parsed) {
  let count = 0;
  for (let i = 0; i < parsed.lines.length; i++) {
    if (requirementRowId(parsed.lines[i])) count++;
  }
  return count;
}
// R-1159: the single line a ledger with rows and no capability or feature heading gets,
// in place of one "not in a feature or subgroup table" problem per row.
export function noTreeProblem(rowCount) {
  return `REQUIREMENTS.md holds ${rowCount} requirement rows and no capability or feature heading: this ledger has no requirements tree yet. The requirements skill describes the next step.`;
}
// R-1160: a ledger a text reader cannot trust — a NUL byte (almost always a UTF-16 file saved
// without converting it) or no requirement row at all. Shared by the tree checker CLI and the
// product report, called ahead of checkTree so neither one runs its structural checks over
// bytes that were never valid UTF-8 text to begin with.
export function ledgerReadProblem(text, parsed) {
  if (text.includes("\u0000")) return "REQUIREMENTS.md: NUL byte; likely UTF-16 from Windows PowerShell 5.1; save it as UTF-8";
  if (countRequirementRowLines(parsed) === 0) return "REQUIREMENTS.md: no requirement rows";
  return null;
}
export function checkTree(text) {
  const parsed = parseLedger(text);
  const nearMiss = checkNearMissHeadings(parsed);
  const rowCount = countRequirementRowLines(parsed);
  // R-1159: a capability or feature heading is what makes a tree, not a bare SUB heading on
  // its own (it still nests under nothing, but that is a nesting problem, never this one).
  const hasCapOrFeat = parsed.headings.some((h) => h.id.startsWith("CAP-") || h.id.startsWith("FEAT-"));
  // R-1159 / R-1161: with no capability or feature heading at all, a row-by-row "not in a
  // feature or subgroup table" flood (or a stray SUB heading's own nesting problem) is
  // replaced by ONE line — the near-miss headings when any are present (the ledger is
  // reaching for a tree and typo'd it), else the plain no-tree line. The ledger has no real
  // tree yet, so the other structural checks (purposes, unique IDs, nesting, lifecycle), which
  // only ever look at real CAP/FEAT/SUB headings, stay silent here; they resume once there is
  // a tree to check.
  const problems = !hasCapOrFeat && rowCount > 0
    ? [...(nearMiss.length ? nearMiss : [noTreeProblem(rowCount)])]
    : [...checkRowsUnderFeatures(parsed), ...checkPurposes(parsed), ...checkUniqueHeadingIds(parsed), ...checkNesting(parsed), ...checkLifecycleAndShares(parsed), ...checkCapabilityFields(parsed), ...nearMiss];
  return { parsed, problems, outline: renderOutline(parsed) };
}
function usage() {
  console.error("Usage: requirements-tree.mjs [--write | --check] | requirements-tree.mjs --root <dir>");
  return 2;
}
function deliverableReport(parsed, ledgerFolder) {
  const pending = checkDeliverables(parsed, null);
  if (pending.pathsToCheck.length === 0) return pending;
  let result;
  try {
    result = spawnSync("git", ["-C", ledgerFolder, "ls-tree", "-r", "-z", "--name-only", "HEAD"], { encoding: "buffer" });
  } catch {
    result = null;
  }
  if (!result || result.error || result.status !== 0) {
    return { ...pending, notes: [...pending.notes, "deliverable note: paths not checked: git could not read the ledger folder's HEAD tree"] };
  }
  const trackedPaths = result.stdout.toString("utf8").split("\0").filter(Boolean);
  return checkDeliverables(parsed, trackedPaths);
}
function printDeliverableReport(parsed, ledgerFolder, { alwaysSummary = false } = {}) {
  const report = deliverableReport(parsed, ledgerFolder);
  if (alwaysSummary || report.checkedDeliverables > 0 || report.fieldLineCount > 0) {
    const features = parsed.headings.filter((h) => h.id.startsWith("FEAT-")).length;
    console.log(`requirements tree: 0 problems; rows ${readRequirementRows(parsed).length}; features ${features}`);
    if (report.fieldLineCount > 0) console.log(`deliverables: ${report.madeAndReadByCode} of ${report.checkedDeliverables} made and read by code`);
    for (const entry of report.notes) console.log(entry);
  }
}
export function main(argv = process.argv.slice(2)) {
  if (argv[0] === "--root") {
    if (argv.length !== 2 || !argv[1]) return usage();
    const ledgerPath = resolve(process.cwd(), argv[1], "REQUIREMENTS.md");
    let text;
    try { text = readFileSync(ledgerPath, "utf8"); } catch (error) { console.error(`${ledgerPath}: ${error.message}`); return 1; }
    const parsed = parseLedger(text);
    const readProblem = ledgerReadProblem(text, parsed);
    if (readProblem) { console.error(readProblem); return 1; }
    const { problems } = checkTree(text);
    if (problems.length) { for (const p of problems) console.error(p); return 1; }
    printDeliverableReport(parsed, dirname(ledgerPath), { alwaysSummary: true });
    return 0;
  }
  const mode = argv[0] ?? "--check";
  if (argv.length > 1 || !["--write", "--check"].includes(mode)) return usage();
  const ledger = readFileSync(resolve(REPO_ROOT, "REQUIREMENTS.md"), "utf8");
  const readProblem = ledgerReadProblem(ledger, parseLedger(ledger));
  if (readProblem) { console.error(readProblem); return 1; }
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
  printDeliverableReport(result.parsed, dirname(resolve(REPO_ROOT, "REQUIREMENTS.md")));
  return 0;
}
if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exit(main());
