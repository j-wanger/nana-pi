# linked-folder-advice · plan attack (adversary, 2026-10-23, main 8c24e357)

Read-only pass over `plan-draft.md`. Scratch work is in `scratchpad/lfa-attack/`. `main/` and `proto/` are `git archive` exports of 8c24e357. `proto/` carries the planner's `proto-product.diff` and the planner's prototype test file. The probes are `probe-a.mjs`, `probe-b.mjs` and `probe-c.mjs`, with their `*-out.txt` or `probe-a-*.txt` output. The pair runner is `pairs-adv.mjs`, with `pairs-adv-out.txt` and `pairs-adv-results.json`. Every probe set HOME, USERPROFILE and TMPDIR to a temp home under `scratchpad/lfa-attack/`, passed `--home` (except the `CLAUDE_CONFIG_DIR` case) and put the planner's pi stub first on PATH. No probe made a model call. The checkout's `git status` was clean afterwards. The real Claude and pi folders kept their mtimes, and no entry two levels down is newer than my baseline file (measured). Each claim is marked measured or inferred. `<h>` is the temp home.

## Summary

The planner's measurements reproduce at 8c24e357. The prototype passes 10 of 10 checks in 7.1 s. Main fails R-2701, R-2702, R-2704 and R-2705 and passes R-2703. retired-artifacts (47/0), doctor-fix-line (15/0) and stale-copies (14/0) tally the same on both. Every listed wrong-code pair turns red for a fixed reason (measured).

One part must change before the brief. The change makes the kept row R-2294 false on the lane's own target input, a Claude folder linked to a missing target, and R-2705 then contradicts it (M-1). Four parts should change. R-2701 is wider than its test, and a by-hand row that names absent files passes (S-1). The guard's folder list has no negative control except win32 hooks (S-2). Every cited known-bug line number at or after 116 moved by two since the draft base (S-3). The session-start line still names install for a broken hooks or rules link (S-4).

## Findings

### M-1 · R-2294, a kept row, becomes false for a dangling Claude folder, and R-2705 contradicts it

- R-2294 reads: "WHEN a Claude home or skills folder is a link and doctor finds ✗ skill rows, THEN doctor's final line shall list every one of them as a fix by hand." Unlike R-1990 to R-1992, it has no "the install dry run completes" condition.
- Measured, `probe-b.mjs`, dangling `.claude`:
  - On both clones, doctor prints five ✗ skill rows naming `<h>/.claude` to move aside.
  - Main's last line is `34 missing — fix by hand as each ✗ line says: skill requirements, skill spec, skill py-lint, skill py-review, skill py-test; then run: nana-setup install for the other 29`. R-2294 holds.
  - The prototype's last line is `34 missing — nana-setup install will not run until this is fixed: <h>/.claude is a link whose target cannot be reached (ENOENT) — move the link aside or restore its target, then re-run.` It lists no skill row. R-2294 is false.
- The same holds for a live linked `.claude` whose `rules` link inside is dangling (measured, same probe).
- R-2705 requires exactly the prototype's line on that input. The ledger would then carry two `implemented` rows that disagree on one input. R-2294's test stays green only because its homes hold live links.
- The plan lists R-2294 under "stay guarded and unchanged". The requirements-moved output carried into the reviews would not show the conflict.
- Change: amend R-2294 in place, keeping its ID: "WHEN a Claude home or skills folder is a link, the install dry run completes, and doctor finds ✗ skill rows, THEN …". That is the condition R-1991 and R-1992 already carry. List it in the plan as an edited row. Its test needs no edit. Give `packages/nana-setup/README.md:78`'s "its final line lists them as a fix by hand" the same exception, next to the new refusal sentence.

### S-1 · R-2701 is wider than its test: a by-hand row that names absent flags passes

- R-2701 says "each present item's path". Every R-2701 and R-2702 home holds both `enforce` and `enforce-memory`.
- Pair V1 (`legacyByHand(["enforce", "enforce-memory"], …)` in place of the present names) passed all 10 checks (measured, `pairs-adv-out.txt`).
- On a linked home with only `enforce-memory`, V1 printed ``enforce, enforce-memory present — install will not back them up through the linked folder `<h>/.claude`; move `<h>/.claude/enforce`, `<h>/.claude/enforce-memory` out of the way by hand`` (measured, `probe-a.mjs` case g on a V1 copy). It names a file that is not there and misstates what is present.
- The scaffolders twin, V1b, is caught, because only `py-init` is present (measured).
- Change: in R-2701's `claude` home write only `enforce-memory`, so the flags row has one of two items. Optionally add a second scaffolder there, such as a `nana-init` folder. Under a linked folder the ancestor refusal fires before recognition, so any folder at that name works (`steps.mjs:364-374`, by reading). Keep `none` and `skills` as they are, since their dry-run pattern needs recognized items. Add V1 to the seat's pairs.

### S-2 · The guard's "only these folders" has no negative control except win32 hooks

- Design part 2 leaves the skills folder out because a broken skills link does not crash install. The brief's rule is "change install only where a crash becomes a refusal". No row and no check pins it.
- Pair V2 (the guard also checks `layout.skillsDir`) passed all 10 checks (measured). Under V2 a dangling skills link blocks the whole install. On the prototype, install exits 1 with no stack, writes the other 29 and leaves five skill ✗ rows. Doctor's last line then lists those five by hand (measured, `probe-a.mjs` case b; main is the same).
- The win32 hooks control asserts only `status !== 2` and that stderr does not name the link. Under forced win32 that install exits 0 and doctor says `all good.` (measured, case a). So an install that crashed there with exit 1 would pass the control.
- Change:
  - Add one control home to R-2704's test: native, a real `.claude` whose `.claude/skills` is a link to a removed folder. Install must exit 1, not 2, with no `^\s+at ` line, and must create `.claude/rules`.
  - Doctor's last line in that home must list the five skill rows by hand. That gives R-2294 a dangling-link case (M-1).
  - Tighten the win32 hooks control to `status === 0` with no stack line.
  - Word R-2704's "while" clause to cover both: "…a win32 install whose only broken link is the hooks folder, or any install whose only broken link is the skills folder, does not refuse".
  - Add V2 to the seat's pairs.

### S-3 · The plan's known-bug line numbers are stale at 8c24e357

- `docs/known-bugs/FEAT-015.md` gained two install-check-builder lines at 94-95 after 00617983. Every cited line from 116 on moved by two (measured, `git diff 00617983 8c24e357`).
- The Docs section says to remove lines 130, 133 and 136, and to edit 131. Read against the tip, that would remove:
  - 130: a realpath-strict-fallback line, "no check covers install's own path compares";
  - 133: the Claude-folder-option line, which the plan means to edit;
  - 136: "linked after an install … reads all good", which the plan keeps.
- And it would edit 131, another realpath-strict-fallback line.
- Current numbers: dangling crash 132, Claude folder option 133, raw path in a code span 134, ✓ skill rows 135, linked after install 136, legacy warnings 138, writes through a linked folder 139, check that skips 140, refusal's first line 118. Lines 26 to 28 did not move.
- Change: cite each known bug by its opening words in the plan, the brief and the notes, not by number. The shift came from the objective-hook lane's notes, which also carried install-check-builder's late lines. Any lane that lands first can shift them again.

### S-4 · The session-start line still sends the user to install for a broken hooks or rules link

- Measured, `probe-c.mjs`. The home was installed, then its `.claude/rules` became a link to a removed folder. On both clones the adoption hook's stale line reads ``INSTALL STALE: rule nana-soul.md, rule nana-standards.md, rule nana-writing.md, rule nana-seat.md, rule nana-rulings.md — tell the user; they fix it with `node "…/nana-setup.mjs" install` ``. The prototype's install then exits 2 with the refusal. Main's install crashes with an ENOENT stack.
- This is the owner's complaint one hop removed: the line repeats every session, and its fix is a refusal. The refusal names the link to move, so the user is not stuck (inferred).
- The plan keeps the stale-copies producer unchanged. Its Known limits do not mention this.
- Change: no product change in this lane. Add one known-limit line to FEAT-015, beside lines 27 and 28: "for a broken hooks or rules link the session-start line still names install, and install's refusal names the link to move".

### N-1 · Reproduction

- Prototype at 8c24e357: 10 PASS in 7.1 s wall (one run). Main with the same test file: R-2701, R-2702, R-2704 and R-2705 FAIL, and R-2703 PASSes (measured).
- `pairs-results-final.json` and `pairs-results-final2.json` match the pair table, W1 to W19 (read).
- The roster prints reviewer `claude-code opus`, land `openai-codex gpt-6-astra default` and larger builder `openai-codex gpt-5.6-sol high`, as the Class section says (measured). R-2701 to R-2709 are free (measured).
- The precedent line references in `doctor.mjs`, `steps.mjs`, `bin/nana-setup.mjs`, `stale-copies.mjs` and the four test files still hold at 8c24e357 (read). One is two lines off: the retired step's guard is `steps.mjs:371-374`, not `:373-376`. The class is right by AGENTS.md: the change touches doctor and install.

### N-2 · Pair reasons

- W13 turns red only through the two `.claude` cases (native and win32). There `withSettingsLock` crashes before the guard and install exits 1. The rules and memory cases still exit 2 with the home unchanged, because the lock is released and leaves no trace (measured, a W13 copy). The reason is fixed, not luck.
- W17 is red only as a whole-file throw in R-2290's fixture. The runner counts that as red. Name a fresh-install title from `install.test.mjs` in its `expectRed`, so the runner reports a named red.

### N-3 · Survivors that do no harm, for the record (measured, `pairs-adv-out.txt`)

- V8: the scaffolders row names `.claude/skills` first when `.claude` and its `skills` are both links. No home links both. The paths still work. The prototype names `.claude`, as the skill rows do (measured, case e).
- V11: the unlinked flags row loses "to back up recognized empty flags". The plan's "byte for byte" claim is unpinned. R-2701 checks a substring, and retired-artifacts checks only `enforce present`.
- V15: the guard skips both shared-memory folders on win32. The forced-win32 cases hold only `.claude` and `.claude/rules`, so only native Windows CI catches it. That breaks "none is Windows-only". Adding the two shared-memory folders to the forced-win32 list costs two CLI runs.
- V16: the dropped ENOENT-only filter. A `.claude/rules` link loop then crashes with an ELOOP stack (measured on main). The prototype refuses it with `(ELOOP)` (measured, `probe-b.mjs`). R-2704 says "does not exist", while the design refuses any unreachable target. Either add the rules loop case and word the row "cannot be reached", or keep the plan's known limit.

### N-4 · Threat-model cases the plan does not list (measured on the prototype unless marked)

- A live link from `.claude/rules` to a regular file. Install crashes with an EEXIST stack at `linkFile`, and doctor says `29 missing — run: nana-setup install`. Main does the same (case f). Refusing when `stat` fails or is not a directory would cover it at no extra cost. Otherwise add a known limit.
- A live-linked `.claude/backups` with both flags in an unlinked `.claude`. Doctor says run install, install refuses with `unsafe backup ancestor`, and doctor afterwards is unchanged (case d). This is the same dead advice, and R-2701's IF does not reach it. Claude Code keeps a folder by that name in its own config folder on this Mac (measured, existence only). Add a known limit.
- `.claude/skills/nana` under a linked skills folder. It is on install's retired list but not on doctor's scaffolders row. Install shows `✗ retired .claude/skills/nana  … unsafe source ancestor`, and doctor's legacy rows read ✓ (case i). The retired `.claude/hooks/*.bak-20260918` files are in the same position (by reading). Add a known limit.
- A dangling `.claude/settings.json` file link. Install exits 0, replaces the link with a regular file and does not create the target (case c, same on main). Fold this into the plan's M17 line.
- These cases are fine:
  - a dangling `.claude/CLAUDE.md` (install exits 0);
  - `CLAUDE_CONFIG_DIR` naming a linked folder with a trailing slash (doctor's by-hand row and the dry run's refusal agree);
  - a dangling `--claude-home` folder (the refusal and doctor's line name it);
  - a live `.claude` link whose `rules` link inside is dangling (the refusal names `<h>/.claude/rules`).
- A read-only dotfiles target, such as a Nix home-manager store path, is untested (inferred). There "move … out of the way by hand" fails, and the fix belongs in the dotfiles source. The text could read "move or remove … (in your dotfiles source, if a tool manages that folder)".

### N-5 · Precedent

- `linked-claude-folder.test.mjs:73` already has `tryReadlink`. Reuse it in the copied `walk` instead of a new try/catch.
- The prototype's `walk` calls `fs.readlinkSync` bare, against the plan's own Departures line. So the measured prototype is not what the brief will ask for. The difference is small, but the brief should not call the prototype the design.
- Nearest code missing from the list:
  - `linkedSkillFolder`'s candidate loop (`steps.mjs:460-466`), for the guard's loop;
  - `project.test.mjs:246`, the existing dangling-link fixture.

### N-6 · Row and text wording

- R-2705 says the final line "shall read" the refusal. In a home that also has a ! row, the line ends with R-1996's ` (and see the <w> ! above)` (`bin/nana-setup.mjs:390`, by reading). Word it "shall start with", or name the suffix. No test home has a ! row.
- R-1993 has the same unguarded form as R-2294. R-1994 already contradicted it before this lane, so record it as a known bug and do not widen the lane.
- The by-hand text says "back them up" for one item, as in `enforce present — install will not back them up`. "back these up" or "back up" is cosmetic.

### N-7 · Windows, inferred

On Windows, libuv's lstat reports a mount point (junction) as a link without following it. `stat` on a junction to a removed folder fails with ENOENT, and readlink reads a mount point's stored target. So the guard and the copied `walk` should behave on Windows as the plan infers. Only CI's Windows leg can confirm it, as the plan says. `.gitattributes` sets `eol=lf` for all text, and retired-artifacts passed on the earlier lane's Windows run. So the recognized `py-init` fixture's fingerprints hold there (read).
