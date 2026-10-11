#!/usr/bin/env node
/**
 * @module scripts/product-report.mjs
 * @purpose Builds a deterministic HTML product ledger from the requirements tree, HANDOFF asks, and repository provenance.
 * @inputs REQUIREMENTS.md, HANDOFF.md, the HTML template, an optional repository root, output path, and injected git runner.
 * @outputs A complete product ledger HTML file or an exported report model and renderer.
 * @effects disk (reads sources and template, writes the report), process (queries git and reports CLI errors).
 * @errors Refuses malformed ledgers or asks, git failures, and output failures with named diagnostics.
 */
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkTree, descendants, readRequirementRows } from "./requirements-tree.mjs";
import { WHITESPACE } from "./requirements-trace.mjs";
import { splitOpenForJake } from "../packages/nana-pack/lib/handoff-asks.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "product-report/template.html");
const DEFAULT_OUT = "docs/product-report/out/nana-pi-product-ledger.html";
const normalise = (text) => text.replace(/^\ufeff/, "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.replace(new RegExp(`[${WHITESPACE}]+$`, "gu"), "")).join("\n");
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

function git(gitRunner, root, args) {
  const result = gitRunner(args, { cwd: root, encoding: "utf8", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  if (result?.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result?.stderr?.trim() || "unknown git error"}`);
  return result.stdout.trim();
}

export function renderInto(document, model) {
  const root = document.getElementById("report");
  const heading = document.createElement("h1");
  heading.appendChild(document.createTextNode("Nana pi product ledger"));
  root.appendChild(heading);
  const stamp = document.createElement("p");
  stamp.appendChild(document.createTextNode(`Commit ${model.commit} · ${model.date} · Working tree: ${model.clean ? "clean" : "dirty"}`));
  root.appendChild(stamp);
  const content = document.createElement("pre");
  content.appendChild(document.createTextNode(JSON.stringify(model, null, 2)));
  root.appendChild(content);
  return root;
}

export async function buildReport({ root = REPO_ROOT, gitRunner = (args, options) => spawnSync("git", args, options) } = {}) {
  const ledgerText = normalise(await readFile(path.join(root, "REQUIREMENTS.md"), "utf8"));
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
  const features = parsed.headings.filter((heading) => heading.id.startsWith("FEAT-")).map((feature) => {
    const ownHeadings = descendants(parsed, feature);
    const ownRows = rows.filter((row) => ownHeadings.includes(row.heading));
    const sharedRows = feature.alsoApplies.map((id) => rows.find((row) => row.id === id)).filter(Boolean);
    const allRows = [...ownRows, ...sharedRows];
    const counts = Object.fromEntries(["implemented", "untested", "planned", "violated", "retired"].map((status) => [status, allRows.filter((row) => row.status === status).length]));
    const outgoing = parsed.headings.filter((candidate) => candidate.id.startsWith("FEAT-") && candidate.alsoApplies.some((id) => ownRows.some((row) => row.id === id))).map((candidate) => candidate.id);
    return { id: feature.id, label: feature.label, purpose: feature.purpose, status: feature.status, assessment: "unassessed", counts, shared: sharedRows.map((row) => row.id), sharedBy: outgoing, rows: allRows.map((row) => ({ id: row.id, requirement: row.requirement, status: row.status, evidence: row.evidence, mark: ownRows.includes(row) ? "own" : "shared" })) };
  });
  const capabilities = parsed.headings.filter((heading) => heading.id.startsWith("CAP-")).map((capability) => ({ id: capability.id, label: capability.label, purpose: capability.purpose, outcome: capability.outcome, features: features.filter((feature) => descendants(parsed, capability).some((heading) => heading.id === feature.id)).map((feature) => feature.id) }));
  const violated = rows.filter((row) => row.status === "violated");
  const model = { commit, date, clean: !dirty, capabilities, features, violated: violated.map((row) => ({ id: row.id, requirement: row.requirement, evidence: row.evidence })), asks: asks.map(({ tag, title }) => ({ kind: tag.kind, since: tag.since, title: title.title, body: title.body })) };
  return { model, template: await readFile(TEMPLATE, "utf8") };
}

export async function generateReport({ root = REPO_ROOT, out = DEFAULT_OUT, gitRunner } = {}) {
  const { model, template } = await buildReport({ root, ...(gitRunner ? { gitRunner } : {}) });
  const payload = JSON.stringify(model).replaceAll("<", "\\u003c");
  const html = template.replace("__REPORT_DATA__", payload);
  const target = path.isAbsolute(out) ? out : path.resolve(root, out);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
  return target;
}

export function main(argv = process.argv.slice(2)) {
  let root = REPO_ROOT; let out = DEFAULT_OUT;
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === "--root" && argv[index + 1]) root = path.resolve(argv[++index]);
    else if (flag === "--out" && argv[index + 1]) out = argv[++index];
    else { console.error("Usage: product-report.mjs [--root <dir>] [--out <file>]"); return 2; }
  }
  return generateReport({ root, out }).then((file) => { console.log(`Wrote ${file}`); return 0; }).catch((error) => { console.error(error.message); return 1; });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
