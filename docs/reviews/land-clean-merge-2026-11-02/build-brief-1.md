Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-clean-merge. Class: gate. Builder: pi-worker (larger lane). Build session 1. The plan of record is `plan.md` in `docs/reviews/land-clean-merge-2026-11-02/`. It is revision 2, after `plan-attack.md`, which a pi adversary wrote. The owner questions are decided at their defaults: the clean merge counts as review-covered, "no conflict" means git's textual merge inside the plan's supported semantics, and generated-file regeneration is out of this lane. Build it as written, taking the plan's Assumptions A1–A14 and Open choices.

Owner request (2026-11-02, verbatim): "no conflict lane merge needs no CI".

Threat model: honest variation in our tools' output is in scope. That means a merge git calls clean that breaks the build, malformed or failing git output, CI that changes during a land, two lands racing on one main, and git versions and settings. Deliberate forgery is out.

Rows: R-3688 to R-3697 in must-meet order (R-3697 is the seal row). Change R-975, R-977, R-1002, R-981 and R-3432 as the plan's Feature section says, row first.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs`
- `packages/nana-pack/lib/land-ci.mjs`
- `packages/nana-pack/lib/land-config.mjs`
- `packages/nana-pack/lib/land-records-config.mjs`
- `packages/nana-pack/tests/land-fixtures.mjs`
- `packages/nana-pack/tests/land-ci-suite.test.mjs`
- `packages/nana-pack/tests/land.test.mjs`
- `packages/nana-pack/tests/land-merge.test.mjs`
- `packages/nana-pack/tests/land-ci-read.test.mjs`
- `packages/nana-pack/tests/rulings.test.mjs`
- `packages/nana-pack/tests/memory-run-recovery.test.mjs`

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

Report each departure.

## Build

Build from `plan.md` in `docs/reviews/land-clean-merge-2026-11-02/`.

Order: requirement rows first, then the tagged tests, then code, README, AGENTS and rules text.

- **Wrong code first.** Run each new test red against main's code, and record the red runs in the lane folder.
- **New tests.** Put M1–M6, M8 and the seal test in `packages/nana-pack/tests/land-clean-merge.test.mjs`. Put M7 in `packages/nana-pack/tests/land-clean-merge-race.test.mjs`. Do not add cases to `land.test.mjs`; it is near the R-3490 time cap.
- **Existing tests.** Update `land.test.mjs` "non-fast-forward source tip refuses before running the suite" to the new behaviour. Do not shape refusal text around its old regex.
- **Broken literals.** Grep every test and checker for literals this change breaks before you limit edits. Known ones:
  - the R-981 patterns in `land-merge.test.mjs`;
  - the R-2592 sentences in `land-ci-read.test.mjs`;
  - the R-3437 rendered-equals-shared check and the R-3525 last-bullet check in `rulings.test.mjs`;
  - the templates-render equality check.
- **Shared text.** Edit `templates/_shared/working-under-nana-pi.md` and `AGENTS.md`'s rendered region together, both the Review ladder and the Land checklist bullets. They must stay byte-equal.
- **Ruling.** Insert the plan's 2026-11-02 line before the final 2026-11-01 lanes bullet of `packages/nana-pack/rules/nana-rulings.md`. Remove the 2026-10-10 review ruling.
- **Measurement.** Copy the merge replay into the lane folder as `merge-replay.txt`, with its command at the top. The plan's Purpose names the source.
- **Fixtures.** Tests use synthetic git repositories under the OS temp folder, an injected gh and a counting suite command. Make no network call and run no real CI read.
- **Session entry.** Add one session entry to `docs/sessions/2026-10.md`, newest first. Add the plan's known-bug lines to `docs/known-bugs/FEAT-008.md`.

## Done when

Green, run locally:

- every touched test file, including both new ones;
- `npm run map:check`, after `npm run map` for the changed module header;
- `npm run readme:check`;
- the requirements trace, `node scripts/requirements-trace.mjs`;
- `npm run req:tree`, then the tree check;
- the known-bugs check, `node scripts/known-bugs.mjs`;
- `nana-writing` on the session entry;
- `node scripts/identity-scan.mjs --root .`, after `git add`.

Record the lane's mutation pairs. Write the plan's wrong-code pair list as `docs/reviews/land-clean-merge-2026-11-02/seat-mutate.mjs` on the shared mutation runner, and keep its judged record in that folder. Do not run the locked full suite; CI is the suite.

Push and stop.
