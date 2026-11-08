# Plan: setup-tail

Feature: FEAT-013 · Install and connect harness runtimes

## Purpose

A fix that restores agreed behaviour after setup-retire (landed 2026-11-08). The setup-retire review (round 1, LAND) found that the post-edit extension is gone, but parts of nana-pi still present post-edit checks as working:

- `nana-setup project --check` warns "configure real postEdit.commands" and exits 1 with no commands, and with commands it reports "N effective checker command(s)" that never run.
- The adopt-py, adopt-ts and adopt-structure skills call an adoption ready only when that check exits 0, and present a `.pi` "post-edit gate" or "preset".
- `nana-setup project` still writes the `{"postEdit":{"commands":[]}}` starter (`PACK_STARTER`).
- Both templates ship `.pi/nana-pack.json.jinja` with "post-edit gates".
- `requirements/SKILL.md` says "The post-edit check runs `--check` for you".

An agent in a scaffolded project would assume those checks run after each edit and skip them. The same review found three smaller gaps, fixed here too:

- Four install-check matcher cases for still-live code (`matches()` in `install-check.mjs`, R-1074) were deleted rather than moved.
- Uninstall straight after an update leaves the dangling `~/.claude/hooks/verifier-pipe.mjs` link.
- Dead leftovers remain: `PI_SUBAGENTS_FLOOR`, the parsed but unread `notify` config block, and `nana-handoff` in the prompt-section order list.

## Assumptions

- A1. Post-edit becomes advisory text only where a project still wants the checks: the skills and templates tell agents to run the project's checks (lint, types, tests, map check) themselves before committing. Nothing claims they run automatically.
- A2. `project --check` no longer judges `postEdit` at all. An existing `.pi/nana-pack.json` with `postEdit` still loads without error (setup-retire M6), and project setup writes no `postEdit` starter. If `.pi/nana-pack.json` then has no other use, it is not written.
- A3. Templates drop the `postEdit` block. If a template's `.pi/nana-pack.json.jinja` then holds nothing, it is removed, with a copier update path that leaves an existing project's file alone.
- A4. The four matcher cases return, pointed at a SessionStart hook that still exists (for example `startup|resume`, `startup, clear`, `^startup$`, `NotStartup`).
- A5. Uninstall removes a dangling retired-hook link under `~/.claude/hooks/` that points into a nana-pi checkout, and only such a link.
- A6. Lane IDs R-3885 to R-3891. One reviewer plus CI. This touches setup and templates, so the macOS install check and the template check run before the land.

## Open choices

- O1. Builder decides whether `.pi/nana-pack.json` survives in templates at all, following what else reads it (gate patterns and trust).

## Questions for the owner

None.

## Threat model

Honest variation in projects' existing `.pi` files, old installs and copier update histories. Forgery out.

## Precedent

- `packages/nana-setup/lib/project.mjs`: `PACK_STARTER` and the `--check` judgement.
- `packages/nana-pack/skills/adopt-structure/SKILL.md`: the adoption steps that name the post-edit on-ramp.
- `templates/python/template/.pi/nana-pack.json.jinja`: the template block.
- `packages/nana-setup/lib/uninstall.mjs`: uninstall's link handling.
- `packages/nana-setup/tests/install-check.test.mjs`: where the matcher cases lived.

## Outside precedent

none: in-house setup text.

## Must-meet

- M1 (no post-edit claims). No skill, template, README or setup output tells a user or agent that post-edit checks run after edits; a grep for the claim phrases over shipped files finds none outside history folders and retired rows.
- M2 (project check). `nana-setup project --check` exits 0 on a project with no `postEdit` config and does not mention `postEdit`; a project file that still holds `postEdit` loads without error and is not rewritten.
- M3 (scaffold and update). A fresh scaffold in both languages has no `postEdit` block; `copier update` from the previous release leaves an existing project's `.pi/nana-pack.json` unchanged, or removes only its untouched template copy.
- M4 (matcher cases). The four matcher cases run against a live SessionStart hook and fail when `matches()` loses its list-separator or regex branch.
- M5 (dangling link). Uninstall after an update removes a dangling `~/.claude/hooks/verifier-pipe.mjs` link into a nana-pi checkout and leaves foreign files and links alone.
- M6 (dead leftovers). `PI_SUBAGENTS_FLOOR`, the `notify` config block and the `nana-handoff` order entry are gone; an old config holding `notify` still loads without warning.
