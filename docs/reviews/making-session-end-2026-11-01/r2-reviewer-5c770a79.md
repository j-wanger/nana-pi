The round-2 change fixes the status SHOULD and breaks nothing in status, doctor or make. The seat's handling of the MUST also stands under the review standard. I found no new MUST.

**The change since 2bda8638**

- **The fix:** `unpushedProfile` (`packages/nana-pack/lib/profile-sync.mjs:101`) now returns `null` instead of throwing when either git call fails or the count is not a whole number. Status (`bin/nana-memory.mjs:48`) and doctor (`nana-setup/lib/doctor.mjs:514`) both print `unpushed unknown` and keep the rest of their line. This matches the widened R-3356.
- **Status:** a missing tracking ref or a detached HEAD now exits 0 with `last …; pending …; unparseable …; unpushed unknown`. Before, it exited 1 with `memory: failed`, which is what the land reviewer reported.
- **Doctor:** the same two cases now show `enabled 1; last never; unpushed unknown` instead of `unreadable`. When the store itself can't be read, or the local last-run file is malformed, `localMemoryRun` still throws and doctor still shows `unreadable`, as must-meet 7 requires.
- **Make:** not affected. Only status and doctor call `unpushedProfile`, and `makeMemory` does not.
- **Test:** `R-3356` now runs a missing-tracking-ref case and a detached-HEAD case through both status and doctor. With the fix reverted, status returns 1 and doctor returns `unreadable`, so the test would fail. I ran `memory-session-end.test.mjs` and every check passed, R-3356 included.
- **Paperwork:** the known-bug line for the fixed bug is removed. The A6 line now names the quoting cause. The A4 SHOULD is recorded. The session-note counts match the edits, and the code-map line-number shift is correct.
- **Harms:** none from the review standard. Nothing new is written, nothing writes outside its place, and no hook or install path changes.

**The seat's ruling on the round-1 MUST stands**

- **The cause is outside this lane:** `git diff origin/main...HEAD -- scripts/` is empty, so `scripts/memory-shape-runners.mjs:27` (`spawnSync("claude", …)`) is unchanged.
- **Main already behaves this way:** land-time making on a Windows machine with npm-installed Claude Code fails the same way today. The making-trigger land accepted that as residual A6. This lane does not stop anything that works on main.
- **The block is real:** `winCommand` refuses `"` (`packages/nana-pack/lib/win-command.mjs:49`), and the claude runner passes a JSON schema argument full of double quotes. Changing the cmd.exe quoting is security-relevant and belongs in its own lane.
- **Native installs work:** Node's spawn without a shell finds `.exe` files on PATH, so the native `claude.exe` starts. The feature's main use is not stopped on Windows as a whole, only for npm installs.
- **The failure is visible and harmless:** the hook still exits within its limit. A failed spawn uses no tokens, the units stay pending, and status and doctor show the outcome. At most each session end on such a machine adds one store commit and push. That is noise, not lost data.

The finding is real, but it fits the known-bug class better than MUST.

**Notes, none blocking**

- The `catch` in `unpushedProfile` also hides a git timeout as `unknown`. That is acceptable for a count-only, informational line.
- On a machine with npm-installed Claude Code, session-end making raises the commit and push rate from once per land to once per exit. If that becomes visible, the A6 line could say so.
- Because npm installs fail and native installs work, the owner's Windows check should confirm which Claude Code install the machine runs.

VERDICT: LAND
