/**
 * @module packages/nana-pack/tests/report-fixtures.mjs
 * @purpose Build caller-scoped product report fixtures and render their written pages in isolated browser contexts.
 * @inputs Caller-supplied temporary folders, ledger and runtime data, commit dates, HTML and hashes.
 * @outputs Repository helpers, ledger builders, a caller-scoped page writer, the artifact-flow ledger, assessment fixtures, runtime files, rendered nodes and bounded async results.
 * @effects disk (temporary fixture files), process (git and isolated VM scripts).
 * @errors Fixture errors and per-case timeouts throw to the calling test.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vm from "node:vm";
import { parseLedger, readRequirementRows } from "../../../scripts/requirements-tree.mjs";
import { generateReport } from "../../../scripts/product-report.mjs";

// Match the canonical runner's established per-file ceiling while giving each async case its own watchdog.
export const CASE_LIMIT_MS = Number(process.env.NANA_TEST_TIMEOUT_MS) || 5 * 60 * 1000;
export async function withinCaseLimit(label, action) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(action),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${CASE_LIMIT_MS} ms`)), CASE_LIMIT_MS); }),
    ]);
  } finally { clearTimeout(timer); }
}
export function treeFixture(temp, name, ledger, handoff = "# Handoff\n\n## Open for the owner\n", date) {
  const root = path.join(temp, name);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), ledger);
  fs.writeFileSync(path.join(root, "HANDOFF.md"), handoff);
  const git = (args, options = {}) => spawnSync("git", args, { cwd: root, encoding: "utf8", ...options });
  git(["init", "-q"]); git(["config", "user.email", "test@example.com"]); git(["config", "user.name", "Test"]);
  git(["add", "REQUIREMENTS.md", "HANDOFF.md"]);
  git(["commit", "-qm", "fixture"], date ? { env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } } : {});
  return { root, git };
}
export const table = (rows) => `| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n${rows.map(([id, status]) => `| ${id} | ${id} shall work. | ${status} | — |`).join("\n")}\n`;
export const feature = (id, rows, extra = [], status = "active") => [`## ${id} · ${id}`, "Purpose: keep output.", `Status: ${status}`, ...extra, "", table(rows).trimEnd()].join("\n");
export const stage = (id, label, fields = [], kind = "product") => [`# ${id} · ${label}`, "Purpose: make output.", "Outcome: output exists.", ...(kind ? [`Kind: ${kind}`] : []), ...fields, ""].join("\n");
export const code = (id) => [`Made by: ${id} · suite: make.mjs`, `Read by: ${id} · code: read.mjs`];
export const manual = (id) => [`Made by: ${id} · manual: owner makes it`, `Read by: ${id} · person: owner reads it`];
export const park = (id) => `Parked: ${id} · since 2026-01-01: owner holds it`;
export function commitCode(temp, repo) { commitAt(temp, repo, "code", "2026-01-02T00:00:00Z", { "make.mjs": "export const made = true;\n", "read.mjs": "export const read = true;\n" }); }
export async function page(temp, repo, name) {
  const out = path.join(temp, `${name}.html`);
  await generateReport({ root: repo.root, out });
  return fs.readFileSync(out, "utf8");
}
export function artifactFlowLedger() {
  return [
    "# CAP-10 · Earlier readers", "Purpose: read later artifacts.", "Outcome: later artifacts are consumed.", "Kind: product", "",
    "## FEAT-100 · First reader", "Purpose: read several artifacts.", "Status: active", "Reads: A-001 · REQUIREMENTS.md", "Reads: A-002 · HANDOFF.md", "Reads: A-004 · REQUIREMENTS.md", "Reads: A-010 · HANDOFF.md", "Reads: A-011 · REQUIREMENTS.md", "Reads: A-999 · REQUIREMENTS.md\t", "", table([["R-1000", "implemented"]]).trimEnd(), "",
    "## FEAT-101 · Second reader", "Purpose: share a capability read.", "Status: active", "Reads: A-001 · HANDOFF.md", "", table([["R-1001", "implemented"]]).trimEnd(), "",
    "# CAP-11 · Other readers", "Purpose: read artifacts elsewhere.", "Outcome: another capability consumes artifacts.", "Kind: product", "",
    "## FEAT-110 · Third reader", "Purpose: read one artifact.", "Status: active", "Reads: A-001 · REQUIREMENTS.md", "", table([["R-1100", "implemented"]]).trimEnd(), "",
    "# CAP-12 · Makers", "Purpose: make registered artifacts.", "Outcome: artifacts exist.", "Kind: product", "Deliverables: R-1200, R-1201, R-1202, R-1203, R-1204, R-1205, R-1206",
    "Made by: R-1200 · build: REQUIREMENTS.md · A-001", "Read by: R-1200 · code: REQUIREMENTS.md",
    "Made by: R-1201 · manual: fixture input · built from: A-002", "Read by: R-1201 · code: REQUIREMENTS.md",
    "Made by: R-1202 · manual: retired fixture · A-004", "Read by: R-1202 · code: REQUIREMENTS.md",
    "Made by: R-1203 · manual: fixture input · built from: A-005", "Read by: R-1203 · person: fixture person",
    "Made by: R-1204 · manual: fixture output · A-006", "Read by: R-1204 · code: REQUIREMENTS.md",
    "Made by: R-1205 · manual: fixture input · built from: A-007", "Read by: R-1205 · prompt: HANDOFF.md",
    "Made by: R-1206 · manual: fixture input · built from: A-009", "Read by: R-1206 · rule: fixture rule", "",
    "## FEAT-120 · Maker feature", "Purpose: register most artifacts.", "Status: active",
    "Artifact: A-001 · automatic output · tracked: REQUIREMENTS.md · build: REQUIREMENTS.md",
    "Artifact: A-002 · manual source · other project: <project>/source.txt · manual: another tool writes it",
    "Artifact: A-004 · retired output · retired: replaced by A-001",
    "Artifact: A-005 · person source · user-home store: ~/person.txt · manual: a person writes it",
    "Artifact: A-006 · code source · other project: <project>/code.txt · manual: a hand-run command writes it",
    "Artifact: A-007 · prompt source · user-home store: ~/prompt.txt · manual: an editor writes it",
    "Artifact: A-008 · orphan record · tracked: HANDOFF.md · manual: a person maintains it",
    "Artifact: A-009 · rule source · other project: <project>/rule.txt · manual: a person writes it",
    "Artifact: A-010 · read-only output · tracked: REQUIREMENTS.md · build: REQUIREMENTS.md",
    "Artifact: A-011 · manual read-only source · other project: <project>/read-only.txt · manual: another tool writes it",
    "Reads: A-003 · REQUIREMENTS.md  ", "", table([["R-1200", "implemented"], ["R-1201", "implemented"], ["R-1202", "implemented"], ["R-1203", "implemented"], ["R-1204", "implemented"], ["R-1205", "implemented"], ["R-1206", "implemented"]]).trimEnd(), "",
    "## FEAT-121 · Internal maker", "Purpose: make an internally read artifact.", "Status: active", "Artifact: A-003 · internal output · tracked: HANDOFF.md · build: REQUIREMENTS.md", "", table([["R-1210", "implemented"]]).trimEnd(),
  ].join("\r\n");
}
export const hashRow = (id, requirement, status) => createHash("sha256").update(JSON.stringify([id, requirement, status])).digest("hex");
export function makeAssessment(root, commit, featureId = "FEAT-001") {
  const parsed = parseLedger(fs.readFileSync(path.join(root, "REQUIREMENTS.md"), "utf8").replace(/\r\n?/g, "\n").split("\n").map((line) => line.replace(/[ \t]+$/g, "")).join("\n"));
  const feature = parsed.headings.find((heading) => heading.id === featureId);
  const descendants = parsed.headings.filter((heading) => { for (let current = heading; current; current = current.parent) if (current === feature) return true; return false; });
  const own = readRequirementRows(parsed).filter((row) => descendants.includes(row.heading));
  const shared = feature.alsoApplies.map((id) => readRequirementRows(parsed).find((row) => row.id === id)).filter(Boolean);
  const rows = [...own.map((row) => ({ ...row, mark: "own" })), ...shared.map((row) => ({ ...row, mark: "shared" }))];
  return { id: feature.id, what_it_does: "Keeps the requirements together.", maturity: "partial", maturity_reason: "Some checks remain open.", gaps: ["A missing check."], risks: ["A stale result."], decisions: ["A future choice."], next_step: "Run the full suite.", written_by: "seat", checked_by: "reviewer", date: "2026-10-11", stamp: { commit, purpose: feature.purpose, status: feature.status, rows: rows.map((row) => ({ id: row.id, mark: row.mark, status: row.status, sha256: hashRow(row.id, row.requirement, row.status) })) } };
}
export function writeStore(root, features) {
  const storePath = path.join(root, "docs/product-report/assessments.json");
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify({ version: 1, features }, null, 2));
  return storePath;
}
export function writeRuntimeFile(root, data) {
  const common = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" }).stdout.trim();
  const file = path.join(path.resolve(root, common), "nana", "runtime-map.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
  return file;
}
export function commitAt(temp, repo, message, date, files, { messageFile = false } = {}) {
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(repo.root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  repo.git(["add", "-A"]);
  const env = { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date };
  if (messageFile) {
    const file = path.join(temp, `commit-message-${Math.random().toString(16).slice(2)}`);
    fs.writeFileSync(file, message);
    repo.git(["commit", "-qF", file], { env });
  } else repo.git(["commit", "-qm", message], { env });
  return repo.git(["rev-parse", "HEAD"]).stdout.trim();
}
// Evaluate the renderer shipped in the generated page, without access to module-scope names.
export function renderHtmlAt(html, hash = "") {
  const prefix = "const renderInto = (";
  const start = html.indexOf(prefix);
  if (start === -1) throw new Error("renderer source not found in generated page");
  const afterStart = start + prefix.length;
  const close = /\);\r?\n(?=const data = JSON\.parse)/.exec(html.slice(afterStart));
  if (!close) throw new Error("renderer close not found in generated page");
  const source = html.slice(afterStart, afterStart + close.index);
  const sandbox = {};
  vm.runInNewContext(`renderInto = (${source});`, sandbox);
  const dataMatch = html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/);
  const model = JSON.parse(dataMatch[1]);
  const handlers = [];
  const rootNode = { tag: "main", children: [], appendChild(node) { this.children.push(node); }, replaceChildren(...children) { this.children = children; } };
  const make = (tag) => { const node = { tag, children: [], attrs: {}, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute(name, value) { this.attrs[name] = value; }, addEventListener(type, callback) { handlers.push({ node: this, type, callback }); } }; Object.defineProperty(node, "textContent", { get() { return this.children.map((child) => child.textContent ?? child.text ?? "").join(""); }, set(value) { this.children = [{ text: String(value) }]; } }); return node; };
  const document = { getElementById: () => rootNode, createElement: make, createTextNode: (value) => ({ text: String(value), get textContent() { return this.text; } }) };
  sandbox.renderInto(document, model, { hash });
  const flatten = (node) => [node, ...(node.children ?? []).flatMap(flatten)];
  return { nodes: flatten(rootNode), root: rootNode, model, handlers };
}
