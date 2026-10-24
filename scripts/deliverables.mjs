#!/usr/bin/env node
/**
 * @module scripts/deliverables.mjs
 * @purpose Parse and check product-capability deliverable claims and the feature artifact registry, then produce their shared checker lines.
 * @inputs A parsed requirements tree, a capability, ledger folder, tracked paths, sealed artifact shapes, or an injected git runner.
 * @outputs Registry entries by A-ID, per-row claims, code predicates, resolved artifact names, deliverable notes and counts including parked counts, and the exact lines printed by the tree checker.
 * @effects process (the shared line function may query the ledger folder's HEAD tree through injected git)
 * @errors Returns report-only notes for malformed claims, missing reasons, git failures, or paths not tracked at HEAD; never throws for a claim.
 */
import { spawnSync } from "node:child_process";
import { trackedAtHead } from "../packages/nana-pack/lib/brief-precedent.mjs";
import { DATA_SUBPATH } from "../packages/nana-pack/lib/runtime-map-config.mjs";
import { STORE_SUBPATH } from "../packages/nana-pack/lib/suite-records-config.mjs";
import { BUILD_RECORDS_SUBPATH } from "../packages/nana-pack/lib/build-records-config.mjs";
import { globMatch } from "../apps/bench/lib/checkers.mjs";
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
// Contract (artifact-registry must-meet, R-2781): the owner's 2026-10-24 artifact classes.
export const ARTIFACT_CLASSES = Object.freeze(["tracked", "clone store", "user-home store", "other project", "git ref", "CI record"]);
// Contract (artifact-registry must-meet, R-2780/R-2781): allocated artifact IDs are A-001 through A-999.
export const ARTIFACT_ID_PATTERN = /^A-(?:00[1-9]|0[1-9][0-9]|[1-9][0-9]{2})$/;
// Contract (artifact-registry must-meet, R-2781): the sealed location-shape expressions approved on 2026-10-24.
export const ARTIFACT_LOCATION_SHAPES = Object.freeze({
  tracked: "repo-relative tracked path, folder or single-segment-* glob",
  "clone store": "<git common dir>/<path>",
  "user-home store": "~/<path> or <pi agent dir>/<path>",
  "other project": "<project>/<path>",
  "git ref": "refs/heads/<name> or refs/tags/<prefix>",
  "CI record": "ci: .github/workflows/<workflow>.yml#<name-without-slash>",
});

const MAKER_SET = new Set(MAKER_RUNS);
const READER_SET = new Set(READER_KINDS);
const REASON_SET = new Set(REASON_REQUIRED);
const DELIVERABLE_LABELS = new Set([...DELIVERABLE_FIELD_LABELS, PARKED_LABEL]);
const ARTIFACT_LABELS = new Set(["Artifact"]);
const ROW_AT_START = /^(R-(?:[0-9]{3}|[1-9][0-9]{3}))\b/;
const PARKED_DATE = new RegExp(`^${PARKED_SINCE}\\s+(\\d{4}-\\d{2}-\\d{2})$`);

const capabilityEntries = (heading, label) => heading.capabilityFields?.[label] ?? [];
const capabilityKind = (heading) => capabilityEntries(heading, "Kind")[0]?.value ?? null;
const liveProduct = (heading) => capabilityKind(heading) === "product" && capabilityEntries(heading, "Retired").length === 0;
const deliverableIds = (heading) => capabilityEntries(heading, "Deliverables").flatMap((entry) => entry.value.split(/,\s*/).filter(Boolean));
const note = (message) => `deliverable note: ${message}`;

function ownFieldLines(parsed, heading, labels) {
  const start = heading.line;
  let end = parsed.lines.length;
  for (const [index] of parsed.headingsByLine) {
    if (index + 1 > start) { end = Math.min(end, index); break; }
  }
  const lines = [];
  for (let index = start; index < end; index++) {
    if (parsed.opaque[index]) continue;
    const rawText = parsed.lines[index];
    const text = rawText.replace(/[ \t]+$/u, "");
    const colon = text.indexOf(":");
    const label = colon < 0 ? "" : text.slice(0, colon);
    if (labels.has(label)) lines.push({ label, body: text.slice(colon + 1).trimStart(), line: index + 1, text, rawText });
  }
  return lines;
}

const capabilityOf = (heading) => {
  let current = heading;
  while (current && !current.id?.startsWith("CAP-")) current = current.parent;
  return current?.id?.startsWith("CAP-") ? current : null;
};
const featureOf = (heading) => {
  let current = heading;
  while (current && !current.id?.startsWith("FEAT-")) current = current.parent;
  return current?.id?.startsWith("FEAT-") ? current : null;
};
const hasGlob = (value) => /[*?]/.test(value);
const trackedLocationShape = (value) => {
  if (!value || value.startsWith("/") || value.startsWith("~") || value.startsWith("<") || value.includes("\\") || value.includes("**")) return false;
  const segments = value.split("/");
  if (segments.includes("..") || /[*?]/.test(segments[0])) return false;
  return true;
};
const CI_LOCATION = /^ci: (\.github\/workflows\/[^/#]+\.ya?ml)#([^/]+)$/;
function locationShape(className, location, tracked) {
  if (className === "tracked") return trackedLocationShape(location);
  if (className === "clone store") return /^<git common dir>\/.+/.test(location) && !location.includes("\\") && !location.split("/").includes("..");
  if (className === "user-home store") return /^(?:~|<pi agent dir>)\/.+/.test(location) && !location.includes("\\") && !location.split("/").includes("..");
  if (className === "other project") return /^<project>\/.+/.test(location) && !location.includes("\\") && !location.split("/").includes("..");
  if (className === "git ref") return /^refs\/(?:heads\/.+|tags\/.*)$/.test(location) && !location.includes("\\") && !location.split("/").includes("..");
  if (className === "CI record") {
    const match = CI_LOCATION.exec(location);
    return Boolean(match && (tracked === null || tracked.has(match[1])));
  }
  return false;
}
const artifactNote = (entry, detail) => note(`${entry.id ?? `line ${entry.line}`} Artifact: ${detail}`);

/** Parse and check every Artifact: line under a kinded capability; duplicate IDs resolve to their first line. */
export function artifactRegistry(parsed, trackedPaths = null) {
  const entries = [];
  const byId = new Map();
  const notes = [];
  const locations = new Map();
  const tracked = Array.isArray(trackedPaths) ? new Set(trackedPaths) : null;
  let fieldLineCount = 0;
  for (const heading of parsed.headings) {
    const capability = capabilityOf(heading);
    if (!capability || !capabilityKind(capability)) continue;
    const fields = ownFieldLines(parsed, heading, ARTIFACT_LABELS);
    fieldLineCount += fields.length;
    for (const field of fields) {
      if (!heading.id?.startsWith("FEAT-")) {
        notes.push(note(`line ${field.line}: Artifact: line is outside a feature span`));
        continue;
      }
      const parts = field.body.split(PART_SEPARATOR).map((part) => part.trim());
      const id = parts[0] ?? "";
      if (!ARTIFACT_ID_PATTERN.test(id) || !parts[1] || (parts.length !== 3 && parts.length !== 4)) {
        notes.push(note(`line ${field.line}: malformed Artifact: line`));
        continue;
      }
      const thirdColon = parts[2].indexOf(":");
      const thirdKind = thirdColon < 0 ? "" : parts[2].slice(0, thirdColon).trim();
      const thirdDetail = thirdColon < 0 ? "" : parts[2].slice(thirdColon + 1).trim();
      const retired = thirdKind === "retired" && parts.length === 3 && thirdDetail.length > 0;
      let className = null, location = null, run = null, writers = [], reason = "";
      let malformed = false;
      if (!retired) {
        className = thirdKind;
        location = thirdDetail;
        const fourthColon = parts[3]?.indexOf(":") ?? -1;
        run = fourthColon < 0 ? "" : parts[3].slice(0, fourthColon).trim();
        const makerDetail = fourthColon < 0 ? "" : parts[3].slice(fourthColon + 1).trim();
        malformed = !ARTIFACT_CLASSES.includes(className) || !location || !MAKER_SET.has(run);
        if (run === "manual") reason = makerDetail;
        else writers = makerDetail.split(",").map((value) => value.trim()).filter(Boolean);
      }
      const entry = { id, name: parts[1], className, location, run, writers, reason, retired, live: !retired, line: field.line, text: field.rawText, featureId: heading.id, capabilityId: capability.id };
      if (byId.has(id)) {
        notes.push(artifactNote(entry, `reused ID; first declared on line ${byId.get(id).line}`));
        continue;
      }
      byId.set(id, entry);
      entries.push(entry);
      if (malformed) {
        notes.push(artifactNote(entry, `has an unknown class or malformed maker run`));
        continue;
      }
      if (!retired && !locationShape(className, location, tracked)) notes.push(artifactNote(entry, `location "${location}" has the wrong shape for ${className}`));
      const feature = featureOf(heading);
      if (!retired && /^(?:proposed|retired\b)/.test(feature?.status ?? "")) notes.push(artifactNote(entry, `is live in a proposed or retired feature span`));
      if (retired) continue;
      if (run === "manual") {
        if (!reason) notes.push(artifactNote(entry, "manual maker needs a reason"));
      } else if (!writers.length) {
        notes.push(artifactNote(entry, "automatic maker needs a writer path"));
      } else if (tracked) {
        for (const writer of writers) if (hasGlob(writer) || writer.endsWith("/") || !tracked.has(writer)) notes.push(artifactNote(entry, `writer path "${writer}" is not a tracked file at HEAD`));
      }
      if (className === "tracked" && tracked && trackedLocationShape(location)) {
        const matches = hasGlob(location) ? [...tracked].some((path) => globMatch(location, path)) : trackedAtHead(location, tracked);
        if (!matches) notes.push(artifactNote(entry, `tracked location "${location}" matches no file at HEAD`));
      }
      const key = `${className}\0${location}`;
      if (locations.has(key)) notes.push(artifactNote(entry, `duplicates ${locations.get(key)} at ${className} location "${location}"`));
      else locations.set(key, id);
    }
  }
  const needsTrackedPaths = entries.some((entry) => entry.live && (entry.className === "tracked" || entry.className === "CI record" || entry.run !== "manual"));
  return { entries, byId, notes, fieldLineCount, needsTrackedPaths };
}

/** Row ID -> its exact maker, reader and park field lines in capability spans, in document order. */
export function deliverableFieldLinesByRow(parsed) {
  const result = new Map();
  for (const capability of parsed.headings.filter((heading) => heading.id?.startsWith("CAP-"))) {
    for (const field of ownFieldLines(parsed, capability, DELIVERABLE_LABELS)) {
      const row = ROW_AT_START.exec(field.body)?.[1];
      if (!row) continue;
      if (!result.has(row)) result.set(row, []);
      result.get(row).push(field.rawText);
    }
  }
  return result;
}

const ARTIFACT_REFERENCE = /^A-(?:00[1-9]|0[1-9][0-9]|[1-9][0-9]{2})(?:,\s*A-(?:00[1-9]|0[1-9][0-9]|[1-9][0-9]{2}))*$/;
const BUILT_FROM_REFERENCE = /^built from:\s*(A-(?:00[1-9]|0[1-9][0-9]|[1-9][0-9]{2})(?:,\s*A-(?:00[1-9]|0[1-9][0-9]|[1-9][0-9]{2}))*)$/;
function registryReference(value) {
  const direct = ARTIFACT_REFERENCE.test(value) ? value : null;
  const built = BUILT_FROM_REFERENCE.exec(value)?.[1] ?? null;
  if (!direct && !built) return null;
  return { kind: direct ? "artifact" : "built from", ids: (direct ?? built).split(/,\s*/) };
}
const REGISTRY_STORE_NAMES = Object.freeze([
  Object.freeze({ name: RUNTIME_MAP_ARTIFACT, location: `<git common dir>/${DATA_SUBPATH}`, run: "land", entryWriter: "scripts/runtime-measure.mjs", claimWriter: "scripts/runtime-measure.mjs" }),
  Object.freeze({ name: "suite-runs", location: `<git common dir>/${STORE_SUBPATH}`, run: "suite", entryWriter: "packages/nana-pack/lib/suite-records.mjs", claimWriter: "scripts/test-locked.mjs" }),
  Object.freeze({ name: "build-records", location: `<git common dir>/${BUILD_RECORDS_SUBPATH}`, run: "build", entryWriter: "packages/nana-pack/lib/build-records.mjs", claimWriter: "packages/nana-pack/lib/build-records.mjs" }),
]);
function resolvedArtifact(entry, run, codePaths) {
  if (!entry?.live || entry.className === "tracked" && hasGlob(entry.location)) return null;
  if (entry.className !== "clone store") return entry.location;
  const store = REGISTRY_STORE_NAMES.find((candidate) => candidate.location === entry.location);
  if (!store || entry.run !== store.run || entry.writers.length !== 1 || entry.writers[0] !== store.entryWriter || run !== store.run || !codePaths.includes(store.claimWriter)) return entry.location;
  return store.name;
}

/** The listing capability's own claims by deliverable row, preserving their document order. */
export function deliverableClaims(parsed, capability) {
  const listed = deliverableIds(capability);
  const claims = new Map(listed.map((row) => [row, []]));
  const registry = artifactRegistry(parsed, null);
  for (const field of ownFieldLines(parsed, capability, DELIVERABLE_LABELS)) {
    const row = ROW_AT_START.exec(field.body)?.[1];
    if (!row || !claims.has(row)) continue;
    const parts = field.body.split(PART_SEPARATOR);
    const claimText = field.body.slice(row.length).trim().replace(/^·\s*/, "");
    const claim = parts[1]?.trim() ?? "";
    const colon = claim.indexOf(":");
    const kind = (colon < 0 ? claim : claim.slice(0, colon)).trim();
    const detail = colon < 0 ? "" : claim.slice(colon + 1).trim();
    if (field.label === PARKED_LABEL) {
      claims.get(row).push({ row, label: field.label, text: claimText, artifact: null, thirdPart: null, registryIds: [], madeByCode: false, readByCode: false });
      continue;
    }
    const madeByCode = field.label === "Made by" && parts.length <= 3 && MAKER_SET.has(kind) && !REASON_SET.has(kind) && detail.length > 0;
    const readByCode = field.label === "Read by" && parts.length === 2 && READER_SET.has(kind) && !REASON_SET.has(kind) && detail.length > 0;
    const thirdPart = field.label === "Made by" && parts.length === 3 && parts[2].trim() ? parts[2].trim() : null;
    const reference = thirdPart ? registryReference(thirdPart) : null;
    const codePaths = detail.split(",").map((value) => value.trim()).filter(Boolean);
    const first = reference?.kind === "artifact" ? registry.byId.get(reference.ids[0]) : null;
    const artifact = first ? resolvedArtifact(first, kind, codePaths) : (thirdPart && !reference ? thirdPart : null);
    claims.get(row).push({ row, label: field.label, text: claimText, artifact, thirdPart, registryIds: reference?.ids ?? [], registryKind: reference?.kind ?? null, madeByCode, readByCode });
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
  const registry = artifactRegistry(parsed, trackedPaths);
  const notes = [...registry.notes];
  const pathsToCheck = [];
  let checkedDeliverables = 0;
  let fieldLineCount = registry.fieldLineCount;
  let deliverableFieldLineCount = 0;
  let madeAndReadByCode = 0;
  let parkedDeliverables = 0;

  const addPath = (row, path, line, kind) => {
    const value = path.trim();
    if (!value) return;
    pathsToCheck.push({ row, path: value, line, kind });
  };

  for (const capability of parsed.headings.filter((heading) => heading.id?.startsWith("CAP-"))) {
    const fields = ownFieldLines(parsed, capability, DELIVERABLE_LABELS);
    fieldLineCount += fields.length;
    deliverableFieldLineCount += fields.length;
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
          const thirdPart = parts[2].trim();
          const reference = registryReference(thirdPart);
          if (reference) {
            for (const id of reference.ids) {
              const entry = registry.byId.get(id);
              if (!entry?.live) {
                notes.push(note(`${row} artifact registry reference ${id} on line ${field.line} has no live entry`));
                continue;
              }
              if (reference.kind === "artifact") {
                const problems = [];
                if (entry.run !== run) problems.push(`has run ${entry.run}, not ${run}`);
                const missingWriters = entry.writers.filter((writer) => !codePaths.includes(writer));
                if (missingWriters.length) problems.push(`is missing writer${missingWriters.length === 1 ? "" : "s"} ${missingWriters.join(", ")}`);
                if (problems.length) notes.push(note(`${row} artifact registry reference ${id} on line ${field.line} ${problems.join("; ")}`));
              }
            }
          } else if (registry.fieldLineCount > 0) {
            notes.push(note(`${row} artifact third part "${thirdPart}" on line ${field.line} is neither a registry reference nor a built-from list`));
          } else {
            const local = MACHINE_LOCAL_ARTIFACTS[thirdPart];
            if (!local || local.maker !== run || !codePaths.includes(local.writer)) addPath(row, thirdPart, field.line, "artifact");
          }
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

    if (registry.fieldLineCount > 0) {
      for (const row of listed) {
        const rowClaims = claimsByRow.get(row) ?? [];
        if (!parkedRows.has(row) && !rowClaims.some((claim) => claim.label === "Made by" && claim.registryIds.length > 0)) notes.push(note(`${row} has no artifact registry reference or built-from list on a Made by: line`));
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

  return { notes, pathsToCheck, checkedDeliverables, fieldLineCount, deliverableFieldLineCount, artifactsRequireTracked: registry.needsTrackedPaths, artifacts: registry.byId, madeAndReadByCode, parkedDeliverables };
}

/** Return the exact deliverable lines plus the HEAD paths used to derive them. */
export function deliverableReport(parsed, ledgerFolder, gitRunner = (args, options) => spawnSync("git", args, options)) {
  const pending = checkDeliverables(parsed, null);
  let report = pending;
  let trackedPaths = null;
  if (pending.pathsToCheck.length > 0 || pending.artifactsRequireTracked) {
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
      ...(report.deliverableFieldLineCount > 0 ? [`deliverables: ${report.madeAndReadByCode} of ${report.checkedDeliverables - report.parkedDeliverables} made and read by code${report.parkedDeliverables ? `, ${report.parkedDeliverables} parked` : ""}`] : []),
      ...report.notes,
    ],
    trackedPaths,
  };
}

/** Return the exact deliverable lines the tree checker and Product view share. */
export function deliverableReportLines(parsed, ledgerFolder, gitRunner = (args, options) => spawnSync("git", args, options)) {
  return deliverableReport(parsed, ledgerFolder, gitRunner).lines;
}
