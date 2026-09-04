# Adversarial review — UI-centric frontend, slice 1 (fantasy basketball)

The seat (Claude) built slice 1 of /Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md (a design you reviewed to LAND in 6 rounds). This is the adversarial pass the design requires before the human feel check (§6 deliverable 6): the slice touches session lifecycle and gate surfaces. Be adversarial. Read the code, not the commit messages.

## Read (absolute paths; all committed)
Contract + extension:
1. /Users/jwang/nana-pi/packages/nana-stage/lib/blocks.mjs
2. /Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts
3. /Users/jwang/nana-pi/packages/nana-stage/tests/blocks.test.mjs
Desk server + per-app listeners:
4. /Users/jwang/nana-pi/apps/desk/apps.mjs
5. /Users/jwang/nana-pi/apps/desk/server.mjs — originRejection (~950-975), spawnChild (~125-185), promptChild/answerDialog (~995-1035), the app-listener start at the end
6. /Users/jwang/nana-pi/apps/desk/test/origin-rule.test.mjs
7. /Users/jwang/nana-pi/apps/desk/test/app-listener.test.mjs
Stage host:
8. /Users/jwang/nana-pi/apps/desk/public/stage/stage.js
9. /Users/jwang/nana-pi/apps/desk/public/desk-client.mjs
10. /Users/jwang/nana-pi/apps/desk/test/stage-page.e2e.mjs
11. /Users/jwang/nana-pi/apps/desk/test/stage-chain.e2e.mjs
App side:
12. /Users/jwang/basketball-geek/.pi/extensions/nana-basketball.ts
13. /Users/jwang/basketball-geek/src/basketball_geek/blocks.py
14. /Users/jwang/.pi/agent/apps/basketball.json (the live manifest)
pi facts if needed: /Users/jwang/.local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md (tool_result ~842-875; appendEntry ~1471), docs/rpc.md (get_entries ~717; Extension UI ~1184), docs/usage.md (-t ~212, -a/-na ~245).

## Dimensions
A1 Un-bypassability of the ledger tooth: can ANY path put a block on the live stage or in the ledger without passing validateBlock + the produced_by stamp? (tool_result patch semantics, extension load order, applyLiveBlocks, reduceEntries, a second extension re-injecting a carrier, a tool returning content that looks like a block.)
A2 Isolation as implemented: from an app page (its own origin), name every request that reaches a desk-wide surface or another app's child. Check originRejection edge cases (Origin casing, `null`, missing content-length with chunked bodies, HEAD/OPTIONS), the static map, and readBody being called before/after the origin check.
A3 Spawn from manifest: confirm nothing client-supplied reaches spawnChild; check -t/-a/-na/--no-extensions/-e ordering semantics against pi docs; the reattach + manifest write-back path (race: two concurrent POST /api/session; child exits mid-turn).
A4 Gate surface: does the gate bar hold when the drawer is collapsed, after reload, with two dialogs, and when a dialog arrives before the events stream is attached? Anything that could hide a pending dialog?
A5 Provenance honesty on screen: produced_by args, scope, the "agent's reading" label, hidden blocks, replace-in-place — any way the page presents the model's words as data or data as the model's words?
A6 Tests: name the important negative case NOT covered; name any test that asserts the implementation rather than the invariant.
A7 Subtraction: anything in the slice that does not earn its complexity, or a simpler equivalent.

## Output
Per dimension: PASS or FINDING (BLOCKING / MAJOR / MINOR, one paragraph, cite file:line). End with
VERDICT: LAND | LAND-WITH-FIXES | REWORK and the ordered fix list (empty if LAND).
