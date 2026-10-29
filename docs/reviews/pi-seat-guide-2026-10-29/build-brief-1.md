Feature: FEAT-006 · Launch builders with execution limits

Lane pi-seat-guide. Class: hook (`node scripts/lane-class.mjs --root . --files` on the planned files prints `hook: packages/nana-pack/extensions/nana-rulings.ts — pi extension`). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/pi-seat-guide, based on main. The plan of record is `docs/reviews/pi-seat-guide-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it. The plan has no list of allowed edits.

What the lane does, in one sentence: a pi seat session reads the same seat guide a Claude Code seat does, installed into pi's agent dir like the rulings file, and builders and reviewers never get it.

Build must-meets 1 to 7 and the sealed cap. New requirement rows take IDs from R-3020. The guide's new sentence must keep every sentence the seat-rule tests pin.

The lane touches `packages/nana-setup/`, so run `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs` once; a failure at pi post-edit inside pi-worker is a known FEAT-015 bug, so report it and go on.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; the guide section as a pi seat session receives it; the doctor rows; each departure from the Precedent below; every existing test you changed.

## Precedent

- `packages/nana-pack/extensions/nana-rulings.ts`: the read, the bound, the marker and the stale notice.
- `packages/nana-pack/lib/rulings-config.mjs`: the sealed rulings values.
- `packages/nana-setup/lib/paths.mjs`, `packages/nana-setup/lib/state-manifest.mjs` and the install step for `nana-rulings.md` (R-1412).
- `packages/nana-setup/lib/doctor.mjs:511`: the rulings doctor row.
- `packages/nana-setup/lib/stale-copies.mjs`: the stale-copy notice.
- `packages/nana-setup/bin/install-check.mjs`: the live pi turn's rulings heading check.
- `packages/nana-setup/tests/seat-rule.test.mjs`: the guide's pinned sentences.
