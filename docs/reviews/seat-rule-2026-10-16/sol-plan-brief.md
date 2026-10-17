# Plan review — seat-rule, 2026-10-16 (gpt-5.6-sol; small lane: one round)

Review `CHANGE.md` in this folder on `feat/seat-rule` (main `c514964`). The owner asked, on 2026-10-16, that the seat
consider parallel work by default, after its lanes ran slower than expected, and then chose: one rule in the seat guide
that makes parallel work the default, and a lane limit of two lanes building plus one being planned. A shared split
mutation runner and a measured runtime map follow as later lanes. The plan rewords one row (R-1140) and one test file;
`nana-seat.proposed.md` is the byte source of the new guide, `proposed-seat-rule.test.mjs` the proposed test, and
`sim-pairs.mjs` simulates the wrong-code pairs. Two critiques of the draft are here too.

Threat model: honest variation in our tools' output and users' files in scope (CRLF copies, the Windows copy of the
rule, seats in other projects); deliberate forgery out. Lane class: small. The review standard pi-review appends
governs the bar and the verdict line.

Check: (1) the rule says what the owner chose and nothing more, in words a seat will follow; (2) the reworded row has
one "shall" and its tests pin each clause; (3) nothing else that reads the guide or the row (the shared section's
pointer, the setup README, other tests) is left contradicting it; (4) any MUST.
