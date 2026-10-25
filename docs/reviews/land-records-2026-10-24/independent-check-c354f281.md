# land-records · independent check at c354f281

Checker: the lane's one independent check, Claude Code, 2026-10-24; class land tool; threat model: honest variation in our tools' output is in scope (a land killed mid-suite, a suite killed by signal, `.git/nana` as a file, torn or orphan lines, a detached or non-feat source tree, a separate clone, a linked worktree, a run object without times, a ledger over its cap); deliberate forgery is out.

**Result: no MUST found.** Every attempt kind ran end to end through the real `nana-land merge` CLI from a scratch clone at c354f281. In each one the exit code, the merge and every earlier output line matched main's nana-land at 122d795e for the same attempt. The last line was always the one record line, and its lane part matched `build-report --lane`'s land lane line byte for byte. One SHOULD (a torn tail line swallows the next record) and four NOTEs follow.

## Setup

```
S=<scratch>                                  # lanes/lr/ic under the session scratchpad
mkdir -p $S/tmp; export TMPDIR=$S/tmp        # every command below ran with this TMPDIR
git clone -q --no-hardlinks ~/nana-pi-wt/land-records $S/lane && git -C $S/lane checkout -q c354f281
git clone -q --no-hardlinks ~/nana-pi $S/main122 && git -C $S/main122 checkout -q 122d795e
```

Driver files, all in `<scratch>`:

- `mk.mjs <root> <kind>` builds one fixture at a fixed root. It imports the lane clone's `tests/land-fixtures.mjs` (`repo`, `commit`, `git`, `reviewTip`) and follows `land-records.test.mjs`'s `makeLand`: a main repo, `git worktree add -b feat/alpha <root>/wt-x` (the folder name is not the lane), a `next.txt` commit, and `reviewTip(feature, <root>/home)`. That writes a verified LAND round to `<root>/home/.pi/agent`. The CI kind follows `ciFixture`: origin `https://github.com/example/fixture.git` and `.github/workflows/ci.yml` on the tip. Other kinds: `detached` (`git checkout --detach` after the review), `nonfeat` (branch `integration`), `separate` (`git clone main source`, branch `feat/alpha` in the clone), and `two` (lanes alpha and beta). `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE` are pinned, so two builds at the same root give identical SHAs.
- `bin/gh` is a fake `gh` on `PATH`. It answers `api …actions/runs?head_sha=…` from a JSON file and exits 1 on every other call (the CI-records read). Main's and the lane's CLI see the same fake.
- `pair.mjs` builds the fixture, runs `node $S/main122/packages/nana-pack/bin/nana-land.mjs merge --tree … --main … --suite … --reviewed <sha>=item`, then deletes and rebuilds the same fixture at the same root and runs the lane's CLI. Both runs use `HOME=USERPROFILE=<root>/home` and `PATH=$S/bin:$PATH`. It saves both stdouts, exit codes, main's HEAD and the lane's ledger, then runs the lane's `build-report.mjs --repo <main>`, `--lane alpha`, and from the linked worktree with no `--repo`.
- `batch1.mjs` covers the attempt kinds, `batch2.mjs` the history plus SIGKILL, `batch3.mjs` the harm checks, and `batch4.mjs` the edge cases plus cleanup. `timing.mjs`, `concurrent.mjs` and `sigint.mjs` are the extras. Raw outputs are under `<scratch>/runs/<scenario>/` (`main.out`, `lane.out`, `ledger.jsonl`), plus `runs/batch1.json`.

The real clone and HOME were not touched. `~/nana-pi/.git/nana/` holds no `land-records.jsonl`, and `find ~/.pi/agent -newer <scratch>/mk.mjs` printed nothing. The worktree and main stayed at their tips with no new files from this check.

As a baseline, the lane's own tests ran in the scratch clone (`HOME=<scratch>/testhome`). All passed: land-records 7/7, build-report 5/5, land 66/66, land-ci-records 7/7, path-spelling 11/11, build-records 7/7.

## Step 1–2: attempts through the real CLI

All of these ran through the CLI. "main = lane" means the lane's stdout with its last line removed is byte-identical to main's stdout, and the exit codes match.

| Scenario | Exit main/lane | main = lane | End record (stage · ci · ciWaitMs · suiteMs · reason) |
|---|---|---|---|
| (a) landed, CI skipped (no origin) | 0/0 | yes | landed · skipped · null · 3 · null |
| (a2) landed, CI passed: wf1 runs #1 (60 min span) and #2 (5 min), wf2 one run (12.5 min); `run_started_at` set to other values | 0/0 | yes | landed · passed · **750000** · 4 (the longest judged span; the older unjudged run and `run_started_at` were ignored) |
| (a3) landed, CI run without `created_at` | 0/0 | yes | landed · passed · null |
| (a4) landed, CI negative span | 0/0 | yes | landed · passed · null |
| (b1) CI newest run queued | 1/1 | yes | refused · ci · refused · null · null · `CI at f609b5eb: ci run 101 attempt 1 is queued; wait for the run to finish` |
| (b2) CI newest run failed | 1/1 | yes | refused · ci · refused · null · null · `…is failure; run gh run rerun 101 …` |
| (b3) CI no runs | 1/1 | yes | refused · ci · refused · null · null · `no CI run for f609b5eb on origin; …` |
| (c1) suite `echo out line; exit 1` | 1/1 | yes | refused · suite · skipped · null · 5 · `suite failed (exit 1)` |
| (c2) suite stderr `last stderr words` with no newline, exit 1 | 1/1 | main + `\n` + record line | refused · suite · `suite failed (exit 1)` (suite output not in the reason) |
| (c3) suite `kill -9 $$` (killed by signal) | 1/1 | yes | refused · suite · `suite failed (exit SIGKILL)` |
| (c4) suite prints `refused: from the suite`, exit 3 | 1/1 | yes | refused · suite · `suite failed (exit 3)` |
| preflight: dirty main | 1/1 | yes | refused · preflight · not reached · null · null |
| merge: suite commits to main | 1/1 | yes | refused · merge · skipped · suiteMs 28 · `main checkout HEAD changed during suite` |
| (e1) detached tree, landed | 0/0 | yes | start lane null, full tip; last line `…; no lane` |
| (e1r) detached tree, suite exit 1 | 1/1 | yes | refused · suite; `…; no lane` |
| (e2) tree in a separate clone | 1/1 | yes | start (lane alpha, full tip) and end in **main's** clone · preflight · `--tree and --main must share one git repository` |
| (e3) tree on `integration` | 0/0 | yes | lane null; `no lane` |
| unreviewed sha | 1/1 | yes | refused · preflight |
| `--main` outside any repo | 1/1 | byte-identical, no record line | no ledger written |

In c2 the lane's stdout equals main's stdout plus `\n`, then the record line. The record line is not glued to the suite's last stderr words. Every run with a record had exactly two ledger lines: one start and one end with the same attempt id. Every start had a full 40-character tip. Main's nana-land wrote no land ledger in any run. No `nana` folder appeared under the linked worktree's `.git/worktrees/wt-x`, and none appeared under the fixture home's `.pi/agent`.

### (d) Interrupted

`batch2.mjs` ran four attempts on one clone with lanes alpha and beta:

1. alpha with suite `exit 1`;
2. alpha with suite `touch m; sleep 4`, where the nana-land process got SIGKILL 300 ms after the marker appeared;
3. beta, killed the same way;
4. alpha landed.

Main's copy ran the same sequence. Outputs matched: the killed runs printed nothing (signal SIGKILL) in both. The ledger held three lines after the alpha kill and six at the end: three starts with ends and two starts without. The landed attempt's last line was:

```
[nana-land] land record: landed, stage -, 0 min total, 0 min suite, - CI wait; land lane alpha | 3 attempts | 1 landed, 1 refused, 1 no end | 0 min total | 0 min suite | last landed CI wait -
```

`sigint.mjs` sent SIGINT to the whole process group mid-suite, the way Ctrl-C does. nana-land died by SIGINT with empty stdout and left one start, and the report shows `no end`. The plan's inferred claim that Ctrl-C leaves only a start is now measured.

## Step 3: ledger against the build report

- The lane part of the record line equalled `build-report --repo <main> --lane alpha`'s `land lane alpha` line byte for byte in every attempt with a lane. That covers a–a4, b1–b3, c1–c4, preflight, merge, e2, unreviewed, the history, the concurrent pair, and the other-schema case below.
- In the history clone, `build-report` output was identical from `--repo <main>`, from wt-a (no `--repo`), from wt-b (no `--repo`) and from main as cwd. `--lane alpha` from wt-b equalled `--lane alpha` from main. `--lane beta` printed only beta (`1 attempt | 1 no end`).
- Attempt lines showed start time, lane or `-`, outcome, stage, reason, total, suite (`-` when null, never 0) and CI wait (12 min for a2). Tips showed 8 characters.
- Land total for the history clone: `4 attempts | 2 lanes | 1 lane with 2+ attempts | refusals: 1 suite | 0 unreadable lines`. Null-lane attempts (e1, e1r) got an attempt line and a count in the total, but no lane line.

## Step 4: harm checks

- **`<common>/nana` as a file**: refused (suite exit 1), landed with CI not read, landed with CI passed, and a preflight refusal. In each, the exit code and main's HEAD equalled main's run, and every earlier line was byte-identical. Exactly one record line was printed, and it was last: `[nana-land] land record: not kept: <main>/.git/nana/land-records.jsonl: ENOTDIR: ENOTDIR: not a directory, open '…'`.
- **Ledger swapped for a folder by the suite**, landed and refused: same equality. The last line was `not kept: …: EISDIR: …`. `build-report` exits 0 and prints `land records unavailable: not a regular file`.
- **Ledger over its cap** (a real file of 33,555,921 bytes, then a land): the land was unchanged. Its last line was `…; lane line unavailable: ledger over 33554432 bytes: <path>`. `build-report` printed the build lines, then `land records unavailable: ledger over 33554432 bytes: <path>`, with exit 0.
- **Wall time added** by the record (lane against main, alternating, same fixture):
  - refused attempt (dirty main), n=15: median 103.1 ms on main, 137.3 ms on the lane (min 99.2/130.3, max 122.0/165.2), so about +34 ms;
  - landed attempt on fresh fixtures, n=6: median 503.5 ms on main, 534.8 ms on the lane, so about +31 ms;
  - with a 30 MiB ledger under the cap, a landed attempt took 756–781 ms against 514–527 ms with an empty ledger. The closing read adds about 250 ms near the cap.
- **Record placement**: no record landed in the linked worktree's git folder (`.git/worktrees/<name>/nana` was absent in every run) or under the fixture home's `.pi/agent`, which held only review-ledger files.

## Step 5: other in-scope cases

- **Two lands of one clone at once** (alpha and beta, suite `sleep 2`): two starts, then two ends, all whole lines. beta landed. alpha was refused at merge with `main checkout HEAD changed during suite`, which is today's behaviour. The report counted 2 attempts and `refusals: 1 merge`.
- **Second spelling of main** (`--main /tmp/…`, tree under `/private/tmp/…`): it landed. The record went to the one ledger, and the report matched.
- **Other-schema line, orphan end and non-JSON line** before a land: the report counted `3 unreadable lines`. The old attempt and the new one paired correctly, the lane line read `2 attempts | 2 landed | 10 min total | 6 min suite`, and the record line matched it.
- **More edge cases**: tree equal to main gave `no lane` with output equal to main's. A nonexistent `--main` wrote no record and gave byte-identical output. A nonexistent `--tree` gave a start with lane null and tip null, then a preflight end. A tree subfolder gave lane alpha.
- `nana-land cleanup alpha` wrote nothing. The parser's argument refusals (`merge requires --tree and --suite`, `merge requires --reviewed`) wrote nothing.
- Not run: Windows paths (8.3, case). No Windows machine was available, so behaviour there is inferred from the shared `repoKeyOf`.

## Findings

1. **SHOULD**: a torn tail line swallows the next attempt's start record. Setup: the ledger ends with a partial line and no newline (`{"v":1,"kind":"start","attempt":"torn-1",…,"lane":"alpha","ti`), then a land runs (`runs/h8-torn-tail-then-land`).
   - The next `appendFileSync` joins the new start onto the torn line. Both become one unreadable line, and the new end becomes an orphan.
   - The land itself was unchanged (exit 0, merged, earlier lines equal to main's).
   - Its closing line read `…; land lane alpha | 0 attempts | none | 0 min total | …` for a lane that had just landed. The report showed `0 attempts … 2 unreadable lines`.
   - Torn lines are in the threat model. The torn line itself is skipped and counted as planned, but the next good record is lost with it. The loss heals after one record.
   - The shared `appendLedgerRecord` in `record-ledger.mjs` gives the build ledger the same behaviour.
   - How a torn tail arises (ENOSPC, a crash mid-write) is inferred rare on a local disk; I did not reproduce it naturally.
   - Suggested handling: record it as a known bug for both ledgers, or have the append write a leading newline when the file does not end in one.
2. **NOTE**: wall time added per land is about +34 ms on a refused attempt (median 103 → 137 ms, n=15) and about +31 ms on a landed one (504 → 535 ms, n=6). The closing read of a 30 MiB ledger adds about 250 ms. Neither changes a verdict.
3. **NOTE**: the not-kept line doubles the error code: `ENOTDIR: ENOTDIR: not a directory, open …`. That text comes from `landRecordErrorText`, which repeats pi-worker's private `errorText` and so its output. The helper is a copy, not an import (the 2026-10-22 ruling covers a helper's second caller). This is cosmetic.
4. **NOTE**: an invalid `--reviewed` pair (`nosha`) passes `parseLandArgs`, is refused in `runLandCore`, and so is recorded as a preflight refusal. The plan exempts only `parseLandArgs` refusals, so this matches its letter. I mention it so the known limit on argument refusals is worded to match.
5. **NOTE**: the pack README says "Each attempt writes a start and an end record … and ends with one `[nana-land] land record:` line". An interrupted attempt writes only a start. Parser refusals and a `--main` outside a repository write nothing. The must-meet's known limits cover these cases, but the README sentence does not qualify them.
