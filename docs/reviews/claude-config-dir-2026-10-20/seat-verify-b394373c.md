# Seat checks — claude-config-dir builds 1 to 3, tip b394373c (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (the roster's larger-lane builder; three builds); the lane
  branched from main 9552afb1, with the plan at b1e3e3d2 (`must-meet.md`; `plan-attack.md`: one adversary, AMEND;
  `build-brief-1.md` with the seat's amendments at its end). `build-brief-1.md`'s top still names a Claude Sonnet
  builder; its last seat section moved the build to pi sol.
  - Build 1 is 53cba519 plus 58fe4374 (the setup README's Tests paragraph reworded). New
    `packages/nana-setup/lib/claude-config-home.mjs` (six-tag header, `@effects none`) exports `CLAUDE_CONFIG_ENV`
    (contract value, R-386) and `claudeConfigHome(home, env)`: the variable's value as given when it is not empty,
    else `<home>/.claude`. The shared-memory hook's Claude home expression becomes one call to it; its output is
    unchanged, a relative value included. `lib/paths.mjs` `resolveLayout` reads the variable only when neither
    `--claude-home` nor `--home` is given, resolves a relative value against the cwd without throwing (`safeResolve`),
    and adds `claudeHomeSource` (`--claude-home`, `--home`, `CLAUDE_CONFIG_DIR` or `default`) and
    `claudeHomeCwdRelative` right after `claudeHome`. `bin/nana-setup.mjs` adds `refuseCwdRelativeClaudeHome` (a
    one-line SetupError, exit 2, naming the variable, the resolved folder, the cwd and `--claude-home <absolute dir>`),
    called in `runInstall` before the banner and in doctor's install prediction. Build 1's banner appended
    `  (from CLAUDE_CONFIG_DIR)` for that source only. `scripts/test.mjs` SCRUB adds the variable;
    relative-agent-dir, desk-service and win-shims delete it from their child env. The setup README's usage line, a new
    paragraph and its Tests paragraph change with it. Rows R-2390 to R-2394, R-2397 and R-2398 sit in FEAT-013 SUB-011
    after R-932, and R-2396 in FEAT-031 after R-618; R-2395 is not used. The new `claude-config-dir.test.mjs` holds
    seven checks, and `test-runner.test.mjs` gains one.
  - a6947c42 adds the seat's pairs on 58fe4374; 655f1d57 is build brief 2.
  - Build 2 is d9a5bdfb. R-2392's check (title and row unchanged) adds a relative `CLAUDE_CONFIG_DIR=rel-claude` with
    `--claude-home <abs>`, and again with `--home <abs>`: each install exits 0, writes where the flag says, leaves
    `<cwd>/rel-claude` empty or absent, and its banner names the flag as the source. The banner now appends
    `  (from <source>)` for every source but `default`. It also filled the shared-memory seed's folder text at install
    (independent check F2), which broke uninstall: uninstall removes the seeded index only when its bytes equal the
    seed source. The seat ran `uninstall.test.mjs` alone: 31/31 on build 1, 29 pass and 2 fail on build 2 ("install
    --desk then uninstall restores the independent home snapshot" and "released context entry is retired by install
    and its link is removed on uninstall"). 8da78f27 is build brief 3.
  - Build 3 is 5bdb9db6. It puts `claude/memory/MEMORY.seed.md` and `stepSharedMemory` in `lib/steps.mjs` back
    exactly as on build 1 (`git diff a6947c42 5bdb9db6` on those two files is empty) and keeps build 2's banner and
    test. uninstall reads 31/31 again. b394373c adds the seat's pairs on 5bdb9db6.
  - No row names the banner's flag source; R-2392's check carries it, and R-2392's row speaks only of where the files
    go. The plan's design said every other banner stays byte-identical; build 2 changed that at the seat's brief. No
    code outside the lane's test reads the banner's claude home line (`git grep`).
- CI run 39499885423 on draft pull request #148 at b394373c (build 3 plus the seat's pairs record; GitHub's merge
  commit ca78f762 merges b394373c into its own ancestor 9552afb1, so the tree tested is b394373c's) reads 0 failing on
  all three legs:
  - macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,008 checks pass, 35 skip).
  - Ubuntu 192 PASS, 0 FAIL, 3 SKIP of 195 files (7,947 checks pass, 55 skip).
  - Windows `195 files: 177 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6936 pass, 0 fail, 114 skip`
    (`ci-windows-b394373c.log`); the 18 skipped files are main's declared set. claude-config-dir `7 pass`, with no
    skip:
    ```
    PASS install with an absolute CLAUDE_CONFIG_DIR writes the Claude files there and nothing under ~/.claude
    PASS doctor checks the CLAUDE_CONFIG_DIR folder, not a fully installed ~/.claude
    PASS --claude-home and --home win over CLAUDE_CONFIG_DIR
    PASS a relative CLAUDE_CONFIG_DIR: install exits 2 naming the variable and writes nothing
    PASS the install banner names the CLAUDE_CONFIG_DIR folder and its source
    PASS an empty CLAUDE_CONFIG_DIR falls back to ~/.claude
    PASS a relative CLAUDE_CONFIG_DIR: doctor's summary names it as install's refusal
    ```
    The adversary's claim most likely wrong, R-2391's control run reading ✓ for both rows on Windows, held.
    Neighbours there: test-runner `46 pass` (R-2396 among them), relative-agent-dir `31 pass`, win-shims `7 pass`,
    desk-service `6 pass, 1 skip`, shared-memory-hook `42 pass, 1 skip`, stale-copies `13 pass, 1 skip`, install `93
    pass, 5 skip`, uninstall `2 pass, 2 skip` (POSIX only), install-check.test `129 pass`.
  - The install check passes on macOS and Windows.
  - Build 1's run at 58fe4374 was cancelled as superseded.
  - Main's own known failures: Ubuntu's path-spelling GP1 and GP2 until linux-path-spelling landed (main ca27d86); a
    pull-request run's R-291 leaf-total failure, a merge artifact of GitHub's merge commit. Windows main reads 0 FAIL
    since 4be0b79 (desk files are declared skips). None showed.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, merge base
  9552afb1):
  - On 58fe4374 (one shard; `seat-mutate-output-58fe4374.txt`, commit a6947c42): 16 of 18 red, each exactly its named
    titles; P4 and P8 survived. Baselines: claude-config-dir 7 PASS, shared-memory-hook 43, test-runner 46, each 0
    FAIL. P4 (the guard dropped, so the variable is read even when a flag picks the folder) survived because no check
    paired a relative value with `--claude-home` or `--home`; for an absolute value the flag still wins. P8 (an
    absolute value's trailing separator kept) is equivalent: every consumer joins paths with `path.join`.
  - On 5bdb9db6 (five shards; `seat-mutate-output-5bdb9db6.txt`, commit b394373c): 18 of 19 red, 17 exactly their
    named titles and 1 with an unnamed red; P8 survived, declared equivalent. Baselines as before.
    - C1 to C3 break the shared resolver (main's rule; `??` so an empty value is not unset; the value resolved inside
      it). P1 to P7 break `resolveLayout` (main's form; the variable beating either flag; read under `--home`; the
      guard dropped, P4, now red on R-2392; a relative value resolved silently; the source never named; a relative
      value left unresolved). B1 to B5 break the CLI (no refusal in install; none in doctor's prediction; a plain
      Error; the banner without its source; the pi refusal's text copied). B4 is re-anchored on build 2's banner and
      also reddens R-2392's check, the unnamed red. New B6, build 1's banner form (a source named only for the
      variable), turns R-2392 red. H1 makes the hook read `~/.claude` only and S1 leaves the variable in SCRUB.
    - Declared without a pair, before the run: the default branch `: claudeConfigHome(base)` (reached only when the
      variable is unset or empty, where it equals main's join), the import and re-export lines (interface only),
      USAGE and the headers (no check reads them), safeResolve's catch (only a vanished cwd reaches it) and the three
      hermetic test edits (tests, not product). H1 names only R-386's first hook check, because the file throws
      before the second. S1 copies the mutated runner into throwaway roots; it never runs the suite.
  - No Windows-only pair ran; the Windows CI leg is the only run of the win32 branch.
- Independent check (`independent-check-b394373c.md`, filed under this tip's name): it ran on build 1, 58fe4374, in a
  private clone with a temp HOME for every run (macOS). HOLDS over eleven probes (P1 to P11), no MUST.
  - Must-meet: claude-config-dir 7 PASS; test-runner with the variable set 46 PASS; code map and readme checks 0
    problems.
  - Held: an absolute value with a trailing slash puts every piece in that folder and nothing under `<home>/.claude`,
    with the banner `(from CLAUDE_CONFIG_DIR)` (P1); the installed hook, run through its link, prints that folder's
    index (P2); a second install changes nothing and doctor reads every hook, rule and settings row ✓ (P3); uninstall
    keeps the owner's settings keys in the variable's folder (P4); a relative value and a literal `~/` value make
    install and its dry run exit 2 and write nothing (P5); forced win32 writes copies and hook commands into the
    folder (P6); with no variable, install output and the home tree (43 entries) are identical to the base commit's
    (P7); four test files run directly with the variable set leave its folder empty (P8); a linked folder gives the
    existing ancestor refusal (P9); the session-start stale check follows the variable (P10); `state --paths`
    refuses a folder outside home, as the plan says (P11).
  - Its findings and how each was settled:
    1. F1, known bug: a direct run of `stale-copies.test.mjs` with the variable set reads 7 PASS, 6 FAIL (R-1600,
       R-1760, R-1761), against 13 PASS on 9552afb1. The adoption hook's child now inherits the variable, and that file
       does not delete it. It only reads, so nothing was written; the runner scrubs the variable, so the suite stays
       green. Not fixed: a HANDOFF residual.
    2. F2, known bug: the seeded shared-memory index still says "Lives at ~/.claude/nana-memory/shared" when the
       variable moves it. Build 2 filled the folder in at install and broke uninstall (above); build 3 put the seed
       back. Not fixed: a HANDOFF residual that names why the text stays.
    3. F3, known bug: a machine installed before this lane that then sets the variable gets a new, empty
       shared-memory index in the new folder. The old memories stay in `<home>/.claude/nana-memory/shared`; nothing
       is lost, and install neither moves them nor says where they are. Not fixed: a HANDOFF residual.
    4. H1: HANDOFF's win-stale-copies line said the stale check reads the default Claude folder, untrue for a folder
       the variable sets (P10). Settled in this commit: the line now names the variable's folder and keeps the gap
       for a `--claude-home` install made without the variable.
    5. H2: the plan's known limits go to HANDOFF with F1 to F3. Settled in this commit, one residual line each.
  - Builds 2 and 3 changed the banner line and R-2392's check and put the seed back. Nobody re-ran the independent
    check on them; a HANDOFF residual says so. The seat's pairs and CI cover b394373c.
- The plan's known limits, each now a HANDOFF residual naming this lane: nana-setup reads only its own shell's
  environment, so a value set only in Claude Code's settings env block, or only in a desktop-launched Claude Code's
  environment, is not seen; `state --paths` refuses a Claude folder outside home, as `--claude-home` does; the state
  manifest still lists the login file at `<home>/.claude.json` (Claude Code keeps it in the variable's folder; inferred
  from its bundle); uninstall and state do not refuse a relative value; doctor shows no ! row for a relative value,
  only its summary names it; the pi gate's protected Claude settings and hooks pattern and the writing-trial
  extractor's default root still match only a folder named `.claude`.
- Declared behaviour change: the install banner's claude home line now ends `  (from --claude-home)` or
  `  (from --home)` when a flag sets the folder, where main printed no source. With no flag and no variable it is
  unchanged.
- HANDOFF: one Landed line; the win-stale-copies stale-check line narrowed (H1); eleven new residuals naming this
  lane: the independent check not re-run after build 1, F1 to F3, and the plan's seven known limits.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2390 to R-2394, R-2396 to R-2398 read `implemented` in REQUIREMENTS.md. At the notes commit (no code or row
  changed since 5bdb9db6): `node scripts/requirements-trace.mjs` reads `requirements: 1675 total (1438 implemented · 1
  planned · 37 retired · 193 untested · 6 violated); 1438 traced by tests` and `ears: 0 rows off form (allowance 0)`;
  `npm run map:check` reads 366 modules, 0 problems; `npm run readme:check` reads 727 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 9552afb1, run at b394373c):
  ```
  tree movement 9552afb..b394373: 8 rows in 2 features
  FEAT-013 · Install and connect harness runtimes
    R-2390 new (implemented)
    R-2391 new (implemented)
    R-2392 new (implemented)
    R-2393 new (implemented)
    R-2394 new (implemented)
    R-2397 new (implemented)
    R-2398 new (implemented)
  FEAT-031 · Run checks reliably and without contaminating work
    R-2396 new (implemented)
  ```
  CAP-04 moves from 523 to 530 rows, FEAT-013 from 195 to 202 and SUB-011 from 17 to 24; CAP-07 from 318 to 319 and
  FEAT-031 from 95 to 96. No existing row changed.
- Not in this record: a seat-run locked full suite (the land runs it on the reviewed tip), Windows-only wrong-code
  pairs, and the local macOS install check, which runs before the land.
