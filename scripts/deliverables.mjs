#!/usr/bin/env node
/**
 * @module scripts/deliverables.mjs
 * @purpose Parse product-capability deliverable claims and produce the shared checker lines for their code coverage and HEAD-tracked paths.
 * @inputs A parsed requirements tree, a capability, ledger folder, tracked paths, or an injected git runner.
 * @outputs Per-row claims, code predicates, machine-local artifact names, deliverable notes and counts including parked counts, and the exact lines printed by the tree checker.
 * @effects process (the shared line function may query the ledger folder's HEAD tree through injected git)
 * @errors Returns report-only notes for malformed claims, missing reasons, git failures, or paths not tracked at HEAD; never throws for a claim.
 */
import { spawnSync } from "node:child_process";
import { trackedAtHead } from "../packages/nana-pack/lib/brief-precedent.mjs";
import { MAX_GIT_BUFFER } from "./requirements-moved.mjs";

// Contract: the owner's 2026-10-22 approval; R-2537.
export const DELIVERABLE_FIELD_LABELS = Object.freeze(["Made by", "Read by"]);
// Contract: the owner's 2026-10-22 decision to park desk and app deliverables; R-2640.
export const PARKED_LABEL = "Parked";
// Contract: HANDOFF's parked ask form; R-878 and R-2640.
export const PARKED_SINCE = "since";
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
// Contract (R-2743): each machine-local artifact is exempt only under its own maker and writer.
export const MACHINE_LOCAL_ARTIFACTS = Object.freeze({
  [RUNTIME_MAP_ARTIFACT]: Object.freeze({ maker: "land", writer: "scripts/runtime-measure.mjs" }),
  "suite-runs": Object.freeze({ maker: "suite", writer: "scripts/test-locked.mjs" }),
  "build-records": Object.freeze({ maker: "build", writer: "packages/nana-pack/lib/build-records.mjs" }),
});
// Contract (R-2543): shared verbatim by the checker and Product view when HEAD paths cannot be read.
export const DELIVERABLE_PATHS_NOT_CHECKED = "deliverable note: paths not checked: git could not read the ledger folder's HEAD tree";

const MAKER_SET = new Set(MAKER_RUNS);
const READER_SET = new Set(READER_KINDS);
const REASON_SET = new Set(REASON_REQUIRED);
const FIELD_PREFIX = new RegExp(`^(${[...DELIVERABLE_FIELD_LABELS, PARKED_LABEL].join("|")}):\\s*(.*)$`);
const ROW_AT_START = /^(R-(?:[0-9]{3}|[1-9][0-9]{3}))\b/;
const PARKED_DATE = new RegExp(`^${PARKED_SINCE}\\s+(\\d{4}-\\d{2}-\\d{2})$`);

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

/** Row ID -> its exact maker, reader and park field lines in capability spans, in document order. */
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

/** The listing capability's own claims by deliverable row, preserving their document order. */
export function deliverableClaims(parsed, capability) {
  const listed = deliverableIds(capability);
  const claims = new Map(listed.map((row) => [row, []]));
  for (const field of ownFieldLines(parsed, capability)) {
    const row = ROW_AT_START.exec(field.body)?.[1];
    if (!row || !claims.has(row)) continue;
    const parts = field.body.split(PART_SEPARATOR);
    const claimText = field.body.slice(row.length).trim().replace(/^·\s*/, "");
    const claim = parts[1]?.trim() ?? "";
    const colon = claim.indexOf(":");
    const kind = (colon < 0 ? claim : claim.slice(0, colon)).trim();
    const detail = colon < 0 ? "" : claim.slice(colon + 1).trim();
    if (field.label === PARKED_LABEL) {
      claims.get(row).push({ label: field.label, text: claimText, artifact: null, madeByCode: false, readByCode: false });
      continue;
    }
    const madeByCode = field.label === "Made by" && parts.length <= 3 && MAKER_SET.has(kind) && !REASON_SET.has(kind) && detail.length > 0;
    const readByCode = field.label === "Read by" && parts.length === 2 && READER_SET.has(kind) && !REASON_SET.has(kind) && detail.length > 0;
    const artifact = field.label === "Made by" && parts.length === 3 && parts[2].trim() ? parts[2].trim() : null;
    claims.get(row).push({ label: field.label, text: claimText, artifact, madeByCode, readByCode });
  }
  return claims;
}

/** The code-made and code-read state used for both Product marks and the checker count. */
export function deliverableCodeState(claims) {
  return {
    madeByCode: claims.some((claim) => claim.madeByCode),
    readByCode: claims.some((claim) => claim.readByCode),
  };
}

/** The checker's count predicate: one row is counted only when code both makes and reads it. */
export function isMadeAndReadByCode(claims) {
  const state = deliverableCodeState(claims);
  return state.madeByCode && state.readByCode;
}

/** Check deliverable fields. Pass null for trackedPaths to collect path claims without deciding them. */
export function checkDeliverables(parsed, trackedPaths = null) {
  const notes = [];
  const pathsToCheck = [];
  let checkedDeliverables = 0;
  let fieldLineCount = 0;
  let madeAndReadByCode = 0;
  let parkedDeliverables = 0;

  const addPath = (row, path, line, kind) => {
    const value = path.trim();
    if (!value) return;
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
    const claimsByRow = deliverableClaims(parsed, capability);
    const parkedRows = new Set();
    const staleParkRows = new Set();

    for (const field of fields) {
      const rowHint = ROW_AT_START.exec(field.body)?.[1] ?? null;
      const parts = field.body.split(PART_SEPARATOR);
      if (rowHint && listedSet.has(rowHint) && field.label !== PARKED_LABEL) seen.get(rowHint).add(field.label);
      if (field.label === PARKED_LABEL) {
        const parkParts = field.body.split(/\s*·\s*/u);
        const row = parkParts[0]?.trim() ?? "";
        if (parkParts.length !== 2 || !/^R-(?:[0-9]{3}|[1-9][0-9]{3})$/.test(row)) {
          notes.push(note(`${rowHint ? `${rowHint} ` : ""}cannot read ${PARKED_LABEL}: line ${field.line}`));
          continue;
        }
        if (!listedSet.has(row)) {
          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} names an unlisted deliverable`));
          continue;
        }
        const parkedClaim = parkParts[1].trim();
        const colon = parkedClaim.indexOf(":");
        const dateClaim = (colon < 0 ? parkedClaim : parkedClaim.slice(0, colon)).trim();
        const reason = colon < 0 ? "" : parkedClaim.slice(colon + 1).trim();
        if (!PARKED_DATE.test(dateClaim)) {
          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} needs a ${PARKED_SINCE} date`));
          continue;
        }
        if (!reason) {
          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} needs a reason`));
          continue;
        }
        if (isMadeAndReadByCode(claimsByRow.get(row) ?? [])) {
          if (!staleParkRows.has(row)) {
            notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} parks nothing; code makes and reads it`));
            staleParkRows.add(row);
          }
        } else {
          parkedRows.add(row);
        }
        continue;
      }
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
        const codePaths = detail.split(",").map((value) => value.trim()).filter(Boolean);
        if (REASON_SET.has(run)) {
          if (!detail) notes.push(note(`${row} Made by: line ${field.line} needs a reason`));
        } else if (!detail) {
          notes.push(note(`${row} Made by: line ${field.line} needs a code path`));
        } else {
          for (const path of codePaths) addPath(row, path, field.line, "code path");
        }
        if (parts.length === 3) {
          const artifact = parts[2].trim();
          const local = MACHINE_LOCAL_ARTIFACTS[artifact];
          if (!local || local.maker !== run || !codePaths.includes(local.writer)) addPath(row, artifact, field.line, "artifact");
        }
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

    madeAndReadByCode += listed.filter((row) => isMadeAndReadByCode(claimsByRow.get(row) ?? [])).length;
    parkedDeliverables += parkedRows.size;
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

  return { notes, pathsToCheck, checkedDeliverables, fieldLineCount, madeAndReadByCode, parkedDeliverables };
}

/** Return the exact deliverable lines plus the HEAD paths used to derive them. */
export function deliverableReport(parsed, ledgerFolder, gitRunner = (args, options) => spawnSync("git", args, options)) {
  const pending = checkDeliverables(parsed, null);
  let report = pending;
  let trackedPaths = null;
  if (pending.pathsToCheck.length > 0) {
    let result;
    try {
      result = gitRunner(["ls-tree", "-r", "-z", "--name-only", "HEAD"], { cwd: ledgerFolder, encoding: "buffer", maxBuffer: MAX_GIT_BUFFER });
    } catch {
      result = null;
    }
    if (!result || result.error || result.status !== 0) {
      report = { ...pending, notes: [...pending.notes, DELIVERABLE_PATHS_NOT_CHECKED] };
    } else {
      const stdout = Buffer.isBuffer(result.stdout) ? result.stdout.toString("utf8") : String(result.stdout ?? "");
      trackedPaths = stdout.split("\0").filter(Boolean);
      report = checkDeliverables(parsed, trackedPaths);
    }
  }
  return {
    lines: [
      ...(report.fieldLineCount > 0 ? [`deliverables: ${report.madeAndReadByCode} of ${report.checkedDeliverables - report.parkedDeliverables} made and read by code${report.parkedDeliverables ? `, ${report.parkedDeliverables} parked` : ""}`] : []),
      ...report.notes,
    ],
    trackedPaths,
  };
}

/** Return the exact deliverable lines the tree checker and Product view share. */
export function deliverableReportLines(parsed, ledgerFolder, gitRunner = (args, options) => spawnSync("git", args, options)) {
  return deliverableReport(parsed, ledgerFolder, gitRunner).lines;
}
