# Build brief — ci-suite-timeout

Feature: FEAT-019 · Release usable templates and report support.
- Builder: a Claude Sonnet subagent (simple lane).
- Worktree `~/nana-pi-wt/ci-suite-timeout` on `feat/ci-suite-timeout`, from main 1c539a0e or newer.
- Rows R-2060 and R-2061 only, text verbatim from must-meet.md.
- Follow `packages/nana-pack/prompts/builder-preamble.md`. Run single test files only.
- Never edit HANDOFF.md, docs/sessions/ or README.md.

## Change
1. `.github/workflows/ci.yml`, suite job only. Between `    runs-on: ${{ matrix.os }}` and `    continue-on-error:`, add the five-line comment from must-meet.md verbatim, then `    timeout-minutes: 90`. The install-check job keeps its 20; the release job gets no limit.
2. `REQUIREMENTS.md`, FEAT-019. Add R-2060 and R-2061 directly after R-1531. Flip each row to implemented, citing its test, once that test passes. Then run `npm run req:tree`.
3. Add no new module and leave the test file's header as it is.

## Tests (`packages/nana-pack/tests/ci-workflow.test.mjs`, appended just before `if (failures)`)
- First add `// contract: GitHub Actions' default for jobs.<job_id>.timeout-minutes when a job sets none.` and, below it, `const GITHUB_DEFAULT_JOB_TIMEOUT_MINUTES = 360;`
- Put `// req: R-2060` directly above `check("R-2060: the suite job sets one job-level time limit below GitHub's six-hour default for every leg", () => {`.
  - Slice the suite job with the file's `/^  suite:\n([\s\S]*?)(?=^  release:)/m`.
  - Exactly one line may match `/^ {4}timeout-minutes:/`.
  - That line must match `/^ {4}timeout-minutes: (\d+)$/`, with 0 < value < GITHUB_DEFAULT_JOB_TIMEOUT_MINUTES.
  - No literal 90 appears in this check.
- Put `// req: R-2061` directly above `check("R-2061: the suite job's time limit is sealed at 90 minutes with a chosen comment directly above it", () => {`.
  - The first job-level limit line must equal `    timeout-minutes: 90`. This is the only literal 90 in the file.
  - One of the contiguous `/^ {4}#/` lines directly above it must match `/\bchosen\b/`.

## Wrong code
Write each variant to a folder from `mktemp -d`. Run the test file with CI_WORKFLOW_PATH set to the variant. Never leave wrong code in the worktree.
- W1 no limit → both checks.
- W2 `360` → both.
- W3 `${{ matrix.os == 'windows-latest' && 90 || 30 }}` → both.
- W4 the limit only on the Windows test step, after its `if:` line → both.
- W5 the limit only on the release job → both.
- W6 `60` → R-2061.
- W7 the comment says "picked" → R-2061.
- W8 a blank line between the comment and the limit → R-2061.
- W9 two job-level limit lines → R-2060.

Each variant must leave the 13 existing checks green.

## Done
- ci-workflow.test.mjs shows 15 PASS. Each of W1 to W9 was seen red on its named check.
- These pass under packages/nana-pack/tests: `requirement-rows.test.mjs`, `requirements-tree.test.mjs`, `requirements-trace.test.mjs`, `line-endings.test.mjs`.
- These exit 0: `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `npm run map:check`.
- Seat check after the build: CI shows 0 failing on all three legs. Record the Windows suite job's wall time.

## Report (10 lines or fewer)
VERDICT line; commits; both titles with PASS; W1 to W9, each with the check that went red; the exit codes of trace, tree and map; any existing test edited (expected: none); files changed (expected: ci.yml, ci-workflow.test.mjs, REQUIREMENTS.md, docs/requirements-tree.md).
