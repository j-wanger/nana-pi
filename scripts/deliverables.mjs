#!/usr/bin/env node
/**
 * @module scripts/deliverables.mjs
 * @purpose Check product-capability maker and reader lines for readable claims, reasons, and paths tracked at HEAD.
 * @inputs A parsed requirements tree and an injected list of ledger-relative paths tracked in the ledger folder's HEAD tree.
 * @outputs Deliverable notes, path claims to check, and counts describing whether deliverables were checked.
 * @effects none
 * @errors Returns report-only notes for malformed claims, missing reasons or paths, and paths not tracked at HEAD; never throws for a claim.
 */

// Contract: the owner's 2026-10-22 approval; R-2537.
export const DELIVERABLE_FIELD_LABELS = Object.freeze(["Made by", "Read by"]);
// Contract: the audit's six runs plus hook and extension from the seat brief, and manual from the ruling; R-2537.
export const MAKER_RUNS = Object.freeze(["session start", "suite", "land", "review", "build", "CI", "hook", "extension", "manual"]);
// Contract: code and rule come from the ruling; prompt and person are chosen because injected context and pages are readers; R-2537.
export const READER_KINDS = Object.freeze(["code", "prompt", "person", "rule"]);
// Contract: manual, rule, and person claims explain why they exist; R-2535.
export const REASON_REQUIRED = Object.freeze(["manual", "rule", "person"]);
// Contract: every automatic maker and every code or prompt reader names code; R-2537.
export const PATH_REQUIRED = Object.freeze([...MAKER_RUNS.filter((run) => run !== "manual"), "code", "prompt"]);
// Chosen: the requirements ledger's heading separator.
export const PART_SEPARATOR = " · ";
// Contract: lane B's machine-local artifact name.
export const RUNTIME_MAP_ARTIFACT = "runtime-map";

const MAKER_SET = new Set(MAKER_RUNS);
const READER_SET = new Set(READER_KINDS);
const REASON_SET = new Set(REASON_REQUIRED);
const FIELD_PREFIX = /^(Made by|Read by):\s*(.*)$/;
const ROW_AT_START = /^(R-(?:[0-9]{3}|[1-9][0-9]{3}))\b/;

const capabilityEntries = (heading, label) => heading.capabilityFields?.[label] ?? [];
const capabilityKind = (heading) => capabilityEntries(heading, "Kind")[0]?.value ?? null;
const liveProduct = (heading) => capabilityKind(heading) === "product" && capabilityEntries(heading, "Retired").length === 0;
const deliverableIds = (heading) => capabilityEntries(heading, "Deliverables").flatMap((entry) => entry.value.split(/,\s*/).filter(Boolean));
const note = (message) => `deliverable note: ${message}`;

function ownFieldLines(parsed, capability) {
  const start = capability.line;
  let end = parsed.lines.length;
  for (const [index] of parsed.headingsByLine) {
    if (index + 1 > start) { end = Math.min(end, index); break; }
  }
  const lines = [];
  for (let index = start; index < end; index++) {
    if (parsed.opaque[index]) continue;
    const rawText = parsed.lines[index];
    const text = rawText.replace(/[ \t]+$/u, "");
    const match = FIELD_PREFIX.exec(text);
    if (match) lines.push({ label: match[1], body: match[2], line: index + 1, text, rawText });
  }
  return lines;
}

function trackedAtHead(path, tracked) {
  const folder = path.endsWith("/") ? path.slice(0, -1) : path;
  return tracked.has(folder) || [...tracked].some((candidate) => candidate.startsWith(`${folder}/`));
}

/** Row ID -> its exact maker and reader field lines in capability spans, in document order. */
export function deliverableFieldLinesByRow(parsed) {
  const result = new Map();
  for (const capability of parsed.headings.filter((heading) => heading.id?.startsWith("CAP-"))) {
    for (const field of ownFieldLines(parsed, capability)) {
      const row = ROW_AT_START.exec(field.body)?.[1];
      if (!row) continue;
      if (!result.has(row)) result.set(row, []);
      result.get(row).push(field.rawText);
    }
  }
  return result;
}

/** Check deliverable fields. Pass null for trackedPaths to collect path claims without deciding them. */
export function checkDeliverables(parsed, trackedPaths = null) {
  const notes = [];
  const pathsToCheck = [];
  let checkedDeliverables = 0;
  let fieldLineCount = 0;

  const addPath = (row, path, line, kind) => {
    const value = path.trim();
    if (!value) return;
    if (kind === "artifact" && value === RUNTIME_MAP_ARTIFACT) return;
    pathsToCheck.push({ row, path: value, line, kind });
  };

  for (const capability of parsed.headings.filter((heading) => heading.id?.startsWith("CAP-"))) {
    const fields = ownFieldLines(parsed, capability);
    fieldLineCount += fields.length;
    if (!liveProduct(capability)) {
      for (const field of fields) notes.push(note(`line ${field.line}: ${field.text} is outside a live Kind: product capability`));
      continue;
    }

    const listed = deliverableIds(capability);
    checkedDeliverables += listed.length;
    const listedSet = new Set(listed);
    const seen = new Map(listed.map((row) => [row, new Set()]));

    for (const field of fields) {
      const rowHint = ROW_AT_START.exec(field.body)?.[1] ?? null;
      const parts = field.body.split(PART_SEPARATOR);
      if (rowHint && listedSet.has(rowHint)) seen.get(rowHint).add(field.label);
      if (parts.length < 2) {
        notes.push(note(`${rowHint ? `${rowHint} ` : ""}cannot read ${field.label}: line ${field.line}; expected "${PART_SEPARATOR}"`));
        continue;
      }
      const row = parts[0].trim();
      if (!/^R-(?:[0-9]{3}|[1-9][0-9]{3})$/.test(row)) {
        notes.push(note(`line ${field.line}: cannot read ${field.label}: row in "${field.text}"`));
        continue;
      }
      if (!listedSet.has(row)) {
        notes.push(note(`${row} ${field.label}: line ${field.line} names an unlisted deliverable`));
        continue;
      }
      seen.get(row).add(field.label);

      if (field.label === "Made by") {
        if (parts.length > 3) {
          notes.push(note(`${row} cannot read Made by: line ${field.line}`));
          continue;
        }
        const claim = parts[1].trim();
        const colon = claim.indexOf(":");
        const run = (colon < 0 ? claim : claim.slice(0, colon)).trim();
        const detail = colon < 0 ? "" : claim.slice(colon + 1).trim();
        if (!MAKER_SET.has(run)) {
          notes.push(note(`${row} Made by: line ${field.line} has unknown maker run "${run || "(empty)"}"`));
          continue;
        }
        if (REASON_SET.has(run)) {
          if (!detail) notes.push(note(`${row} Made by: line ${field.line} needs a reason`));
        } else if (!detail) {
          notes.push(note(`${row} Made by: line ${field.line} needs a code path`));
        } else {
          for (const path of detail.split(",")) addPath(row, path, field.line, "code path");
        }
        if (parts.length === 3) addPath(row, parts[2], field.line, "artifact");
        continue;
      }

      if (parts.length !== 2) {
        notes.push(note(`${row} cannot read Read by: line ${field.line}`));
        continue;
      }
      const claim = parts[1].trim();
      const colon = claim.indexOf(":");
      const reader = (colon < 0 ? claim : claim.slice(0, colon)).trim();
      const detail = colon < 0 ? "" : claim.slice(colon + 1).trim();
      if (!READER_SET.has(reader)) {
        notes.push(note(`${row} Read by: line ${field.line} has unknown reader "${reader || "(empty)"}"`));
        continue;
      }
      if (REASON_SET.has(reader)) {
        if (!detail) notes.push(note(`${row} Read by: line ${field.line} needs a reason`));
      } else if (!detail) {
        notes.push(note(`${row} Read by: line ${field.line} needs a code path`));
      } else {
        for (const path of detail.split(",")) addPath(row, path, field.line, "reader path");
      }
    }

    for (const row of listed) {
      for (const label of DELIVERABLE_FIELD_LABELS) {
        if (!seen.get(row)?.has(label)) notes.push(note(`${row} has no readable ${label}: line`));
      }
    }
  }

  if (Array.isArray(trackedPaths)) {
    const tracked = new Set(trackedPaths);
    for (const entry of pathsToCheck) {
      if (!trackedAtHead(entry.path, tracked)) notes.push(note(`${entry.row} ${entry.kind} "${entry.path}" on line ${entry.line} is not tracked at HEAD`));
    }
  }

  return { notes, pathsToCheck, checkedDeliverables, fieldLineCount };
}
