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
standard general-engineering block (`Part G` — sealed tunables
with provenance, the six-tag module header, named exports, injected resources,
layer direction, the code map, the README contract), the `// req: R-nnn` trace
check in the suite, and `scripts/code-map.mjs` with `--check` wired into post-edit checks on code edits (`pnpm map:check`) plus the README check on README edits. Run `--impact` yourself before touching a mapped module.

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

4. **The first two project steps**:
   1. Ratify `OBJECTIVE.md`: ask the owner for one objective line and one current-priority line; write their words over the placeholders and DRAFT suffix, fill `<date>`, and never invent either line.
   2. Trust the folder: `nana-setup trust <dir>`.
5. Then complete the other printed next steps: `git init` + first commit,
   `pnpm install`, `pnpm check` (typecheck + lint + test + readme:check), commit the lockfile —
   and confirm `pnpm check` is green before handing over.
6. **The first real step after scaffolding is writing the project's first
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
