# Independent check — lifecycle-compaction-reason at c81371f6 (2026-10-20)

VERDICT: HOLDS

Setup: a private clone of c81371f6 in a mktemp folder, with a temporary HOME and TMPDIR, against pi 1.0.2. The worktree and main were not changed. The two untracked files in the worktree, seat-mutate.mjs and its output, are the seat's own. I deleted the clone afterwards.

Must-meet tests
- `HOME=$P/home TMPDIR=$P/tmp node --experimental-strip-types packages/nana-pack/tests/lifecycle-journal.test.mjs`
  - Output: six PASS lines, including R-2141 `{"session_before_compact":"threshold","session_compact":"manual","session_compact_failed":"overflow"}`, then `ALL PASS`, exit 0. Its temp folders were removed.
  - Verdict: holds.

Probe 1. pi 1.0.2's real loader and ExtensionRunner, with pi's real event shapes and 2 MB payloads
- Command: `node probe-runner.mjs`. It loads nana-lifecycle.ts with pi's `loadExtensions`. Then it calls `runner.emit()` with preparation and branchEntries of 2,000,000 characters each, customInstructions, a 2 MB summary in compactionEntry, and errorMessage.
- Output:
  - `load errors: []`, `before_compact result: undefined`, `runner errors: []`
  - `200 {"ts":…,"event":"session_before_compact","cwd":…,"pid":69749,"reason":"manual"}`
  - `196 {…"event":"session_compact",…"reason":"threshold"}`
  - `202 {…"event":"session_compact_failed",…"reason":"overflow"}`
- Verdict: holds. Each line is about 200 bytes and carries none of the conversation, summary or error text. The before-compact handler still returns undefined.

Probe 2. Older pi (0.74 to 0.79.9) sends no reason; same real runner
- Command: `node probe-modes.mjs oldpi`
- Output: `"threw":null,"runnerErrors":[],"lines":["{\"event\":\"session_before_compact\",\"pid\":84112}", "{\"event\":\"session_compact\",…}", "{\"event\":\"session_compact_failed\",…}"]`
- Verdict: holds. One line per event, with no reason field and no throw.

Probe 3. Journal turned off in the user config
- Command: `node probe-modes.mjs disabled`, with `{journal:{enabled:false}}` in the user's nana-pack.json.
- Output: `"threw":null,"runnerErrors":[],"lines":["(no journal file: ENOENT)"]`
- Verdict: holds. Nothing is written and nothing throws.

Probe 4. Unwritable journal: the journal path points at a directory
- Command: `node probe-modes.mjs unwritable`
- Output: `"threw":null,"runnerErrors":[]`. The directory stays empty (`total 0`).
- Verdict: holds. R-161's no-throw rule is kept.

Probe 5. A reason JSON cannot write (BigInt 10n); outside the threat model
- Command: `node probe-modes.mjs bigint`
- Output: `"threw":null,"runnerErrors":[]`, and no line is written.
- Verdict: matches the plan's stated known limit. The line is dropped silently and compaction is not blocked.

Probe 6. Windows, with process.platform forced to win32
- Command: `node --experimental-strip-types --import 'data:…Object.defineProperty(process,"platform",{value:"win32"})' …/lifecycle-journal.test.mjs`, run with TEMP, TMP and USERPROFILE set to temp folders.
- Output: six PASS lines, then `ALL PASS`.
- Verdict: holds. The change has no platform branch.

Probe 7. Four wrong versions of the code that are not on the plan's list
- Commands: perl edits on the clone's nana-lifecycle.ts, then a test run after each edit, restoring the file after each run.
- Output:
  - M1 `reason ?? null` → `FAIL … no reason leaves one line with no reason field`
  - M2 errorMessage added to the failed-compaction line → `FAIL … keeps only ts, event, cwd, pid and reason`
  - M5 reason only when preparation is present → FAIL on R-2141 and R-2381
  - M6 `{compactionEntry, type, ...rest}` spread into the line → `FAIL … keeps only …`
- Verdict: holds. All four go red, and each fails the requirement row it should.

Probe 8. Neighbouring main uses
- Command: `node --experimental-strip-types` run on four test files, one at a time:
  - lifecycle-reload: `ALL PASS`, 12
  - adoption-producer: `all passed`, 62
  - config-handlers-malformed: exit 0, 99
  - product-report: exit 0, 71
- Verdict: holds. These counts match the plan's P2 numbers.

Probe 9. Who reads the journal
- Command: grep for journal and compaction readers outside the tests.
- Output: the only parsers are adoption.mjs:197 (`if (e?.event !== EVENT) continue;`, which skips everything except directory_unadopted) and install-check's journalHasUnadopted. Neither reads a compaction line's fields.
- Verdict: holds. No consumer breaks on the new reason field.

Probe 10. Map and requirements checks
- Commands: `node scripts/code-map.mjs --check` and `requirements-moved.mjs --root . --base 9552afb1`
- Output: `0 problem(s)`, map exit 0. requirements-moved prints `R-2380 new (implemented)`, `R-2381 new (implemented)`, `R-2382 new (implemented)`.
- Verdict: holds.

Findings
- Known bug, not MUST: HANDOFF.md at the tip still lists two residuals this lane closes. Line 822 says the lifecycle journal records no compaction reason. Line 827 says the test's CASES comment is wrong. The working pattern puts HANDOFF in the reviewed change before the final round, so the seat should remove or close both lines before that round.
- No MUST finding. Nothing lost or corrupted, nothing written outside temp folders, no install or hook breakage, and no fail-open in the gate or land tools. Every main use I probed still works.
