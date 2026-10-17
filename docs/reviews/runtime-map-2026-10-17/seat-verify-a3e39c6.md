# Seat checks — runtime-map builds 1 and 2, tip a3e39c6 (2026-10-17)

- Title check: `node docs/reviews/runtime-map-2026-10-17/seat-titles.mjs 1` → `seat-titles 1: 0 missing`.
- Full suite on build 1's tip c9cb60c (`npm run test:locked`): `149 files: 147 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7438 pass, 0 fail, 14 skip · 743.0s`, exit 0.
  Build 2 changed one test file only (`packages/nana-pack/tests/test-runner.test.mjs`); the real measurement below ran the whole suite on a3e39c6.
- Real measurement on c9cb60c (`npm run map:measure`): `FAIL  packages/nana-pack/tests/test-runner.test.mjs  38 pass, 1 fail`, measure exit 1 —
  the independent check's MUST (case I failed under the measurement's own coverage variable); sent back in build brief 2.
- Real measurement on a3e39c6: `149 files: 147 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7438 pass, 0 fail, 14 skip · 762.0s`, measure exit 0, about 12:47 wall.
- The impact view on real data: `npm run map:impact packages/nana-pack/bin/pi-worker.mjs` shows "transitive callers (0)" from the import map and
  "measured tests for packages/nana-pack/bin/pi-worker.mjs (2)" (review-ledger 118.4s, worker-lane 12.4s), then the not-counted closing line;
  `scripts/test.mjs` shows the zero line `(0): —`.
- Wrong-code pairs on the runner edit (gate lane), shared runner: `[1/4] RESULT: 1/1 red (1 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived
[2/4] RESULT: 1/1 red (1 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived
[3/4] RESULT: 1/1 red (0 exactly their named titles, 2 with a named title green, 0 with an unnamed red), 0 survived
[4/4] RESULT: 1/1 red (0 exactly their named titles, 2 with a named title green, 0 with an unnamed red), 0 survived
RESULT: 4/4 red (2 exactly their named titles, 4 with a named title green, 0 with an unnamed red), 0 survived, across 4 shards` (`seat-mutate-output-a3e39c6.txt`).
  Pairs 3 and 4 red by crashing the measure fixture before its named check; recorded as red, not as exact.
- Independent check on the runner edit: one MUST (above), fixed in build 2; its NOTEs (an unwritable or relative knob folder, a stale header
  comment in the runner test) are known bugs under the ruling.
