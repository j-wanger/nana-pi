# Review — setup-checkout-spelling (nana-setup treats every spelling of its checkout folder as that folder: install, doctor, uninstall and the session-start stale-copy line), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (doctor and stale-line rows under FEAT-015, uninstall under FEAT-018, the runner's declared skip under FEAT-031)

Review `git diff cdf4b098..HEAD` on `feat/setup-checkout-spelling`. The lane branched from main `6bc2f727`; the seat
merged main `cdf4b098` (review-test-waits' land tip) into it at `06e9b65d`, so `git merge-base HEAD main` is
`cdf4b098`, and that diff is the lane's own change. Main has since moved to `8466795b` (doctor-fix-line landed; it
changed `packages/nana-setup/lib/doctor.mjs` outside this lane's lines, `bin/nana-setup.mjs` and the setup README), so
the land needs a merge of main, a re-run of the pairs and a confirmation round on the merged tip.

The plan of record is `docs/reviews/setup-checkout-spelling-2026-10-20/must-meet.md`: six must-meet checks, rows R-1980
to R-1985 (block R-1980 to R-1989), the design and the known limits. `plan-attack.md` holds the adversary's AMEND.
`build-brief-1.md` is build 1 (rows 86e1e71c, tests first 8fa24d53, code 6bf3c850); `build-brief-2.md` is build 2
(5c5e287b), which fixed CI's Ubuntu failure with a declared skip (row R-1986) and a Windows pi-registration check that
compared through `fs.realpathSync`, both with no nana-setup code change. The seat's record is `seat-verify-06e9b65d.md`:
CI run 39375927343 on draft pull request #103 at 06e9b65d, 0 failing files on all three legs, the Windows leg running
the letter-case, lowercase-drive and 8.3 spellings natively (`ci-windows-06e9b65d.log` beside it; build 1's
`ci-windows-6bf3c850-build1.log` too); the wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-6bf3c850.txt`: 10
of 14 red, M5, M6, M7 and M11 survived, each declared; run on macOS in POSIX form and forced win32); and the
independent check (`independent-check-6bf3c850.md`: HOLDS, no MUST, ten probes, run on build 1; its one known bug, an
earlier-spelling knowledge hook entry uninstall leaves, recorded as a residual). The local macOS install check runs
before the land.

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

CAP-04 moves from 416 to 422 rows, FEAT-013 from 156 to 159 (SUB-013 32 to 34, SUB-014 32 to 33), FEAT-015 from 96 to
98 and FEAT-018 from 21 to 22; CAP-07 from 306 to 307 and FEAT-031 from 91 to 92.

The code under review: `pkgRoot` through the pack's `realPath` in `packages/nana-setup/lib/paths.mjs`; the compares
moved from `fs.realpathSync` to `realPath(x, { mustExist: true })` in `stale-copies.mjs` (`linkOk`), `doctor.mjs`
(`skillLinkState`), `steps.mjs` (`linkSkill`'s foreign-link test, the two retired-hook compares, `pathVisibleNode`'s
candidate, and `realpathSafe`, now `realPath(p)`), `hook-health.mjs` (the win32 settings rows), `settings.mjs`
(`knowledgeHookHealthy`) and `uninstall.mjs` (`repoReal`, preflight targets, per-link removal target); the setup
README's Known-limits bullet and tests-table row; and the declared skip in `scripts/test.mjs` with
`checkoutSpellingSkipReason` in `packages/nana-pack/lib/test-runner-config.mjs`. The checks sit in the new
`packages/nana-setup/tests/checkout-spelling.test.mjs`, in `packages/nana-pack/tests/test-runner.test.mjs` (R-1986),
and in `packages/nana-setup/tests/pi-registration.test.mjs`'s changed linked-worktree check.

Judge whether, run through a second spelling of the checkout's folder, doctor gives the same rows, install exits 0 and
changes no byte under the home, and the stale-copy producer prints nothing; whether a home an earlier install wrote
through another spelling still reads as this checkout's (links, hook entries, pi package entries) and uninstall's
preview would unlink its links; and whether a home installed with no change of spelling behaves exactly as on main.
Judge the one-time change the plan chose: an earlier-spelling home converges at its next install (POSIX: links relinked
and the knowledge hook command rewritten; Windows: six hook entries and eight launcher files rewritten, each launcher
file with a dated backup). Judge whether the declared skip runs the file wherever a second letter-case spelling
exists, and skips it only where none does. Judge too whether each check would fail with its behaviour removed: the
pairs cover macOS in both forms; on Windows only CI's native passing run exists, and no pair or run of main's code
there.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; letter case on
a case-insensitive volume, a lowercase drive letter, a Windows 8.3 short name, and what an earlier install wrote under
such a spelling); deliberate forgery is out (a forged link, a hand-edited entry naming a look-alike path). The home's
own spelling is out of scope, as the plan says. Lane class: install, hook or gate — it changes nana-setup install,
doctor and uninstall, the session-start stale-copy producer, and a pi extension's dependency (`linkOk`).

Check: (1) the must-meet checks are not vacuous: each named pair turns its check red, M14 (main's code) turns all six,
and the R-1984 fixture fails when it rewrites nothing; (2) no home installed through the on-disk spelling changes on
upgrade, and an earlier-spelling home converges once with nothing lost; (3) nothing main does today stopped working:
POSIX and win32 install, doctor and uninstall, pi registration, the stale-copy line, and the existing nana-setup test
files on all three legs; (4) the declared skip cannot hide the file on a volume that has a second spelling; (5) the
tests write only inside the temp folders they own and clean up; (6) HANDOFF and the session entry are true, including
the narrowed win-path-commands residual, the six new residuals and the independent check's build; (7) any MUST.
