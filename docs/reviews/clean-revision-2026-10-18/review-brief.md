# Review — clean-revision (a checkout git calls clean reviews and lands at its plain HEAD), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-007 · Review a specific revision independently

Review `git diff a0e0a69..HEAD` on `feat/clean-revision` (the lane last merged main at `a0e0a69`, in `77289a0`; `git
merge-base HEAD main` is `a0e0a69`, and main has since moved on to `06a874a`). The diff shows exactly the lane's change:
its earlier merge of win-review-paths (`1103da1`) is on main. The plan of record is
`docs/reviews/clean-revision-2026-10-18/must-meet.md`: MM1 to MM8 (rows R-1370 to R-1377) and the R-708 and R-709
amendments; build 2 added R-1378. `plan-attack.md` holds the adversary's AMEND (an alternates file, not the environment
variable), which wins over `plan-design.md`; `plan-inventory.md` holds the sites. `build-brief-1.md` and
`build-brief-2.md` are the two builds. The seat's record is `seat-verify-a099700.md`: CI run 39257938251 (the Windows log
beside it), the wrong-code pairs (`seat-mutate.mjs`, outputs for 57e542b and 77289a0 beside it) and the independent check
(`independent-check-a099700.md`, run on 57e542b; its MUST was fixed in build 2).

Tree movement (the lane's own report, `node scripts/requirements-moved.mjs --root . --base a0e0a69`):

```
tree movement a0e0a69..a099700: 11 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-708 text changed; also applies: FEAT-008
  R-709 text changed
  R-1370 new (implemented)
  R-1371 new (implemented)
  R-1372 new (implemented)
  R-1373 new (implemented)
  R-1374 new (implemented)
  R-1375 new (implemented)
  R-1376 new (implemented)
  R-1377 new (implemented)
  R-1378 new (implemented)
```

The code under review: `workingState` in `packages/nana-pack/bin/review-round.mjs` (a HEAD-seeded scratch index, a
scratch object folder borrowing the repo's objects through its alternates file, `scratchGit`'s three pins, the `--out`
reset, nested-repository records), `gitOut`'s `env` option, the module header and the pack README's revision paragraph.
Tests: review-ledger, immutable-review and land (the nine must-meet checks; three collapse checks removed under R-709),
win32-launch (its plain-sha check now commits a 100755 file) and requirements-tree (the leaf total).

Judge whether a checkout git calls clean now derives the plain HEAD sha and lands — a lost execute bit under
`core.fileMode=false`, a CRLF checkout under `core.autocrlf=true`, with or without `core.safecrlf`; whether dirty states
stay distinct wherever git would record distinct content (untracked files, nested repositories, the review's own output
excluded); whether a derivation leaves the real git folder, index, objects and hooks untouched; and whether anything main
does today stopped working.

Threat model: honest variation in our tools' output and the OS is in scope (git config such as fileMode, autocrlf,
safecrlf, splitIndex and hooks; attributes and filters; linked worktrees; special characters in a path; NTFS on
Windows); deliberate forgery is out. Lane class: gate (review-round's `workingState`, behind pi-review and nana-land).

Check: (1) R-1370 to R-1378 are not vacuous: each fails with its feature removed; (2) no fail-open: no tree whose content
git would record differently from HEAD derives plain HEAD and lands, including the held probes P5 and P12; (3) a
derivation writes nothing in the real git folder and runs no hook, and its scratch folder goes on every exit but a kill;
(4) R-709's narrowing and the three removed collapse checks drop nothing main still needs; (5) nothing main does today
stopped working on macOS; (6) HANDOFF and the session entry are true; (7) any MUST.
