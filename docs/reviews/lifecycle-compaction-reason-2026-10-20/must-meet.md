# lifecycle-compaction-reason — must-meet (R-2141, R-2380 to R-2382)

Feature: FEAT-023 · Inspect changes and receive useful notices

**Feature.** Each compaction journal line (session_before_compact, session_compact, session_compact_failed) carries the reason pi gave for that compaction, unchanged, and no other field of pi's event; when pi gives no reason, the line has no reason field.

**Class.** Install, hook or gate: the change is to a pi extension (nana-lifecycle.ts). Full ladder: the roster's reviewer, the roster's land reviewer, the seat's wrong-code pairs and mutation runner, one independent check. The seat also runs the macOS install check before the land; it is the only check that loads the changed extension in a real pi session.

**Threat model.** In scope: honest pi variation. pi 1.0.2 gives all three events `reason: "manual" | "threshold" | "overflow"` beside content fields: preparation and branchEntries (the conversation), customInstructions, compactionEntry (the summary), errorMessage. The pack's pi peer range is `*`. Published @earendil-works pi 0.74.0 to 0.79.9 send these events with no reason: pi's changelog adds the reason in 0.79.10, and session_compact_failed in 0.84.3. A later pi may add a value. Out of scope: a forged event, or a reason that is not text.

**Design.**
- nana-lifecycle.ts: the three compaction handlers take `event` and pass `{ reason: (event as any).reason }` to `log`, the expression session_start and session_shutdown already use. No allow-list, no default, no coercion, no spread of the event. JSON.stringify drops an undefined value, so a missing reason leaves no field. session_before_compact still returns undefined (a truthy return is a pi result).
- No change to `log`, lib/config.ts, nana-handoff.ts or the compaction-summary store. The header's @outputs already lists ts, event, cwd, pid and reason; R-2382 pins that list for compaction lines.
- Why R-2382: a fix that spreads pi's whole event into the line passed every other check. On a real event it copies the conversation and the summary into the journal at every compaction. The adoption hook reads the journal's last 256 KiB as whole lines to report an unadopted folder once a day. One huge line could push that record out (inferred, not run).
- lifecycle-journal.test.mjs: the main fixture already fires the three compaction events with distinct reasons, and R-2141's check reads them. One helper takes a fresh subfolder of the fixture folder as the session cwd. It fires the three handlers there, catches and records throws, and returns that cwd's journal lines. R-2380, R-2381 and R-2382 each use it on their own subfolder, after the R-2140 check, so R-162 still sees one line per event.
- Fix the CASES comment: pi 1.0.2 gives all five events a reason. This closes a HANDOFF residual.

**Must-meet tests.** LJ = packages/nana-pack/tests/lifecycle-journal.test.mjs. All run on macOS, Linux and Windows. Nothing here differs by platform, so there is no skip and no req-candidate.

| Row | Requirement | Test (LJ::title) | Red today |
|---|---|---|---|
| R-2141 (violated → implemented; text unchanged) | WHEN pi emits session_before_compact, session_compact or session_compact_failed, the lifecycle extension shall journal the event's reason on that event's line. | journal: the three compaction lines carry pi's reason | Red (P1) |
| R-2380 | IF pi emits session_before_compact, session_compact or session_compact_failed with no reason property, THEN the lifecycle extension shall journal exactly one line for that event with no reason field. | journal: a compaction event with no reason leaves one line with no reason field | Green by design (today journals no reason at all); red on W2, W3, W5, W6 (P3) |
| R-2381 | WHEN pi emits session_before_compact, session_compact or session_compact_failed with a text reason other than manual, threshold or overflow, the lifecycle extension shall journal that text unchanged on that event's line. | journal: a compaction reason outside manual, threshold and overflow is journaled unchanged | Red (P1) |
| R-2382 | WHEN pi emits session_before_compact, session_compact or session_compact_failed, the lifecycle extension shall journal no field on that event's line other than ts, event, cwd, pid and reason. | journal: a compaction line keeps only ts, event, cwd, pid and reason from pi's full event | Green by design (today writes four fields); red on W7, W7b, W9 (P3) |

These stay green with no new row: R-162 (one line per event, with cwd and pid), R-2140 (start and shutdown reasons) and R-161 (an unwritable journal never throws).

**Probes.** All ran on main 72abe19a in a throwaway clone with a temporary HOME and TMPDIR, single test files only.
- P1, today's code with the four checks: R-2141 FAIL (all three reasons absent), R-2381 FAIL; R-2380, R-2382, R-162 and R-2140 PASS.
- P2, the fix (three handler edits): all six LJ checks PASS.
  - lifecycle-reload 12/12, config-handlers-malformed 99/99, adoption-producer 62/62 and product-report 71/71 PASS. Violated rows drop from 6 to 5.
  - Trace exits 0 with `ears: 0 rows off form`. Tree and map need regenerating, then check green. Readme shows 0 problems. requirements-moved prints `tree movement: none`.
- P3, wrong code on the fix, with the checks it turned red:
  - W1 compact_failed left unfixed → R-2141, R-2381
  - W2 `reason ?? "unknown"` → R-2380
  - W3 `String(reason)` → R-2380
  - W4 an allow-list of the three values → R-2381
  - W5 `reason.trim()` (throws when missing) → R-2380
  - W6 hard-coded "manual" → R-2141, R-2380, R-2381
  - W7 `log(ctx, name, event)`, which spreads pi's event → R-2382 only; it passed the other three new checks
  - W7b reason plus willRetry → R-2382
  - W8 before_compact's reason reused for the other two → R-2141, R-2381
  - W9 reason under another key → R-2141, R-2381, R-2382
- pi 1.0.2's runner catches a handler throw and reports an extension error, and compaction goes on. R-2380's one-line count still catches a throw.

**Known limits.**
- willRetry, aborted, errorMessage and fromExtension stay out of the journal. Journaling any of them later means amending R-2382.
- A reason that is not text is journaled as pi gave it. One that JSON cannot serialize drops that line inside appendJournal's best-effort catch (R-161). This is outside the threat model.
- R-2380 and R-2382 cannot be red on today's code. They pin the fix against the wrong versions above.
- Whether the pack loads at all on pi older than 1.0.2 is untested. R-2380 pins the event shape those versions send, not support for them.
- The pack README's "one line per session event" stays true, so the README does not change.