# Review — objective-path-shapes (doctor and install read any objective path value without crashing, and the objective producer, doctor and install pick the objective file by one shared rule), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-001 · Keep goals and priorities in view (the doctor rows sit under FEAT-015 · Diagnose the active
environment, the install row under FEAT-013 · Install and connect harness runtimes)

Review `git diff 72abe19a..HEAD` on `feat/objective-path-shapes` (main was `72abe19a` when this brief was written; `git
merge-base HEAD main` is `72abe19a`). The plan of record is `docs/reviews/objective-path-shapes-2026-10-20/must-meet.md`:
six must-meet checks, rows R-2280 to R-2285. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build
1 (07dc79b3). Build 2 (464b2d20) flips R-2285's marker to `req:` and its row to implemented after the Windows CI leg
passed it; it has no brief file. The seat's record is `seat-verify-464b2d20.md`: CI run 39440971339 on draft pull
request #134 at 07dc79b3, 0 failing files on macOS, Ubuntu and Windows (`ci-windows-07dc79b3.log` beside it; R-2285
passes on Windows), the macOS wrong-code pairs (`seat-mutate.mjs`; 21 of 21 red, 0 survived, on 07dc79b3, record
`seat-mutate-output-07dc79b3.txt`; R1 and S1 red through the CRASH line, declared) and the independent check
(`independent-check-464b2d20.md`: HOLDS, no MUST and no known bug, ten probes, run on 07dc79b3). No Windows-only pair
ran. CI has not run on 464b2d20; the land runs the locked suite on the reviewed tip, and the local macOS install check
runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
464b2d20, before the seat's notes commit):

```
tree movement 72abe19..464b2d2: 6 rows in 3 features
FEAT-001 · Keep goals and priorities in view
  R-2283 new (implemented)
  R-2284 new (implemented)
  R-2285 new (implemented)
FEAT-013 · Install and connect harness runtimes
  R-2282 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2280 new (implemented)
  R-2281 new (implemented)
```

CAP-01 moves from 193 to 196 rows and FEAT-001 from 39 to 42; CAP-04 from 497 to 500, FEAT-013 from 188 to 189
(SUB-012 from 41 to 42) and FEAT-015 from 136 to 138. No existing row changed.

The code under review: the new `packages/nana-pack/lib/objective-path.mjs` (`resolveObjectivePath(value, { home,
agentDir, platform })`: a non-string or `""` value gives `<agentDir>/nana-objective.md`; `"~"` gives home; a leading
`~/` goes under home, and a leading `~\` too where the platform is win32; an absolute value stays as given; anything
else goes under agentDir; the platform picks `path.win32` or `path.posix`; and `DEFAULT_OBJECTIVE_FILE`).
`packages/nana-pack/lib/objective.ts` `objectivePath` (behind the Claude Code objective hook and pi's nana-objective
extension) and `packages/nana-setup/lib/steps.mjs` `objectiveTarget` (install's objective seed and doctor's objective
file row) each become one call to it; `objectiveTarget` passes `layout.base`, `layout.piHome` and the real
`process.platform`. `packages/nana-setup/lib/paths.mjs` reads the shared file name. `packages/nana-setup/lib/doctor.mjs`
adds a FAIL `pi objective.path` row, with no install label, only when the value is present and neither a string nor
null. `lib/config.ts` and the gate are unchanged. Tests: the new
`packages/nana-setup/tests/objective-path-shapes.test.mjs` (R-2280 to R-2285; R-2285 runs only on Windows). The pack
README's objective paragraph and the setup README's `nana-objective.md` row change with it. The rest of the diff is the
plan, the seat's records, the generated code map and tree, HANDOFF and the session entry.

Judge whether, for any objective.path value in the user-scope nana-pack.json (a number, a boolean, an object, an
array, null, `""`, `"~"`, a `~/` or `~\` prefix, a relative or an absolute path), install and doctor finish without
throwing and name the same objective file the objective producer reads, on macOS and on Windows; whether doctor's new
row appears exactly when the value is present and neither a string nor null, names the value and the default file, and
fails; whether every string value except `""` resolves as on main off Windows; and whether the tests' child processes
stay inside the temp homes they own. The declared behaviour change: doctor now marks `false` and `0` ✗ and exits 1,
where main read them silently as the default; the producer still ignores them.

Threat model: honest variation in our tools' output and the OS is in scope (hand edits of the owner's own user-scope
nana-pack.json, any JSON value type for objective.path, POSIX and Windows path spellings, on macOS, Linux and
Windows); deliberate forgery is out.
Lane class: install, hook or gate — nana-setup install's objective seed and doctor's objective rows, and
`lib/objective.ts` behind the Claude Code SessionStart objective hook and the nana-objective pi extension, through the
new shared resolver.

Check: (1) the must-meet checks are not vacuous: each pair named in the seat's record turns its check red, R1 and S1
through the test file's CRASH line, and off Windows R-2285 is a skip, not a pass; (2) no throw remains on any
objective.path shape in install, its dry run, doctor or the producer, and R-2093's internal-error marker still holds
(`o.path`, not `o?.path`); (3) the producer, doctor and install name one file for every value, on macOS and Windows,
and the `~\` rule matches pi's own on win32 only; (4) nothing main does today stopped working, on any of the three CI
legs: every string objective.path except `""` resolves as before, install's seed decision, doctor's other rows and its
last line; (5) the tests write only inside the temp homes and folders they own; (6) HANDOFF and the session entry are
true, including the removed doctor-crash line, the shortened tilde line, the six new objective residuals and the
mutation runner tally line; (7) any MUST.
