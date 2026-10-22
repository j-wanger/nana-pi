/**
 * @module packages/nana-pack/tests/requirements-deliverables.test.mjs
 * @purpose Pin the deliverable maker and reader grammar, reason notes, and HEAD-tree path checks.
 * @inputs scripts/deliverables.mjs, scripts/requirements-tree.mjs, and temporary git repositories.
 * @outputs PASS/FAIL lines and a non-zero exit when a deliverable contract fails.
 * @effects disk (creates fixtures under the OS temp directory), process (runs git and the tree checker)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { parseLedger } from "../../../scripts/requirements-tree.mjs";
import {
  DELIVERABLE_FIELD_LABELS,
  MAKER_RUNS,
  PART_SEPARATOR,
  PATH_REQUIRED,
  READER_KINDS,
  REASON_REQUIRED,
  RUNTIME_MAP_ARTIFACT,
  checkDeliverables,
} from "../../../scripts/deliverables.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const CLI = fileURLToPath(new URL("../../../scripts/requirements-tree.mjs", import.meta.url));
const LIMIT = 10_000;
const cleanEnv = () => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^GIT_/.test(key)) delete env[key];
  return env;
};
const env = cleanEnv();
const run = (cwd, command, args) => spawnSync(command, args, { cwd, encoding: "utf8", env, timeout: LIMIT });
const git = (cwd, ...args) => run(cwd, "git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args]);
const notesFor = (text, tracked = ["scripts/make.mjs", "docs/x.md"]) => checkDeliverables(parseLedger(text), tracked).notes;
const tree = (capabilityLines, featureLines = "", ending = "\n") => `# CAP-01 · Product\nPurpose: product\nOutcome: artifact exists\nKind: product\nDeliverables: R-001\n${capabilityLines}\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n${featureLines}\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The artifact shall exist. | untested | — |${ending}`;

const reasonCases = [
  ["Made by: R-001 · manual", "Read by: R-001 · person: owner", "Made by:"],
  ["Made by: R-001 · manual:   ", "Read by: R-001 · person: owner", "Made by:"],
  ["Made by: R-001 · manual: owner", "Read by: R-001 · rule", "Read by:"],
  ["Made by: R-001 · manual: owner", "Read by: R-001 · person:   ", "Read by:"],
  ["Made by: R-001 · manual · docs/x.md", "Read by: R-001 · code: scripts/make.mjs", "Made by:"],
];
const reasonFailures = [];
for (const [maker, reader, label] of reasonCases) {
  const notes = notesFor(tree(`${maker}\n${reader}`)).filter((note) => note.includes("needs a reason"));
  if (notes.length !== 1 || !notes[0].includes("R-001") || !notes[0].includes(label)) reasonFailures.push(`${maker} / ${reader}: ${notes.join(" | ")}`);
}
for (const lines of [
  "Made by: R-001 · manual: release owner\nRead by: R-001 · person: release owner",
  "Made by: R-001 · manual: release owner\nRead by: R-001 · rule: required by the land checklist",
]) {
  const notes = notesFor(tree(lines)).filter((note) => note.includes("needs a reason"));
  if (notes.length) reasonFailures.push(`${lines}: ${notes.join(" | ")}`);
}
// req: R-2535
check("a manual maker or a rule or person reader with no reason gets one note naming the row", reasonFailures.length === 0, reasonFailures.join("\n"));

const scratch = tmpDir(join(tmpdir(), "req-deliverables-"));
const repo = join(scratch, "repo");
const project = join(repo, "project");
mkdirSync(join(project, "scripts"), { recursive: true });
mkdirSync(join(project, "readers", "nested"), { recursive: true });
mkdirSync(join(project, "docs"), { recursive: true });
mkdirSync(join(project, "src"), { recursive: true });
writeFileSync(join(project, "scripts", "make.mjs"), "export const make = true;\n");
writeFileSync(join(project, "readers", "nested", "read.mjs"), "export const read = true;\n");
writeFileSync(join(project, "docs", "artifact.md"), "artifact\n");
writeFileSync(join(project, "src", "é.mjs"), "export const unicode = true;\n");
writeFileSync(join(project, ".gitignore"), "ignored.tmp\n");
const pathLedger = tree([
  "Made by: R-001 · suite: scripts/make.mjs",
  "Made by: R-001 · build: readers",
  "Made by: R-001 · review: src/é.mjs",
  "Made by: R-001 · land: scripts/make.mjs · docs/artifact.md",
  `Made by: R-001 · extension: scripts/make.mjs · ${RUNTIME_MAP_ARTIFACT}`,
  "Made by: R-001 · suite: missing.mjs",
  "Made by: R-001 · build: ignored.tmp",
  "Made by: R-001 · hook: staged.mjs",
  "Made by: R-001 · CI: scripts\\make.mjs",
  "Made by: R-001 · extension: scripts/make.mjs, missing-two.mjs",
  "Made by: R-001 · review: scripts/make.mjs · docs/missing-artifact.md",
  "Read by: R-001 · code: readers",
  "Read by: R-001 · prompt: missing-reader.mjs",
  "Read by: R-001 · prompt: scripts/make.mjs",
].join("\n"));
writeFileSync(join(project, "REQUIREMENTS.md"), pathLedger);
let setupFailure = "";
for (const result of [
  git(repo, "init", "-q", "-b", "main"),
  git(repo, "add", "."),
  git(repo, "commit", "-qm", "base"),
]) if (result.status !== 0) setupFailure += result.stderr;
writeFileSync(join(project, "ignored.tmp"), "ignored\n");
writeFileSync(join(project, "staged.mjs"), "export const staged = true;\n");
const staged = git(repo, "add", "project/staged.mjs");
if (staged.status !== 0) setupFailure += staged.stderr;
const pathRun = run(scratch, process.execPath, [CLI, "--root", project]);
const pathNotes = (pathRun.stdout ?? "").split(/\r?\n/).filter((line) => line.includes("is not tracked at HEAD"));
const missingPaths = ["missing.mjs", "ignored.tmp", "staged.mjs", "scripts\\make.mjs", "missing-two.mjs", "docs/missing-artifact.md", "missing-reader.mjs"];
const passingPaths = ["scripts/make.mjs", "readers", "src/é.mjs", "docs/artifact.md", RUNTIME_MAP_ARTIFACT];

const noGit = join(scratch, "not-git");
mkdirSync(noGit, { recursive: true });
writeFileSync(join(noGit, "REQUIREMENTS.md"), tree("Made by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · person: owner"));
const noGitRun = run(scratch, process.execPath, [CLI, "--root", noGit]);
const noGitNotes = (noGitRun.stdout ?? "").split(/\r?\n/).filter((line) => line.includes("paths not checked"));

const unborn = join(scratch, "unborn");
mkdirSync(unborn, { recursive: true });
git(unborn, "init", "-q", "-b", "main");
writeFileSync(join(unborn, "REQUIREMENTS.md"), tree("Made by: R-001 · suite: scripts/make.mjs\nRead by: R-001 · person: owner"));
const unbornRun = run(scratch, process.execPath, [CLI, "--root", unborn]);
const unbornNotes = (unbornRun.stdout ?? "").split(/\r?\n/).filter((line) => line.includes("paths not checked"));
// req: R-2536
check("a maker or reader path not tracked at HEAD gets one note naming the row and the path",
  !setupFailure && pathRun.status === 0 && pathNotes.length === missingPaths.length && missingPaths.every((path) => pathNotes.filter((note) => note.includes("R-001") && note.includes(path)).length === 1) && passingPaths.every((path) => !pathNotes.some((note) => note.includes(path))) && noGitRun.status === 0 && noGitNotes.length === 1 && unbornRun.status === 0 && unbornNotes.length === 1,
  `${setupFailure}\npath status ${pathRun.status}:\n${pathRun.stdout}\n${pathRun.stderr}\nno git:\n${noGitRun.stdout}\n${noGitRun.stderr}\nunborn:\n${unbornRun.stdout}\n${unbornRun.stderr}`);

const grammarFailures = [];
const expectNote = (label, text, fragment, count = 1) => {
  const notes = notesFor(text);
  const found = notes.filter((note) => note.includes(fragment));
  if (found.length !== count) grammarFailures.push(`${label}: wanted ${count} x ${fragment}; ${notes.join(" | ")}`);
};
expectNote("missing both", tree(""), "has no readable", 2);
const outside = `# CAP-01 · Constraint\nPurpose: constraint\nKind: constraint\nMade by: R-001 · manual: owner\n\n# CAP-02 · Kindless\nPurpose: kindless\nRead by: R-002 · person: owner\n`;
expectNote("constraint and kindless", outside, "outside a live Kind: product capability", 2);
expectNote("unlisted row", tree("Made by: R-999 · manual: owner\nMade by: R-001 · manual: owner\nRead by: R-001 · person: owner"), "R-999", 1);
expectNote("unknown run", tree("Made by: R-001 · nightly: scripts/make.mjs\nRead by: R-001 · person: owner"), "unknown maker run", 1);
expectNote("bad separator", tree("Made by: R-001 - land: scripts/make.mjs\nRead by: R-001 · person: owner"), "cannot read Made by:", 1);
expectNote("bare automatic", tree("Made by: R-001 · land\nRead by: R-001 · person: owner"), "needs a code path", 1);
expectNote("bare prompt", tree("Made by: R-001 · manual: owner\nRead by: R-001 · prompt"), "needs a code path", 1);
expectNote("bare code", tree("Made by: R-001 · manual: owner\nRead by: R-001 · code"), "needs a code path", 1);
const ignoredProse = tree(
  "Made by: R-001 · manual: owner\nRead by: R-001 · person: owner\nmade by: R-999 · nightly\n```\nMade by: R-999 · nightly\n```\nMade by: R-001 · manual: second owner",
  "Made by: R-999 · nightly\n### SUB-001 · Sub\nPurpose: sub\nRead by: R-999 · mystery\n",
);
if (notesFor(ignoredProse).length !== 0) grammarFailures.push(`ignored prose: ${notesFor(ignoredProse).join(" | ")}`);
const lfNotes = notesFor(tree("Made by: R-001 · land\nRead by: R-001 · prompt"));
const crlfNotes = notesFor(tree("Made by: R-001 · land\nRead by: R-001 · prompt").replaceAll("\n", "\r\n"));
if (JSON.stringify(lfNotes) !== JSON.stringify(crlfNotes)) grammarFailures.push(`CRLF differs: ${lfNotes.join(" | ")} / ${crlfNotes.join(" | ")}`);
const trailing = tree("Made by: R-001 · manual: owner  \t\nRead by: R-001 · person: owner\t", "", "");
if (notesFor(trailing).length !== 0) grammarFailures.push(`trailing/no-final-newline: ${notesFor(trailing).join(" | ")}`);
const tunablesPinned = JSON.stringify(DELIVERABLE_FIELD_LABELS) === JSON.stringify(["Made by", "Read by"])
  && JSON.stringify(MAKER_RUNS) === JSON.stringify(["session start", "suite", "land", "review", "build", "CI", "hook", "extension", "manual"])
  && JSON.stringify(READER_KINDS) === JSON.stringify(["code", "prompt", "person", "rule"])
  && JSON.stringify(REASON_REQUIRED) === JSON.stringify(["manual", "rule", "person"])
  && JSON.stringify(PATH_REQUIRED) === JSON.stringify(["session start", "suite", "land", "review", "build", "CI", "hook", "extension", "code", "prompt"])
  && PART_SEPARATOR === " · " && RUNTIME_MAP_ARTIFACT === "runtime-map";
if (!tunablesPinned) grammarFailures.push("sealed deliverable tunables differ");
// req: R-2537
check("a missing or unreadable line, or an automatic claim with no code path, gets one note naming it", grammarFailures.length === 0, grammarFailures.join("\n"));

console.log(fails ? `${fails} check(s) failed` : "all checks passed");
process.exit(fails ? 1 : 0);
