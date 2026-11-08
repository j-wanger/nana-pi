# ci-packs build 2

## Pack adjustment

The first M1–M7-only data-pack measurement took 178.70 s. M6 (Copier update acceptance) took 167.22 s; M1 took 8.86 s. These are not fast fixture cases. Following the brief's fallback, the original file moves to release and M2 moves to `data-pack-land.test.mjs`, retaining its marker and assertion. Its measured fixture time was 0.12 s.

The fast guard imports the newly public `py` helper from the precedent file. The release cases are entry-point guarded so importing that helper never runs acceptance. No helper was copied or moved into an unauthorized shared module. There are no new requirement IDs or tunables. R-3841's evidence path changes first. The existing R-3855 guard list follows that path; no assertion is weakened.

First four-job land measurement: 90.46 s real / 89.4 s runner. `win-main-only.test.mjs` took 56.8 s. It moves from land to main: this is event/platform integration policy, not one of the design's core-contract guards. Windows forced-launch and shard policy guards remain in land. `land.test.mjs` (33.7 s) and `brief-check.test.mjs` (30.6 s) stay: land authorization and builder refusal are named core contracts.

After that move: 52.09 s real / 51.5 s runner, 71 files, 2,445 passing checks. Evidence: `land-first.log`, `land-packs.log`, `data-fixtures-timing.log`.

Mutation pair: the extracted M2 first fails against the absent public helper (`data-land-red.log`, exit 1). A product-code mutation returning no findings also fails M2 (`data-contract-mutation-red.log`, exit 1). Restoring the product passes (`data-contract-green.log`, exit 0). No assertion was inverted. The original release file passes all seven remaining cases (`data-release-premerge.log`, exit 0).

Precedent departures: the alternative whole-file release move is explicitly allowed by brief 2. The original test exposes `py` and gains an entry-point guard solely to reuse its existing implementation without executing release acceptance during land.

## Merge and final verification

Merge parent: `2896328aaf3ad74b22b6723edab439dec05bd25c` (current main). The merge preserves main's review-paperwork retirement and Python-only M8 acceptance, plus this lane's pack selection, shard proofs and core extractions. No deleted path is restored.

Conflicts and integration:

- REQUIREMENTS.md keeps main's revised review contracts and retirements, while keeping the lane's moved Windows/Claude evidence paths. R-3857 now explicitly excludes the three test files main retired.
- The pack README keeps main's removal of kept-text prerequisites and retains the lane's pack-record/shard requirements.
- Both generated documents are rebuilt by `npm run map` and `npm run req:tree`, never resolved by choosing one side.
- `review-paperwork.test.mjs`, main's new collected file, belongs to module. M1 fails before that assignment (`main-membership-red.log`, exit 1), then passes with it.
- Pack entries for main's deleted keep-movement, requirements-moved and review-movement tests are removed. M8 initially fails on that legitimate retirement (`merge-land.log`, exit 1). Its existing test gains only those three explicit exceptions, asserting that each remains absent. It still pins every remaining historical file and the failing-retire canary.
- `claude-review-launch.test.mjs` drops only unused imports/constants from main's deleted movement/ledger modules. Both extracted assertions remain byte-identical to the move manifest. No production caller changes in the merge.

Existing-test edits in the merge are limited to the R-3855 guard path, unused deleted-module imports, and the M8 explicit-retirement check above. The later M6 fixture correction is documented below. No new must-meet, assertion inversion, tunable, test deletion, or copied helper is introduced. Main's imported test changes otherwise remain as main authored them.

Verification before the merge commit:

| Command | Exit | Evidence/result |
|---|---:|---|
| `npm run map` | 0 | `merge-map.log` |
| `npm run map:check` | 0 | `merge-map-check.log` |
| `npm run req:tree` | 0 | `merge-tree.log` |
| `npm run readme:check` | 0 | `merge-readme.log` |
| `node scripts/requirements-trace.mjs` | 0 | `merge-trace.log` |
| Title check via `checkRepo` | 0 | `merge-titles.log`, **0 missing** |
| `node scripts/component-audit.mjs --check` | 1 | `merge-components.log`: the two new main modules are not tracked at pre-merge HEAD; rerun on the merge commit |
| All touched surviving tests, four jobs | 0 | `merge-touched.log`: **64 files, 62 PASS, 0 FAIL, 2 platform SKIP; 2,615 passing checks; 341.2 s**; exact argv in `touched-command.txt` |
| `npm test -- --pack=land --jobs=4` | 0 | `merge-land-green.log`: **71 PASS, 2,445 passing checks; 48.8 s runner / 49.31 s real** |
| Literal test-text audit | 0 | `merge-test-text.log`: the original 753 sentence/path needles rechecked against current test sources |
| `git diff --check` | 0 | No whitespace errors |

Merged-tree land's ten slowest files (seconds under four-job load):

| File | Seconds |
|---|---:|
| packages/nana-pack/tests/brief-check.test.mjs | 29.0 |
| packages/nana-pack/tests/land.test.mjs | 27.7 |
| packages/nana-pack/tests/identity-tree.test.mjs | 16.0 |
| packages/nana-pack/tests/win-shards.test.mjs | 13.7 |
| packages/nana-pack/tests/test-packs-ci.test.mjs | 9.8 |
| packages/nana-setup/tests/install.test.mjs | 9.4 |
| packages/nana-pack/tests/gate-corpus.test.mjs | 8.9 |
| packages/nana-pack/tests/issue-watch.test.mjs | 8.5 |
| packages/nana-setup/tests/settings-merge.test.mjs | 5.0 |
| packages/nana-setup/tests/pi-registration.test.mjs | 5.0 |

Only brief-check and land remain above 20 s; both are named core-contract guards. There is no remaining measured obstacle to the 90 s target. Postcommit checks on merge tip `bc29b038cb77041b6e1dca9c64778578be7fb2c8` are retained in `tip-bc29b038/`. Map generation/check, tree generation, README, component audit, trace, titles (0 missing), test-runner (2 files / 64 checks), install-check and four-job land all exit 0. Land passes 71 files / 2,445 checks in 51.54 s real (51.0 s runner).

Its ten slowest files: land 30.5 s, brief-check 29.6 s, identity-tree 16.0 s, win-shards 14.9 s, test-packs-ci 10.5 s, setup/install 9.9 s, gate-corpus 9.9 s, issue-watch 8.5 s, setup/pi-registration 6.5 s, credential-gate 5.9 s. All names above are `.test.mjs` files under the same paths as the preceding table, except credential-gate under `packages/nana-pack/tests/`.

Initial postmerge selection: `npm test -- --pack=land,module --changed-from=main` exits 1: 179 files, 178 PASS, one FAIL, 4,535 passing checks, 1,331.66 s real. Only data-pack M6 fails; M8's real Python acceptance passes. The verbose focused diagnostic also exits 1 (six PASS, one FAIL). M6 clones the checkout, checks out the nearest reachable release, copies the current templates, and requires a new commit. `git describe` selects `v0.6.49` at the merge's first parent but `v0.6.51` at the merge and main. `git diff v0.6.51 -- copier.yml templates` is empty. Therefore the newly reachable release makes the fixture's setup commit empty; git reports `nothing to commit, working tree clean`.

The merge makes that existing setup false. R-3845 is clarified first to include a previous release with unchanged template bytes. The fixture then gains only `--allow-empty` on its synthetic `next` commit. Every M6 assertion and marker remains unchanged, including the subsequent real revision reaching both update modes. No product behavior changes. This is a necessary merge integration adjustment to the named precedent file, not an unrelated known-bug fix. The red diagnostic and the restored green form the wrong-setup pair; no assertion is inverted.

`data-release-green.log`: exit 0, all seven remaining cases including real Python M8, 202.5 s runner. `selected-green.log`: `npm test -- --pack=land,module --changed-from=main --jobs=4`, exit 0, **179 PASS / 4,536 passing checks / 463.59 s real**. The four-job rerun preserves the same selected files and reasons as the initial serial check. Final map check, README and trace also exit 0. The last implementation commit contains this fixture-only integration fix and the complete sanitized postmerge evidence. Its postcommit checks are reported separately so no later evidence commit changes the verified tip.

`git diff --check` before staging exits 0 for the lane's integration edits. The staged whole-merge check exits 2 on whitespace in main's already-authored evidence logs/diffs. Those imported records remain unchanged.

## Scope and remaining work

The complete FEAT-031 known-bug file was read. No listed bug is fixed by this follow-up. Pack timing still reflects parallel load, as its known-bug note says. The config-normalize ambient-agent-variable bug remains untouched; tests run through the scrubbing suite runner. Record crash/retention/history limitations and Windows timing/skip limitations remain unchanged. The install-check builder-session limitation is not changed.

Full-suite execution is delegated to CI by AGENTS.md. Native Windows, the seat's push/CI verification, and first-ten-lanes timing remain for the seat. No push, CI read, credential lookup, model launch, GitHub operation, HANDOFF edit, known-bug edit, or session-archive edit is performed. There is no open owner decision or unresolved fixture failure.
