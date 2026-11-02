# Build 2 technical record

VERDICT: DONE

Branch: `feat/builder-credential-strip`. No push. The final response supplies the committed tip.

Baseline: `fd054d0dbe3c5ed0946571c305e63cd8c85acc5a`.

## Closures

1. MUST: `review-ledger.mjs` now seals direct Claude settings with imported `readClaudeBuilderSettings`, `writeClaudeBuilderSettings` and `credentialStripEnv`. Claude executable names include native and batch extensions. Existing flag settings retain their non-credential fields. Unsealed file or inline settings receive credential controls after their environment. Temporary files use the precedent's private-file writer, exit cleanup and Windows cleanup-only watcher. Already sealed wrapper settings retain their file and exact logged bytes.
2. SHOULD 1: the root README Tests section assigns verified pushes and CI waiting to the seat. Builders commit and report without pushing.
3. SHOULD 2: the floor now covers spaced `git credential-osxkeychain get`, `git credential-manager-core get`, `git credential-store get`, `git credential-wincred get` and `gh auth status --show-token`. The helper alternatives also cover standalone executable names. M4 allows `git credential-store --file x erase`, `gh auth status` and the existing `git credential-cache exit`.
4. NOTEs: six lines in `docs/known-bugs/FEAT-006.md` carry `(builder-credential-strip, review round 1)`, one per NOTE bullet across both reviews.

## Files and rows

- `packages/nana-pack/bin/review-ledger.mjs`: Claude settings sealing and cleanup.
- `packages/nana-pack/lib/credential-gate-config.mjs`: widened pattern list.
- `packages/nana-pack/tests/credential-strip.test.mjs`: M2 regression and M5 README scan.
- `packages/nana-pack/tests/credential-gate.test.mjs`: M4 corpus and M7 seal.
- `README.md`: Tests wording only.
- `docs/known-bugs/FEAT-006.md`: six NOTE lines only.
- `REQUIREMENTS.md`: evidence cells only, R-3661, R-3663, R-3664 and R-3667; changed before tests and code. No new rows.
- `docs/code-map.md`: generated through `npm run map`.
- This lane folder: portable evidence, evidence runners and this record.

`node scripts/requirements-tree.mjs --write` exited 0 and changed no generated tree file.

### Existing test edits

No new test declaration and no deleted test.

- M2's matrix adds `ledger-claude` across all six existing fixture routes. Its fake Claude applies conflicting settings even when no flag settings exist. The settings fixture lives in temporary HOME. The generic ledger child remains in the matrix.
- The matrix's flag expectation now includes direct ledger Claude. Its password/invocation/bounded assertion runs before its flag assertion, so red proves restored dispatch rather than merely a missing flag.
- The settings-application fixture distinguishes Claude from pi through a fixture-only environment name. M1 still exercises both spawn and effective settings.
- M5's existing shipped-guidance scan now includes root README; that sentence contradicted the scan's contract.
- M4 adds the five requested denied forms and two new negatives; the cache negative was already present.
- R-3667's existing seal changes with the pattern list.

## Red / green and mutation pairs

- `build-2-red.txt`: new assertions against unchanged runtime code, exit 1. M2 fails at `ledger-claude/global/effective`: password and fixture invocation are true. M4, the gate seal and M5 also fail. M3 additionally exposes the conflicting settings' unrelated-config overwrite during this failed matrix.
- `build-2-ledger-mutation.txt`: the final M2 fixture against code with the ledger's Claude settings branch disabled, exit 1. M2 again observes the fixture password/helper. Assertions were not inverted. Restoring that branch returns the required run to green.
- `build-2-green.txt`: restored code, three required files, 235 passing checks, exit 0. All six direct-Claude ledger fixture routes suppress passwords and helper/askpass invocation. Every fixture parent positive control gets its own fixture password.
- Gate pair: original pattern code fails M4 and R-3667; widened code passes both. README pair: original sentence fails M5; corrected sentence passes.

Required test command (captured with `--verbose` for fixture evidence):

```text
node scripts/test.mjs packages/nana-pack/tests/credential-strip.test.mjs packages/nana-pack/tests/credential-gate.test.mjs packages/nana-pack/tests/gate-corpus.test.mjs
3 files: 3 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 235 pass
exit: 0
```

## Checks and exits

`build-2-checks.txt` records these commands and standalone exit codes:

- `npm run map:check`: 0; no missing header or map problem.
- `npm run readme:check`: 0; 1064 claims, 0 problems.
- `node scripts/requirements-trace.mjs`: 0; 2185 implemented rows traced.
- `node scripts/requirements-tree.mjs --check`: 0; 2441 rows, 43 features, 0 problems.
- `node scripts/known-bugs.mjs --root .`: 0; names=0, sizes=1. Its existing FEAT-013 size notice remains outside scope.
- `nana-writing` on the new README and NOTE lines: 0; over=0, passive=0, banned=0.
- `node scripts/identity-scan.mjs --root .`: 0; findings=0.
- `git diff --check`: 0.

`build-2-install.txt`: `node packages/nana-setup/bin/install-check.mjs`, with `NANA_WORKTREE_ROOT` cleared, exit 0; 23 PASS lines. Only temporary fixture authentication was used. Evidence runners replace local roots with portable labels and trim trailing output whitespace.

## NOTE lines recorded

1. Scripts can invoke helpers or stores directly; the strip protects git dispatch only.
2. The older branch-push/draft-PR ruling still reaches builders; the newer specific ruling governs.
3. Invalid GIT_CONFIG_COUNT prints pi-worker's stack trace; git also refuses that environment.
4. outside-reader, visual-reader and bare pi-watchdog launches remain outside the strip's planned launch list.
5. The five plan residuals and Claude settings/desktop/managed-policy limits remain accurate.
6. The land review confirmed the other controls, seat exclusion, push ownership and prior mutation/install evidence.

## Precedent departures

- No private helper was copied, moved or exported. Settings carry, private writes, credential controls, JSON decoding and cleanup watching use public imports.
- Unlike claude-review's unconditional settings-file creation, the ledger retains a supplied file after validating both credential reset routes and all fixed controls. This preserves the wrapper's exact context-load byte record and argv. Unsealed settings use the imported carry and writer.
- The ledger accepts caller-supplied inline/file settings and preserves non-credential fields because it is a generic command wrapper. claude-review instead owns its settings object. The final sealed environment wins in either case.
- The ledger cleanup handler uses its existing process-exit path, with signal-to-exit handlers and the imported Windows watcher. It does not copy claude-review's private cleanup function.

## Not done / outside scope

- No push and no CI read. AGENTS assigns CI and full-suite ownership to the seat. No local full suite ran.
- No GitHub API call, real credential lookup, live model or subagent launch. The named install check ran its offline pi fixture.
- No session archive change. No other known bug was fixed.
- Extra compatibility checks found one pre-existing failure: `context-anatomy.test.mjs`, R-3211's exact env expectation omits the existing credential controls. Both current code and a temporary archive of baseline HEAD produce 10 PASS and the same 1 FAIL. See `build-2-compat.txt` and `build-2-baseline.txt`. That file is outside the allowed edits; the seat must route its stale expectation separately.
- The other six extra files pass: claude-review, readme-check and four review-ledger files. The combined extra run reports 202 passing checks, 1 failing check and 1 skip, exit 1.
- An initial extra-check tool call exceeded its 300-second outer limit before evidence was saved. The repeated bounded run completed and is recorded. An initial baseline extraction failed before tests; the corrected temporary extraction and baseline run are recorded.

Technical paths, row IDs and command names in this report are required reproducibility fields, not owner-facing prose.
