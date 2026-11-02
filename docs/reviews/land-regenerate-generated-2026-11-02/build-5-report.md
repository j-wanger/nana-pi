VERDICT: DONE

# Build 5 — round 1 documentation repair and current-main merge

## Changes and closures

- M-1 closed: restored `## Memory curation` and `#### Builder and reviewer credentials` verbatim from `origin/main`, in the same positions. Exact block comparisons pass. The README diff against main contains only the lane's two regeneration paragraphs, with no unrelated deletion.
- Corrected item 6 of `build-4-report.md`, including one added line naming the restoration and its reason.
- Appended exactly the brief's one SHOULD line to `docs/known-bugs/FEAT-008.md`. The scaffold generator limitation remains unfixed; no other known bug was changed manually.
- Merged local `origin/main` at `4c2ad4361949abb0724991adb657523a6b12f3a2`. Starting lane tip: `bc147e395658cf12fa8b015bc2cf64b35b806577`.
- Only `docs/requirements-tree.md` conflicted. Took main's versions of both generated files, then ran both generators. Kept all auto-merged known-bug lines, including main's FEAT-006 additions.
- Read the full main README precedent and full FEAT-008 known-bug file. No precedent departure. The specific brief authorizes the one known-bug append despite the general builder restriction.

## Rows, tests and mutations

No authored requirement, code, test or sealed-tunable change. No new test or mutation pair applies to this documentation restoration. No existing test was manually edited. Main supplies R-3716–R-3719 and its R-2579 amendment, together with its existing tagged tests and implementation. The additional brief-check run validates those merged changes.

## Scope and exclusions

Branch: `feat/land-regenerate-generated`. This report belongs to the merge commit; the final response gives its full SHA. All six named seat checks run before committing and again on that final commit. CI covers the full suite under AGENTS.md; no local full suite, machine lock, Windows run, CI read, push, fetch, credential access, model call or seat script execution. No title check was named. Current origin/main means the local tracking ref; no authenticated refresh was attempted. No open questions.

## Commands and exit codes

Inspection: `pwd`, `git status --short`, `git branch --show-current`, scoped AGENTS `find`, review-file `git ls-files`, `git rev-parse origin/main`, `git show origin/main:packages/nana-pack/README.md` (temporary read copy), `git diff --stat HEAD origin/main`, and `git log -1` all exited 0. File reads succeeded.

- `git merge --no-commit --no-ff origin/main`: 1 (expected tree conflict).
- `git restore --source=origin/main --staged --worktree -- docs/code-map.md docs/requirements-tree.md`: 0.
- `npm run map`: 0; 610 modules.
- `node scripts/requirements-tree.mjs --write`: 0; 2525 rows, 43 features, 0 problems.
- `git diff --name-only HEAD`, `git diff origin/main -- packages/nana-pack/README.md`, scoped cached diff, `git diff --numstat HEAD`, `git ls-files -u`: 0; no unresolved entries.
- Scoped `git diff --check`: 0.
- Python exact-block comparison against main: 0; both restored blocks match verbatim.
- Python sequential check harness: 0; each child exit checked individually, full output below.

The explicit-path staging and merge commit use a message file under TMPDIR. Git merge commits also include the already-staged automatic merge paths. The final response reports commit and post-commit verification exits. Report identifiers and command output remain technical evidence, exempt from the owner-prose writing rule.

## Every changed file
- `REQUIREMENTS.md`
- `docs/code-map.md`
- `docs/known-bugs/FEAT-006.md`
- `docs/known-bugs/FEAT-008.md`
- `docs/requirements-tree.md`
- `docs/reviews/land-regenerate-generated-2026-11-02/build-4-report.md`
- `docs/reviews/precedent-line-parse-2026-11-02/adversary-brief.md`
- `docs/reviews/precedent-line-parse-2026-11-02/build-1-blocked.md`
- `docs/reviews/precedent-line-parse-2026-11-02/build-1-green.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/build-2-report.md`
- `docs/reviews/precedent-line-parse-2026-11-02/build-3-checks.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/build-3-map.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/build-3-mutation.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/build-3-red.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/build-3-report.md`
- `docs/reviews/precedent-line-parse-2026-11-02/build-brief-1.md`
- `docs/reviews/precedent-line-parse-2026-11-02/build-brief-2.md`
- `docs/reviews/precedent-line-parse-2026-11-02/build-brief-3.md`
- `docs/reviews/precedent-line-parse-2026-11-02/build-report.md`
- `docs/reviews/precedent-line-parse-2026-11-02/checks.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/consumer-impact.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/corpus.mjs`
- `docs/reviews/precedent-line-parse-2026-11-02/corpus.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/impact.txt`
- `docs/reviews/precedent-line-parse-2026-11-02/plan-attack.md`
- `docs/reviews/precedent-line-parse-2026-11-02/plan.md`
- `docs/reviews/precedent-line-parse-2026-11-02/r1-reviewer-5fd6daaa.md`
- `docs/reviews/precedent-line-parse-2026-11-02/tree-movement.md`
- `docs/reviews/precedent-line-parse-2026-11-02/wrong-code.txt`
- `packages/nana-pack/README.md`
- `packages/nana-pack/lib/brief-config.mjs`
- `packages/nana-pack/lib/brief-precedent.mjs`
- `packages/nana-pack/prompts/planner.md`
- `packages/nana-pack/tests/brief-check.test.mjs`
- `docs/reviews/land-regenerate-generated-2026-11-02/build-5-report.md`

## Post-commit correction

The first merge commit's post-commit checks passed five commands, but identity-scan exited 1: two machine-home spellings in captured warning output. Replaced those prefixes with `~` in this report only, following build 4's log convention. The follow-up commit carries this correction. No product content changed. Long output below omits machine identity through that normalization. Staging, commit, final README diff capture, status and rev-parse commands exited 0. The writing check exited 0; technical-record findings remain exempt as noted above.

## Check output

### `node packages/nana-pack/tests/land-regenerate.test.mjs` — exit 0

```text
PASS M1: generated-only conflicts land actual generator bytes and preserve the merged sources
PASS M2: non-contract and rename conflicts refuse while contract modify-delete regenerates
PASS M3: failed timed-out and post-write checks refuse and remove only owned temporary state
PASS M4: scope guard catches tracked index-only untracked ignored and configured escapes
PASS M5: sealed Node argv ignores npm scripts and replaces decoys across line transports
PASS M6: generator contract argv timeout and refusal vocabulary are sealed
```

### `node packages/nana-pack/tests/land-clean-merge.test.mjs` — exit 0

```text
PASS M1: clean moved-main merge lands using only accepted-tip CI and review
PASS M2: clean merge content matches literals and an independent ordinary merge
PASS M3: unsupported attributes and malformed or failing merge-tree refuse unchanged
PASS M10: rename destination merge driver refuses before merge-tree unchanged
PASS M11: generated paths changed in separate hunks refuse unchanged
PASS M12: descendant main already containing the accepted tip refuses unchanged
PASS M4: conflict names paths and the merge-review-CI remedy before any CI read
PASS M5: merge eligibility requires applicable CI, suite proof and unchanged proof paths on both sides
PASS M6: uncovered lane commits including a lane-authored merge remain refused
PASS M8: accepted policy limit lands a textually clean but semantically broken merge
PASS M9: shared guidance, rendered region, README and ruling agree on the exemption
PASS seal: clean-merge vocabulary and conflict-name cap are declared once
```

### `node packages/nana-pack/tests/brief-check.test.mjs` — exit 0

```text
PASS R-2585: brief-check prints what pi-worker would print for the same brief and starts nothing 
PASS R-2670: brief-check and pi-worker give the same line for every brief while a CPU sampler slower than the child limit is first on PATH, and the sampler never runs 
PASS seal: R-2585's children have a 30-second limit and the worker polls less often than that 
PASS R-2621: brief-check names the brief path it tried and the base a relative brief resolves from 
PASS R-3718: literal legacy subjects keep their values and membership outcomes 
PASS R-3716: prose-first code spans launch with one checked entry 
PASS R-3717: refusals quote the original bullet and rule identically without starting pi 
PASS R-3719: planner and README state selection and seal the quote cap
```

### `npm run -s readme:check` — exit 0

```text
readme: 1088 claims checked; 0 problem(s)
```

### `npm run -s map:check` — exit 0

```text
code map: 610 modules over scripts, apps/desk, apps/bench, apps/hive, packages/nana-pack/lib, packages/nana-pack/bin, packages/nana-pack/extensions, packages/nana-knowledge/lib, packages/nana-knowledge/bin, packages/nana-knowledge/extensions, packages/nana-stage/lib, packages/nana-stage/extensions, packages/nana-setup/lib, packages/nana-setup/bin, packages/nana-setup/claude/hooks, packages/nana-pack/tests, packages/nana-knowledge/tests, packages/nana-stage/tests, packages/nana-setup/tests, apps/desk/test, apps/bench/test; 0 without a usable contract header; 3 exempt; 0 problem(s)
```

### `node scripts/known-bugs.mjs --root .` — exit 0

```text
FEAT-013.md: size: bytes=53008 lines=214
summary names=0 sizes=1
(node:26209) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file://~/nana-pi-wt/land-regenerate-generated/templates/typescript/template/tests/requirements-trace.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to ~/nana-pi-wt/land-regenerate-generated/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
```

### `node scripts/identity-scan.mjs --root .` — exit 0

```text
summary files=6859 findings=0 totals=5,0,0,4
```
