# FEAT-033 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- g005-carveout: the export rule stays untested. No check scans modules for a default export; a reviewer reads the rule.
- g005-carveout: a project made from the template gets the new export wording at its next template update. Until it copies the wording into its own ledger, its rail prints one drift line that does not fail. trading-zone needs a follow-up lane in its own repo for that copy.
- g005-carveout: Python projects carry the pi wording too, where it does not apply. It is harmless.
- g005-carveout: on Windows, the rule and skill copies take the new wording only at the next install.
- g005-carveout: the product report's assessment of the engineering-standards feature stays out of date until the queued report refresh.
- Precedent ruling (audit re-check, 2026-10-22): no test pins the ruling's content, the spec skill reads no code, and lessons and review findings reach no planner.
- Shared helpers (shared-helpers, plan): the pid-alive checks keep nine copies with three meanings (dead only on ESRCH, alive or EPERM, and the desk's); merging them would change lock takeover.
- Shared helpers (shared-helpers, plan): the mutation runner keeps its own transient code list for lock waits, so the rename codes and the lock-wait codes can differ.
- Shared helpers (shared-helpers, plan): the desk keeps its own kill, not a group kill off Windows, and its own pid check, until the owner reopens it.
- Shared helpers (shared-helpers, plan and independent check): the tree-kill scan does not cover rename copies; a `process.kill(-pid, 0)` probe, a trailing comment holding `kill(-` and a message string starting with "taskkill" trip it, while an unquoted trailing taskkill mention does not (measured).
- Shared helpers (shared-helpers, independent check): the tree-kill scan misses a taskkill reached through `cmd /c` or an absolute path, a negative pid passed by variable, arithmetic or a wrapped call line, a kill through another tool such as PowerShell's Stop-Process, `.cjs` files, and file names git quotes (measured).
- Shared helpers (shared-helpers, plan): eleven rename sites still have no retry.
- Shared helpers (shared-helpers, plan): no test pins pi-watchdog's extra off-Windows `child.kill` after the group signal, or bounded-spawn-child's direct-child fallback; review checks them by reading.
- Shared helpers (shared-helpers, plan): on Windows the new reuse ruling reaches a seat only at its next install.
- Shared helpers (shared-helpers, wrong-code pairs): with the no-wait form's error listener removed, or a win32-only rename gate, the process-tree and rename-retry test files throw before their named check, so the suite fails with a stack rather than the row's title.
- Shared helpers (shared-helpers, independent check): the pack README says the rename helper retries EPERM, EBUSY and EACCES three times; it makes three attempts, two of them retries.
- Shared helpers (shared-helpers, independent check): `killProcessTreeNoWait` listens for the taskkill child's `error` with `once`, where post-edit used `on`, so a second error event from that child would go unhandled (inferred unlikely: nothing signals that child).
