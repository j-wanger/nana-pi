# Review brief r3 — fold of your r2 findings (branch feat/desk-2026-09-16, /Users/jwang/nana-pi)

Your r2 (sol-r2.md) BLOCKed on two HIGHs: (1) untracked byte budget checked against stale lstat sizes; (2) reload completion heuristic (poll/ceiling). Four commits fold them (fold2.diff). Judge the FOLD only.

Author's summary: (1) changes.mjs readBounded(): open O_RDONLY|O_NOFOLLOW (0 on win32) → fh.stat regular-only → chunked reads capped at limit+1 → budget charged with bytes READ; a file yielding more than its bound → added:null + partial reason; newFileDiff reads the fd it opened (post-check symlink swap → ELOOP → 409); win32 keeps lstat-first + race, README says so. (2) server promptChild mints promptId p-N per child, returns it in every body; a DETACHED prompt's RPC resolve/reject broadcasts desk_prompt_settled {promptId, ok, error}; client runReload parks on awaitPromptSettled(S, promptId) — waiters on S.promptWaiters, resolved by handleEvent, failed by desk_exit, nulled by clearStage; no ceiling; send() keeps holding the prompt. Known limit added: an SSE drop during a detached reload loses the settled event (no replay) → wait ends only on exit or leaving the session. MED 2: vacuous activity test deleted with rationale. MED 3: timing test relative to idle baseline + ≥5 ticks. New zero-dep test prompt-detach.test.mjs.

Read: sol-r2.md · fold2.diff · then whole: /Users/jwang/nana-pi/apps/desk/changes.mjs, /Users/jwang/nana-pi/apps/desk/server.mjs (promptChild, handleChildEvent's desk_exit, broadcast), /Users/jwang/nana-pi/apps/desk/public/app.js (runReload, awaitPromptSettled, handleEvent desk_prompt_settled/desk_exit/desk_hello, clearStage, send), /Users/jwang/nana-pi/apps/desk/README.md (Reload, Changes, Known limits).

Dimensions (PASS or FINDING(severity) + file:line + reason):
1. HIGH 1 closed? Any path where bytes read can exceed the budget or per-file cap; handle leaks; win32 fallback correctness; totals under partial.
2. HIGH 2 closed? promptId uniqueness across the child's life and across resume/fork; settled broadcast on every terminal outcome (resolve, reject, RPC timeout, child exit while detached); client waiter lifecycle (stage change, desk_exit, second hello); any way send() posts while a reload is unfinished other than the documented two-tab case. Judge the SSE-drop limit: acceptable-as-documented for a LAND, or must a recovery (e.g. settled ids in desk_hello) ship first?
3. Tests: are the negative controls real; does prompt-detach.test.mjs exercise the detached path with a real 5 s+ hold or a shortened knob (name it); timing test flake risk now.
4. README consistent with code.

End with VERDICT: LAND or VERDICT: BLOCK; BLOCK/HIGH list (must fix); MED/LOW list (may land).
