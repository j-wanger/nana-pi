# helper-start implementation and checks

Serves: roadmap step 3 — trim helper starting context and log actual delivery.

## Delivery

- Pi lane/slot launches and pi-review use the five configured explicit skills with discovery off. Checkout skills win; the setup-installed Claude skills folder is the fallback. A missing skill warns once and launch continues.
- Launcher-role pi sessions omit the objective. Seat sessions retain it.
- Pi lane builders get an unconditional read instruction for their brief feature's known-bug path. Claude builders and both reviewers keep their digest.
- Pi attempts retain explicit session files in distinct persistent folders under `buildSessionDir`. The watchdog logs actual first-system-message sections and serialized `toolsAdded` after each attempt, with no separate addendum-source counts. Missing data is unavailable with a reason.
- Usage discovery now includes nested attempt folders, so explicit sessions do not lose build cost accounting. Old flat sessions still work.
- The two measurement modules and their limits are removed. Claude Code logging remains unchanged.

## Precedent

Read all six precedents in the plan. Reused `LAUNCHER_ROLES`, `buildSessionDir`, `contextPart`, `appendContextLoad`, the pi package locator, and the Claude-home resolver; no precedent function was copied or moved.

The durable per-attempt folders require recursive usage discovery in `lib/build-records.mjs`; this preserves the existing caller contract rather than leaving costs unknown. If creating the session folder fails, the launcher preserves launch success and logs an unavailable reason instead of adding a broken session argument. This is the best-effort logging exception to explicit session delivery.

## Requirements

- Added R-3980 (implemented skill-list seal) and R-3981–R-3984 (untested pending real-launch validation).
- Updated R-017's launcher-role exception; R-2581/R-2583's known-bug pointer contract; R-3215/R-3526's pi post-attempt timing.
- R-3212/R-3213 now describe the remaining Claude digest and are untested after removing the old combined-runtime cases.
- Retired measurement-only R-3726–R-3728, R-3731/R-3732, R-3919, R-3808/R-3809 and R-3813.
- R-3729 remains untested; source/check-out metadata still ships. R-3812 retains its other evidence.
- No feature placement or shared-row ownership changed.

## Test changes

No new test file. The sole new test is R-3980 in `context-anatomy.test.mjs`, already registered in the main test pack.

Deleted, as directed by the plan:

- `context-anatomy.test.mjs`: R-3212 over-cap combined-runtime builder digest; R-3213 exactly-at-cap pi-path delivery.
- Same file: R-3726 located export; R-3727 installed-pi file choice; R-3728 child agent-dir measurement; R-3729 checkout-context measurement; R-3731 disabled-context measurement.
- Same file: R-3732 unavailable measurement, stalled measurement, oversized measurement, output seal, deadline seal; R-3813 controlled deadline.
- `child-context.test.mjs`: M5 composed-section measurement.

Existing assertions edited only where delivery changed:

- `worker-lane.test.mjs`: R-2581 now checks the read instruction, including missing/non-regular source cases; R-2583 checks the updated preamble sentence. Renamed both titles to match.
- `context-anatomy.test.mjs`: R-3215 expects unavailable session data from the recording pi children while preserving Claude part checks; R-3216 normalizes explicit attempt identities; R-3730 no longer prepares a removed measurement stub. Renamed R-3215's title to match post-attempt timing.
- `worker-claude.test.mjs`: MM5 expects one unavailable session part for its fake pi role children, while preserving Claude part checks.
- Removed imports/helpers used only by the deleted measurement cases.

Mutation pair: before implementation, `CONTEXT_CASE=R-3980 node packages/nana-pack/tests/context-anatomy.test.mjs` exited 1 with the old missing skill list; after defining the configured list it exited 0. No assertions were inverted.

## Commands before commit

Long output is outside the repository under `$TMPDIR/helper-start-*`; no raw logs are committed.

| Command | Exit | Result |
|---|---:|---|
| `pi --version` | 0 | Installed pi 1.4.0; CLI/session format and extension docs read. |
| `npm run map:impact -- <touched module paths>` | 0 | Importers, launch readers and usage callers inspected before edits. |
| `node scripts/test.mjs context-anatomy worker-lane child-context` | 0 | 3 files, 81 checks passed. |
| `node scripts/test.mjs $(tr '\n' ' ' < "$TMPDIR/helper-start-test-imports.txt") packages/nana-pack/tests/child-context.test.mjs packages/nana-pack/tests/builder-context.test.mjs` | 0 | Equivalent argv to the recorded Python subprocess run: 39 files, 38 PASS, 1 SKIP; 1977 checks passed, 10 skipped. |
| `node scripts/test.mjs context-anatomy worker-lane worker-claude child-context watchdog-exit build-records` | 0 | 6 files, 118 checks passed, 3 skipped. |
| `node scripts/test.mjs worker-lane context-anatomy child-context` | 0 | Green after making the feature read instruction unconditional. |
| `node scripts/test.mjs brief-check worker-refusal immutable-review priority-lock handoff-writer-role path-spelling review-standard review-test-waits code-map-launch component-audit` | 0 | Additional direct launcher readers passed. |
| `node $TMPDIR/helper-start-probe.mjs` | 0 | Offline fixture probe: LF/CRLF, trailing whitespace, no final newline, missing file/record, persistent retries and usage accounting. Not real-launch validation. |
| `python3 $TMPDIR/helper-start-audit.py` | 0 | Grepped tests for removed text, sentences, paths and filenames; no stale measurement module references remained. |
| `node scripts/requirements-trace.mjs` | 0 | Status/marker/title rail green. |
| `npm run map` / `npm run map:check` | 0 | Map regenerated and checked. |
| `npm run readme:check` | 0 | README contracts green. |
| `node scripts/requirements-tree.mjs --root .` | 0 | Requirements tree green. |
| `node scripts/ts-syntax-check.mjs packages/nana-pack/extensions/nana-objective.ts` | 1 | Invocation lacked Node's experimental VM module flag. |
| `node --experimental-vm-modules scripts/ts-syntax-check.mjs packages/nana-pack/extensions/nana-objective.ts` | 0 | TypeScript syntax green. |
| `node scripts/test.mjs context-anatomy worker-lane worker-claude child-context` | 0 | Last pre-commit touched-test run: 4 files, 105 checks passed, 3 skipped. |
| `git diff --check` | 0 | No whitespace errors. |

The final report records seat checks rerun on the committed tip. CI stands in for the full suite; no full suite was run locally.

## Validation still required

V1–V3 were not run: the lane rules forbid starting model sessions or subagents. There are no real builder/adversary section sizes or read events to paste, and no real early-kill result. The offline probe is not a substitute. The seat must run both launches, compare load lines with their session records, confirm the builder read its known-bug file, and exercise early death. V4 remains the seat's five-build stop rule after land.

## Known bugs touched

Read all of `docs/known-bugs/FEAT-006.md`. Explicit pi sessions remove the pi-settings sessionDir mismatch for these launches; nested usage discovery preserves the existing unreadable-candidate failure behavior rather than fixing it. No FEAT-006 known-bug line was removed or edited.

Added only the three requested priority-lock review lines to `docs/known-bugs/FEAT-001.md`: macOS case spelling, missing same-repository passing test, and inherited GIT_DIR. None is fixed here. No issue was created or changed, no credential was used, and nothing was pushed.
