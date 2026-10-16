# Seat's checks of build 5 (2026-10-16, at cd8991b)

Build brief 5 was a closed list (proportional stopping, `seat-verify-8c7ed24.md`); no independent check round followed it.
- Full suite at the tip: 145 files, 143 pass, 0 fail, 2 skip; 7,337 checks pass, 0 fail.
- CI on draft PR #13 at cd8991b: macOS suite, macOS and Windows install checks green. The Linux and Windows suite legs
  fail exactly the 69 files main's own run 38830270269 fails (the seat compared the two lists: none new, none fixed).
- The seat's mutation runner, extended for build 5 (one pair re-anchored, 14 new pairs B5/1-B5/14): 208 of 209 red
  (`seat-mutate-output-cd8991b.txt`). The survivor, B5/7, blanks the reserved feature's status cell in the page's
  feature table: the page prints it from the seed, but T14 matches `active` anywhere in the table. Recorded as a residual.
- The seat's acceptance: only its own HANDOFF and session cases missed before these notes.
