## 2026-11-02 — the roster names planning and checking roles

This build serves discovery by letting the seat choose a model for each planning and checking role.
The roster now names planner, adversary and checker slots, and scout accepts either runtime.
Old rosters retain their fallbacks, and slot changes leave unnamed new slots out of the saved file.

Role launches share the builder launcher without taking a lane lock or writing a build record.
They deliver the brief, keep child memory off, and log delivery only after the child starts.
Both seats show the roles and warn about shared or unknown model families.
Windows checks cover batch launches, the time ceiling and forced-stop cleanup.

The seat guide explains the launch commands and when a role stays with the seat.
Context bundles and role memory remain later work.

