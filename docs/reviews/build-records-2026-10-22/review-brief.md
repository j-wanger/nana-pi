# Review — build-records (pi-worker keeps a record of every lane build), 2026-10-22 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary (pi-worker, a new pack lib with its config, one report command run through node from the checkout, the bench's usage-sum helpers moved into a pack lib, docs and rows; nothing on the install, hook or gate list). Threat model: honest variation in our own tools' output — two lanes of one clone appending in the same instant; a pi-worker killed hard (SIGKILL, a closed terminal, a stopped background command); a pi that stalls, exits non-zero or writes no session; a session folder holding pi-review and older pi-worker sessions; `PI_CODING_AGENT_SESSION_DIR` set to a flat folder, a `~/…` value or an empty value; a worktree reached through a symlink or a Windows 8.3 short path; a ledger that is missing, unwritable, torn or over its cap. Deliberate forgery out (a hand-written ledger line).

Review `git diff b5b5f8c2..HEAD` on `feat/build-records`. Main is b5b5f8c2 (brief-reader-fixes). The lane branched from 61ac64f3 and merged main once at 6145de7d; the conflicts were REQUIREMENTS.md rows (both sides kept) and the generated tree outline, which the seat regenerated with the code map. The lane's own commits: d5d7156b (plan), fa4a2406 and 7804e7ed (build 1, the feature), 1e62bd2d (the seat's pairs table and baseline finding F1), cb2d3f0a (build 2, R-2598's read cap sized from its fixture), 8bafc18a (pairs), 2a459ac9 (build 3, the Windows short-path case), 55003134 (pairs), the merge, 967fc32f (notes), db0c0837 (CI finding F4), f74582cf (build 4, the Windows cleanup in build-report.test.mjs), c2a06ad5 (one known-bug line) and the final commit with this brief.

The plan of record is `docs/reviews/build-records-2026-10-22/must-meet.md`: decisions D1 to D11, rows R-2596 to R-2603, R-732 retired for R-2603, the tunables and the known limits; `plan-draft.md` and `plan-attack.md` (M 3, S 10, N 13) are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 18 of 19 red at 2a459ac9 (`seat-mutate-output-2a459ac9.txt`). The survivor, p13 (the session folder encoded from the real path, not the raw cwd), is equivalent on macOS, where the two agree; build 3 added the Windows case that launches a build from the 8.3 short path. Nobody has seen p13 turn red on Windows; that is a FEAT-006 known-bug line.
- The seat's per-build diff check finds no removed line holding an escaped `\\n`, `\\r` or `\\t`, at any of the four builds.
- Draft PR CI at 967fc32f: Linux and macOS green; the Windows leg failed only in `build-report.test.mjs`'s cleanup (EBUSY on the linked worktree a hard-killed build still held), which build 4 fixed. CI runs again on the reviewed tip.
- Session titles: 0 missing. Build 4's locked full suite: `208 PASS, 0 FAIL, 2 SKIP`. After the merge, map:check, req:tree, readme:check and the trace are green, and the tree checker prints `deliverables: 15 of 40 made and read by code`.
- On this repo `build-report.mjs` prints a zero total: the lane's own builds ran main's pi-worker.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement b5b5f8c..c2a06ad: 9 rows in 1 features, 1 capability change(s)
FEAT-006 · Launch builders with execution limits
  R-732 implemented -> retired
  R-2596 new (implemented)
  R-2597 new (implemented)
  R-2598 new (implemented)
  R-2599 new (implemented)
  R-2600 new (implemented)
  R-2601 new (implemented)
  R-2602 new (implemented)
  R-2603 new (implemented); also applies: FEAT-007
capabilities:
  CAP-02 · Deliver controlled changes: Deliverables R-1400, R-1008, R-1560, R-977 → R-1400, R-1008, R-1560, R-977, R-2597
```

The seat lands only on green CI at the reviewed tip, the Windows leg included.
