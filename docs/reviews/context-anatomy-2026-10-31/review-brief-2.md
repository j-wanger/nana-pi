Feature: FEAT-041 · Shape each agent's context by role

Lane context-anatomy. Class: gate. Confirmation round: review only the change since round 1's revision 6808a04b, that is `git diff 6808a04b..HEAD` on `feat/context-anatomy`.

Round 1 on 6808a04b: the final reviewer said LAND; the land reviewer said SEND-BACK with two MUST findings (cloud logins dropped from the carried settings; a hook test writing into the real Windows home); the independent check said FAIL on the first, having run the real Claude Code binary against a fake local endpoint. Build 5 (brief `build-brief-5.md`, record `build-5-report.md`) adds the cloud credential, endpoint and refresh names to the sealed carry lists, each verified against the installed Claude Code, with tests for settings-only Bedrock and Vertex logins and four wrong-code pairs; it sets `USERPROFILE` and an explicit temp agent dir in ten hook and launcher fixtures. The notes commit records round 1's remaining findings as known bugs.

Locked full suite at e5eb504b: 247 files, 245 pass, 2 skip. 38 wrong-code pairs, 0 failed. CI run 41262986380 passed on all three systems.

Question: do the two MUST findings stand fixed, does any carried name leak a secret into stdout, stderr or the load log, and does the change since round 1 cause a harm the review standard lists?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
