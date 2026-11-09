# memory-sort build record

Scope: FEAT-013, roadmap step 3: move durable guidance into both seat runtimes and require lane alignment declarations.

## Delivered parts

1. `packages/nana-pack/rules/nana-rulings.md` records the two new rulings and the seven condensed decisions named by the plan. R-3950 is untested guidance, not a claimed wording pin.
2. `packages/nana-setup/claude/rules/nana-seat.md` records the eight named procedures and the pre-launch priority judgement. R-3951 is untested guidance.
3. `packages/nana-pack/prompts/planner.md` carries planner/adversary lessons, portable-fixture guidance, safety-floor composition and public-path hygiene. `packages/nana-pack/prompts/visual-reader.md` carries readability, story, motion, craft and workflow-layout guidance. R-3952 and R-3953 are untested guidance.
4. `packages/nana-pack/lib/brief-precedent.mjs` parses the first `Serves:` line and refuses incomplete lane briefs through the existing shared launch checker. `packages/nana-pack/lib/brief-config.mjs` seals its label. `packages/nana-pack/README.md` declares syntax and limits. R-3948 and R-3949 are implemented. Role and legacy workers remain unchanged.

Rows R-3735, R-3716 and R-2580 now explicitly condition successful launches on a complete Serves declaration. R-3954–R-3955 remain unused. Generated map and requirements outline were refreshed.

## Bytes and prompt delivery

| Source | Before | After | Spare under 8,192 |
|---|---:|---:|---:|
| `packages/nana-pack/rules/nana-rulings.md` | 4,712 | 6,545 | 1,647 |
| `packages/nana-setup/claude/rules/nana-seat.md` | 5,877 | 7,109 | 1,083 |

Neither file needed an omission for size. Combined guidance grows from 10,589 to 13,654 bytes. `composed-prompt.md` shows the complete sections rendered by the extension's exported `buildBlock` and `buildSeatGuideBlock` helpers over OS-temp copies. No lane install or paid model launch was used for that demonstration. The install check uses its existing offline fixture provider in a temporary home.

Claude startup reduction is not claimed: private memory and indexes remain unchanged until the seat archives them. The full private startup total was not measured. Priority measures (median lane hours and net lines removed from main) remain unmeasured here; this branch has not landed.

## Wrong-code pairs

- M1 / R-3948: the existing implementation, with no Serves refusal, launched missing, empty and malformed cases. The new test failed. With the refusal, all 27 cases pass: nine values across LF, CRLF with trailing space/tab, and no final newline. Both worker and brief-check are exercised; only fake pi runs.
- M2 / R-3949: the existing configuration lacked the label export, so the new seal check failed. Adding the sealed label makes it pass. Neither pair changed an assertion.

The baseline run exited 1 with 8 passing and 2 failing checks. The corrected brief-check run exited 0 with 10 passing checks. An initial test-harness run failed from calling the local check helper before initialization; that harness error was fixed before collecting the wrong-code evidence.

## Existing tests edited

Only fixtures made invalid by the new launch requirement changed; no test was removed.

- `brief-check.test.mjs`: valid existing launch/selection fixtures gain Serves; the existing reporter moved before the new checks.
- `worker-lane.test.mjs`: default and generated launch briefs gain Serves while preserving a leading BOM and the tested line endings.
- `worker-refusal.test.mjs`: default valid brief gains Serves.
- `builder-context.test.mjs`: launch helper adds Serves, preserving the fix-card/BOM cases.
- `worker-claude.test.mjs`: brief writer and byte oracle include Serves; the separate beta-lane fixture also gains it.
- `build-records.test.mjs`, `build-report.test.mjs`, `context-anatomy.test.mjs`, `credential-strip.test.mjs`, `leak-scan.test.mjs`, `watchdog-exit.test.mjs`, `win32-launch.test.mjs`: valid fixture briefs gain Serves.
- `packages/nana-setup/tests/install-check.test.mjs`: the existing sealed offline-build heading expectation gains Serves to match `packages/nana-setup/lib/install-check-config.mjs`. The real install rehearsal first exposed this missed caller and passed after the fixture changed.

Pack test paths above are under `packages/nana-pack/tests/`. No new test file was added. The only new checks are the brief's refusal test and its vocabulary seal.

## Precedent and callers

The existing `readBrief` parser, shared `checkBriefForLaunch` refusal object and ruling/seat bullet formats were followed. No helper was copied, moved or imported privately. Both `pi-worker` and `brief-check` retain their existing imports and receive the new refusal automatically.

The additive `readBrief.serves` field leaves its existing consumers compatible: `checkBriefForLaunch`, `known-bug-digest.mjs`, `pi-review.mjs` and `apps/bench/lib/anatomy-sessions.mjs`. Parser tests and the frozen historical corpus use the existing fields unchanged. The launch fixtures listed above and the install-check header are the caller updates.

Departure: the repository has no separate adversary prompt. Its frame and decision lessons live in the planner prompt, which tells the seat what to give the adversary. This avoids a new, unread prompt file.

Departure: `feedback_objective_drift.md` was absent from the supplied shared and project stores when searched. Its named procedures come from the explicit build plan and audit, not an unread entry. Every available entry whose meaning moved was read first. Nothing about the owner as a person or their work was moved.

## Deferred and not done

- Item 5: `HANDOFF.md` stays untouched because the lane instructions explicitly forbid editing it. The seat still needs to replace the missing-objective claim, old priority and paused-memory-factory claim. Its writing check passes but cannot establish factual freshness.
- The builder preamble stays untouched for child-context. The two lessons to send later are: run a required locked suite in the foreground with visible output; preserve escaped newlines in generated template literals, checking generated source before accepting an escape change.
- Item 6: no private entry or index was changed or archived. The seat owns the private disposition table and post-land archiving, including unresolved fragments.
- No push, issue action, CI lookup or completed full-suite run. AGENTS.md delegates the full suite to CI. The named land pack and touched tests ran locally.
- The accidental `node scripts/test.mjs --help` invocation was terminated by the tool limit after ten seconds: this runner treats it as an unfiltered run, not help. No such process remained when checked. It is not suite evidence.

## Known bugs and checks

The whole `docs/known-bugs/FEAT-013.md` was read. This change touches no named known-bug line and edits no known-bug file. No closure is claimed.

`validation.log` holds normalized command output and exit codes. Changed files pass the identity scan; human inspection found no names, handles, hostnames, work references or private project names introduced from memory. The removed-line search checks every removed diff line against tests; no tracked path or file was deleted or renamed.
