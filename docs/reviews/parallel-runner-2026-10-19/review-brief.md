# Review — parallel-runner (the locked land suite runs four test files at once), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Review `git diff 713d6aa..HEAD` on `feat/parallel-runner` (the lane branched from main at `4be0b79`, built through
`1932efe`, and merged main `713d6aa` in `23c95f2`; `git merge-base HEAD main` is `713d6aa`, today's main; `d482325` adds
the seat's evidence on the merged tip to `seat-verify-1932efe.md` and HANDOFF). The plan of
record is `docs/reviews/parallel-runner-2026-10-19/must-meet.md`: R-1470 to R-1477, with the adversary's amendments
inside; `plan-attack.md` holds its reasons, and `build-brief-1.md` and `build-brief-2.md` the two builds. The seat's
record is `seat-verify-1932efe.md`: CI on all three legs (the Windows log `ci-windows-run-1.log` beside it), the seat's
parallel full locked run (154 files, 0 failing, 269.3 s), the wrong-code pairs (`seat-mutate.mjs`: 24 of 27 red on
d50de2f, 26 of 27 on 5782c50, outputs beside it; M16 a declared survivor), the independent check
(`independent-check-1932efe.md`, run on d50de2f: HOLDS, no MUST; its finding 1 fixed in build 2, finding 2 a residual)
and one seat probe (a parent holding an IPC channel now waits for the runner).

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 713d6aa..d482325: 8 rows in 1 features
FEAT-031 · Run checks reliably and without contaminating work
  R-1470 new (implemented)
  R-1471 new (implemented)
  R-1472 new (implemented)
  R-1473 new (implemented)
  R-1474 new (implemented)
  R-1475 new (implemented)
  R-1476 new (implemented)
  R-1477 new (implemented)
```

Eight new rows in FEAT-031; leaf total 1,298 to 1,306. No existing row changed.

The code under review: `scripts/test.mjs` (the `--jobs=N` parse and refusal, the pool, one write per file block,
collection-order WARN and `failed:` lines, the sets behind cleanup, the pipe-holder reap after the one fixture that holds
it, and the end by `process.exitCode`); `scripts/test-locked.mjs` (an unfiltered run passes `--jobs=`); the new
`packages/nana-pack/lib/test-runner-config.mjs`; one README paragraph. Tests: the new
`packages/nana-pack/tests/test-runner-parallel.test.mjs`, R-1476's check in `test-locked.test.mjs`, the config copy in
the `test-runner` and `runtime-map` fixtures, and the R-291 leaf total. Judge whether a parallel run reports what a
serial run reports (labels, counts, excerpts, warnings, failed list, self-test verdict, totals, exit code), whether the
serial path (`npm test`, CI, `NANA_SUITE_JOBS=1`) is main's, whether a stop kills every running tree and removes every
temp root, and whether the exit code nana-land reads can ever be 0 for a red run.

Threat model: honest variation in our tools' output and the OS is in scope (test timing under load; darwin, linux and
win32; core count; how signals arrive, POSIX signals or the IPC trigger on Windows; how npm passes arguments);
deliberate forgery is out (a test that hides its own timing bound). Lane class: gate (`scripts/test.mjs` and
`scripts/test-locked.mjs` run the suite every nana-land runs).

Check: (1) each R-1470 to R-1477 check fails on main's runner and is not vacuous; (2) no parallel run exits 0 when a
file is red, timed out or killed, and no bad `--jobs` argument or `NANA_SUITE_JOBS` value runs part of the suite; (3)
the serial path's output and exit code are main's; (4) the end by `process.exitCode` flushes every write, and nothing
on a real caller's path keeps the runner alive after its summary (the seat's probe: a parent holding an IPC channel now
waits until it disconnects; judge whether any caller does that); (5) the four run-alone files and their reasons are
honest, and no timing bound was loosened; (6) HANDOFF and the session entry are true; (7) any MUST.
