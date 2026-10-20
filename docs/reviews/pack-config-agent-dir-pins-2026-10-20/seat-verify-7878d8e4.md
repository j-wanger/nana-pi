# Seat checks — pack-config-agent-dir-pins build 1, tip 7878d8e4 (2026-10-20)

- Build, by a Claude Sonnet 5 subagent (`build-brief-1.md`): one commit 7878d8e4 on the plan commit a388463f, based on
  main 385c633f. Tests, rows and the code map only: two new checks in `agent-dir-config.test.mjs` (R-193, R-825), one
  new check and one new `// req: R-781` marker on the existing objective check in
  `config-handlers-malformed.test.mjs`, both headers updated, R-193, R-825 and R-781 flipped untested to implemented
  (R-781's Evidence opens with its declared limitation), `docs/code-map.md` regenerated. No `lib/`, `bin/` or
  `extensions/` change. The seat's notes commit adds only this record, the Windows log, the review brief, HANDOFF and
  the session entry.
- CI run 39389264752 on draft pull request #115 at 7878d8e4 (GitHub's merge commit c06d0565 merges 7878d8e4 into its
  own ancestor 385c633f, so the tree tested is 7878d8e4's):
  - macOS 175 PASS, 0 FAIL, 2 SKIP of 177 files (7,842 checks pass).
  - Ubuntu 174 PASS, 0 FAIL, 3 SKIP of 177 files (7,781 checks pass).
  - Windows `177 files: 160 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6777 pass, 0 fail, 104 skip`
    (`ci-windows-7878d8e4.log`, Node v22.23.3). The 17 skipped files are main's declared set.
  - install-check: macOS and Windows success.
  - The two touched files on native Windows (log lines 981 and 1371), against 98 and 98 on the base's Windows runs:
    ```
    PASS  packages/nana-pack/tests/agent-dir-config.test.mjs              100 pass  1.4s
    PASS  packages/nana-pack/tests/config-handlers-malformed.test.mjs     99 pass  1.9s
    ```
    Each new check prints PASS by title there (log lines 971, 972 and 1370). R-193's line reads
    `stranded-exists=true noted=true stranded-opened=false active-opened=true`, and the wrapper recorded the active
    `r193-agent\nana-pack.json` five times. R-825's line reads `{"i":{"notes":0,"lines":0},"ii":{"notes":0,"lines":0},
    "iii":{"notes":0,"lines":0}}`.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed at ca27d86 and Windows main
    reads 0 FAIL since 4be0b79, both in the base; no R-291 merge artifact arises, since GitHub's merge commit holds
    7878d8e4's tree.
- The plan's claim most likely wrong held on Windows: `syncBuiltinESMExports` carries the wrapped node:fs functions to
  the pack's `import * as fs` namespaces there, since the guard needs the active file's open recorded and Windows
  records it. On Ubuntu the file passes too (0 failing files, and the check has no skip); the seat holds no Ubuntu log,
  so that leg's line is not quoted. Node 24 has not run it.
- Wrong-code pairs: none by the seat (an ordinary lane). By the builder's report, which the seat did not re-run: W1,
  W2, W3, W8 and W9 turn R-193's check red and no other new check (W3 also reds objective-golden, expected); W4 and W5
  red R-825's check only (W5 also reds the three existing (a) checks, expected); W6 reds R-781's check only; W7 reds
  R-781's check plus config-normalize and post-edit-status, expected. All nine ran on macOS.
- Builder process: during W8 the builder probed in the lane worktree, not a temp clone. The roster lookup's fallback
  then read the real machine's `<home>/.pi/agent/nana-pack.json` once. It only read; the builder reverted the code,
  nothing was written and nothing shipped. Recorded as one HANDOFF seat-process line: probes belong in a temp clone
  with a temp HOME.
- Independent check: none (an ordinary lane), so no findings to settle.
- The plan's open question on Windows spellings: `loadConfig` compares the two folders with `path.resolve`, which folds
  neither letter case nor 8.3 names. The plan concluded the mismatch note still cannot misfire: a present active file
  is never treated as stranded, and an absent one is also absent under the default spelling, so `existsSync` fails.
  The adversary saw no note on macOS's case-insensitive disk with `.PI/AGENT`, file absent or present; the 8.3 case
  is inferred. No Windows run tried either spelling, so HANDOFF carries it as a residual.
- The plan's other known limits, carried to HANDOFF one line each: the no-read check sees only in-process reads
  through node:fs (no child process, no copyFile or cp); it covers the pack's readers only, not nana-setup install or
  doctor; under a malformed config no check reads notify, handoff, writing or roster-notice output (R-781's declared
  limitation); no post-edit-only wrong code was found and the tries ran on macOS only. Recorded here only: R-057,
  R-763 and R-242 stay untested and fit a later gate pin lane; the rail shows them.
- Rows: R-193, R-825 and R-781 read `implemented` in REQUIREMENTS.md, text unchanged. No row added; the R-2110 to
  R-2119 block stays unused. The seat helper's re-run at the notes commit: `node scripts/requirements-trace.mjs` reads
  `1543 total (1280 implemented · 1 planned · 34 retired · 223 untested · 5 violated)` and `ears: 0 rows off form
  (allowance 0)`; `npm run map:check` reads 336 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base 385c633f):
  ```
  tree movement 385c633..7878d8e: 3 rows in 2 features
  FEAT-011 · Keep policy changes safe and recoverable
    R-193 untested -> implemented; also applies: FEAT-015
    R-781 untested -> implemented; also applies: FEAT-001, FEAT-002, FEAT-023, FEAT-030
  FEAT-013 · Install and connect harness runtimes
    R-825 untested -> implemented
  ```
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and a local install check
  (the lane touches no `packages/nana-setup` file or hook).
- Main is 445f4d5b at this writing, 11 commits past the merge base 385c633f (ci-suite-timeout and
  knowledge-index-pins landed). A merge of main and a confirmation round are due before the land; HANDOFF and the
  session file will meet those lanes' lines at the same places.
