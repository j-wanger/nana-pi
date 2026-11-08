# acceptance-win-cmd fixture evidence

Scope: R-3845, existing M6. No requirement change: this restores its existing contract.
No new tests; the only existing-test edit adds `--allow-empty` to the fixture's
`next` commit. Assertions and the `data_checks=true` previous-release update remain unchanged.

Wrong-code pair: without `--allow-empty`, the existing M6 fails at v0.6.51;
with it, all eight data-pack checks pass. No assertion was inverted.
`git fetch --tags` exited 0 before reproduction. The newest selected tag was
v0.6.51; `git diff v0.6.51 -- copier.yml templates` was empty.

The older-tag proof used a local, no-hardlinks clone under $TMPDIR, copied only
the fixed test, and removed tags there except v0.6.48. `git describe` selected
v0.6.48. The lane's tags and templates were not changed.

No Precedent section was required by this fix card; no helpers or tunables changed.
No supplied FEAT-033 known bug was touched. CI covers the full suite per AGENTS.md;
no local full-suite run, push, model session, or CI lookup was performed.

## Command output

### `node scripts/test.mjs data-pack.test template-acceptance.test (wrong code, v0.6.51)` — exit 1

```text
FAIL  packages/nana-pack/tests/data-pack.test.mjs            7 pass, 1 fail  68.9s  — exit 1
      | FAIL M6 adoption preserves pack files and previous release updates cleanly git: HEAD detached at v0.6.51
PASS  packages/nana-pack/tests/template-acceptance.test.mjs  14 pass  12.4s

2 files: 1 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 21 pass, 1 fail, 0 skip · 82.7s
failed: packages/nana-pack/tests/data-pack.test.mjs
```

### `node scripts/test.mjs data-pack.test template-acceptance.test (fixed, v0.6.51)` — exit 0

```text
PASS  packages/nana-pack/tests/data-pack.test.mjs            8 pass  236.5s
PASS  packages/nana-pack/tests/template-acceptance.test.mjs  14 pass  13.6s

2 files: 2 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 22 pass, 0 fail, 0 skip · 251.5s
```

### `node scripts/test.mjs data-pack.test (fixed, temporary clone selecting v0.6.48)` — exit 0

```text
PASS  packages/nana-pack/tests/data-pack.test.mjs  8 pass  215.8s

1 files: 1 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 8 pass, 0 fail, 0 skip · 218.8s
```

### `npm run map:check` — exit 0

```text

> nana-pi@0.5.0 map:check
> node scripts/code-map.mjs --check

code map: 560 modules over scripts, apps/desk, apps/bench, packages/nana-pack/lib, packages/nana-pack/bin, packages/nana-pack/extensions, packages/nana-knowledge/lib, packages/nana-knowledge/bin, packages/nana-knowledge/extensions, packages/nana-stage/lib, packages/nana-stage/extensions, packages/nana-setup/lib, packages/nana-setup/bin, packages/nana-setup/claude/hooks, packages/nana-pack/tests, packages/nana-knowledge/tests, packages/nana-stage/tests, packages/nana-setup/tests, apps/desk/test, apps/bench/test; 0 without a usable contract header; 0 problem(s)
```

### `npm run req:tree` — exit 0

```text

> nana-pi@0.5.0 req:tree
> node scripts/requirements-tree.mjs --write

requirements tree: 0 problems; rows 2649; features 43
deliverables: 20 of 22 made and read by code, 12 more parked
```

### `npm run readme:check` — exit 0

```text

> nana-pi@0.5.0 readme:check
> node scripts/readme-check.mjs

readme: 871 claims checked; 0 problem(s)
```
