# Seat checks — knowledge-pull-fail-open-pin build 1 and a merge of main, tip a35ee8c (2026-10-19)

- CI run 39340529846 on draft pull request #82 (a35ee8c, build 1 `e0052c2f` plus a merge of main `9d09376e`; GitHub's
  merge commit `ae242746` onto 9d09376e): macOS `166 files: 164 PASS, 0 FAIL, 2 SKIP` (7,667 checks pass, 0 fail, 20
  skip); Ubuntu `166 files: 164 PASS, 0 FAIL, 2 SKIP` (7,612 pass, 0 fail, 38 skip); Windows `166 files: 149 PASS, 0
  FAIL, 17 SKIP` (6,608 pass, 0 fail, 79 skip; `ci-windows-run-1.log`). The skips are main's declared ones:
  hooks-win32-exec and study-tasks off Windows, the 16 desk files and study-tasks on it. install-check passes on macOS
  and Windows. None of main's known failures showed (Ubuntu GP1/GP2, the PR merge-commit R-291 total).
- The lane's files on every leg: extension.test passes 38 (36 before) and hook.test 98 (96 before).
- The Windows leg prints each new check. R-234 PASS and R-895 PASS, after `NOTE real-handler cases ms: missing 75,
  control 108, non-zero 102, silent 97, whitespace 97, late 2017`. R-228's seal PASS. R-228's boundary check PASS,
  after `NOTE stdin cap: at-cap 262144 bytes -> 334 chars, over-cap 262145 bytes -> 0 chars, reason bad-json`. So the
  adversary's claim most likely wrong, the new block green on Windows, held: the control stub injected in 108 ms, well
  inside the 2 s deadline, and the late case settled at 2,017 ms. The macOS and Ubuntu legs print file totals only;
  the builder's macOS timings read missing 29 ms, control 50, non-zero 49, silent 46, whitespace 49, late 2,005.
- The seat on a35ee8c: `node scripts/requirements-trace.mjs` reads 1,414 rows, 0 off form, exit 0; `npm run map:check`
  reads 0 problems. R-228, R-234, R-895 and R-896 read `implemented`; the lane adds no row. `git diff --quiet
  9d09376e..HEAD -- packages/nana-knowledge/extensions packages/nana-knowledge/lib packages/nana-knowledge/bin` exits 0:
  the extension, `lib/hook.ts` and the CLI are byte-unchanged.
- The builder's report (a Claude Sonnet 5 subagent, build 1, `e0052c2f`): verdict DONE. Each wrong-code try turned red
  the check the plan predicted: W1, W2, W3, W7 and W10 (the default export building its pull with a 60 s timeout,
  caught only by the handler-level late case) R-234; W4 R-895, then the file crashed at check 5, as predicted; W6 the
  existing 5b null check only; H1 the seal only; H2, H3 and H4 the boundary check; P1 and P2 the existing session and
  source checks. The report as relayed to the seat does not mention W5; the plan records W5 green (unpinned). The seat
  did not re-run the tries.
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle. The plan's
  known limits and its four cut walker rows go to HANDOFF as carried lines.
- Main has moved since the merge: main is `c827fcf8` (trust-finds-pi and win-path-commands landed). A merge of main and
  a confirmation round follow before the land.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on a35ee8c):

  ```
  tree movement 9d09376..a35ee8c: 4 rows in 1 features
  FEAT-004 · Retrieve relevant context with provenance
    R-228 untested -> implemented
    R-234 untested -> implemented
    R-895 untested -> implemented
    R-896 untested -> implemented
  ```
