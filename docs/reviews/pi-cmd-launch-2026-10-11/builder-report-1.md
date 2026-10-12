VERDICT: PARTIAL

Commits:
- `d42fbed` — implementation, requirements, docs, tests, and seat outputs.
- `cead410` — Windows sealed-command checks and updated code map.

Files: `REQUIREMENTS.md`, `docs/code-map.md`, `docs/requirements-tree.md`, `docs/reviews/pi-cmd-launch-2026-10-11/{seat-verify-tests-output.txt,seat-verify-wincmd-output.txt,test-title-map.json}`, `packages/nana-pack/{README.md,extensions/nana-post-edit.ts,lib/win-command-config.mjs,lib/win-command.mjs,tests/post-edit-status.test.mjs,tests/requirements-tree.test.mjs,tests/win-command.test.mjs}`, `packages/nana-setup/{README.md,lib/doctor.mjs,lib/steps.mjs,tests/doctor-runtime.test.mjs,tests/pi-registration.test.mjs}`.

Rows: R-1033–R-1036, R-1039, R-952, R-1037 and R-1038 are implemented and traced. Their tests pin PATH lookup, launch/refusal rules, probe results, version parsing, shared hint, and conservative post-edit classification.

Mutation pairs: the initial helper implementation produced 11 failing checks; corrected code passed 38/38. The seat verifier initially reported 23 mismatches; corrected code passed 86/86. Assertions were not inverted.

Commands: `req:tree`, `map`, `map:check`, `readme:check`, both seat verifiers, and `git diff --check` passed. Final `npm run test:locked` passed.

Suite summary: `134 files: 133 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6764 pass, 0 fail, 8 skip · 638.3s`

Seat output endings:
```text
cases: 86/86
seat-verify-wincmd: 0 mismatch(es)
```
```text
ok   replaced: win32 skips pi executable probe → win32 pi executable probe uses injected ComSpec launcher
seat-verify-tests: 0 gap(s)
```

Windows-only cases not executed here: npm-generated shim with the spaced/metacharacter manifest root; real post-edit commands (`node -e`, `type`, `dir/Z`); and each sealed name through `where` and `cmd`. They are guarded and report SKIP off Windows. The Windows CI leg remains pending.

Scope check: `git diff --stat a7288e12076fb834e085fcb2f65af16525c8c331..HEAD` — 18 files, 461 insertions, 41 deletions. Worktree is clean.

Most likely wrong: the real npm shim may not preserve the manifest-root argument through `%*` on Windows; that integration remains unverified.
