MATERIAL: none
# linked-folder-advice independent check · tip 96f08ce2 against main 8c24e357

Independent check, read-only toward the repo. Trees: `git archive 96f08ce2` into `<scratch>/lane`, `git archive 8c24e357` into `<scratch>/main` (plus `<scratch>/mainT`, main with the lane's test file copied in). Every install and doctor run went through `<scratch>/h.mjs`. It sets HOME, USERPROFILE and TMPDIR to a temp folder under `<scratch>`. It deletes PI_CODING_AGENT_DIR, CLAUDE_CONFIG_DIR, NANA_SHARED_MEMORY_DIR, NANA_KNOWLEDGE_HOME and NANA_SETUP_PLATFORM, and it always passes `--home <temp home>`. PATH is a stub `pi` that answers `--version` with 1.0.2, then node's folder and the system folders. Fixture homes match `linked-claude-folder.test.mjs`'s `fixtureHome`. No model calls. No full suite. Probes: `<scratch>/probe-a.mjs` to `probe-g.mjs`, `peek.mjs`, `peek2.mjs`; raw output in `<scratch>/out-*.txt`. `<h>` is the temp home and `<repo>` the extracted tree. Everything below is measured unless marked inferred.

Afterwards `git status` on the main checkout was clean at 8c24e357. The lane worktree was at 96f08ce2 with uncommitted edits to `docs/known-bugs/FEAT-013.md` and `docs/known-bugs/FEAT-015.md`. I did not make those edits. They look like the seat's notes in progress (inferred). No run wrote into its TMPDIR folder.

Baseline: the lane's `linked-claude-folder.test.mjs` run alone on the lane tree gave PASS=10 FAIL=0 in 7.9 s. The same file on main's code gave PASS=6 FAIL=4: R-2701, R-2702, R-2704 and R-2705 failed and R-2703 passed, as the plan says.

## (a) M1 to M10 and M16, lane against main

Command: `node <scratch>/probe-a.mjs` → `<scratch>/out-a.txt`.

| Case | Lane | Main |
|---|---|---|
| M1 `.claude` linked before install; `enforce`, `enforce-memory`, recognized `py-init` | `! legacy enforcement flags  enforce, enforce-memory present — install will not back these up through the linked folder `<h>/.claude`; move `<h>/.claude/enforce`, `<h>/.claude/enforce-memory` out of the way by hand`; scaffolders row names `<h>/.claude` and `<h>/.claude/skills/py-init`. Dry run exit 1, three retired ✗, home unchanged. Install exit 1, 30 changed, 8 ✗; reinstall `nothing changed — 8 ✗`. Last line after: `5 missing — fix by hand as each ✗ line says: skill … (and see the 2 ! above)` | Both ! rows say `run nana-setup install …`; install results identical |
| M2 installed, then `.claude` linked; `enforce` and `py-init` added | Both rows by hand; last line `NOT verified — 2 ! above.`; install exit 1 (two retired ✗, five skill ✗) | Rows say run install; install identical |
| M3 real `.claude` with `enforce`; `.claude/skills` linked with `py-init` | Flags row keeps `run nana-setup install …`; scaffolders row names `<h>/.claude/skills` and `<h>/.claude/skills/py-init`. Install exit 1, backs up `enforce`, flags row then ✓ | Both rows say run install |
| M4 as M1 under forced win32 (`enforce`, `py-init`) | Both rows by hand, naming `<h>/.claude`; 29 ✗; install exit 1, 7 ✗ | Rows say run install |
| M5 `.claude` → missing target | Legacy rows ✓; last line `34 missing — nana-setup install will not run until this is fixed: <h>/.claude is a link whose target cannot be reached (ENOENT) — move the link aside or restore its target, then re-run.` Dry run and install exit 2 with that line, home unchanged | Last line sends to install for the other 29; install exit 1 with an ENOENT `mkdir` stack |
| M6 hooks / rules / `nana-memory` / `nana-memory/shared` → missing | Each: refusal naming that link, exit 2 for install and dry run; doctor's last line names it | Last line `34 missing — run: nana-setup install`; dry run exit 0; install exit 1 with a stack |
| M7 `.claude/skills` → missing | Same as main: install exit 1, 30 changed, five skill ✗; last line lists skills by hand | Same |
| M8 `--claude-home <h>/alt-claude` linked, with `enforce` | Flags row names `<h>/alt-claude` and `<h>/alt-claude/enforce`; install exit 1 | Flags row says run install |
| M10 `.claude` → itself | Refusal `… <h>/.claude is a link whose target cannot be reached (ELOOP) …`, exit 2 | Exit 2 with the settings-read ELOOP refusal; doctor names it |
| M16 installed, then `.claude` or `.claude/skills` linked, native and win32 | Every skill row and both legacy rows ✓ with the unlinked control's detail; doctor `all good.` | Same |

## (b) Following each by-hand row literally

Command: `node <scratch>/probe-b.mjs` → `<scratch>/out-b.txt`. I renamed exactly the code-span paths after the first span of each by-hand row into `<scratch>/moved`. Then I ran doctor, install and doctor. Where the skill rows still named a linked folder, I followed that advice as well.

- M1, M4 (win32), M8, a relative `.claude` link, and a home with BOTH `.claude` and `.claude/skills` linked holding all five legacy names: both rows read `✓ none present` straight after the move. The last case included a non-empty `enforce`, a plain `ts-init` folder and a `nana-init` file. Install then exited 1 with only the five skill ✗ rows (the linked-folder refusal, unchanged). Doctor said `5 missing — fix by hand as each ✗ line says: skill …`. Moving the folder the skill rows name and reinstalling gave exit 0 and `all good.` in every case.
- M3, forced-win32 skills link, and a skills link whose `py-init` is a dangling link and `ts-init` a live link: the scaffolders row cleared after the move. The flags row correctly kept install advice. Install backed up the recognized `enforce` and the flags row went ✓. Then the skills-folder move ended at `all good.`.
- In one case the unlinked `.claude/enforce` was itself a link to a file. Its row stays `run nana-setup install …` after install, because install skips it as unrecognized. That is the plan's M14 known limit, in an unlinked folder, not this lane's claim.
- M2 (linked after install): the rows cleared and doctor read `all good.`. Install still exits 1 with five skill ✗ rows. That is the existing known bug "a Claude folder linked after an install … reads all good", unchanged and the same on main.

Every by-hand row cleared. In every case install then succeeded, or said why not in rows that lead to a working step.

## (c) Healthy linked folders, linked before and after install

Command: `node <scratch>/probe-c.mjs` → `<scratch>/out-c.txt`. Six folders: `.claude`, `.claude/skills`, `.claude/rules`, `.claude/hooks`, `.claude/nana-memory`, `.claude/nana-memory/shared`. Each was linked to a live folder before a fresh install, and after an install. Native and forced win32 make 24 cases. Each ran doctor, install and doctor.

- I found no new refusal anywhere. Install exit codes match main in all 24 cases. Linked `.claude` or skills: 1, the existing skill refusal. Rules, hooks and memory: 0.
- Doctor's and install's full normalized stdout is byte-identical to main in all 24 cases, before and after install.
- A `--claude-home` link with a trailing slash (`probe-g.mjs`): the by-hand row names `<h>/alt-claude` without the slash, and install exits 1 as on main.

## (d) Every broken-link case R-2704 covers, plus controls

Command: `node <scratch>/probe-d.mjs` → `<scratch>/out-d.txt`. I walked the whole temp home before and after each command. The walk records kind, path, link target, content hash, mode and mtime, so a removed temp file shows as an mtime change.

Refusals on the lane: 18 cases, all exit 2. The first stderr line starts `nana-setup: <link path> ` and says to move it. The second line is `Nothing was changed.`. None had a stack line, and the home walk was identical after install:
- native `.claude` dangling (absolute and relative link), `.claude` loop (ELOOP);
- native rules dangling and loop, `nana-memory` dangling, `nana-memory/shared` dangling, hooks dangling and loop (ELOOP);
- a live `.claude` link with a dangling `rules` inside;
- installed homes whose `.claude` target, or `rules` target, was later removed;
- a dangling `--claude-home` link;
- `.claude` → a folder inside an unreadable parent (EACCES; main refused with the settings-read EACCES line);
- forced win32 `.claude`, rules, `nana-memory` and `nana-memory/shared` dangling.

On main the same homes gave exit 1 with an ENOENT or ELOOP `mkdir` stack. Main also left partial writes: up to 25 entries, such as `.claude/hooks/*` links and `.claude/rules/nana-personal.md`.

Controls, identical on lane and main:
- native and win32 dangling `.claude/skills`: exit 1, no stack, 30 or 26 changed, `.claude/rules` created. Doctor's last line lists the five skills by hand and does not contain "will not run".
- win32 dangling and looping `.claude/hooks`: exit 0, no stack, stderr empty.

## (e) `install --dry-run` and doctor in each refusal case

Same probe. In all 18 refusal cases on the lane:
- `install --dry-run` exits 2 with the same first line, and the home is unchanged.
- Doctor exits 1. Its last line is `<n> missing — nana-setup install will not run until this is fixed: <refusal line>`, and the home is unchanged.
- With a ! row present, the line ends ` (and see the 1 ! above)` (`peek2.mjs`), which R-2705's "starts with" allows.

Following the refusal itself (`<scratch>/probe-e.mjs` → `out-e.txt`, 18 runs):
- Moving the named link aside and rerunning gave install exit 0 and doctor `all good.` for every folder, native and win32.
- Restoring the target gave exit 0 and `all good.` for rules, hooks and memory. For `.claude`, restoring gave exit 1 with the five skill ✗ rows, the existing linked-folder skill refusal, whose rows name the folder.

## (f) Fresh unlinked home, lane against main

Command: `node <scratch>/probe-c.mjs`, first block. I ran doctor, then `install --dry-run`, install, install again and doctor, native and forced win32. All stdout and stderr were normalized for `<h>` and `<repo>`. Every output and exit code matched main: doctor 1, dry run 0, install 0, reinstall 0, doctor 0 `all good.`. `cmp` found the final doctor outputs byte-identical: native 53 lines, sha256 prefix 3a32378200ff8130; win32 49 lines, 4dfb427da79b32b8.

## (g) Code read for anything else that blocks a healthy install or advises nowhere

- The guard (`refuseUnreachableClaudeFolder`, `steps.mjs`) refuses only when `lstat` says link and `stat` fails. A live link always stats, so a healthy linked folder cannot be refused. Measured in (c), including a relative link and a link chain via `--claude-home`.
- Every candidate is a folder install itself writes into: hooks only off win32, rules, `nana-memory`, `shared`.
- Nana creates no link at any candidate path. The shared-memory hook links only `projects/<key>/memory/shared` (read).
- No other caller of `install()` exists besides the CLI and doctor's dry run. The stale-copies producer calls `stepSkills` directly, so the session-start line is unaffected (read).
- `CLAUDE_CONFIG_DIR`: following the rule that every run passes `--home`, I did not run the CLI under the variable. In-process `resolveLayout` gives `<h>/alt-claude` for `CLAUDE_CONFIG_DIR=<h>/alt-claude/`, the same layout fields as `--claude-home <h>/alt-claude/` (`path.resolve` strips the slash). The guard and both rows read only the layout, so the variable behaves as the flag (inferred from that).
- Doctor's flags row asks `directoryAncestorsAreSafe(claudeHome, claudeHome, true)`, the same question as install's retired-step guard for a flag. The scaffolders row uses `linkedSkillFolder`, which is false exactly when that guard is false and a link causes it. With a flag or scaffolder present, I found no input where the row and the dry run disagree (read, and measured in (a) and (b)).
- Native Windows junctions and Linux were not run. A dangling junction should `lstat` as a link and fail `stat` with ENOENT, so the guard should fire there (inferred). Only CI's Windows leg proves it.

## Notes (not material)

1. Beside the refusal line, doctor's per-row text for rules, skills and seeds still says ``missing — run `nana-setup install` ``, as on main (`peek.mjs`). The final line and install's refusal both name the link, so the path still leads somewhere in two steps.
2. The session-start line after a rules link broke still says to fix it with install, and install then refuses, naming the link (`probe-g.mjs`). This is the plan's adopted S-4 known limit.
3. A read-only dotfiles target: the by-hand row's path cannot be moved (rename gave EACCES). This is the adopted N-4 known limit.
4. At tip 96f08ce2 the known-bug lines the lane closes are still in the FEAT-015 file: the dangling crash line, the line about no check reading a ✓ skill row, and the line saying legacy warnings say run install. The new known limits are not yet in the known-bug files. The worktree shows uncommitted edits there. They must land in the reviewed change before the final round.
5. Doctor is not strictly read-only in an installed home. It creates `.pi/agent/nana-knowledge/index.db-shm` when it opens the index, on lane and main alike. This is outside this lane.
6. `install --dry-run` now exits 2 under a broken Claude-folder link, where main exited 0 or 1. The plan lists this as a known limit.
