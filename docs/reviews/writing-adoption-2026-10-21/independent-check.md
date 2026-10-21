# Independent check — writing-adoption at 0671f92e (2026-10-21)

One independent agent (Claude, general-purpose, not the builder's lineage) probed `git archive` exports of 0671f92e and of main 6684365d, each with a temporary HOME.

Verdict: NO MATERIAL FINDING.

What held:
- Upgrade: main's install, then the lane's over it, changed one row (`+ PATH nana-writing created`); a second install was unchanged; doctor exited 0; uninstall removed all five bin links and the rule link and left a foreign file alone. The forced-win32 upgrade was clean too.
- PATH link: bare `nana-writing --report` and `nana-writing file.md` ran from a PATH of the bin folder and node only. A foreign regular file was backed up and replaced, a foreign link relinked, as for the other PATH commands.
- Key: off for the boolean false beside malformed siblings, UTF-16LE with CRLF, UTF-16BE and UTF-8 with a BOM; on for `[false]`, `"False"`, a top-level array, an empty file, a directory, a missing agent dir. No handler threw.
- Cap: 3,955 rule shapes (ASCII prefixes of 3,900-4,010 characters before one to three astral characters, a ZWJ sequence, U+10FFFF, emoji-only, CJK); none over the cap, none with a lone surrogate.
- README and rule: every named command exists after install; the rule passes its own checker; the desk refusal claim holds.

Findings (none MUST):
- SHOULD — the key did not apply live: with `writing.enabled` set false mid-session, the writing section stayed until `/reload`, while the pack README says every non-gate block applies live. Seat: build 4 reads the key each turn, as nana-objective does.
- SHOULD — R-2503's slicer read a fenced `#` line as a heading, so a long sentence after it escaped the check (0 of 430 HANDOFF revisions ever held a fence). Seat: build 4 skips fenced blocks and matches names as nana-frontier does.
- NOTE — the heading match was stricter than nana-frontier's (case, `—` and space suffixes); each case failed loudly, never silently. Seat: build 4 aligns it.
- NOTE — honest content that fails the suite: a live section holding only a table fails "holds a sentence"; a banned word inside a link target is flagged. Seat: known limits.
- NOTE — Windows, read only: the `.cmd` shim passes `%*` and stdin; `nana-writing --report < draft.txt` does not parse in PowerShell, covered by "pass a file there".
- NOTE — R-2499 had no Windows result at the time; the shim code has not changed since 6a9fa725, whose Windows leg was running.

Scripts: the seat's scratch folder (`indep-wa/`), not committed.
