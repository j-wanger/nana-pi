#!/usr/bin/env node
/**
 * @module scripts/requirements-lift-proof.mjs
 * @purpose Prove that a lifted ledger keeps every row and line of its input where a mapping places them.
 * @inputs the input ledger text, a mapping object, the output ledger text, the general-engineering seed text, and { fromDefault }
 * @outputs { problems, summary } from proveLift
 * @effects none
 * @errors never throws for a malformed lift output; a problem list names every mismatch found
 */
// Independent of scripts/requirements-lift.mjs: it imports nothing from that module and
// parses the shared seed itself (R-1163, T7), so an apply bug and a placement bug cannot
// both pass the same check (research-code.md §6; factcheck-repo.md W4).
import { checkTree, parseLedger, readRequirementRows, expandRowIds } from "./requirements-tree.mjs";
import { requirementRowId } from "./requirements-trace.mjs";

// -------------------------------------------------------------- raw segments (own copy)

const BOM = "﻿";
const stripBom = (text) => (text.startsWith(BOM) ? text.slice(1) : text);
/** Raw lines with their own terminator, after the BOM — 1:1 with parseLedger's lines for every line but the file's trailing one (research-code.md §3.1). */
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
const TABLE_HEADER_TEXT = "| ID | Requirement | Status | Evidence |";
const DELIM = /^\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*$/;

/** One heading per non-opaque ATX (levels 1–6) or setext line, in file order, fence-aware. */
function scanHeadings(bareLines, fenced) {
  const out = [];
  for (let i = 0; i < bareLines.length; i++) {
    if (fenced[i]) continue;
    const atx = ATX.exec(bareLines[i]);
    if (atx) {
      const level = atx[1].length;
      const rest = (atx[2] ?? "").trim().replace(/\s+#+\s*$/, "");
      const tree = TREE_HEADING.exec(bareLines[i]);
      out.push({ line: i + 1, level, label: rest, id: tree ? tree[2] : null, tree: Boolean(tree) });
      continue;
    }
    if (SETEXT.test(bareLines[i]) && i > 0 && bareLines[i - 1].trim() && !fenced[i - 1] && !ATX.test(bareLines[i - 1]) && !SETEXT.test(bareLines[i - 1]) && !requirementRowId(bareLines[i - 1]) && !out.some((h) => h.line === i)) {
      out.push({ line: i, level: bareLines[i].trimStart()[0] === "=" ? 1 : 2, label: bareLines[i - 1].trim(), id: null, tree: false, setext: true });
    }
  }
  return out;
}
/** A line recognised as a table header, with the following line as its delimiter. */
function isTableHeaderAt(bareLines, i) {
  return bareLines[i] === TABLE_HEADER_TEXT && DELIM.test(bareLines[i + 1] ?? "")
    ? true
    : (() => {
        const cells = bareLines[i]?.includes("|") ? bareLines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()) : null;
        const next = bareLines[i + 1]?.includes("|") ? bareLines[i + 1].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()) : null;
        return Boolean(cells && cells.length === 4 && next && next.length === 4 && next.every((c) => /^:?-+:?$/.test(c)));
      })();
}

// -------------------------------------------------------------- the seed, parsed independently

/** CAP-90/FEAT-900/SUB-900..904 structure from the seed text, parsed by this module alone. */
function seedStructure(seedText) {
  const parsed = parseLedger(seedText);
  const rows = readRequirementRows(parsed);
  const subOf = new Map();
  for (const row of rows) if (row.heading?.id?.startsWith("SUB-")) subOf.set(row.id, row.heading.id);
  const byId = new Map(parsed.headings.map((h) => [h.id, h]));
  return { byId, subOf };
}
const RESERVED = new Set(["CAP-90", "FEAT-900", "SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"]);

// -------------------------------------------------------------- mapping walk helpers

/** Every node in the mapping, flattened in output order, each with its level, parent id and its own data. */
function mappingNodes(mapping) {
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
/** A node's rows, expanded, in its declared order ("rows" may hold en-dash ranges). */
const nodeRows = (node) => expandRowIds((node.rows ?? []).join(","));
/** label/purpose/outcome/status for a node, substituting the seed for a reserved id. */
function nodeText(id, node, seed) {
  if (RESERVED.has(id)) {
    const s = seed.byId.get(id);
    return { label: s?.label ?? "", purpose: s?.purpose ?? "", outcome: s?.outcome ?? "", status: s?.status ?? "" };
  }
  return { label: node.label ?? "", purpose: node.purpose ?? "", outcome: node.outcome ?? "", status: node.status ?? "" };
}

// -------------------------------------------------------------- the default heading sequence, independent of the mapping

/**
 * Re-derives the whole heading sequence a default lift must produce, from the INPUT alone
 * (plan review r1 MUST 1, r2 MUSTs 1–2): a level, a parent by nearest preceding higher-level
 * section, one generated "Not yet sorted" capability before each maximal run of sections with
 * no capability above, and the reserved nodes exactly where the G rows sit. Written fresh, not
 * shared with the lift module's own builder (R-1163; the two must not share placement code).
 */
const KEPT_SECTIONS = ["Open questions", "Deliberate omissions"]; // contract (SKILL.md:126, both seeds); duplicated, not imported (R-1163)
function deriveDefaultSequence(inputText, seed) {
  const bareLines = segments(inputText).map(bare);
  const fenced = fenceMask(bareLines);
  const all = scanHeadings(bareLines, fenced).filter((h) => h.level <= 3);
  const title = all[0]?.level === 1 && all[0].line === 1 ? all[0] : null;
  const keptHeadings = all.filter((h) => h.level === 2 && KEPT_SECTIONS.includes(h.label));
  const sections = all.filter((h) => h !== title && !keptHeadings.includes(h));
  const rowsAt = (fromLine, toLine) => {
    const ids = [];
    for (let i = fromLine; i < toLine - 1; i++) { const id = requirementRowId(bareLines[i]); if (id) ids.push(id); }
    return ids;
  };
  const boundaries = [...sections.map((h) => h.line), bareLines.length + 1];
  const rowsOf = (idx) => rowsAt(sections[idx].line, boundaries[idx + 1]);

  const seq = [];
  let capN = 0, featN = 0, subN = 0, capId = null, featId = null;
  let i = 0;
  // the G-run: a maximal contiguous run of level-2 sections whose own rows are all G-
  const isGSection = (idx) => sections[idx].level === 2 && rowsOf(idx).length > 0 && rowsOf(idx).every((id) => id.startsWith("G-"));
  while (i < sections.length) {
    const h = sections[i];
    if (isGSection(i)) {
      let runEnd = i;
      while (runEnd + 1 < sections.length && isGSection(runEnd + 1)) runEnd++;
      // a bare `#` heading with only prose (no rows) directly before the run takes CAP-90's slot:
      // its own entry (just pushed, level 1) is withdrawn and CAP-90 opens in its place.
      const prev = sections[i - 1];
      if (prev && prev.level === 1 && rowsOf(i - 1).length === 0 && seq.at(-1)?.level === 1 && seq.at(-1)?.__sectionIndex === i - 1) { seq.pop(); capN--; }
      seq.push({ id: "CAP-90", level: 1, parent: null });
      seq.push({ id: "FEAT-900", level: 2, parent: "CAP-90" });
      for (let k = i; k <= runEnd; k++) seq.push({ id: seed.subOf.get(rowsOf(k)[0]) ?? "SUB-900", level: 3, parent: "FEAT-900" });
      capId = "CAP-90"; featId = "FEAT-900";
      i = runEnd + 1;
      continue;
    }
    if (h.level === 1) {
      capN++; const id = `CAP-${String(capN).padStart(2, "0")}`;
      seq.push({ id, level: 1, parent: null, __sectionIndex: i });
      capId = id; featId = null; i++; continue;
    }
    // level 2 or 3 with no product capability above yet
    if (capId === null || capId === "CAP-90") {
      capN++; const synth = `CAP-${String(capN).padStart(2, "0")}`;
      seq.push({ id: synth, level: 1, parent: null });
      capId = synth; featId = null;
    }
    if (h.level === 2) { featN++; const id = `FEAT-${String(featN).padStart(3, "0")}`; seq.push({ id, level: 2, parent: capId }); featId = id; i++; continue; }
    subN++; const id = `SUB-${String(subN).padStart(3, "0")}`; seq.push({ id, level: 3, parent: featId }); i++;
  }
  return seq;
}

// -------------------------------------------------------------- the proof

/**
 * Prove that `outputText` is `inputText` lifted through `mapping`. `fromDefault` (set by the
 * CLI for a run with no --mapping) also derives the whole heading sequence from the input
 * alone and requires the output to equal it (checks 8–9).
 */
export function proveLift(inputText, mapping, outputText, seedText, { fromDefault = false } = {}) {
  const problems = [];
  const seed = seedStructure(seedText ?? "");

  // 1. BOM
  const inBom = inputText.startsWith(BOM), outBom = outputText.startsWith(BOM);
  if (inBom !== outBom) problems.push(`BOM: input ${inBom ? "has" : "has no"} a BOM but output ${outBom ? "has" : "has no"} one`);

  const inSegs = segments(inputText), outSegs = segments(outputText);
  const inBare = inSegs.map(bare), outBare = outSegs.map(bare);
  const inFenced = fenceMask(inBare), outFenced = fenceMask(outBare);

  // 2. the ID multiset, fences included
  const idsIn = inBare.map((l, i) => (inFenced[i] ? requirementRowId(l) : requirementRowId(l))).filter(Boolean);
  const idsOut = outBare.map((l) => requirementRowId(l)).filter(Boolean);
  const sortCopy = (a) => [...a].sort();
  const multisetEq = JSON.stringify(sortCopy(idsIn)) === JSON.stringify(sortCopy(idsOut));
  if (!multisetEq) {
    const inSet = new Map(); for (const id of idsIn) inSet.set(id, (inSet.get(id) ?? 0) + 1);
    const outSet = new Map(); for (const id of idsOut) outSet.set(id, (outSet.get(id) ?? 0) + 1);
    for (const [id, n] of inSet) if ((outSet.get(id) ?? 0) !== n) problems.push(`row ${id} appears ${outSet.get(id) ?? 0} time(s) in the output but ${n} in the input`);
    for (const [id, n] of outSet) if (!inSet.has(id)) problems.push(`row ${id} appears in the output but not in the input`);
  }

  // 3. row bytes, terminator included, with no exception
  const rowSegIn = new Map();
  inSegs.forEach((seg, i) => { if (inFenced[i]) return; const id = requirementRowId(inBare[i]); if (id && !rowSegIn.has(id)) rowSegIn.set(id, seg); });
  const rowSegOut = new Map();
  outSegs.forEach((seg, i) => { if (outFenced[i]) return; const id = requirementRowId(outBare[i]); if (!id) return; if (rowSegOut.has(id)) problems.push(`row ${id} appears more than once in the output`); rowSegOut.set(id, seg); });
  let keptCount = 0;
  for (const [id, seg] of rowSegIn) {
    const o = rowSegOut.get(id);
    if (o === undefined) continue; // already named by check 2
    if (o === seg) keptCount++;
    else problems.push(`row ${id}: output bytes differ from the input (terminator or content)`);
  }

  // 6. homes and order; also feeds check 9's mapping-mode comparison
  const outParsed = parseLedger(outputText);
  const outRows = readRequirementRows(outParsed);
  const nodes = mappingNodes(mapping);
  for (const { id, node } of nodes) {
    const want = nodeRows(node);
    const got = outRows.filter((r) => (r.heading?.id === id)).map((r) => r.id);
    if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${id}: output row order ${JSON.stringify(got)} differs from the mapping's ${JSON.stringify(want)}`);
  }
  const outSeq = outParsed.headings.map((h) => [h.id, h.label, h.purpose, h.parent?.id ?? null]);
  const mapSeq = nodes.map(({ id, level, parent, node }) => { const t = nodeText(id, node, seed); return [id, t.label, t.purpose, parent]; });
  if (!fromDefault && JSON.stringify(outSeq) !== JSON.stringify(mapSeq)) problems.push(`heading sequence differs from the mapping's declared nodes, labels, purposes and parents`);

  // 9 (fromDefault): derive the whole sequence from the input alone and require equality
  if (fromDefault) {
    const derived = deriveDefaultSequence(inputText, seed);
    const derivedSeq = derived.map((d) => { const n = nodes.find((x) => x.id === d.id); const t = n ? nodeText(d.id, n.node, seed) : seed.byId.get(d.id) ? { label: seed.byId.get(d.id).label, purpose: seed.byId.get(d.id).purpose } : { label: "", purpose: "" }; return [d.id, t.label, t.purpose, d.parent]; });
    if (JSON.stringify(outSeq) !== JSON.stringify(derivedSeq)) problems.push(`the output's heading sequence does not equal the sequence derived from the input alone (no capability above a section, the G run, or a section's level and parent differ from the input)`);
    // 8: each leaf's rows and each old section's lines follow input order, read from the input
    for (const { id, node } of nodes) {
      if (!(node.from ?? []).length) continue;
      const fromRows = [];
      for (const f of node.from) {
        const startIdx = f.line;
        let endIdx = inBare.length;
        const headingLines = scanHeadings(inBare, inFenced).map((h) => h.line).filter((l) => l > f.line).sort((a, b) => a - b);
        if (headingLines.length) endIdx = headingLines[0] - 1;
        for (let i = startIdx; i < endIdx; i++) { const id2 = requirementRowId(inBare[i]); if (id2) fromRows.push(id2); }
      }
      const got = outRows.filter((r) => r.heading?.id === id).map((r) => r.id);
      if (JSON.stringify(got) !== JSON.stringify(fromRows)) problems.push(`${id}: row order ${JSON.stringify(got)} does not follow the input's own order for its old section(s)`);
    }
  }

  // reserved-node row-placement rule, both modes
  for (const row of outRows) {
    const homeId = row.heading?.id;
    if (!homeId) continue;
    if (row.id.startsWith("R-") && RESERVED.has(homeId)) problems.push(`${row.id}: an R row sits in reserved node ${homeId}`);
    if (row.id.startsWith("G-")) {
      const wantSub = seed.subOf.get(row.id);
      const actualSub = homeId.startsWith("SUB-") ? homeId : (outParsed.headings.find((h) => h.id === homeId)?.parent?.id ?? null);
      if (wantSub && actualSub !== wantSub) problems.push(`${row.id}: sits in ${actualSub ?? homeId}, not its seed subgroup ${wantSub}`);
    }
  }

  // 7. the tree checker passes
  const ct = checkTree(outputText);
  if (ct.problems.length) problems.push(...ct.problems.map((p) => `tree check: ${p}`));

  // 4–5. every other input line survives once, in order, inside its node's region; every
  // other output line is a declared kind (a heading, a field line, table structure, the
  // closing heading, or a blank separator).
  const headLines = Math.max(0, mapping.head?.through ?? 0);
  if (JSON.stringify(inSegs.slice(0, headLines)) !== JSON.stringify(outSegs.slice(0, headLines))) problems.push(`head: the first ${headLines} line(s) are not carried verbatim`);
  const outHeadingScan = scanHeadings(outBare, outFenced);
  const regionBoundsFor = (line) => {
    const after = outHeadingScan.filter((h) => h.line > line).map((h) => h.line).sort((a, b) => a - b);
    return after.length ? after[0] - 1 : outBare.length;
  };
  const expectedProseFor = (fromEntries) => {
    const out = [];
    for (const f of fromEntries ?? []) {
      const startIdx = f.line; // 0-based index right after the heading line
      const headingLines = scanHeadings(inBare, inFenced).map((h) => h.line).filter((l) => l > f.line).sort((a, b) => a - b);
      const endIdx = headingLines.length ? headingLines[0] - 1 : inBare.length;
      for (let i = startIdx; i < endIdx; i++) {
        if (inFenced[i]) { out.push(inSegs[i]); continue; }
        const id = requirementRowId(inBare[i]);
        if (id) continue; // rows: accounted by check 3
        if (/^(Purpose|Outcome|Status|Also applies):/.test(inBare[i])) continue; // the old heading's own field line, regenerated fresh
        if (isTableHeaderAt(inBare, i)) { i++; continue; } // old header+delimiter pair: structural, replaced
        out.push(inSegs[i]);
      }
    }
    return out;
  };
  /**
   * `expected` must appear in `actual`, in order, byte-exact; `actual` may interleave extra
   * BLANK lines only (the one generated separator a re-laid leaf adds) — any other extra or
   * missing line, blank or not, is a mismatch (checks 4–5).
   */
  const isBlankSeg = (s) => bare(s) === "";
  function proseMatches(expected, actual) {
    let j = 0;
    for (const e of expected) {
      while (j < actual.length && actual[j] !== e && isBlankSeg(actual[j]) && !isBlankSeg(e)) j++;
      if (j >= actual.length || actual[j] !== e) return false;
      j++;
    }
    while (j < actual.length) { if (!isBlankSeg(actual[j])) return false; j++; }
    return true;
  }
  let proseCarried = 0, headingsReplaced = 0;
  for (const { id, node, level } of nodes) {
    const h = outHeadingScan.find((x) => x.id === id);
    if (!h) { problems.push(`${id}: not found in the output`); continue; }
    const regionEnd = regionBoundsFor(h.line);
    const regionBare = outBare.slice(h.line, regionEnd);
    const regionFenced = outFenced.slice(h.line, regionEnd);
    const prose = [];
    for (let i = 0; i < regionBare.length; i++) {
      if (regionFenced[i]) { prose.push(outSegs[h.line + i]); continue; }
      const line = regionBare[i];
      if (requirementRowId(line)) continue;
      if (/^(Purpose|Outcome|Status|Also applies):/.test(line)) continue;
      if (line === TABLE_HEADER_TEXT && DELIM.test(regionBare[i + 1] ?? "")) { i++; continue; }
      prose.push(outSegs[h.line + i]);
    }
    const expected = expectedProseFor(node.from);
    if (!proseMatches(expected, prose)) problems.push(`${id}: prose from its old section(s) is missing, reordered, stray, or duplicated`);
    proseCarried += expected.length;
    headingsReplaced += (node.from ?? []).length;
  }
  // tail
  const tailProse = expectedProseFor(mapping.tail?.from);
  headingsReplaced += (mapping.tail?.from ?? []).length;
  if (mapping.tail?.keep?.length) {
    for (const k of mapping.tail.keep) {
      const headingText = k.heading;
      if (!outBare.includes(headingText)) problems.push(`tail: kept section "${headingText}" is missing from the output`);
    }
  }
  proseCarried += tailProse.length;

  const keptTailLines = (mapping.tail?.keep ?? []).reduce((n, k) => n + (outBare.includes(k.heading) ? 1 : 0), 0);
  const linesInserted = Math.max(0, outSegs.length - (keptCount + proseCarried + headLines + keptTailLines));
  const summary = `lift proof: ${keptCount} rows kept byte-identical; ${proseCarried} prose lines carried; ${headingsReplaced} headings replaced; ${linesInserted} lines inserted; tree check ${ct.problems.length} problems`;
  return { problems, summary, rows: keptCount, prose: proseCarried, headings: headingsReplaced, inserted: linesInserted };
}
