/**
 * @module packages/nana-pack/tests/immutable-review.test.mjs
 * @purpose Pins immutable pi-review snapshots, refusal before admission, child checkout identity and cleanup.
 * @inputs pi-review.mjs, review-round.mjs, a fake pi executable and temporary git repositories.
 * @outputs PASS/FAIL checks and a failing process status when a check is false.
 * @effects disk (temporary repositories and worktrees), process (fake review launch).
 * @errors failed assertions exit nonzero; unexpected process errors fail the test.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin");
const piReview = path.join(bin, "pi-review.mjs");
const reviewRound = await import(pathToFileURL(path.join(bin, "review-round.mjs")).href);
const root = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "immutable-review-test-")));
const fakeBin = path.join(root, "fake-bin");
fs.mkdirSync(fakeBin);
// The observed argv ("$*"/argv) may itself carry embedded newlines once an appended system
// prompt is multi-line text (R-1105): write it as the file's tail, after exactly three header
// lines, so a reader can split the header and rejoin the remainder, rather than one blind
// split("\n"). win32 has no pi-the-sh-script (findPi only accepts .com/.exe/.bat/.cmd, and the
// npm package it then expects sits beside it, R-1125): lay out that npm shape instead, through
// the shared helper, with a Node port of the same body. POSIX keeps this sh script unchanged.
if (process.platform === "win32") {
  writeFakePi(fakeBin, `const fs = require("node:fs");
if (process.env.OBSERVE_PID) fs.writeFileSync(process.env.OBSERVE_PID, String(process.pid) + "\\n");
fs.writeFileSync(process.env.OBSERVE, process.cwd() + "\\n" + process.env.NANA_REVIEW_ROOT + "\\n" + process.env.NANA_ROLE + "\\n");
fs.appendFileSync(process.env.OBSERVE, process.argv.slice(2).join(" "));
const waitFor = process.env.WAIT_FOR;
function finish() {
  if (process.env.MODE === "fail") process.exit(1);
  if (process.env.MODE === "stall") { setTimeout(() => {}, 30000); return; }
  console.log("VERDICT: LAND");
}
function poll() {
  if (waitFor && !fs.existsSync(waitFor)) { setTimeout(poll, 50); return; }
  finish();
}
poll();
`);
} else {
  const fakePi = path.join(fakeBin, "pi");
  fs.writeFileSync(fakePi, `#!/bin/sh
printf '%s\\n' "$$" > "$OBSERVE_PID"
printf '%s\\n%s\\n%s\\n' "$PWD" "$NANA_REVIEW_ROOT" "$NANA_ROLE" > "$OBSERVE"
printf '%s' "$*" >> "$OBSERVE"
while [ -n "$WAIT_FOR" ] && [ ! -e "$WAIT_FOR" ]; do sleep 0.05; done
case "$MODE" in fail) exit 1;; stall) exec sleep 30;; *) echo 'VERDICT: LAND';; esac
`);
  fs.chmodSync(fakePi, 0o755);
}
const home = path.join(root, "home");
const env = (extra = {}) => ({ ...process.env, HOME: home, USERPROFILE: home, PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`, ...extra });
// canonPath/includesWorktree compare a worktree path git prints (porcelain, always its own long
// canonical form) against a path this test built from the OS temp root, which on a Windows CI
// runner keeps the 8.3 short form (RUNNER~1) — kept deliberately (the hard rule below) so lane
// W7c's product fix has a failing check to turn green. win32: native real path, which is the
// product's own fsReal/R-1125 choice, falling back to a resolve+case-fold when the path is
// already gone (a reclaimed or removed checkout). POSIX: plain (non-native) realpath, falling
// back to path.resolve for the same already-gone case (detail below).
function canonPath(p) {
  if (process.platform === "win32") {
    try { return fs.realpathSync.native(p).replace(/^\\\\\?\\/, ""); }
    catch { return path.win32.resolve(p).toLowerCase(); }
  }
  // POSIX: plain (non-native) realpath, already used elsewhere in this file (snapshotCorrect) —
  // os.tmpdir() sits behind a symlink on macOS (/var -> /private/var) that git itself resolves
  // in its own porcelain output, so an unresolved path.resolve() would under-match here.
  try { return fs.realpathSync(p); } catch { return path.resolve(p); }
}
function worktreePaths(porcelain) {
  return porcelain.split(/\r?\n/).filter((l) => l.startsWith("worktree ")).map((l) => l.slice("worktree ".length));
}
function includesWorktree(porcelain, target) {
  if (!target) return false;
  const want = canonPath(target);
  return worktreePaths(porcelain).some((p) => canonPath(p) === want);
}
// Printed in the detail of every check the plan names as blocked, until W7c's product fix, by
// the SAME short-vs-long mismatch (R-724/R-967/R-705): the tree root git reports (long) against
// this process's own JS realpathSync of its short TEMP (RUNNER~1) — WR1's "short and long paths
// it compared".
const pathForms = (p) => {
  let short = p, long = p;
  try { short = fs.realpathSync(p); } catch { /* keep the raw path */ }
  try { long = fs.realpathSync.native(p).replace(/^\\\\\?\\/, ""); } catch { /* keep the raw path */ }
  return `short=${short} long=${long}`;
};
const git = (cwd, ...args) => {
  const r = spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@test", ...args], { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
};
const repo = path.join(root, "repo");
fs.mkdirSync(repo);
git(repo, "init", "-q", "-b", "main");
fs.writeFileSync(path.join(repo, ".gitignore"), "ignored.txt\n");
fs.writeFileSync(path.join(repo, "tracked.txt"), "base\n");
fs.writeFileSync(path.join(repo, "deleted.txt"), "delete me\n");
fs.writeFileSync(path.join(repo, "staged-deleted.txt"), "delete from index\n");
git(repo, "add", ".gitignore", "tracked.txt", "deleted.txt", "staged-deleted.txt");
git(repo, "commit", "-qm", "base");
const initialHead = git(repo, "rev-parse", "HEAD");
fs.writeFileSync(path.join(repo, "tracked.txt"), "dirty tracked content\n");
fs.rmSync(path.join(repo, "deleted.txt"));
fs.rmSync(path.join(repo, "staged-deleted.txt"));
git(repo, "add", "-u", "staged-deleted.txt");
// NTFS refuses a control character (a bare newline included) in a file name; win32 substitutes
// U+2028 (LINE SEPARATOR), which is legal there and still outside the plain-ASCII names every
// other fixture here uses. The exact-newline claim stays POSIX-only.
const hostileName = process.platform === "win32" ? "name\u2028with-newline.txt" : "name\nwith-newline.txt";
fs.writeFileSync(path.join(repo, hostileName), "newline filename\n");
fs.symlinkSync("tracked.txt", path.join(repo, "link.txt"));
fs.writeFileSync(path.join(repo, "ignored.txt"), "do not copy\n");
const revision = reviewRound.resolveRevision(undefined, reviewRound.treeScope(repo), repo);
const out = path.join(root, "review.md");
const observe = path.join(root, "observed.txt");
const release = path.join(root, "release");
let failures = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) failures++; };
const trackedOut = spawnSync(process.execPath, [piReview, "--item", "tracked-out", "--out", path.join(repo, "tracked.txt"), "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "tracked-out-observe") }), encoding: "utf8", timeout: 30000,
});
const trackedOutTrees = git(repo, "worktree", "list", "--porcelain");
// req: R-724
check("pi-review refuses tracked --out before checkout or admission and leaves the file untouched", trackedOut.status === 1 && /TRACKED file/.test(trackedOut.stderr) &&
  fs.readFileSync(path.join(repo, "tracked.txt"), "utf8") === "dirty tracked content\n" && !fs.existsSync(path.join(root, "tracked-out-observe")) &&
  !trackedOutTrees.split(/\r?\n/).some((line) => line.startsWith("worktree ") && line.includes("nana-review-")) &&
  reviewRound.readRounds(home, { item: "tracked-out" }).length === 0, JSON.stringify({ status: trackedOut.status, stderr: trackedOut.stderr, output: fs.readFileSync(path.join(repo, "tracked.txt"), "utf8"), observe: fs.existsSync(path.join(root, "tracked-out-observe")), trackedOutTrees, compared: pathForms(path.join(repo, "tracked.txt")) }));
const preexistingOut = path.join(repo, "existing-output.md");
fs.writeFileSync(preexistingOut, "old untracked output\n");
const existingOutRun = spawnSync(process.execPath, [piReview, "--item", "existing-output", "--out", preexistingOut, "--retries", "0", "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "existing-output-observe") }), encoding: "utf8", timeout: 30000,
});
// req: R-967
check("pre-existing untracked in-tree output warns and review proceeds", existingOutRun.status === 0 && /WARNING/.test(existingOutRun.stderr) && fs.readFileSync(preexistingOut, "utf8").includes("VERDICT: LAND") &&
  reviewRound.readRounds(home, { item: "existing-output" }).length === 1, `${existingOutRun.stderr} compared: ${pathForms(path.join(repo, "tracked.txt"))}`);
fs.rmSync(preexistingOut);
const args = [piReview, "--item", "immutable", "--role", "sol", "--revision", "main", "--out", out, "--poll", "0.1", "--stall-secs", "3", "--retries", "0", "--", "-p", "review", "--provider", "openai-codex", "-m", "gpt-5.6-sol"];
const observePid = path.join(root, "observe-pid");
const child = spawn(process.execPath, args, { cwd: repo, env: env({ OBSERVE: observe, OBSERVE_PID: observePid, WAIT_FOR: release }) });
const childClosed = new Promise((resolve) => child.on("close", (code) => resolve(code)));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const OBSERVE_WAIT_ITERATIONS = 200; // chosen: five seconds lets the child record launch state on loaded CI.
for (let i = 0; i < OBSERVE_WAIT_ITERATIONS && !fs.existsSync(observe); i++) await delay(25);
const launched = fs.existsSync(observe);
// Header is exactly three lines (cwd, NANA_REVIEW_ROOT, NANA_ROLE); the remainder is the raw
// argv tail, rejoined verbatim even when it carries its own embedded newlines (R-1105).
const observedParts = launched ? fs.readFileSync(observe, "utf8").split("\n") : [];
let observed = launched ? [observedParts[0], observedParts[1], observedParts[2], observedParts.slice(3).join("\n")] : [];
const checkout = observed[0];
// Canonicalized NOW, while the checkout still exists: by the time check 7 (below) looks at it,
// pi-review has already removed the worktree on success, and a canonicalize-at-use would throw
// or (on win32) silently fall back for a path that is simply gone, not mismatched.
const checkoutCanon = checkout ? canonPath(checkout) : "";
const snapshotCorrect = launched && fs.existsSync(observePid) && /^\d+\n?$/.test(fs.readFileSync(observePid, "utf8")) && fs.realpathSync(checkout) === fs.realpathSync(observed[1]) && observed[2] === "reviewer" &&
  observed[3].includes(`Your cwd is an immutable checkout of revision ${revision} at ${observed[1]}; read files there, not in other worktrees`) &&
  fs.readFileSync(path.join(checkout, "tracked.txt"), "utf8") === "dirty tracked content\n" &&
  !fs.existsSync(path.join(checkout, "deleted.txt")) &&
  !fs.existsSync(path.join(checkout, "staged-deleted.txt")) &&
  fs.readFileSync(path.join(checkout, hostileName), "utf8") === "newline filename\n" &&
  fs.readlinkSync(path.join(checkout, "link.txt")) === "tracked.txt" &&
  !fs.existsSync(path.join(checkout, "ignored.txt"));
// A commit to the source after admission must not change completion's checkout revision.
if (launched) {
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "source changed during review");
}
fs.writeFileSync(release, "go");
const result = await childClosed;
const row = reviewRound.readRounds(home, { item: "immutable" })[0];
const worktreesAfterSuccess = git(repo, "worktree", "list", "--porcelain");
// req: R-967
// req: R-968
// req: R-974
check("dirty working state is reproduced exactly and reviewer runs in the immutable checkout", result === 0 && snapshotCorrect && row?.revision === revision, `${JSON.stringify({ result, observed, row, revision })} compared: ${pathForms(path.join(repo, "tracked.txt"))}`);
const standardPath = path.join(bin, "..", "prompts", "review-standard.md");
const standardText = fs.readFileSync(standardPath, "utf8").trim();
const argvStr = observed[3] ?? "";
const immutableSentence = `Your cwd is an immutable checkout of revision ${revision} at ${observed[1]}; read files there, not in other worktrees`;
const idxImmutable = argvStr.indexOf(immutableSentence);
const idxStandard = standardText ? argvStr.indexOf(standardText) : -1;
const standardOccurrences = standardText ? argvStr.split(standardText).length - 1 : 0;
// req: R-1105
check("pi-review appends the review standard text once after the immutable sentence",
  launched && standardOccurrences === 1 && idxImmutable >= 0 && idxStandard > idxImmutable && !argvStr.includes("review-standard.md"),
  `${JSON.stringify({ standardOccurrences, idxImmutable, idxStandard })} compared: ${pathForms(path.join(repo, "tracked.txt"))}`);
// req: R-970
check("pi-review records its provider, model, actual attempts and duration",
  row?.provider === "openai-codex" && row?.model === "gpt-5.6-sol" && row?.attempts === 1 && Number.isFinite(row?.durationMs) &&
  Date.parse(row?.startedAt) <= Date.parse(row?.endedAt), JSON.stringify(row));
// req: R-967
check("source commit during review does not void the admitted round", result === 0 && row?.revision === revision && git(repo, "rev-parse", "HEAD") !== initialHead,
  `compared: ${pathForms(path.join(repo, "tracked.txt"))}`);
// req: R-967
check("temporary worktree registration is removed after success", !includesWorktree(worktreesAfterSuccess, checkoutCanon) && !fs.existsSync(checkout), worktreesAfterSuccess);

// Both a child failure and a deliberately non-reproducible source object refuse to leave a worktree.
const failOut = path.join(root, "failed.md");
const fail = spawnSync(process.execPath, [piReview, "--item", "failure", "--out", failOut, "--poll", "0.1", "--stall-secs", "0.2", "--retries", "0", "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "fail-observe"), MODE: "fail" }), encoding: "utf8", timeout: 30000,
});
const afterFailure = git(repo, "worktree", "list", "--porcelain");
// req: R-967
check("temporary worktree registration is removed after child failure", fail.status === 1 && !afterFailure.includes("nana-review-"), fail.stderr);
const stall = spawnSync(process.execPath, [piReview, "--item", "stall", "--out", path.join(root, "stall.md"), "--poll", "0.1", "--stall-secs", "0.2", "--retries", "0", "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "stall-observe"), MODE: "stall" }), encoding: "utf8", timeout: 30000,
});
const afterStall = git(repo, "worktree", "list", "--porcelain");
// req: R-967
check("temporary worktree registration is removed after watchdog stall", stall.status === 1 && !afterStall.includes("nana-review-") && /STALL/.test(stall.stderr), stall.stderr);
// Windows delivers no SIGTERM to a child process; TerminateProcess runs no handler there, so
// pi-review's cleanup never fires and the spawned fake is left orphaned (KB4). Declared skip,
// not spawned, on win32.
if (process.platform !== "win32") {
  const signalObserve = path.join(root, "signal-observe");
  const signaled = spawn(process.execPath, [piReview, "--item", "signal", "--out", path.join(root, "signal.md"), "--poll", "0.1", "--stall-secs", "3", "--retries", "0", "--", "-p", "review"], {
    cwd: repo, env: env({ OBSERVE: signalObserve, OBSERVE_PID: path.join(root, "signal-pid"), WAIT_FOR: path.join(root, "never-release") }),
  });
  const signalClosed = new Promise((resolve) => signaled.on("close", (code) => resolve(code)));
  for (let i = 0; i < 200 && !fs.existsSync(signalObserve); i++) await delay(25);
  const signalCheckout = fs.existsSync(signalObserve) ? fs.readFileSync(signalObserve, "utf8").split("\n")[0] : "";
  signaled.kill("SIGTERM");
  const signalCode = await signalClosed;
  const afterSignal = git(repo, "worktree", "list", "--porcelain");
  // req: R-967
  check("temporary worktree registration is removed after signal interruption", signalCode === 143 && !afterSignal.includes("nana-review-") && !fs.existsSync(signalCheckout), afterSignal);
} else {
  console.log("SKIP temporary worktree registration is removed after signal interruption — Windows delivers no SIGTERM to a child; TerminateProcess runs no handler");
}

const killedObserve = path.join(root, "killed-observe");
const killedPidFile = path.join(root, "killed-pid");
const killedReview = spawn(process.execPath, [piReview, "--item", "killed", "--out", path.join(root, "killed.md"), "--retries", "0", "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: killedObserve, OBSERVE_PID: killedPidFile, WAIT_FOR: path.join(root, "never-release") }),
});
const killedClosed = new Promise((resolve) => killedReview.on("close", (code, signal) => resolve({ code, signal })));
for (let i = 0; i < 200 && !fs.existsSync(killedObserve); i++) await delay(25);
const killedCheckout = fs.existsSync(killedObserve) ? fs.readFileSync(killedObserve, "utf8").split("\n")[0] : "";
// Canonicalized now, while the checkout still exists — the SIGKILL below never lets pi-review
// clean it up itself, but the recovery run's own reclaim (the thing this check pins) may remove
// it before a canonicalize-at-use would get the chance to resolve it.
const killedCheckoutCanon = killedCheckout ? canonPath(killedCheckout) : "";
if (fs.existsSync(killedPidFile)) {
  try { process.kill(Number(fs.readFileSync(killedPidFile, "utf8").trim()), "SIGKILL"); } catch {}
}
killedReview.kill("SIGKILL");
await killedClosed;
const staleBeforeRecovery = git(repo, "worktree", "list", "--porcelain");
const recovery = spawnSync(process.execPath, [piReview, "--item", "recovery", "--out", path.join(root, "recovery.md"), "--retries", "0", "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "recovery-observe") }), encoding: "utf8", timeout: 30000,
});
const afterRecovery = git(repo, "worktree", "list", "--porcelain");
// req: R-967
check("next launch reclaims a SIGKILLed dead-owner checkout but leaves live-owner worktrees alone", recovery.status === 0 &&
  includesWorktree(staleBeforeRecovery, killedCheckoutCanon) && !fs.existsSync(killedCheckout) && !includesWorktree(afterRecovery, killedCheckoutCanon),
  `${JSON.stringify({ status: recovery.status, stderr: recovery.stderr, killedCheckout, staleBeforeRecovery, afterRecovery })} compared: ${pathForms(killedCheckout)}`);
// Until W7c's product fix, reclaim leaves this SIGKILLed checkout registered on Windows (the
// short-vs-long mismatch that check 11 above already pins). Clear it here so the later refusal
// checks (unreproducible snapshot, nested repository) observe their own worktree list, not a
// leftover "nana-review-" entry caused only by check 11's known failure. No-op on POSIX, where
// check 11 already reclaims it.
if (fs.existsSync(killedCheckout)) {
  git(repo, "worktree", "remove", "--force", killedCheckout);
  git(repo, "worktree", "prune");
}

const liveCheckout = path.join(os.tmpdir(), `nana-review-${process.pid}-live`);
git(repo, "worktree", "add", "--detach", liveCheckout, "HEAD");
const liveOwnerRun = spawnSync(process.execPath, [piReview, "--item", "live-owner", "--out", path.join(root, "live-owner.md"), "--retries", "0", "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "live-owner-observe") }), encoding: "utf8", timeout: 30000,
});
const liveOwnerListed = git(repo, "worktree", "list", "--porcelain");
// req: R-967
check("startup reclamation never removes a live pid checkout", liveOwnerRun.status === 0 && fs.existsSync(liveCheckout) && includesWorktree(liveOwnerListed, liveCheckout), liveOwnerRun.stderr);
git(repo, "worktree", "remove", "--force", liveCheckout);
git(repo, "worktree", "prune");

// A failed git removal must fall back, prune, and verify that the stale registration is gone.
// The shim is an extensionless "#!/bin/sh" file named `git`: Node's win32 PATH search for a name
// with no extension tries only .com/.exe (R-1033), so it can never shadow git.exe there, and no
// .cmd/.bat file could stand in either (that lookup tries no other extension). Declared skip.
if (process.platform !== "win32") {
  const gitShimDir = path.join(root, "git-shim");
  fs.mkdirSync(gitShimDir);
  const realGit = spawnSync("which", ["git"], { encoding: "utf8" }).stdout.trim();
  fs.writeFileSync(path.join(gitShimDir, "git"), `#!/bin/sh\nif [ "$1" = worktree ] && [ "$2" = remove ]; then exit 1; fi\nexec '${realGit}' "$@"\n`);
  fs.chmodSync(path.join(gitShimDir, "git"), 0o755);
  const cleanupFailure = spawnSync(process.execPath, [piReview, "--item", "cleanup-fallback", "--out", path.join(root, "cleanup-fallback.md"), "--retries", "0", "--", "-p", "review"], {
    cwd: repo, env: env({ PATH: `${gitShimDir}${path.delimiter}${fakeBin}${path.delimiter}${process.env.PATH}`, OBSERVE: path.join(root, "cleanup-fallback-observe") }), encoding: "utf8", timeout: 30000,
  });
  const afterCleanupFailure = git(repo, "worktree", "list", "--porcelain");
  // req: R-967
  check("failed worktree removal falls back, prunes and verifies registration cleanup", cleanupFailure.status === 0 &&
    !afterCleanupFailure.includes("nana-review-") && !cleanupFailure.stderr.includes("cleanup failed"), JSON.stringify({ status: cleanupFailure.status, stderr: cleanupFailure.stderr, afterCleanupFailure }));
} else {
  console.log("SKIP failed worktree removal falls back, prunes and verifies registration cleanup — Node's Windows PATH search tries only .com/.exe, so an extensionless git shim cannot run");
}

// Force a source change during the detach checkout; equality must fail before admission.
const mismatchItem = "mismatch-refusal";
const mismatchAdmissionProbe = path.join(root, "mismatch-admission-probe");
const mismatchHook = path.join(repo, git(repo, "rev-parse", "--git-path", "hooks"), "post-checkout");
fs.writeFileSync(mismatchHook, `#!/bin/sh\nreservations='${path.join(home, ".pi", "agent", "review-ledger.reservations")}'\nif [ -d "$reservations" ] && [ "$(find "$reservations" -type f | wc -l | tr -d ' ')" -gt 0 ]; then touch '${mismatchAdmissionProbe}'; fi\nprintf 'changed by checkout hook\\n' > '${path.join(repo, "tracked.txt")}'\n`);
fs.chmodSync(mismatchHook, 0o755);
const mismatch = spawnSync(process.execPath, [piReview, "--item", mismatchItem, "--out", path.join(root, "mismatch.md"), "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "mismatch-observe") }), encoding: "utf8", timeout: 30000,
});
fs.rmSync(mismatchHook, { force: true });
const afterMismatch = git(repo, "worktree", "list", "--porcelain");
// req: R-967
check("unreproducible dirty snapshot is refused before admission with no round or worktree", mismatch.status === 1 && /snapshot could not be reproduced exactly/.test(mismatch.stderr) &&
  reviewRound.readRounds(home, { item: mismatchItem }).length === 0 && !fs.existsSync(mismatchAdmissionProbe) &&
  !fs.existsSync(path.join(root, "mismatch-observe")) && !afterMismatch.includes("nana-review-"), mismatch.stderr);

const cleanSubmodule = path.join(repo, "clean-submodule");
fs.mkdirSync(cleanSubmodule);
git(cleanSubmodule, "init", "-q");
fs.writeFileSync(path.join(cleanSubmodule, "sub.txt"), "clean initialized contents\n");
git(cleanSubmodule, "add", "sub.txt");
git(cleanSubmodule, "commit", "-qm", "clean submodule");
const cleanSubHead = git(cleanSubmodule, "rev-parse", "HEAD");
git(repo, "update-index", "--add", "--cacheinfo", `160000,${cleanSubHead},clean-submodule`);
const cleanSubItem = "clean-submodule-refusal";
const cleanSubRefusal = spawnSync(process.execPath, [piReview, "--item", cleanSubItem, "--out", path.join(root, "clean-submodule.md"), "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "clean-submodule-observe") }), encoding: "utf8", timeout: 30000,
});
// req: R-968
check("clean initialized submodule is refused before admission and consumes no round", cleanSubRefusal.status === 1 && /initialized submodule cannot be materialized: clean-submodule/.test(cleanSubRefusal.stderr) &&
  reviewRound.readRounds(home, { item: cleanSubItem }).length === 0 && !fs.existsSync(path.join(root, "clean-submodule-observe")), cleanSubRefusal.stderr);
git(repo, "update-index", "--force-remove", "clean-submodule");
fs.rmSync(cleanSubmodule, { recursive: true, force: true });

const submodule = path.join(repo, "dirty-submodule");
fs.mkdirSync(submodule);
git(submodule, "init", "-q");
fs.writeFileSync(path.join(submodule, "sub.txt"), "clean\n");
git(submodule, "add", "sub.txt");
git(submodule, "commit", "-qm", "submodule base");
const subHead = git(submodule, "rev-parse", "HEAD");
git(repo, "update-index", "--add", "--cacheinfo", `160000,${subHead},dirty-submodule`);
fs.writeFileSync(path.join(submodule, "sub.txt"), "dirty\n");
const subItem = "dirty-submodule-refusal";
const subRefusal = spawnSync(process.execPath, [piReview, "--item", subItem, "--out", path.join(root, "submodule.md"), "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "submodule-observe") }), encoding: "utf8", timeout: 30000,
});
// req: R-968
check("dirty submodule is refused before admission and consumes no round", subRefusal.status === 1 && /initialized submodule cannot be materialized/.test(subRefusal.stderr) &&
  reviewRound.readRounds(home, { item: subItem }).length === 0 && !fs.existsSync(path.join(root, "submodule-observe")), subRefusal.stderr);
git(repo, "update-index", "--force-remove", "dirty-submodule");
fs.rmSync(submodule, { recursive: true, force: true });

const nested = path.join(repo, "nested");
fs.mkdirSync(nested);
git(nested, "init", "-q");
fs.writeFileSync(path.join(nested, "inner.txt"), "nested");
const beforeRounds = reviewRound.readRounds(home, { item: "nested-refusal" }).length;
const refusal = spawnSync(process.execPath, [piReview, "--item", "nested-refusal", "--out", path.join(root, "nested.md"), "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "nested-observe") }), encoding: "utf8", timeout: 30000,
});
const afterRefusal = git(repo, "worktree", "list", "--porcelain");
// req: R-968
check("nested repository is refused before admission and consumes no round", refusal.status === 1 && /nested repository/.test(refusal.stderr) &&
  reviewRound.readRounds(home, { item: "nested-refusal" }).length === beforeRounds && !fs.existsSync(path.join(root, "nested-observe")) &&
  !afterRefusal.includes("nana-review-"), refusal.stderr);

fs.rmSync(root, { recursive: true, force: true });
process.exit(failures);
