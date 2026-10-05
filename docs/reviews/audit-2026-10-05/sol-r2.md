## Findings

### MUST — The TypeScript code-map generator still emits the broken `map:impact --` command

**Files:** `templates/typescript/template/scripts/code-map.mjs:665`, `templates/typescript/template/docs/code-map.md.jinja:17`

The four prose locations changed in round 2 now use the correct command. However, the worker also changed `scripts/code-map.mjs` during this lane and missed its generated documentation text.

I rendered a fresh TypeScript project from `HEAD`. Its instructions conflict:

```text
AGENTS.md: pnpm map:impact <file...>
README.md: pnpm map:impact <file...>
src/AGENTS.md: pnpm map:impact src/<file>.ts
docs/code-map.md: pnpm map:impact -- <file...>
```

The corrected command ran cleanly:

```text
$ pnpm map:impact src/index.ts
src/index.ts
  transitive callers (1): tests/smoke.test.ts
```

The generated-map command still treated `--` as a module:

```text
$ pnpm map:impact -- src/index.ts
--  [NOT A MAPPED MODULE]
```

Running `pnpm map` will regenerate the same false instruction from `scripts/code-map.mjs`.

**Smallest fix:** remove `--` from the generator string and `docs/code-map.md.jinja`, then regenerate the committed maps.

### MUST — The pack README still categorically calls custom handoff destinations user-scope

**File:** `packages/nana-pack/README.md:593-597`

The revised sentence says the summary is written to a “user-scope store,” then says configured `handoff.path` replaces its location. A custom path is not necessarily user-scope.

The same README explicitly says at line 677 that `handoff.path` can come from trusted project scope. `packages/nana-pack/lib/config.ts:557` also merges project handoff configuration.

**Smallest fix:** say “writes to a store—by default the user-scope store fixed at …; configured `handoff.path` replaces it.”

## Closure verified

- **R-858:** `untested`; no test marker claims it. Its evidence records both silent availability skips and the different direct-tool invocation. `node scripts/requirements-trace.mjs` passed: 797 rows, 509 implemented, 278 untested, zero off form.
- **Shared instructions:** objective, handoff defaults, notification controls, relocated-auth gap, project-policy symlink-target gap, and malformed-stop exception match the inspected implementation. The text remains usable as agent instructions.
- **Canonical copy:** the `AGENTS.md` section is byte-identical to `templates/_shared/working-under-nana-pi.md`. The mirror and mutation checks passed.
- **Addendum:** pi 1.0.2 source confirms the eight-character SHA-256 suffix and 64-character limit. Doctor uses `FAIL`, rendered as `✗`.
- **Part G counts:** `npm run map:check` reported 172 modules and zero problems. Parsing the map produced 77 non-test and 95 test modules.
- **Template suite:** all checks passed, including live Ruff and Biome checks.

VERDICT: BLOCK — 7/10
