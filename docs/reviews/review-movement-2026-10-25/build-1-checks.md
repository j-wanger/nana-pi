# Review movement — builder checks

Feature: FEAT-007. Platform: macOS (Darwin), Node v22.22.2.
All work used the review-movement lane worktree. No model sessions, install check, push or CI run were started.

## Requirements and tests

R-2900–R-2908 were added as untested before their tagged tests and implementation.
The first run against the unchanged launchers failed R-2900, R-2901, R-2902, R-2905, R-2906, R-2907 and R-2908 (exit 1).
Before implementing the helper, unconditional launcher appends failed R-2903 and R-2904; a 10-second config failed the seal (exit 1).
The restored implementation passed all nine rows and the seal.

## Hand-applied wrong-code checks

Each mutation below was applied to code or the ledger, never to an assertion, run separately and restored without committing it.
C means `npm test -- claude-review.test.mjs`; I means `npm test -- immutable-review.test.mjs`; M means `npm test -- review-movement.test.mjs`.
Combined letters mean one command with those file arguments. Every row below returned exit 1 and printed the named failed checks.
Numbers 1–24 match the must-meet's seat wrong-code pairs; 25–29 cover the remaining row cases and line-ending handling.

| Pair | Wrong code | Command | Named checks observed red |
|---|---|---|---|
| 1 | Claude helper call removed | C | R-2900, R-2906 |
| 2 | Claude section after standard | C | R-2900 |
| 3 | Claude section twice | C | R-2900 |
| 4 | Helper base HEAD | C I | R-2900, R-2901 |
| 5 | Helper cwd and root use launcher's cwd | C | R-2900 |
| 6 | Wrong movement heading | C I | R-2900, R-2901 |
| 7 | Lead omitted | C I | R-2900, R-2901 |
| 8 | Helper throws on movement failure | C I | R-2902, R-2908 |
| 9 | Helper returns null on movement failure | C I | R-2902, R-2908 |
| 10 | Failure reason omitted | C I | R-2902, R-2908 |
| 11 | Working-tree existence instead of HEAD | C | R-2903 |
| 12 | HEAD check removed | C I | R-2903, R-2904 |
| 13 | pi section passed as argv text | I | R-2901 |
| 14 | pi section file inside checkout | I | R-2901 |
| 15 | requirements-moved uses process.exit(main()) | C I | R-2906, R-2907 |
| 16 | Helper maxBuffer 65,536 | C I | R-2906, R-2907 |
| 17 | pi movement append removed | I | R-2901, R-2907 |
| 18 | pi movement before standard | I | R-2901 |
| 19 | pi empty section file for null | I | R-2904 |
| 20 | pi movement-folder cleanup removed | I | R-2901 |
| 21 | Manual movement maker restored | M | R-2905 |
| 22 | Movement's person reader removed | M | R-2905 |
| 23 | Config base master | C I M | seal, R-2900, R-2901 |
| 24 | Config timeout 10,000 | M | seal |
| 25 | Stderr split on LF only | C | R-2902 |
| 26 | pi movement appended twice | I | R-2901 |
| 27 | Absent committed ledger gets a none section | C I | R-2903, R-2904 |
| 28 | Movement prompt reader restored to rule | M | R-2905 |
| 29 | Helper removed from maker paths | M | R-2905 |

Pair 13's R-2907 half fails only on Windows; it was not proved here. The macOS pipe mutation in pair 15 failed both large-report checks.
The R-2902 check includes CRLF, trailing space/tab, whitespace-only initial lines and no-final-newline forms of a single nonempty stderr line.
No check claims to pin multiple nonempty stderr lines or force pi-review's section-file write failure.

## Timings and targeted suite

Before (macOS): claude-review.test.mjs 6.6s; immutable-review.test.mjs 14.5s.
After, final targeted run (macOS): claude-review.test.mjs 10.9s; immutable-review.test.mjs 19.0s.

Command: `npm test -- claude-review.test.mjs immutable-review.test.mjs review-movement.test.mjs requirements-moved.test.mjs linked-launch.test.mjs review-standard.test.mjs land-records.test.mjs requirements-deliverables.test.mjs requirements-tree.test.mjs test-runner.test.mjs`.
Exit 0:

```text
10 files: 10 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 234 pass, 0 fail, 1 skip · 87.6s
```

`npm run map`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and the seat title check each exited 0.
`node scripts/requirements-tree.mjs --root .` exited 0 and printed:

```text
deliverables: 21 of 21 made and read by code, 21 parked
```

## Locked full suite and blocker

`npm run test:locked` completed with exit 1. Its output remains outside the worktree in the OS temp directory, as the brief requires.

```text
223 files: 220 PASS, 1 FAIL, 2 SKIP, 0 WARN · checks: 8548 pass, 4 fail, 44 skip · 605.5s
```

Only templates-render.test.mjs failed. Its four failed checks were:

- typescript scaffold: all declared skill claims resolve independently for requirements
- typescript scaffold: all declared skill paths resolve independently
- python scaffold: all declared skill claims resolve independently for requirements
- python scaffold: all declared skill paths resolve independently

Each reports that the must-meet's exact `scripts/requirements-moved.mjs` reference at requirements/SKILL.md:142 does not exist in the declared scaffold target.
The script belongs to nana-pi, not the generated project. R-598 requires skill paths to resolve from the target root or the skill directory.
The specified replacement removes the old home-qualified script reference. Keeping the exact replacement and the existing checker leaves these four checks red.
No checker, template, R-598 row or required skill sentence was changed to hide this conflict.
The brief needs to permit a home-qualified script reference in that sentence, or explicitly authorize another resolution.
No commit was made: the brief requires the one commit to follow a green full suite.

After the locked run, map:check, readme:check, requirements-trace, requirements-tree --check, requirements-tree --root ., known-bugs --root . and the seat title check all exited 0.
The tree count remains `deliverables: 21 of 21 made and read by code, 21 parked`; the title check printed `0 missing`.
`git diff --check` exited 0. The lane worktree remains dirty because the blocked change is uncommitted.
These are working-tree checks, not checks on a new last commit.

## Existing checks and precedent

Touched paths:

- REQUIREMENTS.md — nine rows, widened R-2561, movement maker/readers and two parks.
- packages/nana-pack/lib/review-movement-config.mjs — ten tunables and provenance.
- packages/nana-pack/lib/review-movement.mjs — shared advisory process helper.
- packages/nana-pack/bin/claude-review.mjs — section before the standard.
- packages/nana-pack/bin/pi-review.mjs — external section file and cleanup.
- scripts/requirements-moved.mjs — only its final exit form.
- packages/nana-pack/tests/ledger-repo.mjs — named fixture move and file-written report.
- packages/nana-pack/tests/requirements-moved.test.mjs — shared fixture import only; checks unchanged.
- packages/nana-pack/tests/claude-review.test.mjs — four named checks and stderr variations.
- packages/nana-pack/tests/immutable-review.test.mjs — four named checks and prompt-copy fake.
- packages/nana-pack/tests/review-movement.test.mjs — ledger claim check and seal.
- packages/nana-pack/tests/review-standard.test.mjs — pack-copy dependency repair.
- AGENTS.md and packages/nana-pack/skills/requirements/SKILL.md — required rule text.
- packages/nana-pack/README.md — dependencies and launcher contract.
- docs/code-map.md and docs/requirements-tree.md — generated files.
- docs/review-movement-checks.md — this technical record.

No existing assertion, title or req marker was changed or removed.
requirements-moved.test.mjs imports the named fixture move; its checks and fixture ledger contents stay unchanged.
immutable-review.test.mjs's fake pi now copies existing appended files and records structured argv before signaling readiness.
Departure: review-standard.test.mjs's pack-copy fixture also copies the two new movement modules, because the launcher's new static imports otherwise fail before its existing control and refusal checks. Its header and fixture comment were updated; its assertions stay unchanged.
The new R-2902 check imports the shared movement helper for the required line-ending cases; it adds no extra test.
All product helpers follow the named precedent; no private product helper was moved or copied.

Known-bug context touched: the review timeline's lack of an automatic run is now explicitly parked, not fixed. Its code and known-bug file stay unchanged.
The tree outline is parked; its generator is unchanged. The large movement pipe cut is fixed only in requirements-moved.mjs.
The seat retains the forbidden HANDOFF, session and known-bug notes. Windows CI and the independent review remain seat work; this builder did not push.
