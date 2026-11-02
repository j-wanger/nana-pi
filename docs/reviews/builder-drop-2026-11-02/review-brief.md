Feature: FEAT-045 · Test which builder context changes builds

Lane builder-drop. Class: ordinary. Threat model: honest variation in our tools' output is in scope (flaky tests, a builder that stalls, hidden tests that can't import, model nondeterminism, a lane starting mid-run); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/builder-drop`. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`, a pi adversary's attack with 11 MUST); its last section records the owner questions the seat decided with an astra consult while the owner was away. `build-brief-1.md` to `build-brief-3.md` and the build records show the builds; build 1 stopped for a helper export that build 2 was authorized to make. Pull request #320.

The owner's goal: "craft the builder (and eventually every role)'s context with craft and design ... without it, we lack understanding of what context matters". This lane builds the replay harness only (no study values, no verdict, no paid run): an isolated re-run of a past first build from a fresh one-commit repo inside a macOS sandbox, a byte-exact first-attempt control, a hidden-test grader with stable check ids, a spend journal written before spend, one measures row per run (time, tokens, cost, tool calls, turns, error classes), a stop when a lane starts building, and refusal to resume on changed inputs. R-3600 to R-3607, artifact A-101.

Question: does the feature work for its user, the seat that will run a paid drop study on it and the owner who will trust its verdicts; check especially that a replay cannot read the future (landed tests, later commits, the real home, other worktrees, sessions) or write outside its copy, that a grader fault is never scored as a builder failure or success, that spend can't be paid twice or run past the journal, and that no private transcript text reaches the repository; and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
