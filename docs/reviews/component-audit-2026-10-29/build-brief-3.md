Feature: FEAT-039 · See the product and its decisions in one report

Lane component-audit. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on the reviewed tip af4c897d.

The plan of record is still `docs/reviews/component-audit-2026-10-29/plan.md`. The final reviewer said LAND (`r1-reviewer-f0c57c6e.md`), but CI then failed on all three systems.

## 1. The audit needs a local main branch (R-3104)

CI checks out the pull request without a local `main`. `packages/nana-pack/tests/component-audit.test.mjs` then fails: "R-3103: derived feature values come from ledger and hand source cannot prefill them AssertionError [ERR_ASSERTION]: fatal: ambiguous argument 'main': unknown revision or path not in the working tree." `scripts/component-audit.mjs` reads `refs/heads/main` (around lines 126 to 144). R-3104 says activity is counted from git at HEAD. Count activity from HEAD's first-parent history, with no dependency on a local `main` branch; when a comparison base for unmerged feature refs is needed and no local `main` exists, skip that part and say so in one report-only line instead of failing. Pin it: a test that runs the audit in a fixture repo with no `main` branch passes and reports activity. Every test in the file must pass in a checkout with no local `main` (CI is that case).

## 2. The suite must catch status-rule drift (R-3100, R-3108)

The reviewer's SHOULD: the R-3100 test on the tracked tree filters out every problem containing "planned or violated feature row" (around line 41), and nothing runs `--check` in the suite, so a status can go wrong while the suite stays green. Delete that filter, so the tracked audit must pass with no problems at all, and make the R-3108 test assert that the tracked audit passes its status rules.

Numbers that must not move: the frozen contract and fixture sha256 values; rows R-3100 to R-3110 and their meaning; the `--asks` output.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green. Push the tip to the open pull request 265 and report CI's result on all three systems.

Report: the new or changed test titles; the wrong-code pair for each fix; each departure from the Precedent; every existing test you changed.

## Precedent

- `scripts/component-audit.mjs`: build 2's activity and status code.
- `packages/nana-pack/tests/component-audit.test.mjs`: build 2's tests and fixture repos.
