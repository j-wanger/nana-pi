# ledger-lock-win — technical record

## Change and rows

- `packages/nana-pack/bin/review-round.mjs`: export the existing `withLock` with optional open, clock and sleep seams; retry the shared Windows contention codes until `LOCK_WAIT_MS` expires. Preserve the last code and cause in the timeout. Leave existing callers on defaults.
- `packages/nana-pack/tests/review-ledger-lock.test.mjs`: exactly M1–M3, tagged R-3925–R-3927. Each case is awaited with a per-case limit. Fixtures use `tmpDir` under the OS temporary folder. Injected attempts also bound broken synchronous loops.
- `REQUIREMENTS.md`: add R-3925–R-3927 in FEAT-008, with no additional shares. Amend existing R-1842 in FEAT-007 because EACCES/EPERM must now wait rather than refuse immediately.
- `packages/nana-pack/tests/review-ledger-state.test.mjs`: the only existing test edit changes the unwritable-folder title and timing assertion from immediate refusal to refusal after waiting. It retains the writable-folder diagnostic, no-stack and no-review assertions. Update its skip label too.
- Regenerate `docs/code-map.md` and `docs/requirements-tree.md`.

## Precedent and callers

Read `packages/nana-pack/lib/rename-retry.mjs` in full. Import its exported `RENAME_RETRY_CODES`; no copied policy and no new tunable. Keep `LOCK_WAIT_MS` unchanged. The lock uses its existing elapsed-time bound, not rename's attempt bound, as required by the brief. No precedent departure.

Repository caller search found withLock calls only in review-round: `withReviewLedgerLock`, `admit`, `project`, and `complete`. Their signatures and defaults remain compatible; none needs an edit. The new test is its only new direct caller.

## Mutation pairs

- Original EEXIST-only retry, with injection seams only: M1 and M2 fail, M3 passes; command exit 1. See `wrong-original.log`.
- Wrong retry-all-codes implementation: M1 and M2 pass, M3 fails on the first unexpected sleep; command exit 1. See `wrong-retry-all.log`.
- Correct shared-code filter: all three pass, exit 0. See `focused-green.log` and the runner evidence.

## Commands and exits before commit

- `npm run map:impact -- packages/nana-pack/bin/review-round.mjs`: 0.
- `node scripts/test.mjs test-runner`: initial 1 because the source checker requires the tmpDir import's exact double-quoted spelling; corrected import, rerun 0. No existing checker changed.
- `node scripts/test.mjs review-ledger review-round`: initial 1 for the now-false immediate unwritable-folder expectation; update R-1842/test and preserve the timeout code, rerun 0 (189 checks).
- `npm run map`: 0.
- `node scripts/requirements-tree.mjs --write`: 0.
- Requested `npm test -- --pack=land --jobs=4`: first invocation interrupted by the outer command's 200-second limit; no completed exit code. This checkout ignores the unknown pack option and therefore collects the full suite.
- Run the exact requested npm command inside the machine-wide lock using `NANA_SUITE_TEST_COMMAND='["npm","test","--","--pack=land","--jobs=4"]' npm run test:locked`: 0.
- Full suite: 245 files: 244 PASS, 0 FAIL, 1 SKIP, 0 WARN; checks: 7241 pass, 0 fail, 45 skip. See `land-tests.log`.
- `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0; existing template module-type warning only. Paths in `trace.log` are normalized to repository-relative form.
- `git diff --check`: 0.

The final report names the committed tip and repeats the required seat checks on it. Full output above is retained here rather than pasted into the report.

## Removal search and known bugs

Search tests for the replaced unwritable-folder title: no remaining current test declarations. An archived Windows CI log retains the old title; leave historical evidence unchanged. No path or filename removed or renamed.

Read all of `docs/known-bugs/FEAT-008.md`. This fix touches none of its listed bugs, including the distinct land-record append lock and CI-record prune errors. No known-bug file or HANDOFF edit.

## Not done

No push, GitHub issue operation, CI access, reviewer/model launch, or credential access. Native Windows execution remains for the seat/CI; the injected Windows error tests ran locally. No open questions about the implementation.
