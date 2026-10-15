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
/**
 * A line recognised as a table header, with the following line as its delimiter, only when the
 * next non-blank line after the delimiter is itself a requirement row (build brief 5 item 1): a
 * plain 4-column table that never holds a requirement row is not a requirement-table header, and
 * its lines are ordinary carried prose like any other table a leaf holds. This also stops a
 * fenced table EXAMPLE (one no row ever follows) from being mistaken for one (item 5).
 */
function isTableHeaderAt(bareLines, i) {
  const exact = bareLines[i] === TABLE_HEADER_TEXT && DELIM.test(bareLines[i + 1] ?? "");
  if (!exact) {
    const cells = bareLines[i]?.includes("|") ? bareLines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()) : null;
    const next = bareLines[i + 1]?.includes("|") ? bareLines[i + 1].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()) : null;
    if (!(cells && cells.length === 4 && next && next.length === 4 && next.every((c) => /^:?-+:?$/.test(c)))) return false;
  }
  let j = i + 2;
  while (j < bareLines.length && bareLines[j] === "") j++;
  return Boolean(requirementRowId(bareLines[j] ?? ""));
}
/**
 * The 0-based raw-line indices, within ONE heading's own span, that are its field-line block --
 * exactly as the tree parser defines it (requirements-tree.mjs's `parseLedger`): the first
 * "Purpose:" line, and -- for a CAP- heading -- the first "Outcome:" line, or -- for a FEAT-
 * heading -- the first "Status:" and first "Also applies:" line. A heading with no tree id
 * carries no field block at all. Duplicated from the lift module's own copy (R-1163: the proof
 * shares no code with the writer; build brief 4 §A, MUST 1(b)): only these lines are a replaced
 * heading's own regenerated field lines; a field-labelled line anywhere else is ordinary
 * carried prose and must be accounted for like any other input line.
 */
function fieldBlockAt(bareLines, allHeadingLines, headingLine, id) {
  const set = new Set();
  if (!id) return set;
  const after = allHeadingLines.filter((l) => l > headingLine);
  const end = after.length ? Math.min(...after) - 1 : bareLines.length;
  let purposeFound = false, outcomeFound = false, statusFound = false, alsoFound = false;
  for (let i = headingLine; i < end; i++) {
    const l = bareLines[i];
    if (!purposeFound && /^Purpose:/.test(l)) { set.add(i); purposeFound = true; continue; }
    if (id.startsWith("CAP-") && !outcomeFound && /^Outcome:/.test(l)) { set.add(i); outcomeFound = true; continue; }
    if (id.startsWith("FEAT-") && !statusFound && /^Status:/.test(l)) { set.add(i); statusFound = true; continue; }
    if (id.startsWith("FEAT-") && !alsoFound && /^Also applies:/.test(l)) { set.add(i); alsoFound = true; continue; }
  }
  return set;
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
// Duplicated from the lift module's own tunables (R-1163: the proof shares no code with the
// writer); these three strings are a contract the default builder must match exactly, so the
// proof can tell a genuine label/purpose from a tampered one (MUST 3, plan review r1/r2).
const UNSORTED_PREFIX = "Not yet sorted:";
const UNSORTED_LABEL = "Not yet sorted";
const UNSORTED_TEXT = `${UNSORTED_PREFIX} a synthetic capability for sections the ledger places under no Part.`;

/**
 * Re-derives the whole heading sequence a default lift must produce, from the INPUT alone
 * (plan review r1 MUST 1, r2 MUSTs 1-2; build brief 3 MUST 3): a level, a parent by nearest
 * preceding higher-level section, one generated "Not yet sorted" capability before each maximal
 * run of sections with no capability above, and the reserved nodes exactly where the G rows sit
 * — each entry also carrying the label, purpose and source `from` line(s) the default builder
 * would assign, so the comparison in proveLift never has to borrow those from the mapping it is
 * checking. Written fresh, not shared with the lift module's own builder (R-1163).
 */
function deriveDefaultSequence(inputText, seed) {
  const bareLines = segments(inputText).map(bare);
  const fenced = fenceMask(bareLines);
  const all = scanHeadings(bareLines, fenced).filter((h) => h.level <= 3);
  const title = all[0]?.level === 1 && all[0].line === 1 ? all[0] : null;
  const keptHeadings = all.filter((h) => h.level === 2 && KEPT_SECTIONS.includes(h.label));
  const sections = all.filter((h) => h !== title && !keptHeadings.includes(h));
  const headingText = (line) => bareLines[line - 1];
  const rowsAt = (fromLine, toLine) => {
    const ids = [];
    for (let i = fromLine; i < toLine - 1; i++) { const id = requirementRowId(bareLines[i]); if (id) ids.push(id); }
    return ids;
  };
  const boundaries = [...sections.map((h) => h.line), bareLines.length + 1];
  const rowsOf = (idx) => rowsAt(sections[idx].line, boundaries[idx + 1]);
  const unsortedPurpose = (label) => `${UNSORTED_PREFIX} the rows of old section "${label}".`;
  const unsortedOutcome = (label) => `${UNSORTED_PREFIX} the rows of old section "${label}" sorted into the tree.`;

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
      let absorbedPrev = false;
      if (prev && prev.level === 1 && rowsOf(i - 1).length === 0 && seq.at(-1)?.level === 1 && seq.at(-1)?.__sectionIndex === i - 1) { seq.pop(); capN--; absorbedPrev = true; }
      seq.push({ id: "CAP-90", level: 1, parent: null, from: [] });
      seq.push({ id: "FEAT-900", level: 2, parent: "CAP-90", from: absorbedPrev ? [{ line: prev.line, heading: headingText(prev.line) }] : [] });
      for (let k = i; k <= runEnd; k++) seq.push({ id: seed.subOf.get(rowsOf(k)[0]) ?? "SUB-900", level: 3, parent: "FEAT-900", from: [{ line: sections[k].line, heading: headingText(sections[k].line) }] });
      capId = "CAP-90"; featId = "FEAT-900";
      i = runEnd + 1;
      continue;
    }
    if (h.level === 1) {
      capN++; const id = `CAP-${String(capN).padStart(2, "0")}`;
      seq.push({ id, level: 1, parent: null, __sectionIndex: i, label: h.label, purpose: unsortedPurpose(h.label), outcome: unsortedOutcome(h.label), from: [{ line: h.line, heading: headingText(h.line) }] });
      capId = id; featId = null; i++; continue;
    }
    // level 2 or 3 with no product capability above yet
    if (capId === null || capId === "CAP-90") {
      capN++; const synth = `CAP-${String(capN).padStart(2, "0")}`;
      seq.push({ id: synth, level: 1, parent: null, label: UNSORTED_LABEL, purpose: UNSORTED_TEXT, outcome: UNSORTED_TEXT, from: [] });
      capId = synth; featId = null;
    }
    if (h.level === 2) { featN++; const id = `FEAT-${String(featN).padStart(3, "0")}`; seq.push({ id, level: 2, parent: capId, label: h.label, purpose: unsortedPurpose(h.label), from: [{ line: h.line, heading: headingText(h.line) }] }); featId = id; i++; continue; }
    subN++; const id = `SUB-${String(subN).padStart(3, "0")}`; seq.push({ id, level: 3, parent: featId, label: h.label, purpose: unsortedPurpose(h.label), from: [{ line: h.line, heading: headingText(h.line) }] }); i++;
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
  const nodesForHead = mappingNodes(mapping);

  // 0. head.through must end just before the EARLIEST old heading any node or the tail names
  // (MUST 1: a wrong, under-counted head.through — the basketball-geek repro, head.through: 1
  // when the true boundary is line 4 — silently drops real input lines that belong to no
  // region at all; nothing else below ever looks at those lines, so this check is independent
  // of whatever the writer or a hand-edited mapping claims).
  {
    let earliest = Infinity;
    for (const { node } of nodesForHead) for (const f of node.from ?? []) if (f.line < earliest) earliest = f.line;
    for (const f of mapping.tail?.from ?? []) if (f.line < earliest) earliest = f.line;
    for (const k of mapping.tail?.keep ?? []) if (k.line < earliest) earliest = k.line;
    const headThrough = mapping.head?.through ?? 0;
    if (earliest !== Infinity && headThrough !== earliest - 1) problems.push(`head.through (${headThrough}) does not end just before the earliest named old heading (line ${earliest}); input lines in between would be lost`);
  }

  // 0b. every OLD heading after head.through must be named by the mapping, exactly once (build
  // brief 4 §A, MUST 1(a)): an owner's "## Notes" section the mapping never named must not
  // silently vanish. Independent of validateMapping (which a direct proveLift call, as the
  // test suite's own probes make, never runs) and of whatever region the mapping DID declare:
  // this scans the WHOLE input for every heading of any kind, tree or not.
  {
    const headThrough = mapping.head?.through ?? 0;
    const namedOnce = new Map();
    const nameHeading = (f) => { if (!f) return; namedOnce.set(f.line, (namedOnce.get(f.line) ?? 0) + 1); };
    for (const { node } of nodesForHead) for (const f of node.from ?? []) nameHeading(f);
    for (const f of mapping.tail?.from ?? []) nameHeading(f);
    for (const k of mapping.tail?.keep ?? []) nameHeading(k);
    for (const h of scanHeadings(inBare, inFenced)) {
      if (h.line <= headThrough) continue;
      const n = namedOnce.get(h.line) ?? 0;
      if (n === 0) problems.push(`line ${h.line}: old heading "${inBare[h.line - 1]}" is not named by the mapping`);
      else if (n > 1) problems.push(`line ${h.line}: old heading "${inBare[h.line - 1]}" is named more than once`);
    }
  }

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

  // 3b. structural, independent of the per-row byte comparison above: when the input's own
  // last raw line has no terminator, the output's last raw line must stay unterminated too (a
  // mutation that loosens check 3 to accept a gained ending for THAT one row cannot alone pass
  // this separate structural check).
  if (inSegs.length && outSegs.length && !/\n$/.test(inSegs.at(-1)) && /\n$/.test(outSegs.at(-1))) {
    problems.push(`the input's last line has no line ending, but the output's last line does`);
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
  // Outcome is compared too (build brief 4 §A): meaningful only for a CAP- heading, where it is
  // the capability's own second field line; FEAT-/SUB- entries carry no outcome on either side,
  // so they compare trivially equal.
  const outSeq = outParsed.headings.map((h) => [h.id, h.label, h.purpose, h.id.startsWith("CAP-") ? h.outcome : null, h.parent?.id ?? null]);
  const mapSeq = nodes.map(({ id, level, parent, node }) => { const t = nodeText(id, node, seed); return [id, t.label, t.purpose, id.startsWith("CAP-") ? t.outcome : null, parent]; });
  if (!fromDefault && JSON.stringify(outSeq) !== JSON.stringify(mapSeq)) problems.push(`heading sequence differs from the mapping's declared nodes, labels, purposes, outcomes and parents`);

  // the regions appear in order: head, then the nodes in mapping order, then the tail (build
  // brief 4 §A -- noted as passing undetected today: "the whole tail moved before CAP-01" and a
  // node heading relocated ahead of an earlier one both pass the checks above alone, since
  // neither one compares a region's POSITION against the others).
  {
    const headLinesForOrder = Math.max(0, mapping.head?.through ?? 0);
    const outHeadingScanForOrder = scanHeadings(outBare, outFenced);
    const nodeLines = nodes.map(({ id }) => outHeadingScanForOrder.find((h) => h.id === id)?.line).filter((l) => l !== undefined);
    const increasing = nodeLines.every((l, i) => i === 0 || l > nodeLines[i - 1]);
    const headOk = !nodeLines.length || nodeLines[0] > headLinesForOrder;
    const tailHasContentForOrder = Boolean((mapping.tail?.keep ?? []).length || (mapping.tail?.from ?? []).length);
    let tailOk = true;
    if (tailHasContentForOrder) {
      const closingForOrder = outHeadingScanForOrder.find((h) => bare(outSegs[h.line - 1] ?? "") === mapping.tail.heading);
      if (closingForOrder) tailOk = !nodeLines.length || closingForOrder.line > nodeLines.at(-1);
    }
    if (!increasing || !headOk || !tailOk) problems.push(`the output's regions are out of order: expected head, then the nodes in mapping order, then the tail`);
  }

  // 9 (fromDefault): derive the whole sequence from the input alone and require equality
  if (fromDefault) {
    const derived = deriveDefaultSequence(inputText, seed);
    // Every field compared below — label, purpose and outcome included — comes from the INPUT
    // (or, for a reserved id, the independently-parsed seed), never from `mapping`, so a
    // mapping whose label, purpose or outcome diverges from what the input alone implies cannot
    // pass by agreeing with itself (MUST 3: the prior version borrowed label/purpose from the
    // mapping here).
    const derivedSeq = derived.map((d) => {
      if (RESERVED.has(d.id)) { const s = seed.byId.get(d.id); return [d.id, s?.label ?? "", s?.purpose ?? "", d.id.startsWith("CAP-") ? (s?.outcome ?? "") : null, d.parent]; }
      return [d.id, d.label, d.purpose, d.id.startsWith("CAP-") ? (d.outcome ?? "") : null, d.parent];
    });
    if (JSON.stringify(outSeq) !== JSON.stringify(derivedSeq)) problems.push(`the output's heading sequence does not equal the sequence derived from the input alone (no capability above a section, the G run, or a section's level, label, purpose, outcome or parent differ from the input)`);
    // The mapping's own declared source line(s) for each id must match what the input alone
    // implies too, so a tampered or mismatched `from` pointer (a heading-ID collision, say)
    // cannot hide behind an otherwise-correct label and purpose.
    for (const d of derived) {
      const n = nodes.find((x) => x.id === d.id);
      const mapFrom = n ? (n.node.from ?? []) : [];
      const wantFrom = d.from ?? [];
      if (JSON.stringify(mapFrom) !== JSON.stringify(wantFrom)) problems.push(`${d.id}: the mapping's source heading(s) ${JSON.stringify(mapFrom)} differ from what the input alone implies (${JSON.stringify(wantFrom)})`);
    }
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

  // reserved-node row-placement rule, both modes: a product (R-) row under CAP-90 at ANY depth,
  // not only one whose own direct heading happens to be a reserved id (a tampered or regrouped
  // product feature nested under CAP-90 still carries its own, non-reserved, feature id).
  const underReservedCap = (h) => { let c = h; while (c) { if (c.id === "CAP-90") return true; c = c.parent; } return false; };
  for (const row of outRows) {
    const homeId = row.heading?.id;
    if (!homeId) continue;
    if (row.id.startsWith("R-") && (RESERVED.has(homeId) || underReservedCap(row.heading))) problems.push(`${row.id}: an R row sits under reserved capability CAP-90 (at ${homeId})`);
    if (row.id.startsWith("G-")) {
      const wantSub = seed.subOf.get(row.id);
      const actualSub = homeId.startsWith("SUB-") ? homeId : (outParsed.headings.find((h) => h.id === homeId)?.parent?.id ?? null);
      if (wantSub && actualSub !== wantSub) problems.push(`${row.id}: sits in ${actualSub ?? homeId}, not its seed subgroup ${wantSub}`);
    }
  }

  // 7. the tree checker passes
  const ct = checkTree(outputText);
  if (ct.problems.length) problems.push(...ct.problems.map((p) => `tree check: ${p}`));

  // 4–5 (MUST 1: the proof partitions the WHOLE input and accounts the WHOLE output). Every
  // input line — head, every node's region, the tail's own prose, and each kept section,
  // blanks included — is assigned to exactly one region and must appear exactly once in the
  // output, in that region's order, except the heading/field/header/delimiter lines the
  // mapping replaces; a kept section is never replaced, so its whole span (heading and body) is
  // required byte-for-byte. Every output line must be a consumed input line or a declared
  // generated line (a tree heading, a field line, canonical table structure, the closing
  // heading, a row, or a blank); an unconsumed non-blank line anywhere — the tail and kept
  // sections included, not only a node's own region — is a stray extra line.
  const headLines = Math.max(0, mapping.head?.through ?? 0);
  if (JSON.stringify(inSegs.slice(0, headLines)) !== JSON.stringify(outSegs.slice(0, headLines))) problems.push(`head: the first ${headLines} line(s) are not carried verbatim`);
  const outHeadingScan = scanHeadings(outBare, outFenced);
  const regionBoundsFor = (line) => {
    const after = outHeadingScan.filter((h) => h.line > line).map((h) => h.line).sort((a, b) => a - b);
    return after.length ? after[0] - 1 : outBare.length;
  };
  const inAllHeadingLines = scanHeadings(inBare, inFenced).map((h) => h.line);
  const expectedProseFor = (fromEntries) => {
    const out = [];
    for (const f of fromEntries ?? []) {
      const startIdx = f.line; // 0-based index right after the heading line
      const headingLines = inAllHeadingLines.filter((l) => l > f.line).sort((a, b) => a - b);
      const endIdx = headingLines.length ? headingLines[0] - 1 : inBare.length;
      // Only the OLD heading's own field-line block -- exactly as the tree parser defines it,
      // and only when that old heading is itself tree-form -- is regenerated fresh, never
      // carried; a field-labelled line anywhere else is ordinary prose, required like any other
      // (build brief 4 §A, MUST 1(b)).
      const treeId = TREE_HEADING.exec(f.heading)?.[2] ?? null;
      const fieldBlock = fieldBlockAt(inBare, inAllHeadingLines, f.line, treeId);
      for (let i = startIdx; i < endIdx; i++) {
        if (inFenced[i]) { out.push(inSegs[i]); continue; }
        const id = requirementRowId(inBare[i]);
        if (id) continue; // rows: accounted by check 3
        if (fieldBlock.has(i)) continue; // the old heading's own field line, regenerated fresh
        if (isTableHeaderAt(inBare, i)) { i++; continue; } // old header+delimiter pair: structural, replaced
        out.push(inSegs[i]);
      }
    }
    return out;
  };
  const isBlankSeg = (s) => bare(s) === "";
  const consumed = new Array(outBare.length).fill(false);
  for (let i = 0; i < headLines && i < consumed.length; i++) consumed[i] = true;
  // every row and fenced line anywhere is already accounted by checks 2-3 (byte-identical,
  // multiset-equal); this loop only marks them so the stray scan below never re-flags one.
  outBare.forEach((l, i) => { if (outFenced[i] || requirementRowId(l)) consumed[i] = true; });
  /**
   * `expected` (raw segments, in required order) must appear among `actual` ({seg, idx} pairs,
   * already filtered to drop rows/fields/header-delimiter structure from this region), in
   * order, byte-exact; `actual` may interleave extra BLANK entries only (the one generated
   * separator a re-laid leaf adds). Every matched or skipped-blank entry is marked consumed.
   */
  function matchProse(expected, actual) {
    let j = 0;
    for (const e of expected) {
      while (j < actual.length && actual[j].seg !== e && isBlankSeg(actual[j].seg) && !isBlankSeg(e)) { consumed[actual[j].idx] = true; j++; }
      if (j >= actual.length || actual[j].seg !== e) return false;
      consumed[actual[j].idx] = true; j++;
    }
    while (j < actual.length) { if (!isBlankSeg(actual[j].seg)) return false; consumed[actual[j].idx] = true; j++; }
    return true;
  }
  let proseCarried = 0, headingsReplaced = 0;
  for (const { id, node } of nodes) {
    const h = outHeadingScan.find((x) => x.id === id);
    if (!h) { problems.push(`${id}: not found in the output`); continue; }
    consumed[h.line - 1] = true; // the node's own (generated or replaced) heading line
    const regionEnd = regionBoundsFor(h.line);
    const regionBare = outBare.slice(h.line, regionEnd);
    const regionFenced = outFenced.slice(h.line, regionEnd);
    const prose = [];
    for (let i = 0; i < regionBare.length; i++) {
      const idx = h.line + i;
      if (regionFenced[i]) { prose.push({ seg: outSegs[idx], idx }); continue; }
      const line = regionBare[i];
      if (requirementRowId(line)) { consumed[idx] = true; continue; }
      if (/^(Purpose|Outcome|Status|Also applies):/.test(line)) { consumed[idx] = true; continue; }
      if (line === TABLE_HEADER_TEXT && DELIM.test(regionBare[i + 1] ?? "") && isTableHeaderAt(regionBare, i)) { consumed[idx] = true; consumed[idx + 1] = true; i++; continue; }
      prose.push({ seg: outSegs[idx], idx });
    }
    const expected = expectedProseFor(node.from);
    if (!matchProse(expected, prose)) problems.push(`${id}: prose from its old section(s) is missing, reordered, stray, or duplicated`);
    proseCarried += expected.length;
    headingsReplaced += (node.from ?? []).length;
  }
  // tail: the closing heading, its own carried prose, then each kept section — a verbatim
  // span (heading included), never replaced — in order; nothing of either is allowed to go
  // missing, shrink, grow or duplicate without being named.
  const tailHasContent = Boolean((mapping.tail?.keep ?? []).length || (mapping.tail?.from ?? []).length);
  let keptTailLines = 0;
  if (tailHasContent) {
    const closing = outHeadingScan.find((h) => bare(outSegs[h.line - 1] ?? "") === mapping.tail.heading);
    headingsReplaced += (mapping.tail?.from ?? []).length;
    if (!closing) {
      problems.push(`tail: the closing heading "${mapping.tail?.heading}" is missing from the output`);
    } else {
      consumed[closing.line - 1] = true;
      const tailEnd = regionBoundsFor(closing.line);
      const tailProse = [];
      for (let idx = closing.line; idx < tailEnd; idx++) tailProse.push({ seg: outSegs[idx], idx });
      const tailExpected = expectedProseFor(mapping.tail?.from);
      if (!matchProse(tailExpected, tailProse)) problems.push(`tail: prose from its old section(s) is missing, reordered, stray, or duplicated`);
      proseCarried += tailExpected.length;
      let cursorIdx = outHeadingScan.indexOf(closing);
      for (const k of mapping.tail?.keep ?? []) {
        const found = outHeadingScan.find((h, idx) => idx > cursorIdx && bare(outSegs[h.line - 1] ?? "") === k.heading);
        if (!found) { problems.push(`tail: kept section "${k.heading}" is missing from the output, out of order, or duplicated`); continue; }
        cursorIdx = outHeadingScan.indexOf(found);
        const end = regionBoundsFor(found.line);
        const actualSpan = outSegs.slice(found.line - 1, end);
        const inHeadingLines = scanHeadings(inBare, inFenced).map((h) => h.line).filter((l) => l > k.line).sort((a, b) => a - b);
        const inEnd = inHeadingLines.length ? inHeadingLines[0] - 1 : inBare.length;
        const expectedSpan = inSegs.slice(k.line - 1, inEnd);
        if (JSON.stringify(actualSpan) !== JSON.stringify(expectedSpan)) problems.push(`tail: kept section "${k.heading}" is not carried verbatim (a line was added, dropped, duplicated or changed)`);
        for (let i = found.line - 1; i < end; i++) consumed[i] = true;
        keptTailLines += expectedSpan.length;
      }
    }
  }

  // stray-line scan: any output line not assigned to head, a node's region or the tail/kept
  // regions above, and not blank, is unaccounted extra content (a duplicated kept section, a
  // stray appended line, or a tampered heading nothing above recognised).
  const strayLines = [];
  for (let i = 0; i < outBare.length; i++) { if (!consumed[i] && outBare[i] !== "") strayLines.push(i + 1); }
  if (strayLines.length) problems.push(`line(s) ${strayLines.slice(0, 5).join(", ")}${strayLines.length > 5 ? ` and ${strayLines.length - 5} more` : ""} in the output are not accounted for by the head, any node or the tail`);

  // Line accounting derived from the input alone (build brief 4 §A "Rule"): a COUNT-based
  // backstop, independent of the region-by-region matching above, which reasons node by node
  // and so misses a line whose whole region moved, a duplicate of a kind a region recognises
  // GENERICALLY (a second generated field line, an extra header pair), or a stray fenced block
  // (the stray-line scan above pre-marks every fenced line consumed, whatever it holds, and the
  // per-node prose loop marks any field-labelled or header+delimiter LOOKING line consumed with
  // no count). Build two multisets of raw segments, blank ones dropped (today's positional
  // blank-line checks above already cover blanks for in-place and re-laid leaves):
  //   INPUT, minus (1) an old heading line a node or the tail names as a `from` source (never a
  //   kept section's own heading, which is carried, not replaced); (2) -- when that heading is
  //   itself tree-form -- its own field-line block, as the tree parser defines it; (3) each
  //   requirement-table header+delimiter pair inside such a heading's own old span.
  //   OUTPUT, minus a node's own heading, the tail's closing heading, each node's own FIRST
  //   field-line block, and each header+delimiter pair in a node's region that has a row
  //   following it before the next one -- a SECOND field line, or an extra, rowless, header
  //   pair, is left counted on this side, so it shows as an unmatched extra.
  // The two multisets, counted (not just recognised), must be exactly equal.
  {
    const namedFromLines = [];
    for (const { node } of nodesForHead) for (const f of node.from ?? []) namedFromLines.push(f.line);
    for (const f of mapping.tail?.from ?? []) namedFromLines.push(f.line);
    const inExcluded = new Array(inBare.length).fill(false);
    for (const line of namedFromLines) {
      const idx = line - 1;
      if (idx < 0 || idx >= inExcluded.length) continue;
      inExcluded[idx] = true; // the old heading line itself
      const treeId = TREE_HEADING.exec(inBare[idx])?.[2] ?? null;
      for (const i of fieldBlockAt(inBare, inAllHeadingLines, line, treeId)) inExcluded[i] = true;
      const after = inAllHeadingLines.filter((l) => l > line).sort((a, b) => a - b);
      const regionEnd = after.length ? after[0] - 1 : inBare.length;
      for (let i = idx + 1; i < regionEnd; i++) {
        if (isTableHeaderAt(inBare, i)) { inExcluded[i] = true; inExcluded[i + 1] = true; i++; }
      }
    }
    const outHeadingLinesAll = outHeadingScan.map((h) => h.line);
    const outExcluded = new Array(outBare.length).fill(false);
    for (const { id } of nodes) {
      const h = outHeadingScan.find((x) => x.id === id);
      if (!h) continue;
      const hIdx = h.line - 1;
      outExcluded[hIdx] = true; // the node's own (generated or replaced) heading line
      for (const i of fieldBlockAt(outBare, outHeadingLinesAll, h.line, id)) outExcluded[i] = true;
      const after = outHeadingLinesAll.filter((l) => l > h.line).sort((a, b) => a - b);
      const regionEnd = after.length ? after[0] - 1 : outBare.length;
      for (let i = hIdx + 1; i < regionEnd; i++) {
        if (isTableHeaderAt(outBare, i)) {
          let hasRow = false;
          for (let j = i + 2; j < regionEnd; j++) { if (outBare[j] === TABLE_HEADER_TEXT) break; if (requirementRowId(outBare[j])) { hasRow = true; break; } }
          if (hasRow) { outExcluded[i] = true; outExcluded[i + 1] = true; }
          i++;
        }
      }
    }
    if (tailHasContent) {
      const closingH = outHeadingScan.find((h) => bare(outSegs[h.line - 1] ?? "") === mapping.tail.heading);
      if (closingH) outExcluded[closingH.line - 1] = true;
    }
    const multisetOf = (segs, excluded) => segs.filter((s, i) => !excluded[i] && !isBlankSeg(s));
    const inMulti = multisetOf(inSegs, inExcluded);
    const outMulti = multisetOf(outSegs, outExcluded);
    if (JSON.stringify([...inMulti].sort()) !== JSON.stringify([...outMulti].sort())) {
      const countOf = (arr) => { const m = new Map(); for (const s of arr) m.set(s, (m.get(s) ?? 0) + 1); return m; };
      const cin = countOf(inMulti), cout = countOf(outMulti);
      let missing = 0, extra = 0, sample = null;
      for (const [s, n] of cin) { const d = n - (cout.get(s) ?? 0); if (d > 0) { missing += d; sample ??= JSON.stringify(s); } }
      for (const [s, n] of cout) { const d = n - (cin.get(s) ?? 0); if (d > 0) { extra += d; sample ??= JSON.stringify(s); } }
      problems.push(`line accounting: the input and output do not carry the same non-blank lines once headings, field lines and table structure are set aside (${missing} missing, ${extra} unaccounted extra, e.g. ${sample})`);
    }
  }

  const linesInserted = Math.max(0, outSegs.length - (keptCount + proseCarried + headLines + keptTailLines));
  const summary = `lift proof: ${keptCount} rows kept byte-identical; ${proseCarried} prose lines carried; ${headingsReplaced} headings replaced; ${linesInserted} lines inserted; tree check ${ct.problems.length} problems`;
  return { problems, summary, rows: keptCount, prose: proseCarried, headings: headingsReplaced, inserted: linesInserted };
}
