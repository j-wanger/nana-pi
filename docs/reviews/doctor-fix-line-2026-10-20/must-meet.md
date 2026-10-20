# doctor-fix-line — must-meet

Feature: FEAT-015 · Diagnose the active environment
Class: install/hook/gate (doctor). Ladder: reviewer, land reviewer, the seat's wrong-code pairs, one independent check, the mutation runner. Run install-check on macOS before nana-land.
Build: complex. The larger builder runs it through pi-worker.
Threat model: honest machine states are in scope: fresh, installed, partly installed, a foreign skill folder, an unparseable settings.json, win32 with the bin folder off the Path. A forged plan, label or home is out.

Feature: when doctor finds ✗ rows, its last line names `nana-setup install` only for the ✗ rows install's own dry run would repair. It lists every other ✗ row by label as a fix by hand, and it names install's refusal when install would refuse the home. Exit codes, row text, the !-only line and `all good` stay as they are.

## What is wrong (main 531ff1ec, temp copy, macOS)
runDoctor prints `<n> missing — run: nana-setup install` for any ✗:
- `install --home` without pi-subagents: `1 missing — run: …`. Install never installs pi-subagents.
- A foreign folder at skills/spec plus two removed rules: `3 missing — run: …`. Install refuses spec.
- settings.json `{"hooks": {},}`: `34 missing — run: …`. Install aborts before any write.
- A forced-win32 real home: `… missing — run: …` beside ✗ PATH resolves pi-review. Install cannot put the bin folder on the Path.
- git grep finds no test that pins the summary line.

## Design
- Install decides. Only when some row is ✗, runDoctor calls refuseCwdRelativePiHome(layout, "this install"), then install(layout, { dryRun: true }). A ✗ row is install's when a dry-run row labelled `row.installLabel ?? row.label` has status created or updated. Every other ✗ row is a fix by hand. A SetupError is the refusal; any other error propagates. Prior art: R-1762 asks stepSkills' dry run the same question.
- diagnose's add() takes an optional 4th argument, installLabel, stored only when given. Three rows pass it: rule nana-personal.md → "rule nana-personal.md (private)"; shared memory index → "shared memory MEMORY.md"; pi objective file → "pi nana-objective.md". Rows with no install row (node floor, pi executable, pi-subagents, mcp.json, projectFile, PATH resolves pi-review, pi package source, desk service) are by hand by construction.
- Last-line forms. Each keeps today's ` (and see the <w> ! above)` while w > 0.
  - All rows are install's: `<n> missing — run: nana-setup install`, byte-identical to today.
  - None is install's: `<n> missing — fix by hand as each ✗ line says: <labels>`
  - Mixed: `<n> missing — fix by hand as each ✗ line says: <labels>; then run: nana-setup install for the other <m>`
  - Refusal: `<n> missing — nana-setup install will not run until this is fixed: <first line of the refusal>`
  - Labels appear in row order, once each, joined by `, `.

## Must-meet (packages/nana-setup/tests/doctor-fix-line.test.mjs::title)
| # | Row | Test title | Red today |
|---|---|---|---|
| M1 | R-1990 | `R-1990: when install repairs every ✗ row, the summary reads n missing — run: nana-setup install` | Control, green on main. W1 turns it red (probed). |
| M2 | R-1991 | `R-1991: when no ✗ row is install's, the summary lists each as a fix by hand and never names install` | Red: main prints `1 missing — run: …`. |
| M3 | R-1992 | `R-1992: a refused skill and two missing rules: the summary lists only the skill by hand and gives install the other 2` | Red: main prints `3 missing — run: …`. W2 and W8 turn it red. |
| M4 | R-1993 | `R-1993: on win32's real home with its bin folder off the Path, the summary lists PATH resolves pi-review as a fix by hand` | Red on main. W3 turns it red. NANA_SETUP_PLATFORM=win32 on every leg, no skip. |
| M5 | R-1994 | `R-1994: when install refuses the home, the summary names the refusal instead of telling the user to run install` | Red on main. W4 turns it red. |
| M6 | R-1995 | `R-1995: doctor on a home install would change leaves every file, folder and link unchanged` | Pin, green on main. W5 turns it red. |
| M7 | R-1996 | `R-1996: with a ! row, both by-hand summary forms still end with the ! count` | Red on main. W6, W6b and W7 turn it red. |
Row text is in the rows list. These rows stay guarded: R-341 (exit 1; M2 to M7 assert it), R-346, and R-1546 with R-1851 (`all good` unchanged).

## Evidence (temp copy of main 531ff1ec, macOS)
- The amended test passes 7/7 on a prototype of about 25 lines, both natively and with every run forced to win32.
- On main code, M1 and M6 pass and the other 5 fail.
- Each wrong code turned its named check red:
  - W1 (join by row.label only) → M1
  - W2 (any dry-run status counts) → M3
  - W3 (PATH resolves pi-review → "PATH pi-review") → M4
  - W4 (a refusal prints today's line) → M5
  - W5 (install without dryRun) → M6
  - W6 (drop the ! suffix from both by-hand forms) → M7
  - W6b (drop it from the mixed form only) → M7
  - W7 (all-by-hand prints today's line) → M2 and M7
  - W8 (install gets the by-hand count) → M3. The plan's one-rule M3 missed W8.
- Existing files on the prototype: relative-agent-dir 30/30, doctor-quiet 4/4, doctor-detail 68/68, stale-copies 13/13, win32-degrade 87/87, retired-artifacts 47/47.
- Six odd homes probed. None crashed doctor; .claude as a file takes the refusal form. Doctor's run time did not change (0.33 s against 0.32 to 0.37 s).

## Known limits
- PATH resolves pi-review is always listed by hand, including when the bin folder is on PATH and only the link or shim is missing, which install does fix. The narrowed R-1993 does not demand this.
- The summary trusts install's prediction. A leftover settings lock (the dry run takes no lock), rules or .pi saved as a file, a failed knowledge build or a failed `pi install` still get "run install".
- "As each ✗ line says": some ✗ lines name no fix, such as desk service, a corrupt knowledge index, an unparseable nana-pack.json, and a POSIX skill link to another folder.
- The refusal form shows only the first line. No test pins the relative PI_CODING_AGENT_DIR refusal branch.
- On a real home with unregistered pi packages, the dry run starts `pi --version` once more.
- Native Windows is not probed. Forced win32 on macOS is the only evidence until the lane's Windows CI leg runs.