# win-hook-settings-repair — must-meet

Feature: FEAT-013 · Install and connect harness runtimes (SUB-013 · Connect hooks and packages without duplication)
On Windows, one install over a settings.json whose nana entries the POSIX installer wrote for another home leaves each nana hook in exec form naming this checkout, with exactly one verifier under WIN_VERIFIER_MATCHER. Doctor then reads all six settings rows ✓, and a second install changes nothing.
Class: install, hook or gate (it changes install's settings merge). It needs the land reviewer, the seat's wrong-code pairs, one independent check, the mutation runner, and the macOS install check before nana-land.
Threat model:
- In scope (honest variation): a settings.json copied or synced from a Mac or Linux home, the first pre-release installer's unquoted knowledge entry, and the doubled verifier that today's install leaves.
- Out of scope (deliberate forgery): an owner's entry that copies nana's exact timeout, status message, quoting and `.claude/hooks/` folder is claimed as nana's.
Stakes: medium. Install rewrites the owner's user-scope settings.json on Windows; the ownership checks guard it.

## Today (probed on main 32d6aa8b in a temp clone, win32 forced, temp home)
- Install prints `already wired` for objective, adoption, shared-memory and roster notice. All four name a missing `<home>/.claude/hooks/…`. Doctor then reads ✗ on 5 rows, and a second install changes nothing.
- The `Bash` verifier stays, and install appends a second one under `Bash|PowerShell`. Nothing ever cleans up that doubled home.
- The first installer's knowledge entry (`NODE_NO_WARNINGS=1 node <path> hook`, unquoted) reads `already wired` and stays dead. Doctor reads ✗.
- Cause, in settings.mjs:
  - win32 `installerTarget` has no shell form for the five hooks and no unquoted knowledge form;
  - `mergeRepoHooks` scans only the wanted matcher;
  - `hasHook` reads the dead shell form as present.

## Design (built in a temp clone, about 42 lines in settings.mjs; checks below green; settings-merge, win32-degrade, stale-copies, uninstall, verifier-pipe and install single files green)
1. installerTarget, win32 only, the five non-knowledge hooks with no `args`: form `posix-shell` when `tokenize(command)` is exactly `["node", target]`, `path.win32.isAbsolute(target)` holds, the target ends in `/.claude/hooks/<script>`, and `command === node ${shq(target)}` byte for byte. Define the suffix once, with provenance (contract value: the POSIX installer's default hooks folder; R-1880).
2. installerTarget, win32 knowledge branch with no `args`: form `posix-unquoted` when argv is `NODE_NO_WARNINGS=1`, `node`, target, `hook`; the target is win32-absolute with the knowledge suffix; and `command === NODE_NO_WARNINGS=1 node ${target} hook` byte for byte.
3. mergeRepoHooks already replaces any non-exec win32 form in place and keeps the other keys (the R-1059 path). Both new forms use that path.
4. Verifier, win32:
   - Also scan PreToolUse groups whose matcher is the POSIX installer's. Read that matcher by name, never as a second inline `Bash`.
   - Splice each entry that passes the timeout-5 gate and installerTarget. Never rewrite a matcher. Drop a group the splice empties.
   - Append `{...moved, command, args}` under WIN_VERIFIER_MATCHER only when no installer-shaped verifier is already there.
   - Mark the label found and replaced.
5. The header rules comment records the one exception to "foreign matcher-scoped groups are left alone". POSIX is unchanged; the R-1061 fixture is untouched.
6. Setup README: the hooks row and the "Install never removes or reorders" bullet name the Windows repair and the verifier move. Add one tests-table line.

## Must-meet
All checks go in a new file, packages/nana-setup/tests/win32-hook-repair.test.mjs. It runs the CLI with NANA_SETUP_PLATFORM=win32, on every leg, with no skip.
Fixtures:
- F1, the carried home: POSIX desiredHooks for hooksDir `/Users/someone/.claude/hooks` and repoRoot `/Users/someone/nana-pi`. A foreign `echo` sits between objective and adoption, and the verifier sits between two foreign entries in its `Bash` group. Run one install, then doctor, then a second install.
- F2, today's doubled output: a POSIX-form verifier under `Bash`, plus the win32 desired verifier under WIN_VERIFIER_MATCHER.
- F3: a foreign entry, then the unquoted knowledge entry.
- F4: the look-alikes.

| Row | Test title | Red today? |
|---|---|---|
| R-1880 | `win32 install: carried shell-form SessionStart entries become exec form in place` (F1) | Red (probed): the entries stay `node '/Users/…'` |
| R-1881 | `win32 install: a shell-form verifier under Bash ends as one exec-form verifier under WIN_VERIFIER_MATCHER` (F1) | Red (probed): two verifiers |
| R-1881 | `win32 install: a Bash verifier beside a WIN_VERIFIER_MATCHER verifier ends as one` (F2) | Red (probed): two verifiers |
| R-1882 | `win32 install: the Bash group keeps its matcher and other entries when the verifier moves` (F1) | Red only through its verifier-gone clause, which R-1881 owns. The matcher-rewrite wrong code pins its own clause (probed). |
| R-1883 | `win32 install: a second install over the repaired home reports all six settings rows unchanged` (F1) | Green today. "Count a scanned Bash group as a repair" turns it red (probed); this needs F1's surviving `Bash` group. |
| R-1884 | `win32 doctor: all six settings rows read ✓ after one install over the carried home` (F1) | Red (probed): 5 rows read ✗ |
| R-1885 | `win32 install: the first installer's unquoted knowledge entry becomes exec form in place` (F3) | Red (probed): the entry stays and doctor reads ✗ |
| R-653 pin | `win32 install: shell-form look-alikes (timeout, message, quoting, folder) stay byte-identical` (F4) | Green today. Each of four wrong codes turns it red (probed). |

## Known limits (residuals)
- Mirror case, cut from this lane: a Windows exec entry carried to a Mac reads as not installed (R-1061). Install appends a POSIX twin, and the dead exec entry stays.
- Not claimed, so these entries stay:
  - a path under a custom `--claude-home`;
  - a double-quoted path;
  - a shell form naming the checkout's own hooks folder (no installer ever wrote one). Under `Bash`, this one gets an exec twin under WIN_VERIFIER_MATCHER.
- A backslash path reads as not invoking the script. Install adds an exec twin, and doctor reads ✓ beside the dead entry (the R-923 limit).
- An exec-form verifier under `Bash` (no installer ever wrote one) moves through the same code. No check pins it.
- Repairs report `created added`, as R-1056 repairs already do. No check pins dropping an emptied `Bash` group; keeping it is the expected survivor.
- Carried `.sh` entries stay PROBLEM rows, because migrateLegacyHooks stays off on win32.
- Nothing here runs Claude Code. That Claude Code fires the moved entry once per Bash or PowerShell call is inferred from R-1053's read of the docs.
- R-1885 claims an unreleased form. R-660 excluded one, but for removal; an in-place repair of a dead entry on win32 is the narrower act.
- HANDOFF's residual about the doubled verifier on Windows closes with this lane. The seat removes it in the reviewed change.