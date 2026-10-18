/**
 * @module packages/nana-pack/tests/path-spelling.test.mjs
 * @purpose Pins GP1-GP7 (W7c): the land and review tools treat two spellings of one folder — another
 *  letter case, an 8.3 short name, a link, a `\\?\` prefix or another Unicode form — as one folder.
 * @inputs bin/review-ledger.mjs, bin/pi-review.mjs, bin/nana-land.mjs, bin/review-round.mjs, a fake pi on
 *  PATH, and temporary git repositories and worktrees built under a temporary HOME
 * @outputs PASS/FAIL/SKIP lines per check on stdout, and a nonzero exit when any check fails
 * @effects disk (temp HOME, git repositories, worktrees, symlinks/junctions, ledger files), process
 *  (spawns the review CLIs, a fake pi and git)
 * @errors a failed check prints FAIL with the observed detail and the run exits 1; an unexpected throw
 *  propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin");
const PI_REVIEW = path.join(bin, "pi-review.mjs");
const LEDGER_CLI = path.join(bin, "review-ledger.mjs");
const { runLand, runCleanup } = await import(pathToFileURL(path.join(bin, "nana-land.mjs")).href);
const { admit, complete, readRounds } = await import(pathToFileURL(path.join(bin, "review-round.mjs")).href);

const win32 = process.platform === "win32";
const tmpRoot = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "path-spelling-test-")));

// ---------------------------------------------------------------- the fake pi (every launch "LAND"s)
// MODE=lock (GP5): the fake pi locks its own cwd (the review checkout) before answering, so
// `git worktree remove` needs -f -f and fails under pi-review's single --force, leaving the
// registration for the end-of-run check to find. MODE=fail: an infra failure. OBSERVE_LISTING
// (GP2): the fake pi's OWN directory listing, written before it answers, so the test can see
// whether the review checkout held the excluded --out file.
const fakeBin = path.join(tmpRoot, "fake-bin");
fs.mkdirSync(fakeBin, { recursive: true });
if (win32) {
  writeFakePi(fakeBin, `const fs = require("node:fs");
const cp = require("node:child_process");
if (process.env.OBSERVE_LISTING) { try { fs.writeFileSync(process.env.OBSERVE_LISTING, fs.readdirSync(process.cwd()).join("\\n")); } catch (e) {} }
if (process.env.MODE === "lock") { cp.spawnSync("git", ["worktree", "lock", "--reason", "test", process.cwd()]); }
if (process.env.MODE === "fail") { process.exit(1); }
console.log("VERDICT: LAND");
`);
} else {
  const fakePi = path.join(fakeBin, "pi");
  fs.writeFileSync(fakePi, `#!/bin/sh
[ -z "$OBSERVE_LISTING" ] || ls -a "$PWD" > "$OBSERVE_LISTING" 2>/dev/null
[ "$MODE" != "lock" ] || git worktree lock --reason test "$PWD" >/dev/null 2>&1
[ "$MODE" != "fail" ] || exit 1
echo "VERDICT: LAND"
`);
  fs.chmodSync(fakePi, 0o755);
}

let failures = 0;
const check = (name, fn) => {
  try { fn(); console.log("PASS", name); } catch (error) { failures++; console.log("FAIL", name, error.message); }
};
const ok = (cond, detail) => { if (!cond) throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail)); };

let homeCounter = 0;
/** A fresh ~/.pi/agent HOME (and PATH carrying the fake pi), isolated per check/spelling. */
function freshHome() {
  const home = path.join(tmpRoot, `home-${++homeCounter}`);
  fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
  return home;
}
const env = (home, extra = {}) => ({ ...process.env, HOME: home, USERPROFILE: home, PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`, ...extra });

const git = (cwd, ...args) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} in ${cwd} failed: ${(r.stderr || r.stdout || "").trim()}`);
  return r.stdout.trim();
};
/** A repo with one commit, autocrlf off (so a checked-out byte pins, whatever the host's own config is). */
function repo(parent, name = "repo") {
  const dir = path.join(parent, name);
  fs.mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "core.autocrlf", "false");
  git(dir, "config", "user.email", "spelling@test");
  git(dir, "config", "user.name", "Spelling Test");
  fs.writeFileSync(path.join(dir, "base.txt"), "base\n");
  git(dir, "add", "base.txt");
  git(dir, "commit", "-qm", "base");
  return dir;
}
const commit = (dir, file, data, message) => { fs.writeFileSync(path.join(dir, file), data); git(dir, "add", file); git(dir, "commit", "-qm", message); return git(dir, "rev-parse", "HEAD"); };

const swapCase = (s) => [...s].map((c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())).join("");
let linkCounter = 0;

/**
 * Every available second spelling of the folder `canonical` (its own native real path): a
 * letter-case flip (plus, on win32, a drive-letter flip), used only where this volume is
 * case-insensitive (else a printed SKIP); and a link (a symlink on POSIX, a junction on win32)
 * to the PARENT folder, reached by the same leaf name — a folder ON THE PATH is spelled
 * differently, not the leaf itself replaced by a link. `label` names the check for the SKIP line.
 */
function otherSpellings(canonical, label) {
  const out = [];
  const dir = path.dirname(canonical), name = path.basename(canonical);
  let flipped = path.join(dir, swapCase(name));
  if (win32) flipped = flipped.replace(/^([A-Za-z]):/, (_m, d) => `${swapCase(d)}:`);
  if (flipped !== canonical && fs.existsSync(flipped)) out.push({ kind: "case", path: flipped });
  else console.log(`SKIP ${label} (case): this volume is case-sensitive`);
  const linkParent = path.join(tmpRoot, `link-${process.pid}-${++linkCounter}`);
  try {
    if (win32) {
      const r = spawnSync("cmd", ["/c", "mklink", "/J", linkParent, dir], { encoding: "utf8" });
      if (r.status !== 0) throw new Error(r.stderr || "mklink failed");
    } else fs.symlinkSync(dir, linkParent);
    out.push({ kind: "link", path: path.join(linkParent, name) });
  } catch (e) { console.log(`SKIP ${label} (link): ${e.message}`); }
  return out;
}
const printSpelling = (label, kind, canonical, spelled) => console.log(`${label}: trying ${kind} — canonical=${canonical} spelled=${spelled}`);

// ================================================================= GP1 (R-1350)
// WHEN --out names a tracked file of the reviewed tree through a second spelling of a folder on
// its path, review-ledger run/check and pi-review shall refuse it before the review runs.
{
  const gp1Repo = repo(tmpRoot, "gp1-repo");
  commit(gp1Repo, "tracked.md", "keep\n", "base");
  const canonical = fs.realpathSync.native(gp1Repo);
  const spellings = otherSpellings(canonical, "GP1");
  // req: R-1350
  check("GP1: a tracked --out reached through a second spelling of a folder on its path is refused before the review runs (review-ledger run, review-ledger check, pi-review)", () => {
    for (const { kind, path: spelled } of spellings) {
      printSpelling("GP1", kind, canonical, spelled);
      const outPath = path.join(spelled, "tracked.md");
      for (const launcher of ["ledger-run", "ledger-check", "pi-review"]) {
        const home = freshHome();
        const item = `gp1-${kind}-${launcher}`;
        const before = fs.readFileSync(path.join(canonical, "tracked.md"));
        let res;
        if (launcher === "ledger-run") {
          res = spawnSync(process.execPath, [LEDGER_CLI, "run", "--item", item, "--out", outPath, "--", process.execPath, "-e", "console.log('VERDICT: LAND')"], { cwd: canonical, env: env(home), encoding: "utf8" });
        } else if (launcher === "ledger-check") {
          res = spawnSync(process.execPath, [LEDGER_CLI, "check", "--item", item, "--out", outPath], { cwd: canonical, env: env(home), encoding: "utf8" });
        } else {
          res = spawnSync(process.execPath, [PI_REVIEW, "--item", item, "--out", outPath, "--retries", "0", "--", "-p", "review"], { cwd: canonical, env: env(home, { OBSERVE_LISTING: path.join(tmpRoot, `gp1-observe-${kind}-${launcher}`) }), encoding: "utf8" });
        }
        const after = fs.readFileSync(path.join(canonical, "tracked.md"));
        const resDir = path.join(home, ".pi", "agent", "review-ledger.reservations");
        const reservations = fs.existsSync(resDir) ? fs.readdirSync(resDir) : [];
        const worktrees = git(canonical, "worktree", "list", "--porcelain");
        ok(res.status === 1, `[${kind}/${launcher}] expected exit 1, got ${res.status}: ${res.stderr}`);
        ok(/TRACKED file/.test(res.stderr), `[${kind}/${launcher}] expected "TRACKED file" in stderr: ${res.stderr}`);
        ok(before.equals(after), `[${kind}/${launcher}] tracked.md changed: ${after.toString()}`);
        ok(readRounds(home, { item }).length === 0, `[${kind}/${launcher}] a round was recorded`);
        ok(reservations.length === 0, `[${kind}/${launcher}] a reservation remains: ${reservations}`);
        ok(!worktrees.includes("nana-review-"), `[${kind}/${launcher}] a review worktree was registered: ${worktrees}`);
        if (launcher === "pi-review") ok(!fs.existsSync(path.join(tmpRoot, `gp1-observe-${kind}-${launcher}`)), `[${kind}/${launcher}] the fake pi started`);
      }
    }
  });
}

// ================================================================= GP2 (R-1351)
// WHEN --out names an untracked, non-ignored in-tree file through a second spelling of a folder
// on its path, pi-review and review-ledger run shall warn, run the review and leave the file out
// of the review's snapshot and (pi-review) out of the review checkout.
{
  const gp2Repo = repo(tmpRoot, "gp2-repo");
  const headSha = git(gp2Repo, "rev-parse", "HEAD");
  const canonical = fs.realpathSync.native(gp2Repo);
  const spellings = otherSpellings(canonical, "GP2");
  // darwin: a folder stored in NFD on disk, reached by its NFC-typed spelling, and the reverse
  // (MUST 1 of the adversary review — confirmed on this Mac: core.precomposeunicode lists NFC
  // while the folder is stored NFD).
  if (process.platform === "darwin") {
    const nfdName = "Réviews".normalize("NFD"); // "Réviews", decomposed (e-combining-acute)
    fs.mkdirSync(path.join(canonical, nfdName));
    const nfcName = nfdName.normalize("NFC");
    spellings.push({ kind: "nfd-via-nfc", path: path.join(canonical, nfcName) }, { kind: "nfc-via-nfd", path: path.join(canonical, nfdName) });
  }
  // req: R-1351
  check("GP2: an untracked in-tree --out reached through a second spelling of a folder on its path warns, runs, and stays out of the snapshot and the review checkout", () => {
    for (const { kind, path: spelled } of spellings) {
      printSpelling("GP2", kind, canonical, spelled);
      const outDir = spelled;
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, "review-out.md");
      fs.writeFileSync(outPath, "old output\n");
      for (const launcher of ["ledger-run", "pi-review"]) {
        const home = freshHome();
        const item = `gp2-${kind}-${launcher}`;
        const listing = path.join(tmpRoot, `gp2-listing-${kind}-${launcher}`);
        let res;
        if (launcher === "ledger-run") {
          res = spawnSync(process.execPath, [LEDGER_CLI, "run", "--item", item, "--out", outPath, "--", process.execPath, "-e", "console.log('VERDICT: LAND')"], { cwd: canonical, env: env(home), encoding: "utf8" });
        } else {
          res = spawnSync(process.execPath, [PI_REVIEW, "--item", item, "--out", outPath, "--retries", "0", "--", "-p", "review"], { cwd: canonical, env: env(home, { OBSERVE_LISTING: listing }), encoding: "utf8" });
        }
        ok(res.status === 0, `[${kind}/${launcher}] expected exit 0: ${res.stderr}`);
        ok(/WARNING: .*inside the reviewed tree/.test(res.stderr), `[${kind}/${launcher}] missing in-tree warning: ${res.stderr}`);
        const rows = readRounds(home, { item });
        ok(rows.length === 1, `[${kind}/${launcher}] expected one recorded round, got ${rows.length}`);
        ok(rows[0].revision === headSha && !rows[0].unverified, `[${kind}/${launcher}] expected the bare HEAD sha, got ${JSON.stringify(rows[0])}`);
        if (launcher === "pi-review") {
          ok(fs.existsSync(listing), `[${kind}/${launcher}] the fake pi never ran`);
          const names = fs.readFileSync(listing, "utf8").split(/\r?\n/);
          ok(!names.includes("review-out.md"), `[${kind}/${launcher}] the review checkout held the excluded --out file: ${names}`);
        }
        fs.writeFileSync(outPath, "old output\n"); // restore for the next launcher's run
      }
      // This kind's --out location is reached via a DIFFERENT folder spelling each iteration
      // (sometimes the repo root itself, sometimes a subfolder): remove it so it cannot leak
      // into a later kind's snapshot as an unrelated extra untracked file.
      fs.rmSync(outPath, { force: true });
    }
  });
}

// ================================================================= GP3 (R-1352)
// WHEN one repository is reviewed through two spellings of its folder, review-ledger run,
// pi-review and review-ledger report --repo shall use one repository key.
{
  const gp3Repo = repo(tmpRoot, "gp3-repo");
  commit(gp3Repo, "seed.txt", "seed\n", "c0");
  const canonical = fs.realpathSync.native(gp3Repo);
  const spellings = otherSpellings(canonical, "GP3");
  const scratch = tmpDir(path.join(tmpRoot, "gp3-scratch-"));
  // req: R-1352
  check("GP3: one repository reviewed through two spellings of its folder is one ledger item, under one repo key, reported under either spelling", () => {
    for (const { kind, path: spelled } of spellings) {
      printSpelling("GP3", kind, canonical, spelled);
      const home = freshHome();
      const item = `gp3-${kind}`;
      commit(gp3Repo, `c1-${kind}.txt`, "c1\n", "c1");
      const r1 = spawnSync(process.execPath, [LEDGER_CLI, "run", "--item", item, "--out", path.join(tmpRoot, `gp3-out1-${kind}.md`), "--", process.execPath, "-e", "console.log('VERDICT: LAND')"], { cwd: canonical, env: env(home), encoding: "utf8" });
      ok(r1.status === 0, `round 1 (canonical cwd) refused: ${r1.stderr}`);
      commit(gp3Repo, `c2-${kind}.txt`, "c2\n", "c2");
      const r2 = spawnSync(process.execPath, [LEDGER_CLI, "run", "--item", item, "--tree", spelled, "--out", path.join(tmpRoot, `gp3-out2-${kind}.md`), "--", process.execPath, "-e", "console.log('VERDICT: LAND')"], { cwd: scratch, env: env(home), encoding: "utf8" });
      ok(r2.status === 0, `round 2 (--tree ${kind}) refused: ${r2.stderr}`);
      commit(gp3Repo, `c3-${kind}.txt`, "c3\n", "c3");
      const r3 = spawnSync(process.execPath, [PI_REVIEW, "--item", item, "--tree", spelled, "--out", path.join(tmpRoot, `gp3-out3-${kind}.md`), "--retries", "0", "--", "-p", "review"], { cwd: scratch, env: env(home), encoding: "utf8" });
      ok(r3.status === 0, `round 3 (pi-review --tree ${kind}) refused: ${r3.stderr}`);
      const rows = readRounds(home, { item });
      ok(rows.length === 3, `expected 3 recorded rounds, got ${rows.length}: ${JSON.stringify(rows)}`);
      const repoKeys = new Set(rows.map((r) => r.repo));
      ok(repoKeys.size === 1, `expected one repo key across all three rounds, got ${[...repoKeys]}`);
      commit(gp3Repo, `c4-${kind}.txt`, "c4\n", "c4");
      const r4 = spawnSync(process.execPath, [LEDGER_CLI, "run", "--item", item, "--tree", spelled, "--out", path.join(tmpRoot, `gp3-out4-${kind}.md`), "--", process.execPath, "-e", "console.log('VERDICT: LAND')"], { cwd: scratch, env: env(home), encoding: "utf8" });
      ok(r4.status === 1, `round 4 should be over the cap, got exit ${r4.status}`);
      ok(/over the cap/.test(r4.stderr), `round 4 did not refuse over the cap: ${r4.stderr}`);
      for (const repoArg of [spelled, canonical]) {
        const report = spawnSync(process.execPath, [LEDGER_CLI, "report", "--item", item, "--repo", repoArg], { cwd: canonical, env: env(home), encoding: "utf8" });
        const lines = report.stdout.trim().split(/\r?\n/).filter(Boolean);
        ok(report.status === 0 && lines.length === 3, `report --repo ${repoArg} printed ${lines.length} lines, expected 3: ${report.stdout} ${report.stderr}`);
      }
    }
  });
}

// ================================================================= GP4 (R-1353)
// WHEN a registered nana-review-<pid>- checkout and the temp folder are spelled differently,
// pi-review shall reclaim that checkout at startup when its owning pid is dead.
{
  const gp4Repo = repo(tmpRoot, "gp4-repo");
  commit(gp4Repo, "seed.txt", "seed\n", "base");
  const canonicalRepo = fs.realpathSync.native(gp4Repo);
  const tempParent = fs.realpathSync.native(tmpDir(path.join(tmpRoot, "gp4-temp-")));
  const spellings = otherSpellings(tempParent, "GP4");
  // req: R-1353
  check("GP4: a dead review checkout registered under one spelling of the temp folder is reclaimed when pi-review's own temp folder env points at another", () => {
    for (const { kind, path: other } of spellings) {
      printSpelling("GP4", kind, tempParent, other);
      for (const [dirA, dirB, label] of [[tempParent, other, "canonical-then-other"], [other, tempParent, "other-then-canonical"]]) {
        const dead = spawnSync(process.execPath, ["-e", ""]).pid;
        ok(Number.isInteger(dead) && dead > 0, `could not get a dead pid`);
        const deadPath = path.join(dirA, `nana-review-${dead}-gp4`);
        git(canonicalRepo, "worktree", "add", "--detach", deadPath);
        const home = freshHome();
        const tempEnv = win32 ? { TEMP: dirB, TMP: dirB } : { TMPDIR: dirB };
        const res = spawnSync(process.execPath, [PI_REVIEW, "--item", `gp4-${kind}-${label}`, "--out", path.join(tmpRoot, `gp4-out-${kind}-${label}.md`), "--retries", "0", "--", "-p", "review"], { cwd: canonicalRepo, env: env(home, tempEnv), encoding: "utf8" });
        const worktrees = git(canonicalRepo, "worktree", "list", "--porcelain");
        ok(res.status === 0, `[${kind}/${label}] pi-review refused: ${res.stderr}`);
        ok(!fs.existsSync(deadPath), `[${kind}/${label}] the dead checkout folder is still present: ${deadPath}`);
        ok(!worktrees.includes(`nana-review-${dead}-gp4`), `[${kind}/${label}] the dead checkout is still registered: ${worktrees}`);
      }
    }
  });
}

// ================================================================= GP5 (R-1354)
// WHEN pi-review's own review checkout registration remains after its cleanup and the temp
// folder is spelled through a link, pi-review shall report the remaining registration and exit 1.
{
  const gp5Repo = repo(tmpRoot, "gp5-repo");
  commit(gp5Repo, "seed.txt", "seed\n", "base");
  const canonicalRepo = fs.realpathSync.native(gp5Repo);
  const tempParent = fs.realpathSync.native(tmpDir(path.join(tmpRoot, "gp5-temp-")));
  const spellings = otherSpellings(tempParent, "GP5");
  // req: R-1354
  check("GP5: a remaining review checkout registration is reported and refused when the temp folder is spelled differently", () => {
    for (const { kind, path: other } of spellings) {
      printSpelling("GP5", kind, tempParent, other);
      const home = freshHome();
      const tempEnv = win32 ? { TEMP: other, TMP: other } : { TMPDIR: other };
      const res = spawnSync(process.execPath, [PI_REVIEW, "--item", `gp5-${kind}`, "--out", path.join(tmpRoot, `gp5-out-${kind}.md`), "--retries", "0", "--", "-p", "review"], { cwd: canonicalRepo, env: env(home, { ...tempEnv, MODE: "lock" }), encoding: "utf8" });
      ok(res.status === 1, `[${kind}] expected exit 1, got ${res.status}: ${res.stderr}`);
      ok(/worktree registration remains/.test(res.stderr), `[${kind}] missing "worktree registration remains": ${res.stderr}`);
      // Clean up the lock this check left, so it cannot block a later pi-review on this repo.
      const porcelain = git(canonicalRepo, "worktree", "list", "--porcelain");
      const stale = porcelain.split(/\r?\n/).filter((l) => l.startsWith("worktree ") && l.includes("nana-review-")).map((l) => l.slice(9));
      for (const p of stale) {
        spawnSync("git", ["worktree", "unlock", p], { cwd: canonicalRepo });
        spawnSync("git", ["worktree", "remove", "--force", "--force", p], { cwd: canonicalRepo });
      }
      spawnSync("git", ["worktree", "prune", "--expire", "now"], { cwd: canonicalRepo });
    }
  });
}

// ================================================================= GP6 (R-1355)
// WHEN --tree, --main or a cleanup worktree is named through a second spelling of its folder,
// the land merge and cleanup commands shall treat it as the folder git registered.
{
  const recordLand = (home, tree, item, sha) => {
    const admission = admit(["--item", item, "--tree", tree, "--role", "test"], { home, cwd: tree, launcher: "path-spelling.test.mjs" });
    ok(admission.ok, `admit failed: ${admission.message}`);
    const c = complete(admission.res, "VERDICT: LAND", { home });
    ok(c.ok, `complete failed: ${c.message}`);
    return sha;
  };
  // (i) main checkout M; linked F with one commit; LAND recorded via --tree F.
  {
    const main = repo(tmpRoot, "gp6i-main");
    const feature = path.join(tmpRoot, "gp6i-feat");
    git(main, "worktree", "add", "-b", "feat/gp6i", feature);
    const tip = commit(feature, "next.txt", "next\n", "next");
    const canonicalMain = fs.realpathSync.native(main);
    const spellings = otherSpellings(canonicalMain, "GP6(i)");
    // req: R-1355
    check("GP6(i): nana-land merge treats --main through a second spelling as the registered checkout", () => {
      for (const { kind, path: spelled } of spellings) {
        printSpelling("GP6(i)", kind, canonicalMain, spelled);
        const home = freshHome();
        recordLand(home, feature, `gp6i-${kind}`, tip);
        const out = runLand({ tree: feature, main: spelled, suite: "node -e \"process.exit(0)\"", reviewed: [`${tip}=gp6i-${kind}`], home });
        ok(out.code === 0, `[${kind}] runLand refused: ${out.text}`);
        ok(git(main, "rev-parse", "HEAD") === tip, `[${kind}] main did not advance to the tip`);
      }
    });
  }
  // (ii) the original checkout O is on feat/gp6ii; a linked worktree holds main; LAND via --tree O.
  {
    const original = repo(tmpRoot, "gp6ii-orig");
    git(original, "checkout", "-q", "-b", "feat/gp6ii"); // frees "main" so the linked worktree can hold it
    const tip = commit(original, "next.txt", "next\n", "next");
    const linkedMain = path.join(tmpRoot, "gp6ii-main-wt");
    git(original, "worktree", "add", linkedMain, "main"); // still at the base commit, unchanged
    const canonicalOrig = fs.realpathSync.native(original);
    const spellings = otherSpellings(canonicalOrig, "GP6(ii)");
    // req: R-1355
    check("GP6(ii): nana-land merge treats --tree through a second spelling as the registered checkout", () => {
      for (const { kind, path: spelled } of spellings) {
        printSpelling("GP6(ii)", kind, canonicalOrig, spelled);
        const home = freshHome();
        recordLand(home, original, `gp6ii-${kind}`, tip);
        const out = runLand({ tree: spelled, main: linkedMain, suite: "node -e \"process.exit(0)\"", reviewed: [`${tip}=gp6ii-${kind}`], home });
        ok(out.code === 0, `[${kind}] runLand refused: ${out.text}`);
        ok(git(linkedMain, "rev-parse", "HEAD") === tip, `[${kind}] main did not advance to the tip`);
      }
    });
  }
  // (iii) runCleanup(lane, {main: M3, worktree: <S of W>}) removes the lane worktree and branch.
  {
    const main = repo(tmpRoot, "gp6iii-main");
    const canonicalMain = fs.realpathSync.native(main);
    const spellings = otherSpellings(canonicalMain, "GP6(iii)-main");
    // req: R-1355
    check("GP6(iii): nana-land cleanup matches a worktree named through a second spelling to its registration", () => {
      for (const { kind, path: spelledMain } of spellings) {
        const feature = path.join(tmpRoot, `gp6iii-feat-${kind}`);
        git(main, "worktree", "add", "-b", `feat/gp6iii-${kind}`, feature);
        commit(feature, `next-${kind}.txt`, "next\n", "next");
        git(main, "merge", "--ff-only", `feat/gp6iii-${kind}`);
        const canonicalFeature = fs.realpathSync.native(feature);
        const featureSpellings = otherSpellings(canonicalFeature, "GP6(iii)-feature");
        for (const { kind: wtKind, path: spelledFeature } of featureSpellings) {
          printSpelling("GP6(iii)", `${kind}+${wtKind}`, `${canonicalMain}|${canonicalFeature}`, `${spelledMain}|${spelledFeature}`);
          const result = runCleanup(`gp6iii-${kind}`, { main: spelledMain, worktree: spelledFeature });
          ok(result.code === 0, `[${kind}/${wtKind}] cleanup refused: ${result.text}`);
          ok(!fs.existsSync(feature), `[${kind}/${wtKind}] the worktree folder is still present`);
          break; // one worktree spelling per main spelling keeps this O(spellings), not O(spellings^2)
        }
      }
    });
  }
}

// ================================================================= GP7 (R-1356)
// IF a non-LAND verdict, or a review still in flight, for a named reviewed revision was recorded
// through a second spelling of the repository's folder, THEN the land merge command shall refuse.
{
  const main = repo(tmpRoot, "gp7-main");
  const feature = path.join(tmpRoot, "gp7-feat");
  git(main, "worktree", "add", "-b", "feat/gp7", feature);
  const tip = commit(feature, "next.txt", "next\n", "next");
  const canonicalFeature = fs.realpathSync.native(feature);
  // Spelled through the FEATURE checkout (already at `tip`), so admit()'s own HEAD-derived
  // revision naturally equals `tip` without needing a separate --revision override.
  const spellings = otherSpellings(canonicalFeature, "GP7");
  // req: R-1356
  check("GP7: a non-LAND verdict or an in-flight review recorded through a second spelling of the repository's folder refuses the land", () => {
    for (const { kind, path: spelled } of spellings) {
      printSpelling("GP7", kind, canonicalFeature, spelled);
      // Leg 1: a verified SEND-BACK for another item at the tip, recorded through the spelled path.
      {
        const home = freshHome();
        const admission = admit(["--item", `gp6-other-${kind}`, "--tree", spelled, "--role", "test"], { home, cwd: spelled, launcher: "path-spelling.test.mjs" });
        ok(admission.ok, `[${kind}] admit (send-back) failed: ${admission.message}`);
        const c = complete(admission.res, "VERDICT: SEND-BACK", { home });
        ok(c.ok, `[${kind}] complete (send-back) failed: ${c.message}`);
        const landAdmission = admit(["--item", `gp6-${kind}`, "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "path-spelling.test.mjs" });
        ok(landAdmission.ok, `[${kind}] admit (land) failed: ${landAdmission.message}`);
        const landComplete = complete(landAdmission.res, "VERDICT: LAND", { home });
        ok(landComplete.ok, `[${kind}] complete (land) failed: ${landComplete.message}`);
        const before = git(main, "rev-parse", "HEAD");
        const out = runLand({ tree: feature, main, suite: "node -e \"process.exit(0)\"", reviewed: [`${tip}=gp6-${kind}`], home });
        ok(out.code !== 0, `[${kind}] non-LAND leg: expected a refusal, got code 0`);
        ok(/non-LAND verdict/.test(out.text), `[${kind}] non-LAND leg: missing "non-LAND verdict": ${out.text}`);
        ok(git(main, "rev-parse", "HEAD") === before, `[${kind}] non-LAND leg: main moved`);
      }
      // Leg 2: item A is LANDED at the tip; item B is admitted (not completed) at the tip, through
      // the spelled path. The in-flight reservation for B must still block the land of A, because
      // the round cap (and this check) binds to the REVISION, not the item.
      {
        const home = freshHome();
        const landAdmission = admit(["--item", `gp6-land-${kind}`, "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "path-spelling.test.mjs" });
        ok(landAdmission.ok, `[${kind}] admit (land) failed: ${landAdmission.message}`);
        const landComplete = complete(landAdmission.res, "VERDICT: LAND", { home });
        ok(landComplete.ok, `[${kind}] complete (land) failed: ${landComplete.message}`);
        const held = admit(["--item", `gp6-inflight-${kind}`, "--tree", spelled, "--role", "test"], { home, cwd: spelled, launcher: "path-spelling.test.mjs" });
        ok(held.ok, `[${kind}] admit (in-flight) failed: ${held.message}`);
        ok(held.res.revision === tip, `[${kind}] admitted revision is not the tip: ${held.res.revision}`);
        const before = git(main, "rev-parse", "HEAD");
        const out = runLand({ tree: feature, main, suite: "node -e \"process.exit(0)\"", reviewed: [`${tip}=gp6-land-${kind}`], home });
        ok(out.code !== 0, `[${kind}] in-flight leg: expected a refusal, got code 0`);
        ok(/review in flight/.test(out.text), `[${kind}] in-flight leg: missing "review in flight": ${out.text}`);
        ok(git(main, "rev-parse", "HEAD") === before, `[${kind}] in-flight leg: main moved`);
      }
    }
  });
}

console.log(failures ? `${failures} FAILED` : "all passed");
process.exit(failures ? 1 : 0);
