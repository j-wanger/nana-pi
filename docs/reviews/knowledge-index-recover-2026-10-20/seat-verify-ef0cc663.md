# Seat checks — knowledge-index-recover builds 1 and 2, tip ef0cc663 (2026-10-20)

- Plan: 998b4848 (`must-meet.md`; `plan-attack.md`: one adversary, AMEND; `build-brief-1.md`) and 9bdcd32a (the
  must-meet changes from the seat's re-check on the knowledge-sources-unparseable land tip: R-2400 to R-2402 hold while
  sources.json parses, new R-2407). One adversary attacked those amendments: GO-WITH-FIXES with eight fixes (second
  section of `plan-attack.md`; `build-brief-1.md`'s "Adversary fixes" section, which wins where it differs). The lane
  branched from main 63aca2fb.
- Builds, by a pi gpt-5.6-sol builder through `pi-worker --lane-size larger` (the roster's larger-lane builder; two
  builds):
  - Build 1 is de48bcdb. `lib/db.ts` adds `DAMAGE_CODES` (SQLite primary codes 1, 11 and 26; contract: R-2400,
    R-2401), `IndexDamageError`, `indexDamage(err)` (`errcode & 0xff` in the set, or an IndexDamageError) and
    `checkIndex(db)` (`PRAGMA quick_check(1)`; anything but "ok" throws "database disk image is malformed: <first
    finding>"); openDb closes its handle when its setup throws. `lib/build.ts` reads sources.json once, inside the
    lock's `try`; buildLocked runs checkIndex after every open and closes its handle in a `finally`; build() catches
    once: damage under a sources problem returns stats with `keptDamage` and writes nothing, damage with good sources on
    a build that was not already a rebuild runs `buildLocked({ rebuild: true })` and sets `recovered`, and anything else
    is rethrown. `bin/nana-knowledge.ts` prints the kept line (`index was damaged (<reason>) — not rebuilt while
    sources.json has a problem; …`) and the sources marker and returns 0, prints the recovered line (`index was damaged
    (<reason>) — rebuilt from the sources`), gives MISSING and UNREADABLE the rebuild wording on a recovery, and status
    prints `index <db> is damaged (<reason>) — repair: nana-knowledge build --rebuild` and returns 0. The knowledge
    README gains the damaged-index paragraph, one fail-open sentence and the check's cost (about 85 ms at 50 MB); both
    0.1 s figures now say they predate the check. Rows R-2400 to R-2407 sit in FEAT-003 after R-208, with eight checks in
    the new `packages/nana-knowledge/tests/recover.test.mjs`.
  - ad3ae5d6 merges main fed7d7f9 (no knowledge file changed); 243dd09e is the seat's pairs on de48bcdb; b129164f is
    build brief 2 (the independent check's MUST and known bug, rows R-2408 and R-2409).
  - Build 2 is 20462e77. Under a sources problem with an index present, buildLocked first runs checkIndex on a
    read-only handle (damage: kept, as build 1), then reopens read-write without the schema step and finishes as main
    does: every row kept, `built_at` refreshed, the checkpoint run and shown/ pruned. With no index it creates an empty
    one, as main does. `SHOWN_TTL_MS` is exported for the test. Rows R-2408 and R-2409 follow R-2407, and
    recover.test.mjs holds ten checks.
  - 870b4eee merges main 7aadbc99 (before CI; no knowledge file changed). ef0cc663 adds only the seat's pairs on
    20462e77. The review base is 7aadbc99.
- CI run 39509556799 on draft pull request #150 at 870b4eee (build 2 plus the merge of main 7aadbc99) reads 0 failing
  on all three legs:
  - macOS 197 PASS, 0 FAIL, 2 SKIP of 199 files (8,051 checks pass, 36 skip).
  - Ubuntu 196 PASS, 0 FAIL, 3 SKIP of 199 files (7,990 checks pass, 56 skip).
  - Windows `199 files: 181 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6980 pass, 0 fail, 114 skip`
    (`ci-windows-870b4eee.log`); the 18 skipped files are main's declared set. recover.test.mjs `10 pass`, with no
    skip; R-2407 passes at log line 556. That settles the claim the re-check adversary most doubted: on Windows the
    kept path leaves index.db byte for byte for the random-bytes, half-truncated and page-overwritten fixtures. R-2400's
    page cases pass there too, so buildLocked's close lets the Windows delete go through.
  - The install check passes on macOS and Windows.
  - Build 1's run at ad3ae5d6 read 0 failing on macOS and Ubuntu; its Windows leg was cancelled as superseded.
  - Main's own known failures: Ubuntu's path-spelling GP1 and GP2 until linux-path-spelling landed (main ca27d86); a
    pull-request run's R-291 leaf-total failure, a merge artifact of GitHub's merge commit. Windows main reads 0 FAIL
    since 4be0b79 (desk files are declared skips). None showed.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, one shard):
  - On de48bcdb (`seat-mutate-output-de48bcdb.txt`, commit 243dd09e): 21 of 22 red, each exactly its named titles.
    Baselines: recover 8 PASS, sources-file 7 PASS, 0 FAIL each. B7 survived, as declared before the run: no check
    built with a broken sources file and no index.db.
  - On 20462e77 (`seat-mutate-output-20462e77.txt`, commit ef0cc663): 27 of 28 red, each exactly its named titles.
    Baselines: recover 10 PASS, sources-file 7 PASS, 0 FAIL each. The seat re-anchored B7 (build 1's early return,
    now red on R-2409) and B8 (build 1's sources-problem return, now red on R-2408), replaced B2 (skip both index
    checks on `--rebuild`; build 1's one-check form is green on build 2, because the read-only check and the reopen's
    check each catch damage alone) and added B9 to B14 on build 2's sites. B9 survived, as declared before the run:
    dropping the read-only check before the reopen matters only when an old -wal sits beside a damaged index under a
    broken sources file. On a scratch copy with a leftover committed -wal frame, B9's form checkpoints the frame into
    index.db while the tip keeps it byte for byte. No check builds over a leftover -wal.
  - Declared without a pair: the two Windows-only closes (openDb's catch and buildLocked's `finally`; each wrong form
    is green on macOS, because POSIX deletes an open file, so only CI's Windows leg can catch them); the `& 0xff` mask
    (no fixture throws an extended damage code); `if (opts.rebuild) throw err` in build()'s catch (only a failed delete
    reaches it); the recovered MISSING/UNREADABLE wording (a plan known limit); the kept branch's return before the
    totals; problemStats' `keptDamage` field; the WAL checkpoint alone under a sources problem (closing the last
    connection checkpoints anyway); the module headers.
- Independent checks, two runs, each in a private clone with a temp HOME on macOS:
  - On build 1, de48bcdb (`independent-check-de48bcdb.md`): FINDINGS, one MUST, nine probes.
    1. MUST: a healthy index under a broken sources file no longer refreshed its age or pruned shown/. buildLocked
       opened every index read-only under a sources problem and returned before `built_at`, the checkpoint and the
       prune. With a 32 h old index, 5 pulls started 5 background builds against 1 on main, and R-210's 7-day prune
       stopped. Settled in build 2, 20462e77: a read-only check, then a read-write reopen that finishes as main does;
       R-2408 pins it.
    2. Known bug: with a broken sources file and no index, the build left no index.db, though it printed the db path;
       nana-setup's install step then reported `skipped | build failed`. Settled in build 2, 20462e77: R-2409 pins the
       empty index, and the build-2 check's P10 sees install report `created | files 0 · rows 0`.
    3. Its HANDOFF note: the knowledge-sources-unparseable residual on the index age became untrue. Settled in this
       commit: that line is rewritten (below).
  - On build 2, 20462e77 (`independent-check-20462e77.md`): HOLDS, no MUST, fourteen probes (P1 to P10, P12 to P15).
    Single-file runs: recover 10, incremental-build 30, unreadable-root 7, sources-file 7, hook 98, discovery 37,
    extension 38, all PASS. Held: a rebuild over a missing root drops its rows, the recorded trade (P1); a read-only
    index.db and a read-only knowledge folder are never deleted, as on main (P2, P3); a healthy index with an
    uncheckpointed -wal under a broken sources file keeps its WAL row and refreshes its age (P4); an unreadable sources
    file over a random-bytes index keeps its hash (P5); the real CLI hook heals a stale page-damaged index end to end
    (P7, R-2402); a stale -wal and -shm with no index.db (P8); install over a broken sources file and no index (P10,
    R-2409); a 3,032-file, 5.4 MB index with page 790 overwritten is named by status and rebuilt with every row (P12;
    its no-op build took 107 ms on main and 121 ms on the tip); `--rebuild` over a healthy index under a broken sources
    file prints main's lines (P13). Its findings and how each was settled:
    1. Known bug: `nana-setup project` reports the index as `unchanged | rebuilt` after a build that kept a damaged
       index under a broken sources file; main said `skipped | rebuild failed` (P9). The kept path prints no totals
       line, so project falls back to the word "rebuilt". Not fixed: the knowledge-sources-unparseable residual on
       project setup's refresh summary is rewritten to carry it.
    2. Known bug: with a broken sources file, a 0-byte index.db is reported as damaged and kept, where main created an
       empty index; its age never refreshes (P6). Rare. Not fixed: a HANDOFF residual.
    3. Known limit, by design (R-2407): a damaged index under a broken sources file keeps its old age, so every pull
       past the hour starts a background build that exits after the page check (P14). Not changed: the rewritten
       index-age residual carries it.
    4. Known bug: under a broken sources file, status names `build --rebuild` as the repair, which does nothing until
       sources.json is fixed (P15). Not fixed: a HANDOFF residual.
    5. Its HANDOFF notes: Next item 8 (the plan sits outside the repo) is dropped; the index-age and refresh-summary
       residuals are rewritten; the Landed line, the session entry and the plan's known limits are added; the doctor
       residual on a corrupt knowledge index stays, since it is still true. All settled in this commit.
    6. It saw an older `<tmp>/nk-recover-de48.*` repo copy in the OS temp folder, left by an earlier run. It is still
       there at this commit; it sits inside the temp folder, outside the working folder, so the seat leaves it.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 7aadbc99, run at ef0cc663):
  ```
  tree movement 7aadbc9..ef0cc66: 10 rows in 1 features
  FEAT-003 · Index and connect existing knowledge sources
    R-2400 new (implemented)
    R-2401 new (implemented)
    R-2402 new (implemented)
    R-2403 new (implemented)
    R-2404 new (implemented)
    R-2405 new (implemented)
    R-2406 new (implemented)
    R-2407 new (implemented)
    R-2408 new (implemented)
    R-2409 new (implemented)
  ```
  CAP-01 moves from 210 to 220 rows and FEAT-003 from 55 to 65. No existing row changed.
- Rows: R-2400 to R-2409 read `implemented` in REQUIREMENTS.md. At the notes commit (no code or row changed since
  20462e77 and the merge): `node scripts/requirements-trace.mjs` reads `requirements: 1714 total (1482 implemented · 1
  planned · 37 retired · 189 untested · 5 violated); 1482 traced by tests` and `ears: 0 rows off form (allowance 0)`;
  `npm run map:check` reads 371 modules, 0 problems; `npm run readme:check` reads 737 claims, 0 problems.
- HANDOFF: one Landed line; Next item 8 dropped; two knowledge-sources-unparseable residuals rewritten (the index age,
  the refresh summary); new residuals naming this lane for the plan's ten known limits, the re-check's other known
  limits, the adversary's three, the build-2 check's two other known bugs and the three pairs gaps.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Not in this record: a seat-run locked full suite (the land runs it on the reviewed tip), Windows-only wrong-code
  pairs, and the local macOS install check, which runs before the land.
