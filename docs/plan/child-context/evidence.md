# child-context delivery record

Feature: FEAT-013 · Install and connect harness runtimes

## Delivered

M1–M6 use R-3915–R-3920. R-3921–R-3924 remain unused.

- `extensions/nana-rulings.ts` and `extensions/nana-writing.ts` in `packages/nana-pack/` use `LAUNCHER_ROLES` from `lib/frontier-summary-config.mjs`. Seats retain their guidance. Pi children omit it.
- `packages/nana-pack/prompts/builder-preamble.md` carries the committed-file privacy sentence. Known-bug delivery and adversary context-file delivery are unchanged.
- `packages/nana-pack/lib/context-load-log.mjs`, `lib/pi-context-load.mjs`, `lib/pi-context-measure.mjs` and the three launchers in `packages/nana-pack/bin/` extend the existing private load log. The section measurement runs discovered prompt handlers, not a second implementation of their formatting or config rules. The SDK discovery/handler probe creates no agent session and calls no model.
- `packages/nana-setup/lib/install-check.mjs` now rejects a writing tag in a worker record instead of requiring it. The first install check caught this obsolete consumer assumption. Its seat-turn writing assertion is unchanged.
- `packages/nana-pack/README.md` and `packages/nana-setup/README.md` declare the changed contracts. `docs/code-map.md` and `docs/requirements-tree.md` are regenerated. The new test file uses the `main` pack, matching `context-anatomy.test.mjs`.

Existing rows narrowed or corrected: R-1410, R-1411, R-751, R-3022, R-2684. No existing row was retired.

## Measurement from builder launch lines

A controlled real `pi-worker --lane` launch used a fake pi, the shipped rulings and writing rules, a short brief and a temporary project objective. It called no model. Both measurements project the first builder launch log line's part counts. The before run restored the old guidance and preamble; the after run used the delivered implementation. The before run intentionally fails M5's skip assertions. `checks.log` preserves both projections.

| Part | Before characters | After characters |
|---|---:|---:|
| Preamble | 4834 | 4908 |
| Brief | 46 | 46 |
| Objective composition | 1623 | 1623 |
| Rulings composition | 4738 | 0 |
| Writing composition | 1461 | 0 |
| Stale-install composition | 176 | 0 |
| Project-stale composition | 0 | 0 |
| Total measured delivery | **12878** | **6577** |

Net reduction: **6301 characters per controlled builder launch**. The fixture deliberately uses a copied rulings file, so its old prompt includes a 176-character stale-install notice. The privacy sentence adds 74 characters. This is not a measurement of a new live model launch or an estimate of its total prompt. The fixture's context-file loader returns no files; its feature has no known-bug file. Existing context-anatomy tests separately keep digest delivery and context-file delivery pinned.

An additional probe against installed pi **1.4.0**, with disposable settings pointing at this checkout, returned a nonempty objective and zero rulings, writing and stale sections. That probe also created no agent session.

## Wrong-code pairs

Every new test ran before implementation. The initial run made M1, M2, M3, M5 and M6 fail against missing behavior. M4 initially exposed a fake-review verdict formatting error; that harness error was fixed before its code mutations.

| Test / row | Wrong code | Red command / exit | Correct code / exit |
|---|---|---|---|
| M1 / R-3915 | Original unconditional rulings injection | `node scripts/test.mjs child-context` / 1 | Touched run / 0 |
| M2 / R-3916 | Original unconditional writing injection | Same initial run / 1 | Touched run / 0 |
| M3 / R-3917 | Original preamble without privacy sentence | Same initial run / 1 | Touched run / 0 |
| M4 / R-3918 | Pi builder env role changed away from a launcher role | `CHILD_CONTEXT_CASE=M4 node packages/nana-pack/tests/child-context.test.mjs` / 1 | Touched run / 0 |
| M4 / R-3918 | Only slot child's role changed to adversary | Same case command / 1 | Touched run / 0 |
| M4 / R-3918 | Worker argv disables extensions | Same case command / 1 | Touched run / 0 |
| M5 / R-3919 | Original log without section parts | Initial run / 1 | Touched run / 0 |
| M5 / R-3919 | Restore untrimmed producers; count their real composition | `CHILD_CONTEXT_CASE=M5 node packages/nana-pack/tests/child-context.test.mjs` / 1 | Same case / 0 |
| M6 / R-3920 | Original Claude log without instruction sources | Initial run / 1 | Touched run / 0 |

Mutations changed code, never assertions. No mutation remains in the worktree.

## Existing test edits

Only assumptions made false by this change were edited:

- `packages/nana-pack/tests/rulings.test.mjs`: the old guide-skip check now expects both guide and rulings to be absent; its title and R-3022 evidence changed together.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: generic part checks accept explicit unavailable counts; copied launcher fixtures include the two newly imported setup config helpers; the unavailable-context assertion selects its named part instead of assuming it remains last.
- `packages/nana-pack/tests/worker-claude.test.mjs`: the role log's old two-part count excludes the newly added section and Claude instruction parts.
- `packages/nana-pack/tests/review-standard.test.mjs`: copied pack fixtures include the two newly imported setup helpers.
- `packages/nana-pack/tests/claude-review.test.mjs`: copied pack fixtures include the same helpers.
- `packages/nana-setup/tests/install-check.test.mjs`: worker records no longer synthesize writing delivery; the worker judgment's writing case supplies an unexpected writing tag. Its title and R-2684 evidence changed together. Seat-turn fixtures remain unchanged.

No test was deleted. The new file contains exactly the six must-meet cases. It uses the shared `tmpDir` helper, temp fixtures, awaited async cases and per-case limits. M6 covers LF/CRLF, trailing spaces/tabs, missing imports, an unreadable non-file import, recursive rules, conditional rules and no final newline. It also covers user memory excluded because the home is an ancestor.

## Commands and results

Full sanitized output is in `checks.log`.

| Command | Exit | Summary |
|---|---:|---|
| `node scripts/test.mjs child-context context-anatomy rulings writing-injection builder-context worker-claude claude-review review-standard install-check` | 0 | 12 files; 266 pass, 0 fail, 4 skip |
| `node scripts/test.mjs test-runner` | 0 | 2 files; 64 pass |
| `node scripts/test.mjs test-packs` | 0 | 4 files; 12 pass |
| `npm test -- --pack=land --jobs=4` | 0 | 71 files; 2413 pass, 0 fail, 6 skip |
| `npm run map:check` | 0 | Code map current |
| `npm run readme:check` | 0 | README contracts pass |
| `node scripts/requirements-trace.mjs` | 0 | 0 EARS rows off form; trace passes |
| `node scripts/requirements-tree.mjs --check` | 0 | Tree current |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | All 13 result lines PASS |
| `git diff --check` | 0 | No whitespace errors |

The first test-runner run failed because the new test used single quotes for the helper import, while the existing source checker requires the shared double-quoted import. Correcting the new import made it green without changing the checker. The first land-pack run found missing dependencies in copied pack fixtures. The first install check found the old worker-writing requirement. Both were corrected and rerun green. A signal case also caught a missing `sections` property on the measurement's cancellation result; the shared result path now supplies it.

AGENTS delegates the full suite to CI. No full suite or CI read ran here. The required land pack ran locally. No independent lint/type commands exist in this repository's root scripts. Windows-only cases remain for the seat's main CI; their skips are explicit in touched results.

## Precedent and callers

No private helper was copied or imported. The role skips follow the named precedent. The preamble keeps its frozen lessons unchanged. Logging keeps `contextPart` and `appendContextLoad`; source discovery additionally reuses `claudeConfigHome`, `realPath` and `CLAUDE_ANCESTOR_MEMORY_PATHS`.

`piContextLoad` callers `pi-worker` and `pi-review` opt into section measurement and consume its added result. Other callers/tests retain the old default result. String callers of `contextPart` keep their result shape; null now means unavailable. `claude-review` and Claude worker launches consume the new instruction-source helper. No scripts-directory caller uses these functions. `judgePiWorker` keeps its return shape and error code; its existing fixture caller was updated for the new writing contract.

The measurement extends the existing isolated context-file probe with SDK resource discovery. Like that precedent, it is a **launch-time snapshot**, not instrumentation of a provider request: an edit between the snapshot and the child's turn can change delivery. This limitation is declared in the pack README. Claude counts describe instruction sources, not Claude's full prompt; excluded sources and path-conditional rules are distinguished rather than guessed as delivered. These are the only qualifications to the brief's measurement wording.

## Known bugs and remaining work

The entire `docs/known-bugs/FEAT-013.md` was read. No known-bug line was changed or removed, and no known bug is claimed fixed. The old pi-version note about nana prompt sections on subagent-completion runs still applies to the objective; child rulings and writing are now omitted by role. No guard was removed or weakened.

HANDOFF and the adversary's context-file policy are untouched. A removal-reference grep covered removed sentences, code lines, paths and file names across the test/helper files; `checks.log` records it. No source path or file was removed or renamed.

No push, issue operation, subagent or real model launch ran. No ten-lane send-back comparison was attempted; that is a follow-up measure for the seat. No new owner question is open.
