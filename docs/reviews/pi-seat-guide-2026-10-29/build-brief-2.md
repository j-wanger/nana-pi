Feature: FEAT-006 · Launch builders with execution limits

Lane pi-seat-guide. Class: hook. Builder: pi-worker (small lane). Build session 2, on the tip of build 1 with main merged.

The plan of record is still `docs/reviews/pi-seat-guide-2026-10-29/plan.md`. Build 1 met must-meets 1 to 7. The seat ran wrong-code pairs on build 1: each pair breaks one behaviour and runs the lane's tests. Four pairs passed every test, so no test pins what they broke. This build adds the missing pins and two small fixes. Do not change any row's meaning.

## Pins to add (each must fail on its pair)

1. **Reviewer role (R-3022).** Pair: the guide is injected for `NANA_ROLE=reviewer` and only `worker` is excluded. Add the `reviewer` case beside the existing `worker` case in the R-3022 test.
2. **Unavailable marker (R-3023).** Pair: `SEAT_GUIDE_UNAVAILABLE` in `packages/nana-pack/lib/rulings-config.mjs` is set to `"RULINGS UNAVAILABLE:"`, the rulings marker. Pin that the guide's unavailable line starts with `SEAT GUIDE UNAVAILABLE:` and differs from `RULINGS_UNAVAILABLE`.
3. **Stale Windows copy (R-3024).** Pair: on win32, the doctor row checks only that the file exists, so a copy whose bytes differ from the source shows OK. Pin that doctor fails the `pi nana-seat.md` row for a stale copy under `NANA_SETUP_PLATFORM=win32`, The existing branch runs only when `process.platform` is win32, so it cannot fail on macOS; the new pin must run on every platform.
4. **Heading drift (R-3021, R-3025).** Pair: `SEAT_GUIDE_HEADING` in `rulings-config.mjs` changes to `"## Seat guide"`, while `seatGuideHeading` in `packages/nana-setup/lib/install-check-config.mjs` keeps the old words. Add a test that pins the two values equal. Do not add a nana-setup import of a nana-pack module unless the map's layer rules already allow it.

## Fixes

5. **Guide source path.** Install and doctor build the guide's source path by hand. `ruleSource(SEAT_GUIDE_FILE)` in `packages/nana-setup/lib/steps.mjs` already returns it, and doctor already imports `ruleSource`. Call it in both places. The extension keeps its own join.
6. **The pi sentence (R-3026).** The guide's pi sentence says a pi seat starts another lane's build from another pi session or the desk. A foreground pi seat cannot do that. Reword it to say the seat asks the user to start that build from another pi session or the desk. Move it next to the "Before you end your turn" bullet it qualifies. Keep every sentence the seat-rule tests pin, and update the R-3026 pin to the new words.

Numbers that must not move: the sealed cap `SEAT_GUIDE_READ_CAP` stays 8192; the rulings section stays byte-identical for every role.

Run `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs` once. Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each new test title and the pair it catches; the guide's new pi sentence in full; each departure from the Precedent; every existing test you changed.

## Precedent

- `packages/nana-pack/tests/rulings.test.mjs`: build 1's role cases and sealed values.
- `packages/nana-setup/tests/rulings-install.test.mjs`: build 1's doctor rows.
- `packages/nana-setup/lib/doctor.mjs`: the `ruleSource` call on the rulings row.
- `packages/nana-setup/bin/install-check.mjs`: the rulings heading check.
- `packages/nana-setup/tests/seat-rule.test.mjs`: the guide's pinned sentences.
