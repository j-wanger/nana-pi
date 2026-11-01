# Build 1 — memory replay

Feature: FEAT-043 · Measure memory outcomes. Ordinary lane, SUB-025, artifact A-097.

## Implementation

- `packages/nana-pack/lib/memory-replay.mjs`: zero-spend planning, pre-cut disposable bundle stores, optional fresh-draw screening, capped paired execution, isolated blind judging and row-only exact decisions.
- `packages/nana-pack/lib/memory-replay-context.mjs`: stored-span reconstruction and one swappable memory slot.
- `packages/nana-pack/lib/memory-replay-config.mjs`: sealed runners, models, efforts, budgets, vocabularies, prompts, layout and owner-question defaults.
- `packages/nana-pack/lib/outcome-score.mjs`: authorized reader export, kind-only labels and an array input for the same validation. Existing scorer/comparison call sites retain their private alias and behavior for outcome-shaped inputs.
- `scripts/memory-replay.mjs`, `package.json`: four hand-run subcommands; both adapters explicitly select Claude regardless of the shaper's default runner.
- `REQUIREMENTS.md`, `docs/requirements-tree.md`: R-3370–R-3389 implemented with backticked evidence, SUB-025 and A-097. A-091's read line adds replay; A-093 is not read.
- `README.md`, `packages/nana-pack/README.md`, `docs/code-map.md`: commands, dependencies, privacy, bias, limitations and generated import map.

No owner data, model session, paid call, profile store or private reference directory was read or used. No hook, install, extension, desk or gate code changed. No known bug was fixed or modified; all three existing FEAT-043 limitations remain.

## Test and mutation evidence

There are exactly eight new contract tests and twelve seal-group tests in `packages/nana-pack/tests/memory-replay.test.mjs`. Every asynchronous test is awaited under a per-case deadline. Fixtures use the shared OS-temp helper. Transcript and label walks exercise CRLF, trailing space/tab and no final newline. All model calls and spawns are synthetic.

`wrong-first.txt` records all 20 tests failing against empty/no-op code and absent/wrong seals before implementation (exit 1). `focused.txt` records all 20 passing on restored code (exit 0). `layout-wrong.txt` additionally records the layout/read-marker seals failing before their definitions (each command exit 1).

| Rows | Wrong code → correct code | Files |
|---|---|---|
| R-3370 | Empty case selection → 5 expected R/F cases and exact skip/session/hash output | replay module, reader |
| R-3371 | Empty reconstruction → recorded past with exact interchangeable slot spans | context module |
| R-3372 | Empty bundle/plan → pre-cut merge, evidence ordering, cleanup and single-record oracle | replay module |
| R-3373 | No judge calls → seven blind calls at two draws, fail-closed parsing and informative-only sheet | replay module |
| R-3374 | No decision lines → hand-computed exact tests, attrition, clustering and confirmation | replay module |
| R-3375 | No execution → two cases finish before the cap, later cases unrun, unknown cost visible | replay module |
| R-3376 | No screen calls → control-only screen and fresh subsequent draws | replay module |
| R-3377 | Success without private writes/refusal → checkout refusal, exclusive private files and sealed spawns | replay module, adapter |
| R-3378 | replay runner pi → claude | config |
| R-3379 | replay model claude-opus-0 → claude-opus-5-5 | config |
| R-3380 | judge model claude-sonnet-0 → claude-sonnet-5 | config |
| R-3381 | 4 draws → 5 | config |
| R-3382 | $2 replay cap → $1 | config |
| R-3383 | 159999 history characters → 160000 | config |
| R-3384 | 7999 bundle characters → 8000 | config |
| R-3385 | empty control → historical | config |
| R-3386 | benefit level 0.04 → 0.05 | config |
| R-3387 | changed preamble → hash-sealed preamble | config |
| R-3388 | 9 citation words → 8 | config |
| R-3389 | wrong.jsonl → memory-replay.jsonl | config |

The twelve post-build seal mutations ran together, with one representative code mutation per independently asserted group. `seal-mutations.txt` records twelve failing seal tests (exit 1); restoration returns all twenty tests green. Assertions were never inverted.

The existing `packages/nana-pack/tests/outcome-meter.test.mjs` remains unchanged: 27 checks pass (`meter-regression.txt`, exit 0).

### Existing test edits

Only `packages/nana-pack/tests/requirements-tree.test.mjs` changed: its two real-ledger heading-count assertions move from 75 to 76 because SUB-025 adds one heading. Titles and all structural assertions stay intact. The first full suite exposed these stale counts and the new fixture's direct temporary-directory call. The fixture now imports the existing `tmpDir` helper; the runner test itself remains unchanged.

`touched-tests.txt`: `npm test -- memory-replay outcome-meter requirements-tree test-runner.test` exits 0; 4 files pass, 197 checks pass.

## Synthetic command demonstration

An OS-temp script generated synthetic transcripts and labels, invoked `plan` once, persisted one fake run with injected runners, and invoked `decide` once. No demonstration script enters the suite or ships as a new test. `synthetic-demo.txt` contains counts and fixed output only:

```text
cases 2 R 0 F 2
plan exit 0
runs on this case set 1
cases planned 2 informative 0 favour bundle 0 favour control 0
decide exit 0
```

## Checks

- `npm run map`, `npm run map:check`, `npm run readme:check`: exit 0; corresponding logs committed here.
- `node scripts/requirements-trace.mjs`: exit 0; 2370 rows, 2116 implemented and traced, zero off-form rows. The trace checks exact evidence titles.
- `node scripts/requirements-tree.mjs --root .`: exit 0; zero structural problems; its shared deliverables report is also the deliverables check. New-file tracking notes disappear after commit.
- `node scripts/known-bugs.mjs --root .`: exit 0.
- `node scripts/identity-scan.mjs --root .`: exit 0.
- `node scripts/lane-class.mjs --root . --files <changed source/docs paths>`: exit 0, ordinary.
- `npm run test:locked`: first run exited 1, with 249 files passing and 3 failing checks in two files (`full-suite-first.txt`). The fixes are described above. Final result is in `full-suite.txt`.

The final response records the commit, last-tip checks, draft pull request and finished hosted CI, including Windows. No additional local install check applies to this ordinary lane.

## Precedent departures and choices

1. Used exported `transcriptUnits`/`sourceFiles` for owner/ask eligibility and the timeline, rather than copying private meter/maker helpers. Wrapper exclusion is enforced there, so replay does not import `WRAPPER_TAGS` redundantly.
2. Imported the existing public `normalizeProfileText` from `profile-store.mjs` for quote and citation comparisons, rather than copying the meter's private normalizer. This uses NFC, case folding and collapsed whitespace; it preserves punctuation. No additional private helper moved.
3. Extended the authorized `readOutcomeRows` export to accept arrays as well as paths, so CLI and injected-library callers share validation without a copied validator. Kind-only lesson/none rows are validated and ignored by this outcome reader. Outcome-shaped scoring and comparison tests remain green.
4. Generated every synthetic fixture in OS temp instead of checking in the forecast fixture file. This follows the brief's stronger no-test-writes-repository rule.
5. Pinned the historical/ceiling defaults, private layout names and read-path markers in the existing seal-group tests. These are additional named seals, not additional test declarations.
6. The runner test injects a factory with a pi default, then checks that replay supplies explicit Claude choices through it. It does not edit or copy the shaper's module into a test fixture.
7. Suppressed Node's typeless-module warning in saved trace/known-bug checks, to keep absolute machine paths out of public logs. No product diagnostics or test assertions changed.

## Not done

No real-data plan/run/decision, label conversion, real-run seed registration, synthetic paid canary, owner blind labelling or memory delivery. Those are the seat's post-build steps. `sealed.txt` remains the seat's record before its first paid run. No issues were created or changed. No open implementation question remains.
