# win-config-json-path — plan attack (one adversary)

Verdict: AMEND

I tested the plan in a temp clone with a temp home; real home files were checked and are untouched. The lane's goal holds, so AMEND, not DROP. Main has moved to 6bc2f727 (win-silent-skips, win-hook-settings-repair and win-watchdog-cpu-read have landed).

Confirmed:
- Today the hook and pi both print the default nana-objective.md block with no notice. pi also sets the gate stop.
- Doctor prints only "missing or unparseable".
- V8 reports line 2 column 48 for fixtures (a) and (b). CRLF counts as one line. Node 24.22.0 prints the same "(line L column C)" suffix as 22.22.2, which cuts the plan's main risk.

Amendment (subtraction):
- config.ts now attaches configFailure to the objective settings from its one existing read, in both loadConfig and loadUserObjective. The plan instead added a second read through a new userConfigJsonFailure() and edited the hook and the extension to pass it.
- R-018's byte identity now holds by construction, with no second read and no read-to-read race.
- bin/nana-objective.mjs, extensions/nana-objective.ts and steps.mjs drop out of the lane.
- R-1973 drops. It guarded only that second read; its ID stays unused.
- Doctor's helper lives in doctor.mjs and uses the json-text import doctor already has. The long steps.mjs import line that setup-checkout-spelling is likely to edit stays untouched.
- R-1972's check goes beside the R-1586 check, not at the file's tail, to avoid a tail collision with doctor-fix-line.
- Doctor uses the same three fixtures as the hook test, so one place, line 2 column 48, everywhere.

Prototype (about 60 lines, 3 source files plus doctor.mjs):
- The three must-meet checks are red on today's code and green with the prototype.
- These stayed green: objective-golden (1236 PASS), objective-injection, config-normalize, config-display-text, config-gate-fallback, config-handlers-malformed, writing-injection, bounded-read, agent-dir-hostile, doctor-detail, relative-agent-dir, install and fresh-machine.
- The readme check found 0 problems, and the rehearsal plans no command for step 7.
- Wrong code that turned a check red in the prototype: W1, W2, W3, W5, W6 and W8.

Other findings:
- The plan's conflict note guessed that setup-checkout-spelling rewrites README steps 3, 4 and 8. Its spec covers only the realpath compare sites.
- doctor-fix-line is the real overlap, on the pi nana-pack.json add() call.
