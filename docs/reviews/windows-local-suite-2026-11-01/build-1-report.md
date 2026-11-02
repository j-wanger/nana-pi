# windows-local-suite — build 1 report

Builder: claude-code sonnet through `pi-worker --lane-size larger` (the laptop roster's larger builder for this build only), 76 min, exit 0, commit `7bf72343`. The seat accepted departures 1 to 5 below. The seat merged origin/main afterwards (code map regenerated) and runs the locked suite from PowerShell on the merged tip; see `suite-run-win32-powershell.txt`.

---

VERDICT: DONE

**Commit:** `7bf72343` on `feat/windows-local-suite` (one commit, not pushed).

**One thing you should know:** the Bash session hands Node the variable as `PATH` and puts GNU tar first, so it doesn't reproduce #213. I ran every Windows check through a small launcher outside the repo. It gives Node one key spelled `Path` and puts `C:\Windows\System32` first, so `tar` is bsdtar 3.8.9. At HEAD, `restore` and `pi-registration` fail under it; with my changes they pass. I did not run the suite from PowerShell itself.

**Rows and tests**
- **R-3450, R-3451** (`restore.test.mjs`, 17 checks, 0 failed):
  - A shared `parseListing` splits on `\r?\n`.
  - The forbidden list now comes from the manifest's secret and disposable rows, plus `project trust`, in slash form.
  - `forbiddenInArchive` is called by both the archive check and the new check.
  - New checks: "tar listings split on CRLF and LF" and "a forbidden path in the archive listing is caught in slash form".
- **R-3452** (`env-path.mjs` and `env-path.test.mjs`): 4 checks, with the helper in `env-path.mjs`. A wrong helper (`{...env, PATH}`) fails 3 of the 4, and a wrong source state fails the scan.
- **R-3453:** the three pi test files now call `withPathPrepended` and pass. I only added the `R-3453` tag to existing checks.
- **R-3454:** profile-store checks 2 to 5 moved to `profile-store-guards.test.mjs`.
- **R-3455:** `review-ledger.test.mjs` is still the only run-alone file. The rest moved into `review-ledger-fixture.mjs`, `-launch`, `-verdicts` and `-state`.

All six rows are `implemented`, with `file::title` evidence.

**Mutation pair (M2):** with the slash normalization removed, only "a forbidden path in the archive listing is caught in slash form" fails. Output is in `m2-mutation-win32.txt`.

**Check names (M5, M6):** 189 names before, 189 after, equal as multisets. That is 18 for profile-store and 171 for review-ledger, including 2 SKIP before and 1+1 after in the reference environment. The POSIX lists are the seat's to supply.

**Repo A state:** for the ten moved blocks A3 names, HEAD and `git status --porcelain` at block entry are equal before and after (`repo-a-state.txt`). Two blocks needed explicit setup lines in the new files:
- `A.at(0)` before the redirect block.
- An untracked `redirect.log` written before block 13, as the redirect block used to leave it.

**Full suite:** `npm run test:locked` with no filter, foreground, exit 1. Summary line:
`257 files: 237 PASS, 2 FAIL, 18 SKIP, 0 WARN · checks: 7642 pass, 3 fail, 157 skip · 985.1s`
- The 2 failures are the known ones: `post-edit-utf8` (no Python) and `template-acceptance` (no uv).
- Per-file seconds for the split files in that run:

| File | Seconds |
|---|---|
| profile-store | 183.4 |
| profile-store-guards | 166.2 |
| review-ledger (run-alone) | 35.3 |
| review-ledger-launch | 103.1 |
| review-ledger-verdicts | 109.6 |
| review-ledger-state | 121.2 |

- All are under 240 s.
- The O2 fallback was not needed.
- `land.test.mjs` took 246.9 s, which is not mine and is under the 300 s limit.

**Other checks:** `map:check`, `readme:check`, the requirements trace, the tree check, the known-bugs check and `identity-scan` are all green. `RUN_ALONE` is unchanged, and no file under `lib`, `bin` or `scripts` changed.

**Departures from the Precedent and plan**
1. Three review-ledger pool files instead of the default two. Two would have run about 180 s each alone, too close to 240 s under full-run load.
2. The `envValue` known-bug line is in `docs/known-bugs/FEAT-031.md`, not `FEAT-013.md`. FEAT-013 is 51,195 bytes against the 51,200-byte cap, so a new line would fail the size check. FEAT-031 already uses "here while FEAT-013's file is at its size cap".
3. I edited an existing test, `code-map-launch.test.mjs`: four loss rows for `review-ledger.test.mjs`, which no longer imports `review-round`, `fake-pi`, `tmp-dir` or `verdict-config` itself. The first full run failed R-3156 on this.
4. Other edits to existing tests: only `// req:` tags added, to `win32-launch`, `pi-registration`, `pi-launch-limits`, `restore`, `profile-store*` and `review-ledger*`.
5. FEAT-031 known-bugs: I updated the time-out lines (49 and 77) and the stale `review-ledger.test.mjs:794` reference, now `:55`.

**Known bugs touched:**
- FEAT-031 lines 49 and 77 (time-outs at land; the renewal split).
- FEAT-031 line 113 (exited-pid read in review-ledger).

**Observations:**
- `profile-fixture.mjs`'s `check` allows a case 120 s, yet check 1 takes about 168 s. It passes only because the case blocks the event loop.
- The original review-ledger file had 170 PASS and 1 SKIP under Git Bash, but 2 SKIP under the reference environment. The plan's "169 PASS, 2 SKIP" matches the latter.

**Not done:** the POSIX name lists, and the POSIX run covering the §7 signal block, which skips on win32.

Lane-folder files: `names-before-win32.txt`, `names-after-win32.txt`, `repo-a-state.txt`, `m2-mutation-win32.txt`, `local-runs-win32.txt`, `suite-run-win32.txt`.
