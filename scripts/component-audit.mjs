#!/usr/bin/env node
/**
 * @module scripts/component-audit.mjs
 * @purpose Check the hand-audited component model and derive contract data, git activity, asks and coverage.
 * @inputs Repo root, tracked audit and contract JSON, REQUIREMENTS.md, mapped code graph, git history and optional output path.
 * @outputs Check diagnostics, report-only staleness and coverage lines, contract-shaped JSON, or planner-shaped ask blocks.
 * @effects disk (reads repository data and optionally writes --out), process (read-only bounded git queries and CLI output).
 * @errors Invalid source, paths, IDs, anchors or contract data exit 1; malformed CLI options exit 2.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ASK_LABELS } from "../packages/nana-pack/lib/ask-shape.mjs";
import { trackedAtHead } from "../packages/nana-pack/lib/brief-precedent.mjs";
import { MAX_GIT_BUFFER, defaultGit } from "./requirements-moved.mjs";
import { parseLedger, readRequirementRows } from "./requirements-tree.mjs";
import { repoGraph } from "./code-map.mjs";
import { readComponentContract, checkComponentData } from "./component-contract.mjs";
import { ACTIVITY_WINDOW_DAYS, AUDIT_PATH, CONTRACT_PATH, STALE_COMMIT_LIMIT } from "./component-audit-config.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HAND_FIELDS = ["contract", "version", "project", "components"];
const SOURCE_COMPONENT_FIELDS = ["id", "name", "metaphor", "kind", "parts", "features", "status", "gap", "ask", "evidence", "auditedAt", "anchors"];
const ASK_ORDER = ["question", "default", "gains", "cost", "otherwise"];
const invoke = (gitRunner, root, args) => {
  try { return gitRunner(root, args, { cwd: root, encoding: "utf8", maxBuffer: MAX_GIT_BUFFER, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } }); }
  catch (error) { return { status: 1, stderr: error.message, stdout: "" }; }
};
const gitText = (gitRunner, root, args) => {
  const result = invoke(gitRunner, root, args);
  return result?.status === 0 && !result.error ? String(result.stdout ?? "").trim() : null;
};
const isRepoPath = (value) => typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes("..");
const validDate = (value) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00Z`); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value; };
const validMeasuredAnchor = (value) => {
  const match = /^measured (\d{4}-\d{2}-\d{2}): (.+)$/.exec(value);
  if (!match || !validDate(match[1])) return false;
  return /^(?:\d[\d,]*(?: entries| characters| character|[- ]character budget)?)(?:; (?:about )?\d[\d,]*(?: entries| characters| character|[- ]character budget)?)*$/.test(match[2]);
};
const contains = (part, file) => part.endsWith("/") ? file.startsWith(part) : file === part || file.startsWith(`${part}/`);

function featuresAndRows(ledger) {
  const parsed = parseLedger(ledger);
  const rows = readRequirementRows(parsed);
  const features = new Map(parsed.headings.filter((h) => h.id?.startsWith("FEAT-")).map((h) => [h.id, h]));
  const byId = new Map();
  for (const feature of features.values()) {
    const own = rows.filter((row) => {
      let heading = row.heading;
      while (heading && !heading.id?.startsWith("FEAT-")) heading = heading.parent;
      return heading?.id === feature.id;
    });
    byId.set(feature.id, { id: feature.id, label: feature.label, rows: own.length, implemented: own.filter((row) => row.status === "implemented").length, statuses: own.map((row) => row.status) });
  }
  const ids = new Set([...rows.map((row) => row.id), ...parsed.headings.map((h) => h.id).filter(Boolean)]);
  return { features: byId, rows, ids, rowById: new Map(rows.map((r) => [r.id, r])), parsed };
}

function readKnownBugAnchor(root, anchor) {
  const match = /^(docs\/known-bugs\/[^:]+\.md):(\d+)$/.exec(anchor);
  if (!match) return { problem: "must be docs/known-bugs/<file>.md:<line>" };
  let lines;
  try { lines = readFileSync(path.join(root, match[1]), "utf8").split(/\r\n|\r|\n/); }
  catch { return { problem: `known-bug file ${match[1]} cannot be read` }; }
  const line = lines[Number(match[2]) - 1];
  if (!line?.startsWith("- ")) return { problem: `${match[1]}:${match[2]} does not point at a - line` };
  return { file: match[1] };
}

function checkSource(source, { root, known, tracked, head, gitRunner }) {
  const problems = [];
  const add = (component, rule, anchor = "") => problems.push(`${component.id}: ${rule}${anchor ? ` (${anchor})` : ""}`);
  if (!source || Object.keys(source).sort().join("\0") !== [...HAND_FIELDS].sort().join("\0")) return ["source: keys must exactly match contract, version, project and components"];
  if (source.contract !== "nana-components" || source.version !== 1 || source.project !== "nana-pi" || !Array.isArray(source.components) || !source.components.length) return ["source: contract, version, project or components are invalid"];
  const seen = new Set();
  for (const item of source.components) {
    if (!item || Object.keys(item).sort().join("\0") !== [...SOURCE_COMPONENT_FIELDS].sort().join("\0")) { problems.push(`component: keys must exactly match hand-source fields${item?.id ? ` (${item.id})` : ""}`); continue; }
    if (seen.has(item.id)) add(item, "duplicate component id", item.id); seen.add(item.id);
    if (!/^[a-z][a-z0-9-]*$/.test(item.id)) add(item, "invalid component id", item.id);
    const hash = /^[0-9a-f]{40}$/.test(item.auditedAt);
    if (!hash) add(item, "auditedAt must be a full commit hash", String(item.auditedAt));
    else if (head) {
      const ancestor = invoke(gitRunner, root, ["merge-base", "--is-ancestor", item.auditedAt, "HEAD"]);
      if (ancestor?.status !== 0) add(item, "auditedAt is not an ancestor of HEAD", item.auditedAt);
    }
    if (!Array.isArray(item.parts) || (!item.parts.length) !== (item.status === "absent")) add(item, "parts must be empty exactly for absent status", "parts");
    for (const cited of [...(Array.isArray(item.parts) ? item.parts : []), ...(Array.isArray(item.evidence) ? item.evidence : [])]) {
      if (isRepoPath(cited) && !/^(?:R-\d{3,4}|G-\d{3}|FEAT-\d{3}|CAP-\d{2})$/.test(cited) && tracked && !trackedAtHead(cited, tracked)) add(item, "cited path is not tracked at HEAD", cited);
    }
    for (const featureId of Array.isArray(item.features) ? item.features : []) {
      const feature = known.features.get(featureId);
      if (!feature) add(item, "unknown feature ID", featureId);
      else if (feature.statuses.some((status) => status === "planned" || status === "violated") && item.status === "sound") add(item, "sound component cites a planned or violated feature row", featureId);
    }
    for (const id of Array.isArray(item.evidence) ? item.evidence : []) {
      if (/^(?:R-\d{3,4}|G-\d{3}|FEAT-\d{3}|CAP-\d{2})$/.test(id) && !known.ids.has(id)) add(item, "unknown evidence ID", id);
    }
    const anchors = Array.isArray(item.anchors) ? item.anchors : [];
    for (const anchor of anchors) {
      let valid = false;
      if (typeof anchor === "string" && /^(?:R-\d{3,4}|G-\d{3}|FEAT-\d{3}|CAP-\d{2})$/.test(anchor)) {
        const row = known.rowById.get(anchor);
        valid = Boolean(row && ["planned", "untested", "violated"].includes(row.status));
        if (!valid) add(item, "row anchor must exist and be planned, untested or violated", anchor);
      } else if (typeof anchor === "string" && anchor.startsWith("docs/known-bugs/")) {
        const result = readKnownBugAnchor(root, anchor); valid = !result.problem && (!tracked || trackedAtHead(result.file, tracked));
        if (result.problem) add(item, "known-bug anchor must point at a - line", anchor);
        else if (tracked && !valid) add(item, "known-bug anchor is not tracked at HEAD", anchor);
      } else if (typeof anchor === "string" && anchor.startsWith("measured ")) {
        valid = validMeasuredAnchor(anchor);
        if (!valid) add(item, "measured anchor is malformed", anchor);
      } else add(item, "unknown or malformed anchor", String(anchor));
    }
    if (item.status === "sound" && anchors.length) add(item, "sound status must have no anchors", anchors[0]);
    if (item.status === "partial" && (!item.parts?.length || !anchors.length)) add(item, "partial status needs tracked parts and at least one anchor", anchors[0] ?? "anchors");
    if (item.status === "gap" && (!anchors.length || !item.ask)) add(item, "gap status needs an anchor and an ask", anchors[0] ?? "ask");
    if (item.status === "absent" && (item.parts?.length || !item.gap)) add(item, "absent status needs no parts and a gap sentence", "parts/gap");
  }
  return problems;
}

function countActivities(root, components, { gitRunner = defaultGit, windowDays = ACTIVITY_WINDOW_DAYS } = {}) {
  const result = new Map(components.map((item) => [item.id, { recentCommits: 0, inFlight: 0 }]));
  const epochText = gitText(gitRunner, root, ["show", "-s", "--format=%ct", "HEAD"]);
  const main = gitText(gitRunner, root, ["rev-parse", "--verify", "refs/heads/main^{commit}"]);
  if (!epochText) return result;
  if (!main) result.reportLines = ["activity: unmerged feature comparison skipped (local main unavailable)"];
  const since = new Date((Number(epochText) - windowDays * 86400) * 1000).toISOString();
  const history = gitText(gitRunner, root, ["log", "--first-parent", `--since=${since}`, "--format=NANA_COMMIT:%H", "--name-only", "HEAD"]) ?? "";
  let currentCommit = null;
  for (const line of history.split(/\r?\n/)) {
    const marker = /^NANA_COMMIT:([0-9a-f]{40})$/.exec(line);
    if (marker) { currentCommit = marker[1]; continue; }
    if (!line || !currentCommit) continue;
    for (const item of components) if (item.parts.some((part) => contains(part, line))) {
      const state = result.get(item.id);
      state.recentSet ??= new Set(); state.recentSet.add(currentCommit);
    }
  }
  const refs = main ? gitText(gitRunner, root, ["for-each-ref", "--format=%(refname)", "refs/remotes/origin/feat/"]) : null;
  for (const ref of (refs ?? "").split(/\r?\n/).filter(Boolean)) {
    const merged = invoke(gitRunner, root, ["merge-base", "--is-ancestor", ref, "refs/heads/main"]);
    if (merged?.status === 0) continue;
    const base = gitText(gitRunner, root, ["merge-base", ref, "refs/heads/main"]);
    if (!base) continue;
    const changed = gitText(gitRunner, root, ["diff", "--name-only", `${base}..${ref}`]) ?? "";
    for (const item of components) if (changed.split(/\r?\n/).some((file) => item.parts.some((part) => contains(part, file)))) result.get(item.id).inFlight++;
  }
  for (const state of result.values()) { state.recentCommits = state.recentSet?.size ?? 0; delete state.recentSet; }
  return result;
}

function staleLines(root, source, { gitRunner = defaultGit, staleLimit = STALE_COMMIT_LIMIT } = {}) {
  const head = gitText(gitRunner, root, ["rev-parse", "HEAD"]);
  if (!head) return { lines: ["stale: not measured (git history unavailable)"], problems: [] };
  const lines = [];
  for (const item of source.components) {
    const ancestor = invoke(gitRunner, root, ["merge-base", "--is-ancestor", item.auditedAt, "HEAD"]);
    if (ancestor?.status !== 0) continue;
    const count = gitText(gitRunner, root, ["rev-list", "--count", `${item.auditedAt}..HEAD`, "--", ...item.parts]);
    if (count === null) return { lines: ["stale: not measured (git history unavailable)"], problems: [] };
    if (Number(count) > staleLimit) lines.push(`stale: ${item.id} ${count} commits since ${item.auditedAt.slice(0, 8)}`);
  }
  return { lines, problems: [] };
}

function coverageLines(root, source, mappedModules) {
  const modules = (mappedModules ?? repoGraph(root).order).filter((module) =>
    !/(?:^|\/)(?:tests?|__tests__|test_helpers?)(?:\/|$)/i.test(module)
    && !/(?:^|[.-])(?:test|spec)(?:[.-]|$)/i.test(path.posix.basename(module))
  );
  const unclaimed = modules.filter((module) => !source.components.some((item) => item.parts.some((part) => contains(part, module))));
  return [...unclaimed.map((item) => `unclaimed: ${item}`), `unclaimed: ${unclaimed.length} of ${modules.length} mapped modules`];
}

export async function buildAudit({ root = REPO_ROOT, source, sourcePath = AUDIT_PATH, ledgerText, gitRunner = defaultGit, mappedModules, trackedPaths, windowDays = ACTIVITY_WINDOW_DAYS, staleLimit = STALE_COMMIT_LIMIT, parts, allowMissingGitHistory = false } = {}) {
  let contract;
  try { contract = readComponentContract(path.join(root, CONTRACT_PATH)); } catch (error) { contract = null; }
  if (!source) {
    try { source = JSON.parse(readFileSync(path.join(root, sourcePath), "utf8")); }
    catch (error) { return { source: null, document: null, problems: [`${sourcePath}: ${error.message}`], lines: [], exitCode: 1 }; }
  }
  let ledger = ledgerText;
  if (ledger === undefined) {
    try { ledger = readFileSync(path.join(root, "REQUIREMENTS.md"), "utf8"); }
    catch { ledger = ""; }
  }
  const known = featuresAndRows(ledger);
  const trackedOut = trackedPaths ? null : invoke(gitRunner, root, ["ls-tree", "-r", "-z", "--name-only", "HEAD"]);
  const tracked = trackedPaths ?? (trackedOut?.status === 0 ? String(trackedOut.stdout ?? "").split("\0").filter(Boolean) : null);
  const head = gitText(gitRunner, root, ["rev-parse", "HEAD"]);
  const problems = [...checkSource(source, { root, known, tracked, head, gitRunner })];
  const document = { contract: source.contract, version: source.version, project: source.project, components: [] };
  const activityById = countActivities(root, source.components ?? [], { gitRunner, windowDays });
  if (contract) for (const item of source.components ?? []) {
    const features = (item.features ?? []).map((id) => known.features.get(id)).filter(Boolean).map(({ id, label, rows, implemented }) => ({ id, label, rows, implemented }));
    const activity = parts ? countActivities(root, [{ ...item, parts }], { gitRunner, windowDays }).get(item.id) : activityById.get(item.id);
    document.components.push({ id: item.id, name: item.name, metaphor: item.metaphor, kind: item.kind, parts: item.parts, features, status: item.status, gap: item.gap, ask: item.ask, evidence: [...new Set([...(item.evidence ?? []), ...(item.anchors ?? []).filter((value) => /^(?:R-\d{3,4}|G-\d{3}|FEAT-\d{3}|CAP-\d{2})$/.test(value) || value.startsWith("docs/known-bugs/")).map((value) => value.startsWith("docs/known-bugs/") ? value.split(":")[0] : value)])], activity });
  }
  if (contract && document.components.length) problems.push(...checkComponentData(document, contract));
  const stale = staleLines(root, source, { gitRunner, staleLimit });
  const coverage = coverageLines(root, source, mappedModules);
  const lines = [...stale.lines, ...coverage, ...(activityById.reportLines ?? [])];
  return { source, document, problems, lines, asks: askOutput(source), rows: known.features, activity: parts ? countActivities(root, [{ id: "test", parts }], { gitRunner, windowDays }).get("test") : null, exitCode: problems.length ? 1 : 0 };
}

export function askOutput(source) {
  return source.components.filter((component) => component.ask).map((component, index) => {
    const ask = component.ask;
    const body = [
      `${ASK_LABELS.question}: ${ask.question}`,
      `${ASK_LABELS.recommends}: ${ask.default}`,
      `${ASK_LABELS.gains}: ${ask.gains}`,
      `${ASK_LABELS.cost}: ${ask.cost}`,
      `${ASK_LABELS.otherwise}: ${ask.otherwise}`,
    ].join("\n");
    return `Redesign ${component.name}: ${ask.question.replace(/[?.!]+$/, "") }\n${body}`;
  });
}
export async function main(argv = process.argv.slice(2), { stdout = process.stdout, ...options } = {}) {
  let mode = "--check", out = null, root = REPO_ROOT;
  for (let i = 0; i < argv.length; i++) {
    if (["--check", "--asks"].includes(argv[i]) && mode === "--check") mode = argv[i];
    else if (argv[i] === "--out" && argv[i + 1]) out = argv[++i];
    else if (argv[i] === "--root" && argv[i + 1]) root = path.resolve(argv[++i]);
    else { console.error("Usage: component-audit.mjs [--check | --asks] [--out <file>] [--root <dir>]"); return 2; }
  }
  const result = await buildAudit({ root, ...options });
  if (mode === "--asks") {
    if (!result.source) return result.exitCode;
    for (const block of askOutput(result.source)) stdout.write(`${block}\n\n`);
    return 0;
  }
  for (const problem of result.problems) stdout.write(`${problem}\n`);
  for (const line of result.lines) stdout.write(`${line}\n`);
  if (out && result.document) writeFileSync(out, `${JSON.stringify(result.document, null, 2)}\n`);
  return result.exitCode;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
