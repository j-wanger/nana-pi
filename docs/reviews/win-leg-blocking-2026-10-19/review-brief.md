# Review — win-leg-blocking (the Windows test run skips the desk and bench files it cannot pass, each with its reason), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work — the test runner's declared Windows skip list

Review `git diff b3f6ec2..HEAD` on `feat/win-leg-blocking` (main was `73f39d5` when this brief was written; `git
merge-base HEAD main` is `b3f6ec2`, so the diff holds only the lane). The plan of record is
`docs/reviews/win-leg-blocking-2026-10-19/must-meet.md`: four checks, rows R-1380 to R-1383, plus the seat evidence it
names; `plan-attack.md` holds the adversary's AMEND and its probes; `build-brief-1.md` the one build. The seat's record
is `seat-verify-d6b1bad.md`: CI per leg (the Windows log beside it, `ci-windows-run-2.log`), the wrong-code pairs
(`seat-mutate.mjs`, `seat-mutate-output-f74ab32.txt`, 6 of 6 red) and the independent check
(`independent-check-d6b1bad.md`, run on f74ab32; its F1 and F2 fixed in 60f8362).

Tree movement: four rows added under FEAT-031 (R-1380 to R-1383, all `implemented`); FEAT-031 54 rows to 58, CAP-07 219
to 223, the leaf total 1,215 to 1,219. No row changed.

The code under review: `packages/nana-pack/lib/windows-skips-config.mjs` (new) and one line of `skipReason` in
`scripts/test.mjs`. Judge whether on win32 the runner skips exactly the listed files with each one's declared reason and
never starts them, whether every unlisted desk and bench file still runs there, whether off win32 nothing changes, and
whether any edit to the runner every land rests on could hide a failure outside desk and bench.

Threat model: honest variation in our tools' output and the OS (platforms, temp-path spellings, npm layouts) in scope;
deliberate forgery out. Lane class: gate (the repo test runner, `scripts/test.mjs`).

Check: (1) each must-meet check is not vacuous and fails on main's runner or on its named wrong form; (2) the list names
only collected desk and bench test files, and a listed file never starts on win32; (3) off win32 every file runs as on
main; (4) nothing else changed beyond the fixture copies, the tree outline and its leaf total, docs and map;
(5) HANDOFF and the session entry are true; (6) any MUST.
