# Review — knowledge-index-recover (the knowledge build replaces a damaged index with one rebuilt from the sources and names the damage, status names it with the repair, and a damaged index stays unchanged while the sources file does not parse), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff 7aadbc99..HEAD` on `feat/knowledge-index-recover` (main was `7aadbc99` when this brief was written;
`git merge-base HEAD main` is `7aadbc99`). The lane branched from main 63aca2fb and merged main twice, fed7d7f9 at
ad3ae5d6 and 7aadbc99 at 870b4eee; neither merge changed a knowledge file. The plan of record is
`docs/reviews/knowledge-index-recover-2026-10-20/must-meet.md`: rows R-2400 to R-2407, with the must-meet changes at
its end winning over its first table, plus R-2408 and R-2409 from `build-brief-2.md`, so rows R-2400 to R-2409 and ten
checks. `plan-attack.md` holds the adversary's AMEND and the re-check adversary's GO-WITH-FIXES (eight fixes);
`build-brief-1.md` (with the seat's amendments and those fixes at its end) and `build-brief-2.md` are the two builds,
de48bcdb and 20462e77. The seat's record is `seat-verify-ef0cc663.md`. CI run 39509556799 on draft pull request #150
at 870b4eee reads 0 failing on all three legs: macOS 197 PASS, 0 FAIL, 2 SKIP of 199 files (8,051 checks pass, 36
skip); Ubuntu 196 PASS, 0 FAIL, 3 SKIP (7,990 pass, 56 skip); Windows 181 PASS, 0 FAIL, 18 SKIP (6,980 pass, 114 skip),
with recover.test.mjs 10 pass there, R-2407 included. The install check passes on macOS and Windows. The Windows leg's
log is `ci-windows-870b4eee.log` in this folder. The record also holds the macOS wrong-code pairs (`seat-mutate.mjs`;
27 of 28 red on 20462e77, B9 declared) and two independent checks: `independent-check-de48bcdb.md` (FINDINGS, one MUST
and one known bug, both fixed by build 2) and `independent-check-20462e77.md` (HOLDS over fourteen probes, no MUST).
The final reviewer's brief is `review-brief.md`. The land runs the locked suite on the reviewed tip, and the local
macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
ef0cc663, before the seat's notes commit):

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

The code under review: `packages/nana-knowledge/lib/build.ts`, the build that both seats' knowledge hooks start in
the background once the index is over an hour old, now checks every index it opens with `PRAGMA quick_check(1)`
(`lib/db.ts` `checkIndex`) and classifies SQLite codes 1, 11 and 26 as damage (`indexDamage`). With good sources it
deletes a damaged index inside the build lock and rebuilds it once; under a sources problem it checks an existing
index on a read-only handle first, keeps a damaged one unwritten, and finishes a healthy one as main does.
`bin/nana-knowledge.ts` names a recovery or a keep in one `build` line, and `status` names the damage and the repair
and exits 0.

Judge whether the lane fails open: a healthy, busy, write-locked, read-only or lock-held index deleted or replaced; a
check or delete before the build lock; a damaged index written under a broken sources file, or reported as rebuilt; a
damaged index left in place with its age refreshed, so the hooks stop starting builds; the hook no longer failing open,
or starting a build on every prompt over a healthy index; a test writing outside its temp homes or leaving a process
running; or a must-meet check that passes with the change removed. Judge whether it leaves a harm the review standard
lists, such as lost index rows, a broken hook on any platform, or a broken nana-setup install or project step. Judge
whether anything main does today stopped working: a healthy index's incremental build, its rows over missing and
unreadable roots, the index age and shown/ prune under a broken sources file, the empty index with no index.db,
`nana-setup` install's and project's knowledge steps, status's other lines, the hook's budget, and all three CI legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug:
`nana-setup project` reports a kept damaged index as `unchanged | rebuilt` where main said `skipped | rebuild failed`;
a 0-byte index.db under a broken sources file is reported damaged and kept where main created an empty index, and its
age never refreshes; status under a broken sources file names `build --rebuild`, which does nothing until the file is
fixed; a damaged index under a broken sources file keeps its old age, so every pull past the hour starts a build that
exits after the check; with good sources a recovery drops the rows of missing or unreadable roots, as `--rebuild`
does; SQLITE_ERROR counts as damage, so a bug in our own SQL would replace a good index with a partial one; on
Windows a reader holding the index makes the recovery's delete fail until the next build; quick_check misses damage
inside one record; the check costs about 85 ms on a 50 MB index; no check builds over an old -wal beside a damaged
index (B9), and the kept path leaves an empty -wal and a 32 KB -shm until the next read-write open; the two
Windows-only closes have no seat pair, so CI's Windows leg is their only run. The pairs and the independent checks ran
on macOS only.

Threat model: honest variation in our tools' output and the OS is in scope (random or zeroed bytes, a file cut short by
an interrupted copy, restore or sync tool, whole pages overwritten anywhere, docs or files tables of another shape;
a pull reading, another connection writing, another build holding the lock; a sources.json that does not parse or
cannot be read at the same time; on macOS, Linux and Windows); deliberate forgery is out (a crafted SQLite file, damage
inside one record's bytes).
Lane class: install, hook or gate — hook: both seats' knowledge hooks run the nana-knowledge CLI, and the background
build a pull starts is the code this lane changes.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
