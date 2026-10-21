# win-hook-variant-loop — must-meet (amended by the plan adversary)

Feature: FEAT-015 · Diagnose the active environment (FEAT-013's R-653 and R-923 stay as they are)
Class: install, hook or gate. The lane changes doctor's hook settings rows in hook-health.mjs, which the session-start stale-copy producer also runs. Full ladder: the roster reviewer, the land reviewer or seat land review, the seat's wrong-code pairs, one independent check, the local macOS install check before nana-land, and the Windows CI leg.
Behaviour: on Windows, when a hook settings row reads ✗ because of an entry install leaves as written, doctor's ✗ line names that entry's script and gives the fix by hand. The owner can then fix what install will not.

Threat model: in scope is honest variation in owner-edited or older entries. That covers other quoting, exec form, a custom folder, another timeout or message, and a carried home path. Any settings file that parses is in scope. Out of scope is an entry forged to copy nana's own form. A finding outside the model is a residual.

## Why install is left alone
- No nana installer or doc ever wrote these shapes (git history). The earlier lane declined them on purpose, and the R-653 check pins the double-quoted look-alike.
- Today, after install, doctor's summary already lists these rows as "fix by hand as each ✗ line says". The ✗ line names no entry and gives no fix. This lane fills that gap.

## Today (main 72abe19a; temp clone, forced win32, temp home)
- Variant home V: double-quoted objective, unquoted adoption, exec-form shared-memory and verifier under the default Claude hooks folder, and a double-quoted roster notice and knowledge entry at an old checkout. Install prints `already wired` six times and writes nothing. Doctor prints six ✗ lines, each reading only `<marker> — target is missing or does not resolve inside <repo>`.
- A prototype of the design below passed all three checks; win32-hook-repair read 14/14. doctor-detail, doctor-fix-line, win32-degrade and stale-copies stayed green.

## Design (hook-health.mjs, win32 branch only)
1. Step 1 runs only when a row is unhealthy and validateShape(settings) returns null. It runs install's own merge for that one row on structuredClone(settings): mergeRepoHooks with wanted [w], then mergeHooks([w]) when nothing was found. That is stepSettings' order. The caller's settings are never changed.
2. The entries install leaves are the targets hookTargets still reads on the copy that do not resolve inside the checkout. Drop duplicates.
3. Keep today's detail text, because doctor-detail's R-393 check matches it on the Windows leg. When the list is not empty, append: `; install leaves <path>[, <path>] as written — edit that entry to run <w.entry.args[0]> or remove it by hand, then run nana-setup install`.
4. A row with nothing left keeps today's detail exactly. The POSIX branch, settings.mjs, doctor.mjs and the summary line do not change.

## Must-meet
File: packages/nana-setup/tests/win32-hook-repair.test.mjs. Every check forces NANA_SETUP_PLATFORM=win32 through the file's run(), so it runs on all three legs with no skip.

| Row | Text | file::title | Red today |
|---|---|---|---|
| R-2410 | WHERE the platform is win32, IF a ✗ settings row holds an entry that install leaves as written and whose script is missing or outside this checkout, THEN doctor's ✗ line shall name that script path with the hand repair: edit that entry to run this checkout's script, or remove it. | ::win32 doctor: after install, a ✗ settings row names each dead entry install leaves and its hand repair | yes. Probe: no path and no fix on any line. |
| R-2411 | WHERE the platform is win32, IF a ✗ settings row holds a dead entry that install repairs, THEN doctor's ✗ line shall leave that entry out of its hand repair. | ::win32 doctor: a ✗ settings row never names an entry install repairs as a hand repair | no, a guard. Probed: "name every dead target" and "a hand repair on every ✗ row" each turn it red. |
| R-2412 | WHERE the platform is win32, IF settings.json parses but holds a hooks shape install will not edit, THEN doctor shall still print all six settings rows as ✗. | ::win32 doctor: a settings shape install refuses still prints all six settings rows as ✗ | no, a guard. Probed: the original plan's unguarded merge makes doctor throw a TypeError and print no rows. |

Fixtures (built from POSIX desiredHooks entries with only command or args changed, so nana's message and timeout 5 stay):
- R-2410: home V after one install. Each of the six lines is ✗ and holds its dead path, `w.entry.args[0]` and "by hand". Doctor also runs on F4's home after its install: the objective line holds `/Users/someone/custom/nana-objective.mjs` and "by hand".
- R-2411: a home never installed. It holds the six carried POSIX installer entries (the R-1880 to R-1881 shapes), plus an objective look-alike `node '/Users/other/custom/nana-objective.mjs'` with timeout 10. All six rows read ✗, and only the objective line says "by hand". That line does not hold `/Users/someone/.claude/hooks/nana-objective.mjs`.
- R-2412: SessionStart holds one carried objective entry, and UserPromptSubmit is the string "not a list". Doctor prints six ✗ settings lines, and stderr holds no TypeError.

## Known limits
- Install still leaves a dead hand-written or look-alike entry as written (R-653, R-923). Until the owner edits it, Claude Code keeps running it at each event and it fails (inferred).
- macOS and Linux do not change. Their five hook rows never check targets. A dead hand-written knowledge entry there reads ✗ with today's detail.
- Install and doctor do not read a script path whose last separator is `\`, or a `node.exe` interpreter, as running the script (R-923's limit). So doctor never names that entry. Install adds a working entry beside it, and the row reads ✓.
- Before install, a row can hold one entry install repairs and one it leaves. Its ✗ line names only the second, while the summary sends the row to install. After install, the summary lists the row as a fix by hand.
- The session-start stale-copy notice still names only rows, not entries.