# Review brief — client-side races, ROUND 3 (buffers lane passed in round 2; only races remains)

Your rounds 1–2: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-sol-bufrace-r1.md and review-sol-bufrace-r2.md (read r2 first). Verify the round-3 folds on the races lane; hunt for regressions; do not re-litigate accepted design.

## Round-3 folds claimed (verify each)
D-BLOCK adoption: the bash POST records at start the count of FINISHED history cards for that command (claimed or not) and the number of same-command POSTs outstanding; on return it adopts only when exactly one new finished card appeared AND no other same-command POST is in flight; otherwise adopts nothing, builds nothing from the buffer, drops the buffer, and runs exactly one repair resync (`scheduleResync`, deduped by `L.resyncQueued`, cleared by `resync`). The false "wrong pick is invisible" comment is deleted.
D-SHOULD: a buffered terminal transport failure (`desk_bash_result` failed) is re-applied onto the adopted row (status + error).
F-BLOCK: one shared remaining budget per event across error (allocated first) + output + delta; every field clipped; the retain-one escape removed; error render capped and marked `· truncated`; the truncation flag carried on the EVENT (a failed result has no `data`).
F-SHOULD: `tailTo` steps one code unit in when the window would open on a low surrogate.
C-SHOULD: `stale(g)` gates every awaited response and every catch in `/model`, `/thinking`, `/compact`, `/name`, `/new`, `/clone`, `renameSession`; `spawnSession` does the stale-success rail refresh before any response UI.
G-SHOULD: test server spawned detached; teardown SIGTERMs the group, SIGKILLs after the deadline, awaits exit before cleanup.
H: README bash bound restated (budget per event, error first, every field, no escape, 8 ids × 200 events), finished-row rule extended, a fifth rule for provable-only adoption + one repair resync, generation rule says a stale continuation paints no toast.
Tests: `session-races.e2e.mjs` now 40 checks; the worker reports 8 more failing on the pre-fold page.

## Read
- Round-3 diff (206356f..ab22313): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-races-r3.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/public/app.js` (search `adoptHistoryBashRow`, `scheduleResync`, `resyncQueued`, `clipBashEvent`, `tailTo`, `finishBashRow`, `stale(`), `apps/desk/test/session-races.e2e.mjs`, `apps/desk/README.md`, `docs/review-punchlist-2026-09-08.md`.

## Dimensions
A. Adoption rule: counting ALL finished cards at start — can a finished card that appears from an UNRELATED earlier run (history re-render after a compaction/branch change that adds or removes cards) make the delta exactly one and cause a wrong adoption? Is "same-command POSTs outstanding" tracked correctly across a stale generation (a POST from a left session)? Is the repair resync truly at most one when several ambiguous POSTs return together?
B. Failure re-apply: applied after the adopted row's own finish state — can a SUCCESSFUL history card be marked failed by a buffered result for a DIFFERENT run of the same command?
C. Budget: does the budget hold for an event with all three fields present and each over budget on its own? Is the flag-on-event rendered only when a cut happened? Surrogate step: correct for a window that opens exactly on a high surrogate (no step) vs low (step)?
D. Generation gates: every awaited response and catch in the listed commands actually guarded (read them)? `spawnSession` stale path — is the spawned session still tracked server-side and does the rail show it?
E. Tests: do the eight new checks fail for the stated reasons on the pre-fold page? Any remaining timing-decided assertion not tagged SETTLE? Teardown: group kill + awaited exit really there; no orphan on the ambiguous-adoption path?
F. Docs exact vs code; anything observable from round 3 undeclared?

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
