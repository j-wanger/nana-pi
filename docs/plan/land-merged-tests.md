Feature: FEAT-031 · Run checks reliably and without contaminating work
Serves: owner 2026-11-09 — "Yes" to testing the merged result before a land, after red main 42549081547 came from two separately green lanes

# Plan: land-merged-tests

## Why

When main has moved since a lane's accepted tip, `nana-land` merges current main into the tip and, under the 2026-11-02 ruling, lands the merge with no new CI or tests when git finds no conflict. Git finds only line conflicts. On 2026-11-08 records-move (new test fixture without a `Serves:` line) and memory-sort (a stricter brief check) were each green alone; their conflict-free merge turned main red on every platform (run 42549081547). Each lane was developed before the other existed on main, so neither lane's CI could have seen the combination. 3 of the 12 main runs before this plan were red; each red main blocks every land until a fix lane lands.

## What changes

1. On the merge path only (`needsMerge` in `packages/nana-pack/bin/nana-land.mjs`), after the CI read passes and before the merge commit is written, `nana-land` checks the already-computed merged tree (`cleanMergeTree`'s result) out into a temporary folder and runs the pull-request test selection there: packs `land,module`, with `--changed-from` set to the merge base, so files changed by either the lane or main since the merge base select tests. It reuses the existing selector (`scripts/test.mjs` packs and `--changed-from`); no new selector.
2. A failing run refuses the land, names the failing test files, and leaves main unchanged. The temporary folder is removed on pass, fail and error.
3. The fast-forward path (main has not moved) is unchanged: no extra run.
4. The land record gains the merged-test duration, so the cost is measured.
5. The 2026-11-02 ruling and its two copies (the shared working section in `templates/_shared/working-under-nana-pi.md`, mirrored in `AGENTS.md`) change from "lands without new CI or review" to "lands without new review after `nana-land` runs the pull-request test selection for both sides on the merged tree". The owner approved this on 2026-11-09.

The pack list and job count are tunables in `packages/nana-pack/lib/land-config.mjs` with provenance.

## Must-meet tests (R-3960–R-3965)

- M1 (R-3960): a merge where main's change breaks a test the lane added (no line conflict) is refused, naming that test file, and main's ref is unchanged.
- M2 (R-3961): a compatible merge lands, and the land record shows the merged-test run and its duration.
- M3 (R-3962): selection covers both contributions: a test selected only by a main-side change and one selected only by a lane-side change both run.
- M4 (R-3963): the fast-forward path runs no merged-test run.
- M5 (R-3964): the temporary checkout is removed after pass, failure and a thrown error; nothing is written to the main checkout or the lane worktree.
- M6 (R-3965): the ruling text in `nana-rulings.md`, the shared working section and `AGENTS.md` names the merged-tree test run, and no surface still says the merge lands without tests.

## Validation

- Real run: replay the 2026-11-08 failure. Branch from main's parent of 5ae28162's memory-sort merge with records-move's tip as main, and show the new land refuses naming `memory-run.test.mjs`.
- Real land of this lane itself through the new path if main moves meanwhile.
- Measure: merged-test seconds on that replay and on this lane's land.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs`: `cleanMergeTree` and `regenerateTree` already materialize a merged tree in a temporary folder for generators.
- `scripts/test-packs.mjs`: `--changed-from` selection with land and module packs.
- `packages/nana-pack/lib/land-config.mjs`: land tunables with provenance.
- `packages/nana-pack/rules/nana-rulings.md`: the 2026-11-02 ruling this replaces.

## Threat model

Honest variation in our tools' output and timing is in scope; deliberate forgery is out. A test that flakes in the merged run refuses the land; rerunning the land is the remedy, as for any flaky CI leg.
