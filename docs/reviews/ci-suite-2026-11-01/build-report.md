# ci-suite build record

VERDICT: PARTIAL

The implementation and all named local targeted checks pass. The required install check exits 1 at the brief's known builder-environment failure: `pi post-edit — write-error`. This machine still has pi 1.0.2; the seat must satisfy plan assumption A3 before relying on CI substitution. The builder does not upgrade the machine.

## Commits and files

- `c7d362055cff5168f44f6ea56fbde7331890de76`: implementation, requirement diff, tagged tests, contracts, generated maps and initial evidence.
- The following evidence-only commit adds this record and the mutation output, normalizes local paths in captured output, and removes trailing whitespace. Its full SHA and push result are in the builder's final report.

Files by item:

1. CI suite proof and fallback: `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/lib/land-ci.mjs`, `packages/nana-pack/lib/land-config.mjs`, `packages/nana-pack/lib/land-ci-records.mjs`, `packages/nana-pack/tests/land-fixtures.mjs`, `packages/nana-pack/tests/land-ci-suite.test.mjs`. Rows R-3430, R-3431, R-3432, R-3434. The existing record reader and final-file reducer are imported, not copied. The authorized budget-wrapper move is a named export from its existing module.
2. Runner filter record: `scripts/test.mjs`, `packages/nana-pack/tests/test-runner.test.mjs`. R-3433; schema remains 1 and readers tolerate the new key.
3. Suite-source records and readers: `packages/nana-pack/lib/land-records-config.mjs`, `packages/nana-pack/lib/land-records.mjs`, `packages/nana-pack/tests/land-ci-suite.test.mjs`. R-3435; legacy output stays byte-identical, CI suite milliseconds stay null, lane suite totals count zero.
4. Builder policy: `packages/nana-pack/prompts/builder-preamble.md`, `packages/nana-pack/tests/worker-lane.test.mjs`. R-3436 replaces retired R-1110, retaining the other pins.
5. Ruling and working pattern: `packages/nana-pack/rules/nana-rulings.md`, `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`, `packages/nana-pack/tests/rulings.test.mjs`. R-3437; the older Windows and install-check bullets remain unchanged.
6. Contract and baseline cleanup: `README.md`, `packages/nana-pack/README.md`, `packages/nana-pack/lib/suite-records.mjs`, `packages/nana-pack/tests/suite-records.test.mjs`, `packages/nana-pack/tests/land.test.mjs`, `REQUIREMENTS.md`, `docs/code-map.md`, `docs/requirements-tree.md`.
7. Evidence and wrong-code pairs: the named check outputs, `wrong-first.txt`, `seat-mutate.mjs`, `mutation-output.txt`, and this report under `docs/reviews/ci-suite-2026-11-01/`.

All R-3430–R-3437 rows are implemented with backticked evidence. No other new requirement ID was used. Existing R-977 and R-2588 retain their IDs with narrowed text; R-981 and R-1005 now name the CI-or-local decision. Maker descriptions for R-1014, R-1272 and R-2547 distinguish fallback and hand refreshes from CI lands.

## Decisions, precedent and departures

- O1: two reads. A bounded pre-merge read proves the suite; the existing post-merge keeper reads again. This preserves R-2750's ordering and existing retention behavior. Each read has the existing independent 60-second budget; the total can therefore include both budgets.
- O2: `suite` is `ci`, `local`, or null before the decision; `suiteWhy` names the local reason, otherwise null.
- O3: the declared prefix is `suite:`. A CI line names each qualifying record's run, artifact attempt and injected proof platform. A carried failed-jobs-only rerun record can name attempt 1 even when the workflow passed at attempt 2.
- O4: narrow R-977/R-2588 rather than retire them. R-1110 retires in favor of R-3436.
- O5: write the runner's existing `filters` array directly. Older schema-1 records without the field cannot substitute.
- Partial reader problems are treated conservatively as an unsuccessful proof, even when some records downloaded. Retention remains best-effort after merge.
- Precedent departure: refreshed AGENTS through the existing exported `refreshWorkingRegion` used by `nana-setup project`, rather than invoking the whole command. The whole command could seed forbidden session archives and an unwanted objective. The rendered marker region equals the shared source exactly.
- Procedural departure: the supplementary impact command for `suite-records.mjs` and `land-records-config.mjs` ran after their small edits. The initial impact command covered the main land, CI and record modules and their complete transitive graph.
- No other private precedent helper was moved or copied. The shared fixture gains an exported fake-gh artifact seam following the existing test pattern.

## Existing tests edited

- `land.test.mjs`: the R-981 documentation check replaces two obsolete assertions that required rerunning the suite whenever either checkout changed. The revised contract requires revalidation and allows CI substitution. Other land tests remain unchanged.
- `suite-records.test.mjs`: R-2549's baseline text now says the next local land or hand run records one.
- `worker-lane.test.mjs`: reassign R-1110 pins to R-3436, update its three replaced lines/titles, and extend the old must-meet/no-fix-the-class check to pin the new fallback line and absence of obsolete lines. Unchanged rules keep their original assertions.
- `test-runner.test.mjs`: adds only the required R-3433 check over OS-temp fixture runs.
- `rulings.test.mjs`: adds only the required R-3437 combined policy/rendered-source check.
- No existing test was deleted. New behavior uses only the eight must-meets and the combined new-seal pin. All new cases are synchronous; child runner fixtures have existing process limits. Changed-path tests cover CRLF, trailing space/tab, and no final newline.

## Wrong code first and mutation proof

`wrong-first.txt` records exit 1 against the old implementation, with all eight new must-meets red. Captured evidence normalizes checkout/home prefixes, including Node warnings, and strips output trailing spaces. The initial retry seal was also red.

`seat-mutate.mjs` imports the shared mutation runner; no suite test runs, imports or copies it. It changes production code or the preamble, never assertions.

Plan pairs: 1 no proof; 2a filtered; 2b missing filters; 3 no files; 4a wrong platform; 4b ignore injected platform; 5a superseded run; 5b earlier passing attempt; 6 ignored fallback paths; 7a unreadable CI becomes local fallback; 7b cancelled CI accepted; 8a CI suiteMs zero; 8b legacy renderer changed; 9 obsolete preamble line retained. Additional pairs break the required runner field and the new declared seals.

Command: `SEAT_MUTATE_OUT=<lane>/mutation-output.txt SEAT_MUTATE_SHARDS=4 SEAT_MUTATE_STAGGER_SECS=1 node docs/reviews/ci-suite-2026-11-01/seat-mutate.mjs`; exit 0.

`RESULT: 16/16 red (14 exactly their named titles, 0 with a named title green, 2 with an unnamed red), 0 survived, across 4 shards`

The runner-field assertion prints a deliberately failing nested fixture's output, which the mutation runner also calls an unnamed red. The combined seal mutation also breaks four behavior checks. Every pair fails its intended named check.

## Commands and exits

- `npm run map:impact -- <affected modules>`: exit 0, including the supplementary impact run.
- Wrong-first filtered run of the four newly affected test files: exit 1 as required, before implementation.
- First targeted run after implementation: exit 1, only the not-yet-refreshed AGENTS marker pin.
- Next ten-file targeted run: exit 1, only a second obsolete documentation assertion in R-981. Corrected that assertion, without changing its other checks.
- Final targeted command: `node scripts/test.mjs packages/nana-pack/tests/land-ci-suite.test.mjs packages/nana-pack/tests/land.test.mjs packages/nana-pack/tests/land-records.test.mjs packages/nana-pack/tests/build-report.test.mjs packages/nana-pack/tests/land-ci-records.test.mjs packages/nana-pack/tests/suite-records.test.mjs packages/nana-pack/tests/rulings.test.mjs packages/nana-pack/tests/templates-render.test.mjs packages/nana-pack/tests/test-runner.test.mjs packages/nana-pack/tests/test-runner-parallel.test.mjs packages/nana-pack/tests/worker-lane.test.mjs packages/nana-pack/tests/ci-records.test.mjs packages/nana-pack/tests/runtime-land.test.mjs --jobs=4`: exit 0.
- `npm run map`: exit 0; `npm run req:tree`: exit 0.
- `npm run map:check`: exit 0.
- `npm run readme:check`: initially exit 1 because the claim checker bound the newly named runner path to the land CLI flags in the same paragraph. Separating that path list into its own paragraph restored exit 0; the checker was not changed.
- `node scripts/requirements-trace.mjs`: exit 0.
- `node scripts/requirements-tree.mjs --root .`: exit 0.
- `node scripts/known-bugs.mjs --root .`: exit 0.
- `node scripts/identity-scan.mjs --root .`: exit 0 initially; after staging new evidence, exit 1 for local paths in Node warnings. Normalizing checkout/home prefixes in the output restored exit 0; no allowlist changed.
- `node packages/nana-setup/bin/install-check.mjs`: exit 1; all checks except the known `pi post-edit` write-error pass. Paths in its committed output are normalized.
- `pi --version`: exit 0, prints 1.0.2.
- `git diff --check`: exit 0 on the final working diff. A staged check initially exited 2 for trailing whitespace in captured PASS output; the evidence-only follow-up strips it.

Targeted suite summary:

`13 files: 13 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 443 pass, 0 fail, 0 skip · 148.2s`

The implementation commit followed that green targeted run. The final evidence-only commit changes no executable implementation or test assertion. Required checks are repeated on the final commit, with outputs outside the checkout to preserve its tip.

## Known bugs touched and residuals for the seat

The complete `docs/known-bugs/FEAT-008.md` was read. It was not edited.

- Latest-attempt-wins: still allows a rerun flake; now that positive evidence can replace the local suite.
- Pull-request merge-base/tree limitation: unchanged; a stacked PR against a non-main base can test another tree. Normal lane PRs target main.
- CI read once before the suite: workflow judgment still happens once. A rerun started afterward is not rejudged. The separate record read cannot grant an unjudged run proof.
- Linux continue-on-error: unchanged. Successful workflow judgment still follows the blocking macOS/Windows and install legs; a same-platform record is additional proof, not a replacement for that judgment.
- Post-merge records latency: unchanged read ordering, plus a new pre-merge proof read when no fallback path changed. Total latency can include two existing-budget reads.
- Artifact-less scaffold projects: still get the post-merge no-record note and now explicitly retain their local suite fallback.
- Budget-tail diagnostic: the exported wrapper now observes elapsed time after the last call as well as refusing calls past its budget. A completed-last-call overrun cannot grant suite substitution. The raw reader's timeout wording is not rewritten.
- Map/report/suite-record freshness: CI lands do not refresh them. Fallback lands and hand commands remain makers; the local slower-file baseline thins. CI slow-file advice partly replaces that signal.
- Seat pi mismatch: plan A3 is still a prerequisite. No automatic pi-version gate was added.
- Fallback list intentionally excludes runner configuration and Windows-skip configuration, as the plan's A9 directs.
- CI macOS's locale-dependent skips remain covered by blocking Windows tests, with the plan's macOS-only residual unchanged.

No other known bug was deliberately fixed.

## Not done / open questions

- No full local suite: the brief explicitly delegates it to CI/the seat. This lane changes `scripts/test.mjs`, so its own land must run the locked local fallback.
- No CI run was waited for or read. The builder pushes its last commit, opens a draft PR against main, and stops.
- No Windows machine run, independent review, land review, merge or cleanup was performed by the builder.
- Install check is not green because of the named environment failure. The seat must decide its disposition.
- Seat pi upgrade and the A3 version equality check remain for the seat.
- The three optional owner choices use their ordered defaults: refuse unavailable CI, no CI-land report refresh, require unfiltered same-platform record evidence.
- No issue was created, edited, commented on or closed. The seat owns any residual known-bug entries.
