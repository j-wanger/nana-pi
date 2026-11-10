/**
 * @module packages/nana-pack/tests/requirements-lift.test.mjs
 * @purpose Pin the main lift flow, byte preservation, data-loss proof failures and Windows path identity.
 * @inputs Lift/proof modules and existing synthetic ledger fixtures in OS temp repositories.
 * @outputs Awaited bounded PASS/FAIL checks.
 * @effects disk (temporary repositories), process (bounded git and Node children)
 * @errors Failed assertions or child failures fail the file.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { withinCaseLimit } from "./report-fixtures.mjs";
import { proveLift } from "../../../scripts/requirements-lift-proof.mjs";
import { applyMapping } from "../../../scripts/requirements-lift.mjs";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const LIFT = join(REPO_ROOT, "scripts/requirements-lift.mjs");
const SEED_TEXT = readFileSync(join(REPO_ROOT, "templates/_shared/requirements-general.md"), "utf8");
const scratchRoot = tmpDir(join(tmpdir(), "lift-test-"));
let n = 0, fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^GIT_/.test(k)) delete env[k]; return env; };
const node = (args, cwd, extra = {}) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 120_000, env: cleanEnv(), ...extra });
const lift = (args, cwd) => node([LIFT, ...args], cwd ?? REPO_ROOT);
function gitC(cwd, ...args) {
  const r = spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args], { cwd, encoding: "utf8", timeout: 120_000, env: cleanEnv() });
  assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
}
function scratchDir(prefix) { const dir = join(scratchRoot, `${prefix}-${++n}`); mkdirSync(dir, { recursive: true }); return dir; }
function flatLedger() {
  return [
    "# fixture requirements", "", "Intro prose for the fixture.", "",
    "# Part A. Alpha", "", "## 1. One", "",
    "| ID | Requirement | Status | Evidence |", "|---|---|---|---|",
    "| R-001 | The first thing shall work. | untested | — |",
    "| R-002 | The second thing shall work. | untested | — |", "",
    "## 2. Two", "", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|",
    "| R-003 | The third thing shall work. | untested | — |", "",
    "## Open questions", "", "1. An open question.", "",
    "## Deliberate omissions", "", "1. A deliberate omission.", "",
  ].join("\n");
}
function gitRepo(prefix, text) {
  const dir = scratchDir(prefix); writeFileSync(join(dir, "REQUIREMENTS.md"), text);
  gitC(dir, "init", "-q", "-b", "main"); gitC(dir, "config", "core.autocrlf", "false");
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "base"); return dir;
}
function gitStub(toplevel) {
  const real = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8", timeout: 120_000 }).stdout.trim();
  const dir = scratchDir("gitstub");
  writeFileSync(join(dir, "git"), `#!/bin/sh\nif [ "$1" = "rev-parse" ] && [ "$2" = "--show-toplevel" ]; then\n  echo ${JSON.stringify(toplevel)}\n  exit 0\nfi\nexec ${JSON.stringify(real)} "$@"\n`, { mode: 0o755 });
  return dir;
}
try {
  await withinCaseLimit("lift flow", async () => {
    for (const [label, text] of [["LF", flatLedger()], ["CRLF", flatLedger().replace("| R-001 | The first thing shall work. | untested | — |", "| R-001 | The first thing shall work. | untested | — | \t").trimEnd().replaceAll("\n", "\r\n")]]) {
      const dir = gitRepo(label, text), file = join(dir, "REQUIREMENTS.md"), mapPath = join(dir, "map.json");
      const base = gitC(dir, "rev-parse", "HEAD"), before = readFileSync(file);
      const dry = lift(["--root", dir]), emit = lift(["--root", dir, "--emit-mapping", mapPath]);
      // req: R-1162
      check("dry run and emitted mapping write no ledger bytes", dry.status === 0 && emit.status === 0 && /^lift proof: 3 rows kept byte-identical;.*tree check 0 problems$/m.test(dry.stdout) && /^CAP-01/m.test(dry.stdout) && /^FEAT-002/m.test(dry.stdout) && readFileSync(file).equals(before), dry.stderr + emit.stderr);
      const map = JSON.parse(readFileSync(mapPath, "utf8"));
      gitC(dir, "add", "map.json"); gitC(dir, "commit", "-qm", "mapping");
      const other = join(scratchRoot, `other-${label}`);
      gitC(dir, "worktree", "add", "-q", "--detach", other, "HEAD");
      writeFileSync(join(other, "REQUIREMENTS.md"), `${text}\nConcurrent edit.\n`);
      const refused = lift(["--root", dir, "--mapping", mapPath, "--write"]);
      // req: R-1164
      check("a second worktree's dirty ledger refuses the write", refused.status === 1 && refused.stderr.includes(realpathSync.native(other)) && readFileSync(file).equals(before) && readFileSync(join(other, "REQUIREMENTS.md"), "utf8").endsWith("Concurrent edit.\n"), refused.stderr);
      gitC(other, "checkout", "--", "REQUIREMENTS.md");
      const written = lift(["--root", dir, "--mapping", mapPath, "--write"]);
      const output = readFileSync(file, "utf8");
      const rows = value => value.match(/^\| R-\d+ \|[^\n]*(?:\n|$)/gm);
      const proof = proveLift(text, map, output, SEED_TEXT, { fromDefault: true });
      // req: R-1163 R-1164 R-1166
      check("lift keeps row bytes and proves the result", written.status === 0 && JSON.stringify(rows(text)) === JSON.stringify(rows(output)) && proof.problems.length === 0, written.stderr + JSON.stringify(proof.problems));
      // req: R-1165
      check("default mapping retains the intro, sections and kept tail", output.startsWith(text.slice(0, text.indexOf("# Part A."))) && output.includes("# CAP-01 · Part A. Alpha") && output.includes("## FEAT-001 · 1. One") && output.includes("## FEAT-002 · 2. Two") && output.includes("Purpose: Not yet sorted:") && output.includes("1. An open question.") && output.includes("1. A deliberate omission."));
      const wrongHead = structuredClone(map); wrongHead.head.through = 1;
      const headProof = proveLift(text, wrongHead, applyMapping(text, wrongHead, { byId: new Map(), subOf: new Map() }), SEED_TEXT, { fromDefault: true });
      const dropped = output.replace(/\r?\n## Deliberate omissions\r?\n\r?\n1\. A deliberate omission\.\r?\n?$/, "\n");
      const tailProof = proveLift(text, map, dropped, SEED_TEXT, { fromDefault: true });
      // req: R-1163
      check("proof refuses an under-counted head and a dropped kept section", headProof.problems.some(p => /head\.through \(1\) does not end just before/.test(p)) && dropped !== output && tailProof.problems.some(p => /tail: kept section .* is missing/.test(p)), JSON.stringify({ head: headProof.problems, tail: tailProof.problems }));
      gitC(dir, "add", "REQUIREMENTS.md"); gitC(dir, "commit", "-qm", "lift");
      const verified = lift(["--root", dir, "--mapping", mapPath, "--verify", base]);
      // req: R-1168
      check("committed lift verifies against its base", verified.status === 0, verified.stderr);
    }
  });
  await withinCaseLimit("mapping write guard", async () => {
    const sub = "proj", dir = scratchDir("t10"), project = join(dir, sub);
    mkdirSync(join(project, "maps"), { recursive: true });
    writeFileSync(join(project, "REQUIREMENTS.md"), flatLedger());
    gitC(dir, "init", "-q", "-b", "main"); gitC(dir, "config", "core.autocrlf", "false");
    gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "base");
    const mapPath = join(project, "maps", "map.json"), file = join(project, "REQUIREMENTS.md"), before = readFileSync(file);
    const emit = lift(["--root", project, "--emit-mapping", mapPath]);
    const refused = r => r.status === 1 && r.stderr.includes("map.json") && !/\bERR_[A-Z_]+|^\s+at .+:\d+:\d+\)?$/m.test(r.stderr) && readFileSync(file).equals(before);
    const r1 = lift(["--root", project, "--mapping", mapPath, "--write"]), untrackedOk = refused(r1);
    gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "mapping");
    writeFileSync(mapPath, `${readFileSync(mapPath, "utf8")}\n`);
    const r2 = lift(["--root", project, "--mapping", mapPath, "--write"]), changedOk = refused(r2);
    gitC(dir, "checkout", "--", `${sub}/maps/map.json`);
    const outsideMap = join(scratchRoot, "outside-map.json"); writeFileSync(outsideMap, readFileSync(mapPath));
    const r3 = lift(["--root", project, "--mapping", outsideMap]), outsideOk = refused(r3);
    const r4 = lift(["--root", project, "--mapping", mapPath, "--write"]), acceptOk = r4.status === 0;
    // req: R-1164
    check("R-1164: --write refuses a mapping file in a subfolder that is untracked or differs from HEAD, and one outside the repository, naming the reason, and accepts a committed one", emit.status === 0 && untrackedOk && changedOk && outsideOk && acceptOk,
      `untracked=${untrackedOk} changed=${changedOk} outside=${outsideOk} accept=${acceptOk} ${r1.stderr}${r2.stderr}${r3.stderr}${r4.stderr}`);
  });
  await withinCaseLimit("Windows top-level spelling", async () => {
    if (process.platform !== "win32") {
    const dir = scratchDir("t32"), project = join(dir, "proj"); mkdirSync(project);
    writeFileSync(join(project, "REQUIREMENTS.md"), flatLedger()); mkdirSync(join(project, "maps"));
    gitC(dir, "init", "-q", "-b", "main"); gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "base");
    const base = gitC(dir, "rev-parse", "HEAD"), alias = join(scratchRoot, "git-alias"); symlinkSync(dir, alias);
    const stubDir = gitStub(alias), stubEnv = { ...cleanEnv(), PATH: `${stubDir}${delimiter}${process.env.PATH ?? ""}` };
    const invoke = args => node([LIFT, ...args], project, { env: stubEnv });
    const mapPath = join(project, "maps/map.json");
    const emit = invoke(["--root", project, "--emit-mapping", mapPath]);
    gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "mapping");
    const written = invoke(["--root", project, "--mapping", mapPath, "--write"]);
    gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "lift");
    const verified = invoke(["--root", project, "--mapping", mapPath, "--verify", base]);
    // req: R-1164
    check("R-1164: --write and --verify relate the ledger and mapping to the repository when --root is spelled differently from git's top level", emit.status === 0 && written.status === 0 && verified.status === 0, emit.stderr + written.stderr + verified.stderr);
    } else console.log("SKIP R-1164: --write and --verify relate the ledger and mapping to the repository when --root is spelled differently from git's top level — the git stand-in is a POSIX shell script");
  });
  await withinCaseLimit("head/tail refusal", async () => {
    const text = [
      "# fixture requirements", "", "Purpose: intro, before any tree heading.", "",
      "## FEAT-001 · Loose feature", "Purpose: p", "Status: active", "",
      "| ID | Requirement | Status | Evidence |", "|---|---|---|---|",
      "| R-001 | A thing shall work. | untested | — |", "",
      "# Part B. Beta", "", "## 1. Sub", "", "```", "| R-100 | fenced row shall hold. | untested | — |", "```", "",
      "| ID | Requirement | Status | Evidence |", "|---|---|---|---|",
      "| R-002 | Another thing shall work. | untested | — |", "",
      "## Open questions", "", "Status: an open question that starts with a field label.", "",
    ].join("\n");
    const dir = scratchDir("headtail"); writeFileSync(join(dir, "REQUIREMENTS.md"), text);
    const r = lift(["--root", dir]);
    // req: R-1167
    check("R-1167: one refusal names every base problem, and a field-labelled line in the head or tail is not one", r.status === 1 && !/carried prose starts with a field label \("(?:Purpose|Status):"\)/.test(r.stderr) && /requirement row R-100 is inside a code fence/.test(r.stderr) && /neither flat nor a passing tree/.test(r.stderr) && /already holds 1 capability, feature or subgroup heading/.test(r.stderr), r.stderr);
  });
} finally { rmSync(scratchRoot, { recursive: true, force: true }); }
if (fails) process.exitCode = 1;
