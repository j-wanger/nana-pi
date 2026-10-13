# Review — fresh installs take CI's pi cutoff, 2026-10-13 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff bc84b70..HEAD` on `feat/fresh-install` (main `bc84b70`, with the process lane, is merged in).
Threat model: honest variation in our tools' output in scope (a user following any README command on macOS, Windows
PowerShell or cmd; a retuned or malformed cutoff in `ci.yml`; a README command written in another Markdown form);
deliberate forgery out. Lane class: small (CI-value consumer plus install-check output). The review standard pi-review
appends governs the bar and the verdict line.

Records in `docs/reviews/fresh-install-2026-10-13/`: the plan `CHANGE.md` (planning workflow, two fact-checks, a seat
revision; sol plan r1 SEND-BACK 7/10 — its MUST, a parseable but unsafe cutoff, is folded in at the end of CHANGE.md),
luna's build 1, the seat's acceptance script (82/82 at the merged tip, re-run by the seat; it installs the README's
pinned command into a scratch prefix — read `acceptance-seat-final.txt` rather than re-running unless you want to),
the title check (0 missing) and the seat's mutation runner (`seat-mutate.mjs`, 45/45 caught; read
`seat-mutate-output.txt`, do not run it). Draft PR #7's CI run 38435811260: macOS suite and both install-check jobs
green. Also `HANDOFF.md` and the session entry.

Check: (1) every user-facing pi install command and the missing-pi hint give a working pi 1.0.2 install and cannot
drift from `ci.yml` without a test failing; the reader never emits an empty or unsafe `--before=`; (2) the install
check's failure diagnostics, Path lookup and doctor note list; (3) the R-1071, R-1075, R-1078, R-1079 tests now pin
their clauses; (4) the README, setup README and Jake's check-page changes are true; (5) HANDOFF and the session entry
are true; (6) any MUST under the standard.
