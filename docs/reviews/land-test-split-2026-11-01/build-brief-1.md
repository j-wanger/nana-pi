Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane land-test-split. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

Build to the plan of record, `docs/reviews/land-test-split-2026-11-01/plan.md` (revision 2), which has taken the adversary's attack in `plan-attack.md`. Build rows R-3490 and R-3491 and must-meet M1 to M5 exactly as its Must-meet section says. Requirements first: rows, then the moves, then the evidence.

Why this lane exists: `packages/nana-pack/tests/land.test.mjs` takes about 294 s alone on this laptop (`timings-before-win32.txt`) and times out at the runner's 300 s per-file limit in a full run. The plan cuts it into four files of about 90 s or less alone.

Constraints:
- Move checks; do not rewrite them. Each moved check block stays byte-identical. The only allowed difference is ` R-3490 R-3491` appended to the existing `// req:` line of the first check in each of the four files (plan O3). Do not reformat, re-indent, reorder within a block, or touch an assertion.
- Do not edit `packages/nana-pack/lib/test-runner-config.mjs` (that would make the lane `gate`) or `packages/nana-pack/tests/land-fixtures.mjs`. Shared test-local helpers go in the new `packages/nana-pack/tests/land-checks.mjs`, with the six-tag module header (plan O2).
- Keep each file's own `check` and `failures`, and end each file with the same exit line `land.test.mjs` uses today.
- Move the code-map exemption for `land.test.mjs` to `land-ci-edge.test.mjs`; do not copy it.
- No committed text names a person or a machine path.

## Show your work

Save each of these in `docs/reviews/land-test-split-2026-11-01/`:
- Before moving anything, `names-before-win32.txt`: run `node scripts/test.mjs packages/nana-pack/tests/land.test.mjs --verbose` and extract the names as M2 defines them, sorted, written as UTF-8 by a node script. Never use PowerShell redirection for the list. Commit the extraction script as `names.mjs` in the lane folder so the seat can run it on macOS.
- After the split, `names-after-win32.txt`, by the same method over the four files. Diff the two lists as multisets and record the result.
- `m3-blocks.txt`: the M3 comparison output, from a lane-folder script `m3-blocks.mjs` that reads `land.test.mjs` at the base commit (`git show ac20e30a:packages/nana-pack/tests/land.test.mjs`) and the four files plus `land-checks.mjs` at the working tree.
- `alone-runs-win32.txt`: M4's four alone runs, each through `node scripts/test.mjs <file>`, with counts and times.
- `suite-run-win32.txt`: the locked full suite, run as a plain foreground command, `npm run test:locked` with no filter, with its output on screen. Record the land files' times.

## Done when

- M1 to M5 hold. R-3490 and R-3491 are `implemented`, with backticked `file::title` evidence naming the tagged checks.
- Every `REQUIREMENTS.md` evidence cell citing a moved check names its new file.
- The FEAT-031 line 130 known bug is removed only if every land file reports at most 180 s in your full run; otherwise leave it and report the times.
- The locked full suite passes on this machine except these known failures: `post-edit-utf8` (no Python) and `template-acceptance` (no uv). If another file fails only on a time limit, re-run it alone and report both results.
- These are green:
  - `npm run map` then `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check` (regenerate with `--write` first);
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .`.
- `node scripts/lane-class.mjs --root . --files <every changed file>` prints `ordinary`.
- Commit explicit paths on `feat/land-test-split`. Do not push; the seat pushes.

Report: each new file with its check count and alone time; the boundary moves, if any; every row and evidence cell changed; the M2 multiset result; the M3 result; the suite summary line; each departure from the Precedent.

## Precedent

- `packages/nana-pack/tests/review-ledger.test.mjs`, with `review-ledger-launch.test.mjs`, `review-ledger-verdicts.test.mjs` and `review-ledger-state.test.mjs`: the windows-local-suite split this lane follows.
- `packages/nana-pack/tests/review-ledger-fixture.mjs`: the shared module that split moved helpers into; `land-checks.mjs` plays the same part.
- `packages/nana-pack/tests/land-records.test.mjs`: the file shape each new land file copies (own `check`, own `failures`, imports from `land-fixtures.mjs`).
- `packages/nana-pack/tests/land-fixtures.mjs`: imported unchanged.
- `docs/reviews/windows-local-suite-2026-11-01/names-before-win32.txt`: the name-list format.
- `code-map.config.json`: the exemption entry for `land.test.mjs`, moved.
