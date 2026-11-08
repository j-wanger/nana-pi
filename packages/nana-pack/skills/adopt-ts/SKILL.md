---
name: adopt-ts
description: Retrofit the nana-pi TypeScript stack (strict tsconfig + Biome + Vitest, manual checks, copier drift tracking) onto an EXISTING TypeScript/Node project. Use when the user wants to adopt/retrofit/apply the nana standards to a project that already has code.
---

# Adopt the TypeScript stack in an existing project

Overlay the nana-pi TypeScript template onto a real project so it gains the
pinned toolchain AND the template-update relationship (`uvx copier update`
works from then on). The overlay is deliberately blunt (`--overwrite`); git is
the reconciliation surface — nothing is lost because the tree starts clean.

## Preconditions (stop and fix before anything else)

- The project is a git repo with a CLEAN working tree — commit or stash first.
- NO existing `.copier-answers.yml` — one means the project is already managed
  by some template, and the overlay would sever that relationship. Stop,
  surface it, and proceed only on the user's explicit call.
- Node ≥22 available. Detect their package manager from the lockfile
  (pnpm/npm/yarn) — **adoption keeps their package manager**; only greenfield
  scaffolds pin pnpm.
- `uv` is installed — the overlay runs `uvx copier`, and `uvx` ships with uv.
  This holds for the TypeScript stack too; uv is not Python-only here.
- Network access to github.com — the template src is
  `https://github.com/j-wanger/nana-pi.git` (a local nana-pi checkout works as
  src too, for offline use or template development).

## Steps

1. **Scan**: package.json (scripts, deps, module type), tsconfig(s), existing
   lint/format stack (ESLint/Prettier/Biome), test runner, layout, CI. Note
   whether the project is ESM or CJS and whether `strict` is already on.
2. **Present the plan and get an OK** — what lands (tsconfig pins, biome.json,
   manual checks, CI, root AGENTS.md, answers file, and the
   requirements rail: `REQUIREMENTS.md`, the map and readme-check generators and four tests under
   `tests/` — see step 3), what gets merged
   (their package.json fields/deps with the pinned scripts + devDeps), what is
   never touched (source tree and tests). If they run ESLint/Prettier, the
   plan must say so explicitly: Biome replaces them only with the user's OK —
   otherwise take the **keep-your-linter path** below.

   **Keep-your-linter path** (they said no to Biome). Excluding `biome.json` is
   NOT enough on its own: Biome runs fine without that file. Do all three:
   - add `-x biome.json` to the overlay command in step 3;
   - in step 4, adapt AGENTS.md's manual lint and format commands to their tools;
   - in step 4, do NOT add the `@biomejs/biome` devDep, and leave the `lint` /
     `format` scripts pointing at their tools.

   Record the deviation in AGENTS.md; a future `copier update` may re-emit
   `biome.json` and the manual Biome commands, so reconcile them again.
3. **Overlay**:

   ```bash
   uvx copier copy --defaults --overwrite --data language=typescript --data adopt=true --data project_name="<name>" https://github.com/j-wanger/nana-pi.git .
   ```

   (One line on purpose — it must work in PowerShell too, where bash's `\`
   continuation breaks.)

   Adopt mode emits the configs AND the requirements rail — no source code:

   - configs: package.json, tsconfig + tsconfig.build, biome.json, CI, root
     AGENTS.md, `.copier-answers.yml`;
   - `REQUIREMENTS.md` with the standard general-engineering feature, every G row
     `untested` and no product rows — the project's own behaviour is step 7's
     work;
   - `code-map.config.json` and the generator `scripts/code-map.mjs`;
   - a PLACEHOLDER `docs/code-map.md`. The first `--check` reports it stale and
     names the one command that regenerates it (`node scripts/code-map.mjs` —
     it needs no dependencies);
   - four rail tests under `tests/`: `tests/requirements-trace.ts`,
     `tests/requirements-trace.test.ts`, `tests/code-map.test.ts`, and
     `tests/readme-check.test.ts`, plus `scripts/readme-check.mjs`. Their markers
     render as `req-candidate:`, not `req:`, so the rail stays green until a row
     is promoted — rename its marker and cite the test in the row.

Files written by an adopt render into an empty folder:
- `.copier-answers.yml`
- `.github/workflows/ci.yml`
- `.gitignore`
- `AGENTS.md`
- `HANDOFF.md` (written only when absent)
- `OBJECTIVE.md` (written only when absent)
- `REQUIREMENTS.md` (written only when absent)
- `REQUIREMENTS-general.md`
- `biome.json`
- `code-map.config.json`
- `docs/code-map.md` (written only when absent)
- `docs/sessions/README.md` (written only when absent)
- `package.json`
- `scripts/code-map.mjs`
- `scripts/readme-check.mjs`
- `tests/code-map.test.ts`
- `tests/readme-check.test.ts`
- `tests/requirements-trace.test.ts`
- `tests/requirements-trace.ts`
- `tsconfig.build.json`
- `tsconfig.json`

First two steps:
1. Ratify `OBJECTIVE.md`: ask the owner for one objective line and one current-priority line; write their words over the placeholders and DRAFT suffix, fill `<date>`, and never invent either line. If the owner defers, leave the DRAFT lines and say so in the handover.
2. Trust the folder: `nana-setup trust <dir>`.

4. **Reconcile from `git diff`** — merge THEIR content into OUR structure:
   - `package.json`: restore their fields (name, version, deps, engines, bin,
     exports…); merge scripts — keep theirs where names collide, and preserve
     every pinned `build`, `typecheck`, `lint`, `format`, `test`, `map`,
     `map:check`, `map:impact`, `readme:check`, and `check` script; rewrite
     `check` to their package manager. Add the missing devDeps
     (typescript/biome/vitest/@types/node) via THEIR package manager so the
     right lockfile updates — minus biome on the keep-your-linter path. Add
     each missing devDependency at the exact version the rendered `package.json`
     names.
   - `tsconfig.json`: the pinned strict base lands; carry over compiler
     options their build genuinely needs (jsx, paths, outDir, lib). CJS
     projects: `module`/`moduleResolution` stay theirs — record the deviation.
   - `tsconfig.build.json`: adapt to how they actually build (outDir/rootDir/
     excludes), or drop it if they build another way — record which.
   - `.gitignore`: union of theirs and the template's.
   - Leave any existing .pi/nana-pack.json byte-identical; legacy checker
     lists do nothing. No starter is emitted; gate patterns still need trust.
   - `pnpm-workspace.yaml`: ensure it carries this valid YAML block (create the file with only this setting if absent):

     ```yaml
     allowBuilds:
       esbuild: true
     ```
   - Before validation, reconcile the README so the rendered readme check passes: include install/run/test headings and document the code-map and readme-check scripts, or declare a script in `readme-check.config.json` with a reason. Fix the README, never the check.
   - On an adopted project, run `copier update --conflict inline`, never `--conflict rej`; convert decorator markers first.
   - CI: adapt the workflow to their package manager; if they already have CI,
     merge the `check` step AND the template-drift job into it instead of
     adding a duplicate workflow.
   - `AGENTS.md`: fold existing AGENTS/CLAUDE.md content in, write the real
     Layout section, fix Commands to their package manager (and, on the
     keep-your-linter path, to their linter/formatter — the template's Rules
     name Biome), one screen.
   - **The rail files, if those names were already taken.** `--overwrite` means
     a same-named rail file (a `tests/code-map.test.ts` of their own, say) was
     REPLACED, not merged. The `git diff` this step already reads is the
     recovery: restore their content next to the template's, keeping both. A
     project whose tests do not live in `tests/` moves the four rail test files into
     the real test directory and updates the citations that name them.
5. **Stage the strictness** — pins stay, escapes are recorded:
   - Run format + lint across the repo; fix the cheap remainder, targeted
     suppressions with a `// ratchet:` comment for the rest.
   - `tsc --noEmit` under the strict flags: fix what's fast; for the rest use
     `// @ts-expect-error` with a reason + ratchet comment. If the error wall
     is huge, relax `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`
     (NOT `strict`) with a ratchet note in AGENTS.md.
6. **Per-folder AGENTS.md**: author a lean one (one screen max) for each major
   source folder whose purpose isn't obvious from its name.
7. **Run the requirements audit mode — BEFORE the gates.** The suite cannot be
   honestly green until this is done: the rail's project-wide self-test fails
   while mapped modules have no contract header, and the first `--check` fails
   while `docs/code-map.md` is still the placeholder. The overlay brings the
   toolchain and a `REQUIREMENTS.md` whose general-engineering feature rows exist, but the project's
   own behaviour is nowhere in it — and an adopted codebase is exactly where
   nobody knows what it promises. Use the `requirements` skill in audit mode:
   extract EARS rows from the design docs, `HANDOFF.md` and the test suite with
   read-only workers, place the `// req:` markers, each row in the table of the
   feature it serves, then do the conflicts + failing-now pass and carry the
   conflicts in `Open questions` with whose call each one is. A pre-existing
   `REQUIREMENTS.md` follows the carve-out. A ledger without a requirements
   tree keeps its numbered sections; its next step is a lift into the tree,
   with every row kept byte-identical, then a regroup into capabilities and
   features that the owner approves. Generate the real map once (`node scripts/code-map.mjs`). Expect
   general-engineering feature rows to land `violated` on a legacy codebase — that is the honest
   state and the ratchet list, same as the `@ts-expect-error` escapes.
8. **Validate**: install with their package manager, then run these manual
   checks before committing, adapting pnpm to their package manager and Biome
   to their linter when retained. Nana runs no per-edit checks. Replace `{file}`
   with each changed TypeScript file, quoted for your shell.

- **Manual lint:** `pnpm exec biome check .`
- **Manual format:** `pnpm exec biome check --write {file}` (repair lint and formatting)
- **Manual types:** `pnpm exec tsc --noEmit`
- **Manual tests:** `pnpm test`
- **Manual map:** `node scripts/code-map.mjs --check`
- **Manual readme:** `node scripts/readme-check.mjs`
- **Manual length:** `node -e "const s = require('fs').readFileSync(process.argv[1], 'utf8'); const n = s.split(/\r?\n/).length - (s.endsWith('\n') ? 1 : 0); if (n > 300) { console.error(process.argv[1] + ': ' + n + ' lines exceeds the 300-line file cap - split it'); process.exit(1); }" {file}`

9. **Commit the adoption as one commit** (including `.copier-answers.yml` —
   the update relationship needs it git-tracked), then prove the
   relationship: `uvx copier update --pretend --defaults` runs clean.
10. **Close on the project check.** Run `nana-setup project <dir> --check`;
    where `nana-setup` is not on PATH, as on Windows, run `node
    "$HOME/nana-pi/packages/nana-setup/bin/nana-setup.mjs" project <dir>
    --check`. It writes nothing. Call the adoption ready only when it exits 0.
    Otherwise report every ✗ and ! line with the repair the check names: a
    fresh adoption reads ✗ for the month log until `nana-setup project <dir>`
    runs, and ! for trust until the owner runs `nana-setup trust <dir>`. Run a
    repair only with the owner's yes, and commit any file it writes by its own
    path.

## Notes

- Every deviation from a template pin is debt with a paper trail: ratchet
  comment at the site, target in AGENTS.md.
- Never edit `.copier-answers.yml` by hand.
