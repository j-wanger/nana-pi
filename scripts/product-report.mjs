#!/usr/bin/env node
/**
 * @module scripts/product-report.mjs
 * @purpose Builds a deterministic HTML product ledger from the requirements tree, HANDOFF asks, and repository provenance.
 * @inputs REQUIREMENTS.md, HANDOFF.md, an optional assessment store, the HTML template, repository root, output or packet directory, injected git runner, and the runtime-map data file at its resolved path.
 * @outputs A complete product ledger HTML file, deterministic assessment packets, an exported report model and renderer, or assessment-store problem strings.
 * @effects disk (reads sources and store, writes the report or packets), process (queries git and reports CLI errors).
 * @errors Refuses malformed ledgers, asks or stores, git failures, and output failures with named diagnostics.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkTree, descendants, ledgerReadProblem, parseLedger, readRequirementRows } from "./requirements-tree.mjs";
import { WHITESPACE, citesOf } from "./requirements-trace.mjs";
import { splitOpenForJake } from "../packages/nana-pack/lib/handoff-asks.mjs";
import { dataPath, hashFile, loadRuntime } from "../packages/nana-pack/lib/runtime-map.mjs";
import { NOT_COUNTED } from "../packages/nana-pack/lib/runtime-map-config.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "product-report/template.html");
const DEFAULT_OUT = "docs/product-report/out/nana-pi-product-ledger.html";
const normalise = (text) => text.replace(/^\ufeff/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.replace(new RegExp(`[${WHITESPACE}]+$`, "gu"), "")).join("\n");
const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};
const STORE_STATUSES = new Set(["implemented", "untested", "violated", "planned", "retired"]);
const FEATURE_STATUS = /^(?:proposed|active|frozen \(\S(?:.*\S)?\)|retired \(\S(?:.*\S)?\))$/;
const RAIL_ID = /^[RG]-(?:[0-9]{3}|[1-9][0-9]{3})$/;
// contract (R-1511): the prefix every cited-test file link is built from.
const GITHUB_BLOB_PREFIX = "https://github.com/";
// contract (R-1511): the three origin-remote spellings a GitHub link is read from, each with an
// optional ".git" suffix, matched strictly so another host or embedded credentials never matches.
const GITHUB_REMOTE = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?$/;
const exactKeys = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
const fingerprint = (row) => createHash("sha256").update(JSON.stringify([row.id, row.requirement, row.status])).digest("hex");

// The cited-test rule (must-meet.md, report-test-details-2026-10-19): a citation holding "::", a
// non-empty title, and a path with "/" and no ":". Split at the first "::". This is deliberately
// looser than the trace rail's own isLocal (TypeScript-only, by file suffix): it also admits a
// Python `tests/test_a.py::test_x` citation, and naturally excludes an `other-repo:` external
// citation, since its path-before-"::" carries the prefix's own ":".
function citedTestsOf(evidence) {
  const tests = [];
  for (const cite of citesOf(evidence)) {
    const at = cite.indexOf("::");
    if (at === -1) continue;
    const file = cite.slice(0, at);
    const title = cite.slice(at + 2).trim();
    if (!title || !file.includes("/") || file.includes(":")) continue;
    tests.push({ title, file });
  }
  return tests;
}

// contract (R-1570): the exact line REQUIREMENTS.md's open-questions section starts at; read by
// buildReport's own parse only -- renderInto ships to the page as String(renderInto), so it must
// never read an identifier declared at module scope.
const OPEN_QUESTIONS_HEADING = "## Open questions";
const OPEN_QUESTIONS_ENTRY = /^(?:([0-9]+[a-z]?)\. |- )/;

// Splits the open-questions section of the already-normalised ledgerText into its entries: a
// column-zero "<digits><letter?>. " or "- " line opens an entry; every later non-blank line, up
// to the next entry start or the next line starting with "#", continues it (trimmed and joined
// with one space). Lines before the first entry are a preamble and are not returned. Returns []
// when the heading, or every entry under it, is absent.
function parseOpenQuestions(ledgerText) {
  const lines = ledgerText.split("\n");
  const start = lines.indexOf(OPEN_QUESTIONS_HEADING);
  if (start === -1) return [];
  const questions = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("#")) break;
    const match = OPEN_QUESTIONS_ENTRY.exec(line);
    if (match) {
      if (current) questions.push(current);
      const text = line.slice(match[0].length).trim();
      current = { number: match[1] ?? null, parts: text ? [text] : [] };
    } else if (current && line.trim()) {
      current.parts.push(line.trim());
    }
  }
  if (current) questions.push(current);
  return questions.map(({ number, parts }) => ({ number, text: parts.join(" ") }));
}

// href = GITHUB_BLOB_PREFIX + "o/r/blob/<commit>/" + URI-encoded segments (R-1511). No link for
// no matched GitHub origin, an absolute path (an empty leading segment), or an empty, "." or ".."
// segment — built from the matched owner/repo and encoded segments, never path.join, so a
// traversal segment is refused rather than silently collapsed.
function githubHref(repo, commit, file) {
  if (!repo || !file) return null;
  const segments = file.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) return null;
  return `${GITHUB_BLOB_PREFIX}${repo.owner}/${repo.repo}/blob/${commit}/${segments.map(encodeURIComponent).join("/")}`;
}

function git(gitRunner, root, args) {
  const result = gitRunner(args, { cwd: root, encoding: "utf8", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  if (result?.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result?.stderr?.trim() || "unknown git error"}`);
  return result.stdout.trim();
}

function featureStamp(parsed, feature, commit) {
  const rows = readRequirementRows(parsed);
  const ownHeadings = descendants(parsed, feature);
  const ownRows = rows.filter((row) => ownHeadings.includes(row.heading));
  const sharedRows = feature.alsoApplies.map((id) => rows.find((row) => row.id === id)).filter(Boolean);
  return {
    commit, purpose: feature.purpose, status: feature.status,
    rows: [...ownRows.map((row) => ({ ...row, mark: "own" })), ...sharedRows.map((row) => ({ ...row, mark: "shared" }))]
      .map((row) => ({ id: row.id, mark: row.mark, status: row.status, sha256: fingerprint(row) })),
  };
}

export function renderInto(document, model, { hash = "" } = {}) {
  const root = document.getElementById("report");
  const views = { "": "decisions", "#decisions": "decisions", "#product": "product", "#features": "features", "#shared": "shared", "#issues": "issues", "#requirements": "requirements" };
  const view = Object.prototype.hasOwnProperty.call(views, hash) ? views[hash] : Object.prototype.hasOwnProperty.call(Object.fromEntries(model.features.map((feature) => [`#${feature.id}`, feature])), hash) ? "detail" : "decisions";
  const feature = view === "detail" ? model.features.find((item) => `#${item.id}` === hash) : null;
  const el = (tag, value, parent) => { const node = document.createElement(tag); if (value !== undefined) node.appendChild(document.createTextNode(String(value ?? ""))); if (parent) parent.appendChild(node); return node; };
  const text = (parent, value) => {
    const source = String(value ?? ""); const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g; let cursor = 0; let match;
    while ((match = pattern.exec(source))) { if (match.index > cursor) parent.appendChild(document.createTextNode(source.slice(cursor, match.index))); const bold = match[0].startsWith("**"); const node = document.createElement(bold ? "b" : "code"); node.appendChild(document.createTextNode(match[0].slice(bold ? 2 : 1, bold ? -2 : -1))); parent.appendChild(node); cursor = pattern.lastIndex; }
    if (cursor < source.length) parent.appendChild(document.createTextNode(source.slice(cursor)));
  };
  const cls = (node, value) => node.setAttribute("class", value);
  const paragraph = (parent, label, value, className) => { const p = el("p", undefined, parent); if (className) cls(p, className); if (label) text(p, `${label}: `); text(p, value); return p; };
  const textList = (parent, label, values) => { paragraph(parent, label, ""); const list = el("ul", undefined, parent); for (const value of values) { const item = el("li", undefined, list); text(item, value); } return list; };
  const featureLink = (parent, id, label = id) => { const a = el("a", label, parent); a.setAttribute("href", `#${id}`); return a; };
  const countBar = (parent, item) => {
    const wrap = el("div", undefined, parent); cls(wrap, "counts"); const bar = el("div", undefined, wrap); cls(bar, "status-bar"); bar.setAttribute("role", "img"); bar.setAttribute("aria-label", "Requirement status counts");
    for (const status of ["implemented", "untested", "planned", "violated", "retired"]) { const amount = item.counts?.[status] ?? 0; const segment = el("span", undefined, bar); cls(segment, `status-segment status-${status}`); segment.setAttribute("style", `flex-grow:${amount}`); segment.setAttribute("aria-hidden", "true"); }
    paragraph(wrap, "Counts", ["implemented", "untested", "planned", "violated", "retired"].map((status) => `${status} ${item.counts?.[status] ?? 0}`).join(" · "), "count-label"); return wrap;
  };
  const row = (parent, item) => {
    const card = el("article", undefined, parent); cls(card, "requirement-card");
    const heading = el("h3", undefined, card); cls(heading, "row-heading"); text(heading, `${item.id} `);
    const pill = el("span", item.status, heading); cls(pill, `status-pill status-${item.status}`);
    if (item.mark) paragraph(card, "Row type", item.mark);
    paragraph(card, "", item.requirement, "row-text");
    paragraph(card, "", item.evidence, "row-evidence");
    const tests = item.tests ?? [];
    if (!tests.length) paragraph(card, "", "Tests: none cited in this repository");
    else {
      const list = el("ol", undefined, card); cls(list, "row-tests");
      for (const t of tests) {
        const li = el("li", undefined, list);
        text(li, `${t.title} — `);
        const info = model.files?.[t.file];
        if (info?.href) { const link = el("a", t.file, li); link.setAttribute("href", info.href); link.setAttribute("target", "_blank"); link.setAttribute("rel", "noopener noreferrer"); }
        else text(li, t.file);
        const run = info?.run;
        text(li, run ? ` — File's last measured run: ${run.label}${run.changed ? " · changed since" : ""}` : " — No recorded run");
      }
    }
    return card;
  };
  root.replaceChildren();
  const title = view === "detail" ? `${feature.id} · ${feature.label}` : ({ decisions: "Decisions", product: "Product", features: "Features", shared: "Shared", issues: "Issues", requirements: "Requirements" })[view];
  el("h1", "Nana pi product ledger", root); paragraph(root, "Commit", `${model.commit} · ${model.date} · Working tree: ${model.clean ? "clean" : "dirty"}`);
  const nav = el("nav", undefined, root); cls(nav, "tabs");
  for (const [label, target, key] of [["Decisions", "#decisions", "decisions"], ["Product", "#product", "product"], ["Features", "#features", "features"], ["Shared", "#shared", "shared"], ["Issues", "#issues", "issues"], ["Requirements", "#requirements", "requirements"]]) { const link = el("a", label, nav); link.setAttribute("href", target); if (view === key || (view === "detail" && key === "features")) link.setAttribute("aria-current", "page"); }
  const viewHeading = el("h2", title, root);
  if (view === "decisions") {
    for (const ask of model.asks) { const card = el("article", undefined, root); el("h3", ask.title, card); paragraph(card, "Kind", ask.kind); paragraph(card, "Since", ask.since); paragraph(card, "Ask", ask.body); }
    // contract (R-1571): shown when REQUIREMENTS.md's open-questions section has no entry.
    const NO_OPEN_QUESTIONS = "Open questions: none recorded in REQUIREMENTS.md";
    const questions = model.questions ?? [];
    el("h3", "Open questions in REQUIREMENTS.md", root);
    if (questions.length) { const list = el("ul", undefined, root); cls(list, "open-questions"); for (const q of questions) { const li = el("li", undefined, list); text(li, q.number ? `${q.number}. ${q.text}` : q.text); } }
    else paragraph(root, "", NO_OPEN_QUESTIONS);
  }
  if (view === "product") for (const cap of model.capabilities) { const card = el("article", undefined, root); el("h3", `${cap.id} · ${cap.label}`, card); paragraph(card, "Purpose", cap.purpose); paragraph(card, "Outcome", cap.outcome); for (const id of cap.features) { const item = model.features.find((f) => f.id === id); if (item) { const line = el("p", undefined, card); text(line, "Feature: "); featureLink(line, item.id, `${item.id} · ${item.label}`); countBar(card, item); } } }
  if (view === "features") for (const item of model.features) { const card = el("article", undefined, root); const heading = el("h3", undefined, card); featureLink(heading, item.id, `${item.id} · ${item.label}`); paragraph(card, "Purpose", item.purpose); paragraph(card, "Status", item.status); countBar(card, item); paragraph(card, "Assessment", item.assessmentState); paragraph(card, "Shared in", item.shared.join(", ") || "None"); const shareLine = el("p", undefined, card); text(shareLine, "Shared by: "); if (item.sharedBy.length) item.sharedBy.forEach((id, index) => { if (index) text(shareLine, ", "); featureLink(shareLine, id); }); else text(shareLine, "None"); }
  if (view === "detail" && feature) {
    const status = el("span", feature.status, viewHeading); cls(status, "feature-status");
    paragraph(root, "Purpose", feature.purpose); const badge = el("p", feature.assessmentState === "current" ? "current — matches the stamped ledger, not rechecked against later decisions" : feature.assessmentState, root); cls(badge, `assessment-badge state-${feature.assessmentState.replaceAll(" ", "-")}`);
    if (feature.assessment) {
      const assessment = feature.assessment; paragraph(root, "What it does", assessment.what_it_does);
      paragraph(root, "Maturity", `${assessment.maturity} — ${assessment.maturity_reason}`);
      for (const [key, label] of [["gaps", "Gaps"], ["risks", "Risks"], ["decisions", "Decisions"]]) textList(root, label, assessment[key]);
      paragraph(root, "Next step", assessment.next_step); paragraph(root, "Written by", `${assessment.written_by} · checked by ${assessment.checked_by} · ${assessment.date}`);
    }
    const differences = feature.differences ?? { added: [], removed: [], changed: [], purpose: null, status: null };
    if (feature.assessmentState === "out of date") {
      for (const key of ["added", "removed", "changed"]) if (differences[key]?.length) paragraph(root, `${key[0].toUpperCase()}${key.slice(1)} rows`, differences[key].join(", "));
      for (const key of ["purpose", "status"]) if (differences[key]) paragraph(root, key === "purpose" ? "Purpose" : "Status", `was ${differences[key].was} → now ${differences[key].now}`);
    }
    countBar(root, feature);
    const sharedBy = el("p", undefined, root); text(sharedBy, "Shared by: "); if (feature.sharedBy.length) feature.sharedBy.forEach((id, index) => { if (index) text(sharedBy, ", "); featureLink(sharedBy, id); }); else text(sharedBy, "None");
    paragraph(root, "Shared rows", feature.shared.join(", ") || "None");
    el("h3", "Requirements", root); if (model.runtime?.legend) paragraph(root, "", model.runtime.legend); for (const item of feature.rows) row(root, item);
  }
  if (view === "shared") for (const receiving of model.features) for (const id of receiving.shared) { const home = model.features.find((candidate) => candidate.rows.some((r) => r.id === id && r.mark === "own")); const item = receiving.rows.find((r) => r.id === id); const card = el("article", undefined, root); el("h3", id, card); paragraph(card, "Requirement", item?.requirement); const homeLine = el("p", undefined, card); text(homeLine, "Home feature: "); home ? featureLink(homeLine, home.id) : text(homeLine, "Unknown"); const receivingLine = el("p", undefined, card); text(receivingLine, "Receiving feature: "); featureLink(receivingLine, receiving.id); }
  if (view === "issues") { if (model.runtime?.legend) paragraph(root, "", model.runtime.legend); for (const item of model.violated) row(root, item); }
  if (view === "requirements") {
    const search = el("input", undefined, root); search.setAttribute("type", "search"); search.setAttribute("aria-label", "Search requirements");
    const status = el("select", undefined, root); status.setAttribute("aria-label", "Filter by status"); const featureFilter = el("select", undefined, root); featureFilter.setAttribute("aria-label", "Filter by feature");
    const addOption = (select, value) => { const option = el("option", value || "All", select); option.setAttribute("value", value); };
    addOption(status, ""); for (const value of ["implemented", "untested", "violated", "planned", "retired"]) addOption(status, value); addOption(featureFilter, ""); for (const item of model.features) addOption(featureFilter, item.id);
    if (model.runtime?.legend) paragraph(root, "", model.runtime.legend);
    const list = el("div", undefined, root); const all = []; for (const item of model.features) for (const r of item.rows) if (!all.some((entry) => entry.id === r.id)) all.push(r);
    const update = () => { list.replaceChildren(); const candidates = featureFilter.value ? (model.features.find((item) => item.id === featureFilter.value)?.rows ?? []) : all; for (const item of candidates) if ((!search.value || `${item.id} ${item.requirement} ${item.evidence}`.toLowerCase().includes(search.value.toLowerCase())) && (!status.value || item.status === status.value)) row(list, item); };
    search.addEventListener("input", update); status.addEventListener("change", update); featureFilter.addEventListener("change", update); update();
  }
  return root;
}

export function validateStore({ root = REPO_ROOT, storePath, gitRunner = (args, options) => spawnSync("git", args, options) } = {}) {
  const target = storePath ?? path.join(root, "docs/product-report/assessments.json");
  let raw;
  try { raw = readFileSync(target, "utf8"); }
  catch (error) { if (error?.code === "ENOENT") return []; throw error; }
  const problems = [];
  const problem = (message) => problems.push(message);
  let store;
  try { store = JSON.parse(raw); }
  catch (error) { return [`${target}: invalid JSON: ${error.message}`]; }
  const fields = ["what_it_does", "maturity_reason", "gaps", "risks", "decisions", "next_step"];
  const prose = (value, location) => {
    if (typeof value !== "string" || !value.trim()) problem(`${location} must be a non-empty string`);
    else if (/[0-9]/.test(value)) problem(`${location} contains an ASCII digit`);
  };
  if (!exactKeys(store, ["version", "features"])) return [`${target}: store must have exactly version and features keys`];
  if (store.version !== 1 || !Array.isArray(store.features)) problem(`${target}: version must be 1 and features must be an array`);
  if (!Array.isArray(store.features)) return problems;
  const seenFeatures = new Set();
  for (const [index, assessment] of store.features.entries()) {
    const at = `${target}: features[${index}]`;
    if (!exactKeys(assessment, ["id", ...fields, "maturity", "written_by", "checked_by", "date", "stamp"])) {
      problem(`${at} has missing or unknown fields`); continue;
    }
    if (typeof assessment.id !== "string" || !/^FEAT-[0-9]{3}$/.test(assessment.id)) problem(`${at}.id is not a valid FEAT ID`);
    else if (seenFeatures.has(assessment.id)) problem(`${at}: duplicate feature ${assessment.id}`);
    else seenFeatures.add(assessment.id);
    for (const field of ["what_it_does", "maturity_reason", "next_step"]) prose(assessment[field], `${at}.${field}`);
    for (const field of ["written_by", "checked_by"]) if (typeof assessment[field] !== "string" || !assessment[field].trim()) problem(`${at}.${field} must be a non-empty string`);
    for (const field of ["gaps", "risks", "decisions"]) {
      if (!Array.isArray(assessment[field])) problem(`${at}.${field} must be an array`);
      else assessment[field].forEach((entry, item) => prose(entry, `${at}.${field}[${item}]`));
    }
    if (!["solid", "mostly solid", "partial", "weak"].includes(assessment.maturity)) problem(`${at}.maturity has an invalid rating`);
    if (!validDate(assessment.date)) problem(`${at}.date must be a real ISO calendar date`);
    const stamp = assessment.stamp;
    if (!exactKeys(stamp, ["commit", "purpose", "status", "rows"])) { problem(`${at}.stamp has missing or unknown fields`); continue; }
    if (typeof stamp.commit !== "string" || !/^[0-9a-f]{40}$/.test(stamp.commit)) problem(`${at}.stamp.commit must be a full lowercase commit hash`);
    if (typeof stamp.purpose !== "string" || !stamp.purpose.trim()) problem(`${at}.stamp.purpose must be a non-empty string`);
    if (typeof stamp.status !== "string" || !FEATURE_STATUS.test(stamp.status)) problem(`${at}.stamp.status is invalid`);
    if (!Array.isArray(stamp.rows)) { problem(`${at}.stamp.rows must be an array`); continue; }
    const seenRows = new Set();
    for (const [rowIndex, row] of stamp.rows.entries()) {
      const rowAt = `${at}.stamp.rows[${rowIndex}]`;
      if (!exactKeys(row, ["id", "mark", "status", "sha256"])) { problem(`${rowAt} has missing or unknown fields`); continue; }
      if (typeof row.id !== "string" || !RAIL_ID.test(row.id)) problem(`${rowAt}.id is not a valid rail ID`);
      else if (seenRows.has(row.id)) problem(`${rowAt}: duplicate row ${row.id}`);
      else seenRows.add(row.id);
      if (row.mark !== "own" && row.mark !== "shared") problem(`${rowAt}.mark is invalid`);
      if (!STORE_STATUSES.has(row.status)) problem(`${rowAt}.status is invalid`);
      if (typeof row.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(row.sha256)) problem(`${rowAt}.sha256 must be 64 lowercase hex characters`);
    }
    if (assessment.maturity === "solid" && stamp.rows.some((row) => row?.mark === "own" && ["planned", "untested", "violated"].includes(row?.status)))
      problem(`${at}: solid rating has a planned, untested or violated own row`);
  }

  for (const [index, assessment] of store.features.entries()) {
    const stamp = assessment?.stamp;
    if (!stamp || typeof stamp.commit !== "string" || !/^[0-9a-f]{40}$/.test(stamp.commit) || !Array.isArray(stamp.rows) || typeof assessment.id !== "string") continue;
    let ledger;
    try {
      ledger = git(gitRunner, root, ["show", `${stamp.commit}:REQUIREMENTS.md`]);
    } catch {
      problem(`${target}: unknown commit ${stamp.commit}; fetch full history`);
      continue;
    }
    const normalizedLedger = normalise(ledger);
    const { parsed, problems: treeProblems } = checkTree(normalizedLedger);
    if (treeProblems.length) { problem(`${target}: ledger at ${stamp.commit} has tree problems: ${treeProblems.join("; ")}`); continue; }
    const feature = parsed.headings.find((heading) => heading.id === assessment.id && heading.id.startsWith("FEAT-"));
    if (!feature) { problem(`${target}: ${assessment.id} is absent at commit ${stamp.commit}`); continue; }
    const expectedStamp = featureStamp(parsed, feature, stamp.commit);
    const expected = expectedStamp.rows;
    const actualById = new Map(stamp.rows.filter((row) => row && typeof row.id === "string").map((row) => [row.id, row]));
    const expectedById = new Map(expected.map((row) => [row.id, row]));
    for (const row of expected) {
      const actual = actualById.get(row.id);
      if (!actual) problem(`${target}: ${assessment.id} stamp is missing row ${row.id}`);
      else if (actual.mark !== row.mark || actual.status !== row.status || actual.sha256 !== row.sha256) problem(`${target}: ${assessment.id} stamp differs for row ${row.id}`);
    }
    for (const row of stamp.rows) if (!expectedById.has(row?.id)) problem(`${target}: ${assessment.id} stamp has unexpected row ${row?.id}`);
    if (stamp.purpose !== feature.purpose) problem(`${target}: ${assessment.id} stamped purpose differs at commit ${stamp.commit}`);
    if (stamp.status !== feature.status) problem(`${target}: ${assessment.id} stamped status differs at commit ${stamp.commit}`);
  }
  return problems;
}

export async function buildReport({ root = REPO_ROOT, gitRunner = (args, options) => spawnSync("git", args, options) } = {}) {
  const ledgerText = normalise(await readFile(path.join(root, "REQUIREMENTS.md"), "utf8"));
  const readProblem = ledgerReadProblem(ledgerText, parseLedger(ledgerText));
  if (readProblem) throw new Error(readProblem);
  const { parsed, problems } = checkTree(ledgerText);
  if (problems.length) throw new Error(`requirements tree checker problems:\n${problems.join("\n")}`);
  const rows = readRequirementRows(parsed);
  const handoff = await readFile(path.join(root, "HANDOFF.md"), "utf8");
  const asks = splitOpenForJake(handoff);
  for (const ask of asks) {
    if (!ask.tag || !ask.title || !validDate(ask.tag.since) || ask.tag.kind !== ask.title.kind || ask.tag.since !== ask.title.since) {
      throw new Error(`HANDOFF.md line ${ask.line}: malformed Open for Jake entry`);
    }
  }
  const commit = git(gitRunner, root, ["rev-parse", "HEAD"]);
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`git rev-parse returned an invalid full commit hash: ${commit}`);
  const date = git(gitRunner, root, ["log", "-1", "--format=%cI"]);
  const dirty = git(gitRunner, root, ["status", "--porcelain", "--untracked-files=normal"]) !== "";

  // R-1511: the origin remote, read without throwing — a missing origin, another host, or a
  // runner that itself throws are all simply "no link", never a refusal.
  let githubRepo = null;
  try {
    const originResult = gitRunner(["remote", "get-url", "origin"], { cwd: root, encoding: "utf8", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
    if (originResult?.status === 0) {
      const match = GITHUB_REMOTE.exec(String(originResult.stdout ?? "").trim());
      if (match) githubRepo = { owner: match[1], repo: match[2] };
    }
  } catch { /* no origin, or a runner that throws, is not an error (R-1511) */ }

  // R-1512/R-1514: dataPath calls its git hook with {cwd} only (no encoding), so the hook is
  // wrapped here to add it; a dataPath throw (no git-common-dir, e.g. not a git checkout at all)
  // counts as no runtime data, same as a missing, unreadable or wrong-schema file.
  const runtimeRunner = (args, options) => gitRunner(args, { encoding: "utf8", ...options });
  let runtimeData = null;
  let runtimeReason = "no runtime data";
  try {
    const loaded = loadRuntime(dataPath(root, { git: runtimeRunner }));
    if (loaded.ok) runtimeData = loaded.data;
    else runtimeReason = loaded.reason;
  } catch { /* a dataPath throw counts as no runtime data (R-1514) */ }

  // R-1513: a cited file's label is marked changed when it, or any file the runtime data credits
  // it with running, is missing or hashes (cached, since many rows can cite the same file)
  // differently from the recorded hash.
  const hashCache = new Map();
  const hashOf = (file) => { if (!hashCache.has(file)) hashCache.set(file, hashFile(path.resolve(root, file))); return hashCache.get(file); };
  function runStateOf(file) {
    if (!runtimeData) return null;
    const entry = runtimeData.tests?.[file];
    if (!entry) return null;
    const covered = [file, ...(Array.isArray(entry.ran) ? entry.ran : [])];
    const changed = covered.some((candidate) => hashOf(candidate) !== runtimeData.hashes?.[candidate]);
    return { label: entry.label, changed };
  }
  const files = new Map();
  function testsOf(evidence) {
    return citedTestsOf(evidence).map(({ title, file }) => {
      if (!files.has(file)) files.set(file, { href: githubHref(githubRepo, commit, file), run: runStateOf(file) });
      return { title, file };
    });
  }
  const storePath = path.join(root, "docs/product-report/assessments.json");
  let storedFeatures = [];
  try {
    const store = JSON.parse(await readFile(storePath, "utf8"));
    if (Array.isArray(store?.features)) storedFeatures = store.features;
  } catch (error) {
    if (error?.code !== "ENOENT") throw new Error(`${storePath}: ${error.message}`);
  }
  const assessments = new Map(storedFeatures.map((assessment) => [assessment.id, assessment]));
  const features = parsed.headings.filter((heading) => heading.id.startsWith("FEAT-")).map((feature) => {
    const ownHeadings = descendants(parsed, feature);
    const ownRows = rows.filter((row) => ownHeadings.includes(row.heading));
    const sharedRows = feature.alsoApplies.map((id) => rows.find((row) => row.id === id)).filter(Boolean);
    const allRows = [...ownRows, ...sharedRows];
    const counts = Object.fromEntries(["implemented", "untested", "planned", "violated", "retired"].map((status) => [status, allRows.filter((row) => row.status === status).length]));
    const outgoing = parsed.headings.filter((candidate) => candidate.id.startsWith("FEAT-") && candidate.alsoApplies.some((id) => ownRows.some((row) => row.id === id))).map((candidate) => candidate.id);
    const assessment = assessments.get(feature.id) ?? null;
    const stamped = new Map((assessment?.stamp?.rows ?? []).map((row) => [row.id, row]));
    const current = new Map(allRows.map((row) => [row.id, { row, mark: ownRows.includes(row) ? "own" : "shared" }]));
    const added = [...current.keys()].filter((id) => !stamped.has(id));
    const removed = [...stamped.keys()].filter((id) => !current.has(id));
    const changed = [...current].filter(([id, value]) => {
      const old = stamped.get(id);
      return old && (old.mark !== value.mark || old.sha256 !== fingerprint(value.row));
    }).map(([id]) => id);
    const differences = {
      added, removed, changed,
      purpose: assessment?.stamp?.purpose !== undefined && assessment.stamp.purpose !== feature.purpose ? { was: assessment.stamp.purpose, now: feature.purpose } : null,
      status: assessment?.stamp?.status !== undefined && assessment.stamp.status !== feature.status ? { was: assessment.stamp.status, now: feature.status } : null,
    };
    const stale = added.length || removed.length || changed.length || differences.purpose || differences.status;
    const assessmentState = !assessment ? "unassessed" : stale ? "out of date" : "current";
    return { id: feature.id, label: feature.label, purpose: feature.purpose, status: feature.status, assessmentState, assessment, differences, counts, shared: sharedRows.map((row) => row.id), sharedBy: outgoing, rows: allRows.map((row) => ({ id: row.id, requirement: row.requirement, status: row.status, evidence: row.evidence, mark: ownRows.includes(row) ? "own" : "shared", tests: testsOf(row.evidence) })) };
  });
  const capabilities = parsed.headings.filter((heading) => heading.id.startsWith("CAP-")).map((capability) => ({ id: capability.id, label: capability.label, purpose: capability.purpose, outcome: capability.outcome, features: features.filter((feature) => descendants(parsed, capability).some((heading) => heading.id === feature.id)).map((feature) => feature.id) }));
  const violated = rows.filter((row) => row.status === "violated");
  // R-1512/R-1514 legend: the label is per file (not per cited test), what NOT_COUNTED excludes,
  // and — only when there is no runtime data at all — the reason nothing is recorded anywhere.
  const legend = `Each file's label is reported once, not per cited test — a run covering a file can hide a skipped check inside it. ${NOT_COUNTED}.${runtimeData ? "" : ` No recorded run anywhere in this report: ${runtimeReason}.`}`;
  const model = { commit, date, clean: !dirty, capabilities, features, violated: violated.map((row) => ({ id: row.id, requirement: row.requirement, status: row.status, evidence: row.evidence, tests: testsOf(row.evidence) })), asks: asks.map(({ tag, title }) => ({ kind: tag.kind, since: tag.since, title: title.title, body: title.body })), questions: parseOpenQuestions(ledgerText), files: Object.fromEntries(files), runtime: { legend } };
  return { ...model, model, template: await readFile(TEMPLATE, "utf8") };
}

export async function generatePackets({ root = REPO_ROOT, dir, gitRunner = (args, options) => spawnSync("git", args, options) } = {}) {
  if (!dir) throw new Error("packet directory is required");
  const target = path.isAbsolute(dir) ? dir : path.resolve(root, dir);
  const head = git(gitRunner, root, ["rev-parse", "HEAD"]);
  const headLedgerText = `${git(gitRunner, root, ["show", `${head}:REQUIREMENTS.md`] )}\n`;
  const workingLedgerText = await readFile(path.join(root, "REQUIREMENTS.md"), "utf8");
  if (normalise(workingLedgerText) !== normalise(headLedgerText)) throw new Error("working-tree REQUIREMENTS.md differs from HEAD; commit REQUIREMENTS.md first");
  await mkdir(target, { recursive: true });
  const initialEntries = await readdir(target);
  if (initialEntries.length) throw new Error(`packet directory is not empty: ${target}`);
  const model = await buildReport({ root, gitRunner });
  const commit = git(gitRunner, root, ["rev-parse", "HEAD"]);
  const headLedger = git(gitRunner, root, ["show", `${commit}:REQUIREMENTS.md`]);
  const { parsed, problems } = checkTree(normalise(headLedger));
  if (problems.length) throw new Error(`requirements tree checker problems at HEAD:\n${problems.join("\n")}`);
  const featuresById = new Map(parsed.headings.filter((heading) => heading.id.startsWith("FEAT-")).map((feature) => [feature.id, feature]));
  const packets = model.features.filter((feature) => feature.assessmentState !== "current").map((feature) => {
    const headFeature = featuresById.get(feature.id);
    if (!headFeature) throw new Error(`${feature.id} is absent from REQUIREMENTS.md at HEAD`);
    return {
      filename: `${feature.id}.json`,
      packet: {
        version: 1,
        feature: { id: feature.id, label: feature.label, purpose: feature.purpose, status: feature.status },
        rows: feature.rows.map(({ id, mark, requirement, status, evidence }) => ({ id, mark, requirement, status, evidence })),
        assessment: feature.assessment,
        differences: feature.assessment ? feature.differences : { added: [], removed: [], changed: [], purpose: null, status: null },
        stamp: featureStamp(parsed, headFeature, commit),
      },
    };
  });
  const entriesAfterBuild = await readdir(target);
  if (entriesAfterBuild.length) throw new Error(`packet directory is not empty: ${target}`);
  for (const { filename, packet } of packets) await writeFile(path.join(target, filename), `${JSON.stringify(packet, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return packets.map(({ filename }) => path.join(target, filename));
}

export async function generateReport({ root = REPO_ROOT, out = DEFAULT_OUT, gitRunner } = {}) {
  const { model, template } = await buildReport({ root, ...(gitRunner ? { gitRunner } : {}) });
  const payload = JSON.stringify(model).replaceAll("<", "\\u003c");
  const html = template.replace("__REPORT_DATA__", () => payload).replace("__RENDERER__", () => String(renderInto));
  const target = path.isAbsolute(out) ? out : path.resolve(root, out);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
  return target;
}

export function main(argv = process.argv.slice(2)) {
  let root = REPO_ROOT; let out = DEFAULT_OUT; let packets;
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === "--root" && argv[index + 1]) root = path.resolve(argv[++index]);
    else if (flag === "--out" && argv[index + 1]) out = argv[++index];
    else if (flag === "--packets" && argv[index + 1]) packets = argv[++index];
    else { console.error("Usage: product-report.mjs [--root <dir>] [--out <file>] [--packets <dir>]"); return 2; }
  }
  if (packets) return generatePackets({ root, dir: packets }).then((files) => { console.log(`Wrote ${files.length} packet(s)`); return 0; }).catch((error) => { console.error(error.message); return 1; });
  return generateReport({ root, out }).then((file) => { console.log(`Wrote ${file}`); return 0; }).catch((error) => { console.error(error.message); return 1; });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
