// Read-only scan of sibling ledgers: row counts, ID forms, headings, tree checker problems.
import { readFileSync } from "node:fs";
import { checkTree } from "/Users/example/nana-pi/scripts/requirements-tree.mjs";
import { requirementRowId, loadRequirements, shallCounts, earsOffForm } from "/Users/example/nana-pi/templates/typescript/template/tests/requirements-trace.ts";

const files = process.argv.slice(2);
for (const f of files) {
  const raw = readFileSync(f, "utf8");
  const text = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const railRows = []; const nearMiss = []; const anyIdLines = [];
  for (const [i, l] of lines.entries()) {
    const id = requirementRowId(l);
    if (id) railRows.push({ id, line: i + 1 });
    else if (/^\|\s*[RG]-\S/.test(l.trimEnd())) nearMiss.push(`${i + 1}: ${l.slice(0, 60)}`);
    const m = l.match(/^\|\s*([A-Z]+-?[A-Za-z0-9.]+)\s*\|/);
    if (m) anyIdLines.push(m[1]);
  }
  const forms = {};
  for (const r of railRows) { const k = r.id.replace(/\d/g, "n"); forms[k] = (forms[k] ?? 0) + 1; }
  const otherForms = {};
  for (const id of anyIdLines) { if (/^(ID|---|-)$/.test(id)) continue; if (/^[RG]-(\d{3}|[1-9]\d{3})$/.test(id)) continue; const k = id.replace(/\d/g, "n"); otherForms[k] = (otherForms[k] ?? 0) + 1; }
  const seen = new Map(); const dups = [];
  for (const r of railRows) { if (seen.has(r.id)) dups.push(r.id); seen.set(r.id, r.line); }
  const statuses = {};
  for (const l of lines) { if (!requirementRowId(l)) continue; const c = l.trim().slice(1, -1).split("|").map((s) => s.trim()); statuses[c[2]] = (statuses[c[2]] ?? 0) + 1; }
  let ears = "n/a", loadErr = "";
  try { const rows = loadRequirements(text); ears = earsOffForm(rows, shallCounts(text)).length; } catch (e) { loadErr = e.message; }
  const headers = lines.filter((l) => l === "| ID | Requirement | Status | Evidence |").length;
  const otherHeaders = lines.filter((l, i) => /^\|/.test(l) && /^\|\s*:?-+/.test(lines[i + 1] ?? "") && l !== "| ID | Requirement | Status | Evidence |").map((l) => l.slice(0, 70));
  const headings = lines.filter((l) => /^#{1,6} /.test(l));
  const lvl = {}; for (const h of headings) { const n = h.match(/^#+/)[0].length; lvl[n] = (lvl[n] ?? 0) + 1; }
  const tree = headings.filter((h) => /^#{1,3} (CAP-\d{2}|FEAT-\d{3}|SUB-\d{3}) · /.test(h)).length;
  const { problems } = checkTree(text);
  const kinds = {};
  for (const p of problems) { const k = p.replace(/^line \d+: /, "").replace(/[RG]-\d+|CAP-\d+|FEAT-\d+|SUB-\d+/g, "X"); kinds[k] = (kinds[k] ?? 0) + 1; }
  console.log(JSON.stringify({ file: f, lines: lines.length, railRows: railRows.length, unique: seen.size, dups, forms, otherForms, nearMiss: nearMiss.slice(0, 5), nearMissCount: nearMiss.length, statuses, earsOffForm: ears, loadErr, reqTableHeaders: headers, otherTableHeaders: otherHeaders, headingLevels: lvl, treeHeadings: tree, treeProblems: problems.length, problemKinds: kinds, firstProblems: problems.slice(0, 4) }, null, 1));
}
