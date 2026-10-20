# Review — project-odd-seeds (project setup skips a stray link, folder or file at a seed path by name, and the project check names project only for what project would fix), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-014 · Create or adopt a project workspace

Review `git diff 9552afb1..HEAD` on `feat/project-odd-seeds` (main was `9552afb1` when this brief was written; `git
merge-base HEAD main` is `9552afb1`). The plan of record is `docs/reviews/project-odd-seeds-2026-10-20/must-meet.md`
(rows R-2420 to R-2423 new; R-385, R-335, R-338 and R-931 pinned), with the adversary's `plan-attack.md` and
`build-brief-1.md` beside it. The seat's record is `seat-verify-7c698ae2.md`. CI run 39496709624 at 7c698ae2 reads 0 failing on all three legs: macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,008 checks pass, 35 skip); Ubuntu 192 PASS, 0 FAIL, 3 SKIP of 195 files (7,947 checks pass, 55 skip); Windows 177 PASS, 0 FAIL, 18 SKIP of 195 files (6,936 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-7c698ae2.log in this folder.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on the build tip; the notes commit adds no
row):

```
tree movement 9552afb..7c698ae: 8 rows in 1 features
FEAT-014 · Create or adopt a project workspace
  R-335 untested -> implemented
  R-338 untested -> implemented
  R-385 untested -> implemented
  R-931 untested -> implemented
  R-2420 new (implemented)
  R-2421 new (implemented)
  R-2422 new (implemented)
  R-2423 new (implemented)
```

Judge whether an owner whose project holds an honest leftover at a seed path or on its folder path now gets the truth
from `nana-setup project` and `project --check`: setup skips that seed by name, writes nothing through it, lands the
other seeds and lists it as a fix by hand; the check names the entry, says to move or remove it, and names `nana-setup
project` only for the ✗ rows project's own dry run would change. Judge too whether a name lands literally and a dry run
reports what the real run then does.

Threat model: honest variation in our tools' output and the OS in scope, here honest leftovers in a project folder (a
moved repo's broken link, a stray folder or file where a seed or its folder belongs, the project's own CLAUDE.md, odd
characters in a name, a dry run of a folder that does not exist yet) on macOS, Linux and Windows; deliberate forgery out
(a link planted to make project write elsewhere, a swap between lstat and write).

Lane class: ordinary — `nana-setup project` only (`lib/project.mjs`, runProject and the header's @outputs and @effects
lines in `bin/nana-setup.mjs`, one new test file, the setup README); install, uninstall, doctor, hooks, extensions,
the gate and the land and review tools are untouched.

Check: (1) the eight must-meet checks are not vacuous: each fails on main's code for the reason the plan names (M8 is a
green pin), and no row is wider than its check; (2) project writes nothing through an odd entry at a seed path or on its
folder path, and a live link to a folder on the way is still followed as before; (3) `--check` writes and spawns
nothing: the project dry run it now runs stays dry, the knowledge step included, and only a SetupError falls back to
the old summary line; (4) the `--check` summary gives `nana-setup project` only the ✗ rows the dry run would create or
update, the month log's label mapping included, and every existing ✗ prefix stays byte-identical (the R-337 and R-930
regexes); (5) the one-pass name fill keeps every name literal, and the new stub's region row matches between dry run
and real run; (6) nothing else changed: runDoctor, `fsops.mjs`, `stepKnowledgeRefresh` and the header's @inputs and
@errors lines are untouched, and no existing check was edited; (7) the README's project section and the rows say what
the code does; (8) HANDOFF and the session entry are true; (9) any MUST.
