# Lane roster — build brief 1 (2026-10-13 · feat/roster · worktree ~/nana-pi-wt/roster)

**Builder: Claude Sonnet 5.5** (GATE lane: lane mode gains a refusal and a Windows launch). The contract is
`CHANGE.md` in this folder, INCLUDING its final "Seat amendment (2026-10-13): Node entry" section — sol plan r3 LAND
9/10 (`sol-plan-r1.md`…`sol-plan-r2.md` record the earlier rounds). The owner's rulings it implements (2026-10-13): a
change that touches code with tests goes through the worker/reviewer pattern, a direct answer for questions and
one-line fixes; "land can be optional due to token allowance, seat will take on landing review if no land model
set". Threat model: honest variation in our tools' output in scope (a machine with another provider; a typo'd
roster); deliberate forgery out. New IDs: R-1120–R-1128 only.

## Where the plan's line numbers drifted (the process lane landed in between; main is now bc84b70)
- `AGENTS.md`'s shared region markers now sit at :68 and :99 (§3 cites :68-97).
- The pack README "Lane builder" heading is at :206 and the roster literal at :208 (§3 cites :200).
- §4's "expected conflicts with feat/process" are moot: process merged cleanly (1b3861d); R-1110's cases in
  `worker-lane.test.mjs` now sit at :94-118. The header's base is now bc84b70, not 9974218.
- The new shared bullets still go before "Project-specific overrides" (the shared file's last bullet, :30).
  R-291's leaf total moves 1,100 → 1,109.

## Build all of CHANGE §2–§5, in this order
1. Rows first (§2, one `shall` each, text exactly as drafted; R-961 and R-684 reworded as §2 says); `npm run req:tree`.
2. The Windows tests FIRST, committed with the three constants (`PI_PACKAGE`, `PI_BIN_NAME`, `NPM_DIRS`) as the
   amendment says, so the Windows leg can show the four named reds before the code; then the code.
3. `worker-config.mjs` (`ROSTER_DEFAULTS` reading `LANE_DEFAULTS` by name — its values byte-identical), `pi-worker.mjs`
   (resolve the roster before the lock and spawn; refuse a bad roster through the existing lane refusal; the stderr
   builder line), new `nana-roster.mjs`, `pi-watchdog.mjs` (`piLaunch` on win32: npm global or `.bin` layout →
   `process.execPath` + the `bin` entry, checked with `statSync(entry).isFile()`; `.exe`/`.com` directly; every
   other case refused with a named reason, nothing started; native realpath on win32).
4. The shared text, `nana-soul.md` and the AGENTS.md pointer as §3 says — the bullets byte-equal to
   `shared-text.proposed.md`; the pack README's one Windows line.

## Output formats the seat's acceptance reads (from CHANGE §3; follow them exactly)
- `nana-roster` prints one line per slot in the order scout, builder, reviewer, land — `<slot>: <provider> <model> <thinking>`
  (land null prints as the seat) — then `source: <default|file path>`.
- The lane refusal reads `pi-worker: lane refused: roster refused: <file>: <problem>`.
- `piLaunch` refusal reasons name the cause in plain words: "pi is not on PATH", the unsupported installer ("pnpm",
  "Volta", "pi.dev"), "package.json", "bin", "outside", or "cli.js".

## Rules
Wrong code first for every new case; a mutation breaks code, never an assertion. No suite test runs, imports or
copies a seat script (`acceptance.mjs`, `seat-titles.mjs`). No test deletion except the R-291 rename. Do not touch
`win-command.mjs` (frozen), `pi-review.mjs`, `nana-land`, `review-round.mjs`, the desk, `.github/`, `CHANGE.md`, the
seat scripts, `HANDOFF.md` or `docs/sessions/`. Never write a work provider name, gateway URL or work project name
into the repo — the roster example uses `example-gateway` only. Commit with explicit paths; message file under
`$TMPDIR`; end each message with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/roster-2026-10-13/seat-titles.mjs 1` → `0 missing` (31 at launch);
`node docs/reviews/roster-2026-10-13/acceptance.mjs > docs/reviews/roster-2026-10-13/acceptance-output.txt 2>&1`
→ exit 0, `roster acceptance: 0 mismatch(es)` (19/122 at launch — `acceptance-launch.txt`);
`npm run test:locked` (0 failed); `npm run map:check`; `npm run readme:check`;
`node scripts/requirements-tree.mjs --check`; `npm run template:accept`; the local install check
`node packages/nana-setup/bin/install-check.mjs` (this lane edits `nana-soul.md` under nana-setup). Commit the outputs.
Push the branch and open a DRAFT pull request "roster (draft, for CI)" (pre-approved). Push the tests-first commit on
its own first and record that run's Windows reds, then push the code; when each CI run completes, read the Windows
job log (`gh api repos/j-wanger/nana-pi/actions/jobs/<job id>/logs`) and REPORT — do not wait for another
notification. If a Windows-leg test fails after the code, report BLOCKED with the log lines: no Windows claim lands
that CI did not show.

## Report
≤ 35 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each row and the title that pins it; the two CI
run IDs with the Windows titles' results (tests-first reds, then greens) and the INFO revision line; the
`test:locked` summary line; the last line of each seat output; the one claim most likely wrong.
