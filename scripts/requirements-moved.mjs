#!/usr/bin/env node
/**
 * @module scripts/requirements-moved.mjs
 * @purpose Report requirement-row, artifact-registry, feature-read, capability-placement and capability-field changes since a revision's merge base with HEAD.
 * @inputs argv (--root <dir> --base <rev>); REQUIREMENTS.md as committed at HEAD and at the merge base of <rev> and HEAD, read through git.
 * @outputs One summary line, affected feature blocks including parked-line changes, capability changes, and an artifacts section with one line per registry or feature-read change, on stdout; a named refusal on stderr.
 * @effects process (runs read-only git commands: merge-base, rev-parse, cat-file -e, show)
 * @errors exit 2 for a usage error, naming --root and --base; exit 1 for a read failure (an unresolvable revision, no merge base, or REQUIREMENTS.md absent at HEAD), naming the cause.
 */
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactConsumers, artifactReads, artifactRegistry, deliverableFieldLinesByRow } from "./deliverables.mjs";
import { CAPABILITY_FIELD_LABELS, parseLedger, readRequirementRows } from "./requirements-tree.mjs";

// Chosen: 64 MiB, the same size requirements-lift.mjs's blob reader (gitBuf) uses for a
// committed REQUIREMENTS.md blob, so a large ledger's git show output is never truncated.
export const MAX_GIT_BUFFER = 64 * 1024 * 1024;

/** The injected git runner: no shell, cwd pinned to the project root, buffer sized by MAX_GIT_BUFFER. */
export function defaultGit(root, args) {
  return spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: MAX_GIT_BUFFER });
}

function usage() {
  console.error("Usage: requirements-moved.mjs --root <dir> --base <rev>");
  return 2;
}

function parseArgs(argv) {
  let root = null;
  let base = null;
  if (argv.length % 2 !== 0) return null;
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--root" && value !== undefined) root = value;
    else if (flag === "--base" && value !== undefined) base = value;
    else return null;
  }
  if (!root || !base) return null;
  return { root, base };
}

/** A row's feature: its own ID when it is a feature heading, its parent feature when it is a
 * subgroup heading (a subgroup's rows roll up to the feature that holds it), or null for a
 * flat ledger's rows, which sit under no capability or feature heading at all. */
function featureIdOf(heading) {
  if (!heading) return null;
  if (heading.id?.startsWith("FEAT-")) return heading.id;
  if (heading.id?.startsWith("SUB-") && heading.parent?.id?.startsWith("FEAT-")) return heading.parent.id;
  return null;
}

function rowSnapshot(parsed) {
  const map = new Map();
  const fieldLines = deliverableFieldLinesByRow(parsed);
  for (const row of readRequirementRows(parsed)) {
    const all = fieldLines.get(row.id) ?? [];
    map.set(row.id, {
      status: row.status,
      requirement: row.requirement,
      featureId: featureIdOf(row.heading),
      deliverableLines: all.filter((line) => /^(?:Made by|Read by):/.test(line)),
      parkedLines: all.filter((line) => /^Parked:/.test(line)),
    });
  }
  return map;
}

function featureLabels(parsed) {
  const map = new Map();
  for (const heading of parsed.headings) if (heading.id?.startsWith("FEAT-")) map.set(heading.id, heading.label);
  return map;
}

function featureOrder(parsed) {
  return parsed.headings.filter((heading) => heading.id?.startsWith("FEAT-")).map((heading) => heading.id);
}

function capabilityIdOf(heading) {
  let current = heading;
  while (current && !current.id?.startsWith("CAP-")) current = current.parent;
  return current?.id?.startsWith("CAP-") ? current.id : null;
}

function featureCapabilities(parsed) {
  const map = new Map();
  for (const heading of parsed.headings) if (heading.id?.startsWith("FEAT-")) map.set(heading.id, capabilityIdOf(heading));
  return map;
}

const SET_FIELDS = new Set(["Needs", "Binds", "Deliverables"]);
function parsedCapabilityValues(heading, label) {
  const entries = heading.capabilityFields?.[label] ?? [];
  return entries.flatMap((entry) => label === "Kind" ? [entry.value.trim()] : entry.value.split(",").map((token) => token.trim()));
}
function capabilitySnapshot(parsed) {
  const map = new Map();
  for (const heading of parsed.headings) {
    if (!heading.id?.startsWith("CAP-")) continue;
    map.set(heading.id, {
      id: heading.id,
      label: heading.label,
      fields: Object.fromEntries(CAPABILITY_FIELD_LABELS.map((label) => [label, parsedCapabilityValues(heading, label)])),
    });
  }
  return map;
}
function equalCapabilityValues(label, left, right) {
  if (!SET_FIELDS.has(label)) return left.length === right.length && left.every((value, index) => value === right[index]);
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
const printedCapabilityValue = (values) => values.length ? values.join(", ") : "none";

/** Row ID -> the feature IDs whose `Also applies:` line names it, in HEAD document order. */
function alsoAppliesIndex(parsed) {
  const map = new Map();
  for (const heading of parsed.headings) {
    if (!heading.id?.startsWith("FEAT-")) continue;
    for (const id of heading.alsoApplies) {
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(heading.id);
    }
  }
  return map;
}

const rowNumber = (id) => Number(id.slice(2));

/** The movement report's text, computed from the base and HEAD ledger texts alone (no git). */
export function treeMovement({ baseText, headText, baseRevLabel, headRevLabel }) {
  const baseParsed = parseLedger(baseText);
  const headParsed = parseLedger(headText);
  const baseRows = rowSnapshot(baseParsed);
  const headRows = rowSnapshot(headParsed);
  const headOrder = featureOrder(headParsed);
  const headLabels = featureLabels(headParsed);
  const baseLabels = featureLabels(baseParsed);
  const shares = alsoAppliesIndex(headParsed);
  const baseFeatureCaps = featureCapabilities(baseParsed);
  const headFeatureCaps = featureCapabilities(headParsed);
  const baseCaps = capabilitySnapshot(baseParsed);
  const headCaps = capabilitySnapshot(headParsed);
  const baseRegistry = artifactRegistry(baseParsed, null);
  const headRegistry = artifactRegistry(headParsed, null);
  const baseArtifacts = baseRegistry.byId;
  const headArtifacts = headRegistry.byId;
  const baseReads = artifactReads(baseParsed, null, baseRegistry);
  const headReads = artifactReads(headParsed, null, headRegistry);
  const baseConsumers = artifactConsumers(baseParsed, null, baseRegistry, baseReads);
  const headConsumers = artifactConsumers(headParsed, null, headRegistry, headReads);

  const ids = new Set([...baseRows.keys(), ...headRows.keys()]);
  const groups = new Map();
  for (const id of [...ids].sort((a, b) => rowNumber(a) - rowNumber(b))) {
    const b = baseRows.get(id);
    const h = headRows.get(id);
    const parts = [];
    let groupFeature;
    if (!b && h) {
      parts.push(`new (${h.status})`);
      groupFeature = h.featureId;
    } else if (b && !h) {
      parts.push(`removed (${b.status})`);
      groupFeature = b.featureId;
    } else {
      if (b.status !== h.status) parts.push(`${b.status} -> ${h.status}`);
      if (b.requirement !== h.requirement) parts.push("text changed");
      if (JSON.stringify(b.deliverableLines) !== JSON.stringify(h.deliverableLines)) parts.push("Made by/Read by lines changed");
      if (JSON.stringify(b.parkedLines) !== JSON.stringify(h.parkedLines)) parts.push("Parked lines changed");
      if (b.featureId !== h.featureId) parts.push(`moved from ${b.featureId ?? "(no feature)"}`);
      if (parts.length === 0) continue; // Evidence-only edit: not movement.
      groupFeature = h.featureId;
    }
    const alsoApplies = shares.get(id);
    if (alsoApplies?.length) parts.push(`also applies: ${alsoApplies.join(", ")}`);
    if (!groups.has(groupFeature)) groups.set(groupFeature, []);
    groups.get(groupFeature).push(`  ${id} ${parts.join("; ")}`);
  }

  const noFeature = groups.has(null) ? [null] : [];
  const headKeys = [...groups.keys()]
    .filter((key) => key !== null && headOrder.includes(key))
    .sort((a, b) => headOrder.indexOf(a) - headOrder.indexOf(b));
  const trailingKeys = [...groups.keys()].filter((key) => key !== null && !headOrder.includes(key)).sort();
  const orderedKeys = [...noFeature, ...headKeys, ...trailingKeys];

  const capabilityChanges = [];
  for (const featureId of featureOrder(headParsed)) {
    if (!baseFeatureCaps.has(featureId) || !headFeatureCaps.has(featureId)) continue;
    const before = baseFeatureCaps.get(featureId);
    const after = headFeatureCaps.get(featureId);
    if (before !== after) capabilityChanges.push(`${featureId} moved ${before ?? "(no capability)"} → ${after ?? "(no capability)"}`);
  }
  for (const capabilityId of headParsed.headings.filter((heading) => heading.id?.startsWith("CAP-")).map((heading) => heading.id)) {
    const before = baseCaps.get(capabilityId);
    const after = headCaps.get(capabilityId);
    if (!before) continue;
    for (const label of CAPABILITY_FIELD_LABELS) {
      if (!equalCapabilityValues(label, before.fields[label], after.fields[label])) capabilityChanges.push(`${capabilityId} · ${after.label}: ${label} ${printedCapabilityValue(before.fields[label])} → ${printedCapabilityValue(after.fields[label])}`);
    }
  }
  for (const capability of baseCaps.values()) if (!headCaps.has(capability.id)) capabilityChanges.push(`${capability.id} · ${capability.label}: removed`);
  for (const capability of headCaps.values()) if (!baseCaps.has(capability.id)) capabilityChanges.push(`${capability.id} · ${capability.label}: new`);

  const artifactChanges = [];
  const artifactIds = new Set([...baseArtifacts.keys(), ...headArtifacts.keys()]);
  for (const id of [...artifactIds].sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)))) {
    const before = baseArtifacts.get(id);
    const after = headArtifacts.get(id);
    if (!before && after) { artifactChanges.push(`${id} new under ${after.featureId}`); continue; }
    if (before && !after) { artifactChanges.push(`${id} removed`); continue; }
    const parts = [];
    if (before.live && !after.live) parts.push("newly retired");
    else if (!before.live && after.live) parts.push("restored from retired");
    if (before.featureId !== after.featureId) parts.push(`moved ${before.featureId} → ${after.featureId}`);
    if (before.className !== after.className && before.live && after.live) parts.push(`class ${before.className} → ${after.className}`);
    if (before.location !== after.location && before.live && after.live) parts.push(`location ${before.location} → ${after.location}`);
    if (before.run !== after.run && before.live && after.live) parts.push(`run ${before.run} → ${after.run}`);
    if (JSON.stringify(before.writers) !== JSON.stringify(after.writers) && before.live && after.live) parts.push("writer changed");
    if (parts.length) artifactChanges.push(`${id} ${parts.join("; ")}`);
  }

  const readChanges = [];
  const baseReadMap = new Map();
  const headReadMap = new Map();
  for (const [featureId, entries] of baseReads.byFeature) for (const entry of entries) baseReadMap.set(`${featureId}\0${entry.id}`, entry);
  for (const [featureId, entries] of headReads.byFeature) for (const entry of entries) headReadMap.set(`${featureId}\0${entry.id}`, entry);
  const readKeys = [...headReadMap.keys(), ...[...baseReadMap.keys()].filter((key) => !headReadMap.has(key))];
  for (const key of readKeys) {
    const before = baseReadMap.get(key);
    const after = headReadMap.get(key);
    if (JSON.stringify(before?.readers ?? null) === JSON.stringify(after?.readers ?? null)) continue;
    const [featureId, id] = key.split("\0");
    const beforeText = before ? before.readers.join(", ") : "none";
    const afterText = after ? after.readers.join(", ") : "none";
    readChanges.push(`${featureId} ${id} readers ${beforeText} → ${afterText}`);
  }

  const consumerChanges = [];
  const consumerKey = (line) => [line.featureId, line.id, line.label, line.label === "Read by" ? line.kind : ""].join("\0");
  const consumerLineGroups = (consumerLines) => {
    const groups = new Map();
    for (const line of consumerLines) {
      const key = consumerKey(line);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(line);
    }
    return groups;
  };
  const baseConsumerLines = consumerLineGroups(baseConsumers.lines);
  const headConsumerLines = consumerLineGroups(headConsumers.lines);
  const consumerKeys = [...headConsumerLines.keys(), ...[...baseConsumerLines.keys()].filter((key) => !headConsumerLines.has(key))];
  for (const key of consumerKeys) {
    const beforeLines = baseConsumerLines.get(key) ?? [];
    const afterLines = headConsumerLines.get(key) ?? [];
    for (let index = 0; index < Math.max(beforeLines.length, afterLines.length); index++) {
      const before = beforeLines[index];
      const after = afterLines[index];
      if (before?.text === after?.text) continue;
      const line = after ?? before;
      const change = before && after ? "changed" : after ? "added" : "removed";
      if (line.label === "Read by") consumerChanges.push(`${line.featureId} ${line.id} reader ${line.kind || "(unknown)"} ${change}`);
      else consumerChanges.push(`${line.featureId} ${line.id} park ${line.date ?? "(unknown date)"} ${change}`);
    }
  }

  let rowCount = 0;
  const lines = [];
  for (const key of orderedKeys) {
    const rows = groups.get(key);
    rowCount += rows.length;
    const label = key === null ? "(no feature)" : `${key} · ${headLabels.get(key) ?? baseLabels.get(key) ?? ""}`;
    lines.push(label, ...rows);
  }
  if (rowCount === 0 && capabilityChanges.length === 0 && artifactChanges.length === 0 && readChanges.length === 0 && consumerChanges.length === 0) return "tree movement: none";
  const suffixes = [];
  if (capabilityChanges.length) suffixes.push(`${capabilityChanges.length} capability change(s)`);
  if (artifactChanges.length) suffixes.push(`${artifactChanges.length} artifact change(s)`);
  if (readChanges.length) suffixes.push(`${readChanges.length} read change(s)`);
  if (consumerChanges.length) suffixes.push(`${consumerChanges.length} artifact reader/park change(s)`);
  const suffix = suffixes.length ? `, ${suffixes.join(", ")}` : "";
  const output = [`tree movement ${baseRevLabel}..${headRevLabel}: ${rowCount} rows in ${orderedKeys.length} features${suffix}`, ...lines];
  if (capabilityChanges.length) output.push("capabilities:", ...capabilityChanges.map((change) => `  ${change}`));
  if (artifactChanges.length || readChanges.length || consumerChanges.length) output.push("artifacts:", ...artifactChanges.map((change) => `  ${change}`), ...readChanges.map((change) => `  ${change}`), ...consumerChanges.map((change) => `  ${change}`));
  return output.join("\n");
}

export function main(argv = process.argv.slice(2), git = defaultGit) {
  const args = parseArgs(argv);
  if (!args) return usage();
  const root = resolve(process.cwd(), args.root);
  const { base } = args;

  const mergeBase = git(root, ["merge-base", base, "HEAD"]);
  if (mergeBase.status !== 0) {
    console.error(`could not find a merge base for '${base}' and HEAD: ${(mergeBase.stderr || "").trim() || "git failed"}`);
    return 1;
  }
  const baseSha = mergeBase.stdout.trim();

  const headRev = git(root, ["rev-parse", "HEAD"]);
  if (headRev.status !== 0) {
    console.error(`could not resolve HEAD: ${(headRev.stderr || "").trim() || "git failed"}`);
    return 1;
  }
  const headSha = headRev.stdout.trim();

  const headExists = git(root, ["cat-file", "-e", "HEAD:./REQUIREMENTS.md"]);
  if (headExists.status !== 0) {
    console.error("REQUIREMENTS.md is absent at HEAD");
    return 1;
  }
  const headShow = git(root, ["show", "HEAD:./REQUIREMENTS.md"]);
  if (headShow.status !== 0) {
    console.error(`could not read REQUIREMENTS.md at HEAD: ${(headShow.stderr || "").trim() || "git failed"}`);
    return 1;
  }

  // Absent at the merge base means every HEAD row is new, not a read failure.
  const baseExists = git(root, ["cat-file", "-e", `${baseSha}:./REQUIREMENTS.md`]);
  const baseText = baseExists.status === 0 ? git(root, ["show", `${baseSha}:./REQUIREMENTS.md`]).stdout : "";

  console.log(treeMovement({
    baseText,
    headText: headShow.stdout,
    baseRevLabel: baseSha.slice(0, 7),
    headRevLabel: headSha.slice(0, 7),
  }));
  return 0;
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = main();
