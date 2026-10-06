# Worker report — map-test-links (Sonnet worker, 2026-10-05)

Condensed from the worker's two replies. [V] = the seat re-verified it on the branch.

## Commits

- `bbae2a4` — the fix: `DYNAMIC_URL` pattern in the TS generator; `untracedTests`/`untraced_tests`
  and the `--impact` line in both generators; three rows; tests in nana-pi and both templates;
  shared doc + `AGENTS.md`; regenerated `docs/code-map.md`.
- `1dc1e69` — seat-requested fixes: rows renumbered R-945..947 → R-860..862 (template rows live in
  the pack's blocks, per R-737/738/756/858/859); R-860's four forms plus negatives pinned in
  nana-pi's own suite by calling the template's `parseRelativeImports` on placeholder-protected
  fixtures.

## Numbers on nana-pi (same 172 modules)

- import links 144 → 245; `--check` problems 0 → 0 [V]
- non-test modules with no direct test caller 56 → 27 of 77 [V]
- test modules with no mapped callee 67 → 13 of 95, printed by `--impact` [V]
- `display.mjs` transitive callers 16 → 49 [V]

The 13: `apps/desk/test/{host-rule,origin-rule}.test.mjs`; `packages/nana-pack/tests/{agent-dir-hostile,
config-gate-fallback,config-handlers-malformed,config-project-gate-fallback,review-ledger,
templates-render,test-runner}.test.mjs`; `packages/nana-setup/tests/{agent-dir-consumers,
project-dismiss,project,relative-agent-dir}.test.mjs` — each only spawns a process or builds its
import path from a template string.

## Rows (section 13c)

- R-860 `implemented` — TS generator records an edge for `new URL(<relative literal>,
  import.meta.url)`: bare, `.href`, `.pathname`, with/without a second `import()` argument. Pinned by
  a real-repo edge check and a fixture check covering all four forms plus negatives (template
  string, variable, `node:fs`, absolute URL, absolute path).
- R-861 `implemented` — TS `--impact` prints the untraced-test count. Pinned against the real repo
  (count recomputed independently) and a fresh TS scaffold (`1 of 5`).
- R-862 `implemented` — the same for the Python generator. Pinned against a fresh Python scaffold
  (`4 of 5`) in `templates-render.test.mjs`; python3 and uvx present, so it ran.
- Open question 10: TS still drops a NON-literal dynamic import silently; Python fails `--check` on
  it. ~56 sites in nana-pi. Jake's call later.
- Open question 11 (worker's find): the Python generator does not resolve a bare `import code_map`
  made through `sys.path`, so a fresh Python scaffold shows 4 of 5 tests untraced.

## Other changes

- `packages/nana-pack/tests/code-map.test.mjs`: the repo-shape G-007 check now skips layer-exempt
  (test-root) modules on the "from" side. The new links made a package test's import of an app
  visible; G-007 allows tests to import anything. [V seat read the diff]
- TS template fixture test: a `biome-ignore` for `noTemplateCurlyInString` on the non-literal fixture.

## Gates (worker; seat reran the starred ones)

- `npm test`: 95 files, 93 PASS / 1 FAIL / 1 SKIP. The FAIL is `readme-check.test.mjs` — worktree-only:
  the worktree has no `node_modules` or `apps/bench/.ext`; main reads 0 problems [V].
- `npm run map:check`: 172 modules, 0 problems [V*]. Req rail and `ears: 0 rows off form` [V*].
  `code-map.test.mjs` all passed [V*]. `templates-render.test.mjs` 68/68.
- Fresh renders by hand: TS `pnpm check` 54/54; Python `uv run pytest` 59/59. Not part of the suite.
