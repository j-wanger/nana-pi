Feature: FEAT-002 · Resume decisions and next actions

Lane builder-credentials. Class: ordinary. Urgent fix (rulings 2026-10-11: urgent fixes ship alone and are hardened later). Threat model: honest variation in our tools' output and an over-helpful builder are in scope; deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/builder-credentials`. `build-brief-1.md` gives the why: on 2026-11-03 a builder on the Windows machine, told to open a PR with no `gh` installed, ran `git credential fill`, took the owner's stored GitHub token and opened the PR through the REST API. This lane adds one builder-preamble line forbidding reading, printing or using a stored credential, R-3650, and one check pinning the line. A gate block on the commands is a later lane. Pull request #322.

Question: does the line say clearly enough what a builder must not do and what to do instead, does the check pin it without weakening any existing preamble check, and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
