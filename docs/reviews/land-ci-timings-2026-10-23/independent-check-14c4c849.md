# land-ci-timings · independent check at 14c4c849

Checker: the lane's one independent check (Claude Code, Opus), 2026-10-23. Lane class: land tool. Threat model: honest variation in our tools' output and GitHub's responses in scope; deliberate forgery out.

**Result: no MUST finding.** The feature works on real data: two real tips (13 real CI artifacts) were read, kept and matched byte for byte against fresh downloads; a repeat keeps the same 13 files; `GH_HOST=example.invalid` does not break the downloads; a real end-to-end `runLand` from the lane's code merged, kept 6 records outside the ledger lock and exited 0. One code path can still print `refused:` after a merge, but only from an injected keeper that returns non-string elements (NOTE 1, outside the threat model).

## Setup

- Scratch clone: `git clone --no-hardlinks ~/nana-pi-wt/land-ci-timings <scratch>/ic-clone`, `git checkout 14c4c849`, origin set to the real repository's URL (`https://github.com/<owner>/nana-pi.git`).
- Driver `<scratch>/ic-driver.mjs` imports the clone's `keepLandCiRecords`, `ghDefault` and config names, and calls `keepLandCiRecords({ main: <clone>, tip, runGh, budgetMs: CI_RECORDS_BUDGET_MS, keep: CI_RECORDS_KEEP, share: CI_SLOW_SHARE })`. `runGh` wraps `ghDefault()` and passes nana-land's colour-safe env (a copy of its private `ghEnvironment`: drops `GH_FORCE_TTY`, sets `CLICOLOR_FORCE=0`), and logs each call's arguments, limit, time and status.
- Every run: `env -u CLAUDE_CONFIG_DIR -u GH_HOST TMPDIR=<scratch>/ic-tmp IC_CLONE=<scratch>/ic-clone node <scratch>/ic-driver.mjs <tip>`. Optional test knobs on the driver only: `IC_BUDGET`, `IC_KEEP`, `IC_INJECT_LIMIT` (adds `fileTimeoutMs` to each downloaded record before the reader parses it).
- gh use was read-only throughout: `gh api` GETs, `gh run list`, `gh run download` into scratch.

## Step 1: two real tips, compared with the script

Tips: d547b329 (push run 40051438642 and pull_request run 40049030027, 3 artifacts each) and c273b4de (push run 40027687691 with 3 artifacts; pull_request run 40022762631 at attempt 2 with 4 artifacts, including `suite-record-macos-latest-1` and `-2`).

| Tip | gh calls | Read time | Result | Store after |
|---|---|---|---|---|
| d547b329 | 11 | 6,769 ms | `kept 6 of 6 records`, no notes | 6 files |
| c273b4de | 12 | 8,609 ms | `kept 7 of 7 records`, no notes | 13 files |
| d547b329 again | 11 | 7,017 ms | `kept 6 of 6`, no notes | 13 files, same names (listing md5 unchanged) |
| c273b4de again | 12 | 8,598 ms | `kept 7 of 7`, no notes | 13 files, same names |

- `node scripts/ci-records.mjs <tip>` in the clone (6.45 s real for d547b329) printed exactly the keeper's lines minus its closing `ci record: kept N of N records` line, for both tips (13 of 14 and 15 of 16 lines identical, in order).
- `<scratch>/ic-compare.mjs` downloaded every artifact afresh (`gh run download <run> --repo github.com/<owner>/nana-pi --pattern 'suite-record-*'`) and checked each kept file against it and against `gh api .../runs/<run>` and `.../runs/<run>/artifacts`: 13 of 13 pass. For each file, the record body minus `tip`, `recordedAt` and `ci` equals the raw download exactly; no raw record carries those keys, so nothing is overwritten; `tip` equals the run's `head_sha`; `ci.event` equals the run's event; `ci.leg` and `ci.attempt` match the artifact name; `recordedAt` equals the artifact's `created_at`; the name equals `<created_at stamp>_<tip>_<run>-<leg>-<attempt>.json`; no artifact is stored twice. Both macOS attempts of run 40022762631 are kept under distinct names (`...-macos-latest-1.json`, `...-macos-latest-2.json`); attempt 1's record is the failed one (exit 1), kept as CI wrote it.
- No `.tmp` file remained in the store, no download folder remained under the scratch TMPDIR, and no `nana/suite-runs` folder appeared (the local store is untouched).
- Size: 264,498 bytes for 13 files, about 20.3 KB per record, so 4,000 records come to about 81 MB (the plan inferred 78 MB).
- Retention with real files: after keeping d547b329, a keep of c273b4de with `IC_KEEP=8` left the newest 8 by artifact creation time (2 of c273b4de's plus d547b329's 6), although c273b4de's files were written last.

## Step 2: GH_HOST set to another host

`env -u CLAUDE_CONFIG_DIR GH_HOST=example.invalid ... ic-driver.mjs d547b329`, empty store: 11 calls, every one status 0, 6,520 ms, `kept 6 of 6 records`, no notes, 6 files. The downloads ran as `gh run download <run> --repo github.com/<owner>/nana-pi ...`. Control: `GH_HOST=example.invalid gh run download 40051438642 --repo <owner>/nana-pi ...` (no host) fails with `error connecting to example.invalid`, exit 1. The end-to-end land below also ran with `GH_HOST=example.invalid` and `GH_FORCE_TTY=1` set and kept all 6 records.

## Step 3: read times and slow-file notes

- Read times: 6.0 to 7.0 s for d547b329 across six reads, 8.6 s for c273b4de (two reads), 7.0 s inside the real land. The slowest single call was a jobs listing at 1.6 s. The 60 s budget leaves about seven times the slowest read.
- None of the 13 real records carries `fileTimeoutMs`: the runner change (R-2753) is in this lane and the lane tip has no CI run yet (the draft PR's head is bf134466). Every real read printed no slow-file note, as the older-record rule requires.
- Judged path on real timings, with the limit injected into the downloaded records:
  - `IC_INJECT_LIMIT=900000` (CI's `NANA_TEST_TIMEOUT_MS`): no note. The slowest real file, Windows `land.test.mjs` at 329.1 s, is 36.6% of 900 s.
  - `IC_INJECT_LIMIT=600000`: one note, `[nana-land] note: slow CI file: packages/nana-pack/tests/land.test.mjs took 329.1s on win32 windows-latest run 40049030027 attempt 1, 54.85% of its 600s limit`.
  - An independent count over the raw files (final non-SKIP entry per path, seconds at or above half the limit) gives 0 files at 900 s and exactly that one file at 600 s.

## Step 4: failure paths driven for real

| Path | How | Result |
|---|---|---|
| Tip with no CI run | empty local commit 7912893a in the clone | 366 ms, 1 gh call, no throw; one note `[nana-land] note: CI records not read: no CI run for 7912893a`; no store folder |
| Runs with no record artifact | real older main tip 3bbb0662 (before CI uploaded records) | 3.2 s, 5 calls; six `no record (success)` lines; one note `CI records not read: no readable record for 3bbb0662` |
| gh absent | `PATH=/usr/bin:/bin` | 31 ms; one note `CI records not read: cannot start gh: spawnSync gh ENOENT` |
| Budget spent mid-read | `IC_BUDGET=2500` | stopped at 2,536 ms; limits 2500, 1997, 1740, 704 ms; the fourth call (a download) was killed at its 704 ms limit and the next calls were refused; one note `CI records not read: stopped at the 2.5 s budget`; no store files; no gh process left; temp folder removed |
| Budget of 1 ms | `IC_BUDGET=1` | first call given a 1 ms limit and killed; one note `CI records not read: gh could not start: spawnSync gh ETIMEDOUT` (see NOTE 2) |

## End to end: runLand from the lane's code

`<scratch>/ic-land-driver.mjs`: a second scratch clone with `main` at 4e26ce1d and a worktree at d547b329, origin set to the real URL. `runLand` came from the clone at 14c4c849 with real git, a logging wrapper over `ghDefault()`, the suite command `true`, a scratch home, and an injected review-ledger lock holding one version-2 LAND row and logging when it is entered and left. Run under `GH_HOST=example.invalid GH_FORCE_TTY=1`.

- Code 0, main fast-forwarded to d547b329, 6 records in `<scratch>/ic-land/.git/nana/ci-runs`, 9.2 s in total, of which 7.0 s was the record read after the merge.
- Event order: lock (first read) → the land's CI read, outside the lock → lock entered → `git merge --ff-only` inside it → lock left → containment check → release status → 11 record calls. Every record call ran outside the lock with `CLICOLOR_FORCE=0`, no `GH_FORCE_TTY`, and a 30,000 ms limit.
- Output order: notes, CI line, the 13 reader lines plus `kept 6 of 6 records`, `push command`, `release status`.
- Injected keepers after a real merge (main reset to 4e26ce1d before each run): one that throws gave code 0 and `note: CI records failed: boom`; one that returns `null` gave code 0 and `note: CI records failed: CI-record keeper returned a malformed result`; one with a null-prototype object in `lines`, and one with a Symbol in `notes`, each gave **code 1, `refused: ...`, with main already at d547b329** (NOTE 1).

The lane's `land-ci-records` and `ci-records` test files pass alone in the clone (13 checks, 20 s).

## Step 5: code read

- **Return 1 after the merge.** The new step runs after the lock, the containment check and the release-status read. Its call, its shape check and its copying of the two arrays sit inside one try that turns any throw into one `CI records failed` note. The keeper itself catches everything and returns notes. The only escape is line 225 of `nana-land.mjs`, which joins `notes` and `recordLines` into the output outside that try. An element that cannot become a string throws there and reaches the outer `refused:` catch (NOTE 1). The real keeper only emits template strings and reader lines, so honest data cannot reach it. The post-merge refusals on lines 201 to 204 were there before this lane.
- **Unbounded gh call.** Every gh call in `readCiRecords` goes through `ghResult` and the injected `runGh`, which `keepLandCiRecords` wraps in its budget gate. The gate refuses a call once less than 1 ms remains, measured with `performance.now()` from the first call, and gives each call `Math.min(CI_READ_TIMEOUT_MS, Math.ceil(remaining))`. A NaN clock refuses the call. `ghDefault` turns a non-integer or sub-1 limit into an error result. So the gh time in one land is at most the budget plus under 1 ms, plus kill time. `runLand` has no other production caller and passes `ghDefault()` by default, which honours the per-call limit. The step's local git calls have no limit (NOTE 6).
- **Review-ledger lock.** `keepCiRecords` is called after `lockReviews(...)` returns, and the new lib imports nothing from `review-round.mjs`. The end-to-end log shows `inLock=false` on every record call.
- **Store.** The step writes only under `<git common dir>/nana/ci-runs`, through `storeSuiteRecord` with `subpath: CI_STORE_SUBPATH`. `readSuiteRecords` and `suiteRecordLines` default to `nana/suite-runs`, so CI records never enter a local baseline.

## Findings

- **NOTE 1: a keeper result with non-string elements prints `refused:` after a merge.** `runLand` checks only that `lines` and `notes` are arrays. It stringifies them on line 225, outside the guard. Measured: a null-prototype object in `lines`, or a Symbol in `notes`, from an injected keeper gives code 1 with main already merged. The real keeper cannot produce such elements, so this is outside the threat model. It is an edge of R-2755's "malformed result" wording. Hardening is one line: map both arrays to strings inside the try.
- **NOTE 2: a timed-out call reads "could not start", and the budget can go unnamed.** The reader's `ghResult` maps every spawn error, ETIMEDOUT included, to `gh could not start: ...`. With the real budget, a first call that hangs for 30 s gives the note `CI records not read: gh could not start: spawnSync gh ETIMEDOUT`. When the call killed at a budget-capped limit is the reader's last call, no later call is refused, so `budgetStopped` stays false and the note does not name the budget (measured with `IC_BUDGET=1`). With 60 s against 6 to 9 s reads this is rare. The wording comes from `ci-records.mjs`, which this lane did not change.
- **NOTE 3: no real record has been judged yet.** Real CI records carry no `fileTimeoutMs` until this lane's runner change runs in CI. The judged path was checked only on real timings with an injected limit. At CI's 900 s limit the first lands will print no slow-file note; the nearest file is at 36.6%. The lane's own pull-request run, once the tip is pushed, gives the first real judged read, as seat step 5 plans.
- **NOTE 4: the cause can sit in an earlier line.** When every artifact of a run fails to download or parse, the one note says `not read: no readable record for <tip>`, the reader's last line. The download failure itself appears only in the earlier reader lines.
- **NOTE 5: a typical land keeps only the pull_request run.** The push run for a tip starts after the land's `git push`. So a land will usually keep about three records, not the six or seven measured here on tips already on main. Retention then lasts longer than the 100 days the provenance states (inferred). Measured size is about 81 MB at 4,000 records.
- **NOTE 6: local git calls have no time limit.** The step's `rev-parse`, `remote get-url` and per-record `rev-parse --git-common-dir` run without a limit. They are local and of the same class as nana-land's other git calls; they are not gh calls.
- **NOTE 7: the rounded-up limit can pass the remainder.** `Math.ceil(remaining)` can exceed the budget's remainder by under 1 ms, against R-2756's "at most ... the budget's remainder". The seat chose this in S1, and the effect is negligible.

## Scratch artifacts

All under `<scratch>/land-ci-timings/`: `ic-driver.mjs`, `ic-compare.mjs`, `ic-land-driver.mjs`, run outputs `ic-run*.json` and `ic-land-*.txt`, raw downloads `ic-raw/`, clones `ic-clone/`, `ic-land/` and `ic-land-tree/`.
