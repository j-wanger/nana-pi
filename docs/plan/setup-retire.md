# Plan: setup-retire (reduction batch 2)

Feature: FEAT-013 · Install and connect harness runtimes

## Purpose

The owner, 2026-11-07, batch-2 picks: cut the verifier-pipe Claude Code hook ("Verifier-pipe hook") and the unused pi extensions handoff, post-edit and notify ("Unused pi extensions"), keeping adoption ("Adoption should be kept"); cut the pi-subagents seeds ("Unused installs"). Evidence (seat inventory, 2026-11-07): the verifier hook has been an owner-chosen exit-0 stub since 2026-10-20; handoff has had no write or pickup since 2026-09-28; post-edit never runs in lane folders (1,030 project-config-ignored events, no post-edit events); notify has 0 events; the pi-subagents seeds have no use (FINDINGS #54: loads in lanes, injects nothing).

Not in this lane: the four Claude skills (spec, py-lint, py-review, py-test). The owner first picked them as unused; after the inventory's challenger found pi builders still read them in Python projects, the owner chose to keep all four (2026-11-07).

## Assumptions

- A1. Adoption detection (journal `directory_unadopted` once a day for an unadopted git repo) survives in a small extension of its own (or the handoff extension trimmed to only that), with `lib/adoption.mjs`, the nana-adoption hook and its tests unchanged.
- A2. `lib/pipe-guard.mjs` stays: the pi gate uses it. Only the Claude Code verifier hook, `lib/verifier-hook.mjs`, its settings wiring and doctor rows go.
- A3. Install removes a still-wired verifier hook and a seeded pi-subagents config it wrote earlier, the way the seat-pull-off lane retired the knowledge hook; doctor reports a still-wired retired hook with a fix line.
- A4. A nana-pack.json (user or project) that still holds `postEdit` or `handoff` sections loads without error and ignores them.
- A5. The install check's post-edit leg and pi-subagents retry go with them.
- A6. This is a hook and install lane: the local macOS install check runs before the land. One reviewer plus CI.

## Open choices

- O1. Builder decides between a new adoption-only extension and a trimmed handoff extension, following the smallest existing extension.

## Questions for the owner

None.

## Threat model

Honest variation in machines' installed state (old hooks, old seeds, old config sections), Windows and macOS. Forgery out.

## Precedent

- `packages/nana-setup/tests/seat-pull-off.test.mjs`: the latest hook retirement (install removes, doctor fails with a fix line).
- `packages/nana-setup/lib/steps.mjs`: `stepSubagentConfig` (around line 756) and the HOOKS list.
- `packages/nana-pack/extensions/nana-handoff.ts`: the adoption journaling to keep (around line 57).
- `packages/nana-pack/lib/pipe-guard.mjs`: stays; the gate's tests must keep passing.

## Outside precedent

none: removal of in-house hooks and extensions.

## Must-meet

- M1 (verifier hook retired). After `nana-setup install`, settings.json has no verifier-pipe hook entry and the hook file is not installed; on a machine where it is still wired, doctor shows a failing row naming the retired hook and the fix `nana-setup install`.
- M2 (extensions gone, pi starts). The pack has no handoff, post-edit or notify extension; a pi session loads the pack and completes a turn on macOS and Windows (the install check's pi turn passes).
- M3 (adoption kept, adversary 3). Loading the pack through pi's real extension discovery, two session starts in an unadopted repo and its subdirectory, then the real SessionStart hook with no seeded journal entries: exactly one event for the canonical root in the user journal, none in a project override journal, and that root in the hook's output; after 25 hours exactly one more event; an adopted repo produces neither events nor output.
- M4 (gate kept). The pi gate's existing pipe-guard and gate tests pass unchanged.
- M5 (pi-subagents seeds gone). Install writes no subagent config or reviewer agent seed and removes the ones it seeded before; doctor has no pi-subagents rows; the install check passes without its pi-subagents retry.
- M6 (old config). A user and a project nana-pack.json that still hold `postEdit` and `handoff` sections load without error, warning or gate fallback.
- M7 (docs and checks). The AGENTS runtime table, the pack and setup READMEs no longer list the removed parts; the cut rows are `retired`; map, readme, tree and component-audit checks are green.
- M8 (adversary 1: edited seeds kept). Retiring the pi-subagents seeds removes only unchanged seeds: an edited seed that keeps nana's marker, a foreign file and a symlink (and its target) stay byte-identical, including under a dry run.
- M9 (adversary 2: uninstall straight after update, old hook forms). On an old-home fixture, uninstall without a prior install removes installer-owned verifier wiring and unchanged retired seeds, keeps foreign hooks and raises no missing-seed-source error; install against the released POSIX-shell and Windows-exec verifier forms leaves zero managed verifier entries and sibling hooks unchanged.
