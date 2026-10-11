VERDICT: DONE

- Commit: `958aa2e` — Run suite on Windows in hosted CI.
- [x] A. Workflow: Windows matrix leg, bash default, non-blocking Linux/Windows; release job unchanged.
- [x] B. R-684, R-1031, R-1032; workflow/support tests updated. Broad-parity detector passes.
- [x] C. Canonical support line added to all three front doors; README release wording updated.
- Files: `.github/workflows/ci.yml`, `REQUIREMENTS.md`, `docs/requirements-tree.md`, `README.md`, `AGENTS.md`, `packages/nana-setup/README.md`, and three nana-pack tests.
- Mutation pairs: drop bash default → red (1), restored → green (0); drop Windows matrix entry → red (1); make Windows blocking → red (1); restore old support wording → red (1), restored → green (0).
- Commands: `npm run req:tree` (0); `npm run map:check` (0); `npm run readme:check` (0); `npm run test:locked` (0).
- Suite: **133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6708 pass, 0 fail, 5 skip**.
- Worktree is clean. Not done: push, draft PR, hosted Windows run, or HANDOFF/session updates.
- Most likely wrong: Windows CI reaches `npm test`; this lane has not run on hosted Windows.
