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
/**
 * A header/delimiter pair is a REQUIREMENT-table header only when the next non-blank line after
 * the delimiter is itself a requirement row (build brief 5 item 1): a plain 4-column table, e.g.
 * `| Term | Meaning | Source | Since |`, is never replaced or dropped -- its lines are ordinary
 * carried prose, like any other table a leaf holds. This also stops a fenced table EXAMPLE (one
 * no row ever follows) from being mistaken for one (item 5).
 */
function isTableHeaderAt(bareLines, i) {
  const cells = markdownTableCells(bareLines[i] ?? "");
  const next = markdownTableCells(bareLines[i + 1] ?? "");
  if (!(cells && cells.length === 4 && next && next.length === 4 && next.every((c) => /^:?-+:?$/.test(c)))) return false;
  let j = i + 2;
  while (j < bareLines.length && bareLines[j] === "") j++;
  return Boolean(requirementRowId(bareLines[j] ?? ""));
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

/**
 * The 0-based raw-line indices, within ONE heading's own span (from its line to just before the
 * next heading of any kind), that are its field-line block -- exactly as the tree parser
 * (`requirements-tree.mjs`'s `parseLedger`) defines it: the first "Purpose:" line, and -- for a
 * CAP- heading -- the first "Outcome:" line, or -- for a FEAT- heading -- the first "Status:"
 * line. A heading with no tree id (a plain, non-tree heading) carries no field block at all --
 * the tree parser never scans one for fields -- so `id` null returns empty. Build brief 4 §A,
 * MUST 1(b): only these lines are a replaced heading's own regenerated field lines; a
 * field-labelled line anywhere else (a second "Purpose:", an "Outcome:" under a feature, which
 * the tree parser never reads, or ANY "Also applies:" line -- build brief 7 item 3: shares are
 * refused in every ledger form, so an "Also applies:" line is never treated as regeneratable
 * field content, in a feature's own span or anywhere else) is ordinary carried prose, never
 * silently dropped by the writer nor exempted from the base refusal below.
 */
function fieldBlockAt(bareLines, allHeadingLines, headingLine, id) {
  const set = new Set();
  if (!id) return set;
  const after = allHeadingLines.filter((l) => l > headingLine);
  const end = after.length ? Math.min(...after) - 1 : bareLines.length;
  let purposeFound = false, outcomeFound = false, statusFound = false;
  for (let i = headingLine; i < end; i++) {
    const l = bareLines[i];
    if (!purposeFound && /^Purpose:/.test(l)) { set.add(i); purposeFound = true; continue; }
    if (id.startsWith("CAP-") && !outcomeFound && /^Outcome:/.test(l)) { set.add(i); outcomeFound = true; continue; }
    if (id.startsWith("FEAT-") && !statusFound && /^Status:/.test(l)) { set.add(i); statusFound = true; continue; }
  }
  return set;
}
/** `fieldBlockAt`, unioned over every tree heading in the ledger (base-refusal scope). */
function fieldBlockLines(bareLines, allHeadingLines, treeHeadings) {
  const set = new Set();
  for (const h of treeHeadings) for (const i of fieldBlockAt(bareLines, allHeadingLines, h.line, h.id)) set.add(i);
  return set;
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
  // A field-labelled line that is NOT the legitimate field block of a tree heading is refused
  // everywhere, not only in a wholly flat ledger (build brief 4 §A: "R-1167's refusal of a
  // carried field-labelled line applies to tree-form input too, not only to flat ledgers"). In a
  // flat ledger (no tree headings at all) `fieldBlock` is empty, so every match is refused, as
  // before (yokai-world's informal "Purpose:" paragraph under a PLAIN, non-tree heading is
  // likewise never in `fieldBlock` and stays refused -- it was never a false positive to begin
  // with, since a plain heading carries no field block for the tree parser to recognise).
  // Build brief 5 item 3: a field-labelled line that sits in the document's structural HEAD
  // (every tree-form ledger's prose before its first tree heading -- nana-pi's own "## Purpose
  // and outcomes" intro, line 64; yokai-world's line 50) or TAIL (a kept section or the closing
  // heading's own span) is carried verbatim, never replaced, and so is not a problem either --
  // only when at least one tree heading already exists; a wholly flat ledger has no such head
  // (its own intro is still refused, as T22 pins) since nothing there is a tree-form prose block.
  const headingLineSet = new Set(headings.map((h) => h.line));
  const treeHeadings = headings.filter((h) => h.id);
  const fieldBlock = fieldBlockLines(bareLines, headings.map((h) => h.line), treeHeadings);
  const headEnd = treeHeadings.length ? Math.min(...treeHeadings.map((h) => h.line)) - 1 : 0;
  const tailLines = structuralTailLines(bareLines, headings);
  for (let i = 0; i < bareLines.length; i++) {
    if (fenced[i] || requirementRowId(bareLines[i])) continue;
    if (headingLineSet.has(i + 1)) continue;
    if (fieldBlock.has(i)) continue; // a tree heading's own, legitimate field line
    if (i < headEnd || tailLines.has(i)) continue; // head/tail prose: carried verbatim, never replaced
    if (bareLines[i].startsWith("|")) continue; // table structure or continuation
    if (/^Also applies:/.test(bareLines[i])) continue; // §3.1: checked separately below, every span included
    if (!/^(Purpose|Outcome|Status):/.test(bareLines[i])) continue;
    problems.push(`line ${i + 1}: carried prose starts with a field label ("${bareLines[i].split(":")[0]}:")`);
  }
  problems.push(...shareLineRefusals(bareLines, segments(text), parsed));
  return problems;
}
/**
 * §3.1, R-1167: a share line is exactly a feature heading's `alsoAppliesLines[0]`, as the tree
 * parser (`parsed`, already computed by the caller) reads it -- the one legitimate "Also
 * applies:" line in the whole ledger for that feature. Every other one -- fenced, in the head or
 * tail, under a capability or subgroup, a second line in a feature's own span, or one in a flat
 * ledger (no FEAT- heading at all) -- is refused by name, whether or not it is also fenced or
 * inside head/tail prose (checked here, independent of and before those skips above). The one
 * allowed line is refused too when it is the file's last line and carries no terminator (only
 * the last raw segment can lack one): the writer could not place it after Status with a byte
 * ending to copy.
 */
function shareLineRefusals(bareLines, segs, parsed) {
  const problems = [];
  const allowed = new Set();
  for (const h of parsed.headings) {
    if (!h.id?.startsWith("FEAT-")) continue;
    const first = h.alsoAppliesLines?.[0];
    if (first) allowed.add(first.line);
  }
  for (let i = 0; i < bareLines.length; i++) {
    if (!/^Also applies:/.test(bareLines[i])) continue;
    const lineNo = i + 1;
    if (allowed.has(lineNo)) {
      if (i === bareLines.length - 1 && !/\n$/.test(segs[i] ?? "")) problems.push(`line ${lineNo}: the share line has no line ending (end the file with a line break first)`);
      continue;
    }
    problems.push(`line ${lineNo}: "Also applies:" is not a feature heading's first share line as the tree checker reads it`);
  }
  return problems;
}
/** Old FEAT- heading id a mapping `from` entry's heading text names, as the tree heading pattern reads it, or null. */
function oldFeatIdOf(fromEntry) {
  const m = TREE_HEADING.exec(fromEntry?.heading ?? "");
  return m && m[2].startsWith("FEAT-") ? m[2] : null;
}
/** Every old FEAT- heading (with its shares, share line, heading line and raw segment) that carries at least one legitimate share line, keyed by id. */
function shareInfoOf(parsed, segs) {
  const map = new Map();
  for (const h of parsed.headings) {
    if (!h.id?.startsWith("FEAT-")) continue;
    const first = h.alsoAppliesLines?.[0];
    if (!first) continue;
    map.set(h.id, { shares: h.alsoApplies.slice(), line: first.line, headingLine: h.line, seg: segs[first.line - 1] });
  }
  return map;
}
/** The old feature headings (with shares) a feature node's own `from` and its subgroups' `from` name, in order (§3.2 "Carried(F)" sources). */
function shareSourcesOf(node, shareInfo) {
  const out = [];
  for (const f of node.from ?? []) { const id = oldFeatIdOf(f); if (id && shareInfo.has(id)) out.push(shareInfo.get(id)); }
  for (const sub of node.subgroups ?? []) for (const f of sub.from ?? []) { const id = oldFeatIdOf(f); if (id && shareInfo.has(id)) out.push(shareInfo.get(id)); }
  return out;
}
/** Carried(F) (§3.2): the union of F's source headings' shares, first seen first, deduped. */
function carriedSharesOf(node, shareInfo) {
  const seen = new Set(), carried = [];
  for (const src of shareSourcesOf(node, shareInfo)) for (const id of src.shares) if (!seen.has(id)) { seen.add(id); carried.push(id); }
  return carried;
}
/** carried(F) less its declared `shares_dropped`, plus its declared `shares_added`, in that order (§2 R-1181/1182). */
function wantedSharesOf(node, shareInfo) {
  const dropped = new Set(node.shares_dropped ?? []);
  return [...carriedSharesOf(node, shareInfo).filter((id) => !dropped.has(id)), ...(node.shares_added ?? [])];
}
/** 0-based line indices under a kept section (Open questions / Deliberate omissions, by label)
 * or the closing heading's own span: the structural TAIL, carried verbatim and never replaced. */
function structuralTailLines(bareLines, headings) {
  const set = new Set();
  const starts = headings.filter((h) => (h.level === 2 && KEPT_SECTIONS.includes(h.label)) || bareLines[h.line - 1] === CLOSING_HEADING);
  for (const h of starts) {
    const after = headings.filter((x) => x.line > h.line).map((x) => x.line);
    const end = after.length ? Math.min(...after) - 1 : bareLines.length;
    for (let i = h.line - 1; i < end; i++) set.add(i);
  }
  return set;
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
    // Build brief 6 item 3: a level-3 section with no level-2 feature above it (a lone "###"
    // right after a "#", or at the very start) has nowhere to attach -- name it instead of
    // crashing, and keep scanning so a ledger with both base problems and this shape names
    // every problem in one run, never a partial list cut short by a TypeError.
    if (!feat) { problems.push(`line ${h.line}: level 3 section "${h.label}" has no level 2 feature above it; the default cannot place it`); i++; continue; }
    subN++; const id = `SUB-${String(subN).padStart(3, "0")}`;
    const node = { id, label: h.label, purpose: `${UNSORTED_PREFIX} the rows of old section "${h.label}".`, from: [{ line: h.line, heading: headingText(h.line) }], rows: rowsOf(i) };
    feat.subgroups.push(node); i++;
  }
  if (problems.length) return { mapping: null, problems };

  const headEnd = sections[0] ? sections[0].line - 1 : bareLines.length;
  const kept = scanHeadings(bareLines, fenced).filter((h) => h.level === 2 && KEPT_SECTIONS.includes(h.label));
  const tailFrom = [];
  const tailKeep = kept.map((h) => ({ line: h.line, heading: headingText(h.line) }));
  // E3: the closing heading is written only when the ledger holds a kept section (the seat
  // clarification in build brief 1 §2), so T5's unterminated ledger with no kept section still
  // lifts with its last row last and unterminated. When one DOES exist, the default would place
  // it right after the ledger's last line; if that line is an unterminated row, the tail text
  // would glue onto it with no line break, corrupting that row rather than placing anything
  // "after" it in the mapping sense — refuse up front, naming the fix, before building any
  // output (R-1163, R-1167; a kept section may sit anywhere in the file, not only at its end).
  if (tailKeep.length) {
    const rawTail = segments(text);
    const lastId = rawTail.length ? requirementRowId(bareLines.at(-1) ?? "") : null;
    if (lastId && !/\n$/.test(rawTail.at(-1))) {
      const lastLineNo = rawTail.length;
      problems.push(`line ${lastLineNo}: the ledger ends with an unterminated row ${lastId}; the default lift would place "${tailKeep[0].heading}" after it (end the file with a line break first)`);
      return { mapping: null, problems };
    }
  }
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
/**
 * Validates the SHAPE of every field apply()/validateMapping() will index into, before either
 * runs — a mapping whose `rows` is a string or whose `tree` is an object must refuse with a
 * named reason, never crash (R-1167, E1: "never a crash").
 */
function shapeProblems(mapping) {
  const problems = [];
  const checkFrom = (from, where) => {
    if (from === undefined) return;
    if (!Array.isArray(from)) { problems.push(`${where}: "from" must be an array`); return; }
    for (const f of from) if (!isPlainObject(f) || typeof f.line !== "number" || typeof f.heading !== "string") problems.push(`${where}: "from" holds an entry that is not {line, heading}`);
  };
  // E1 ("never a crash"): a row entry's own shape must be checked here too, before
  // expandRowIds() ever runs on it elsewhere — a bare range with no end ID ("R-001–") or a
  // reversed/cross-prefix range ("R-010–R-001") throws inside expandRowIds with no catch
  // anywhere on the way there (apply, validateMapping's row loop, the plan's subtree count).
  const ROW_OR_RANGE = /^([RG]-(?:[0-9]{3}|[1-9][0-9]{3}))(–([RG]-(?:[0-9]{3}|[1-9][0-9]{3})))?$/;
  const checkRows = (rows, where) => {
    if (rows === undefined) return;
    if (!Array.isArray(rows)) { problems.push(`${where}: "rows" must be an array of row IDs`); return; }
    for (const r of rows) {
      if (typeof r !== "string") { problems.push(`${where}: "rows" holds a non-string entry`); continue; }
      const m = ROW_OR_RANGE.exec(r);
      if (!m) { problems.push(`${where}: "${r}" is not a requirement ID or a valid en-dash range`); continue; }
      if (m[3] && m[1].slice(0, 1) !== m[3].slice(0, 1)) problems.push(`${where}: "${r}" is a cross-prefix range`);
      else if (m[3] && Number(m[3].slice(2)) < Number(m[1].slice(2))) problems.push(`${where}: "${r}" is a reversed range`);
    }
  };
  const checkAlsoApplies = (value, where) => {
    if (value === undefined) return;
    if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) problems.push(`${where}: "also_applies" must be an array of strings`);
  };
  const checkShareList = (value, where, label) => {
    if (value === undefined) return;
    if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) problems.push(`${where}: "${label}" must be an array of strings`);
  };
  if (mapping.head !== undefined && !isPlainObject(mapping.head)) problems.push('mapping: "head" must be an object');
  if (isPlainObject(mapping.head) && mapping.head.through !== undefined && typeof mapping.head.through !== "number") problems.push('mapping: "head.through" must be a number');
  if (mapping.tree !== undefined && !Array.isArray(mapping.tree)) { problems.push('mapping: "tree" must be an array'); return problems; }
  for (const cap of mapping.tree ?? []) {
    if (!isPlainObject(cap) || typeof cap.id !== "string") { problems.push('mapping: "tree" holds a capability that is not an object with a string "id"'); continue; }
    checkFrom(cap.from, cap.id);
    if (cap.features !== undefined && !Array.isArray(cap.features)) { problems.push(`${cap.id}: "features" must be an array`); continue; }
    for (const feat of cap.features ?? []) {
      if (!isPlainObject(feat) || typeof feat.id !== "string") { problems.push(`${cap.id}: a feature is not an object with a string "id"`); continue; }
      checkFrom(feat.from, feat.id);
      checkRows(feat.rows, feat.id);
      checkAlsoApplies(feat.also_applies, feat.id);
      checkShareList(feat.shares_added, feat.id, "shares_added");
      checkShareList(feat.shares_dropped, feat.id, "shares_dropped");
      if (feat.subgroups !== undefined && !Array.isArray(feat.subgroups)) { problems.push(`${feat.id}: "subgroups" must be an array`); continue; }
      for (const sub of feat.subgroups ?? []) {
        if (!isPlainObject(sub) || typeof sub.id !== "string") { problems.push(`${feat.id}: a subgroup is not an object with a string "id"`); continue; }
        checkFrom(sub.from, sub.id);
        checkRows(sub.rows, sub.id);
      }
    }
  }
  if (mapping.tail !== undefined && !isPlainObject(mapping.tail)) { problems.push('mapping: "tail" must be an object'); return problems; }
  if (isPlainObject(mapping.tail)) {
    checkFrom(mapping.tail.from, "tail");
    if (mapping.tail.keep !== undefined && !Array.isArray(mapping.tail.keep)) problems.push('mapping: "tail.keep" must be an array');
    else for (const k of mapping.tail.keep ?? []) if (!isPlainObject(k) || typeof k.line !== "number" || typeof k.heading !== "string") problems.push('mapping: "tail.keep" holds an entry that is not {line, heading}');
  }
  return problems;
}
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
  const shape = shapeProblems(parsed);
  if (shape.length) return { problems: shape.map((p) => `${path}: ${p}`) };
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

  // §3.2, R-1167 mapping clause: also_applies/shares_added/shares_dropped against the shares
  // each feature's own old heading(s) carry in the INPUT, never from the output or from
  // also_applies itself (R-1182 keeps the proof's recount independent; this is the validator's
  // own, separate, upfront check so a bad declaration is refused before any write is attempted).
  problems.push(...shareProblems(mapping, shareInfoOf(parseLedger(text), segments(text)), realRowIds));

  // head.through must end just before the EARLIEST named old heading (§3.2): a smaller value
  // silently drops real input lines that belong to no node and no tail entry — nothing else
  // here ever looks at them, since they are neither a row nor a named heading.
  {
    let earliest = Infinity;
    for (const { node } of nodes) for (const f of node.from ?? []) if (f.line < earliest) earliest = f.line;
    for (const f of mapping.tail?.from ?? []) if (f.line < earliest) earliest = f.line;
    for (const k of mapping.tail?.keep ?? []) if (k.line < earliest) earliest = k.line;
    const headThrough = mapping.head?.through ?? 0;
    if (earliest !== Infinity && headThrough !== earliest - 1) problems.push(`head.through (${headThrough}) must end just before the earliest named old heading (line ${earliest})`);
  }
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
      // Checks the LAST EMITTED LINE OVERALL, not just the last feature or subgroup: `nodes`
      // (flattenNodes) pushes a capability, then its features and their subgroups, immediately
      // after it, so a capability is last in this flattened list only when it has no features at
      // all -- exactly the case a rowless trailing capability (or feature) placed after the
      // leaf holding the unterminated row would otherwise slip past a level>1-only filter: it
      // emits its own heading line, glued onto that unterminated row with no line break.
      const lastNodeOverall = nodes.at(-1);
      const hasTail = Boolean(mapping.tail?.keep?.length || mapping.tail?.from?.length);
      const nothingAfter = !hasTail && lastNodeOverall && lastNodeOverall.level > 1 && expandRowIds((lastNodeOverall.node.rows ?? []).join(",")).at(-1) === lastId;
      if (!nothingAfter) problems.push(`line ${lastLineNo}: the ledger ends with an unterminated row ${lastId}; a mapping may place nothing after it (end the file with a line break first)`);
    }
  }
  return problems;
}
/**
 * R-1167's mapping clause (§3.2): every feature's `also_applies`, `shares_added` and
 * `shares_dropped` against the shares its own old feature heading(s) carry in the input, never
 * against the output or against `also_applies` itself. A sharing old heading named by a
 * capability's or the tail's own `from` -- never a feature's or a subgroup's -- is refused too:
 * named there, its share line would vanish (no feature destination regenerates or copies it).
 */
function shareProblems(mapping, shareInfo, realRowIds) {
  const problems = [];
  const checkRepeat = (arr, label, id) => { const seen = new Set(); for (const r of arr ?? []) { if (seen.has(r)) problems.push(`${id}: ${label} lists ${r} more than once`); seen.add(r); } };
  for (const cap of mapping.tree ?? []) {
    for (const f of cap.from ?? []) {
      const oldId = oldFeatIdOf(f);
      if (oldId && shareInfo.has(oldId)) problems.push(`${cap.id}: names old feature heading (line ${shareInfo.get(oldId).headingLine}) that carries shares, which must be named by a feature, not a capability`);
    }
    for (const feat of cap.features ?? []) {
      const carried = carriedSharesOf(feat, shareInfo);
      const also = Array.isArray(feat.also_applies) ? feat.also_applies : [];
      const dropped = Array.isArray(feat.shares_dropped) ? feat.shares_dropped : [];
      const added = Array.isArray(feat.shares_added) ? feat.shares_added : [];
      checkRepeat(also, "also_applies", feat.id);
      checkRepeat(dropped, "shares_dropped", feat.id);
      checkRepeat(added, "shares_added", feat.id);
      for (const d of dropped) if (!carried.includes(d)) problems.push(`${feat.id}: shares_dropped names ${d}, which it does not carry`);
      for (const a of added) {
        if (carried.includes(a)) problems.push(`${feat.id}: shares_added names ${a}, which it already carries`);
        else if (!realRowIds.has(a)) problems.push(`${feat.id}: shares_added names ${a}, which is not a requirement row`);
      }
      const want = new Set(wantedSharesOf(feat, shareInfo));
      const alsoSet = new Set(also);
      for (const id of want) if (!alsoSet.has(id)) problems.push(`${feat.id}: share ${id} is missing from also_applies; declare it in shares_dropped`);
      for (const id of alsoSet) if (!want.has(id)) problems.push(`${feat.id}: also_applies holds ${id}, which is not carried; declare it in shares_added`);
    }
  }
  for (const f of mapping.tail?.from ?? []) {
    const oldId = oldFeatIdOf(f);
    if (oldId && shareInfo.has(oldId)) problems.push(`tail: names old feature heading (line ${shareInfo.get(oldId).headingLine}) that carries shares, which must be named by a feature, not the tail`);
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
/**
 * Old heading -> new node id, once per pair, for every row whose declared home differs from
 * the node that carries its old section (research-code.md §4: "the apply step derives and
 * prints the rows whose new home is not the node that carries their old section"). ALSO one
 * line per MERGE: a `from` entry whose own heading text still carries another node's tree id
 * (that old node is gone from the tree; its whole heading was folded into this one) — the row
 * loop alone prints nothing for a merge whose moved rows' new home already equals the node
 * scanning them, so the owner's plan would otherwise hide it entirely (R-1162, E2).
 */
function detectMoves(text, mapping) {
  const bareLines = segments(text).map(bare);
  const fenced = fenceMask(bareLines);
  const allHeadings = scanHeadings(bareLines, fenced);
  const allHeadingLines = allHeadings.map((h) => h.line);
  const treeIdAt = new Map(allHeadings.filter((h) => h.id).map((h) => [h.line, h.id]));
  const nodes = flattenNodes(mapping);
  const rowHome = new Map();
  for (const { id, node } of nodes) for (const r of expandRowIds((node.rows ?? []).join(","))) rowHome.set(r, id);
  const moves = [];
  const seen = new Set();
  for (const { id, node } of nodes) {
    for (const f of node.from ?? []) {
      const oldId = treeIdAt.get(f.line);
      if (oldId && oldId !== id) { const key = `merge:${f.heading}->${id}`; if (!seen.has(key)) { seen.add(key); moves.push([f.heading, id]); } }
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
    // Only the OLD heading's own field-line block (exactly as the tree parser defines it, and
    // only when that old heading is itself tree-form) is regenerated fresh and never carried; a
    // field-labelled line anywhere else is ordinary prose, kept (build brief 4 §A, MUST 1(b)).
    // `baseRefusals` already refuses any such stray line up front, so this guard is defence in
    // depth for a caller that reaches `applyMapping` without it (e.g. a direct test probe).
    const treeId = TREE_HEADING.exec(f.heading)?.[2] ?? null;
    const fieldBlock = fieldBlockAt(bareLines, allHeadingLines, f.line, treeId);
    const isOldFieldLine = (i) => fieldBlock.has(i);
    if (mode === "prose") {
      for (let i = start; i < end; i++) {
        if (fenced[i]) { out.push(segs[i]); continue; }
        if (requirementRowId(bareLines[i])) continue;
        if (isOldFieldLine(i)) continue; // the old heading's own field line (already tree-form): regenerated fresh, never carried
        if (/^Also applies:/.test(bareLines[i])) continue; // §3.1: the feature's share line, emitted separately, never as body prose
        if (isTableHeaderAt(bareLines, i)) { i++; continue; }
        out.push(segs[i]);
      }
    } else {
      let i = start;
      let inTable = false;
      while (i < end) {
        if (fenced[i]) { out.push(segs[i]); i++; continue; }
        if (isOldFieldLine(i)) { i++; continue; }
        if (/^Also applies:/.test(bareLines[i])) { i++; continue; } // §3.1: emitted separately, never as body content
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
  const shareInfo = shareInfoOf(parseLedger(text), segs);
  /** R-1181 §3.3: a kept feature (exactly one source share line, no declared change) gets that
   * line's raw bytes, verbatim, moved right after Status; any other feature gets the line
   * generated from its wanted shares with the input's own line ending, or no line at all. */
  const shareLineFor = (feat) => {
    const sources = shareSourcesOf(feat, shareInfo);
    const changes = (feat.shares_added?.length ?? 0) > 0 || (feat.shares_dropped?.length ?? 0) > 0;
    if (sources.length === 1 && !changes) return sources[0].seg;
    const want = wantedSharesOf(feat, shareInfo);
    return want.length ? `Also applies: ${want.join(", ")}${eol}` : null;
  };

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
      out.push(...fieldLines([["Purpose", featText.purpose], ["Status", featText.status]], eol));
      const shareLine = shareLineFor(feat);
      if (shareLine !== null) out.push(shareLine);
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

// ---------------------------------------------------------------------- the atomic write step (R-1164)

/**
 * Re-reads the ledger immediately before replacing it, refusing when it no longer equals the
 * bytes the proof ran against (`provedBuf`), then writes through a temp file beside it and
 * renames that over the ledger; a failed rename removes the temp file and refuses, naming the
 * reason. File functions are injected (defaulting to the real `node:fs` ones) so a test can
 * exercise the re-read-to-rename window directly, without racing a second process against this
 * one (CHANGE.md §3.6; T12).
 */
export function writeLedgerAtomic(ledgerPath, provedBuf, output, fns = { readFileSync, writeFileSync, renameSync, rmSync }) {
  const reread = fns.readFileSync(ledgerPath);
  if (!reread.equals(provedBuf)) return { ok: false, reason: `${ledgerPath} changed since the proof` };
  const tmp = `${ledgerPath}.lift-${process.pid}.tmp`;
  try {
    fns.writeFileSync(tmp, output);
    fns.renameSync(tmp, ledgerPath);
  } catch (e) {
    try { fns.rmSync(tmp, { force: true }); } catch {}
    return { ok: false, reason: `could not replace the ledger (${e.message})` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------- git gate (R-1164)

function git(cwd, args) { return spawnSync("git", args, { cwd, encoding: "utf8" }); }
/** Like `git`, but the blob's RAW bytes (a Buffer, not auto-decoded text) -- needed to run the
 * same NUL/encoding checks `--write` runs on a file read from disk (build brief 4 §B): decoding
 * through spawnSync's own "utf8" option would silently replace an invalid byte with U+FFFD
 * before any check ever saw it. */
function gitBuf(cwd, args) { return spawnSync("git", args, { cwd, maxBuffer: 64 * 1024 * 1024 }); }
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
/**
 * Every non-bare worktree of the repository holding `rootDir`, each checked clean for its own
 * copy of every `{ relPath, label, buf }` entry -- the ledger AND, when one is supplied, the
 * `--mapping` file (`buf` is this run's own, already-proved bytes for that path). `git diff
 * --quiet HEAD` compares a worktree's working tree to ITS OWN HEAD, correctly normalising for
 * that worktree's own `core.autocrlf` (a clean CRLF checkout must not be flagged, CHANGE.md §3.6)
 * and correctly reading a worktree's own clean, divergent, committed history as clean (another
 * lane that has deliberately committed its own different REQUIREMENTS.md is not "dirty"). But
 * `diff --quiet HEAD` reports a path clean whenever it is UNTRACKED there too, since an untracked
 * file never enters the comparison at all -- so a worktree branched before the path ever existed
 * can hold a real, differing owner copy on disk and still read as clean (build brief 8; sol r2
 * MUST: the grouping-file worktree scan skips a path another worktree's HEAD does not track).
 * When `diff --quiet` says clean, check whether the path is actually IN THAT WORKTREE'S INDEX
 * (`ls-files --error-unmatch`): if so, diff already proved it clean (autocrlf included) and
 * nothing more is needed; if not, and a file still sits on disk there, there is no committed
 * baseline in that worktree to judge it against, so it is compared directly to this run's own
 * proved bytes -- clean only if byte-identical.
 */
function worktreeScan(rootDir, entries) {
  const list = git(rootDir, ["worktree", "list", "--porcelain"]);
  if (list.status !== 0) return { ok: false, reason: "git worktree list failed" };
  const dirs = list.stdout.split("\n").filter((l) => l.startsWith("worktree ")).map((l) => canonical(l.slice("worktree ".length).trim()));
  for (const dir of dirs) {
    const prefix = git(dir, ["rev-parse", "--show-prefix"]).stdout.trim();
    for (const { relPath, label, buf } of entries) {
      const diskRel = join(prefix, relPath);
      const candidate = diskRel.split(sep).join("/");
      const diff = git(dir, ["diff", "--quiet", "HEAD", "--", candidate]);
      if (diff.status !== 0) {
        const tracked = git(dir, ["cat-file", "-e", `HEAD:${candidate}`]);
        if (tracked.status === 0) return { ok: false, reason: `an uncommitted change to ${label} sits in worktree ${dir}` };
        continue; // HEAD does not track this path in that worktree (e.g. a different subfolder) — not this file
      }
      let onDisk;
      try { onDisk = readFileSync(join(dir, diskRel)); } catch { onDisk = null; }
      if (onDisk === null) continue; // nothing sits at this path there either -- clean
      const indexed = git(dir, ["ls-files", "--error-unmatch", "--", candidate]);
      if (indexed.status === 0) continue; // tracked there, and diff already proved it clean
      if (!onDisk.equals(buf)) return { ok: false, reason: `an uncommitted change to ${label} sits in worktree ${dir}` };
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------- CLI

// fs.realpathSync's cached JS fallback neither expands a Windows 8.3 short name (RUNNER~1) to its
// long form nor corrects a path's case on a case-insensitive filesystem, while git always reports
// its own fully expanded, correctly cased form; relating an uncorrected path to git's with
// path.relative() then climbs out of the repository (CI run 38738434830). realpathSync.native asks
// the OS directly and matches git on both counts; elsewhere the cached realpathSync is equivalent.
const REALPATH = process.platform === "win32" ? realpathSync.native : realpathSync;
/** Best-effort canonical form of an existing path; the original path when it cannot be resolved. */
function canonical(p) { try { return REALPATH(p); } catch { return p; } }

function usage() {
  console.error("Usage: requirements-lift.mjs --root <dir> [--mapping <file> | --emit-mapping <file>] [--write | --verify <rev>]");
  return 2;
}
function repoRootFor(dir) {
  const r = git(dir, ["rev-parse", "--show-toplevel"]);
  return r.status === 0 ? canonical(r.stdout.trim()) : null;
}

/**
 * `fns` (defaulting to the real node:fs functions) reaches only the final `writeLedgerAtomic`
 * call below, so a test can exercise the re-read-to-rename race THROUGH this function's own
 * code path -- argument parsing, the ledger read, the proof, the git gate -- and not only
 * against the bare helper directly (build brief 4 §C; the seat's "W3 main bypasses
 * writeLedgerAtomic" and "W4 main proves against a fresh re-read" mutations).
 */
export function main(argv = process.argv.slice(2), fns = { readFileSync, writeFileSync, renameSync, rmSync }) {
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
  // A terminal "--verify" with nothing after it leaves args.verify undefined (build brief 7
  // item 4; sol r1 SHOULD): a usage error, like any other missing operand, never a crash on
  // undefined.startsWith().
  if (args.verify !== null && (args.verify === undefined || args.verify.startsWith("-"))) return usage();
  const modeCount = [args.write, args.verify !== null].filter(Boolean).length;
  if (modeCount > 1) return usage();
  if (args.emitMapping && (args.mapping || args.write || args.verify !== null)) return usage();

  let rootDir = canonical(resolve(process.cwd(), args.root));
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

  let mapping, fromDefault = false, mappingPath = null;
  if (args.mapping) {
    if (base.length) { for (const p of capProblems(base)) console.error(p); return 1; }
    mappingPath = resolve(rootDir, args.mapping);
    const realRoot = rootDir; // already canonical
    const realMap = canonical(mappingPath);
    if (!realMap.startsWith(realRoot + sep) && realMap !== realRoot) { console.error(`${mappingPath}: lies outside --root`); return 1; }
    mappingPath = realMap;
    const read = readMapping(mappingPath, rootDir, text);
    if (read.problems.length) { for (const p of capProblems(read.problems)) console.error(p); return 1; }
    mapping = read.mapping;
  } else {
    // Build brief 5 item 3: every base-refusal stage runs before any is reported, so a ledger
    // with both an ordinary structural problem and a near-tree shape names both in one run,
    // instead of stopping at whichever is found first (a stray base problem no longer hides the
    // tree-heading-count refusal below, and vice versa).
    const stageProblems = [...base];
    const ct = checkTree(text);
    if (ct.problems.length === 0) {
      mapping = buildIdentityMapping(text);
    } else if (isFlatLedger(text)) {
      const built = buildDefaultMapping(text, seed);
      if (built.problems.length) stageProblems.push(...built.problems);
      else { mapping = built.mapping; fromDefault = true; }
    } else {
      // R-1167, T23: name the tree (or near-tree) heading(s) found, not just the tree
      // checker's generic first problem — a hand-built partial tree (real CAP/FEAT/SUB
      // headings) and a near-miss heading both need --mapping, for different reasons.
      const treeHeadingCount = ct.parsed.headings.length;
      const detail = treeHeadingCount > 0
        ? `this ledger already holds ${treeHeadingCount} capability, feature or subgroup heading(s) and is not a passing tree (${ct.problems[0] ?? "see the tree checker"})`
        : (ct.problems[0] ?? "see the tree checker");
      stageProblems.push(`${ledgerPath}: this ledger is neither flat nor a passing tree; supply --mapping (${detail})`);
    }
    if (stageProblems.length) { for (const p of capProblems(stageProblems)) console.error(p); return 1; }
  }
  // Build brief 4 §A, MUST 1(a)/(c): validateMapping runs on a mapping this process built
  // itself (the identity or default mapping), not only on one supplied with --mapping -- an
  // owner's "## Notes" section the identity mapping never named, or a kept section the default
  // builder's own bug left out of tail.keep, is exactly the "old heading is not named by the
  // mapping" check below, already written for the supplied-mapping path.
  const vprobs = validateMapping(mapping, text, seed);
  if (vprobs.length) { for (const p of capProblems(vprobs)) console.error(p); return 1; }

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
  // R-1183: one line per share a feature's shares_added or shares_dropped declares, mapping order.
  for (const { id, node, level } of flattenNodes(mapping)) {
    if (level !== 2) continue;
    for (const r of node.shares_added ?? []) console.log(`${id}: share ${r} added`);
    for (const r of node.shares_dropped ?? []) console.log(`${id}: share ${r} dropped`);
  }
  if (proof.problems.length) { for (const p of capProblems(proof.problems)) console.error(p); return 1; }
  console.log(proof.summary);

  if (!args.write) return 0;

  const repoRoot = repoRootFor(rootDir);
  if (!repoRoot) { console.error(`${rootDir}: git is not on PATH, or this is not a git repository`); return 1; }
  const relLedger = relative(repoRoot, canonical(ledgerPath)).split(sep).join("/");
  const clean = gitClean(repoRoot, relLedger);
  if (!clean.ok) { console.error(`--write refused: ${clean.reason}`); return 1; }
  const wtEntries = [{ relPath: relLedger, label: "the ledger", buf }];
  if (mappingPath) {
    const relMap = relative(repoRoot, canonical(mappingPath)).split(sep).join("/");
    const mapClean = gitClean(repoRoot, relMap);
    if (!mapClean.ok) { console.error(`--write refused: mapping ${mapClean.reason}`); return 1; }
    wtEntries.push({ relPath: relMap, label: "the grouping file", buf: readFileSync(mappingPath) });
  }
  const wtScan = worktreeScan(repoRoot, wtEntries);
  if (!wtScan.ok) { console.error(`--write refused: ${wtScan.reason}`); return 1; }

  const written = writeLedgerAtomic(ledgerPath, buf, output, fns);
  if (!written.ok) { console.error(`--write refused: ${written.reason}`); return 1; }
  return 0;
}

/**
 * R-1168, MUST 2: --verify must be the reviewer's full deterministic check, not just a byte
 * compare of the applied output against HEAD. It runs the SAME mapping validation, pin check
 * and proof `--write` runs (with `fromDefault` when no `--mapping` is given) before ever
 * comparing bytes, and refuses naming the first (capped) list of problems — so a mapping
 * missing a row, or any other defect the proof or validator would catch, cannot pass just
 * because the applied bytes happen to equal HEAD's.
 */
function runVerify(rootDir, args, seed) {
  const repoRoot = repoRootFor(rootDir);
  if (!repoRoot) { console.error(`${rootDir}: git is not on PATH, or this is not a git repository`); return 1; }
  const relLedger = relative(repoRoot, canonical(resolve(rootDir, "REQUIREMENTS.md"))).split(sep).join("/");
  const headClean = gitClean(repoRoot, relLedger);
  if (!headClean.ok) { console.error(`--verify refused: ${relLedger} ${headClean.reason}`); return 1; }
  let mapping = null, fromDefault = false, relMap = null;
  if (args.mapping) {
    const mappingPath = canonical(resolve(rootDir, args.mapping));
    relMap = relative(repoRoot, mappingPath).split(sep).join("/");
    const mapClean = gitClean(repoRoot, relMap);
    if (!mapClean.ok) { console.error(`--verify refused: ${relMap} ${mapClean.reason}`); return 1; }
    const blob = gitBuf(repoRoot, ["show", `HEAD:./${relMap}`]);
    if (blob.status !== 0) { console.error(`--verify refused: could not read HEAD:./${relMap}`); return 1; }
    const buf = blob.stdout;
    // Every refusal readMapping() runs on a mapping file read from disk, run here on the SAME
    // bytes read from the blob instead (build brief 4 §B): a NUL byte, an encoding mismatch,
    // another lift version, and a U+FFFD or line break inside any string -- --write and
    // --verify must not disagree on the same input.
    if (buf.includes(0)) { console.error(`--verify refused: HEAD:./${relMap}: NUL byte; likely UTF-16 from Windows PowerShell 5.1; save it as UTF-8`); return 1; }
    const mapEncLine = firstEncodingMismatchLine(buf);
    if (mapEncLine !== null) { console.error(`--verify refused: HEAD:./${relMap}:${mapEncLine}: bytes are not valid UTF-8 (an ANSI or other single-byte encoding)`); return 1; }
    let raw = buf.toString("utf8");
    if (raw.startsWith(BOM)) raw = raw.slice(1);
    try { mapping = JSON.parse(raw); } catch (e) { console.error(`--verify refused: HEAD:./${relMap} is not valid JSON (${e.message})`); return 1; }
    if (!isPlainObject(mapping)) { console.error(`--verify refused: HEAD:./${relMap}: the top level must be an object`); return 1; }
    if (mapping.lift !== MAPPING_FORMAT) { console.error(`--verify refused: HEAD:./${relMap}: mapping is lift version ${JSON.stringify(mapping.lift)}, not ${MAPPING_FORMAT}`); return 1; }
    for (const s of stringsOf(mapping)) {
      if (/�/.test(s)) { console.error(`--verify refused: HEAD:./${relMap}: a string holds U+FFFD (invalid text)`); return 1; }
      if (/[\r\n]/.test(s)) { console.error(`--verify refused: HEAD:./${relMap}: a string holds a line break`); return 1; }
    }
    const shape = shapeProblems(mapping);
    if (shape.length) { for (const p of capProblems(shape)) console.error(`--verify refused: HEAD:./${relMap}: ${p}`); return 1; }
  }
  const inputBlob = gitBuf(repoRoot, ["show", `${args.verify}:./${relLedger}`]);
  if (inputBlob.status !== 0) { console.error(`--verify refused: could not read ${args.verify}:./${relLedger}`); return 1; }
  // Build brief 7 item 1 (sol r1 MUST 1): read HEAD with the SAME buffer reader as the base
  // revision, never spawnSync's own "utf8" option -- that lossy decode silently turns an
  // invalid byte into U+FFFD before any check or comparison ever saw it, so a hand-tampered
  // HEAD byte that happens to decode like the base's own (valid) U+FFFD passed as if the bytes
  // matched (R-1168).
  const expectedBlob = gitBuf(repoRoot, ["show", `HEAD:./${relLedger}`]);
  if (expectedBlob.status !== 0) { console.error(`--verify refused: could not read HEAD:./${relLedger}`); return 1; }
  const inputBuf = inputBlob.stdout;
  const inputText = inputBuf.toString("utf8");
  // Every base-ledger refusal --write runs on bytes read from disk, run here on the SAME blob
  // bytes (build brief 4 §B): NUL, no rows, an encoding mismatch, a fenced row, a repeated row
  // ID, an unsupported heading, and a field-labelled line outside its heading's own field block
  // (and, by build brief 7 item 3, any "Also applies:" line anywhere -- shares are refused in
  // every ledger form, never silently dropped). Build brief 7 item 1 runs the SAME checks on
  // the committed HEAD blob too, not only on the revision being verified: a byte-invalid or
  // share-carrying HEAD must be named and refused, not merely compared.
  const inputParsed = parseLedger(inputText);
  const inputReadProblem = ledgerReadProblem(inputText, inputParsed);
  if (inputReadProblem) { console.error(`--verify refused: ${args.verify}:./${relLedger}: ${inputReadProblem}`); return 1; }
  const inputBase = baseRefusals(inputBuf, inputText, inputParsed);
  if (inputBase.length) { for (const p of capProblems(inputBase)) console.error(`--verify refused: ${args.verify}:./${relLedger}: ${p}`); return 1; }
  const expectedText = expectedBlob.stdout.toString("utf8");
  const expectedParsed = parseLedger(expectedText);
  const expectedReadProblem = ledgerReadProblem(expectedText, expectedParsed);
  if (expectedReadProblem) { console.error(`--verify refused: HEAD:./${relLedger}: ${expectedReadProblem}`); return 1; }
  const expectedBase = baseRefusals(expectedBlob.stdout, expectedText, expectedParsed);
  if (expectedBase.length) { for (const p of capProblems(expectedBase)) console.error(`--verify refused: HEAD:./${relLedger}: ${p}`); return 1; }

  if (mapping) {
    // the pin check --write also runs (via readMapping) for a supplied mapping: it must be
    // THIS ledger's own mapping, not merely valid JSON that happens to apply without error.
    const wantPin = pinOf(inputText);
    if (mapping.pin?.sha256 !== wantPin.sha256) { console.error(`--verify refused: HEAD:./${relMap} pin does not match ${args.verify}:./${relLedger} (re-emit or re-propose the mapping)`); return 1; }
  } else {
    const ct = checkTree(inputText);
    if (ct.problems.length === 0) {
      mapping = buildIdentityMapping(inputText);
    } else if (isFlatLedger(inputText)) {
      const built = buildDefaultMapping(inputText, seed);
      if (built.problems.length) { for (const p of capProblems(built.problems)) console.error(`--verify refused: ${p}`); return 1; }
      mapping = built.mapping; fromDefault = true;
    } else {
      console.error(`--verify refused: ${args.verify}:./${relLedger} is neither flat nor a passing tree; supply --mapping`);
      return 1;
    }
  }

  const vprobs = validateMapping(mapping, inputText, seed);
  if (vprobs.length) { for (const p of capProblems(vprobs)) console.error(`--verify refused: ${p}`); return 1; }

  const output = applyMapping(inputText, mapping, seed);
  const proof = proveLift(inputText, mapping, output, seed.text, { fromDefault });
  if (proof.problems.length) { for (const p of capProblems(proof.problems)) console.error(`--verify refused: ${p}`); return 1; }

  // Compare the applied output's own bytes against HEAD's, not decoded text (sol r1 MUST 1):
  // the two sides have already each been proved valid UTF-8 above, so this is the general,
  // principled check -- not reliant on the encoding-mismatch refusal catching every case.
  if (!Buffer.from(output, "utf8").equals(expectedBlob.stdout)) {
    const a = output.split("\n"), b = expectedText.split("\n");
    const i = a.findIndex((line, n) => line !== b[n]);
    console.error(`--verify refused: line ${i + 1} differs from HEAD`);
    return 1;
  }
  console.log(`--verify ${args.verify}: matches HEAD (${proof.summary})`);
  return 0;
}

// realpath, not resolve: a run through a symlink to this script must still execute main()
// (R-1162, §3.6; tree CHANGE.md:229 names the resolve form's silent-exit bug through a link).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exit(main());
