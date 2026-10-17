# Seat checks — feature-first build 2, tip d8a19bd (2026-10-17)

- Title check: `node docs/reviews/feature-first-2026-10-17/seat-titles.mjs 1` → `seat-titles 1: 0 missing`.
- Full suite (`npm run test:locked`): `148 files: 146 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7433 pass, 0 fail, 14 skip · 736.5s`, exit 0.
- Install check (`node packages/nana-setup/bin/install-check.mjs`, the lane touches nana-setup rules): exit 0, every line PASS.
- Builder's report read. Build 1 (the small-lane builder) stopped after about five minutes with VERDICT PARTIAL and no commit; build 2
  (Claude Sonnet 5) finished from its uncommitted edits in seven commits. The builder edited one existing check (a capital letter that
  the new Plans wording moved) and repointed R-1127's Evidence cell. Its note that `project.test.mjs` fails when run alone through
  `scripts/test.mjs` comes from a missing npm global prefix outside `npm run`; the full suite above passes it.
- No wrong-code pairs and no independent check: an ordinary lane under the ruling this lane writes.
