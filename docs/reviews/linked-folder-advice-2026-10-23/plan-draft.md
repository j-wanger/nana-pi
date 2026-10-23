# linked-folder-advice · plan draft (planner, 2026-10-23, main 00617983)

Feature: FEAT-015 · Diagnose the active environment

Why this feature: the advice the owner flagged is doctor's output, its rows and its final line. FEAT-015's purpose is "report what is installed, configured or unhealthy with concrete repair guidance" (`docs/requirements-tree.md:158-163`). The previous lane on this bug, linked-claude-folder-remedy, also ran under FEAT-015. Its one install-behaviour row went to FEAT-013 SUB-014, and this plan does the same for its one install row (R-2704).

Spend line: the owner's 2026-10-23 pick, "Install lane. When the Claude folder is linked, doctor's warnings tell the user to run install. Install refuses to write those files there, so the advice leads nowhere." It serves the install half of the 2026-10-24 priority: nana works the same in terminal mode for both seats on macOS and Windows, installation included. It is HANDOFF Next item 4's first entry ("the linked Claude folder's repair advice").

Stakes: medium blast, reversible. Doctor's text changes only in a home whose Claude or skills folder is a link. Install gains one refusal, before any write, for a link whose target is gone; today that home crashes install. A false refusal on a healthy linked folder would block installs. Pair W12 shows the tests catch that. No stored format changes. A revert restores main.

Every claim is marked measured or inferred. Raw data and scripts are in the scratchpad folder `lfa-plan/`: `probe.mjs` with `results.json`, `probe2.mjs` with `probe2-output.txt`, `probe3.mjs`, `probe5.mjs`, `probe-proto.mjs` with `results-proto.json`. The prototype is `clone-main/` and `clone-proto/` (`git archive` exports of 00617983), with `proto-product.diff` (51 lines) and `proto-tests-final.snippet.mjs`. The pair runners are `pairs.mjs`, `pairs-final.mjs` and `pairs-final2.mjs`, with their `pairs-results*.json`. Every probe ran `node packages/nana-setup/bin/nana-setup.mjs` with HOME, USERPROFILE and TMPDIR set to a temp home under `lfa-plan/`. It passed `--home <temp home>` as the setup tests do, except case M9, and put a pi stub first on PATH that answers only `--version`. The checkout's `git status --ignored` hash was the same before and after (measured). The real `~/.pi/agent` folder's own mtime moved at 11:34. No entry under it is newer than the baseline. Another session's review wrote `review-ledger.*` there at 11:12. None of my commands write there (inferred).

## What I measured

Main 00617983, macOS, through the CLI (measured unless marked). `<h>` is the temp home. "Linked" means a directory symlink, or a junction on win32.

| # | Home layout | Doctor's rows and final line | Install's result | Verdict |
|---|---|---|---|---|
| M1 | `.claude` → `dotfiles-claude`, linked before install. The target holds empty `enforce` and `enforce-memory` and the recognized `py-init` copy (`tests/fixtures/retired/py-init`). | `! legacy enforcement flags  enforce, enforce-memory present — run nana-setup install to back up recognized empty flags` and `! legacy scaffolders  py-init present — run nana-setup install to back up recognized nana-dev-kit copies`. Skill rows: ``install will not add skills under the linked folder `<h>/.claude` — move it aside, then run `nana-setup install` ``. Final line: `34 missing — fix by hand as each ✗ line says: skill requirements, skill spec, skill py-lint, skill py-review, skill py-test; then run: nana-setup install for the other 29 (and see the 2 ! above)`. | Exit 1. `✗ retired .claude/skills/py-init  problem  unsafe source ancestor under <h>/.claude; source left untouched`, and the same for `.claude/enforce` and `.claude/enforce-memory`. 30 changed. A second install: `nothing changed — 8 ✗ needs your attention`. Doctor afterwards: both ! rows unchanged, `5 missing — fix by hand … (and see the 2 ! above)`. | **Leads nowhere: both ! rows.** Moving the three paths by hand turned both rows `✓ none present`. |
| M2 | Installed normally, then `.claude` renamed to `dotfiles-claude` and linked back. Later `enforce` and `py-init` appear. | Skill rows ✓. Both ! rows say run install. Final line `NOT verified — 2 ! above.` | Exit 1, three retired rows ✗ unsafe ancestor plus five skill ✗ rows. Doctor afterwards is unchanged. | **Leads nowhere: both ! rows.** |
| M3 | Real `.claude` holding `enforce`; `.claude/skills` → `dotfiles-skills` holding `py-init`. | Both ! rows say run install. | Exit 1. `✗ retired .claude/skills/py-init … unsafe source ancestor under <h>/.claude`. Install backs up `enforce`; doctor afterwards shows `✓ legacy enforcement flags`. | **Leads nowhere: the scaffolders row only.** The flags row is right. |
| M4 | As M1 under `NANA_SETUP_PLATFORM=win32`, with `enforce` and `py-init`. | The same ! rows. | Exit 1, the same retired ✗ rows. | **Leads nowhere**, as M1. |
| M5 | `.claude` → a target that does not exist. | Skill rows give the move-aside text. Legacy rows ✓. Final line: `34 missing — fix by hand as each ✗ line says: skill requirements, …, skill py-test; then run: nana-setup install for the other 29`. | `install --dry-run` exits 1 with five skill ✗ rows only. `install` exits 1 with a stack: `Error: ENOENT: no such file or directory, mkdir '<h>/.claude'` at `withSettingsLock (steps.mjs:518)`. The session-start producer prints nothing. | **Crash: the final line** (known bug FEAT-015:130). |
| M6 | Real `.claude`; `.claude/hooks` → nothing. The same with `.claude/rules` and with `.claude/nana-memory`. | Final line `34 missing — run: nana-setup install` in all three. | Exit 1, a stack each time. Hooks: `mkdir '<h>/.claude/hooks'` at `linkFile (fsops.mjs:81)`. Rules: the same at `.claude/rules`. Memory: `mkdir '<h>/.claude/nana-memory/shared'` at `ensureDir (fsops.mjs:175)`. | **Crash: the final line.** Not in the known-bug file. |
| M7 | Real `.claude`; `.claude/skills` → nothing. | Skill rows name `<h>/.claude/skills` to move aside. The final line lists the skills by hand, then install for the other 29. | Exit 1, five skill ✗ rows, 30 changed. Doctor afterwards shows only the five skill rows. | OK: install does the other 29. Moving the link aside is R-2293's proven step. |
| M8 | `--claude-home <h>/alt-claude`, a link to `dotfiles-claude` holding `enforce`. | Skill rows: ``… under the linked folder `<h>/alt-claude` — move it aside, then run `nana-setup install` ``, without the option. The flags ! row says run install. Final line `… then run: nana-setup install for the other 29 (and see the 1 ! above)`. | With the option: exit 1, retired `enforce` ✗ and five skill ✗ rows. Following the skill rows literally means moving the link aside and running install without the option. That installed into `<h>/.claude` (exit 0). Doctor with the option then showed five ``missing — run `nana-setup install` `` rows and `23 missing — run: nana-setup install`. | **Wrong folder, not a refusal or a crash** (known bug 131). The flags row leads nowhere, as M1. |
| M9 | `CLAUDE_CONFIG_DIR=<h>/alt-claude` (a link), with no `--home`. | The same skill rows and flags ! row as M8. | After moving the link aside, plain install in the same environment installed into `alt-claude` (`claude home ~/alt-claude (from CLAUDE_CONFIG_DIR)`). Doctor afterwards: `1 missing — run: nana-setup install`, which is pi packages, because the stub refuses `pi install`. | Skill rows OK. The flags row leads nowhere, as M1. |
| M10 | `.claude` → itself (a link loop). | Final line in the refusal form: `… will not run until this is fixed: <h>/.claude/settings.json cannot be read (ELOOP: too many symbolic links encountered, …).` | Exit 2, `nana-setup: … ELOOP …` then `Nothing was changed.` | OK. |
| M11 | `.claude` is a regular file. | Skill rows ``missing — run `nana-setup install` ``. Final line in the refusal form (ENOTDIR). | Exit 2, refusal. | Not a link: known bug 27, out of scope. |
| M12 | Installed; `.claude/skills/spec` → the owner's own folder (a foreign link at one skill name). | `✗ skill spec  -> <h>/dotfiles-skills/spec, not <checkout>/packages/nana-pack/skills/spec`, which names no fix. Final line `1 missing — fix by hand as each ✗ line says: skill spec`. | Exit 1, `✗ skill spec  problem  foreign link at … — left untouched`. | The row names no step; it does not say install. Known bug 26, out of scope. |
| M13 | Unlinked control with `enforce` and `py-init`. | Both ! rows say run install. | Exit 0, both backed up. Doctor afterwards `all good.` | OK. |
| M14 | Unlinked, with a non-empty `enforce` (unrecognized). | After install: `! legacy enforcement flags  enforce present — run nana-setup install …`, then `NOT verified — 1 ! above.` | Exit 0; install skips it as unrecognized. | The same dead advice without a link. Out of scope; a new known-bug line. |
| M15 | `.pi` → nothing; separately `.local/bin` → nothing. | `35 missing — fix by hand as each ✗ line says: pi pi-subagents; then run: nana-setup install for the other 34` and `34 missing — run: nana-setup install`. | Exit 1, a stack each: `ENOENT … mkdir '<h>/.pi/agent'` and `mkdir '<h>/.local/bin'`. | Outside the Claude folder. A known limit. |
| M16 | Installed, then `.claude` or `.claude/skills` linked; native and forced win32. | Every ✓ skill and legacy row reads the same as in an unlinked installed control: `-> <source>` or `copied from <source> (no symlink on this platform)`, and `none present`. | Install exits 0 before the link. | OK on main. R-2703 pins it (known bug 133). |
| M17 | Real `.claude`; `.claude/settings.json` → a dotfiles file holding `{}`. | — | Exit 0. `settings.json` is now a regular file, and the dotfiles file still holds `{}`. | Not doctor advice. A new FEAT-013 finding (Known limits). |

So three things send a user with a linked Claude folder to install when install then refuses or crashes (measured):
1. The `legacy enforcement flags` ! row, when the Claude home is a link (M1, M2, M4, M8, M9).
2. The `legacy scaffolders` ! row, when the Claude home or the skills folder is a link (M1 to M4).
3. Doctor's final line, when the Claude home, or its hooks, rules or shared-memory folder, is a link whose target is gone (M5, M6). It says `then run: nana-setup install for the other 29` or `run: nana-setup install`, and install crashes with a stack.

The ✗ skill rows already give a working step under a linked or broken Claude or skills folder (M1, M5, M7). They give a step that works in the wrong folder under the `--claude-home` flag (M8). That last case is Open question 1.

Doctor's time on a fresh temp home was 212 to 228 ms (n=5, measured). The change adds a few lstat calls per run (inferred).

## Design

Two product edits and no others. The prototype in `clone-proto/` is this design, with the product diff in `proto-product.diff`.

1. **Doctor's legacy rows** (`packages/nana-setup/lib/doctor.mjs:405-408`). Each row asks install's own question, then words its advice.
   - The flags row is refused exactly when install's retired step refuses a path directly under the Claude home. That step's guard is `directoryAncestorsAreSafe(claudeHome, path.dirname(source), true)` (`steps.mjs:373`). Doctor calls `directoryAncestorsAreSafe(layout.claudeHome, layout.claudeHome, true)`; when it is false, the folder to name is `layout.claudeHome`. With a flag present, false means the Claude home is a link (inferred from `steps.mjs:114-127`).
   - The scaffolders row uses the `linkedFolder` that `diagnose` already computes (`doctor.mjs:397`, `linkedSkillFolder` at `steps.mjs:460-466`). That is stepSkills' test, and the retired step's test for `.claude/skills/<name>`.
   - When the row is refused and an item is present, its detail reads:
     ``<names> present — install will not back them up through the linked folder `<folder>`; move `<path1>`, `<path2>` out of the way by hand``
     Each path is `path.join(<the row's folder>, name)`, in the row's order. Each value goes through `codeSpan(x) ?? x`, as the skill rows do (`doctor.mjs:401`).
   - Every other case keeps today's text byte for byte: no item present (`none present`), or a home install would back up. The status stays WARN.
   - Measured output (`results-proto.json`, M1): ``! legacy enforcement flags  enforce, enforce-memory present — install will not back them up through the linked folder `<h>/.claude`; move `<h>/.claude/enforce`, `<h>/.claude/enforce-memory` out of the way by hand``. In M3 only the scaffolders row changes, naming `<h>/.claude/skills`.
   - Rejected: the skill rows' advice ("move the linked folder aside, then run install"). It works, but to clear an empty flag file it costs the owner the settings and memory left in the moved folder (known bug 28). Moving the named files is enough and was measured to clear both rows.
2. **Install refuses a broken Claude folder link before any write** (`packages/nana-setup/lib/steps.mjs`, `install()` at `:1149`). A new local function `refuseDanglingClaudeFolder(layout)` runs first in `install()`, before `readClaudeSettings` and the settings lock. It walks `[claudeHome, hooksDir (off win32 only), rulesDir, path.dirname(sharedMemoryDir), sharedMemoryDir]`. For the first entry that `lstatSafe` reports as a link and `fs.statSync` cannot follow, it throws:
   `SetupError(`${folder} is a link whose target cannot be reached (${err.code ?? "unreadable"}) — move the link aside or restore its target, then re-run.\nNothing was changed.`)`
   - The list is the folders install creates under the Claude home on that platform. stepHooks returns `[]` on win32 (`steps.mjs:131`), so a broken hooks link there crashes nothing and must not refuse (brief: change install only where a crash becomes a refusal).
   - The skills folder is left out. A broken skills link does not crash install (M7): install refuses the skills and writes the rest.
   - Because the guard sits in `install()`, doctor's dry run (`bin/nana-setup.mjs:370`) reaches it. Doctor's existing refusal form (R-1994, `bin/nana-setup.mjs:378-379`) then prints, measured on the prototype in M5: `34 missing — nana-setup install will not run until this is fixed: <h>/.claude is a link whose target cannot be reached (ENOENT) — move the link aside or restore its target, then re-run.`. Install and `install --dry-run` both exit 2 with that line, then `Nothing was changed.`
   - The first line carries the link and the step, because doctor shows only a refusal's first line (known bug 116).
   - Subtraction: the first prototype refused only on ENOENT and kept today's ELOOP settings refusal for a loop. Pair W16 survived it, and the filter earned nothing, so it was dropped. A loop now gets the same refusal with `(ELOOP)`.
3. **Unchanged:** `runDoctor`, the skill rows, `skillLinkState`, the stale-copies producer and its line, install's own retired and skill rows, uninstall, and the install check.

Rejected alternatives:
- The guard in `runInstall`, beside `refuseCwdRelativeClaudeHome`. Doctor's dry run calls `install()` directly and would miss it; pair W9 turns R-2705 red.
- Catching the mkdir crash afterwards. Earlier steps may have written by then, and the dry run never mkdirs, so doctor would still say run install.
- Guarding `~/.pi`, `~/.local/bin` and the knowledge folder too. They are outside the Claude folder the owner named; they are a known limit (M15).

## Class

Install lane per AGENTS.md: it changes doctor (`doctor.mjs`) and install (`steps.mjs` `install()`). The ladder:
- the roster's final reviewer, `claude-code opus`, through `claude-review`;
- the land reviewer, `openai-codex gpt-6-astra`, through `pi-review`. The roster's land slot is astra, so the seat writes no `seat-land.md`;
- the seat's wrong-code pairs through the mutation runner;
- one independent check;
- the local macOS install check before `nana-land`;
- CI's Windows leg on the reviewed tip.

Build size: larger (`--lane-size larger`, `openai-codex gpt-5.6-sol high`), as for doctor-fix-line and install-check-builder. Small is defensible: the design is prototyped, about 20 product lines plus one test block. The seat decides.

## Threat model

Honest variation in machine state and in our tools' output is in scope:
- dotfiles layouts: the whole `~/.claude` linked; `~/.claude/skills` linked; `rules`, `hooks` or `nana-memory` linked; any of them made before or after an install;
- link kinds: a directory symlink, a Windows junction, a link whose target is gone, a link loop;
- platforms: macOS, Linux and native Windows; forced win32 on macOS;
- the Claude folder option: the `--claude-home` flag and `CLAUDE_CONFIG_DIR`;
- recognized and unrecognized legacy flags and scaffolders.

Deliberate forgery is out:
- a link swapped between doctor's read and the user's move, or between install's preflight and its first write (a race);
- a forged legacy artifact or fingerprint;
- a link planted to steer install somewhere.

A finding outside the model is a residual. The public repo carries no owner name and nothing about the owner's work.

## Precedent

Precedent:
- `docs/reviews/linked-claude-folder-remedy-2026-10-20/must-meet.md`: the same bug's first lane. It supplies the condition, the folder named in a code span, the move-aside proof step, the junction-on-win32 tests and the known limits this lane closes.
- `docs/reviews/install-check-builder-2026-10-23/plan-draft.md`: the plan shape.
- `packages/nana-setup/lib/doctor.mjs`: the linked skill rows (`:393-404`: `linkedFolder`, `codeSpan(linkedFolder) ?? linkedFolder`) for the legacy rows' condition and text, and the legacy rows themselves (`:405-408`).
- `packages/nana-setup/lib/steps.mjs`:
  - `directoryAncestorsAreSafe` (`:114-127`) and `linkedSkillFolder` (`:460-466`), reused, not copied;
  - the retired step's guard (`:373-376`), the question doctor asks;
  - `readClaudeSettings`' preflight `SetupError` ending `Nothing was changed.` (`:476-485`), the refusal's shape;
  - `install()`'s preflight position (`:1149-1153`).
- `packages/nana-setup/bin/nana-setup.mjs`: `refuseCwdRelativeClaudeHome` (`:151-158`), a refusal that names the folder and the step. Also doctor's dry run and refusal form (`:362-380`), unchanged.
- `packages/nana-setup/lib/stale-copies.mjs`: `staleNotice` (`:92-98`), the wording "move `<path>` out of the way".
- `packages/nana-setup/tests/linked-claude-folder.test.mjs`, where the new checks go:
  - `fixtureHome`, `freshCwd`, `makeDir`, `runCli`, `linkType` and `winEnv` (`:24`, `:35-69`, `:188`);
  - `installRows`, `parseDoctorLine`, `doctorRow`, `lastNonEmptyLine`, `codeSpansOf` and `firstCodeSpan` (`:83-141`);
  - `buildHomeBD` (`:156-166`) and R-2293's move step (`:302-319`).
- `packages/nana-setup/tests/doctor-fix-line.test.mjs`: `walk` and `walkDifference` (`:115-141`), and R-1994's refusal-form check (`:256-257`).
- `packages/nana-setup/tests/retired-artifacts.test.mjs`: `copyTree` (`:48-54`) and the recognized `tests/fixtures/retired/py-init`.
- `packages/nana-setup/tests/stale-copies.test.mjs`: R-1762 (`:323-324`), which ties the session line to install's dry run. R-2701 ties doctor's legacy rows to it the same way.
- `docs/reviews/linked-claude-folder-remedy-2026-10-20/seat-mutate.mjs`: the pair table's form on the shared runner.

Departures, each named:
- `walk` and `copyTree` are copied into `linked-claude-folder.test.mjs`. A test file runs its checks on import, so one cannot import another; the repo already keeps one `walk` per test file (`install.test.mjs:701`, `project.test.mjs:58`, `doctor-fix-line.test.mjs:126`). In the copy, `fs.readlinkSync` goes inside a try/catch that records `null`, so a broken Windows junction cannot throw (inferred risk).
- The refusal's folder list is written out in `steps.mjs`, not derived from the steps. No step exposes its folders today.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title | Where the row goes |
|---|---|---|---|
| R-2701 | IF the Claude home or its skills folder is a link and `nana-setup install --dry-run` reports ✗ for every present item of a legacy enforcement flag or legacy scaffolder row, THEN doctor shall print that row naming the linked folder, then each present item's path to move out of the way by hand, and no install command, while a legacy row whose present items the dry run would move keeps its install advice. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2701: under a linked Claude or skills folder, each legacy row install's dry run refuses names that folder and every present path to move by hand, and a row install would move keeps its install advice` | FEAT-015, after R-2294 |
| R-2702 | WHEN every path that a legacy row names to move out of the way by hand has been moved, THEN doctor shall print that row ✓ with `none present`. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2702: moving every path a legacy row names to move by hand leaves that row ✓` | FEAT-015, after R-2701 |
| R-2703 | WHILE the Claude home or its skills folder is a link, doctor shall print each ✓ skill row and ✓ legacy row with the detail it prints for that row in an unlinked home on the same platform. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2703: in a home whose Claude or skills folder is a link, every ✓ skill and legacy row reads as it does in an unlinked home` | FEAT-015, after R-2702 |
| R-2704 | IF the Claude home, its rules folder, its shared-memory folder or that folder's parent, or off win32 its hooks folder, is a link whose target does not exist, THEN install shall refuse with exit 2, a first error line that starts with that link's path and says to move it, and every file, folder and link in the home unchanged, while a win32 install whose only broken link is the hooks folder does not refuse. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2704: a Claude home, or its rules, shared-memory or (off win32) hooks folder, that is a link whose target is gone makes install refuse before any write, naming that link` | FEAT-013 SUB-014, after R-2291 (precedent: R-2290 and R-2291 sit there) |
| R-2705 | WHEN doctor finds ✗ rows in a home with such a broken link, THEN doctor's final line shall read `<n> missing — nana-setup install will not run until this is fixed: ` followed by install's first refusal line for that link. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2705: for such a broken link, doctor's last line names install's refusal instead of telling the user to run install` | FEAT-015, after R-2703 |

Each row goes in `untested` first, then `implemented` with its backticked `file::title` when its check passes. No heading is added. R-2706 to R-2709 stay free. These rows stay guarded and unchanged: R-2290 to R-2294, R-663, R-667, R-1762 and R-1994.

### What each test does, and why it is red on main

All five run in `linked-claude-folder.test.mjs` after R-2293, with no skip and no req-candidate marker, on every platform. Folder links are junctions on win32, as the file already makes them. Measured on main: R-2701, R-2702, R-2704 and R-2705 fail, and R-2703 passes. On the prototype all ten checks in the file pass, in about 6.9 s wall on this Mac (one run; the runtime map has the file at 3.4 s today).

- **R-2701.** Three homes from one builder. Each holds empty `enforce` and `enforce-memory` and the recognized `py-init` copy. In `claude` the `.claude` folder is linked; in `skills` the `.claude/skills` folder is linked; `none` is unlinked.
  - Each home runs doctor and `install --dry-run`.
  - For each legacy row: the dry-run statuses of `retired .claude/<item>` must match the expected pattern. `claude`: both rows refused. `skills`: flags moved, scaffolders refused. `none`: both moved. This keeps the check from passing if the dry run changes.
  - A refused row must be `!`. Its first code span must equal the linked folder exactly, not by substring (the earlier lane's W4 lesson). Its other spans must deep-equal the present paths in row order. It must not contain `nana-setup install`.
  - A moved row must contain `run nana-setup install`.
  - Red on main: the refused rows say run install.
- **R-2702.** The `claude` and `skills` homes. Doctor runs; each `!` legacy row without `nana-setup install` is a by-hand row. Every path named after its first span is renamed into a scratch folder, then doctor runs again. Each by-hand row must read `✓ none present`. The check needs at least one by-hand row and one move per home, so it cannot pass empty.
  - Red on main: no row is by hand. This is a real red, not a skip (unlike known bug 138).
- **R-2703.** Native and forced win32. Each runs one control home (installed) and two homes installed and then linked: `.claude`, then `.claude/skills`. For the five skill labels and both legacy labels, the linked home's row must be ✓ with a detail equal to the control's.
  - Green on main: it is a guard that closes known bug 133. W6 and W7 turn it red.
- **R-2704.** Broken-link homes, each made by creating the target, linking it, then removing the target, which works for a junction on Windows. The cases:
  - native: `.claude`, `.claude/rules`, `.claude/nana-memory`, `.claude/nana-memory/shared`, and `.claude/hooks` off native win32;
  - forced win32: `.claude` and `.claude/rules`.
  - Each: `walk(home)` before; `install`; `walk(home)` after. It needs exit 2 and a first non-blank stderr line, after `nana-setup: `, that starts with `<link path> ` and contains `move`. It needs no `^\s+at ` stack line and the two walks equal.
  - Control: a forced-win32 home whose only broken link is `.claude/hooks`. It must not exit 2, and its stderr must not name that link.
  - Red on main: install exits 1 with an ENOENT stack.
- **R-2705.** The same broken-link homes, excluding the control. Doctor must exit 1. Its final line must equal `<n> missing — nana-setup install will not run until this is fixed: <that home's R-2704 refusal line>`, where n is its count of ✗ rows. This ties doctor to install's real refusal.
  - Red on main: the line says `… then run: nana-setup install for the other 29` or `34 missing — run: nana-setup install`.

Existing tests the change touches: none needs an edit. On the prototype these files tally the same as on main (measured): retired-artifacts 47/0, doctor-fix-line 15/0, stale-copies 14/0, settings-merge 221/0, skills-and-standards 88/0, doctor-detail 72/0, claude-config-dir 7/0, relative-agent-dir 31/0, doctor-quiet 7/0, realpath-fallback 3/0, install-overlap 4/0, settings-lock 6/0, install 109/1. install's one FAIL, and the 0-PASS exits of fresh-machine, checkout-spelling and restore, are artifacts of the `git archive` export, which has no `.git`. They are the same on main and the prototype.

## Tunables

None. The new text sits inline beside the strings it extends, as doctor's row details and install's preflight refusals already do (`doctor.mjs:401`, `steps.mjs:484`). The folder list is the layout's own fields, not a tuned value.

Module headers to update:
- `doctor.mjs` `@outputs`: legacy rows naming each present path to move by hand under a linked Claude or skills folder.
- `steps.mjs` `@errors`: a SetupError for the Claude home, or its rules, shared-memory or (off win32) hooks folder, being a link whose target cannot be reached.
- `linked-claude-folder.test.mjs` `@purpose` and `@outputs`: R-2701 to R-2705.

## Wrong-code pairs

The seat runs each through the mutation runner, and each must turn its test red. All 18 were run against the prototype with the five checks above (`pairs-results-final.json`, `pairs-results-final2.json`; measured). None is Windows-only: the forced-win32 cases run on every system. Only CI's Windows leg proves native junction behaviour.

| # | Edit | Turns red |
|---|---|---|
| W1 | The flags row keyed on `linkedFolder` instead of install's Claude-home test | R-2701 |
| W2 | The scaffolders row keyed on the Claude home only | R-2701, R-2702 |
| W3 | The by-hand text names no paths ("move them out of the way by hand") | R-2701, R-2702 |
| W4 | The by-hand text omits the linked folder | R-2701, R-2702 |
| W5 | The by-hand text still ends ", then run nana-setup install" | R-2701, R-2702 |
| W6 | The linked branch checked before the count, so a ✓ legacy row gets advice | R-2702, R-2703 |
| W7 | The skill loop drops `!st.ok &&`, so ✓ skill rows get the move-aside text | R-2703 |
| W8 | No guard (main's `install()`) | R-2704, R-2705 |
| W9 | The guard called in `runInstall`, not in `install()` | R-2705 |
| W10 | The guard checks the Claude home only | R-2704, R-2705 |
| W11 | The guard checks the hooks folder on win32 too | R-2704 (the control) |
| W12 | The guard refuses any linked folder, reachable or not | R-2291, R-2292, R-2293, R-2294, R-2701 |
| W13 | The guard runs inside the file steps, after the settings lock | R-2704, R-2705 |
| W14 | The refusal does not name the link | R-2704 |
| W15 | The refusal names the link on its second line only | R-2704 |
| W17 | The guard refuses a missing folder, not only a link | The file throws building a fixture; the runner judges it CRASH, which is red |
| W18 | The guard skips the shared-memory folder itself | R-2704, R-2705 |
| W19 | The by-hand paths spelled through the link's target (`realpathSafe`) | R-2701 |

W16, the guard ignoring every stat error but ENOENT, survived the first prototype. Design part 2 dropped that filter, so it no longer exists.

## Windows notes

- Install writes no hooks folder on win32 (`steps.mjs:131`, by reading). That is why the guard skips the hooks folder there and why R-2704 carries a win32 control.
- Node reports a live junction as a link to `lstat`. The earlier lane's checks rely on it and passed natively on CI's Windows leg: `PASS R-2290` to `R-2294` in `docs/reviews/linked-claude-folder-remedy-2026-10-20/ci-windows-2055067e.log` (measured, from the log).
- For a junction whose target is gone, I infer two things: `lstat` still reports a link, and `statSync` throws ENOENT. Then the guard fires and `walk` sees the link. If `readlinkSync` throws on such a junction, the copied `walk` records `null` (Departures).
- The test makes each broken link by removing an existing target, so it never asks Windows for a junction to a missing folder.
- Doctor's code spans hold backslash paths on Windows. `codeSpan(linkedFolder)` already prints them on CI (R-2292, measured from the log).
- The stale-copies linked-folder case has an open first-try Windows flake (`docs/known-bugs/FEAT-039.md:26`). This lane does not touch that file. If CI's Windows leg fails there on the first try, re-run before judging.
- I ran nothing on Windows. Every Windows claim above is from code, the earlier lane's CI log, or forced win32 on macOS.

## Known limits

The seat writes these to the known-bug files before the final round.

- The refusal's folder list is kept by hand. A future step that writes another folder under the Claude home would crash again on a broken link there until someone adds it (inferred).
- Broken links outside the Claude folder still crash install while doctor says to run install. Measured for `~/.pi` and `~/.local/bin` (M15); inferred for `~/.pi/agent` and the knowledge folder.
- Under the `--claude-home` flag, doctor's skill rows and final line still name plain install, which installs into the default folder (M8, known bug 131). Under `CLAUDE_CONFIG_DIR` plain install lands right (M9). See Open question 1.
- In an unlinked home, an unrecognized legacy flag gets "run install", and install skips it, so the ! row repeats (M14). New FEAT-015 line.
- A foreign link at one managed skill name still gets a row that names no fix (M12, known bug 26, unchanged).
- A regular file at `.claude` or `.claude/skills` is unchanged (known bug 27).
- Install's own retired ✗ rows still say only `unsafe source ancestor under <home>; source left untouched`. Doctor now gives the step.
- The by-hand legacy text does not say where to put the files. Install would have used `<Claude home>/backups/<date>-retired/`.
- A path that cannot sit in a code span prints raw, as for the skill rows (known bug 132).
- A link loop at the Claude home now gets the new refusal with `(ELOOP)`, not the settings-read refusal. Both exit 2 and change nothing. No check covers a loop.
- `install --dry-run` under a broken Claude folder link now exits 2 with the refusal, where main printed rows and exited 1. The same holds for other preflight refusals.
- R-2703 is a guard, green on main. Only W6 and W7 show it can fail.
- A Claude home linked after an install with right skill links still reads all good in doctor while install exits 1 (M2, known bug 134, unchanged).
- Found while probing, outside this lane: install replaces a linked `~/.claude/settings.json` with a regular file and exits 0. The dotfiles file keeps its old bytes (M17). New FEAT-013 line. It bears on known bug 137's open item, whether install should write through a linked Claude folder at all.

## Not verified

- Native Windows: the dangling-junction `lstat` and `statSync` behaviour, `readlinkSync` on it, and the whole new test block.
- Native Linux. CI's Linux leg runs the file and does not block release.
- A real dotfiles layout on the owner's machine. Every home was a temp folder.
- The macOS install check on the build tip. The install check makes no links, so it should not change (inferred).
- The full suite. By the brief, I ran only single test files (listed above).

## Docs that change

- `packages/nana-setup/README.md:78`, after "Doctor's ✗ skill rows name the same linked folder, and its final line lists them as a fix by hand.":
  - add that under a linked Claude or skills folder, doctor's legacy flag and scaffolder rows name each path to move out of the way by hand, because install will not move them there;
  - add that install refuses before any write when the Claude folder, or its rules, shared-memory or (off Windows) hooks folder, is a link whose target is gone. It names that link to move aside, and doctor's final line names the refusal.
- `packages/nana-setup/README.md:513`, the test table row for `linked-claude-folder.test.mjs`: add the legacy rows' by-hand paths, moving them turning the rows ✓, ✓ rows reading as in an unlinked home, the broken-link refusal with an unchanged home and its win32 hooks exception, and doctor's final line naming that refusal.
- `REQUIREMENTS.md`: R-2701 to R-2703 and R-2705 in FEAT-015 after R-2294; R-2704 in FEAT-013 SUB-014 after R-2291.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated; `map:check` green.
- `docs/known-bugs/FEAT-015.md`:
  - remove line 130 (the dangling Claude folder crash), line 133 (no check reads a ✓ skill row in a linked home) and line 136 (legacy warnings say run install);
  - edit line 131 to add M8's measured result and that `CLAUDE_CONFIG_DIR` works (M9);
  - add the Known limits above, except the settings-file line.
- `docs/known-bugs/FEAT-013.md`: add the linked settings-file finding (M17).
- `HANDOFF.md`: Next item 4 drops "the linked Claude folder's repair advice". Add a Landed line. Run `nana-writing HANDOFF.md`.
- `docs/sessions/2026-10.md`: the session entry, in the reviewed change before the final round.
- Unchanged: the stale-copies producer, `runDoctor`, uninstall, the install check, every hook and extension, the CI workflow.

## Seat steps

1. Cut `feat/linked-folder-advice` from main at `~/nana-pi-wt/linked-folder-advice`. Run `npm run map:impact -- packages/nana-setup/lib/doctor.mjs packages/nana-setup/lib/steps.mjs` and work from its blast radius. The objective-hook lane is in flight; whichever lands second merges main and regenerates the tree and the code map.
2. Run one adversary pass on this draft. Commit the must-meet of record and build brief 1. The brief carries `Feature: FEAT-015 · Diagnose the active environment` and a Precedent section from the list above. It names the two copied test helpers as departures, and the try/catch around `readlinkSync`. Run `node "$HOME/nana-pi/packages/nana-pack/bin/brief-check.mjs" --brief <file> --tree <worktree>`.
3. Build: `pi-worker --lane linked-folder-advice --brief <brief> --out <report> --lane-size larger`, with a failure watcher and a heartbeat at launch.
4. Seat checks on the build tip:
   - `node packages/nana-setup/tests/linked-claude-folder.test.mjs` (10 PASS expected), then `retired-artifacts`, `doctor-fix-line` and `stale-copies` each alone;
   - `npm run test:locked`, `npm run map:check`, `npm run readme:check` and the trace;
   - `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main`, carried into the review briefs and the land.
   - Diff-check the build for removed newline escapes in test template literals (the builder-unescape lesson).
5. Write `docs/reviews/linked-folder-advice-2026-10-23/seat-mutate.mjs` with pairs W1 to W15 and W17 to W19 on the shared runner. Do not spell a pi launch as a literal `spawn("pi"`. Run it. Re-run it after any seat change to code or tests, before the review.
6. Run `node packages/nana-setup/bin/install-check.mjs` locally on macOS, by the owner's 2026-10-12 ruling. Keep its output in the lane's review folder.
7. Push a draft PR. CI's Windows leg must show R-2701 to R-2705 PASS natively. Keep the Windows CI log in the review folder, as the earlier lane did.
8. Write the notes before the final round: the known-bug edits, HANDOFF and the session entry. Then run `review-ledger keep --item linked-folder-advice --into docs/reviews/linked-folder-advice-2026-10-23 --repo <worktree>`.
9. Run the Opus final review (`claude-review`), the astra land review (`pi-review`) and the one independent check, all on the exact tip. Then `nana-land`, and push main.

## Open questions to the owner

1. **The `--claude-home` flag in doctor's install advice.**
   - What I tested: a linked folder given by the flag (M8), and the same folder given by `CLAUDE_CONFIG_DIR` (M9).
   - The result: under the flag, following the skill rows installed into the default folder. Doctor with the flag then still showed 23 ✗ rows. Under the variable, plain install landed in the right folder.
   - The trade: a fix makes every install command doctor prints carry the flag. That is about ten row texts and the final line. It also changes R-1990's pinned final-line text whenever the flag is given.
   - Recommendation: keep it a known bug. The usage text offers the flag beside `--home` for tests and dry machines. Claude Code's own variable already gets working advice.
   - It is your call because it widens your pick to every install command doctor prints.
   - Default: **no**.
