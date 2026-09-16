# Review brief r4 — fold of your r3 findings (branch feat/desk-2026-09-16, /Users/jwang/nana-pi)

Your r3 (sol-r3.md) BLOCKed on: HIGH 1 probe-byte + unreserved concurrent reads over the untracked budget; HIGH 2 settlement-before-waiter race. Four commits fold them (fold3.diff). Judge the FOLD only.

Author's summary: HIGH 1 → readBounded(abs,{collect,plan}): fstat, then plan(size) runs SYNCHRONOUSLY before the first await — past the per-file cap → refused with zero bytes read; else reserves n=min(size, budget−spent) and bumps spent before any await; n<size → refunded, not read, added:null (budget); read is at most n bytes; shorter read (shrank) → added:null "changed under the read"; growth after fstat invisible by construction. newFileDiff cut at exactly diffCap with truncated:true. HIGH 2 → server settlePrompt() appends to child.settledPrompts (ring 32) AND broadcasts; desk_hello carries settledPrompts; exit path settles detached prompts into the ring; client S.settledSeen (32) written by the event and by every hello, resolving waiters; desk_exit sets S.exited; awaitPromptSettled checks both before installing a waiter. MEDs: timing test 1 ms ticker ≥2 ticks relative bound; README corrected (no probe byte, O_NOFOLLOW darwin/linux only with win32 lstat-first for both list and diff window, ring-32 limitation). New tests: A12b/A14/A15/A16/A17 (boundaries, concurrency with forced reservation window), prompt-detach 5–7 (ring in hello, bound, dying child), reload e2e 9 (held POST, early settle) and 10 (SSE killed across pi's answer via relay).

Read: sol-r3.md · fold3.diff · then whole: /Users/jwang/nana-pi/apps/desk/changes.mjs, /Users/jwang/nana-pi/apps/desk/server.mjs (settlePrompt, promptChild, /events hello, exit path), /Users/jwang/nana-pi/apps/desk/public/app.js (awaitPromptSettled, runReload, handleEvent hello/settled/exit, clearStage, send), /Users/jwang/nana-pi/apps/desk/README.md.

Dimensions (PASS or FINDING(severity) + file:line + reason):
1. HIGH 1 closed? Any path reading past per-file cap or aggregate budget; reservation atomicity; refund correctness; handle leaks; totals under partial.
2. HIGH 2 closed? Every terminal outcome reaches the ring AND the broadcast; waiter/ring/settledSeen lifecycle across hello, exit, stage change; any remaining ordering in which a healthy client waits forever.
3. Tests: negative controls real (author lists four); e2e 10's timing assumption (author flags it) — acceptable or must change.
4. README consistent with code.

End with VERDICT: LAND or VERDICT: BLOCK; BLOCK/HIGH list; MED/LOW list.
