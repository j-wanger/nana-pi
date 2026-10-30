Feature: FEAT-029 · Navigate code and investigate impact

Lane map-spawn-edges. Class: ordinary. Final review, round 1, of the branch tip against main.

Threat model: honest variation in our tools' output is in scope (unusual but honest launch spellings, temporary copies, platform path differences, a test that launches through a helper). Deliberate forgery of paths or launch calls is out.

The plan of record is `docs/reviews/map-spawn-edges-2026-10-29/plan.md` (revision 2) and its attack `plan-attack.md`. Rows R-3149, R-3150, R-3152 to R-3160; R-1272 and R-2822 amended; R-3151 unused. Build reports 2 and the built measurements (`scan-built.txt`, `replay-built.txt`, `replay-built-since.txt`) sit in the lane folder.

Who uses this: a later lane will choose which tests CI runs on a pull request from `--impact`. The owner's condition was "make sure we harden code map to cover path based child processes". So the harm that matters most is a test that really launches a changed module but is neither linked nor on the always-run list: a silent miss. A larger always-run list is safe; a smaller one that drops real launches is not.

Things to check in particular:
- Every launch the reader skips (definitions, comments, quoted fixture programs, regex literals) is truly not a launch; name any real launch it skips silently.
- The 11 named lost links in the build report: each one is either wrong, a temporary copy, or now covered by the always-run list. The four `hook-producer.mjs` losses: the build says the hooks that call `runHookProducer` are declared blind; confirm those hooks' tests are on the always-run list.
- `--impact` output and `map:check` still behave for existing callers (R-1272, R-2822, the blast-radius and requirement-rows readers that the plan keeps on the import-only graph).
- The CI run 40991062662 passed; its advisory Linux leg failed with a SIGKILL in `worker-claude.test.mjs`, recorded as a known bug.

Question: does the feature work for its user, and does the change cause a harm the review standard lists?
