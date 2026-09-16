# Review brief r2 — fold of your r1 findings (branch feat/desk-2026-09-16, /Users/jwang/nana-pi)

You reviewed this branch once (your r1 is at sol-r1.md; verdict BLOCK: B-HIGH sync untracked reads, C-HIGH prompt during reload; MEDs A, B-sym, D, F, G). Four commits fold them. Judge the FOLD only; do not re-review what you passed.

Read: sol-r1.md · fold.diff (the fold, 4 commits) · then the touched files whole: /Users/jwang/nana-pi/apps/desk/changes.mjs, /Users/jwang/nana-pi/apps/desk/public/app.js (grep runReload, awaitPendingReload, checkResources, send, stopActivity), /Users/jwang/nana-pi/apps/desk/public/desk-client.mjs (parseSkillMessage), /Users/jwang/nana-pi/apps/desk/README.md (Reload bullet, Changes bullet, Known limits).

Fold summary from the author: B-HIGH → countUntracked(): fs.promises lstat/readFile through a pool of 8, budget walk in path order, DESK_UNTRACKED_TOTAL_CAP 16 MiB default, partial:true + partialReason, bytes-based line count; B-MED → lstat raw path first, 409 symlinked path; C-HIGH → runReload publishes S.reloadPromise, send() awaits it (stage rule) then checkResources; {pending:true} → awaitPendingReload() polls get_commands every 500 ms up to 15 s for a CHANGED list (get_state.isStreaming was rejected as a stop signal: pi 0.84.4 runs extension commands before any agent run, so it reads not-streaming throughout — author cites dist/core/agent-session.js:616 and :830-833; /rpc cannot carry prompt: RPC_ALLOWED excludes it by design); A-MED → stale tick clears only its own handle; D-MED → lastIndexOf('\n</skill>'); G-MED → README corrected.

Dimensions, each PASS or FINDING(severity) + file:line + reason:
1. Is B-HIGH actually closed — no remaining sync fs work proportional to untracked count; the budget walk cannot be defeated by interleaving; totals correct under partial; is the pool bounded on every path including errors.
2. Is C-HIGH actually closed — can a prompt still slip past a reload (focus-triggered reload racing a send that started before it; two reloads; a reload whose promise rejects); does awaitPendingReload's "list changed" condition give false completion (a list that changes for another reason) or false wait (reload done, list unchanged → 15 s hold on the user's next prompt — say whether that is acceptable or must be fixed before landing); verify the author's pi-source claim about isStreaming.
3. A, B-sym, D: closed as described? any new hazard introduced by the fold (e.g. the raw-vs-real path split).
4. Tests in the fold: are the negative controls real (author says reverting C hunks fails reload e2e 5 and 6); is the tick-gap timing test likely to flake.
5. README now consistent with code.

End with VERDICT: LAND or VERDICT: BLOCK, then BLOCK/HIGH list (must fix) and MED/LOW list (may land).
