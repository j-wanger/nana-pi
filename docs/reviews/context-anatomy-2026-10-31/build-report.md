# Build 1 technical record

Feature: FEAT-041 · Shape each agent's context by role

## Delivered

- `packages/nana-pack/lib/claude-settings-carry.mjs`: moved the two authorized helpers; both launchers import them. Added exact-model/top-level effort lookup without alias expansion. Preserved the builder's carry diagnostic.
- `packages/nana-pack/bin/worker-config.mjs`: expanded the shared env carry list with Git Bash and provider/model names; binary provenance is in `carry-provenance.log`.
- `packages/nana-pack/lib/known-bug-digest-config.mjs`, `known-bug-digest.mjs`: the sealed 6000 UTF-16-unit cap, brief-matched whole lines, maximal fitting tail, unchanged small files, configured reviewer lead, movement/fallback selection and pass-on shares.
- `packages/nana-pack/bin/pi-worker.mjs`, `pi-review.mjs`, `claude-review.mjs`: bounded delivery and one load measurement per launched child. Claude review adds isolation flags, configured effort and cleaned settings. Pi review keeps its standard/movement ordering and appends known bugs after movement.
- `packages/nana-pack/lib/context-load-log.mjs`: active-agent-dir JSONL measurements through the existing exported `appendLedgerRecord`; canonical ancestor checks reject logs inside worktrees and relative agent dirs. Failures print one diagnostic without blocking delivery.
- `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`: stdout before dynamic logger import, with whole/shortened/omitted filenames and full/printed counts. A pointer without a filename logs null, never its prose.
- `packages/nana-setup/lib/install-check.mjs`: the installed shared-memory hook must leave exactly one versioned load line with matching printed chars in the temp home.
- Both package READMEs and the builder preamble declare the changed contracts. `load-sample.jsonl` contains one temp-home launch event with placeholder paths.

## Requirement changes

New rows R-3210 through R-3218 are implemented, each with backticked `packages/nana-pack/tests/context-anatomy.test.mjs::title` evidence. R-3210..R-3217 correspond to T1..T8; R-3218 pins the cap. No IDs from R-3219..R-3229 were needed.

Amended in place: R-2560 (isolation/effort), R-2561 (known bugs before standard), R-2581 and R-2647 (bounded builder digest), R-2655 (shared reviewer/builder carry). Added FEAT-041 under CAP-01 and parked artifact A-089 for later memory-lane readers. The requirements outline and code map are regenerated.

## Tests changed

Only nine new tests, all in `packages/nana-pack/tests/context-anatomy.test.mjs`: the eight must-meets and the cap seal. Each async case is awaited under a 90-second per-case bound; child processes have shorter bounds. Every launcher fixture has its own temp home and agent folder. Text fixtures include CRLF, trailing spaces/tabs, no final newline and non-ASCII text.

Existing edits made necessary by this change:

- `claude-review.test.mjs`: R-2560's exact argv now includes isolation and the external settings path.
- `worker-claude.test.mjs`: R-2655 now expects Bedrock carry in the settings and diagnostic; its existing carry-list seal includes the added names.
- `install-check.test.mjs`: the fake installed hook creates its load record; the file inventory recognizes that new fixture output.
- `review-standard.test.mjs`: the pack-copy fixture copies lib dependencies instead of a now-incomplete fixed list, and pins its temp agent folder.
- `immutable-review.test.mjs`, `land.test.mjs`, `path-spelling.test.mjs`, `review-ledger.test.mjs`: launching environments now pin the temp agent folder instead of inheriting a real active folder. Their assertions are unchanged.
- `code-map-launch.test.mjs`: R-3156's fixed-base edge inventory records the authorized move of the worker's JSON helper dependency to the shared settings module.
- `hive-city.test.mjs`: R-3187's builder known-bug flow oracle now matches appending the selected digest instead of rereading the whole file. No hive application code changed.
- `requirements-tree.test.mjs`: R-288 and R-1158 expect 69 headings instead of 68 after adding FEAT-041.
- The new context test uses the existing public `tmpDir` helper; the runner's R-917 source check remains unchanged. Its temp root also uses the public `realPath` helper, so Windows short and long temp-directory names agree with the launchers' canonical paths. No assertion was relaxed.

## Red/green proof

`tests-before.log` records nine failures against the pre-feature code. `tests-after.log` records the first nine-case green. `touched-tests.log` records the broad focused run before the full suite: 331 checks passed, three skipped.

`pairs.mjs` runs manually, outside the suite, against an OS-temp source copy. No suite test runs, imports or copies it. `pairs.log` records 29 wrong-code mutations: each selected test exits 1, and every restored control exits 0. This includes every pair in the revised plan, plus retuning the cap. The tests are never inverted. The proof ran on macOS; CI checks Windows behavior, not these local wrong-code mutations.

## Precedent decisions and departures

- Followed the authorized settings helper move and imported `readBrief`, agent-dir resolution, reviewer movement, and the underlying public record append helper. No unauthorized private helper moved or was copied.
- `renderBlock(Hit[])` is not a generic text-budget helper: it formats and sanitizes knowledge pointers under its own heading. The digest follows its whole-unit cut pattern, without copying its implementation or trying to feed known-bug lines to it.
- The hook keeps shorten/render and their selection inside the hook file, as the plan requests. It only records the resulting selection after stdout.
- Pi's authorized `piOption` move stays in pi-review at module scope. Reading repeated append values uses the same helper; argument order is respected when equal-form and separate-form options mix.
- **Departure:** Windows SIGTERM is a forced stop and cannot execute exit handlers. Claude review therefore reuses `startLaneWatcher` on Windows for cleanup only, contrary to the plan's no-watcher forecast. The watcher receives no build ID, no builder record, and an absent lock sentinel inside the private temp folder; it cannot release a lane lock or append a build record. T2 waits for bounded watcher cleanup on Windows. POSIX uses exit and signal cleanup. This is needed for the named cross-platform SIGTERM case, not a new hard-kill guarantee.
- Claude review runs the public non-mutating ledger projection before creating settings. Actual admission is still authoritative. A concurrent admission or later write failure can still refuse after the file exists; cleanup removes it. Explicit over-cap runs still defer the override decision to the ledger.

## Known-bug lines touched

The files themselves were not edited, as required.

FEAT-006:

- “Known-bug attachment (precedent-first, plan): no size guard on the attached file” — closed by the digest and T3/T4.
- “Claude Code builder ... only the three helper keys and the 17 network and login env names ... no provider env (Bedrock, Vertex, Foundry)” — Bedrock, Vertex and model/Git Bash names now carry; Foundry, NODE_OPTIONS and other names remain excluded. The shared helper move preserves the rest of that line's behavior.
- “Claude Code builder ... ~/.claude.json env and ... project settings ... still apply for names ... not set” — retained; the same sealed-settings mechanism now also applies to the reviewer.
- “Claude Code builder ... inherited ones ... desktop-host ... managed policy env beats the sealed names” — retained; not widened into a security claim.
- “Claude Code builder ... when ... env is not an object ... does not say ... skipped” — retained by the moved helper.
- “Claude Code builder ... startup migration rewrote ... user settings ... even under --setting-sources project,local” — retained; isolation is not a promise that Claude itself never migrates settings.
- “Lane temp files ... second read of the brief and known-bug file ... ignores SIGTERM ... own process” — the builder still reads these after its startup listeners; not fixed here.

FEAT-007:

- “Claude review launcher ... claude -p loads user rules, hooks and memory” — isolation flags and sealed auto-memory are implemented; real-rule exclusion remains the seat's measurement.
- “Claude review launcher ... reviewer gets none of the Claude Code builder's switches” — settings-source, carried settings, strict MCP and auto-memory isolation now apply. Builder mutation permissions/tool lists intentionally do not.
- “Claude review launcher ... kill of the launcher's own process leaves review-ledger and claude running ... forwards no signal” — retained. Settings cleanup is not child-tree termination; the new handlers do not forward signals.
- “Claude review launcher ... alias (opus), not resolved model id” — retained. Effort matches an exact key or top-level setting; aliases are not guessed.
- “Review movement ... movement before ... admission ... next revision's review” — retained; the existing movement is reused once, not recomputed or given new atomicity claims.
- “Keep movement ... force-killed pi-review leaves ... movement temp folder” — retained; this lane adds the digest to that same existing folder lifecycle.

## Windows CI correction within build 1

Commit `01997760` passed both macOS suite and Linux suite, plus all four floor/ceiling install jobs. Run `41229150434` failed only Windows's new R-3213 and R-3215 fixtures: `fs.realpathSync` preserved `RUNNER~1` while production's native canonicalizer returned `runneradmin`. R-3104 passed, so no known-flake rerun was requested. `ci-build-1.log` keeps the failure and job summary.

The correction imports the existing public `realPath` into the fixture and canonicalizes its one temp root with it. Production code and the test assertions do not change. The final report names the finished run for the corrected tip.

## Validation and remaining seat work

`env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs` passed locally on macOS. The first attempt inherited the builder's lane write boundary and failed the unrelated fixture write; rerunning without that caller-only boundary passed every item, including the new installed-hook assertion. No real home was modified by either run.

The first locked full suite found stale graph-edge, city-flow and heading-count oracles, plus generated-log path redaction and the new fixture's temp-helper spelling. `full-suite-first.log` keeps that run. The corresponding updates are listed above; no checker was weakened or bypassed. Captured logs redact checkout and home paths.

The deciding foreground run was `npm run map:measure` (exit 0), which invokes the existing machine-locked full-suite path and refreshes the runtime map. `full-suite.log` records: **243 files: 241 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8774 pass, 0 fail, 44 skip**. No test passed only without coverage.

Map check, README check, requirements trace, tree check, known-bugs check, identity scan and the shared-parser title audit all exited 0 before commit. The title audit reports **14 rows, 14 titles, 0 missing**. `validation.log` keeps those outputs. The final-tip checks and finished CI result are reported with the commit in the final builder report.

No paid reviewer/model session was started. The seat still owns the real Claude round at baseline effort: no user rule attachments, no MCP instructions, at most 42000 first-turn input tokens, and a note on account-email retention. The seat also owns the real over-cap builder first-turn measurement, independent check and land review. No GitHub issue or protected handoff/known-bug/session-archive file was changed.

Open question: an arbitrarily large header, or enough movement features that each share is smaller than its header plus fold line, makes the plan's unchanged-header and strict-budget rules incompatible. This implementation preserves the header and fold line; that minimum can exceed the share. Ordinary source files and the named test fixtures fit the minimum. The owner/seat should choose which guarantee wins before treating the budget as an absolute limit for such inputs.
