# Review — issue-watch, confirmation round 2, 2026-10-29 (final reviewer and land reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Class: install, hook or gate (`hook: packages/nana-pack/extensions/nana-frontier-summary.ts — pi extension`). Threat model as in round 1 (`review-brief.md`).

This round reviews only the change since round 1: `git diff 9c9980f4..HEAD` on `feat/issue-watch`, minus main's merged lanes (code-search came in through the merge at 9c51b704; review `git diff 9c9980f4..HEAD -- . ':!docs/code-map.md'` against `git diff 9c9980f4..9c51b704^2` where they overlap).

Round 1: the final reviewer sent it back (`review-r1.md`), the land reviewer said LAND with the same finding as a SHOULD (`land-r1.md`).

What changed:
- **Build 3 (5c8ed954):** every run's cursor, and the `--since` its restart line prints, stays at or above the run's floor; a three-run test pins the reviewer's chain. A failed pi delivery stays undelivered for the next poll and shows one notice. The over-cap session-start block keeps its omitted notice before the watch line.
- **Build 4 (14df0550):** a test passed an absolute path to `node --import`, which Windows CI rejected; it now passes a file URL.
- **Merge of main (9c51b704)** and notes for builds 3 and 4 in the session entry and HANDOFF.
- Locked full suite at build 4: 231 files, 229 pass, 2 skip. CI runs on draft pull request 249 at the reviewed tip, the Windows leg included; the seat lands only on green.

Ask: are round 1's MUST and both SHOULD points fixed, and does the fix break anything else?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
