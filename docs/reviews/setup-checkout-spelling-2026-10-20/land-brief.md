# Review — setup-checkout-spelling (nana-setup treats every spelling of its checkout folder as that folder: install, doctor, uninstall and the session-start stale-copy line), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (doctor and stale-line rows under FEAT-015, uninstall under FEAT-018, the runner's declared skip under FEAT-031)

Review `git diff cdf4b098..HEAD` on `feat/setup-checkout-spelling`. The lane branched from main `6bc2f727`; the seat
merged main `cdf4b098` into it at `06e9b65d`, so `git merge-base HEAD main` is `cdf4b098`. Main has since moved to
`8466795b` (doctor-fix-line landed; it changed `packages/nana-setup/lib/doctor.mjs` outside this lane's lines), so the
land needs a merge of main, a re-run of the pairs and a confirmation round on the merged tip. The plan of record is
`docs/reviews/setup-checkout-spelling-2026-10-20/must-meet.md`: rows R-1980 to R-1985 (block R-1980 to R-1989).
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds (6bf3c850;
5c5e287b, which adds row R-1986 and changes only tests and the runner's declared skip). The seat's record is
`seat-verify-06e9b65d.md`: CI run 39375927343 at 06e9b65d, 0 failing files on macOS, Ubuntu and Windows, with Windows
running the letter-case, lowercase-drive and 8.3 spellings natively (`ci-windows-06e9b65d.log` beside it); the macOS
wrong-code pairs in POSIX form and forced win32 (`seat-mutate.mjs`; 10 of 14 red on 6bf3c850, M5, M6, M7 and M11
survived, each declared); and the independent check (`independent-check-6bf3c850.md`: HOLDS, no MUST, ten probes, run
on build 1). The final reviewer's brief is `review-brief.md`. The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement cdf4b09..06e9b65: 7 rows in 4 features
FEAT-013 · Install and connect harness runtimes
  R-1981 new (implemented)
  R-1982 new (implemented)
  R-1984 new (implemented)
FEAT-015 · Diagnose the active environment
  R-1980 new (implemented)
  R-1983 new (implemented)
FEAT-018 · Update or remove managed components safely
  R-1985 new (implemented)
FEAT-031 · Run checks reliably and without contaminating work
  R-1986 new (implemented)
```

The code under review: `pkgRoot` through the pack's `realPath` in `packages/nana-setup/lib/paths.mjs`, and every
compare of a path against the checkout in `stale-copies.mjs`, `doctor.mjs`, `steps.mjs`, `hook-health.mjs`,
`settings.mjs` and `uninstall.mjs` moved to `realPath(x, { mustExist: true })`; `realpathSafe` becomes `realPath(p)`.
`nana-setup install`, doctor and uninstall run these over the owner's real home, and the Claude Code adoption hook and
pi's rulings extension run the stale-copy check at every session start. The runner's declared skip sits in
`scripts/test.mjs` and `packages/nana-pack/lib/test-runner-config.mjs`.

Judge whether the lane fails open: uninstall taking a link outside the checkout for one of its own, so it unlinks an
owner's link; install or doctor taking a foreign link, hook entry or pi package entry for this checkout's, so a
misdirected link reads ✓ or install keeps it; the stale-copy line going silent while a copy is stale; or the declared
skip hiding the test file on a volume that has a second spelling. Judge whether it leaves a harm the review standard
lists: data lost or corrupted in the home (the one-time convergence of an earlier-spelling home relinks links,
rewrites hook commands and, on Windows, rewrites launcher files with a dated backup each); a broken install or hook (a
hook command or launcher that no longer starts, an install that keeps rewriting); or a test writing outside the temp
folders it owns. Judge whether anything main does today stopped working: install, doctor and uninstall on a home
installed with no change of spelling, pi registration in a linked worktree, the stale-copy line, and the existing
nana-setup test files, on any of the three CI legs. One change is disclosed as a small regression: uninstall now
leaves a knowledge hook entry an earlier install wrote through another spelling, which main's uninstall through that
same spelling removed (POSIX only). The plan's other known limits that HANDOFF records (the unchecked retired-hook,
`pathVisibleNode` and rulings-extension paths; uninstall's root compare; the desk plist; a subst or mapped drive;
`realpathSafe`'s fallback on a non-missing error) are known limits unless the review standard lists them as harms.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; letter case on
a case-insensitive volume, a lowercase drive letter, a Windows 8.3 short name, and what an earlier install wrote under
such a spelling); deliberate forgery is out (a forged link, a hand-edited entry naming a look-alike path). The home's
own spelling is out of scope. Lane class: install, hook or gate — it changes nana-setup install, doctor and uninstall,
the session-start stale-copy producer, and a pi extension's dependency.

Check: (1) no fail-open; (2) no listed harm, the uninstall regression judged against the standard; (3) nothing main
does today stopped working, on any of the three CI legs; (4) HANDOFF and the session entry are true; (5) any MUST.
