# Lane install-check — build brief 2e (2026-10-12 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna.** Fresh session, THREE items, the last test session of build 2. Session 2d
(`1d638d2`) printed `seat-titles 2d: 0 missing` with the suite green. Same pattern: `seat-titles.mjs 2e`
lists 25 exact titles.

## Item 1 — hook outputs (R-1076, R-1077, R-1083)
The `objective:`, `adoption:`, `shared memory:`, `output:`, `verifier:` and `knowledge:` titles, through
`runInstallCheck` with a recording fake spawn whose hook results you script per case. Each case changes ONE
thing from an all-PASS run and asserts that exactly that hook's line turns FAIL.

## Item 2 — checklist and doctor (R-1072, R-1081)
- The `checklist:` titles. Build 1 also wrote `<home>/.claude-placeholder` and pre-created each fixture's
  `.git` folder before `git init`; neither is in CHANGE §3 step 4. If either is still there, remove it (that is
  the one allowed code change), and the "writes only" case lists the exact set of paths the check writes.
- The `doctor:` titles and `pin R-1081: the doctor note list`.

## Item 3 — Git Bash lookup and `pi list` (R-1075, R-1073)
- Your 2d report said the Git Bash case "checks source-path patterns, not a functional resolver". Replace it:
  export the lookup as a function that takes PATH entries and an `exists` probe, and test it on
  `…\Git\cmd\git.exe`, `…\Git\bin\git.exe`, `…\Git\mingw64\bin\git.exe` (each resolving to `…\Git\bin\bash.exe`)
  and on a PATH whose only `bash.exe` is `C:\Windows\System32\bash.exe` (refused). Keep its 2d title.
- The `pi list:` titles, on `parsePiList` and through the runner for the last one.

## Wrong code first
For EACH title, break the code it is about, see it fail, restore — one mutation per title, not grouped.
Record `<title>: red under <mutation>`.

## Done — do not report DONE until all of these pass on your last commit
`seat-titles.mjs 2e` → `0 missing`, and `2c` and `2d` still `0 missing` except the one 2c title 2d replaced;
`npm run req:tree`; `npm run map:check`; `npm run readme:check`; `npm run test:locked` (0 failed); the
acceptance script (exit 0; commit `acceptance-output.txt`). No push needed. The Windows knowledge line stays
FAIL until the cc-hooks-windows lane lands; that is expected, not yours.

## Rules
Brief 2a's rules hold. Do not edit `acceptance.mjs`, `seat-titles.mjs`, `CHANGE.md`, `HANDOFF.md` or
`docs/sessions/`. Flip a row to `implemented` only when the cited tests pin every clause.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the last line of `seat-titles.mjs 2e`;
each title with its red-under mutation; rows flipped and the clause each cited test pins; the `test:locked`
summary line; the one claim most likely wrong.
