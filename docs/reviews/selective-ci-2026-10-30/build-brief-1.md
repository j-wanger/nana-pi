Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane selective-ci. Class: gate (hook today; R-3185's entries make it gate). Builder: pi-worker (larger lane). Build session 1.

Build to the plan of record, `docs/reviews/selective-ci-2026-10-30/plan.md` (revision 3), which has taken the adversary's attack in `plan-attack.md`, on its default for the new question: **drop test selection.** The owner's answers are on issue 274; the seat posted the new default there on 2026-10-30.

## What to build

- **R-3183, `nana-main-ci`:** the seat-side command that reads only main's newest push run of the `ci` workflow, reports every red (a red leg inside a green run, a failed install check or release job, an older red behind a newer unfinished run) with the failed files per leg from the suite records, and with `--post` posts one `next` issue through the local gh from the owner's account: body starts `Seat:`, carries only run id, short SHA, legs and file paths, passes the identity scan first, and is skipped when an open issue with the same title exists. It never posts under a builder or reviewer role. Must-meet test with an injected gh and fixture records, as the plan says.
- **R-3184:** the session-start block line naming that command, beside the issue-watch line, inside the block's cap and with no network call in the hook; and the `nana-seat.md` sentence to run it at session start and after each land.
- **R-3185:** gate-list entries, with pins, for `.github/workflows/ci.yml`, `scripts/test.mjs` and `packages/nana-pack/lib/test-runner-config.mjs` only (the selector files do not exist in this scope).
- Confirm `ci.yml` already runs the full suite on push to `main` on all three systems and has no path filters; if not, make it so, pinned in `packages/nana-pack/tests/ci-workflow.test.mjs`.

Do **not** build R-3178 to R-3182 or R-3186; mark them `planned` with a one-line park note pointing at `measure.mjs` and the measurement files in the lane folder. Do not export `linkRepo` or touch the code map.

## Seat checks this lane gets (gate lane)

The seat runs wrong-code pairs on R-3183 and R-3184 (the plan's pairs that apply: reading the pull-request run instead of the push run; missing a red leg inside a green run; posting without the identity scan; posting a duplicate title), an independent check, the land reviewer, and `node packages/nana-setup/bin/install-check.mjs` locally on macOS before the land. Write your own wrong-code pair for each new test and report it.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

R-3183 to R-3185 are `implemented` with backticked `file::title` evidence; R-3178 to R-3182 and R-3186 are `planned` with their park note. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs` and `node packages/nana-setup/bin/install-check.mjs` are green. Push and report the finished CI run for the new tip, naming the Windows suite leg; rerun a Windows R-3104 timeout once before reporting it.

Report: every row and test changed; each wrong-code pair and its exit codes; each departure from the Precedent.

## Precedent

- `packages/nana-pack/bin/nana-issue-watch.mjs`: the shape of a seat-side command.
- `packages/nana-pack/lib/issue-watch.mjs`: a lib with injected gh.
- `packages/nana-pack/lib/ci-records.mjs`: `readCiRecords`, filtered to the push run.
- `packages/nana-pack/lib/suite-records.mjs`: `finalFiles` for failed files per leg.
- `packages/nana-pack/lib/gh-runner.mjs`: the gh runner.
- `packages/nana-pack/lib/frontier-summary.mjs`: the session-start block, where the new line sits beside the watch line.
- `packages/nana-pack/lib/lane-class-config.mjs`: the gate list.
