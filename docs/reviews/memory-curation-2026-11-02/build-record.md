# Memory curation — build 1 technical record

## Scope and result

Feature FEAT-040; subgroup SUB-027; artifact A-100. The build serves the current priority to carry learning into later work. The lane classifier says `ordinary` (see lane-class.txt). No real profile, store or paid model was used. Fixtures use OS temporary directories and local bare Git transport.

Implemented rows R-3560–R-3577, in must-meet order followed by ten seals. R-3578 and R-3579 remain unused. The requirement diff preceded test authoring and implementation. A-090 and A-093 name the curation event maker; A-100 names its private maker and reader. No cross-feature shares changed.

## Files

- `packages/nana-pack/lib/memory-curation-config.mjs`: sealed grouping, spend, reason and queue limits, retirement classes, prompt, command detector, fields, private layout and words.
- `packages/nana-pack/lib/memory-curation.mjs`: shared-span unions, date-ordered batches, per-proposal validation, saved-survivor preference, immutable proposal/decision I/O, rejection memory, queue ordering, counts and size forecasts.
- `packages/nana-pack/bin/nana-curate.mjs`: guarded propose/queue/accept/reject, shared day reservations, model work outside clone ownership, batch persistence, all-prefix preflight, area-local events and transport disclosure.
- `scripts/memory-curate.mjs`: unchanged shaper runner adapter supplied at the boundary.
- `packages/nana-pack/lib/memory-store.mjs`: exported `writeStateEvent`; existing readers and merge behavior unchanged.
- `packages/nana-pack/lib/memory-making.mjs`: curation stretch detection; text-free skipped units use the shaper's existing counted skip path; the rule maker returns its skip count.
- `packages/nana-pack/tests/memory-curation.test.mjs`: seven behavior declarations and ten seal declarations, all awaited with per-case deadlines.
- `packages/nana-pack/tests/memory-making.test.mjs`: only the eighth must-meet added, covering LF, CRLF, trailing spaces/tabs and no final newline.
- `package.json`, root and pack README, `AGENTS.md`: command and consumer contract.
- `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`: rows, registry and generated navigation.
- `docs/sessions/2026-10.md`: only the specifically requested newest session entry.
- This review folder: red/green evidence, regression output and local check output. Plans and the brief are untouched.

No pre-existing test declaration or assertion changed. No test was deleted.

## Wrong-code pairs

| Rows | Wrong implementation / mutation | Test command | Red exit | Restored implementation | Green exit |
|---|---|---|---|---|---|
| R-3560–R-3566, R-3568–R-3577 | Main has no curator or curation seals | `node packages/nana-pack/tests/memory-curation.test.mjs` | 1; all 17 declarations fail in red-curation.txt | Guarded curator and seals | 0; 17 pass in green-curation.txt |
| R-3567 | Main extracts curation review answers | `node packages/nana-pack/tests/memory-making.test.mjs` | 1; only the new declaration fails in red-making.txt | Shared review-stretch skip | 0; 25 pass in green-making.txt |
| R-3563 | Disable only the code's overlapping-selection guard with `false &&`; assertions unchanged | `node packages/nana-pack/tests/memory-curation.test.mjs` | 1; accept declaration fails in red-overlap.txt | Restore guard before event writes | 0; all 17 pass |

The initial seal failures reflect missing implementation, not individual value mutations. No claim of an independent mutation campaign is made.

## Verification commands

Each exit code was read independently. This is not a full-suite run: CI covers the suite under AGENTS.md.

| Command | Exit | Result / output |
|---|---|---|
| `node packages/nana-pack/tests/memory-curation.test.mjs` | 0 | 17 pass; green-curation.txt |
| `node packages/nana-pack/tests/memory-making.test.mjs` | 0 | 25 pass; green-making.txt |
| `node packages/nana-pack/tests/memory-shaping.test.mjs` | 0 | 20 pass; regression-shaping.txt |
| `node packages/nana-pack/tests/memory-run.test.mjs` | 0 | 8 pass; regression-memory-run.txt |
| `node packages/nana-pack/tests/memory-run-recovery.test.mjs` | 0 | 7 pass; regression-memory-run-recovery.txt |
| `node packages/nana-pack/tests/memory-run-seals.test.mjs` | 0 | 16 pass; regression-memory-run-seals.txt |
| `node packages/nana-pack/tests/memory-session-end.test.mjs` | 0 | 5 pass; regression-memory-session-end.txt |
| `node packages/nana-pack/tests/profile-store.test.mjs` | 0 | 14 pass; regression-profile-store.txt |
| `node packages/nana-pack/tests/profile-store-guards.test.mjs` | 0 | 6 pass; regression-profile-store-guards.txt |
| `node packages/nana-pack/tests/profile-sync.test.mjs` | 0 | 2 pass; regression-profile-sync.txt |
| `npm run map`, then `npm run map:check` | 0, 0 | Generated map; map-write.txt, map-check.txt |
| `npm run readme:check` | 0 | readme-check.txt |
| `node scripts/requirements-trace.mjs` | 0 | requirements-trace.txt; 2,183 traced implemented rows; no off-form rows |
| `npm run req:tree`, then `node scripts/requirements-tree.mjs --check` | 0, 0 | tree-write.txt, tree-check.txt; 0 problems |
| `node scripts/known-bugs.mjs --root .` | 0 | known-bugs-check.txt |
| `nana-writing` on the extracted new session entry | 0 | writing-session.txt; 0 findings |
| `node scripts/identity-scan.mjs --root .` | 0 | identity-scan.txt |
| `node scripts/lane-class.mjs --root . --files <the six changed production modules>` | 0 | lane-class.txt; ordinary |
| `git diff --check` | 0 | No whitespace errors |

The ten test files contain 120 passing declarations. The tree's pre-commit report-only untracked-reader notes refer to files newly added by this build; the committed-tip check resolves them. Required checks will be repeated on the committed tip before push. No CI run will be read or awaited.

## Choices and precedent departures

All seventeen files in the brief's Precedent section were read completely before design and code. Existing exported helpers are imported, not copied.

- `memory-run.mjs`: reused `dayReservation`; retained zero-wait clone windows, recovery, fetch/rebase preparation and short batch writes. There is no repository-run lock because curation is cross-repository and per-batch reservations plus clone preflight protect its writes. Concurrent duplicate keys are collapsed.
- `memory-store.mjs`, `profile-sync.mjs`: curation files stay under `projects/curation`, as planned; allow-lists, STORE_LAYOUT and the three existing readers stay unchanged. Tests prove ignored curation files, unchanged evidence counts, clean status and following profile saves.
- `nana-profile.mjs`: planned A9 departure retained. `writeStateEvent` is public in memory-store and curation imports it, but the profile command keeps its inline event writes. Editing that command would change the lane class. No private helper was copied or moved without the plan's permission.
- `profile-store.mjs`: imported normalization, exclusive-create I/O, stamps and JSON reader. Queue rendering is separate from `show` because entries are multi-line, ranked by space freed and must always show the first entry; this is the plan's stated departure from whole-line folding.
- `profile-guards.mjs`, `nana-memory.mjs`: reused guard functions and early role/CI refusal. Queue also requires the enabled seat guard, as the plan requests for every command.
- `memory-shaping.mjs` and its config: injected object-rooted runner and conservative usage accounting retained. Per-proposal validation deliberately replaces whole-batch validation inside a valid reply, as planned. The new prompt and vocabulary live only in the new config.
- `memory-making.mjs`: detection extends its existing private parts/ask walk in place. Skips carry no record text, and the unchanged shaper counts them through its existing missing-seat branch. No shaper code change was needed.
- `memory-shape-runners.mjs`, `scripts/memory-run.mjs`: runner imported unchanged; new wrapper follows the thin script boundary. No model session was started.
- `outcome-meter.mjs`, `requirements-regroup.mjs`: injected fail-closed proposing and code-validated owner review retained; curation persists private immutable packets rather than a public review page, as the plan specifies.
- `profile-fixture.mjs`, `memory-run-fixture.mjs`, `profile-sync.test.mjs`: reused their local-only clone fixture and two-clone convergence shape. The new harness prints only titles, never assertion messages containing record text.

Open-choice defaults selected: quote span 30, batch 60, calls 2, run tokens 200000, per-claim queue cap 300 and reason cap 600. Queue imports PROFILE_SHOW_BUDGET (4000), so no extra budget seal exists. Quotes reuse the shaper's OWNER_CAP. The command detector reads assistant tool-use input.command in the existing walk.

O4: already-pending records may still reach the model, but proposals touching a pending record are not enqueued again. Two machines can independently create conflicting proposals before synchronization; accept refuses overlapping selections, including a survivor also named elsewhere, before writing events. This small extension to the plan closes a revival hazard. It has a requirement diff and a code-breaking red/green pair above.

The brief prohibits edits to known-bug files. Therefore the plan's forecast of adding residual lines there is not performed; the residuals are recorded below and in the consumer README instead. HANDOFF is untouched. The only archive change is the brief's explicit newest session entry.

## Known bugs touched or carried, not silently fixed

After reading the whole FEAT-040 known-bug file:

- Reworded re-extraction of a retracted claim still receives a new id. Manual owner-approved upkeep can merge repeats, but the merge step still deduplicates exact normalized claims only.
- Wrongly attributed owner quotes remain possible; curation accept inherits this limit.
- Damaged root-profile JSON still blocks commands. Curation now refuses with the existing fixed word; it does not repair the profile.
- The existing immutable writer still needs hard links, uses the long temporary suffix and can leave ignored scratch files after a kill. Curation reuses that writer, with the same filesystem and path-length limits.
- Damaged skipped project supersede events can still expose duplicates rather than lose records.
- Shared day-lock acquisition retains the create/read race in acquireMemoryLock. Network fetch outside clone ownership retains the existing collision window with a concurrent seat save.
- profileGit still lacks windowsHide. The reused model adapter retains its model-name-prefix check. Per-call token reporting can exceed a pre-call cap; the shared reservation is conservative, not a rate-limit guarantee.

Plan residuals A1/A7/A9/A11/A12/A13 remain: retire uses all-time retract semantics, quote attribution depends on the seat, the profile command has not adopted the event helper, trust stays low, one unrelated next owner turn can be skipped, and size counts claims rather than delivery-format characters.

## Not done

No real-store proposals, owner decisions, acceptance-rate measurement, inflow/outflow measurement, budget-gap assessment or 2,000-character stop-rule evaluation. Those are the plan's seat step after land. No delivery changes, automatic trigger, hook/setup changes, install check, locked full suite, GitHub issue, model session or subagent. No Windows machine run; CI supplies the platform suite. No independent review or land is claimed by this builder.
