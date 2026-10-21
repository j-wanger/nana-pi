# Independent check — win-hook-variant-loop at 32cdb9ee (2026-10-20)

VERDICT: HOLDS

Probes ran in a private clone at 32cdb9ee, with main 9552afb1 cloned beside it for comparison. Each probe used a temp home, made-up names and a stub pi first on PATH. The clone was removed afterwards and no process is left running.

Must-meet and neighbouring test files (`node <file>`, HOME and TMPDIR under <tmp>):
- win32-hook-repair: `SUMMARY  PASS=14 FAIL=0 SKIP=0`. R-2410, R-2411 and R-2412 pass.
- stale-copies 13/13, doctor-detail `ALL PASS`, doctor-fix-line `summary: 0 failures`, win32-degrade exit 0.
- `code-map.mjs --check` reports 0 problems and `readme-check.mjs` reports 0 problems. The clone's git status is empty after every run.

P1. Doctor before install, forced win32, main vs lane. The home holds a double-quoted objective, an exec-form verifier at `C:/Users/someone-else/custom/` under matcher Bash, and a knowledge entry whose path has a space.
  - main: `✗ settings SessionStart objective  nana-objective.mjs — target is missing or does not resolve inside <tmp>/main`. The line names no entry.
  - lane: `… inside <tmp>/lane; install leaves /Users/someone-else/.claude/hooks/nana-objective.mjs as written — edit that entry to run <tmp>/lane/packages/nana-setup/claude/hooks/nana-objective.mjs or remove it by hand, then run nana-setup install`.
  - lane also names `C:/Users/someone-else/custom/verifier-pipe.mjs` and `/Users/someone-else/my code/nana-pi/…/nana-knowledge.ts`, the space kept. The other three rows keep today's detail.
  - Verdict: works.

P2. Install, then doctor, on the same home (lane, win32). Install prints `already wired` for objective and knowledge and `added` for the other four.
  - Doctor shows three ✗ lines, and each names its dead entry with the hand repair.
  - Summary: `3 missing — fix by hand as each ✗ line says: settings SessionStart objective, settings PreToolUse verifier pipe, settings UserPromptSubmit knowledge pull`.
  - Verdict: the lines agree with the summary.

P3. Follow the advice. I edited the objective and knowledge entries to the named checkout script, removed the verifier entry, then reinstalled.
  - Install prints `already wired` ×6.
  - Doctor prints `✓` on all six settings rows and `✓ settings lock`.
  - Verdict: the advice repairs the rows.

P4. Telling a repaired entry from a kept one (forced win32). Three entries:
  - an exec entry at an old checkout, timeout 5, nana's message;
  - the same shape with timeout 10;
  - a real file outside the checkout.
  - Doctor names only the second and third: `install leaves C:/old-checkout/…/nana-adoption.mjs as written`, `install leaves <tmp>/other/custom/nana-shared-memory.mjs as written`.
  - After install: objective `+ created added`, then `✓ settings SessionStart objective`. The other two stay ✗ and are listed by hand.
  - Verdict: doctor predicts exactly what install leaves.

P5. macOS host, nothing forced, the P1 home: `diff` of every settings line, main vs lane, gives `IDENTICAL`, 8 lines. Verdict: the POSIX branch is unchanged.

P6. Doctor writes nothing. I took a stat and shasum listing of the whole temp home, ran win32 doctor (exit 1), and listed again: `HOME UNCHANGED after win32 doctor`. Verdict: the simulated merge stays on the clone.

P7. Odd and refused shapes, lane, win32. The six inputs:
  1. null, string, number, non-string command and bad-args entries, plus groups with no hooks;
  2. `{"hooks":null}`;
  3. `[]`;
  4. `hooks:"x"`;
  5. `[null]` under PreToolUse;
  6. an own `__proto__` event.
  - All six: `exit 1 x-rows=6 err=0`.
  - Shapes 1 and 6 name only their dead look-alike (`/Users/someone-else/x/nana-objective.mjs`, `/Users/someone-else/custom/nana-adoption.mjs`).
  - Verdict: no throw on any shape.

P8. Session-start stale-copy producer, win32, installed home with variant entries, main vs lane.
  - Output: `[nana:install] INSTALL STALE: settings SessionStart objective, settings PreToolUse verifier pipe, settings UserPromptSubmit knowledge pull — tell the user; they fix it with … install`.
  - `diff`: `PRODUCER IDENTICAL`.
  - Verdict: no change.

P9. Deeply nested settings that parse: `permissions` 6000 levels deep, plus a dead objective look-alike (win32).
  - `JSON.parse ok depth 6000`, then `structuredClone: RangeError`.
  - main: `doctor exit 1 ; settings rows: 6`.
  - lane: `settings rows: 0; stderr: RangeError: Maximum call stack size exceeded at structuredClone … at hookSettingsRows`.
  - The crash starts at about 2000 levels (1500 is fine). Verdict: known bug, see F1.

Findings (none is a MUST):
- F1, known bug. `hookSettingsRows` has no try/catch, so a settings file nested about 2000 or more levels deep crashes win32 doctor before it prints any row. The session-start producer would show its unavailable marker instead (inferred). Main prints the rows. No real settings file is nested that deep, but the plan says any file that parses is in scope. Fix: wrap the merge simulation in try/catch and keep today's detail.
- F2, known bug, inferred (not run on Windows). On Windows the advice prints `w.entry.args[0]` as `C:\…\nana-pi/packages/…`, because the checkout path keeps its backslashes. Pasted into settings.json as printed, `\U` or `\n` breaks the JSON or changes the path. "Remove it by hand, then run install" is the safe route; the advice could say so first, or print forward slashes.
- F3, known bug. The knowledge row's advice says "run <…/nana-knowledge.ts>" but leaves out the `hook` argument. An exec entry edited to that path alone is not read as the hook. Install then adds a working entry, and the edited entry stays, running the CLI with no subcommand.
- F4, known bug. The new README limit line says doctor names "each one" it leaves. The plan's known limits contradict that: an entry whose path ends in a backslash, or that runs through `node.exe`, is never named, and that row reads ✓. The README line should carry that exception.

HANDOFF on the tip:
- One line becomes untrue and must change: "Hook repair test (win-hook-settings-repair, land review): the Windows hook repair test's header says it runs eight repair checks. It runs eleven. The code map copies the wrong count." The lane makes the header and the code map say fourteen, and the file runs fourteen. Drop or rewrite that line.
- These stay true: the line saying install leaves three carried shapes alone, the backslash-path line, the double-quoted-entry line and the doctor-fix-line entry.
- HANDOFF has no line for this lane yet. The seat owes its landed line and residuals F1 to F4 before the final round.

Other checks: the lane worktree and <home>/nana-pi were not touched. The worktree's two untracked files are the seat's wrong-code pair files, dated before this check. The private copy is removed.