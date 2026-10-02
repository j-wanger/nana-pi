## Findings

### HIGH — README contract ignores inline commands, so the required mutation stays green

**Paths:**  
- `templates/typescript/template/scripts/readme-check.mjs:259-300`  
- `templates/python/template/scripts/readme_check.py:220-253`  
- `packages/nana-pack/tests/readme-check.test.mjs:1-39`  
- `README.md:57-60`

`commandClaims()` only examines shell-fenced lines. Commands shown inline in backticks are not checked, despite G-012 requiring **every command** named by a README to exist and run as written.

I mutation-tested the repo-level test in a scratch copy by changing the inline `npm test` at `README.md:60` to `npm nope`. `packages/nana-pack/tests/readme-check.test.mjs` still exited 0 with “443 claims checked; 0 problem(s).” Thus the requested broken-README-command mutation does not reliably turn the test red.

This affects both shipped implementations, and many commands in the seven checked READMEs are inline.

**Minimal fix:** recognize command-shaped inline code spans as command claims in both implementations, and add a repo-level mutation test that changes an inline `npm test`/`npm run …` claim and requires failure.

---

### HIGH — Self-hosted requirement statuses materially overclaim their cited evidence

**Paths:**  
- `REQUIREMENTS.md:180` (`R-140`)  
- `REQUIREMENTS.md:276` (`R-708`)  
- `REQUIREMENTS.md:539` (`R-410`)  
- `REQUIREMENTS.md:681-682` (`R-513`, `R-514`)  
- `REQUIREMENTS.md:708-709` (`R-530`, `R-531`)

I sampled 25 rows across Parts A–C using a fixed random seed (`20261002`): 19 were `implemented`. At least seven of those rows contain clauses not pinned by the cited calls:

- **R-140:** no cited call asserts that the ancestor path is supplied. That assertion exists adjacent to a marked call at `handoff-store.test.mjs:108`, but is itself unmarked and uncited.
- **R-708:** the strongest marked test at `review-ledger.test.mjs:396` is absent because its title contains backticks. The evidence cell was split into bogus external-looking fragments, ``head:<sha>`` and ``snapshot:<64hex>}``, plus weaker tests that do not pin ledger serialization.
- **R-410:** citations do not pin the empty/headerless refusal clauses or all “left untouched” clauses.
- **R-513:** citations omit provider retries, project trust, and replacement rather than inheritance.
- **R-514:** citations omit the missing-source case and do not establish refusal before spend.
- **R-530:** citations omit the unspawnable-command, empty-key and drift clauses.
- **R-531:** manually aggregating an input already containing `ok: null` does not establish that every grader error is recorded undecided.

This is not merely missing redundant evidence: the project’s stated convention binds evidence to an individual marked `check(...)`, not nearby assertions. The structural rail is green because it validates marker/citation identity, not whether the cited assertion covers every clause.

I also sampled ten markers at random. All ten correctly bound to the intended first call on the following line; I found no marker-parser misbinding or tautological assertion in that marker sample.

**Minimal fix:** split compound rows or add markers and exact citations to every clause-bearing assertion. Correct R-708’s citation so the full marked title is representable without nested backticks. Then independently re-audit all 416 `implemented` rows, not only this sample.

---

### HIGH — Canonical `npm test` is red in the review-worker environment

**Paths:**  
- `scripts/test.mjs:279-283`  
- `packages/nana-pack/extensions/nana-handoff.ts:313-315,447-449`

The runner creates a fresh `HOME` but copies every other ambient variable unchanged:

```js
const env = { ...process.env, HOME: home, USERPROFILE: home };
```

Review workers intentionally inherit `NANA_HANDOFF=off`. Under that environment, the handoff extension skips both reads and writes, while its ordinary artifact tests assume writer behavior.

I ran the complete suite with a fresh HOME and the current ambient environment:

- **88 files**
- **85 PASS, 2 FAIL, 1 SKIP**
- **5398 passing checks**
- failures:
  - `packages/nana-pack/tests/handoff-artifact.test.mjs`
  - `packages/nana-pack/tests/handoff-symlink.test.mjs`

Both failed because expected handoff files were never written. Re-running those files with `NANA_HANDOFF` removed produced 2/2 passing files.

This means the canonical suite is not hermetic in the exact `pi-review`/worker context used to review it.

**Minimal fix:** delete `NANA_HANDOFF` from the child environment in `scripts/test.mjs`, or explicitly normalize it in every test not testing role suppression. Add a runner regression test with ambient `NANA_HANDOFF=off`.

---

### MEDIUM — nana-pi’s root code map excludes every test root despite the self-hosting brief

**Paths:**  
- `code-map.config.json:7-26`  
- `REQUIREMENTS.md:738-744`

The root config maps apps, scripts and package production directories, but explicitly ignores `apps/desk/test` and `apps/bench/test`; none of the four `packages/*/tests` directories are roots at all. There is no root `testRoots` or `layerExempt` declaration.

Consequently the self-hosting map checks only 73 production modules, while the brief says the root config has test roots layer-exempt. Dropping a header from an existing repo test cannot fail this map because those files are outside it. The prose in Part G narrows “every module” to make this exclusion legal, but that contradicts the requested self-hosting shape and the round-one correction that tests are modules too.

The template configs themselves are correct: both map `src`, `scripts`, and a layer-exempt `tests` root, and the render test proves a dropped scaffold test header is red.

**Minimal fix:** add all six collected test roots to the root config as layer-exempt roots, add contract headers to their modules, regenerate `docs/code-map.md`, and mutation-test a header removed from an existing package/app test.

## Verification performed

- **Round-one CRITICAL reproduced:** `packages/nana-setup/tests/skills-and-standards.test.mjs` passed all 73 checks. Forced-win32 directory-symlink installation exited 1, named the obstruction, left the external victim byte-identical, wrote no backup through the link, and behaved identically under dry-run. POSIX relinking also left the victim unchanged.
- **Adopt mode reproduced from this checkout:** both Python and TypeScript renders succeeded. Each emitted no product rows, all G rows were `untested`, rail markers were `req-candidate:`, initial map `--check` failed naming the regenerate command, and one regeneration made it green.
- **Other round-one fixes:** template configs cover `src`, `scripts`, and tests; dropped test headers fail; recursive nested-test code and root-relative citations are present; implemented rows require a well-formed local citation; marker calls may appear anywhere on the next line; literal Python `importlib.import_module`/`__import__` edges resolve and a nonliteral argument reports `unmapped dynamic import`. Focused reproductions passed.
- **Repo-level mutations:** dropping `scripts/test.mjs`’s header made `code-map.test.mjs` fail; flipping R-001 to `untested` made `requirements-trace.test.mjs` fail. The inline broken README command did **not** fail, as reported above.
- **Shims:** `scripts/code-map.mjs`, `scripts/readme-check.mjs`, and `scripts/requirements-trace.mjs` import and execute the template implementations directly; no copied implementation was found.
- **Exempt modules:** all three bench exemptions match the closed study’s recorded SHA-256 exactly.
- **READMEs/runtime diff:** the nana-stage README agrees with its three modules and tests. The desk and bench claim corrections inspected match current code. Outside the intended installer addition (`nana-standards` plus the shared requirements skill), modified runtime modules contain contract-header comments only; I found no unrelated pack, desk, bench, knowledge, or stage behavior change.

VERDICT: BLOCK
