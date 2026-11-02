Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-first-try-2. Class: ordinary. Builder: pi-worker (small lane). Build session 2. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

The plan of record is `docs/reviews/windows-first-try-2-2026-11-02/plan.md` (revision 2). Build 1 is committed on this branch. It built R-3540 and R-3541, both helpers, the golden retry, the R-1713 diagnostics and the FEAT-013 line, and it ran the full suite. Its report was PARTIAL for the items below. This session finishes them and changes nothing else.

## Findings on build 1

1. **M1's evidence is missing.** `m1-state.mjs` and `m1-state-win32.txt` were not produced. Write `m1-state.mjs` in the lane folder. It imports `describeKnowledgeHome` from `packages/nana-setup/tests/knowledge-state.mjs` and builds three real knowledge homes with `nana-knowledge build`, as `wal-probe.mjs` in this folder does. It prints each home's description:
   - (a) a completed build;
   - (b) a build that exits 1 with "database is locked": hold an exclusive lock on `index.db` from the script (a `node:sqlite` connection running `BEGIN EXCLUSIVE`) while the build opens, then release it;
   - (c) a home with a `build.lock` file present.

   Record the command, the build exit codes and the three descriptions in `m1-state-win32.txt`. Use `<temp>` for temp paths. The descriptions must show the difference: in (b) `built_at` is unchanged from before the build. Remove every temp home afterwards.
2. **M2's one-off evidence file is missing.** `m2-retry.mjs` exists, but `m2-retry-win32.txt` does not. Run the script and record its command and output in `m2-retry-win32.txt`.
3. **No retry-cap pin is needed.** `GOLDEN_RETRY_CAP` and `GOLDEN_CASE_LIMIT_MS` are test-local constants with `chosen` provenance, as `STAGGER_CHECK_MS` was in the windows-first-try lane. Do not add a seal test for them.

## Constraints

- Add only the four lane-folder files above. Do not edit any test, helper, product file, `REQUIREMENTS.md` or known-bug file.
- No committed text names a person or a machine path.

## Done when

- The four files exist, and the M1 descriptions show (a), (b) and (c) as distinct states.
- `node scripts/identity-scan.mjs --root .` is green, and `git status` shows no product file.
- Commit the four files by explicit path on `feat/windows-first-try-2`. Do not push.

Report: the three M1 descriptions, the M2 retry output, and each departure from the Precedent.

## Precedent

- `docs/reviews/windows-first-try-2-2026-11-02/wal-probe.mjs`: building a real knowledge home through `nana-knowledge build` and reading `built_at`.
- `packages/nana-setup/tests/knowledge-state.mjs`: the helper under test, from build 1.
- `docs/reviews/windows-first-try-2-2026-11-02/m2-retry.mjs`: the retry script from build 1.
