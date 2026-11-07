VERDICT: DONE

# Round-one fixes — leak-guard

Branch: `feat/leak-guard`. The final response gives the full committed tip and checks run on it.

## Closures

1. **Given and real machine roots on every platform.**
   - Files: `packages/nana-pack/lib/leak-scan.mjs`, `packages/nana-pack/tests/leak-scan.test.mjs`, `REQUIREMENTS.md`, `packages/nana-pack/README.md`.
   - Row: R-3751; no new IDs or sealed tunables.
   - The matcher retains the supplied spelling and resolves its real spelling on every platform. Default temp input remains `tmpdir()`.
   - New test: `M4: every platform matches given and real machine roots once`. It checks home and temp, both alias directions, all three platform modes, CRLF with trailing space/tab, no final newline, and the default temp input.
   - Mutation pair: restrict alias expansion to win32 → exit 1, new M4 fails with 0 rather than 1 hit (`r1-fixes-mutation-roots.txt`); restore expansion → exit 0, new M4 passes (`r1-fixes-green.txt`, `r1-fixes-touched.txt`).
2. **Leaks removed by later commits remain blocked.**
   - Files: `packages/nana-pack/lib/leak-scan.mjs`, `packages/nana-pack/tests/leak-scan.test.mjs`, `REQUIREMENTS.md`, `packages/nana-pack/README.md`.
   - Row: R-3750. The scanner visits every range commit, reads its changed blobs, and includes the short commit hash in each hit/skip and diagnostic path label.
   - New test: `M3: history retains removed leaks from the merge-base`. Commit one leaks; commit two cleans one file and deletes another. Both earlier blobs remain flagged with commit one's short hash.
   - Mutation pair: replace the commit walk with `[to]` → exit 1, new M3 fails with no hits (`r1-fixes-mutation-history.txt`); restore the walk → exit 0, new M3 passes (`r1-fixes-green.txt`, `r1-fixes-touched.txt`).
3. **Divergent base refs use the merge-base.**
   - Files: `packages/nana-pack/lib/leak-scan.mjs`, `packages/nana-pack/bin/leak-scan.mjs`, `packages/nana-pack/tests/leak-scan.test.mjs`, `packages/nana-pack/README.md`.
   - Row: R-3750. Usage now says the scan starts at the base/tip merge-base.
   - The same new M3 test advances main independently and leaves an older public leak untouched on the lane. The scan excludes that file and checks the usage explanation.

The two new tests first ran against the original implementation: exit 1, both failed (`r1-fixes-wrong.txt`).

## Existing tests changed

Only `packages/nana-pack/tests/leak-scan.test.mjs` changed.

- M2, original M3, and both original M4 cases: expected hit objects now include the short commit hash.
- M6: expected CLI hit and skip lines include the short commit hash.
- M7: expected worker diagnostic includes the short commit hash; the injected git failure targets `diff-tree` instead of the replaced `diff` call.
- No assertions were inverted, tests deleted, or other existing test cases edited.
- New tests retain the precedent's awaited, per-case-limited harness and OS-temp fixtures. Worker tests launch only fake builders.

## Verification commands and exits

- `node scripts/code-map.mjs --impact packages/nana-pack/lib/leak-scan.mjs packages/nana-pack/bin/leak-scan.mjs` — 0; inspected callers before edits.
- `node packages/nana-pack/tests/leak-scan.test.mjs` — original wrong code 1; alias mutation 1; history mutation 1; restored code 0, 12 PASS.
- `node scripts/test.mjs leak-scan.test.mjs build-records.test.mjs build-report.test.mjs worker-lane.test.mjs requirements-trace.test.mjs` — 0; 5 files PASS; 153 checks pass, 0 fail, 0 skip.
- `node scripts/code-map.mjs --write` — 0; refreshed `docs/code-map.md`.
- `node scripts/code-map.mjs --check` — 0; 622 modules, 0 problems.
- `node scripts/readme-check.mjs` — 0; 1095 claims checked, 0 problems.
- `node scripts/requirements-tree.mjs --root .` — 0; 2565 rows, 43 features, 0 problems.
- `node scripts/lane-class.mjs --root . --files REQUIREMENTS.md,packages/nana-pack/lib/leak-scan.mjs,packages/nana-pack/bin/leak-scan.mjs,packages/nana-pack/tests/leak-scan.test.mjs,packages/nana-pack/README.md` — 0; ordinary.
- `node --check packages/nana-pack/lib/leak-scan.mjs`, `node --check packages/nana-pack/bin/leak-scan.mjs`, `node --check packages/nana-pack/tests/leak-scan.test.mjs` — each 0.
- `git diff --check` — 0.

Long outputs are the sibling `r1-fixes-*.txt` evidence files. Committed evidence contains only repository-relative paths or redacted machine paths.

## Precedent, callers, and remaining work

Both named Precedent files were read before design. No departures: reuse the existing matcher, identity counter, real-path resolver, diagnostics, fixture helpers and bounded harness.

Caller audit: the CLI and pi-worker forward scanner results through the shared diagnostic renderer. Neither requires a separate result adapter. The CLI usage and test callers were updated; pi-worker needs no code change. Build-report ignores leak metadata, as before.

No listed FEAT-041 known bug was changed. Only the brief's three review findings were fixed. No open questions.

The final response retains technical identifiers required by the builder-report contract; those are outside the owner-prose writing rule.

The repository delegates its full suite to CI in `AGENTS.md`. No local full suite, native Windows run, push, CI read, GitHub action, model session, or subagent launch occurred. The seat still needs native Windows CI and independent review before landing.
