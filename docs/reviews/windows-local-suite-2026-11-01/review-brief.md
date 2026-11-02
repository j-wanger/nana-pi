Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-local-suite. Class: ordinary (tests and one test helper). Threat model: honest variation in our tools' output is in scope (CRLF tar listings, `Path` or `PATH` environment keys, a real npm pi on PATH, slow Windows runs); deliberate forgery is out.

This lane was planned and built on the owner's Windows laptop by a sub-seat; Claude Code (Sonnet) built it, so a GPT model reviews it. Review `git diff origin/main...HEAD` on `feat/windows-local-suite`. The plan of record is `plan.md` in this folder, revision 2 after `plan-attack.md`; `build-brief-1.md` and `build-1-report.md` (with five recorded departures) record the build; the `*-win32*.txt` files and `repo-a-state.txt` hold the laptop evidence. Issue #213 holds the failures it fixes. The 2026-11-01 entry "the suite passes on the owner's Windows laptop, apart from missing tools" in `docs/sessions/2026-10.md` summarises the lane.

Seat record: on the laptop, every lane file passes from PowerShell with each split file under 240 s; the profile-store and review-ledger check names are the same 189 before and after on Windows and on macOS (the seat ran the macOS lists).

Question: does the feature work for its user, a developer running the suite on Windows, and does the change cause a harm the review standard lists? Check especially that no check was dropped or weakened by the split (the moved blocks recreate the state they inherited); that the restore test's forbidden-path guard can now fail on Windows and still checks the same paths on POSIX; that the PATH helper writes the key the process uses without changing what a spawned child sees; that the run-alone list is unchanged; and that no product code changed.

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
