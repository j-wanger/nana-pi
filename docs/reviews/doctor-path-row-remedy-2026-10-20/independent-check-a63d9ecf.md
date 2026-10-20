# Independent check — doctor-path-row-remedy at 452cd604 (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at 452cd604, plus a baseline clone at 72abe19a for comparison. Every run used a temp HOME, a stub pi and a controlled PATH. The CLI ran under `env -i`, so no real launchd and no real ~/.local was touched. In the outputs below, H stands for the temp home and T for the checkout.

Must-meet file: `node packages/nana-setup/tests/doctor-fix-line.test.mjs` printed PASS for R-1990–R-1997 and R-2320–R-2325, then "PASS summary: 0 failures". Its temp root was removed when it exited.

Adjacent checks:
- `doctor-runtime.test.mjs`, `win-shims.test.mjs` and `doctor-detail.test.mjs` printed 21, 2 and 72 PASS lines, with no FAIL lines. win-shims exited 0.
- `readme-check`: "724 claims checked; 0 problem(s)".
- `code-map --check`: "0 problem(s)".
- The clone was still clean afterwards.

P1. Healthy installed home, bin folder on PATH, lane vs main: `probe.sh lane|main H "stub:H/.local/bin:nodebin:/usr/bin:/bin"`, outputs normalised and diffed.
→ "IDENTICAL main vs lane (release row excluded)". Row: "✓ PATH resolves pi-review  H/.local/bin/pi-review resolves to this checkout". HOLDS, no change to the healthy case.

P2. Launcher removed, bin folder on PATH. Ran main, then lane, then followed the advice with `install --home H`, then doctor again.
- Main: "add H/.local/bin to PATH — zsh: echo …"; last line lists "PATH resolves pi-review" by hand.
- Lane: "pi-review not found on PATH; H/.local/bin is on PATH — run `nana-setup install` to recreate the launcher". Last line: "4 missing — fix by hand …: pi pi-subagents; then run: nana-setup install for the other 3".
- Install printed "+ PATH pi-review  created". The next doctor run printed "✓ PATH resolves pi-review". HOLDS: the advice is right and fixes the row.

P3. PATH entry written with a trailing slash (`H/.local/bin/`).
- Doctor gives the row to install.
- Install prints "+ PATH pi-review created" and also "– PATH check skipped  H/.local/bin is not on this shell's PATH — add it".
- The next doctor run shows ✓. HOLDS. The contradiction is a known bug, already in the plan's Known limits.

P4. Launcher is a link to another checkout.
- Doctor says "pi-review resolves to H/.local/bin/pi-review; H/.local/bin is on PATH — run `nana-setup install`…" and gives the row to install.
- Install printed "updated  relinked (was T/…/pi-review.mjs)". The next doctor run shows ✓. HOLDS.

P5. The user's own executable `pi-review` file sits in the bin folder.
- Doctor gives the row to install. Install printed "updated  backed up pi-review -> pi-review.bak-20261020". The backup still holds "echo my own pi-review", so no data is lost.
- I listed the home's tree with stat before and after a doctor run. The only difference was the mtime of `.pi/agent/nana-knowledge/index.db-shm`, a SQLite file. Main's doctor changes it the same way, so this predates the lane. HOLDS.

P6. The PATH entry spells the bin folder through `/private/var/...` while HOME is `/var/...` (a linked parent).
- Doctor falls back to today's "add H/.local/bin to PATH …" and lists the row by hand. HOLDS: it is conservative, and the plan's Known limits already cover it.

P7. Forced win32. The Path entry is `  "<BIN UPPER-CASED>/"  ` (spaces, quotes, trailing slash) and the .cmd shim is removed.
- Row: "$P/home/w1/.local/bin is on PATH — run `nana-setup install` to recreate the launcher". Last line: "…pi packages; then run: nana-setup install for the other 2". The row is not in the by-hand list. HOLDS.

P8. Forced win32 with the bin folder off the Path, and again with only a `.local/bin2` entry, which shares its name start with the bin folder.
- Both print "add $P/home/w1/.local/bin to the user Path in Environment Variables…" and list the row by hand. HOLDS: a folder with a similar name is not treated as the bin folder.

P9. PATH unset entirely.
- Doctor prints the by-hand row, the last line lists "PATH resolves pi-review" by hand, and there is no stack trace. HOLDS.

P10. A non-executable `pi-review` sits in an earlier PATH folder.
- Doctor gives the row to install.
- After relinking, zsh and bash both resolve `H/.local/bin/pi-review`. Doctor's skip of the non-executable file matches the shells. HOLDS.

CI on 452cd604, as of my check: both install-check jobs, macOS and Windows, finished green. The suite jobs on all three systems were still running.

Findings (no MUST):
- Known bug, already in Known limits: install's "PATH check" compares exact strings. With a trailing-slash or `//` PATH entry, doctor says "is on PATH — run install" and install says "not on this shell's PATH — add it" (P3). The launcher is still created, so nothing breaks.
- Known bug, already in Known limits: a PATH entry that reaches the bin folder through a linked parent counts as off PATH (P6). Doctor then gives today's add-to-PATH advice.
- Unverified: the native win32 check for another pi-review earlier on the Path (R-2324 and R-2325 on Windows). It runs only on the Windows suite leg, which was still running when I checked. A Mac cannot run it, because the Windows lookup never finds a file on a POSIX host.

Harm check:
- Data: none lost. Install backs up a user's own file before linking (P5).
- Writes: no test or probe wrote outside a temp folder. The real `~/.local/bin/pi-review` link still carries its Sep 18 timestamp.
- Gate and land tools: the lane does not touch them.
- Main's behaviour: the healthy case prints the same output as main (P1).

Worktree `<worktrees>/doctor-path-row-remedy` is still at 452cd604. Its only untracked file, `docs/reviews/doctor-path-row-remedy-2026-10-20/seat-mutate.mjs`, is not mine. I removed the private probe folder.
