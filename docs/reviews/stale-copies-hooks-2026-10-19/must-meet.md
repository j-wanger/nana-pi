# stale-copies-hooks: must-meet

Feature: FEAT-015 · Diagnose the active environment
Class: install, hook or gate. The lane changes doctor and the producer the Claude Code adoption hook runs. Full ladder: final reviewer, land reviewer or seat-land.md, wrong-code pairs through the mutation runner, one independent check, and the macOS install check before nana-land. The Windows CI leg runs the win32 cases natively.
Threat model: honest drift is in scope: a pull that adds or changes a hook, a hand edit, an interrupted install, POSIX links against Windows copies, NANA_SETUP_PLATFORM, and a folder, file or link the owner put at a skill path. Deliberate forgery is out of scope: a forged settings entry, crafted special files, hostile checkout paths.

Sentence: at session start, when doctor would mark any nana-installed rule, skill, hook link or hook settings entry ✗, the adoption hook prints one stale line. The line names each such row by its doctor label and gives a fix that clears it: the install command, preceded by any skill path install refuses to replace. The hook changes nothing in the home.

## Design
- New leaf `packages/nana-setup/lib/hook-health.mjs`. It holds one judgement of hook health, used by both doctor and the producer. Doctor's two hook loops move into it verbatim: the POSIX hook-link rows (win32 gives a skipped note) and the six `desiredHooks` settings rows (hasHook, hookTargets and the win32 resolve rule; knowledgeHookHealthy on POSIX). It returns labelled rows such as `{ label, ok, skipped, detail }`. Doctor maps them to its statuses at the same two places, so row text, status and order do not change. A separate module keeps one judgement for both callers. It also leaves alone doctor.mjs's header, which win-path-commands edits.
- `bin/stale-copies.mjs` reads the settings file once. It collects failing labels in doctor's order: hook links, rules, skills, settings rows. The rule and skill checks stay as they are.
- Move advice comes from install's own judgement, and only when a skill row fails: `stepSkills(layout, { dryRun: true })` (about 2 ms, writes nothing; probed). A skill counts when its dry-run row is a problem and doctor marks it ✗. Its path under the skills folder is the path to move. This covers the owner's folder or file and a foreign link at a pi-only skill path (POSIX), and a folder, file or link nana-setup did not make (win32).
- `staleNotice(labels, movePaths = [])`. With no paths, the line is byte-identical to today's, so nana-rulings.ts is unchanged. With paths, the line reads: … — tell the user; they move P, P out of the way, then fix it with INSTALL. Each P and INSTALL is a code span, and the line stays one line. A path codeSpan refuses is replaced by its skill label.
- Rejected: copying doctor's loops into the producer, because the labels would drift. Rejected: deriving the move advice from doctor's detail text. Doctor names no move for a foreign link at a pi-only skill path, or for a regular file at the win32 skill path (probed: doctor says re-run install; install refuses). Rejected: running diagnose() in the hook, because it spawns node, pi and launchctl (doctor alone 0.32 s; the whole hook 0.11 s today). Rejected: a producer time limit (residual).

## Must-meet (all in packages/nana-setup/tests/stale-copies.test.mjs)
| Row | Text | Test title | Red today |
|---|---|---|---|
| R-1760 | WHEN the adoption hook runs for a home that holds a nana-setup install record and doctor would mark ✗ a hook link row or a hook settings row, THEN the adoption hook shall print exactly one line that starts with the stale prefix and names this checkout's nana-setup install command. | R-1760: a missing hook link or hook settings entry puts one stale line in the adoption hook output | RED. Main 22ccd849, temp HOME, POSIX: roster-notice link removed, PreToolUse and UserPromptSubmit deleted. The installed hook printed nothing; doctor showed 3 ✗. Forced win32, `Bash` matcher, UserPromptSubmit deleted: the hook named only the skill row; doctor also failed 2 settings rows. |
| R-1761 | The adoption hook's stale line shall name exactly the rule, skill, hook link and hook settings rows, other than the private rule, that doctor marks ✗ for the same home on the same platform, each by its doctor label. | R-1761: the stale line names exactly the rule, skill and hook rows doctor marks failed | RED. POSIX occupied home: the line named three skills; doctor also failed settings PreToolUse verifier pipe. |
| R-1762 | WHEN the adoption hook prints the stale line, THEN the line shall name, as paths to move before the install, exactly the Claude Code skill paths whose rows both doctor and `nana-setup install --dry-run` for the same home mark ✗. | R-1762: the stale line names as paths to move exactly the skill paths install refuses | RED. POSIX occupied home: the line named install only. `install --dry-run --home` marked spec and py-lint as problems and wrote nothing. |
| R-1763 | WHEN the user moves aside every path the stale line names to move and then runs the install command the line names for that home, THEN the next adoption hook run shall print no line that starts with the stale prefix. | R-1763: moving the named paths and running the named install clears the stale line | RED. Following today's line, install exited 1 and the next run printed the spec and py-lint line again. After moving those two paths, install exited 0 and the line cleared. |
| R-1764 | WHEN the adoption hook runs and doctor would mark every rule, skill, hook link and hook settings row that nana-setup installs for Claude Code ✓ or as a note, THEN the adoption hook shall print no line that starts with the stale prefix or the stale-check unavailable prefix. | R-1764: a current install adds no stale or unavailable line to the adoption hook output | GREEN today, as a guard (win32 hook-link notes, fresh installs). Replaces R-1601; its check is renamed. |
| R-1765 | WHEN the adoption hook runs for a home that holds a nana-setup install record, THEN the adoption hook shall leave every file, folder and link under that home unchanged. | R-1765: the adoption hook leaves every file, folder and link in the home unchanged | GREEN today, as a guard. Probed: type, size, mtime and link target of every entry were identical before and after a hook run on the POSIX and forced-win32 occupied homes. It pins the dry run: without it, the hook relinks or rewrites requirements in the existing broken homes. |

Row edits: R-1601 → retired, "superseded by R-1764, 2026-10-19". R-1602 → retired, "superseded by R-1761, 2026-10-19". With hooks counted, both would now be false. R-1600 and R-1603 to R-1606 are unchanged and stay green.
"Hook link row" means doctor's `hook <name>` row. "Hook settings row" means doctor's `settings <label>` row for one of the six entries `desiredHooks` wires. Retired-hook rows are not counted.

## Fixtures
Doctor runs in process under `withPiStub`, as today. A broken home is a fresh install in a temp home with the listed edits.
- POSIX, skipped natively on Windows because install makes copies there:
  - Link-only home: roster-notice link removed, verifier-pipe.mjs replaced by a regular file, settings untouched. It pins the link branch on its own.
  - Occupied home: the owner's folder at py-lint, spec linked to an outside folder, requirements linked elsewhere (install relinks that one), PreToolUse and UserPromptSubmit deleted.
- win32, native on Windows and forced elsewhere:
  - Hook-only home: verifier matcher set to `Bash`, UserPromptSubmit deleted.
  - Occupied home: requirements replaced by an unmarked folder with a changed SKILL.md, UserPromptSubmit deleted.
- Which homes each check covers:
  - R-1760: every broken home where doctor marks a hook row ✗ (link-only, hook-only, both occupied).
  - R-1761, R-1762 and R-1765: every broken home, the existing ones included.
  - R-1764: the current homes.
- R-1762's oracle: the ✗ `skill` rows of `install --dry-run --home <home>` that doctor also marks ✗, as paths under that home's skills folder.
- R-1765's snapshot: the relative path, type, link target and content hash of every entry under the home. It is taken just before and just after the hook run, with no times.
- R-1763 runs last on each broken home:
  1. It asserts that the line's last code span is the expected install command.
  2. It moves each named path into scratch. A named path outside the fixture home fails the check and is never moved.
  3. It runs `node <cli> install --home <home>`, with HOME and USERPROFILE set to the home.
  4. It reruns the hook.

## Known limits
- The line rides the adoption hook. A missing adoption link or adoption settings entry silences the check (R-1606).
- Retired bash hooks, the shared memory index, PATH commands and pi config or registration stay doctor-only. pi-side registration drift is a residual.
- Some settings install cannot fix: a file it will not edit (bad JSON, a hooks shape it refuses, a leftover lock), or a customized hook entry it keeps while doctor fails it. These still get "install" as their fix, and the line repeats.
- When the skills folder is itself a link, install refuses every skill. The line can then name a skill path that is absent, and moving it does not help.
- A retired nana-dev-kit copy whose dated backup already exists: the dry run says install would back it up, but the real install refuses. The line names no path and repeats. This comes from reading the code and is unprobed.
- Doctor's own detail still names no move for a foreign link at a pi-only skill path, or for a regular file at the win32 skill path. The line now does.
- No test pins wall time. The producer sets no time limit of its own, under Claude Code's five-second SessionStart limit. The builder reports the measured time.
- Observed while planning, not this lane's work: on win32, install appends a second verifier group and leaves the old `Bash` group. The verifier then runs twice for Bash commands. This is a residual.

## Adversary amendments
- The POSIX hook fixture is now link-only, so R-1760 pins each hook branch on its own. The settings drift moved to the occupied home.
- R-1760 also runs over the occupied homes. A line that drops install when it names paths now turns it red.
- R-1763 runs over every broken home and never moves a path outside the fixture home. Otherwise a wrong path could move a checkout folder during mutation runs.
- New R-1765: no planned test pinned that the hook's skill judgement stays a dry run.