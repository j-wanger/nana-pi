# Review — bench-win (every bench test file runs and passes on Windows), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-038 · Interpret workflow experiments and their limits — the catch ledger's judge call; FEAT-031 · Run
checks reliably and without contaminating work — the declared Windows skip list

Review `git diff 4be0b79..HEAD` on `feat/bench-win` (the lane's base is `4be0b79`; `git merge-base HEAD main` is
`4be0b79`, so the diff holds only the lane; main has since moved to `2a96090`). The plan of record is
`docs/reviews/bench-win-2026-10-19/must-meet.md`: two checks, rows R-1520 and R-1521, plus the test-only edits and the
seat evidence it names; `plan-attack.md` holds the adversary's AMEND and its probes; `build-brief-1.md` the one build.
The seat's record is `seat-verify-43926fe.md`: CI per leg, the Windows log beside it (`ci-windows-run-1.log`), the
red-first counts and the builder's wrong-code tries W1–W7. No wrong-code pairs and no independent check (ordinary lane).

Tree movement: two rows added, both `implemented` — R-1520 under FEAT-038 (18 rows to 19, CAP-08 87 to 88) and R-1521
under FEAT-031 (58 to 59, CAP-07 227 to 228); the leaf total 1,242 to 1,244. No row changed.

The code under review: `apps/bench/lib/catch-judge.mjs` (`callJudge` takes an optional `spawn`, default `spawnSync`,
and starts the judge with `cwd: os.tmpdir()` instead of `"/tmp"`) and the four bench entries removed from
`packages/nana-pack/lib/windows-skips-config.mjs`. Judge whether the real judge now starts in the OS temp folder on
every platform with nothing else about the call changed; whether the four bench files run and pass on Windows with no
check weakened, renamed or silently dropped (agentdir's `0700` check is the one per-check SKIP, on win32 only); and
whether the test edits (stub judges as `.mjs` run through node, argv and usage expected paths built from the temp
folder and the fixture root) still fail on the wrong forms they guard.

Threat model: honest variation in our tools' output and the OS (drive letters, backslashes, 8.3 short temp paths, no
POSIX mode bits, scripts Windows cannot start without a shell, temp folders set by the runner or the caller) in scope;
deliberate forgery out. Lane class: ordinary — bench code and tests, and entries removed from the skip-list data
module; `scripts/test.mjs`, hooks, extensions, the gate and the land and review tools are untouched.

Check: (1) R-1520 and R-1521 are not vacuous and fail on main's code or on their named wrong forms; (2) the edited
existing checks keep their titles and still fail when their product behaviour breaks (W5, W6, W7); (3) "judge
missing" and the CLI checks still use the platform's own spawn; (4) no test writes outside the temp folders it owns,
and the R-1520 check restores TMPDIR, TEMP and TMP; (5) nothing else changed beyond the tree outline, its leaf total,
the bench README and the code map; (6) HANDOFF and the session entry are true; (7) any MUST.
