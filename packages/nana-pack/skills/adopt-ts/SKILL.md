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
- nana-pi checkout at `~/nana-pi` (the repo root is the copier src; ask where
  nana-pi lives if not).

## Steps

1. **Scan**: package.json (scripts, deps, module type), tsconfig(s), existing
   lint/format stack (ESLint/Prettier/Biome), test runner, layout, CI. Note
   whether the project is ESM or CJS and whether `strict` is already on.
2. **Present the plan and get an OK** — what lands (tsconfig pins, biome.json,
   `.pi` post-edit preset, CI, root AGENTS.md, answers file), what gets merged
   (their package.json fields/deps with the pinned scripts + devDeps), what is
   never touched (source tree and tests). If they run ESLint/Prettier, the
   plan must say so explicitly: Biome replaces them only with the user's OK —
   otherwise keep their linter by adding `-x biome.json` to the overlay
   command in step 3 and recording the deviation in AGENTS.md (a future
   `copier update` may re-emit the file — delete it again; the note stays).
3. **Overlay**:

   ```bash
   uvx copier copy --defaults --overwrite --data language=typescript \
     --data adopt=true \
     --data project_name="<name>" \
     ~/nana-pi .
   ```

   Adopt mode emits configs only: package.json, tsconfig + tsconfig.build,
   biome.json, CI, root AGENTS.md, `.pi/nana-pack.json`,
   `.copier-answers.yml`. No README/src/tests starters, no pnpm-workspace.
4. **Reconcile from `git diff`** — merge THEIR content into OUR structure:
   - `package.json`: restore their fields (name, version, deps, engines, bin,
     exports…); merge scripts — keep theirs where names collide, add the
     pinned `typecheck`/`lint`/`format`/`test`/`check` set, and rewrite
     `check` to their package manager. Add the missing devDeps
     (typescript/biome/vitest/@types/node) via THEIR package manager so the
     right lockfile updates.
   - `tsconfig.json`: the pinned strict base lands; carry over compiler
     options their build genuinely needs (jsx, paths, outDir, lib). CJS
     projects: `module`/`moduleResolution` stay theirs — record the deviation.
   - `tsconfig.build.json`: adapt to how they actually build (outDir/rootDir/
     excludes), or drop it if they build another way — record which.
   - `.gitignore`: union of theirs and the template's.
   - `.pi/nana-pack.json`: rewrite the `pnpm exec` runner prefixes to their
     package manager (npm → `npx`, yarn → `yarn exec`) — until this is done,
     every edit fires failing post-edit commands. Merge any pre-existing
     postEdit list.
   - CI: adapt the workflow to their package manager; if they already have CI,
     merge the `check` step into it instead of adding a duplicate workflow.
   - `AGENTS.md`: fold existing AGENTS/CLAUDE.md content in, write the real
     Layout section, fix Commands to their package manager, one screen.
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
   relationship: `uvx copier update --pretend` runs clean.

## Notes

- Every deviation from a template pin is debt with a paper trail: ratchet
  comment at the site, target in AGENTS.md.
- Never edit `.copier-answers.yml` by hand.
