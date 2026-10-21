# Confirmation round 4 — verifier-pipe-commit-match, 2026-10-20 (Claude Opus 5.5, the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Over the cap, under the standard reason: a confirmation round on the final tip after fixes to named findings. Review only the change since round 3.

Round 3 reviewed `f0be3c45`. The final reviewer said LAND (SHOULD 1: a quoted stop-on-error flag such as `set "-e"` goes unasked and HANDOFF said "however it is spelled"; SHOULD 2: four row clauses had no case; NOTEs on a wrong log pointer in the session entry and a crafted 64 KB flag that backtracks for 12.5 s). The land reviewer sent it back with one MUST: build 9 had removed build 6's unquoted backtick group, so ``summary=`npm test | tail -5;` && git commit -m checked`` and its newline form went unasked, where main and round 2 asked.

This round reviews `git diff f0be3c45..HEAD` on `feat/verifier-pipe-commit-match`. Main is `bcabe3ce`, already merged into this lane before round 3.

- `8b55f75d`: `build-brief-12.md`.
- `96ba3412` (build 12): build 6's unquoted backtick block put back in `liveText`, unchanged. Errexit has been global since build 9, so the group carries no errexit scope. Three consumed cases for the MUST's forms (newline, `;`, and `if x=`…;`; then …`); four cases pinning the row clauses the final reviewer named (any case, inside a longer word, `+o errexit` alone, and the option search stopping at the simple command's end).
- `115d93de` and the pairs record: E7 turns the block off; 69 of 74 red (`seat-mutate-output-96ba3412.txt`); E7 turns the three new cases red; F4 is equivalent again, as on builds 6 to 8; K1, K8, C1 and S26 survive as before.
- The notes commit: the Landed line now says "unquoted text" and names build 12; a new residual for the quoted flag; the crafted-input residual gains the backtracking flag; the session entry's log pointer is fixed; a round-3 paragraph. CI run 39527758216 at 115d93de reads 0 failing on all three legs: macOS 197 PASS, 0 FAIL, 2 SKIP of 199 files (8,203 checks pass, 36 skip); Ubuntu 196 PASS, 0 FAIL, 3 SKIP of 199 files (8,142 checks pass, 56 skip); Windows 181 PASS, 0 FAIL, 18 SKIP of 199 files (7,131 checks pass, 115 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-115d93de.log in this folder.

Threat model and lane class as before: honest variation in commands agents and the owner write is in scope; deliberate forgery is out. Install, hook or gate lane.

Check: (1) round 3's MUST is closed, including its nearby forms; (2) restoring the block loses no ask that round 3's tip made and brings back no errexit scoping; (3) the new cases pin what their rows say; (4) HANDOFF and the session entry are true; (5) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
