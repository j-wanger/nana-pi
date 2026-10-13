# Review — fresh installs take CI's pi cutoff, 2026-10-13 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

**Round 2 — confirmation round on the final tip after fixes to named findings.** Round 1 (`sol-r1.md` SEND-BACK, `astra-r1.md` LAND, at `30d6f91`). The seat changed only: the README scanner in `packages/nana-setup/tests/pi-install-pin.test.mjs` now works on whole code fragments (inline spans across lines, fenced and indented blocks with continued lines joined, shell comments dropped) with a new case for a command continued after `npm \\`, a span across lines and a comment-only cutoff — red on the old scanner; and HANDOFF's stale "fresh local installs" queue line is gone. **Scope, stated precisely (the round-1 brief's "every user-facing pi install command" was the seat's loose wording):** R-1093 covers the READMEs the readme check reads and nana-setup's missing-pi hint. The desk's two repair hints in `apps/desk/pi-session.mjs` are out by design — Jake froze the desk on 2026-10-10 — and are a declared residual in HANDOFF; they install an unversioned pi, which today resolves pi 1.2.0 with matching siblings, not the broken tree. Review the delta since `30d6f91` and whether round 1's findings are closed or correctly scoped.

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
