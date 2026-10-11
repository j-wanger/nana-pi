## MUST

1. **`docs/reviews/windows-ci-2026-10-11/CHANGE.md:64-65` — completion does not prove the suite ran.**  
   Evidence: setup failures skip `.github/workflows/ci.yml:31-35`, including `npm test`. The plan would still accept a “completed” failed leg and publish the Windows CI claim.  
   Smallest fix: require the draft run to reach `npm test` and print the runner totals. Fix bootstrap, shell, PATH, or tool-install failures in this lane. Defer only failures produced by the running suite.

2. **`docs/reviews/windows-ci-2026-10-11/CHANGE.md:62-63` — the proposed regression test does not pin the Windows execution path.**  
   Evidence: it promises mutations for the matrix and non-blocking expression only. Removing the Bash default would leave those checks green while `test "$(pi --version)"` fails under PowerShell.  
   Smallest fix: make the new test assert suite-scoped Bash, the Windows matrix entry, the non-blocking expression, required copier mode, ordered tool setup, global pi install, version verification, and `npm test`.

3. **`docs/reviews/windows-ci-2026-10-11/CHANGE.md:30` — the new row joins two independently breakable promises.**  
   Evidence: Windows can remain in the matrix while becoming blocking, or remain non-blocking while disappearing from the matrix. One test citation could then overclaim the combined row.  
   Smallest fix: split this into one row requiring the Windows suite leg and another requiring that its failure not block release.

4. **`packages/nana-pack/tests/templates-render.test.mjs:315-317` — positive phrase checks can preserve the obsolete Windows wording.**  
   Evidence: the current test permits extra text in the single support line. Merely adding “Windows in hosted CI” would not necessarily reject “native Windows pack untested.”  
   Smallest fix: define one exact canonical support line, compare all three front doors to it, and retain the separate broad-parity negative fixture.

## SHOULD

1. **`README.md:25`, `README.md:177`, `README.md:210` — three release descriptions remain ambiguous after this change.**  
   Evidence: they say release follows a “green suite,” although Linux already fails without blocking and Windows will behave likewise.  
   Smallest fix: state that release requires the blocking macOS leg, while Linux and Windows are non-blocking.

2. **`docs/reviews/windows-ci-2026-10-11/CHANGE.md:44-45` — the failure record lacks a durable CI-run reference.**  
   Evidence: test names and first errors cannot establish which revision or hosted run produced them.  
   Smallest fix: record the commit SHA and Actions run URL beside the failure list.

## NOTE

- `.github/workflows/ci.yml:16-35` has the required setup order. GitHub-hosted Windows includes Git Bash, while setup-node, setup-uv, and pnpm setup amend PATH for later steps.
- `.github/workflows/ci.yml:41-60` uses a fresh checkout and consumes no suite outputs. A tolerated Windows failure cannot change release contents.
- `fail-fast: false` ensures a Windows test failure does not cancel macOS.
- The release waits for every matrix leg. Windows can delay release even though an ordinary failure cannot veto it.
- Cancellation, runner loss, registry outages, and GitHub service faults may still prevent the dependency from resolving successfully. Treat these as residual infrastructure cases.
- A draft pull request is a sound pre-merge probe. The pull-request trigger runs draft PRs, while the release condition excludes every PR event.
- The generated template workflows are unrelated. They describe consumer-project CI and do not pin the root matrix.
- `packages/nana-pack/tests/ci-workflow.test.mjs:17-48` is the only test currently pinning the root matrix and release dependency.
- Score: **6.5/10**. The release topology is sound, but the plan can currently claim Windows execution without reaching the suite.

VERDICT: LAND-WITH-FIXES
