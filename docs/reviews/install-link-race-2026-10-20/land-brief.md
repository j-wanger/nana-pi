# Review — install-link-race (install holds its settings lock through the PATH entries, so a second install stops at the lock instead of racing the first on a link), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff c203f485..HEAD` on `feat/install-link-race` (main was `c203f485` when the lane merged it at
`f52a33fe`; `git merge-base HEAD main` is `c203f485`). Main has since moved to `0305bc8d` through the
realpath-strict-fallback and post-edit-values-named lands, which touch neither `install()`, the lane's test nor the
setup README's lock paragraph. The plan of record is `docs/reviews/install-link-race-2026-10-20/must-meet.md`: four
must-meet checks, rows R-2260 to R-2263. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one
build (8bdd8375). The seat's record is `seat-verify-f52a33fe.md`: CI run 39413207254 at f52a33fe, 0 failing files on
macOS, Ubuntu and Windows (`ci-windows-f52a33fe.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 9 of 9 red,
0 survived), the seat's real-process probe, and the independent check (`independent-check-f52a33fe.md`: HOLDS, no
MUST, nine probes plus the must-meet file, run on f52a33fe). The final reviewer's brief is `review-brief.md`. The local
macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement c203f48..fba9215: 4 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-2260 new (implemented)
  R-2261 new (implemented)
  R-2262 new (implemented)
  R-2263 new (implemented)
```

The code under review: `install()` in `packages/nana-setup/lib/steps.mjs` takes the O_EXCL settings lock once and now
holds it through retired artifacts, hooks, rules, skills, settings, shared memory, pi config, subagent config, the
reviewer agent and the four PATH entries. It releases the lock before the knowledge build, the desk step and pi
registration. The dry run runs the same steps with no lock. The knowledge index row now prints after the PATH rows.
`lib/fsops.mjs` is unchanged. The new `packages/nana-setup/tests/install-overlap.test.mjs` starts a real second install
on the same home at the first install's PATH step.

Judge whether the lane fails open: a second install that still writes, or crashes the first, while the first holds the
lock; a lock that is not released on some path out of the locked steps, so the next install refuses with no run
holding it; a lock removed that another run made; or a dry run that now blocks or writes. Judge whether it leaves a
harm the review standard lists: a broken install on macOS, Linux or Windows; data lost or corrupted in an owner's home,
such as a backup replaced or a link written over; or a test writing outside the temp home it owns, or leaving a
process or a lock behind. Judge whether anything main does today stopped working: install's rows, exit codes and
removal line under a held or leftover lock, the dry run, uninstall, doctor, the Windows shims, and both CI install-check
legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a kill
during shared memory through PATH now leaves a stale lock, where before the lock was already released there (the next
run prints the removal line; the lock is held a median 15 ms against main's 18 ms); pi registration and the desk step
run after the release, which the independent check probed and no test pins; a second install started after the release
runs beside the first run's knowledge build, desk step and pi registration; two installs with different
`--claude-home` values over one pi home are not kept apart; an uninstall racing an install is untested; fsops keeps its
look-then-act gaps, reachable only by a writer that ignores the lock.

Threat model: honest variation in our tools' output and the OS is in scope (two terminals, a seat and the owner, or two
checkouts running install at once on one home; macOS and Linux links, Windows shims and copies; a run killed or
interrupted mid-install); deliberate forgery is out, such as a process that ignores the lock or races links on
purpose. Lane class: install, hook or gate — nana-setup install (how long install holds its settings lock).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Base note (the seat, after this brief was written)

Since `4249067c`, the seat merged main `0305bc8d` (the post-edit-values-named land tip, after realpath-strict-fallback) into the lane at `e045872f`, regenerating the code map and the requirements tree. Review this lane's own change as `git diff main...HEAD` (three dots: against the merge base) and the merge as `git show --remerge-diff e045872f` if your git supports it. This round covers the merged tip; no separate confirmation round is planned. The land reviewer is pi gpt-6-astra through pi-review (the owner's call, 2026-10-20).
