# Seat verification — frontier-first, builds 1 (e08eb03d) and 2 (e8096fd4), 2026-10-21

Builder: pi-worker, small lane (roster builder), two sessions. Both reported DONE.

- `frontier.test.mjs`: 51 pass at e8096fd4 (45 before the lane; two seals and four rows). The builder ran every new check against 363df471: each red.
- Seat title check (`seat-titles.mjs all`): 0 missing.
- On main's HANDOFF.md the checker reports `file-size: bytes=334327 lines=1068` and three read-window findings (Where things stand ends at byte 322874, Next at 327130, Open for the owner at 334326). On the lane's restructured file it reports only `word-budget` and `file-size` (no section-order, no read-window).
- Wrong-code pairs (`seat-mutate.mjs`, shared runner, macOS): 10 of 10 red, 0 survived (`seat-mutate-output-e8096fd4.txt`). F2 also turned R-2473 red and F3 also turned the `current` golden red (both expected side effects).
- Existing checks edited by the builder, each because the new section-order kind made it false: the `current` golden entry (adds section-order lines 38, 42 and 51; summary findings=1 → 4; no other difference), the frozen 2026-10-06 rewrite check (now exactly three section-order findings; R-877's evidence title swapped), the frozen pre-rewrite check (12 → 15 findings; kind assertions unchanged).
- Single files after the seat's notes: frontier 51 pass, product-report 76 pass, requirements-tree 93 pass, handoff-artifact 9 pass. map:check 0 problems, readme:check 0 problems, requirements trace exit 0.
- The builder's full suite at e8096fd4: 200 files, 198 PASS, 0 FAIL, 2 SKIP; 8,225 checks pass. The land reruns the locked suite on the reviewed tip.
- Seat restructure checks (plan commit 5f6e3845): every one of the 153 moved Landed lines is found verbatim in `docs/sessions/2026-10.md` (0 missing); the Carried residuals section is byte-identical to main's lines 167-1016 before the three named clause edits.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, at e8096fd4 plus notes):

```
tree movement 363df47..e8096fd: 4 rows in 1 features
FEAT-002 · Resume decisions and next actions
  R-2470 new (implemented)
  R-2471 new (implemented)
  R-2472 new (implemented)
  R-2473 new (implemented)
```
