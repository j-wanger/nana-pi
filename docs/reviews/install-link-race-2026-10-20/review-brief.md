# Review — install-link-race (install holds its settings lock through the PATH entries, so a second install stops at the lock instead of racing the first on a link), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff c203f485..HEAD` on `feat/install-link-race` (main was `c203f485` when the lane merged it at
`f52a33fe`; `git merge-base HEAD main` is `c203f485`). Main has since moved to `0305bc8d` through the
realpath-strict-fallback and post-edit-values-named lands, which touch neither `install()`, the lane's test nor the
setup README's lock paragraph; a trial merge conflicts only in the generated code map and tree. So the land needs a
merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/install-link-race-2026-10-20/must-meet.md`: four must-meet checks, rows R-2260 to R-2263.
`plan-attack.md` holds the adversary's AMEND, which replaced the planner's fsops hardening with the lock move;
`build-brief-1.md` is the one build (8bdd8375). The seat's record is `seat-verify-f52a33fe.md`: CI run 39413207254 on
draft pull request #126 at f52a33fe, 0 failing files on all three legs, with R-2260 to R-2263 passing by title on
native Windows (the Windows suite log `ci-windows-f52a33fe.log` beside it); the wrong-code pairs (`seat-mutate.mjs`;
`seat-mutate-output-f52a33fe.txt`, 9 of 9 red, 0 survived); the seat's real-process probe; and the independent check
(`independent-check-f52a33fe.md`: HOLDS, no MUST, nine probes plus the must-meet file, run on f52a33fe). The local
macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base
`c203f485`):

```
tree movement c203f48..fba9215: 4 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-2260 new (implemented)
  R-2261 new (implemented)
  R-2262 new (implemented)
  R-2263 new (implemented)
```

CAP-04 moves from 474 to 478 rows, FEAT-013 from 180 to 184 and SUB-014 from 37 to 41. No existing row changed.

The code under review: `install()` in `packages/nana-setup/lib/steps.mjs`, whose one `withSettingsLock` call now runs
retired artifacts, hooks, rules, skills, settings, shared memory, pi config, subagent config, the reviewer agent and
PATH, in main's order (the closure renamed `fileSteps`); the knowledge build then runs after the release, followed by
the desk step and pi registration as before. The dry run runs the same closure with no lock. The header's `@outputs`
and `@errors`, and the setup README's lock paragraph with two known limits. Tests: the new
`packages/nana-setup/tests/install-overlap.test.mjs`, which wraps `fs` and `child_process` through their CommonJS
builtins, starts a real second `nana-setup install --home <same home>` at the first install's first lstat of
`<bin>/pi-review`, records the lock at every look of the ten later targets and at the knowledge build's spawn, and
restores the wraps in `finally`.

Judge whether a second install started while the first writes any of its file steps now exits 2 with the lock message
and writes nothing, while the first finishes with no ✗ row; whether the lock is taken once and is gone before the
knowledge build, the desk step and pi registration, so a Ctrl-C there still leaves no lock; whether the dry run still
takes no lock; whether a failure inside a step still releases the lock; and whether install's rows are main's, with
only the knowledge index row moved after the four PATH rows.

Threat model: honest variation in our tools' output and the OS is in scope (two terminals, a seat and the owner, or two
checkouts running install at once on one home; macOS and Linux links, Windows shims and copies; a run killed or
interrupted mid-install; forced win32 on a POSIX host); deliberate forgery is out, such as a process that ignores the
lock or races links on purpose. Lane class: install, hook or gate — nana-setup install (how long install holds its
settings lock).

Check: (1) the must-meet checks are not vacuous: each fails on main's `install()` or on the wrong code its pair names
(M1 to M9), each requires that its wrap fired, and R-2260 to R-2263 run natively on the Windows leg; (2) the lock is
released on every path out of `fileSteps`, a throw included, and never removed when another run made it; (3) nothing
main does today stopped working: install and `install --dry-run` under a held lock, a leftover lock's removal line,
uninstall, doctor, the install rows and their exit codes, and both CI install checks; (4) the test writes only inside
the temp home it owns, restores every wrap, and leaves no second process or lock behind; (5) the README paragraph and
the steps header say what the code does; (6) the known bugs are recorded honestly: the wider span where a kill leaves a
lock, pi registration and the desk step after the release with no test, two Claude homes over one pi home, an
uninstall beside an install, and fsops' look-then-act gaps; (7) HANDOFF and the session entry are true, including the
reworded install-honest-report lock residual and the edited killed-run line; (8) any MUST.

## Base note (the seat, after this brief was written)

Since `4249067c`, the seat merged main `0305bc8d` (the post-edit-values-named land tip, after realpath-strict-fallback) into the lane at `e045872f`, regenerating the code map and the requirements tree. Review this lane's own change as `git diff main...HEAD` (three dots: against the merge base) and the merge as `git show --remerge-diff e045872f` if your git supports it. This round covers the merged tip; no separate confirmation round is planned. The land reviewer is pi gpt-6-astra through pi-review (the owner's call, 2026-10-20).
