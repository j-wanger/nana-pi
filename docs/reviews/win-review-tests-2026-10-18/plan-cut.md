Order: lanes 1 and 2 build now and lane 3 waits in planning. Lane 3 starts when lane 1 lands, and lane 4 starts when lane 2 lands. Lane 5 goes last.

The order is a trade. Lane 3's product fix needs lane 1's test fixes before any Windows run can show it. Lane 1 can't reach a full pass until lane 3 lands. So lane 1 lands with an exact named list of failures caused by the product bug. Lane 3 then turns that list green, which also gives the gate lane its wrong-code and right-code pairs on Windows. The other route makes the test roots use native real paths, which hides two real bugs. I did not choose it.

Two files moved out of the proposed cuts:
- runtime-map: all three of its failures are product bugs in the code-map tool, so it becomes its own small product lane (lane 4).
- objective-golden: it is the session-start feature, so it gets its own tiny lane (lane 5).

## LANE 1: win-review-tests (ordinary, tests only)

**Files:**
- `land.test.mjs`
- `immutable-review.test.mjs`
- `review-ledger.test.mjs`
- `worker-lane.test.mjs`
- a new shared helper, `packages/nana-pack/tests/fake-pi.mjs`, with the six-tag header; regenerate the code map

**Must-meet:**
- **LR1:** On Windows CI, all four files run to the end with no crash.
  - worker-lane: 51 pass, 1 SKIP.
  - immutable-review, review-ledger and land: every remaining FAIL is one of the checks named below as blocked by the short-path bug. Each such FAIL prints the short and long paths it compared.
  - No Windows log line from these files says "No API key found", which shows the real pi never starts.
- **LR2:** The macOS counts are unchanged: 51, 17, 155 and 52.
- No new requirement row. Record R-1009, R-979, R-705, R-724 and R-967 as violated on Windows, with the residual in HANDOFF, until lane 3 lands.

**Hard rule for the brief:** keep the short TEMP path (RUNNER~1). Do not resolve the test roots with native real path in immutable-review or review-ledger. That would hide lane 3's bug.

**Shared helper, `fake-pi.mjs`:** `writeFakePi(dir, body)`.
- On win32 it writes:
  - a stub `pi.cmd`;
  - `node_modules/@earendil-works/pi-coding-agent/package.json` as `{name: PI_PACKAGE, bin: {[PI_BIN_NAME]: "cli.js"}}`, with both names imported from `bin/worker-config.mjs`;
  - `cli.js`, which holds the body.
- On POSIX it writes `pi` as `#!/bin/sh` + `exec "<node>" "<cli.js>" "$@"` and runs chmod 755 on it.
- Fallback if piLaunch rejects the layout written without npm: use the npm pack plus `install --offline` route from `win32-launch.test.mjs:165-193`. That route already passes 13 checks on Windows.

**What to fix in each file**

**land.test.mjs**
- **:25** In `repo()`, run `git config core.autocrlf false` before the first commit.
- **:499** Use `path.resolve(fileURLToPath(new URL("../../..", import.meta.url)))`.
- **:59, 65, 72, 168, 178, 208, 220, 230, 241, 257, 439, 563** Write `node -e "process.exit(N)"` with double quotes.
- **:300, 337, 348** Replace the suite `'true'` with `node -e "process.exit(0)"`.
- Until lane 3 lands, these 40 checks are allowed to fail with the shared-repo refusal or the path-mismatch refusal:
  - 38 at test lines 62, 69, 76, 85, 94, 103, 133, 144, 154, 165, 172, 181, 191, 202, 212, 224, 234, 245, 254, 262, 283, 294, 305, 313, 322, 331, 341, 352, 361, 372, 399, 417, 429, 443, 508, 518, 539 and 560;
  - 2 at test lines 456 and 483.
- These fixes go in without a Windows run to confirm them. The 40 refusals above stop the checks before they get that far.

**immutable-review.test.mjs**
- **:14-18** Import with `pathToFileURL(...).href`.
- **:55 and :100** On win32, name the hostile file with U+2028 in place of the newline (NTFS refuses a newline in a file name). POSIX keeps the newline.
- **:22-35** Use the fake-pi helper and port the sh body to Node. The port must:
  - write the pid to `OBSERVE_PID`;
  - write cwd, `NANA_REVIEW_ROOT`, `NANA_ROLE` and the joined argv to `OBSERVE`;
  - poll for `WAIT_FOR`;
  - exit 1 on `MODE=fail`, idle 30 s on `MODE=stall`, and otherwise print `VERDICT: LAND`.
- **:35 and :203** Join PATH with `path.delimiter` and put the fake first.
- **:170-192** Compare canonical paths in the porcelain checks:
  - Parse the `worktree ` lines and resolve each one through `real` (native on win32), falling back to `path.resolve` plus case-folding.
  - Canonicalize `killedCheckout` while it still exists, before the recovery run.
  - Share one helper with :134 and :143-161.
- **:150-161** On win32, print `SKIP … — Windows delivers no SIGTERM to a child; TerminateProcess runs no handler` and do not spawn the run.
- **:196-208** On win32, print `SKIP … — Node's Windows PATH search tries only .com/.exe, so an extensionless git shim cannot run`.
- Until lane 3 lands, checks 1, 2, 3, 4, 6 and 11 are allowed to fail. Checks 1-4 and 6 hit the tracked `--out` bypass; check 11 hits the reclaim bug.
- Target after lane 3: 15 pass, 2 SKIP.

**review-ledger.test.mjs**
- **:18-25 and :886** Import with `pathToFileURL(...).href`. At :886, embed it with `JSON.stringify(...)`.
- **:31-45** Use the fake-pi helper and port the stub modes: `verdict`, `fail` (prints `503 upstream`, exits 1), `stall`, `plain`, `plain-review` and the `INVOKED` marker. Join PATH with `path.delimiter`. The sleeper and ignorer stubs stay POSIX-only.
- **:499** On win32, run `taskkill /T /F /PID`; POSIX keeps `process.kill(-pid)`.
- **:334-336** Use `"x".repeat(20000)` on every platform. It stays over SLUG_MAX and under Windows' 32,767-character command-line limit.
- **:604-608** On win32, SKIP with the reason "NTFS has no directory write bit; chmod only toggles the read-only attribute".
- **:762** On win32, SKIP with the reason "NTFS stores no exec bit".
- **Section 7 (:512)** Print the missing SKIP line: "Windows has no POSIX signal to a process group".
- Until lane 3 lands, the checks at these lines are allowed to fail: 142, 147, 350, 356, 373, 482 (×3), 657, 659, 814, 836, 856, 916, 921, 924, 927, 936, 945 (×2), 958 and 961. Add a detail argument wherever one is missing.
- Target after lane 3: 152 pass, 3 SKIP.

**worker-lane.test.mjs**
- **:29-31, 336, 349, 375** Use one `writeStub(body)` through the helper. The bodies:
  - the main body appends to the marker, prints `NANA_ROLE:NANA_WORKTREE_ROOT` and the args, and copies the file after each `--append-system-prompt` to `prompt-N`;
  - the :336 body appends to `lane-spawns`, prints `output` and waits 3 s;
  - the :375 body starts a non-detached `node -e setTimeout(30000)`, writes its pid to `descendant.pid`, and waits.
- **:17, 26, 86, 355** Define `const real = win32 ? fs.realpathSync.native : fs.realpathSync`. This matches the product's own choice, pi-worker's fsReal under R-1125.
- **:92-93** Read `prompt-1` behind an existsSync guard, so a missing file fails the named checks instead of crashing the file.
- **:342-351** On win32, SKIP with the reason "Node's Windows PATH search tries only .com/.exe, so the extensionless git wrapper cannot run".
- Target: 51 pass, 1 SKIP.

**Known limits**
- The 5 s observe waits in immutable-review (:87-88, :155, :169) may be tight on Windows. Raise them only if a run shows a miss.
- The lines review-ledger flagged as unknowns (:123, :774, :783) are expected to pass on Windows. None has run there yet; read them in the first full run.

## LANE 2: win-template-tests (ordinary, tests only)

**Files:**
- `templates-update.test.mjs`
- `template-acceptance.test.mjs`
- `template-release.test.mjs`
- `test-runner.test.mjs`
- a new shared helper, `packages/nana-pack/tests/git-only-path.mjs`, with the six-tag header; regenerate the code map

**Must-meet:**
- **TR1:** On Windows CI, all four files pass with no SKIP:
  - templates-update 34/34;
  - template-acceptance 12/12;
  - template-release 5/5;
  - test-runner 39/39.
- **TR2:** The macOS counts are unchanged. With `NANA_TEST_REQUIRE_COPIER=1` and full git history, a missing v0.6.0 tag makes templates-update FAIL instead of SKIP.
- No new requirement row.

**Shared helper, `git-only-path.mjs`:** `gitOnlyPath(tmp)` returns a PATH that holds git and nothing else.
- On win32 it returns the folder of the first line of `where git`, with no link.
- On POSIX it keeps today's `which` plus symlink route.

**What to fix in each file**

**templates-update.test.mjs**
- **:128** Pass `fileURLToPath(new URL(".../conftest.py", import.meta.url))` and add the import.
- **:195** Define `const sourcePath = path.resolve(fileURLToPath(sourceRoot))` and push `sourcePath`.
- **:209, 215, 272** Use `sourcePath` for the repo argument.
- **:209-211 and :263** When `NANA_TEST_REQUIRE_COPIER=1` and the checkout is not shallow, a missing tag is a FAIL.
- **Stop condition:** if :255 fails because of a test under `templates/python/template/tests/`, stop and report. That fix would be a product change.

**template-acceptance.test.mjs**
- **:49-62** Use `gitOnlyPath`.
- **:109 and :121** Wrap the URLs in `fileURLToPath(...)`; the import already exists at :12.

**template-release.test.mjs**
- **:35 and :46-47** Use `gitOnlyPath`.

**test-runner.test.mjs**
- **:181** On win32, the post-edit-hardening fixture is a passing file. POSIX keeps the trap.
- **:224** POSIX keeps `/exit SIG/`. On win32, assert `FAIL` and `/— exit 1$/`, because TerminateProcess reports exit 1 and no signal.
- **:235** Put both tally sets in one named constant next to the fixture. The win32 set is files 14, pass 9, fail 4, skip 1, checks.pass 10, checks.fail 22, checks.skip 2.
- **:243-247** Replace the win32 `skip()` with a check that post-edit-hardening is labelled PASS on win32. That pins R-607's "skip only when the condition holds" half on Windows.

**Known limits**
- templates-update :255 runs the updated project's pytest. This is the first time it runs on Windows, and nobody knows yet whether it passes.
- A copied v0.6.0 project may check out with CRLF line endings. Inferred to be harmless.

## LANE 3: win-review-paths (GATE: two reviewers, wrong-code pairs, one independent check)

Starts after lane 1 lands. One feature: on Windows, the land and review tools treat a short 8.3 path and git's long path as the same folder.

**Files:**
- a new module, `packages/nana-pack/lib/real-path.mjs`, exporting `realPath(p)`:
  - win32: `realpathSync.native` with any leading `\\?\` removed;
  - POSIX: `realpathSync`, unchanged.
- `pi-worker.mjs:154`: its fsReal becomes this import, so the code exists once.
- `nana-land.mjs`:
  - :71, on both sides;
  - :78, the ledger key, which must stay in step with review-round's key;
  - :148, on both sides.
- `review-round.mjs`:
  - :161, the root;
  - :163, the repo key;
  - :250-252, realOut.
- `review-ledger.mjs:51`: the report's `--repo` key.
- `pi-review.mjs`:
  - :72, sourceRoot;
  - :86-92, reclaim, for both `tmpdir()` and each listed path;
  - :117, compare porcelain paths through `realPath`, falling back to `resolve` plus case-folding, against a canonical tempRoot taken after `worktree add`;
  - :159-161, use `realOut(outPath)` for outputRelative and the excluded path.

**Must-meet:**
- **GP1:** On Windows CI with the RUNNER~1 TEMP kept, every check lane 1 listed as blocked now passes:
  - land 51/51;
  - immutable-review 15 pass, 2 SKIP;
  - review-ledger 152 pass, 3 SKIP.

  R-1009, R-979, R-705, R-724 and R-967 return to implemented.
- **GP2:** The macOS suite counts are unchanged, and the POSIX code path is untouched.
- No new requirement row.

**Wrong-code pairs:** lane 1's landed tip is the wrong-code run and this lane's tip is the right-code run, site by site. The seat maps each site to its named checks.

**Known limits**
- A Windows ledger record written before this lane, under the short-path key, no longer matches. An item in flight on a Windows seat restarts its round count once.
- Whether native real path and git agree on a subst drive is unknown.
- Any test-only failure that lane 1's masked fixes missed in land.test gets fixed here.

## LANE 4: win-impact-paths (ordinary, product fix; not a gate tool)

**Files:**
- `scripts/code-map.mjs:56`: `relative(root, resolve(a)).split(sep).join("/")`, importing `sep`.
- `templates/typescript/template/scripts/code-map.mjs:859`: the same change. It ships through the CI release tag.
- `runtime-map.test.mjs:473-479`: add detail output, so the measure half of R-1278 can be seen.
- `code-map.test.mjs`: one check, under the generator's existing `--impact` row.

**Must-meet:**
- **IP1:** On Windows CI, runtime-map gives 7 pass and 1 SKIP (R-1277), and R-1278's detail is printed.
- **IP2:** On both platforms, the template generator's `--impact` names a nested mapped module passed with native separators as mapped.

**Known limit:** the Python generator's `--impact` on Windows is unchecked.

## LANE 5: win-objective-golden (ordinary, tests only, tiny)

This lane carries the reviewer's SHOULD from the session-start lane.

**File:** `objective-golden.test.mjs:377-393`.
- Restore the `dir13dHeadEsc` and `dir13dMidEsc` constants.
- Build the expectation by hand on every platform:

  ```js
  const hand = (p) => `"${p.replaceAll("\\", "\\\\").replaceAll(dir13dHead, dir13dHeadEsc).replaceAll(dir13dMid, dir13dMidEsc).replaceAll(LS, "\\u2028")}"`;
  ```

  Then set `shown = hand(file)` and `shownDir = hand(dir)`, and keep `mentionDetail`.
- On POSIX this equals the form used before commit 0b8a045.

**Must-meet:**
- **OG1:** On macOS, the four path-payload checks never call `displayPath`. A seat change to `displayPath`'s escaping fails them: drop the backslash doubling, or switch `\u000A` to `\n`.
- **OG2:** objective-golden passes with its current counts on macOS and on Windows.

**Known limit:** this assumes the path stays under PATH_CAP, the same as before 0b8a045.

## Known bugs (recorded, no lane now)

- **KB1:** review-round hashes working-tree bytes. On Windows with `core.autocrlf=true` and no eol attribute, every review records `+snap`, so nana-land refuses every land. nana-pi itself is safe because it uses eol=lf.
- **KB2:** a committed 100755 file never reads clean on Windows, because NTFS has no exec bit. nana-pi has 10 such files, so a land from a Windows seat on nana-pi refuses (the same R-708 harm). Inferred, never seen in a log. KB1 and KB2 make one later gate lane, "a clean Windows checkout reads clean". It is needed only if Jake lands from Windows.
- **KB3:** pi-watchdog's `cpuSeconds` (:128-133) leaks PowerShell's "Cannot find a process" text into stderr when pi exits between polls. Cosmetic.
- **KB4:** pi-review's SIGTERM cleanup is not tested on Windows. Only a real console Ctrl+C reaches it.
- **KB5:** two paths are not tested on Windows because their shim checks skip: removeWorktree's rmSync fallback, and pi-worker's re-check of a changed branch.

## HANDOFF

- **Open for Jake:** lane 3 is a gate lane, at the cost of the full review ladder. It closes the tracked `--out` overwrite (R-724) and the round-cap reset (R-705) for any Windows user whose TEMP path has a short name. The alternative records them as known bugs and hides them in tests. I recommend the lane.
- **Open for Jake:** decide whether to queue the KB1 and KB2 gate lane, which is needed only if he lands from a Windows seat.