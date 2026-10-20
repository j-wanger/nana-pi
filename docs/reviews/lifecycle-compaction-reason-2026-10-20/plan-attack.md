# lifecycle-compaction-reason — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan's fix is right. Its tests leave one plausible wrong fix uncaught, and two rows are wider than their tests. I probed it in a throwaway clone of main 72abe19a with a temp HOME and TMPDIR, single test files only. The probe folder is removed, and no process I started is still running.

What held:
- P1 reproduces. On today's code R-2141 and R-2381 fail and R-2380 passes. The plan's six wrong versions turn exactly the checks it names red.
- With the fix, lifecycle-reload passes 12/12, config-handlers-malformed 99/99, adoption-producer 62/62 (the plan said 59; main has moved) and product-report 71/71.
- The flip moves violated rows from 6 to 5. Product-report no longer pins that count; the earlier slate fixed it.
- Trace exits 0 with `ears: 0 rows off form`. The tree and map go stale until regenerated, then check green. The README check shows 0 problems. requirements-moved prints `tree movement: none`.
- The lane class is right (pi extension). The roster names a land reviewer (astra), so no seat land review file is needed.
- Keep the seat's macOS install check. Its pi session is the only check that loads the changed extension in real pi.

Amendments:
1. New row R-2382. The wrong fix `log(ctx, name, event)` passed all three of the plan's checks. A real pi 1.0.2 event carries preparation, branchEntries, customInstructions and the compactionEntry summary. So that fix would copy the conversation and the summary into the journal at every compaction. The new check fires pi-shaped events and requires every line key to be one of ts, event, cwd, pid or reason. It fails on W7, W7b (reason plus willRetry) and W9 (reason under another key), and passes on the fix.
2. R-2381 is narrowed to "a text reason". A non-text reason such as a BigInt makes JSON.stringify throw, and appendJournal then drops the line silently.
3. R-2380 is narrowed to "no reason property". A null reason is journaled as null.
4. The plan's most-likely-wrong claim is settled. pi's changelog adds the compaction reason in 0.79.10, and session_compact_failed arrives in 0.84.3. npm lists @earendil-works pi 0.74.0 to 0.79.9, which send compaction events with no reason. So R-2380 pins a shape that published pi versions send. Whether the pack loads on them is untested; the tested host is pi 1.0.2.
5. One shared helper in the test makes a subfolder, fires the three handlers, records throws and returns that folder's lines.

Builder: the slate says a Claude Sonnet subagent builds simple lanes. Inferred from memory, not checked: once power mode ends (10-20 2pm EDT), the AGENTS default with largerBuilder set is `pi-worker --lane-size small`.

Files the build touches, under <repo>:
- packages/nana-pack/extensions/nana-lifecycle.ts
- packages/nana-pack/tests/lifecycle-journal.test.mjs
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md

Seat only: HANDOFF.md (close the "Compaction journal reasons" and "Lifecycle journal test" residuals), docs/sessions/2026-10.md and docs/reviews/lifecycle-compaction-reason-2026-10-20/.

Conflicts:
- No in-flight worktree touches nana-lifecycle.ts, lifecycle-journal.test.mjs, lib/config.ts or lib/adoption.mjs. None edits REQUIREMENTS.md near the FEAT-023 rows (checked against each worktree's merge base, plus uncommitted and untracked files).
- The only overlap is the shared generated files. After merging main, run `npm run req:tree` and `npm run map` again.
- In the slate, gate-stop-names-config may edit lib/config.ts. This lane only calls loadConfig and appendJournal, and its checks filter by event name and cwd, so a config diagnostic line cannot break them.
- No slate lane touches the lifecycle extension or its test. That is judged from lane names, since those lanes are not built yet.
- Land order: this lane stands alone. Land it early, which keeps its tree and map regeneration cheap.

The one claim most likely wrong: the second harm behind R-2382 is inferred. A spread event could push the adoption hook's once-a-day record out of its 256 KiB journal tail, because tailLines drops a line the window cuts. I did not run the hook against such a journal. The case for R-2382 still stands on the copied conversation alone.
