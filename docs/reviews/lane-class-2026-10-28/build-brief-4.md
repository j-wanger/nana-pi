Feature: FEAT-029 · Navigate code and investigate impact

Lane lane-class. Class: ordinary. Builder: pi-worker (small lane). Build session 4.

Build 3 at ccbd535e did the brief's three items, and the seat's check found one bug that blocks the lane, plus one smaller wording gap. Fix both. The seat's evidence is in `seat-check-ccbd535e.md` beside this brief.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## 1. The extension import hop (blocks the lane)

`extensionDirs` now returns folders that end in `/`, and `scripts/lane-class.mjs:58` still tests `p.startsWith(`${d}/`)`. That tests for `packages/nana-pack/extensions//`, so no extension module enters the hop starts. A library that only an extension imports now prints `ordinary`; at 602edced it printed `hook`. Examples: `packages/nana-pack/lib/pipe-guard.mjs` (imported by `nana-gate.ts`), `packages/nana-pack/lib/post-edit-config.mjs` (`nana-post-edit.ts`) and `packages/nana-stage/lib/sign.mjs` (`nana-stage.ts`).

- Fix the match so each manifest folder is joined to its files with exactly one `/`.
- The R-2963 check has no case where the importer is an extension; its only hook case goes through a launched CLI, which is why the suite stayed green. Add one: a library imported only by a pi extension prints `hook:` and names that extension. Use a real repo path, such as `packages/nana-pack/lib/post-edit-config.mjs` and `packages/nana-pack/extensions/nana-post-edit.ts`, or a fixture if the real graph is not stable enough. No new row; R-2963 already says it.

## 2. Every plan section as a heading

`packages/nana-pack/prompts/planner.md:27` now says to write Precedent and Outside precedent as same-level `##` headings. A plan with no Outside precedent and a bold **Must-meet** line after `## Precedent` still merges and is refused: the parser reads its rows as Precedent entries. Change the sentence so every plan section, from Purpose to Must-meet, is a `##` heading, and pin the new sentence in the R-2954 check in place of the old one. Keep the refused-sample case.

In the same edit, the nana-pi project-section line in AGENTS.md says `--files <planned files>`; make it `--files <comma-separated planned files>`, and move the R-2969 pin with it.

## Done when

The same checks as build brief 1, and the report names: the line you changed in the script; the new R-2963 case's title and the two paths it uses; the new planner sentence; the class the script prints for `packages/nana-pack/lib/pipe-guard.mjs` on its own.

## Precedent

- `scripts/lane-class.mjs:35-60`: `extensionDirs` and the hop-start set.
- `packages/nana-pack/tests/lane-class.test.mjs:53-57`: the R-2963 check this build extends.
- `packages/nana-pack/prompts/planner.md:27`: the sentence this build widens.
- `packages/nana-pack/tests/planner-prompt.test.mjs`: the R-2954 check whose pin moves.
- `packages/nana-pack/tests/rulings.test.mjs`: the R-2969 check whose pin moves.
