Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane ci-suite. Class: gate (it changes `nana-land`). Threat model: honest variation in our tools' output is in scope (gh failures and timeouts, partial or expired artifacts, reruns, cancelled and superseded runs, filtered runs, records without the new field, CRLF and odd whitespace, renames); deliberate forgery, such as a workflow or person uploading a fake record, a forged `gh` on PATH or a tampered land ledger, is out.

Review `git diff origin/main...HEAD` on `feat/ci-suite`. The plan of record is `plan.md` in this folder, revised after `plan-attack.md`; `build-brief-1.md`, `build-report.md` and `build-brief-2.md` record the builds; `independent-check-711e351f.md` is the lane's independent check, whose MUST build 2 fixed. The 2026-11-01 entry "a land can use CI as its suite" in `docs/sessions/2026-10.md` summarises the lane.

The change: `nana-land` substitutes a proven CI suite run for its local `--suite` run, falls back otherwise, and records `suite: ci` or `suite: local`; the runner records its filters; the builder preamble, rulings and working pattern say CI is the suite. R-3430 to R-3437; R-1110 retired for R-3436.

Seat record: build 2's locked full suite read 253 files, 251 pass, 2 skip; the mutation runner reads 17 of 17 red; the local install check fails only on the known `pi post-edit` write-error. This lane changes the test runner, so its own land runs the local suite.

Question: does the feature work for its user, the seat landing a reviewed lane without re-running a suite CI already proved on the exact tip, and does the change cause a harm the review standard lists? Check especially that no land accepts CI without an unfiltered, same-platform, passing record from the newest run for the exact tip; that every read failure falls back to the local suite rather than refusing silently or accepting; that a change to the runner or workflows (including a rename) always runs the local suite; that a red local suite still blocks; and that existing land behaviour, records and output stay as before when CI is not used.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
