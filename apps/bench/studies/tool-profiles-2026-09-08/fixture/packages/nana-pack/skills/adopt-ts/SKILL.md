---
name: adopt-ts
description: Retrofit the nana-pi TypeScript stack (strict tsconfig + Biome + Vitest, post-edit gates, copier drift tracking) onto an EXISTING TypeScript/Node project. Use when the user wants to adopt/retrofit/apply the nana standards to a project that already has code.
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
   `.pi` post-edit preset, CI, root AGENTS.md, answers file), what gets merged
   (their package.json fields/deps with the pinned scripts + devDeps), what is
   never touched (source tree and tests). If they run ESLint/Prettier, the
   plan must say so explicitly: Biome replaces them only with the user's OK —
   otherwise take the **keep-your-linter path** below.

   **Keep-your-linter path** (they said no to Biome). Excluding `biome.json` is
   NOT enough on its own: Biome runs fine with no config file, and the post-edit
   preset's `biome check --write` REWRITES every file the agent edits — their
   formatter and Biome would fight over the same bytes. All three of these:
   - add `-x biome.json` to the overlay command in step 3;
   - in step 4, delete the `biome check --write` entry from
     `.pi/nana-pack.json` and put their own format/lint command in its place
     (keep the size-cap and `tsc --noEmit` entries);
   - in step 4, do NOT add the `@biomejs/biome` devDep, and leave the `lint` /
     `format` scripts pointing at their tools.

   Record the deviation in AGENTS.md (a future `copier update` may re-emit
   `biome.json` and the Biome post-edit command — remove them again; the note
   stays).
3. **Overlay**:

   ```bash
   uvx copier copy --defaults --overwrite --data language=typescript --data adopt=true --data project_name="<name>" https://github.com/j-wanger/nana-pi.git .
   ```

   (One line on purpose — it must work in PowerShell too, where bash's `\`
   continuation breaks.)

   Adopt mode emits configs only: package.json, tsconfig + tsconfig.build,
   biome.json, CI, root AGENTS.md, `.pi/nana-pack.json`,
   `.copier-answers.yml`. No README/src/tests starters, no pnpm-workspace.
4. **Reconcile from `git diff`** — merge THEIR content into OUR structure:
   - `package.json`: restore their fields (name, version, deps, engines, bin,
     exports…); merge scripts — keep theirs where names collide, add the
     pinned `typecheck`/`lint`/`format`/`test`/`check` set, and rewrite
     `check` to their package manager. Add the missing devDeps
     (typescript/biome/vitest/@types/node) via THEIR package manager so the
     right lockfile updates — minus biome on the keep-your-linter path.
   - `tsconfig.json`: the pinned strict base lands; carry over compiler
     options their build genuinely needs (jsx, paths, outDir, lib). CJS
     projects: `module`/`moduleResolution` stay theirs — record the deviation.
   - `tsconfig.build.json`: adapt to how they actually build (outDir/rootDir/
     excludes), or drop it if they build another way — record which.
   - `.gitignore`: union of theirs and the template's.
   - `.pi/nana-pack.json`: rewrite the `pnpm exec` runner prefixes to their
     package manager (npm → `npx`, yarn → `yarn exec`) — until this is done,
     every edit fires failing post-edit commands. Merge any pre-existing
     postEdit list. On the keep-your-linter path, swap the
     `biome check --write` entry for their own format/lint command.
   - CI: adapt the workflow to their package manager; if they already have CI,
     merge the `check` step AND the template-drift job into it instead of
     adding a duplicate workflow.
   - `AGENTS.md`: fold existing AGENTS/CLAUDE.md content in, write the real
     Layout section, fix Commands to their package manager (and, on the
     keep-your-linter path, to their linter/formatter — the template's Rules
     name Biome), one screen.
5. **Stage the strictness** — pins stay, escapes are recorded:
   - Run format + lint across the repo; fix the cheap remainder, targeted
     suppressions with a `// ratchet:` comment for the rest.
   - `tsc --noEmit` under the strict flags: fix what's fast; for the rest use
     `// @ts-expect-error` with a reason + ratchet comment. If the error wall
     is huge, relax `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`
     (NOT `strict`) with a ratchet note in AGENTS.md.
6. **Per-folder AGENTS.md**: author a lean one (one screen max) for each major
   source folder whose purpose isn't obvious from its name.
7. **Validate**: install with their package manager, then typecheck + lint +
   test all green.
8. **Commit the adoption as one commit** (including `.copier-answers.yml` —
   the update relationship needs it git-tracked), then prove the
   relationship: `uvx copier update --pretend --defaults` runs clean.

## Notes

- Every deviation from a template pin is debt with a paper trail: ratchet
  comment at the site, target in AGENTS.md.
- Never edit `.copier-answers.yml` by hand.
