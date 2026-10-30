#!/usr/bin/env node
/**
 * @module scripts/deliverables.mjs
 * @purpose Parse and check product-capability deliverable claims, the feature artifact registry, cross-feature artifact reads, and artifact reader and park lines, then produce their shared checker lines.
 * @inputs A parsed requirements tree, a capability, ledger folder, tracked paths, sealed artifact, read and age-table shapes, or an injected git runner.
 * @outputs Registry entries by A-ID, reads by feature, per-row claims with each claim's reader kind, code predicates, clone-store age bindings, deliverable notes, per-capability counts and gap rows, and the exact tree-checker lines with their check result from deliverableReport.
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
// Chosen: the assessment's consumers-first rule (report section 6), which keeps R-1150's harness legal; R-2833.
export const TEST_READER_GLOB = "*.test.*";
// Contract: artifact coverage reports this exact phrase; R-2834.
export const NO_DECLARED_READER_NOTE = "has no declared reader";
// Contract: code and rule come from the ruling; prompt and person are chosen because injected context and pages are readers; runtime is host loading; R-2537 and R-2831.
export const READER_KINDS = Object.freeze(["code", "prompt", "person", "rule", "runtime"]);
// Contract: manual, rule, person, and runtime claims explain why they exist; R-2535 and R-2831.
export const REASON_REQUIRED = Object.freeze(["manual", "rule", "person", "runtime"]);
// Contract: every automatic maker and every code or prompt reader names code; R-2537.
export const PATH_REQUIRED = Object.freeze([...MAKER_RUNS.filter((run) => run !== "manual"), "code", "prompt"]);
// Chosen: the requirements ledger's heading separator.
export const PART_SEPARATOR = " · ";
// Contract (report-names-artifacts must-meet, R-2793): the three clone stores whose records have deterministic readers, keyed from their owning modules' sealed subpaths.
export const ARTIFACT_AGE_TABLE = Object.freeze({
  [`<git common dir>/${DATA_SUBPATH}`]: Object.freeze({ run: "land", writer: "scripts/runtime-measure.mjs" }),
  [`<git common dir>/${STORE_SUBPATH}`]: Object.freeze({ run: "suite", writer: "packages/nana-pack/lib/suite-records.mjs" }),
  [`<git common dir>/${BUILD_RECORDS_SUBPATH}`]: Object.freeze({ run: "build", writer: "packages/nana-pack/lib/build-records.mjs" }),
});
// Contract (report-names-artifacts must-meet, R-2793): only the exact class, run and one-writer binding earns a clone-store age reader.
export function artifactAgeTableKey(entry) {
  if (!entry?.live || entry.className !== "clone store") return null;
  const binding = ARTIFACT_AGE_TABLE[entry.location];
  return binding && entry.run === binding.run && entry.writers.length === 1 && entry.writers[0] === binding.writer ? entry.location : null;
}
// Contract (R-2543): shared verbatim by the checker and Product view when HEAD paths cannot be read.
export const DELIVERABLE_PATHS_NOT_CHECKED = "deliverable note: paths not checked: git could not read the ledger folder's HEAD tree";
// Contract (R-2781/R-2978): artifact classes approved 2026-10-24, plus GitHub issues approved 2026-10-28.
export const ARTIFACT_CLASSES = Object.freeze(["tracked", "clone store", "user-home store", "other project", "git ref", "CI record", "GitHub issues"]);
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
  // Contract: owner approval 2026-10-28, issues-home must-meet 9; R-2978.
  "GitHub issues": "github: <owner>/<repo> labelled <label>[, <label>]",
});

const MAKER_SET = new Set(MAKER_RUNS);
const READER_SET = new Set(READER_KINDS);
const REASON_SET = new Set(REASON_REQUIRED);
const DELIVERABLE_LABELS = new Set([...DELIVERABLE_FIELD_LABELS, PARKED_LABEL]);
// Contract (feature-artifact-lines must-meet, R-2795): the feature-reader field label.
export const READS_LABEL = "Reads";
// Contract (artifact-registry must-meet, R-2780): the feature-registry field labels.
const ARTIFACT_LABELS = new Set(["Artifact"]);
const READS_LABEL_SET = new Set([READS_LABEL]);
const ARTIFACT_CONSUMER_LABELS = new Set(["Read by", PARKED_LABEL]);
const ROW_AT_START = /^(R-(?:[0-9]{3}|[1-9][0-9]{3}))\b/;
const PARKED_DATE = new RegExp(`^${PARKED_SINCE}\\s+(\\d{4}-\\d{2}-\\d{2})$`);

/** Parse one reader claim without deciding its placement or tracked paths. */
export function readerClaim(text) {
  const colon = text.indexOf(":");
  const kind = (colon < 0 ? text : text.slice(0, colon)).trim();
  const detail = colon < 0 ? "" : text.slice(colon + 1).trim();
  return {
    kind,
    detail,
    known: READER_SET.has(kind),
    needsReason: REASON_SET.has(kind),
    needsPath: kind === "code" || kind === "prompt",
    paths: kind === "code" || kind === "prompt" ? detail.split(",").map((value) => value.trim()).filter(Boolean) : [],
  };
}

/** Parse one park body without deciding whether its ID belongs to the enclosing span. */
export function parkClaim(body) {
  const parts = body.split(/\s*·\s*/u);
  const id = parts[0]?.trim() ?? "";
  const claim = parts.length === 2 ? parts[1].trim() : "";
  const colon = claim.indexOf(":");
  const dateClaim = (colon < 0 ? claim : claim.slice(0, colon)).trim();
  const reason = colon < 0 ? "" : claim.slice(colon + 1).trim();
  return { parts, id, dateClaim, date: PARKED_DATE.exec(dateClaim)?.[1] ?? null, reason };
}

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
  if (className === "GitHub issues") return /^github: [A-Za-z0-9-]+\/[A-Za-z0-9_.-]+ labelled [A-Za-z0-9_-]+(?:, [A-Za-z0-9_-]+)*$/.test(location);
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

/** Parse and check every Reads: line under a kinded capability, grouped by reader feature. */
export function artifactReads(parsed, trackedPaths = null, registry = artifactRegistry(parsed, trackedPaths)) {
  const reads = [];
  const byFeature = new Map();
  const notes = [];
  const tracked = Array.isArray(trackedPaths) ? new Set(trackedPaths) : null;
  let fieldLineCount = 0;
  for (const heading of parsed.headings) {
    const capability = capabilityOf(heading);
    if (!capability || !capabilityKind(capability)) continue;
    const fields = ownFieldLines(parsed, heading, READS_LABEL_SET);
    fieldLineCount += fields.length;
    for (const field of fields) {
      if (!heading.id?.startsWith("FEAT-")) {
        notes.push(note(`line ${field.line}: ${READS_LABEL}: line is outside a feature span`));
        continue;
      }
      const parts = field.body.split(PART_SEPARATOR).map((part) => part.trim());
      const id = parts[0] ?? "";
      const readerParts = parts.length === 2 ? parts[1].split(",").map((value) => value.trim()) : [];
      if (parts.length !== 2 || !ARTIFACT_ID_PATTERN.test(id) || readerParts.length === 0 || readerParts.some((value) => !value)) {
        notes.push(note(`line ${field.line}: malformed ${READS_LABEL}: line`));
        continue;
      }
      const entry = { id, readers: readerParts, line: field.line, text: field.rawText, featureId: heading.id, capabilityId: capability.id, valid: true };
      reads.push(entry);
      if (!byFeature.has(heading.id)) byFeature.set(heading.id, []);
      const featureReads = byFeature.get(heading.id);
      if (featureReads.some((value) => value.id === id)) {
        notes.push(note(`line ${field.line}: ${READS_LABEL}: ${id} appears more than once in ${heading.id}`));
        entry.valid = false;
      } else featureReads.push(entry);
      const artifact = registry.byId.get(id);
      if (!artifact?.live) {
        notes.push(note(`line ${field.line}: ${READS_LABEL}: ${id} has no live entry`));
        entry.valid = false;
      } else if (artifact.featureId === heading.id) {
        notes.push(note(`line ${field.line}: ${READS_LABEL}: ${id} is registered in the same feature ${heading.id}`));
        entry.valid = false;
      }
      if (/^(?:proposed|retired\b)/.test(heading.status ?? "")) {
        notes.push(note(`line ${field.line}: ${READS_LABEL}: ${id} is in a proposed or retired feature span`));
        entry.valid = false;
      }
      for (const reader of readerParts) {
        const lastSegment = reader.split(/[\\/]/).at(-1) ?? "";
        if (globMatch(TEST_READER_GLOB, lastSegment)) {
          notes.push(note(`line ${field.line}: ${READS_LABEL}: reader path "${reader}" is a test file`));
          entry.valid = false;
        }
        if (tracked && (hasGlob(reader) || reader.endsWith("/") || !tracked.has(reader))) {
          notes.push(note(`line ${field.line}: ${READS_LABEL}: reader path "${reader}" is not a tracked file at HEAD`));
          entry.valid = false;
        }
      }
    }
  }
  return { reads, byFeature, notes, fieldLineCount, needsTrackedPaths: reads.length > 0 };
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
/** The listing capability's own claims by deliverable row, preserving their document order. */
export function deliverableClaims(parsed, capability, registry = artifactRegistry(parsed, null)) {
  const listed = deliverableIds(capability);
  const claims = new Map(listed.map((row) => [row, []]));
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
      claims.get(row).push({ row, label: field.label, text: claimText, artifact: null, thirdPart: null, paths: [], registryIds: [], madeByCode: false, readerKind: null, readByCode: false });
      continue;
    }
    const madeByCode = field.label === "Made by" && parts.length <= 3 && MAKER_SET.has(kind) && !REASON_SET.has(kind) && detail.length > 0;
    const readerKind = field.label === "Read by" && parts.length === 2 && READER_SET.has(kind) && detail.length > 0 ? kind : null;
    const readByCode = readerKind !== null && !REASON_SET.has(readerKind);
    const thirdPart = field.label === "Made by" && parts.length === 3 && parts[2].trim() ? parts[2].trim() : null;
    const reference = thirdPart ? registryReference(thirdPart) : null;
    claims.get(row).push({ row, label: field.label, text: claimText, artifact: thirdPart && !reference ? thirdPart : null, thirdPart, registryIds: reference?.ids ?? [], registryKind: reference?.kind ?? null, paths: PATH_REQUIRED.includes(kind) ? detail.split(',').map(value => value.trim()).filter(Boolean) : [], madeByCode, readerKind, readByCode });
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

/** Join every accepted reader and park declaration onto each live artifact entry. */
export function artifactConsumers(parsed, trackedPaths = null, registry = artifactRegistry(parsed, trackedPaths), reads = artifactReads(parsed, trackedPaths, registry)) {
  const consumers = new Map(registry.entries.filter((entry) => entry.live).map((entry) => [entry.id, { kinds: new Set(), park: null, notes: [] }]));
  const notes = [];
  const lines = [];
  const parkCandidates = [];
  const seenArtifactReaders = new Set();
  const tracked = Array.isArray(trackedPaths) ? new Set(trackedPaths) : null;
  let fieldLineCount = 0;
  let needsTrackedPaths = false;
  const addNote = (id, message) => {
    const value = note(message);
    notes.push(value);
    if (consumers.has(id)) consumers.get(id).notes.push(value);
  };
  const testReaderProblem = (path) => {
    const lastSegment = path.split(/[\\/]/).at(-1) ?? "";
    return globMatch(TEST_READER_GLOB, lastSegment) ? `reader path "${path}" is a test file` : null;
  };
  const badReaderPath = (path) => testReaderProblem(path) ?? (tracked && (hasGlob(path) || path.endsWith("/") || !tracked.has(path)) ? `reader path "${path}" is not a tracked file at HEAD` : null);
  const badDeliverableReaderPath = (path) => testReaderProblem(path) ?? (tracked && !trackedAtHead(path, tracked) ? `reader path "${path}" is not tracked at HEAD` : null);

  for (const read of reads.reads) if (read.valid && consumers.has(read.id)) consumers.get(read.id).kinds.add("code");

  for (const heading of parsed.headings) {
    const capability = capabilityOf(heading);
    if (!capability || !capabilityKind(capability) || capability.id === heading.id) continue;
    const fields = ownFieldLines(parsed, heading, ARTIFACT_CONSUMER_LABELS);
    fieldLineCount += fields.length;
    for (const field of fields) {
      if (!heading.id?.startsWith("FEAT-")) {
        if (field.label === "Read by" && ROW_AT_START.test(field.body)) continue;
        notes.push(note(`line ${field.line}: ${field.label}: line is outside a feature span`));
        continue;
      }
      if (field.label === "Read by") {
        const parts = field.body.split(PART_SEPARATOR).map((part) => part.trim());
        const id = parts[0] ?? "";
        const claim = readerClaim(parts[1] ?? "");
        lines.push({ label: field.label, id, kind: claim.kind, date: null, line: field.line, text: field.rawText, featureId: heading.id });
        let problem = null;
        if (parts.length !== 2 || !ARTIFACT_ID_PATTERN.test(id)) problem = "malformed Read by: line";
        else if (!claim.known) problem = `Read by: ${id} has unknown reader "${claim.kind || "(empty)"}"`;
        else {
          const entry = registry.byId.get(id);
          if (!entry?.live) problem = `Read by: ${id} has no live entry`;
          else if (entry.featureId !== heading.id) problem = `Read by: ${id} is registered in another feature, not ${heading.id}`;
          else if (/^(?:proposed|retired\b)/.test(heading.status ?? "")) problem = `Read by: ${id} is in a proposed or retired feature span`;
          else if (claim.needsReason && !claim.detail) problem = `Read by: ${id} needs a reason`;
          else if (claim.needsPath && !claim.detail) problem = `Read by: ${id} needs a code path`;
          else if (claim.needsPath) {
            needsTrackedPaths = true;
            if (claim.paths.length === 0) problem = `Read by: ${id} needs a code path`;
            else {
              const bad = claim.paths.map(badReaderPath).find(Boolean);
              if (bad) problem = `Read by: ${id} ${bad}`;
            }
          }
        }
        const readerKey = `${heading.id}\0${id}\0${claim.kind}`;
        if (!problem && seenArtifactReaders.has(readerKey)) problem = `Read by: ${id} reader ${claim.kind} appears more than once in ${heading.id}`;
        if (problem) addNote(id, `line ${field.line}: ${problem}`);
        else {
          seenArtifactReaders.add(readerKey);
          consumers.get(id)?.kinds.add(claim.kind);
        }
        continue;
      }

      const claim = parkClaim(field.body);
      lines.push({ label: field.label, id: claim.id, kind: null, date: claim.date, line: field.line, text: field.rawText, featureId: heading.id });
      let problem = null;
      if (claim.parts.length !== 2 || !ARTIFACT_ID_PATTERN.test(claim.id)) problem = `cannot read ${PARKED_LABEL}: line ${field.line}`;
      else {
        const entry = registry.byId.get(claim.id);
        if (!entry?.live || entry.featureId !== heading.id) problem = `${claim.id} ${PARKED_LABEL}: line ${field.line} names no live entry registered in that feature`;
        else if (!claim.date) problem = `${claim.id} ${PARKED_LABEL}: line ${field.line} needs a ${PARKED_SINCE} date`;
        else if (!claim.reason) problem = `${claim.id} ${PARKED_LABEL}: line ${field.line} needs a reason`;
        else if (/^(?:proposed|retired\b)/.test(heading.status ?? "")) problem = `${claim.id} ${PARKED_LABEL}: line ${field.line} is in a proposed or retired feature span`;
      }
      if (problem) addNote(claim.id, problem);
      else parkCandidates.push({ id: claim.id, date: claim.date, reason: claim.reason, line: field.line, text: field.rawText });
    }
  }

  const rowHomeFeature = new Map();
  for (const table of parsed.tables) {
    const home = featureOf(table.heading);
    if (home) for (const row of table.rows) rowHomeFeature.set(row, home.id);
  }
  for (const capability of parsed.headings.filter((heading) => heading.id?.startsWith("CAP-") && liveProduct(heading))) {
    const listed = new Set(deliverableIds(capability));
    const readerKinds = new Map([...listed].map((row) => [row, new Set()]));
    const fields = ownFieldLines(parsed, capability, DELIVERABLE_LABELS);
    for (const field of fields.filter((value) => value.label === "Read by")) {
      const parts = field.body.split(PART_SEPARATOR);
      const row = parts[0]?.trim() ?? "";
      const claim = readerClaim(parts[1]?.trim() ?? "");
      if (parts.length !== 2 || !listed.has(row) || !claim.known || (claim.needsReason && !claim.detail) || (claim.needsPath && !claim.detail)) continue;
      if (claim.needsPath && claim.paths.some((path) => badDeliverableReaderPath(path))) continue;
      readerKinds.get(row).add(claim.kind);
    }
    for (const field of fields.filter((value) => value.label === "Made by")) {
      const parts = field.body.split(PART_SEPARATOR);
      if (parts.length !== 3) continue;
      const row = parts[0]?.trim() ?? "";
      if (!listed.has(row)) continue;
      const makerText = parts[1].trim();
      const colon = makerText.indexOf(":");
      const run = (colon < 0 ? makerText : makerText.slice(0, colon)).trim();
      const detail = colon < 0 ? "" : makerText.slice(colon + 1).trim();
      if (!MAKER_SET.has(run) || !detail) continue;
      const makerPaths = run === "manual" ? [] : detail.split(",").map((value) => value.trim()).filter(Boolean);
      if (run !== "manual" && tracked && makerPaths.some((path) => !trackedAtHead(path, tracked))) continue;
      const reference = registryReference(parts[2].trim());
      if (!reference) continue;
      for (const id of reference.ids) {
        const entry = registry.byId.get(id);
        if (!entry?.live || !consumers.has(id)) continue;
        if (reference.kind === "built from") {
          const homeFeatureId = rowHomeFeature.get(row);
          const registeredAtHome = entry.featureId === homeFeatureId;
          const readAtHome = (reads.byFeature.get(homeFeatureId) ?? []).some((read) => read.id === id);
          if (registeredAtHome || readAtHome) consumers.get(id).kinds.add(run === "manual" ? "person" : "code");
        } else {
          const bindingValid = entry.run === run && entry.writers.every((writer) => makerPaths.includes(writer));
          if (bindingValid) for (const kind of readerKinds.get(row)) consumers.get(id).kinds.add(kind);
        }
      }
    }
  }

  for (const park of parkCandidates) {
    const consumer = consumers.get(park.id);
    if (!consumer) continue;
    if (consumer.kinds.size > 0) addNote(park.id, `${park.id} ${PARKED_LABEL}: line ${park.line} parks nothing; it has a declared reader`);
    else if (!consumer.park) consumer.park = park;
  }
  for (const [id, consumer] of consumers) {
    if (consumer.kinds.size === 0 && !consumer.park) addNote(id, `${id} ${NO_DECLARED_READER_NOTE}`);
  }
  Object.assign(consumers, { notes, lines, fieldLineCount, needsTrackedPaths });
  return consumers;
}

function deliverableCountText(madeAndRead, total, parked) {
  return `${madeAndRead} of ${total} made and read by code${parked ? `, ${parked} more parked` : ""}`;
}

/** Check deliverable fields. Pass null for trackedPaths to collect path claims without deciding them. */
export function checkDeliverables(parsed, trackedPaths = null) {
  const registry = artifactRegistry(parsed, trackedPaths);
  const featureReads = artifactReads(parsed, trackedPaths, registry);
  const consumers = artifactConsumers(parsed, trackedPaths, registry, featureReads);
  const notes = [...registry.notes, ...featureReads.notes, ...consumers.notes];
  for (const entry of registry.entries) {
    if (entry.live && entry.className === "clone store" && Object.hasOwn(ARTIFACT_AGE_TABLE, entry.location) && artifactAgeTableKey(entry) === null) {
      notes.push(artifactNote(entry, "is at an age table location but does not match its run and one writer"));
    }
  }
  const pathsToCheck = [];
  let checkedDeliverables = 0;
  let fieldLineCount = registry.fieldLineCount + featureReads.fieldLineCount + consumers.fieldLineCount;
  let deliverableFieldLineCount = 0;
  const rowHomeFeature = new Map();
  for (const table of parsed.tables) {
    const home = featureOf(table.heading);
    if (home) for (const row of table.rows) rowHomeFeature.set(row, home.id);
  }
  let madeAndReadByCode = 0;
  let parkedDeliverables = 0;
  const byCapability = [];

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
    const claimsByRow = deliverableClaims(parsed, capability, registry);
    const parkedRows = new Set();
    const staleParkRows = new Set();

    for (const field of fields) {
      const rowHint = ROW_AT_START.exec(field.body)?.[1] ?? null;
      const parts = field.body.split(PART_SEPARATOR);
      if (rowHint && listedSet.has(rowHint) && field.label !== PARKED_LABEL) seen.get(rowHint).add(field.label);
      if (field.label === PARKED_LABEL) {
        const parsedPark = parkClaim(field.body);
        const row = parsedPark.id;
        if (parsedPark.parts.length !== 2 || !/^R-(?:[0-9]{3}|[1-9][0-9]{3})$/.test(row)) {
          notes.push(note(`${rowHint ? `${rowHint} ` : ""}cannot read ${PARKED_LABEL}: line ${field.line}`));
          continue;
        }
        if (!listedSet.has(row)) {
          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} names an unlisted deliverable`));
          continue;
        }
        if (!parsedPark.date) {
          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} needs a ${PARKED_SINCE} date`));
          continue;
        }
        if (!parsedPark.reason) {
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
            addPath(row, thirdPart, field.line, "artifact");
          }
        }
        continue;
      }

      if (parts.length !== 2) {
        notes.push(note(`${row} cannot read Read by: line ${field.line}`));
        continue;
      }
      const parsedReader = readerClaim(parts[1].trim());
      if (!parsedReader.known) {
        notes.push(note(`${row} Read by: line ${field.line} has unknown reader "${parsedReader.kind || "(empty)"}"`));
        continue;
      }
      if (parsedReader.needsReason) {
        if (!parsedReader.detail) notes.push(note(`${row} Read by: line ${field.line} needs a reason`));
      } else if (!parsedReader.detail) {
        notes.push(note(`${row} Read by: line ${field.line} needs a code path`));
      } else {
        for (const path of parsedReader.paths) {
          const lastSegment = path.split(/[\\/]/).at(-1) ?? "";
          if (globMatch(TEST_READER_GLOB, lastSegment)) notes.push(note(`${row} Read by: line ${field.line} reader path "${path}" is a test file`));
          else addPath(row, path, field.line, "reader path");
        }
      }
    }

    if (registry.fieldLineCount > 0) {
      for (const row of listed) {
        const rowClaims = claimsByRow.get(row) ?? [];
        if (!parkedRows.has(row) && !rowClaims.some((claim) => claim.label === "Made by" && claim.registryIds.length > 0)) notes.push(note(`${row} has no artifact registry reference or built-from list on a Made by: line`));
      }
    }
    for (const row of listed) {
      const homeFeatureId = rowHomeFeature.get(row) ?? null;
      if (!homeFeatureId) continue;
      const registeredAtHome = new Set(registry.entries.filter((entry) => entry.live && entry.featureId === homeFeatureId).map((entry) => entry.id));
      const readAtHome = new Set((featureReads.byFeature.get(homeFeatureId) ?? []).map((entry) => entry.id));
      const missing = new Set();
      for (const claim of claimsByRow.get(row) ?? []) {
        if (claim.registryKind !== "built from") continue;
        for (const id of claim.registryIds) {
          if (registry.byId.get(id)?.live && !registeredAtHome.has(id) && !readAtHome.has(id)) missing.add(id);
        }
      }
      for (const id of missing) notes.push(note(`${row} built-from entry ${id} is neither registered nor read in home feature ${homeFeatureId}`));
    }
    const madeRows = new Set(listed.filter((row) => isMadeAndReadByCode(claimsByRow.get(row) ?? [])));
    const madeAndRead = madeRows.size;
    const parked = parkedRows.size;
    byCapability.push({ id: capability.id, listed: listed.length, parked, madeAndRead,
      gapRows: listed.filter((row) => !parkedRows.has(row) && !madeRows.has(row)),
      countText: deliverableCountText(madeAndRead, listed.length - parked, parked) });
    madeAndReadByCode += madeAndRead;
    parkedDeliverables += parked;
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

  return { notes, pathsToCheck, checkedDeliverables, byCapability, fieldLineCount, deliverableFieldLineCount, artifactsRequireTracked: registry.needsTrackedPaths || featureReads.needsTrackedPaths || consumers.needsTrackedPaths, artifacts: registry.byId, reads: featureReads.byFeature, artifactConsumers: consumers, madeAndReadByCode, parkedDeliverables };
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
      ...(report.deliverableFieldLineCount > 0 ? [`deliverables: ${deliverableCountText(report.madeAndReadByCode, report.checkedDeliverables - report.parkedDeliverables, report.parkedDeliverables)}`] : []),
      ...report.notes,
    ],
    trackedPaths,
    check: report,
  };
}

/** Return the exact deliverable lines the tree checker and Product view share. */
export function deliverableReportLines(parsed, ledgerFolder, gitRunner = (args, options) => spawnSync("git", args, options)) {
  return deliverableReport(parsed, ledgerFolder, gitRunner).lines;
}
