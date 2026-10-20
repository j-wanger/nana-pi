# Lane lane-guard-temp-root — build brief 4 (2026-10-20 · feat/lane-guard-temp-root)

The seat sends this to the build-3 builder (a Claude Sonnet 5 subagent) as a follow-up message. Build 4 follows CI on build 3 (1d9ba683).

CI run 39447368542 at 1d9ba683: the Ubuntu leg fails one check, `the source check detects direct mkdtemp calls while ignoring only generated leak fixtures` (R-917) in `packages/nana-pack/tests/test-runner.test.mjs`. That check requires every test file that calls `tmpDir(` to carry the exact line `import { tmpDir } from "./tmp-dir.mjs";`. Build 3 changed `packages/nana-pack/tests/lane-write-guard.test.mjs` to import both helpers on one line, `import { tmpDir, tmpDirUnmanaged } from "./tmp-dir.mjs";`, so the check fails on every platform.

Do, nothing else:
1. In `packages/nana-pack/tests/lane-write-guard.test.mjs`, split that import into two lines: `import { tmpDir } from "./tmp-dir.mjs";` and `import { tmpDirUnmanaged } from "./tmp-dir.mjs";` (the form `linked-launch.test.mjs` and `real-path.test.mjs` use). Do not change the R-917 check.
2. Run alone: `npm test -- packages/nana-pack/tests/test-runner.test.mjs` and `npm test -- packages/nana-pack/tests/lane-write-guard.test.mjs`, then `npm run -s map:check`. Single files only; never the full suite.
3. Commit with that explicit path only, on top of the current tip (the seat has committed notes and merged main since build 3; do not touch `docs/reviews/`, `HANDOFF.md` or `docs/sessions/`). Same trailers as before. Do not push.

Report in 4 lines or fewer, DONE and the tip SHA first, with each command's result.
