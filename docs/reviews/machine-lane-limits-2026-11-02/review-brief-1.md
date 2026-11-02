Feature: FEAT-006 · Launch builders with execution limits

Lane machine-lane-limits. Class: hook (`packages/nana-pack/bin/nana-roster.mjs`, imported by the pi roster-notice extension). Threat model: honest variation in our tools' output is in scope (no roster file, no `lanes` member, a malformed, zero, negative or non-integer value, an older checkout, Windows copies of the rules); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/machine-lane-limits`. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`). `build-brief-1.md` and `build-evidence.md` record the build; `seat-mutate.mjs` and `seat-mutate.log` are the wrong-code pairs (12 of 12 red); `seat-install-check.txt` is the seat's macOS install check (exit 0). The owner's words: "the lane limit should be 4 on mac, and 2 or however many thats appropriate for the windows machine specs, essentially calculated per machine".

The change: an optional `lanes` member in each machine's roster file, read by `nana-roster` and shown as its own line and in the Claude Code session-start notice; a missing value is 4 and a bad value falls back to 4 with one warning; one new ruling replaces the 2026-10-31 ruling and the seat guide points to the roster line. R-3520 to R-3525; R-1123 and R-1140 reworded.

Question: does the feature work for its user, a seat on each machine reading its own build-lane limit; and does the change cause a harm the review standard lists? Check especially that a machine with no `lanes` member behaves exactly as today, that a bad value never stops the roster or a build, and that an older checkout reading a new roster file does not break.

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
