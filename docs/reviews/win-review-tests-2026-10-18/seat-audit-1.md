# Seat audit of build 1 — win-review-tests at 153e3d4 (2026-10-18)

Three read-only file checkers and one critic, run by the seat after build 1. The critic's MUST list is the one that counts.

## text

VERDICT: DONE

Commit 153e3d4, pushed to origin feat/win-review-tests: new packages/nana-pack/tests/fake-pi.mjs (win32 npm-shape pi helper); edited immutable-review.test.mjs, review-ledger.test.mjs, worker-lane.test.mjs; docs/code-map.md regenerated.

macOS before→after (npm test -- <file>, exit 0 each): immutable-review 17→17 pass; review-ledger 155→155 pass; worker-lane 52→52 pass. map:check: 284 modules, 0 problems, exit 0. requirements-trace: 926 traced, 0 EARS violations, exit 0.

Checks edited (win32 branch added, POSIX branch byte-identical): immutable-review's SIGTERM check and git-shim-fallback check now SKIP on win32 (TerminateProcess runs no handler; extensionless shim unreachable); its worktree-registration/reclaim/live-checkout checks now canonicalize via native real path instead of raw-string `.includes`. review-ledger's read-only-dir and chmod+x checks now SKIP on win32 (NTFS has no write/exec bit); section 7 prints its missing SKIP on win32; the SIGKILL in the crash-recovery check uses `taskkill /T /F` on win32; the item-length probe uses 20000 (was 50000, still over SLUG_MAX, now under Windows' 32,767-char command-line cap). worker-lane's changed-branch check now SKIPs on win32 (Node's PATH lookup never finds an extensionless git wrapper); its path comparisons use native real path on win32, mirroring pi-worker's own fsReal.

One claim most likely wrong: that piLaunch accepts the hand-written npm-shape fake (pi.cmd beside node_modules/@earendil-works/pi-coding-agent/{package.json,cli.js}) without a real `npm pack`/`install` — verified against piLaunch's actual code with an injected win32 filesystem (it resolves correctly), but never run on a real Windows disk; the brief's npm-pack fallback exists for exactly this case.

## text

MUST: 0

Prediction (INFERRED, not run on Windows): `PASS  packages/nana-pack/tests/worker-lane.test.mjs  51 pass, 1 skip  ~45-90s, exit 0`.
- The one skip is the "production lane revalidation refuses changed branch before pi spawn" check.
- I expect no check outside the plan to fail. This file has no allowed-to-fail list; the brief's target is 51 pass, 1 skip.
- Low-risk ways to miss that line, all already present before this lane:
  - The two-launcher check reads `lane-spawns` with no guard. If one launcher's validation lags more than 3 s, the count could differ. If no launcher spawns pi, the file crashes.
  - Each `run()` has a 15 s timeout. On Windows the watchdog's PowerShell `cpuSeconds` poll adds about 0.5-2 s per poll, so a very slow runner could time a run out.

How I checked each bar:
- **Fake pi is found first, so the real pi cannot start.**
  - In a simulation, `piLaunch` with platform win32 resolves the `writeFakePi` layout to `node <stub>\node_modules\@earendil-works\pi-coding-agent\cli.js` with the args unchanged. The simulation used injected exists, isFile and readText, and a decoy npm pi.cmd second on PATH. It worked with PATHEXT set and with the default.
  - The stub folder is first on PATH, joined with `path.delimiter`. `findOnPath` splits on `;` and tries pi.com, pi.exe, pi.bat, then pi.cmd; only pi.cmd exists there.
  - `{...process.env, PATH}` can hold both `Path` and `PATH`. Node's win32 spawn sorts the env keys and keeps the first, and `PATH` sorts before `Path`. So the child pi-worker sees the new PATH, and `piLaunch` reads that single key from pi-worker's own `process.env`.
  - Every `run()` and `launchTogether` call carries the stub folder. The usage-text spawn (worker-lane.test.mjs:72) carries no PATH, but it exits before starting pi. The only `more.PATH` override (:378) is POSIX-only.
  - `cli.js` sits under a package.json with no "type", so the `require` bodies run as CommonJS.
- **macOS unchanged.**
  - The four POSIX stubs are byte-identical to the old ones. I evaluated the old and new template strings with the same inputs and all four matched.
  - The git wrapper block is unchanged inside its POSIX guard, and `real` is `fs.realpathSync` on POSIX.
  - `npm test -- packages/nana-pack/tests/worker-lane.test.mjs` on this Mac: 52 pass, 0 fail, 0 skip.
- **The skip** (worker-lane.test.mjs:384) prints its reason, and the check cannot run on Windows. `pi-worker` calls `execFileSync('git')`, and libuv's Windows PATH search tries only the bare name plus .com and .exe. An extensionless or .cmd wrapper can never stand in for git, which the must-meet lists as a known limit.
- **Long temp root.** Using the native long form in this file is what the brief asks for. `pi-worker`'s `fsReal` already uses the native form, so the brief path (:113), lock path (:400, :404) and trust key (:390) all match the product's form. No allowed-to-fail check exists in this file for the change to hide.
- **Writes stay in temp.** Every stub body writes only to paths under the test's temp folder (passed in with `JSON.stringify`), and nothing writes to the worktree.
- **No product file changed.** Only the three tests, `fake-pi.mjs` and `docs/code-map.md` changed. The code-map diff adds only the `fake-pi.mjs` entry, its callers, the callee lines and the module count 283 to 284.
- **Helper** (`packages/nana-pack/tests/fake-pi.mjs`): the six-tag header is present, it has named exports only, and it imports `PI_PACKAGE` and `PI_BIN_NAME` from `worker-config.mjs`.

SHOULD / NOTE:
- **NOTE worker-lane.test.mjs:16-17.** The comment says the native real path "keeps an 8.3 or differently cased form the way git itself sees it". That is backwards: the native form expands to the long name in its on-disk case. That is why it matches `fsReal`. The wording could mislead the gate lane's work on the short-path bug.
- **NOTE worker-lane.test.mjs:370-372.** The comment credits R-1033 and `win-command.mjs` for "Node's PATH search tries only .com/.exe". The lookup that matters is libuv's inside `execFileSync`. nana's own `findOnPath` also accepts .bat and .cmd. The claim is true; the citation is wrong.
- **NOTE worker-lane.test.mjs:390.** The trust record is now keyed by the long path. A record written under a short 8.3 path is no longer seen failing on Windows; the product reads trust keys through `trustRecord`'s non-native realpath. This is the brief's choice. If that short-key case matters, it is the gate lane's residual to record.
- **NOTE worker-lane.test.mjs:64.** `run()` sets HOME but not USERPROFILE, so on Windows `os.homedir()` in pi-worker is the runner's scratch home, or the real profile when the file is run directly. No write reaches it today, because the agent folder is explicit and the stubs write only to temp. This predates the lane.
- **NOTE worker-lane.test.mjs:111.** `prompt-1` is now read before the plain worker run instead of after. That is equivalent today, because the plain run passes no `--append-system-prompt`.
- **NOTE, outside this target.** The `review-ledger` item probe changed from 50000 to 20000 characters on every platform, macOS included, as the brief asked. It is still far over the 128-character cap, so the refusal and no-stack checks pin the same thing.

Files: `<worktree>/packages/nana-pack/tests/worker-lane.test.mjs`, `<worktree>/packages/nana-pack/tests/fake-pi.mjs`, `<worktree>/packages/nana-pack/bin/pi-watchdog.mjs`, `<worktree>/packages/nana-pack/lib/win-command.mjs`.

## text

MUST: 2

1. packages/nana-pack/tests/immutable-review.test.mjs:31. The win32 fake crashes on its first line whenever OBSERVE_PID is unset, which is most runs. The POSIX stub does not.
   - Evidence: I evaluated the exact template body and ran it under node. With OBSERVE_PID unset it exits with status 1 and prints `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument ... Received undefined`. It writes no OBSERVE file and prints no VERDICT, in the default mode and in MODE=stall alike.
   - The sh stub's `printf ... > "$OBSERVE_PID"` fails, but sh keeps going (checked: `sh: : No such file or directory`, then the script continues). That is why these runs pass on macOS.
   - Runs with OBSERVE but no OBSERVE_PID: :127 trackedOut, :138 existingOut, :206 fail, :212 stall, :256 recovery, :267 liveOwner.
   - On Windows this fails two checks outside the allowed list:
     - check 9, "removed after watchdog stall" (:216): the fake exits 1 in about 0.2 s, before 2 flat polls, so no STALL line.
     - check 12, "live pid checkout" (:271): liveOwnerRun.status is 1.
   - Checks 2 and 11 gain a second, non-short-path failure cause (status 1).
   - Fix: `if (process.env.OBSERVE_PID) fs.writeFileSync(...)`. review-ledger's port already guards INVOKED the same way.

2. packages/nana-pack/tests/immutable-review.test.mjs:308 and :359 (checks 14 and 17). Both fail on Windows outside the brief's allowed list (1, 2, 3, 4, 6, 11), and neither prints the short and long paths. WR1 cannot be met as planned. This is a gap in the plan's list, not only in the build. (INFERRED, high confidence.)
   - Cause: check 11's product bug. reclaimDeadReviewWorktrees (pi-review.mjs:91) skips every checkout on Windows, because `relative(realpathSync(tmpdir()) /*RUNNER~1*/, realpathSync(gitPath) /*runneradmin*/)` starts with `..\`.
   - The SIGKILLed checkout `nana-review-<pid>-*` therefore stays registered, and its folder still exists. The `git worktree prune` at :273 keeps it.
   - The mismatch check (`!afterMismatch.includes("nana-review-")`) and the nested check (`!afterRefusal.includes("nana-review-")`) then see it and fail.
   - The seat's triage expected 14 to 17 to pass "once L1-L4 are fixed". That includes the product fix W7c, which this lane leaves out on purpose.
   - Fix, either one:
     - After check 11, if the killed checkout still exists, remove it and its registration in the test (`worktree remove --force` plus prune). On POSIX this does nothing, and it does not hide check 11.
     - Or add 14 and 17 to the allowed list and print the path forms in their details.

Prediction for immutable-review on Windows (INFERRED):
- As built: `FAIL  packages/nana-pack/tests/immutable-review.test.mjs  5 pass, 10 fail, 2 skip  ~110-150s  — exit 10`
  - PASS: 5, 7, 8, 15, 16.
  - SKIP: 10 (SIGTERM) and 13 (git shim). Both print their reasons.
  - FAIL, allowed: 1, 2, 3, 4, 6, 11.
    - 1: the tracked --out is not refused. The fake's crash text overwrites repo/tracked.txt.
    - 3, 4, 6: the precomputed `revision` is now stale.
    - 2: no WARNING, and the run exits 1.
    - 11: the killed checkout is never reclaimed, and the run exits 1.
  - FAIL, not allowed: 9 and 12 (MUST 1), 14 and 17 (MUST 2).
- After the MUST 1 fix only: 7 pass, 8 fail, 2 skip.
- After both fixes: 9 pass, 6 fail (all on the allowed list), 2 skip.
- Each allowed FAIL prints `short=…RUNNER~1… long=…runneradmin…` through pathForms.

Bar checks that held:
- **piLaunch finds the fake before the real pi.** I simulated piLaunch with platform win32, PATH set to fakeBin then `C:\npm\prefix`, and the standard PATHEXT. It returned `node.exe <fakeBin>\node_modules\@earendil-works\pi-coding-agent\cli.js -p review`. The real pi does not start, so no "No API key found" line can appear.
  - The test's env holds both `Path` and `PATH`. Node's win32 duplicate filter keeps the first key in sorted order, which is `PATH` (the fake-first one). This is from memory of Node's code, not checked on Windows.
  - cli.js runs as CommonJS, because the nearest package.json declares no `"type"`.
- **The hard rule is kept.** `root` still uses JS realpathSync, so it stays in the short form. Native realpath is used only in canonPath for the porcelain comparisons in checks 7, 11 and 12, which the brief allows. Check 11 still fails on `fs.existsSync(killedCheckout)`, so the canonical comparison does not hide the bug.
- **macOS:**
  - I ran the file and got 17 pass, 0 skip, 69.4 s.
  - The POSIX sh stub is byte-identical to the old one.
  - No POSIX check got weaker. The canonical porcelain comparisons are equal or stricter. Check 11 no longer passes vacuously when killedCheckout is empty, since `"".includes` is always true.
- **Writes:** I found no write outside the OS temp folder or the worktree. HOME and USERPROFILE point at root/home, and every --out, OBSERVE and liveCheckout path sits in the root folder or os.tmpdir().
- **Product files:** none changed. The diff touches only the three tests, fake-pi.mjs and docs/code-map.md.

SHOULD/NOTE:
- SHOULD, :64-65. The comment says POSIX uses a path.resolve no-op, but :71-74 use fs.realpathSync. Fix the stale comment.
- NOTE, :276-278 and :293. The git-shim skip names a test mechanism that cannot run on Windows, not a case that cannot happen there. A failed `git worktree remove` can happen on Windows, for example when a process holds an open handle in the checkout. The plan declares this skip, so I accept it. Residual: the rmSync fallback in removeWorktree is not exercised on Windows.
- NOTE: check 12 will pass vacuously on Windows until W7c fixes reclaim. The product's own registration check at pi-review.mjs:118 also never fires there (already a triage residual).
- NOTE, timing risk: the 5 s observe waits at :150 and :243 cover about 20 git spawns plus a node start on Windows. A miss fails check 3. In the killed run, a miss orphans a fake that polls forever, holding the checkout as its working folder.
- NOTE: in review-ledger's port, `plain` mode appends to COUNT without a guard. All 3 plain runs set COUNT, so nothing fails today.

## text

MUST: 1

MUST 1. WR1 is not met: most of the allowed-to-fail checks will not print the short and long paths they compared. The builder added `pathForms(...)` only where a check had no detail argument, at review-ledger.test.mjs:380, :699 and :859. The other 19 checks keep details that show one spelling or none:
- No path at all:
  - :697 prints `[]`. On Windows the pi-review key is long, so the run is never over the cap and no override is written.
  - :970 prints nothing. `headOnly` is admitted, so `.message` is undefined and the default `""` is used.
  - :982 prints nothing. The check exits 0 and its stderr is empty, because `relUnder` returns null and no warning is written.
- One spelling only (the admission note's key or `rec.repo`): :169, :175, :387, :404, :513 (three times), :882, :902, :962, :967, :973, :991 (twice), :1004 and :1007.
- Result: on the Windows log the seat cannot tell from these lines that each FAIL is the short-path one.
- Fix: append one shared `pathForms(...)` suffix to each listed detail. At :962–:1007 that is `pathForms(O.d)` plus the out path. Elsewhere it is `pathForms(path.join(A.d,".git"))`, or H, K or U as each section needs.

Checked and clean against the bar:
- **macOS is unchanged.** `npm test -- review-ledger` gives 155 pass, exit 0, in 115.8 s. The POSIX `#!/bin/sh` stub string is byte-identical to the one at 80a14da (cmp). PATH on POSIX is still joined with `:`. Every changed POSIX statement keeps its order and its boolean, including the sleeper and ignorer modes.
- **No product file changed.** The diff touches only `tests/*` and `docs/code-map.md`.
- **The fake pi is found on Windows, before the real pi.**
  - `env()` puts `stubs` first with `path.delimiter`. CI runs `npm test` from Git Bash, so the key is `PATH`. If both `Path` and `PATH` were present, Node's Windows env dedupe would keep `PATH`.
  - `findOnPath` filters PATHEXT to .com/.exe/.bat/.cmd and finds `stubs\pi.cmd`.
  - `shimDir` is not `node_modules\.bin`, so the package dir is `stubs\node_modules\@earendil-works\pi-coding-agent`. Its `package.json` has `name === PI_PACKAGE` and `bin[PI_BIN_NAME] = "cli.js"`. The entry is contained and is a file.
  - piLaunch returns `{execPath, [cli.js, ...]}`, and `cli.js` loads as CommonJS.
  - pi-worker and pi-review start pi only through `runOnce`'s `piLaunch`. Every PI_REVIEW and PI_WORKER spawn uses `env()`.
  - So no "No API key found" line can appear.
- **The short-path bug stays visible.** `tmp` still comes from JS `fs.realpathSync`, which keeps RUNNER~1. `pathForms` appears only in detail strings, so no allowed check is made to pass.
- **No writes outside the OS temp folder or the worktree.** The fake's writes, INVOKED, COUNT, ledger homes, worktrees and the taskkill target are all under the OS temp folder.
- **Skips print their reasons.** All three platform guards print SKIP lines: section 7, the read-only ledger directory, and chmod +x. No silent guard remains.

PREDICTION (INFERRED) for the Windows line, if the file finishes inside the runner's 300 s per-file cap:
`FAIL packages/nana-pack/tests/review-ledger.test.mjs  130 pass, 22 fail, 3 skip — exit 1`
- That is 152 checks run plus 3 SKIP lines.
- The 22 FAILs are exactly the brief's list. At current lines: :169, :175, :380, :387, :404, :513 ×3, :697, :699, :859, :882, :902, :962, :967, :970, :973, :982, :991 ×2, :1004, :1007.
- Mechanism:
  - A ledger run from a main worktree keys the repo on `resolve(shortCwd, ".git")`, which is short.
  - pi-review's checkout and linked worktrees key on git's absolute common dir, which is long.
  - A tracked or in-tree `--out` is compared as short `realOut` against long `--show-toplevel`.
- No "No API key found" line.

Checks outside the allowed list that I expect to fail: none with confidence. Risks, in order:
1. **Whole-file timeout.** I counted spawns on this Mac run: 3,735 git, 430 node and 32 pi in 115 s. At typical Windows runner costs (about 30–60 ms per git call, 100–250 ms per node start, plus about 50–60 s of fixed polls and waits), that is roughly 205–390 s against the 300 s cap. `NANA_TEST_TIMEOUT_MS` is not set in ci.yml. I'd put the chance of "timed out after 300s" at about even, and that would also fail WR1's "run to their end".
2. **:151, the capture-dir check.** The stall run polls CPU through PowerShell with TEMP set to `captureRoot`. Any `__PSScriptPolicyTest_*` file PowerShell leaves there fails it.
3. **:1097, the final `fs.rmSync(tmp)`.** It is unguarded, so an EBUSY or EPERM there (read-only git objects, a lingering handle) is a crash after the last check.
4. **Section 16 checks not yet seen on Windows:** the `sed` clean filter at about :812 and `git submodule add` with a `C:\` path at about :823.

SHOULD:
- **:43, the win32 `plain` body.** It calls `fs.appendFileSync(process.env.COUNT, ...)`, which throws when COUNT is unset. The POSIX `echo run >> "$COUNT"` fails that line and still prints the reply. :754 runs `plain` with no COUNT, so on Windows :756 passes because the stub crashed, not because the plain reply was refused. Guard it with `if (process.env.COUNT)`.
- **:647, the read-only directory SKIP.** Its reason names a chmod limitation, not a case that cannot happen on Windows: an ACL-denied ledger folder does exist there. Either reword it to "untested on Windows (chmod cannot make an NTFS directory unwritable)" or pin the case with `icacls /deny`.

NOTE:
- **:567, the section 7 SKIP reason (wording prescribed by the brief).** It says "process group", but the check signals one pid. The real Windows difference is that `process.kill(pid, SIGINT/SIGTERM)` terminates the process without running its handler, and SIGHUP is unsupported.
- **:809.** "…chmod back → the clean sha" still runs on Windows and passes vacuously, because Windows never records an exec bit. Skip it together with :804.
- **Latent crashes the brief left unguarded.** `rec.v` at :169–:170 runs if pi-review records nothing. :748 reads `count` in both its condition and its detail. Neither fires while the fake is found.
- **:970 on Windows.** `headOnly` is admitted and never released, so a live reservation stays in `resDir`. :991's `readdirSync(resDir).length === 0` then fails as well. That check is already on the allowed list.
- **`x.repeat(20000)` now applies on every platform.** It is still over SLUG_MAX (128), so the macOS check pins the same thing.

Files: <worktree>/packages/nana-pack/tests/review-ledger.test.mjs, <worktree>/packages/nana-pack/tests/fake-pi.mjs, <worktree>/packages/nana-pack/bin/review-round.mjs (treeScope :153–163, outInTree :520), <worktree>/packages/nana-pack/bin/pi-watchdog.mjs (piLaunch :54), <worktree>/scripts/test.mjs (TIMEOUT_MS :70).

## text

MUST: 3

1. **The win32 fake crashes when OBSERVE_PID is unset (confirmed).** Location: `packages/nana-pack/tests/immutable-review.test.mjs:31`.
   - I pulled the exact win32 body out of the file and ran it with `OBSERVE` set, `OBSERVE_PID` unset and `MODE=stall`. It failed with `TypeError [ERR_INVALID_ARG_TYPE] ... Received undefined` and exit 1. It wrote no OBSERVE file and printed no VERDICT.
   - These runs set no OBSERVE_PID: :127, :138, :206, :212, :256, :267.
   - Check 9 (:216) fails outside the allowed list. The watchdog needs 3 polls with `maxFlat=ceil(0.2/0.1)=2` (pi-watchdog.mjs:186-208). Each Windows poll is a blocking PowerShell `execSync`, so the crashed child exits before a STALL line can print.
   - Check 12 (:271) also fails outside the list: `liveOwnerRun.status` is 1, because a crashed attempt is `ok:false` and `--retries 0` allows no second try.
   - Fix: `if (process.env.OBSERVE_PID) fs.writeFileSync(...)`.

2. **Checks 14 (:308) and 17 (:359) fail on Windows but are not on the allowed list. They print no path forms (confirmed in code; the mechanism is inferred on the same premise as the plan's own check-11 entry).**
   - `reclaimDeadReviewWorktrees` compares the short temp folder with git's long path: `relative(realpathSync(tmpdir()), realpathSync(path))` at pi-review.mjs:91. The result starts with `..\`, so the reclaim skips every checkout.
   - The SIGKILLed `nana-review-<pid>-*` checkout therefore keeps both its folder and its registration.
   - `git worktree prune` at :273 keeps it, because the folder still exists.
   - So `afterMismatch.includes("nana-review-")` and `afterRefusal.includes("nana-review-")` are both true.
   - Nothing else in the file removes that checkout. The final `rmSync(root)` does not reach os.tmpdir().
   - This is a gap in the plan's list (1, 2, 3, 4, 6, 11). WR1 cannot be met as written.
   - Preferred fix: right after check 11, if `killedCheckout` still exists, run `worktree remove --force` and then `prune` in the test. This keeps 14 and 17 meaningful. It does nothing on POSIX, and check 11 still fails.

3. **review-ledger does not meet WR1's "each FAIL prints the short and long paths it compared" (confirmed).**
   - `pathForms` appears only in the three checks that had no detail before: :380, :699 and :859.
   - These allowed-to-fail checks keep a detail with one spelling or none: :169 (JSON of `rec` only, without the expected short key), :175, :387, :404, :513 ×3, :697 (`[]`), :882, :902, :962, :967, :970, :973, :982, :991 ×2, :1004 and :1007.
   - At :970, `headOnly.message` is undefined on Windows, so the default `""` prints.
   - The brief's own wording is "each printing its paths". The line "Add a detail argument wherever one is missing" is an extra step on top of that, not a replacement for it.
   - Fix: append one `pathForms(...)` suffix to each listed check: `O.d` plus the out path in section 20, and `A.d`, `H`, `K` or `U` `.git` elsewhere.

**(a) Win32 guards in the diff that no checker listed.** Both are correct and both follow the brief.
- **`immutable-review.test.mjs:116` hostileName.** It uses U+2028 on win32 and prints nothing.
  - That is acceptable because a newline name cannot exist on NTFS.
  - Git output is read with `-z` everywhere (pi-review.mjs:121/142, review-round.mjs:193-206), so the name round-trips.
  - Git's NTFS and HFS path checks do not reject U+2028.
  - Check 3 is allowed to fail, so this path stays unseen on Windows until W7c.
- **`review-ledger.test.mjs:532` taskkill /T.** It is right for `detached:true` k and its hung grandchild. NOTE: the result of taskkill is not checked. If it fails, :534 waits out the 60 s hang, and the round gets consumed, which fails :542 for an unclear reason.
- `pathToFileURL` (:19, :26, :932) is a fix, not a guard. No raw `import(` path remains.

**(b) MUSTs from the three checkers**
- immutable-review MUST 1: confirmed (I ran the body).
- immutable-review MUST 2: confirmed, conditional on the reclaim bug the plan already assumes for check 11.
- review-ledger MUST 1: confirmed.
- worker-lane raised no MUST, and I found none.

**(c) `packages/nana-pack/tests/fake-pi.mjs`**
- **Header:** all six tags are present, and `@purpose` is one sentence. NIT at :9: `@errors none; a write failure throws` contradicts itself.
- **Code map:** the entry, callers and callees are present, and the count is 284. I ran `node scripts/code-map.mjs --check`: 284 modules, 0 problems.
- **Layout:** I walked piLaunch (pi-watchdog.mjs:57-93) against it. findPi finds `<dir>\pi.cmd`. The last two segments are not `node_modules\.bin`, so `packageRoot = <dir>\node_modules`. `packageDir = …\@earendil-works\pi-coding-agent`. `name === PI_PACKAGE` and `bin[PI_BIN_NAME] === "cli.js"`. The entry is contained and is a file. piLaunch returns `{execPath, [cli.js, ...args]}` and never runs `pi.cmd`. This holds for all three stub folders (`fake-bin`, `stubs`, `stub`).
- **Writes:** only `dir/pi.cmd` and the files under `dir/node_modules/<PI_PACKAGE>/`. PI_PACKAGE is a fixed constant, so it cannot reach outside `dir`.

**SHOULD**
- `review-ledger.test.mjs:43`: the win32 `plain` port appends to `COUNT` without a guard. I ran it: TypeError, exit 1. `:754` runs `plain` with no COUNT, so on Windows `:756` (R-701) passes only because the stub crashed. Guard it with `if (process.env.COUNT)`.
- `immutable-review.test.mjs:64-65`: the comment says POSIX uses a `path.resolve` no-op, but the code below it uses `fs.realpathSync`. The comment is stale.
- `review-ledger.test.mjs:647`: the read-only SKIP reason describes a chmod limit. An ACL-denied ledger folder can exist on Windows, so the reason does not name a case that cannot happen there, as WR1 asks.

**NOTE**
- **Race in the immutable-review port (:32-33).** The win32 fake writes the OBSERVE header with `writeFileSync`, then the argv with `appendFileSync`. The test reads OBSERVE as soon as the file exists (:150-155). Defender's scan when a file closes can widen that gap. A read inside it gives an empty argv and fails check 4: allowed today, a flake after W7c. The sh stub has the same two-step write. A single write would close the gap.
- **Unresolvable comment references.** `worker-lane.test.mjs:36` cites "CHANGE.md §1", but this lane's review folder has no CHANGE.md. `immutable-review.test.mjs:218` cites "KB4", which exists only in the plan docs.
- **Wrong comment.** `worker-lane.test.mjs:16-17` says the native real path "keeps an 8.3 … form". It actually expands to the long form.
- **Per-file time limit.** review-ledger may hit the 300 s cap on Windows. This is inferred. scripts/test.mjs:70 sets it, and ci.yml sets no `NANA_TEST_TIMEOUT_MS`. The suite job has no `timeout-minutes`, so only the per-file cap matters. If the file times out, WR1's "run to their end" fails. Read the first Windows run's timing.
- **Signal SKIP wording.** The section 7 SKIP (:567) mentions a "process group", but the check signals a single pid. The git-shim SKIPs name a test mechanism, not a case that cannot happen. Both are declared in the plan, so I accept them.

Files: `<worktree>/packages/nana-pack/tests/immutable-review.test.mjs`, `<worktree>/packages/nana-pack/tests/review-ledger.test.mjs`, `<worktree>/packages/nana-pack/tests/worker-lane.test.mjs`, `<worktree>/packages/nana-pack/tests/fake-pi.mjs`, `<worktree>/packages/nana-pack/bin/pi-review.mjs`, `<worktree>/packages/nana-pack/bin/pi-watchdog.mjs`