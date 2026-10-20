# Independent check — linked-claude-folder-remedy at 2055067e (2026-10-20)

VERDICT: HOLDS

Ran in a private clone at 2055067e, with main 72abe19a cloned beside it as the baseline. Every probe used a temp HOME on macOS, and win32 was forced through NANA_SETUP_PLATFORM where noted. The lane worktree is still clean at 2055067e.

Must-meet and neighbouring tests, one file at a time:
- `node tests/linked-claude-folder.test.mjs` gives `SUMMARY PASS=5 FAIL=0 SKIP=0`, exit 0. HOLDS.
- `node tests/retired-artifacts.test.mjs` gives 47 PASS lines and exit 0. `node tests/stale-copies.test.mjs` gives `PASS=13 FAIL=0`. `node tests/doctor-fix-line.test.mjs` gives `summary: 0 failures`. HOLDS.
- `node tests/install.test.mjs` passes on main and lane. `node tests/skills-and-standards.test.mjs` exits 6 on both, with the same 6 FAIL lines (the clone's untrusted project). No new failures. HOLDS.
- `node scripts/code-map.mjs --check` reports 0 problems, and `node scripts/readme-check.mjs` reports 725 claims, 0 problems. HOLDS.

Probes:
1. Linked `.claude` before install, home path "John Smith" with a space; ran install, doctor, then bin/stale-copies.mjs.
   - Install: 0 retired rows, 5 ✗ skill rows, exit 1.
   - Doctor: every ✗ skill row reads `install will not add skills under the linked folder \`…/John Smith/.claude\` — move it aside, then run \`nana-setup install\``. Last line: `5 missing — fix by hand as each ✗ line says: skill requirements, … skill py-test`.
   - Stale line: `INSTALL STALE: … they move \`…/John Smith/.claude\` out of the way`. It names the same folder as doctor.
   - HOLDS.
2. Unlinked home with an empty `enforce`, a repo-managed nana-objective.sh link, a foreign regular nana-adoption.sh and a repo-managed context-size-check.sh link; main against lane.
   - Retired rows match line for line, apart from the home path in the detail.
   - Install moves `enforce` to the dated backup, unlinks both links, and prints `✗ … nana-adoption.sh is not a repository-managed symlink — left untouched`.
   - HOLDS: main's behaviour is kept.
3. Real `.claude` whose `hooks` folder is a link, holding a repo-managed nana-objective.sh link and a user file at context-size-check.sh.
   - Main prints 7 retired ✗ rows, 5 of them for absent paths. Lane prints only `✗ retired nana-objective.sh link` and `✗ retired context-size-check.sh link`.
   - The file still reads `mine`, and the link target is unchanged.
   - HOLDS.
4. `.claude` linked to a target that does not exist yet.
   - Install crashes with `Error: ENOENT … mkdir` on main and lane alike, and prints 0 retired rows.
   - Lane doctor names `.claude` to move aside, where main said `missing — run`.
   - HOLDS. The crash already happens on main (known bug 1).
5. NANA_SETUP_PLATFORM=win32: install, then move `.claude/skills` (marked copies) to a linked folder, then install again.
   - Main prints 8 retired ✗ rows and lane prints 0. Both leave the linked skills tree unchanged.
   - Doctor says "all good" and the stale line is silent on both. This is the plan's first known limit.
   - HOLDS.
6. `--claude-home` pointing at a linked folder.
   - Doctor reads `install will not add skills under the linked folder \`…/p9/alt-claude\` — move it aside…`.
   - HOLDS (known bug 2).
7. Unlinked install, then one skill link removed and a directory placed at py-lint; doctor on main against lane.
   - The whole doctor output is identical. Rows still read `missing — run \`nana-setup install\`` and `a directory is there instead of a symlink…`.
   - HOLDS: the unlinked-home text is unchanged.
8. Linked `~/.agents` holding a user directory at `skills/dev-check`.
   - Main prints 22 .agents retired rows and lane prints 1: `✗ retired .agents/skills/dev-check … unsafe source ancestor`.
   - SKILL.md still reads `my own skill`, and no backups folder appeared.
   - HOLDS.
9. Linked `.claude`: install twice, then compare the target tree on main against lane.
   - The 18-entry tree (hooks, rules, settings.json and the rest) is identical. Writes through the linked home are kept.
   - Second install: main prints 17 retired rows and 23 ✗ lines; lane prints 0 retired rows and 6 ✗ lines (5 skill rows and the summary).
   - HOLDS.
10. `.claude` linked, and `skills` inside it also linked.
    - Doctor and the stale line both name `…/p12/.claude`, the outer folder, which comes first.
    - HOLDS.
11. Unlinked home with a user regular file at hooks/context-size-check.sh.
    - Main and lane both exit 0, print 0 context rows and leave the file as `user hook`.
    - HOLDS: the guard now runs for any file there, but an unlinked home is not affected.

Findings. None is a MUST: no data lost, no write through a link, no broken install or hook, and nothing main does today stopped working.
1. Known bug, already on main: a dangling linked `.claude` makes install crash on an ENOENT mkdir. Doctor's last line still says "then run: nana-setup install for the other 28", which will crash until the link is moved.
2. Known bug, minor: under `--claude-home`, doctor's new row text says to run plain `nana-setup install` without the flag. The generic text it replaces had the same gap.
3. Known bug, from reading the code and not probed: doctor falls back to the raw path when codeSpan refuses it (a control character or more than 512 characters), but the stale line falls back to "skill .claude". In that case the "exactly as the session-start line" wording of R-2292 fails. This is outside realistic input.

Files:
- Plan: <worktrees>/linked-claude-folder-remedy/docs/reviews/linked-claude-folder-remedy-2026-10-20/must-meet.md
- Changed code: <worktrees>/linked-claude-folder-remedy/packages/nana-setup/lib/steps.mjs, lib/doctor.mjs and bin/stale-copies.mjs
- Probe clone and outputs: <tmp>
