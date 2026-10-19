# stale-copies-hooks — build brief 2

Feature: FEAT-015 · Diagnose the active environment. Class: install, hook or gate. Builder: pi gpt-5.6-sol through
pi-worker --lane-size larger. Read `must-meet.md`, `plan-attack.md` and `build-brief-1.md` first. Build 1 is `f089623a`;
the seat's pairs commit follows it (`seat-mutate.mjs`, `seat-mutate-output-f089623a.txt`). Row block R-1760 to R-1769.

Two findings on the same piece, the stale line's paths to move:

1. **Seat pair M6 survived.** Deleting `&& failedSkills.has(name)` from the move-path filter in
   `packages/nana-setup/bin/stale-copies.mjs` keeps every check green. R-1762 says a path to move is one that BOTH doctor
   and install's dry run mark ✗, but no fixture has a skill that install refuses while doctor passes it. That state is
   reachable by honest drift: the skills folder itself a link to a healthy folder, where install refuses every skill and
   doctor can pass some. Without the filter the line would tell the user to move healthy skills. Add that fixture (or the
   nearest honest one you can build on macOS and forced win32) to R-1762's check so M6 turns it red.
2. **A linked parent folder gives impossible advice** (independent check, probe 8). With `~/.claude` a symlink to a real
   folder (a dotfiles layout), install's skill step refuses every skill with "unsafe source ancestor", and the line says
   to move `…/skills/requirements`, `…/spec`, `…/py-lint`, `…/py-review` and `…/py-test` — paths that do not exist, so
   following it cannot clear the line (R-1763 fails for this home). The line must never name a path to move that does not
   exist, and when install refuses because a parent folder is a link, it must name what install refuses (that linked
   folder) instead of the skill paths. Choose the smallest honest wording; keep the line one line with the stale prefix and
   the install command. Add row R-1766 for it, with a check on macOS (and forced win32 if the case exists there; say if
   not). The plan's Known limits named only the skills-folder-is-a-link case; update them to match what the code does.

## Rules
Single test files only, never the full suite. No push. No HANDOFF.md or docs/sessions/ edits. Every `// req:` marker sits
directly above its check call with the title on that line. Run `npm run req:tree`, `npm run map` if headers or modules
change, `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`. Re-run stale-copies,
install, win32-degrade and doctor-detail as single files. Keep the hook inside today's time (about 0.11 s on a healthy
home; measure a broken one too).

## Report (10 lines or fewer)
VERDICT; commits; each finding and its fix; R-1762's new fixture and that M6's change now fails it (run it); R-1766's
check red before and green after; each single-file command with exit code and PASS/FAIL/SKIP counts; hook timing.
