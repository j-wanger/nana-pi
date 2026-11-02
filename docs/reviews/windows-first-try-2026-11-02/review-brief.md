Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-first-try. Class: ordinary. Threat model: honest variation in our tools' output is in scope (slow or loaded Windows runners, timer jitter, shared worktree locks); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/windows-first-try`. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`). `ci-windows-failures.tsv` is the evidence: 116 failed Windows suite jobs since 2026-10-22, ranked by file. `build-brief-1.md` records the build, done on the Windows laptop. The `m1-*` and `m2-*` files are the load runs and wrong-code runs on win32; `suite-run-win32.txt` is the builder's full run. Pull request #315.

The change, test files only: the mutation-runner stagger check takes its threshold from a sealed constant with a longer rendezvous wait and a richer detail line (R-3530); the post-edit-status `timeoutMs 0` check gets a longer control deadline, a watchdog and a detail line on failure (R-3531).

Question: does the feature work for its user, a seat or builder whose Windows CI legs stop failing on these two checks under load; do the checks still fail on the wrong code they guard (no check weakened into always passing); and does the change cause a harm the review standard lists? One builder note: the stagger check reads `SEAT_MUTATE_STAGGER_SECS` from its own environment when set; judge whether that can ever produce a false pass.

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
