# biome-pin · must-meet (seat, 2026-10-22, after one adversary pass; urgent fix, ships alone)

Feature: FEAT-014 · Create or adopt a project workspace

Class: ordinary (the TypeScript template's package.json, the adopt-ts skill's devDependency sentence, the render test, the ledger). Ladder: the seat's wrong-code pairs, one final reviewer from another model family, CI on the lane's draft PR. Builder: the small builder. Threat model: honest variation in scope — a new upstream Biome release with new formatters or rules, a machine without pnpm, scaffold and adopt renders; deliberate forgery out (a hand-edited rendered package.json).

## What broke

Biome 2.6.0 (2026-10-21; 2.6.2 the same day) formats Markdown and YAML. The TypeScript template pins `"@biomejs/biome": "^2.0.0"`, so a fresh scaffold installs 2.6.x and its own `pnpm lint` (`biome check .`) fails. The render test's check (`pnpm dlx @biomejs/biome check .`) runs whatever Biome is newest, so main's suite went red on every platform once pnpm resolved 2.6.x: report-deliverables' CI at 2e8da63e failed on Linux and macOS, and two builds' full suites failed in templates-render.

Seat probe, a fresh `--vcs-ref HEAD` TypeScript render at main 09e38e7d:
- Biome 2.6.2: 27 files checked, 9 errors, all formatting: `.copier-answers.yml` (copier writes it), `AGENTS.md`, `HANDOFF.md`, `OBJECTIVE.md`, `REQUIREMENTS-general.md`, `REQUIREMENTS.md`, `docs/code-map.md` (the code-map generator writes it), `src/AGENTS.md`, `tests/AGENTS.md`.
- Biome 2.5.15 (2026-09-30, the last 2.5 release): 14 files checked, 0 errors, 1 info (a deprecated key in `biome.json`).

## Seat decisions

- **D1 · Pin, do not chase the formatter.** The template pins `@biomejs/biome` to the exact version 2.5.15. Two of the nine files are written by other tools, so reformatting the template's own files would not make a scaffold pass 2.6, and the next Biome release could break it again. A caret range on a linter makes "a fresh scaffold passes its own lint" false whenever upstream adds a rule. Adopt mode renders the same package.json, but the adopt-ts skill then tells the agent to add missing devDependencies through the project's own package manager, which would write `^2.6.x` (adversary M1). The skill's sentence changes to: add each missing devDependency at the exact version the rendered `package.json` names, so an adopted project keeps Biome 2.5.15; a project that already has Biome keeps its own (known limit).
- **D2 · The check lints with the pinned version.** The render test parses the rendered `package.json` once; that one read feeds both R-2559's assertion and the Biome probe and check (adversary S1: a bad read must turn R-2559 red, not make the probe skip quietly). It runs `pnpm dlx @biomejs/biome@<that version>` for its probe and its check, so it tests what the scaffold installs, not the newest release. The check keeps its title and its skip when pnpm cannot resolve Biome; it stays outside R-858, as its comment says.
- **D3 · Moving to 2.6 is a later lane.** It needs a decision on Markdown and YAML formatting (scope them out in `biome.json`, or format the generated files), and the deprecated config key. Known bug.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2559 | The TypeScript template shall pin `@biomejs/biome` in the rendered `package.json` to the sealed exact version 2.5.15. | `packages/nana-pack/tests/templates-render.test.mjs::R-2559: a fresh TypeScript scaffold pins Biome to the sealed exact version 2.5.15` |

### What the test does, and why it is red on main

- **R-2559.** Reads `devDependencies["@biomejs/biome"]` from the rendered `package.json` of the TypeScript scaffold render and of the adopt render the file already makes (S3), under the one marker; each must equal the string 2.5.15 exactly (no `^` or `~`). The scaffold's value is the one the Biome check uses. Red on main: `^2.0.0`.

## Tunables

- `"@biomejs/biome": "2.5.15"` in `templates/typescript/template/package.json.jinja` — chosen: the last release before Biome formatted Markdown and YAML (2026-09-30); a fresh render passes `biome check` with it (seat probe, 2026-10-22). Sealed by R-2559.

## Known limits (carried to FEAT-014's known-bug file)

- The scaffold stays on Biome 2.5 until a later lane decides how 2.6 treats Markdown and YAML.
- `biome.json` uses a key Biome 2.5.15 reports as deprecated (info, not an error).
- The Python template's `ruff>=0.11` has the same open range; a new ruff rule could fail a fresh scaffold the same way.
- The check still runs only where pnpm resolves Biome, and runs `pnpm dlx`, not the scaffold's installed `pnpm lint` (R-858 stays untested); the seat runs template acceptance, which does run the installed lint.
- An adopted project that already has Biome keeps its own range. The skill sentence is prose; no test proves an agent follows it.
- An existing project updated with `copier update` must run `pnpm install` once to move its lockfile to 2.5.15.

## Seat steps

- One build with the small builder. Wrong-code pairs: the caret range back; the adopt render alone left on `^2.0.0` (a template conditional); the version read from the wrong key; the check without the version (`pnpm dlx @biomejs/biome`), which goes red while the newest Biome fails a fresh scaffold. A literal version in the check cannot go red while R-2559 holds (S2); the reviewer judges it.
- The seat runs `npm run template:accept` on the final tip (scaffold and adopt: `pnpm install`, then the scaffold's own `pnpm check`); the CI release job runs it before tagging.
- CI on the draft PR: all three suite legs green, with templates-render passing.
