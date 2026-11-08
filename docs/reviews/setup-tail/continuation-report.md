# setup-tail continuation

VERDICT: DONE

All nine must-meets are implemented. This continues the earlier part-2 checkpoint; it does not replace its history.

## Commits and closures

| Commit | Part, rows and files | Wrong-code pair and green command |
|---|---|---|
| `f70605b0` | Part 3: M1/R-3885, M3/R-3887, M8/R-3892. `copier.yml`; both `templates/*/template/AGENTS.md.jinja`; both template README-check scripts and four rail-test comments; six `packages/nana-pack/skills/*/SKILL.md` files; `README.md`; `packages/nana-pack/tests/templates-render.test.mjs`; `packages/nana-setup/tests/setup-tail.test.mjs`; `REQUIREMENTS.md`; `docs/code-map.md`. | Original guidance, deletion update and missing manual checks fail all three new cases (exit 1). Updated guidance, exclusion and executable clean/broken fixtures pass. `npm test -- setup-tail templates-render`: 0. `npm test -- templates-update`: 0. |
| `9ff362fd` | Part 4: M4/R-3888. `packages/nana-setup/tests/install-check.test.mjs`; `REQUIREMENTS.md`. | Whitespace-only splitting fails both list cases; removing regex matching fails the anchored case; accepting every word matcher fails NotStartup (each exit 1). Restored code passes `npm test -- packages/nana-setup/tests/install-check.test.mjs`: 0, 125 checks. No production matcher change. |
| `64e02d8f` | Part 5: M5/R-3889, M9/R-3893. `packages/nana-setup/lib/steps.mjs`; `packages/nana-setup/lib/uninstall.mjs`; `packages/nana-setup/tests/setup-tail.test.mjs`; `packages/nana-setup/tests/uninstall.test.mjs`; `REQUIREMENTS.md`; `docs/code-map.md`. | Original uninstall leaves the dangling link and prints no dry-run removal (both new cases fail, exit 1). Exact parent ownership now supports dry run, removal and repetition while preserving foreign entries. `npm test -- setup-tail packages/nana-setup/tests/uninstall.test.mjs retired-artifacts`: 0, 89 checks. |
| `d8f5840c` | Part 6: M6/R-3890. `packages/nana-pack/lib/config.ts`; `packages/nana-pack/lib/prompt-sections.mjs`; `packages/nana-setup/lib/doctor.mjs`; pack README; two config tests; eleven setup fixture callers; `packages/nana-setup/tests/setup-tail.test.mjs`; `REQUIREMENTS.md`; `docs/code-map.md`. | Original code fails the new case for the dead export, retired order key and active notify normalization (exit 1). Removing them passes, including valid and malformed legacy notify values with no diagnostics. Touched tests: 0; config/objective regressions: 0; setup-retire after regenerating the map: 0. |
| Final evidence commit | `docs/components/nana-pi.json` and the four continuation evidence/report files in this directory. | Setup already carried `sound`; its stale evidence now points to the completed implementation and live tests. The component audit now passes with every setup-tail row implemented. |

M2/R-3886 and M7/R-3891 remain green from `880711a0`. Their files, original wrong-code observations and existing-test edits are recorded in `builder-report.md` and `builder-evidence.txt`. No new IDs were added in this continuation. No test file was added or deleted here.

## Checks

Full normalized output: `continuation-checks.txt`. Wrong-code output: `continuation-mutations.txt`. Changed-guidance searches: `changed-guidance-grep.txt`.

| Command | Exit | Result |
|---|---:|---|
| `npm run map` then `npm run map:check` | 0 / 0 | 544 modules; no header or map problems |
| `npm run req:tree` | 0 | 2667 rows; 43 features; zero tree problems |
| `npm run readme:check` | 0 | 846 claims; zero problems |
| `node scripts/component-audit.mjs --check` | 0 | Setup sound; unrelated staleness and 21 unclaimed modules remain report-only |
| `node scripts/requirements-trace.mjs` | 0 | 2064 traced rows; zero EARS problems |
| Path-filtered touched tests and config/template/prompt regressions | 0 | 31 files: 30 PASS, 0 FAIL, 1 SKIP; 2543 checks pass, 3 cases skip |
| `node scripts/test.mjs test-runner` | 0 | 2 files; 64 checks pass |
| `npm run template:accept` | 0 | Native checks in Python, TypeScript and optional-data scaffold/adopt projects |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | macOS: all 15 result lines PASS |
| Changed-guidance literal grep across all tracked test sources | 0 | 112 changed nonempty lines; 316 test sources searched; no literal matches or search errors |
| `git diff --check` | 0 | No whitespace errors |

The exact path-filtered command is recorded in the checks file. The checks are rerun on the final committed tip before the final response. CI covers the full suite under `AGENTS.md`; no local full suite ran. No push, GitHub issue operation, credential lookup or CI read occurred. Windows-native execution remains for CI; the Windows-only hook test skips on this Mac.

## Existing tests edited

- `packages/nana-pack/tests/templates-render.test.mjs`: the rendered policy-file assertion now expects omission and traces R-3887. R-630 keeps its gate tests but loses the false rendered-file citation.
- `templates/python/template/tests/test_code_map.py.jinja`, `templates/python/template/tests/test_readme_check.py.jinja`, `templates/typescript/template/tests/code-map.test.ts.jinja`, `templates/typescript/template/tests/readme-check.test.ts.jinja`: comments no longer claim an automatic gate. No assertions changed.
- `packages/nana-setup/tests/uninstall.test.mjs`: its dry-run result list now includes the retired verifier row.
- `packages/nana-pack/tests/config-normalize.test.mjs`: the schema matrix and typed-config predicate omit retired notify fields. Intact-user assertions now compare journal. The BOM case uses the live journal-enabled leaf. The matrix label derives its block count. These checks previously promised a live notify return value that no longer exists.
- `packages/nana-pack/tests/config-handlers-malformed.test.mjs`: existing notify cases now expect zero diagnostics rather than one. Both cases remain.
- `packages/nana-setup/tests/desk-service.test.mjs`, `doctor-fix-line.test.mjs`, `rulings-install.test.mjs`, `linked-claude-folder.test.mjs`, `win32-degrade.test.mjs`, `skills-and-standards.test.mjs`, `settings-lock.test.mjs`, `install.test.mjs`, `relative-agent-dir.test.mjs`, `win32-hook-repair.test.mjs`: removed imports of the deleted floor; retained the exact historical fixture version as test data. No behavioral assertion changed.
- `packages/nana-setup/tests/hooks-win32-exec.test.mjs`: retained that fixture version without parsing a removed production export.
- `packages/nana-setup/tests/install-check.test.mjs`: restored exactly the four matcher cases required by M4.
- `packages/nana-setup/tests/setup-tail.test.mjs`: added only the remaining must-meet tests M1, M3, M5, M6, M8 and M9. Its harness awaits every case with a per-case limit. Fixtures stay in OS temporary directories.

## Precedent, callers and departures

Every brief precedent was read before design, including the complete install-check test file. The two deleted template config files were read only through the seat's saved copies. No `.pi/nana-pack.json*` file was changed in this worktree.

- The Python AGENTS Commands section remains the manual-check home. Both languages now name lint, format, types, tests, map, README and file-length commands. Adoption names the same commands and preserves existing policy bytes.
- Departure: Copier's `_exclude`, not `_skip_if_exists`, preserves deleted template policy on update. The skip-list attempt failed M3; the exclusion passes both language update cases.
- Departure: the TypeScript manual count treats a final newline as a terminator, not an extra line. The old command rejected a 300-line newline-terminated file. M8 now checks exact caps and cap-plus-one files with LF/CRLF, trailing spaces/tabs and no final newline.
- The uninstall ownership predicate came from the existing retired-link handling in `steps.mjs`. It is now public as `retiredHookLinkOwned`; both `stepRetiredArtifacts` and `uninstall` call it. No private cross-module import, copied helper or move to a shared module occurred.
- Uninstall includes the retired link in ancestor preflight and inventory anchoring. Only an exact hook name under the canonical checkout hook parent qualifies. A foreign-only inventory still refuses before writing.
- Repository searches found no production caller of the removed notify return block or subagents floor. All eleven test callers are listed above and in the implementation commit message.
- Component status was already `sound`; no status flip was needed. Its evidence and audited revision were refreshed only after every row passed.

## Known bugs and remaining work

The entire `docs/known-bugs/FEAT-013.md` was read. No listed known bug is claimed closed. The uninstall changes leave Windows uninstall unsupported, including the known retained `.cmd` shims. The install/uninstall race remains untested and outside this brief. The existing npm-prefix limitation of direct-node setup tests remains; path-filtered npm runs pass.

No open implementation question remains. Not done: local full-suite fallback, native Windows/Linux runs, push, independent review, CI and land; those remain seat/CI work. The earlier blocked policy-file deletion was resolved by the seat's `9f858343`, not by a builder workaround.
