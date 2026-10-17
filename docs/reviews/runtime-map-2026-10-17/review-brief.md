# Review — runtime-map (measured test files and seconds under the code map's impact command), 2026-10-17 (gpt-5.6-sol and gpt-6-astra, in parallel)

Review `git diff 128d7cf..HEAD` on `feat/runtime-map` (the lane merged main at d8bf0ec; 128d7cf is the seat's feature-first cut). The owner asked
for code runtime evaluation in the code map. `npm run map:measure` runs the locked suite once under per-file V8 coverage and saves, outside the
repository (under the clone's git common directory), which tracked files each test file ran, children included, and its seconds;
`npm run map:impact <file>` lists those tests under each file. The plan of record is `docs/reviews/runtime-map-2026-10-17/must-meet.md`: nine
rows (R-1270 to R-1278) and nine must-meet tests; `CHANGE.md` §3 is the design reference; `adversary.md` is the adversary's pass.

**The bar (the owner's 2026-10-17 feature-first ruling).** Send back only for: a must-meet test that is missing, or still passes with its feature
removed; a bug that stops the feature's main use (measure, then impact, on macOS; the runner unchanged with the knob unset on every platform); or
a harm: data lost or corrupted, a test, build step or seat script writing outside the lane worktree or the temp folder, a broken install or hook,
or something main does today no longer working. Every other finding is a SHOULD or NOTE the seat records as a known bug. Threat model: honest
variation in our tools' output in scope; deliberate forgery out. **Lane class: gate** — the lane edits `scripts/test.mjs`, the land gate's suite
runner, so it gets both reviewers and the seat's wrong-code pairs on that edit; the measure and impact parts get the ordinary bar.

Records in the same folder: the seat's check record `seat-verify-a3e39c6.md` (the suite, two real measurements, the impact view on real data, four
runner pairs all red, the independent check), `seat-mutate.mjs` and its output, two build briefs. Also `HANDOFF.md` and the session entry.

Check: (1) with `NANA_COVERAGE_DIR` unset, the runner's verdicts, output and exit codes are as on main, on macOS, Linux and Windows; (2) a real
measurement then impact gives a developer true lists and seconds, and stale data reads as stale; (3) a stop ends only the suite's tree and leaves
no coverage folder; (4) each must-meet test fails with its feature removed; (5) HANDOFF and the session entry are true; (6) any send-back item.
