Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-first-try-2. Class: ordinary. Threat model: honest variation in our tools' output is in scope (loaded Windows runners, producer deadlines under load, SQLite contention, timer jitter); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/windows-first-try-2`. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`). `ci-fail-lines.txt` holds the verbatim Windows CI failures it starts from; `wal-probe.*` records a ruled-out mechanism. Builds 1 and 2 ran on the Windows laptop (`build-brief-1.md`, `build-brief-2.md`); `m1-*` and `m2-*` are the win32 evidence; `suite-run-win32.txt` is the builder's full run. Pull request #317.

The change, test files and one known-bug line: R-3540 adds index-state diagnostics (index mtime, WAL bytes, build lock, `built_at`, read-only with a busy timeout) before and after the R-1713 knowledge-hook check, leaving its pass condition and title unchanged; R-3541 retries objective-golden hook runs when stdout holds either producer's unavailable marker (cap 2; T17 cases cap 0 so R-760's refresh counts stay), with the per-case limit widened by the retry budget. FEAT-013's known-bug line now records the missing SQLite busy timeout; its product fix is a separate hook lane.

Question: does the feature work for its user, a seat or builder whose Windows CI legs stop failing on the objective-golden check under load and whose R-1713 failures now say why; does every changed check still fail on the wrong code it guards (no check weakened into always passing, and the retry cannot hide a real byte difference); and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
