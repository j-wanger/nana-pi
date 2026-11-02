# Build 1 technical record

## Rows and files

- R-3685 (M1) and R-3686 (M2): implemented in REQUIREMENTS.md with backticked file::title evidence.
- R-3667: implemented seal now pins the merged helper list and U+0001 word placeholder.
- packages/nana-pack/lib/credential-gate-config.mjs: merge four narrow helper patterns into two wide patterns. Spaced helpers retain the precedent's global-option prefix. Both helper patterns use `[\w.-]+` and `\s+(?:\S+\s+)*get(?:\s|$)`.
- packages/nana-pack/extensions/nana-gate.ts: replace each preserved word's whitespace with the imported placeholder before joining words with spaces.
- packages/nana-pack/tests/credential-gate.test.mjs: add only M1 and M2. M1 checks all 12 reads for both roles and tools, including the reason. M2 checks near misses and existing allowed forms for both roles/tools, and all forms with no role.
- Existing-test edits: only M7's literal pattern list and new placeholder assertion. The old list became false under the planned merge. M4 and its blocked/allowed corpora remain unchanged. The module purpose header now includes helper variants.
- docs/code-map.md and docs/requirements-tree.md: regenerated with the named generators.
- docs/known-bugs/FEAT-006.md: read completely; append exactly the brief's long-command line. No other known-bug line changed. The round-3 four-variant finding had no existing line to remove.

## Wrong-code pairs

Command: `node docs/reviews/credential-gate-variants-2026-11-02/wrong-code.mjs` (exit 0).

The script runs the new unchanged tests in an OS-temp copy, never executes a credential command, and restores base code from 7d5f8ea4.

- Base narrow patterns and plain join: test process exit 1. M1 fails every new read: store --file=x; global-option cache; dashed cache; cache --timeout; global-option store --file=x; --no-pager cache --socket; libsecret; dashed store --file=x; Windows dashed cache .exe; Unix dashed libsecret; quoted -C; quoted -c. Each fails for worker/reviewer on bash/PowerShell (48 failing cases). M2 passes on base. M7 also fails because the base lacks the placeholder.
- Obvious wrong widened helper patterns with base plain join: test process exit 1. M1 fails quoted -C and quoted -c (8 cases). M2 fails `--file "get secrets" erase` (4 cases). M7 also fails because the wrong code lacks the placeholder.
- Full failing-case names: wrong-code.txt. The behavioral tests themselves, not only the seal, detect the wrong code.

## Commands and exits

- `npm run map:impact -- packages/nana-pack/lib/credential-gate-config.mjs packages/nana-pack/extensions/nana-gate.ts`: 0.
- `node docs/reviews/credential-gate-variants-2026-11-02/checks.mjs`: 0; 20 test-file commands, all exit 0. Full commands and output: build-1-green.txt.
- Initial test pass attempt: seven files failed because inherited NANA_WORKTREE_ROOT applied the live lane guard to fixture edits. build-1-inherited-guard.txt preserves those exits. Clearing that variable only in test children made all 20 pass; no test or production fix was needed.
- `npm run map`: 0; `node scripts/requirements-tree.mjs --write`: 0.
- `node docs/reviews/credential-gate-variants-2026-11-02/checks.mjs --seat`: 0; all six commands exit 0. map:check, readme:check, requirements-trace, requirements-tree --check, known-bugs --root ., identity-scan --root . after git add. Full output: build-1-seat-checks.txt.
- Trace: 2208 implemented rows traced; tree: 0 problems; identity scan: 0 findings. Known-bugs reports an unrelated size note, exits 0.
- `git diff --check`: 0 before staging. The staged check exits 2 for raw test-log trailing spaces and supplied plan-attack Markdown hard breaks; preserve those records unchanged.
- `node scripts/lane-class.mjs --root . --files <changed production/test/ledger/known-bug paths>`: 0; hook (pi extension).
- Writing-check identifier and sentence findings are retained where this technical builder record requires paths, row IDs, commands and exact case names.

## Precedent and departures

- Reuse CREDENTIAL_PATTERNS, the existing global-option prefix, tokens, commandIndex, base and the test harness. No helper copied or moved.
- No private helper exports under standing authorization. The new placeholder is a named configuration export.
- Mechanical scope departure: the extension's existing config import also names the new placeholder, outside the floor's join lines. This is necessary to consume the sealed value rather than duplicate it.
- Plan revision 2 expressly authorizes the word-preserving join and M7 rewrite; no other implementation departure.
- The original gate read covered its imports and floor before design; the remainder was read before completion.

## Not done

- No full suite: AGENTS.md assigns it to CI.
- No push or CI read: the brief assigns those to the seat.
- No seat mutation ladder: the brief assigns wrong-code pairs after the build to the seat.
- No macOS install check: this build ran on Windows; the seat owns the pre-land macOS check.
- Installed rulings are stale; installation remains unchanged.
