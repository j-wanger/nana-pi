# Review — gate-stop-names-config (in pi, a nana config file that does not parse gets a gate stop naming the file, the place and the repair), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-011 · Keep policy changes safe and recoverable

Review `git diff 9552afb1..HEAD` on `feat/gate-stop-names-config` (main was `9552afb1` when this brief was written; `git
merge-base HEAD main` is `9552afb1`). The plan of record is `docs/reviews/gate-stop-names-config-2026-10-20/must-meet.md`:
five must-meet checks, rows R-2360 to R-2364. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one
build (255846f0), with the seat's amendments at its end. The seat's record is `seat-verify-7b3a1202.md`. CI runs on draft
pull request #144 at 255846f0. CI run 39496247352 at 255846f0 reads 0 failing on all three legs: macOS 192 PASS, 0 FAIL, 2 SKIP of 194 files (8,005 checks pass, 35 skip); Ubuntu 191 PASS, 0 FAIL, 3 SKIP of 194 files (7,944 checks pass, 55 skip); Windows 176 PASS, 0 FAIL, 18 SKIP of 194 files (6,933 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-255846f0.log in this folder. The land runs the locked suite on the reviewed tip. The record also holds the
macOS wrong-code pairs (`seat-mutate.mjs`; 14 of 14 red, 0 survived; record `seat-mutate-output-255846f0.txt`) and the
independent check (`independent-check-7b3a1202.md`: HOLDS over ten probes on 255846f0, no MUST, two declared known
bugs, now HANDOFF residuals).

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
7b3a1202, before the seat's notes commit):

```
tree movement 9552afb..7b3a120: 5 rows in 1 features
FEAT-011 · Keep policy changes safe and recoverable
  R-2360 new (implemented)
  R-2361 new (implemented)
  R-2362 new (implemented)
  R-2363 new (implemented)
  R-2364 new (implemented)
```

CAP-03 moves from 166 to 171 rows and FEAT-011 from 36 to 41. No existing row changed.

The code under review: the new module-local `gateParseStopReason(file, failure, scope)` in
`packages/nana-pack/lib/config.ts`, which reuses `configFailureDetail(displayPath(file), failure)` from
`lib/json-text.mjs` minus `CONFIG_FAILURE_PREFIX` and its final period, and the two stop branches in `loadConfig` that
use it when the user or project file's `jsonFailure` is set and keep `gateStopReason` otherwise. Tests: four new checks
in `config-gate-fallback.test.mjs` section (f), one in `config-project-gate-fallback.test.mjs`, and seventeen existing
checks in those two files, `config-normalize.test.mjs` and `gate-survives-mutation.test.mjs` moved to a parse-form
regex. The pack README's Malformed config bullet names the parse form. The rest of the diff is the plan, the seat's
records, the generated code map and tree, HANDOFF and the session entry.

Judge whether a user or trusted-project nana-pack.json that does not parse, with no valid policy loaded in this process,
now stops every gated tool with a reason that says the file does not parse, names the file, gives the line and column
when the parser reports them and the config line's repair advice, and carries no text from the file; whether a
parseable file with a bad gate block, an unreadable or over-cap file and a non-object top level keep today's text;
whether the last valid policy still holds mid-session and the user stop still wins over the project stop; and whether
the tests write only inside the temp folders they own.

Threat model: honest variation in our tools' output and the OS is in scope (hand-edit mistakes such as a single
backslash in a pasted Windows path, a trailing comma, an empty file, an unquoted word or a file cut off mid-write; a
byte-order mark and UTF-16; home and agent-folder paths with odd characters; the macOS, Linux and Windows layouts);
deliberate forgery is out: whatever a forged config holds, the stop still blocks. The gate is advisory by load path.
Lane class: install, hook or gate — the pi gate's stop reason, built in `packages/nana-pack/lib/config.ts` and returned
by the nana-gate extension as its block reason.

Check: (1) the must-meet checks are not vacuous: each fails on main's `config.ts`, and each pair turns its named checks
red (14 of 14) — judge whether any must-meet check is still unproven; (2) no fail-open: every stop branch still sets a
non-empty reason and blocks every gated class; (3) nothing main does today stopped working: the valid-JSON leaf stop,
the unreadable and over-cap stops, the last valid policy mid-session, the user-wins order, the objective's config line
and doctor; (4) the stop shows no file text and no parser message, and a hostile path stays one escaped line; (5) every
README sentence the lane changed is true; (6) HANDOFF and the session entry are true, including the Landed line, the new
residual, the edited no-place line and the rewritten win-config-json-path line; (7) any MUST.
