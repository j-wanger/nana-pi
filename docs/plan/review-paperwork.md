# Plan: review-paperwork (reduction batch 1, lane 2)

Feature: FEAT-007 · Review a specific revision independently

## Purpose

The owner, 2026-11-07, batch-1 pick "Review paperwork": remove the review-ledger keep step, the tree-movement page, round caps and their over-cap reasons, and the per-lane review folder as a required artifact. nana-land then checks one thing about review: a verified LAND verdict covers the tip, plus CI (and its existing clean-merge path). The local suite fallback stays (owner kept the local suite outputs).

## Assumptions

- A1. The review store (`~/.pi/agent/review-ledger*.jsonl`, reservations, lock) stays under its current names: nana-land reads it and every recorded LAND lives there (removal map, coupling 2). Only the round cap and the paperwork leave `review-round.mjs`.
- A2. `review-ledger run`'s job (admit, spawn, record the verdict, release) moves into `claude-review.mjs` or a `lib/` module it calls; `bin/review-ledger.mjs` and its package bin entry go.
- A3. `defaultGit` and `MAX_GIT_BUFFER` move from `scripts/requirements-moved.mjs` to a small shared module before that file goes (coupling 5).
- A4. The reviewer's known-bug section is chosen from the brief's `Feature:` line only (coupling 6).
- A5. The memory factory, which reads committed review folders, degrades quietly without them; batch 2 pauses it anyway.
- A6. `--over-cap` is refused by both launchers with a message that round caps were removed.
- A7. The dirty-tree `+snap` review identity is out of scope here.
- A8. This lane runs under one reviewer plus CI.

## Open choices

- O1. Builder picks the home for the moved run logic and the git helpers, following the nearest lib module.

## Questions for the owner

None.

## Threat model

Honest variation in our tools' output, old store records and Windows paths are in scope. Deliberate forgery of review records is out; nana-land no longer checks kept review text integrity.

## Precedent

- `packages/nana-pack/bin/review-ledger.mjs` (`run`, lines 149–235): the logic moving into claude-review.
- `packages/nana-pack/bin/review-round.mjs`: the store kept; cap code removed.
- `packages/nana-pack/bin/nana-land.mjs` (`checkRecords`, lines 215–243): the review check simplified.
- `docs/plan/review-paperwork/removal-map.md` group 2: every file, test, row and checker to touch.

## Outside precedent

none: in-house process removal.

## Must-meet

- M1 (claude-review alone). `claude-review` launches the reviewer, records a verified version-2 verdict for the revision and exits with the reviewer's status, and no `review-ledger` process starts; `review-ledger` is gone from the package's bin list. Proves the Claude reviewer survives the ledger's removal.
- M2 (no tree movement). Neither launcher's reviewer prompt contains a tree-movement section, and the known-bug section comes from the brief's `Feature:` line. Proves reviewers lose the paperwork, not the known bugs.
- M3 (no round cap). A fourth review of the same item starts and records without any extra flag; `--over-cap` on either launcher exits non-zero with a message that round caps were removed. Proves the cap is gone.
- M4 (land on LAND plus CI). nana-land lands a tip with a verified LAND record and passing CI when no kept review text exists, and prints no "review text relied on" or kept-text note; it still refuses a tip with no LAND, a non-LAND verdict on the same revision, a review in flight or an uncovered commit. Proves the land gate kept its teeth.
- M5 (old store). nana-land and both launchers read a store holding pre-lane records (over-cap fields, kept-text references, round numbers) without error, on macOS and Windows path spellings. Proves no machine's review history is orphaned.
- M6 (helpers rehomed, files gone). `scripts/requirements-moved.mjs`, `lib/review-movement*.mjs` and `bin/review-ledger.mjs` do not exist; blast-radius, component-audit, deliverables and product-report produce the same output as before on the repo; map, readme, tree, component-audit and runner-list checks are green.
- M7 (rules). The shared working pattern, AGENTS.md's marker region and project section, both OBJECTIVE files, the seat guide, the pack README and the requirements skill no longer mention `review-ledger keep`, tree movement, round caps, an over-cap reason or a required review folder; the marker region still equals the shared file.
- M8 (adversary 1: drift during a Claude review). With legacy records seeded, HEAD changes while the Claude reviewer runs and then returns LAND: the launcher exits non-zero, no verified LAND exists for either revision, the reservation is removed, legacy records are unchanged and nana-land refuses. Proves the move keeps the locked recheck.
- M9 (adversary 2: land's final recheck). After nana-land's first review check passes, a same-revision non-LAND record or a live reservation appears during CI verification: nana-land refuses, main is unchanged and no merge happens. Proves the simplification keeps the second locked check.
- M10 (adversary 3: Windows launch and credential sealing). On Windows, the real Node launcher with only a `claude.cmd` fixture on PATH, spaced checkout, settings and output paths and hostile credential settings: the fixture receives intact arguments and prompt, the effective settings disable credential dispatch, LAND records, and temporary settings are removed. Proves the moved run logic keeps the Windows path and the credential strip.
