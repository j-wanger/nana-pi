# review-launch-win-paths: must-meet

Feature: FEAT-007 · Review a specific revision independently
Class: install, hook or gate (review-ledger run and its launch resolver are land and review tools). Full ladder. One seat pair runs on the Windows CI leg. No install check: no nana-setup or hook change.
Sentence: on win32, review-ledger run refuses a `.cmd` or `.bat` reviewer path that names no file, read from the reviewed tree, before anything starts. The cannot-start line goes to stderr and `--out`, and no round is used. A path that names a file, relative ones included, still starts through ComSpec with today's quoting.
Threat model: honest misconfiguration is in scope: a mistyped reviewer path, an upper-case extension, a relative path given with `--tree` set to another folder, a folder name with a space. Deliberately planted files and a file deleted between the check and the start are out.

## Today (probed 2026-10-20 on main 72abe19a, temp copy, injected win32)
- `reviewLaunch` returns a cmd.exe launch for a missing `C:\tools\reviewr.cmd`, a missing `C:\tools\Reviewr.BAT` and a missing relative `tools\review.cmd`. A missing `.exe` path spawns directly, so it already reaches the ENOENT cannot-start path.
- review-ledger therefore starts cmd.exe, which fails with empty stdout. It writes an empty `--out` and dies `no verdict (exit N; 0 chars)`. No round is used, but `--out` carries no reason, which breaks R-2250 on Windows. (Inferred; cmd.exe was not run here.)
- review-ledger calls the resolver with the launcher's cwd, but the child runs in the reviewed tree (`adm.res.cwd`). A check against the launcher's cwd would refuse a relative path valid in `--tree` and pass one that exists only in the launcher's folder.

## Design
1. `review-launch.mjs`, path branch: for a lower-cased extension of `.cmd` or `.bat`, set `resolved = path.win32.resolve(cwd, word)`. If `exists(resolved)` is false, return `{ refused: "no file at <resolved>" }`. Otherwise call `winCommand(word, …)` as today, with the word as written. `.exe`, `.com` and extensionless paths do not change.
2. `exists` defaults to win-command.mjs's existing `defaultExists`, which gains `export`. Do not copy it. piLaunch and findOnPath already default to the same probe, so neither changes.
3. `review-ledger.mjs`: call the resolver after admission, just above `if (launch.refused)`, as `reviewLaunch(child, { cwd: adm.res.cwd })`. Stderr order does not change. Off win32 nothing changes, because cwd is unused there. The default readers cannot throw (piLaunch catches its reads), so no reservation can be stranded.
4. R-2252's fixture never created the `.bat` it launches (`C:\s p\stub.bat`). It now puts that file. The row and its assertions do not change.

## Must-meet (all in packages/nana-pack/tests/review-launch.test.mjs)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-2430 | WHERE the platform is win32, IF the review command's first word is a path ending in .cmd or .bat, in any letter case, that names no file when resolved against the working folder the review launch resolver is given, THEN the review launch resolver shall return a refusal naming the resolved path. | on win32 a missing .cmd path, a missing upper-case .BAT path and a relative .cmd path absent from the given folder are refused, each naming its resolved path | Yes. Probed: all three returned a cmd.exe launch. The prototype turns it green. |
| R-2431 | WHERE the platform is win32, WHEN the review command's first word is a relative .cmd path that names a file in the working folder the review launch resolver is given, the review launch resolver shall return winCommand's ComSpec launch of that path as written. | on win32 a relative .cmd path present only in the given folder starts through ComSpec as written | No. It is a guard, because today's code launches every path. Wrong code 1, 2 and 3 turn it red (probed). |
| R-2432 | WHERE the platform is win32, WHEN review-ledger run's review command is a relative .cmd path, review-ledger run shall resolve that path against the reviewed tree, so a path naming a file only in the tree starts and records its round, and a path naming a file only in the folder review-ledger run was started from exits 1 with the cannot-start line on stderr and in --out and leaves no reservation or round. | Windows: review-ledger run resolves a relative .cmd reviewer path against --tree, starting one present only there and refusing one present only in the launcher's folder, with the cannot-start line in --out and no round | Inferred, Windows only. Today the refused half runs cmd.exe in the tree and ends in "no verdict" with an empty --out. Marked req-candidate, and a real SKIP off Windows. |

Fixtures:
- R-2430 and R-2431 use the file's injected Windows map.
- R-2431 puts `C:\tree\tools\review.cmd` and calls `{ ...winOpts, cwd: "C:\\tree" }`. The map's `exists` resolves a relative name against `C:\work`, so an unresolved check fails.
- R-2430's relative case uses the default cwd `C:\work` and expects `C:\work\tools\review.cmd` in the refusal.
- R-2432 commits `tools\review.cmd` (`@echo off`, `echo VERDICT: LAND`) into a `makeRepo` tree. It puts `other dir\review.cmd` with the same text under `temp` only. Both runs use the launcher with cwd `temp` and `--tree <repo>`.
Platform skip: R-2432 needs real cmd.exe and a Windows file system. On win32 the file still runs R-2250 to R-2253, R-2430 and R-2431, so it is not all-SKIP.
Regression guard, no new row: R-2250 to R-2255 pass. Only R-2252's fixture gains its `.bat`.

## Wrong code for the seat's pairs (1 to 6 probed on a prototype, 2026-10-20)
1. Check `exists(word)` unresolved. R-2431 turns red, and both halves of R-2432 on Windows.
2. Resolve against `process.cwd()`. R-2430 and R-2431 turn red.
3. Refuse every `.cmd` or `.bat` path. R-2252 and R-2431 turn red.
4. Compare the extension without folding case. R-2430 turns red.
5. Leave the path out of the refusal. R-2430 turns red.
6. Also check `.exe` and extensionless paths. R-2252 turns red (`C:\tools\codex` is absent).
7. Keep the resolver before admission with the launcher's cwd. Both halves of R-2432 turn red, on the Windows leg only.
Seat hazard: no `docs/reviews/**/*.mjs` may spell a pi launch as the literal `spawn("pi"`.

## Dropped from the scout's spec
- Idea (3), that a bare name skips an earlier PATH match for a later one: R-2253 declares that refusal as a trade.
- Idea (5): it already holds, because neither path uses a round today.
- The plan's absolute-missing case through the CLI: R-2430 covers it at the resolver, and R-2250 covers the route from refusal to --out.

## Known limits
- A `.cmd` removed between the check and the start still reaches cmd.exe and ends in "no verdict", with no round used.
- A `.cmd` that exists but fails inside is a "no verdict", not a cannot-start.
- A bare name whose first PATH match is `.js`, `.vbs` or `.py` stays refused, as R-2253 declares.
- A bare name's relative PATH entries now resolve against the reviewed tree, where the child runs. No row pins this.
- R-2432 stays untested until the seat sees it pass on the Windows CI leg.