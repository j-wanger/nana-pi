# Lane cc-hooks-windows — build brief 2 (2026-10-12 · feat/cc-hooks-windows · worktree ~/nana-pi-wt/cc-hooks-windows)

**Builder: Claude Sonnet 5.5**, fresh session. THREE items; finish all three, nothing else. Work ONLY inside
`/Users/example/nana-pi-wt/cc-hooks-windows` (absolute paths; `cd` there in every shell command). The contract
is `CHANGE.md` in this folder.

## Where build 1 left it (seat verification of `cfa1556`)
- The seat re-ran both acceptance scripts: `seat-verify-hooks` 59/59, `seat-verify-tests` 0 gaps.
- The seat's code-break runner (`seat-mutate.mjs`, this folder; output `seat-mutate-build1-output.txt`)
  ran CHANGE §5's pairs: 28 of 29 red, 1 survived (18b). While explaining pair 7 it found a REGRESSION.

## Item 1 — restore the status-message gate (R-1061, R-653, R-923; CHANGE §3 "The timeout and status-message gate stays", §5 `installerTarget` "rejects … another status message")
- Main's `mergeKnowledgeHook` skipped any entry whose `statusMessage` was not `"nana: knowledge pull"`
  (main `settings.mjs:276`). `mergeRepoHooks` now checks only `timeout === 5`, and `installerTarget` never
  reads `statusMessage`. Seat check: on POSIX, a stale `NODE_NO_WARNINGS=1 node '/old/…' hook` entry with
  timeout 5 and status `"my own knowledge"` is now REPLACED; main leaves it byte for byte and adds its own.
- Fix the class: an entry counts as the installer's own only when its `statusMessage` equals the wanted
  row's `statusMessage`, for every one of the five rows on win32 and the knowledge row on POSIX. Put the
  rule where CHANGE §5 says it lives (`installerTarget` rejects another status message).
- Wrong code first. Cases, each with `// req:` above it:
  - POSIX: the stale entry above with another status message is left byte for byte, and the merge result
    matches main's (`added`, not `replaced`);
  - forced win32, for EACH of the five rows (iterate the labels): a hand-written exec-form variant with
    another status message is kept byte for byte and install adds no twin (R-923) — so that this case now
    depends on `hasHook`, which build 1's version did not (pair 7's note in the runner output);
  - `installerTarget` rejects another status message (pure case).

## Item 2 — pin pair 18b (R-653; CHANGE §3 "on win32 it also requires that `args` is absent")
- On win32, `installerTarget` must reject the POSIX prefixed knowledge form (`NODE_NO_WARNINGS=1 node '<abs>' hook`)
  when the entry carries `args`. Today only the earlier `node '<path>' hook` form has a rejection case.
  Add the pure case; wrong code first.

## Item 3 — every case runs on its own
- In `settings-merge.test.mjs`, the forced-win32 `removeInstallerHooks` block threw a TypeError after its
  first failing case, so "keeps the entry whose args differ" never ran (pair 16 in the runner output).
  Make each case in that block, and any other block where one failure aborts the rest, run independently.

## Done — do not report DONE until all of these pass on your last commit
`npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (0 failed), both seat
scripts as in brief 1 (outputs re-committed), and the seat runner from the worktree root:
`SEAT_MUTATE_OUT=docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate-build2-output.txt node docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate.mjs`
— its last line must read `29/29 red, 0 survived`. Commit the output. Push (the draft PR runs CI) and report
the Windows job's `settings-merge` and `hooks-win32-exec` lines verbatim with the run ID.

## Rules (brief 1's hold)
No suite test runs, imports or copies a seat script. No test deletion (title map). Do not edit `CHANGE.md`,
the seat scripts, `HANDOFF.md` or `docs/sessions/`. IDs only from R-1065–R-1069 if you must split a row.
POSIX output stays byte-identical to main except where item 1 RESTORES main's behaviour. Commit with explicit
paths; message file under `$TMPDIR`.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each case added and the clause it pins;
the `test:locked` summary line; the last line of each seat output file verbatim; the Windows lines verbatim
with the run ID; the one claim most likely wrong.
