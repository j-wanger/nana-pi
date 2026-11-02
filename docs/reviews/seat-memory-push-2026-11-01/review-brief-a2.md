Feature: FEAT-040 · Make and keep memory

Lane seat-memory-push-a. Class: ordinary. Threat model as in `review-brief-a1.md`.

Confirmation round 2. Round 1 reviewed f410db62 and sent back one MUST (requirements tree not regenerated) and one SHOULD (the 12-character minimum untested on its own); its text is kept as `r1-*.md`. Build 2 (7291c92e) regenerated the tree, made the short-prefix case unique, fixed the README id wording and made uppercase prefixes match; build 3 (e99ba01b) fixed a regression build 2 introduced, where every `save` threw on a missing id. Review only `git diff f410db62..HEAD` on `feat/seat-memory-push-a`.

Question: are the MUST and SHOULD closed, does `save` work exactly as on main, and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
