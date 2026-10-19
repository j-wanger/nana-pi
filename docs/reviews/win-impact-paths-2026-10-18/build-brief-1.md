# Lane win-impact-paths — build brief 1 (2026-10-18 · feat/win-impact-paths · tip after the seat's plan commit)

Read `must-meet.md` here first. Row R-1361 is already in `REQUIREMENTS.md` as `planned` (the R-291 leaf total is
already 1,215); take no other row ID.

**Commit 1 — the check only.** Add IP2's check to `packages/nana-pack/tests/code-map.test.mjs` as `must-meet.md` says,
with `// req: R-1361` directly above the `check(` call, and IP1's detail argument to R-1278's existing check in
`packages/nana-pack/tests/runtime-map.test.mjs` (its third argument; the check's condition stays the same). Commit these
two test files alone. The seat runs Windows CI on this commit to see IP2 fail there, so it must not contain the fix.

**Commit 2 — the fix.** In both generators, convert the relative path to forward slashes before the map lookup:
`relative(root, resolve(a)).split(sep).join("/")`, importing `sep` from `node:path`. Sites: `scripts/code-map.mjs`
`resolveImpactPaths`, and the `--impact` branch of `main` in `templates/typescript/template/scripts/code-map.mjs`. Flip
R-1361 to `implemented` with the check as evidence. Run `npm run map` if the map changes.

Wrong code to try (macOS cannot show the bug as it is): in the template generator, join the relative path's segments
with a backslash, which is what Windows' `relative` returns, and see IP2 fail; restore.

## Done
code-map and runtime-map green on macOS, each count up by only IP2's check; `node scripts/template-acceptance.mjs`
exits 0; `npm run map:check`, `node scripts/requirements-trace.mjs` and `npm run readme:check` clean; the full suite
through `npm run test:locked` green on commit 2. Do not push; the seat pushes.

## Report
≤ 10 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: both commits; each file's macOS line before and after; the
wrong-code result; the suite line.
