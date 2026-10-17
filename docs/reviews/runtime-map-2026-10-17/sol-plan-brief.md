# Plan review — runtime-map, 2026-10-17 (gpt-5.6-sol; gate and format lane: round 1 of 2)

Review `CHANGE.md` in this folder on `feat/runtime-map` (main `61c5748`; the plan cites `2dbc817` and the leaf total it
names is stale since the regroup and roster-notice lands). The owner asked on 2026-10-16 for code runtime evaluation in
the code map, and confirmed the reading: per test file, which code it actually runs (spawned children included) and how
long it takes — not a per-function profile; the data stays on the machine, outside the repo, and the map check never
reads it. Two fact-checks and two critiques shaped the plan; they are here.

Threat model: honest variation in our tools' output and users' files in scope (tests that spawn children, tests killed by
a time limit, Windows paths in coverage URLs, a dirty or moving checkout, a run cut short, two worktrees); deliberate
forgery out. Lane class: gate and format (it edits the suite runner whose exit gates every land, and adds a data format).
The review standard pi-review appends governs the bar and the verdict line.

Check: (1) the suite's pass and fail are unchanged with the measure setting off, and a measure run can never turn a land
green or red; (2) the data says which tests ran which files and how long, and marks itself stale honestly; (3) each row
has one "shall" and a pinning check; (4) macOS and Windows; (5) any MUST.
