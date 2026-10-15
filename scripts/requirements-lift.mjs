#!/usr/bin/env node
/**
 * @module scripts/requirements-lift.mjs
 * @purpose Lift a project's REQUIREMENTS.md into the requirements tree through a mapping, writing it only when proved and matching HEAD.
 * @inputs argv (--root <dir> [--mapping <file> | --emit-mapping <file>] [--write | --verify <rev>]), the ledger, an optional mapping file, git, and the general-engineering seed
 * @outputs the plan and proof lines on stdout, a written REQUIREMENTS.md or mapping file, or a named refusal on stderr
 * @effects disk (reads the ledger, the mapping and the seed; writes REQUIREMENTS.md or a mapping file through a temp file and rename), process (runs git read-only; exit 0/1/2)
 * @errors exit 2 for a usage error, naming --root; exit 1 for a named refusal (encoding, structure, a failed git gate, a failed proof); never a crash on honest input variation
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REPO_ROOT, checkTree, parseLedger, ledgerReadProblem, noTreeProblem, readRequirementRows, expandRowIds,
  TABLE_HEADER, TABLE_DELIMITER, markdownTableCells, countRequirementRowLines,
} from "./requirements-tree.mjs";
import { requirementRowId, ID } from "./requirements-trace.mjs";
import { proveLift } from "./requirements-lift-proof.mjs";

// ---------------------------------------------------------------------- tunables (§3.1)
/** Contract: the prefix every default placeholder Purpose/Outcome carries. Sealed by T14. */
export const UNSORTED_PREFIX = "Not yet sorted:";
/** Chosen: the label a synthetic "no capability above" capability carries. */
export const UNSORTED_LABEL = "Not yet sorted";
/** Chosen: the placeholder text a synthetic capability's own Purpose/Outcome carries. */
export const UNSORTED_TEXT = `${UNSORTED_PREFIX} a synthetic capability for sections the ledger places under no Part.`;
/** Contract: both seeds' closing heading (python template/REQUIREMENTS.md.jinja:110, typescript :108). */
export const CLOSING_HEADING = "# Open questions and deliberate omissions";
/** Contract: the two sections the closing heading keeps verbatim (SKILL.md:126, both seeds). */
export const KEPT_SECTIONS = ["Open questions", "Deliberate omissions"];
/** Path: the single source of the reserved general-engineering nodes. */
export const GENERAL_SEED = "templates/_shared/requirements-general.md";
/** Contract: matches requirements-tree.mjs's TABLE_DELIMITER. */
export const CANONICAL_DELIMITER = "|---|---|---|---|";
/** Contract: the mapping file format version this lift writes and reads. */
export const MAPPING_FORMAT = 1;
/** Chosen: 40 lines of about 200 characters sit far under Claude Code's 30,000 characters and pi's 2,000 lines (tree CHANGE.md:14-15). */
export const PROBLEM_LINE_CAP = 40;

const RESERVED_IDS = new Set(["CAP-90", "FEAT-900", "SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"]);

// ---------------------------------------------------------------------- raw segments (own copy; independent of the proof)
const BOM = "﻿";
const stripBom = (text) => (text.startsWith(BOM) ? text.slice(1) : text);
function segments(text) {
  const body = stripBom(text);
  return body === "" ? [] : body.split(/(?<=\n)/);
}
const bare = (seg) => seg.replace(/\r?\n$/, "");
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
function fenceMask(bareLines) {
  const mask = Array(bareLines.length).fill(false);
  let fence = null;
  for (let i = 0; i < bareLines.length; i++) {
    const line = bareLines[i];
    if (fence) {
      mask[i] = true;
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null;
      continue;
    }
    const open = FENCE.exec(line);
    if (open) { mask[i] = true; fence = { char: open[1][0], length: open[1].length }; }
  }
  return mask;
}
const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const TREE_HEADING = /^(#{1,3}) (CAP-\d{2}|FEAT-\d{3}|SUB-\d{3}) · (.+)$/;

/** Every ATX (1–6) or setext heading, fence-aware, in file order. */
function scanHeadings(bareLines, fenced) {
  const out = [];
  for (let i = 0; i < bareLines.length; i++) {
    if (fenced[i]) continue;
    const atx = ATX.exec(bareLines[i]);
    if (atx) {
      const level = atx[1].length;
      const rest = (atx[2] ?? "").trim().replace(/\s+#+\s*$/, "");
      const tree = TREE_HEADING.exec(bareLines[i]);
      out.push({ line: i + 1, level, label: rest, id: tree ? tree[2] : null });
      continue;
    }
    if (SETEXT.test(bareLines[i]) && i > 0 && bareLines[i - 1].trim() && !fenced[i - 1] && !ATX.test(bareLines[i - 1]) && !SETEXT.test(bareLines[i - 1]) && !requirementRowId(bareLines[i - 1]) && !out.some((h) => h.line === i)) {
      out.push({ line: i, level: bareLines[i].trimStart()[0] === "=" ? 1 : 2, label: bareLines[i - 1].trim(), id: null, setext: true });
    }
  }
  return out;
}
function isTableHeaderAt(bareLines, i) {
  const cells = markdownTableCells(bareLines[i] ?? "");
  const next = markdownTableCells(bareLines[i + 1] ?? "");
  return Boolean(cells && cells.length === 4 && next && next.length === 4 && next.every((c) => /^:?-+:?$/.test(c)));
}
/** The line ending of a raw segment, defaulting to "\n". */
const eolOf = (seg) => (/\r\n$/.test(seg) ? "\r\n" : /\n$/.test(seg) ? "\n" : "\n");

// ---------------------------------------------------------------------- the seed

function loadSeed(rootForRepo) {
  const path = resolve(rootForRepo, GENERAL_SEED);
  const text = readFileSync(path, "utf8");
  const parsed = parseLedger(text);
  const rows = readRequirementRows(parsed);
  const subOf = new Map();
  for (const row of rows) if (row.heading?.id?.startsWith("SUB-")) subOf.set(row.id, row.heading.id);
  const byId = new Map(parsed.headings.map((h) => [h.id, h]));
  return { text, byId, subOf };
}
function seedNodeText(id, seed) {
  const h = seed.byId.get(id);
  return { label: h?.label ?? "", purpose: h?.purpose ?? "", outcome: h?.outcome ?? "", status: h?.status ?? "" };
}

// ---------------------------------------------------------------------- encoding and structural refusals (R-1167)

/** The first 1-based line whose UTF-8 re-encoding differs from the raw bytes, or null. */
function firstEncodingMismatchLine(buf) {
  const text = buf.toString("utf8");
  const reencoded = Buffer.from(text, "utf8");
  if (reencoded.equals(buf)) return null;
  const rawLines = buf.toString("latin1").split(/(?<=\n)/); // byte-preserving split for line counting only
  let offset = 0;
  for (let i = 0; i < rawLines.length; i++) {
    const rawLen = Buffer.byteLength(rawLines[i], "latin1");
    const rawSlice = buf.subarray(offset, offset + rawLen);
    const decoded = rawSlice.toString("utf8");
    if (!Buffer.from(decoded, "utf8").equals(rawSlice)) return i + 1;
    offset += rawLen;
  }
  return rawLines.length || 1;
}

/** Problems a flat OR tree ledger's own bytes raise before any mapping is considered. */
function baseRefusals(buf, text, parsed) {
  const problems = [];
  const encLine = firstEncodingMismatchLine(buf);
  if (encLine !== null) problems.push(`line ${encLine}: bytes are not valid UTF-8 (an ANSI or other single-byte encoding); save the file as UTF-8`);
  const bareLines = segments(text).map(bare);
  const fenced = fenceMask(bareLines);
  const seenIds = new Map();
  for (let i = 0; i < bareLines.length; i++) {
    const id = requirementRowId(bareLines[i]);
    if (!id) continue;
    if (fenced[i]) { problems.push(`line ${i + 1}: requirement row ${id} is inside a code fence`); continue; }
    if (seenIds.has(id)) problems.push(`line ${i + 1}: requirement row ${id} repeats line ${seenIds.get(id)}`);
    else seenIds.set(id, i + 1);
  }
  const headings = scanHeadings(bareLines, fenced);
  for (const h of headings) {
    if (h.id) continue;
    if (h.setext) { problems.push(`line ${h.line}: setext heading is not supported; use an ATX "#" heading`); continue; }
    if (h.level >= 4) problems.push(`line ${h.line}: level ${h.level} heading is not supported; sections must be level 1 to 3`);
  }
  // Carried field-label prose only risks confusing a DEFAULT lift's flat sections (research-code.md
  // §3 item 7); a ledger that already carries a real tree heading takes the identity or
  // neither-flat-nor-tree path instead, where this scan would otherwise false-positive on an
  // informal "Purpose:" paragraph under an ordinary, non-tree heading (yokai-world's "## The
  // product").
  if (parsed.headings.length === 0) {
    const headingLineSet = new Set(headings.map((h) => h.line));
    for (let i = 0; i < bareLines.length; i++) {
      if (fenced[i] || requirementRowId(bareLines[i])) continue;
      if (headingLineSet.has(i + 1)) continue;
      if (bareLines[i].startsWith("|")) continue; // table structure or continuation
      if (!/^(Purpose|Outcome|Status|Also applies):/.test(bareLines[i])) continue;
      problems.push(`line ${i + 1}: carried prose starts with a field label ("${bareLines[i].split(":")[0]}:")`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------- the default mapping (R-1165)

/** Rows (requirementRowId only) strictly between two 1-based line numbers, exclusive of both. */
function rowsBetween(bareLines, fromLine, toLineExclusive) {
  const ids = [];
  for (let i = fromLine; i < toLineExclusive - 1; i++) { const id = requirementRowId(bareLines[i]); if (id) ids.push(id); }
  return ids;
}

/** Whether the ledger is flat under R-1165: exactly the no-tree problem, and no SUB heading. */
export function isFlatLedger(text) {
  const ct = checkTree(text);
  const n = countRequirementRowLines(ct.parsed);
  const hasSub = ct.parsed.headings.some((h) => h.id.startsWith("SUB-"));
  return !hasSub && ct.problems.length === 1 && ct.problems[0] === noTreeProblem(n);
}

/**
 * Builds the default mapping (§3.3): one node per old heading, numbered in file order, a
 * synthetic "Not yet sorted" capability before each maximal run of sections with no capability
 * above, and the reserved nodes exactly where the general-engineering rows sit. Returns
 * { mapping, problems }; a non-empty problems list means the default cannot place the ledger
 * (R-1167) and no mapping is returned.
 */
export function buildDefaultMapping(text, seed) {
  const problems = [];
  const bareLines = segments(text).map(bare);
  const fenced = fenceMask(bareLines);
  const all = scanHeadings(bareLines, fenced).filter((h) => h.level <= 3 && h.id === null);
  const title = all[0] && all[0].level === 1 && all[0].line === 1 ? all[0] : null;
  const keptHeadings = all.filter((h) => h.level === 2 && KEPT_SECTIONS.includes(h.label));
  const sections = all.filter((h) => h !== title && !keptHeadings.includes(h));
  if (!sections.length) { problems.push("the ledger has no section heading to lift"); return { mapping: null, problems }; }
  const boundaries = [...sections.map((h) => h.line), bareLines.length + 1];
  const rowsOf = (idx) => rowsBetween(bareLines, sections[idx].line, boundaries[idx + 1]);
  for (let idx = 0; idx < sections.length; idx++) {
    const rows = rowsOf(idx);
    const gIds = rows.filter((id) => id.startsWith("G-"));
    if (gIds.length && gIds.length !== rows.length) problems.push(`line ${sections[idx].line}: section mixes general-engineering (G-) rows with product rows; the default cannot place it`);
    if (gIds.length) {
      const subs = new Set(gIds.map((id) => seed.subOf.get(id)).filter(Boolean));
      if (subs.size > 1) problems.push(`line ${sections[idx].line}: general-engineering rows span more than one seed subgroup; the default cannot place it`);
      if (gIds.some((id) => !seed.subOf.has(id))) problems.push(`line ${sections[idx].line}: a general-engineering row is unknown to the seed; the default cannot place it`);
    }
  }
  if (problems.length) return { mapping: null, problems };

  const isGSection = (idx) => sections[idx].level === 2 && rowsOf(idx).length > 0 && rowsOf(idx).every((id) => id.startsWith("G-"));
  const headingText = (line) => bareLines[line - 1];

  const tree = [];
  let capN = 0, featN = 0, subN = 0;
  let cap = null, feat = null;
  let i = 0;
  while (i < sections.length) {
    const h = sections[i];
    if (isGSection(i)) {
      let runEnd = i;
      while (runEnd + 1 < sections.length && isGSection(runEnd + 1)) runEnd++;
      const prev = sections[i - 1];
      let capFrom = [];
      if (prev && prev.level === 1 && rowsOf(i - 1).length === 0 && tree.at(-1) === cap && cap?.__sectionIndex === i - 1) {
        tree.pop(); capN--; capFrom = [];
      }
      const capNode = { id: "CAP-90", from: [], features: [] };
      const featNode = { id: "FEAT-900", from: prev && rowsOf(i - 1).length === 0 && !tree.includes(cap) ? [{ line: prev.line, heading: headingText(prev.line) }] : [], rows: [], subgroups: [] };
      for (let k = i; k <= runEnd; k++) {
        const subId = seed.subOf.get(rowsOf(k)[0]) ?? "SUB-900";
        featNode.subgroups.push({ id: subId, from: [{ line: sections[k].line, heading: headingText(sections[k].line) }], rows: rowsOf(k) });
      }
      capNode.features.push(featNode);
      tree.push(capNode);
      cap = capNode; feat = featNode;
      i = runEnd + 1;
      continue;
    }
    if (h.level === 1) {
      capN++; const id = `CAP-${String(capN).padStart(2, "0")}`;
      const node = { id, label: h.label, purpose: `${UNSORTED_PREFIX} the rows of old section "${h.label}".`, outcome: `${UNSORTED_PREFIX} the rows of old section "${h.label}" sorted into the tree.`, from: [{ line: h.line, heading: headingText(h.line) }], features: [], __sectionIndex: i };
      tree.push(node); cap = node; feat = null; i++; continue;
    }
    if (cap === null || cap.id === "CAP-90") {
      capN++; const id = `CAP-${String(capN).padStart(2, "0")}`;
      const node = { id, label: UNSORTED_LABEL, purpose: UNSORTED_TEXT, outcome: UNSORTED_TEXT, from: [], features: [] };
      tree.push(node); cap = node; feat = null;
    }
    if (h.level === 2) {
      featN++; const id = `FEAT-${String(featN).padStart(3, "0")}`;
      const node = { id, label: h.label, purpose: `${UNSORTED_PREFIX} the rows of old section "${h.label}".`, status: "active", from: [{ line: h.line, heading: headingText(h.line) }], rows: rowsOf(i), subgroups: [] };
      cap.features.push(node); feat = node; i++; continue;
    }
    subN++; const id = `SUB-${String(subN).padStart(3, "0")}`;
    const node = { id, label: h.label, purpose: `${UNSORTED_PREFIX} the rows of old section "${h.label}".`, from: [{ line: h.line, heading: headingText(h.line) }], rows: rowsOf(i) };
    feat.subgroups.push(node); i++;
  }

  const headEnd = sections[0] ? sections[0].line - 1 : bareLines.length;
  const kept = scanHeadings(bareLines, fenced).filter((h) => h.level === 2 && KEPT_SECTIONS.includes(h.label));
  const tailFrom = [];
  const tailKeep = kept.map((h) => ({ line: h.line, heading: headingText(h.line) }));
  const mapping = { lift: MAPPING_FORMAT, pin: pinOf(text), head: { through: headEnd }, tree: tree.map(stripBuildMeta), tail: { heading: CLOSING_HEADING, from: tailFrom, keep: tailKeep } };
  return { mapping, problems: [] };
}
function stripBuildMeta(cap) { const { __sectionIndex, ...rest } = cap; return { ...rest, features: (rest.features ?? []).map((f) => ({ ...f, subgroups: f.subgroups ?? [] })) }; }

// ---------------------------------------------------------------------- the identity mapping (R-1162, S8)

/** Maps an existing tree-form ledger (0 checker problems) to itself: the regroup's start. */
export function buildIdentityMapping(text) {
  const parsed = parseLedger(text);
  const bareLines = segments(text).map(bare);
  const fenced = fenceMask(bareLines);
  const headings = parsed.headings.slice().sort((a, b) => a.line - b.line);
  const byParent = new Map();
  for (const h of headings) { const p = h.parent?.id ?? null; if (!byParent.has(p)) byParent.set(p, []); byParent.get(p).push(h); }
  const rowsFor = (h) => h.rows.slice();
  const buildSub = (h) => ({ id: h.id, label: h.label, purpose: h.purpose, from: [{ line: h.line, heading: bareLines[h.line - 1] }], rows: rowsFor(h) });
  const buildFeat = (h) => ({ id: h.id, label: h.label, purpose: h.purpose, status: h.status ?? "active", ...(h.alsoApplies?.length ? { also_applies: h.alsoApplies.slice() } : {}), from: [{ line: h.line, heading: bareLines[h.line - 1] }], rows: rowsFor(h), subgroups: (byParent.get(h.id) ?? []).map(buildSub) });
  const buildCap = (h) => ({ id: h.id, label: h.label, purpose: h.purpose, outcome: h.outcome ?? "", from: [{ line: h.line, heading: bareLines[h.line - 1] }], features: (byParent.get(h.id) ?? []).map(buildFeat) });
  const tree = (byParent.get(null) ?? []).map(buildCap);
  const allHeadings = scanHeadings(bareLines, fenced);
  const title = allHeadings[0] && allHeadings[0].level === 1 && allHeadings[0].line === 1 ? allHeadings[0] : null;
  const firstTreeLine = headings[0]?.line ?? bareLines.length + 1;
  const headEnd = firstTreeLine - 1;
  const kept = allHeadings.filter((h) => h.level === 2 && h.id === null && KEPT_SECTIONS.includes(h.label));
  const lastHeadingLine = Math.max(0, ...headings.map((h) => h.line));
  const closing = allHeadings.find((h) => h.line > lastHeadingLine && h.id === null && h.level === 1);
  return { lift: MAPPING_FORMAT, pin: pinOf(text), head: { through: headEnd }, tree, tail: { heading: closing ? bareLines[closing.line - 1].replace(/^#\s*/, "# ") : CLOSING_HEADING, from: closing ? [{ line: closing.line, heading: bareLines[closing.line - 1] }] : [], keep: kept.map((h) => ({ line: h.line, heading: bareLines[h.line - 1] })) } };
}

// ---------------------------------------------------------------------- the pin

function pinOf(text) {
  const lf = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = (segments(text).map(bare)).filter((l) => requirementRowId(l)).length;
  return { sha256: sha256(lf), rows };
}
function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// ---------------------------------------------------------------------- mapping validation (R-1167, both built-in and supplied)

function isPlainObject(v) { return typeof v === "object" && v !== null && !Array.isArray(v); }
function stringsOf(value, acc = []) {
  if (typeof value === "string") { acc.push(value); return acc; }
  if (Array.isArray(value)) { for (const v of value) stringsOf(v, acc); return acc; }
  if (isPlainObject(value)) { for (const v of Object.values(value)) stringsOf(v, acc); return acc; }
  return acc;
}

/** Reads and validates a supplied mapping file's bytes/JSON/pin before structural validation. */
function readMapping(path, rootDir, text) {
  const problems = [];
  let buf;
  try { buf = readFileSync(path); } catch (e) { return { problems: [`${path}: ${e.message}`] }; }
  if (buf.includes(0)) return { problems: [`${path}: NUL byte; likely UTF-16 from Windows PowerShell 5.1; save it as UTF-8`] };
  const encLine = firstEncodingMismatchLine(buf);
  if (encLine !== null) return { problems: [`${path}:${encLine}: bytes are not valid UTF-8 (an ANSI or other single-byte encoding)`] };
  let raw = buf.toString("utf8");
  if (raw.startsWith(BOM)) raw = raw.slice(1);
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { return { problems: [`${path}: not valid JSON (${e.message})`] }; }
  if (!isPlainObject(parsed)) return { problems: [`${path}: the top level must be an object`] };
  if (parsed.lift !== MAPPING_FORMAT) return { problems: [`${path}: mapping is lift version ${JSON.stringify(parsed.lift)}, not ${MAPPING_FORMAT}`] };
  for (const s of stringsOf(parsed)) {
    if (/�/.test(s)) return { problems: [`${path}: a string holds U+FFFD (invalid text)`] };
    if (/[\r\n]/.test(s)) return { problems: [`${path}: a string holds a line break`] };
  }
  const wantPin = pinOf(text);
  if (parsed.pin?.sha256 !== wantPin.sha256) return { problems: [`${path}: pin does not match this ledger (re-emit or re-propose the mapping)`] };
  return { mapping: parsed, problems: [] };
}

/** Full structural validation of a mapping against the parsed input ledger; names every problem, capped. */
function validateMapping(mapping, text, seed) {
  const problems = [];
  const bareLines = segments(text).map(bare);
  const fenced = fenceMask(bareLines);
  const realRowIds = new Set(bareLines.map((l) => requirementRowId(l)).filter(Boolean));
  const allHeadings = scanHeadings(bareLines, fenced);
  const headingAt = new Map(allHeadings.map((h) => [h.line, bareLines[h.line - 1]]));
  const namedOnce = new Map();
  const nameHeading = (f, where) => {
    if (!f) return;
    const text2 = headingAt.get(f.line);
    if (text2 === undefined || text2 !== f.heading) { problems.push(`${where}: names line ${f.line} as "${f.heading}", which the ledger does not hold`); return; }
    namedOnce.set(f.line, (namedOnce.get(f.line) ?? 0) + 1);
  };
  const nodes = flattenNodes(mapping);
  const seenIds = new Set();
  const rowOwner = new Map();
  for (const { id, level, node, parent } of nodes) {
    if (seenIds.has(id)) problems.push(`mapping: node ${id} appears more than once`);
    seenIds.add(id);
    const reserved = RESERVED_IDS.has(id);
    for (const f of node.from ?? []) nameHeading(f, id);
    const rows = expandRowIds((node.rows ?? []).join(","));
    for (const r of rows) {
      if (!ID.test(r)) { problems.push(`${id}: "${r}" is not a requirement ID`); continue; }
      if (!realRowIds.has(r)) { problems.push(`${id}: row ${r} is unknown; the ledger holds no such row`); continue; }
      if (rowOwner.has(r)) problems.push(`mapping: row ${r} is listed in both ${rowOwner.get(r)} and ${id}`);
      rowOwner.set(r, id);
      if (r.startsWith("R-") && reserved) problems.push(`${id}: reserved node holds R row ${r}`);
      if (r.startsWith("G-")) {
        const wantSub = seed.subOf.get(r);
        if (!wantSub) problems.push(`${id}: row ${r} is unknown to the general-engineering seed`);
        else if (level === 3 ? id !== wantSub : (node.subgroups ?? []).length === 0 && wantSub) problems.push(`${id}: row ${r} belongs to the seed subgroup ${wantSub}, not here`);
      }
    }
    if (!reserved && level === 2 && /^(proposed|retired)/.test(node.status ?? "") && rows.length) problems.push(`${id}: a proposed or retired feature holds rows`);
  }
  for (const f of mapping.tail?.from ?? []) nameHeading(f, "tail");
  for (const k of mapping.tail?.keep ?? []) nameHeading(k, "tail.keep");
  for (const h of allHeadings) {
    if (h.line > (mapping.head?.through ?? 0)) {
      const n = namedOnce.get(h.line) ?? 0;
      if (n === 0) problems.push(`line ${h.line}: old heading "${bareLines[h.line - 1]}" is not named by the mapping`);
      else if (n > 1) problems.push(`line ${h.line}: old heading "${bareLines[h.line - 1]}" is named more than once`);
    }
  }
  const allRowIds = bareLines.map((l) => requirementRowId(l)).filter(Boolean);
  for (const r of allRowIds) if (!rowOwner.has(r)) problems.push(`row ${r} is missing from the mapping`);

  // the unterminated-last-row rule: if the input's last line has no terminator and is a row,
  // nothing may be mapped after it.
  const rawSegs = segments(text);
  if (rawSegs.length && !/\n$/.test(rawSegs.at(-1))) {
    const lastLineNo = rawSegs.length;
    const lastId = requirementRowId(bare(rawSegs.at(-1)));
    if (lastId) {
      const lastLeaf = nodes.filter((n) => n.level > 1).at(-1);
      const lastLeafRows = lastLeaf ? expandRowIds((lastLeaf.node.rows ?? []).join(",")) : [];
      const hasTail = Boolean(mapping.tail?.keep?.length || mapping.tail?.from?.length);
      if (hasTail || lastLeafRows.at(-1) !== lastId) problems.push(`line ${lastLineNo}: the ledger ends with an unterminated row ${lastId}; a mapping may place nothing after it (end the file with a line break first)`);
    }
  }
  return problems;
}
function flattenNodes(mapping) {
  const out = [];
  for (const cap of mapping.tree ?? []) {
    out.push({ id: cap.id, level: 1, parent: null, node: cap });
    for (const feat of cap.features ?? []) {
      out.push({ id: feat.id, level: 2, parent: cap.id, node: feat });
      for (const sub of feat.subgroups ?? []) out.push({ id: sub.id, level: 3, parent: feat.id, node: sub });
    }
  }
  return out;
}
/** Old heading -> new node id, once per pair, for every row whose declared home differs from the node that carries its old section (research-code.md §4: "the apply step derives and prints the rows whose new home is not the node that carries their old section"). */
function detectMoves(text, mapping) {
  const bareLines = segments(text).map(bare);
  const fenced = fenceMask(bareLines);
  const allHeadingLines = scanHeadings(bareLines, fenced).map((h) => h.line);
  const nodes = flattenNodes(mapping);
  const rowHome = new Map();
  for (const { id, node } of nodes) for (const r of expandRowIds((node.rows ?? []).join(","))) rowHome.set(r, id);
  const moves = [];
  const seen = new Set();
  for (const { id, node } of nodes) {
    for (const f of node.from ?? []) {
      const start = f.line;
      const after = allHeadingLines.filter((l) => l > f.line);
      const end = after.length ? Math.min(...after) - 1 : bareLines.length;
      for (let i = start; i < end; i++) {
        const r = requirementRowId(bareLines[i]);
        if (!r) continue;
        const home = rowHome.get(r);
        if (home && home !== id) {
          const key = `${f.heading}->${home}`;
          if (!seen.has(key)) { seen.add(key); moves.push([f.heading, home]); }
        }
      }
    }
  }
  return moves;
}
function capProblems(problems) {
  if (problems.length <= PROBLEM_LINE_CAP) return problems;
  return [...problems.slice(0, PROBLEM_LINE_CAP), `… and ${problems.length - PROBLEM_LINE_CAP} more problem(s)`];
}

// ---------------------------------------------------------------------- apply (the writer)

/** True when a leaf's declared rows equal, in order, the rows its `from` sections hold in the input. */
function isInPlace(node, bareLines, allHeadingLines) {
  const want = expandRowIds((node.rows ?? []).join(","));
  const got = [];
  for (const f of node.from ?? []) {
    const start = f.line;
    const after = allHeadingLines.filter((l) => l > f.line);
    const end = after.length ? Math.min(...after) - 1 : bareLines.length;
    for (let i = start; i < end; i++) { const id = requirementRowId(bareLines[i]); if (id) got.push(id); }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
/** Raw segments of a node's `from` sections, prose only (rows and old table structure dropped) or, in place, the whole body verbatim with headers normalised. */
function sectionBody(node, segs, bareLines, fenced, allHeadingLines, mode) {
  const out = [];
  for (const f of node.from ?? []) {
    const start = f.line;
    const after = allHeadingLines.filter((l) => l > f.line);
    const end = after.length ? Math.min(...after) - 1 : bareLines.length;
    const isOldFieldLine = (i) => /^(Purpose|Outcome|Status|Also applies):/.test(bareLines[i]);
    if (mode === "prose") {
      for (let i = start; i < end; i++) {
        if (fenced[i]) { out.push(segs[i]); continue; }
        if (requirementRowId(bareLines[i])) continue;
        if (isOldFieldLine(i)) continue; // the old heading's own field line (already tree-form): regenerated fresh, never carried
        if (isTableHeaderAt(bareLines, i)) { i++; continue; }
        out.push(segs[i]);
      }
    } else {
      let i = start;
      let inTable = false;
      while (i < end) {
        if (fenced[i]) { out.push(segs[i]); i++; continue; }
        if (isOldFieldLine(i)) { i++; continue; }
        if (isTableHeaderAt(bareLines, i)) {
          const eol = eolOf(segs[i + 1]);
          out.push(`${TABLE_HEADER}${eol}`, `${TABLE_DELIMITER_TEXT}${eol}`);
          i += 2; inTable = true; continue;
        }
        if (requirementRowId(bareLines[i])) {
          if (!inTable) { const eol = eolOf(segs[i]); out.push(`${TABLE_HEADER}${eol}`, `${TABLE_DELIMITER_TEXT}${eol}`); }
          out.push(segs[i]); inTable = true; i++; continue;
        }
        if (bareLines[i].startsWith("|")) { out.push(segs[i]); i++; continue; }
        out.push(segs[i]); inTable = false; i++;
      }
    }
  }
  return out;
}
const TABLE_DELIMITER_TEXT = CANONICAL_DELIMITER;

function fieldLines(labelsAndValues, eol) {
  return labelsAndValues.filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${k}: ${v}${eol}`);
}

/** Applies a validated mapping to the input, returning the output text. */
export function applyMapping(text, mapping, seed) {
  const segs = segments(text);
  const bareLines = segs.map(bare);
  const fenced = fenceMask(bareLines);
  const allHeadingLines = scanHeadings(bareLines, fenced).map((h) => h.line);
  const eol = eolOf(segs[0] ?? "\n");
  const out = [];
  out.push(...segs.slice(0, mapping.head?.through ?? 0));

  const rowSegs = new Map();
  bareLines.forEach((l, i) => { if (fenced[i]) return; const id = requirementRowId(l); if (id) rowSegs.set(id, segs[i]); });

  const emitProseOnly = (node) => sectionBody(node, segs, bareLines, fenced, allHeadingLines, "prose");
  /** A leaf's whole body: in place (prose and tables interleaved, headers normalised) when its
   * rows already sit in mapping order, otherwise prose first, then one canonical table. */
  const emitBody = (node) => {
    const rows = expandRowIds((node.rows ?? []).join(","));
    if (!rows.length) return emitProseOnly(node);
    if (isInPlace(node, bareLines, allHeadingLines)) return sectionBody(node, segs, bareLines, fenced, allHeadingLines, "inplace");
    const prose = emitProseOnly(node);
    return [...prose, eol, `${TABLE_HEADER}${eol}`, `${TABLE_DELIMITER_TEXT}${eol}`, ...rows.map((id) => rowSegs.get(id) ?? "")];
  };

  for (const cap of mapping.tree ?? []) {
    const reservedCap = RESERVED_IDS.has(cap.id);
    const capText = reservedCap ? seedNodeText(cap.id, seed) : { label: cap.label, purpose: cap.purpose, outcome: cap.outcome };
    out.push(`# ${cap.id} · ${capText.label}${eol}`);
    out.push(...fieldLines([["Purpose", capText.purpose], ["Outcome", capText.outcome]], eol));
    out.push(...emitProseOnly(cap));
    for (const feat of cap.features ?? []) {
      const reservedFeat = RESERVED_IDS.has(feat.id);
      const featText = reservedFeat ? seedNodeText(feat.id, seed) : { label: feat.label, purpose: feat.purpose, status: feat.status };
      out.push(`## ${feat.id} · ${featText.label}${eol}`);
      out.push(...fieldLines([["Purpose", featText.purpose], ["Status", featText.status], ["Also applies", feat.also_applies?.length ? feat.also_applies.join(", ") : undefined]], eol));
      out.push(...emitBody(feat));
      for (const sub of feat.subgroups ?? []) {
        const reservedSub = RESERVED_IDS.has(sub.id);
        const subText = reservedSub ? seedNodeText(sub.id, seed) : { label: sub.label, purpose: sub.purpose };
        out.push(`### ${sub.id} · ${subText.label}${eol}`);
        out.push(...fieldLines([["Purpose", subText.purpose]], eol));
        out.push(...emitBody(sub));
      }
    }
  }
  const tailHasContent = Boolean((mapping.tail?.keep ?? []).length || (mapping.tail?.from ?? []).length);
  if (tailHasContent) {
    out.push(`${mapping.tail.heading}${eol}`);
    for (const f of mapping.tail.from ?? []) {
      const start = f.line, after = allHeadingLines.filter((l) => l > f.line), end = after.length ? Math.min(...after) - 1 : bareLines.length;
      for (let i = start; i < end; i++) out.push(segs[i]);
    }
    for (const k of mapping.tail.keep ?? []) {
      const start = k.line - 1, after = allHeadingLines.filter((l) => l > k.line), end = after.length ? Math.min(...after) - 1 : bareLines.length;
      for (let i = start; i < end; i++) out.push(segs[i]);
    }
  }
  return (text.startsWith(BOM) ? BOM : "") + out.join("");
}

// ---------------------------------------------------------------------- git gate (R-1164)

function git(cwd, args) { return spawnSync("git", args, { cwd, encoding: "utf8" }); }
function gitClean(cwd, relPath) {
  const lsErr = git(cwd, ["ls-files", "--error-unmatch", "--", relPath]);
  if (lsErr.status === null) return { ok: false, reason: "git is not on PATH" };
  if (lsErr.status !== 0) return { ok: false, reason: `${relPath} is untracked` };
  const diff = git(cwd, ["diff", "--quiet", "HEAD", "--", relPath]);
  if (diff.status === null) return { ok: false, reason: "git is not on PATH" };
  if (diff.status === 128) return { ok: false, reason: "HEAD has no commit yet; commit the ledger first" };
  if (diff.status !== 0) return { ok: false, reason: `${relPath} differs from HEAD` };
  return { ok: true };
}
/** Every non-bare worktree of the repository holding `rootDir`, each checked clean for its own copy of relPath. */
function worktreeScan(rootDir, relPath) {
  const list = git(rootDir, ["worktree", "list", "--porcelain"]);
  if (list.status !== 0) return { ok: false, reason: "git worktree list failed" };
  const dirs = list.stdout.split("\n").filter((l) => l.startsWith("worktree ")).map((l) => l.slice("worktree ".length).trim());
  for (const dir of dirs) {
    const prefix = git(dir, ["rev-parse", "--show-prefix"]).stdout.trim();
    const candidate = join(prefix, relPath).split(sep).join("/");
    const diff = git(dir, ["diff", "--quiet", "HEAD", "--", candidate]);
    if (diff.status === 0) continue;
    const ls = git(dir, ["ls-files", "--error-unmatch", "--", candidate]);
    if (ls.status !== 0) continue; // not tracked in that worktree at all (e.g. a different subfolder) — not this ledger
    return { ok: false, reason: `an uncommitted edit to the ledger sits in worktree ${dir}` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------- CLI

function usage() {
  console.error("Usage: requirements-lift.mjs --root <dir> [--mapping <file> | --emit-mapping <file>] [--write | --verify <rev>]");
  return 2;
}
function repoRootFor(dir) {
  const r = git(dir, ["rev-parse", "--show-toplevel"]);
  return r.status === 0 ? r.stdout.trim() : null;
}

export function main(argv = process.argv.slice(2)) {
  const args = { root: null, mapping: null, emitMapping: null, write: false, verify: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--mapping") args.mapping = argv[++i];
    else if (a === "--emit-mapping") args.emitMapping = argv[++i];
    else if (a === "--write") args.write = true;
    else if (a === "--verify") args.verify = argv[++i];
    else return usage();
  }
  if (!args.root) return usage();
  if (args.verify !== null && args.verify.startsWith("-")) return usage();
  const modeCount = [args.write, args.verify !== null].filter(Boolean).length;
  if (modeCount > 1) return usage();
  if (args.emitMapping && (args.mapping || args.write || args.verify !== null)) return usage();

  let rootDir = resolve(process.cwd(), args.root);
  try { rootDir = realpathSync(rootDir); } catch {}
  const seed = loadSeed(REPO_ROOT);

  if (args.verify !== null) return runVerify(rootDir, args, seed);

  const ledgerPath = resolve(rootDir, "REQUIREMENTS.md");
  let buf;
  try { buf = readFileSync(ledgerPath); } catch (e) { console.error(`${ledgerPath}: ${e.message}`); return 1; }
  const text = buf.toString("utf8");
  const parsed = parseLedger(text);
  const readProblem = ledgerReadProblem(text, parsed);
  if (readProblem) { console.error(readProblem); return 1; }
  const base = baseRefusals(buf, text, parsed);
  if (base.length) { for (const p of capProblems(base)) console.error(p); return 1; }

  let mapping, fromDefault = false, mappingPath = null;
  if (args.mapping) {
    mappingPath = resolve(rootDir, args.mapping);
    const realRoot = realpathSync(rootDir);
    const realMap = (() => { try { return realpathSync(mappingPath); } catch { return resolve(mappingPath); } })();
    if (!realMap.startsWith(realRoot + sep) && realMap !== realRoot) { console.error(`${mappingPath}: lies outside --root`); return 1; }
    mappingPath = realMap;
    const read = readMapping(mappingPath, rootDir, text);
    if (read.problems.length) { for (const p of capProblems(read.problems)) console.error(p); return 1; }
    mapping = read.mapping;
    const vprobs = validateMapping(mapping, text, seed);
    if (vprobs.length) { for (const p of capProblems(vprobs)) console.error(p); return 1; }
  } else {
    const ct = checkTree(text);
    if (ct.problems.length === 0) {
      mapping = buildIdentityMapping(text);
    } else if (isFlatLedger(text)) {
      const built = buildDefaultMapping(text, seed);
      if (built.problems.length) { for (const p of capProblems(built.problems)) console.error(p); return 1; }
      mapping = built.mapping; fromDefault = true;
    } else {
      console.error(`${ledgerPath}: this ledger is neither flat nor a passing tree; supply --mapping (${ct.problems[0] ?? "see the tree checker"})`);
      return 1;
    }
  }

  if (args.emitMapping) {
    const dest = resolve(rootDir, args.emitMapping);
    if (existsSync(dest)) { console.error(`${dest}: already exists`); return 1; }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, `${JSON.stringify(mapping, null, 2)}\n`);
    console.log(`wrote ${dest}`);
    return 0;
  }

  const output = applyMapping(text, mapping, seed);
  const proof = proveLift(text, mapping, output, seed.text, { fromDefault });
  {
    // R-1162: each plan line carries the heading's OWN subtree row count (its rows plus every
    // descendant's), as the written ledger will hold them, not just its own leaf rows.
    const planNodes = flattenNodes(mapping);
    const ownRows = new Map(planNodes.map((n) => [n.id, expandRowIds((n.node.rows ?? []).join(",")).length]));
    const children = new Map();
    for (const n of planNodes) if (n.parent) { if (!children.has(n.parent)) children.set(n.parent, []); children.get(n.parent).push(n.id); }
    const subtreeCount = (id) => (ownRows.get(id) ?? 0) + (children.get(id) ?? []).reduce((s, c) => s + subtreeCount(c), 0);
    for (const n of planNodes) console.log(`${n.id}: ${subtreeCount(n.id)} row(s)`);
  }
  for (const [oldHeading, newId] of detectMoves(text, mapping)) console.log(`${oldHeading} -> ${newId}`);
  if (proof.problems.length) { for (const p of capProblems(proof.problems)) console.error(p); return 1; }
  console.log(proof.summary);

  if (!args.write) return 0;

  const repoRoot = repoRootFor(rootDir);
  if (!repoRoot) { console.error(`${rootDir}: git is not on PATH, or this is not a git repository`); return 1; }
  const relLedger = relative(repoRoot, ledgerPath).split(sep).join("/");
  const clean = gitClean(repoRoot, relLedger);
  if (!clean.ok) { console.error(`--write refused: ${clean.reason}`); return 1; }
  if (mappingPath) {
    const relMap = relative(repoRoot, mappingPath).split(sep).join("/");
    const mapClean = gitClean(repoRoot, relMap);
    if (!mapClean.ok) { console.error(`--write refused: mapping ${mapClean.reason}`); return 1; }
  }
  const wtScan = worktreeScan(repoRoot, relLedger);
  if (!wtScan.ok) { console.error(`--write refused: ${wtScan.reason}`); return 1; }

  const reread = readFileSync(ledgerPath);
  if (!reread.equals(buf)) { console.error(`--write refused: ${ledgerPath} changed since the proof`); return 1; }
  const tmp = `${ledgerPath}.lift-${process.pid}.tmp`;
  try {
    writeFileSync(tmp, output);
    renameSync(tmp, ledgerPath);
  } catch (e) {
    try { rmSync(tmp, { force: true }); } catch {}
    console.error(`--write refused: could not replace the ledger (${e.message})`);
    return 1;
  }
  return 0;
}

function runVerify(rootDir, args, seed) {
  const repoRoot = repoRootFor(rootDir);
  if (!repoRoot) { console.error(`${rootDir}: git is not on PATH, or this is not a git repository`); return 1; }
  const relLedger = relative(repoRoot, resolve(rootDir, "REQUIREMENTS.md")).split(sep).join("/");
  const headClean = gitClean(repoRoot, relLedger);
  if (!headClean.ok) { console.error(`--verify refused: ${relLedger} ${headClean.reason}`); return 1; }
  let mapping = null;
  if (args.mapping) {
    const mappingPath = (() => { try { return realpathSync(resolve(rootDir, args.mapping)); } catch { return resolve(rootDir, args.mapping); } })();
    const relMap = relative(repoRoot, mappingPath).split(sep).join("/");
    const mapClean = gitClean(repoRoot, relMap);
    if (!mapClean.ok) { console.error(`--verify refused: ${relMap} ${mapClean.reason}`); return 1; }
    const blob = git(repoRoot, ["show", `HEAD:./${relMap}`]);
    if (blob.status !== 0) { console.error(`--verify refused: could not read HEAD:./${relMap}`); return 1; }
    let raw = blob.stdout;
    if (raw.startsWith(BOM)) raw = raw.slice(1);
    try { mapping = JSON.parse(raw); } catch (e) { console.error(`--verify refused: HEAD:./${relMap} is not valid JSON (${e.message})`); return 1; }
  }
  const input = git(repoRoot, ["show", `${args.verify}:./${relLedger}`]);
  if (input.status !== 0) { console.error(`--verify refused: could not read ${args.verify}:./${relLedger}`); return 1; }
  const expected = git(repoRoot, ["show", `HEAD:./${relLedger}`]);
  if (expected.status !== 0) { console.error(`--verify refused: could not read HEAD:./${relLedger}`); return 1; }
  const inputText = input.stdout;
  if (!mapping) {
    const ct = checkTree(inputText);
    mapping = ct.problems.length === 0 ? buildIdentityMapping(inputText) : buildDefaultMapping(inputText, seed).mapping;
  }
  if (!mapping) { console.error(`--verify refused: ${args.verify}:./${relLedger} cannot be lifted by the default`); return 1; }
  const output = applyMapping(inputText, mapping, seed);
  if (output === expected.stdout) { console.log(`--verify ${args.verify}: matches HEAD`); return 0; }
  const a = output.split("\n"), b = expected.stdout.split("\n");
  const i = a.findIndex((line, n) => line !== b[n]);
  console.error(`--verify refused: line ${i + 1} differs from HEAD`);
  return 1;
}

// realpath, not resolve: a run through a symlink to this script must still execute main()
// (R-1162, §3.6; tree CHANGE.md:229 names the resolve form's silent-exit bug through a link).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exit(main());
