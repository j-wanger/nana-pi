VERDICT: DONE

## Commit and delivery

One feature commit on `feat/seat-anatomy`, with explicit paths and a message file under `$TMPDIR`.
The final worker response records the full commit SHA, final-tip rechecks, push exit and draft PR.
CI covers the full suite; the builder does not wait for or read CI.

## Files and rows

Requirements preceded tagged tests and implementation in build 1. R-3640 through R-3648 map to T1 through T9.
The continuation changes no requirement or test assertion: it resolves build 1's private-helper blocker.

- New adapter and reporter: `apps/bench/lib/anatomy-seat.mjs`, `apps/bench/lib/anatomy-slots.mjs`.
- Shared bench code: `apps/bench/lib/anatomy-config.mjs`, `apps/bench/lib/anatomy-pulls.mjs`,
  `apps/bench/lib/anatomy.mjs`, `apps/bench/anatomy.mjs`.
- Shared readers: `packages/nana-pack/lib/memory-making.mjs`, `packages/nana-pack/lib/memory-score.mjs`,
  `packages/nana-pack/lib/claude-transcript.mjs`.
- Tests: `apps/bench/test/anatomy-seat.test.mjs`, nine must-meets plus two policy seals.
- Contracts: `REQUIREMENTS.md`, `apps/bench/README.md`.
- Generated: `docs/code-map.md`, `docs/requirements-tree.md`.
- Authorized archive edit: one newest entry in `docs/sessions/2026-10.md`; older entries are unchanged.
- Evidence: this folder's `builder-golden.json`, `wrong-main.txt`, `mutations.txt`, `touched-tests.txt`,
  `literal-audit.txt`, and the named checker outputs.

No existing test was edited or deleted. The literal audit searched repository tests and checkers before narrowing edits.
The builder regression uses main-code golden extraction, plain report and labelled report on synthetic fixtures.
It passes within T9, alongside the third-adapter contract and stub labelling checks.

## Wrong code and mutation pairs

`wrong-main.txt` preserves build 1's main-code run: all eleven new checks failed, exit 1.
The continuation reran eleven code mutations in OS temp, each red against its named check and restored green.
No assertion was inverted. The copied modules and mutation driver stayed outside the checkout.
`mutations.txt` records the exact source substitutions and both test outputs.

| Check | Wrong code | Red | Restored |
|---|---|---|---|
| R-3640 / T1 | Read metadata instead of systemPrompt | 1 | 0 |
| R-3641 / T2 | Disable segment boundaries | 1 | 0 |
| R-3642 / T3 | Count inherited parts as new | 1 | 0 |
| R-3643 / T4 | Retain duplicate hook representation | 1 | 0 |
| R-3644 / T5 | Drop tool-result chars | 1 | 0 |
| R-3645 / T6 | Exclude oversize payload from kind totals | 1 | 0 |
| R-3646 / T7 | Misreport labels as estimated | 1 | 0 |
| R-3647 / T8 | Put private session id in public context id | 1 | 0 |
| R-3648 / T9 | Change default builder adapter | 1 | 0 |
| R-3640 extraction seal | Retune start vocabulary | 1 | 0 |
| R-3644 class seal | Retune other-tool function | 1 | 0 |

Summary: `mutation pairs: 11/11 red 1 and restored green 0`.
One exploratory oversize mutation changed only recorded-input totals, leaving the unknown tools payload intact.
It survived (red-run exit 0); the final mutation removes oversize parts and fails T6. Assertions stayed unchanged.

## Commands and exit codes

All long output is in the corresponding committed text file here.

- `npm run map:impact -- packages/nana-pack/lib/memory-making.mjs apps/bench/lib/anatomy-seat.mjs`: 0.
- Repository literal audit with `git grep`: 0.
- `node scripts/test.mjs anatomy-seat.test.mjs anatomy.test.mjs anatomy-labels.test.mjs memory-making.test.mjs memory-shaping.test.mjs memory-replay.test.mjs writing-trial-extractor.test.mjs`: 0.
  The substring filter also selects the existing context-anatomy test.
  `8 files: 8 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 140 pass, 0 fail, 0 skip`.
- OS-temp mutation driver: 0, eleven red/restored-green pairs.
- `npm run map`: 0; `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `NODE_NO_WARNINGS=1 node scripts/requirements-trace.mjs`: 0.
- `npm run req:tree`: 0; `node scripts/requirements-tree.mjs --root .`: 0.
- `NODE_NO_WARNINGS=1 node scripts/known-bugs.mjs --root .`: 0.
- `nana-writing` on the isolated authorized session entry in OS temp: 0, zero findings.
- `node scripts/lane-class.mjs --root . --files <explicit changed paths>`: 0, `ordinary`.
- `git diff --check`: 0.
- `node scripts/identity-scan.mjs --root .`: run after staging, then again on the final commit.

The final response records last-commit rechecks and delivery, rather than changing this report after the push.
No full local suite or install check ran: CI covers the suite, and the lane remains ordinary.

## Precedent and departures

All named precedent files were read. The adapter uses the existing transcript walker and streaming parser,
`segmentPart`, the shared pull classifier, `ownerTurn`, `textOnly`, and the model-label and report readers.
It adds no second transcript walker or JSONL parser. The CLI guards output before extraction and prints fixed errors.

- Authorized departure: export `textOnly` from `memory-making.mjs` unchanged in behavior and import it in the seat adapter.
  The duplicate `messageText` is deleted. Existing callers still use the same helper.
- Planned exports, not departures: `ownerTurn` stays in `memory-making.mjs`; `rows` stays in `memory-score.mjs`.
  `callClasses` factors the existing builder classifier in `anatomy-pulls.mjs` as planned.
- `rows` gains default-off `allowDuplicates` for normalized correction-key deduplication and conflict accounting.
  Existing score callers retain duplicate-label refusal.
- Unknown attachment types aggregate into the safe `attachment-other` coverage bucket instead of exposing arbitrary type names.
  Privacy takes precedence over per-unknown-type reporting.
- Equal physical copies need a representative beyond identical timestamp/session/UUID tuples.
  A private content-derived key chooses it without depending on enumeration order.
- Only the seat maps tool listings through the existing opaque `toolsAdded` splitter.
  The builder splitter and its reports stay unchanged; the golden includes multi-paragraph builder tools.
- Build 1 corrected hand-counted fixture lengths and used the precedent's actual notification wrapper before acceptance.
  No existing test was changed, and the preserved main-code run still fails all eleven new checks.

## Known bugs touched and retained

- Rule-function agreement remains below the stated bar; seat function shares remain non-findings.
  Deterministic seat kind totals count all payload independently, including glue and oversize text.
- Shared label readers still mask only each unit's own cwd and branch, not arbitrary home paths.
  All-path privacy checks concern stdout/stderr, not permission to publish private stores or send them to a model.
- Shared `report --labels` retains its documented empty-normalized exclusion and denominator limitation.
  The new kind totals do not inherit that exclusion.

The sparse-label agreement, old-build splitting, heading/table/staged-separator assembly bugs,
label-resume limitations and historical agreement-study limitations are not fixed.
No known-bug file was edited. Builder-drop-owned assembly functions and its README paragraph are unchanged.

## Not done

The seat's private real-transcript baseline and live `/context` comparison remain seat steps before final review.
They cannot be performed by this synthetic-only builder. No `seat-counts.md` is fabricated.
Optional model labelling remains outside this build; every label run here used an injected stub.
No real transcript, memory file or owner text was read or copied into the repository.
No model session, subagent or GitHub issue operation was performed.
The two forbidden temp roots were not written. No local full suite or CI inspection was performed.
