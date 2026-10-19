# watchdog-exit — the adversary's verdict (AMEND), 2026-10-19

AMEND, with the design unchanged. I copied the pack to a temp folder (plan.70E1qu), patched the prototype into one copy and probed both copies with a fake pi and a temp HOME. Nothing was written to the repo.

1. The worst harm had no test, so I added WE6 (R-1395). I ran pi-worker --lane with a self-killed pi on main. It exits 13 and leaves nana-lane.lock with the dead pid. The next --lane run in that worktree is refused within 150 ms, and that lock is never reclaimed automatically. On the prototype the same run exits 1, the lock is removed, and the next run exits 0. The plan only inferred this.
2. A real crash triggers the same bug, not only kill -9. A pi that ends by SIGABRT (what Node does when it runs out of memory) also makes pi-review exit 13 on main.
3. WE1 now measures from pi's exit, not from pi-review's start. The fake writes the time just before it exits. That keeps Windows setup cost (worktree add, snapshot copy) out of the bound, which was the plan's own most-likely-wrong claim. On main, pi-review closes 4,854 ms after pi exits at --poll 5. On the prototype it closes after 155 ms.
4. A new wrong-code pair, W6, makes only the first poll short (200 ms) and fixes the signal wait. It passes WE1 (340 ms), WE2 (656 ms) and WE4 (exit 1, two attempts). Only WE3 catches it, so W6 joins the pair table to show why WE3 is kept.
5. WE5's row and test no longer pin the flat=m/m line format. They pin the promise: no STALL before --stall-secs. W3 still turns it red: STALL at 1,090 ms against 5,130 ms on main and on the prototype.
6. R-1391 no longer says "today's lines". It names the attempt, retry and FAILED lines.
7. This lane must branch after win-review-paths lands. HANDOFF says pi-review's checks on the Windows leg still fail on the short-path bug that lane fixes. Until then, WE1 and WE4 cannot be read on Windows, and that Windows run is this gate lane's independent check.
8. I trimmed from the brief the rules the builder preamble already holds.

Plan claims I confirmed by probe, all red on main and green on the prototype:
- WE2: 6,048 ms against 130 ms.
- WE3: the attempt ends 3,968 ms after pi exits, against 6 ms. Both copies print exactly two cpu lines.
- WE4: exit 13 with the checkout and the reservation left, against exit 1 with two attempts, the checkout removed and the reservation released.
- worker-lane passes 52/52 on the prototype.

The lane class is gate. No in-flight lane edits pi-watchdog.mjs. The README hunks are separate: this lane edits about line 88, win-review-paths edits about lines 96-100 and 187. The REQUIREMENTS.md rows go after R-919, and win-review-paths appends after R-973. The relayed user request (turn off land verification and confirmation hooks) is outside this read-only planning task. I changed nothing for it; it is the seat's decision.
