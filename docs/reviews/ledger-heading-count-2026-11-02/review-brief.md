Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane ledger-heading-count. Class: ordinary. Threat model: honest variation in our tools' output is in scope (line endings from a Windows checkout, a ledger that grows new CAP/FEAT/SUB headings, parser changes); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/ledger-heading-count`. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`, a pi adversary's attack: 2 MUST, 3 SHOULD, all taken). `build-brief-1.md` and `build-report.md` show the build; `m1-win32.txt` to `m3-win32.txt` hold its wrong-code evidence, run on Windows. Pull request #325.

The goal: the requirements-tree checks for R-288 and R-1158 stop pinning the real ledger's heading count as a literal, so a lane that adds a heading no longer fails CI on all three systems, while the checks stay as strict: every real heading has a purpose, the parser finds exactly the headings the ledger holds, and the CRLF copy parses identically. Rows R-3680 and R-3681.

Question: does the feature work for its user, the seat and every builder whose lane adds a heading; check especially that a parser dropping, adding or shifting a heading still fails, that a Windows CRLF checkout cannot compare CRLF with CRLF, and that the checks cannot pass vacuously; and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
