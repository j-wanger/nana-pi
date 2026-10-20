# doctor-path-row-remedy — must-meet

Feature: FEAT-015 · Diagnose the active environment
Sentence: when `PATH resolves pi-review` is ✗ on the real home, the bin folder is already a PATH entry and no earlier entry holds a pi-review, doctor's row says to run `nana-setup install` and the last line counts the row among install's repairs. In every other case both keep today's add-to-PATH fix by hand.
Class: install, hook or gate (nana-setup doctor). Builder: Claude Sonnet subagent (simple lane).
Stakes: low blast, reversible. One row's advice changes, and so does how the last line sorts that row.
Threat model: honest PATH layouts, letter case and platforms are in scope. That covers the bin folder on or off PATH, another pi-review before or after it, and a Windows Path entry in another letter case. Deliberate forgery is out of scope.
Closes the HANDOFF residual "it always lists the Path row for pi-review by hand" (doctor-fix-line).

## Design
- doctor.mjs, PATH section, both branches. On win32, split PATH on ";" with findOnPath's trim and quote strip. On POSIX, split on path.delimiter.
- binAt is the first entry equal to the bin folder. win32 compares path.win32.resolve on both sides, lowercased. POSIX compares path.resolve.
- installFixes = !matches && binAt >= 0 && no pi-review resolves from the entries before binAt.
  - POSIX: firstOnPath(name, slice).
  - win32: findOnPath(name, { env: { PATH: slice, PATHEXT } }), with no spread of process.env.
- When installFixes is true, the detail reads `<found | not found>; <bin> is on PATH — run \`nana-setup install\` to recreate the launcher` and the row gets installLabel "PATH pi-review". Otherwise doctor keeps today's detail and sets no installLabel.
- nana-setup.mjs is unchanged. Its installLabel mapping already lets install's dry run decide, so a launcher install would leave unchanged keeps the row by hand.
- In the nana-setup README, the dry-run paragraph's "A row with no install step, such as `PATH resolves pi-review`, is listed by hand." becomes the new rule.

## Fixtures (doctor-fix-line.test.mjs)
- Native home: `install --home`, then remove the launcher (pi-review.cmd on a win32 host, the pi-review link otherwise).
- doctor runs with NO --home (the real-home branch), with HOME and USERPROFILE set to the fixture.
- PATH is a controlled list: stub, bin, other, node's folder, and System32 on a win32 host.
- Forced-win32 home: install, remove pi-review.cmd, then a Path of [bin upper-cased, stub, node, (System32)] joined with ";".
- R-2323 runs forced win32 on every host. The rest run natively on all three hosts. No skips.

## Assertions
- "By hand" means the row is ✗ and is in the list that R-1993's regex reads from the last line.
- "Among install's repairs" means the row is ✗ and not in that list, and the summary is `<n> missing — run: nana-setup install` or ends `; then run: nana-setup install for the other <m>`. Either form may end in ` (and see the <w> ! above)`.
- The refusal and could-not-predict lines fail "among install's repairs".
- No exact counts, so another platform's extra ✗ rows cannot break the checks.

## Must-meet (file: packages/nana-setup/tests/doctor-fix-line.test.mjs)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-2320 | WHEN doctor runs on the real home whose bin folder is an entry on PATH, no earlier PATH entry holds a pi-review, and the bin folder's pi-review launcher is missing, THEN the `PATH resolves pi-review` row's detail shall name `nana-setup install` and not tell the user to add the bin folder to PATH. | R-2320: with the bin folder on PATH and its pi-review launcher removed, the PATH resolves pi-review row names nana-setup install instead of the PATH fix | Red. Probe on 72abe19a: the row says "add <bin> to PATH — zsh: echo …" |
| R-2321 | WHEN doctor runs on the real home whose bin folder is an entry on PATH, no earlier PATH entry holds a pi-review, and the bin folder's pi-review launcher is missing, THEN the summary shall count `PATH resolves pi-review` among install's repairs. | R-2321: with the bin folder on PATH and its pi-review launcher removed, the summary gives PATH resolves pi-review to install | Red. Main: "3 missing — fix by hand …: PATH resolves pi-review; then run: nana-setup install for the other 2". Fix: "3 missing — run: nana-setup install" |
| R-2322 | WHEN doctor runs on the real home whose bin folder is not an entry on PATH and the bin folder's pi-review launcher is missing, THEN the summary shall list `PATH resolves pi-review` as a fix by hand. | R-2322: with the bin folder off PATH and its pi-review launcher removed, the summary lists PATH resolves pi-review by hand | Guard, green today. Red when the label is set always or binAt >= 0 is dropped |
| R-2323 | WHEN doctor runs as win32 on the real home whose Path holds the bin folder in another letter case, no earlier Path entry holds a pi-review, and the `pi-review.cmd` shim is missing, THEN the summary shall count `PATH resolves pi-review` among install's repairs. | R-2323: as win32 with the bin folder on the Path in another letter case and its .cmd shim removed, the summary gives PATH resolves pi-review to install | Red. Forced win32 on macOS: main lists it by hand among 5. Fix gives it to install among "the other 2" |
| R-2324 | WHEN doctor runs on the real home whose bin folder is an entry on PATH, an earlier PATH entry holds a pi-review that is not this checkout's, and the bin folder's pi-review launcher is missing, THEN the summary shall list `PATH resolves pi-review` as a fix by hand. | R-2324: with another pi-review on PATH before the bin folder and the launcher removed, the summary lists PATH resolves pi-review by hand | Guard, green today and with the fix. Red with an "on PATH is enough" check |
| R-2325 | WHEN doctor runs on the real home whose bin folder is an entry on PATH, only a later PATH entry holds a pi-review, and the bin folder's pi-review launcher is missing, THEN the summary shall count `PATH resolves pi-review` among install's repairs. | R-2325: with another pi-review on PATH after the bin folder and the launcher removed, the summary gives PATH resolves pi-review to install | Red. Main lists it by hand. Fix: "3 missing — run: nana-setup install" |

## Known limits
- The win32 shadow lookup runs only on the Windows CI leg. Under forced win32 on a POSIX host, findOnPath never finds a file. The win32 half of R-2324 and R-2325 is proven only when that leg is green.
- POSIX compares path.resolve, not realpath. An entry that reaches the bin folder through a linked parent counts as off PATH. Trailing-slash normalisation is unpinned.
- A stale launcher (a link to another checkout) gets the same advice, and install's dry run would update it. That case is unpinned.
- Install's own "PATH check" line compares exact strings. With a trailing-slash entry it says "not on PATH" while doctor said to run install, but the launcher is still created.
- With an earlier pi-review in the way, the row still says "add <bin> to PATH" although the folder is already there.
- win32: a pi-review.bat or .exe inside the bin folder that PATHEXT finds before .cmd still counts as install's repair.
- POSIX: when the link is intact but its target is not executable, the row says to run install, while the last line lists the row by hand.
- The zsh echo still names $HOME/.local/bin for any bin folder. That gap predates this lane.