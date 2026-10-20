# Seat checks — linked-claude-folder-remedy build 1, tip c7be9bb3 (2026-10-20)

- Build, by a Claude Sonnet 5 builder (one build); the lane branched from main 72abe19a, with the plan at e2064663:
  - Build 1 is one commit, 2055067e (`build-brief-1.md`). In `packages/nana-setup/lib/steps.mjs`
    `stepRetiredArtifacts`, each of the three loops lstats first and prints no row for an absent path (the seat's lane
    spec rules that an lstat that only checks existence is a read, so it may run before the ancestor check; R-663's
    text stays). The manifest loop's whole managed-skill skip (a link, or a folder holding the copy marker, at spec,
    py-lint, py-review or py-test) now runs before the source guard; the guard, provenance match, backup guard and
    move keep their order and text. The retired hook-link loop runs its unchanged guard after the lstat. The
    context-size-check guard and its ✗ row run whenever lstat finds anything there, a regular file included. The new
    export `linkedSkillFolder(layout)` returns null when stepSkills's own ancestor test holds, else the first of the
    Claude home and the skills folder that lstat reports as a link. `bin/stale-copies.mjs` drops its local
    `linkedSkillParent` for it, with its output unchanged. In `lib/doctor.mjs` `diagnose`, under a linked folder each
    ✗ skill row reads `install will not add skills under the linked folder <code span> — move it aside, then run
    \`nana-setup install\``; ✓ rows, and every row in an unlinked home, keep their text. `bin/nana-setup.mjs` is
    unchanged. The setup README's retired-artifacts row, session-start paragraph and test table change with it.
    REQUIREMENTS.md gains R-2290 and R-2291 in FEAT-013 SUB-014 (after R-1593 and R-663) and R-2292 to R-2294 in
    FEAT-015 (after R-1766); the new `packages/nana-setup/tests/linked-claude-folder.test.mjs` holds all five.
  - The brief asked for single test files. The builder also queued a locked full-suite run, which waited behind
    another lane's hold on the suite lock; the seat stopped it. CI's three legs ran the whole suite instead.
  - c7be9bb3 adds the seat's pairs. After it, the seat's notes commit adds only this record, the independent check,
    the Windows log, the two review briefs, HANDOFF and the session entry.
- CI run 39441711620 on draft pull request #136 at 2055067e (GitHub's merge commit b8f6d6fa merges 2055067e into its
  own ancestor 72abe19a, so the tree tested is 2055067e's); all five jobs succeeded:
  - macOS `191 files: 189 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7967 pass, 0 fail, 31 skip`; linked-claude-folder
    `5 pass`.
  - Ubuntu `191 files: 188 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7906 pass, 0 fail, 50 skip`; linked-claude-folder
    `5 pass`.
  - Windows `191 files: 173 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6892 pass, 0 fail, 112 skip`
    (`ci-windows-2055067e.log`). The 18 skipped files are main's declared set (16 desk files, bench's study-tasks and
    the POSIX-only checkout-converge). linked-claude-folder `5 pass`, R-2290 to R-2294 each by its title, with no
    skip. The plan's claim most likely wrong was that every check passes natively on Windows, where four steps were
    untried: a real `.claude` renamed and junctioned back, a junction renamed aside for R-2293, file symlinks inside a
    junctioned folder, and the forced-win32 home D. It held.
  - install-check: macOS and Windows success.
  - None of main's known failures showed (Ubuntu's path spelling, fixed on main at ca27d86; a pull request run's R-291
    leaf-total merge artifact, which cannot arise here because GitHub's merge commit holds 2055067e's tree).
  - CI has not run on c7be9bb3, which adds only the seat's pair files under `docs/reviews/`.
- The seat's wrong-code pairs (`seat-mutate.mjs`, the shared mutation runner, macOS, Node 22.22.2, one shard) on
  2055067e: 18 of 19 red, 17 exactly on their named titles, 1 survived (`seat-mutate-output-2055067e.txt`, commit
  c7be9bb3). The baseline reads linked-claude-folder 5, retired-artifacts 47, skills-and-standards 88 and stale-copies
  13 PASS, 0 FAIL.
  - The retired-artifact step: S1 (the manifest loop's guard before the lstat, main's order), S2 (the whole skip below
    the guard, W1), S3 and S4 (the skip's two halves split around the guard, W8 and its mirror), S6 (the hook-link
    guard before the lstat) and S8 (the context-size-check row printed whether or not anything is there, main's form)
    turn R-2290 red. S5 (the source guard dropped, W7) and S10 (the context guard only on links, W10) turn their
    retired-artifacts checks red. S7 (a silent continue on an unsafe hooks folder, W2) turns R-2291 and "unsafe hooks
    directory is refused without removing anything" red; S9 (the context guard dropped, W3) turns R-2291 and "hook
    source symlink ancestor is refused without changing its external target" red.
  - `linkedSkillFolder`: L1 (the Claude home returned unchecked, W6) turns R-2292, R-2293 and skills-and-standards'
    "doctor marks the missing skill ✗ and names the fix" red, plus eight other checks that read the row text (six in
    skills-and-standards, R-1762 and R-1763 in stale-copies): correct, unnamed. L2 (only the Claude home looked at)
    turns R-2292 and R-2293 red.
  - The stale line: C1 (it drops the linked folder and names only existing skill paths) turns R-2292, R-2293, R-1763
    and R-1766 red.
  - Doctor's ✗ skill rows: D1 (main's generic row), D2 (always the skills folder, W4), D3 (`missing — run` plus the
    folder, W5) and D5 (no code span) each turn R-2292 and R-2293 red. G1 (the last line counts every ✗ skill row as
    an install repair, W9, in `bin/nana-setup.mjs`, which the lane does not change) turns R-2294 red.
  - Survivor D4 (doctor gives ✓ skill rows the move-aside text too), declared (e) before the run: a test gap. No check
    runs doctor on a home with a linked folder and ✓ skill rows, so the plan's "✓ rows keep today's text" is tested
    only for unlinked homes. A HANDOFF residual.
  - Declared without a pair, before the run: (a) home D stands in for native Windows on macOS, and CI's Windows leg is
    the native run; (b) G1 edits a file the lane does not change, as a guard pair for R-2294; (c) dropping
    `linkedSkillFolder`'s early return is an equivalent edit; (d) no pair reverts stale-copies to main's
    `linkedSkillParent`, since the runner has no stay-green pairs, and C1 stands in; (f) no pair for the header export
    list, the README or comments.
- Independent check (`independent-check-c7be9bb3.md`, filed under this tip's name): it ran on 2055067e in a private
  clone beside main 72abe19a, with temp homes on macOS and win32 forced where noted. HOLDS over 11 probes, no MUST.
  - Must-meet and neighbouring files, one at a time: linked-claude-folder 5/0; retired-artifacts 47 PASS;
    stale-copies 13/0; doctor-fix-line 0 failures; install passes on main and lane; skills-and-standards exits 6 on
    both with the same six FAIL lines (the clone's untrusted project). The code-map check reads 0 problems and the
    readme check 725 claims, 0 problems.
  - A linked `.claude` under a home path with a space gives 0 retired rows; doctor's rows and the stale line name the
    same folder, and doctor's last line lists the five skills by hand (probe 1). In an unlinked home, retired rows
    match main line for line, and install still moves `enforce` and unlinks both hook links (probe 2). A linked hooks
    folder: main printed 7 retired ✗ rows, 5 for absent paths; the lane prints only the two present ones and leaves
    both untouched (probe 3). Forced win32 copies under a linked skills folder: main 8 retired ✗ rows, the lane 0
    (probe 5). A linked `~/.agents` holding a user skill: main 22 retired rows, the lane 1, the user's file kept
    (probe 8). Writes through a linked home are unchanged: the 18-entry target tree is identical on main and lane, and
    a second install prints 0 retired rows where main printed 17 (probe 9). An unlinked home's doctor output is
    identical to main's (probe 7), and a user file at the old context hook in an unlinked home stays untouched on both
    (probe 11). A doubly linked home names the outer folder in doctor and the stale line alike (probe 10).
  - Its known bugs and how each was settled; none is a MUST, and none is fixed in this lane:
    1. A dangling linked `.claude` makes install crash on an ENOENT mkdir, on main and lane alike (probe 4). Doctor's
       last line still says to run install for the other 28 rows, which keeps crashing until the link is moved. A
       HANDOFF residual.
    2. Under `--claude-home`, doctor's new row says plain `nana-setup install`, without the flag (probe 6); the generic
       text it replaced had the same gap. A HANDOFF residual.
    3. From code reading, not probed: when `codeSpan` refuses the folder (a control character or over 512 characters),
       doctor falls back to the raw path but the stale line to "skill .claude", so R-2292's exact-match wording fails
       there. Outside realistic input. A HANDOFF residual.
  - Probe 5 also saw the plan's first known limit: a skills folder linked after an install with right copies reads all
    good in doctor, and the stale line is silent, on main and lane.
- The plan's other known limits, each a HANDOFF line: a Claude home linked after an install whose skill links are
  right reads all good in doctor and the stale line is silent, while install shows five ✗ skill rows and exits 1;
  install's own ✗ skill rows still say "unsafe source ancestor under <Claude home>", naming the Claude home even for a
  linked skills folder; doctor's ! rows for legacy flags and scaffolders still say to run install, which refuses those
  files under a linked Claude home (read from code); a Claude home or skills folder that is a regular file still gets
  only "run install" (inferred; added to the existing stale-copies-hooks plain-file line); moving the folder aside
  leaves the owner's settings and memory in it (the existing stale-copies-hooks line, which now says doctor gives the
  same advice); whether install should write hooks, rules and settings through a linked Claude folder at all is the
  owner's call (a new line; the lane keeps today's behaviour).
- HANDOFF: one Landed line. The doctor-fix-line residual (a linked Claude folder's ✗ skill rows said to run install,
  which would not fix them) is dropped: the rows now name the folder to move aside. Two stale-copies-hooks lines gain
  doctor's half. Eight new residuals name this lane: the independent check's three known bugs, survivor D4, three
  of the plan's limits and its open question for the owner.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2290 to R-2294 read `implemented` in REQUIREMENTS.md. At the notes commit (no code or row changed since
  2055067e): `node scripts/requirements-trace.mjs` reads `requirements: 1630 total (1393 implemented · 1 planned · 37
  retired · 193 untested · 6 violated); 1393 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run
  map:check` reads 356 modules, 0 problems; `npm run readme:check` reads 725 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 72abe19a):
  ```
  tree movement 72abe19..c7be9bb: 5 rows in 2 features
  FEAT-013 · Install and connect harness runtimes
    R-2290 new (implemented)
    R-2291 new (implemented)
  FEAT-015 · Diagnose the active environment
    R-2292 new (implemented)
    R-2293 new (implemented)
    R-2294 new (implemented)
  ```
  CAP-04 moves from 497 to 502 rows, FEAT-013 from 188 to 190, its SUB-014 from 41 to 43, and FEAT-015 from 136 to
  139. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite at 2055067e), a seat re-run of
  the mutation runner (the seat changed no code or test) and the local macOS install check, which runs before the land.
- Main is still 72abe19a, the merge base and the review base.
