# Review — objective-path-shapes (doctor and install read any objective path value without crashing, and the objective producer, doctor and install pick the objective file by one shared rule), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-001 · Keep goals and priorities in view (the doctor rows sit under FEAT-015 · Diagnose the active
environment, the install row under FEAT-013 · Install and connect harness runtimes)

Review `git diff 72abe19a..HEAD` on `feat/objective-path-shapes` (main was `72abe19a` when this brief was written; `git
merge-base HEAD main` is `72abe19a`). The plan of record is `docs/reviews/objective-path-shapes-2026-10-20/must-meet.md`:
six must-meet checks, rows R-2280 to R-2285. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build
1 (07dc79b3); build 2 (464b2d20) flips R-2285's marker and row only. The seat's record is `seat-verify-464b2d20.md`:
CI run 39440971339 at 07dc79b3, 0 failing files on macOS, Ubuntu and Windows (`ci-windows-07dc79b3.log` beside it;
R-2285 passes on Windows), the macOS wrong-code pairs (`seat-mutate.mjs`; 21 of 21 red, 0 survived, on 07dc79b3) and
the independent check (`independent-check-464b2d20.md`: HOLDS, no MUST and no known bug, ten probes, run on 07dc79b3).
The final reviewer's brief is `review-brief.md`. CI has not run on 464b2d20; the land runs the locked suite on the
reviewed tip, and the local macOS install check runs before the land.

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

The code under review: the new `packages/nana-pack/lib/objective-path.mjs`, one pure resolver for objective.path that
the objective producer (`lib/objective.ts`, which the Claude Code SessionStart objective hook and pi's nana-objective
extension both run), install's objective seed and doctor's objective file row (`packages/nana-setup/lib/steps.mjs`
`objectiveTarget`) now all call. A non-string or `""` value means the default file in pi's active agent dir; `~/`
expands under home everywhere and `~\` only on win32; an absolute value stays; anything else goes under the agent dir.
`packages/nana-setup/lib/doctor.mjs` adds a FAIL `pi objective.path` row only when the value is present and neither a
string nor null. `lib/config.ts` and the gate are unchanged.

Judge whether the lane fails open: the session-start objective lost or silently replaced for a value main read
correctly; a producer that throws past its catch, or loses R-2093's internal-error marker; install seeding or
overwriting a file the owner did not ask for; doctor reading ✓ for a file the producer does not read; or a check that
passes with the change removed (R-2285 runs only on the Windows leg; the seat ran no Windows-only pair). Judge whether
it leaves a harm the review standard lists, such as a broken install or hook on any platform, or a test writing outside
its temp homes. Judge whether anything main does today stopped working: every string objective.path except `""`
resolving as on main off Windows, install's seed decision and step labels, doctor's other rows and its last line, the
objective tests, and both CI install-check legs. The declared behaviour change: doctor now marks `false` and `0` ✗ and
exits 1, where main read them silently as the default; the producer still ignores them.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: `"~"` alone,
or `~\` alone on win32, names the home folder, which doctor's objective file row reads ✓ while the producer prints
unreadable; doctor prints control characters in a string objective.path raw in that row; only pi's `~\` rule is
copied, so a file:// value or a /c/ shell path is not expanded; install does not flag a non-string value; doctor shows
no objective.path row when the objective block itself is not an object; `objectiveTarget` reads the real platform, so a
pair switching to the `NANA_SETUP_PLATFORM` seam would survive on macOS; no check gives `"~"` alone or a value over 120
characters. The pairs and the independent check ran on macOS only, so CI is the only Linux and native Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (hand edits of the owner's own user-scope
nana-pack.json, any JSON value type for objective.path, POSIX and Windows path spellings, on macOS, Linux and
Windows); deliberate forgery is out.
Lane class: install, hook or gate — nana-setup install's objective seed and doctor's objective rows, and the Claude
Code SessionStart objective hook and the nana-objective pi extension through `lib/objective.ts`.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
