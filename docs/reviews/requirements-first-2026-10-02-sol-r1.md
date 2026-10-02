# Review — requirements-first promotion

## Findings

### CRITICAL — the Win32 skill mirror follows an existing directory symlink and overwrites its target

**Path:** `packages/nana-setup/lib/steps.mjs:106-115`

`linkSkill()` checks the skill-directory entry only on the POSIX branch. On the Win32 branch it immediately calls `linkFile(target/SKILL.md, ..., copyInstead: true)`. If `~/.claude/skills/requirements` is a directory symlink/junction, resolving `target/SKILL.md` traverses that entry. `linkFile` only sees the final regular file, backs it up, and replaces it in the linked external directory. This directly contradicts the comment at lines 102-104 and can modify content outside `~/.claude`.

I reproduced this without touching the real home by creating a temporary `~/.claude/skills/requirements -> /tmp/.../victim`, putting owner content in `victim/SKILL.md`, and running the installer with `NANA_SETUP_PLATFORM=win32`. It exited **0**, left the directory symlink in place, changed the victim's first line from `OWNER CONTENT` to `---`, and created `victim/SKILL.md.bak-20261002`. The installer reported `skill requirements updated 1 file copied`. The existing Win32 test covers a regular target directory and a symlink at the *file* level, not a symlink/junction at the skill-directory level.

**Minimal fix:** before enumerating/copying files on Win32, `lstat` the `target` directory itself. Refuse a symlink/junction or non-directory as `PROBLEM` without traversing it; only mirror into an actual directory created/owned at that path. Add the exact directory-link-to-victim regression test and assert install exits 1 and the victim tree is byte-identical.

### HIGH — adopt mode installs neither a trace rail nor an honest initial ledger

**Paths:**
- `templates/python/template/REQUIREMENTS.md.jinja:45-53`
- `templates/typescript/template/REQUIREMENTS.md.jinja:43-51`
- `templates/_shared/requirements-general.md:25,35-37`
- `packages/nana-pack/skills/adopt-py/SKILL.md:47-48,90-98`
- `packages/nana-pack/skills/adopt-ts/SKILL.md:63-66,106-114`
- `templates/python/template/{% if not adopt %}tests{% endif %}/conftest.py:1`
- `templates/typescript/template/{% if not adopt %}tests{% endif %}/requirements-trace.test.ts:167-175`

Both adopt renders emitted `REQUIREMENTS.md`, the map script/config, and the post-edit map check, but emitted no `tests/` rail and no `docs/code-map.md`. Each ledger nevertheless contained five `implemented` rows: R-001 cites the scaffold-only smoke test, while G-004/G-009/G-010/G-011 cite scaffold-only code-map tests. The blockquote telling adopters to “confirm ... or downgrade” does not make those current status claims honest, and no emitted rail exists to fail them. The skills defer the audit until step 9, after step 7 says validation must be green; their “configs only” payload descriptions also omit the newly emitted requirements/map files.

Observed on clean adopt renders:

- Python: `tests dir: no; docs/code-map: no; implemented rows: 5`; `python3 scripts/code_map.py --check` exited 1 with `docs/code-map.md does not exist`.
- TypeScript: the same absence and five claims; `node scripts/code-map.mjs --check` exited 1 with `docs/code-map.md does not exist`.

Thus adoption starts with a knowingly false ledger, an always-red post-edit map command, and no mechanism by which future marker/status drift can fail the suite. This misses the brief's central promise that adopted projects inherit the rail.

**Minimal fix:** make the requirement template conditional on `adopt`: do not assert the scaffold product row, and initialize all locally unverified Part G rows as `untested` (or `violated` only after the audit proves that). Supply a language-appropriate rail integration in adopt mode, or install a standalone zero-dependency trace checker and wire it into the adopted project's reconciled test command. Generate/reconcile `docs/code-map.md` before enabling `--check`, and move the audit/reconciliation before the “all green” validation step. Update the payload descriptions to name every emitted file.

### HIGH — “every module” excludes tests and scripts, so dropping a header there stays green

**Paths:**
- `templates/_shared/requirements-general.md:25,35-36`
- `templates/python/template/code-map.config.json.jinja:2`
- `templates/typescript/template/code-map.config.json.jinja:2`
- `templates/python/template/scripts/code_map.py:532-545`
- `templates/typescript/template/scripts/code-map.mjs:554-578`

G-004 says **every module** has a header, G-009 says the map lists **every module**, and G-010 says a headerless module fails the suite. Both generated configs only map `src`, however. The shipped tests and scripts happen to carry headers but are outside enforcement forever.

I removed the entire six-tag header from rendered `tests/smoke.test.ts`. `node scripts/code-map.mjs --check` still exited 0 (`code map: 1 modules over src; ... 0 problem(s)`), and the full Vitest suite remained green (`Test Files 3 passed`, `Tests 21 passed`). By contrast, removing the header from `src/index.ts` correctly failed and named `src/index.ts: no contract header`.

**Minimal fix:** either narrow the rows and all prose to “every module under the configured production roots,” or fulfill the stated contract by mapping `tests/` and `scripts/` too. If the latter, model the explicit G-007 test exemption so test imports do not create false layer failures, regenerate the seed maps, and add header-drop mutations outside `src`.

### MEDIUM — nested tests are invisible to both trace rails

**Paths:**
- `templates/python/template/{% if not adopt %}tests{% endif %}/conftest.py:131-138`
- `templates/typescript/template/{% if not adopt %}tests{% endif %}/requirements-trace.ts:144-162`

Python uses non-recursive `directory.glob("test_*.py")`; TypeScript calls `readdirSync(dir)` only at the top level. Feature-oriented projects commonly put tests in subdirectories, and both templates explicitly recommend tests mirroring feature folders.

I added `tests/nested/unknown.test.ts` with `// req: R-999`. Vitest ran that test, but the rail reported only five traced IDs and the suite exited 0: `Test Files 4 passed`, `Tests 22 passed`. An unknown marker in a top-level test correctly failed and named R-999.

**Minimal fix:** recurse deterministically (`rglob` in Python; an explicit sorted walk in TypeScript), preserve paths relative to project root in citations, and add nested unknown-ID/status/citation fixtures.

### MEDIUM — `implemented` does not require evidence naming a test

**Paths:**
- `templates/python/template/{% if not adopt %}tests{% endif %}/conftest.py:141-158`
- `templates/typescript/template/{% if not adopt %}tests{% endif %}/requirements-trace.ts:60-89,187-205`

The documented status contract says `implemented` means the evidence cell names the asserting test. The rail only validates local citations that happen to parse; an implemented row with a marker and evidence `—` (or arbitrary prose) passes because `have` is nonempty and `row.local` is empty.

I changed rendered R-001's evidence to `—` while retaining its marker. The full TypeScript suite exited 0 (`Test Files 3 passed`, `Tests 21 passed`). The requested nonexistent-title mutation *does* correctly fail when a syntactically local citation is present.

**Minimal fix:** require every non-external `implemented` row to have at least one well-formed local `tests/...::<title/name>` citation, reject unclassified citation text, and then require each citation to be present among that row's marked tests. Add empty/malformed/mixed evidence tests in both implementations.

### MEDIUM — the Python “import graph” silently omits literal dynamic imports

**Path:** `templates/python/template/scripts/code_map.py:295-326`

`_import_targets()` recognizes only `ast.Import` and `ast.ImportFrom`. Literal `importlib.import_module("package.module")` and `__import__("package.module")` edges are silently absent, so layer checks and `--impact` can be wrong-green for a normal plugin/lazy-loading layout.

I added a header-valid `src/py_review/late.py` and loaded it from `__init__.py` with `importlib.import_module("py_review.late")`. After regenerating, `--check` exited 0 over two modules, but the map showed `__init__.py` with `callees —`; impact therefore omitted the loaded module. The static relative/absolute Python fixtures and TypeScript static/bare/dynamic `.js -> .ts` fixtures pass.

**Minimal fix:** recognize literal-string `importlib.import_module`/`__import__` calls and resolve them through the same package index. For dynamic expressions that cannot be resolved, either report an explicit unmapped-dynamic-import problem or document a declared-edge escape hatch; do not silently claim a complete graph.

## End-to-end and mutation evidence

I rendered all four variants from this dirty checkout using the requested `uvx copier copy --trust --vcs-ref HEAD ...` form. Copier explicitly reported `DirtyLocalWarning: Dirty template changes included automatically`.

- Python scaffold: `uv sync` succeeded; `uv run pytest` collected 26 tests and ended `26 passed in 1.40s`, `requirements: 12 total (5 implemented · 7 untested); 5 traced by tests`, coverage 100% against the 85% floor.
- TypeScript scaffold: `pnpm install` succeeded; `pnpm check` completed typecheck, Biome, and Vitest. It ended `Test Files 3 passed (3)`, `Tests 21 passed (21)`, with the same 12-row/5-traced summary. Biome printed one deprecation info for `linter.recommended`, not a failure.
- Python and TypeScript adopt renders both completed, exposing the adopt defects above.
- Focused repository tests passed: `templates-render.test.mjs` (14 PASS lines), `install.test.mjs`, and `skills-and-standards.test.mjs` (`SUMMARY PASS=46 FAIL=0 SKIP=0`). The installer failure above is an uncovered directory-link case.

Requested source/ledger mutations against the rendered TypeScript scaffold behaved as follows:

- removed `src/index.ts` header: exit 1, named the missing header;
- flipped R-001 to `untested`: exit 1, named stale R-001;
- added a reverse `core -> ui` import after declaring two layers: exit 1, named `against the layer direction (core -> ui)`;
- added top-level marker R-999: exit 1, named unknown R-999;
- cited a nonexistent test title: exit 1, named the exact missing title.

The additional test-header, nested-test, and empty-evidence mutations above identify important wrong-green boundaries despite those five happy failure paths.

VERDICT: BLOCK
