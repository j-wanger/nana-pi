# Builder context replay — 2026-11-02

The replay harness now rebuilds a first build with one kind of context removed.
It serves the priority of measuring which builder context changes builds.

Each run starts from the recorded starting tree in a macOS sandbox.
The harness records spend before launch and never automatically repeats an interrupted run.
Frozen checks arrive after the builder stops.
The output keeps time, tokens, tools, errors and optional review counts.

Synthetic tests use temporary repositories and unpaid stub processes.
No paid study ran, and no real builder started.
The later study will register its values before it draws conclusions.
Linux and Windows run the portable tests but cannot launch paid replays.
