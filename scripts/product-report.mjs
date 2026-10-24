#!/usr/bin/env node
/**
 * @module scripts/product-report.mjs
 * @purpose Builds a deterministic HTML product ledger from the requirements tree, deliverable checks, HANDOFF asks, and repository provenance.
 * @inputs REQUIREMENTS.md, its parsed artifact registry, its ledger folder's HEAD tree and history through an injected git runner, HANDOFF.md, an optional assessment store, the HTML template, repository root, output or packet directory, runtime data, suite records, and the build ledger.
 * @outputs A complete product ledger HTML file with shared deliverable lines, per-deliverable claims, artifact blocks and class-bound ages, feature artifact lists, ordered stage and constraint metadata, deterministic assessment packets, an exported report model and renderer, or assessment-store problem strings.
 * @effects disk (reads sources and stores, atomically writes the report or writes packets), process (queries git and reports CLI errors).
 * @errors Refuses malformed ledgers, asks or stores, required git provenance failures, and output failures with named diagnostics; optional age failures render their reason.
 */
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { readFile, writeFile, mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ARTIFACT_AGE_TABLE, artifactAgeTableKey, artifactRegistry, deliverableClaims, deliverableCodeState, deliverableReport } from "./deliverables.mjs";
import { checkTree, descendants, ledgerReadProblem, parseLedger, readRequirementRows } from "./requirements-tree.mjs";
import { WHITESPACE, citesOf } from "./requirements-trace.mjs";
import { splitOpenSection } from "../packages/nana-pack/lib/handoff-asks.mjs";
import { dataPath, hashFile, loadRuntime, runtimeEntryChanged } from "../packages/nana-pack/lib/runtime-map.mjs";
import { NOT_COUNTED } from "../packages/nana-pack/lib/runtime-map-config.mjs";
import { GITHUB_REMOTE } from "../packages/nana-pack/lib/land-ci.mjs";
import { TIP_DIGITS } from "../packages/nana-pack/lib/land-config.mjs";
import { MAX_GIT_BUFFER } from "./requirements-moved.mjs";
import { gitCommonDir, readSuiteRecords } from "../packages/nana-pack/lib/suite-records.mjs";
import { buildRecordsPath, readBuildLedger } from "../packages/nana-pack/lib/build-records.mjs";
import { globMatch } from "../apps/bench/lib/checkers.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "product-report/template.html");
export const DEFAULT_OUT = "docs/product-report/out/nana-pi-product-ledger.html";
// chosen (R-2740): beside the other clone-shared machine-local stores.
export const LAND_REPORT_SUBPATH = "nana/product-report.html";
const normalise = (text) => text.replace(/^\ufeff/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.replace(new RegExp(`[${WHITESPACE}]+$`, "gu"), "")).join("\n");
const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};
const STORE_STATUSES = new Set(["implemented", "untested", "violated", "planned", "retired"]);
const FEATURE_STATUS = /^(?:proposed|active|frozen \(\S(?:.*\S)?\)|retired \(\S(?:.*\S)?\))$/;
const RAIL_ID = /^[RG]-(?:[0-9]{3}|[1-9][0-9]{3})$/;
// Contract (R-2542): exact Product-view deliverable marks and unnamed-artifact note.
export const NOT_MADE_BY_CODE = "not made by code";
export const NOT_READ_BY_CODE = "not read by code";
export const NO_ARTIFACT_NAMED = "artifact not written down";
// Contract (R-2791): the exact reason prefix for artifact classes intentionally excluded from age measurement.
export const AGE_NOT_MEASURED_PREFIX = "age not measured: ";
// Contract (R-2544, R-2545): exact Product-view age labels and reasons.
export const LAST_CHANGED_PREFIX = "last changed";
export const MEASURED_AT_TIP_PREFIX = "measured at tip";
export const AGE_UNKNOWN_PREFIX = "age unknown: ";
export const NOT_TRACKED_AT_HEAD = "not tracked at HEAD";
export const SHALLOW_CLONE_REASON = "shallow clone";
export const GIT_HISTORY_FAILURE_REASON = "git could not read the history";
export const RUNTIME_NO_TIP_OR_TIME = "the runtime data records no tip or time";
export const RUNTIME_TIME_INVALID = "the runtime data's time does not parse";
export const TIP_NOT_IN_HISTORY_SUFFIX = " is not in HEAD's history";
// Contract (R-2744, R-2745): exact clone-shared record age labels and reasons.
export const RECORD_AT_TIP_PREFIX = "newest record at tip";
export const NO_READABLE_RECORD = "no readable record";
export const NO_RECORD_IN_HISTORY = "no record names a commit in HEAD's history";
export const BUILD_LEDGER_UNREADABLE = "the build ledger cannot be read";
// Unit: elapsed epoch seconds in one whole day.
export const SECONDS_PER_DAY = 24 * 60 * 60;
export const ARTIFACT_WALK_FLAGS = Object.freeze(["-z", "-c", "--name-only", "--relative", "--root", "--no-renames", "--no-show-signature"]);
// contract (R-1511): the prefix every cited-test file link is built from.
const GITHUB_BLOB_PREFIX = "https://github.com/";
const exactKeys = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
const fingerprint = (row) => createHash("sha256").update(JSON.stringify([row.id, row.requirement, row.status])).digest("hex");

// contract (R-1650, R-1651): the two recorded labels the not-passed rule reads. Module scope, and
// only buildReport (never renderInto, which runs through String()) reads them.
const PASS_LABEL = "PASS";
const FAIL_LABEL = "FAIL";

// The unique files a row's evidence cites, in citation order (R-1650..R-1655: the rule works on a
// row's unique cited files, never one entry per cited test).
function uniqueFilesOf(evidence) {
  const files = [];
  for (const { file } of citedTestsOf(evidence)) if (!files.includes(file)) files.push(file);
  return files;
}

// R-1650/R-1651/R-1652/R-1653: did not pass when any cited file's recorded label is FAIL, or when
// every cited file has a recorded run and none is PASS. No cited file never counts (R-1650). This
// reads `runState.label` only — `changed` never enters the decision either way (R-1654).
function didNotPass(runStates) {
  if (!runStates.length) return false;
  if (runStates.some((state) => state?.label === FAIL_LABEL)) return true;
  return runStates.every((state) => state && state.label !== PASS_LABEL);
}

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

function gitResult(gitRunner, root, args, options = {}) {
  return gitRunner(args, {
    ...options,
    cwd: root,
    encoding: options.encoding ?? "utf8",
    env: { ...process.env, ...(options.env ?? {}), GIT_OPTIONAL_LOCKS: "0" },
    maxBuffer: MAX_GIT_BUFFER,
  });
}

function git(gitRunner, root, args) {
  const result = gitResult(gitRunner, root, args);
  if (result?.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result?.stderr?.trim() || "unknown git error"}`);
  return String(result.stdout ?? "").trim();
}

const plural = (amount, singular) => `${amount} ${singular}${amount === 1 ? "" : "s"}`;
const unknownAge = (reason) => `${AGE_UNKNOWN_PREFIX}${reason}`;
const wholeDays = (laterEpoch, earlierEpoch) => Math.max(0, Math.floor((laterEpoch - earlierEpoch) / SECONDS_PER_DAY));

function parseHistory(text) {
  const tokens = String(text ?? "").split("\0");
  const records = [];
  for (let index = 0; index < tokens.length;) {
    if (tokens[index] !== "NANA_AGE_RECORD") { index++; continue; }
    const hash = tokens[index + 1] ?? "";
    const parents = (tokens[index + 2] ?? "").split(" ").filter(Boolean);
    const epoch = Number(tokens[index + 3]);
    const subject = tokens[index + 4] ?? "";
    index += 5;
    const files = [];
    let first = true;
    while (index < tokens.length && tokens[index] !== "NANA_AGE_RECORD") {
      let file = tokens[index++];
      if (!file) continue;
      if (first) file = file.replace(/^\n/, "");
      first = false;
      if (file) files.push(file);
    }
    records.push({ hash, parents, epoch, subject, files });
  }
  return records;
}

function formatArtifactAge(record, commits, headEpoch) {
  return `${LAST_CHANGED_PREFIX} ${plural(commits, "commit")} and ${plural(wholeDays(headEpoch, record.epoch), "day")} before HEAD by ${record.hash.slice(0, TIP_DIGITS)}: ${record.subject}`;
}

function formatRuntimeAge(data, commits, headEpoch, measured) {
  const dirty = Number.isInteger(data.dirty) && data.dirty > 0 ? ` with ${plural(data.dirty, "uncommitted file")}` : "";
  return `${MEASURED_AT_TIP_PREFIX} ${data.tip.slice(0, TIP_DIGITS)} on ${measured.toISOString()}${dirty}, ${plural(commits, "commit")} and ${plural(wholeDays(headEpoch, measured.getTime() / 1000), "day")} before HEAD`;
}

function formatRecordAge(record, commits, headEpoch) {
  const recorded = new Date(record.time);
  return `${RECORD_AT_TIP_PREFIX} ${record.tip.slice(0, TIP_DIGITS)} on ${recorded.toISOString()}, ${plural(commits, "commit")} and ${plural(wholeDays(headEpoch, recorded.getTime() / 1000), "day")} before HEAD`;
}

const STORE_READERS_BY_WRITER = Object.freeze({
  "scripts/runtime-measure.mjs": () => ({ runtime: true }),
  "packages/nana-pack/lib/suite-records.mjs": ({ root, runGit }) => ({ records: readSuiteRecords({ root, runGit }).map((record) => ({ tip: record.tip, time: record.recordedAt })) }),
  "packages/nana-pack/lib/build-records.mjs": ({ commonDir }) => {
    try {
      const ledger = readBuildLedger(buildRecordsPath(commonDir));
      return { records: [...ledger.records].reverse().filter((record) => record.kind === "end").map((record) => ({ tip: record.tip, time: record.endedAt })) };
    } catch { return { records: [], problem: BUILD_LEDGER_UNREADABLE }; }
  },
});

// Contract (R-2793): the page has exactly one reader key for each sealed age-table key.
export const STORE_READERS_BY_KEY = Object.freeze(Object.fromEntries(Object.entries(ARTIFACT_AGE_TABLE).map(([key, binding]) => [key, STORE_READERS_BY_WRITER[binding.writer]])));
const RUNTIME_AGE_KEY = Object.keys(ARTIFACT_AGE_TABLE).find((key) => ARTIFACT_AGE_TABLE[key].writer === "scripts/runtime-measure.mjs");

function recordStoreEntries(key, { root, commonDir, runGit }) {
  return STORE_READERS_BY_KEY[key]?.({ root, commonDir, runGit }) ?? { records: [] };
}

function artifactAges({ artifacts, root, gitRunner, trackedPaths, runtimeData, runtimeReason }) {
  const ages = new Map();
  if (!artifacts.length) return ages;
  const run = (args, options) => gitResult(gitRunner, root, args, options);
  const ageable = [];
  for (const artifact of artifacts) {
    if (artifact.className === "tracked") ageable.push(artifact);
    else if (artifact.className === "clone store") {
      const tableKey = artifactAgeTableKey(artifact);
      if (tableKey) ageable.push({ ...artifact, tableKey });
      else ages.set(artifact.key, `${AGE_NOT_MEASURED_PREFIX}${artifact.className}`);
    } else ages.set(artifact.key, `${AGE_NOT_MEASURED_PREFIX}${artifact.className}`);
  }
  if (!ageable.length) return ages;
  const historyUnknown = () => { for (const artifact of ageable) ages.set(artifact.key, unknownAge(GIT_HISTORY_FAILURE_REASON)); };
  let shallowResult;
  try { shallowResult = run(["rev-parse", "--is-shallow-repository"]); } catch { shallowResult = null; }
  if (!shallowResult || shallowResult.status !== 0) { historyUnknown(); return ages; }
  const shallow = String(shallowResult.stdout ?? "").trim() === "true";
  let headResult;
  try { headResult = run(["show", "-s", "--no-show-signature", "--format=%ct", "HEAD"]); } catch { headResult = null; }
  const headEpoch = Number(String(headResult?.stdout ?? "").trim());
  if (!headResult || headResult.status !== 0 || !Number.isFinite(headEpoch)) { historyUnknown(); return ages; }

  const trackedArtifacts = ageable.filter((artifact) => artifact.className === "tracked");
  const matches = (artifact, file) => {
    const location = artifact.location.endsWith("/") ? artifact.location.slice(0, -1) : artifact.location;
    if (!artifact.plain && /[*?]/.test(location)) return globMatch(location, file);
    return file === location || file.startsWith(`${location}/`);
  };
  if (trackedArtifacts.length) {
    if (trackedPaths === null) {
      for (const artifact of trackedArtifacts) ages.set(artifact.key, unknownAge(GIT_HISTORY_FAILURE_REASON));
    } else if (shallow) {
      for (const artifact of trackedArtifacts) ages.set(artifact.key, unknownAge(SHALLOW_CLONE_REASON));
    } else {
      let walk;
      try { walk = run(["log", ...ARTIFACT_WALK_FLAGS, "--format=NANA_AGE_RECORD%x00%H%x00%P%x00%ct%x00%s%x00", "--"]); }
      catch { walk = null; }
      if (!walk || walk.status !== 0 || walk.error) {
        for (const artifact of trackedArtifacts) ages.set(artifact.key, unknownAge(GIT_HISTORY_FAILURE_REASON));
      } else {
        const records = parseHistory(walk.stdout);
        for (const artifact of trackedArtifacts) {
          if (!trackedPaths.some((file) => matches(artifact, file))) { ages.set(artifact.key, unknownAge(NOT_TRACKED_AT_HEAD)); continue; }
          const record = records.find((entry) => entry.files.some((file) => matches(artifact, file)));
          if (!record || !Number.isFinite(record.epoch)) { ages.set(artifact.key, unknownAge(GIT_HISTORY_FAILURE_REASON)); continue; }
          let count;
          try { count = run(["rev-list", "--count", `${record.hash}..HEAD`]); } catch { count = null; }
          const commits = Number(String(count?.stdout ?? "").trim());
          ages.set(artifact.key, count?.status === 0 && Number.isInteger(commits) ? formatArtifactAge(record, commits, headEpoch) : unknownAge(GIT_HISTORY_FAILURE_REASON));
        }
      }
    }
  }

  const cloneArtifacts = ageable.filter((artifact) => artifact.className === "clone store");
  const runtimeArtifacts = cloneArtifacts.filter((artifact) => artifact.tableKey === RUNTIME_AGE_KEY);
  const recordArtifacts = cloneArtifacts.filter((artifact) => !runtimeArtifacts.includes(artifact));
  if (recordArtifacts.length) {
    if (shallow) {
      for (const artifact of recordArtifacts) ages.set(artifact.key, unknownAge(SHALLOW_CLONE_REASON));
    } else {
      let historyResult;
      try { historyResult = run(["rev-list", "HEAD"]); } catch { historyResult = null; }
      if (!historyResult || historyResult.status !== 0 || historyResult.error) {
        for (const artifact of recordArtifacts) ages.set(artifact.key, unknownAge(GIT_HISTORY_FAILURE_REASON));
      } else {
        const history = new Set(String(historyResult.stdout ?? "").trim().split(/\r?\n/).filter(Boolean));
        const runGit = (cwd, args) => gitResult(gitRunner, cwd, args);
        let commonDir = null;
        try { commonDir = gitCommonDir(root, { runGit }); } catch { /* each reader reports its own bounded absence below */ }
        for (const artifact of recordArtifacts) {
          const loaded = recordStoreEntries(artifact.tableKey, { root, commonDir, runGit });
          if (loaded.problem) { ages.set(artifact.key, unknownAge(loaded.problem)); continue; }
          const readable = loaded.records.filter((record) => typeof record.tip === "string" && record.tip && typeof record.time === "string" && Number.isFinite(Date.parse(record.time)));
          if (!readable.length) { ages.set(artifact.key, unknownAge(NO_READABLE_RECORD)); continue; }
          const newest = readable.find((record) => history.has(record.tip));
          if (!newest) { ages.set(artifact.key, unknownAge(NO_RECORD_IN_HISTORY)); continue; }
          let count;
          try { count = run(["rev-list", "--count", `${newest.tip}..HEAD`]); } catch { count = null; }
          const commits = Number(String(count?.stdout ?? "").trim());
          ages.set(artifact.key, count?.status === 0 && Number.isInteger(commits) ? formatRecordAge(newest, commits, headEpoch) : unknownAge(GIT_HISTORY_FAILURE_REASON));
        }
      }
    }
  }

  for (const artifact of runtimeArtifacts) {
    if (!runtimeData) ages.set(artifact.key, unknownAge(runtimeReason));
    else if (typeof runtimeData.tip !== "string" || !runtimeData.tip || typeof runtimeData.measuredAt !== "string" || !runtimeData.measuredAt) ages.set(artifact.key, unknownAge(RUNTIME_NO_TIP_OR_TIME));
    else {
      const measured = new Date(runtimeData.measuredAt);
      if (!Number.isFinite(measured.getTime())) ages.set(artifact.key, unknownAge(RUNTIME_TIME_INVALID));
      else if (shallow) ages.set(artifact.key, unknownAge(SHALLOW_CLONE_REASON));
      else {
        let ancestor;
        try { ancestor = run(["merge-base", "--is-ancestor", runtimeData.tip, "HEAD"]); } catch { ancestor = null; }
        if (!ancestor || ancestor.status !== 0) ages.set(artifact.key, unknownAge(`tip ${runtimeData.tip.slice(0, TIP_DIGITS)}${TIP_NOT_IN_HISTORY_SUFFIX}`));
        else {
          let count;
          try { count = run(["rev-list", "--count", `${runtimeData.tip}..HEAD`]); } catch { count = null; }
          const commits = Number(String(count?.stdout ?? "").trim());
          ages.set(artifact.key, count?.status === 0 && Number.isInteger(commits) ? formatRuntimeAge(runtimeData, commits, headEpoch, measured) : unknownAge(GIT_HISTORY_FAILURE_REASON));
        }
      }
    }
  }
  return ages;
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
  if (view === "product") {
    for (const line of model.deliverableLines ?? []) paragraph(root, "", line, "deliverable-report-line");
    for (const cap of model.capabilities) {
    const card = el("article", undefined, root); el("h3", `${cap.id} · ${cap.label}`, card); paragraph(card, "Purpose", cap.purpose); paragraph(card, "Outcome", cap.outcome);
    if (cap.kind) paragraph(card, "Kind", cap.kind);
    if (!cap.retired && cap.kind === "product") {
      if (cap.needs.length) paragraph(card, "Needs", cap.needs.map((item) => `${item.id} · ${item.label}`).join(", "));
      paragraph(card, "Deliverables", "");
      const list = el("ul", undefined, card);
      for (const deliverable of cap.deliverables) {
        const item = el("li", undefined, list); cls(item, `deliverable${deliverable.gap ? " gap" : ""}`);
        text(item, `${deliverable.id} · ${deliverable.status}${deliverable.gap ? " · gap" : ""} · Home: `);
        featureLink(item, deliverable.home.id, `${deliverable.home.id} · ${deliverable.home.label}`);
        if (deliverable.claims.length) {
          const claims = el("ul", undefined, item); cls(claims, "deliverable-claims");
          for (const claim of deliverable.claims) { const line = el("li", undefined, claims); text(line, `${claim.label}: ${claim.text}`); }
        }
        for (const mark of deliverable.marks) paragraph(item, "", mark, "deliverable-mark");
        for (const artifactLine of deliverable.artifactLines) paragraph(item, "", artifactLine, "deliverable-artifact");
      }
    }
    if (!cap.retired && cap.kind === "constraint") {
      paragraph(card, "Binds", "");
      const list = el("ul", undefined, card);
      for (const bound of cap.binds) { const item = el("li", undefined, list); cls(item, `bound${bound.gap ? " gap" : ""}`); text(item, `${bound.id} · ${bound.label} · ${bound.gap ? "gap" : bound.rows.join(", ")}`); }
    }
    if (cap.artifactFeatures) {
      paragraph(card, cap.artifactFeatures.label, "");
      const list = el("ul", undefined, card); cls(list, "capability-artifacts");
      for (const value of cap.artifactFeatures.items) { const item = el("li", undefined, list); text(item, value); }
    }
    if (cap.retired) paragraph(card, "Retired", `replaced by ${cap.successors.map((item) => `${item.id} · ${item.label}`).join(", ")}`);
    for (const id of cap.features) { const item = model.features.find((f) => f.id === id); if (item) { const line = el("p", undefined, card); text(line, "Feature: "); featureLink(line, item.id, `${item.id} · ${item.label}`); countBar(card, item); } }
    }
  }
  if (view === "features") for (const item of model.features) { const card = el("article", undefined, root); const heading = el("h3", undefined, card); featureLink(heading, item.id, `${item.id} · ${item.label}`); paragraph(card, "Purpose", item.purpose); paragraph(card, "Status", item.status); countBar(card, item); paragraph(card, "Assessment", item.assessmentState); paragraph(card, "Shared in", item.shared.join(", ") || "None"); const shareLine = el("p", undefined, card); text(shareLine, "Shared by: "); if (item.sharedBy.length) item.sharedBy.forEach((id, index) => { if (index) text(shareLine, ", "); featureLink(shareLine, id); }); else text(shareLine, "None"); }
  if (view === "detail" && feature) {
    const status = el("span", feature.status, viewHeading); cls(status, "feature-status");
    paragraph(root, "Purpose", feature.purpose); paragraph(root, "Capability", `${feature.capability.id} · ${feature.capability.label}${feature.capability.kind ? ` · ${feature.capability.kind}` : ""}`); const badge = el("p", feature.assessmentState === "current" ? "current — matches the stamped ledger, not rechecked against later decisions" : feature.assessmentState, root); cls(badge, `assessment-badge state-${feature.assessmentState.replaceAll(" ", "-")}`);
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
  if (view === "issues") {
    if (model.runtime?.legend) paragraph(root, "", model.runtime.legend);
    for (const item of model.violated) row(root, item);
    // contract (R-1655): declared inside renderInto, which runs through String() on the page —
    // a module-scope constant here would throw there.
    const notPassedHeading = `Implemented rows that did not pass in this clone's last measured run: ${model.notPassed.length}`;
    const notPassedNote = "A row appears here when a cited file's last recorded run failed, or when every cited file's last recorded run skipped or failed. A file with no recorded run counts neither way.";
    el("h3", notPassedHeading, root);
    paragraph(root, "", notPassedNote);
    for (const item of model.notPassed) row(root, item);
  }
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
  const reportGitRunner = (args, options = {}) => gitResult(gitRunner, root, args, options);
  const deliverableResult = deliverableReport(parsed, root, reportGitRunner);
  const deliverableLines = deliverableResult.lines;
  let ledgerPrefix = "";
  try {
    const prefix = reportGitRunner(["rev-parse", "--show-prefix"]);
    if (prefix?.status === 0) ledgerPrefix = String(prefix.stdout ?? "").trim();
  } catch { /* an unreadable prefix leaves age paths unknown rather than refusing the page */ }
  const pathsCarryPrefix = ledgerPrefix && deliverableResult.trackedPaths?.some((file) => file.startsWith(ledgerPrefix));
  const trackedPaths = deliverableResult.trackedPaths === null ? null : deliverableResult.trackedPaths
    .filter((file) => !pathsCarryPrefix || file.startsWith(ledgerPrefix))
    .map((file) => pathsCarryPrefix ? file.slice(ledgerPrefix.length) : file);
  const rows = readRequirementRows(parsed);
  const handoff = await readFile(path.join(root, "HANDOFF.md"), "utf8");
  const asks = splitOpenSection(handoff);
  for (const ask of asks) {
    if (!ask.tag || !ask.title || !validDate(ask.tag.since) || ask.tag.kind !== ask.title.kind || ask.tag.since !== ask.title.since) {
      throw new Error(`HANDOFF.md line ${ask.line}: malformed Open for the owner entry`);
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
    const originResult = reportGitRunner(["remote", "get-url", "origin"]);
    if (originResult?.status === 0) {
      const match = GITHUB_REMOTE.exec(String(originResult.stdout ?? "").trim());
      if (match) githubRepo = { owner: match[1], repo: match[2] };
    }
  } catch { /* no origin, or a runner that throws, is not an error (R-1511) */ }

  // R-1512/R-1514: dataPath calls its git hook with {cwd} only (no encoding), so the hook is
  // wrapped here to add it; a dataPath throw (no git-common-dir, e.g. not a git checkout at all)
  // counts as no runtime data, same as a missing, unreadable or wrong-schema file.
  const runtimeRunner = (args, options = {}) => gitResult(gitRunner, options.cwd ?? root, args, options);
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
    const changed = runtimeEntryChanged(runtimeData, file, { hashOf });
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
  const capabilityHeadings = parsed.headings.filter((heading) => heading.id.startsWith("CAP-"));
  const capabilityById = new Map(capabilityHeadings.map((capability) => [capability.id, capability]));
  const registry = artifactRegistry(parsed, null);
  const claimsByCapability = new Map(capabilityHeadings.map((capability) => [capability, deliverableClaims(parsed, capability, registry)]));
  const artifactDescriptors = new Map();
  for (const claims of claimsByCapability.values()) {
    for (const rowClaims of claims.values()) for (const claim of rowClaims) {
      for (const id of claim.registryIds) {
        const entry = registry.byId.get(id);
        if (entry?.live) artifactDescriptors.set(`registry:${id}`, { ...entry, key: `registry:${id}` });
      }
      if (claim.artifact) artifactDescriptors.set(`path:${claim.artifact}`, { key: `path:${claim.artifact}`, className: "tracked", location: claim.artifact, plain: true });
    }
  }
  const ages = artifactAges({ artifacts: [...artifactDescriptors.values()], root, gitRunner, trackedPaths, runtimeData, runtimeReason });
  const fieldValues = (capability, field) => (capability.capabilityFields?.[field] ?? []).flatMap(({ value }) => field === "Kind" ? [value] : value.split(/,\s*/));
  const featureHeadings = parsed.headings.filter((heading) => heading.id.startsWith("FEAT-"));
  const featureCapability = (feature) => { for (let heading = feature.parent; heading; heading = heading.parent) if (heading.id.startsWith("CAP-")) return heading; return null; };
  const features = featureHeadings.map((feature) => {
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
    const capability = featureCapability(feature);
    const kind = fieldValues(capability, "Kind")[0] ?? null;
    return { id: feature.id, label: feature.label, purpose: feature.purpose, status: feature.status, capability: { id: capability.id, label: capability.label, kind }, assessmentState, assessment, differences, counts, ownRowIds: ownRows.map((row) => row.id), shared: sharedRows.map((row) => row.id), sharedBy: outgoing, rows: allRows.map((row) => ({ id: row.id, requirement: row.requirement, status: row.status, evidence: row.evidence, mark: ownRows.includes(row) ? "own" : "shared", tests: testsOf(row.evidence) })) };
  });
  const capabilityLabel = (id) => ({ id, label: capabilityById.get(id)?.label ?? id });
  const featureLabel = (feature) => ({ id: feature.id, label: feature.label });
  const orderedIds = (claims, kind) => {
    const seen = new Set(); const ids = [];
    for (const claim of claims) if (claim.label === "Made by" && claim.registryKind === kind) {
      for (const id of [...claim.registryIds].sort()) if (!seen.has(id)) { seen.add(id); ids.push(id); }
    }
    return ids;
  };
  const artifactLinesFor = (claims) => {
    const directIds = orderedIds(claims, "artifact");
    const directSet = new Set(directIds);
    const builtIds = orderedIds(claims, "built from").filter((id) => !directSet.has(id));
    const lines = directIds.map((id) => {
      const entry = registry.byId.get(id);
      return entry?.live ? `artifact ${id} · ${entry.name} · ${ages.get(`registry:${id}`) ?? unknownAge(GIT_HISTORY_FAILURE_REASON)}` : `artifact ${id} · no live entry`;
    });
    if (builtIds.length) {
      const parts = builtIds.map((id) => {
        const entry = registry.byId.get(id);
        return entry?.live ? `${id} · ${entry.name} · ${ages.get(`registry:${id}`) ?? unknownAge(GIT_HISTORY_FAILURE_REASON)}` : `${id} · no live entry`;
      });
      lines.push(`${directIds.length ? "" : "output only, "}built from ${parts.join(", ")}`);
    }
    for (const claim of claims) if (claim.label === "Made by" && claim.artifact) lines.push(`artifact ${claim.artifact} · ${ages.get(`path:${claim.artifact}`) ?? unknownAge(GIT_HISTORY_FAILURE_REASON)}`);
    return lines.length ? lines : [NO_ARTIFACT_NAMED];
  };
  const liveFeature = (feature) => feature.status === "active" || feature.status.startsWith("frozen (");
  const featureArtifactItem = (feature) => {
    const entries = registry.entries.filter((entry) => entry.live && entry.featureId === feature.id);
    const detail = registry.fieldLineCount === 0 ? "no artifact registry" : entries.length ? entries.map((entry) => `${entry.id} · ${entry.name}`).join(", ") : "makes no registered artifact";
    return `${feature.id} · ${feature.label}: ${detail}`;
  };
  const capabilities = capabilityHeadings.map((capability) => {
    const kind = fieldValues(capability, "Kind")[0] ?? null;
    const retired = fieldValues(capability, "Retired").length > 0;
    const capabilityFeatures = featureHeadings.filter((feature) => featureCapability(feature) === capability);
    const claimsByRow = claimsByCapability.get(capability);
    const deliverables = fieldValues(capability, "Deliverables").map((id) => {
      const row = rows.find((candidate) => candidate.id === id);
      let homeHeading = row?.heading ?? null;
      while (homeHeading && !homeHeading.id.startsWith("FEAT-")) homeHeading = homeHeading.parent;
      const homeFeature = features.find((feature) => feature.id === homeHeading?.id);
      const rowClaims = claimsByRow.get(id) ?? [];
      const codeState = deliverableCodeState(rowClaims);
      const marks = [...(!codeState.madeByCode ? [NOT_MADE_BY_CODE] : []), ...(!codeState.readByCode ? [NOT_READ_BY_CODE] : [])];
      return { id, status: row.status, gap: row.status !== "implemented", home: featureLabel(homeFeature), claims: rowClaims.map(({ label, text }) => ({ label, text })), marks, artifactLines: artifactLinesFor(rowClaims) };
    });
    const constraintRows = rows.filter((row) => descendants(parsed, capability).includes(row.heading));
    const binds = fieldValues(capability, "Binds").map((id) => {
      const boundCapability = capabilityById.get(id);
      const receivingFeatures = featureHeadings.filter((feature) => featureCapability(feature) === boundCapability && (feature.status === "active" || feature.status.startsWith("frozen (")));
      const coveringRows = constraintRows.filter((row) => row.status === "implemented" && receivingFeatures.some((feature) => feature.alsoApplies.includes(row.id))).map((row) => row.id);
      return { ...capabilityLabel(id), rows: coveringRows, gap: coveringRows.length === 0 };
    });
    let artifactFeatures = null;
    if (!retired && kind === "product") {
      const deliverableSet = new Set(fieldValues(capability, "Deliverables"));
      artifactFeatures = { label: "Features with no deliverable", items: features.filter((feature) => feature.capability.id === capability.id && liveFeature(feature) && !feature.ownRowIds.some((id) => deliverableSet.has(id))).map(featureArtifactItem) };
    } else if (!retired && kind === "constraint") {
      artifactFeatures = { label: "Artifacts of this constraint's features", items: features.filter((feature) => feature.capability.id === capability.id && liveFeature(feature)).map(featureArtifactItem) };
    }
    return { id: capability.id, label: capability.label, purpose: capability.purpose, outcome: capability.outcome, kind, retired, successors: fieldValues(capability, "Retired").map(capabilityLabel), needs: fieldValues(capability, "Needs").map(capabilityLabel), deliverables, binds, artifactFeatures, features: capabilityFeatures.map((feature) => feature.id) };
  }).sort((left, right) => {
    const group = (capability) => capability.retired ? 3 : capability.kind === "product" ? 0 : capability.kind === null ? 1 : 2;
    return group(left) - group(right);
  });
  const violated = rows.filter((row) => row.status === "violated");
  // R-1650..R-1655: implemented rows this clone's last measured run did not pass, in ledger order
  // and without duplicates (rows is the ledger's own flat, already-deduplicated row list).
  const notPassed = rows.filter((row) => row.status === "implemented" && didNotPass(uniqueFilesOf(row.evidence).map(runStateOf)));
  // R-1512/R-1514 legend: the label is per file (not per cited test), what NOT_COUNTED excludes,
  // and — only when there is no runtime data at all — the reason nothing is recorded anywhere.
  const legend = `Each file's label is reported once, not per cited test — a run covering a file can hide a skipped check inside it. ${NOT_COUNTED}.${runtimeData ? "" : ` No recorded run anywhere in this report: ${runtimeReason}.`}`;
  const model = { commit, date, clean: !dirty, deliverableLines, capabilities, features, violated: violated.map((row) => ({ id: row.id, requirement: row.requirement, status: row.status, evidence: row.evidence, tests: testsOf(row.evidence) })), notPassed: notPassed.map((row) => ({ id: row.id, requirement: row.requirement, status: row.status, evidence: row.evidence, tests: testsOf(row.evidence) })), asks: asks.map(({ tag, title }) => ({ kind: tag.kind, since: tag.since, title: title.title, body: title.body })), questions: parseOpenQuestions(ledgerText), files: Object.fromEntries(files), runtime: { legend } };
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
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.tmp-${process.pid}-${randomUUID()}`);
  try {
    await writeFile(temporary, html, { encoding: "utf8", flag: "wx" });
    await rename(temporary, target);
  } catch (error) {
    try { await rm(temporary, { force: true }); } catch {}
    throw error;
  }
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
if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = await main();
