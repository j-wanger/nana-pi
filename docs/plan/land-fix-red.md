# Plan: land-fix-red

Feature: FEAT-008 · Integrate and clean up reviewed changes

## Purpose

A fix that restores agreed behaviour. The standing rule says: when main's push run is red, land nothing else until the fix lands. nana-land enforces the first half but not the second: it refuses every land while main is red, the fix included (`packages/nana-pack/bin/nana-land.mjs`, the `mainCi` check in the CI stage). On 2026-11-08 this deadlocked main. The owner picked "Fast-forward the fix", and the seat fast-forwarded the reviewed, CI-green fix (data-pack-m8) by hand. This lane lets nana-land land the fix itself, so no hand step is needed again.

## Assumptions

- A1. The seat names the red run the lane fixes: `nana-land merge … --fixes-red <run-id>`. nana-land accepts the land while main is red only when `<run-id>` is main's newest push run for the current main tip and that run is red. Every other check is unchanged: review coverage, the lane tip's own passing CI, clean merge rules, local suite fallback.
- A2. Without the option, a red main still refuses every land, exactly as today.
- A3. The land record names the red run it fixed.
- A4. The ruling text and the shared working pattern's land checklist gain one clause: the fix lands through nana-land with `--fixes-red`.
- A5. One reviewer plus CI. This changes the land tool, so the macOS install check runs before the land.

## Open choices

- O1. Builder decides the option's exact spelling and its record field, following the existing `--reviewed` parsing.

## Questions for the owner

None.

## Threat model

Honest variation in main's CI state (red, green, unfinished, newer runs). A seat naming a run it did not fix is out of scope; review covers what the lane changes.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs`: option parsing and the `mainCi` check in the CI stage.
- `packages/nana-pack/lib/main-ci.mjs`: `mainCi`, which reads main's newest push run.
- `packages/nana-pack/tests/land-ci-read.test.mjs`: land tests with injected `runGh`.
- `packages/nana-pack/rules/nana-rulings.md`: the 2026-11-02 land ruling to extend.

## Outside precedent

none: in-house land tool.

## Must-meet

- M1 (fix lands). With main's newest push run red, `nana-land merge --fixes-red <that run id>` lands a reviewed lane whose own CI passed, and the land record names the run.
- M2 (still refuses without it). With main red, the same land without `--fixes-red` refuses, naming the red run, and main is unchanged.
- M3 (wrong run refused). `--fixes-red` naming a run that is not main's newest push run for the current tip, or a run that is green or unfinished, refuses, and main is unchanged.
- M4 (green main unchanged). With main green, `--fixes-red` is refused as unnecessary, and a land without it behaves exactly as today.
- M5 (rule text). The ruling and the land checklist in the shared working pattern name `--fixes-red` as the way the fix lands; the rule tests that pin their wording are updated with their rows.
- M6 (adversary 1: unreadable is not red). With the named run's jobs or records unreadable, the land refuses with a named evidence-read refusal, records no fixed run, and leaves main unchanged.
- M7 (adversary 2: the authorization stays current). If the named run gains a newer attempt, or main gains a newer push run, before the final merge, the land refuses with a changed-main-CI refusal on both the fast-forward and clean-merge paths, and leaves every ref and checkout unchanged.
- M8 (adversary 3: only the red-main gate is waived). With a valid `--fixes-red`, each other refusal still fires with its own message and main unchanged: an uncovered commit, a review not LAND, a failed newest lane workflow, a missing required macOS job, a failed local-suite fallback, and a non-generated merge conflict.
