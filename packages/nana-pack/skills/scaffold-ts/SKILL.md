---
name: scaffold-ts
description: Scaffold a new TypeScript project from the nana-pi copier template (pnpm + strict tsconfig + Biome + Vitest, folder-by-feature, nested AGENTS.md, post-edit gates). Use when the user wants to start/init/scaffold a TypeScript/Node project.
---

# Scaffold a TypeScript project

Generate from the nana-pi TypeScript template via copier. The template pins the
opinionated stack: pnpm, ESM + NodeNext, tsconfig `strict` plus
`noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`, Biome (lint+format,
cognitive-complexity cap 15), Vitest, folder-by-feature with lean per-folder
AGENTS.md files, and a `.pi/nana-pack.json` post-edit preset (biome fix on every
edit, 300-line file cap, `tsc --noEmit`).

## Steps

1. Need from the user (ask only for what's missing): destination directory and
   project name. Description is optional; the package name derives automatically.
2. The template src is the nana-pi repo,
   `https://github.com/j-wanger/nana-pi.git` — copier clones it at the latest
   v* tag, which is what `_commit` records and `copier update` + the generated
   CI drift job track. (A local checkout path works as src too, for template
   development.)
3. Run:

   ```bash
   uvx copier copy --defaults --data language=typescript \
     --data project_name="<name>" --data description="<one-liner>" \
     https://github.com/j-wanger/nana-pi.git <destination>
   ```

4. Then complete the printed next steps: `git init` + first commit,
   `pnpm install`, `pnpm check` (typecheck + lint + test), commit the lockfile —
   and confirm `pnpm check` is green before handing over.

## Notes

- The generated project records its template version in `.copier-answers.yml`;
  `uvx copier update` inside the project re-syncs it when the template evolves.
  Never edit that file by hand.
- Don't override the template's tool configs during scaffolding — deviations are
  per-project edits after generation, so `copier update` can surface drift.
