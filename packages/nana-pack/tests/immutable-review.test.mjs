/**
 * @module packages/nana-pack/tests/immutable-review.test.mjs
 * @purpose Pin immutable pi-review checkouts, admission, child identity and cleanup.
 * @inputs pi-review.mjs, review-round.mjs, shared ledger fixtures and a fake pi executable.
 * @outputs PASS/FAIL checks and a failing process status when a check is false.
 * @effects disk (temporary repositories, worktrees and copies of appended prompt files), process (fake review launch).
 * @errors failed assertions exit nonzero; unexpected process errors fail the test.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import { awaitLaunchRecord } from "./launch-wait.mjs";
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
const STALL_FAKE_LIFETIME_MS = 180_000; // chosen: 180 seconds lets a loaded Windows runner reach the watchdog stall decision.
const STALL_CHECK_GUARD_MS = 120_000; // chosen: 120 seconds bounds the stall check below the fake's own lifetime.
const TEMP_REMOVE_MAX_RETRIES = 5; // chosen: gives transient Windows folder handles several chances to close.
const TEMP_REMOVE_RETRY_DELAY_MS = 100; // chosen: bounds cleanup retries to half a second before reporting the failure.
// The observed argv may itself carry embedded newlines once an appended system prompt is
// multi-line text (R-1105). One Node body writes all four fields atomically on every platform.
const fakeBody = `const fs = require("node:fs");
if (process.env.OBSERVE_PID) fs.writeFileSync(process.env.OBSERVE_PID, String(process.pid) + "\\n");
const recordPart = process.env.OBSERVE + ".part";
fs.writeFileSync(recordPart, process.cwd() + "\\n" + process.env.NANA_REVIEW_ROOT + "\\n" + process.env.NANA_ROLE + "\\n" + process.argv.slice(2).join(" "));
const argv = process.argv.slice(2);
const prompts = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== "--append-system-prompt") continue;
  const value = argv[++i];
  const isFile = fs.existsSync(value);
  const copy = process.env.OBSERVE + ".prompt-" + prompts.length;
  if (isFile) fs.copyFileSync(value, copy);
  prompts.push({ value, copy: isFile ? copy : null });
}
fs.writeFileSync(process.env.OBSERVE + ".json", JSON.stringify({ argv, prompts }));
fs.renameSync(recordPart, process.env.OBSERVE);
const waitFor = process.env.WAIT_FOR;
function finish() {
  if (process.env.MODE === "fail") process.exit(1);
  if (process.env.MODE === "stall") { setTimeout(() => {}, ${STALL_FAKE_LIFETIME_MS}); return; }
  console.log("VERDICT: LAND");
}
function poll() {
  if (waitFor && !fs.existsSync(waitFor)) { setTimeout(poll, 50); return; }
  finish();
}
poll();
`;
if (process.platform === "win32") {
  writeFakePi(fakeBin, fakeBody);
} else {
  const fakeBodyFile = path.join(fakeBin, "pi-body.cjs");
  fs.writeFileSync(fakeBodyFile, fakeBody);
  const fakePi = path.join(fakeBin, "pi");
  fs.writeFileSync(fakePi, `#!/bin/sh\nexec '${process.execPath}' '${fakeBodyFile}' "$@"\n`);
  fs.chmodSync(fakePi, 0o755);
}
const home = path.join(root, "home");
const env = (extra = {}) => ({ ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: path.join(home, '.pi/agent'), PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`, ...extra });
// canonPath/includesWorktree compare git's canonical worktree paths with paths this test built
// from the OS temp root. win32 uses the native real path so short and long forms agree, then
// falls back to a resolved case-folded path after cleanup. POSIX follows the same shape.
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
// Printed in failure details to expose both path forms if a future platform normalization
// regression makes a review checkout or output path compare unequal.
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

// NTFS refuses a control character (a bare newline included) in a file name; win32 substitutes
// U+2028 (LINE SEPARATOR), which is legal there and still outside the plain-ASCII names every
// other fixture here uses. The exact-newline claim stays POSIX-only.
const hostileName = process.platform === "win32" ? "name\u2028with-newline.txt" : "name\nwith-newline.txt";
fs.writeFileSync(path.join(repo, hostileName), "newline filename\n");
fs.symlinkSync("tracked.txt", path.join(repo, "link.txt"));
git(repo, "add", "-A");
git(repo, "commit", "-qm", "committed review state");
const initialHead = git(repo, "rev-parse", "HEAD");
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
  fs.readFileSync(path.join(repo, "tracked.txt"), "utf8") === "base\n" && !fs.existsSync(path.join(root, "tracked-out-observe")) &&
  !trackedOutTrees.split(/\r?\n/).some((line) => line.startsWith("worktree ") && line.includes("nana-review-")) &&
  reviewRound.readRounds(home, { item: "tracked-out" }).length === 0, JSON.stringify({ status: trackedOut.status, stderr: trackedOut.stderr, output: fs.readFileSync(path.join(repo, "tracked.txt"), "utf8"), observe: fs.existsSync(path.join(root, "tracked-out-observe")), trackedOutTrees, compared: pathForms(path.join(repo, "tracked.txt")) }));
const args = [piReview, "--item", "immutable", "--role", "sol", "--revision", "main", "--out", out, "--poll", "0.1", "--stall-secs", "3", "--retries", "0", "--", "-p", "review", "--provider", "openai-codex", "-m", "gpt-5.6-sol"];
const observePid = path.join(root, "observe-pid");
const child = spawn(process.execPath, args, { cwd: repo, env: env({ OBSERVE: observe, OBSERVE_PID: observePid, WAIT_FOR: release }) });
const childClosed = new Promise((resolve) => child.on("close", (code) => resolve(code)));
const launchRecord = await awaitLaunchRecord(observe, { closed: childClosed });
const launched = launchRecord !== null;
// Header is exactly three lines (cwd, NANA_REVIEW_ROOT, NANA_ROLE); the remainder is the raw
// argv tail, rejoined verbatim even when it carries its own embedded newlines (R-1105).
const observedParts = launched ? launchRecord.split("\n") : [];
let observed = launched ? [observedParts[0], observedParts[1], observedParts[2], observedParts.slice(3).join("\n")] : [];
const checkout = observed[0];
// Canonicalized NOW, while the checkout still exists: by the time check 7 (below) looks at it,
// pi-review has already removed the worktree on success, and a canonicalize-at-use would throw
// or (on win32) silently fall back for a path that is simply gone, not mismatched.
const checkoutCanon = checkout ? canonPath(checkout) : "";
const snapshotCorrect = launched && fs.existsSync(observePid) && /^\d+\n?$/.test(fs.readFileSync(observePid, "utf8")) && fs.realpathSync(checkout) === fs.realpathSync(observed[1]) && observed[2] === "reviewer" &&
  observed[3].includes(`Your cwd is an immutable checkout of revision ${revision} at ${observed[1]}; read files there, not in other worktrees`) &&
  fs.readFileSync(path.join(checkout, "tracked.txt"), "utf8").replaceAll("\r\n", "\n") === "base\n" &&
  fs.readFileSync(path.join(checkout, hostileName), "utf8").replaceAll("\r\n", "\n") === "newline filename\n" &&
  (git(repo, "config", "--type=bool", "--get", "--default", "true", "core.symlinks") === "true"
    ? fs.readlinkSync(path.join(checkout, "link.txt"))
    : fs.readFileSync(path.join(checkout, "link.txt"), "utf8")) === "tracked.txt" &&
  !fs.existsSync(path.join(checkout, "ignored.txt"));
// A commit to the source after admission must not change completion's checkout revision.
if (launched) {
  fs.writeFileSync(path.join(repo, "tracked.txt"), "source changed during review\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "source changed during review");
}
fs.writeFileSync(release, "go");
const result = await childClosed;
const row = reviewRound.readRounds(home, { item: "immutable" })[0];
const worktreesAfterSuccess = git(repo, "worktree", "list", "--porcelain");
// req: R-967
// req: R-974
check("reviewer runs in the immutable checkout at the committed revision", result === 0 && snapshotCorrect && row?.revision === revision, `${JSON.stringify({ result, observed, row, revision })} compared: ${pathForms(path.join(repo, "tracked.txt"))}`);
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
// req: R-1008
check("pi-review records its provider, model, actual attempts and duration",
  row?.provider === "openai-codex" && row?.model === "gpt-5.6-sol" && row?.attempts === 1 && Number.isFinite(row?.durationMs) &&
  Date.parse(row?.startedAt) <= Date.parse(row?.endedAt), JSON.stringify(row));
// req: R-967
check("source commit during review does not void the admitted round", result === 0 && row?.revision === revision && git(repo, "rev-parse", "HEAD") !== initialHead,
  `compared: ${pathForms(path.join(repo, "tracked.txt"))}`);
// req: R-967
check("temporary worktree registration is removed after success", !includesWorktree(worktreesAfterSuccess, checkoutCanon) && !fs.existsSync(checkout), worktreesAfterSuccess);

// A child failure must not leave a worktree.
const failOut = path.join(root, "failed.md");
const fail = spawnSync(process.execPath, [piReview, "--item", "failure", "--out", failOut, "--poll", "0.1", "--stall-secs", "0.2", "--retries", "0", "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "fail-observe"), MODE: "fail" }), encoding: "utf8", timeout: 30000,
});
const afterFailure = git(repo, "worktree", "list", "--porcelain");
// req: R-967
check("temporary worktree registration is removed after child failure", fail.status === 1 && !afterFailure.includes("nana-review-"), fail.stderr);
const stall = spawnSync(process.execPath, [piReview, "--item", "stall", "--out", path.join(root, "stall.md"), "--poll", "0.1", "--stall-secs", "0.2", "--retries", "0", "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "stall-observe"), MODE: "stall" }), encoding: "utf8", timeout: STALL_CHECK_GUARD_MS,
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
  const signalRecord = await awaitLaunchRecord(signalObserve, { closed: signalClosed });
  const signalCheckout = signalRecord?.split("\n")[0] ?? "";
  if (signaled.exitCode === null && signaled.signalCode === null) signaled.kill("SIGTERM");
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
const killedRecord = await awaitLaunchRecord(killedObserve, { closed: killedClosed });
const killedCheckout = killedRecord?.split("\n")[0] ?? "";
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
// If reclaim fails, clear the checkout defensively so later refusal checks observe only their
// own worktree state. This is a no-op after the pinned reclaim check succeeds.
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

const cleanSubmodule = path.join(repo, "clean-submodule");
fs.mkdirSync(cleanSubmodule);
git(cleanSubmodule, "init", "-q");
fs.writeFileSync(path.join(cleanSubmodule, "sub.txt"), "clean initialized contents\n");
git(cleanSubmodule, "add", "sub.txt");
git(cleanSubmodule, "commit", "-qm", "clean submodule");
const cleanSubHead = git(cleanSubmodule, "rev-parse", "HEAD");
git(repo, "update-index", "--add", "--cacheinfo", `160000,${cleanSubHead},clean-submodule`);
git(repo, "commit", "-qm", "record submodule");
const cleanSubItem = "clean-submodule-refusal";
const cleanSubRefusal = spawnSync(process.execPath, [piReview, "--item", cleanSubItem, "--out", path.join(root, "clean-submodule.md"), "--", "-p", "review"], {
  cwd: repo, env: env({ OBSERVE: path.join(root, "clean-submodule-observe") }), encoding: "utf8", timeout: 30000,
});
// req: R-968
check("clean initialized submodule is refused before admission and consumes no round", cleanSubRefusal.status === 1 && /initialized submodule cannot be materialized: clean-submodule/.test(cleanSubRefusal.stderr) &&
  reviewRound.readRounds(home, { item: cleanSubItem }).length === 0 && !fs.existsSync(path.join(root, "clean-submodule-observe")), cleanSubRefusal.stderr);
git(repo, "update-index", "--force-remove", "clean-submodule");
fs.rmSync(cleanSubmodule, { recursive: true, force: true });
git(repo, "commit", "-qm", "remove submodule");

try {
  fs.rmSync(root, { recursive: true, force: true, maxRetries: TEMP_REMOVE_MAX_RETRIES, retryDelay: TEMP_REMOVE_RETRY_DELAY_MS });
} catch (e) {
  check("the test's temporary folder is removed at the end", false, `${e.code} ${e.path ?? root}`);
}
process.exit(failures);
