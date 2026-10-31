# Build 1 — memory-making

VERDICT: DONE (implementation; the seat still owns real-data labelling and scoring).

## Scope and files

Feature FEAT-040, ordinary lane. No model sessions, subagents, real transcripts or real labels were used.
The build serves carrying past learning into subsequent work.

- `packages/nana-pack/lib/claude-transcript.mjs`: authorized shared helpers, streaming reader and private-folder boundary.
- `packages/nana-pack/lib/writing-trial-extractor.mjs`: imports the moved helpers; existing exports and strict preservation behavior remain.
- `packages/nana-pack/lib/memory-making-config.mjs`: one plain exported `CANDIDATE_FIELDS` list with provenance; frozen rule settings.
- `packages/nana-pack/lib/memory-making.mjs`: deterministic owner corrections, question-bearing decisions, structured answers, review lessons, evidence resolution and maker boundary.
- `packages/nana-pack/lib/memory-score.mjs`: strict JSONL labels and exact counts, including unknown-candidate gating.
- `scripts/memory-make.mjs`, `scripts/memory-score.mjs`, `package.json`: hand-run commands, no model calls.
- `packages/nana-pack/tests/memory-making.test.mjs`: eight must-meets and fifteen seal tests; every async case is awaited under a 15-second limit.
- `packages/nana-pack/tests/fixtures/memory-making/`: synthetic session, choices, review and labels only.
- `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`: feature, rows, artifact A-088 and generated navigation.
- `README.md`, `packages/nana-pack/README.md`: command, privacy, record and evidence contracts.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: only two existing test edits, detailed below.
- This review folder holds counts-only demonstrations and complete command output.

No `HANDOFF.md`, known-bug file or session archive changed. No known bug was fixed or otherwise touched.
No GitHub issue was created, edited, commented on or closed.

## Rows and tests

Plan A16 authorizes the next free IDs: R-3188–R-3210 and A-088. All new rows are implemented.
Each evidence cell names the backticked test file and exact title.
No pre-existing requirement row changed.

All following titles are in `packages/nana-pack/tests/memory-making.test.mjs`:

| Row | Test title |
|---|---|
| R-3188 | an owner correction becomes a shaped user candidate with what it corrects |
| R-3189 | noise yields nothing |
| R-3190 | decisions carry their question across notification traffic |
| R-3191 | review MUSTs become worker candidates from reviewer output only |
| R-3192 | every evidence pointer resolves |
| R-3193 | real output stays private |
| R-3194 | default scope is this repo only |
| R-3195 | scoring prints exact counts over all candidates |
| R-3196 | seal: correction cues |
| R-3197 | seal: decision question pattern |
| R-3198 | seal: short answer words |
| R-3199 | seal: correction context words |
| R-3200 | seal: text character cap |
| R-3201 | seal: correction form |
| R-3202 | seal: decision form |
| R-3203 | seal: roles by source |
| R-3204 | seal: starting trust and source |
| R-3205 | seal: wrapper tags |
| R-3206 | seal: review exclusions |
| R-3207 | seal: transcript day timezone |
| R-3208 | seal: candidates filename |
| R-3209 | seal: private checkout refusal |
| R-3210 | seal: shared candidate fields |

Existing test edits in `packages/nana-pack/tests/requirements-tree.test.mjs`:

- `R-288: all real headings have non-empty purposes`: expected heading count 68 → 69, because FEAT-040 adds one heading.
- `R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy`: same count correction for the real CRLF ledger.

No test was removed. The writing-trial extractor and writing-rule tests stayed unchanged.
The first full suite caught both obsolete heading expectations and the new test's direct temporary-directory call.
The new test now imports the existing `tmpDir` helper; the runner test was not weakened or edited.

## Wrong code and mutation pairs

`wrong-first.txt`: all 23 tests failed against deliberately wrong placeholders before implementation, exit 1.
The placeholder maker returned a fabricated record, its evidence resolver always returned missing,
its command boundaries did nothing, and every sealed setting was wrong.

`mutations.txt`: a green original, 23 isolated code mutations with exit 1, and a green restored original.
Only library code changed in temporary copies. No assertion was inverted; no seat script was run, imported or copied by a suite test.

The eight behavior mutations respectively substituted wrong correction context, accepted notification origins,
forgot questions on status replies, read excluded planning files, disabled evidence resolution,
allowed checkout output, read all projects, and treated wrong-kind labels as hits.
The fifteen seal mutations changed each exported setting, including the shared field list and moved timezone.
Every row's title caught its mutation. The log names each pair.

## Commands and evidence

All paths below are relative to this review folder.

| Command | Exit | Evidence |
|---|---|---|
| `node packages/nana-pack/tests/memory-making.test.mjs` against placeholders | 1 expected | `wrong-first.txt` |
| isolated code-mutation campaign in OS temp | 0 | `mutations.txt` |
| direct writing-trial extractor test | 0 | `extractor-tests.txt` |
| direct writing-rule test | 0 | `writing-rule-tests.txt` |
| direct memory-making test | 0 | `memory-tests.txt` |
| `npm test -- memory-making.test requirements-tree.test test-runner.test writing-trial-extractor.test writing-rule.test` | 0 | `touched-tests.txt` |
| `npm run map:impact -- packages/nana-pack/tests/requirements-tree.test.mjs` | 0 | `tree-test-impact.txt` |
| `npm run map` | 0 | `map-generate.txt` |
| `npm run req:tree` | 0 | `tree-generate.txt` |
| first `npm run test:locked` | 1 | `full-suite-first.txt` |
| final foreground `npm run test:locked` | 0 | `full-suite.txt` |
| `npm run map:check` | 0 | `map-check.txt` |
| `npm run readme:check` | 0 | `readme-check.txt` |
| `node scripts/requirements-trace.mjs` | 0 | `requirements-trace.txt` |
| `node scripts/requirements-tree.mjs --check` | 0 | `tree-check.txt` |
| `node scripts/known-bugs.mjs --root .` | 0 | `known-bugs-check.txt` |
| `node scripts/identity-scan.mjs` | 0 | `identity-scan.txt` |

The first full run reported 243 files: 239 PASS, 2 FAIL, 2 SKIP; 8785 passing checks and three failing checks.
The final locked suite reported:

```text
243 files: 241 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8788 pass, 0 fail, 44 skip · 626.1s
```

Focused tests: five files passed, 192 checks passed, no failures.
Post-commit seat-check results and the finished CI run are given in the final report.
The private artifact's new reader is not tracked at HEAD until the build commit; pre-commit tree output notes that fact.

## Synthetic hand run

Both npm commands ran on copies of the committed synthetic fixtures in an OS temporary directory.
The demonstration copied no source from a real transcript. Output and labels never entered a checkout.
The temporary directory was removed after both commands. Both exited 0.
See `synthetic-run.txt` for the complete counts-only output:

```text
user correction 1
user decision 2
worker lesson 2
capped claims 0
correction: recall 1/1
decision: recall 2/2
lesson: recall 2/2
precision 5/5
false per owner turn 0/4
unlabelled 0
```

## Precedent and departures

Read every file listed by the brief's Precedent and the plan's Precedent before implementation.
The plan explicitly leaves land and CI record readers for later; both were read for context, not imported.
The knowledge source and parser were read, not imported, as specified. Review-corpus exclusion remains unchanged.

- Authorized moves only: `entriesIn`, `textFrom`, `edtDay`, `assistantText`, `transcriptFiles` and the private-folder creation from `preserve` moved to `claude-transcript.mjs`.
  The extractor keeps its public exports and behavior. The maker uses text parts only for owner text, never the broad `textFrom` fallback.
- The shared reader adds a streaming counterpart instead of changing synchronous `entriesIn`; large maker transcripts stream while extractor behavior stays unchanged.
  `transcriptFiles` accepts an optional selector; its original default still excludes worktrees and private-temp projects.
- The private-folder helper retains the extractor's strict walk by default. Maker-only options implement the plan's ancestor-realpath and final-symlink rules.
  Thus `/tmp` and OS temp aliases work without weakening the extractor's existing contract.
- `projectKey`, `mustTitlesOf`, `verdictWordOf`, `displayText` and `readBounded` are imported from their precedents, not copied.
- The npm scripts follow the existing form. Config follows named, provenance-bearing sealed exports.
  Command summaries use counts and fixed failures; no private exception messages are printed.
- Evidence limitation/departure: a review path plus title index alone cannot detect a replacement title at the same index.
  `resolveEvidence` returns stale for a removed index and accepts optional `roots.expectedTitle` for checking a retained record against replacement.
  R-3192 is deliberately narrowed to a removed title index. The README states the limit instead of claiming stronger verification.
- The root README also names the new scripts to satisfy the repository-wide command checker.
- Added fifteen seal rows/tests beyond the eight must-meets, only to pin the plan's tunables and required shared field list.
- Used the existing temporary-directory helper after the suite identified its source-policy requirement.

No other private helper moved or was copied. No precedent module required an unauthorized helper move.

## Not done and open question

The seat still labels every real owner turn independently, freezes the build vocabulary before labels,
and runs the real-data recall, precision, survival, anchored-item and usability readings outside the repository.
No real-data quality claim is made here. Delivery, storage, upkeep, promotion and other transcript runtimes remain later lanes.

Open question for the seat: should a later checking lane require the retained review title on every resolution,
or version the pointer with a content digest? Index-only pointers cannot certify replacements.
No GitHub issue was posted.

## CI correction after the first tip

The draft pull request is number 280. The first tip's CI run 41222439133 finished:
macOS and Linux suites and all four install checks passed; Windows failed the default-scope test.
R-3104 passed, so the brief's timeout-flake rerun did not apply. See `ci-attempt-1.txt`.

The default repository resolver returned git's path spelling rather than the filesystem's native canonical spelling.
It now resolves the repository root through `fs.realpathSync.native`, covering casing, short paths and ancestor aliases.
The existing default-scope must-meet now uses a native-realpath fixture root and injects a git response through a directory alias.
R-3194 explicitly says canonical repository path. No test or row was added.

Wrong code first: the resolver accepted the injected git response but returned its uncanonicalized path.
The existing default-scope test failed, exit 1 (`windows-fix-wrong-first.txt`).
Adding native realpath made all 23 tests pass, exit 0 (`windows-fix-tests.txt`).
The 23 isolated code-mutation pairs also passed again (`windows-fix-mutations.txt`).
The correction changes no sealed value and moves no helper. The git runner is now injected at this boundary.
The foreground locked suite for this correction is kept in `windows-fix-full-suite.txt`.
