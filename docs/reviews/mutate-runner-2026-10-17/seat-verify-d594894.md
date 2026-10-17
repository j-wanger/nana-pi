# Seat checks — mutate-runner build 1, tip d594894 (2026-10-17)

- Title check: `node docs/reviews/mutate-runner-2026-10-17/seat-titles.mjs 1` → `seat-titles 1: 0 missing`.
- Full suite (`npm run test:locked`, alone on the machine): `148 files: 146 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7429 pass, 0 fail, 14 skip · 735.8s`, exit 0.
- Equivalence (A2), run again by the seat at the default five shards: `SEAT_MUTATE_TIP=f5c2d3c node docs/reviews/mutate-runner-2026-10-17/seat-mutate-port.mjs` →
  `RESULT: 71/71 red (55 exactly their named titles, 4 with a named title green, 15 with an unnamed red), 0 survived, across 5 shards`, 2:33 wall.
  Compared per pair (id, verdict word, named count) with `docs/reviews/roster-notice-2026-10-16/seat-mutate-output-f5c2d3c.txt`: 71 pairs, 0 differ.
  Record: `seat-port-output-seat-d594894.txt`.
- The lane's own 43-pair table (`seat-mutate.mjs`, old-form runner per plan S7): DRY run `RESULT (DRY): 43/43 pairs apply, across 5 shards`
  (`seat-mutate-dry-d594894.txt`). Not run: the owner's 2026-10-17 feature-first ruling skips wrong-code pairs on ordinary lanes.
- No independent check workflow: the same ruling.
- Builder's report read: commits 095e8d0, a1b3141, f6c7cda, 0c5d03c, d594894; groups 3-5 landed as one commit (explained in f6c7cda's message);
  the builder's own most-likely-wrong claim is M15's stagger lower bound, the file's one timing check (recorded as a known bug in HANDOFF).
