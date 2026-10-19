# Seat checks — review-ledger-run-reviewer build 1, tip ac1fbda (2026-10-19)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one pass, verdict DONE. b9cb7577 adds
  rows R-1720 to R-1723 and their tests; ac1fbdac is the fix. Per the builder's report, not re-run by the seat: each of
  the brief's four wrong-code tries turned its named check red on macOS — (a) the caller's environment spread last, so
  it wins (R-1720); (b) only NANA_ROLE set (R-1720); (c) the child environment without `process.env` (R-1721); (d) the
  win32 launch on every platform (R-1721). The builder also ran the full suite (164 files, 162 PASS), which its brief
  forbids ("Single test files only; the seat runs the full suite"). After ac1fbdac, 11e67c35 and 328dff40 add only the
  seat's pair tables and outputs, and b43745f3 merges main 22ccd849. No code or test changed in the lane after ac1fbdac.
- CI run 39319256526 on draft pull request #68 (ac1fbdac; GitHub's merge onto f8d20142, merge commit 76058b3a;
  ac1fbdac already holds f8d20142, so the merge's tree should be ac1fbdac's, inferred):
  - macOS `164 files: 162 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7639 pass, 0 fail, 18 skip`. review-ledger
    `165 pass`; win32-launch `5 pass, 8 skip` (R-1722 and R-1723 SKIP off Windows, as planned).
  - Ubuntu `164 files: 162 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7584 pass, 0 fail, 36 skip`. review-ledger
    `165 pass`; win32-launch `5 pass, 8 skip`.
  - Windows `164 files: 147 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6573 pass, 0 fail, 83 skip`
    (`ci-windows-run-1.log`). review-ledger `163 pass, 2 skip`; win32-launch `15 pass` with no skip. All four new
    checks print PASS on win32:
    ```
    PASS review-ledger run starts its command with NANA_ROLE=reviewer and NANA_HANDOFF=off over a caller's worker role
    PASS review-ledger run -- pi starts pi and records its round
    PASS Windows: review-ledger run -- pi starts the npm-installed pi entry with node and the arguments unchanged
    PASS Windows: review-ledger run -- pi with a pi.cmd that has no npm package starts nothing and consumes no round
    ```
  - install-check: macOS and Windows success. None of main's known failures showed.
  - The plan named a Windows run on the tests-only commit as well; no such run is recorded. The Windows pair X1 below
    (main's by-name spawn) gives the red half instead. So the plan's "claim most likely wrong" is settled both ways on
    Windows: R-1721 to R-1723 fail on the old launch and pass on the fix.
- After CI the seat merged main 22ccd849 into the lane (b43745f3). No hand-written file conflicted; the generated
  `docs/requirements-tree.md` conflicted and the seat's merge helper regenerated it. The trace there reads 1400 rows,
  0 problems. requirements-tree and win32-launch pass as single files on the merged tip.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, `seat-mutate-output-ac1fbdac.txt`, committed in 11e67c35),
  through the shared mutation runner: 7 of 7 red, 6 by exactly their named titles and 1 with an unnamed red, 0
  survived; one shard on ac1fbdac, macOS, Node 22.22.2; baselines review-ledger 165 PASS and immutable-review 18 PASS.
  M1 the caller's environment unchanged (main's form) and M2 the caller's environment winning both turn R-1720 red; M3
  the reviewer env replacing the whole environment and M4 the win32 launcher on every platform both turn R-1721 red; M5
  every command through the pi launcher turns R-1720 red, then six other checks fail and the test file crashes, so
  later checks never ran; M6 only NANA_ROLE in the sealed value turns R-1720 red; M7 pi-review's child env
  without the shared value turns R-974's check red. Declared, no pair: (a) the Windows-only wrong code, run on the
  Windows leg below; (b) pi-review's child env in main's form behaves the same, since the watchdog sets NANA_HANDOFF=off;
  (c) the launcher's working folder used in place of `--tree`, a plan known limit with no test.
- The seat's Windows-only pairs (`seat-mutate-win.mjs`, `win-pairs.mjs`, `seat-mutate-win-output-ac1fbdac.txt`,
  committed in 328dff40): run in place on CI's Windows leg, one at a time, through a scratch CI job on branch
  `seatmut/review-ledger-run-reviewer`, commit 5b5e8eff (ac1fbdac merged with main 22ccd849, plus the table and a
  Windows-only job that sets npm_execpath as `npm test` does); CI run 39329561483; never merged. Baselines green:
  review-ledger 163 PASS, win32-launch 15 PASS. X1, pi spawned by name as before the lane: R-1721 and R-1722 FAIL
  (R-1723 fails too). X2, pi started through cmd.exe instead of its npm entry: R-1722 FAIL (R-1723 fails too). X3, the refusal
  reported after admission with no release: R-1723 FAIL. 3 of 3 red. The shared runner could not judge these pairs on
  Windows: in the seat's earlier scratch runs its baseline failed for win32-launch (5 PASS, 1 FAIL), because that file's
  fixture reads npm_execpath, which `npm test` sets and a runner spawning node directly does not, and its record kept
  only the counts, not the failing baseline's FAIL lines. That is a HANDOFF residual for the mutation runner.
- Independent check (`independent-check-ac1fbda.md`, a private clone at ac1fbdac and a base clone at 77aa31d1, under a
  temp HOME): HOLDS, no MUST, nine probes. review-ledger 165 PASS; win32-launch 5 PASS, 8 SKIP on macOS. A caller's
  NANA_ROLE=worker and NANA_HANDOFF=on reach the child as reviewer and off, other variables pass through, and argv is
  unchanged with no name added (main: worker and on). With no pi on PATH, lane and main fail alike and keep no round. A
  forced-win32 refusal comes before admission and creates nothing in the temp HOME. pi-review's child env and argv
  match main's. Non-pi commands, `check` and `report` behave as on main. The knowledge hook writes nothing under a
  `review-ledger run` reviewer, where main's wrote its index. Swapping the env spread fails R-1720's check.
  immutable-review 18 PASS; map:check 0 problems; readme:check 706 claims, 0 problems. An argument with a space stays
  one argument, and the child runs in `--tree`. Findings and how each was settled:
  1. Known bug: HANDOFF still said `review-ledger run` sets no reviewer role and `review-ledger run -- pi` fails on
     Windows. Fixed in the seat's notes commit that adds this record: the knowledge-ruling line keeps only its
     review-test fixture part, and the roster line now says an npm-installed pi starts on Windows.
  2. Known bug, coverage: off Windows nothing tests the first-word `pi` branch, and R-1722 and R-1723 read
     implemented while they SKIP on macOS. Settled for Windows by CI run 39319256526 (both PASS) and the Windows pairs
     X1 to X3 (3 of 3 red). The rail still cannot tell which system ran a check; HANDOFF carries that as a residual.
  3. Residual: pi resolves against the launcher's working folder, not `--tree`; they differ only for a relative PATH
     entry, and only on win32. Recorded as a HANDOFF residual.
- Rows: R-1720 to R-1723 read `implemented` in REQUIREMENTS.md; R-1722 and R-1723 say "Windows leg only; SKIP on
  macOS and Linux". R-1125's evidence now says `review-ledger run -- pi …` starts pi its way too; its requirement text
  is unchanged. The seat helper's re-run at b43745f3: `node scripts/requirements-trace.mjs` reads `1400 total (1116
  implemented · 1 planned · 24 retired · 254 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`;
  `npm run map:check` reads 319 modules, 0 problems; `npm run readme:check` reads 709 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base 22ccd849): 4 rows in FEAT-007 —
  R-1720, R-1721, R-1722 and R-1723 new (implemented).
- HANDOFF: the knowledge-ruling and roster residuals now match the change. New carried residuals, each naming this
  lane: other commands still start by name on Windows; pi resolves against the launcher's folder; the two Windows rows
  are proven only on CI's Windows leg; the launcher still has no stall watchdog, session name or retry; a `claude -p`
  reviewer relies on Claude Code passing its environment to its hooks; and the mutation runner cannot judge a pair on
  Windows. The seat also widened and trimmed two win-post-edit-utf8 review notes there.
- Main was 22ccd849 when this record was written, the lane's merge base. If main moves before the land, that merge
  needs its own accepted review coverage.
