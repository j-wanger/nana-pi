# win-leg-flip — build brief 1

Feature: FEAT-019 · Release usable templates and report support. Class: ordinary.
Rows: R-1530 and R-1531 are new (block R-1530 to R-1539). R-684 is reworded and R-1032 retired. Read must-meet.md first.

## Change, in order
1. REQUIREMENTS.md, in the FEAT-019 table:
   - Add R-1530 and R-1531 with the must-meet text, as `planned`.
   - In R-684, change "Linux and Windows in hosted CI with non-blocking suite legs" to "Linux and Windows in hosted CI, where the Windows suite leg blocks release and the Linux suite leg does not". Append the evidence note "reworded 2026-10-19 (win-leg-flip): the Windows suite leg blocks release (R-1530)".
   - Set R-1032 to `retired`, with evidence "retired 2026-10-19: the Windows suite leg blocks release (ruled 2026-10-17); R-1530 replaces it".
   - Run `npm run req:tree`.
2. Tests, written first. Run each against today's ci.yml and docs: the R-1530 check and the R-684 check must FAIL.
   - ci-workflow.test.mjs: add the two checks, each with a `// req:` marker directly above it. Delete the R-1032 check and its marker. From the R-597 check, delete only the continue-on-error assertion.
   - Reader: collect every `continue-on-error:` line in the suite job.
     - More than one line fails. So does a line that is not at the four-space job level, which covers a step key, including `- continue-on-error:`.
     - Evaluate the job-level value for each matrix OS. Absent means false. It also accepts `true`, `false`, or one `${{ matrix.os ==|!= '<os>' }}`. Any other form fails and names the expression.
   - R-1530 also asserts three things: macOS and Windows are in the suite matrix; the release `needs:` list holds `suite`; and the release job text before `steps:` calls none of always(), failure() or cancelled().
   - templates-render.test.mjs, in `canonicalSupport`: replace "Linux and Windows run in hosted CI, where their suite legs are non-blocking;" with "Linux and Windows run in hosted CI, where the Windows suite leg blocks release and the Linux suite leg does not;". The whole file runs copier renders, so it takes minutes.
   - requirements-tree.test.mjs: the test prints no count. Add two to main's leaf total, in the title and in both literals. On ab5c3e8 that moves 1,257 to 1,259. A retired row stays a leaf.
3. Code and docs.
   - ci.yml suite job: `continue-on-error: ${{ matrix.os == 'ubuntu-latest' }}`.
   - Put the same Support clause in AGENTS.md, README.md and packages/nana-setup/README.md.
   - README.md lines 25 and 182: "Linux and Windows suite legs are non-blocking, while the Windows install check blocks release" becomes "the Linux suite leg is non-blocking, while the Windows suite leg and the Windows install check block release".
   - README.md line 215: "after the blocking macOS suite leg passes on main; Linux and Windows suite legs are non-blocking" becomes "after the blocking macOS and Windows suite legs pass on main; the Linux suite leg is non-blocking".
   - packages/nana-setup/tests/hooks-win32-exec.test.mjs line 11 comment: "the non-blocking Windows CI leg" becomes "the Windows CI leg, which blocks release".
4. Flip R-1530 and R-1531 to `implemented`, with file::title evidence. Run `npm run req:tree` again.

## Wrong code to try
Use CI_WORKFLOW_PATH on copies under a mktemp folder, never the repo's ci.yml. Each change must turn the named check red:
- keep `!= 'macos-latest'`: R-1530
- `true`: R-1530
- delete the line: R-1531
- `continue-on-error: true` on the Windows npm test step: R-1530
- release `if: always() && …`: R-1530
- release `if: ${{ !cancelled() }} && …`: R-1530
- `needs: [install-check]`: R-1530
- drop windows-latest from the suite matrix: R-1530
- `${{ matrix.os != 'macos-latest' && matrix.os != 'windows-latest' }}`: R-1530

## Notes
- .gitattributes keeps ci.yml LF on every checkout (R-1320). So trim values, with no CRLF cases.
- No new module, no header change and no tunable. The OS names are contract values the rows name.
- Do not touch the product report, or the README's Linux symlink-escape sentence.
- Run single test files only. The seat runs the locked full suite.

## Done
- The ci-workflow, templates-render, requirements-tree and requirements-trace test files pass.
- `npm run map:check` and `npm run readme:check` pass.
- `git grep -n -i non-blocking` finds no claim that the Windows suite leg is non-blocking, outside dated history.

## Report (10 lines or fewer)
VERDICT line; commits; rows changed; each single-file command with its exit code and PASS/FAIL count; each wrong-code try and the check it turned red; any existing check edited beyond those named here.