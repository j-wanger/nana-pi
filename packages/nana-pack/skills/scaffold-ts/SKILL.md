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

It also ships the **requirements-first** rail: a `REQUIREMENTS.md` with the
standard general-engineering block (`Part G`, G-001 to G-012 — sealed tunables
with provenance, the six-tag module header, named exports, injected resources,
layer direction, the code map, the README contract), the `// req: R-nnn` trace
check in the suite, and `scripts/code-map.mjs` with `--check` and `--impact`
wired into the post-edit checks (`pnpm map:check` / `pnpm map:impact`).

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
   uvx copier copy --defaults --data language=typescript --data project_name="<name>" --data description="<one-liner>" https://github.com/j-wanger/nana-pi.git <destination>
   ```

   (One line on purpose — it must work in PowerShell too, where bash's `\`
   continuation breaks.)

4. Then complete the printed next steps: `git init` + first commit,
   `pnpm install`, `pnpm check` (typecheck + lint + test), commit the lockfile —
   and confirm `pnpm check` is green before handing over.

5. **The first real step after scaffolding is writing the project's first
   requirement rows** — `Part G` arrives filled in, the product rows are empty.
   Use the `requirements` skill: one EARS `shall` row per behaviour the project
   promises, each `planned` until a test with a `req:` marker pins it. Do this
   before the first feature, not after.

## Notes

- The generated project records its template version in `.copier-answers.yml`;
  `uvx copier update` inside the project re-syncs it when the template evolves.
  Never edit that file by hand.
- Don't override the template's tool configs during scaffolding — deviations are
  per-project edits after generation, so `copier update` can surface drift.
