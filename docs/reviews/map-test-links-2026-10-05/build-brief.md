# Build brief — map-test-links (2026-10-05)

**Roles this lane (reused from the 2026-10-04 declaration):** worker = Sonnet (you), reviewer =
`pi-review … --model gpt-6-astra`, land ruling = Fable. The seat briefs, verifies and merges.

**Jake's call (2026-10-05): "Fix the map."** The code map cannot see most of nana-pi's tests, so
its blast radius (G-011) silently omits them. Fix that, and make `--impact` say what it still
cannot see. Background and measurements: `research/karpathy-x-2026-10-04.md` §6.1.

## Where you work

- Worktree `/Users/jwang/nana-pi-wt/map-test-links`, branch `feat/map-test-links` (off main
  `bb92cc7`). Use ABSOLUTE paths or `cd /Users/jwang/nana-pi-wt/map-test-links && …` in EVERY
  shell command — the shell's cwd resets between calls.
- Never touch `/Users/jwang/nana-pi` (main checkout). No nested sub-agents. Do not tag, push, or
  run `copier`. Commit on the branch with explicit paths (never `git add -A`); never pipe a test
  command into `tail` in the same command as `git commit`.

## The defect (measured by the seat on main `bb92cc7`)

- `templates/typescript/template/scripts/code-map.mjs` — `DYNAMIC` matches `import("./x")` only.
  nana-pi's tests load modules as `await import(new URL("../lib/x.mjs", import.meta.url).href)`.
  That form is invisible: 67 of 95 test modules link to no mapped module — 54 use that form,
  12 only spawn processes, 1 builds the URL from a template string.
- Whole graph today: 172 modules, 144 links. 56 of 77 non-test modules have no direct test caller.
- Seat simulation (scratch copy, one extra regex) → 245 links, 0 new map problems, about 27
  non-test modules with no direct test caller.

## Order of work (requirements-first, `nana-standards.md`)

1. **Requirement diff first** — nana-pi `REQUIREMENTS.md`. Add a new section
   `## 13c. The code-map generator (templates)` (do NOT put R-rows inside the Part G sections:
   R-756 holds Part G verbatim to `templates/_shared`). Next free IDs start at **R-945** — verify
   with a grep before using. One `shall` per row (the EARS rail is sealed at 0 off form). Rows, in
   substance (your wording, EARS form):
   - The TypeScript code map records an import edge for a dynamic import whose argument is
     `new URL("<relative string literal>", import.meta.url)` — bare, `.href`, or `.pathname`,
     with or without a second argument to `import()`.
   - WHEN `--impact` runs, the TypeScript code map prints the count of test modules (modules
     under a `layerExempt`/`testRoots` root) that import no mapped module.
   - The same for the Python code map (parity — the sentence in the shared doc covers both).
   - Add to "Open questions": the TypeScript generator still drops a NON-literal dynamic import
     silently, where the Python one fails `--check` on it (`unmapped dynamic import`). Not changed
     in this lane: nana-pi alone has ~56 such sites (pi's entry point, temp files, code inside
     child-process scripts); failing on them would turn every TS project red. Jake's call later.
2. **Tests, each with its `// req:` marker directly above** — in nana-pi's suite
   (`packages/nana-pack/tests/code-map.test.mjs` for the TS generator via the shim; find where
   nana-pi already exercises the Python generator — e.g. `templates-render.test.mjs` — and pin the
   Python row there, or say plainly that no nana-pi test can and leave that row `untested`).
   Also add the behaviour tests to BOTH templates' own code-map tests
   (`templates/typescript/template/tests/code-map.test.ts.jinja`,
   `templates/python/template/tests/test_code_map.py.jinja`) marked with the Part G row they
   evidence there (G-011), so rendered projects carry them. Assert the invariant (an edge exists
   for each accepted form; a non-literal URL creates none; the count equals the number of test
   modules with no mapped callee), not the implementation.
3. **Code** — the TS parser pattern; the untraced-test line in BOTH `formatImpact` (TS) and
   `format_impact` (Python). Suggested wording (yours to refine, keep it one line, same in both):
   `untraced tests: N of M test modules import no mapped module (a test that only starts a
   process is not linked)`. Print it once per `--impact` run. Keep headers (six tags) current.
4. **Shared doc** — `templates/_shared/working-under-nana-pi.md` line ~140 says `--impact` "names
   the tests that cover it" because "the tests are mapped too". Make it true: it names the tests
   that import the module, and counts the ones it cannot link. Update every copy the
   identical-copies test checks (at least root `AGENTS.md`); run that test.
5. **Regenerate** nana-pi's map: `npm run map` (from the worktree), commit `docs/code-map.md`.

## Gates (all green in the worktree before you report)

- `npm test` — the full suite. Run it ONCE at a time; never alongside another worktree's suite
  (desk e2e tests bind fixed ports). If a desk test flakes, rerun it standalone once and report
  both results; `stage-key-persistence` is a known intermittent.
- `npm run map:check`, `npm run readme:check`, the `req:` rail, `ears: 0 rows off form`.
- If you cannot run the Python template tests (needs `uv`), say so; do not claim them.
- Template changes ship by tag: do not tag. Record that new projects need the next `v*` tag.

## Report back (technical record, not for Jake)

- Commits (hashes) and files changed.
- Exact numbers on nana-pi after the fix: links before/after, non-test modules with no direct
  test caller before/after, the untraced-test count `--impact` prints (expect ~13; name them).
- Each new row: ID, status, and the clause its cited test pins. A row is the weakest of its
  clauses — split rather than overclaim.
- Gate outputs (last lines), anything skipped and why, any deviation from this brief.

Out of scope: failing on non-literal dynamic imports; any diagram or render mode; the desk;
tagging; pushing.
