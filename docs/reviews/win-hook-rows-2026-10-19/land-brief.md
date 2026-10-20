# Review — win-hook-rows (on Windows, install and doctor list each Claude Code hook only by its settings row), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff f0d6da24..HEAD` on `feat/win-hook-rows` (main was `f0d6da24` when the lane branched; `git merge-base
HEAD main` is `f0d6da24`). Main has since moved to `4656f646` (the pwsh-lexer-oracle land), so the land needs a merge
of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-hook-rows-2026-10-19/must-meet.md`: two must-meet checks, rows R-1860 and R-1861, plus R-349
narrowed and R-937's evidence trimmed. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the build
(5fa19acd). The seat's record is `seat-verify-5fa19acd.md`: CI run 39347845476 on macOS, Ubuntu and Windows, 0 failing
files on each (`ci-windows-5fa19acd.log` and `ci-install-check-windows-5fa19acd.log` beside it), the wrong-code pairs
(`seat-mutate.mjs`, `seat-mutate-output-5fa19acd.txt`: 7 of 7 red, 0 survived, three declared items) and the
independent check (`independent-check-5fa19acd.md`: HOLDS, no MUST, ten probes). The final reviewer's brief is
`review-brief.md`. The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement f0d6da2..e1c431f: 3 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-349 text changed
  R-1860 new (implemented)
  R-1861 new (implemented)
```

The code under review: `stepHooks` in `packages/nana-setup/lib/steps.mjs` and `hookLinkRows` in
`packages/nana-setup/lib/hook-health.mjs` return no rows on win32; both hook-health row builders drop the `skipped`
field; doctor's hook link row (`lib/doctor.mjs`) and both loops in `bin/stale-copies.mjs`, which the adoption hook runs
at every Claude Code session start, read `ok` only; `DOCTOR_NOTES.win32` (`lib/install-check-config.mjs`) drops the
five `hook <script>` labels. Two new checks sit in `packages/nana-setup/tests/win32-degrade.test.mjs`; the R-1081 pin
in `tests/install-check.test.mjs` follows the pruned list.

Judge whether the lane fails open: a broken hook link on macOS or Linux, or a missing or stale hook settings entry on
Windows, now reading ✓ or as a note in doctor, or no longer named by the session-start stale-copy line, because a
reader lost its `skipped` guard; or the Windows install check accepting a doctor row it should refuse. Judge whether it
leaves a harm the review standard lists: a broken install, doctor run or hook, a hook file or settings entry written
or removed where main left it, or a test writing outside the temp folders and temp homes it owns. Judge whether
anything main does today stopped working: install's hook links, doctor's hook rows and the stale-copy line on macOS
and Linux, the six settings rows and their ✓ or ✗ on Windows, `install --dry-run`, and the Windows install-check leg.
One known gap: a win32 row relabelled without its file name passes both new checks; only the Windows install-check
note list would catch such a doctor row. The seat records it as a residual; judge whether that is a harm the standard
lists or a known bug.

Threat model: honest variation in our tools' output and the OS is in scope (native win32, forced win32 on macOS and
Linux, the Windows CI legs, homes with or without a Claude hooks folder); deliberate forgery is out. Lane class:
install, hook or gate — install and doctor in nana-setup, and the stale-copy producer the adoption hook runs.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
