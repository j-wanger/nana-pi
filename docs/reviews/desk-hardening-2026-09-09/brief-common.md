# Common rules for all three nana-pi desk lanes (2026-09-09)

Repo: a git WORKTREE of ~/nana-pi (branch named in your lane brief). Work ONLY in your worktree. `node_modules` is symlinked from the main checkout; set `PW_ROOT=/Users/jwang/nana-pi` for the Playwright e2e tests. Do not touch ~/nana-pi itself, do not push, do not restart the launchd desk (`com.nana.pi-desk`, port 7317 — Jake's live desk; leave it alone).

Context you must read before writing code:
- `apps/desk/README.md` — "What it does", "Contract notes", "Known limits" (your item is listed there; your land REPLACES that limit text with the new contract).
- `docs/review-punchlist-2026-09-08.md` — find your STILL OPEN item; you will rewrite it as FIXED with the commit hash and what remains, in the file's existing style.
- `docs/agent-frontend-design-2026-09-04.md` §3 (stage provenance) only if your lane touches it.
- The existing tests in `apps/desk/test/` — copy their patterns: real server on an ephemeral port, real registered handlers, fake pi child where one is used today (see `crash-paths.test.mjs`, `spawn-and-persist.test.mjs`, `teardown-invariants.test.mjs`; browser-level in `*.e2e.mjs`).

Standards (non-negotiable):
1. **Confirm before fixing.** Each lead in your brief is a reviewer's claim. Read the code path line by line and either confirm it (state file:line and the exact interleaving) or mark it NOT-A-BUG with the evidence. Do not "fix" what you could not confirm; report it instead.
2. **Failure-first tests through the real chokepoint.** For each confirmed defect: write the test that FAILS on the current code (run it, keep the failing output in your report), then fix, then it passes. No tests that only exercise a helper in isolation when the real path is the server/page.
3. **Surgical.** Every changed line traces to your item. No drive-by cleanups, no reformatting, no renames of things you did not need to touch.
4. **Keep the suite green.** Run every `apps/desk/test/*.test.mjs` with `node <file>` (exit 0 = pass) and the e2e files with `PW_ROOT=/Users/jwang/nana-pi node <file>`. Baseline at `034be76` (seat-run 2026-09-09 07:40): ALL desk `.test.mjs` (8 files) AND all `.e2e.mjs` (10 files) exit 0, plus nana-stage `blocks.test.mjs` and every nana-pack test. Any red after your change is yours. Report per-file exit codes before and after. If an e2e fails at baseline too, say so; do not claim you fixed it.
5. **Declare the contract.** Any behaviour a client, extension or user can observe (new caps, new error codes, new files on disk, new event types) is written into `apps/desk/README.md` (Contract notes / Known limits) in plain language, same register as the existing text. Nothing silent.
6. **Commit on your branch** with a message in the repo's style (`desk: <what> — <why>`; body lists the confirmed defects, the tests, and what stays open). One commit per lane unless there is a real reason for two. End the commit message with:
   ```
   Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01ALx9e7RgMZqoe3yxmTfidN
   ```
7. **Final report** (this is what the seat reads; the seat did not watch you work): per lead → CONFIRMED (file:line, mechanism) / NOT-A-BUG (evidence); per fix → what changed + the failing-then-passing test name; suite table (file, exit before, exit after); contract lines added to README; what you left open and why; commit hash. Facts only, no narrative.
