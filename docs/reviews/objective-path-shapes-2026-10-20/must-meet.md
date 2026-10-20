# objective-path-shapes — must-meet

Feature: FEAT-001 · Keep goals and priorities in view (the doctor rows sit under FEAT-015, the install row under FEAT-013)
Class: install, hook or gate. It changes nana-setup install and doctor. It also changes objective.ts, which the Claude Code objective hook and the pi objective extension both run.
Threat model: honest hand edits of the owner's own user-scope nana-pack.json on macOS, Linux and Windows are in scope. Deliberate forgery is out. The gate does not change, because config.ts pathOrNull never throws.

Sentence: for any objective.path value in the user-scope nana-pack.json, install and doctor finish without throwing and name the same objective file that the objective producer reads, on macOS and on Windows.

## Design
- One resolver, new `packages/nana-pack/lib/objective-path.mjs`: pure, six-tag header, `@effects none`. It exports `DEFAULT_OBJECTIVE_FILE = "nana-objective.md"` (contract value, R-004) and `resolveObjectivePath(value, { home, agentDir, platform })`:
  - a value that is not a string, or is "", resolves to `<agentDir>/nana-objective.md`
  - "~" resolves to home. A leading `~/` resolves under home. A leading `~\` resolves under home only where platform is win32 (pi's normalizePath rule, as agent-dir.mjs copies it)
  - an absolute value stays unchanged. Any other value resolves under agentDir, never cwd
  - the path flavour follows `platform` (path.win32 or path.posix), so the win32 rule is checkable on a Mac
- objective.ts `objectivePath` becomes one call with os.homedir(), piAgentDir() and process.platform. It keeps `o.path`, so R-2093 (missing settings object = internal error) still holds. steps.mjs `objectiveTarget` becomes one call with layout.base, layout.piHome and the real process.platform (not the NANA_SETUP_PLATFORM seam: the path flavour must match the real file system). Its hand copy goes; the export stays (doctor and fresh-machine.test import it). paths.mjs `piObjective` reads DEFAULT_OBJECTIVE_FILE.
- Doctor adds a ✗ `pi objective.path` row, with no install label, only when the value is present and neither a string nor null. The row names the JSON value (capped as projectFileState caps it) and the default file the producer reads instead. It gives the fix: a path string, or null for the default. The fix line lists it as by hand.
- Declared behaviour change: `false` and `0` were silently the default. Doctor now marks them ✗ and exits 1, but the producer still ignores them as before.
- config.ts does not change. The resolver handles "", so the journal, handoff and receipts paths keep their behaviour.

## Must-meet (all in packages/nana-setup/tests/objective-path-shapes.test.mjs)
| Row | Requirement | Check title | Red today |
|---|---|---|---|
| R-2280 (FEAT-015) | IF the user-scope nana-pack.json gives objective.path a value that is neither a string nor null, THEN doctor shall print every row it prints for that home with objective.path unset, plus its objective.path row, exit 1 and print no stack trace. | R-2280: doctor prints every row and no stack trace when objective.path is 5, true or an object | Probe at 72abe19a, temp home: doctor printed `TypeError: p.startsWith is not a function at objectiveTarget (steps.mjs:651)` and no rows for 5, true, {} and [] |
| R-2281 (FEAT-015) | WHEN doctor reads a user-scope nana-pack.json, doctor shall print a ✗ pi objective.path row naming the value and the default objective file that the objective producer reads instead, exactly when objective.path is present and neither a string nor null. | R-2281: doctor marks objective.path ✗ naming the value and the default file only when it is neither a string nor null | Same probe: crash for 5, true, {} and []; for false, doctor printed no objective.path row at all |
| R-2282 (FEAT-013) | IF the user-scope nana-pack.json gives objective.path a value that is neither a string nor null, THEN install shall run every step without throwing and seed the default objective file when it is absent. | R-2282: install runs every step and seeds the default objective file when objective.path is 5, true or an object | Probe: `install --dry-run` threw the same TypeError in stepPiConfig (steps.mjs:663); the plan's real-install probe left only nana-pack.json in the pi folder |
| R-2283 (FEAT-001) | WHERE objective.path is an empty string, the objective producer, doctor and install shall each take nana-objective.md in pi's active agent dir as the objective file. | R-2283: an empty objective.path names the default objective file in the producer, doctor and install | Probe: producer printed `OBJECTIVE UNAVAILABLE: unreadable (<agent dir>)`; doctor and install used the default file |
| R-2284 (FEAT-001) | The shared objective path resolver shall expand a leading `~\` in objective.path to the home folder only where the platform is win32, and elsewhere keep it as part of a name relative to the agent dir. | R-2284: the objective path resolver expands a tilde-backslash prefix to the home folder only on win32 | Red: the resolver does not exist. Both copies on main expand only `~/` (objective.ts:109, steps.mjs:651) |
| R-2285 (FEAT-001) | WHERE the platform is win32, WHEN objective.path starts with `~\`, THEN the objective producer and doctor shall both take the file at the rest of that path under the home folder as the objective file. | R-2285: on Windows, the producer and doctor both read a tilde-backslash objective.path from the home folder | Inferred from code, not run: on win32 both copies join the value under the agent dir. Marked `// req-candidate`; untested until the seat sees it pass on the Windows CI leg. Off win32 it prints SKIP and counts no PASS |

R-2280 to R-2284 run on every platform, so the file is never all-SKIP on win32 and needs no SKIPS entry.
Prototype at 72abe19a (resolver, one-line wiring, doctor row) gave these results:
- Doctor printed every row plus ✗ pi objective.path for 5, false and [].
- Install and the dry run exited 0, with step labels equal to a `{"objective":{}}` baseline, each in under 1 s.
- The producer named the default file for "".
- objective-golden 1280/0, objective-injection 69/0, fresh-machine 9/0.

## Known limits
- A pasted Windows path whose backslashes all form valid JSON escapes still parses into a wrong name (HANDOFF line stays).
- "~" alone, or `~\` alone on win32, resolves to the home folder. Doctor's objective file row uses existsSync, so a folder reads ✓ while the producer prints unreadable. This is unchanged.
- Doctor prints control characters in a string objective.path raw in its objective file row. This is unchanged.
- Only the `~\` rule is copied from pi's normalizePath; a file:// value or a /c/ shell path is not expanded for objective.path.
- While nana-pack.json does not parse, doctor's objective file row still judges the default file (existing residual).
- Install does not flag a value that is not a string. Doctor does.
- Under the NANA_SETUP_PLATFORM test seam, objectiveTarget uses the real platform. A wrong-code pair that switches to the seam survives on macOS.
- The macOS checklist's objective step still has no example (second half of the tilde HANDOFF line).