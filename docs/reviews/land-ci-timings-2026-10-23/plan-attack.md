# land-ci-timings · plan attack (the one adversary, 2026-10-23)

Feature: FEAT-008 · Integrate and clean up reviewed changes. Main at c273b4de. Target: the plan draft `<scratch>/lanes/land-ci-timings-plan-draft.md` and the slate's land-reads-ci-records entry, skeptic and critic notes.

## Summary

- M1 · `GH_HOST` set to another host breaks every records download, while the CI read and the records API calls still pass. Measured: 7 of 7 downloads failed and the read returned code 1.
- M2 · The new `Made by: R-2632 · land:` line claims the land makes CI's upload. It adds nothing to the count (measured: 17 of 33 with or without it). It also hides a new store that no code reads.
- S1 · The budget can hand spawnSync a 0 ms limit, which means no limit (measured). A fractional limit throws (measured). Stub-only tests cannot see either.
- S2 · R-2750 says "after the containment check", but its test only pins "after the lock". A read placed before the post-merge checks passes.
- S3 · Re-run attempts and the store name are under-tested. A store that keeps one record per leg passes. So does one that names by process id, because the re-keep runs in one process.
- S4 · R-2752 never pins `CI_RECORDS_KEEP`: a land that never prunes passes both cases.
- S5 · Gaps in the one-note rule. R-2756's "one note names the budget" contradicts D8. A malformed return formatted outside the guard turns into `refused:` after the merge. One bad artifact time can stop the rest being stored.
- S6 · The tests embed tunables. R-2754's 99.9/100/150/199 s at a 200 s limit assume `CI_SLOW_SHARE` 0.5. R-2756's 30,000/10,000 ms assume `CI_READ_TIMEOUT_MS`.
- S7 · R-2755's row is wider than D8: "gh fails" reads as any gh failure, but a partial failure prints no note.
- Notes N1 to N9 follow. The wrong-code table adds pairs 19 to 30 to the plan's 18.

## Basis and method

- Copies:
  - `git archive c273b4de` of the pack's lib and bin into `<scratch>/land-ci-timings/attack/src`. That copy is patched so that `readCiRecords` returns `printed` and `storeSuiteRecord` takes a `subpath`.
  - A full `git archive` of main, with its own scratch repository, at `attack/full`.
- Prototype `attack/proto.mjs`: the plan's D2 to D5 over the real reader. It uses a `ghEnvironment` wrapper, a 60 s budget and a store in a scratch repository's `.git/nana/ci-runs`. It names files `<artifact stamp>_<tip>_<run>-<leg>-<attempt>` and judges at 0.5 of 900 s. The reader's cwd was the main checkout, for read-only git calls.
- Minimal records step in nana-land: `attack/nana-land-proto.diff`, run against land.test.mjs in `attack/full`. TMPDIR was `<scratch>`.
- gh calls were read-only: `gh api` GET and `gh run download` into `<scratch>`. The origin is written below as `<owner>/nana-pi`.
- Nothing was written in ~/nana-pi, any worktree, ~/.claude, ~/.pi or the npm prefix. The repo is still clean at c273b4de. I made no model calls.
- Tools: macOS, node 22.22.2, gh 2.91.0. No `GH_*` variable is set on this machine (measured: count 0).

### Measured baseline

| Check | Result |
|---|---|
| Prototype read of c273b4de (two runs, re-run macOS attempt) | code 0, 7 records, 12 gh calls, 8.13 s, then 8.00 s |
| Store names | 7 distinct names; both macOS attempts are kept (`...40022762631-macos-latest-1.json` and `-2.json`) |
| Second keep of the same tip | still 7 files (the rename replaces the file on macOS) |
| Reader temp root afterwards | empty |
| Slow notes at 0.5 of 900 s on c273b4de | none (Windows land.test.mjs 351.4 s and 337.8 s, about 39%) |
| Minimal records step against main's land.test.mjs | 63 PASS, 3 FAIL: R-2588, R-2590, R-2591, exactly the three the plan names |
| The same, with the three gh counts narrowed | 66 PASS, 0 FAIL. The POSIX fake-gh child passes, as the plan predicts by coincidence |
| Tree check, Read by changed to code only | `deliverables: 17 of 33` (main: 16 of 33) |
| Tree check, plus the `Made by · land ... · ci-runs` line | `17 of 33`, plus `deliverable note: R-2632 artifact "ci-runs" ... is not tracked at HEAD` |

## MUST

### M1 · `GH_HOST` breaks every records download (measured)

- **What I did:**
  - Ran `gh run download 40022762631 --repo <owner>/nana-pi --name suite-record-macos-latest-2 --dir <scratch>` three ways: plain, with `GH_HOST=example.invalid`, and with `--repo github.com/<owner>/nana-pi` under the same `GH_HOST`.
  - Ran the prototype with `GH_HOST=example.invalid` in the env it passes to gh.
- **What happened:**
  - Plain: downloaded in 0.96 s.
  - `GH_HOST=example.invalid`: `error connecting to example.invalid`, nothing downloaded.
  - Host-qualified `--repo`: downloaded in 0.71 s.
  - `gh api --hostname github.com .../artifacts` under the same `GH_HOST`: worked (4 artifacts).
  - Prototype: the runs, artifact and job calls passed, all 7 downloads failed, code 1, `no readable record for c273b4de`, 3.5 s.
- **Why it matters:**
  - nana-land's CI read pins `--hostname github.com` (R-2591). R-2591's test presets `GH_HOST=example.invalid` because the project already treats a stray `GH_HOST` as honest variation.
  - The reader's download (ci-records.mjs:136) uses `--repo owner/repo`, which gh resolves against `GH_HOST`.
  - On a machine with `GH_HOST` set, for example for a GitHub Enterprise login, every land passes the CI read. It then prints `CI records not read: no readable record` and keeps nothing. The feature never works there.
  - Whether the owner's second machine sets `GH_HOST` is unmeasured. The class is in the threat model and has the R-2591 precedent.
- **Change:**
  - In ci-records.mjs, download with `--repo ${CI_HOST}/${owner}/${repo}`. gh accepts HOST/OWNER/REPO (measured above).
  - R-2750's test also presets `GH_HOST=example.invalid`. Its stub fails any download whose `--repo` lacks the `github.com/` host while `env.GH_HOST` is set, which models measured gh behaviour.
  - Update the fake in ci-records.test.mjs:71-74, which compares `--repo` to `state.repository`. Add one reader-level assertion on the download argv.

### M2 · `Made by: R-2632 · land:` claims more than the code does (measured)

- **What I did:** applied the plan's two ledger edits in the archive copy and ran `node scripts/requirements-tree.mjs --check`. I also read deliverables.mjs:96-117.
- **What happened:**
  - Changing only `Read by` to `code: nana-land.mjs, land-ci-records.mjs` lifts the count from 16 to 17 of 33. R-2632 already has `Made by: R-2632 · CI: ...` (REQUIREMENTS.md:2009), and the count needs any code maker.
  - The extra `Made by: R-2632 · land: ... · ci-runs` changes no count. It adds a "not tracked at HEAD" note until `ci-runs` joins report-at-land's machine-local set.
- **Why it matters:**
  - R-2632 is "the root CI suite job shall upload ... an artifact". The land never makes that artifact; it copies it. The line is false.
  - The line exists only to give R-2632 an age, but that age would be the landing clone's newest copy, not CI's upload. On a machine that never lands, R-2632 would look dead while CI uploads every run.
  - The store itself is a new produced artifact, up to about 78 MB, and no code reads it. The plan says so: "No code reads the store's history yet". The 2026-10-22 ruling asks each produced artifact to name the code that reads it. Folding the store into R-2632's maker line hides a write-only artifact inside a counted row.
  - The report-at-land attack's M2 was the same class: an age from a source that cannot show the maker is dead.
- **Change:**
  - Drop the `Made by: R-2632 · land:` line and D10's `· ci-runs` part.
  - Keep `Read by: R-2632 · code: packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci-records.mjs`. It gives the same count (17).
  - Record the store honestly. Either list it as its own deliverable (R-2751) with `Made by · land ... · ci-runs` and a `person` or `Parked` reader, which grows the denominator by one, or add one FEAT-008 known-bug line saying the store has no code reader. The plan's "Known limits" already has the sentence. The owner's pick keeps the store either way.
  - D10's ordering question with report-at-land then disappears for this lane.

## SHOULD

### S1 · The budget can hand spawnSync 0 ms (no limit) or a fraction (throws)

- **What I did:** ran `spawnSync("sleep", ["2"], { timeout })` for 0, 1, 0.5, 1500.7, -1 and undefined (`attack/spawn-timeout.mjs`). I also ran the prototype with a `performance.now()` budget clock.
- **What happened (measured):**
  - `timeout: 0` ran the full 2,013 ms, so 0 means no limit. undefined ran 2,006 ms.
  - 1 ms: `ETIMEDOUT`.
  - 0.5, 1500.7 and -1 each threw `ERR_OUT_OF_RANGE ... must be an unsigned integer`.
  - The monotonic-clock prototype still read 7 records in 8.1 s. Every limit stays at the 30,000 ms cap until 30 s have passed, so a fraction only appears in reads that are already slow.
- **Why it matters:**
  - D3 says "each call gets the smaller of `CI_READ_TIMEOUT_MS` and the time left", and R-2756 says "once the budget has passed".
  - Suppose a builder checks `elapsed > budget`, or floors a remainder below 1 ms. The call that starts at the boundary gets `timeout: 0`, an unbounded gh call after the merge. That is the one way this step can hang a land with no limit. The window is about 1 ms, so it is rare (inferred), but the step exists to bound time.
  - A fractional remainder makes every later call fail at once as "gh could not start: The value of "timeout" is out of range". It does not hang, but the failure reason is wrong.
  - R-2756's stepped clock (25,000 per call against 60,000) never reaches equality. The stub never calls spawnSync, so neither edge can fail a planned test.
- **Change:**
  - Refuse a call when the remainder is below 1 ms. Pass `Math.min(CI_READ_TIMEOUT_MS, Math.ceil(remaining))`.
  - In `ghDefault`, a per-call limit that is not a positive integer raises an error, never "no limit".
  - R-2756 gains an equality case: a step of `budget / 2` lets exactly two calls start. It also gains a fractional-step case, and asserts every `options.timeoutMs` is an integer of at least 1.
  - Add one cross-platform `ghDefault` case: `ghDefault()(cwd, args, { env: { PATH: <empty dir> }, timeoutMs: 1500.5 })` returns an `ENOENT` error and does not throw.

### S2 · R-2750's row says "after the containment check"; its test pins only "after the lock"

- **What I did:** read nana-land.mjs:189-196 against the R-2750 test text.
- **What happened (from code):**
  - The test asserts each records call comes after the last `lock-exit` and finds main at the tip.
  - Suppose a read sits right after the lock (before :190), ahead of the post-merge checks, containment and release status. It satisfies both assertions.
- **Why it matters:**
  - The row is wider than its test.
  - In that position a slow read, up to 60 s, opens a window between the merge and the post-merge `refs/heads/main === tip` check. Another land moving main there yields a post-merge `refused:`. That is the plan's own worst harm.
  - For nana-pi a second land cannot merge within 60 s, because its own suite would see main move (inferred). A project with a short suite can.
- **Change:**
  - Log `runGit` calls in the R-2750 fixture. Assert that the containment `merge-base --is-ancestor <tip> refs/heads/main` call, and an injected `readReleaseStatus`, both come before the first records call.
  - Add one negative: a CI-green land whose suite fails makes exactly one gh call.

### S3 · Re-run attempts and the store name are under-tested

- **What I did:** the prototype kept c273b4de's 7 records (measured) with both macOS attempts. I then listed wrong names the R-2751 test cannot see.
- **What happened (from the test text):**
  - R-2751's state "holds three legs", one attempt each. A store that keeps only the newest record per leg passes. So does one named `<tip>_<leg>`, if the stamp check is loose.
  - Pair 7 (process-id names) is only half caught. The second `keepLandCiRecords` call runs in the same process, so `<artifact stamp>_<tip>_<pid>` gives the same three names and stays at three files.
  - In production, process-id names add a duplicate on every re-land. Two legs whose artifacts share a creation second also collide, because `created_at` has whole-second precision (measured: `...T210435000Z`), so one record overwrites the other.
- **Why it matters:** the threat model names "re-run attempts that leave two records for one leg (measured at c273b4de)". No test holds two attempts.
- **Change:**
  - Give R-2751's state a fourth artifact: macOS attempt 1 FAIL and attempt 2 PASS, with distinct times. Assert four files.
  - Assert each exact name, `<stamp>_<tip>_<run>-<leg>-<attempt>.json`.
  - Give two legs the same `created_at` second.
  - Run the second keep with a different injected pid (or in a child) and assert four files still.

### S4 · R-2752 never pins `CI_RECORDS_KEEP`

- **What happened (from the test text):** the land case (301 seeds, 304 left) only proves the land does not prune at 300. The direct case proves `keep: 2` works in the shared writer. A land that passes `keep: Infinity`, or no prune at all, passes both. The store then grows without bound.
- **Change:** take either route.
  - Seed `CI_RECORDS_KEEP + 1` zero-byte `.json` names with old stamps, imported and not literal. Assert `CI_RECORDS_KEEP` remain and the oldest seed is gone. That is about 4,000 tiny files; time it on the Windows leg.
  - Or inject `keepLandCiRecords` as a spy in one land and assert it receives `CI_RECORDS_KEEP`, `CI_RECORDS_BUDGET_MS` and `CI_SLOW_SHARE`. Then test the lib's prune default directly.

### S5 · Gaps in the one-note rule

- **Budget note against D8:**
  - D8 makes a code-1 read one note carrying the reader's closing line, `no readable record for <tip>`, which does not name the budget.
  - R-2756 asserts "exactly one note names the budget".
  - A builder will either add a second note, which breaks R-2755's "exactly one" invariant (R-2756 never checks it), or fail R-2756.
  - Change: say in D8 that when the budget ran out, the single `CI records` note names it, for example `CI records not read: stopped at the 60 s budget`. Say whether a code-0 read that hit the budget gets a note. R-2756 then also asserts exactly one line starting `[nana-land] note: CI records`.
- **Malformed return outside the guard:**
  - Suppose nana-land catches only the `keepLandCiRecords` call, then formats its result (`result.lines.join`) outside the try. Then `{}` or `undefined` throws into the outer catch, and the land prints `refused:` after the merge.
  - Case (e) only covers a throwing call.
  - Change: add R-2755 case (f), an injected `keepLandCiRecords` that returns `{}`. Expect exit 0 and one note.
- **Per-record storing:**
  - The threat model lists "an artifact creation time that does not parse". No test has it.
  - A loop that stops at the first bad record loses the others.
  - Also, an EBUSY prune throws after the rename (suite-records.mjs:97-101), so the record is kept but the note would say "not kept". FEAT-031's known bug at :74 is the same class.
  - Change: guard each record, aggregate into one note (`CI records not kept: 1 of 3: <reason>`), and add a case with one of three artifacts at `created_at: "not a date"`: two kept, one note.

### S6 · The tests embed tunables (nana-standards: "every other assertion imports the name")

- R-2754's 99.9 s, 100 s, 150 s and 199 s at a 200 s limit assume `CI_SLOW_SHARE` is 0.5. Retuning to 0.4 fails R-2754, not just the seal.
- R-2756's expected 30,000, 30,000 and 10,000 ms assume `CI_READ_TIMEOUT_MS` is 30,000.
- R-2752's 304 assumes `CI_RECORDS_KEEP` is at least `SUITE_RECORDS_KEEP + 4`.
- **Change:**
  - Derive the boundary as `CI_SLOW_SHARE * limitSeconds`, with one file just under it, one at it and one just over it.
  - Derive the call limits from `CI_READ_TIMEOUT_MS` and the injected budget.
  - Assert the keep precondition explicitly.
  - Leave only the seal test naming 0.5, 60,000, 4,000 and `nana/ci-runs`.

### S7 · R-2755's row is wider than D8

- The row reads "IF the CI-record read or its storing fails, because ... gh fails ...".
- D8 prints a note only when the reader returns code 1. One failed download among three readable records gives reader lines and no note. A reader of the row expects a note.
- **Change:** narrow the row to "IF the CI-record reader reads no record, storing a record fails, or the step throws", or add a note for partial failures and a test for it.

## NOTE

- **N1 · The `suffix` option repeats `pid` (measured).** `storeSuiteRecord` already takes `pid` and uses it only in the name (suite-records.mjs:80, :87). The prototype passed `pid: \`${run}-${leg}-${attempt}\`` and got the right names. Add only `subpath`; this passes the subtraction test.
- **N2 · Doubled prefix (measured).** The prototype note read `[nana-land] note: CI records not read: ci record: no CI run for efbb6124`. Strip the reader's `ci record:` prefix from the closing line inside the note.
- **N3 · Template projects get a note on every land (inferred from code; adopted repos measured).**
  - Among adopted home repositories, only nana-pi has a github.com origin and a workflow (measured).
  - But both language templates emit `.github/workflows/ci.yml` with no suite-record upload (measured: grep count 0). A scaffolded project on GitHub would print `CI records not read: no readable record` on every land, and pay about 4 gh calls.
  - A tip whose only workflow is not `ci.yml` gets `no CI run` every land.
  - Reword the known limit to name templates. Optionally treat "no run carries any `suite-record-` artifact" as silent.
- **N4 · "Read by code that acts" is inferred.**
  - The note is the same class as R-2550's classification: code judges, a person acts. The skeptic asked for exactly this action.
  - At 0.5 it fired on 0 of the last 9 lands (planner, measured) and on none at c273b4de (measured here). The acting part will usually be silent.
  - The seat's report should mark the deliverable claim as inferred from R-2547's precedent.
- **N5 · R-2753 says "applied to each collected file".** Self-test fixtures run under their own `timeoutMs: 3000` (test.mjs:237, :483, :541), while the record would name `TIMEOUT_MS`. Say "the default per-file limit", or exclude fixtures. The record-knob case already sets `NANA_TEST_TIMEOUT_MS: "800"`, so R-2753's expected value is the number 800.
- **N6 · Existing CI fixtures now take the failure path (measured).** main's `workflowRun` has no `path`, so every CI-green land test now prints `CI records not read: ... no CI run for <tip>`. The tests pass, but none exercises the success path. That is fine as long as the new file covers it; say so in the brief.
- **N7 · R-2754 cap test.** Put the record's slowest files after the first five in record order, so a cap applied before the sort fails.
- **N8 · README check.** Keep the store name in prose, as README.md:278 does for suite-runs. A backticked `nana/ci-runs` path may hit the readme check's path rule (inferred).
- **N9 · Windows rename.** Replacing on re-keep relies on libuv's rename replacing an existing target on Windows (inferred). An open handle there gives EPERM, which becomes one "not kept" note, not a refusal.

## Attack questions answered

| Question | Answer |
|---|---|
| Can the read refuse a land? | Only through S5's malformed-return path. A throw inside the guarded call is one note (R-2755 e). |
| Reverse a land? | No. The step writes only `.git/nana/ci-runs` and the temp folder, never refs or the work tree (from code). |
| Hang a land? | Bounded by each call's limit and the budget, except S1's 0 ms edge. A hung `gh` child is killed by spawnSync's limit; gh spawns no pipe-holding child for these calls (inferred). |
| Slow a land? | 8.0 to 8.1 s on a two-run tip (measured), about 3 to 4 s on a one-run tip (planner), and at most about 60 s. |
| No artifact yet, re-run attempt, gh missing or signed out, timeout | One note, or reader lines only. The CI read before the merge already refuses on gh missing, signed out or timing out. |
| Half-written download | A killed or failed download is skipped; the reader's `finally` removes the temp root (measured: empty after each run). |
| Cleanup failure | One reader line, code unchanged, no note. The temp folder is left behind (ci-records.mjs:169-172). |
| Windows paths and linked worktree vs main checkout | `suiteRecordsDir` resolves both relative and absolute common dirs (from code). R-2751 lists the store from a linked worktree. Real gh on Windows stays unproven (known limit). |
| Outside the lock, after containment | Outside the lock: pinned. After containment: not pinned (S2). |
| Colour-safe env in every reader call | Yes by D3, pinned by R-2750's env assertion. `GH_HOST` still leaks into the download (M1). |
| CI records in the local baseline, runtime map or test-locked's failure sort | No. Only suite-records.mjs and test-locked read `STORE_SUBPATH`, and nothing scans `nana/` broadly (measured by git grep). |
| Overwrite or duplicate across re-runs and attempts | The plan's names are unique per artifact and stable (measured, 7 names). Process-id names would slip through (S3). |
| Slow-file action | Prints a land note only. The share is a sealed, chosen tunable with measured provenance. |
| Breaks to main's behaviour | Exactly three land tests (measured), all fixed by narrowing. Also: ci-records.test.mjs's fake under M1's fix, and the tree count goes from 16 to 17 (measured). scripts/ci-records.mjs and test-locked are unchanged. |

## Wrong-code pairs

The plan's pairs 1 to 18 stand, with these caveats:

- Pair 7 is only partly caught (S3).
- Pair 8 catches `SUITE_RECORDS_KEEP` but not "no prune" (S4).
- Pair 3 is caught only by R-2750's new stub env check. Measured: with the prototype wrapper forwarding the reader's `process.env`, all 66 existing land tests pass, the POSIX fake-gh child included (`land-proto3.out`).

Add these:

| # | Wrong implementation | Caught by (after the change) |
|---|---|---|
| 19 | The budget check uses `elapsed > budget`, so the boundary call starts with `timeout: 0` | R-2756 equality case (S1) |
| 20 | An unrounded fractional remainder reaches spawnSync | R-2756 integer assertion and the `ghDefault` ENOENT case (S1) |
| 21 | `ghDefault` ignores the per-call `timeoutMs`, keeping 30 s per call (about 90 s total) | POSIX slow fake gh through `ghDefault()` with a 200 ms per-call limit, modelled on R-2589's slow-gh case |
| 22 | The download keeps `--repo owner/repo` | R-2750 with `GH_HOST` preset (M1) |
| 23 | The store keeps only the newest attempt per leg | R-2751 with two macOS attempts (S3) |
| 24 | The name uses `<stamp>_<tip>_<pid>` | R-2751 exact-name assertion and a second keep under another pid (S3) |
| 25 | The land prunes with `keep: Infinity`, or not at all | R-2752 with `CI_RECORDS_KEEP + 1` seeds, or the spy (S4) |
| 26 | The read sits between the lock release and the post-merge checks | R-2750 order assertion against the containment call and release status (S2) |
| 27 | The guard wraps only the call; a malformed return throws outside it | R-2755 case f (S5) |
| 28 | A spent budget with code 1 prints two `CI records` notes | R-2756 one-note assertion (S5) |
| 29 | One unparseable artifact time stops the remaining records being stored | the new bad-time case (S5) |
| 30 | Notes are capped before they are sorted | R-2754 record with the slowest files last (N7) |

## Files

- `<scratch>/land-ci-timings/attack/proto.mjs`, `proto-monotonic.mjs`, `spawn-timeout.mjs`
- `<scratch>/land-ci-timings/attack/nana-land-proto.diff`, `land-proto.out` (3 FAIL), `land-proto2.out` (all PASS after narrowing), `land-proto3.out` (all PASS with the raw-env wrapper)
- `<scratch>/land-ci-timings/attack/store/.git/nana/ci-runs/` (7 kept records from c273b4de)
