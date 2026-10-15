# Lane lift — build brief 1 (2026-10-14 · feat/lift · worktree ~/nana-pi-wt/lift · base main d9cf0bc)

**Builder: Claude Sonnet 5** (gate lane: the tool rewrites another project's contract file). The contract is
`CHANGE.md` in this folder, frozen at `2a859ef` after sol plan r3 LAND — read ALL of it, including both "Seat revision"
sections and "Plan review r1" and "r2": they change R-1163, R-1167, check 9 of §3.5 (placement: in default mode the
proof derives the whole expected heading sequence from the input; in mapping mode it checks the mapping's declared
placement), T6 and T20, and the mutation table. Jake's ruling it serves is in §1. Threat model in §1. New IDs:
R-1162–R-1169 only.

## Two seat clarifications (2026-10-14; not plan changes)
1. **T6 holds nineteen tampers**, not eighteen: the eleven in its title plus the eight the r1 and r2 sections add. Build
   all nineteen.
2. **An unterminated last row with no kept section.** §3.2 opens the tail with the closing heading, and §3.5 check 3
   refuses any line after an unterminated last row; together they would refuse the unterminated ledger T5 requires to
   lift. Ruling: the lift writes the closing heading only when the ledger has a kept section (`## Open questions`,
   `## Deliberate omissions`) or tail prose. Then T5's unterminated ledger lifts with its last row last and
   unterminated, and a mapping that places a line after such a row is still refused.

## Build in this order
1. Rows (§2, one `shall` each, text exactly), then `node scripts/requirements-tree.mjs --write` and R-291's literal (the
   base total + 8; 1,136 at this base).
2. The tests by exact title (§5 T1–T31; each `// req:` line directly above its check call), run against the base so
   every new check is seen red; commit them.
3. `scripts/requirements-lift-proof.mjs` first — it imports nothing from the lift module (T7) and parses the seed
   itself — then `scripts/requirements-lift.mjs`, then the four `export` keywords in `scripts/requirements-tree.mjs`
   (and nothing else there), the requirements skill's §4 flow and description words, and the README lines for both
   scripts. Regenerate the outline and the code map.

## Rules
Wrong code first for every new check; a mutation breaks code or shipped text, never an assertion. No suite test runs,
imports or copies a seat script (`acceptance.mjs`, `seat-titles.mjs`). Fixtures are built inside the tests; no other
project's ledger, and no file from `~/.cache/nana-lift-ledgers/`, enters nana-pi. Git-using tests make temp repos and
set `core.autocrlf` explicitly (true only in T11). Do not touch `CHANGE.md`, the seat scripts, `HANDOFF.md`,
`docs/sessions/`, or anything §3.8 lists. Never run the lift against a real project. Commit with explicit paths;
message file under `$TMPDIR`; sign commits with the model you actually run as.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/lift-2026-10-14/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/lift-2026-10-14/acceptance.mjs > docs/reviews/lift-2026-10-14/acceptance-output.txt 2>&1` → every
case passes except any marked as the seat's (HANDOFF and session notes); 110 build cases fail at launch
(`acceptance-launch.txt`); the run reads the real-ledger copies in `~/.cache/nana-lift-ledgers/` (read only); `npm run test:locked` (0 failed); `npm run map:check`; `npm run readme:check`;
`node scripts/requirements-tree.mjs --check`; `node scripts/requirements-trace.mjs`. Commit the acceptance output. Push
the branch and open a DRAFT pull request "lift (draft, for CI)" (pre-approved). When its CI run completes, read the
Windows job log once (`gh api repos/j-wanger/nana-pi/actions/jobs/<job id>/logs`) and report T1–T31 there (T3 skips on
win32). No Windows claim lands that CI did not show; a red one is BLOCKED with its log lines.

## Report
≤ 35 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each row and the titles that pin it, with the red
you saw first; the CI run ID with the Windows results; the `test:locked` summary line; the last lines of each seat
output; the one claim most likely wrong.
