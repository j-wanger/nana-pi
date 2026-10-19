# win-leg-flip — must-meet

Feature: FEAT-019 · Release usable templates and report support
Class: ordinary. CI config is not on the install, hook or gate list. The lane edits packages/nana-setup/ (the README Support line and one test comment), so the seat runs the install check locally before the land.

## Feature
IF the macOS or Windows leg of the root CI suite job fails THEN the workflow skips its main-branch release job. A failing Linux leg alone still does not stop it.

## Ruling and evidence
- Ruled 2026-10-17: the Windows CI leg blocks main after two green main runs. The win-leg-blocking must-meet names this follow-up lane and its one-line ci.yml change.
- The condition is met. Main runs 39265333844 (4be0b79), 39268388415 (06a874a) and 39271247545 (2a96090) each read Windows "154 files: 133 PASS, 0 FAIL, 21 SKIP". Since 4be0b79, 8 of 9 Windows runs on any branch were green; the one red run had a real leaf-total failure, not a flake.
- A blocking leg's failure skips release: macOS failed on main runs 37834866379 and 38907014916, and release was skipped both times.
- Here "blocks" means three things: the run turns red, release is skipped, and a pull request check fails. Main has no branch protection (the API returns 404, with no rulesets), and nana-land reads no CI result. So CI never stops a land.

## Threat model
In scope are honest edits to ci.yml:
- a rewritten or compound expression;
- a step-level continue-on-error;
- a release `if:` that uses always(), failure() or cancelled();
- a release that drops `suite` from its needs list;
- a matrix that drops a leg.
Out of scope is deliberate forgery, such as `npm test || true`. R-1313 pins the exact Windows test line.

## Design
- ci.yml suite job: `continue-on-error: ${{ matrix.os == 'ubuntu-latest' }}`. Nothing else in ci.yml changes.
- ci-workflow.test.mjs gets one small reader and two checks.
  - The reader collects the suite job's continue-on-error lines. More than one line fails, and so does any line not at the four-space job level, a step key included.
  - It evaluates the job-level value for each matrix OS. It accepts four forms: absent, `true`, `false`, or one `${{ matrix.os ==|!= '<os>' }}`. Any other form fails and names the expression.
- R-1530 also asserts three things:
  - macOS and Windows are suite matrix legs;
  - the release `needs:` list holds `suite`;
  - the release job header, before `steps:`, calls none of always(), failure() or cancelled().
- R-1032 is retired, and its check is deleted.
- R-597's check drops only its continue-on-error literal. R-1530 and R-1531 now hold that pin, macOS included.
- R-684 is reworded in place. One clause changes, in the canonical line and in the three front doors.

## Must-meet
| # | Row | Test (file::title) | Red today |
|---|---|---|---|
| 1 | R-1530 | packages/nana-pack/tests/ci-workflow.test.mjs::R-1530: a failing macOS or Windows suite leg stops the release job | Yes. Probe: FAIL on today's ci.yml ("windows-latest leg continues on error"); PASS on a flipped copy |
| 2 | R-1531 | packages/nana-pack/tests/ci-workflow.test.mjs::R-1531: a failing Linux suite leg alone does not stop the release job | No. It guards against flipping too far, since Ubuntu is non-blocking today. Probe: FAIL with the line deleted |
| 3 | R-684 (reword) | packages/nana-pack/tests/templates-render.test.mjs::three front doors carry one identical scoped platform claim | Yes. Under the new canonical line, all three front doors still carry the old clause |

Adversary probe: I built the reader as designed and ran it on temp copies of ci.yml with ten wrong versions:
- today's file;
- `true`;
- the line deleted;
- a step flag on the Windows test step;
- release `if: always() && …`;
- release `if: ${{ !cancelled() }} && …`;
- release `needs: [install-check]`;
- Windows dropped from the matrix;
- a compound `&&` expression;
- `${{ matrix.experimental }}`.
Each one turned R-1530 or R-1531 red. The flipped file passed both checks.

## Old contract text (all of it changes here)
- The Support line in AGENTS.md, README.md and packages/nana-setup/README.md, and canonicalSupport in templates-render.test.mjs.
- README.md lines 25, 182 and 215 (the release sentences).
- packages/nana-setup/tests/hooks-win32-exec.test.mjs, comment line 11.
- The R-597 literal and the R-1032 check.
These stay unchanged:
- dated history: HANDOFF Landed lines, the sessions archive and the hardening plan;
- templates/_shared, which states nothing about CI legs;
- the product report's FEAT-019 assessment, which shows out of date by design (no test reads it).

## Known limits
- The checks read ci.yml as text, not as GitHub evaluates it.
- The blocking leg does not cover the files Windows skips (21 at 2a96090).
- The suite job has no timeout, so a hung Windows leg can hold release for up to six hours, GitHub's default. That is not new: release already waits for every leg.
- README line 182 still says the Linux leg fails one symlink-escape check. That has been stale since linux-path-spelling, and it is left for the Linux question.
- After the flip, a lane whose new checks fail on Windows turns main red and holds release until someone fixes it. That is the intended effect.

## Open for the owner (not this lane; the seat records each on its own HANDOFF line)
- Should the Ubuntu leg block under the same rule? It first read green at ca27d86. One more green main run meets the two-run bar.
- The win-leg-blocking spec left this question open for this lane: should a land also need a green Windows leg on the reviewed tip? nana-land reads no CI result. Enforcing that would be a separate land-tool lane.

## Seat items (the builder does not do these)
- Add a HANDOFF Landed line. It replaces the 2026-10-19 line's "a later lane makes the Windows leg block main".
- Update the Next "Now" bullet, add the two Open lines above, and write the session note.
- Run the install check locally.
- Carry the requirements-moved output in the review brief and the land.
- Land only when the latest main run's Windows suite leg is green.