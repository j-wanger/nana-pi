# code-search build 2

VERDICT: DONE

## Scope and files

Feature FEAT-029, lane `code-search`, branch `feat/code-search`.

- `scripts/code-map.mjs`: retain the template generator and import-only impact output; enrich written maps/checks with launch links and expose `--search`.
- `scripts/code-map-launch.mjs`: reciprocal literal launch links, limited to launch arguments and their named constants.
- `scripts/code-search.mjs`: pure, facet-free trial ranker over supplied map and ledger text; deterministic path ties; shortlist reasons and callees.
- `scripts/code-search-config.mjs`: shortlist, output depth, quality floor, ranking settings and provenance.
- `package.json`, `README.md`, `packages/nana-pack/prompts/planner.md`: command and planner contract.
- `packages/nana-setup/lib/doctor.mjs`, `packages/nana-pack/lib/frontier-summary.mjs`: header-only search improvements.
- `packages/nana-pack/tests/code-search.test.mjs`: five must-meets and four configuration checks, awaited with a per-case limit; all writable fixtures use the OS temp directory.
- `packages/nana-pack/tests/fixtures/code-search/{needs,landed-reuse}.json`: byte-identical fixture copies of the seat's records, with ten needs and their answer key.
- `REQUIREMENTS.md`: R-3000 through R-3008, all implemented with backticked file::title evidence, under FEAT-029; no cross-feature row moves.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated navigation artifacts.
- This folder's `build-checks.txt`, `cleanup-checks.txt`, `wrong-code.txt`, `search-mutation.txt`, `impact-before.txt`, `search-examples.txt`, `seat-checks.txt` and this report: build evidence.

## Must-meets and mutation pairs

All test titles below are in `packages/nana-pack/tests/code-search.test.mjs`.

| Item | Row | Test title | Wrong code → restored code |
|---|---|---|---|
| 1 | R-3000 | R-3000: written launch links are reciprocal and stale links fail the map check | Template-only map without launch links: FAIL → reciprocal launch links: PASS |
| 2 | R-3001 | R-3001: search prints five non-tests with reasons then callees using headers paths and artifacts | Empty ranker: FAIL → full-header/path/artifact ranker and callee output: PASS |
| 3 | R-3002 | R-3002: ten fixed-base needs meet the printed-output reuse floor without skipping missing history | Empty ranker: mean 0, FAIL → restored ranker: mean 0.778810, PASS |
| 4 | R-3003 | R-3003: identical search inputs give identical bytes with no network or model dependency | Empty ranker loses the meaningful, ordered result: FAIL → stable path ties and pure search: PASS |
| 5 | R-3004 | R-3004: planners run search for each part and name what they took under Precedent | Original prompt without search instruction: FAIL → explicit pinned sentence: PASS |

Configuration checks:

- `seal: R-3005 shortlist size is 5`: zero → five, FAIL → PASS.
- `seal: R-3006 callee depth is 1`: zero (and the exploratory two-hop setting) → one, FAIL → PASS.
- `seal: R-3007 quality floor is 0.75`: zero initially, then 0.80 against the final row → 0.75, FAIL → PASS.
- `seal: R-3008 ranking settings retain the facet-free trial values and provenance`: empty settings → trial settings and provenance, FAIL → PASS.

The initial wrong-code run exited 1. Its empty ranker initially passed only the quality check while the deliberately wrong floor was zero. Setting the floor to 0.80 made that same empty ranker fail the quality check before ranking code was written. `wrong-code.txt` records that run. After choosing the final floor, a fresh code mutation returned no results without changing assertions: R-3001, R-3002 and R-3003 failed, exit 1 (`search-mutation.txt`). Restoring the code passed all nine checks, exit 0 (`build-checks.txt`).

The parser fixture covers CRLF, trailing spaces/tabs and no final newline. History reads name the absent commit and fail rather than skip. Quality counts only the output's actual shortlist/callee lines, not paths mentioned incidentally in ranking explanations.

## Quality and two searches

The ten needs use their six fixed base commits and each base's own REQUIREMENTS.md. The target is each lane's distinct union of `reused_code` and `extended`, not `reused_tests` or new code. The result is the arithmetic mean of each lane's found/expected share.

| Need | Found/expected |
|---|---:|
| adoption-window | 2/2 |
| artifact-readers | 4/4 |
| build-records | 6/8 |
| hard-kill-watcher | 6/7 |
| keep-movement | 4/4 |
| knowledge-freeze-notice | 5/7 |
| land-reads-ci | 2/3 |
| pi-version-support | 3/3 |
| report-at-land | 3/6 |
| session-start-frontier | 3/10 |

Measured mean share: **0.778810 (77.881%)**. The quality case took **0.412 seconds** in the recorded direct green run; the full suite reported the whole nine-check file at **0.6 seconds**.

`search-examples.txt` contains the complete command output for two of those needs on the lane's improved map: adoption-window and artifact-readers. It includes every path, purpose, ranking reason and callee. Those current-map examples are separate from the fixed-base quality evaluation.

## Choices and departures

1. **Quality floor: 0.75, not the trial's reported 0.80.** Accepted attack M1 explicitly permits a chosen margin below the trial result. The unmodified facet-free weights with direct callees measured 0.778810 on exact printed paths. A five-point margin under the reported trial result avoids tuning weights on ten needs. Both requirement and seal test state 0.75. This is not a claim to reproduce 80%. An exploratory two-hop output measured 0.791310 and still missed 0.80; it was discarded. Final output depth is one, and ranking weights remain unchanged.
2. **Wrapper adds launch links only to written maps/checks.** Existing R-1272/R-2822 require the template's impact output byte for byte. The map introduction explicitly distinguishes launches from imports and says impact remains import-only. The template generator and Python template remain unchanged, as O3 requires.
3. **New tracked ranker follows the trial record, not a moved helper.** Facets are omitted as instructed. It keeps the trial tokenizer rather than importing knowledge STOPWORDS because the trial uses different stopwords and stemming. No knowledge tokenizer or private helper is copied. Its ledger parser needs the trial's historical Made by/Read by forms, unlike the impact block's current-ledger presentation.
4. **Tie order uses explicit code-point path comparison**, not host-locale collation, for repeatable output across machines.
5. **Launch links use path evidence**, not the trial's test-name heuristic. Same-stem test neighbours remain only in ranking. The scanner follows launch argument constants; it does not link every path mentioned by a module that happens to launch something. Raw-source parsing can still over-link quoted examples and miss computed paths; it is not a JavaScript evaluator.
6. **Class differs from the brief.** The planned/final header edit to `packages/nana-setup/lib/doctor.mjs` makes lane-class print `install: packages/nana-setup/lib/doctor.mjs — nana-setup library`. Keeping that header change satisfies must-meet 1; the doctor implementation and install behavior are unchanged. No hook or extension implementation changed.

The generator wrapper imports the existing generator functions. The history check follows lane-class's fixed-commit/read-only approach. The test uses the existing `tmpDir` helper. No private precedent function was moved or copied.

## Headers changed and why

- `scripts/code-map.mjs`: describe launch-enriched maps and search inputs/outputs in the wrapper's contract.
- `packages/nana-setup/lib/doctor.mjs`: name globally installed pi package versions, knowledge sources config and index age, which the failed trial needs ask about.
- `packages/nana-pack/lib/frontier-summary.mjs`: name session start, next items, open questions and the shared Claude Code/pi consumer boundary.
- New search, search-config, launch-link and test modules each have a six-tag header stating their own contract. Existing test headers remain unchanged because their contracts still hold.

## Every existing test edit

1. `packages/nana-pack/tests/code-map.test.mjs`: the existing “no module in a package imports an app” assertion now examines the template's import-only graph. A real process launch may cross layers; treating it as an import made the old graph-based assertion false. No assertion or test was removed.
2. `packages/nana-pack/tests/runtime-map.test.mjs`: the R-1278 copied-wrapper fixture includes its three new static dependencies (launch module, search module, search config). Without them the copied impact command cannot load. Its assertions and title are unchanged.

No other existing test changed. No test was deleted.

## Commands and exit codes

- `node packages/nana-pack/tests/code-search.test.mjs`: initial wrong-code run 1; final empty-search mutation 1; restored nine-check run 0.
- `npm test -- code-search.test.mjs code-map.test.mjs runtime-map.test.mjs requirement-rows.test.mjs blast-radius.test.mjs lane-class.test.mjs linked-launch.test.mjs`: initial 1 (import-layer assertion and copied-wrapper dependencies), then 0: **7 files, 101 checks passed**.
- `npm test -- code-search.test.mjs test-runner.test.mjs`: 0 after adopting the existing temporary-directory helper.
- `npm run test:locked`: first foreground run 1 (new test called mkdtemp directly); second plain foreground run 0, machine-wide lock held by the repository command. Neither run was redirected or backgrounded.
- `npm run map`: 0; 458 modules.
- `npm run map:check`: 0; 0 problems.
- `npm run readme:check`: 0; 788 claims, 0 problems.
- `node scripts/requirements-trace.mjs`: 0; 1863 implemented and traced, 0 off-form rows.
- `node scripts/requirements-tree.mjs --write`: 0. An initial `--root . --write` invocation was refused with exit 2; the repository's documented write form was then used.
- `node scripts/requirements-tree.mjs --root .`: 0; 0 problems.
- `node scripts/known-bugs.mjs --root .`: 0; `summary names=0 sizes=0`.
- `node scripts/identity-scan.mjs`: 0; see `seat-checks.txt` for the tracked-file scan count.
- `git diff --check`: 0.

Final locked-suite summary:

```text
231 files: 229 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8621 pass, 0 fail, 44 skip · 590.8s
```

## Known bugs touched

- The Precedent audit's “no tool finds a sibling implementation” gap: search now supplies a planner command; actual use remains a carry.
- Process-only map links: literal repo bin/script launches now contribute to the written search map. Import-only impact and blast-radius behavior remain unchanged; the broader process/path/platform residuals are not fixed.

No known-bug file was edited. No other known bug was fixed.

## Not done and carry

- Observe the next three plans' Precedent sections against search output. A prompt-text check cannot prove planner use.
- No remote CI, native Windows run, push, review, merge or GitHub issue action. None was requested as a build completion check.
- No live install rehearsal: its implementation starts model sessions and uses the network, both forbidden by this brief. The locked suite's isolated install tests passed. A seat applying install-lane land rules must account for the classifier mismatch before landing.
- No changes to HANDOFF, session archives, known-bug files, the trial folder or either template generator.
- No new dependency installation, network access or model session was initiated by this build.

This is a technical builder record. Required paths, identifiers and verbatim test titles remain despite report-mode writing-check identifier warnings.
