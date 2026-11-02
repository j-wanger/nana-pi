Feature: FEAT-041 · Shape each agent's context by role

Lane roster-roles. Class: hook (the roster notice pi extension and Claude Code hook, `nana-roster.mjs`, `pi-worker.mjs`). Builder: pi-worker (larger lane). Build session 1. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`, which a pi adversary wrote). Build it as written: its Design, Assumptions and Open choices (take its defaults), the must-meets and the forecast of changed tests. The owner's words and answers are quoted in the plan.

Threat model: honest variation in our tools' output is in scope (old rosters without the new slots, a roster file written whole by `set`, malformed slots, Windows, older checkouts, pi and Claude Code seats); deliberate forgery is out.

Rows: new rows above R-3523, in must-meet order, then the seal rows; amend and retire the rows the plan names. If machine-lane-limits has landed when you start, merge `origin/main` first and order the roster output as the plan says (slot lines, then `lanes:`, then `source:`).

## Precedent

- `packages/nana-pack/bin/worker-config.mjs`
- `packages/nana-pack/bin/nana-roster.mjs`
- `packages/nana-pack/lib/roster-set.mjs`
- `packages/nana-pack/lib/pack-config-write.mjs`
- `packages/nana-pack/tests/nana-roster-set.test.mjs`
- `packages/nana-pack/bin/pi-worker.mjs`
- `packages/nana-pack/bin/pi-watchdog.mjs`
- `packages/nana-pack/bin/claude-review.mjs`
- `packages/nana-pack/lib/lane-watcher.mjs`
- `packages/nana-pack/bin/review-launch.mjs`
- `packages/nana-pack/lib/context-load-log.mjs`
- `packages/nana-pack/lib/roster-notice.mjs`
- `packages/nana-pack/extensions/nana-roster-notice.ts`
- `packages/nana-setup/claude/rules/nana-seat.md`
- `templates/_shared/working-under-nana-pi.md`
- `packages/nana-pack/rules/nana-rulings.md`

Report each departure.

## Build

Requirement rows first, then the tagged tests (wrong code first: each new test red against main's code, recorded in this folder), then code, rules, template and README. Grep every test and checker for literals this change breaks before limiting edits. Write the seat's wrong-code pairs into `docs/reviews/roster-roles-2026-11-02/seat-mutate.mjs` with the shared mutation runner, at least one pair per must-meet, and run it. Never edit the real `~/.pi/agent/nana-pack.json`; tests use a temp agent dir. Add one session entry to `docs/sessions/2026-10.md`, newest first.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every touched test file, the mutation runner (every pair red), `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, `nana-writing` on the session entry and on `HANDOFF.md`, and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
