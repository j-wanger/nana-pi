Feature: FEAT-006 · Launch builders with execution limits

Lane machine-lane-limits. Class: hook (`packages/nana-pack/bin/nana-roster.mjs`, imported by the pi roster-notice extension). Builder: pi-worker (larger lane). Build session 1, on main 0bd1df89. A first attempt with the small builder stopped after one minute with no changes; finish the whole brief in this session. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`). Build it as written: its Design, Assumptions and Open choices (take its defaults), the must-meets and the forecast of changed tests. The owner's words and pick are quoted in the plan's Purpose.

Threat model: honest variation in our tools' output is in scope (no roster file, no `lanes` member, a malformed, zero, negative or non-integer value, an older checkout, Windows copies of the rules); deliberate forgery is out.

Rows: use R-3520 to R-3525 for the six new rows, in must-meet order, and reword R-1123 and R-1140 as the plan says.

## Precedent

- `packages/nana-pack/bin/nana-profile.mjs`
- `packages/nana-pack/bin/worker-config.mjs`
- `packages/nana-pack/bin/nana-roster.mjs`
- `packages/nana-pack/lib/roster-set.mjs`
- `packages/nana-pack/lib/pack-config-write.mjs`
- `packages/nana-pack/lib/roster-notice.mjs`
- `packages/nana-pack/lib/roster-notice-config.mjs`
- `packages/nana-pack/rules/nana-rulings.md`
- `packages/nana-setup/claude/rules/nana-seat.md`
- `packages/nana-setup/tests/seat-rule.test.mjs`
- `packages/nana-pack/tests/rulings.test.mjs`
- `packages/nana-pack/tests/nana-roster.test.mjs`
- `packages/nana-pack/tests/nana-roster-set.test.mjs`
- `packages/nana-pack/tests/roster-notice.test.mjs`

Report each departure.

## Build

Requirement rows first, then the tagged tests (wrong code first: each new test red against main's code, recorded in this folder), then code, rules and README. Grep every test and checker for literals this change breaks (the 2026-10-31 ruling text, "four lanes", `RULE_7`, the roster's exact stdout, the `--json` keys) before limiting edits. Remove the FEAT-040 known-bug line about the 2026-10-31 ruling's order once that ruling is gone. Write the seat's wrong-code pairs into `docs/reviews/machine-lane-limits-2026-11-02/seat-mutate.mjs` with the shared mutation runner, at least one pair per must-meet, and run it. Add one session entry to `docs/sessions/2026-10.md`, newest first. Never edit the real `~/.pi/agent/nana-pack.json`; tests use a temp agent dir.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every touched test file, the mutation runner (every pair red), `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, `nana-writing` on the session entry, and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
