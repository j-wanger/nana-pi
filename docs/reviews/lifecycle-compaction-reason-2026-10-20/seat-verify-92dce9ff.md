# Seat checks — lifecycle-compaction-reason build 1, tip 92dce9ff (2026-10-20)

- Build, by a pi gpt-6-luna builder through pi-worker (`--lane-size small`, one build). The plan is d9cca60b
  (`must-meet.md`, `plan-attack.md`: one adversary, AMEND; `build-brief-1.md` with the seat's re-check on main
  9552afb1). The lane is based on main 9552afb1, which is still main; `git merge-base HEAD main` is 9552afb1.
  - Build 1 is c81371f6. In `packages/nana-pack/extensions/nana-lifecycle.ts` the session_before_compact,
    session_compact and session_compact_failed handlers take `event` and call `log(ctx, "<event>", { reason: (event
    as any).reason })`, the form session_start and session_shutdown already use. No default, no allow-list, no
    coercion and no spread of the event; session_before_compact still returns undefined. `log`, `lib/config.ts` and
    the handoff extension are unchanged.
  - `packages/nana-pack/tests/lifecycle-journal.test.mjs`: the CASES comment now says pi 1.0.2 gives every event a
    reason; @purpose is one sentence. R-2141's check reads the main fixture's three compaction reasons. One helper,
    `fireBatch(subfolder, eventFor)`, makes a fixed-name subfolder of the fixture folder, fires the three handlers
    there, records throws and returns that folder's journal lines. R-2380 (no reason property), R-2381 (a reason
    outside manual, threshold and overflow) and R-2382 (pi 1.0.2's full event shapes, with one marker string in every
    text field; the line's keys must be among ts, event, cwd, pid and reason) each run on their own subfolder.
  - REQUIREMENTS.md: R-2141 keeps its text and turns `implemented`; R-2380 to R-2382 follow it in FEAT-023, each
    `implemented`. The tree and the code map are regenerated.
  - 92dce9ff adds the seat's pairs table and record, with no code change.
- CI on draft pull request #141: run 39495504953 at c81371f6 (build 1; 92dce9ff is not pushed and changes no code).
  CI run 39495504953 at c81371f6 reads 0 failing on all three legs: macOS 192 PASS, 0 FAIL, 2 SKIP of 194 files (8,004 checks pass, 35 skip); Ubuntu 191 PASS, 0 FAIL, 3 SKIP of 194 files (7,943 checks pass, 55 skip); Windows 176 PASS, 0 FAIL, 18 SKIP of 194 files (6,932 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-c81371f6.log in this folder.
  - Main's own known failures: Ubuntu's path-spelling GP1 and GP2 until linux-path-spelling landed (main ca27d86); a
    pull-request run's R-291 leaf-total failure, a merge artifact of GitHub's merge commit. Windows main reads 0 FAIL
    since 4be0b79 (desk files are declared skips). A failure in that set is main's, not the lane's.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, one shard, merge
  base 9552afb1; record `seat-mutate-output-c81371f6.txt`, commit 92dce9ff). Baseline: lifecycle-journal 6 PASS,
  0 FAIL.
  - M1 to M3 put each compaction handler back to main's form (no reason journaled); each turns R-2141's and R-2381's
    checks red. M4 spreads pi's whole event into the session_before_compact line (the plan's W7) and turns R-2382's
    check red. M5 defaults a missing session_compact_failed reason to "unknown" (the plan's W2) and turns R-2380's
    check red.
  - Result: 5 of 5 red, 0 survived; all 5 turn exactly their named titles red, none with an unnamed red.
  - Declared without a pair: R-2380 and R-2382 are green on main by design, so M4 and M5 are the obvious wrong fixes
    that pin them; R-162 and R-2140 cover sites this lane did not change.
- Independent check (`independent-check-92dce9ff.md`, filed under this tip's name): it ran on c81371f6 in a private
  clone with a temporary HOME and TMPDIR, against pi 1.0.2. VERDICT: HOLDS, over the must-meet file and ten probes.
  - Held: the must-meet file passes 6 (R-2141 shows threshold, manual and overflow). Through pi 1.0.2's own loader
    and ExtensionRunner, with pi's event shapes and 2,000,000-character preparation, branchEntries and summary, each
    compaction line is about 200 bytes, carries only its reason, and before_compact returns undefined. Older pi's
    shape (no reason) gives one line per event with no reason field and no throw. A journal turned off writes nothing;
    a journal path that is a folder throws nothing (R-161). With the platform forced to win32 the must-meet file
    passes 6. Four wrong versions outside the plan's list (`reason ?? null`, errorMessage added, reason only with
    preparation, a `{compactionEntry, type, ...rest}` spread) each turn the row they should red. lifecycle-reload 12,
    adoption-producer 62, config-handlers-malformed 99 and product-report 71 pass, the plan's counts. The only journal
    parsers outside the tests (the adoption store and the install check) read no compaction line's fields. The map
    check reads 0 problems.
  - Probe 5 (a BigInt reason, outside the threat model): the line is dropped with no throw and compaction goes on. It
    matches the plan's known limit 2 and is now a HANDOFF residual.
  - Its findings and how each was settled:
    1. Known bug, not MUST: HANDOFF at the tip still listed two residuals this lane closes, the missing compaction
       reasons and the test's false CASES comment. Settled in this notes commit: the seat removes both lines. c81371f6
       changed that comment, so the second line goes too.
  - No MUST. The check also noted the seat's two untracked pairs files in the worktree; 92dce9ff commits both.
- The plan's known limits 1, 2 and 4 are HANDOFF residuals naming this lane: the other event fields stay out of the
  journal; a reason JSON cannot write drops its line silently; whether the pack loads on pi older than 1.0.2 is
  untested. Limit 3 (R-2380 and R-2382 cannot be red on main's code) is answered by M4 and M5; limit 5 (the pack
  README stays true) needs no line.
- HANDOFF: one Landed line. Two notify-lifecycle-pins residuals go (the missing compaction reasons; the test's
  comment). Three new residuals name this lane. The Open-for-the-owner line on requirement decisions says five rows read
  violated, all desk rows; on 9552afb1 the trace read six (R-2141 too), and this lane makes that line true again, so it
  is unchanged.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2141 and R-2380 to R-2382 read `implemented` in REQUIREMENTS.md. At the notes commit (no code or row changed
  since c81371f6): `node scripts/requirements-trace.mjs` reads `requirements: 1670 total (1434 implemented · 1
  planned · 37 retired · 193 untested · 5 violated); 1434 traced by tests` and `ears: 0 rows off form (allowance 0)`;
  `npm run map:check` reads 364 modules, 0 problems; `npm run readme:check` reads 727 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 9552afb1, run at 92dce9ff):
  ```
  tree movement 9552afb..92dce9f: 4 rows in 1 features
  FEAT-023 · Inspect changes and receive useful notices
    R-2141 violated -> implemented
    R-2380 new (implemented)
    R-2381 new (implemented)
    R-2382 new (implemented)
  ```
  CAP-05 moves from 105 to 108 rows and FEAT-023 from 47 to 50. The plan's probe and the adversary said `tree
  movement: none`; their probe edits were not committed (inferred), so the committed tip lists these four.
- Not in this record: a seat-run locked full suite (the land runs it on the reviewed tip) and the macOS install check.
  The plan has the seat run the install check before the land, because its real pi turn is the only check that loads
  the changed extension in a real pi session.
