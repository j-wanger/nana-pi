# FEAT-044 — known bugs

*One line per known bug in this feature.*

- Seat push (plan residual): the 88 shared index entries are not in the store; the index stays beside the push until a replay supports dropping it.
- Seat push (plan residual A4): evidence is not rechecked at push time; upkeep owns rechecking.
- Seat push (plan residual, attack N2): a reworded re-extraction of a retracted claim gets a new id and returns on the next push.
- Seat push (plan residual): a seat-invented retract quote passes the non-empty check; the header asks for the owner's word.
- Seat push (plan residual): the replay judges the project part only because frozen candidates hold no saved profile records.
- Seat push (plan residual): project auto-memory MEMORY.md loads outside the 9,000-character hook budget.
