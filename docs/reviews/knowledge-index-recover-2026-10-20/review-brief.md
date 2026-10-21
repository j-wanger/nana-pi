# Review — knowledge-index-recover (the knowledge build replaces a damaged index with one rebuilt from the sources and names the damage, status names it with the repair, and a damaged index stays unchanged while the sources file does not parse), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff 7aadbc99..HEAD` on `feat/knowledge-index-recover` (main was `7aadbc99` when this brief was written;
`git merge-base HEAD main` is `7aadbc99`). The lane branched from main 63aca2fb and merged main twice, fed7d7f9 at
ad3ae5d6 and 7aadbc99 at 870b4eee; neither merge changed a knowledge file. The plan of record is
`docs/reviews/knowledge-index-recover-2026-10-20/must-meet.md`: rows R-2400 to R-2407, with the must-meet changes at
its end winning over its first table, plus R-2408 and R-2409 from `build-brief-2.md`, so rows R-2400 to R-2409 and ten
checks. `plan-attack.md` holds the adversary's AMEND and the re-check adversary's GO-WITH-FIXES (eight fixes);
`build-brief-1.md` carries the seat's amendments and those fixes at its end, and wins where it differs from the
must-meet. The builds: build 1 de48bcdb and build 2 20462e77, by a pi gpt-5.6-sol builder. The seat's record is
`seat-verify-ef0cc663.md`. CI run 39509556799 on draft pull request #150 at 870b4eee reads 0 failing on all three legs:
macOS 197 PASS, 0 FAIL, 2 SKIP of 199 files (8,051 checks pass, 36 skip); Ubuntu 196 PASS, 0 FAIL, 3 SKIP (7,990 pass,
56 skip); Windows 181 PASS, 0 FAIL, 18 SKIP (6,980 pass, 114 skip), with recover.test.mjs 10 pass there, R-2407
included. The install check passes on macOS and Windows. The Windows leg's log is `ci-windows-870b4eee.log` in this
folder. The record also holds the macOS wrong-code pairs (`seat-mutate.mjs`; 21 of 22 red on de48bcdb with B7
surviving; 27 of 28 red on 20462e77, B7 now red on R-2409 and B9 declared; records `seat-mutate-output-de48bcdb.txt`
and `seat-mutate-output-20462e77.txt`) and two independent checks: `independent-check-de48bcdb.md` (FINDINGS, one MUST
and one known bug, both fixed by build 2) and `independent-check-20462e77.md` (HOLDS over fourteen probes, no MUST,
three known bugs and one known limit, now HANDOFF residuals). ef0cc663, after CI's commit, adds only the seat's pairs
record. The land runs the locked suite on the reviewed tip, and the local macOS install check runs before the land.

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

CAP-01 moves from 210 to 220 rows and FEAT-003 from 55 to 65. No existing row changed.

The code under review: `packages/nana-knowledge/lib/db.ts` (`DAMAGE_CODES` 1, 11 and 26; `IndexDamageError`;
`indexDamage`; `checkIndex`, a `PRAGMA quick_check(1)`; openDb closing its handle when setup throws), `lib/build.ts`
(sources read once inside the lock's `try`; under a sources problem with an index present, a read-only check before a
read-write reopen without the schema step; checkIndex after every open; the handle closed in a `finally`; build()'s
one catch that keeps a damaged index under a sources problem, retries once with `rebuild: true` otherwise, and
rethrows anything else; `SHOWN_TTL_MS` exported) and `bin/nana-knowledge.ts` (the recovered and kept lines in `build`,
the rebuild wording for MISSING and UNREADABLE on a recovery, the damage line and exit 0 in `status`). Tests: the new
`packages/nana-knowledge/tests/recover.test.mjs` (R-2400 to R-2409). The knowledge README gains the damaged-index
paragraph, one fail-open sentence and the check's cost. The rest of the diff is the plan, the seat's records, the
generated code map and tree, HANDOFF and the session entry.

Judge whether, while sources.json parses, a build over an index.db that is not a database, is truncated, has a whole
page overwritten, or has a docs or files table of another shape replaces it with one rebuilt from the sources, through
`build`, `build --rebuild` and the background build a pull starts, and names the damage in one stdout line; whether
`status` names the damage and `nana-knowledge build --rebuild` and exits 0; whether a write-locked index, one under
another build's lock, a read-only one or a healthy one with an uncheckpointed -wal is never deleted or replaced;
whether, while sources.json does not parse, a damaged index stays byte for byte and the build says it was not rebuilt,
a healthy one keeps every row with its age refreshed and shown/ pruned, and a missing one becomes an empty index; and
whether a healthy index with good sources builds as on main. One output differs from main by mistake, a carried known
bug: after a build that keeps a damaged index under a broken sources file, `nana-setup project` reports `unchanged |
rebuilt` where main said `skipped | rebuild failed`.

Threat model: honest variation in our tools' output and the OS is in scope (random or zeroed bytes, a file cut short by
an interrupted copy, restore or sync tool, whole pages overwritten anywhere, docs or files tables of another shape;
a pull reading, another connection writing, another build holding the lock; a sources.json that does not parse or
cannot be read at the same time; on macOS, Linux and Windows); deliberate forgery is out (a crafted SQLite file, damage
inside one record's bytes).
Lane class: install, hook or gate — hook: both seats' knowledge hooks run the nana-knowledge CLI, and the background
build a pull starts is the code this lane changes.

Check: (1) the must-meet checks are not vacuous: each pair named in the seat's record turns its check red (27 of 28 on
20462e77; B9 declared) — judge whether any must-meet check is still unproven, including the two Windows-only closes
that only CI's Windows leg exercises; (2) no fail-open: no healthy or merely busy index is ever deleted or replaced,
the damage codes never take a busy, locked, read-only or I/O error, and nothing is checked or deleted before the build
lock; (3) a damaged index under a broken sources file is never written, and the line says it was not rebuilt; (4)
nothing main does today stopped working: a healthy index's incremental build, the index age and shown/ prune under a
broken sources file, the empty index with no index.db, the hook's fail-open and budget, nana-setup install's and
project's knowledge steps, and status's other lines, on all three CI legs; (5) the tests write only inside the temp
homes they own and leave no process running; (6) every README sentence the lane changed is true; (7) HANDOFF and the
session entry are true, including the Landed line, the dropped Next item, the two rewritten residuals and the 23 new
ones; (8) any MUST.
