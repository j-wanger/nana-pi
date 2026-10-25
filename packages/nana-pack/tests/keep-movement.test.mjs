/**
 * @module packages/nana-pack/tests/keep-movement.test.mjs
 * @purpose Pins review-ledger keep's durable tree-movement copy, omission, warning and no-text behavior.
 * @inputs review-ledger.mjs, review-movement.mjs, review-round.mjs, ledger fixtures and temporary repositories.
 * @outputs PASS/FAIL lines for each required keep-movement behavior and the sealed filename.
 * @effects disk (temporary homes, repositories and reports), process (spawns git, Node and review-ledger).
 * @errors Failed assertions print FAIL and set a nonzero exit status; fixture errors throw.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, lstatSync, existsSync } from "node:fs";
import { tmpDir } from "./tmp-dir.mjs";
import { ledgerRepo, makeLedgerBranch, ledgerText, reportToFile } from "./ledger-repo.mjs";
import { reviewMovementSection } from "../lib/review-movement.mjs";
import { KEEP_MOVEMENT_FILE_NAME, KEEP_NAME_HASH_CHARS } from "../bin/review-round.mjs";
import { MOVEMENT_HEADING, MOVEMENT_LEAD, MOVEMENT_NOT_COMPUTED } from "../lib/review-movement-config.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = tmpDir(join(tmpdir(), "keep-movement-test-"));
const bin = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "review-ledger.mjs");
let checkCount = 0;
let failures = 0;
function check(title, fn) {
  checkCount++;
  try { fn(); console.log("PASS", title); }
  catch (error) { failures++; console.log("FAIL", title, error.message); }
}
function homeEnv(home, fixture) { return { ...fixture.env, HOME: home, USERPROFILE: home }; }
function recordRound(fixture, home, item, role, outside, text = "Review text\nVERDICT: LAND") {
  mkdirSync(outside, { recursive: true });
  const out = join(outside, `${item}.md`);
  const source = `process.stdout.write(${JSON.stringify(text)})`;
  const run = spawnSync(process.execPath, [bin, "run", "--item", item, "--role", role, "--out", out, "--", process.execPath, "-e", source], {
    cwd: fixture.dir ?? fixture.root, env: homeEnv(home, fixture), encoding: "utf8", timeout: 30_000,
  });
  assert.equal(run.status, 0, run.stderr);
  return { out, text };
}
function keep(fixture, home, item, into, cwd = root) {
  return spawnSync(process.execPath, [bin, "keep", "--item", item, "--into", into, "--repo", fixture.dir], {
    cwd, env: homeEnv(home, fixture), encoding: "utf8", timeout: 30_000,
  });
}
function expected(fixture, reportPath) {
  const report = reportToFile(fixture.dir, reportPath);
  const section = report.status === 0
    ? `${MOVEMENT_HEADING}\n\n${MOVEMENT_LEAD}\n\n${report.stdout.replace(/[\r\n]+$/, "")}`
    : `${MOVEMENT_HEADING}\n\n${MOVEMENT_LEAD}\n\n${MOVEMENT_NOT_COMPUTED} ${report.stderr.split(/\r?\n/).find((line) => line.trim())}`;
  assert.equal(section, reviewMovementSection(fixture.dir));
  return { report, section };
}
function newHome(name) { const home = join(root, `home-${name}`); mkdirSync(home, { recursive: true }); return home; }
function branch(name, options) { const dir = join(root, name); return { ...makeLedgerBranch(dir, options), dir }; }

// req: R-2910
check("R-2910: keep writes the tree movement section for the repository's HEAD against main into the lane folder, names it in its count line, and replaces it on the next keep", () => {
  const fixture = branch("r2910"), home = newHome("r2910"), outside = join(root, "outside-r2910"), into = join(root, "into-r2910");
  const round = recordRound(fixture, home, "r2910", "reviewer", outside);
  const first = expected(fixture, join(root, "report-r2910-first.txt"));
  let result = keep(fixture, home, "r2910", into);
  assert.equal(result.status, 0, result.stderr);
  let file = join(into, KEEP_MOVEMENT_FILE_NAME);
  assert.deepEqual(readFileSync(file), Buffer.from(first.section));
  assert.match(result.stdout, new RegExp(`^kept 1 review text\\(s\\) and ${KEEP_MOVEMENT_FILE_NAME} for `));
  assert.match(first.section, /R-002 new/);
  assert.doesNotMatch(first.section, new RegExp(home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(first.section, new RegExp(fixture.dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const keptText = readFileSync(round.out);
  fixture.writeLedger(ledgerText("| R-001 | Row one. | untested | — |\n| R-002 | Row two. | untested | — |\n| R-003 | Row three. | untested | — |\n"));
  fixture.commit("add R-003");
  const second = expected(fixture, join(root, "report-r2910-second.txt"));
  result = keep(fixture, home, "r2910", into);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readFileSync(file), Buffer.from(second.section));
  assert.match(second.section, /R-003 new/);
  assert.equal((readFileSync(file, "utf8").match(new RegExp(KEEP_MOVEMENT_FILE_NAME, "g")) ?? []).length, 0);
  assert.equal((readFileSync(file, "utf8").match(new RegExp(MOVEMENT_HEADING.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length, 1);
  assert.ok(readFileSync(file, "utf8").split("\n")[4].includes(fixture.git("rev-parse", "HEAD").stdout.trim().slice(0, 7)));
  assert.deepEqual(readFileSync(round.out), keptText);
});

// req: R-2911
check("R-2911: keep writes no tree movement file and says nothing about it for a repository with no committed ledger", () => {
  const dir = join(root, "r2911"), fixture = ledgerRepo(dir);
  const init = fixture.git("init", "-q", "-b", "main"); assert.equal(init.status, 0, init.stderr);
  writeFileSync(join(dir, "plain.txt"), "plain\n"); fixture.commit("plain base");
  writeFileSync(join(dir, "REQUIREMENTS.md"), ledgerText());
  const home = newHome("r2911"), outside = join(root, "outside-r2911"), into = join(root, "into-r2911");
  recordRound({ ...fixture, dir }, home, "r2911", "reviewer", outside);
  const result = keep({ ...fixture, dir }, home, "r2911", into);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.equal(readdirSync(into).includes(KEEP_MOVEMENT_FILE_NAME), false);
  assert.match(result.stdout, /^kept 1 review text\(s\) for /);
  assert.ok(!result.stdout.includes(KEEP_MOVEMENT_FILE_NAME));
});

// req: R-2912
check("R-2912: a movement that cannot be computed or written leaves no movement section and one warning with its reason, while keep still keeps the review texts and exits 0", () => {
  const noMain = branch("r2912-trunk", { trunk: true }), home1 = newHome("r2912-trunk"), out1 = join(root, "outside-r2912-trunk"), into1 = join(root, "into-r2912-trunk");
  recordRound(noMain, home1, "r2912-trunk", "reviewer", out1);
  const expectedFailure = reportToFile(noMain.dir, join(root, "report-r2912-trunk.txt"));
  const reason = expectedFailure.stderr.split(/\r?\n/).find((line) => line.trim());
  const first = keep(noMain, home1, "r2912-trunk", into1);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(readdirSync(into1).includes(KEEP_MOVEMENT_FILE_NAME), false);
  const warning1 = first.stderr.trim().split(/\r?\n/);
  assert.equal(warning1.length, 1); assert.ok(warning1[0].includes(KEEP_MOVEMENT_FILE_NAME) && warning1[0].includes(reason));
  assert.equal(readdirSync(into1).filter((name) => name !== KEEP_MOVEMENT_FILE_NAME).length, 1);
  const fixture = branch("r2912-write"), home2 = newHome("r2912-write"), out2 = join(root, "outside-r2912-write"), into2 = join(root, "into-r2912-write");
  recordRound(fixture, home2, "r2912-write", "reviewer", out2);
  mkdirSync(into2, { recursive: true }); const target = join(into2, KEEP_MOVEMENT_FILE_NAME); mkdirSync(target);
  const second = keep(fixture, home2, "r2912-write", into2);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(lstatSync(target).isDirectory(), true); assert.deepEqual(readdirSync(target), []);
  assert.equal(second.stderr.trim().split(/\r?\n/).length, 1); assert.ok(second.stderr.includes(KEEP_MOVEMENT_FILE_NAME));
  assert.equal(readdirSync(into2).filter((name) => name !== KEEP_MOVEMENT_FILE_NAME).length, 1);
});

// req: R-2913
check("R-2913: with no kept review text, keep exits 0 when it writes the tree movement file and 1 when it does not", () => {
  const fixture = branch("r2913"), home = newHome("r2913"), into = join(root, "into-r2913");
  const expectedSection = expected(fixture, join(root, "report-r2913.txt")).section;
  const success = keep(fixture, home, "r2913-empty", into);
  assert.equal(success.status, 0, success.stderr);
  assert.deepEqual(readdirSync(into), [KEEP_MOVEMENT_FILE_NAME]);
  assert.equal(readFileSync(join(into, KEEP_MOVEMENT_FILE_NAME), "utf8"), expectedSection);
  assert.match(success.stdout, new RegExp(`^kept 0 review text\\(s\\) and ${KEEP_MOVEMENT_FILE_NAME} for `));
  const trunk = branch("r2913-trunk", { trunk: true }), failedInto = join(root, "into-r2913-trunk");
  const failure = keep(trunk, home, "r2913-empty", failedInto);
  assert.equal(failure.status, 1); assert.match(failure.stderr, /no kept text/);
  assert.equal(existsSync(join(failedInto, KEEP_MOVEMENT_FILE_NAME)), false);
});

// req: R-2574
check("R-2574: in a repository with a committed ledger, keep refuses a differing review text and writes no tree movement file", () => {
  const fixture = branch("r2574"), home = newHome("r2574"), outside = join(root, "outside-r2574"), into = join(root, "into-r2574");
  recordRound(fixture, home, "r2574", "role1", outside, "conflict fixture\nVERDICT: LAND\n");
  const tally = readFileSync(join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  const hash = tally[0].text.sha256;
  const name = `r1-role1-${hash.slice(0, KEEP_NAME_HASH_CHARS)}.md`;
  mkdirSync(into); const differing = Buffer.from("different bytes\n"); writeFileSync(join(into, name), differing);
  const result = keep(fixture, home, "r2574", into);
  assert.equal(result.status, 1); assert.ok(result.stderr.includes("different bytes"));
  assert.deepEqual(readFileSync(join(into, name)), differing);
  assert.deepEqual(readdirSync(into), [name]);
  assert.equal(readdirSync(into).includes(KEEP_MOVEMENT_FILE_NAME), false);
});

// req: R-2910 R-2911 R-2912 R-2913
check("seal: review-ledger keep names the lane folder's tree movement file tree-movement.md", () => {
  assert.equal(KEEP_MOVEMENT_FILE_NAME, "tree-movement.md");
});

process.exitCode = failures ? 1 : 0;
