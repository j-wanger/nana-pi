/**
 * @module packages/nana-pack/tests/requirements-lift.test.mjs
 * @purpose Pin the lift's dry run, proof, default mapping, supplied-mapping and git-gated write and verify behaviour against built fixtures.
 * @inputs scripts/requirements-lift.mjs, scripts/requirements-lift-proof.mjs, templates/_shared/requirements-general.md, and ledger/mapping fixtures built by each test under the OS temp directory.
 * @outputs PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
 * @effects disk (creates fixtures and scratch git repositories under the OS temp directory; never touches a real project), process (spawns node and git as children)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, delimiter } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { proveLift } from "../../../scripts/requirements-lift-proof.mjs";
import * as LIFT_MODULE from "../../../scripts/requirements-lift.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const LIFT = join(REPO_ROOT, "scripts/requirements-lift.mjs");
const SEED_TEXT = readFileSync(join(REPO_ROOT, "templates/_shared/requirements-general.md"), "utf8");

// A spawned run's own Node module-loading warning for the .ts rail import (tree test's own()).
const NODE_WARNING = [/^\(node:\d+\) /, /^Reparsing as ES module because/, /^To eliminate this warning, add "type": "module"/, /^\(Use `node --trace-warnings/];
const lines = (s) => (s ?? "").replace(/\r/g, "").split("\n").filter((l, i, all) => !(l === "" && i === all.length - 1));
const own = (stderr) => lines(stderr).filter((l) => !NODE_WARNING.some((re) => re.test(l)));
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^GIT_/.test(k)) delete env[k]; return env; };
const node = (args, cwd, extra = {}) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 120_000, env: cleanEnv(), ...extra });
const lift = (args, cwd) => node([LIFT, ...args], cwd ?? REPO_ROOT);
/** A refusal must be the lift's own named one, never Node's crash. */
const crashed = (r) => /Cannot find module|\bERR_[A-Z_]+|^\s+at .+:\d+:\d+\)?$/m.test(r?.stderr ?? "") || r?.status === null;
const PROOF_RE = /^lift proof: (\d+) rows kept byte-identical; (\d+) prose lines carried; (\d+) headings replaced; (\d+) lines inserted; tree check (\d+) problems$/;
const proofOf = (stdout) => { const m = lines(stdout).map((l) => PROOF_RE.exec(l)).filter(Boolean); return m.length === 1 ? { rows: +m[0][1], prose: +m[0][2], headings: +m[0][3], inserted: +m[0][4], treeProblems: +m[0][5] } : null; };

const scratchRoot = tmpDir(join(tmpdir(), "lift-test-"));
let n = 0;
function scratchDir(prefix) { n++; const d = join(scratchRoot, `${prefix}-${n}`); mkdirSync(d, { recursive: true }); return d; }
function writeLedger(dir, text) { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "REQUIREMENTS.md"), text); return dir; }
const gitEnv = { ...cleanEnv() };
function git(cwd, ...args) { return spawnSync("git", args, { cwd, encoding: "utf8", env: gitEnv }); }
function gitC(cwd, ...args) { return spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args], { cwd, encoding: "utf8", env: gitEnv }); }
/** A clean scratch repo with the given ledger text committed on branch main; autocrlf pinned false. */
function gitRepo(prefix, text, { autocrlf = "false" } = {}) {
  const dir = scratchDir(prefix);
  writeLedger(dir, text);
  gitC(dir, "init", "-q", "-b", "main");
  gitC(dir, "config", "core.autocrlf", autocrlf);
  gitC(dir, "add", "-A");
  gitC(dir, "commit", "-qm", "init");
  return dir;
}
function readLedger(dir) { try { return readFileSync(join(dir, "REQUIREMENTS.md")); } catch { return null; } }
/**
 * A minimal `git` on its own PATH entry (POSIX only): for `rev-parse --show-toplevel` it reports
 * `toplevel` literally, never asking the real git; every other subcommand execs the real git
 * untouched. Stands in for the CI run 38738434830 Windows shape, where git's own reported top
 * level is spelled differently (the long form) from the one the lift already resolved for --root
 * (the short 8.3 form) — reproduced here with a second, real symlink alias of the same repository
 * instead, since a plain symlink is already fully resolved identically by git and by Node on a
 * POSIX box (R-1164).
 */
function gitStub(toplevel) {
  const real = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim();
  const dir = scratchDir("gitstub");
  const script = `#!/bin/sh\nif [ "$1" = "rev-parse" ] && [ "$2" = "--show-toplevel" ]; then\n  echo ${JSON.stringify(toplevel)}\n  exit 0\nfi\nexec ${JSON.stringify(real)} "$@"\n`;
  writeFileSync(join(dir, "git"), script, { mode: 0o755 });
  return dir;
}

// ---------------------------------------------------------------- fixture ledgers (built here, never a real project's)

/** A small flat ledger: a title/intro, Part A with sections 1 and 2 (rows), kept sections at the end. */
function flatLedger() {
  return [
    "# fixture requirements",
    "",
    "Intro prose for the fixture.",
    "",
    "# Part A. Alpha",
    "",
    "## 1. One",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| R-001 | The first thing shall work. | untested | — |",
    "| R-002 | The second thing shall work. | untested | — |",
    "",
    "## 2. Two",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| R-003 | The third thing shall work. | untested | — |",
    "",
    "## Open questions",
    "",
    "1. An open question.",
    "",
    "## Deliberate omissions",
    "",
    "1. A deliberate omission.",
    "",
  ].join("\n");
}
/** A flat ledger with no Part above its two sections (basketball-geek's shape). */
function flatLedgerNoParts() {
  return [
    "# no-part fixture",
    "",
    "## 1. One",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| R-001 | The first thing shall work. | untested | — |",
    "",
    "## 2. Two",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| R-002 | The second thing shall work. | untested | — |",
    "",
  ].join("\n");
}
/**
 * A flat ledger with a general-engineering block (trading-zone's shape): a product section, a
 * bare `# Part G.` wrapper with only prose, one G-run section (real seed IDs, routed to
 * SUB-900 "Configuration and provenance"), then a product section after the run.
 */
function flatLedgerWithG() {
  return [
    "# g-fixture requirements",
    "",
    "## 1. Before",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| R-001 | The before thing shall work. | untested | — |",
    "",
    "# Part G. General engineering requirements",
    "",
    "Prose for the general block.",
    "",
    "## G1. Configuration",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| G-001 | fixture general row one shall hold. | untested | — |",
    "| G-002 | fixture general row two shall hold. | untested | — |",
    "",
    "## G2. Module boundaries",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| G-004 | fixture general row three shall hold. | untested | — |",
    "",
    "## 2. After",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| R-002 | The after thing shall work. | untested | — |",
    "",
  ].join("\n");
}

const flatLines = (s) => s.split("\n").length - 1;

// ==================================================================================================
// R-1162
// ==================================================================================================

{
  const dir = writeLedger(scratchDir("t1"), flatLedger());
  const before = readFileSync(join(dir, "REQUIREMENTS.md"));
  const r = lift(["--root", dir]);
  const after = readFileSync(join(dir, "REQUIREMENTS.md"));
  const idLines = lines(r.stdout).filter((l) => /^(CAP|FEAT|SUB)-/.test(l));
  const moveLines = lines(r.stdout).filter((l) => l.includes("->") || l.includes("→"));
  const proof = proofOf(r.stdout);
  // req: R-1162
  check("R-1162: a dry run prints one line per planned heading, no move, and the proof line, and writes nothing",
    r.status === 0 && idLines.length === 3 && moveLines.length === 0 && proof !== null && proof.rows === 3 && proof.treeProblems === 0 && before.equals(after),
    `status=${r.status} idLines=${idLines.length} moves=${moveLines.length} proof=${JSON.stringify(proof)} ` + own(r.stderr).join(" | "));
}

{
  const dir = writeLedger(scratchDir("t2"), flatLedger());
  const dest = join(dir, "map.json");
  const r1 = lift(["--root", dir, "--emit-mapping", dest]);
  const map1 = readFileSync(dest, "utf8");
  const r2 = lift(["--root", dir, "--emit-mapping", dest]);
  const otherFiles = (() => { try { return readFileSync(dest, "utf8"); } catch { return null; } })();
  // req: R-1162
  check("R-1162: --emit-mapping writes only the named new file and refuses one that exists",
    r1.status === 0 && JSON.parse(map1).lift === 1 && r2.status !== 0 && !crashed(r2) && otherFiles === map1,
    `r1=${r1.status} r2=${r2.status} ` + own(r2.stderr).join(" | "));
}

if (process.platform !== "win32") {
  const dir = writeLedger(scratchDir("t3"), flatLedgerNoParts());
  const link = join(scratchRoot, "lift-link.mjs");
  try { symlinkSync(LIFT, link); } catch {}
  const r = node([link, "--root", dir]);
  const proof = proofOf(r.stdout);
  // req: R-1162
  check("R-1162: run through a symlink to the script, the dry run still prints its plan",
    r.status === 0 && proof !== null && proof.rows === 2,
    `status=${r.status} proof=${JSON.stringify(proof)} ` + own(r.stderr).join(" | "));
}

{
  // R-002 sits physically before R-001 in the input, so a leaf sorted by ID (R-1162's identity
  // mapping must list rows in FILE order, not ID order) would change these bytes.
  const outOfIdOrder = (() => {
    const ls = flatLedger().split("\n");
    const i1 = ls.findIndex((l) => l.startsWith("| R-001 |"));
    const i2 = ls.findIndex((l) => l.startsWith("| R-002 |"));
    [ls[i1], ls[i2]] = [ls[i2], ls[i1]];
    return ls.join("\n");
  })();
  const dir = gitRepo("t31", outOfIdOrder);
  const w = lift(["--root", dir, "--write"]);
  const lifted = readLedger(dir);
  const idPath = join(dir, "identity.json");
  const emit = lift(["--root", dir, "--emit-mapping", idPath]);
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "mapping");
  const applied = lift(["--root", dir, "--mapping", idPath]);
  const moveLines = lines(applied.stdout).filter((l) => l.includes("->") || l.includes("→"));
  const idMap = JSON.parse(readFileSync(idPath, "utf8"));
  const w2 = lift(["--root", dir, "--mapping", idPath, "--write"]);
  const afterIdentity = readLedger(dir);
  // req: R-1162
  check("R-1162: --emit-mapping on a lifted ledger writes the identity mapping, which --mapping applies with no move line and the same bytes",
    w.status === 0 && emit.status === 0 && idMap.lift === 1 && applied.status === 0 && moveLines.length === 0 && w2.status === 0 && afterIdentity.equals(lifted),
    `w=${w.status} emit=${emit.status} applied=${applied.status} moves=${moveLines.length} w2=${w2.status} ` + own(applied.stderr).concat(own(w2.stderr)).join(" | "));
}

// ==================================================================================================
// R-1163
// ==================================================================================================

{
  const text = (() => {
    // Trailing space INSIDE a cell, and a SEPARATE row with trailing whitespace at the very
    // end of its line (outside any cell) — a line-end trim would catch only the second shape.
    let t = flatLedger().replace("| R-003 | The third thing shall work. | untested | — |", "| R-003 | The third thing shall work.  | untested | — |  ");
    // R-001 and R-002 physically swapped: file order now differs from ID-ascending order, so a
    // "sort by ID" mutation (which would coincidentally reproduce the already-ascending default
    // fixture) changes the output here.
    const ls = t.split("\n");
    const i1 = ls.findIndex((l) => l.startsWith("| R-001 |"));
    const i2 = ls.findIndex((l) => l.startsWith("| R-002 |"));
    [ls[i1], ls[i2]] = [ls[i2], ls[i1]];
    return ls.join("\n");
  })();
  const dir = writeLedger(scratchDir("t4"), text);
  const r = lift(["--root", dir]);
  const proof = proofOf(r.stdout);
  const inIds = (text.match(/\| R-\d{3} \|/g) ?? []).map((m) => m.match(/R-\d{3}/)[0]);
  const w = gitRepo("t4w", text);
  const write = lift(["--root", w, "--write"]);
  const lifted = readLedger(w).toString("utf8");
  const outIds = (lifted.match(/\| R-\d{3} \|/g) ?? []).map((m) => m.match(/R-\d{3}/)[0]);
  const rowLine = (src, id) => src.split("\n").find((l) => l.startsWith(`| ${id} |`));
  const byteIdentical = inIds.every((id) => rowLine(lifted, id) === rowLine(text, id));
  const fileOrder = JSON.stringify(outIds) === JSON.stringify(inIds);
  const ck = node([join(REPO_ROOT, "scripts/requirements-tree.mjs"), "--root", w]);
  // req: R-1163
  check("R-1163: the default lift passes its proof, keeps every row line byte-identical and in file order, the row-ID multiset equal and the tree checker clean",
    r.status === 0 && proof?.rows === 3 && write.status === 0 && byteIdentical && fileOrder && JSON.stringify([...outIds].sort()) === JSON.stringify([...inIds].sort()) && ck.status === 0,
    `r=${r.status} write=${write.status} byteIdentical=${byteIdentical} fileOrder=${fileOrder} ck=${ck.status} ` + own(ck.stderr).join(" | "));
}

{
  const lf = flatLedger();
  const crlf = lf.replace(/\n/g, "\r\n");
  const bomCrlf = "﻿" + crlf;
  const mixed = lf.split("\n").map((l, i) => (i % 2 === 0 ? `${l}\r\n` : `${l}\n`)).join("").replace(/\n$/, "");
  const unterminated = lf.replace(/\n$/, ""); // drop the final newline
  const results = [["LF", lf], ["CRLF", crlf], ["BOM-and-CRLF", bomCrlf], ["mixed-ending", mixed], ["unterminated", unterminated]].map(([label, text]) => {
    const dir = gitRepo(`t5-${label}`, text);
    const w = lift(["--root", dir, "--write"]);
    const outBuf = readLedger(dir);
    const inBuf = Buffer.from(text, "utf8");
    const inRowLines = text.split(/(?<=\n)|(?!\n)$/).filter((s) => /^\| R-\d{3} \|/.test(s.replace(/\r?\n$/, "")));
    const outText = outBuf?.toString("utf8") ?? "";
    const rowsKept = inRowLines.every((seg) => outText.includes(seg) || outText.endsWith(seg.replace(/\r?\n$/, "")));
    return { label, status: w.status, rowsKept, endsLikeInput: label !== "unterminated" || !outText.endsWith("\n") };
  });
  // req: R-1163
  check("R-1163: CRLF, BOM-and-CRLF, mixed-ending and unterminated ledgers keep every row line byte-identical with its own ending",
    results.every((r) => r.status === 0 && r.rowsKept && r.endsLikeInput),
    JSON.stringify(results));
}

{
  const base = flatLedger();
  const dir0 = gitRepo("t6-base", base);
  lift(["--root", dir0, "--write"]);
  const goodOut = readLedger(dir0).toString("utf8");
  // Re-derive the real mapping used, via --emit-mapping on a fresh identical copy, then probe proveLift directly.
  const mapDir = gitRepo("t6-map", base);
  const mapPath = join(mapDir, "map.json");
  const emit = lift(["--root", mapDir, "--emit-mapping", mapPath]); // the DEFAULT mapping of the flat base, not yet lifted
  const mapObj = JSON.parse(readFileSync(mapPath, "utf8"));
  const probe = (outputText, fromDefault = true) => proveLift(base, mapObj, outputText, SEED_TEXT, { fromDefault });
  const baseline = probe(goodOut);
  const T = {};
  T.droppedRow = probe(goodOut.replace(/\n\| R-002 \|.*\|\n/, "\n"));
  T.changedByte = probe(goodOut.replace("The first thing shall work.", "The First thing shall work."));
  T.strippedCR = probe(goodOut.replace(/\| R-001 \|([^\n]*)\|\n/, (m) => m)); // placeholder; real CR case covered by T5's own ledger
  T.newRowShapedLine = probe(`${goodOut}\n| R-999 | injected | untested | — |\n`);
  T.reorderedLeaf = probe((() => { const ls = goodOut.split("\n"); const i1 = ls.findIndex((l) => l.startsWith("| R-001 |")); const i2 = ls.findIndex((l) => l.startsWith("| R-002 |")); [ls[i1], ls[i2]] = [ls[i2], ls[i1]]; return ls.join("\n"); })());
  T.lostProseLine = probe(goodOut.replace("Intro prose for the fixture.\n", ""));
  T.proseMovedToAnotherNode = probe((() => { const ls = goodOut.split("\n"); const idx = ls.indexOf("Intro prose for the fixture."); if (idx < 0) return goodOut; ls.splice(idx, 1); const feat2 = ls.findIndex((l) => l.includes("FEAT-002")); ls.splice(feat2 + 2, 0, "Intro prose for the fixture."); return ls.join("\n"); })());
  T.droppedBlankLine = probe(goodOut.replace("fixture.\n\n# CAP", "fixture.\n# CAP"));
  T.swappedLines = probe((() => { const ls = goodOut.split("\n"); const iDelim = ls.findIndex((l) => l === "|---|---|---|---|"); const iRow = ls.findIndex((l) => l.startsWith("| R-001 |")); if (iDelim < 0 || iRow < 0) return goodOut; [ls[iDelim], ls[iRow]] = [ls[iRow], ls[iDelim]]; return ls.join("\n"); })());
  T.rowsOutOfOrder = probe((() => { const ls = goodOut.split("\n"); const i1 = ls.findIndex((l) => l.startsWith("| R-001 |")); const i2 = i1 + 1; [ls[i1], ls[i2]] = [ls[i2], ls[i1]]; return ls.join("\n"); })());
  T.duplicatedRow = probe(goodOut.replace(/(\| R-001 \|[^\n]*\|\n)/, "$1$1"));
  T.renumberedId = probe(goodOut.replace("| R-002 |", "| R-004 |"));
  T.rowMovedIntoFence = probe(goodOut.replace(/(\| R-003 \|[^\n]*\|\n)/, "```\n$1```\n"));
  T.headingIdCollision = probe(goodOut.replace("## FEAT-002 ·", "## FEAT-001 ·"));
  // A stripped CR: a CRLF-based ledger whose output row loses its \r.
  const crlfBase = flatLedger().replace(/\n/g, "\r\n");
  const crlfDir = gitRepo("t6-crlf", crlfBase);
  lift(["--root", crlfDir, "--write"]);
  const crlfOut = readLedger(crlfDir).toString("utf8");
  const crlfMapPath = join(crlfDir, "map.json");
  lift(["--root", crlfDir, "--emit-mapping", crlfMapPath]);
  const crlfMap = JSON.parse(readFileSync(crlfMapPath, "utf8"));
  T.strippedCR = proveLift(crlfBase, crlfMap, crlfOut.replace("| R-001 | The first thing shall work. | untested | — |\r\n", "| R-001 | The first thing shall work. | untested | — |\n"), SEED_TEXT, { fromDefault: true });
  // An unterminated last row given an ending: a ledger whose last line, a row, has no final newline.
  const untermBase = "# u fixture\n\n## 1. One\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | the last thing shall work. | untested | — |";
  const uDir = gitRepo("t6-unterm", untermBase);
  lift(["--root", uDir, "--write"]);
  const uOut = readLedger(uDir).toString("utf8");
  const uMapPath = join(uDir, "map.json");
  lift(["--root", uDir, "--emit-mapping", uMapPath]);
  const uMap = JSON.parse(readFileSync(uMapPath, "utf8"));
  T.unterminatedGivenEnding = proveLift(untermBase, uMap, uOut.endsWith("\n") ? uOut : `${uOut}\n`, SEED_TEXT, { fromDefault: true });
  // Split capability: a synthetic second "Not yet sorted" capability inserted mid-run, so
  // FEAT-002 (one generated capability's worth) sits under a NEW CAP-02 instead of CAP-01 —
  // check 9's default-derived sequence expects exactly one capability over this whole run.
  T.splitCapability = probe(goodOut.replace("## FEAT-002 ·", `# CAP-02 · ${LIFT_MODULE.UNSORTED_LABEL}\nPurpose: ${LIFT_MODULE.UNSORTED_TEXT}\nOutcome: ${LIFT_MODULE.UNSORTED_TEXT}\n## FEAT-002 ·`));
  // CAP-90 nesting: a product feature's capability heading removed, so it falls under CAP-90
  // by plain nesting (trading-zone's shape) — no R row may sit under CAP-90 (checks 9, reserved).
  (() => {
    const gBase = flatLedgerWithG();
    const gDir = gitRepo("t6-g", gBase);
    lift(["--root", gDir, "--write"]);
    const gOut = readLedger(gDir).toString("utf8");
    const gMapPath = join(gDir, "map.json");
    lift(["--root", gDir, "--emit-mapping", gMapPath]);
    const gMap = JSON.parse(readFileSync(gMapPath, "utf8"));
    const nested = gOut.replace(/\n# CAP-\d{2} · Not yet sorted\nPurpose: [^\n]*\nOutcome: [^\n]*\n(?=## FEAT-\d{3} · 2\. After)/, "\n");
    T.cap90Nesting = proveLift(gBase, gMap, nested, SEED_TEXT, { fromDefault: true });
  })();
  // A blank line dropped from a RE-LAID leaf's prose: rows reordered via a hand-edited identity
  // mapping (so the leaf is no longer "in place") and lifted again, then one blank line removed
  // from its carried prose.
  (() => {
    const proseBase = ["# prose fixture", "", "## 1. One", "", "Prose line A.", "", "Prose line B.", "", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-001 | first thing shall work. | untested | — |", "| R-002 | second thing shall work. | untested | — |", ""].join("\n");
    const pDir = gitRepo("t6-relaid", proseBase);
    lift(["--root", pDir, "--write"]);
    const liftedOnce = readLedger(pDir).toString("utf8");
    const pMapPath = join(pDir, "map.json");
    lift(["--root", pDir, "--emit-mapping", pMapPath]);
    const pMap = JSON.parse(readFileSync(pMapPath, "utf8"));
    pMap.tree[0].features[0].rows = [...pMap.tree[0].features[0].rows].reverse(); // declared order now differs from input order: re-laid
    writeFileSync(pMapPath, JSON.stringify(pMap));
    gitC(pDir, "add", "-A"); gitC(pDir, "commit", "-qm", "reorder");
    lift(["--root", pDir, "--mapping", pMapPath, "--write"]);
    const relaidOut = readLedger(pDir).toString("utf8");
    const tampered = relaidOut.replace("Prose line A.\n\nProse line B.\n", "Prose line A.\nProse line B.\n");
    T.blankDroppedRelaid = proveLift(liftedOnce, pMap, tampered, SEED_TEXT, { fromDefault: false });
  })();
  // A section's (non-row) lines out of input order, with no mapping: two prose lines inside
  // one section swapped, distinct from a leaf's ROWS out of order (T.rowsOutOfOrder) above.
  (() => {
    const proseBase2 = ["# prose fixture two", "", "## 1. One", "", "Prose line A.", "", "Prose line B.", "", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-001 | first thing shall work. | untested | — |", "| R-002 | second thing shall work. | untested | — |", ""].join("\n");
    const dir4 = gitRepo("t6-order", proseBase2);
    lift(["--root", dir4, "--write"]);
    const goodOut4 = readLedger(dir4).toString("utf8");
    const mapDir4 = gitRepo("t6-order-map", proseBase2);
    const mapPath4 = join(mapDir4, "map.json");
    lift(["--root", mapDir4, "--emit-mapping", mapPath4]);
    const mapObj4 = JSON.parse(readFileSync(mapPath4, "utf8"));
    const swapped = goodOut4.replace("Prose line A.\n\nProse line B.\n", "Prose line B.\n\nProse line A.\n");
    T.sectionLinesOutOfOrder = proveLift(proseBase2, mapObj4, swapped, SEED_TEXT, { fromDefault: true });
  })();
  // A G row in another reserved subgroup: SUB-901's one row physically swapped into SUB-900's
  // table, with no mapping change — the proof's own G-row-subgroup rule, not the validator's.
  (() => {
    const gBase2 = flatLedgerWithG();
    const gDir2 = gitRepo("t6-gsub", gBase2);
    lift(["--root", gDir2, "--write"]);
    const gOut2 = readLedger(gDir2).toString("utf8");
    const gMapPath2 = join(gDir2, "map.json");
    lift(["--root", gDir2, "--emit-mapping", gMapPath2]);
    const gMap2 = JSON.parse(readFileSync(gMapPath2, "utf8"));
    const moved = gOut2.replace("| G-004 | fixture general row three shall hold. | untested | — |\n\n", "").replace("| G-001 | fixture general row one shall hold. | untested | — |\n", "| G-001 | fixture general row one shall hold. | untested | — |\n| G-004 | fixture general row three shall hold. | untested | — |\n");
    T.gRowWrongSubgroup = proveLift(gBase2, gMap2, moved, SEED_TEXT, { fromDefault: true });
  })();
  // Each entry asserts BOTH that the probe is red AND that it names the SPECIFIC problem text
  // the check it targets emits (brief 3 §D) — a redundant check elsewhere catching the same
  // tamper under a DIFFERENT message would not, by itself, satisfy the pattern.
  const tz = [
    ["R-1163: proof names a dropped row", T.droppedRow, /appears 0 time\(s\) in the output/],
    ["a changed byte", T.changedByte, /output bytes differ from the input/],
    ["a stripped CR", T.strippedCR, /output bytes differ from the input/],
    ["a new row-shaped line", T.newRowShapedLine, /appears in the output but not in the input/],
    ["a reordered leaf", T.reorderedLeaf, /output row order .* differs from the mapping's/],
    ["a lost prose line", T.lostProseLine, /^head: the first \d+ line\(s\) are not carried verbatim/],
    ["prose moved to another node", T.proseMovedToAnotherNode, /prose from its old section\(s\) is missing, reordered, stray, or duplicated/],
    ["a dropped blank line", T.droppedBlankLine, /^head: the first \d+ line\(s\) are not carried verbatim/],
    ["two swapped lines", T.swappedLines, /are not accounted for by the head, any node or the tail/],
    ["rows out of input order", T.rowsOutOfOrder, /does not follow the input's own order for its old section\(s\)/],
    ["a duplicated row", T.duplicatedRow, /appears more than once in the output/],
    ["a renumbered ID", T.renumberedId, /appears 0 time\(s\) in the output|appears in the output but not in the input/],
    ["a row moved into a fence", T.rowMovedIntoFence, /output row order \[\] differs from the mapping's/],
    ["a heading-ID collision", T.headingIdCollision, /duplicate heading ID/],
    ["an unterminated last row given an ending", T.unterminatedGivenEnding, /the input's last line has no line ending, but the output's last line does/],
    ["a split capability", T.splitCapability, /the output's heading sequence does not equal the sequence derived from the input alone/],
    ["CAP-90 nesting (reserved R-row rule)", T.cap90Nesting, /an R row sits under reserved capability CAP-90/],
    ["a blank line dropped from a re-laid leaf", T.blankDroppedRelaid, /prose from its old section\(s\) is missing, reordered, stray, or duplicated/],
    ["a section's lines out of order", T.sectionLinesOutOfOrder, /prose from its old section\(s\) is missing, reordered, stray, or duplicated/],
    ["a G row in another reserved subgroup", T.gRowWrongSubgroup, /not its seed subgroup/],
  ];
  const allRed = tz.every(([, r, pattern]) => r.problems.length > 0 && r.problems.some((p) => pattern.test(p)));
  const baselineClean = baseline.problems.length === 0;
  // req: R-1163
  check("R-1163: the proof names a dropped row, a changed byte, a stripped CR, a new row-shaped line, a reordered leaf, a lost prose line, prose moved to another node, a dropped blank line and two swapped lines in an in-place leaf, and, with no mapping, a leaf's rows and a section's lines out of input order",
    baselineClean && allRed,
    `baseline=${baseline.problems.join(";")} ` + tz.filter(([, r, pattern]) => !(r.problems.length > 0 && r.problems.some((p) => pattern.test(p)))).map(([label, r]) => `${label}: ${JSON.stringify(r.problems)}`).join(" | "));
}

{
  const importsOf = (abs) => { let src; try { src = readFileSync(abs, "utf8"); } catch { return null; } return [...src.matchAll(/(?:^|[\s;])(?:import|export)\s*(?:[^'"`;]*?\sfrom\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1] ?? m[2]); };
  const proofAbs = join(REPO_ROOT, "scripts/requirements-lift-proof.mjs");
  const direct = importsOf(proofAbs) ?? [];
  const reach = new Set(); const stack = [proofAbs];
  while (stack.length) { const f = stack.pop(); if (reach.has(f)) continue; reach.add(f); for (const s of importsOf(f) ?? []) if (s.startsWith(".")) stack.push(join(dirname(f), s)); }
  // req: R-1163
  check("R-1163: the proof module imports nothing from the lift module",
    direct.every((s) => !s.includes("requirements-lift.mjs") || s.includes("requirements-lift-proof.mjs")) && ![...reach].some((f) => f.endsWith("requirements-lift.mjs")),
    direct.join(", "));
}

// ==================================================================================================
// R-1164
// ==================================================================================================

{
  const sub = "proj";
  const dir = scratchDir("t8");
  writeLedger(join(dir, sub), flatLedger());
  gitC(dir, "init", "-q", "-b", "main");
  gitC(dir, "config", "core.autocrlf", "false");
  gitC(dir, "add", "-A");
  gitC(dir, "commit", "-qm", "init");
  const before = readLedger(join(dir, sub));
  const w = lift(["--root", join(dir, sub), "--write"]);
  const after = readLedger(join(dir, sub));
  const ck = node([join(REPO_ROOT, "scripts/requirements-tree.mjs"), "--root", join(dir, sub)]);
  // req: R-1164
  check("R-1164: --write replaces a clean tracked ledger with the proved bytes in a project in a subfolder of its repository",
    w.status === 0 && !after.equals(before) && ck.status === 0,
    `w=${w.status} ck=${ck.status} ` + own(w.stderr).concat(own(ck.stderr)).join(" | "));
}

{
  const cases = [];
  // uncommitted (modified after commit)
  {
    const dir = gitRepo("t9-uncommitted", flatLedger());
    writeFileSync(join(dir, "REQUIREMENTS.md"), `${readLedger(dir)}\n`);
    const before = readLedger(dir);
    const r = lift(["--root", dir, "--write"]);
    cases.push({ label: "uncommitted", ok: r.status === 1 && !crashed(r) && readLedger(dir).equals(before) });
  }
  // staged-only
  {
    const dir = gitRepo("t9-staged", flatLedger());
    writeFileSync(join(dir, "REQUIREMENTS.md"), `${readLedger(dir)}\n`);
    gitC(dir, "add", "REQUIREMENTS.md");
    const before = readLedger(dir);
    const r = lift(["--root", dir, "--write"]);
    cases.push({ label: "staged-only", ok: r.status === 1 && !crashed(r) && readLedger(dir).equals(before) });
  }
  // untracked
  {
    const dir = scratchDir("t9-untracked");
    writeLedger(dir, flatLedger());
    gitC(dir, "init", "-q", "-b", "main");
    gitC(dir, "config", "core.autocrlf", "false");
    gitC(dir, "commit", "--allow-empty", "-qm", "init");
    const before = readLedger(dir);
    const r = lift(["--root", dir, "--write"]);
    cases.push({ label: "untracked", ok: r.status === 1 && !crashed(r) && readLedger(dir).equals(before) });
  }
  // git-less
  {
    const dir = scratchDir("t9-nogit");
    writeLedger(dir, flatLedger());
    const before = readLedger(dir);
    const r = lift(["--root", dir, "--write"]);
    cases.push({ label: "git-less", ok: r.status === 1 && !crashed(r) && readLedger(dir).equals(before) });
  }
  // unborn HEAD
  {
    const dir = scratchDir("t9-unborn");
    writeLedger(dir, flatLedger());
    gitC(dir, "init", "-q", "-b", "main");
    gitC(dir, "config", "core.autocrlf", "false");
    const before = readLedger(dir);
    const r = lift(["--root", dir, "--write"]);
    cases.push({ label: "unborn-HEAD", ok: r.status === 1 && !crashed(r) && readLedger(dir).equals(before) });
  }
  // staged but unborn HEAD: `ls-files --error-unmatch` succeeds (the file IS in the index), so
  // this is the only case that reaches `git diff --quiet HEAD` with no commit to diff against
  // (status 128) -- unlike the untracked "unborn HEAD" case above, which ls-files alone already
  // refuses (3/6: null/128 read as clean, pinned by its own wording here).
  {
    const dir = scratchDir("t9-staged-unborn");
    writeLedger(dir, flatLedger());
    gitC(dir, "init", "-q", "-b", "main");
    gitC(dir, "config", "core.autocrlf", "false");
    gitC(dir, "add", "-A");
    const before = readLedger(dir);
    const r = lift(["--root", dir, "--write"]);
    cases.push({ label: "staged-unborn-HEAD", ok: r.status === 1 && !crashed(r) && own(r.stderr).some((l) => /HEAD has no commit yet/.test(l)) && readLedger(dir).equals(before) });
  }
  // git missing from PATH
  {
    const dir = gitRepo("t9-nopath", flatLedger());
    const emptyPath = scratchDir("t9-emptypath");
    const before = readLedger(dir);
    const r2 = spawnSync(process.execPath, [LIFT, "--root", dir, "--write"], { cwd: dir, encoding: "utf8", env: { ...cleanEnv(), PATH: emptyPath } });
    cases.push({ label: "git-missing", ok: r2.status === 1 && !crashed(r2) && readLedger(dir).equals(before) });
  }
  // an uncommitted edit in a SECOND worktree, naming it
  {
    const main = gitRepo("t9-main", flatLedger());
    const laneDir = join(scratchRoot, "t9-lane");
    const wt = gitC(main, "worktree", "add", "-q", "-b", "t9-lane", laneDir);
    writeFileSync(join(laneDir, "REQUIREMENTS.md"), `${readLedger(laneDir)}\n`);
    const beforeMain = readLedger(main);
    const r = lift(["--root", main, "--write"]);
    cases.push({ label: "dirty-second-worktree", ok: wt.status === 0 && r.status === 1 && !crashed(r) && own(r.stderr).some((l) => l.includes(laneDir) || l.includes("t9-lane")) && readLedger(main).equals(beforeMain) });
  }
  const bad = cases.filter((c) => !c.ok).map((c) => c.label);
  // req: R-1164
  check("R-1164: --write refuses an uncommitted, staged-only, untracked or git-less ledger, an unborn HEAD, git missing from PATH and an uncommitted ledger edit in a second worktree, naming that worktree, and leaves the ledger unchanged",
    bad.length === 0, bad.join(", "));
}

{
  const sub = "proj";
  const dir = scratchDir("t10");
  writeLedger(join(dir, sub), flatLedger());
  mkdirSync(join(dir, sub, "maps"), { recursive: true });
  gitC(dir, "init", "-q", "-b", "main");
  gitC(dir, "config", "core.autocrlf", "false");
  gitC(dir, "add", "-A");
  gitC(dir, "commit", "-qm", "init");
  const mapPath = join(dir, sub, "maps", "map.json");
  const emit = lift(["--root", join(dir, sub), "--emit-mapping", mapPath]);
  // untracked mapping
  const r1 = lift(["--root", join(dir, sub), "--mapping", mapPath, "--write"]);
  const untrackedOk = r1.status === 1 && !crashed(r1) && own(r1.stderr).some((l) => l.includes("map.json"));
  // differs from HEAD
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "map");
  writeFileSync(mapPath, `${readFileSync(mapPath, "utf8")}\n`);
  const r2 = lift(["--root", join(dir, sub), "--mapping", mapPath, "--write"]);
  const changedOk = r2.status === 1 && !crashed(r2) && own(r2.stderr).some((l) => l.includes("map.json"));
  gitC(dir, "checkout", "--", `${sub}/maps/map.json`);
  // outside the repository
  const outsideMap = join(scratchRoot, "outside-map.json");
  writeFileSync(outsideMap, readFileSync(mapPath, "utf8"));
  const r3 = lift(["--root", join(dir, sub), "--mapping", outsideMap]);
  const outsideOk = r3.status === 1 && !crashed(r3);
  // accepts a committed one
  const r4 = lift(["--root", join(dir, sub), "--mapping", mapPath, "--write"]);
  const acceptOk = r4.status === 0;
  // req: R-1164
  check("R-1164: --write refuses a mapping file in a subfolder that is untracked or differs from HEAD, and one outside the repository, naming the reason, and accepts a committed one",
    emit.status === 0 && untrackedOk && changedOk && outsideOk && acceptOk,
    `untracked=${untrackedOk} changed=${changedOk} outside=${outsideOk} accept=${acceptOk} ` + own(r1.stderr).concat(own(r2.stderr), own(r3.stderr), own(r4.stderr)).join(" | "));
}

{
  // gitC (used by gitRepo) pins -c core.autocrlf=false on every call it makes, including its
  // own "add", so the blob it commits is never actually normalised: a byte compare of that
  // blob against the CRLF working file would coincidentally still agree (both CRLF), which
  // would not catch a mutation that byte-compares instead of using "git diff --quiet" (3/2).
  // Committing with the bare git() helper instead (persisted config, no per-call override) lets
  // the repo's own core.autocrlf=true actually normalise the STORED blob to LF while the
  // working file stays CRLF -- the real shape research-design.md §2 names.
  const text = flatLedger().replace(/\n/g, "\r\n");
  const dir = scratchDir("t11");
  writeLedger(dir, text);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "test");
  git(dir, "config", "user.email", "test@example.invalid");
  git(dir, "config", "commit.gpgsign", "false");
  git(dir, "config", "core.autocrlf", "true");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "init");
  const blobLf = git(dir, "show", "HEAD:./REQUIREMENTS.md").stdout;
  const workingCrlf = readLedger(dir).toString("utf8");
  const w = lift(["--root", dir, "--write"]);
  const out = readLedger(dir).toString("utf8");
  const crlfRows = out.split(/(?<=\n)/).filter((l) => /^\| R-\d{3} \|/.test(l)).every((l) => l.endsWith("\r\n"));
  // req: R-1164
  check("R-1164: --write accepts a clean CRLF checkout under core.autocrlf=true and keeps its CRLF rows",
    blobLf !== workingCrlf && w.status === 0 && crlfRows,
    `blobEqualsWorking=${blobLf === workingCrlf} w=${w.status} ` + own(w.stderr).join(" | "));
}

{
  // The write step's OWN file functions are injected (CHANGE.md §3.6), so this exercises the
  // re-read-to-rename window directly: the ledger is clean and the proof already ran against
  // `provedBuf`, but the injected read returns DIFFERENT bytes, as if another process had
  // edited the file in the instant between the proof and this call — distinct from editing the
  // file before the run even starts, which the earlier HEAD-vs-ledger gate check would catch
  // instead (the gap this test used to leave).
  const dir = gitRepo("t12", flatLedger());
  const ledgerPath = join(dir, "REQUIREMENTS.md");
  const provedBuf = readLedger(dir);
  const raceBuf = Buffer.from(`${provedBuf.toString("utf8")}\n`, "utf8");
  let wroteTemp = false, renamed = false;
  const injected = {
    readFileSync: () => raceBuf,
    writeFileSync: () => { wroteTemp = true; },
    renameSync: () => { renamed = true; },
    rmSync: () => {},
  };
  const result = LIFT_MODULE.writeLedgerAtomic(ledgerPath, provedBuf, "would-be lifted output", injected);
  const untouched = readLedger(dir).equals(provedBuf);
  // req: R-1164
  check("R-1164: --write refuses when the ledger changes between the proof and the rename",
    result.ok === false && /changed since the proof/.test(result.reason ?? "") && !wroteTemp && !renamed && untouched,
    JSON.stringify(result));
}

{
  // A failed rename (CHANGE.md residual 6: antivirus or the indexer, more likely than an
  // editor) removes the temp file and refuses, naming the reason, rather than leaving a stray
  // ".tmp" file or a half-replaced ledger.
  const dir = gitRepo("t12b", flatLedger());
  const ledgerPath = join(dir, "REQUIREMENTS.md");
  const provedBuf = readLedger(dir);
  let removedTmpPath = null;
  const injected = {
    readFileSync: () => provedBuf,
    writeFileSync: () => {},
    renameSync: () => { throw new Error("EPERM: simulated rename failure"); },
    rmSync: (p) => { removedTmpPath = p; },
  };
  const result = LIFT_MODULE.writeLedgerAtomic(ledgerPath, provedBuf, "would-be lifted output", injected);
  const untouched = readLedger(dir).equals(provedBuf);
  // req: R-1164
  check("R-1164: a failed rename removes the temp file and refuses, naming the reason, and leaves the ledger unchanged",
    result.ok === false && /could not replace the ledger/.test(result.reason ?? "") && /simulated rename failure/.test(result.reason ?? "") && removedTmpPath === `${ledgerPath}.lift-${process.pid}.tmp` && untouched,
    JSON.stringify({ result, removedTmpPath }));
}

if (process.platform !== "win32") {
  const sub = "proj";
  const dir = scratchDir("t32");
  writeLedger(join(dir, sub), flatLedger());
  mkdirSync(join(dir, sub, "maps"), { recursive: true });
  gitC(dir, "init", "-q", "-b", "main");
  gitC(dir, "config", "core.autocrlf", "false");
  gitC(dir, "add", "-A");
  gitC(dir, "commit", "-qm", "base");
  const base = gitC(dir, "rev-parse", "HEAD").stdout.trim();

  const altLink = join(scratchRoot, "t32-git-alias");
  try { symlinkSync(dir, altLink); } catch {}
  const stubDir = gitStub(altLink);
  const stubEnv = { ...cleanEnv(), PATH: `${stubDir}${delimiter}${process.env.PATH ?? ""}` };
  const liftStub = (args) => node([LIFT, ...args], join(dir, sub), { env: stubEnv });

  const mapPath = join(dir, sub, "maps", "map.json");
  const emit = liftStub(["--root", join(dir, sub), "--emit-mapping", mapPath]);
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "map");
  const w = liftStub(["--root", join(dir, sub), "--mapping", mapPath, "--write"]);
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "lift");
  const v = liftStub(["--root", join(dir, sub), "--mapping", mapPath, "--verify", base]);
  // req: R-1164
  check("R-1164: --write and --verify relate the ledger and mapping to the repository when --root is spelled differently from git's top level",
    emit.status === 0 && w.status === 0 && v.status === 0 && !crashed(emit) && !crashed(w) && !crashed(v),
    `emit=${emit.status} w=${w.status} v=${v.status} ` + own(emit.stderr).concat(own(w.stderr), own(v.stderr)).join(" | "));
}

// ==================================================================================================
// R-1165
// ==================================================================================================

{
  const dir = gitRepo("t13", flatLedger());
  const w = lift(["--root", dir, "--write"]);
  const out = readLedger(dir).toString("utf8");
  const caps = (out.match(/^# CAP-\d{2} · .+$/gm) ?? []);
  const feats = (out.match(/^## FEAT-\d{3} · .+$/gm) ?? []);
  const titleKept = out.startsWith("# fixture requirements\n\nIntro prose for the fixture.\n");
  // req: R-1165
  check("R-1165: the default makes each Part a capability and each ## and ### a feature and subgroup in file order, keeping old heading text as labels and the title and intro in place",
    w.status === 0 && caps.length === 1 && caps[0].includes("Alpha") && feats.length === 2 && feats[0].includes("1. One") && feats[1].includes("2. Two") && titleKept,
    `caps=${JSON.stringify(caps)} feats=${JSON.stringify(feats)} titleKept=${titleKept}`);
}

{
  const dir = gitRepo("t14", flatLedger());
  lift(["--root", dir, "--write"]);
  const out = readLedger(dir).toString("utf8");
  const purposes = out.match(/^Purpose: .+$/gm) ?? [];
  const outcomes = out.match(/^Outcome: .+$/gm) ?? [];
  // req: R-1165
  check('R-1165: every default purpose and outcome starts with the unsorted prefix, and the prefix is "Not yet sorted:"',
    LIFT_MODULE.UNSORTED_PREFIX === "Not yet sorted:" && purposes.length > 0 && purposes.every((l) => l.startsWith(`Purpose: ${LIFT_MODULE.UNSORTED_PREFIX}`)) && outcomes.every((l) => l.startsWith(`Outcome: ${LIFT_MODULE.UNSORTED_PREFIX}`)),
    JSON.stringify(purposes.slice(0, 2)));
}

{
  const dir = gitRepo("t15", flatLedgerNoParts());
  lift(["--root", dir, "--write"]);
  const out = readLedger(dir).toString("utf8");
  const caps = out.match(/^# CAP-\d{2} · (.+)$/gm) ?? [];
  const gDir = gitRepo("t15-g", flatLedgerWithG());
  lift(["--root", gDir, "--write"]);
  const gOut = readLedger(gDir).toString("utf8");
  const gCaps = gOut.match(/^# CAP-\d{2} · (.+)$/gm) ?? [];
  // req: R-1165
  check("R-1165: sections under no Part, and sections after the general-engineering sections, open a Not yet sorted capability",
    caps.length === 1 && caps[0].endsWith(LIFT_MODULE.UNSORTED_LABEL) && gCaps.filter((c) => c.endsWith(LIFT_MODULE.UNSORTED_LABEL)).length === 2,
    `caps=${JSON.stringify(caps)} gCaps=${JSON.stringify(gCaps)}`);
}

{
  const dir = gitRepo("t16", flatLedgerWithG());
  lift(["--root", dir, "--write"]);
  const out = readLedger(dir).toString("utf8");
  const hasCap90 = /^# CAP-90 · /m.test(out);
  const hasFeat900 = /^## FEAT-900 · /m.test(out);
  const hasSub900 = /^### SUB-900 · /m.test(out);
  const g1 = out.includes("G-001") && out.split("\n").some((l) => l.startsWith("| G-001 |"));
  const underSub900 = (() => { const i = out.indexOf("### SUB-900"); const j = out.indexOf("### SUB-901"); const region = out.slice(i, j < 0 ? out.length : j); return region.includes("| G-001 |") && region.includes("| G-002 |"); })();
  // req: R-1165
  check("R-1165: the general-engineering sections take the seed's CAP-90, FEAT-900 and SUB-900 to SUB-904 headings, purposes and row homes",
    hasCap90 && hasFeat900 && hasSub900 && g1 && underSub900,
    `cap90=${hasCap90} feat900=${hasFeat900} sub900=${hasSub900} under=${underSub900}`);
}

{
  const dir = gitRepo("t17", flatLedger());
  lift(["--root", dir, "--write"]);
  const out = readLedger(dir).toString("utf8");
  // The canonical text is a sealed literal here, never read back from the (possibly mutated)
  // module: comparing the output only against LIFT_MODULE.CLOSING_HEADING would trivially agree
  // with itself if that constant were retyped (R-1165 5/6).
  const canonicalClosing = "# Open questions and deliberate omissions";
  const closeIdx = out.indexOf(canonicalClosing);
  const openIdx = out.indexOf("## Open questions");
  const omitIdx = out.indexOf("## Deliberate omissions");
  // req: R-1165
  check("R-1165: Open questions and Deliberate omissions stay verbatim under the seed's closing heading",
    LIFT_MODULE.CLOSING_HEADING === canonicalClosing && closeIdx >= 0 && openIdx > closeIdx && omitIdx > openIdx && out.includes("1. An open question.") && out.includes("1. A deliberate omission."),
    `close=${closeIdx} open=${openIdx} omit=${omitIdx} CLOSING_HEADING=${JSON.stringify(LIFT_MODULE.CLOSING_HEADING)}`);
}

{
  // aml-desk's shape: a properly headered table, then prose, then a HEADLESS fragment (no
  // header at all), then more prose, then a PADDED header. All three must stay in file order
  // with an exact header pair restored or inserted.
  const text = [
    "# headless fixture",
    "",
    "# Part A. Alpha",
    "",
    "## 1. Fragments",
    "",
    "| ID | Requirement | Status | Evidence |",
    "|---|---|---|---|",
    "| R-001 | First row shall hold. | untested | — |",
    "",
    "Prose between fragments.",
    "",
    "| R-002 | Headless row shall hold. | untested | — |",
    "| R-003 | Second headless row shall hold. | untested | — |",
    "",
    "More prose.",
    "",
    "| ID    | Requirement | Status | Evidence |",
    "| --- | --- | --- | --- |",
    "| R-004 | Padded-header row shall hold. | untested | — |",
    "",
  ].join("\n");
  const dir = gitRepo("t18", text);
  const w = lift(["--root", dir, "--write"]);
  const out = readLedger(dir).toString("utf8");
  const idx = (s) => out.indexOf(s);
  const order = idx("R-001") < idx("Prose between fragments.") && idx("Prose between fragments.") < idx("R-002") && idx("R-003") < idx("More prose.") && idx("More prose.") < idx("R-004");
  const headerPairs = (out.match(/^\| ID \| Requirement \| Status \| Evidence \|\n\|---\|---\|---\|---\|$/gm) ?? []).length;
  const noPadded = !out.includes("| ID    |") && !out.includes("| --- |");
  // req: R-1165
  check("R-1165: prose between table fragments stays between them, and each headless or padded fragment gets the exact table header",
    w.status === 0 && order && headerPairs === 3 && noPadded,
    `status=${w.status} order=${order} headerPairs=${headerPairs} noPadded=${noPadded}`);
}

// ==================================================================================================
// R-1166
// ==================================================================================================

{
  const dirA = gitRepo("t19a", flatLedger());
  const wA = lift(["--root", dirA, "--write"]);
  const outA = readLedger(dirA);
  const dirB = gitRepo("t19b", flatLedger());
  const mapPath = join(dirB, "map.json");
  lift(["--root", dirB, "--emit-mapping", mapPath]);
  gitC(dirB, "add", "-A"); gitC(dirB, "commit", "-qm", "map");
  const wB = lift(["--root", dirB, "--mapping", mapPath, "--write"]);
  const outB = readLedger(dirB);
  // req: R-1166
  check("R-1166: the mapping --emit-mapping writes, passed back with --mapping, gives the default lift's bytes",
    wA.status === 0 && wB.status === 0 && outA.equals(outB),
    `wA=${wA.status} wB=${wB.status}`);
}

{
  const dir = gitRepo("t20", flatLedger());
  lift(["--root", dir, "--write"]);
  const lifted = readLedger(dir).toString("utf8");
  const mapPath = join(dir, "map.json");
  lift(["--root", dir, "--emit-mapping", mapPath]);
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  const cap = map.tree[0];
  const f1 = cap.features.find((f) => f.id === "FEAT-001");
  const f2 = cap.features.find((f) => f.id === "FEAT-002");
  // move R-003 from FEAT-002 into FEAT-001; merge: f2 becomes an empty proposed feature.
  f1.rows = [...f1.rows, ...f2.rows];
  f2.rows = []; f2.status = "proposed";
  writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "map");
  const dry = lift(["--root", dir, "--mapping", mapPath]);
  const moveLines = lines(dry.stdout).filter((l) => (l.includes("->") || l.includes("→")) && l.includes("FEAT-002") && l.includes("FEAT-001"));
  const w = lift(["--root", dir, "--mapping", mapPath, "--write"]);
  const out = readLedger(dir).toString("utf8");
  const f1Region = out.slice(out.indexOf("FEAT-001"), out.indexOf("FEAT-002"));
  const movedIntoF1 = f1Region.includes("| R-003 |");
  const f2Empty = !out.includes("FEAT-002 ·") || (() => { const i = out.indexOf("## FEAT-002"); const j = out.indexOf("##", i + 3); const region = out.slice(i, j < 0 ? out.length : j); return !/\| R-\d{3} \|/.test(region) && region.includes("proposed"); })();
  // req: R-1166
  check("R-1166: a mapping applies to a lifted ledger, moving rows between features in its order and naming each move",
    dry.status === 0 && moveLines.length >= 1 && w.status === 0 && movedIntoF1 && f2Empty,
    `dry=${dry.status} moves=${moveLines.length} w=${w.status} movedIntoF1=${movedIntoF1} f2Empty=${f2Empty}`);
}

{
  // E2: a MERGE (one old heading's `from` folded into another node's `from`, that old node
  // gone from the tree) prints its own move line, naming the retired heading and its new home
  // — distinct from T20's row moves (where the old node still exists, just emptied). Before
  // this fix, a merge printed no line at all: the owner's plan would hide it.
  const dir = gitRepo("t34", flatLedger());
  lift(["--root", dir, "--write"]);
  const mapPath = join(dir, "map.json");
  lift(["--root", dir, "--emit-mapping", mapPath]);
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  const cap = map.tree[0];
  const f1 = cap.features.find((f) => f.id === "FEAT-001");
  const f2 = cap.features.find((f) => f.id === "FEAT-002");
  f1.rows = [...f1.rows, ...f2.rows];
  f1.from = [...f1.from, ...f2.from]; // the merge: FEAT-002's own old heading folds into FEAT-001's `from`
  cap.features = cap.features.filter((f) => f !== f2);
  writeFileSync(mapPath, JSON.stringify(map));
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "merge");
  const dry = lift(["--root", dir, "--mapping", mapPath]);
  const mergeLine = lines(dry.stdout).filter((l) => (l.includes("->") || l.includes("→")) && l.includes("FEAT-002") && l.includes("FEAT-001"));
  const w = lift(["--root", dir, "--mapping", mapPath, "--write"]);
  const out = readLedger(dir).toString("utf8");
  const noMoreFeat2 = !out.includes("FEAT-002");
  const allRowsUnderF1 = out.slice(out.indexOf("FEAT-001"), out.indexOf("## Open questions") < 0 ? out.length : out.indexOf("## Open questions")).includes("| R-003 |");
  // req: R-1162
  check("R-1162: a merge (an old heading folded into another node's from) prints its own move line, naming the retired heading and its new home",
    dry.status === 0 && mergeLine.length === 1 && w.status === 0 && noMoreFeat2 && allRowsUnderF1,
    `dry=${dry.status} mergeLine=${JSON.stringify(mergeLine)} w=${w.status} noMoreFeat2=${noMoreFeat2} allRowsUnderF1=${allRowsUnderF1}`);
}

{
  const lfDir = gitRepo("t21-lf", flatLedger());
  const mapPath = join(lfDir, "map.json");
  lift(["--root", lfDir, "--emit-mapping", mapPath]);
  const mapText = readFileSync(mapPath, "utf8");
  const crlfText = flatLedger().replace(/\n/g, "\r\n");
  const crlfDir = gitRepo("t21-crlf", crlfText);
  writeFileSync(join(crlfDir, "map.json"), mapText);
  gitC(crlfDir, "add", "-A"); gitC(crlfDir, "commit", "-qm", "map");
  const run1 = lift(["--root", lfDir, "--mapping", mapPath]);
  const run2 = lift(["--root", crlfDir, "--mapping", join(crlfDir, "map.json")]);
  // req: R-1166
  check("R-1166: one mapping applies to a ledger's LF and CRLF copies",
    run1.status === 0 && run2.status === 0,
    `lf=${run1.status} crlf=${run2.status} ` + own(run1.stderr).concat(own(run2.stderr)).join(" | "));
}

// ==================================================================================================
// R-1167
// ==================================================================================================

{
  const utf16 = Buffer.from(flatLedger(), "utf16le");
  const dir16 = writeLedger(scratchDir("t22-utf16"), "");
  writeFileSync(join(dir16, "REQUIREMENTS.md"), utf16);
  const r16 = lift(["--root", dir16]);

  const ansi = Buffer.concat([Buffer.from(flatLedger(), "utf8"), Buffer.from("| R-900 | caf", "latin1"), Buffer.from([0xe9]), Buffer.from(" shall serve. | untested | — |\n", "latin1")]);
  const dirA = writeLedger(scratchDir("t22-ansi"), "");
  writeFileSync(join(dirA, "REQUIREMENTS.md"), ansi);
  const rA = lift(["--root", dirA]);
  const ansiLine = flatLedger().split("\n").length;

  const dirNoRows = writeLedger(scratchDir("t22-norows"), "# just a title\n\nSome prose, no rows.\n");
  const rNoRows = lift(["--root", dirNoRows]);

  const fencedText = `${flatLedger()}\n\`\`\`\n| R-100 | fenced row shall hold. | untested | — |\n\`\`\`\n`;
  const dirFenced = writeLedger(scratchDir("t22-fenced"), fencedText);
  const rFenced = lift(["--root", dirFenced]);
  const fencedLine = fencedText.split("\n").findIndex((l) => l.includes("R-100")) + 1;

  const level4Text = flatLedger().replace("## 2. Two", "#### 2. Too deep");
  const dirL4 = writeLedger(scratchDir("t22-l4"), level4Text);
  const rL4 = lift(["--root", dirL4]);
  const l4Line = level4Text.split("\n").findIndex((l) => l.includes("Too deep")) + 1;

  const setextText = flatLedger().replace("## 2. Two\n", "2. Two\n----\n");
  const dirSetext = writeLedger(scratchDir("t22-setext"), setextText);
  const rSetext = lift(["--root", dirSetext]);
  const setextLine = setextText.split("\n").findIndex((l) => l === "2. Two") + 1;

  const alsoText = flatLedger().replace("Intro prose for the fixture.", "Intro prose for the fixture.\n\nAlso applies: R-001");
  const dirAlso = writeLedger(scratchDir("t22-also"), alsoText);
  const rAlso = lift(["--root", dirAlso]);
  const alsoLine = alsoText.split("\n").findIndex((l) => l === "Also applies: R-001") + 1;

  const fieldText = flatLedger().replace("Intro prose for the fixture.", "Intro prose for the fixture.\n\nStatus: active");
  const dirField = writeLedger(scratchDir("t22-field"), fieldText);
  const rField = lift(["--root", dirField]);
  const fieldLine = fieldText.split("\n").findIndex((l) => l === "Status: active") + 1;

  // A repeated row ID (R-1167, mutation 4/14: dropping this specific check must still red
  // here, naming the wording checks 2/3's byte-per-ID accounting needs one line per ID).
  const repeatedText = flatLedger().replace("| R-002 | The second thing shall work. | untested | — |", "| R-002 | The second thing shall work. | untested | — |\n| R-002 | A repeat of the second thing. | untested | — |");
  const dirRepeated = writeLedger(scratchDir("t22-repeated"), repeatedText);
  const rRepeated = lift(["--root", dirRepeated]);
  const repeatedOk = rRepeated.status === 1 && !crashed(rRepeated) && own(rRepeated.stderr).some((l) => /requirement row R-002 repeats line/.test(l));

  const named = (r, n) => r.status === 1 && !crashed(r) && own(r.stderr).some((l) => new RegExp(`\\b${n}\\b`).test(l));
  // req: R-1167
  check("R-1167: the lift refuses a UTF-16 ledger, an ANSI line that is not valid UTF-8, a ledger with no rows, a fenced row, a level-4 or setext heading, an Also applies line and a carried field line, naming each line",
    r16.status === 1 && !crashed(r16) && rA.status === 1 && named(rA, ansiLine) && rNoRows.status === 1 && !crashed(rNoRows) && named(rFenced, fencedLine) && named(rL4, l4Line) && named(rSetext, setextLine) && named(rAlso, alsoLine) && named(rField, fieldLine) && repeatedOk,
    JSON.stringify({ r16: r16.status, rA: own(rA.stderr)[0], rNoRows: own(rNoRows.stderr)[0], rFenced: own(rFenced.stderr)[0], rL4: own(rL4.stderr)[0], rSetext: own(rSetext.stderr)[0], rAlso: own(rAlso.stderr)[0], rField: own(rField.stderr)[0], repeated: own(rRepeated.stderr)[0] }));
}

{
  const treeText = "# CAP-01 · Cap\nPurpose: p\nOutcome: o\n\n## FEAT-001 · Feat\nPurpose: p\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | A thing shall work. | untested | — |\n";
  const dirTree = writeLedger(scratchDir("t23-tree"), treeText);
  const rTree = lift(["--root", dirTree]); // already a tree -> treated as identity, not a refusal; use near-miss instead
  const nearMissText = flatLedger().replace("## 2. Two", "## FEAT-002 - Two");
  const nearMissLine = nearMissText.split("\n").findIndex((l) => l === "## FEAT-002 - Two") + 1;
  const dirNear = writeLedger(scratchDir("t23-near"), nearMissText);
  const rNear = lift(["--root", dirNear]);
  // A row the default cannot place: a product (R-) row mixed into a G-only run.
  const mixedG = flatLedgerWithG().replace("| G-002 | fixture general row two shall hold. | untested | — |", "| R-050 | a product row stuck in the G run shall hold. | untested | — |");
  const dirMixed = writeLedger(scratchDir("t23-mixed"), mixedG);
  const rMixed = lift(["--root", dirMixed]);
  // req: R-1167
  check("R-1167: without --mapping, the lift refuses a ledger with a tree or near-tree heading, or a row the default cannot place, naming them",
    rTree.status === 0 && rNear.status === 1 && !crashed(rNear) && own(rNear.stderr).some((l) => new RegExp(`\\b${nearMissLine}\\b`).test(l)) && rMixed.status === 1 && !crashed(rMixed),
    `near=${own(rNear.stderr).join(" | ")} mixed=${own(rMixed.stderr).join(" | ")}`);
}

{
  const dirA = gitRepo("t24a", flatLedger());
  lift(["--root", dirA, "--write"]);
  const mapPathA = join(dirA, "map.json");
  lift(["--root", dirA, "--emit-mapping", mapPathA]);
  const mapA = JSON.parse(readFileSync(mapPathA, "utf8"));

  const dirB = gitRepo("t24b", flatLedger());
  lift(["--root", dirB, "--write"]);

  const tryMap = (mutate, label) => {
    const m = JSON.parse(JSON.stringify(mapA));
    mutate(m);
    const p = join(dirB, `map-${label}.json`);
    writeFileSync(p, `${JSON.stringify(m, null, 2)}\n`);
    gitC(dirB, "add", "-A"); gitC(dirB, "commit", "-qm", label);
    return lift(["--root", dirB, "--mapping", p]);
  };
  const wrongPin = (() => { const m = JSON.parse(JSON.stringify(mapA)); m.pin.sha256 = "0".repeat(64); const p = join(dirB, "map-pin.json"); writeFileSync(p, JSON.stringify(m)); gitC(dirB, "add", "-A"); gitC(dirB, "commit", "-qm", "pin"); return lift(["--root", dirB, "--mapping", p]); })();
  const missingRow = tryMap((m) => { m.tree[0].features[0].rows = m.tree[0].features[0].rows.slice(1); }, "missing");
  const repeatedRow = tryMap((m) => { m.tree[0].features[1].rows.push(m.tree[0].features[0].rows[0]); }, "repeated");
  const unknownRow = tryMap((m) => { m.tree[0].features[0].rows.push("R-999"); }, "unknown");
  const headingTwice = tryMap((m) => { m.tree[0].features[0].from[0].line = m.tree[0].features[1].from[0].line; m.tree[0].features[0].from[0].heading = m.tree[0].features[1].from[0].heading; }, "twice");
  const headingNever = tryMap((m) => { m.head.through = 100; }, "never");
  const gOutsideSub = (() => {
    const gDir = gitRepo("t24-g", flatLedgerWithG());
    lift(["--root", gDir, "--write"]);
    const mp = join(gDir, "map.json");
    lift(["--root", gDir, "--emit-mapping", mp]);
    const m = JSON.parse(readFileSync(mp, "utf8"));
    const sub900 = m.tree.find((c) => c.id === "CAP-90").features[0].subgroups.find((s) => s.id === "SUB-900");
    const sub901 = m.tree.find((c) => c.id === "CAP-90").features[0].subgroups.find((s) => s.id === "SUB-901");
    sub901.rows.push(sub900.rows.pop());
    writeFileSync(mp, JSON.stringify(m));
    gitC(gDir, "add", "-A"); gitC(gDir, "commit", "-qm", "bad g");
    return lift(["--root", gDir, "--mapping", mp]);
  })();
  const rInReserved = (() => {
    const gDir = gitRepo("t24-r", flatLedgerWithG());
    lift(["--root", gDir, "--write"]);
    const mp = join(gDir, "map.json");
    lift(["--root", gDir, "--emit-mapping", mp]);
    const m = JSON.parse(readFileSync(mp, "utf8"));
    const sub900 = m.tree.find((c) => c.id === "CAP-90").features[0].subgroups.find((s) => s.id === "SUB-900");
    sub900.rows.push("R-001");
    writeFileSync(mp, JSON.stringify(m));
    gitC(gDir, "add", "-A"); gitC(gDir, "commit", "-qm", "bad r");
    return lift(["--root", gDir, "--mapping", mp]);
  })();
  const underProposed = tryMap((m) => { m.tree[0].features[1].status = "proposed"; }, "proposed-with-rows");
  // A line after an unterminated last row (4/17): a mapping that places something after the
  // ledger's unterminated final row, asserting the validator's OWN wording for the rule (not
  // just a generic refusal some other check could also produce).
  const unterminatedAfter = (() => {
    const untermBase = "# u fixture\n\n## 1. One\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | the last thing shall work. | untested | — |";
    const uDir = gitRepo("t24-unterm", untermBase);
    lift(["--root", uDir, "--write"]);
    const uMapPath = join(uDir, "map.json");
    lift(["--root", uDir, "--emit-mapping", uMapPath]);
    const m = JSON.parse(readFileSync(uMapPath, "utf8"));
    m.tail = { heading: "# Open questions and deliberate omissions", from: [], keep: [{ line: 1, heading: "# u fixture" }] }; // places a line after the unterminated last row
    writeFileSync(uMapPath, JSON.stringify(m));
    gitC(uDir, "add", "-A"); gitC(uDir, "commit", "-qm", "bad tail");
    return lift(["--root", uDir, "--mapping", uMapPath]);
  })();
  const red = (r) => r.status === 1 && !crashed(r);
  const named = (r, re) => red(r) && own(r.stderr).some((l) => re.test(l));
  const bad = [
    ["pin", red(wrongPin)], ["missing", red(missingRow)], ["repeated", red(repeatedRow)], ["unknown", red(unknownRow)],
    ["twice", named(headingTwice, /is named more than once/)],
    ["never", red(headingNever)],
    ["gOutsideSub", named(gOutsideSub, /belongs to the seed subgroup/)],
    ["rInReserved", named(rInReserved, /reserved node holds R row/)],
    ["underProposed", red(underProposed)],
    ["unterminatedAfter", named(unterminatedAfter, /ends with an unterminated row/)],
  ].filter(([, ok]) => !ok).map(([l]) => l);
  // req: R-1167
  check("R-1167: a mapping is refused, each problem named, for another ledger's pin, a missing, repeated or unknown row, an old heading named twice or never, a G row outside its seed subgroup, an R row in a reserved node and a row under a proposed feature",
    bad.length === 0, bad.join(", "));
}

{
  const dir = gitRepo("t25", flatLedger());
  lift(["--root", dir, "--write"]);
  const mapPath = join(dir, "map.json");
  lift(["--root", dir, "--emit-mapping", mapPath]);
  const mapText = readFileSync(mapPath, "utf8");

  const utf16Map = join(dir, "map-utf16.json");
  writeFileSync(utf16Map, Buffer.from(mapText, "utf16le"));
  const r16 = lift(["--root", dir, "--mapping", utf16Map]);

  const ansiMapObj = JSON.parse(mapText);
  ansiMapObj.tree[0].purpose = `${LIFT_MODULE.UNSORTED_PREFIX} café`;
  const ansiMapText = JSON.stringify(ansiMapObj, null, 2);
  const ansiMapLine = ansiMapText.split("\n").findIndex((l) => l.includes("café")) + 1;
  const ansiMap = join(dir, "map-ansi.json");
  writeFileSync(ansiMap, Buffer.from(ansiMapText, "latin1"));
  const rAnsi = lift(["--root", dir, "--mapping", ansiMap]);

  const brokenMapObj = JSON.parse(mapText);
  brokenMapObj.tree[0].purpose = "a\nbroken line";
  const brokenMap = join(dir, "map-broken.json");
  writeFileSync(brokenMap, JSON.stringify(brokenMapObj));
  const rBroken = lift(["--root", dir, "--mapping", brokenMap]);

  const outsideMap = join(scratchRoot, "t25-outside.json");
  writeFileSync(outsideMap, mapText);
  const rOutside = lift(["--root", dir, "--mapping", outsideMap]);

  const bomMap = join(dir, "map-bom.json");
  writeFileSync(bomMap, `﻿${mapText}`);
  const rBom = lift(["--root", dir, "--mapping", bomMap]);

  // A NUL byte (4/12), each named with the SPECIFIC wording its own check emits, not whatever a
  // later, redundant check would say instead once the earlier one is removed.
  const nulMap = join(dir, "map-nul.json");
  writeFileSync(nulMap, Buffer.concat([Buffer.from(mapText.slice(0, 10), "utf8"), Buffer.from([0]), Buffer.from(mapText.slice(10), "utf8")]));
  const rNul = lift(["--root", dir, "--mapping", nulMap]);
  const nulOk = rNul.status === 1 && !crashed(rNul) && own(rNul.stderr).some((l) => /NUL byte/.test(l));

  // Invalid JSON syntax, valid UTF-8, no NUL (4/15).
  const brokenJsonMap = join(dir, "map-brokenjson.json");
  writeFileSync(brokenJsonMap, `${mapText.slice(0, -1)}, }`);
  const rBrokenJson = lift(["--root", dir, "--mapping", brokenJsonMap]);
  const brokenJsonOk = rBrokenJson.status === 1 && !crashed(rBrokenJson) && own(rBrokenJson.stderr).some((l) => /not valid JSON/.test(l));

  // Another lift mapping version (4/16).
  const verMapObj = JSON.parse(mapText);
  verMapObj.lift = 2;
  const verMap = join(dir, "map-version.json");
  writeFileSync(verMap, JSON.stringify(verMapObj));
  const rVer = lift(["--root", dir, "--mapping", verMap]);
  const verOk = rVer.status === 1 && !crashed(rVer) && own(rVer.stderr).some((l) => /lift version/.test(l));

  const named = (r, n) => r.status === 1 && !crashed(r) && own(r.stderr).some((l) => new RegExp(`\\b${n}\\b`).test(l));
  // req: R-1167 R-1166
  check("R-1167: a UTF-16, ANSI or line-broken mapping file, or one outside the root, is refused naming the reason, and one with a BOM is accepted",
    r16.status === 1 && !crashed(r16) && named(rAnsi, ansiMapLine) && rBroken.status === 1 && !crashed(rBroken) && rOutside.status === 1 && !crashed(rOutside) && rBom.status === 0 && nulOk && brokenJsonOk && verOk,
    JSON.stringify({ r16: own(r16.stderr)[0], rAnsi: own(rAnsi.stderr)[0], rBroken: own(rBroken.stderr)[0], rOutside: own(rOutside.stderr)[0], rBom: rBom.status, nul: own(rNul.stderr)[0], brokenJson: own(rBrokenJson.stderr)[0], ver: own(rVer.stderr)[0] }));
}

{
  const dir = gitRepo("t26", flatLedger());
  lift(["--root", dir, "--write"]);
  const mapPath = join(dir, "map.json");
  lift(["--root", dir, "--emit-mapping", mapPath]);
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  map.tree[0].features[0].rows = Array.from({ length: 1000 }, (_, i) => `R-${String(9000 + i).padStart(4, "0")}`);
  writeFileSync(mapPath, JSON.stringify(map));
  const r = lift(["--root", dir, "--mapping", mapPath]);
  const problemLines = own(r.stderr);
  const countLine = problemLines.find((l) => /\bmore\b/.test(l) && /\d/.test(l));
  // req: R-1167
  check("R-1167: a mapping missing 1,000 rows prints at most the problem-line cap and the count of the rest",
    r.status === 1 && !crashed(r) && problemLines.length <= LIFT_MODULE.PROBLEM_LINE_CAP + 1 && Boolean(countLine),
    `lines=${problemLines.length} cap=${LIFT_MODULE.PROBLEM_LINE_CAP} last=${problemLines.at(-1)}`);
}

{
  const dir = writeLedger(scratchDir("t27"), flatLedger());
  const r1 = lift([]);
  const r2 = lift(["--root", dir, "--write", "--emit-mapping", join(dir, "x.json")]);
  // req: R-1167
  check("R-1167 fixture: a run without --root, or with --write and --emit-mapping together, exits 2 with usage",
    r1.status === 2 && !crashed(r1) && own(r1.stderr).some((l) => /--root/.test(l)) && r2.status === 2 && !crashed(r2),
    `r1=${r1.status} r2=${r2.status}`);
}

{
  // E1: a mapping whose shape is wrong at a field apply()/validateMapping() would otherwise
  // index into (rows a string, tree an object) refuses by name instead of throwing.
  const dir = gitRepo("t35", flatLedger());
  lift(["--root", dir, "--write"]);
  const mapPath = join(dir, "map.json");
  lift(["--root", dir, "--emit-mapping", mapPath]);
  const good = JSON.parse(readFileSync(mapPath, "utf8"));

  const rowsString = { ...good, tree: good.tree.map((c) => ({ ...c, features: c.features.map((f) => ({ ...f, rows: "R-001,R-002" })) })) };
  const rowsStringPath = join(dir, "map-rows-string.json");
  writeFileSync(rowsStringPath, JSON.stringify(rowsString));
  const rRowsString = lift(["--root", dir, "--mapping", rowsStringPath]);

  const treeObject = { ...good, tree: { oops: true } };
  const treeObjectPath = join(dir, "map-tree-object.json");
  writeFileSync(treeObjectPath, JSON.stringify(treeObject));
  const rTreeObject = lift(["--root", dir, "--mapping", treeObjectPath]);

  // req: R-1167
  check('R-1167: a mapping whose "rows" is a string or whose "tree" is an object refuses by name, never a crash',
    rRowsString.status === 1 && !crashed(rRowsString) && own(rRowsString.stderr).some((l) => /"rows" must be an array/.test(l)) &&
    rTreeObject.status === 1 && !crashed(rTreeObject) && own(rTreeObject.stderr).some((l) => /"tree" must be an array/.test(l)),
    `rowsString=${own(rRowsString.stderr).join(" | ")} treeObject=${own(rTreeObject.stderr).join(" | ")}`);

  // E1 (brief 4, D1): the four shapes the independent check found still crashing at 0dc5d1d --
  // tail.keep holding null, also_applies as a bare string, an open-ended range, and a reversed
  // range -- each refuses by name instead of throwing a stack trace.
  const tailKeepNull = { ...good, tail: { ...good.tail, keep: [null] } };
  const tailKeepNullPath = join(dir, "map-tailkeep-null.json");
  writeFileSync(tailKeepNullPath, JSON.stringify(tailKeepNull));
  const rTailKeepNull = lift(["--root", dir, "--mapping", tailKeepNullPath]);

  const alsoAppliesString = { ...good, tree: good.tree.map((c) => ({ ...c, features: c.features.map((f) => ({ ...f, also_applies: "FEAT-002" })) })) };
  const alsoAppliesStringPath = join(dir, "map-also-string.json");
  writeFileSync(alsoAppliesStringPath, JSON.stringify(alsoAppliesString));
  const rAlsoAppliesString = lift(["--root", dir, "--mapping", alsoAppliesStringPath]);

  const openRange = { ...good, tree: good.tree.map((c) => ({ ...c, features: c.features.map((f) => ({ ...f, rows: ["R-001–"] })) })) };
  const openRangePath = join(dir, "map-open-range.json");
  writeFileSync(openRangePath, JSON.stringify(openRange));
  const rOpenRange = lift(["--root", dir, "--mapping", openRangePath]);

  const reversedRange = { ...good, tree: good.tree.map((c) => ({ ...c, features: c.features.map((f) => ({ ...f, rows: ["R-002–R-001"] })) })) };
  const reversedRangePath = join(dir, "map-reversed-range.json");
  writeFileSync(reversedRangePath, JSON.stringify(reversedRange));
  const rReversedRange = lift(["--root", dir, "--mapping", reversedRangePath]);

  // req: R-1167
  check('R-1167: a mapping whose "tail.keep" holds null, "also_applies" a string, an open-ended row range or a reversed range refuses by name, never a crash',
    rTailKeepNull.status === 1 && !crashed(rTailKeepNull) && own(rTailKeepNull.stderr).some((l) => /"tail\.keep" holds an entry/.test(l)) &&
    rAlsoAppliesString.status === 1 && !crashed(rAlsoAppliesString) && own(rAlsoAppliesString.stderr).some((l) => /"also_applies" must be an array/.test(l)) &&
    rOpenRange.status === 1 && !crashed(rOpenRange) && own(rOpenRange.stderr).some((l) => /is not a requirement ID or a valid en-dash range/.test(l)) &&
    rReversedRange.status === 1 && !crashed(rReversedRange) && own(rReversedRange.stderr).some((l) => /is a reversed range/.test(l)),
    `tailKeepNull=${own(rTailKeepNull.stderr).join(" | ")} alsoAppliesString=${own(rAlsoAppliesString.stderr).join(" | ")} openRange=${own(rOpenRange.stderr).join(" | ")} reversedRange=${own(rReversedRange.stderr).join(" | ")}`);
}

{
  // D2: the unterminated-last-row rule must check the LAST EMITTED LINE OVERALL, not just the
  // last feature or subgroup -- a mapping that adds an EMPTY capability (no features at all)
  // after the leaf holding the ledger's unterminated last row must still refuse, naming the fix,
  // rather than let the writer glue that capability's own heading onto the unterminated row.
  const untermBase = "# u fixture\n\n## 1. One\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | the last thing shall work. | untested | — |";
  const dir = gitRepo("t37", untermBase);
  const mapPath = join(dir, "map.json");
  lift(["--root", dir, "--emit-mapping", mapPath]);
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  map.tree.push({ id: "CAP-02", label: "Empty", purpose: "x", outcome: "x", from: [], features: [] });
  writeFileSync(mapPath, JSON.stringify(map));
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "empty trailing cap");
  const r = lift(["--root", dir, "--mapping", mapPath]);
  // req: R-1167
  check("R-1167: a mapping with an empty trailing capability after the last leaf of a ledger ending in an unterminated row refuses naming the fix",
    r.status === 1 && !crashed(r) && own(r.stderr).some((l) => /ends with an unterminated row R-001/.test(l) && /end the file with a line break/.test(l)),
    own(r.stderr).join(" | "));
}

{
  // E3: an unterminated last row after a mid-file "Open questions" section (so the tail the
  // default would place after it is not just at the very end) refuses with the named fix,
  // before building any output -- not the generic "row R-002 appears 0 time(s)" the proof used
  // to emit once the tail text had already glued onto the unterminated row with no line break.
  const text = [
    "# fixture", "", "## 1. Before", "", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|",
    "| R-001 | before thing shall work. | untested | — |", "",
    "## Open questions", "", "1. mid file question.", "",
    "## 2. After", "", "| ID | Requirement | Status | Evidence |", "|---|---|---|---|",
    "| R-002 | after thing shall work. | untested | — |",
  ].join("\n"); // no trailing newline: unterminated last row
  const dir = writeLedger(scratchDir("t36"), text);
  const before = readFileSync(join(dir, "REQUIREMENTS.md"));
  const r = lift(["--root", dir]);
  const after = readFileSync(join(dir, "REQUIREMENTS.md"));
  // req: R-1163 R-1167
  check('R-1163: an unterminated last row before a mid-file kept section refuses naming the fix, not the generic row-count mismatch, and writes nothing',
    r.status === 1 && !crashed(r) && own(r.stderr).some((l) => /ends with an unterminated row R-002/.test(l) && /end the file with a line break/.test(l)) &&
    !own(r.stderr).some((l) => /appears 0 time\(s\)/.test(l)) && before.equals(after),
    own(r.stderr).join(" | "));
}

// ==================================================================================================
// R-1168
// ==================================================================================================

{
  const sub = "proj";
  const dir = scratchDir("t28");
  writeLedger(join(dir, sub), flatLedger());
  mkdirSync(join(dir, sub, "maps"), { recursive: true });
  gitC(dir, "init", "-q", "-b", "main");
  gitC(dir, "config", "core.autocrlf", "false");
  gitC(dir, "add", "-A");
  gitC(dir, "commit", "-qm", "base");
  const base = gitC(dir, "rev-parse", "HEAD").stdout.trim();
  const mapPath = join(dir, sub, "maps", "map.json");
  lift(["--root", join(dir, sub), "--emit-mapping", mapPath]);
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "map");
  lift(["--root", join(dir, sub), "--mapping", mapPath, "--write"]);
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "lift");
  const vGood = lift(["--root", join(dir, sub), "--mapping", mapPath, "--verify", base]);
  // hand-edit
  const liftedPath = join(dir, sub, "REQUIREMENTS.md");
  const liftedText = readFileSync(liftedPath, "utf8");
  const firstRowLine = liftedText.split("\n").findIndex((l) => l.startsWith("| R-001 |"));
  const handLines = liftedText.split("\n");
  handLines[firstRowLine] = handLines[firstRowLine].replace("first", "FIRST");
  writeFileSync(liftedPath, handLines.join("\n"));
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "hand edit");
  const vBad = lift(["--root", join(dir, sub), "--mapping", mapPath, "--verify", base]);
  // req: R-1168
  check("R-1168: --verify passes a committed lift with its mapping in a subfolder against its base and names a hand-edited one's first differing line, in a project in a subfolder",
    vGood.status === 0 && vBad.status === 1 && !crashed(vBad) && own(vBad.stderr).some((l) => new RegExp(`\\b${firstRowLine + 1}\\b`).test(l)),
    `vGood=${vGood.status} vBad=${vBad.status} line=${firstRowLine + 1} ` + own(vBad.stderr).join(" | "));

  // --verify's OWN ledger and mapping git checks (MUST 2; the byte compare against HEAD alone
  // never exercises these): an uncommitted edit to either the ledger or the mapping must refuse
  // by name, before any proof or byte comparison runs.
  writeFileSync(liftedPath, `${readFileSync(liftedPath, "utf8")}\n`);
  const vDirtyLedger = lift(["--root", join(dir, sub), "--mapping", mapPath, "--verify", base]);
  gitC(dir, "checkout", "--", `${sub}/REQUIREMENTS.md`);
  writeFileSync(mapPath, `${readFileSync(mapPath, "utf8")}\n`);
  const vDirtyMapping = lift(["--root", join(dir, sub), "--mapping", mapPath, "--verify", base]);
  gitC(dir, "checkout", "--", `${sub}/maps/map.json`);
  // req: R-1168
  check("R-1168: --verify refuses an uncommitted edit to the ledger or to the mapping, naming the file, before comparing any bytes",
    vDirtyLedger.status === 1 && !crashed(vDirtyLedger) && own(vDirtyLedger.stderr).some((l) => l.includes("REQUIREMENTS.md")) &&
    vDirtyMapping.status === 1 && !crashed(vDirtyMapping) && own(vDirtyMapping.stderr).some((l) => l.includes("map.json")),
    `ledger=${own(vDirtyLedger.stderr).join(" | ")} mapping=${own(vDirtyMapping.stderr).join(" | ")}`);
}

{
  // MUST 2: --verify must run the SAME mapping validation and proof --write runs, not just a
  // byte compare of the applied output against HEAD — a mapping missing a row, committed with
  // its matching (row-dropped) ledger, must still be refused (the reviewer's check must not
  // pass a lost row).
  const dir = scratchDir("t33");
  const base = flatLedger();
  writeLedger(dir, base);
  gitC(dir, "init", "-q", "-b", "main");
  gitC(dir, "config", "core.autocrlf", "false");
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "base");
  const baseRev = gitC(dir, "rev-parse", "HEAD").stdout.trim();
  const mapPath = join(dir, "map.json");
  lift(["--root", dir, "--emit-mapping", mapPath]);
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  map.tree[0].features[1].rows = []; // drop R-003 from the mapping entirely
  writeFileSync(mapPath, JSON.stringify(map));
  // Forge a HEAD ledger consistent with the TAMPERED mapping, as --write would have produced
  // had the gate allowed it, so a plain byte-compare against HEAD alone would not catch this.
  const forged = LIFT_MODULE.applyMapping(base, map, { byId: new Map(), subOf: new Map() });
  writeFileSync(join(dir, "REQUIREMENTS.md"), forged);
  gitC(dir, "add", "-A"); gitC(dir, "commit", "-qm", "forged lift (R-003 silently dropped)");
  const v = lift(["--root", dir, "--mapping", mapPath, "--verify", baseRev]);
  // req: R-1168
  check("R-1168: --verify refuses a mapping missing a row even when the committed ledger already matches that mapping's output byte for byte",
    v.status === 1 && !crashed(v) && own(v.stderr).some((l) => /R-003/.test(l) && /missing from the mapping/.test(l)),
    own(v.stderr).join(" | "));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
