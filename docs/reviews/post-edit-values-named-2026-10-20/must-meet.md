# post-edit-values-named — must-meet

Feature: FEAT-030 · Get trustworthy feedback after edits
Lane class: hook. The build changes the pi extension `nana-post-edit.ts` (only its imports and the names it reads). Simple lane: a Claude Sonnet subagent builds it.
Threat model: honest variation in our tools' output, platforms and configs is in scope. Deliberate forgery (a hand-edited pack copy, a forged config module) is out.
Base: main at 07f8f6f9 or newer (post-edit-timeout-name has landed).

## Feature
The extension reads five post-edit values by name from `lib/post-edit-config.mjs`: the kill grace, the output cap, the failure cap, the command cap and the lock message cap. Retuning one there changes the check's behaviour with no other code change, the suite included. Today all five are inline, and a literal left in the extension goes unnoticed.

## Design
- `lib/post-edit-config.mjs` gains five exports, each with its provenance beside it. `@purpose` becomes "Define each post-edit check tunable once, with its provenance", and `@outputs` lists all six.
  - `POST_EDIT_KILL_GRACE_MS = 2000`: chosen in the 2026-09-08 hang fix; not measured.
  - `POST_EDIT_OUTPUT_CAP = 1024 * 1024`: chosen. It is Node's exec maxBuffer default, which the check used before spawn replaced exec. It counts UTF-16 units over stdout and stderr together.
  - `POST_EDIT_FAILURE_CAP = 2000`: a contract value from R-087 ("the last 2000 chars kept").
  - `POST_EDIT_COMMAND_CAP = 400`: chosen 2026-09-29.
  - `POST_EDIT_LOCK_MESSAGE_CAP = 300`: chosen 2026-09-29.
- Extension: import the five names and delete the local `MAX_OUTPUT`, `KILL_GRACE_MS`, `FAILURE_CAP` and `CMD_CAP`. Replace every use, including `promptText(lockError, 300)` and the doc comment that names FAILURE_CAP. `POST_EDIT_FAILURE_CAP * 3` stays: the 3 is the width of the ⏎ glyph, a derived factor. Nothing else changes.
- `tests/post-edit-hardening.test.mjs`: four settle checks (a, b, c, f) bound the run at a literal 6000 ms, today's grace plus 4000. A probe set the grace to 6000, and all four went red. Import `POST_EDIT_KILL_GRACE_MS`, add `SETTLE_BOUND_MS = POST_EDIT_KILL_GRACE_MS + 4000` (chosen: today's bound), and use it in those four checks. Titles and markers are unchanged.
- Seals: R-2215 pins the four chosen values in one check, as R-1215 and R-1960 do. The failure cap is a contract value. R-087's display-surfaces check "a truncated failure says so, and keeps the TAIL" already pins `last 2000 of` through the extension, so no second pin.
- README: in the pack's SIGTERM note, before "`timeoutMs: 0` still means no deadline", add "A command that sets no `timeoutMs` gets 30 seconds;". This closes post-edit-timeout-name's README residual.

## Must-meet tests (new file `packages/nana-pack/tests/post-edit-values-named.test.mjs`)
- The test copies the extension and `lib/` into a temp folder, as R-2150 does.
- It rewrites the five exports to 1234, 64, 37, 9 and 11 (chosen: each only has to differ from its sealed value; the output cap stays above the failure cap).
- It puts a stand-in pi package in the copy's `node_modules`. Its `withFileMutationQueue` refuses only a path that holds `lock-case`.

| Row | Requirement | Test (file::title) |
|---|---|---|
| R-2210 | WHEN a post-edit check outlives its deadline, the pack shall schedule the forced kill that settles the run POST_EDIT_KILL_GRACE_MS milliseconds after the first kill signal, the value its post-edit configuration module defines. | `post-edit-values-named.test.mjs::a timed-out post-edit check arms its forced kill at the named kill grace, retuned in a copy` |
| R-2211 | IF a post-edit check prints more UTF-16 code units than the POST_EDIT_OUTPUT_CAP value its post-edit configuration module defines, THEN the pack shall tell the model that the check could not run, keeping only the first POST_EDIT_OUTPUT_CAP units of its output. | `…::a post-edit check that prints past the named output cap could not run and keeps only that many first units, retuned in a copy` |
| R-2212 | WHEN a failing post-edit check's output is longer than the POST_EDIT_FAILURE_CAP value its post-edit configuration module defines, the pack shall show the model only that many last units of the output and state the cut. | `…::a failing post-edit check shows the model the last units up to the named failure cap, retuned in a copy` |
| R-2213 | WHEN a failing post-edit check's command is longer than the POST_EDIT_COMMAND_CAP value its post-edit configuration module defines, the pack shall show the model only that many first units of the command and state the cut. | `…::a failing post-edit check shows the model its command up to the named command cap, retuned in a copy` |
| R-2214 | IF pi's file-mutation queue refuses a post-edit check's file, THEN the pack shall show the model no more than the first POST_EDIT_LOCK_MESSAGE_CAP units of the refusal message, the value its post-edit configuration module defines. | `…::a refused post-edit file lock shows the model the refusal up to the named lock message cap, retuned in a copy` |
| R-2215 | The pack's post-edit configuration module shall define POST_EDIT_KILL_GRACE_MS as 2000, POST_EDIT_OUTPUT_CAP as 1048576, POST_EDIT_COMMAND_CAP as 400 and POST_EDIT_LOCK_MESSAGE_CAP as 300. | `…::seal: the post-edit kill grace is 2000 ms, the output cap 1048576, the command cap 400 and the lock message cap 300` |

## Evidence (probes in a temp clone of 07f8f6f9, temp HOME; no repo touched)
- Base: all six FAIL. The cause is behaviour, not only the missing exports: timers were [300, 2000], 1 MiB never overflowed, the 50-char output and the command went uncut, 300 Q's showed, and the seal saw only the default timeout.
- Build: all six PASS in 0.5 s.
- Wrong code. Each version fails exactly 1 check, its own:
  - Wg: the grace kept as a literal 2000.
  - Wo: the output cap kept as a literal in both places. Wo2: only in the slice.
  - Wcp: the output cut counted in code points. It is red only because the output starts with an emoji.
  - Wf: the failure cap kept as a literal in all three places. Wf2: only in the stated cut.
  - Wc: the command cap kept as a literal in all three places. Wc2: only in promptText.
  - Wl: the lock cap kept as a literal 300. Wl2: the lock message not capped.
  - Ws1 to Ws4: the config set to grace 2500, lock 299, output 1000*1000 and command 401. Each turns the seal red.
- Wfc: the failure cap set to 1999 in the config fails display-surfaces' R-087 check (180 pass, 1 fail).
- Retune: with the grace at 6000, hardening had 4 FAIL before the bound import and 22 PASS after.
- Blast radius, each exit 0. Pass counts: post-edit-default-timeout 2, post-edit-status 32 (+1 skip), post-edit-hardening 22 (+1 skip), display-surfaces 181, post-edit-file-queue 5, post-edit-utf8 4, config-handlers-malformed 99.
- Trace: exit 0, 0 rows off form. Tree: exit 0. Map: 345 modules, 0 problems. README: 720 claims, 0 problems.

## Known limits (residuals)
- Surrogate carry, from the planner's probe: on overflow, `slice(0, cap)` and the tail `slice(-cap)` can each split a pair. promptText's `toWellFormed()` shows the half as U+FFFD, so no lone surrogate reaches the model. A cut pair costs one replacement character.
- The README states 30 s, 2 s and 2000 chars as prose, and no check ties them to the config.
- Some fixtures still assume today's scale. Hardening's fixed 15 s watchdog breaks at a grace past about 14.5 s. Display-surfaces' 5000-char R-087 output breaks at an output cap under about 5 KB.
- R-2214 runs through a stand-in pi package. R-091 and R-785 cover pi's real refusal.
- R-2210 checks the delay that is armed, not when the kill lands. R-787 and R-094 cover settling, now with bounds read from the named grace.
- R-2210 expects exactly [300, grace]. On Windows, taskkill does the kill and arms no timer. Only the Windows CI leg proves this.
- The extension keeps PYTHONUTF8's name and value (contract values, R-1740) in its own module.

## Seat steps (hook class)
- Run the wrong-code pairs above through the shared mutation runner. The table must not spell a pi launch.
- Run one independent check.
- The land reviewer is astra (roster), so no seat-land.md.
- Run requirements-moved before the final review and before the land. Run install-check before nana-land.
- In HANDOFF:
  - Drop "five other post-edit values…" and "README does not state the 30-second default".
  - Add the surrogate carry and the fixture-scale limit.