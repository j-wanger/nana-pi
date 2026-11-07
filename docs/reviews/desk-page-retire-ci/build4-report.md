# Build 4: test-runner source check

- Restored the exact standalone tmpDir import in `apps/desk/test/app-listener.test.mjs`; kept removeTmpDir as a separate import.
- Preserved build 3's awaited host shutdown, Windows taskkill tree termination and retrying helper cleanup unchanged.
- The existing repository-wide source check covers all surviving test files touched by this lane. It found the combined import, not a new direct temporary-directory call.
- Requirement: R-917, unchanged. No contract change, new rows, new tests, assertion edits or tunables.
- Wrong/right pair: unchanged build 3 source fails the existing source check (exit 1); split imports pass it (exit 0). Logs: `source-before.log`, `source-after.log` in this folder.
- `node scripts/test.mjs test-runner`: exit 0; 2 files pass, 64 checks pass.
- `node scripts/test.mjs apps/desk/test`: exit 0; 10 files pass, 184 checks pass, 2 browser checks skip because Playwright is unavailable. Log: `build4-desk.log` in this folder.
- `node scripts/code-map.mjs --check`: exit 0; 0 problems.
- `node scripts/readme-check.mjs`: exit 0; 1041 claims, 0 problems.
- `git diff --check`: exit 0.
- Lane class: ordinary. No precedent departures or known-bug edits.
- CI covers the full suite under AGENTS.md. No full suite, native Windows run, browser run, push or CI lookup performed here.
