# Compaction-summary store — exposure baseline (plan 6.6, 2026-10-09)

`replay.mjs` reads the pi journal (`~/.pi/agent/nana-journal.jsonl`) read-only over a half-open window and prints JSON; `baseline.json` is its output for `[2026-09-28T19:00:38Z, 2026-10-09T10:00:00Z)`, the window starting when the role marker went live.

What the baseline establishes exactly (counted journal events, no joins): 10 compactions, 0 `handoff_written`, 0 `handoff_pickup`, 0 stale pointers. The store wrote and served nothing in the window.

What it does NOT establish: which sessions were *eligible* (could write or pick up). Eligibility joins a role-skip marker to a lifecycle event by working folder and a 5-second window; concurrent sessions in one folder can be mis-joined, so the eligible counts in the JSON are a heuristic, not a measurement. An exact eligibility count needs a shared session identifier in both journal records.

`storeEntries` and `storeMtime` come from the store directory at run time, so the JSON is a point-in-time record; re-running later need not reproduce those two fields.

Re-run on 2026-10-23: `node docs/reviews/compaction-summary-2026-10-09/replay.mjs ~/.pi/agent/nana-journal.jsonl 2026-09-28T19:00:38Z 2026-10-23T00:00:00Z`.
