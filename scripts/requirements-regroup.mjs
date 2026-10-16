#!/usr/bin/env node
/**
 * @module scripts/requirements-regroup.mjs
 * @purpose Check a regroup proposal against the lift and the regroup rules and write the packet its owner reviews.
 * @inputs argv (--root <dir> --proposal <file> --out <page>), the ledger, the proposal JSON file, scripts/requirements-lift.mjs
 * @outputs the review page written to <page> on success, or a named refusal on stderr with no page written
 * @effects disk (reads the ledger and the proposal; writes <page> through a plain write, removing an earlier page of its own on failure), process (spawns the lift read-only, no shell; exit 0/1/2)
 * @errors exit 2 for a usage error, naming --root, --proposal and --out; exit 1 for a named refusal (an --out collision, a lift problem, a regroup check); never a crash on honest input variation
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PROBLEM_LINE_CAP, UNSORTED_PREFIX, detectMoves } from "./requirements-lift.mjs";
import { expandRowIds, parseLedger, readRequirementRows } from "./requirements-tree.mjs";
import { citesOf, requirementRowId } from "./requirements-trace.mjs";

// ---------------------------------------------------------------------- tunables (§3.4)
/** Path: the lift this command spawns read-only, resolved beside this module (so a mirror copy spawns its own). */
export const LIFT_SCRIPT = fileURLToPath(new URL("./requirements-lift.mjs", import.meta.url));
/** Contract: the review page's first line; marks a file at --out as an earlier page this command may clean up (T21). */
export const PAGE_HEAD = "# Regroup review packet";
/** Chosen: enough words of a text-placed row's requirement to recognise it; the appendix holds the full text (12, T10/T16). */
export const GIST_WORDS = 12;
/** Contract: R-1178 and R-1179's order, pinned by T14 and T16. Each name dispatches to one render function below. */
export const PAGE_SECTIONS = ["header", "questions", "table", "nodes", "lines", "targets", "claims", "placed", "refuted", "appendix"];
/** Contract: a verdict's declared disposition for a row (R-1175). */
export const VERDICTS = ["keep", "move", "share"];
/** Contract: a claim's declared disposition for a purpose, outcome or section reason (R-1184). */
export const CLAIM_VERDICTS = ["accept", "reject"];
/** Contract: the general-engineering nodes R-1172 and R-1184 exempt from a placeholder/claim demand. */
const RESERVED_NODES = new Set(["CAP-90", "FEAT-900", "SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"]);
/**
 * Contract: the keys a proposal object at each level may hold (R-1177); a key outside its level's
 * list is refused, naming the key's path. "top" and "regroup" paths print bare; every other level
 * prints prefixed by its JSON path (e.g. "tree[0].features[0].statsu"), as T13 reads them.
 */
export const PROPOSAL_KEYS = {
  top: ["lift", "pin", "head", "tree", "tail", "regroup"],
  pin: ["sha256", "rows"],
  head: ["through"],
  capability: ["id", "label", "purpose", "outcome", "from", "features"],
  feature: ["id", "label", "purpose", "status", "also_applies", "from", "rows", "subgroups"],
  subgroup: ["id", "label", "purpose", "from", "rows"],
  from: ["line", "heading"],
  tail: ["heading", "from", "keep"],
  keep: ["line", "heading"],
  regroup: ["read", "reasons", "placed", "evidence", "review", "refuted", "questions"],
  reason: ["line", "to", "why"],
  // same_family: the drafter's declared "same lineage" flag (true or "same-family"), read by R-1175/T9.
  review: ["drafter", "reviewer", "same_family", "verdicts", "claims"],
  verdict: ["id", "at", "verdict", "reason", "targets"],
  target: ["to", "reason"],
  claim: ["node", "field", "line", "to", "text", "verdict", "reason"],
  refuted: ["id", "to", "reason"],
  question: ["ask", "recommendation", "about"],
  about: ["id", "line", "to", "node", "field"],
};

// ---------------------------------------------------------------------- small shared helpers
function isPlainObject(v) { return typeof v === "object" && v !== null && !Array.isArray(v); }
const BOM = "﻿";
const stripBom = (text) => (text.startsWith(BOM) ? text.slice(1) : text);
const nonEmpty = (s) => typeof s === "string" && s.trim().length > 0;
/** Two lineage strings name the same lineage case-insensitively (clarification 1). */
const sameLineage = (a, b) => nonEmpty(a) && nonEmpty(b) && a.toLowerCase() === b.toLowerCase();
function capProblems(problems) {
  if (problems.length <= PROBLEM_LINE_CAP) return problems;
  return [...problems.slice(0, PROBLEM_LINE_CAP), `… and ${problems.length - PROBLEM_LINE_CAP} more problem(s)`];
}
/** Every capability, feature and subgroup of a proposal's tree, flattened with its level and parent id. */
function flattenProposalNodes(proposal) {
  const out = [];
  for (const cap of proposal.tree ?? []) {
    out.push({ id: cap.id, level: 1, parent: null, node: cap });
    for (const feat of cap.features ?? []) {
      out.push({ id: feat.id, level: 2, parent: cap.id, node: feat });
      for (const sub of feat.subgroups ?? []) out.push({ id: sub.id, level: 3, parent: feat.id, node: sub });
    }
  }
  return out;
}
/** Row ID -> the node that lists it in its own `rows` (not a subtree total). */
function computeHomes(proposal) {
  const home = new Map();
  for (const x of flattenProposalNodes(proposal)) for (const r of expandRowIds((x.node.rows ?? []).join(","))) home.set(r, x.id);
  return home;
}
/** A feature's own rows plus its subgroups' rows (the table's row count; §3.4, CHANGE §3.4 note: subtree). */
function featureRowIds(feat) {
  const own = expandRowIds((feat.rows ?? []).join(","));
  const sub = (feat.subgroups ?? []).flatMap((s) => expandRowIds((s.rows ?? []).join(",")));
  return [...own, ...sub];
}
/** The rail's evidence-path form (citesOf, imported, never copied): each citation's text before "::", or the whole citation when it carries none, "\" read as "/". */
function evidencePathsOfCell(cell) {
  return citesOf(String(cell ?? ""))
    .map((c) => (c.includes("::") ? c.split("::")[0] : c))
    .map((p) => p.replace(/\\/g, "/"))
    .filter(Boolean);
}
/** Resolves a (possibly "\"-written) path under <dir>; null when it is missing or leaves the root. */
function underRoot(dir, raw) {
  const norm = String(raw).replace(/\\/g, "/");
  const abs = resolve(dir, norm);
  const rel = relative(dir, abs);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return null;
  return abs;
}
const existsUnder = (dir, raw) => { const abs = underRoot(dir, raw); return abs !== null && existsSync(abs); };
/** R-1176: a row is text-placed when its Evidence cell names no path that exists under <dir>. */
export function isTextPlaced(dir, row) { return !evidencePathsOfCell(row.evidence).some((p) => existsUnder(dir, p)); }
/** A row's cells read straight off its raw line, by requirementRowId alone — a fallback for a row a real
 * project's ledger holds outside any table readRequirementRows recognises (e.g. a blank line breaks a
 * table's header continuation mid-section, so the rows after it belong to no table the tree parser scans). */
function rawRowFallback(ledgerText, id) {
  for (const line of ledgerText.split(/\r?\n/)) {
    if (requirementRowId(line) !== id) continue;
    const cells = line.split("|").map((s) => s.trim());
    return { id, requirement: cells[2] ?? "", status: cells[3] ?? "", evidence: cells[4] ?? "" };
  }
  return null;
}
/** readRequirementRows's rows, plus a fallback entry for every row the proposal's tree names that it missed. */
function ledgerRowsFor(proposal, ledgerText, tableRows) {
  const byId = new Map(tableRows.map((r) => [r.id, r]));
  for (const x of flattenProposalNodes(proposal)) for (const id of expandRowIds((x.node.rows ?? []).join(","))) {
    if (!byId.has(id)) { const r = rawRowFallback(ledgerText, id); if (r) byId.set(id, r); }
  }
  return [...byId.values()];
}

// ---------------------------------------------------------------------- R-1177: proposal key shape
function keyProblems(proposal) {
  const problems = [];
  const checkObj = (obj, allowed, path) => {
    if (!isPlainObject(obj)) return;
    for (const k of Object.keys(obj)) if (!allowed.includes(k)) problems.push(`${path}.${k}: key is not one of ${allowed.join(", ")} (its level's fields)`);
  };
  /**
   * `value`'s [index, item] entries, the way an honest array-of-objects field is read
   * elsewhere in this module; `value` given as something other than an array (an object,
   * a string, a number) is refused by name instead of throwing when the caller's next line
   * calls `.entries()` or reads a field off a non-array (R-1177, "never a crash"). An item
   * that is itself not a plain object (a `null` entry) is refused the same way, named by its
   * own index, and left out of the entries handed back so the caller never dereferences it.
   */
  const arrayEntries = (value, path) => {
    if (value === undefined) return [];
    if (!Array.isArray(value)) { problems.push(`${path}: expected an array, not an object`); return []; }
    const out = [];
    for (const [i, item] of value.entries()) {
      if (!isPlainObject(item)) { problems.push(`${path}[${i}]: entry is not an object`); continue; }
      out.push([i, item]);
    }
    return out;
  };
  checkObj(proposal, PROPOSAL_KEYS.top, "proposal");
  checkObj(proposal.pin, PROPOSAL_KEYS.pin, "pin");
  checkObj(proposal.head, PROPOSAL_KEYS.head, "head");
  if (isPlainObject(proposal.tail)) {
    checkObj(proposal.tail, PROPOSAL_KEYS.tail, "tail");
    for (const [fi, f] of arrayEntries(proposal.tail.from, "tail.from")) checkObj(f, PROPOSAL_KEYS.from, `tail.from[${fi}]`);
    for (const [ki, k] of arrayEntries(proposal.tail.keep, "tail.keep")) checkObj(k, PROPOSAL_KEYS.keep, `tail.keep[${ki}]`);
  }
  for (const [ci, cap] of arrayEntries(proposal.tree, "tree")) {
    checkObj(cap, PROPOSAL_KEYS.capability, `tree[${ci}]`);
    for (const [fi, f] of arrayEntries(cap.from, `tree[${ci}].from`)) checkObj(f, PROPOSAL_KEYS.from, `tree[${ci}].from[${fi}]`);
    for (const [fj, feat] of arrayEntries(cap.features, `tree[${ci}].features`)) {
      checkObj(feat, PROPOSAL_KEYS.feature, `tree[${ci}].features[${fj}]`);
      for (const [fi, f] of arrayEntries(feat.from, `tree[${ci}].features[${fj}].from`)) checkObj(f, PROPOSAL_KEYS.from, `tree[${ci}].features[${fj}].from[${fi}]`);
      for (const [si, sub] of arrayEntries(feat.subgroups, `tree[${ci}].features[${fj}].subgroups`)) {
        checkObj(sub, PROPOSAL_KEYS.subgroup, `tree[${ci}].features[${fj}].subgroups[${si}]`);
        for (const [fi, f] of arrayEntries(sub.from, `tree[${ci}].features[${fj}].subgroups[${si}].from`)) checkObj(f, PROPOSAL_KEYS.from, `tree[${ci}].features[${fj}].subgroups[${si}].from[${fi}]`);
      }
    }
  }
  if (isPlainObject(proposal.regroup)) {
    checkObj(proposal.regroup, PROPOSAL_KEYS.regroup, "regroup");
    for (const [ri, r] of arrayEntries(proposal.regroup.reasons, "regroup.reasons")) checkObj(r, PROPOSAL_KEYS.reason, `regroup.reasons[${ri}]`);
    if (isPlainObject(proposal.regroup.review)) {
      checkObj(proposal.regroup.review, PROPOSAL_KEYS.review, "regroup.review");
      for (const [vi, v] of arrayEntries(proposal.regroup.review.verdicts, "regroup.review.verdicts")) {
        checkObj(v, PROPOSAL_KEYS.verdict, `regroup.review.verdicts[${vi}]`);
        for (const [ti, t] of arrayEntries(v.targets, `regroup.review.verdicts[${vi}].targets`)) checkObj(t, PROPOSAL_KEYS.target, `regroup.review.verdicts[${vi}].targets[${ti}]`);
      }
      for (const [ci, c] of arrayEntries(proposal.regroup.review.claims, "regroup.review.claims")) checkObj(c, PROPOSAL_KEYS.claim, `regroup.review.claims[${ci}]`);
    }
    for (const [ri, r] of arrayEntries(proposal.regroup.refuted, "regroup.refuted")) checkObj(r, PROPOSAL_KEYS.refuted, `regroup.refuted[${ri}]`);
    for (const [qi, q] of arrayEntries(proposal.regroup.questions, "regroup.questions")) {
      checkObj(q, PROPOSAL_KEYS.question, `regroup.questions[${qi}]`);
      for (const [ai, a] of arrayEntries(q.about, `regroup.questions[${qi}].about`)) checkObj(a, PROPOSAL_KEYS.about, `regroup.questions[${qi}].about[${ai}]`);
    }
  }
  for (const [qi, q] of arrayEntries(proposal.regroup?.questions, "regroup.questions")) if (!nonEmpty(q.recommendation)) problems.push(`regroup.questions[${qi}]: question has no recommendation`);
  return problems;
}

// ---------------------------------------------------------------------- R-1172: placeholder purpose/outcome
function placeholderProblems(proposal) {
  const problems = [];
  for (const x of flattenProposalNodes(proposal)) {
    if (RESERVED_NODES.has(x.id)) continue;
    if (String(x.node.purpose ?? "").startsWith(UNSORTED_PREFIX)) problems.push(`${x.id}: purpose still starts with "${UNSORTED_PREFIX}"`);
    if (x.level === 1 && String(x.node.outcome ?? "").startsWith(UNSORTED_PREFIX)) problems.push(`${x.id}: outcome still starts with "${UNSORTED_PREFIX}"`);
  }
  return problems;
}

// ---------------------------------------------------------------------- R-1173: one reason per reported line
function reasonProblems(proposal, records) {
  const problems = [];
  const want = new Set(records.map((r) => `${r.line}|${r.to}`));
  const reasons = proposal.regroup?.reasons ?? [];
  const seen = new Map();
  for (const r of reasons) {
    if (!Number.isInteger(r.line)) { problems.push(`regroup.reasons: line ${JSON.stringify(r.line)} must be an integer, not its typed value`); continue; }
    const key = `${r.line}|${r.to}`;
    if (!want.has(key)) { problems.push(`regroup.reasons: line ${r.line} -> ${r.to} is not a line the lift reports (a stale reason)`); continue; }
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if (!nonEmpty(r.why)) problems.push(`regroup.reasons: line ${r.line} -> ${r.to} has an empty reason`);
  }
  for (const key of want) {
    const [line, to] = key.split("|");
    const n = seen.get(key) ?? 0;
    if (n === 0) problems.push(`regroup.reasons: line ${line} -> ${to} has no reason`);
    else if (n > 1) problems.push(`regroup.reasons: line ${line} -> ${to} has more than one reason`);
  }
  return problems;
}

// ---------------------------------------------------------------------- R-1174: proposed-feature evidence
function evidenceProblems(proposal, rootDir) {
  const problems = [];
  const evidence = proposal.regroup?.evidence ?? {};
  for (const x of flattenProposalNodes(proposal)) {
    if (x.level !== 2 || (x.node.status ?? "") !== "proposed") continue;
    const paths = evidence[x.id];
    if (!Array.isArray(paths) || paths.length === 0) { problems.push(`${x.id}: proposed feature names no evidence path`); continue; }
    for (const raw of paths) if (!existsUnder(rootDir, raw)) problems.push(`${x.id}: evidence path "${raw}" does not exist under the root`);
  }
  return problems;
}
/** Every path named anywhere in regroup.evidence, resolved under <dir>; used by the --out collision check. */
function allEvidenceAbsPaths(proposal, rootDir) {
  const out = [];
  for (const paths of Object.values(proposal?.regroup?.evidence ?? {})) for (const raw of paths ?? []) { const abs = underRoot(rootDir, raw); if (abs) out.push(abs); }
  return out;
}

// ---------------------------------------------------------------------- R-1175: the review record
/** The row's own verdict entry, or undefined when none names it. */
function verdictFor(proposal, id) { return (proposal.regroup?.review?.verdicts ?? []).find((v) => v.id === id); }
/** also_applies carries a row only for a share (R-1175: "carried" is for a share only; a move target never counts as carried). */
function isCarried(proposal, id, to) {
  const target = flattenProposalNodes(proposal).find((x) => x.id === to);
  return verdictFor(proposal, id)?.verdict === "share" && !!target?.node?.also_applies?.includes(id);
}
function targetOutcomeCount(proposal, id, to) {
  // Each matching entry counts on its own (a target resolved twice over the SAME outcome — refuted
  // twice, or asked by two different questions — is "resolved more than once" just as a mixed one is).
  let n = 0;
  if (isCarried(proposal, id, to)) n++;
  n += (proposal.regroup?.refuted ?? []).filter((r) => r.id === id && r.to === to).length;
  for (const q of proposal.regroup?.questions ?? []) n += (q.about ?? []).filter((a) => a.id === id && a.to === to).length;
  return n;
}
export function resolveTargetOutcome(proposal, id, to) {
  if (isCarried(proposal, id, to)) return "carried";
  if ((proposal.regroup?.refuted ?? []).some((r) => r.id === id && r.to === to)) return "refuted";
  if ((proposal.regroup?.questions ?? []).some((q) => (q.about ?? []).some((a) => a.id === id && a.to === to))) return "asked";
  return null;
}
function reviewProblems(proposal, ledgerRows) {
  const problems = [];
  const review = proposal.regroup?.review ?? {};
  if (!nonEmpty(review.drafter)) problems.push("regroup.review: names no drafter lineage");
  if (!nonEmpty(review.reviewer)) problems.push("regroup.review: names no reviewer lineage");
  const flagged = review.same_family === true || review.same_family === "same-family";
  if (sameLineage(review.drafter, review.reviewer) && !flagged) {
    problems.push(`regroup.review: drafter and reviewer share one lineage ("${review.drafter}") but same_family is not declared`);
  }
  if (nonEmpty(review.drafter) && nonEmpty(review.reviewer) && !sameLineage(review.drafter, review.reviewer) && flagged) {
    problems.push(`regroup.review: same_family is declared but the drafter ("${review.drafter}") and reviewer ("${review.reviewer}") lineages differ`);
  }
  const verdicts = review.verdicts ?? [];
  const allIds = new Set(flattenProposalNodes(proposal).map((x) => x.id));
  const home = computeHomes(proposal);
  const ledgerIds = new Set(ledgerRows.map((r) => r.id));
  const seenRow = new Map();
  for (const v of verdicts) seenRow.set(v.id, (seenRow.get(v.id) ?? 0) + 1);
  for (const r of ledgerRows) {
    const n = seenRow.get(r.id) ?? 0;
    if (n === 0) problems.push(`regroup.review.verdicts: row ${r.id} has no verdict`);
    else if (n > 1) problems.push(`regroup.review.verdicts: row ${r.id} is repeated`);
  }
  for (const id of seenRow.keys()) if (!ledgerIds.has(id)) problems.push(`regroup.review.verdicts: row ${id} is not a row in this ledger`);
  for (const v of verdicts) {
    if (!VERDICTS.includes(v.verdict)) { problems.push(`regroup.review.verdicts: ${v.id}'s verdict "${v.verdict}" is neither keep, move nor share`); continue; }
    const wantHome = home.get(v.id);
    if (wantHome !== undefined && v.at !== wantHome) problems.push(`regroup.review.verdicts: ${v.id}'s verdict names a stale home "${v.at}" (now ${wantHome})`);
    if (v.verdict === "keep") {
      if (!nonEmpty(v.reason)) problems.push(`regroup.review.verdicts: ${v.id}'s keep verdict has an empty reason`);
      continue;
    }
    const targets = v.targets ?? [];
    if (!targets.length) { problems.push(`regroup.review.verdicts: ${v.id}'s ${v.verdict} verdict names no target`); continue; }
    if (v.verdict === "move" && targets.length > 1) problems.push(`regroup.review.verdicts: ${v.id}'s move verdict names more than one target (one target for a move)`);
    for (const t of targets) {
      if (!allIds.has(t.to)) problems.push(`regroup.review.verdicts: ${v.id}'s target "${t.to}" is not a node in this proposal`);
      if (!nonEmpty(t.reason)) problems.push(`regroup.review.verdicts: ${v.id} -> ${t.to}: target has an empty reason`);
      const n = targetOutcomeCount(proposal, v.id, t.to);
      if (n === 0) problems.push(`regroup: ${v.id} -> ${t.to} target is left unresolved (neither carried, refuted nor asked)`);
      else if (n > 1) problems.push(`regroup: ${v.id} -> ${t.to} target is resolved more than once`);
    }
  }
  for (const r of proposal.regroup?.refuted ?? []) {
    if (!ledgerIds.has(r.id)) problems.push(`regroup.refuted: ${r.id} is not a row in this ledger`);
    if (!nonEmpty(r.reason)) problems.push(`regroup.refuted: ${r.id} -> ${r.to} has an empty reason`);
  }
  for (const q of proposal.regroup?.questions ?? []) {
    for (const a of q.about ?? []) {
      if (a.id !== undefined && !ledgerIds.has(a.id)) problems.push(`regroup.questions: about entry names row ${a.id}, which is not in this ledger`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------- R-1176: text-placed rows
function placedProblems(proposal, ledgerRows, rootDir) {
  const problems = [];
  const placed = proposal.regroup?.placed ?? {};
  const ledgerIds = new Set(ledgerRows.map((r) => r.id));
  for (const id of Object.keys(placed)) if (!ledgerIds.has(id)) problems.push(`regroup.placed: ${id} is not a row in this ledger`);
  for (const row of ledgerRows) {
    const reason = placed[row.id];
    if (isTextPlaced(rootDir, row)) {
      if (!nonEmpty(reason)) problems.push(`regroup.placed: ${row.id} is text-placed (no evidence path under the root) but has no placed reason`);
    } else if (reason !== undefined) {
      problems.push(`regroup.placed: ${row.id} has local evidence but also carries a placed reason`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------- R-1184: claim verdicts
function requiredClaimKeys(proposal, records) {
  const keys = [];
  for (const x of flattenProposalNodes(proposal)) {
    if (RESERVED_NODES.has(x.id)) continue;
    keys.push({ kind: "node", node: x.id, field: "purpose", text: x.node.purpose ?? "" });
    if (x.level === 1) keys.push({ kind: "node", node: x.id, field: "outcome", text: x.node.outcome ?? "" });
  }
  const seen = new Set();
  for (const r of records) {
    const key = `${r.line}|${r.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const reason = (proposal.regroup?.reasons ?? []).find((y) => y.line === r.line && y.to === r.to);
    keys.push({ kind: "reason", line: r.line, to: r.to, text: reason?.why ?? null });
  }
  return keys;
}
function claimLabel(req) { return req.kind === "node" ? `${req.node} ${req.field}` : `line ${req.line} -> ${req.to} reason`; }
function claimProblems(proposal, records) {
  const problems = [];
  const claims = proposal.regroup?.review?.claims ?? [];
  for (const c of claims) if (c.line !== undefined && !Number.isInteger(c.line)) problems.push(`regroup.review.claims: line ${JSON.stringify(c.line)} must be an integer, not its typed value`);
  const matches = (c, req) => (req.kind === "node" ? c.node === req.node && c.field === req.field : c.line === req.line && c.to === req.to);
  for (const req of requiredClaimKeys(proposal, records)) {
    const hit = claims.filter((c) => matches(c, req));
    const label = claimLabel(req);
    if (hit.length === 0) { problems.push(`regroup.review.claims: ${label} has no claim verdict`); continue; }
    if (hit.length > 1) { problems.push(`regroup.review.claims: ${label} has more than one claim verdict`); continue; }
    const c = hit[0];
    if (!CLAIM_VERDICTS.includes(c.verdict)) problems.push(`regroup.review.claims: ${label}'s claim verdict is neither accept nor reject`);
    if (!nonEmpty(c.reason)) problems.push(`regroup.review.claims: ${label}'s claim has an empty reason`);
    if (req.text !== null && c.text !== req.text) problems.push(`regroup.review.claims: ${label}'s claim quotes a stale text`);
  }
  for (const c of claims) {
    if (c.verdict !== "reject") continue;
    const referenced = (proposal.regroup?.questions ?? []).some((q) => (q.about ?? []).some((a) => (c.node !== undefined ? a.node === c.node && a.field === c.field : a.line === c.line && a.to === c.to)));
    if (!referenced) {
      const label = c.node !== undefined ? `${c.node} ${c.field}` : `line ${c.line} -> ${c.to} reason`;
      problems.push(`regroup.review.claims: the rejected claim on ${label} is named in no question`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------- all regroup checks (R-1172 to R-1177, R-1184)
// Exported so a test can call the checks directly (CHANGE §3.4 item 2; residual 2): the lift
// itself refuses an `also_applies` line until regroup-shares lands, so the "carried" share
// outcome can be exercised only by calling this function, never through the CLI.
export function regroupProblems(proposal, ledgerText, rootDir) {
  const records = detectMoves(ledgerText, proposal);
  const ledgerRows = ledgerRowsFor(proposal, ledgerText, readRequirementRows(parseLedger(ledgerText)));
  // The shape check runs alone first: once a field like regroup.reasons or a verdict's
  // targets is the wrong shape (an object instead of an array, a null entry), every other
  // check below reads that same field and would throw instead of refusing (R-1177, "never
  // a crash") — so a shape problem is reported on its own, before anything else reads it.
  const shapeProblems = keyProblems(proposal);
  if (shapeProblems.length) return { problems: shapeProblems, records, ledgerRows };
  const problems = [
    ...placeholderProblems(proposal),
    ...reasonProblems(proposal, records),
    ...evidenceProblems(proposal, rootDir),
    ...reviewProblems(proposal, ledgerRows),
    ...placedProblems(proposal, ledgerRows, rootDir),
    ...claimProblems(proposal, records),
  ];
  return { problems, records, ledgerRows };
}

// ---------------------------------------------------------------------- the page (R-1178, R-1179)
function statusMixOf(ids, rowStatus) {
  const counts = new Map();
  for (const id of ids) { const s = rowStatus.get(id) ?? "untested"; counts.set(s, (counts.get(s) ?? 0) + 1); }
  return [...counts.entries()].map(([s, n]) => `${n} ${s}`).join(", ") || "—";
}
const renderers = {
  header(ctx) {
    const sha = createHash("sha256").update(ctx.proposalBytes).digest("hex");
    const review = ctx.proposal.regroup?.review ?? {};
    const out = [PAGE_HEAD, "", `Proposal SHA-256: ${sha}`, `Ledger pin SHA-256: ${ctx.proposal.pin?.sha256 ?? ""}`, ctx.proofLine ?? "lift proof: (not captured)", ""];
    out.push(`Drafter: ${review.drafter}`, `Reviewer: ${review.reviewer} (${ctx.same ? "same-family review" : "another lineage"})`, "");
    out.push(`Placement verdicts: ${(review.verdicts ?? []).length}`, `Claim verdicts: ${(review.claims ?? []).length}`, "");
    return out.join("\n");
  },
  questions(ctx) {
    const qs = ctx.proposal.regroup?.questions ?? [];
    if (!qs.length) return "## Questions\n\n(none)\n\n";
    const out = ["## Questions", ""];
    qs.forEach((q, i) => out.push(`${i + 1}. ${q.ask}`, `   Recommendation: ${q.recommendation}`, ""));
    return out.join("\n");
  },
  table(ctx) {
    const feats = flattenProposalNodes(ctx.proposal).filter((x) => x.level === 2);
    const out = ["## Features", "", "| Feature | Rows | Status mix |", "|---|---|---|"];
    for (const x of feats) { const ids = featureRowIds(x.node); out.push(`| ${x.id} | ${ids.length} | ${statusMixOf(ids, ctx.rowStatus)} |`); }
    out.push("");
    return out.join("\n");
  },
  nodes(ctx) {
    // Nested by level (the flat list is already depth-first: capability, then its features,
    // then each feature's subgroups), each with its ID, label and purpose (R-1178).
    const out = ["## Capabilities, features and subgroups", ""];
    for (const x of flattenProposalNodes(ctx.proposal)) {
      const indent = "  ".repeat(x.level - 1);
      const mark = "#".repeat(x.level + 2);
      out.push(`${indent}${mark} ${x.id} — ${x.node.label ?? ""}`, `${indent}Purpose: ${x.node.purpose ?? ""}`);
      if (x.level === 1) out.push(`${indent}Outcome: ${x.node.outcome ?? ""}`);
      if ((x.node.status ?? "") === "proposed") {
        const ev = (ctx.proposal.regroup?.evidence?.[x.id] ?? []).map((p) => String(p).replace(/\\/g, "/"));
        out.push(`${indent}Evidence: ${ev.join(", ")}`);
      }
      out.push("");
    }
    return out.join("\n");
  },
  lines(ctx) {
    const out = ["## Reported lines (R-1170)", ""];
    for (const r of ctx.records) {
      const why = (ctx.proposal.regroup?.reasons ?? []).find((y) => y.line === r.line && y.to === r.to)?.why ?? "";
      out.push(`Line ${r.line}: "${r.heading}" -> ${r.to}${r.rows.length ? ` (rows ${r.rows.join(", ")})` : ""}`, `  Reason: ${why}`, "");
    }
    return out.join("\n");
  },
  targets(ctx) {
    const out = ["## Move and share targets", ""];
    for (const v of ctx.proposal.regroup?.review?.verdicts ?? []) {
      if (v.verdict !== "move" && v.verdict !== "share") continue;
      for (const t of v.targets ?? []) {
        const label = resolveTargetOutcome(ctx.proposal, v.id, t.to) ?? "unresolved";
        out.push(`${v.id} -> ${t.to}: ${label} — ${t.reason}`, "");
      }
    }
    return out.join("\n");
  },
  claims(ctx) {
    const out = ["## Rejected claims", ""];
    const rejected = (ctx.proposal.regroup?.review?.claims ?? []).filter((c) => c.verdict === "reject");
    if (!rejected.length) return [...out, "(none)", ""].join("\n");
    for (const c of rejected) {
      const label = c.node !== undefined ? `${c.node} ${c.field}` : `line ${c.line} -> ${c.to}`;
      out.push(`Rejected claim: ${label}`, `  Reason: ${c.reason}`, "");
    }
    return out.join("\n");
  },
  placed(ctx) {
    const out = ["## Text-placed rows", ""];
    const home = computeHomes(ctx.proposal);
    let any = false;
    for (const row of ctx.ledgerRows) {
      const reason = ctx.proposal.regroup?.placed?.[row.id];
      if (reason === undefined) continue;
      any = true;
      const gist = row.requirement.split(/\s+/).slice(0, GIST_WORDS).join(" ");
      out.push(`${row.id} -> ${home.get(row.id) ?? "?"}: "${gist}" — ${reason}`, "");
    }
    if (!any) out.push("(none)", "");
    return out.join("\n");
  },
  refuted(ctx) {
    const out = ["## Refuted items", ""];
    const items = ctx.proposal.regroup?.refuted ?? [];
    if (!items.length) return [...out, "(none)", ""].join("\n");
    for (const r of items) out.push(`${r.id} -> ${r.to}: refuted — ${r.reason}`, "");
    return out.join("\n");
  },
  appendix(ctx) {
    const out = ["## Appendix", ""];
    const byId = new Map(ctx.ledgerRows.map((r) => [r.id, r]));
    for (const x of flattenProposalNodes(ctx.proposal)) {
      const ids = expandRowIds((x.node.rows ?? []).join(","));
      if (!ids.length) continue;
      out.push(`### Appendix — ${x.id}`, "");
      for (const id of ids) { const row = byId.get(id); if (row) out.push(`- ${id}: ${row.requirement}`); }
      out.push("");
    }
    return out.join("\n");
  },
};
function renderPage(ctx) { return PAGE_SECTIONS.map((k) => renderers[k](ctx)).join("\n"); }

// ---------------------------------------------------------------------- CLI
function usage() {
  console.error("Usage: requirements-regroup.mjs --root <dir> --proposal <file> --out <page>");
  return 2;
}
const REALPATH = process.platform === "win32" ? realpathSync.native : realpathSync;
function canonical(p) { try { return REALPATH(p); } catch { return resolve(p); } }
/** The real path of <p>, following symlinks on every existing ancestor; a non-existent tail is appended literally. */
function nearestRealPath(p) {
  let cur = resolve(p);
  const tail = [];
  for (;;) {
    try { return join(REALPATH(cur), ...tail); } catch { /* keep walking up */ }
    const parent = dirname(cur);
    if (parent === cur) return resolve(p);
    tail.unshift(cur.slice(parent.length).replace(/^[\\/]/, ""));
    cur = parent;
  }
}
function removeEarlierPage(outPath) {
  let existing;
  try { existing = readFileSync(outPath, "utf8"); } catch { return; }
  if (existing.startsWith(PAGE_HEAD)) { try { rmSync(outPath); } catch { /* best effort */ } }
}
/** <p>'s device+inode, or null when it does not exist (or cannot be stat'd). */
function statId(p) { try { const s = statSync(p); return `${s.dev}:${s.ino}`; } catch { return null; } }
/**
 * True when a and b name the same file: by device and inode when both exist (so a
 * case-only alias on a case-insensitive file system, and a hard link, are caught even
 * though realpathSync keeps the case as typed and never resolves a hard link to its
 * sibling), otherwise by real path (R-1171).
 */
function samePath(a, b) {
  const ai = statId(a), bi = statId(b);
  if (ai !== null && bi !== null) return ai === bi;
  return nearestRealPath(a) === nearestRealPath(b);
}
const PROOF_LINE = /^lift proof: .*$/m;

export function main(argv = process.argv.slice(2)) {
  const args = { root: null, proposal: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") args.root = argv[++i];
    else if (a === "--proposal") args.proposal = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else return usage();
  }
  if (!args.root || !args.proposal || !args.out) return usage();

  const rootDir = canonical(resolve(process.cwd(), args.root));
  const ledgerPath = resolve(rootDir, "REQUIREMENTS.md");
  const proposalPath = resolve(rootDir, args.proposal);
  const outPath = resolve(process.cwd(), args.out);

  let proposalEarly = null;
  try { proposalEarly = JSON.parse(stripBom(readFileSync(proposalPath, "utf8"))); } catch { /* the lift will name this */ }
  const evidenceInputs = proposalEarly ? allEvidenceAbsPaths(proposalEarly, rootDir) : [];
  const inputPaths = [ledgerPath, proposalPath, LIFT_SCRIPT, ...evidenceInputs];
  if (existsSync(outPath) && statSync(outPath).isDirectory()) {
    console.error(`${outPath}: refused — this path is a directory; nothing was written`);
    return 1;
  }
  if (inputPaths.some((p) => samePath(outPath, p))) {
    console.error(`${outPath}: refused — this path is one of the run's inputs (the ledger, the proposal, the lift or an evidence path); nothing was written`);
    return 1;
  }

  const fail = (problems) => {
    for (const p of capProblems(problems)) console.error(p);
    removeEarlierPage(outPath);
    return 1;
  };

  const liftRun = spawnSync(process.execPath, [LIFT_SCRIPT, "--root", rootDir, "--mapping", proposalPath], { encoding: "utf8" });
  if (liftRun.stdout) process.stdout.write(liftRun.stdout);
  if (liftRun.status !== 0) {
    if (liftRun.stderr) process.stderr.write(liftRun.stderr);
    if (liftRun.error) console.error(String(liftRun.error.message ?? liftRun.error));
    removeEarlierPage(outPath);
    return 1;
  }

  let proposal, ledgerBuf, ledgerText;
  try {
    proposal = JSON.parse(stripBom(readFileSync(proposalPath, "utf8")));
    ledgerBuf = readFileSync(ledgerPath);
    ledgerText = ledgerBuf.toString("utf8");
  } catch (e) {
    return fail([`${proposalPath}: ${e.message}`]);
  }

  const { problems, records, ledgerRows } = regroupProblems(proposal, ledgerText, rootDir);
  if (problems.length) return fail(problems);

  const review = proposal.regroup?.review ?? {};
  const same = sameLineage(review.drafter, review.reviewer) && (review.same_family === true || review.same_family === "same-family");
  const rowStatus = new Map(ledgerRows.map((r) => [r.id, r.status]));
  const proofLine = PROOF_LINE.exec(liftRun.stdout)?.[0] ?? null;
  const page = renderPage({ proposal, ledgerRows, rowStatus, records, same, proofLine, proposalBytes: readFileSync(proposalPath) });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, page);
  return 0;
}

// realpath, not resolve: a run through a symlink to this script must still execute main() (R-1171, T3).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exit(main());
