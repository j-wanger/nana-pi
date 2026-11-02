# FEAT-044 — known bugs

*One line per known bug in this feature.*

- Seat push (plan residual): the 88 shared index entries are not in the store; the index stays beside the push until a replay supports dropping it.
- Seat push (plan residual A4): evidence is not rechecked at push time; upkeep owns rechecking.
- Seat push (plan residual): a seat-invented retract quote passes the non-empty check; the header asks for the owner's word.
- Seat push (plan residual): the replay judges the project part only because frozen candidates hold no saved profile records.
- Seat push (plan residual): project auto-memory MEMORY.md loads outside the 9,000-character hook budget.
- Seat push (seat-memory-push, independent check): git that ignores SIGTERM can keep the hook running past Claude Code's 5 s SessionStart timeout; push output arrives only at process exit.
- Seat push (seat-memory-push, independent check): git calls taking over 1 s lose the push even with about 3 s of hook deadline remaining; the load log reports `deadline`.
- Seat push (seat-memory-push, independent check): the static `memory-render.mjs` import can crash the hook if nana-pack is absent beside nana-setup; installs run from the checkout.
- Seat push (seat-memory-push, review round 1): outside a git repository, no memory push runs, including profile records; the load log says `repository` despite README wording that profile loads elsewhere.
- Seat push (seat-memory-push, review round 1): `runMemory` reads `nana-pack.json` before repository roots, so simultaneous config and git failures report `memory: invalid command` instead of the earlier unavailable or git error.
- Seat push (seat-memory-push, review round 1): B3 compares skipped output with its worker-role lane hook rather than main's hook; parity depends on other checks and manual comparison.
- Seat push (seat-memory-push, review round 1): the README says the seat line covers shared-memory index and push, but the outcome meter ignores hook lines without `parts`.
- Seat push (seat-memory-push, review round 1): `readMemoryStore` reads all files before checking the push deadline, so a sufficiently large store could overrun the remaining budget.
