/**
 * @module packages/nana-pack/tests/review-ledger-state.test.mjs
 * @purpose Pin review identity, clean admission, tally, audit, completion and output safety through real processes.
 * @inputs Shared ledger fixtures, review launchers and temporary git repositories.
 * @outputs PASS/FAIL lines and a failing exit status on a false check.
 * @effects disk (temporary repositories and ledger), process (review stubs and git).
 * @errors Unexpected exceptions fail the run.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmp, outs, PI_WORKER, mod, home, agent, tallyFile, auditFile, resDir, freshHome, env, pathForms, jsonl, roundsOf, check, gitIn, repo, A, B, plain, out, piReview, ledgerRun, ledgerCheck, noStack, reviewAt, finish } from "./review-ledger-fixture.mjs";

// 3. Canonical item and repository identity; one seed per item is enough.
{
 freshHome("3");
 reviewAt("CaseItem", 0);
 check("'caseitem' shares canonical item after one round", reviewAt("caseitem", 1).status === 0 && roundsOf("caseitem").length === 2);
 reviewAt("scope one", 0);
 check("'scope  one' shares the canonical item", reviewAt(" Scope  ONE ", 1).status === 0 && roundsOf("scope one").length === 2);
 for (const bad of ["../item", "x".repeat(20000)]) {
  const r = ledgerRun(["--item", bad]);
  check(`--item ${JSON.stringify(bad.slice(0, 10))}${bad.length > 10 ? "…" : ""} refused, no stack`, r.status === 1 && /item/.test(r.stderr) && noStack(r), r.stderr);
 }
 reviewAt("shared", 0);
 // req: R-705
 check("same slug, unrelated repo B: its own item (admitted)", reviewAt("shared", 0, [], B).status === 0 && roundsOf("shared").length === 2);
 const W = path.join(tmp, "A-wt");
 gitIn(A.d, "worktree", "add", "-q", "--detach", W, A.shas[1]);
 A.at(0); ledgerRun(["--item", "wt"]);
 ledgerRun(["--item", "wt"], { cwd: W });
 A.at(2); ledgerRun(["--item", "wt"]);
 // req: R-705
 check("two worktrees: one repo identity in the tally", new Set(roundsOf("wt").map(r => r.repo)).size === 1 && roundsOf("wt").length === 3, pathForms(W));
 A.at(2, W);
 check("worktree W2 at A's already-counted revision: admitted, no new round", ledgerRun(["--item", "wt"], { cwd: W }).status === 0 && roundsOf("wt").length === 3);
 A.at(3, W);
 const w4 = ledgerRun(["--item", "wt"], { cwd: W });
 // req: R-705
 check("worktree W2 at a 4th revision: same item and admitted", w4.status === 0 && roundsOf("wt").length === 4, w4.stderr);
 // req: R-624
 check("outside git refuses admission unless --tree names a reviewed repository", ledgerRun(["--item", "plain", "--revision", "abc"], { cwd: plain }).status === 1 && /run from the reviewed tree or pass --tree/.test(ledgerRun(["--item", "plain", "--revision", "abc"], { cwd: plain }).stderr));
 const scratch = path.join(tmp, "scratch"); fs.mkdirSync(scratch);
 A.at(0); B.at(5);
 const viaTreeOut = out();
 const viaTree = ledgerRun(["--item", "tree-scope", "--tree", A.d], { cwd: B.d, cmd: [process.execPath, "-e", "console.log(process.cwd()); console.log('VERDICT: LAND')"], outFile: viaTreeOut });
 // req: R-621 R-705
 check("scratch launcher cwd with --tree uses the reviewed repository scope", viaTree.status === 0 && roundsOf("tree-scope")[0]?.repo === `git:${path.join(A.d, ".git")}` && roundsOf("tree-scope")[0]?.revision === A.shas[0] && A.shas[0] !== B.shas[5] && fs.readFileSync(viaTreeOut, "utf8").split(/\r?\n/)[0] === A.d, viaTree.stderr);
 const piTree = piReview(["--item", "pi-tree-scope", "--tree", A.d, "--out", out()], { cwd: scratch });
 // req: R-621
 check("pi-review --tree succeeds from a non-git scratch cwd", piTree.status === 0 && roundsOf("pi-tree-scope")[0]?.repo === `git:${path.join(A.d, ".git")}`, piTree.stderr);
 const nestedLauncher = path.join(A.d, "nested-launcher"), nestedTree = path.join(A.d, "nested-tree");
 fs.mkdirSync(nestedLauncher); fs.mkdirSync(nestedTree);
 const marker = path.join(tmp, "child-cwd-marker");
 const cwdCommand = [process.execPath, "-e", `require('fs').writeFileSync(${JSON.stringify(marker)}, process.cwd()); console.log(process.cwd()); console.log('VERDICT: LAND')`];
 const nestedOut = out(), selectedOut = out();
 const fromNestedLauncher = ledgerRun(["--item", "cwd-default"], { cwd: nestedLauncher, cmd: cwdCommand, outFile: nestedOut });
 const fromSelectedTree = ledgerRun(["--item", "cwd-tree", "--tree", nestedTree], { cwd: nestedLauncher, cmd: cwdCommand, outFile: selectedOut });
 check("review-ledger child executes from selected directory, not repository root", fromNestedLauncher.status === 0 && fromSelectedTree.status === 0 && fs.readFileSync(nestedOut, "utf8").split(/\r?\n/)[0] === nestedLauncher && fs.readFileSync(selectedOut, "utf8").split(/\r?\n/)[0] === nestedTree && fs.readFileSync(marker, "utf8") === nestedTree, fromNestedLauncher.stderr + fromSelectedTree.stderr);
 const legacy = { v: 1, kind: "round", repo: "path:/legacy/scratch", item: "legacy", revision: "old-revision" };
 fs.mkdirSync(agent, { recursive: true }); fs.appendFileSync(tallyFile, JSON.stringify(legacy) + "\n");
 // req: R-622
 check("legacy path-keyed tally rows remain readable", ledgerCheck(["--item", "legacy"], A.d).status === 0 && jsonl(tallyFile).some(r => r.repo === legacy.repo && r.item === legacy.item && r.revision === legacy.revision));
}

// 8. The permanent tally survives two audit rotations.
{
 freshHome("8");
 for (let i = 0; i < 3; i++) reviewAt("rot", i);
 const pad = (JSON.stringify({ v: 1, kind: "noise", pad: "x".repeat(200) }) + "\n").repeat(6000);
 for (let g = 0; g < 2; g++) { fs.appendFileSync(auditFile, pad); reviewAt(`other${g}`, 0); }
 const gen1 = jsonl(auditFile + ".1");
 // req: R-722
 check("the audit log rotated twice (.1 holds only the 2nd generation; rot's verdicts are gone from it)", gen1.some(r => r.item === "other0") && !gen1.some(r => r.item === "rot") && !jsonl(auditFile).some(r => r.item === "rot"));
 const r = reviewAt("rot", 3);
 // req: R-722
 check("after two rotations the prior three revisions remain counted", r.status === 0 && /3 round\(s\) used/.test(r.stderr), r.stderr);
 // req: R-721
 check("the tally never rotates", !fs.existsSync(tallyFile + ".1") && roundsOf("rot").length === 4);
}

// 11. Projection never changes ledger state.
{
 freshHome("11"); reviewAt("ck", 0);
 fs.writeFileSync(path.join(resDir, "held.json"), JSON.stringify({ id: "held", pid: process.pid, repo: "x", item: "other", revision: "r" }));
 const tallyBefore = fs.readFileSync(tallyFile, "utf8"), auditBefore = fs.readFileSync(auditFile, "utf8"), resBefore = fs.readdirSync(resDir).sort().join(",");
 fs.chmodSync(resDir, 0o555); A.at(1);
 const c = ledgerCheck(["--item", "ck"]);
 fs.chmodSync(resDir, 0o755);
 check("check with a read-only reservations dir succeeds (it writes nothing)", c.status === 0 && /would be round 2/.test(c.stdout), c.stderr + c.stdout);
 check("check changed neither the tally, the audit nor the reservations (captured before check)", tallyBefore.length > 0 && tallyBefore === fs.readFileSync(tallyFile, "utf8") && auditBefore === fs.readFileSync(auditFile, "utf8") && resBefore === "held.json" && fs.readdirSync(resDir).sort().join(",") === resBefore);
 fs.rmSync(path.join(resDir, "held.json")); freshHome("11b");
 const c2 = ledgerCheck(["--item", "nothing"]);
 check("check on a machine with no ledger creates nothing", c2.status === 0 && !fs.existsSync(agent), c2.stderr);
}

// 13. Main use: both entry points refuse each kind of uncommitted path before reserving.
{
 freshHome("13");
 const D = repo("D", 1);
 const results = [];
 for (const kind of ["modified", "staged", "untracked"]) {
  const file = path.join(D.d, kind === "untracked" ? "new.txt" : "f");
  fs.writeFileSync(file, "uncommitted\n");
  if (kind === "staged") gitIn(D.d, "add", "f");
  for (const launch of [() => ledgerRun(["--item", "dirty"], { cwd: D.d }), () => piReview(["--item", "dirty", "--out", out()], { cwd: D.d })]) {
   const r = launch();
   results.push(r.status === 1 && /uncommitted paths/.test(r.stderr) && !/admitted as round/.test(r.stderr) && noStack(r) && roundsOf("dirty").length === 0 && (!fs.existsSync(resDir) || fs.readdirSync(resDir).length === 0));
  }
  gitIn(D.d, "reset", "--hard", "HEAD");
  if (kind === "untracked") fs.rmSync(file);
 }
 // req: R-4200
 check("dirty trees refuse both launchers before admission without consuming a round", results.length === 6 && results.every(Boolean), JSON.stringify(results));
}

// 14. Worker semantics are independent of review admission.
{
 freshHome("14");
 const count = path.join(tmp, "worker-count"), wo = path.join(outs, "worker-plain.md");
 const w = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--out", wo, "--", "-p", "x"], { cwd: A.d, env: env({ STUB: "plain", COUNT: count }), encoding: "utf8", timeout: 30000 });
 // req: R-734
 check("a worker reply with NO review token succeeds (exit 0, output written)", w.status === 0 && /Implemented the change/.test(fs.readFileSync(wo, "utf8")) && /SUCCESS on attempt 1/.test(w.stderr), w.stderr);
 check("…and ran exactly once (zero retries)", fs.readFileSync(count, "utf8").trim().split("\n").length === 1 && !/retrying/.test(w.stderr), fs.readFileSync(count, "utf8"));
 const wf = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--out", path.join(outs, "wf.md"), "--", "-p", "x"], { cwd: A.d, env: env({ STUB: "fail" }), encoding: "utf8", timeout: 30000 });
 // req: R-735
 check("a failing worker is NOT retried by default (1 attempt, exit 1)", wf.status === 1 && /attempt 1\/1/.test(wf.stderr) && !/attempt 2/.test(wf.stderr), wf.stderr);
 const wr = spawnSync(process.execPath, [PI_WORKER, "--poll", "1", "--retries", "1", "--out", path.join(outs, "wr.md"), "--", "-p", "x"], { cwd: A.d, env: env({ STUB: "fail" }), encoding: "utf8", timeout: 30000 });
 check("--retries 1 opts in explicitly, with a mutation warning (2 attempts)", wr.status === 1 && /REPEATS any file mutations/.test(wr.stderr) && /attempt 2\/2/.test(wr.stderr), wr.stderr);
 const plainReview = piReview(["--item", "shape", "--out", out()], { stub: "plain" });
 // req: R-701
 check("pi-review still requires review shape (the same plain reply is no verdict)", plainReview.status === 1 && roundsOf("shape").length === 0, plainReview.stderr);
}

// 15. Corrupt real index must retain git's diagnostic.
{
 freshHome("15"); const G = repo("G", 1);
 fs.writeFileSync(path.join(G.d, ".git", "index"), "garbage");
 const r = ledgerRun(["--item", "gitfail"], { cwd: G.d });
 // req: R-712
 check("corrupt index → refused, the message names git's error, no stack, no round", r.status === 1 && /git .*failed .*index/i.test(r.stderr) && /admission refused/.test(r.stderr) && noStack(r) && roundsOf("gitfail").length === 0, r.stderr);
 const c = ledgerCheck(["--item", "gitfail"], G.d);
 check("check refuses too", c.status === 1 && /failed/.test(c.stderr), c.stderr);
}

// 16. Git-clean normalized checkouts admit as plain HEAD, without writing the real index.
{
 const revOf = d => {
  const admitted = mod.admit(["--item", "normalized", "--tree", d], { home, launcher: "test" });
  if (!admitted.ok) throw new Error(admitted.message);
  mod.release(admitted.id, { home });
  return admitted.res.revision;
 };
 const S = repo("S", 1);
 const index = path.join(S.d, ".git", "index"), before = fs.readFileSync(index), stat = fs.statSync(index);
 const clean = revOf(S.d);
 const admission = mod.admit(["--item", "clean", "--tree", S.d], { home, launcher: "test" });
 // req: R-708
 check("clean tree → the bare HEAD sha", clean === S.shas[0] && admission.ok && admission.res.revision === clean && mod.treeScope(S.d).snapshot === null && before.equals(fs.readFileSync(index)) && stat.mtimeMs === fs.statSync(index).mtimeMs, clean);
 if (admission.ok) mod.release(admission.id, { home });
 const Mx = repo("Mx", 1);
 gitIn(Mx.d, "update-index", "--chmod=+x", "f"); gitIn(Mx.d, "commit", "-qm", "exec");
 const mxHead = gitIn(Mx.d, "rev-parse", "HEAD");
 gitIn(Mx.d, "config", "core.fileMode", "false"); fs.chmodSync(path.join(Mx.d, "f"), 0o644);
 const mxLsTree = gitIn(Mx.d, "ls-tree", "HEAD", "--", "f"), mxDiffQuiet = spawnSync("git", ["diff", "--quiet", "HEAD", "--"], { cwd: Mx.d }).status;
 // req: R-1370
 check("lost committed exec bit retains plain HEAD", /^100755/.test(mxLsTree) && mxDiffQuiet === 0 && revOf(Mx.d) === mxHead, mxLsTree);
 const Cr = repo("Cr", 0);
 fs.writeFileSync(path.join(Cr.d, "t.txt"), "l1\nl2\n"); gitIn(Cr.d, "add", "."); gitIn(Cr.d, "commit", "-qm", "lf");
 const crHead = gitIn(Cr.d, "rev-parse", "HEAD");
 gitIn(Cr.d, "config", "core.autocrlf", "true"); fs.rmSync(path.join(Cr.d, "t.txt")); gitIn(Cr.d, "checkout", "--", "t.txt");
 const crBytes = fs.readFileSync(path.join(Cr.d, "t.txt")), crDiffQuiet = spawnSync("git", ["diff", "--quiet", "HEAD", "--"], { cwd: Cr.d }).status;
 // req: R-1371
 check("CRLF checkout retains plain HEAD", crBytes.includes(0x0d) && crDiffQuiet === 0 && revOf(Cr.d) === crHead, JSON.stringify(crBytes.toString()));
 const Cs = repo("Cs", 0);
 fs.writeFileSync(path.join(Cs.d, "t.txt"), "line1\nline2\n"); gitIn(Cs.d, "add", "."); gitIn(Cs.d, "commit", "-qm", "base");
 const csHead = gitIn(Cs.d, "rev-parse", "HEAD");
 gitIn(Cs.d, "config", "core.autocrlf", "true"); gitIn(Cs.d, "config", "core.safecrlf", "true");
 const csStatus = spawnSync("git", ["--no-optional-locks", "status", "--porcelain"], { cwd: Cs.d, encoding: "utf8" }).stdout;
 // req: R-1378
 check("clean checkout under core.autocrlf and core.safecrlf retains plain HEAD", csStatus === "" && revOf(Cs.d) === csHead, csStatus);
}

// 17. Completion rechecks under the lock; a newly dirty tree consumes an unverified round.
{
 freshHome("17"); const K = repo("K", 1);
 const editThenVerdict = [process.execPath, "-e", `require('fs').writeFileSync(${JSON.stringify(path.join(K.d, "f"))}, 'edited mid-review'); console.log('VERDICT: LAND')`];
 const r = ledgerRun(["--item", "drift"], { cwd: K.d, cmd: editThenVerdict });
 const t = roundsOf("drift"), au = jsonl(auditFile).filter(x => x.item === "drift");
 // req: R-717
 check("edit during the review → exit 1, 'changed during the review', verdict NOT recorded as valid", r.status === 1 && /changed during the review/.test(r.stderr) && !au.some(x => x.kind === "verdict"), r.stderr);
 check("…the round IS consumed for the admitted revision (tally: unverified, completedAs = null)", t.length === 1 && t[0].revision === K.shas[0] && t[0].unverified === true && t[0].completedAs === null && /uncommitted paths/.test(t[0].completedError) && au.some(x => x.kind === "verdict-unverified"), JSON.stringify(t));
 // req: R-716
 check("…and no reservation is left behind", fs.readdirSync(resDir).length === 0);
}

// 20. Output safety: tracked aliases refuse, untracked leftovers refuse, ignored/outside remain silent.
{
 freshHome("20"); const O = repo("O", 1);
 fs.writeFileSync(path.join(O.d, ".gitignore"), "*.log\n"); gitIn(O.d, "add", ".gitignore"); gitIn(O.d, "commit", "-qm", "ignore");
 const tracked = ledgerRun(["--item", "outt"], { cwd: O.d, outFile: path.join(O.d, "f") });
 // req: R-724
 check("a TRACKED --out is refused before the review runs (file untouched, nothing reserved)", tracked.status === 1 && /TRACKED file/.test(tracked.stderr) && fs.readFileSync(path.join(O.d, "f"), "utf8") === "O0" && roundsOf("outt").length === 0 && noStack(tracked), tracked.stderr);
 const trackedRel = ledgerRun(["--item", "outt"], { cwd: O.d, outFile: "./sub/../f" });
 check("…also when spelled through ../ (resolved)", trackedRel.status === 1 && /TRACKED file/.test(trackedRel.stderr), trackedRel.stderr);
 gitIn(O.d, "rm", "-q", "--cached", "f");
 const headOnly = mod.admit(["--item", "outt", "--out", path.join(O.d, "f")], { launcher: "test", home, cwd: O.d });
 check("…and a path tracked in HEAD but removed from the index", headOnly.ok === false && /TRACKED/.test(headOnly.message), JSON.stringify(headOnly));
 gitIn(O.d, "reset", "-q");
 fs.writeFileSync(path.join(O.d, "new-out.md"), "VERDICT: LAND\n");
 const untracked = ledgerRun(["--item", "outu"], { cwd: O.d, outFile: path.join(O.d, "new-out.md") });
 // req: R-725
 check("an untracked in-tree --out refuses as an uncommitted path", untracked.status === 1 && /uncommitted paths/.test(untracked.stderr) && /--out/.test(untracked.stderr) && roundsOf("outu").length === 0, untracked.stderr);
 fs.rmSync(path.join(O.d, "new-out.md"));
 const ignored = ledgerRun(["--item", "outi"], { cwd: O.d, outFile: path.join(O.d, "r.log") });
 // req: R-845
 check("an ignored in-tree --out is silent", ignored.status === 0 && !/WARNING/.test(ignored.stderr), ignored.stderr);
 const outside = ledgerRun(["--item", "outo"], { cwd: O.d });
 // req: R-845
 check("an --out outside the tree is silent", outside.status === 0 && !/WARNING/.test(outside.stderr), outside.stderr);
 const chk = ledgerCheck(["--item", "outt", "--out", path.join(O.d, "f")], O.d);
 // req: R-724
 check("review-ledger check refuses a tracked --out too", chk.status === 1 && /TRACKED/.test(chk.stderr), chk.stderr);
 const fBytes = fs.readFileSync(path.join(O.d, "f"));
 const link = path.join(outs, "link-to-f.md"), chain = path.join(outs, "chain-to-f.md");
 fs.symlinkSync(path.join(O.d, "f"), link); fs.symlinkSync(path.basename(link), chain);
 for (const [label, o] of [["a symlinked --out aimed at a tracked file", link], ["…through a chain of two links", chain]]) {
  const s = ledgerRun(["--item", "outs"], { cwd: O.d, outFile: o });
  check(`${label} is refused BEFORE the review (target byte-identical, nothing reserved or counted)`, s.status === 1 && /TRACKED file/.test(s.stderr) && !/admitted/.test(s.stderr) && fs.readFileSync(path.join(O.d, "f")).equals(fBytes) && roundsOf("outs").length === 0 && fs.readdirSync(resDir).length === 0 && noStack(s), s.stderr);
 }
 const dangling = path.join(outs, "dangling.md"); fs.symlinkSync(path.join(O.d, "made-by-link.md"), dangling);
 check("a dangling --out link is resolved to where the write would land (in-tree → warns)", /inside the reviewed tree/.test(mod.outInTree(O.d, dangling) ?? ""));
 fs.writeFileSync(path.join(O.d, "..notes.md"), "NOTES\n"); gitIn(O.d, "add", "..notes.md"); gitIn(O.d, "commit", "-qm", "dotdot");
 const dd = ledgerRun(["--item", "outd"], { cwd: O.d, outFile: path.join(O.d, "..notes.md") });
 // req: R-724
 check("a TRACKED file named ..notes.md is in-tree and refused (file untouched)", dd.status === 1 && /TRACKED file/.test(dd.stderr) && fs.readFileSync(path.join(O.d, "..notes.md"), "utf8") === "NOTES\n" && roundsOf("outd").length === 0, dd.stderr);
}
finish();
