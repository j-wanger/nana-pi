#!/usr/bin/env node
/**
 * @module scripts/requirements-moved.mjs
 * @purpose Report, per feature, how REQUIREMENTS.md rows added, removed, re-statused, reworded or moved since a revision's merge base with HEAD.
 * @inputs argv (--root <dir> --base <rev>); REQUIREMENTS.md as committed at HEAD and at the merge base of <rev> and HEAD, read through git.
 * @outputs One summary line, then one unindented `FEAT-nnn · <label>` line per affected feature (HEAD order; base-only features last), each followed by one row-change line per changed row, on stdout; a named refusal on stderr.
 * @effects process (runs read-only git commands: merge-base, rev-parse, cat-file -e, show)
 * @errors exit 2 for a usage error, naming --root and --base; exit 1 for a read failure (an unresolvable revision, no merge base, or REQUIREMENTS.md absent at HEAD), naming the cause.
 */
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseLedger, readRequirementRows } from "./requirements-tree.mjs";

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
  for (const row of readRequirementRows(parsed)) {
    map.set(row.id, { status: row.status, requirement: row.requirement, featureId: featureIdOf(row.heading) });
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

  let rowCount = 0;
  const lines = [];
  for (const key of orderedKeys) {
    const rows = groups.get(key);
    rowCount += rows.length;
    const label = key === null ? "(no feature)" : `${key} · ${headLabels.get(key) ?? baseLabels.get(key) ?? ""}`;
    lines.push(label, ...rows);
  }
  if (rowCount === 0) return "tree movement: none";
  return [`tree movement ${baseRevLabel}..${headRevLabel}: ${rowCount} rows in ${orderedKeys.length} features`, ...lines].join("\n");
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

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exit(main());
