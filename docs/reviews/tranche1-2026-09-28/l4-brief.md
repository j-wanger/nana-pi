# Worker brief — L4: canonical test path for nana-pi (Opus 5.5)

You are a headless worker in an isolated git worktree at `~/nana-pi-wt/l4` (branch `lane/l4-test-path`). Work ONLY there. Today is 2026-09-28.

## Outcome (what must be true when you finish)
1. From the worktree root, `npm test` runs every `packages/*/tests/*.test.mjs` plus `apps/desk/test/*.test.mjs` (unit only), prints one PASS/FAIL/SKIP line per file and a total, and exits non-zero if any file fails.
2. `nana-setup doctor` prints detail text that matches its ✓/✗ (today a healthy regular `rules/nana-personal.md` prints ✓ with "not a regular file — replace"; an absent file prints ✗ with an unhelpful detail — `packages/nana-setup/lib/doctor.mjs:51-58`).

## Invariants and tests
- New `scripts/test.mjs` (the runner), cross-platform: no shell globs (walk the dirs with `fs`); spawn `process.execPath --experimental-strip-types <file>` serially; give EACH file a fresh temp `HOME` AND `USERPROFILE`; exclude `*.e2e.mjs` and anything under `apps/bench/studies/**/fixture/**`; report a file that fails or is unrunnable on this platform as FAIL or a declared SKIP, never hide it (note `post-edit-hardening.test.mjs` shells `pgrep`).
- Runner self-test: behind a flag or env (not in the default set), a deliberately failing fixture makes `npm test` exit non-zero.
- New `packages/nana-setup/tests/doctor-detail.test.mjs`: four layouts for `rules/nana-personal.md` — regular file → ✓ and the detail does NOT contain "not a regular file"; symlink → ✗ with the EXACT existing string `private rule is a symlink — replace with a regular file` (pinned by `install.test.mjs:198`); directory → ✗ "not a regular file"; absent → ✗ with an actionable detail. This test must fail on today's `doctor.mjs` before your fix and pass after — show both runs in your report.
- Root `package.json`: add `scripts.test` only. Do NOT add `prepare`/`postinstall` (pi's `git:` installer may run it). Do not touch the `pi` field.

## Allowlist (edit nothing else)
`package.json` (root, `scripts.test` only) · `scripts/test.mjs` (new) · `packages/nana-setup/lib/doctor.mjs` (detail strings only) · `packages/nana-setup/tests/doctor-detail.test.mjs` (new) · `README.md` (one short "Tests" paragraph at the root README only).
Must NOT touch: any existing test's assertions; any extension; `apps/desk/**`; `apps/bench/**`.

## Rules
- Never end your turn while a command you started is still running. Run every command in the foreground and read its output. There is no next turn.
- Do not run any `*.e2e.mjs` or desk browser suite (fixed ports; a live desk is running on this machine).
- Kill only processes you started.
- Commit on the lane branch in the worktree with clear messages. Do not push. Do not touch `~/nana-pi` (the main checkout) or any other repo.
- If a file flips from PASS to FAIL under the isolated HOME, that file was machine-dependent: LIST it in the report with the failing assertion; do not paper over it and do not edit its assertions. `pi-registration.test.mjs` may legitimately turn its tilde case into a printed SKIP.
- Baseline first: before any change, run each test file the way sol did (`node --experimental-strip-types <file>` from the package dir) and record the counts, so your report can show baseline vs after.

## Report (final message, ≤40 lines)
- Files changed (paths) and commit hashes.
- `npm test` output summary: file counts by PASS/FAIL/SKIP, total checks, exit code; the self-test run.
- Doctor test: before (fails on regular-file case) and after.
- Any machine-dependent file found.
- The one claim you'd most expect to be wrong.
End with `VERDICT: DONE`.
