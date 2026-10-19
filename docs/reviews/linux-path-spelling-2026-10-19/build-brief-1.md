# Lane linux-path-spelling — build brief 1 (2026-10-19 · feat/linux-path-spelling · on main b8ace0b)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/linux-path-spelling`.** Read `must-meet.md` here first. Tests only: change `packages/nana-pack/tests/path-spelling.test.mjs` and nothing else under `packages/`. Run single test files only, in the foreground; no full suite; no push; no `HANDOFF.md` or `docs/sessions/`.

1. In the GP1 block and the GP2 block, extend the skip guard so each check runs only when the old spelling `Docs` still reaches the renamed folder on disk (case-insensitive volume). On a case-sensitive volume, print `SKIP GP1 (case-divergence): this volume is case-sensitive, so the rename left two different folders` (and the GP2 twin) and run no check. Keep the existing SKIP for the case where git kept disk and index in sync. Keep each `// req:` marker directly above its `check(` call.
2. Prove both branches on this Mac:
   - `node packages/nana-pack/tests/path-spelling.test.mjs` exits 0 with GP1 and GP2 PASS (macOS volumes are case-insensitive).
   - Make a case-sensitive volume to show the skip: `hdiutil create -size 64m -fs "Case-sensitive APFS" -volname cs -type SPARSE <tmp>/cs.sparseimage`, `hdiutil attach` it, and run the test with `TMPDIR` pointing into the mounted volume. Expect both new SKIP lines and exit 0 (check that the test's temp root follows `TMPDIR`; if it does not, say so and show the skip another honest way). Then show the wrong code: remove your new guard, rerun on the case-sensitive volume, and see GP1 and GP2 FAIL with the same messages as the Ubuntu log (`expected exit 1, got 0`). Restore the guard. Detach the volume and delete the image.
3. Run `node scripts/requirements-trace.mjs`, `node packages/nana-pack/tests/requirement-rows.test.mjs` and `npm run --silent map:check`; all exit 0.

Commit with explicit paths, prefix `linux-path-spelling: `, ending with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; commit the brief and must-meet with your first commit. Report first line `VERDICT: DONE | PARTIAL | BLOCKED`, then each command with its exit code and the red-then-green evidence.
