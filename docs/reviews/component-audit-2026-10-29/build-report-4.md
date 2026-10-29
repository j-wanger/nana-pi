VERDICT: PARTIAL

**Commit:** `4e9baae2` — `component-audit: use checkout-independent audit commit`
- Changed `packages/nana-pack/tests/component-audit.test.mjs`; no requirement rows moved.
- Wrong-code proof: detached checkout failed R-3103 because `main` was unavailable. After changing the test to use `HEAD`, it passed.
- Preserved contract and fixture hashes; `--asks` output was not changed.
- Pushed to PR 265. CI passed on macOS, Linux, and Windows.

**Checks** — exit code 0 unless noted:
- Detached checkout test: 11 checks passed; no local branches remained.
- `node scripts/test.mjs packages/nana-pack/tests/component-audit.test.mjs`: 11 passed.
- `npm run test:locked`: **236 files: 234 PASS, 0 FAIL, 2 SKIP · checks: 8702 pass, 0 fail, 44 skip**.
- `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/known-bugs.mjs --root .`; `node scripts/identity-scan.mjs`: all passed.
- `nana-writing --report`: exit 0.

The gate blocked cleanup of the temporary detached clones, so the requested clone deletion is incomplete. No other work remains.
